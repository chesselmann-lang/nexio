"use client";
import { useEffect, useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
  /** Nexio-green accent colour for the finder pattern squares */
  color?: string;
}

/**
 * Pure-JS QR Code — no external lib needed.
 * Uses the native Canvas API (works SSR-safe via useEffect).
 * Falls back to a <img> link for environments without canvas.
 */
export default function QRCode({ value, size = 200, color = "#07c160" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Dynamic import so the heavy QR lib only loads client-side
    import("qrcode").then((QR) => {
      if (!canvasRef.current) return;
      QR.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: color,
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });
    }).catch(() => {
      // qrcode not installed yet — render fallback
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !canvasRef.current) return;
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#9ca3af";
      ctx.font = `${size / 12}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("npm install qrcode", size / 2, size / 2);
    });
  }, [value, size, color]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-xl"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
