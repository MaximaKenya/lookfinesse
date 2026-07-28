import Link from "next/link";

const POLICIES = [
  {
    name: "profile_media_public_read",
    operation: "SELECT",
    roles: "public (anon + authenticated)",
    using: "bucket_id = 'profile-media'",
    check: null,
  },
  {
    name: "profile_media_auth_insert",
    operation: "INSERT",
    roles: "authenticated",
    using: null,
    check: "bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text",
  },
  {
    name: "profile_media_auth_update",
    operation: "UPDATE",
    roles: "authenticated",
    using: "bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text",
    check: null,
  },
  {
    name: "profile_media_auth_delete",
    operation: "DELETE",
    roles: "authenticated",
    using: "bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text",
    check: null,
  },
] as const;

const TROUBLESHOOTING = [
  {
    symptom: "Bucket missing",
    cause: "Bucket never created or wrong name",
    fix: "Create bucket exactly named profile-media (Step 1). Run migration 019 if needed for the bucket row.",
  },
  {
    symptom: "Upload failed",
    cause: "File too large or unsupported MIME type",
    fix: "Use JPEG/PNG/WebP/GIF or MP4/WebM under 50 MB. Check allowed MIME types on the bucket.",
  },
  {
    symptom: "RLS denied / row-level security",
    cause: "Missing policies or wrong folder path",
    fix: "Add all four policies (Step 2). Files must live under {your-user-uuid}/ — automatic on /profile/edit.",
  },
  {
    symptom: "must be owner of table objects",
    cause: "Policy SQL run in SQL Editor",
    fix: "Use Dashboard → Storage → Policies UI, not SQL Editor, on hosted Supabase.",
  },
] as const;

function CopyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-emerald-200/90 font-mono leading-relaxed">
        {value}
      </pre>
    </div>
  );
}

export default function StorageSetupPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-24">
      <Link href="/profile/edit" className="text-sm text-white/70 hover:text-white transition-colors">
        ← Back to profile edit
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile media storage</h1>
        <p className="text-sm text-white/70 leading-relaxed">
          Hosted Supabase cannot alter <code className="text-purple-300">storage.objects</code> via SQL
          Editor. Create the <code className="text-purple-300">profile-media</code> bucket and four
          policies manually — follow each step below.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold text-white text-lg">Step 1 — Create the bucket</h2>
        <ol className="list-decimal list-inside space-y-2.5 text-sm text-white/70 leading-relaxed">
          <li>Open <strong className="text-white">Supabase Dashboard</strong> → your project.</li>
          <li>Left sidebar → click <strong className="text-white">Storage</strong>.</li>
          <li>Click <strong className="text-white">New bucket</strong> (top right).</li>
          <li>
            Name: <code className="text-amber-200">profile-media</code> · Public:{" "}
            <strong className="text-white">ON</strong> · Size limit:{" "}
            <code className="text-amber-200">52428800</code> (50 MB)
          </li>
          <li>
            Allowed MIME: <code className="text-amber-200">image/jpeg</code>,{" "}
            <code className="text-amber-200">image/png</code>,{" "}
            <code className="text-amber-200">image/webp</code>,{" "}
            <code className="text-amber-200">image/gif</code>,{" "}
            <code className="text-amber-200">video/mp4</code>,{" "}
            <code className="text-amber-200">video/webm</code>,{" "}
            <code className="text-amber-200">video/quicktime</code>
          </li>
          <li>Click <strong className="text-white">Create bucket</strong>.</li>
        </ol>
        <p className="text-xs text-white/50 border-l-2 border-purple-500/40 pl-3">
          Expected: Storage list shows <strong className="text-white/70">profile-media</strong> with a{" "}
          <strong className="text-white/70">Public</strong> badge.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-3">
        <h2 className="font-semibold text-white text-lg">Step 2 — Add four policies</h2>
        <p className="text-sm text-white/60">
          Storage → <code className="text-purple-300">profile-media</code> → Policies → New policy →
          For full customization. Copy each SQL block into USING or WITH CHECK.
        </p>
      </section>

      <section className="space-y-6">
        {POLICIES.map((policy, i) => (
          <div
            key={policy.name}
            className="rounded-3xl border border-white/10 bg-[#0a0a0a]/80 p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white/40">Policy {i + 1}</span>
              <code className="text-sm font-bold text-amber-200">{policy.name}</code>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {policy.operation}
              </span>
              <span className="text-xs text-white/60">{policy.roles}</span>
            </div>
            {policy.using && <CopyBlock label="USING" value={policy.using} />}
            {policy.check && <CopyBlock label="WITH CHECK" value={policy.check} />}
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-5 sm:p-6 space-y-3">
        <h2 className="font-semibold text-white text-lg">Step 3 — Verify on /profile/edit</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 leading-relaxed">
          <li>Sign in to the app.</li>
          <li>
            Go to{" "}
            <Link href="/profile/edit" className="text-emerald-300 hover:underline">
              /profile/edit
            </Link>{" "}
            and upload an avatar or banner.
          </li>
          <li>In Dashboard → Storage → profile-media, confirm files under your user UUID folder.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-white text-lg">Troubleshooting</h2>
        <div className="space-y-3">
          {TROUBLESHOOTING.map((row) => (
            <div
              key={row.symptom}
              className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-1"
            >
              <p className="text-sm font-semibold text-rose-200">{row.symptom}</p>
              <p className="text-xs text-white/50">{row.cause}</p>
              <p className="text-sm text-white/70">{row.fix}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
