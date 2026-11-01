import React from "react";
import { Lock } from "lucide-react";

interface GuestLockedViewProps {
  title?: string;
  description: string;
}

export function GuestLockedView({
  title = "Akses Data Terbatas",
  description,
}: GuestLockedViewProps) {
  return (
    <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
      <Lock className="h-8 w-8 text-amber-500 mx-auto" />
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
        Akun Anda saat ini berstatus{" "}
        <span className="font-semibold text-ink">
          Menunggu Verifikasi (GUEST)
        </span>
        . {description} Silakan hubungi Pengurus Organisasi untuk verifikasi akun Anda.
      </p>
    </div>
  );
}
