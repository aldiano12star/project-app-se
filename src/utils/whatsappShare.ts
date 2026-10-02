/**
 * Helper Utility untuk Generator Tautan Broadcast WhatsApp Resmi Saba ExploIT
 */

/**
 * Membuat tautan WhatsApp API resmi (dapat dikirim ke grup atau nomor personal).
 */
export function generateWhatsAppLink(
  phoneOrEmpty: string,
  messageText: string
): string {
  const cleanPhone = phoneOrEmpty.replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(messageText);

  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

export interface EventBroadcastData {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  description?: string | null;
  location?: string | null;
}

/**
 * Membuat format draf pesan WhatsApp resmi untuk Pengumuman Kegiatan/Acara.
 */
export function formatEventBroadcastMessage(
  event: EventBroadcastData,
  baseUrl: string = ""
): string {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const isSameDay = start.toDateString() === end.toDateString();

  const formattedDate = isSameDay
    ? `${start.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}, Pukul ${start.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${end.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })} WIB`
    : `${start.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })} - ${end.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;

  const deskripsiRingkas =
    event.description?.trim() || "Kegiatan resmi organisasi Saba ExploIT.";
  const lokasi = event.location || "Lab Komputer / Ruang Ekskul Saba";
  const linkApp = baseUrl
    ? `${baseUrl}/acara/${event.id}`
    : `https://saba-exploit.app/acara/${event.id}`;

  return `📢 *PENGUMUMAN KEGIATAN SABA EXPLOIT* 📢
--------------------------------------
📌 *Agenda:* ${event.title}
🗓 *Waktu:* ${formattedDate}
📍 *Tempat:* ${lokasi}
📝 *Deskripsi:* ${deskripsiRingkas}

Cek agenda selengkapnya dan konfirmasi kehadiran di Super App:
🔗 ${linkApp}

_Harap hadir tepat waktu dan tertib. Terima kasih!_`;
}

export interface KasBroadcastData {
  amountPerPeriod?: number;
  periodName?: string;
}

/**
 * Membuat format draf pesan WhatsApp resmi untuk Pengingat Iuran Kas Pekanan.
 */
export function formatKasBroadcastMessage(
  data: KasBroadcastData,
  baseUrl: string = ""
): string {
  const nominal = (data.amountPerPeriod || 5000).toLocaleString("id-ID");
  const periode = data.periodName || "Pekan Ini";
  const linkKas = baseUrl
    ? `${baseUrl}/pengaturan`
    : "https://saba-exploit.app/pengaturan";

  return `💰 *PENGINGAT KAS PEKANAN SABA EXPLOIT* 💰
--------------------------------------
Halo rekan-rekan ExploIT! Kas organisasi (${periode}) sudah dibuka oleh Bendahara.

💵 *Nominal:* Rp${nominal} / pekan
💳 *Cek Status Kas Pribadimu:* ${linkKas}

Yuk tertib kas demi kelancaran operasional dan inventaris kita bersama! 🙌`;
}
