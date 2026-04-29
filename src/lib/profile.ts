import { supabase } from "./supabase";

const STORAGE_KEY = "mistore_profile_id";

export async function getOrCreateChildProfile(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "child")
    .limit(1)
    .single();

  if (existing?.id) {
    localStorage.setItem(STORAGE_KEY, existing.id);
    return existing.id;
  }

  const { data: created } = await supabase
    .from("profiles")
    .insert({ display_name: "ぼく", role: "child", current_xp: 0, current_gold: 0, gacha_tickets: 0 })
    .select("id")
    .single();

  if (created?.id) {
    localStorage.setItem(STORAGE_KEY, created.id);
    return created.id;
  }

  return null;
}

// XPを加算。100XP貯まるごとにガチャチケット付与（XPは余りにリセット）
export async function addXp(profileId: string, amount: number): Promise<{ newXp: number; ticketsEarned: number }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_xp, gacha_tickets")
    .eq("id", profileId)
    .single();

  const oldXp = profile?.current_xp ?? 0;
  const rawNew = oldXp + amount;
  const ticketsEarned = Math.floor(rawNew / 100);
  const newXp = rawNew % 100;
  const newTickets = (profile?.gacha_tickets ?? 0) + ticketsEarned;

  await supabase
    .from("profiles")
    .update({ current_xp: newXp, gacha_tickets: newTickets })
    .eq("id", profileId);

  return { newXp, ticketsEarned };
}

// ゴールドを加算
export async function addGold(profileId: string, amount: number): Promise<number> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_gold")
    .eq("id", profileId)
    .single();

  const newGold = (profile?.current_gold ?? 0) + amount;
  await supabase.from("profiles").update({ current_gold: newGold }).eq("id", profileId);
  return newGold;
}

// ゴールドを消費（残高不足時はfalseを返す）
export async function spendGold(profileId: string, amount: number): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_gold")
    .eq("id", profileId)
    .single();

  const current = profile?.current_gold ?? 0;
  if (current < amount) return false;

  await supabase
    .from("profiles")
    .update({ current_gold: current - amount })
    .eq("id", profileId);
  return true;
}

// ガチャチケットを1枚消費
export async function useGachaTicket(profileId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("gacha_tickets")
    .eq("id", profileId)
    .single();

  const current = profile?.gacha_tickets ?? 0;
  if (current <= 0) return false;

  await supabase
    .from("profiles")
    .update({ gacha_tickets: current - 1 })
    .eq("id", profileId);
  return true;
}

// 今日の獲得XPを集計
export async function getTodayXp(profileId: string): Promise<number> {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayJST = jstNow.toISOString().slice(0, 10);
  const todayStart = `${todayJST}T00:00:00+09:00`;
  const todayEnd   = `${todayJST}T23:59:59+09:00`;

  const { data } = await supabase
    .from("mistakes")
    .select("xp_earned")
    .eq("user_id", profileId)
    .gte("created_at", todayStart)
    .lte("created_at", todayEnd);

  return data?.reduce((sum, m) => sum + (m.xp_earned ?? 0), 0) ?? 0;
}

export async function getTotalXp(profileId: string): Promise<number> {
  const { data } = await supabase
    .from("profiles")
    .select("current_xp")
    .eq("id", profileId)
    .single();
  return data?.current_xp ?? 0;
}

export async function getTotalGold(profileId: string): Promise<number> {
  const { data } = await supabase
    .from("profiles")
    .select("current_gold")
    .eq("id", profileId)
    .single();
  return data?.current_gold ?? 0;
}

export async function getGachaTickets(profileId: string): Promise<number> {
  const { data } = await supabase
    .from("profiles")
    .select("gacha_tickets")
    .eq("id", profileId)
    .single();
  return data?.gacha_tickets ?? 0;
}
