import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";
const rawEmail = process.env.DEV_SMOKE_EMAIL || "";
const rawPassword = process.env.DEV_SMOKE_PASSWORD || "";
const email = rawEmail.trim();
const password = rawPassword.trim();

if (rawEmail !== email || rawPassword !== password) {
  console.warn("Trimmed whitespace from DEV_SMOKE_EMAIL or DEV_SMOKE_PASSWORD.");
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL/key env vars.");
  process.exit(1);
}

if (!email || !password) {
  console.error("Missing DEV_SMOKE_EMAIL or DEV_SMOKE_PASSWORD env vars.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const main = async () => {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.user) {
    const details = signInError?.message ? ` (${signInError.message})` : "";
    console.error(`Sign-in failed${details}.`);
    process.exit(1);
  }

  const userId = signInData.user.id;

  const { error: profileError } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Profile fetch failed.");
    process.exit(1);
  }

  const { error: ratingsError } = await supabase
    .from("ratings")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (ratingsError) {
    console.error("Ratings fetch failed.");
    process.exit(1);
  }

  console.log("Smoke test passed.");
};

main().catch(() => {
  console.error("Smoke test failed.");
  process.exit(1);
});
