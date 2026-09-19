import { redirect } from "next/navigation";

/** Alias — Gym Buddy lives at /ai/fitness */
export default function GymBuddyRedirect() {
  redirect("/ai/fitness");
}
