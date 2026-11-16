/**
 * Helper URL Google Calendar
 * Menghasilkan tautan resmi https://calendar.google.com/calendar/render?action=TEMPLATE&...
 * dengan parameter text, dates, location, details, dan ctz=Asia/Jakarta
 */

export interface GoogleCalendarEventInput {
  title: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  location?: string | null;
  details?: string | null;
}

/**
 * Format tanggal ke format UTC iCal: YYYYMMDDTHHmmssZ
 */
export function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Menghasilkan URL Google Calendar Event Creator
 */
export function generateGoogleCalendarUrl({
  title,
  startDate,
  endDate,
  location,
  details,
}: GoogleCalendarEventInput): string {
  const start = new Date(startDate);
  // Default durasi 1 jam jika endDate kosong atau tidak valid/sebelum startDate
  let end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000);
  if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  const startUtc = formatGoogleCalendarDate(start);
  const endUtc = formatGoogleCalendarDate(end);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startUtc}/${endUtc}`,
    ctz: "Asia/Jakarta",
  });

  if (location && location.trim()) {
    params.set("location", location.trim());
  }

  if (details && details.trim()) {
    params.set("details", details.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
