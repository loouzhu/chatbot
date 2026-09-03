import { useEffect, useRef, useState } from "react";
import type { TextAreaRef } from "antd/es/input/TextArea";
import type { ChangeEvent, FormEvent } from "react";
import type { ChatMessage } from "../types";
import { sendChatMessage } from "../api/chatApi";
import { clearChatLog, loadChatLog, saveChatLog } from "../utils/chatStorage";

export function useChat() {
  const [userInput, setUserInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<TextAreaRef>(null);

  useEffect(() => {
    setChatLog(loadChatLog());
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) {
      const { scrollHeight, clientHeight } = chatWindowRef.current;
      chatWindowRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: "smooth" });
    }

    if (chatLog.length > 0) saveChatLog(chatLog);
  }, [chatLog]);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };

  const handlePromptSelect = (prompt: string) => {
    setUserInput(prompt);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const clearChat = () => {
    setChatLog([]);
    setUserInput("");
    clearChatLog();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || loading) return;

    setChatLog((previous) => [...previous, { type: "user", text: trimmedInput }]);
    setUserInput("");
    setLoading(true);

    try {
      const botResponseText = await sendChatMessage(trimmedInput);
      setChatLog((previous) => [...previous, { type: "bot", text: botResponseText }]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
      const errorMessage = error instanceof Error ? error.message : "暂时无法连接到 AI 助手，请稍后重试。";
      setChatLog((previous) => [...previous, { type: "error", text: errorMessage }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return {
    userInput,
    chatLog,
    loading,
    chatWindowRef,
    inputRef,
    handleInputChange,
    handleSubmit,
    handlePromptSelect,
    clearChat,
  };
}
