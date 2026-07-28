interface ChatContent {
  type: string;
  data: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string | ChatContent[];
  status: "success" | "failed" | "pending" | "refuse";
  createdAt: Date;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
}
