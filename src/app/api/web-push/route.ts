import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    "";
  return NextResponse.json({
    publicKey,
    configured: Boolean(publicKey),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subscription } = body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return NextResponse.json(
        { error: "BAD_REQUEST: Payload subscription Web Push tidak valid." },
        { status: 400 }
      );
    }

    // Simpan atau perbarui subscription perangkat milik pengguna
    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: session.user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Perangkat berhasil didaftarkan untuk notifikasi push.",
      id: saved.id,
    });
  } catch (error) {
    console.error("[API Web-Push POST] error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR: Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "BAD_REQUEST: Endpoint subscription wajib disertakan." },
        { status: 400 }
      );
    }

    // Hapus subscription yang sesuai dengan endpoint dan user yang berwenang
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: endpoint,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Perangkat berhasil dihapus dari daftar notifikasi push.",
    });
  } catch (error) {
    console.error("[API Web-Push DELETE] error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR: Gagal menghapus langganan." },
      { status: 500 }
    );
  }
}
