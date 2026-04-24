import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/lookaround — check in with location, get nearby users
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lat, lng, accuracy } = await req.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // Upsert own location
  await supabase.from("user_locations").upsert({
    user_id: user.id,
    lat,
    lng,
    accuracy: accuracy ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // Find nearby users within 1 km, active in last 5 minutes
  // Using haversine approximation in SQL
  const { data: nearby } = await supabase.rpc("nearby_users", {
    p_user_id: user.id,
    p_lat: lat,
    p_lng: lng,
    p_radius_km: 1.0,
  });

  // Fallback: simple query if RPC doesn't exist
  if (!nearby) {
    const { data: rawLocations } = await supabase
      .from("user_locations")
      .select("user_id, lat, lng, updated_at")
      .neq("user_id", user.id)
      .gte("updated_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    const withDistance = (rawLocations ?? []).map((loc: any) => {
      const dlat = (loc.lat - lat) * (Math.PI / 180);
      const dlng = (loc.lng - lng) * (Math.PI / 180);
      const a = Math.sin(dlat / 2) ** 2 +
        Math.cos(lat * Math.PI / 180) * Math.cos(loc.lat * Math.PI / 180) * Math.sin(dlng / 2) ** 2;
      const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...loc, distance_km: km };
    }).filter((l: any) => l.distance_km <= 1.0).sort((a: any, b: any) => a.distance_km - b.distance_km);

    // Fetch user profiles
    const ids = withDistance.map((l: any) => l.user_id);
    if (ids.length === 0) return NextResponse.json({ users: [] });

    const { data: profiles } = await supabase
      .from("users")
      .select("id, display_name, username, avatar_url, status")
      .in("id", ids);

    const result = withDistance.map((l: any) => ({
      ...profiles?.find((p) => p.id === l.user_id),
      distance_km: l.distance_km,
    }));
    return NextResponse.json({ users: result });
  }

  return NextResponse.json({ users: nearby ?? [] });
}
