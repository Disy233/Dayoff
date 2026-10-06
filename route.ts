import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DayOff For You recommendation algorithm
 * score = (recency_decay * 0.4) + (normalized_likes * 0.3) + (normalized_comments * 0.2) + (following_boost * 0.1)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user (optional – for following boost)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch recent posts with engagement
    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        id, video_url, thumbnail_url, caption, like_count, comment_count, view_count, created_at,
        profiles:user_id ( username, avatar_url, is_live )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Simple scoring
    const now = Date.now();
    const scored = (posts || []).map((post: any) => {
      const ageHours = (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
      const recency = Math.max(0, 1 - ageHours / 72); // decay over 3 days
      const likesNorm = Math.min(1, (post.like_count || 0) / 10000);
      const commentsNorm = Math.min(1, (post.comment_count || 0) / 1000);
      const followingBoost = 0; // TODO: check if user follows post.user_id

      const score =
        recency * 0.4 +
        likesNorm * 0.3 +
        commentsNorm * 0.2 +
        followingBoost * 0.1;

      return { ...post, score };
    });

    // Sort by score descending
    scored.sort((a: any, b: any) => b.score - a.score);

    return NextResponse.json({ posts: scored });
  } catch (err: any) {
    // Fallback mock data if table empty / not set up yet
    return NextResponse.json({
      posts: [],
      message: "Run the migration and add posts, or check Supabase connection",
      error: err.message,
    });
  }
}
