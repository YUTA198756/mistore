"use client";

import { GeminiScoreResult } from "@/lib/gemini";

interface ScoreDisplayProps {
  result: GeminiScoreResult;
  xpEarned: number;
  isSuperGacha: boolean;
}

export default function ScoreDisplay({ result, xpEarned, isSuperGacha }: ScoreDisplayProps) {
  const scoreColor =
    result.score >= 90 ? "var(--gold)" :
    result.score >= 70 ? "var(--green)" : "var(--cyan)";

  const rankLabel =
    result.score >= 90 ? "✨ スーパー神筆！" :
    result.score >= 70 ? "👍 じょうず！" : "💪 ふつう";

  return (
    <div className="flex flex-col gap-4">

      {/* スーパー神筆バナー */}
      {isSuperGacha && (
        <div className="card card-gold text-center py-5">
          <p className="text-2xl mb-2 float">✨</p>
          <p className="font-dot text-lg pulse-gold text-gold">スーパー神筆ボーナス！</p>
          <p className="text-sm mt-1" style={{ color: "var(--gold-lt)" }}>
            けいけんち 2倍 ＆ スーパーガチャ権利獲得！
          </p>
        </div>
      )}

      {/* スコアカード */}
      <div className="card">
        <p className="text-xs text-muted mb-4 font-dot">🐾 ポンちゃんの採点結果</p>

        <div className="flex justify-between items-end mb-3">
          <span className="font-bold">文字のていねいさ</span>
          <span className="text-3xl font-dot font-bold" style={{ color: scoreColor }}>
            {result.score}<span className="text-lg">点</span>
          </span>
        </div>

        <div className="xp-track mb-2" style={{ height: 16 }}>
          <div className="xp-fill" style={{
            width: `${result.score}%`,
            background: result.score >= 90
              ? "linear-gradient(90deg, #fbbf24, #f97316)"
              : result.score >= 70
              ? "linear-gradient(90deg, #4ade80, #22d3ee)"
              : "linear-gradient(90deg, #22d3ee, #a855f7)",
          }} />
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold" style={{ color: scoreColor }}>{rankLabel}</span>
          {result.score >= 90 && <span className="badge badge-s">神筆</span>}
        </div>

        <div className="p-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.25)" }}>
          <p className="text-xs text-muted mb-1">🐾 ポンちゃんより</p>
          <p className="text-sm">「{result.comment}」</p>
        </div>
      </div>

      {/* XP獲得 */}
      <div className="card card-gold py-5 text-center">
        <p className="text-sm text-muted mb-1">けいけんち獲得！</p>
        <p className="text-4xl font-dot font-bold text-gold">＋{xpEarned} XP</p>
        {isSuperGacha && (
          <p className="text-xs mt-1" style={{ color: "var(--gold-lt)" }}>
            ★ 2倍ボーナス適用！
          </p>
        )}
      </div>

    </div>
  );
}
