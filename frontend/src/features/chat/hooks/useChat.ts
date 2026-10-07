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
import { useState } from "react";
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

// 发送流式消息
export const useStreamMessage = () => {
  const messageApi = useMessageApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SendMessageRequest) => {
      const queryKey = ["chatHistory", request.conversation_id];
      let assistantMessageId: string | null = null;

      await chatApi.sendStreamMessage(request, (event) => {
        if (event.type === "created") {
          assistantMessageId = event.data.id;
          queryClient.setQueryData<Conversation>(queryKey, (conversation) => {
            const messages = conversation?.messages ?? [];
            if (messages.some((message) => message.id === event.data.id)) {
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
          });
          return;
        }

        if (event.type === "generating") {
          if (!assistantMessageId) return;
          queryClient.setQueryData<Conversation>(queryKey, (conversation) => {
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
          });
          return;
        }

        const completedMessage = event.data.message;
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
      });
    },
    onMutate: async (request: SendMessageRequest) => {
      const queryKey = ["chatHistory", request.conversation_id];
      await queryClient.cancelQueries({ queryKey });
      const previousConversation =
        queryClient.getQueryData<Conversation>(queryKey);
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
      await queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
    },
  });
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
export const useGetOneChatHistory = (conversation_id: string) => {
  return useQuery({
    queryKey: ["chatHistory", conversation_id],
    queryFn: () => chatApi.getOneChatHistory(conversation_id),
  });
};
