const CHAT_API_URL =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined) ??
  "http://localhost:8000/chat";

interface ChatApiResponse {
  response: string;
}

export async function sendChatMessage(userMessage: string): Promise<string> {
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_message: userMessage }),
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
      ? (data as Partial<ChatApiResponse>).response
      : undefined;

  if (typeof botResponseText !== "string" || !botResponseText) {
    throw new Error("Received invalid or empty response from bot.");
  }

  return botResponseText;
}
