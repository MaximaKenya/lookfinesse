import AnimatedLogo from "@/components/brand/AnimatedLogo";

export default function CheckoutLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-black">
      <AnimatedLogo className="h-auto w-40" />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" aria-hidden />
    </div>
  );
}
