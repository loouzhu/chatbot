import { useMutation } from "@tanstack/react-query";
import {
  ChatMessage,
  SendMessageRequest,
  StartNewChatResponse,
} from "../types";
import { chatApi } from "../api/chatApi";
import { useNavigate } from "react-router-dom";

// 发送信息
export const useSendChatMessage = () => {
  return useMutation({
    mutationFn: ({ content, conversation_id }: SendMessageRequest) =>
      chatApi.sendChatMessage({ content, conversation_id }),
    onSuccess: (data: ChatMessage) => {
      return data;
    },
    onError: (error: Error) => {
      console.log(error);
    },
  });
};

// 开始新对话
export const useStartNewChat = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => chatApi.startNewChat(),
    onSuccess: (data: StartNewChatResponse) => {
      navigate(`/chat/${data.id}`);
      return data.messages;
    },
  });
};
