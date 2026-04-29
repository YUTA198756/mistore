"use client";

import { useRef } from "react";

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onCapture(file, url);
    e.target.value = "";
  };

  return (
    <div className="card flex flex-col items-center gap-5 py-8">
      <div className="float text-6xl">📷</div>
      <div className="text-center">
        <p className="font-bold text-base mb-1">まちがい問題を撮影しよう！</p>
        <p className="text-sm text-muted">ノートや問題用紙を写してね</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="action-btn"
        style={{ maxWidth: 260 }}
      >
        📸 カメラを起動する
      </button>

      <div className="card w-full" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
        <p className="text-xs text-center" style={{ color: "var(--red)" }}>
          ⚠️ 白紙・落書きは判定されないよ
        </p>
      </div>
    </div>
  );
}
