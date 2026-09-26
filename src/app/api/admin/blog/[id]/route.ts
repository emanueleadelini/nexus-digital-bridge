import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { blogPosts } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const sanitize = (s: string) => s.replace(/[<>"'`]/g, "").trim();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  await db
    .update(blogPosts)
    .set({
      ...(body.title ? { title: sanitize(String(body.title)) } : {}),
      ...(body.excerpt !== undefined ? { excerpt: sanitize(String(body.excerpt)) } : {}),
      ...(body.content !== undefined ? { content: String(body.content) } : {}),
      ...(Array.isArray(body.tags)
        ? { tags: body.tags.map(String).map(sanitize).filter(Boolean) }
        : {}),
    })
    .where(eq(blogPosts.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  const { id } = await params;
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  return NextResponse.json({ success: true });
}
