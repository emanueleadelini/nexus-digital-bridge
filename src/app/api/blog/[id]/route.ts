import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { blogPosts } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.id, id), eq(blogPosts.isDemo, false)))
    .limit(1);
  if (!post) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  return NextResponse.json(post);
}
