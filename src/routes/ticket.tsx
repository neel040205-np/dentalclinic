import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { getAppointmentTicket } from "@/lib/appointments.functions";
import { 
  Printer, 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  FileText,
  ShieldAlert
} from "lucide-react";

export const Route = createFileRoute("/ticket")({
  head: () => ({
    meta: [
      { title: "Appointment Ticket — Dental House" },
      { name: "description", content: "View and print your appointment ticket for Dental House." },
      { name: "robots", content: "noindex" }
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    appointment_id: typeof s.appointment_id === "string" ? s.appointment_id : undefined,
  }),
  component: TicketPage,
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
  status: string;
  method: string;
  utr: string | null;
  created_at: string;
};

function TicketPage() {
  const { appointment_id } = Route.useSearch();
  const fetchTicket = useServerFn(getAppointmentTicket);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  
  const ticketRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!appointment_id) {
      setError("No appointment ID was provided. Please book an appointment first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchTicket({ data: appointment_id })
      .then((res) => {
        setAppointment(res.appointment as Appointment);
        setPayment(res.payment as Payment | null);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not retrieve appointment details. Please make sure the appointment ID is correct.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [appointment_id]);

  // Generate QR Code containing the ticket URL
  useEffect(() => {
    if (!appointment) return;
    const ticketUrl = window.location.href;
    QRCode.toDataURL(ticketUrl, { width: 256, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => setQrCodeUrl(url))
      .catch((e) => console.error("Ticket QR generation failed", e));
  }, [appointment]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading your appointment ticket...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Appointment Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || "Something went wrong."}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/appointment" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Book a New Appointment
            </Link>
            <Link to="/" className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Determine status display details
  const getStatusDisplay = () => {
    const status = appointment.status;
    const payStatus = appointment.payment_status;

    if (status === "confirmed" && payStatus === "cod_pending") {
      return {
        title: "Appointment Confirmed ✓",
        description: "Please pay the consultation fee in cash when you arrive at the clinic.",
        bannerClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      };
    } else if (status === "confirmed") {
      return {
        title: "Appointment Confirmed ✓",
        description: "Your booking and payment have been verified. We look forward to seeing you!",
        bannerClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      };
    } else if (payStatus === "verification_pending") {
      return {
        title: "Verification Pending",
        description: "Your payment proof has been submitted. Our staff will verify it shortly and confirm your slot.",
        bannerClass: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        icon: <Clock className="h-5 w-5 text-amber-700" />,
      };
    } else if (status === "rejected" || payStatus === "rejected") {
      return {
        title: "Booking Declined",
        description: "There was an issue verifying your payment or slot. Please contact the clinic at +91 78599 41319.",
        bannerClass: "bg-destructive/10 text-destructive border-destructive/20",
        icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
      };
    } else {
      return {
        title: "Pending Booking",
        description: "Your appointment has been registered and is pending verification.",
        bannerClass: "bg-blue-500/10 text-blue-700 border-blue-500/20",
        icon: <AlertCircle className="h-5 w-5 text-blue-700" />,
      };
    }
  };

  const statusDisplay = getStatusDisplay();
  const formattedDate = appointment.preferred_date 
    ? new Date(appointment.preferred_date).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-muted/30 pb-12 text-foreground">
      {/* CSS style block specifically to control printing and ensure it prints beautifully */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          header, footer, .no-print {
            display: none !important;
          }
          .print-container {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .ticket-card {
            border: 2px dashed #000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: 600px !important;
            background: white !important;
          }
        }
      `}} />

      {/* Header (Hidden on print) */}
      <header className="no-print border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dental House</span>
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-xl px-4 py-6 sm:py-10 print-container">
        {/* Banner/Status Message (Hidden on print) */}
        <div className={`no-print mb-6 rounded-xl border p-4 flex gap-3 items-start ${statusDisplay.bannerClass}`}>
          <div className="mt-0.5 shrink-0">{statusDisplay.icon}</div>
          <div>
            <h2 className="font-bold text-sm sm:text-base">{statusDisplay.title}</h2>
            <p className="mt-1 text-xs sm:text-sm opacity-90">{statusDisplay.description}</p>
          </div>
        </div>

        {/* The Ticket Card */}
        <div 
          ref={ticketRef} 
          className="ticket-card relative overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-shadow"
        >
          {/* Clinic Header */}
          <div className="bg-primary p-6 text-primary-foreground text-center">
            <h1 className="text-2xl font-bold tracking-tight">Dental House</h1>
            <p className="text-xs uppercase tracking-widest opacity-90 mt-1">Dental Clinic & Maxillofacial Surgeon</p>
            <p className="text-[10px] opacity-75 mt-1">Lunawada, Mahisagar, Gujarat</p>
          </div>

          {/* Tear Line Decor (Left and Right Circular Cuts) */}
          <div className="relative h-px border-t border-dashed border-border/80 my-0">
            <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-muted/30 border border-border/60"></div>
            <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-muted/30 border border-border/60"></div>
          </div>

          {/* Ticket Body */}
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Appointment Ticket</span>
                <h2 className="text-lg font-semibold mt-0.5">{appointment.service}</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ticket No.</span>
                <p className="font-mono text-xs font-semibold mt-0.5 text-primary uppercase">{appointment.id.slice(0, 8)}</p>
              </div>
            </div>

            {/* Main Info Blocks */}
            <div className="grid gap-4 sm:grid-cols-2 border-t border-b border-border/50 py-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Patient</span>
                    <span className="text-sm font-semibold">{appointment.name}</span>
                    <span className="block text-xs text-muted-foreground font-mono mt-0.5">{appointment.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Doctor</span>
                    <span className="text-sm font-semibold">{appointment.doctor || "Dr. Zeal Vyas Pandya"}</span>
                    <span className="block text-[10px] text-primary font-medium mt-0.5">MDS Maxillofacial Surgeon</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Date</span>
                    <span className="text-sm font-semibold">{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Time Slot</span>
                    <span className="text-sm font-semibold">{appointment.preferred_time || "Morning (9:30 AM onwards)"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Status Section */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Payment Details</span>
                    <span className="text-sm font-semibold">
                      ₹{payment ? (payment.amount / 100).toFixed(2) : "200.00"}
                    </span>
                    <span className="block text-xs text-muted-foreground capitalize mt-0.5">
                      Method: {payment?.method === "cod" ? "Cash at Clinic" : "UPI Payment"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:justify-end gap-4">
                {qrCodeUrl && (
                  <div className="flex flex-col items-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="Ticket URL QR Code" 
                      className="h-16 w-16 rounded border border-border bg-white p-0.5" 
                    />
                    <span className="text-[8px] uppercase font-bold text-muted-foreground mt-1">Scan to Verify</span>
                  </div>
                )}
              </div>
            </div>

            {/* Note/Subject if present */}
            {appointment.subject && (
              <div className="border-t border-border/50 pt-4">
                <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Patient Note</span>
                <p className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-lg border border-border/30">
                  "{appointment.subject}"
                </p>
              </div>
            )}
            
            {/* Appointment Status Info */}
            <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 flex justify-between items-center text-xs">
              <div className="flex gap-2 items-center">
                <span className="font-bold text-muted-foreground uppercase text-[9px]">Status:</span>
                <span className={`inline-block rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase ${
                  appointment.status === "confirmed" 
                    ? "bg-emerald-100 text-emerald-800" 
                    : appointment.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {appointment.status}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-bold text-muted-foreground uppercase text-[9px]">Payment:</span>
                <span className={`inline-block rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase ${
                  appointment.payment_status === "confirmed" || appointment.payment_status === "paid"
                    ? "bg-emerald-100 text-emerald-800" 
                    : appointment.payment_status === "cod_pending"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {appointment.payment_status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="border-t border-border/50 pt-4 text-[10px] text-muted-foreground space-y-1">
              <p className="font-bold uppercase text-foreground">Clinic Guidelines:</p>
              <p>• Please show this ticket at the clinic reception upon arrival.</p>
              <p>• Arrive 10 minutes before your scheduled slot to complete registration.</p>
              <p>• For cancellations or rescheduling, call us at +91 78599 41319.</p>
            </div>
          </div>

          {/* Footer of the ticket card */}
          <div className="bg-muted border-t border-border/50 p-4 text-center text-[10px] text-muted-foreground">
            <div className="flex items-center justify-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>Kisan School Lane, Near Bus Station, Lunawada, Gujarat — 389230</span>
            </div>
          </div>
        </div>

        {/* Buttons underneath ticket (Hidden on print) */}
        <div className="no-print mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            type="button" 
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition shadow-sm"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
          <Link 
            to="/" 
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-5 py-3 font-medium hover:bg-accent transition"
          >
            Go back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
