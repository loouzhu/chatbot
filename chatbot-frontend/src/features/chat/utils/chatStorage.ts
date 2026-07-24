import type { ChatMessage } from "../types";

const CHAT_STORAGE_KEY = "chatLog";

export function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;

  const message = value as Record<string, unknown>;
  return (
    (message.type === "user" ||
      message.type === "bot" ||
      message.type === "error") &&
    typeof message.text === "string"
  );
}

export function loadChatLog(): ChatMessage[] {
  try {
    const storedChatLog = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!storedChatLog) {
      return [];
    }

    const parsedChatLog: unknown = JSON.parse(storedChatLog);
    if (Array.isArray(parsedChatLog) && parsedChatLog.every(isChatMessage)) {
      return parsedChatLog;
    }
  } catch (error) {
    console.error("Failed to load chat log from localStorage:", error);
  }

  return [];
}

export function saveChatLog(chatLog: ChatMessage[]): void {
  if (chatLog.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatLog));
  } catch (error) {
    console.error("Failed to save chat log to localStorage:", error);
  }
}
