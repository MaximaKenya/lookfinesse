# Profile media storage setup

LookFinesse stores avatars, banners, and carousel media in the **`profile-media`** Supabase Storage bucket.

## Why manual setup?

Supabase **hosted** projects return `must be owner of table objects` when you run `ALTER TABLE storage.objects` or `CREATE POLICY` in the SQL Editor. Only a superuser can modify `storage.objects` via SQL.

Migration `019_profile_media_bucket.sql` only upserts the bucket row (when `INSERT INTO storage.buckets` is allowed). **Policies must be created in the Dashboard UI.**

---

## Step 1 — Create the `profile-media` bucket (Supabase Dashboard)

Follow every click below. You should land on a bucket named exactly **`profile-media`**.

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** and sign in.
2. Click your **LookFinesse project** (the one whose URL matches `NEXT_PUBLIC_SUPABASE_URL`).
3. In the **left sidebar**, click **Storage** (folder icon).
4. On the Storage page, click **New bucket** (top-right button).
5. In the **Create bucket** dialog:
   - **Name:** type `profile-media` (all lowercase, hyphen — must match exactly).
   - **Public bucket:** toggle **ON** (green). This allows public read URLs for profile images.
   - **File size limit:** enter `52428800` (50 MB in bytes).
   - **Allowed MIME types:** add each type, or use wildcards if your project supports them:
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `image/gif`
     - `video/mp4`
     - `video/webm`
     - `video/quicktime`
     - *(Alternative: `image/*` and `video/*`)*
6. Click **Create bucket** (or **Save**).

> **Screenshot (expected):** The Storage buckets list shows a row **`profile-media`** with a **Public** badge, file size limit **50 MB**, and allowed MIME types for images/videos.

---

## Step 2 — Add four RLS policies (Supabase Dashboard)

Policies control who can read, upload, update, and delete files. Create **four separate policies** on bucket `profile-media`.

### Open the policy editor

1. **Storage** → click the bucket row **`profile-media`**.
2. Open the **Policies** tab (sometimes under **Configuration → Policies**).
3. Click **New policy**.
4. Choose **For full customization** (opens the policy editor with SQL fields).

Repeat steps 3–4 for each policy below.

---

### Policy 1 — Public read

| Field | Value |
|-------|--------|
| **Policy name** | `profile_media_public_read` |
| **Allowed operation** | `SELECT` |
| **Target roles** | `public` *(or leave default for anon + authenticated)* |
| **USING expression** | see SQL below |
| **WITH CHECK** | *(leave empty for SELECT)* |

**SQL for policy editor (USING):**

```sql
bucket_id = 'profile-media'
```

> **Screenshot (expected):** Policies tab lists `profile_media_public_read` with operation **SELECT**.

---

### Policy 2 — Authenticated upload

| Field | Value |
|-------|--------|
| **Policy name** | `profile_media_auth_insert` |
| **Allowed operation** | `INSERT` |
| **Target roles** | `authenticated` |
| **USING expression** | *(leave empty for INSERT)* |
| **WITH CHECK expression** | see SQL below |

**SQL for policy editor (WITH CHECK):**

```sql
bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text
```

> **Screenshot (expected):** Policy `profile_media_auth_insert` with operation **INSERT**.

---

### Policy 3 — Authenticated update (own folder)

| Field | Value |
|-------|--------|
| **Policy name** | `profile_media_auth_update` |
| **Allowed operation** | `UPDATE` |
| **Target roles** | `authenticated` |
| **USING expression** | see SQL below |
| **WITH CHECK** | *(same as USING, or leave default)* |

**SQL for policy editor (USING):**

```sql
bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text
```

---

### Policy 4 — Authenticated delete (own folder)

| Field | Value |
|-------|--------|
| **Policy name** | `profile_media_auth_delete` |
| **Allowed operation** | `DELETE` |
| **Target roles** | `authenticated` |
| **USING expression** | see SQL below |

**SQL for policy editor (USING):**

```sql
bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text
```

> **Screenshot (expected):** Policies tab listing **four** policies on `profile-media`: SELECT, INSERT, UPDATE, DELETE.

Copy-paste friendly definitions also live on [/help/storage](/help/storage).

---

## Step 3 — Verify upload on `/profile/edit`

1. **Sign in** to the LookFinesse app (e.g. `user@test.com` / `Test123456!`).
2. Open **Profile** → **Edit profile** (`/profile/edit`).
3. Upload an **avatar** or **banner** (JPEG/PNG/WebP under 10 MB for images).
4. Confirm the image appears on your profile after save.
5. In Supabase Dashboard → **Storage** → **`profile-media`**, open the folder named with your **user UUID** — you should see `{your-user-uuid}/avatar-…` or similar.

> **Screenshot (expected):** Dashboard Storage shows files under `{uuid}/…`; the app profile page shows the new avatar/banner.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **`Bucket not found`** / `The resource was not found` | Bucket never created, or wrong name | Repeat **Step 1**. Name must be exactly `profile-media`. Optionally run migration `019` for the bucket row only. |
| **`Upload failed`** (generic) | Network, file too large, or wrong MIME | Check file is under **50 MB** (video) / **10 MB** (images, client limit). Use allowed MIME types from Step 1. |
| **`new row violates row-level security policy`** / **RLS denied** | Missing policies or wrong upload path | Complete **Step 2** (all four policies). Upload path must start with `{your-user-id}/` — the app does this automatically on `/profile/edit`. |
| **`must be owner of table objects`** | Policy SQL run in SQL Editor | Do **not** create storage policies via SQL Editor on hosted Supabase — use the Dashboard UI (**Step 2**). |
| Image uploads but **404 on URL** | Bucket not public | Enable **Public bucket** on `profile-media` (Step 1). |

In-app help: [/help/storage](/help/storage)
