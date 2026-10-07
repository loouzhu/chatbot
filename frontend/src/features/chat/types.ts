export type MessageRole = "user" | "assistant" | "error" | "system";
export type MessageStatus =
  | "created"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export interface MessageError {
  error_code: string;
  error_message: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  created_at: string;
  error_code?: string;
  error_message?: string;
}

export type StreamResponse =
  | {
      type: "created";
      data: StreamCreatedData;
    }
  | {
      type: "generating";
      data: StreamGeneratingData;
    }
  | {
      type: "completed";
      data: StreamDoneData;
    }
  | {
      type: "failed";
      data: StreamFailedData;
    };

export interface StreamCreatedData {
  id: string;
  role: MessageRole;
}

export interface StreamGeneratingData {
  content: string;
}

export interface StreamDoneData {
  message: ChatMessage;
}

export interface StreamFailedData {
  message: ChatMessage;
  error: MessageError;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
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
