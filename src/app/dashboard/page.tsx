import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PodiumTop3 } from "@/components/home/PodiumTop3";
import { DashboardMeetingWidget } from "@/components/home/DashboardMeetingWidget";
import Link from "next/link";
import { Role, Division } from "@prisma/client";
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  ChevronRight,
  AlertTriangle,
  Radio,
  Layers,
  MessageSquare,
} from "lucide-react";
import {
  getJakartaDateParts,
  getLocalDateString,
  getEventTimeStatus,
  formatEventSchedule,
} from "@/utils/eventStatus";

export const dynamic = "force-dynamic";

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ambil profil user, Top 3 Leaderboard, acara terdekat (belum selesai), presensi hari ini, dan tugas panitia
  const [dbUser, topContributors, recentEvents, todayAttendance, myAssignedTasks] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          classGrade: true,
          mainDivision: true,
          status: true,
          monthlyPoints: true,
          totalPoints: true,
          isProfileCompleted: true,
        },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE" },
        orderBy: { totalPoints: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          classGrade: true,
          mainDivision: true,
          totalPoints: true,
          monthlyPoints: true,
        },
      }),
      prisma.event.findMany({
        where: {
          endDate: {
            gte: new Date(),
          },
        },
        orderBy: { startDate: "asc" },
        take: 3,
        include: {
          sections: {
            include: {
              tasks: {
                select: { id: true, status: true },
              },
            },
          },
        },
      }),
      prisma.attendance.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: { checkedAt: "desc" },
        include: {
          meeting: {
            select: {
              title: true,
              date: true,
            },
          },
        },
      }),
      prisma.eventTask.findMany({
        where: {
          assigneeId: session.user.id,
          status: { not: "DONE" },
          dueDate: { not: null },
        },
        include: {
          section: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: "asc" },
      }),
    ]);

  if (!dbUser) {
    redirect("/login");
  }

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  const nowParts = getJakartaDateParts(new Date());
  const nowDayStart = new Date(
    `${nowParts.dateString}T00:00:00+07:00`
  ).getTime();

  // Filter tugas panitia yang jatuh tempo besok (H-1), hari ini (H-0), atau lewat deadline
  const urgentTasks = (myAssignedTasks || []).filter((task) => {
    if (!task.dueDate) return false;
    const dueParts = getJakartaDateParts(task.dueDate);
    const dueDayStart = new Date(
      `${dueParts.dateString}T00:00:00+07:00`
    ).getTime();
    const diffDays = Math.round(
      (dueDayStart - nowDayStart) / (1000 * 60 * 60 * 24)
    );
    // Tampilkan pengingat jika H-1 (besok), H-0 (hari ini), atau terlambat
    return diffDays <= 1;
  });

  const getDivisionBadge = (division?: Division) => {
    switch (division) {
      case Division.PROGRAMMING:
        return {
          label: "Programming",
          style: "bg-cyan-950/60 text-cyan-400 border border-cyan-500/40",
        };
      case Division.TECHNOPRENEURSHIP:
        return {
          label: "Technopreneurship",
          style: "bg-amber-950/60 text-amber-400 border border-amber-500/40",
        };
      case Division.DESIGN:
        return {
          label: "Desain",
          style: "bg-purple-950/60 text-purple-400 border border-purple-500/40",
        };
      case Division.PHOTOGRAPHY:
        return {
          label: "Fotografi",
          style: "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40",
        };
      case Division.CINEMATOGRAPHY:
        return {
          label: "Cinematografi",
          style: "bg-rose-950/60 text-rose-400 border border-rose-500/40",
        };
      default:
        return {
          label: division || "Anggota",
          style: "bg-surface-container-low text-ink-secondary border border-edge",
        };
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.OPERATOR:
        return {
          label: "Operator",
          style: "bg-purple-950/60 text-purple-300 border-purple-500/50 shadow-xs",
        };
      case Role.ADMIN:
        return {
          label: "Admin",
          style: "bg-red-950/60 text-red-400 border-red-500/50",
        };
      case Role.BENDAHARA:
        return {
          label: "Bendahara",
          style: "bg-emerald-950/60 text-emerald-400 border-emerald-500/50",
        };
      case Role.MEMBER:
        return {
          label: "Member",
          style: "bg-blue-950/60 text-blue-400 border-blue-500/50",
        };
      case Role.GUEST:
        return {
          label: "Menunggu Verifikasi",
          style: "bg-slate-800 text-slate-400 border-slate-700",
        };
      default:
        return {
          label: role,
          style: "bg-surface-container text-ink-muted border-edge",
        };
    }
  };

  const roleMeta = getRoleBadge(dbUser.role);

  return (
    <AppShell user={dbUser}>
      <div className="flex flex-col gap-6">
        {/* ========================================================= */}
        {/* MODUL 1: Sapaan Singkat & Tombol Presensi QR Sesi Rapat   */}
        {/* ========================================================= */}
        <section className="flex flex-col gap-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                Halo, {dbUser.name.split(" ")[0]}! 👋
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Pusat Aktivitas &amp; Operasional Digital Saba ExploIT
              </p>
            </div>

            {todayAttendance ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/40 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
                <span>Presensi Hadir</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-low text-slate-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-edge shrink-0">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>Siap Rapat</span>
              </span>
            )}
          </div>

          {/* Role, Grade & Division Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-slate-300 border border-edge">
              {formatGrade(dbUser.classGrade)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${roleMeta.style}`}
            >
              {roleMeta.label}
            </span>
            {(() => {
              const divMeta = getDivisionBadge(dbUser.mainDivision);
              return (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${divMeta.style}`}
                >
                  Divisi {divMeta.label}
                </span>
              );
            })()}
          </div>

          {/* Tombol Presensi QR Rapat / Scanner Cepat */}
          <div>
            <DashboardMeetingWidget userRole={dbUser.role} />
          </div>

          {/* Pengingat Tugas Panitia H-1 / Mendesak */}
          {urgentTasks.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              {urgentTasks.map((task) => {
                const dueParts = getJakartaDateParts(task.dueDate!);
                const dueDayStart = new Date(
                  `${dueParts.dateString}T00:00:00+07:00`
                ).getTime();
                const diffDays = Math.round(
                  (dueDayStart - nowDayStart) / (1000 * 60 * 60 * 24)
                );

                const isTomorrow = diffDays === 1;
                const isToday = diffDays === 0;
                const isOverdue = diffDays < 0;

                const reminderPrefix = isOverdue
                  ? "🚨 Pengingat Tugas:"
                  : isToday
                  ? "⏰ Pengingat Tugas:"
                  : "⚠️ Pengingat Tugas:";

                const reminderSuffix = isTomorrow
                  ? "jatuh tempo besok!"
                  : isToday
                  ? "jatuh tempo hari ini!"
                  : "telah melewati batas waktu!";

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                      isOverdue
                        ? "bg-red-950/30 border-red-500/40 text-red-300"
                        : "bg-amber-950/30 border-amber-500/40 text-amber-200"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <AlertTriangle className="h-5 w-5 animate-bounce" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink leading-relaxed">
                          {reminderPrefix}{" "}
                          <span className="text-amber-400 font-bold">
                            {task.title}
                          </span>{" "}
                          pada seksi{" "}
                          <span className="font-semibold text-ink">
                            {task.section.name}
                          </span>{" "}
                          {reminderSuffix}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-1">
                          Acara: {task.section.event.title}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/acara/${task.section.event.id}`}
                      className="h-11 min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm self-end sm:self-auto cursor-pointer"
                    >
                      <span>Buka Tugas</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* MODUL 2: Podium Juara Top 3 (Panggung Apresiasi Komunitas) */}
        {/* ========================================================= */}
        <PodiumTop3 contributors={topContributors} />

        {/* ========================================================= */}
        {/* MODUL 3: Pratinjau Acara & Agenda Organisasi Terdekat     */}
        {/* ========================================================= */}
        <section className="card-solid p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-950/50 text-sky-400 border border-sky-500/30">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
                  Agenda Acara Terdekat
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Workspace &amp; kepanitiaan acara organisasi
                </p>
              </div>
            </div>
            <Link
              href="/acara"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 min-h-[44px] px-2"
            >
              <span>Semua Acara</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-container-low/50 border border-edge text-center space-y-2">
              <p className="text-sm font-semibold text-ink">Tidak ada agenda terdekat saat ini.</p>
              <p className="text-xs text-slate-400">
                Agenda kegiatan ekskul akan dijadwalkan oleh pengurus inti.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentEvents.map((evt) => {
                const isSingleDay =
                  getLocalDateString(evt.startDate) ===
                  getLocalDateString(evt.endDate);
                const timeStatus = getEventTimeStatus(
                  evt.startDate,
                  evt.endDate
                );
                const formattedSchedule = formatEventSchedule(
                  evt.startDate,
                  evt.endDate,
                  { shortMonth: true }
                );

                const totalTasks = evt.sections.reduce(
                  (sum, s) => sum + s.tasks.length,
                  0
                );
                const completedTasks = evt.sections.reduce(
                  (sum, s) =>
                    sum + s.tasks.filter((t) => t.status === "DONE").length,
                  0
                );

                return (
                  <Link
                    key={evt.id}
                    href={`/acara/${evt.id}`}
                    className="p-4 sm:p-5 rounded-2xl bg-surface-container-low/70 hover:bg-surface-container border border-edge transition-all flex items-center justify-between gap-4 group active:scale-[0.99] min-h-[64px]"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Status Badge */}
                        {timeStatus === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 shadow-xs">
                            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
                            <span>Sedang Berlangsung</span>
                          </span>
                        ) : timeStatus === "UPCOMING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>Mendatang</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>✓ Selesai</span>
                          </span>
                        )}

                        {/* Tipe Acara */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isSingleDay
                              ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                              : "bg-indigo-950/60 text-indigo-400 border border-indigo-500/30"
                          }`}
                        >
                          {isSingleDay ? (
                            <MessageSquare className="h-3 w-3" />
                          ) : (
                            <Layers className="h-3 w-3" />
                          )}
                          <span>
                            {isSingleDay
                              ? "Agenda Singkat"
                              : "Proker / Multi-Hari"}
                          </span>
                        </span>

                        <span className="text-xs font-mono text-slate-400">
                          {formattedSchedule}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-semibold text-ink truncate group-hover:text-primary transition-colors">
                        {evt.title}
                      </h3>

                      {totalTasks > 0 && (
                        <p className="text-xs text-slate-400">
                          Progress: {completedTasks}/{totalTasks} Tugas Selesai ({evt.sections.length} Seksi)
                        </p>
                      )}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-edge text-slate-400 group-hover:text-primary shrink-0">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
