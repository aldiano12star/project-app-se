"use client";

import React, { useState, useTransition } from "react";
import {
  UserCheck,
  Shield,
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  Clock,
} from "lucide-react";
import { Role, Division, ClassGrade } from "@prisma/client";
import { promoteUserRole } from "@/actions/profile";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  classGrade?: ClassGrade | null;
  mainDivision?: Division | null;
  createdAt: string;
}

interface AdminUserManagementSectionProps {
  currentUserRole: Role;
  users: ManagedUser[];
}

function getRoleBadgeStyle(role: Role) {
  switch (role) {
    case Role.OPERATOR:
      return "bg-purple-950/60 text-purple-300 border-purple-500/50 shadow-xs";
    case Role.ADMIN:
      return "bg-red-950/60 text-red-400 border-red-500/50";
    case Role.BENDAHARA:
      return "bg-emerald-950/60 text-emerald-400 border-emerald-500/50";
    case Role.MEMBER:
      return "bg-blue-950/60 text-blue-400 border-blue-500/50";
    case Role.GUEST:
      return "bg-slate-800 text-slate-400 border-slate-700";
    default:
      return "bg-surface-container text-ink-muted border-edge";
  }
}

function getRoleLabel(role: Role) {
  switch (role) {
    case Role.OPERATOR:
      return "Operator";
    case Role.ADMIN:
      return "Admin";
    case Role.BENDAHARA:
      return "Bendahara";
    case Role.MEMBER:
      return "Member";
    case Role.GUEST:
      return "Menunggu Verifikasi";
    default:
      return role;
  }
}

function getDivisionMeta(division?: Division | string | null) {
  switch (division) {
    case Division.PROGRAMMING:
    case "Programming":
      return {
        label: "Programming",
        style: "bg-cyan-950/60 text-cyan-400 border-cyan-500/50",
      };
    case Division.TECHNOPRENEURSHIP:
    case "Technopreneurship":
      return {
        label: "Technopreneurship",
        style: "bg-amber-950/60 text-amber-400 border-amber-500/50",
      };
    case Division.DESIGN:
    case "Desain":
      return {
        label: "Desain",
        style: "bg-purple-950/60 text-purple-400 border-purple-500/50",
      };
    case Division.PHOTOGRAPHY:
    case "Fotografi":
      return {
        label: "Fotografi",
        style: "bg-emerald-950/60 text-emerald-400 border-emerald-500/50",
      };
    case Division.CINEMATOGRAPHY:
    case "Cinematografi":
      return {
        label: "Cinematografi",
        style: "bg-rose-950/60 text-rose-400 border-rose-500/50",
      };
    default:
      return {
        label: division || "Programming",
        style: "bg-surface-container text-ink-muted border-edge",
      };
  }
}

export function AdminUserManagementSection({
  currentUserRole,
  users,
}: AdminUserManagementSectionProps) {
  const [activeTab, setActiveTab] = useState<"GUEST" | "ALL">("GUEST");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isOfficer =
    currentUserRole === Role.ADMIN || currentUserRole === Role.OPERATOR;

  if (!isOfficer) return null;

  const guestUsers = users.filter((u) => u.role === Role.GUEST);

  const displayedUsers = (activeTab === "GUEST" ? guestUsers : users).filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePromote = (targetUserId: string, newRole: Role) => {
    setProcessingUserId(targetUserId);
    setFeedback(null);

    startTransition(async () => {
      const res = await promoteUserRole({ targetUserId, newRole });
      if (res.success) {
        setFeedback({ text: res.message, type: "success" });
      } else {
        setFeedback({ text: res.message, type: "error" });
      }
      setProcessingUserId(null);
    });
  };

  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Aktivasi Akun &amp; Manajemen Role</span>
        </h3>
        {guestUsers.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            {guestUsers.length} Menunggu
          </span>
        )}
      </div>

      <div className="bg-card border border-edge rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl border border-edge">
            <button
              type="button"
              onClick={() => setActiveTab("GUEST")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "GUEST"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Menunggu Verifikasi ({guestUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Semua Pengguna ({users.length})</span>
            </button>
          </div>

          <input
            type="text"
            placeholder="Cari nama / email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/40 border-red-500/40 text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* User List */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
          {displayedUsers.length === 0 ? (
            <div className="p-6 rounded-xl bg-surface-container-low/40 border border-edge text-center space-y-1">
              <UserCheck className="w-6 h-6 text-ink-muted mx-auto" />
              <p className="text-xs font-semibold text-ink">
                {activeTab === "GUEST"
                  ? "Tidak ada akun yang menunggu verifikasi."
                  : "Tidak ada data pengguna ditemukan."}
              </p>
              <p className="text-[11px] text-ink-muted">
                {activeTab === "GUEST"
                  ? "Semua akun terdaftar sudah memiliki role aktif."
                  : "Coba gunakan kata kunci pencarian yang berbeda."}
              </p>
            </div>
          ) : (
            displayedUsers.map((u) => {
              const isProcessing = processingUserId === u.id && isPending;
              const initials = u.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-surface-container-low/70 border border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-edge overflow-hidden shrink-0 flex items-center justify-center">
                      {u.image ? (
                        <img
                          src={u.image}
                          alt={u.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-ink truncate">
                          {u.name}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(
                            u.role
                          )}`}
                        >
                          {getRoleLabel(u.role)}
                        </span>
                        {u.mainDivision && (
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                              getDivisionMeta(u.mainDivision).style
                            }`}
                          >
                            {getDivisionMeta(u.mainDivision).label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons for Role Promotion */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    {u.role === Role.GUEST ? (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handlePromote(u.id, Role.MEMBER)}
                          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          <span>Aktivasi Member</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handlePromote(u.id, Role.BENDAHARA)}
                          className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span>Bendahara</span>
                        </button>
                      </>
                    ) : (
                      <select
                        value={u.role}
                        disabled={isProcessing}
                        onChange={(e) =>
                          handlePromote(u.id, e.target.value as Role)
                        }
                        className="h-8 px-2 rounded-lg bg-card border border-edge text-ink text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value={Role.MEMBER}>Set: Member</option>
                        <option value={Role.BENDAHARA}>Set: Bendahara</option>
                        <option value={Role.ADMIN}>Set: Admin</option>
                        {currentUserRole === Role.OPERATOR && (
                          <option value={Role.OPERATOR}>Set: Operator</option>
                        )}
                        <option value={Role.GUEST}>Set: Guest (Tangguhkan)</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
