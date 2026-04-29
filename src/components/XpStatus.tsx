"use client";

import { useEffect, useState } from "react";
import { getOrCreateChildProfile, getTotalXp, getTotalGold, getGachaTickets } from "@/lib/profile";

export default function XpStatus() {
  const [xp, setXp] = useState<number | null>(null);
  const [gold, setGold] = useState<number | null>(null);
  const [tickets, setTickets] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getOrCreateChildProfile();
      if (!id) return;
      const [x, g, t] = await Promise.all([getTotalXp(id), getTotalGold(id), getGachaTickets(id)]);
      setXp(x);
      setGold(g);
      setTickets(t);
    })();
  }, []);

  const pct = xp === null ? 0 : Math.min(100, Math.round((xp / 100) * 100));
  const loading = xp === null;

  return (
    <div className="card card-gold">
      {/* XPバー */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-gold font-dot">⭐ けいけんち</span>
        <span className="text-sm font-bold text-gold">{loading ? "…" : `${xp} / 100 XP`}</span>
      </div>
      <div className="xp-track mb-1">
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted mb-4">
        あと <span className="text-cyan font-bold">{loading ? "…" : 100 - xp!} XP</span> でガチャチケット 1枚
      </p>

      {/* スタット3列 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="text-xl mb-1">🎰</div>
          <div className="text-lg font-bold font-dot" style={{ color: tickets ? "var(--purple)" : "var(--muted)" }}>
            {loading ? "…" : tickets}
          </div>
          <div className="text-xs text-muted">チケット</div>
        </div>
        <div className="text-center p-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="text-xl mb-1">💰</div>
          <div className="text-lg font-bold font-dot text-gold">{loading ? "…" : gold}</div>
          <div className="text-xs text-muted">ゴールド</div>
        </div>
        <div className="text-center p-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="text-xl mb-1">⭐</div>
          <div className="text-lg font-bold font-dot text-cyan">{loading ? "…" : pct}%</div>
          <div className="text-xs text-muted">次まで</div>
        </div>
      </div>
    </div>
  );
}
