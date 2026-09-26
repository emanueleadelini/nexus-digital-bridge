import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db/client";
import { blogPosts } from "@/server/db/schema";
import { listBlogPosts } from "@/server/data";
import { desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const sanitize = (s: string) => s.replace(/[<>"'`]/g, "").trim();

export async function GET() {
  const { error } = await requireUser({ role: "Admin" });
  if (error) return error;
  return NextResponse.json(await listBlogPosts(true));
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser({ role: "Admin" });
  if (error) return error;
  const body = (await req.json()) as Record<string, unknown>;
  const title = sanitize(String(body.title || ""));
  if (!title) return NextResponse.json({ error: "Titolo mancante" }, { status: 400 });
  const tags = Array.isArray(body.tags) ? body.tags.map(String).map(sanitize).filter(Boolean) : [];
  const coverImage = typeof body.coverImage === "string" && body.coverImage.trim() ? body.coverImage.trim() : null;
  const id = randomUUID();
  await db.insert(blogPosts).values({
    id,
    title,
    excerpt: sanitize(String(body.excerpt || "")),
    content: String(body.content || ""),
    tags,
    coverImage,
    author: user.name,
    isDemo: false,
  });
  return NextResponse.json({ id }, { status: 201 });
}
