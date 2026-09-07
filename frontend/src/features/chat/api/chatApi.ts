const CHAT_API_URL =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined) ??
  "http://101.37.70.188:8000/chat/send_message";

// 发送信息
export async function sendChatMessage(content: string): Promise<string> {
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ content }),
  });

  const data = await response.json();

  return data;
}

// 开始新对话
export async function startNewChat(user_id: string): Promise<void> {
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ user_id }),
  });

  const data = await response.json();

  return data;
}
