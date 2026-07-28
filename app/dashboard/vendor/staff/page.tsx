"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Mail,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser } from "@/hooks/useCurrentUser";

type StaffRole = "admin" | "staff";

type StaffMember = {
  id: string;
  name: string;
  role?: string;
  email?: string;
  avatar_url?: string;
  is_active?: boolean;
  permissions?: string[];
};

const ROLE_OPTIONS: { value: StaffRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full vendor dashboard access" },
  { value: "staff", label: "Staff", description: "Orders, calendar & messaging" },
];

const PERMISSION_CHIPS: Record<StaffRole, string[]> = {
  admin: ["Orders", "Products", "Finance", "Calendar", "Settings"],
  staff: ["Orders", "Calendar", "Messages"],
};

export default function StaffManagementPage() {
  const { userId } = useCurrentUser();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", role: "staff" as StaffRole });

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/vendor/dashboard`)
      .then((r) => r.json())
      .then((data) => {
        const vid = data.vendor?.id;
        if (vid) {
          setVendorId(vid);
          fetch(`/api/staff?vendor_id=${vid}`)
            .then((r) => r.json())
            .then((rows) => setStaff(Array.isArray(rows) ? rows : []));
        }
      });
  }, [userId]);

  const inviteStaff = async () => {
    if (!vendorId || !invite.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: vendorId,
        name: invite.name,
        role: invite.role,
        email: invite.email,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStaff((prev) => [data, ...prev]);
      setInvite({ name: "", email: "", role: "staff" });
      setShowInvite(false);
      toast.success("Invitation sent!");
    } else {
      toast.error(data.error ?? "Failed to invite");
    }
    setLoading(false);
  };

  const deleteStaff = async (id: string) => {
    await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
    setStaff((prev) => prev.filter((s) => s.id !== id));
    toast.success("Team member removed");
  };

  const toggleActive = async (member: StaffMember) => {
    const res = await fetch("/api/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, is_active: !member.is_active }),
    });
    const data = await res.json();
    if (res.ok) setStaff((prev) => prev.map((s) => (s.id === member.id ? data : s)));
  };

  const resolveRole = (member: StaffMember): StaffRole =>
    member.role === "admin" ? "admin" : "staff";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-400/80">Team</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Staff & permissions</h1>
          <p className="text-sm text-white/70 leading-relaxed max-w-lg">
            Invite admins and staff to help run your storefront — roles control what each member can access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(!showInvite)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-black px-5 py-3 text-sm font-bold hover:bg-white/90 transition-all shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Invite member
        </button>
      </header>

      {showInvite && (
        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-pink-300" />
            <h2 className="font-semibold text-white">Invite team member</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={invite.name}
              onChange={(e) => setInvite({ ...invite, name: e.target.value })}
              placeholder="Full name *"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/40"
            />
            <input
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              placeholder="Email address"
              type="email"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/40"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLE_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setInvite({ ...invite, role: value })}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  invite.role === value
                    ? "border-pink-500/40 bg-pink-500/10 ring-1 ring-pink-500/20"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {value === "admin" ? (
                    <Crown className="h-4 w-4 text-amber-300" />
                  ) : (
                    <Shield className="h-4 w-4 text-cyan-300" />
                  )}
                  <span className="font-semibold text-white text-sm">{label}</span>
                </div>
                <p className="text-[11px] text-white/70 mt-1.5">{description}</p>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PERMISSION_CHIPS[invite.role].map((chip) => (
              <span
                key={chip}
                className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-white/70"
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={inviteStaff}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {loading ? "Sending…" : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-2xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team members
            <span className="text-white/50 font-normal">({staff.length})</span>
          </h2>
        </div>

        {staff.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 sm:p-14 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
              <Users className="h-7 w-7 text-white/40" />
            </div>
            <div>
              <p className="font-semibold text-white">No team members yet</p>
              <p className="text-sm text-white/70 mt-1 max-w-sm mx-auto leading-relaxed">
                Invite an admin or staff member to help manage orders, calendar, and customer messages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Invite your first member
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => {
              const role = resolveRole(member);
              return (
                <div
                  key={member.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl border p-4 sm:p-5 transition-all ${
                    member.is_active !== false
                      ? "border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl"
                      : "border-white/5 bg-black/40 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 text-lg font-bold text-white/70">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        member.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white truncate">{member.name}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                            role === "admin"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                              : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                          }`}
                        >
                          {role === "admin" ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          {role}
                        </span>
                      </div>
                      {member.email && (
                        <p className="text-xs text-white/60 truncate mt-0.5">{member.email}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {PERMISSION_CHIPS[role].map((chip) => (
                          <span
                            key={chip}
                            className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/8"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(member)}
                      className={`p-2.5 rounded-xl transition-all ${
                        member.is_active !== false
                          ? "text-emerald-400 hover:bg-emerald-400/10"
                          : "text-white/40 hover:bg-white/5"
                      }`}
                      aria-label={member.is_active !== false ? "Deactivate" : "Activate"}
                    >
                      {member.is_active !== false ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStaff(member.id)}
                      className="p-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
