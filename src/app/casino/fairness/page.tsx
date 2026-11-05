"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import type { FairnessState, GameRound, RotateSeedResult } from "@/lib/types";
import { Container } from "@/components/container";
import { useToast } from "@/components/toast";
import { ErrorBox, PageHeader, Spinner, StatusBadge } from "@/components/ui";

function Mono({ children }: { children: React.ReactNode }) {
  return <code className="block break-all rounded-lg bg-bg px-3 py-2 font-mono text-xs text-muted">{children}</code>;
}

function Seeds() {
  const qc = useQueryClient();
  const toast = useToast();
  const [clientSeed, setClientSeed] = useState("");
  const [revealed, setRevealed] = useState<RotateSeedResult["previous"]>(null);
  const state = useQuery({ queryKey: ["fairness"], queryFn: () => api<FairnessState>("/casino/fairness") });
  const history = useQuery({ queryKey: ["casino-history"], queryFn: () => api<GameRound[]>("/casino/history", { query: { limit: 25 } }) });

  const rotate = useMutation({
    mutationFn: () => api<RotateSeedResult>("/casino/fairness/rotate", { method: "POST", body: clientSeed.trim() ? { clientSeed: clientSeed.trim() } : {} }),
    onSuccess: (r) => {
      setRevealed(r.previous);
      setClientSeed("");
      qc.invalidateQueries({ queryKey: ["fairness"] });
      qc.invalidateQueries({ queryKey: ["casino-history"] });
      toast("New seed pair started. Your previous server seed is revealed below.", "success");
    },
    onError: (err) => toast(errorMessage(err), "error"),
  });

  return (
    <div className="space-y-6">
      <section className="card card-pad space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound className="size-5 text-brand" /> Your current seeds</h2>
        {state.isLoading && <Spinner />}
        {state.error && <ErrorBox message={errorMessage(state.error)} />}
        {state.data && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><p className="label">Server seed hash (committed)</p><Mono>{state.data.serverSeedHash}</Mono></div>
            <div><p className="label">Client seed</p><Mono>{state.data.clientSeed}</Mono></div>
            <div><p className="label">Next nonce</p><Mono>{state.data.nonce}</Mono></div>
          </div>
        )}
        <form
          className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            rotate.mutate();
          }}
        >
          <input className="input" maxLength={64} placeholder="New client seed (optional)" value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={rotate.isPending}>
            {rotate.isPending ? <Spinner className="size-4 text-brand-ink" /> : <><RefreshCw className="size-4" /> Reveal &amp; rotate</>}
          </button>
        </form>
        {revealed && (
          <div className="space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
            <p className="text-sm font-semibold text-brand">Revealed seed pair</p>
            <div><p className="label">Server seed</p><Mono>{revealed.serverSeed}</Mono></div>
            <div><p className="label">Hash</p><Mono>{revealed.serverSeedHash}</Mono></div>
            <p className="text-xs text-muted">Client seed {revealed.clientSeed} · used for {revealed.finalNonce} rounds. SHA-256 of the server seed must equal the hash you were shown before playing.</p>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-line px-4 py-3 font-semibold">Your recent rounds</h2>
        {history.isLoading && <div className="p-4"><Spinner /></div>}
        {history.data?.length === 0 && <p className="p-4 text-sm text-muted">No rounds played yet.</p>}
        {!!history.data?.length && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Game</th><th>Stake</th><th>Result</th><th>Nonce</th><th>Server seed</th><th>Time</th></tr></thead>
              <tbody>
                {history.data.map((r) => (
                  <tr key={r.id}>
                    <td className="capitalize">{r.game.replace("-classic", "")}</td>
                    <td className="tabular-nums">{money(r.stake)}</td>
                    <td><StatusBadge status={r.outcome} label={r.outcome === "win" ? `+${money(r.payout)}` : "Loss"} /></td>
                    <td className="tabular-nums">{r.nonce}</td>
                    <td className="max-w-48 truncate font-mono text-xs text-faint" title={r.revealed_server_seed ?? r.server_seed_hash}>
                      {r.revealed_server_seed ?? `hash ${r.server_seed_hash.slice(0, 16)}…`}
                    </td>
                    <td className="whitespace-nowrap text-xs text-faint">{dateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function FairnessPage() {
  const { user, loading } = useAuth();
  return (
    <Container>
      <PageHeader title="Provably fair" subtitle="Every casino result can be checked — no trust required." />
      <section className="card card-pad mb-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-brand" /> How it works</h2>
        <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-muted">
          <li>Before you play, we commit to a secret <strong className="text-ink">server seed</strong> by showing you its SHA-256 hash.</li>
          <li>You can set your own <strong className="text-ink">client seed</strong>. Each round also uses an increasing <strong className="text-ink">nonce</strong>.</li>
          <li>Results come from an HMAC-SHA256 of the server seed, client seed and nonce — so neither side can change them after the fact.</li>
          <li>Rotate your seeds any time to reveal the old server seed, then check its hash and recompute every past round.</li>
        </ol>
      </section>
      {loading ? null : user ? <Seeds /> : <p className="text-sm text-muted">Log in to see your seeds and round history.</p>}
    </Container>
  );
}
