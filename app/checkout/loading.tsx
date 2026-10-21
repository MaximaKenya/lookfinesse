import Logo from "@/components/brand/Logo";

export default function CheckoutLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-black">
      <Logo variant="full" size="md" />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" aria-hidden />
    </div>
  );
}
