import { useMutation } from "@tanstack/react-query";
import {
  ChatMessage,
  SendMessageRequest,
  StartNewChatResponse,
} from "../types";
import { chatApi } from "../api/chatApi";
import { useMessageApi } from "@/app/context";
import { getErrorMessage } from "@/features/shared/utils/request";
import { useState } from "react";

// 管理信息state
export const useMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  return { messages, setMessages };
};

// 管理侧边栏state
export const useSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return { sidebarOpen, setSidebarOpen };
};

// 管理输入框state
export const useInput = () => {
  const [input, setInput] = useState<string>("");
  return { input, setInput };
};

// 发送信息
export const useSendChatMessage = () => {
  const messageApi = useMessageApi();
  return useMutation({
    mutationFn: ({ content, conversation_id }: SendMessageRequest) =>
      chatApi.sendChatMessage({ content, conversation_id }),
    onError: (error: Error) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

// 开始新对话
export const useStartNewChat = () => {
  const messageApi = useMessageApi();
  return useMutation({
    mutationFn: () => chatApi.startNewChat(),
    onSuccess: (data: StartNewChatResponse) => {
      return data;
    },
    onError: (error: Error) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};
