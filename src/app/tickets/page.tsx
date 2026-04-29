"use client";

import { useEffect, useState } from "react";
import { getOrCreateChildProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const PARENT_PASSWORD = "1115";

interface Ticket {
  id: string;
  ticket_name: string;
  gold_cost: number;
  status: "unused" | "used";
  created_at: string;
  used_at: string | null;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [using, setUsing] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [showUsed, setShowUsed] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const profileId = await getOrCreateChildProfile();
    if (!profileId) { setLoading(false); return; }
    const { data } = await supabase
      .from("tickets").select("*").eq("user_id", profileId)
      .order("created_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  }

  function startUse(ticketId: string) {
    setUsing(ticketId);
    setPassword("");
    setPwError(false);
    setDoneMsg(null);
  }

  async function confirmUse() {
    if (password !== PARENT_PASSWORD) { setPwError(true); return; }
    if (!using) return;
    await supabase.from("tickets")
      .update({ status: "used", used_at: new Date().toISOString() })
      .eq("id", using);
    const ticket = tickets.find((t) => t.id === using);
    setDoneMsg(`「${ticket?.ticket_name}」を使いました！`);
    setUsing(null);
    setPassword("");
    load();
  }

  const unused = tickets.filter((t) => t.status === "unused");
  const used   = tickets.filter((t) => t.status === "used");

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">

      <div className="flex items-center gap-3 mb-1">
        <a href="/" className="ghost-btn" style={{ width: "auto", padding: "8px 14px" }}>← もどる</a>
        <h1 className="font-dot text-lg text-gold">🎫 もっているチケット</h1>
      </div>

      {doneMsg && (
        <div className="card card-gold">
          <p className="text-sm font-bold text-gold">✅ {doneMsg}</p>
        </div>
      )}

      {loading && (
        <div className="card text-center py-10">
          <p className="text-muted">よみこみ中…</p>
        </div>
      )}

      {!loading && unused.length === 0 && !doneMsg && (
        <div className="card text-center py-10">
          <div className="text-5xl mb-4">🎫</div>
          <p className="font-bold mb-2">チケットがありません</p>
          <p className="text-sm text-muted mb-6">ゴールドをためてショップで交換しよう！</p>
          <a href="/shop" className="action-btn" style={{ maxWidth: 220, margin: "0 auto" }}>
            🏪 ショップへ
          </a>
        </div>
      )}

      {!loading && unused.length > 0 && (
        <div className="card flex flex-col gap-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-muted">使えるチケット</p>
            <span className="badge badge-a">{unused.length}枚</span>
          </div>

          {unused.map((t) => (
            <div key={t.id}>
              {using === t.id ? (
                <div className="card" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <p className="font-bold text-sm mb-1">「{t.ticket_name}」を使う</p>
                  <p className="text-xs text-muted mb-3">パパ・ママにパスワードを入れてもらおう</p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
                    placeholder="パスワード"
                    className="field mb-2"
                    style={{ borderColor: pwError ? "var(--red)" : undefined }}
                  />
                  {pwError && (
                    <p className="text-xs mb-2" style={{ color: "var(--red)" }}>
                      ⚠️ パスワードが違います
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={confirmUse} className="action-btn" style={{ flex: 1 }}>確認</button>
                    <button onClick={() => setUsing(null)} className="ghost-btn" style={{ flex: 1 }}>
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div className="nav-btn">
                  <span className="nav-icon">🎫</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{t.ticket_name}</p>
                    <p className="text-xs text-muted">{t.gold_cost} G で交換済み</p>
                  </div>
                  <button
                    onClick={() => startUse(t.id)}
                    className="action-btn shrink-0"
                    style={{ width: "auto", padding: "8px 16px", fontSize: "0.85rem" }}
                  >
                    使う
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && used.length > 0 && (
        <>
          <button
            onClick={() => setShowUsed(!showUsed)}
            className="ghost-btn text-xs"
          >
            {showUsed ? "▲ 使い終わったチケットを隠す" : `▼ 使い終わったチケット（${used.length}枚）`}
          </button>
          {showUsed && (
            <div className="card flex flex-col gap-2 opacity-50">
              {used.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span>✅</span>
                  <p className="text-sm text-muted">{t.ticket_name}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <a href="/shop" className="ghost-btn">🏪 ショップへ</a>

    </main>
  );
}
