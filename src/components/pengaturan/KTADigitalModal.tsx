"use client";

import React from "react";
import { X, ShieldCheck, Sparkles, QrCode, Cpu, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { UserProfileData } from "./ProfileHeroCard";
import { Division } from "@prisma/client";

interface KTADigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileData;
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Kelas 10 (Gen 21)";
  if (grade === "KELAS_11") return "Kelas 11 (Gen 20)";
  if (grade === "KELAS_12") return "Kelas 12 (Gen 19)";
  return grade.replace("_", " ");
}

function getDivisionMeta(division?: Division | string | null) {
  switch (division) {
    case Division.PROGRAMMING:
    case "Programming":
      return {
        label: "Programming",
        style: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      };
    case Division.TECHNOPRENEURSHIP:
    case "Technopreneurship":
      return {
        label: "Technopreneurship",
        style: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      };
    case Division.DESIGN:
    case "Desain":
      return {
        label: "Desain",
        style: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      };
    case Division.PHOTOGRAPHY:
    case "Fotografi":
      return {
        label: "Fotografi",
        style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      };
    case Division.CINEMATOGRAPHY:
    case "Cinematografi":
      return {
        label: "Cinematografi",
        style: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      };
    default:
      return {
        label: division || "Programming",
        style: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      };
  }
}

export function KTADigitalModal({
  isOpen,
  onClose,
  user,
}: KTADigitalModalProps) {
  if (!isOpen) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberIdCode = `SE-${user.id.slice(-8).toUpperCase()}`;
  const nisnOrId = user.nisn || `NISN: ${memberIdCode}`;

  const verificationPayload = JSON.stringify({
    id: user.id,
    name: user.name,
    role: user.role,
    code: memberIdCode,
    nisn: user.nisn || null,
    division: user.mainDivision,
    system: "SABA_EXPLOIT_AUTHENTIC_MEMBER",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#090D16] border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              KTA Digital Resmi • Cyber ID
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup KTA"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body / The Digital Card */}
        <div className="p-4 sm:p-5 flex flex-col items-center gap-4">
          {/* Cyber Academic Card Container (16:9 / ID Pass Sturdy Layout) */}
          <div className="w-full bg-gradient-to-br from-slate-900 via-[#0b1222] to-slate-950 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between gap-4">
            {/* Holographic Top Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#E11D2A] via-amber-400 via-rose-500 to-emerald-400" />

            {/* Background Circuit & Glow Matrix Accent */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Card Brand Header */}
            <div className="flex items-center justify-between border-b border-slate-800/90 pb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-md border border-red-400/30">
                  SE
                </div>
                <div>
                  <span className="text-xs font-black tracking-widest text-white block leading-none font-mono">
                    SABA EXPLOIT
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 leading-tight">
                    ORGANIZATIONAL DIGITAL PASS
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>ACTIVE</span>
              </span>
            </div>

            {/* Middle Section: Member Photo & Details */}
            <div className="flex items-center gap-3.5 relative z-10">
              {/* Member Photo with Saba Red + Amber Border */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl p-[2px] bg-gradient-to-tr from-[#E11D2A] to-amber-400 shadow-md">
                  <div className="w-full h-full rounded-[10px] overflow-hidden bg-slate-900 flex items-center justify-center">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-white font-mono">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Identity Fields */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <h3 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
                  {user.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-primary font-bold">
                    {memberIdCode}
                  </span>
                  {user.nisn && (
                    <span className="text-[10px] font-mono text-slate-400">
                      • {user.nisn}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  {formatGrade(user.classGrade)}
                </p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {(() => {
                    const divMeta = getDivisionMeta(user.mainDivision);
                    return (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${divMeta.style}`}
                      >
                        Divisi {divMeta.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Bottom Section: QR Code & Auth Verification Badge */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/90 bg-slate-950/70 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-3 sm:p-4 rounded-b-2xl relative z-10">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-slate-400">
                  OTORITAS &amp; ROLE
                </span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide font-mono">
                  {user.role}
                </span>
                <span className="text-[9px] font-mono text-slate-500 mt-1">
                  ORGANIZATIONAL DIGITAL PASS
                </span>
              </div>

              {/* Verified QR Code Card */}
              <div className="flex flex-col items-center gap-1">
                <div className="p-1.5 bg-white rounded-lg shadow-md">
                  <QRCodeSVG
                    value={verificationPayload}
                    size={62}
                    level="M"
                    marginSize={0}
                  />
                </div>
                <span className="text-[8px] font-mono font-bold text-slate-400 tracking-tight text-center">
                  AUTHENTIC SABA MEMBER
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            KTA digital ini diterbitkan secara otomatis dan dapat diverifikasi melalui pemindaian resmi sistem Saba ExploIT.
          </p>

          {/* Action Button: Tutup */}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-xs"
          >
            Tutup KTA
          </button>
        </div>
      </div>
    </div>
  );
}
