"use client";

import { useEffect, useState } from "react";
import { SHOP_ITEMS } from "@/lib/shop";
import { getOrCreateChildProfile, getTotalGold, spendGold } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

export default function ShopPage() {
  const [gold, setGold] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getOrCreateChildProfile();
      setProfileId(id);
      if (id) setGold(await getTotalGold(id));
    })();
  }, []);

  async function handleBuy(itemId: string, itemName: string, cost: number) {
    if (!profileId) return;
    setBuying(itemId);
    setMessage(null);

    if ((gold ?? 0) < cost) {
      setMessage({ text: `ゴールドが足りないよ！あと ${cost - (gold ?? 0)}G 必要`, ok: false });
      setBuying(null);
      return;
    }

    const ok = await spendGold(profileId, cost);
    if (!ok) {
      setMessage({ text: "交換に失敗したよ。もう一度試してね", ok: false });
      setBuying(null);
      return;
    }

    await supabase.from("tickets").insert({
      user_id: profileId,
      ticket_name: itemName,
      gold_cost: cost,
      status: "unused",
    });

    const newGold = await getTotalGold(profileId);
    setGold(newGold);
    setMessage({ text: `「${itemName}」をゲットしたよ！`, ok: true });
    setBuying(null);
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-sm mx-auto flex flex-col gap-4">

      <div className="flex items-center gap-3 mb-1">
        <a href="/" className="ghost-btn" style={{ width: "auto", padding: "8px 14px" }}>← もどる</a>
        <h1 className="font-dot text-lg text-gold">🏪 ゴールドショップ</h1>
      </div>

      {/* ゴールド残高 */}
      <div className="card card-gold flex items-center justify-between py-5">
        <div>
          <p className="text-xs text-muted mb-1">もっているゴールド</p>
          <p className="font-dot text-3xl font-bold text-gold">
            {gold === null ? "…" : `${gold} G`}
          </p>
        </div>
        <div className="text-5xl">💰</div>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`card ${message.ok ? "card-green" : "card-red"}`}>
          <p className="text-sm font-bold" style={{ color: message.ok ? "var(--green)" : "var(--red)" }}>
            {message.ok ? "✅ " : "⚠️ "}{message.text}
          </p>
        </div>
      )}

      {/* 商品リスト */}
      <div className="card flex flex-col gap-3">
        <p className="text-xs text-muted mb-1">交換したいチケットを選んでね</p>
        {SHOP_ITEMS.map((item) => {
          const canBuy = gold !== null && gold >= item.goldCost;
          return (
            <div key={item.id} className="nav-btn" style={{
              opacity: canBuy ? 1 : 0.5,
              cursor: "default",
            }}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{item.name}</p>
                <p className="text-xs text-gold mt-0.5">💰 {item.goldCost} G</p>
              </div>
              <button
                onClick={() => handleBuy(item.id, item.name, item.goldCost)}
                disabled={buying === item.id || !canBuy}
                className="action-btn shrink-0"
                style={{ width: "auto", padding: "8px 16px", fontSize: "0.85rem" }}
              >
                {buying === item.id ? "…" : "交換"}
              </button>
            </div>
          );
        })}
      </div>

      <a href="/tickets" className="ghost-btn">🎫 もっているチケットを見る</a>

    </main>
  );
}
