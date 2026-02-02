import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = getServerSupabase({ req, res });
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = sessionData.session.user.id;
    const { data, error } = await supabase
      .from("ratings")
      .select(
        `
        *,
        users!fk_ratings_user_id (
          username,
          display_name,
          profile_image_url
        ),
        coffee_beans (
          name,
          brand,
          origin,
          roast_level,
          variety,
          image_url
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
