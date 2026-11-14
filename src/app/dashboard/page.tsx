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
  Sparkles,
  Trophy,
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
            <h1 className="text-2xl font-extrabold tracking-tight text-ink font-display">
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

  // Ambil Top 3 Leaderboard, rapat & acara terdekat, presensi hari ini, tugas panitia, peringkat pribadi, dan analitik kesehatan global
  const [
    topContributors,
    upcomingMeetings,
    upcomingEvents,
    todayAttendance,
    myAssignedTasks,
    higherPointsCount,
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
    prisma.user.count({
      where: {
        status: "ACTIVE",
        totalPoints: { gt: dbUser.totalPoints },
      },
    }),
    isOfficer ? getGlobalOrganizationalHealth() : Promise.resolve(null),
  ]);

  const myRank = higherPointsCount + 1;

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
    return diffDays <= 1;
  });

  const getDivisionBadge = (division?: Division | null) => {
    switch (division) {
      case Division.PROGRAMMING:
        return {
          label: "Programming",
          style: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25",
        };
      case Division.TECHNOPRENEURSHIP:
        return {
          label: "Technopreneurship",
          style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25",
        };
      case Division.DESIGN:
        return {
          label: "Desain",
          style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25",
        };
      case Division.PHOTOGRAPHY:
        return {
          label: "Fotografi",
          style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
        };
      case Division.CINEMATOGRAPHY:
        return {
          label: "Cinematografi",
          style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25",
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
          style: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30",
        };
      case Role.ADMIN:
        return {
          label: "Admin",
          style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
        };
      case Role.BENDAHARA:
        return {
          label: "Bendahara",
          style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        };
      case Role.MEMBER:
        return {
          label: "Member",
          style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        };
      case Role.KOLABORATOR:
        return {
          label: "Kolaborator",
          style: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
        };
      case Role.GUEST:
        return {
          label: "Menunggu Verifikasi",
          style: "bg-slate-500/10 text-slate-500 border-slate-500/30",
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

  const shortAgendas = [
    ...formattedMeetings,
    ...formattedEvents.filter((e) => e.isSingleDay),
  ].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const multiDayAgendas = formattedEvents
    .filter((e) => !e.isSingleDay)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

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
        {/* EDITORIAL GREETING & STATUS HEADER                        */}
        {/* ========================================================= */}
        <section className="space-y-3 pt-1">
          {/* Top Line: Status & Identity Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(() => {
              const gradeLabel = formatGrade(dbUser.classGrade);
              if (!gradeLabel || !gradeLabel.trim()) return null;
              return (
                <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-semibold text-ink-secondary border hairline-border font-mono">
                  {gradeLabel}
                </span>
              );
            })()}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${roleMeta.style}`}
            >
              {roleMeta.label}
            </span>
            {(() => {
              const divMeta = getDivisionBadge(dbUser.mainDivision);
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${divMeta.style}`}
                >
                  {divMeta.label}
                </span>
              );
            })()}
          </div>

          {/* Main Asymmetric Editorial Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink font-display">
              Halo, {dbUser.name.split(" ")[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mt-1">
              Pusat kendali aktivitas, presensi rapat, dan kepanitiaan organisasi Saba ExploIT.
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FLOATING ALERT: PENGINGAT TUGAS MENDESAK (JIKA ADA)       */}
        {/* ========================================================= */}
        {urgentTasks.length > 0 && (
          <section className="space-y-2.5">
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

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isOverdue
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-ink">
                        {isOverdue
                          ? "🚨 Batas Waktu Terlewat: "
                          : isToday
                          ? "⏰ Jatuh Tempo Hari Ini: "
                          : "⚠️ Jatuh Tempo Besok: "}
                        <span className="font-extrabold">{task.title}</span>
                      </p>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">
                        Seksi {task.section.name} • {task.section.event.title}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/acara/${task.section.event.id}`}
                    className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all self-end sm:self-auto cursor-pointer"
                  >
                    <span>Buka Tugas</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </section>
        )}

        {/* ========================================================= */}
        {/* 2-COLUMN BENTO SUMMARY STRIP (XP & PRESENSI)              */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Poin XP Kontribusi & Peringkat Leaderboard */}
          <div className="specular-card bg-card border border-edge/80 dark:border-white/10 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/25">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted font-display">
                    Poin Kontribusi
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-mono">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  <span>Peringkat #{myRank}</span>
                </span>
              </div>

              <div className="pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-ink font-mono-num font-mono">
                    {dbUser.totalPoints.toLocaleString("id-ID")}
                  </span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">XP</span>
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  +{dbUser.monthlyPoints} XP diperoleh pada periode bulan ini
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Presensi & Keaktifan Rapat (Meeting Widget) */}
          <DashboardMeetingWidget
            userRole={dbUser.role}
            hasAttendedToday={Boolean(todayAttendance)}
          />
        </section>

        {/* ========================================================= */}
        {/* MODUL ANALITIK: KESEHATAN ORGANISASI (KHUSUS OFFICER)     */}
        {/* ========================================================= */}
        {isOfficer && globalHealth ? (
          <section className="specular-card p-5 sm:p-6 bg-card border border-edge/80 space-y-3.5 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wider font-display">
                    Keaktifan Global
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Rasio kehadiran seluruh anggota aktif pada agenda rapat organisasi
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${
                  globalHealth.globalPercentage >= 75
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
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

            <div className="bg-surface-container-low/70 rounded-xl p-4 border hairline-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-ink">Total Kehadiran Kolektif</span>
                  <span className="text-[11px] text-ink-muted">({globalHealth.totalActual}/{globalHealth.totalExpected} sesi)</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-ink text-base sm:text-lg font-mono-num leading-none">
                    {globalHealth.globalPercentage}%
                  </span>
                  <span className="text-[11px] text-ink-muted font-normal font-body">
                    dari kuota diharapkan
                  </span>
                </div>
              </div>

              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border hairline-border">
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
        {/* 2-COLUMN SECTION: PODIUM JUARA & AGENDA ACARA             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* PODIUM TOP 3 (Panggung Apresiasi Komunitas) */}
          <PodiumTop3 contributors={topContributors} />

          {/* PRATINJAU AGENDA ACARA TERDEKAT */}
          <section className="specular-card p-5 sm:p-6 flex flex-col gap-4 border border-edge/80 dark:border-white/10 rounded-2xl bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 p-2.5 shrink-0">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-widest font-display">
                    Agenda Acara Terdekat
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Workspace &amp; kepanitiaan acara organisasi
                  </p>
                </div>
              </div>
              <Link
                href="/acara"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 min-h-11 px-2 active:scale-95 transition-transform"
              >
                <span>Semua Acara</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {prioritizedAgendas.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-container-low/40 dark:bg-white/5 border border-edge/70 dark:border-white/10 text-center flex flex-col items-center justify-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-xs">
                  <Coffee className="h-6 w-6 stroke-[1.8]" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <p className="text-sm font-bold text-ink font-display">
                    Tidak ada agenda terdekat
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Semua jadwal rapat &amp; acara saat ini telah selesai. Nikmati proses eksplorasimu!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none snap-x">
                {prioritizedAgendas.map((agenda) => {
                  return (
                    <Link
                      key={agenda.id}
                      href="/acara"
                      className="min-w-[270px] sm:min-w-[300px] max-w-[320px] shrink-0 snap-start p-4 rounded-2xl bg-surface-container-low/70 dark:bg-white/5 hover:bg-surface-container dark:hover:bg-white/10 border border-edge/80 dark:border-white/10 transition-all flex flex-col justify-between gap-3 group active:scale-[0.98] cursor-pointer shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              agenda.isSingleDay
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                            }`}
                          >
                            {agenda.isSingleDay ? (
                              <MessageSquare className="h-3 w-3" />
                            ) : (
                              <Layers className="h-3 w-3" />
                            )}
                            <span>{agenda.categoryLabel}</span>
                          </span>

                          <span className="text-[10px] font-mono text-ink-muted">
                            {agenda.formattedSchedule}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-ink line-clamp-2 group-hover:text-primary transition-colors font-display">
                          {agenda.title}
                        </h3>

                        {agenda.progressText && (
                          <p className="text-xs text-ink-muted truncate">
                            {agenda.progressText}
                          </p>
                        )}
                      </div>

                      {/* Ticket Perforated Edge Indicator (Luma Ticket Aesthetic) */}
                      <div className="pt-2.5 border-t border-dashed hairline-border flex items-center justify-between text-xs font-semibold text-primary">
                        <span>Buka Detail Acara</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
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
