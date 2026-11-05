"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "./api";
import { useAuth } from "./auth";
import type { RoundResultBase } from "./types";
import { useToast } from "@/components/toast";

/** Shared logic for casino rounds: auth gate, balance update, session history. */
export function usePlay<TBody, TResult extends RoundResultBase>(path: string, redirectTo: string) {
  const { user, setBalance } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [rounds, setRounds] = useState<TResult[]>([]);
  const [last, setLast] = useState<TResult | null>(null);

  const m = useMutation({
    mutationFn: (body: TBody) => api<TResult>(path, { method: "POST", body }),
    onSuccess: (r) => {
      setLast(r);
      setRounds((prev) => [r, ...prev].slice(0, 50));
      setBalance(r.balance);
    },
    onError: (err) => toast(errorMessage(err), "error"),
  });

  const play = (body: TBody) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(redirectTo)}`);
      return;
    }
    m.mutate(body);
  };

  return { play, pending: m.isPending, last, rounds };
}
