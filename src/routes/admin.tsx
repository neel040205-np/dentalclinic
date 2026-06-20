import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { approvePayment, rejectPayment, getPaymentScreenshotUrl } from "@/lib/payments.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Clinic Admin — Appointments & Payments" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Appointment = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  doctor: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  subject: string | null;
  status: string;
  payment_status: string;
  created_at: string;
};

type Payment = {
  id: string;
  appointment_id: string | null;
  amount: number;
  amount_paid: number | null;
  currency: string;
  status: string;
  method: string;
  upi_vpa: string | null;
  payee_vpa: string | null;
  utr: string | null;
  screenshot_path: string | null;
  proof_notes: string | null;
  rejection_reason: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
};

function AdminPage() {
  const [session, setSession] = useState<null | { email?: string }>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tab, setTab] = useState<"pending" | "appointments" | "payments">("pending");
  const [loading, setLoading] = useState(false);

  const approveFn = useServerFn(approvePayment);
  const rejectFn = useServerFn(rejectPayment);
  const getScreenshotFn = useServerFn(getPaymentScreenshotUrl);
  const [screenshotUrls, setScreenshotUrls] = useState<Record<string, string>>({});
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { email: data.session.user.email } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s ? { email: s.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: appts }, { data: pays }] = await Promise.all([
      supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false }),
      supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false }),
    ]);
    if (appts) setAppointments(appts as Appointment[]);
    if (pays) setPayments(pays as Payment[]);
    setLoading(false);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("appointments").update({ status }).eq("id", id);
    loadData();
  }

  async function loadScreenshot(p: Payment) {
    if (!p.screenshot_path || screenshotUrls[p.id]) return;
    try {
      const { url } = await getScreenshotFn({ data: { path: p.screenshot_path } });
      setScreenshotUrls((m) => ({ ...m, [p.id]: url }));
    } catch (e) {
      console.error("Load screenshot failed", e);
    }
  }

  async function approve(p: Payment) {
    setActionBusy(p.id);
    try {
      await approveFn({ data: { payment_id: p.id } });
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Could not approve payment.");
    } finally {
      setActionBusy(null);
    }
  }

  async function reject(p: Payment) {
    const reason = window.prompt("Reason for rejection (optional)") ?? undefined;
    setActionBusy(p.id);
    try {
      await rejectFn({ data: { payment_id: p.id, reason: reason || undefined } });
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Could not reject payment.");
    } finally {
      setActionBusy(null);
    }
  }

  const pendingPayments = payments.filter((p) => p.status === "verification_pending");

  useEffect(() => {
    pendingPayments.forEach((p) => { void loadScreenshot(p); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <form onSubmit={signIn} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Home</Link>
          <h1 className="mt-2 text-2xl font-bold">Clinic Staff Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to view appointments.</p>
          <div className="mt-6 space-y-3">
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {authError && <p className="text-xs text-destructive">{authError}</p>}
            <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Sign In</button>
            <p className="text-center text-xs text-muted-foreground">Staff accounts are provisioned by the clinic administrator.</p>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Home</Link>
            <h1 className="text-xl font-bold">Appointments</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{session.email}</span>
            <button onClick={signOut} className="rounded-md border border-input px-3 py-1.5 hover:bg-accent">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab("pending")}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === "pending" ? "bg-primary text-primary-foreground" : "border border-input hover:bg-accent"}`}
            >
              Pending Verification ({pendingPayments.length})
            </button>
            <button
              onClick={() => setTab("appointments")}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === "appointments" ? "bg-primary text-primary-foreground" : "border border-input hover:bg-accent"}`}
            >
              Appointments ({appointments.length})
            </button>
            <button
              onClick={() => setTab("payments")}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === "payments" ? "bg-primary text-primary-foreground" : "border border-input hover:bg-accent"}`}
            >
              Payments ({payments.length})
            </button>
          </div>
          <button onClick={loadData} className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        {tab === "pending" && (
          <div className="space-y-4">
            {pendingPayments.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                No payments awaiting verification.
              </div>
            )}
            {pendingPayments.map((p) => {
              const appt = appointments.find((a) => a.id === p.appointment_id);
              const url = screenshotUrls[p.id];
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <div className="text-base font-semibold">{p.name || appt?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{p.phone || appt?.phone || ""}{p.email ? ` · ${p.email}` : ""}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                      </div>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                        <Field label="Service" value={appt?.service || p.note || "—"} />
                        <Field label="Slot" value={appt ? `${appt.preferred_date || "—"}${appt.preferred_time ? ` · ${appt.preferred_time}` : ""}` : "—"} />
                        <Field label="Doctor" value={appt?.doctor || "—"} />
                        <Field label="Amount expected" value={`${p.currency} ${(p.amount / 100).toFixed(2)}`} />
                        <Field label="Amount paid" value={p.amount_paid != null ? `${p.currency} ${(p.amount_paid / 100).toFixed(2)}` : "—"} />
                        <Field label="UTR" value={p.utr || "—"} mono />
                      </dl>
                      {p.proof_notes && (
                        <p className="rounded-md border border-border bg-muted/40 p-2 text-xs">Notes: {p.proof_notes}</p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => approve(p)}
                          disabled={actionBusy === p.id}
                          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {actionBusy === p.id ? "Working…" : "Approve Payment"}
                        </button>
                        <button
                          onClick={() => reject(p)}
                          disabled={actionBusy === p.id}
                          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        >
                          Reject Payment
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Screenshot</div>
                      {p.screenshot_path ? (
                        url ? (
                          <a href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="Payment proof" className="w-full rounded-md border border-border" />
                          </a>
                        ) : (
                          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                            Loading…
                          </div>
                        )
                      ) : (
                        <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground bg-muted/20 gap-1.5 p-4 text-center">
                          <span>No screenshot required</span>
                          <span className="text-[10px] text-muted-foreground/75">
                            {p.method === "priya" ? "Chatbot Booking" : "Cash on Arrival"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === "appointments" && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Service</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Slot</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No appointments yet.</td></tr>
              )}
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 align-top">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.phone}{a.email ? ` · ${a.email}` : ""}</div>
                  </td>
                  <td className="p-3">{a.service}</td>
                  <td className="p-3">{a.doctor || "—"}</td>
                  <td className="p-3 whitespace-nowrap">{a.preferred_date || "—"}{a.preferred_time ? ` · ${a.preferred_time}` : ""}</td>
                  <td className="p-3 max-w-[220px]">{a.subject || "—"}</td>
                  <td className="p-3"><PaymentStatusBadge status={a.payment_status} /></td>
                  <td className="p-3">
                    <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {tab === "payments" && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Payer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Method</th>
                <th className="p-3">Note</th>
                <th className="p-3">Appointment</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No payments yet.</td></tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 align-top">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="font-medium">{p.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.phone || ""}{p.email ? ` · ${p.email}` : ""}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap font-medium">{p.currency} {(p.amount / 100).toFixed(2)}</td>
                  <td className="p-3"><PaymentStatusBadge status={p.status} /></td>
                  <td className="p-3 text-xs">
                    <div className="font-medium uppercase">{p.method}</div>
                    {p.utr && <div className="text-muted-foreground">UTR: {p.utr}</div>}
                  </td>
                  <td className="p-3 max-w-[200px]">{p.note || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{p.appointment_id ? p.appointment_id.slice(0, 8) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    verification_pending: "bg-amber-100 text-amber-800",
    payment_pending: "bg-slate-100 text-slate-700",
    rejected: "bg-red-100 text-red-700",
    cod_pending: "bg-blue-100 text-blue-700",
    pending: "bg-slate-100 text-slate-700",
    paid: "bg-emerald-100 text-emerald-700",
    refund_pending: "bg-purple-100 text-purple-700",
  };
  const cls = map[status] ?? "bg-slate-100 text-slate-700";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>{status.replace(/_/g, " ")}</span>;
}