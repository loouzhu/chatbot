export type MessageType = "user" | "bot" | "error";

export interface ChatMessage {
  type: MessageType;
  text: string;
}
