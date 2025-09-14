import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "general";

  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${process.env.NEXT_PUBLIC_NEWSAPI_KEY}`
    );

    const data = await res.json();

    if (data.status !== "ok") {
      throw new Error(data.message || "Failed to fetch news");
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
