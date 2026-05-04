import { REWARDS, WEIGHTS, CEILING_COUNT, Rank, Reward } from "./rewards";

const STORAGE_KEY = "mistore_gacha";

interface GachaState {
  lastPulledDate: string | null;
  consecutiveB: number;
}

function loadState(): GachaState {
  if (typeof window === "undefined") return { lastPulledDate: null, consecutiveB: 0 };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return { lastPulledDate: null, consecutiveB: 0 };
  }
}

function saveState(state: GachaState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function pickRank(weights: { S: number; A: number; B: number }): Rank {
  const total = weights.S + weights.A + weights.B;
  const roll = Math.random() * total;
  if (roll < weights.S) return "S";
  if (roll < weights.S + weights.A) return "A";
  return "B";
}

function pickReward(rank: Rank): Reward {
  const pool = REWARDS.filter((r) => r.rank === rank);
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface GachaResult {
  reward: Reward;
  isCeiling: boolean;
}

export function pullGacha(): GachaResult {
  const state = loadState();
  const isCeiling = (state.consecutiveB ?? 0) >= CEILING_COUNT;

  const weights = isCeiling ? WEIGHTS.ceiling : WEIGHTS.normal;

  const rank = pickRank(weights);
  const reward = pickReward(rank);

  saveState({
    lastPulledDate: today(),
    consecutiveB: rank === "B" ? (state.consecutiveB ?? 0) + 1 : 0,
  });

  return { reward, isCeiling };
}

export function canPullToday(): boolean {
  const state = loadState();
  return state.lastPulledDate !== today();
}

export function getGachaState() {
  return loadState();
}
