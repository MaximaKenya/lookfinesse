import { supabase } from "@/lib/supabaseClient";

type Params = {
  vendorId: string;
  title: string;
  message: string;
  imageUrl?: string;
};

export async function sendFollowerNotifications({
  vendorId,
  title,
  message,
  imageUrl,
}: Params) {
  const { data: followers } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("vendor_id", vendorId);

  if (!followers?.length) return;

  const notifications = followers.map((follower) => ({
    user_id: follower.follower_id,
    type: "new_post",
    title,
    message,
    image_url: imageUrl,
    link_url: `/feed`,
  }));

  await supabase
    .from("notifications")
    .insert(notifications);
}