import { request } from "@shared/utils/request";
import type {
  ChatMessage,
  SendMessageRequest,
  StartNewChatResponse,
  ChatHistoryItem,
} from "../types";

export const chatApi = {
  // 发送信息
  async sendChatMessage({
    content,
    conversation_id,
  }: SendMessageRequest): Promise<ChatMessage> {
    return request<ChatMessage>("/chat/send_message", {
      auth: true,
      body: { content, conversation_id },
    });
  },

  // 开始新对话
  async startNewChat(): Promise<StartNewChatResponse> {
    return request<StartNewChatResponse>("/chat/start_new_chat", {
      auth: true,
    });
  },

  // 显示对话历史记录
  async getChatHistory(): Promise<ChatHistoryItem[]> {
    return request("chat/history", {
      auth: true,
    });
  },
};
