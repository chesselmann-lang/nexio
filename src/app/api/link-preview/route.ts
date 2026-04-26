import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Basic URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "Nexio-LinkPreview/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    function getMeta(property: string): string | null {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
      ];
      for (const pat of patterns) {
        const m = html.match(pat);
        if (m?.[1]) return m[1];
      }
      return null;
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMeta("og:title") ?? getMeta("twitter:title") ?? titleMatch?.[1]?.trim() ?? null;
    const description = getMeta("og:description") ?? getMeta("twitter:description") ?? getMeta("description") ?? null;
    const image = getMeta("og:image") ?? getMeta("twitter:image") ?? null;
    const siteName = getMeta("og:site_name") ?? parsedUrl.hostname;

    return NextResponse.json({
      url: parsedUrl.toString(),
      title: title ? title.slice(0, 120) : null,
      description: description ? description.slice(0, 200) : null,
      image: image ?? null,
      siteName,
      hostname: parsedUrl.hostname,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
