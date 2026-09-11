import { useMutation } from "@tanstack/react-query";
import {
  ChatMessage,
  SendMessageRequest,
  StartNewChatResponse,
} from "../types";
import { chatApi } from "../api/chatApi";
import { useNavigate } from "react-router-dom";
import { useMessageApi } from "@/app/context";
import { getErrorMessage } from "@/features/shared/utils/request";

// 发送信息
export const useSendChatMessage = () => {
  const messageApi = useMessageApi();
  return useMutation({
    mutationFn: ({ content, conversation_id }: SendMessageRequest) =>
      chatApi.sendChatMessage({ content, conversation_id }),
    onSuccess: (data: ChatMessage) => {
      return data;
    },
    onError: (error: Error) => {
      messageApi.error(getErrorMessage(error));
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
      return data.messages;
    },
    onError: (error: Error) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};
