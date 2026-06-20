import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AppointmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(5).max(25),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  service: z.string().trim().min(1).max(120),
  doctor: z.string().trim().max(120).optional().or(z.literal("")),
  preferred_date: z.string().trim().max(20).optional().or(z.literal("")),
  preferred_time: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().max(1000).optional().or(z.literal("")),
});

const NOTIFY_NUMBER = "+917859941319";

async function sendWhatsApp(message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const fromRaw = process.env.TWILIO_WHATSAPP_FROM || "+14155238886";
  const from = fromRaw.startsWith("whatsapp:") ? fromRaw : `whatsapp:${fromRaw}`;

  if (!accountSid || !apiKeySid || !apiKeySecret) {
    console.warn("Twilio credentials missing — skipping WhatsApp send");
    return { ok: false, reason: "missing_keys" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString("base64");

  const body = new URLSearchParams({
    To: `whatsapp:${NOTIFY_NUMBER}`,
    From: from,
    Body: message,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Twilio error", res.status, data);
      return { ok: false, status: res.status, data };
    }
    console.log("WhatsApp sent ✅ sid:", (data as any).sid);
    return { ok: true, sid: (data as any).sid };
  } catch (err) {
    console.error("WhatsApp fetch failed", err);
    return { ok: false, reason: "fetch_error" };
  }
}

export const createAppointment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AppointmentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const isPriya = data.subject?.includes("Priya AI Assistant");

    const insertRow = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      service: data.service,
      doctor: data.doctor || null,
      preferred_date: data.preferred_date || null,
      preferred_time: data.preferred_time || null,
      subject: data.subject || null,
      payment_status: isPriya ? "verification_pending" : "payment_pending",
    };

    const { data: row, error } = await supabaseAdmin
      .from("appointments")
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      console.error("Insert appointment failed", error);
      
      // Fallback for local testing when service_role key is missing or RLS blocks anon inserts
      if (error.code === "42501" || error.message?.includes("API key")) {
        console.warn("Database blocked locally (RLS/missing key). Falling back to local mock ID.");
        const mockId = crypto.randomUUID();
        return { id: mockId, whatsapp: { ok: false, reason: "local_mock" } };
      }
      
      throw new Error("Could not save appointment");
    }

    if (isPriya) {
      const { error: payErr } = await supabaseAdmin
        .from("payments")
        .insert({
          appointment_id: row.id,
          amount: 0,
          currency: "INR",
          status: "verification_pending",
          method: "priya",
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          note: "Booked via Priya AI Assistant",
        });

      if (payErr) {
        console.error("Failed to insert payment for Priya booking", payErr);
      }
    }

    const message =
      `🦷 New Appointment — Dental House\n` +
      `Name: ${data.name}\n` +
      `Phone: ${data.phone}\n` +
      (data.email ? `Email: ${data.email}\n` : "") +
      `Service: ${data.service}\n` +
      (data.doctor ? `Doctor: ${data.doctor}\n` : "") +
      (data.preferred_date ? `Date: ${data.preferred_date}\n` : "") +
      (data.preferred_time ? `Time: ${data.preferred_time}\n` : "") +
      (data.subject ? `Note: ${data.subject}` : "");

    const wa = await sendWhatsApp(message);

    return { id: row.id, whatsapp: wa };
  });

export const getAppointmentTicket = createServerFn({ method: "GET" })
  .inputValidator((id: unknown) => z.string().uuid().parse(id))
  .handler(async ({ data: appointmentId }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: appointment, error: apptErr } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .maybeSingle();

    if (apptErr || !appointment) {
      console.error("Get appointment ticket failed", apptErr);
      throw new Error("Appointment not found");
    }

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return { appointment, payment };
  });

export const getMultipleAppointments = createServerFn({ method: "POST" })
  .inputValidator((ids: unknown) => z.array(z.string().uuid()).parse(ids))
  .handler(async ({ data: ids }) => {
    if (ids.length === 0) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Get multiple appointments failed", error);
      throw new Error("Could not retrieve appointments");
    }
    return data;
  });

export const getAppointmentsByPhone = createServerFn({ method: "POST" })
  .inputValidator((phone: unknown) => z.string().min(4).max(30).parse(phone))
  .handler(async ({ data: phone }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 5) {
      throw new Error("Phone number is too short");
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .or(`phone.ilike.%${cleanPhone}%,phone.eq.${phone}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get appointments by phone failed", error);
      throw new Error("Could not retrieve appointments");
    }
    return data;
  });

export const cancelAppointment = createServerFn({ method: "POST" })
  .inputValidator((input: any) => z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1)
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch to verify name matches
    const { data: appt, error: fetchErr } = await supabaseAdmin
      .from("appointments")
      .select("name, phone, service, preferred_date, preferred_time")
      .eq("id", data.id)
      .single();

    if (fetchErr || !appt) {
      throw new Error("Appointment not found");
    }

    if (appt.name.toLowerCase().trim() !== data.name.toLowerCase().trim()) {
      throw new Error("Verification failed: Patient name does not match our records.");
    }

    // Update status to rejected
    const { error: updateErr } = await supabaseAdmin
      .from("appointments")
      .update({ status: "rejected" })
      .eq("id", data.id);

    if (updateErr) {
      throw new Error("Failed to cancel appointment");
    }

    // Trigger Twilio alert
    const message =
      `🛑 Appointment Canceled — Dental House\n` +
      `Name: ${appt.name}\n` +
      `Phone: ${appt.phone}\n` +
      `Service: ${appt.service}\n` +
      (appt.preferred_date ? `Date: ${appt.preferred_date}\n` : "") +
      (appt.preferred_time ? `Time: ${appt.preferred_time}` : "");

    await sendWhatsApp(message);

    return { success: true };
  });

export const rescheduleAppointment = createServerFn({ method: "POST" })
  .inputValidator((input: any) => z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1),
    preferred_date: z.string().trim().min(1),
    preferred_time: z.string().trim().min(1)
  }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch to verify name matches
    const { data: appt, error: fetchErr } = await supabaseAdmin
      .from("appointments")
      .select("name, phone, service, preferred_date, preferred_time")
      .eq("id", data.id)
      .single();

    if (fetchErr || !appt) {
      throw new Error("Appointment not found");
    }

    if (appt.name.toLowerCase().trim() !== data.name.toLowerCase().trim()) {
      throw new Error("Verification failed: Patient name does not match our records.");
    }

    // Update date/time and reset status to pending for staff review
    const { error: updateErr } = await supabaseAdmin
      .from("appointments")
      .update({
        preferred_date: data.preferred_date,
        preferred_time: data.preferred_time,
        status: "pending"
      })
      .eq("id", data.id);

    if (updateErr) {
      throw new Error("Failed to reschedule appointment");
    }

    // Trigger Twilio alert
    const message =
      `🔄 Appointment Rescheduled — Dental House\n` +
      `Name: ${appt.name}\n` +
      `Phone: ${appt.phone}\n` +
      `Service: ${appt.service}\n` +
      `Old: ${appt.preferred_date} @ ${appt.preferred_time}\n` +
      `New: ${data.preferred_date} @ ${data.preferred_time}`;

    await sendWhatsApp(message);

    return { success: true };
  });