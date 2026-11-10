import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { AppShell } from "@/components/layout/AppShell";
import { PodiumTop3 } from "@/components/home/PodiumTop3";
import { DashboardMeetingWidget } from "@/components/home/DashboardMeetingWidget";
import { GuestLockedView } from "@/components/ui/GuestLockedView";
import { WelcomeOnboardingModal } from "@/components/home/WelcomeOnboardingModal";
import { CompleteProfileModal } from "@/components/onboarding/CompleteProfileModal";
import Link from "next/link";
import { Role, Division } from "@prisma/client";
import { buildAudienceFilter } from "@/utils/audience";
import { getGlobalOrganizationalHealth } from "@/utils/analytics";
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  ChevronRight,
  AlertTriangle,
  Radio,
  Layers,
  MessageSquare,
  Activity,
  Coffee,
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
  const current = await getCurrentDbUser();

  if (!current?.session?.user?.id || !current.dbUser) {
    redirect("/login");
  }

  const { session, dbUser } = current;

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  // Gatekeeper: Akun GUEST (Menunggu Verifikasi) tidak dapat melihat konten internal
  if (dbUser.role === Role.GUEST) {
    return (
      <AppShell user={dbUser}>
        <WelcomeOnboardingModal
          initialOpen={!dbUser.hasSeenWelcome}
          userName={dbUser.name}
        />
        <div className="flex flex-col gap-6 pt-1">
          <section className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Halo, {dbUser.name} 👋
            </h1>
            <p className="text-xs text-ink-muted">
              Selamat datang di portal organisasi Saba ExploIT (SE-Core).
            </p>
          </section>

          <GuestLockedView
            title="Akses Dashboard Terbatas"
            description="Informasi aktivitas kegiatan, leaderboard podium, sesi presensi rapat, dan tugas kepanitiaan hanya dapat diakses oleh anggota resmi terverifikasi."
          />
        </div>
      </AppShell>
    );
  }

  // Tentukan batasan visibilitas target audience berdasarkan kelas/role dan custom target pengguna
  const audienceFilter = buildAudienceFilter(dbUser.role, dbUser.classGrade, dbUser.id);
  const isOfficer = dbUser.role === Role.ADMIN || dbUser.role === Role.OPERATOR;

  // Ambil Top 3 Leaderboard, rapat & acara terdekat (prioritas mendesak), presensi hari ini, tugas panitia, dan analitik kesehatan global
  const [
    topContributors,
    upcomingMeetings,
    upcomingEvents,
    todayAttendance,
    myAssignedTasks,
    globalHealth,
  ] = await Promise.all([
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
      prisma.meeting.findMany({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          ...audienceFilter,
        },
        orderBy: { date: "asc" },
        take: 3,
        include: {
          event: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.event.findMany({
        where: {
          endDate: {
            gte: new Date(),
          },
          ...audienceFilter,
        },
        orderBy: { startDate: "asc" },
        take: 5,
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
      isOfficer
        ? getGlobalOrganizationalHealth()
        : Promise.resolve(null),
    ]);

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

  const getDivisionBadge = (division?: Division | null) => {
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
      case Role.KOLABORATOR:
        return {
          label: "Kolaborator",
          style: "bg-teal-950/60 text-teal-400 border-teal-500/50",
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

  // Format rapat mendatang sebagai agenda singkat mendesak
  const formattedMeetings = upcomingMeetings.map((m) => {
    const isToday =
      getLocalDateString(m.date) === getLocalDateString(new Date());
    const timeStr = new Date(m.date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    const dateFormatted = formatEventSchedule(m.date, m.date, { shortMonth: true });

    return {
      id: `meeting-${m.id}`,
      title: m.title,
      startDate: m.date,
      endDate: m.date,
      isMeeting: true,
      isSingleDay: true,
      timeStatus: isToday ? ("ACTIVE" as const) : ("UPCOMING" as const),
      categoryLabel: m.event ? `Rapat • ${m.event.title}` : "Sesi Rapat",
      formattedSchedule: `${dateFormatted} • ${timeStr} WIB`,
      progressText: m.event ? `Bagian dari Proker ${m.event.title}` : undefined,
    };
  });

  // Format events
  const formattedEvents = upcomingEvents.map((evt) => {
    const isSingleDay =
      getLocalDateString(evt.startDate) === getLocalDateString(evt.endDate);
    const timeStatus = getEventTimeStatus(evt.startDate, evt.endDate);
    const formattedSchedule = formatEventSchedule(evt.startDate, evt.endDate, {
      shortMonth: true,
    });
    const totalTasks = evt.sections.reduce(
      (sum, s) => sum + s.tasks.length,
      0
    );
    const completedTasks = evt.sections.reduce(
      (sum, s) =>
        sum + s.tasks.filter((t) => t.status === "DONE").length,
      0
    );

    return {
      id: `event-${evt.id}`,
      title: evt.title,
      startDate: evt.startDate,
      endDate: evt.endDate,
      isMeeting: false,
      isSingleDay,
      timeStatus,
      categoryLabel: isSingleDay ? "Acara Singkat" : "Proker Multi-Hari",
      formattedSchedule,
      progressText:
        totalTasks > 0
          ? `Progress: ${completedTasks}/${totalTasks} Tugas Selesai (${evt.sections.length} Seksi)`
          : undefined,
    };
  });

  // Prioritas Cerdas: Utamakan Acara Singkat & Rapat Mendatang (urgent-first)
  const shortAgendas = [
    ...formattedMeetings,
    ...formattedEvents.filter((e) => e.isSingleDay),
  ].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const multiDayAgendas = formattedEvents
    .filter((e) => !e.isSingleDay)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Gabungkan dengan prioritas: jika acara singkat kurang dari 3, isi dengan proker multi-hari
  const prioritizedAgendas = [
    ...shortAgendas,
    ...multiDayAgendas,
  ].slice(0, 3);

  return (
    <AppShell user={dbUser}>
      <WelcomeOnboardingModal
        initialOpen={!dbUser.hasSeenWelcome}
        userName={dbUser.name}
      />
      <CompleteProfileModal
        user={{
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
          mainDivision: dbUser.mainDivision,
          classGrade: dbUser.classGrade,
          instansi: dbUser.instansi,
        }}
      />
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

            {todayAttendance && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/40 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
                <span>Presensi Hadir</span>
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
                      className="h-11 min-h-11 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm self-end sm:self-auto cursor-pointer"
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
        {/* MODUL ANALITIK: KESEHATAN ORGANISASI ATAU PRESENSI SAYA  */}
        {/* ========================================================= */}
        {isOfficer && globalHealth ? (
          <section className="card-solid p-5 sm:p-6 rounded-2xl bg-card border border-edge shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800 p-2.5 shadow-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
                    Keaktifan Global
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Rasio kehadiran seluruh anggota aktif pada agenda rapat
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${
                  globalHealth.globalPercentage >= 75
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {globalHealth.globalPercentage >= 75
                    ? "Keaktifan Memenuhi Target"
                    : "Perlu Peningkatan"}
                </span>
              </span>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 border border-edge/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">
                  Total Kehadiran Kolektif:
                </span>
                <span className="font-mono font-bold text-ink text-sm sm:text-base">
                  {globalHealth.globalPercentage}%{" "}
                  <span className="text-xs font-normal text-ink-muted">
                    ({globalHealth.totalActual} dari {globalHealth.totalExpected} kehadiran diharapkan)
                  </span>
                </span>
              </div>

              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-edge/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    globalHealth.globalPercentage >= 75
                      ? "bg-linear-to-r from-emerald-500 to-teal-400"
                      : "bg-linear-to-r from-amber-500 to-rose-500"
                  }`}
                  style={{
                    width: `${Math.min(globalHealth.globalPercentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ========================================================= */}
        {/* MODUL 2 & 3: Grid Adaptif Layar Lebar (Podium & Acara)    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* MODUL 2: Podium Juara Top 3 (Panggung Apresiasi Komunitas) */}
          <PodiumTop3 contributors={topContributors} />

          {/* MODUL 3: Pratinjau Acara & Agenda Organisasi Terdekat     */}
          <section className="card-solid p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50 shadow-xs p-2.5 shrink-0">
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
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 min-h-11 px-2"
              >
                <span>Semua Acara</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {prioritizedAgendas.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-container-low/40 border border-edge/70 text-center flex flex-col items-center justify-center space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-xs">
                  <Coffee className="h-7 w-7 stroke-[1.8]" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <p className="text-sm font-bold text-ink">
                    Tidak ada agenda terdekat. Waktunya fokus berkarya atau bersantai!
                  </p>
                  <p className="text-xs text-ink-muted">
                    Semua jadwal rapat &amp; acara saat ini telah selesai. Nikmati proses eksplorasimu!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {prioritizedAgendas.map((agenda) => {
                  return (
                    <Link
                      key={agenda.id}
                      href="/acara"
                      className="card-hover p-4 sm:p-5 rounded-2xl bg-surface-container-low/70 hover:bg-surface-container border border-edge transition-all flex items-center justify-between gap-4 group active:scale-[0.99] min-h-16"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {/* Status Badge */}
                          {agenda.timeStatus === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 shadow-xs">
                              <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
                              <span>{agenda.isMeeting ? "Hari Ini" : "Sedang Berlangsung"}</span>
                            </span>
                          ) : agenda.timeStatus === "UPCOMING" ? (
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
                              agenda.isSingleDay
                                ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                                : "bg-indigo-950/60 text-indigo-400 border border-indigo-500/30"
                            }`}
                          >
                            {agenda.isSingleDay ? (
                              <MessageSquare className="h-3 w-3" />
                            ) : (
                              <Layers className="h-3 w-3" />
                            )}
                            <span>{agenda.categoryLabel}</span>
                          </span>

                          <span className="text-xs font-mono text-slate-400">
                            {agenda.formattedSchedule}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-semibold text-ink truncate group-hover:text-primary transition-colors">
                          {agenda.title}
                        </h3>

                        {agenda.progressText && (
                          <p className="text-xs text-slate-400">
                            {agenda.progressText}
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
      </div>
    </AppShell>
  );
}
