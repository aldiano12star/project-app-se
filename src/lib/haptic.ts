/**
 * Utilitas Haptic Feedback aman untuk mobile browser & PWA.
 * Memanfaatkan navigator.vibrate dengan fallback aman jika dijalankan di Desktop atau SSR.
 */
export const haptic = {
  /**
   * Ketukan mikro sangat ringan (10ms) untuk navigasi tab atau toggle.
   */
  tap: (): void => {
    try {
      if (typeof window !== "undefined" && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignored for environments where vibrate is blocked by permissions policy
    }
  },

  /**
   * Ketukan ritmis sukses [15ms, 40ms pause, 25ms] untuk aksi berhasil (QR scan, bayar kas).
   */
  success: (): void => {
    try {
      if (typeof window !== "undefined" && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([15, 40, 25]);
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Ketukan peringatan [20ms, 50ms pause, 20ms] untuk pembatalan atau error.
   */
  warning: (): void => {
    try {
      if (typeof window !== "undefined" && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([20, 50, 20]);
      }
    } catch {
      // Ignored
    }
  },
};
