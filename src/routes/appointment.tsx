import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createAppointment } from "@/lib/appointments.functions";

export const Route = createFileRoute("/appointment")({
  head: () => ({
    meta: [
      { title: "Book Appointment — Dental House" },
      { name: "description", content: "Book an appointment at Dental House, Lunawada. Choose your specialist and preferred time." },
    ],
  }),
  component: AppointmentPage,
});

const SPECIALIST_SERVICES = [
  "Mouth Cancer Consultation/Surgery",
  "Oral Fracture Treatment",
  "Wisdom Tooth Surgery",
  "Hair Transplant",
  "Dental Implants",
];
const GENERAL_DENTAL_SERVICES = [
  "Root Canal Treatment (RCT)",
  "Braces Treatment",
  "Teeth Cleaning & Polishing",
  "Cementations (Cavity Fillings)",
  "Dental Cap & Bridges",
  "Dentures",
  "Pediatric Dental Procedure",
];

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "16:30",
];

function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

function AppointmentPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const submit = useServerFn(createAppointment);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: SPECIALIST_SERVICES[0],
    doctor: "Dr. Zeal Vyas Pandya (MDS, PGDHM)",
    preferred_date: "",
    preferred_time: TIME_SLOTS[0],
    subject: "",
  });
  const [captcha, setCaptcha] = useState<{ a: number; b: number; answer: number }>({ a: 0, b: 0, answer: 0 });
  useEffect(() => { setCaptcha(makeCaptcha()); }, []);
  const [captchaInput, setCaptchaInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allServices = useMemo(
    () => [...SPECIALIST_SERVICES, ...GENERAL_DENTAL_SERVICES],
    [],
  );

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (Number(captchaInput) !== captcha.answer) {
      setError("Captcha is incorrect. Please try again.");
      setCaptcha(makeCaptcha());
      setCaptchaInput("");
      return;
    }
    if (!/^[0-9+\-\s()]{5,20}$/.test(form.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submit({ data: form });
      router.invalidate();
      
      // Save appointment ID to localStorage so user can view it in "My Appointments"
      if (typeof window !== "undefined") {
        try {
          const existing = JSON.parse(localStorage.getItem("dental_house_booked_ids") || "[]");
          if (Array.isArray(existing) && !existing.includes(res.id)) {
            existing.push(res.id);
            localStorage.setItem("dental_house_booked_ids", JSON.stringify(existing));
          }
        } catch (e) {
          console.error("Failed to save appointment ID to localStorage", e);
        }
      }

      navigate({
        to: "/pay",
        search: {
          appointment_id: res.id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          service: form.service,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Could not submit. Please try again or call the clinic.");
      setCaptcha(makeCaptcha());
      setCaptchaInput("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Dental House</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Make an Appointment</h1>
        <p className="mt-2 text-muted-foreground">
          Fill out the form below. We'll send a confirmation to the clinic on WhatsApp.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name *">
              <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Phone *">
              <input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Service *">
              <select required value={form.service} onChange={(e) => update("service", e.target.value)} className={inputCls}>
                <optgroup label="Specialist Services">
                  {SPECIALIST_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
                <optgroup label="General & Cosmetic Dentistry">
                  {GENERAL_DENTAL_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
              </select>
            </Field>
            <Field label="Preferred Doctor">
              <select value={form.doctor} onChange={(e) => update("doctor", e.target.value)} className={inputCls}>
                <option>Dr. Zeal Vyas Pandya (MDS, PGDHM)</option>
                <option>No preference</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Preferred Date">
              <input type="date" value={form.preferred_date} onChange={(e) => update("preferred_date", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Preferred Time">
              <select value={form.preferred_time} onChange={(e) => update("preferred_time", e.target.value)} className={inputCls}>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Subject / Notes">
            <textarea rows={3} value={form.subject} onChange={(e) => update("subject", e.target.value)} className={inputCls} placeholder="Briefly describe your concern (optional)" />
          </Field>

          <Field label={`Captcha — what is ${captcha.a} + ${captcha.b}? *`}>
            <input
              required
              inputMode="numeric"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              className={inputCls}
            />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Book Appointment"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            By submitting, you agree to be contacted by the clinic to confirm your appointment.
          </p>
        </form>
      </main>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
    </label>
  );
}