import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { ChatMessage } from "../types";
import { sendChatMessage } from "../utils/chatApi";
import { loadChatLog, saveChatLog } from "../utils/chatStorage";

export function useChat() {
  const [userInput, setUserInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setChatLog(loadChatLog());
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) {
      const { scrollHeight, clientHeight } = chatWindowRef.current;
      chatWindowRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }

    if (chatLog.length > 0) {
      saveChatLog(chatLog);
    }
  }, [chatLog]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || loading) {
      return;
    }

    const userMessage: ChatMessage = { type: "user", text: trimmedInput };
    setChatLog((prevChatLog) => [...prevChatLog, userMessage]);
    setUserInput("");
    setLoading(true);

    try {
      const botResponseText = await sendChatMessage(trimmedInput);
      setChatLog((prevChatLog) => [
        ...prevChatLog,
        { type: "bot", text: botResponseText },
      ]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "暂时无法连接到 AI 助手，请稍后重试。";

      setChatLog((prevChatLog) => [
        ...prevChatLog,
        {
          type: "error",
          text: errorMessage,
        },
      ]);
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
  };
}
