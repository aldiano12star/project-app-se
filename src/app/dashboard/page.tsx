import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PodiumTop3 } from "@/components/home/PodiumTop3";
import { DashboardMeetingWidget } from "@/components/home/DashboardMeetingWidget";
import Link from "next/link";
import { Role, Division, ClassGrade } from "@prisma/client";
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  ChevronRight,
} from "lucide-react";

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

  // Ambil profil user, Top 3 Leaderboard berdasar totalPoints, acara terdekat, dan presensi hari ini
  const [dbUser, topContributors, recentEvents, todayAttendance] =
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
    ]);

  if (!dbUser) {
    redirect("/login");
  }

  const getDivisionBadge = (division?: Division) => {
    switch (division) {
      case Division.PROGRAMMING:
        return "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400";
      case Division.DESIGN:
        return "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400";
      case Division.PHOTOGRAPHY:
        return "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400";
      case Division.CINEMATOGRAPHY:
        return "bg-red-50 dark:bg-red-950/50 text-brand-primary";
      case Division.TECHNOPRENEURSHIP:
        return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400";
      default:
        return "bg-surface-container-low text-ink-secondary";
    }
  };

  return (
    <AppShell user={dbUser}>
      <div className="flex flex-col gap-4">
        {/* ========================================================= */}
        {/* MODUL 1: Sapaan Singkat & Tombol Presensi QR Sesi Rapat   */}
        {/* ========================================================= */}
        <section className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Halo, {dbUser.name.split(" ")[0]}! 👋
              </h1>
              <p className="text-xs text-ink-muted mt-0.5">
                Pusat Aktivitas &amp; Operasional Digital Saba ExploIT
              </p>
            </div>

            {todayAttendance ? (
              <span className="inline-flex items-center gap-1.5 bg-success-subtle text-success px-2.5 py-1 rounded-full text-[11px] font-bold border border-success/30 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Presensi Hadir</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-surface-container-low text-ink-secondary px-2.5 py-1 rounded-full text-[11px] font-semibold border border-edge shrink-0">
                <Clock className="h-3.5 w-3.5 text-ink-muted" />
                <span>Siap Rapat</span>
              </span>
            )}
          </div>

          {/* Role, Grade & Division Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center rounded-full bg-surface-container-low px-2.5 py-0.5 text-[11px] font-semibold text-ink-secondary border border-edge">
              {formatGrade(dbUser.classGrade)}
            </span>
            <span className="inline-flex items-center rounded-full bg-primary-subtle px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              {dbUser.role === Role.ADMIN
                ? "Admin Pengurus Inti"
                : dbUser.role === Role.BENDAHARA
                ? "Bendahara Organisasi"
                : dbUser.role === Role.OPERATOR
                ? "Developer & Operator"
                : "Anggota Aktif"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getDivisionBadge(
                dbUser.mainDivision
              )}`}
            >
              Divisi {dbUser.mainDivision}
            </span>
          </div>

          {/* Tombol Presensi QR Rapat / Scanner Cepat */}
          <div className="mt-1">
            <DashboardMeetingWidget userRole={dbUser.role} />
          </div>
        </section>

        {/* ========================================================= */}
        {/* MODUL 2: Podium Juara Top 3 (Panggung Apresiasi Komunitas) */}
        {/* ========================================================= */}
        <PodiumTop3 contributors={topContributors} />

        {/* ========================================================= */}
        {/* MODUL 3: Pratinjau Acara & Agenda Organisasi Terdekat     */}
        {/* ========================================================= */}
        <section className="card-solid p-4 sm:p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Agenda Acara Terdekat
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Workspace &amp; kepanitiaan acara organisasi
                </p>
              </div>
            </div>
            <Link
              href="/acara"
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span>Semua Acara</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-container-low/40 border border-edge text-center space-y-1.5">
              <p className="text-xs font-semibold text-ink">Belum Ada Agenda Mendatang</p>
              <p className="text-[11px] text-ink-muted">
                Agenda kegiatan ekskul akan dijadwalkan oleh pengurus inti.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentEvents.map((evt) => {
                const totalTasks = evt.sections.reduce(
                  (sum, s) => sum + s.tasks.length,
                  0
                );
                const completedTasks = evt.sections.reduce(
                  (sum, s) =>
                    sum + s.tasks.filter((t) => t.status === "DONE").length,
                  0
                );

                const startDateFormatted = new Date(evt.startDate).toLocaleDateString(
                  "id-ID",
                  { day: "numeric", month: "short" }
                );
                const endDateFormatted = new Date(evt.endDate).toLocaleDateString(
                  "id-ID",
                  { day: "numeric", month: "short", year: "numeric" }
                );

                return (
                  <Link
                    key={evt.id}
                    href={`/acara/${evt.id}`}
                    className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-edge transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                          {startDateFormatted} - {endDateFormatted}
                        </span>
                        <span className="text-[10px] font-medium text-ink-muted">
                          {evt.sections.length} Seksi
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-ink truncate group-hover:text-primary transition-colors">
                        {evt.title}
                      </h3>
                      {totalTasks > 0 && (
                        <p className="text-[10px] text-ink-secondary mt-0.5">
                          Progress: {completedTasks}/{totalTasks} Tugas Selesai
                        </p>
                      )}
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-edge text-ink-secondary group-hover:text-primary shrink-0">
                      <ChevronRight className="h-4 w-4" />
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
