"use client";

import { useState, useEffect } from "react";
import { pullGacha, getGachaState, GachaResult } from "@/lib/gacha";
import { CEILING_COUNT } from "@/lib/rewards";
import { supabase } from "@/lib/supabase";
import { getOrCreateChildProfile, addGold, getGachaTickets, useGachaTicket } from "@/lib/profile";

type Step = "loading" | "ready" | "pulling" | "rank" | "reward" | "claimed" | "noticket";

const RANK_STYLE = {
  S: { color: "var(--gold)",   glow: "rgba(251,191,36,0.6)",  label: "★★★  Ｓきゅう  ★★★", icon: "👑" },
  A: { color: "var(--orange)", glow: "rgba(251,146,60,0.5)",  label: "★★   Ａきゅう   ★★",  icon: "🔥" },
  B: { color: "var(--muted)",  glow: "rgba(100,100,160,0.3)", label: "★    Ｂきゅう    ★",   icon: "⭐" },
};

export default function GachaPage() {
  const [step, setStep] = useState<Step>("loading");
  const [result, setResult] = useState<GachaResult | null>(null);
  const [dots, setDots] = useState("");
  const [consecutiveB, setConsecutiveB] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getOrCreateChildProfile();
      setProfileId(id);
      if (!id) { setStep("noticket"); return; }
      const t = await getGachaTickets(id);
      setTickets(t);
      const state = getGachaState();
      setConsecutiveB(state.consecutiveB ?? 0);
      setStep(t > 0 ? "ready" : "noticket");
    })();
  }, []);

  useEffect(() => {
    if (step !== "pulling") return;
    const timer = setInterval(() => setDots((d) => d.length >= 3 ? "" : d + "●"), 350);
    return () => clearInterval(timer);
  }, [step]);

  const handlePull = async () => {
    if (!profileId) return;
    const ok = await useGachaTicket(profileId);
    if (!ok) { setStep("noticket"); return; }
    setStep("pulling");
    setTimeout(() => {
      setResult(pullGacha());
      setStep("rank");
    }, 2200);
  };

  const handleClaim = async () => {
    if (!result) return;
    await supabase.from("reward_requests").insert({
      user_id: profileId,
      reward_name: result.reward.label,
      reward_rank: result.reward.rank,
      status: "pending",
    });
    const goldMatch = result.reward.label.match(/(\d+)ゴールド/);
    if (goldMatch && profileId) await addGold(profileId, parseInt(goldMatch[1], 10));
    setStep("claimed");
  };

  const rs = result ? RANK_STYLE[result.reward.rank] : null;

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">

      <div className="flex items-center gap-3 mb-1">
        <a href="/" className="ghost-btn" style={{ width: "auto", padding: "8px 14px" }}>← もどる</a>
        <h1 className="font-dot text-lg text-gold">🎰 ごほうびガチャ</h1>
      </div>

      {step === "loading" && (
        <div className="card text-center py-10">
          <p className="text-muted">よみこみ中…</p>
        </div>
      )}

      {step === "ready" && (
        <div className="card text-center py-8">
          {consecutiveB >= CEILING_COUNT && (
            <div className="mb-4 p-3 rounded-2xl" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.3)" }}>
              <p className="text-sm text-cyan font-bold">🌟 天井発動！Aランク以上確定！</p>
            </div>
          )}
          <div className="text-7xl mb-6 float">🎰</div>
          <p className="text-muted mb-2">チケット残り</p>
          <p className="text-3xl font-dot font-bold mb-6" style={{ color: "var(--purple)" }}>{tickets}枚</p>
          <button onClick={handlePull} className="action-btn" style={{ maxWidth: 260, margin: "0 auto" }}>
            🎲 ガチャをひく！
          </button>
        </div>
      )}

      {step === "pulling" && (
        <div className="card text-center py-14">
          <div className="text-6xl mb-6 float">🎰</div>
          <p className="font-bold text-base text-cyan mb-1">くじをひいています</p>
          <p className="text-2xl font-dot text-gold">{dots}</p>
        </div>
      )}

      {step === "rank" && result && rs && (
        <div className="card text-center py-12">
          <p className="text-sm text-muted mb-4">
            結果は{result.isCeiling ? "（天井）" : ""}…！
          </p>
          <div className="text-6xl mb-4 float">{rs.icon}</div>
          <p className="font-dot text-3xl font-bold mb-2 flash" style={{
            color: rs.color,
            textShadow: `0 0 20px ${rs.glow}`,
          }}>
            {rs.label}
          </p>
          <button
            onClick={() => setStep("reward")}
            className="action-btn mt-8"
            style={{ maxWidth: 260, margin: "32px auto 0" }}
          >
            景品を確認する
          </button>
        </div>
      )}

      {step === "reward" && result && rs && (
        <>
          <div className="card text-center py-8">
            <span className={`badge badge-${result.reward.rank.toLowerCase() as "s"|"a"|"b"} text-base px-4 py-1 mb-4 inline-block`}>
              {result.reward.rank}きゅう
            </span>
            <p className="text-2xl font-dot font-bold mb-4" style={{ color: rs.color }}>
              「{result.reward.label}」
            </p>
            {result.reward.label.match(/\d+ゴールド/) ? (
              <p className="text-sm text-gold">💰 ゴールドが自動で積まれるよ！</p>
            ) : (
              <p className="text-sm text-muted">パパ・ママに報告して承認してもらおう！</p>
            )}
          </div>
          <button onClick={handleClaim} className="action-btn">
            📢 報告する（承認をもとめる）
          </button>
        </>
      )}

      {step === "claimed" && result && (
        <div className="card card-gold text-center py-10">
          <div className="text-5xl mb-4 float">🎉</div>
          <p className="font-dot text-xl font-bold text-gold mb-2">報告完了！</p>
          {result.reward.label.match(/\d+ゴールド/) && (
            <p className="text-sm text-gold mb-2">💰 ゴールドが積まれたよ！</p>
          )}
          <p className="text-sm text-muted mb-6">パパ・ママの承認を待っていてね！</p>
          <a href="/" className="action-btn" style={{ maxWidth: 240, margin: "0 auto" }}>
            🏠 ホームにもどる
          </a>
        </div>
      )}

      {step === "noticket" && (
        <div className="card text-center py-10">
          <div className="text-5xl mb-4">🎰</div>
          <p className="font-dot text-lg font-bold mb-2">チケットがありません</p>
          <div className="card my-4 text-left" style={{ background: "rgba(0,0,0,0.2)" }}>
            <p className="text-xs text-muted mb-2">チケットのもらい方</p>
            <div className="flex flex-col gap-1 text-sm">
              <span>📸 撮影 → ＋10 XP</span>
              <span>🔄 解き直し → ＋10 XP</span>
              <span>✏️ 理由を書く → ＋20 XP</span>
              <span className="text-cyan font-bold">💎 100 XP 貯まる → チケット1枚！</span>
            </div>
          </div>
          <a href="/hunt" className="action-btn">📸 おたからハントへ</a>
        </div>
      )}

    </main>
  );
}
