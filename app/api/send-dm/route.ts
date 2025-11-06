import { NextResponse } from "next/server";
import { sendInstagramDirectMessage } from "@/lib/instagram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      recipientId,
      message,
      messagingTag,
      ctaLabel,
      ctaUrl,
      businessAccountId,
      accessToken
    } = body ?? {};

    const data = await sendInstagramDirectMessage({
      recipientId,
      message,
      messagingTag,
      ctaLabel,
      ctaUrl,
      businessAccountId,
      accessToken
    });

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while sending Instagram DM."
      },
      { status: 400 }
    );
  }
}
