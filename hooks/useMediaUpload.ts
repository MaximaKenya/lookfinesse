import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabaseClient";

export function useMediaUpload() {
  const compress = async (file: File) => {
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
  };

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const uploadFiles = async (
    files: File[],
    storeId: string,
    productId = "temp"
  ) => {
    return Promise.all(
      files.map(async (file, i) => {
        const compressed = await compress(file);

        const path = `${storeId}/${productId}/${Date.now()}-${i}.jpg`;

        const url = await uploadFile(compressed, path);

        return {
          url,
          path,
        };
      })
    );
  };

  return { uploadFiles };
}