import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getPublicSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!url) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  return url;
}

function getPublishableKey(): string {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const key = publishableKey || anonKey;

  if (!key) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  return key;
}

export function createBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(getPublicSupabaseUrl(), getPublishableKey());
  return browserClient;
}
