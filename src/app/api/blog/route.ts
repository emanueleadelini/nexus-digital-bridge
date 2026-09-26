import { NextResponse } from "next/server";
import { listBlogPosts } from "@/server/data";

export async function GET() {
  return NextResponse.json(await listBlogPosts(false));
}
