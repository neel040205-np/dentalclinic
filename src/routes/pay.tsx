import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { submitPaymentProof, confirmCashOnArrival } from "@/lib/payments.functions";

const CLINIC_UPI_VPA = "neelpatelnp.2502@oksbi";
const CLINIC_PAYEE_NAME = "Dental House";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "Confirm Booking — Dental House" },
      { name: "description", content: "Pay your consultation fee via UPI and submit payment proof to confirm your appointment." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    appointment_id: typeof s.appointment_id === "string" ? s.appointment_id : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
    phone: typeof s.phone === "string" ? s.phone : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
  }),
  component: PayPage,
});

function PayPage() {
  const navigate = useNavigate();
  const submitProof = useServerFn(submitPaymentProof);
  const confirmCod = useServerFn(confirmCashOnArrival);
  const { appointment_id, name: nameQ, phone: phoneQ, email: emailQ, service: serviceQ } = Route.useSearch();

  const [mode, setMode] = useState<"choose" | "upi" | "cod" | "done">("choose");
  const [amountRupees, setAmountRupees] = useState("200");
  const note = serviceQ ? `${serviceQ} — consultation fee` : "Consultation fee";

  const [utr, setUtr] = useState("");
  const [amountPaid, setAmountPaid] = useState("200");
  const [proofNotes, setProofNotes] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rupees = Math.max(0, Number(amountRupees) || 0);
  const amountPaise = Math.round(rupees * 100);

  const upiUrl = useMemo(() => {
    const params = new URLSearchParams({
      pa: CLINIC_UPI_VPA,
      pn: CLINIC_PAYEE_NAME,
      am: rupees.toFixed(2),
      cu: "INR",
      tn: note.slice(0, 80),
    });
    return `upi://pay?${params.toString()}`;
  }, [rupees, note]);

  useEffect(() => {
    if (mode !== "upi") return;
    let cancelled = false;
    QRCode.toDataURL(upiUrl, { width: 512, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch((e) => console.error("QR generation failed", e));
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, upiUrl, { width: 512, margin: 2 }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [upiUrl, mode]);

  async function copyVpa() {
    try {
      await navigator.clipboard.writeText(CLINIC_UPI_VPA);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {/* noop */}
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `dental-house-upi-qr-${rupees}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function shareQr() {
    if (!qrDataUrl) return;
    try {
      const blob = await (await fetch(qrDataUrl)).blob();
      const file = new File([blob], "dental-house-upi-qr.png", { type: "image/png" });
      const navAny = navigator as unknown as { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title?: string }) => Promise<void> };
      if (navAny.canShare && navAny.canShare({ files: [file] }) && navAny.share) {
        await navAny.share({ files: [file], title: "Dental House UPI QR" });
        return;
      }
    } catch {/* fall through */}
    downloadQr();
  }

  async function onSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!utr.trim()) { setError("UTR / Transaction Reference is required."); return; }
    if (!screenshot) { setError("Please upload your payment screenshot."); return; }
    if (screenshot.size > 5 * 1024 * 1024) { setError("Screenshot must be 5 MB or smaller."); return; }
    const paidRupees = Math.max(0, Number(amountPaid) || 0);
    if (paidRupees < 1) { setError("Enter the amount you paid."); return; }
    setBusy(true);
    try {
      const ext = screenshot.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(path, screenshot, {
        cacheControl: "3600",
        upsert: false,
        contentType: screenshot.type || "image/png",
      });
      if (up.error) throw new Error(up.error.message);
      await submitProof({
        data: {
          appointment_id,
          amount: amountPaise,
          amount_paid: Math.round(paidRupees * 100),
          utr: utr.trim(),
          screenshot_path: path,
          name: nameQ,
          phone: phoneQ,
          email: emailQ,
          note,
          proof_notes: proofNotes.trim() || undefined,
        },
      });
      navigate({ to: "/ticket", search: { appointment_id } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not submit payment proof.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function confirmCodBooking() {
    setError(null);
    setBusy(true);
    try {
      await confirmCod({
        data: {
          appointment_id,
          amount: amountPaise,
          name: nameQ, phone: phoneQ, email: emailQ,
          note: `${note} (Cash on Arrival)`,
        },
      });
      navigate({ to: "/ticket", search: { appointment_id } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not confirm booking.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Confirm Booking</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold">Confirm your booking</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Choose how you'd like to pay the consultation fee.
          {nameQ ? <> Booking for <strong>{nameQ}</strong>{serviceQ ? <> — {serviceQ}</> : null}.</> : null}
        </p>

        {mode === "done" && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-emerald-600">Submitted ✓</h2>
            <p className="mt-2 text-sm text-muted-foreground">{doneMsg}</p>
            <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Back to home
            </Link>
          </div>
        )}

        {mode !== "done" && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <label className="block text-sm font-medium">
              Amount (INR) *
              <input
                required
                type="number"
                min={1}
                step="1"
                value={amountRupees}
                onChange={(e) => { setAmountRupees(e.target.value); setAmountPaid(e.target.value); }}
                className={inputCls}
                disabled={busy}
              />
            </label>

            {mode === "choose" && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setMode("upi")}
                  className="rounded-xl border border-border bg-background p-5 text-left hover:border-primary hover:bg-accent transition"
                >
                  <div className="text-base font-semibold">Pay via UPI</div>
                  <div className="mt-1 text-xs text-muted-foreground">Scan QR & submit payment proof</div>
                </button>
                <button
                  onClick={() => setMode("cod")}
                  className="rounded-xl border border-border bg-background p-5 text-left hover:border-primary hover:bg-accent transition"
                >
                  <div className="text-base font-semibold">Cash on Arrival</div>
                  <div className="mt-1 text-xs text-muted-foreground">Pay in person at the clinic</div>
                </button>
              </div>
            )}

            {mode === "upi" && (
              <div className="mt-6 space-y-6">
                {/* QR Code */}
                <div className="rounded-xl border border-border bg-background p-4 sm:p-6">
                  <div className="flex flex-col items-center">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="UPI QR code for Dental House"
                        className="w-full max-w-[280px] sm:max-w-[320px] rounded-lg border border-border bg-white p-2"
                      />
                    ) : (
                      <canvas ref={canvasRef} className="w-full max-w-[280px] sm:max-w-[320px] rounded-lg border border-border bg-white p-2" />
                    )}
                    <div className="mt-4 w-full">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground text-center">Clinic UPI ID</div>
                      <div className="mt-1 flex items-stretch gap-2">
                        <div className="flex-1 truncate rounded-md border border-input bg-muted/40 px-3 py-2 text-sm font-mono">
                          {CLINIC_UPI_VPA}
                        </div>
                        <button
                          type="button"
                          onClick={copyVpa}
                          className="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid w-full grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={downloadQr}
                        disabled={!qrDataUrl}
                        className="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                      >
                        Download QR
                      </button>
                      <button
                        type="button"
                        onClick={shareQr}
                        disabled={!qrDataUrl}
                        className="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                      >
                        Save QR Image
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <ol className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                  <li><span className="font-medium">Step 1:</span> Scan the QR or save the screenshot.</li>
                  <li><span className="font-medium">Step 2:</span> Pay <strong>₹{rupees}</strong> using any UPI app (GPay, PhonePe, Paytm, BHIM, etc).</li>
                  <li><span className="font-medium">Step 3:</span> Copy the UTR / Transaction ID from your payment app.</li>
                  <li><span className="font-medium">Step 4:</span> Return here and submit the payment proof below.</li>
                </ol>

                {/* Proof form */}
                <form onSubmit={onSubmitProof} className="space-y-4 border-t border-border pt-5">
                  <h3 className="text-base font-semibold">Submit payment proof</h3>

                  <label className="block text-sm font-medium">
                    UTR / Transaction Reference Number *
                    <input
                      required
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="e.g. 123456789012"
                      className={inputCls}
                      disabled={busy}
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Payment Screenshot *
                    <input
                      required
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                      className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                      disabled={busy}
                    />
                    <span className="mt-1 block text-xs text-muted-foreground">Max 5 MB. JPG or PNG.</span>
                  </label>

                  <label className="block text-sm font-medium">
                    Amount Paid (INR) *
                    <input
                      required
                      type="number"
                      min={1}
                      step="1"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className={inputCls}
                      disabled={busy}
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Notes (optional)
                    <textarea
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      rows={2}
                      placeholder="Any details we should know"
                      className={inputCls}
                      disabled={busy}
                    />
                  </label>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setMode("choose")}
                      className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
                      disabled={busy}
                    >
                      ← Change method
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {busy ? "Submitting…" : "Submit payment proof"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {mode === "cod" && (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  You'll pay <strong>₹{rupees}</strong> in cash when you arrive at the clinic.
                  Please confirm to lock your appointment slot.
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setMode("choose")}
                    className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
                    disabled={busy}
                  >
                    ← Change method
                  </button>
                  <button
                    type="button"
                    onClick={confirmCodBooking}
                    disabled={busy}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {busy ? "Confirming…" : "Confirm booking"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";