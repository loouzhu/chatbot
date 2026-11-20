import { API_BASE_URL, ApiError, request } from "@shared/utils/request";
import type {
  SendMessageRequest,
  StartNewChatResponse,
  ChatHistoryItem,
  Conversation,
  StreamResponse,
} from "../types";

export const chatApi = {
  // 发送流式消息
  async sendStreamMessage(
    request: SendMessageRequest,
    onEvent: (event: StreamResponse) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const token = window.localStorage.getItem("token");
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API_BASE_URL}/conversation/${encodeURIComponent(request.conversation_id)}/message`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ content: request.content }),
      signal,
    });

    if (!response.ok) {
      throw new ApiError("请求失败", response.status);
    }

    if (!response.body) {
      throw new Error("浏览器不支持流式响应");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, {
        stream: !done,
      });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const rawEvent of events) {
        const dataLine = rawEvent
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (!dataLine) continue;
        const json = dataLine.slice(5).trim();
        const event = JSON.parse(json) as StreamResponse;
        onEvent(event);
      }

      if (done) break;
    }
  },

  // 开始新对话
  async startNewChat(): Promise<StartNewChatResponse> {
    return request<StartNewChatResponse>("/conversation", {
      method: "POST",
      auth: true,
    });
  },

  // 显示对话历史记录
  async getAllChatHistory(): Promise<ChatHistoryItem[]> {
    return request("/conversation", {
      method: "GET",
      auth: true,
    });
  },

  // 获取单条对话历史记录消息
  async getOneChatHistory(conversationId: string): Promise<Conversation> {
    return request(`/conversation/${encodeURIComponent(conversationId)}`, {
      method: "GET",
      auth: true,
    });
  },

  // 停止生成本次消息
  async stopGenerateMessage(conversationId: string, messageId: string) {
    return request<void>(`/conversation/${encodeURIComponent(conversationId)}/message/${encodeURIComponent(messageId)}/cancellation`, {
      method: "POST",
      auth: true,
    });
  },
};
