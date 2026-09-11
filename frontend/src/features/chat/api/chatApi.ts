import { request } from "@shared/utils/request";
import type {
  ChatMessage,
  SendMessageRequest,
  StartNewChatResponse,
} from "../types";

export const chatApi = {
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
};
