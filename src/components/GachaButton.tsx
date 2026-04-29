"use client";

import { useEffect, useState } from "react";
import { getOrCreateChildProfile, getGachaTickets } from "@/lib/profile";
import { getGachaState } from "@/lib/gacha";

export default function GachaButton() {
  const [tickets, setTickets] = useState<number | null>(null);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    (async () => {
      const id = await getOrCreateChildProfile();
      if (!id) { setTickets(0); return; }
      setTickets(await getGachaTickets(id));
      setIsSuper(getGachaState().isSuperGacha ?? false);
    })();
  }, []);

  if (tickets === null) {
    return (
      <div className="nav-btn opacity-50">
        <span className="nav-icon">🎰</span>
        <div className="text-muted text-sm">よみこみ中…</div>
      </div>
    );
  }

  if (tickets <= 0) {
    return (
      <div className="nav-btn opacity-40" style={{ cursor: "not-allowed" }}>
        <span className="nav-icon">🎰</span>
        <div>
          <div className="text-muted">ごほうびガチャ</div>
          <div className="text-xs text-muted font-normal">チケットなし（100XPで1枚）</div>
        </div>
      </div>
    );
  }

  return (
    <a href="/gacha" className="nav-btn" style={{
      borderColor: isSuper ? "rgba(251,191,36,0.6)" : "rgba(168,85,247,0.4)",
      background: isSuper ? "rgba(251,191,36,0.08)" : "rgba(168,85,247,0.06)",
    }}>
      <span className="nav-icon">{isSuper ? "✨" : "🎰"}</span>
      <div>
        <div style={{ color: isSuper ? "var(--gold)" : "var(--purple)" }}>
          {isSuper ? "スーパーガチャをひく！" : "ごほうびガチャをひく"}
        </div>
        <div className="text-xs text-muted font-normal">チケット ×{tickets}枚</div>
      </div>
      <span className="nav-arrow">›</span>
    </a>
  );
}
