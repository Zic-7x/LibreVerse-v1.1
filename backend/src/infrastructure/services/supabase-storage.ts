import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const rawUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!rawUrl || !key) {
    return null;
  }

  const baseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  // Validate before calling createClient — createClient throws synchronously on bad URLs
  try {
    new URL(baseUrl);
  } catch {
    console.error("[Supabase] SUPABASE_URL is not a valid URL:", rawUrl);
    return null;
  }

  try {
    supabaseInstance = createClient(baseUrl, key, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.error("[Supabase] createClient failed:", (err as Error).message);
    return null;
  }

  return supabaseInstance;
}

export async function uploadToSupabaseBucket(
  bucket: string,
  path: string,
  fileData: Buffer | ArrayBuffer | Blob,
  contentType: string
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, fileData, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Supabase Storage upload error [${bucket}/${path}]:`, error.message);
    return null;
  }

  const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export function getSupabasePublicUrl(bucket: string, path: string): string | null {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}
