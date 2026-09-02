import { useEffect, useState } from "react";
import type { VerificationChallenge } from "../types";

const DEFAULT_COUNTDOWN = 60;

export function useVerificationCode() {
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function send(
    sender: () => Promise<VerificationChallenge>,
  ): Promise<VerificationChallenge> {
    setSending(true);
    try {
      const nextChallenge = await sender();
      setChallenge(nextChallenge);
      setCountdown(DEFAULT_COUNTDOWN);
      return nextChallenge;
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setChallenge(null);
    setCountdown(0);
  }

  return {
    challenge,
    countdown,
    sending,
    canSend: countdown === 0 && !sending,
    send,
    reset,
  };
}
