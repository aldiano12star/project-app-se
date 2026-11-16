import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET() {
  try {
    const [events, meetings, tasks] = await Promise.all([
      prisma.event.findMany({
        orderBy: { startDate: "asc" },
        take: 100,
      }),
      prisma.meeting.findMany({
        orderBy: { date: "asc" },
        take: 100,
      }),
      prisma.eventTask.findMany({
        where: {
          dueDate: {
            not: null,
          },
        },
        include: {
          section: {
            include: {
              event: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 100,
      }),
    ]);

    const nowStamp = formatIcsDate(new Date());

    const icsLines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Saba ExploIT//Kalender Organisasi//ID",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Saba ExploIT Kalender",
      "X-WR-TIMEZONE:Asia/Jakarta",
      "X-WR-CALDESC:Jadwal Acara, Rapat, dan Deadline Tugas Saba ExploIT",
    ];

    for (const ev of events) {
      const start = new Date(ev.startDate);
      let end = new Date(ev.endDate);
      if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
        end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      }

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:EVENT-${ev.id}@sabaexploit.org`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${formatIcsDate(start)}`,
        `DTEND:${formatIcsDate(end)}`,
        `SUMMARY:${escapeIcsText(ev.title)}`,
        `DESCRIPTION:${escapeIcsText(ev.description || "Acara Saba ExploIT")}`,
        "LOCATION:Lab Komputer / Ruang Ekskul Saba",
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    }

    for (const m of meetings) {
      const start = new Date(m.date);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:MEETING-${m.id}@sabaexploit.org`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${formatIcsDate(start)}`,
        `DTEND:${formatIcsDate(end)}`,
        `SUMMARY:${escapeIcsText(m.title)}`,
        `DESCRIPTION:${escapeIcsText(m.notes || "Sesi Rapat Koordinasi Saba ExploIT")}`,
        "LOCATION:Ruang Ekskul Saba / Lab Komputer",
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    }

    for (const task of tasks) {
      if (!task.dueDate) continue;
      const due = new Date(task.dueDate);
      const start = new Date(due.getTime() - 30 * 60 * 1000);
      const eventTitle = task.section?.event?.title || "Acara Organisasi";
      const taskSummary = `[Deadline Tugas] ${task.title} - ${eventTitle}`;
      const taskDetails = [
        task.description ? `Deskripsi: ${task.description}` : "",
        `Seksi: ${task.section?.name || "-"}`,
        `Kegiatan: ${eventTitle}`,
        `Status: ${task.status === "DONE" ? "Selesai" : "Belum Selesai"}`,
      ]
        .filter(Boolean)
        .join("\n");

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:TASK-${task.id}@sabaexploit.org`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${formatIcsDate(start)}`,
        `DTEND:${formatIcsDate(due)}`,
        `SUMMARY:${escapeIcsText(taskSummary)}`,
        `DESCRIPTION:${escapeIcsText(taskDetails)}`,
        "LOCATION:Lab Komputer / Ruang Ekskul Saba",
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    }

    icsLines.push("END:VCALENDAR");

    const icsContent = icsLines.join("\r\n");

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="saba-exploit-calendar.ics"',
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("[ICS API Error]:", error);
    return NextResponse.json(
      { error: "Gagal memuat feed kalender" },
      { status: 500 }
    );
  }
}
