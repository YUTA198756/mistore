"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase, Mistake } from "@/lib/supabase";
import { getOrCreateChildProfile, addXp } from "@/lib/profile";

const XP_RESOLVE = 10;
const XP_REASON_BONUS = 20;

type ViewState = "list" | "detail" | "done";

interface DetailState {
  mistake: Mistake;
  reflection: string;
  saving: boolean;
}

interface DoneState {
  xpEarned: number;
  ticketsEarned: number;
}

export default function ReviewPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [view, setView] = useState<ViewState>("list");
  const [doneState, setDoneState] = useState<DoneState | null>(null);

  useEffect(() => { fetchMistakes(); }, []);

  async function fetchMistakes() {
    setLoading(true);
    const { data } = await supabase
      .from("mistakes").select("*").eq("status", "unresolved")
      .order("created_at", { ascending: false });
    setMistakes(data ?? []);
    setLoading(false);
  }

  function openDetail(m: Mistake) {
    setDetail({ mistake: m, reflection: "", saving: false });
    setView("detail");
  }

  async function markResolved() {
    if (!detail) return;
    setDetail((d) => d && { ...d, saving: true });

    const hasReason = detail.reflection.trim().length > 0;
    const xp = XP_RESOLVE + (hasReason ? XP_REASON_BONUS : 0);

    await supabase.from("mistakes").update({
      status: "resolved",
      reflection_text: detail.reflection || null,
      xp_earned: (detail.mistake.xp_earned ?? 0) + xp,
    }).eq("id", detail.mistake.id);

    const profileId = await getOrCreateChildProfile();
    let ticketsEarned = 0;
    if (profileId) {
      const r = await addXp(profileId, xp);
      ticketsEarned = r.ticketsEarned;
    }

    setMistakes((prev) => prev.filter((m) => m.id !== detail.mistake.id));
    setDoneState({ xpEarned: xp, ticketsEarned });
    setView("done");
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">

      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={() => view === "list" ? undefined : (setView("list"), setDetail(null))}
          className="ghost-btn"
          style={{ width: "auto", padding: "8px 14px" }}
        >
          {view === "list"
            ? <a href="/">← もどる</a>
            : "← 一覧"
          }
        </button>
        <h1 className="font-dot text-lg text-gold">🔄 とき直し</h1>
      </div>

      {/* 一覧 */}
      {view === "list" && (
        <>
          {loading && (
            <div className="card text-center py-10">
              <p className="text-muted">よみこみ中…</p>
            </div>
          )}
          {!loading && mistakes.length === 0 && (
            <div className="card text-center py-10">
              <div className="text-5xl mb-4">🏆</div>
              <p className="font-bold mb-2">解き直す問題がありません！</p>
              <p className="text-sm text-muted mb-6">まずはおたからハントで<br />問題を撮影しよう！</p>
              <a href="/hunt" className="action-btn" style={{ maxWidth: 240, margin: "0 auto" }}>
                📸 おたからハントへ
              </a>
            </div>
          )}
          {!loading && mistakes.length > 0 && (
            <div className="card flex flex-col gap-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-muted">解き直す問題を選んでね</p>
                <span className="badge badge-a">{mistakes.length}問</span>
              </div>
              {mistakes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => openDetail(m)}
                  className="nav-btn"
                >
                  {m.image_url ? (
                    <div className="relative shrink-0 rounded-xl overflow-hidden"
                      style={{ width: 52, height: 52 }}>
                      <Image src={m.image_url} alt="問題" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="shrink-0 flex items-center justify-center text-2xl rounded-xl"
                      style={{ width: 52, height: 52, background: "rgba(0,0,0,0.3)" }}>
                      📄
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
                    {m.handwriting_score != null && (
                      <p className="text-xs mt-1" style={{
                        color: m.handwriting_score >= 90 ? "var(--gold)" :
                               m.handwriting_score >= 70 ? "var(--green)" : "var(--cyan)"
                      }}>
                        文字ていねいさ：{m.handwriting_score}点
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "var(--red)" }}>● 解き直し待ち</p>
                  </div>
                  <span className="nav-arrow">›</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 詳細 */}
      {view === "detail" && detail && (
        <>
          <div className="card">
            <p className="text-xs text-muted mb-3">{formatDate(detail.mistake.created_at)} の問題</p>
            {detail.mistake.image_url && (
              <div className="relative w-full rounded-2xl overflow-hidden mb-3" style={{ aspectRatio: "3/4" }}>
                <Image src={detail.mistake.image_url} alt="問題" fill className="object-cover" />
              </div>
            )}
          </div>

          <div className="card">
            <p className="font-bold text-sm mb-1">✏️ なぜ間違えた？</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-s text-xs">＋{XP_REASON_BONUS} XP ボーナス</span>
              <span className="text-xs text-muted">入力すると獲得！</span>
            </div>
            <textarea
              value={detail.reflection}
              onChange={(e) => setDetail((d) => d && { ...d, reflection: e.target.value })}
              placeholder="例：計算ミス、公式を忘れた"
              rows={3}
              className="field resize-none"
            />
          </div>

          <button
            onClick={markResolved}
            disabled={detail.saving}
            className="action-btn"
          >
            {detail.saving
              ? "保存中…"
              : `✅ 解き直し完了！（＋${XP_RESOLVE + (detail.reflection.trim() ? XP_REASON_BONUS : 0)} XP）`}
          </button>
        </>
      )}

      {/* 完了 */}
      {view === "done" && doneState && (
        <div className="card card-green text-center py-10">
          <div className="text-5xl mb-4 float">🎉</div>
          <p className="font-dot text-xl font-bold text-green mb-2">解き直し完了！</p>
          <p className="text-4xl font-dot font-bold text-gold mb-2">＋{doneState.xpEarned} XP</p>
          {doneState.ticketsEarned > 0 && (
            <p className="font-dot text-base pulse-gold mb-4" style={{ color: "var(--purple)" }}>
              🎰 ガチャチケット ×{doneState.ticketsEarned} 獲得！
            </p>
          )}
          <p className="text-sm text-muted mb-6">まちがいを乗り越えた！<br />経験値が上がったぞ！</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setView("list")} className="action-btn">
              次の問題へ
            </button>
            <a href="/" className="ghost-btn">🏠 ホームにもどる</a>
          </div>
        </div>
      )}

    </main>
  );
}
