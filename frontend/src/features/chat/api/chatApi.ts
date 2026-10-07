import { ApiError, request } from "@shared/utils/request";
import type {
  SendMessageRequest,
  StartNewChatResponse,
  ChatHistoryItem,
  Conversation,
  StreamResponse,
} from "../types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://101.37.70.188:8000";

export const chatApi = {
  // 发送流式消息
  async sendStreamMessage(
    request: SendMessageRequest,
    onEvent: (event: StreamResponse) => void,
  ): Promise<void> {
    const token = window.localStorage.getItem("token");
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${API_BASE_URL}/chat/request_message`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(request),
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
    return request<StartNewChatResponse>("/chat/start_new_chat", {
      auth: true,
    });
  },

  // 显示对话历史记录
  async getAllChatHistory(): Promise<ChatHistoryItem[]> {
    return request("/chat/history/all", {
      method: "GET",
      auth: true,
    });
  },

  // 获取单条对话历史记录消息
  async getOneChatHistory(conversationId: string): Promise<Conversation> {
    return request(`/chat/history/${conversationId}`, {
      method: "GET",
      auth: true,
    });
  },
};
