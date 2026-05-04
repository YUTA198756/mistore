// ========================================
// 🎰 ガチャ景品・確率の設定ファイル
// ここを編集するだけで景品を追加・変更できます
// ========================================

export type Rank = "S" | "A" | "B";

export interface Reward {
  id: string;
  rank: Rank;
  label: string;
}

// --- 景品リスト（自由に追加・編集してください）---
export const REWARDS: Reward[] = [
  // S級（レア）
  { id: "s1", rank: "S", label: "まんが1さつ" },
  { id: "s2", rank: "S", label: "100ゴールド" },

  // A級
  { id: "a1", rank: "A", label: "コンビニでおかし" },
  { id: "a2", rank: "A", label: "50ゴールド" },

  // B級
  { id: "b1", rank: "B", label: "ゲーム15ふんえんちょう" },
  { id: "b2", rank: "B", label: "10ゴールド" },
];

// --- 排出確率（合計が100になるように設定）---
export const WEIGHTS = {
  // 通常ガチャ
  normal: { S: 10, A: 45, B: 45 },
  // 天井（B級が3回続いた翌日）
  ceiling: { S: 10, A: 90, B: 0 },
};

// 天井発動までのB連続回数
export const CEILING_COUNT = 3;
