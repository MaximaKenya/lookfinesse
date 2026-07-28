import { supabase } from "@/lib/supabaseClient";

export async function uploadImage(file: File) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("products")
    .upload(fileName, file);

  if (error) throw error;

  const { data: publicUrl } = supabase.storage
    .from("products")
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}