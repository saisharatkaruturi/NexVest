import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import {
  User, Shield, Bell, CreditCard, Smartphone, FileText, ChevronLeft,
  Mail, Phone, MapPin, Key, Eye, EyeOff, Lock, Fingerprint, LogOut,
  Smartphone as PhoneIcon, Laptop, Trash2, Plus, Download, Copy, Check,
  Building2, Hash, Calendar, X,
} from "lucide-react";
import { useMarket } from "@/lib/market-store";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  validateSearch: (s: Record<string, unknown>) => ({ section: typeof s.section === "string" ? s.section : undefined }),
  component: Settings,
});

type Section = "profile" | "security" | "notifications" | "payments" | "devices" | "reports";

const SECTIONS = [
  { k: "profile", t: "Profile", d: "Name, email, mobile, PAN", i: User },
  { k: "security", t: "Security", d: "2FA, biometrics, sessions, password", i: Shield },
  { k: "notifications", t: "Notifications", d: "Push, SMS, email, WhatsApp", i: Bell },
  { k: "payments", t: "Payments & Bank", d: "UPI, bank accounts, autopay", i: CreditCard },
  { k: "devices", t: "Devices", d: "Logged-in devices, trusted devices", i: Smartphone },
  { k: "reports", t: "Reports & Statements", d: "Contract notes, ledger, tax P&L", i: FileText },
] as const;

function Settings() {
  const search = useSearch({ from: "/app/settings" });
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>((search.section as Section) ?? "profile");

  const select = (k: Section) => {
    setSection(k);
    navigate({ to: "/app/settings", search: { section: k }, replace: true });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate({ to: "/app" })} className="p-2 rounded-lg hover:bg-surface border border-border" title="Back"><ChevronLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account, security and preferences</p>
        </div>
      </div>
      <div className="grid md:grid-cols-[260px_1fr] gap-5">
        <div className="bg-card border border-border rounded-2xl p-2 h-fit md:sticky md:top-20">
          {SECTIONS.map((s) => {
            const Icon = s.i;
            return (
              <button
                key={s.k}
                onClick={() => select(s.k as Section)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition",
                  section === s.k ? "bg-primary/15 text-primary" : "hover:bg-surface"
                )}
              >
                <Icon className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{s.t}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{s.d}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="min-w-0">
          {section === "profile" && <ProfileSection />}
          {section === "security" && <SecuritySection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "payments" && <PaymentsSection />}
          {section === "devices" && <DevicesSection />}
          {section === "reports" && <ReportsSection />}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function ProfileSection() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [pan, setPan] = useState("ABCDE1234F");
  const [address, setAddress] = useState("12 MG Road, Bengaluru, KA 560001");
  const [dob, setDob] = useState("1995-08-15");

  const save = () => {
    if (user) updateUser({ ...user, name, email });
    toast.success("Profile updated", { description: "Changes saved to your account" });
  };

  const initials = (name || user?.name || "U").slice(0, 2).toUpperCase();

  return (
    <Section title="Profile information">
      <div className="flex items-center gap-4 pb-2">
        <div className="w-16 h-16 rounded-full bg-gradient-profit flex items-center justify-center text-primary-foreground text-xl font-bold">{initials}</div>
        <div className="flex-1">
          <div className="font-semibold">{name || user?.name || "—"}</div>
          <div className="text-xs text-muted-foreground">{email || user?.email || "—"}</div>
        </div>
        <button onClick={() => toast.info("Photo upload coming soon")} className="text-xs px-3 py-1.5 rounded-md bg-surface border border-border hover:border-primary/40">Change photo</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Row label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm" /></Row>
        <Row label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm" /></Row>
        <Row label="Mobile"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm" /></Row>
        <Row label="PAN"><input value={pan} onChange={(e) => setPan(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm uppercase" /></Row>
        <Row label="Date of birth"><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm" /></Row>
        <Row label="Address" hint="Used for KYC and tax documents"><input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm" /></Row>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={() => toast.info("No changes to save")} className="px-4 py-2 text-sm rounded-md bg-surface border border-border">Cancel</button>
        <button onClick={save} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold">Save changes</button>
      </div>
    </Section>
  );
}

function SecuritySection() {
  const { logout } = useAuth();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFA, setTwoFA] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <>
      <Section title="Password">
        <Row label="Current password">
          <div className="relative">
            <input type={showOld ? "text" : "password"} defaultValue="••••••••" className="w-full h-10 px-3 pr-10 rounded-lg bg-surface border border-border text-sm font-mono" />
            <button onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Row>
        <Row label="New password" hint="At least 8 characters, with numbers and symbols">
          <div className="relative">
            <input type={showNew ? "text" : "password"} placeholder="Create a strong password" className="w-full h-10 px-3 pr-10 rounded-lg bg-surface border border-border text-sm" />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Row>
        <button onClick={() => toast.success("Password updated")} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold">Update password</button>
      </Section>

      <div className="h-3" />
      <Section title="Two-factor authentication">
        <Toggle label="2FA via authenticator app" hint="Use Google Authenticator / Authy for sign-in" value={twoFA} onChange={setTwoFA} icon={Key} />
        <Toggle label="Biometric login" hint="Face ID / fingerprint for quick access" value={biometric} onChange={setBiometric} icon={Fingerprint} />
        <Toggle label="Login alerts" hint="Get notified on every new sign-in" value={loginAlerts} onChange={setLoginAlerts} icon={Bell} />
        <button onClick={() => toast.success("Backup codes regenerated", { description: "Save these in a secure place." })} className="text-xs text-primary hover:underline">Regenerate backup codes</button>
      </Section>

      <div className="h-3" />
      <Section title="Session">
        <button onClick={() => { logout(); toast.info("Logged out of this device"); }} className="px-4 py-2 text-sm rounded-md bg-loss/10 text-loss border border-loss/30 hover:bg-loss/20 flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sign out of this device
        </button>
      </Section>
    </>
  );
}

function Toggle({ label, hint, value, onChange, icon: Icon }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void; icon: any }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
        <div>
          <div className="text-sm font-semibold">{label}</div>
          {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
        </div>
      </div>
      <button
        onClick={() => { onChange(!value); toast.success(`${label} ${!value ? "enabled" : "disabled"}`); }}
        className={cn("w-10 h-6 rounded-full transition relative shrink-0", value ? "bg-primary" : "bg-surface border border-border")}
      >
        <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition", value ? "left-[18px]" : "left-0.5")} />
      </button>
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    push: { orders: true, price: true, news: false, sip: true },
    sms: { orders: true, price: false, news: false, sip: false },
    email: { orders: true, price: true, news: true, sip: true },
    whatsapp: { orders: false, price: false, news: false, sip: true },
  });

  const toggle = (ch: keyof typeof prefs, k: string) => {
    setPrefs((p) => ({ ...p, [ch]: { ...p[ch], [k]: !p[ch][k as keyof typeof p[typeof ch]] } }));
    toast.success("Preference updated");
  };

  const channels: { k: keyof typeof prefs; t: string; i: any }[] = [
    { k: "push", t: "Push (in-app)", i: Bell },
    { k: "sms", t: "SMS", i: PhoneIcon },
    { k: "email", t: "Email", i: Mail },
    { k: "whatsapp", t: "WhatsApp", i: PhoneIcon },
  ];
  const events: { k: string; l: string }[] = [
    { k: "orders", l: "Order execution & rejections" },
    { k: "price", l: "Price alerts" },
    { k: "news", l: "Market news & research" },
    { k: "sip", l: "SIP, auto-debit & renewals" },
  ];

  return (
    <Section title="Notification channels">
      <div className="text-xs text-muted-foreground">Choose which events you want to receive on which channel.</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium pb-3">Event</th>
              {channels.map((c) => (
                <th key={c.k} className="text-center font-medium pb-3">
                  <div className="flex flex-col items-center gap-1">
                    <c.i className="w-4 h-4" />
                    <span>{c.t}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.k} className="border-t border-border">
                <td className="py-3 text-sm">{e.l}</td>
                {channels.map((c) => (
                  <td key={c.k} className="text-center">
                    <button
                      onClick={() => toggle(c.k, e.k)}
                      className={cn("w-5 h-5 rounded border-2 inline-flex items-center justify-center", prefs[c.k][e.k as keyof typeof prefs[typeof c.k]] ? "bg-primary border-primary" : "border-border bg-surface")}
                    >
                      {prefs[c.k][e.k as keyof typeof prefs[typeof c.k]] && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function PaymentsSection() {
  const [banks, setBanks] = useState([
    { id: "b1", name: "HDFC Bank", acc: "•••• 4582", primary: true, upi: "shara@hdfc" },
    { id: "b2", name: "ICICI Bank", acc: "•••• 7910", primary: false, upi: "shara@icici" },
  ]);
  const [autopay, setAutopay] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newBank, setNewBank] = useState({ name: "", acc: "", ifsc: "" });

  const setPrimary = (id: string) => {
    setBanks((bs) => bs.map((b) => ({ ...b, primary: b.id === id })));
    toast.success("Primary bank updated");
  };
  const remove = (id: string) => {
    setBanks((bs) => bs.filter((b) => b.id !== id));
    toast.success("Bank account removed");
  };
  const addBank = () => {
    if (!newBank.name || !newBank.acc || !newBank.ifsc) { toast.error("All fields required"); return; }
    setBanks((bs) => [...bs, { id: `b-${Date.now()}`, name: newBank.name, acc: `•••• ${newBank.acc.slice(-4)}`, primary: bs.length === 0, upi: `${newBank.acc.slice(-4).toLowerCase()}@${newBank.name.toLowerCase().split(" ")[0]}` }]);
    setNewBank({ name: "", acc: "", ifsc: "" });
    setShowAdd(false);
    toast.success("Bank account added");
  };

  return (
    <>
      <Section title="Bank accounts">
        <div className="space-y-2">
          {banks.map((b) => (
            <div key={b.id} className="flex items-center gap-3 bg-surface/40 border border-border rounded-xl p-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center"><Building2 className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {b.name} {b.primary && <span className="text-[9px] px-1.5 py-0.5 rounded bg-profit/15 text-profit font-semibold">PRIMARY</span>}
                </div>
                <div className="text-xs text-muted-foreground">A/c {b.acc} · UPI {b.upi}</div>
              </div>
              {!b.primary && (
                <button onClick={() => setPrimary(b.id)} className="text-xs px-2.5 py-1.5 rounded-md bg-surface border border-border hover:border-primary/40">Set primary</button>
              )}
              <button onClick={() => remove(b.id)} className="p-1.5 text-loss hover:bg-loss/10 rounded" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        {showAdd ? (
          <div className="bg-surface/40 border border-border rounded-xl p-3 space-y-2">
            <input value={newBank.name} onChange={(e) => setNewBank({ ...newBank, name: e.target.value })} placeholder="Bank name" className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newBank.acc} onChange={(e) => setNewBank({ ...newBank, acc: e.target.value })} placeholder="Account number" className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm" />
              <input value={newBank.ifsc} onChange={(e) => setNewBank({ ...newBank, ifsc: e.target.value.toUpperCase() })} placeholder="IFSC" className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm uppercase" />
            </div>
            <div className="flex gap-2">
              <button onClick={addBank} className="flex-1 h-9 text-xs rounded-md bg-primary text-primary-foreground font-semibold">Add bank</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 h-9 text-xs rounded-md bg-surface border border-border">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="w-full py-2.5 text-sm rounded-xl border border-dashed border-border hover:border-primary/40 flex items-center justify-center gap-1.5 text-muted-foreground">
            <Plus className="w-4 h-4" /> Add bank account
          </button>
        )}
      </Section>

      <div className="h-3" />
      <Section title="Autopay & UPI">
        <Toggle label="Auto-debit for SIPs" hint="Bills debit 5 days before due date" value={autopay} onChange={setAutopay} icon={Calendar} />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-surface/40 border border-border rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Default UPI</div>
            <div className="font-mono text-sm font-semibold">shara@hdfc</div>
          </div>
          <div className="bg-surface/40 border border-border rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">UPI daily limit</div>
            <div className="font-mono text-sm font-semibold">₹1,00,000</div>
          </div>
        </div>
      </Section>
    </>
  );
}

function DevicesSection() {
  const [devices, setDevices] = useState([
    { id: "d1", name: "iPhone 15 Pro", os: "iOS 18.1", location: "Bengaluru, IN", lastActive: "Active now", current: true, trusted: true },
    { id: "d2", name: "MacBook Air M2", os: "macOS 15.1 · Chrome 132", location: "Bengaluru, IN", lastActive: "2h ago", current: false, trusted: true },
    { id: "d3", name: "iPad Pro 12.9", os: "iPadOS 18.0", location: "Mumbai, IN", lastActive: "3d ago", current: false, trusted: false },
  ]);

  const toggleTrust = (id: string) => {
    setDevices((ds) => ds.map((d) => d.id === id ? { ...d, trusted: !d.trusted } : d));
    toast.success("Device trust updated");
  };
  const remove = (id: string) => {
    setDevices((ds) => ds.filter((d) => d.id !== id));
    toast.success("Device removed");
  };

  return (
    <Section title="Logged-in devices">
      <div className="text-xs text-muted-foreground">Devices where you are currently signed in. Remove any you don't recognize.</div>
      <div className="space-y-2">
        {devices.map((d) => (
          <div key={d.id} className="flex items-center gap-3 bg-surface/40 border border-border rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              {d.os.startsWith("iOS") || d.os.startsWith("iPadOS") ? <PhoneIcon className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2">
                {d.name} {d.current && <span className="text-[9px] px-1.5 py-0.5 rounded bg-profit/15 text-profit font-semibold">THIS DEVICE</span>}
              </div>
              <div className="text-xs text-muted-foreground">{d.os} · {d.location} · {d.lastActive}</div>
            </div>
            <button onClick={() => toggleTrust(d.id)} className={cn("text-xs px-2.5 py-1.5 rounded-md border", d.trusted ? "bg-profit/10 text-profit border-profit/30" : "bg-surface border-border")}>
              {d.trusted ? "Trusted" : "Trust"}
            </button>
            {!d.current && (
              <button onClick={() => remove(d.id)} className="p-1.5 text-loss hover:bg-loss/10 rounded" title="Sign out"><X className="w-3.5 h-3.5" /></button>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => { setDevices([devices[0]]); toast.success("All other devices signed out"); }} className="text-xs text-loss hover:underline">Sign out of all other devices</button>
    </Section>
  );
}

function ReportsSection() {
  const reports = [
    { id: "r1", t: "Contract notes", d: "Apr 2026", n: 28, size: "412 KB" },
    { id: "r2", t: "Equity statement", d: "FY 2025-26", n: 142, size: "1.2 MB" },
    { id: "r3", t: "Tax P&L (realized)", d: "FY 2025-26", n: 1, size: "84 KB" },
    { id: "r4", t: "Mutual fund capital gains", d: "FY 2025-26", n: 1, size: "62 KB" },
    { id: "r5", t: "Dividend report", d: "FY 2025-26", n: 1, size: "18 KB" },
  ];

  return (
    <Section title="Reports & statements">
      <div className="text-xs text-muted-foreground">Download contract notes, ledger statements, and tax P&L reports for filing.</div>
      <div className="space-y-2">
        {reports.map((r) => (
          <div key={r.id} className="flex items-center gap-3 bg-surface/40 border border-border rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center"><FileText className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{r.t}</div>
              <div className="text-xs text-muted-foreground">{r.d} · {r.n} {r.n === 1 ? "item" : "items"} · {r.size}</div>
            </div>
            <button onClick={() => toast.success(`${r.t} download started`)} className="p-2 text-info hover:bg-info/10 rounded-md" title="Download"><Download className="w-4 h-4" /></button>
            <button onClick={() => { navigator.clipboard?.writeText(`nexvest://reports/${r.id}`); toast.success("Report link copied"); }} className="p-2 text-muted-foreground hover:bg-surface rounded-md" title="Copy link"><Copy className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 pt-2">
        <button onClick={() => toast.success("Email statement sent")} className="px-4 py-2.5 text-sm rounded-xl bg-surface border border-border hover:border-primary/40 flex items-center justify-center gap-2">
          <Mail className="w-4 h-4" /> Email all reports
        </button>
        <button onClick={() => toast.success("Tax P&L PDF generated")} className="px-4 py-2.5 text-sm rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
          <Download className="w-4 h-4" /> Download tax P&L
        </button>
      </div>
    </Section>
  );
}
