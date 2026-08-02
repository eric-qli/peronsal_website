import "server-only";

export interface SupabaseEnvStatus {
  nextPublicSupabaseUrl: boolean;
  supabaseSecretKey: boolean;
  supabaseServiceRoleKey: boolean;
  nextPublicSupabasePublishableKey: boolean;
  nextPublicSupabaseAnonKey: boolean;
  serverKeyConfigured: boolean;
  browserKeyConfigured: boolean;
}

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  const nextPublicSupabaseUrl = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );
  const supabaseSecretKey = Boolean(process.env.SUPABASE_SECRET_KEY?.trim());
  const supabaseServiceRoleKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
  const nextPublicSupabasePublishableKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
  const nextPublicSupabaseAnonKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );

  return {
    nextPublicSupabaseUrl,
    supabaseSecretKey,
    supabaseServiceRoleKey,
    nextPublicSupabasePublishableKey,
    nextPublicSupabaseAnonKey,
    serverKeyConfigured: supabaseSecretKey || supabaseServiceRoleKey,
    browserKeyConfigured:
      nextPublicSupabasePublishableKey || nextPublicSupabaseAnonKey,
  };
}

export function logSupabaseEnvDiagnostics(context: string): void {
  const status = getSupabaseEnvStatus();

  console.error(`[supabase-env] ${context}`, {
    NEXT_PUBLIC_SUPABASE_URL: status.nextPublicSupabaseUrl,
    SUPABASE_SECRET_KEY: status.supabaseSecretKey,
    SUPABASE_SERVICE_ROLE_KEY: status.supabaseServiceRoleKey,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.nextPublicSupabasePublishableKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.nextPublicSupabaseAnonKey,
    serverKeyConfigured: status.serverKeyConfigured,
    browserKeyConfigured: status.browserKeyConfigured,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    vercelEnv: process.env.VERCEL_ENV ?? "unknown",
  });
}
