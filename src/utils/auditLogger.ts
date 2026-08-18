import { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  supabase: SupabaseClient,
  action: string,
  details: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("audit_logs").insert([
        {
          user_id: user.id,
          action: action,
          details: details,
        }
      ]);
    }
  } catch (error) {
    console.error("Gagal mencatat audit log:", error);
  }
}
