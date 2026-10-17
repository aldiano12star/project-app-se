import { NextResponse } from "next/server";
import { executeRollover } from "@/actions/rollover";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { confirmationText, notes } = body;

    const result = await executeRollover({
      confirmationText,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("[API Rollover] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
