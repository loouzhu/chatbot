import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import styles from "./App.module.less";

type MessageType = "user" | "bot" | "error";

interface ChatMessage {
  type: MessageType;
  text: string;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;

  const message = value as Record<string, unknown>;
  return (
    (message.type === "user" ||
      message.type === "bot" ||
      message.type === "error") &&
    typeof message.text === "string"
  );
}

function App() {
  const [userInput, setUserInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load chat history from localStorage
    try {
      const storedChatLog = localStorage.getItem("chatLog");
      if (storedChatLog) {
        const parsedChatLog: unknown = JSON.parse(storedChatLog);
        if (Array.isArray(parsedChatLog) && parsedChatLog.every(isChatMessage)) {
          setChatLog(parsedChatLog);
        }
      }
    } catch (error) {
      console.error("Failed to load chat log from localStorage:", error);
    }

    // Focus input on initial load
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Scroll to bottom when chat updates
    if (chatWindowRef.current) {
      const { scrollHeight, clientHeight } = chatWindowRef.current;
      chatWindowRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }

    // Save to localStorage when chat updates (if not empty)
    if (chatLog.length > 0) {
      try {
        localStorage.setItem("chatLog", JSON.stringify(chatLog));
      } catch (error) {
        console.error("Failed to save chat log to localStorage:", error);
      }
    }
  }, [chatLog]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput || loading) return;

    // Add user message to chat
    const userMessage: ChatMessage = { type: "user", text: trimmedInput };
    setChatLog((prevChatLog) => [...prevChatLog, userMessage]);

    setUserInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: trimmedInput }),
      });

      if (!response.ok) {
        let errorDetail = `HTTP error! Status: ${response.status}`;
        try {
          const errorData: unknown = await response.json();
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "detail" in errorData &&
            typeof errorData.detail === "string"
          ) {
            errorDetail = errorData.detail;
          }
        } catch {
          errorDetail = `${errorDetail} ${response.statusText || ""}`.trim();
        }
        throw new Error(errorDetail);
      }

      const data: unknown = await response.json();
      const botResponseText =
        typeof data === "object" && data !== null && "response" in data
          ? data.response
          : undefined;

      if (typeof botResponseText !== "string" || !botResponseText) {
        throw new Error("Received invalid or empty response from bot.");
      }

      // Add bot message to chat
      setChatLog((prevChatLog) => [
        ...prevChatLog,
        { type: "bot", text: botResponseText },
      ]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not connect to the bot. Please try again.";

      // Add error message to chat
      setChatLog((prevChatLog) => [
        ...prevChatLog,
        {
          type: "error",
          text: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={styles.app}>
      <h1 className={styles.chatTitle}>~AI Chat Assistant</h1>

      <div className={styles.chatWindow} ref={chatWindowRef} aria-live="polite">
        {chatLog.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${styles[message.type]}`}
          >
            {message.text}
          </div>
        ))}
        {loading && (
          <div className={styles.loadingIndicator}>Bot is thinking...</div>
        )}
      </div>

      <form className={styles.chatForm} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={loading}
          aria-label="Chat message input"
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
