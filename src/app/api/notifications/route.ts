import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { getUnreadNotifications, markNotificationsRead } from "@/server/data";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;
  return NextResponse.json(await getUnreadNotifications(user.id));
}

export async function POST() {
  const { error, user } = await requireUser();
  if (error) return error;
  await markNotificationsRead(user.id);
  return NextResponse.json({ success: true });
}
