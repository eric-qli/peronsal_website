import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

function getPublicSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!url) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  return url;
}

function getSecretKey(): string {
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const key = secretKey || serviceRoleKey;

  if (!key) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return key;
}

export function createServerSupabaseClient(): SupabaseClient {
  if (serverClient) {
    return serverClient;
  }

  serverClient = createClient(getPublicSupabaseUrl(), getSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClient;
}
