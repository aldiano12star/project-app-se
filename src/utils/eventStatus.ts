export type EventTimeStatus = "ACTIVE" | "UPCOMING" | "COMPLETED";

export const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const FULL_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

/**
 * Mengambil komponen tanggal { year, monthIndex, day, dayOfWeek, dateString }
 * dalam zona waktu 'Asia/Jakarta' (WIB).
 */
export function getJakartaDateParts(dateInput: Date | string): {
  year: number;
  monthIndex: number; // 0 = Januari, 11 = Desember
  day: number;
  dayOfWeek: number; // 0 = Minggu, 6 = Sabtu
  dateString: string; // "YYYY-MM-DD"
} {
  const d = new Date(dateInput);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  const parts = formatter.formatToParts(d);
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  let weekdayStr = "";

  for (const part of parts) {
    if (part.type === "year") year = parseInt(part.value, 10);
    if (part.type === "month") month = parseInt(part.value, 10);
    if (part.type === "day") day = parseInt(part.value, 10);
    if (part.type === "weekday") weekdayStr = part.value;
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek =
    weekdays.indexOf(weekdayStr) !== -1
      ? weekdays.indexOf(weekdayStr)
      : d.getDay();
  const dateString = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  return {
    year,
    monthIndex: month - 1,
    day,
    dayOfWeek,
    dateString,
  };
}

/**
 * Mengubah Date atau ISO string menjadi format tanggal lokal YYYY-MM-DD berbasis zona waktu 'Asia/Jakarta' (WIB).
 */
export function getLocalDateString(dateInput: Date | string): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Mengecek apakah targetDate sama persis dengan hari ini (dalam zona waktu 'Asia/Jakarta').
 */
export function isTodayLocal(dateInput: Date | string): boolean {
  return getLocalDateString(dateInput) === getLocalDateString(new Date());
}

/**
 * Mengecek apakah targetDate sudah lewat sebelum hari ini (dalam zona waktu 'Asia/Jakarta').
 */
export function isPastLocal(dateInput: Date | string): boolean {
  return getLocalDateString(dateInput) < getLocalDateString(new Date());
}

/**
 * Memformat rentang tanggal acara secara presisi & cerdas:
 * - Hari sama: "2 Okt 2026"
 * - Bulan sama, beda hari: "2 - 5 Okt 2026"
 * - Beda bulan, tahun sama: "30 Sep - 7 Okt 2026" (Wajib menampilkan kedua nama bulan)
 * - Beda tahun: "30 Des 2026 - 5 Jan 2027"
 */
export function formatEventDateRange(
  startDateInput: Date | string,
  endDateInput: Date | string,
  options?: { shortMonth?: boolean }
): string {
  const startParts = getJakartaDateParts(startDateInput);
  const endParts = getJakartaDateParts(endDateInput);
  const monthNames =
    options?.shortMonth === false ? FULL_MONTHS : SHORT_MONTHS;

  const startDay = startParts.day;
  const endDay = endParts.day;
  const startMonth = monthNames[startParts.monthIndex];
  const endMonth = monthNames[endParts.monthIndex];
  const startYear = startParts.year;
  const endYear = endParts.year;

  // 1. Acara dalam 1 hari yang sama
  if (startParts.dateString === endParts.dateString) {
    return `${startDay} ${startMonth} ${startYear}`;
  }

  // 2. Acara lintas tahun (misal 30 Des 2026 - 3 Jan 2027)
  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
  }

  // 3. Acara lintas bulan dalam tahun yang sama (misal 30 Sep - 7 Okt 2026)
  if (startParts.monthIndex !== endParts.monthIndex) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  }

  // 4. Acara multi-hari dalam bulan yang sama (misal 2 - 5 Okt 2026)
  return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
}

/**
 * Memformat rentang jam acara (WIB):
 * - Jam sama: "15.30 WIB"
 * - Rentang jam: "15.30 - 17.00 WIB"
 */
export function formatEventTimeRange(
  startDateInput: Date | string,
  endDateInput: Date | string
): string {
  const startObj = new Date(startDateInput);
  const endObj = new Date(endDateInput);

  const startHour = String(startObj.getHours()).padStart(2, "0");
  const startMin = String(startObj.getMinutes()).padStart(2, "0");
  const endHour = String(endObj.getHours()).padStart(2, "0");
  const endMin = String(endObj.getMinutes()).padStart(2, "0");

  if (startHour === endHour && startMin === endMin) {
    return `${startHour}.${startMin} WIB`;
  }

  return `${startHour}.${startMin} - ${endHour}.${endMin} WIB`;
}

/**
 * Helper terpadu untuk format waktu acara sesuai aturan:
 * - Kondisi A (Acara 1 Hari): Wajib menampilkan jam, misal "Jumat, 2 Okt 2026 • 15.30 - 17.00 WIB"
 * - Kondisi B (Acara Multi-Hari): Dilarang menampilkan jam, cukup rentang tanggal, misal "30 Sep - 7 Okt 2026"
 */
export function formatEventSchedule(
  startDateInput: Date | string,
  endDateInput: Date | string,
  options?: {
    shortMonth?: boolean;
    includeDayName?: boolean;
  }
): string {
  const startParts = getJakartaDateParts(startDateInput);
  const endParts = getJakartaDateParts(endDateInput);
  const isSingleDay = startParts.dateString === endParts.dateString;

  if (isSingleDay) {
    const dateRange = formatEventDateRange(startDateInput, endDateInput, options);
    const timeStr = formatEventTimeRange(startDateInput, endDateInput);
    if (options?.includeDayName) {
      const dayName = INDONESIAN_DAYS[startParts.dayOfWeek];
      return `${dayName}, ${dateRange} • ${timeStr}`;
    }
    return `${dateRange} • ${timeStr}`;
  }

  // Multi-day: hanya rentang tanggal, tanpa jam
  return formatEventDateRange(startDateInput, endDateInput, options);
}

/**
 * Menentukan status waktu kegiatan secara presisi:
 * - ACTIVE / ONGOING (Sedang Berlangsung): now >= startDate && now <= effectiveEndDate
 * - UPCOMING (Akan Datang): now < startDate
 * - COMPLETED / FINISHED (Selesai): now > effectiveEndDate
 *
 * Memperhitungkan batas akhir hingga 23:59:59 pada hari 'endDate' di zona WIB.
 */
export function getEventTimeStatus(
  startDateInput: Date | string,
  endDateInput: Date | string
): EventTimeStatus {
  const now = new Date();
  const start = new Date(startDateInput);
  const end = new Date(endDateInput);

  const todayStr = getLocalDateString(now);
  const startStr = getLocalDateString(start);
  const endStr = getLocalDateString(end);

  const endParts = getJakartaDateParts(end);
  const effectiveEnd = new Date(
    `${endParts.dateString}T23:59:59.999+07:00`
  );

  if (now.getTime() < start.getTime() && todayStr < startStr) {
    return "UPCOMING";
  } else if (now.getTime() > effectiveEnd.getTime() && todayStr > endStr) {
    return "COMPLETED";
  } else {
    // Sedang berlangsung (ONGOING / ACTIVE)
    return "ACTIVE";
  }
}
