export type ChatMessageType = "user" | "bot" | "error";

export interface ChatMessage {
  type: ChatMessageType;
  text: string;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
}
