import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MistakeStatus = "unresolved" | "resolved";
export type RewardRank = "S" | "A" | "B";
export type UserRole = "child" | "parent";

export interface Mistake {
  id: string;
  user_id: string;
  image_url: string;
  status: MistakeStatus;
  handwriting_score: number | null;
  is_super_gacha: boolean;
  reflection_text: string | null;
  rework_image_url: string | null;
  xp_earned: number;
  created_at: string;
}
