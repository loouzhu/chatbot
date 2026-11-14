import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChatMessage,
  Conversation,
  SendMessageRequest,
  StartNewChatResponse,
} from "../types";
import { chatApi } from "../api/chatApi";
import { useMessageApi } from "@/app/context";
import { getErrorMessage } from "@/features/shared/utils/request";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// 管理侧边栏开关state
export const useSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return { sidebarOpen, setSidebarOpen };
};

// 管理输入框state
export const useInput = () => {
  const [input, setInput] = useState<string>("");
  return { input, setInput };
};

interface ActiveChatStream {
  controller: AbortController;
  conversationId: string;
  messageId: string | null;
  stopPromise?: Promise<void>;
}

// 统一管理流式消息的发送和中断
export const useChatStream = () => {
  const activeStream = useRef<ActiveChatStream | null>(null);
  const messageApi = useMessageApi();
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      activeStream.current?.controller.abort();
    };
  }, []);

  const sendMutation = useMutation({
    mutationFn: async (request: SendMessageRequest) => {
      const stream = activeStream.current;
      if (!stream || stream.controller.signal.aborted) return;
      const queryKey = ["chatHistory", request.conversation_id];
      let assistantMessageId: string | null = null;
      try {
        await chatApi.sendStreamMessage(
          request,
          (event) => {
            if (stream.controller.signal.aborted) return;
            if (event.type === "created") {
              assistantMessageId = event.data.id;
              stream.messageId = assistantMessageId;
              queryClient.setQueryData<Conversation>(
                queryKey,
                (conversation) => {
                  const messages = conversation?.messages ?? [];
                  if (
                    messages.some((message) => message.id === event.data.id)
                  ) {
                    return conversation;
                  }

                  const assistantMessage: ChatMessage = {
                    id: event.data.id,
                    role: event.data.role,
                    content: "",
                    status: "created",
                    created_at: new Date().toISOString(),
                  };
                  return {
                    id: request.conversation_id,
                    messages: [...messages, assistantMessage],
                  };
                },
              );
              return;
            }

            if (event.type === "generating") {
              if (!assistantMessageId) return;
              queryClient.setQueryData<Conversation>(
                queryKey,
                (conversation) => {
                  if (!conversation) return conversation;
                  return {
                    ...conversation,
                    messages: conversation.messages.map((message) =>
                      message.id === assistantMessageId
                        ? {
                            ...message,
                            content: message.content + event.data.content,
                            status: "generating",
                          }
                        : message,
                    ),
                  };
                },
              );
              return;
            }
            const completedMessage: ChatMessage =
              event.type === "failed"
                ? {
                    ...event.data.message,
                    status: "failed",
                    error_code: event.data.error.error_code,
                    error_message: event.data.error.error_message,
                  }
                : { ...event.data.message, status: event.type };
            assistantMessageId = completedMessage.id;
            queryClient.setQueryData<Conversation>(queryKey, (conversation) => {
              const messages = conversation?.messages ?? [];
              const exists = messages.some(
                (message) => message.id === completedMessage.id,
              );
              return {
                id: request.conversation_id,
                messages: exists
                  ? messages.map((message) =>
                      message.id === completedMessage.id
                        ? completedMessage
                        : message,
                    )
                  : [...messages, completedMessage],
              };
            });
          },
          stream.controller.signal,
        );
      } catch (error) {
        // 主动中断保留已生成的内容，不触发发送失败回滚。
        if (!stream.controller.signal.aborted) throw error;
      }
    },
    onMutate: async (request: SendMessageRequest) => {
      const queryKey = ["chatHistory", request.conversation_id];
      await queryClient.cancelQueries({ queryKey });
      const previousConversation =
        queryClient.getQueryData<Conversation>(queryKey);
      if (activeStream.current?.controller.signal.aborted) {
        return { queryKey, previousConversation };
      }
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: request.content,
        status: "completed",
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Conversation>(queryKey, (oldData) => ({
        id: request.conversation_id,
        messages: [...(oldData?.messages || []), optimisticMessage],
      }));
      return { queryKey, previousConversation };
    },
    onError: (error: Error, _variables, onMutateResult) => {
      messageApi.error(getErrorMessage(error));
      if (onMutateResult) {
        queryClient.setQueryData(
          onMutateResult.queryKey,
          onMutateResult.previousConversation,
        );
      }
    },
    onSettled: async () => {
      // 等停止请求结束后再同步历史，避免提前读取服务端状态。
      await activeStream.current?.stopPromise;
      await queryClient.invalidateQueries({
        queryKey: ["chatHistory", activeStream.current?.conversationId],
      });
    },
  });

  const sendStreamMessage = async (request: SendMessageRequest) => {
    if (activeStream.current) return;
    const stream: ActiveChatStream = {
      controller: new AbortController(),
      conversationId: request.conversation_id,
      messageId: null,
    };
    activeStream.current = stream;
    try {
      await sendMutation.mutateAsync(request);
    } finally {
      if (activeStream.current === stream) activeStream.current = null;
    }
  };

  const stopGenerateMessage = async () => {
    const stream = activeStream.current;
    if (!stream || stream.controller.signal.aborted) return;

    stream.stopPromise = (
      stream.messageId
        ? chatApi.stopGenerateMessage(stream.conversationId, stream.messageId)
        : Promise.resolve()
    ).catch((error: unknown) => {
      messageApi.error(getErrorMessage(error));
    });
    stream.controller.abort();

    queryClient.setQueryData<Conversation>(
      ["chatHistory", stream.conversationId],
      (conversation) => {
        if (!conversation) return conversation;
        return {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === stream.messageId &&
            (message.status === "created" || message.status === "generating")
              ? { ...message, status: "cancelled" }
              : message,
          ),
        };
      },
    );
    await stream.stopPromise;
  };

  return {
    sendStreamMessage,
    stopGenerateMessage,
    isPending: sendMutation.isPending,
  };
};

// 开始新对话
export const useStartNewChat = () => {
  const messageApi = useMessageApi();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => chatApi.startNewChat(),
    onSuccess: (data: StartNewChatResponse) => {
      navigate(`/chat/${data.id}`);
    },
    onError: (error: Error) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};
// 获取所有对话历史记录
export const useGetAllChatHistory = () => {
  return useQuery({
    queryKey: ["chatHistory"],
    queryFn: () => chatApi.getAllChatHistory(),
  });
};

// 获取单条对话历史记录消息
export const useGetOneChatHistory = (conversationId: string) => {
  return useQuery({
    queryKey: ["chatHistory", conversationId],
    queryFn: () => chatApi.getOneChatHistory(conversationId),
  });
};
