"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Kurva perlambatan kuartik (ease-out-quart): 1 - (1 - t)^4.
 * Menghasilkan gerakan cepat di awal lalu melambat secara anggun mendekati akhir.
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 4);
}

/**
 * Menghitung interpolasi nilai awal ke target dengan progress 0..1.
 * Kebal terhadap NaN dan mendukung nominal negatif (defisit kas).
 */
export function calculateInterpolatedValue(
  start: number,
  target: number,
  progress: number
): number {
  if (isNaN(target)) return 0;
  if (isNaN(start)) return target;
  const eased = easeOutQuart(progress);
  return Math.round(start + (target - start) * eased);
}

/**
 * Hook untuk menganimasikan angka (misal saldo kas/dompet) menghitung naik secara mulus.
 * @param targetValue Angka akhir yang dituju
 * @param durationMs Durasi animasi dalam milidetik (default: 600ms)
 */
export function useCountUp(targetValue: number, durationMs: number = 600): number {
  const [currentValue, setCurrentValue] = useState<number>(() =>
    typeof window === "undefined" ? targetValue : 0
  );
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    // Abaikan animasi jika preferensi pengguna mematikan gerakan (accessibility)
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setCurrentValue(targetValue);
      prevValueRef.current = targetValue;
      return;
    }

    const startValue = prevValueRef.current;
    if (startValue === targetValue) {
      setCurrentValue(targetValue);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      const nextVal = calculateInterpolatedValue(startValue, targetValue, progress);
      setCurrentValue(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = targetValue;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetValue, durationMs]);

  return currentValue;
}
