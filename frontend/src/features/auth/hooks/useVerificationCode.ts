import { useEffect, useState } from "react";
import type { SendVerifyCodeResponse } from "../types";

const DEFAULT_COUNTDOWN = 60;

export function useVerificationCode() {
  const [hasSent, setHasSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function send(
    sender: () => Promise<SendVerifyCodeResponse>,
  ): Promise<SendVerifyCodeResponse> {
    setSending(true);
    try {
      const response = await sender();
      setHasSent(true);
      setCountdown(DEFAULT_COUNTDOWN);
      return response;
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setHasSent(false);
    setCountdown(0);
  }

  return {
    hasSent,
    countdown,
    sending,
    canSend: countdown === 0 && !sending,
    send,
    reset,
  };
}
