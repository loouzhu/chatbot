export type ChatMessageType = "user" | "assistant" | "error" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageType;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
}

export interface StartNewChatResponse {
  id: string;
  messages: ChatMessage[];
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  created_at: string;
}
