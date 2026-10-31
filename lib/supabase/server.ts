import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Database } from "@/types/database.types";

export async function createClient() {
  // Opt into request-time rendering before anything (e.g. Supabase's Date.now()) runs.
  try {
    await connection();
  } catch {
    // connection() only applies during Server Component rendering; ignored in Server Actions / Route Handlers.
  }
  const cookieStore = await cookies();
  const initialCookies = cookieStore.getAll();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll().length > 0 ? cookieStore.getAll() : initialCookies;
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie manipulation may throw in Server Components; ignored if middleware refreshes sessions.
        }
      },
    },
  });
}
