import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAppointmentsByPhone } from "@/lib/appointments.functions";
import { 
  Calendar, 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Search,
  ChevronRight
} from "lucide-react";

export const Route = createFileRoute("/my-appointments")({
  head: () => ({
    meta: [
      { title: "My Appointments — Dental House" },
      { name: "description", content: "Search and view your booked appointments and access your tickets at Dental House." },
      { name: "robots", content: "noindex" }
    ],
  }),
  component: MyAppointmentsPage,
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
  status: string;
  payment_status: string;
  created_at: string;
};

function MyAppointmentsPage() {
  const fetchByPhone = useServerFn(getAppointmentsByPhone);
  
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically load if a phone number was searched previously
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lastPhone = localStorage.getItem("dental_house_last_phone");
    if (lastPhone) {
      setPhoneInput(lastPhone);
      performSearch(lastPhone);
    }
  }, []);

  const performSearch = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 5) {
      setError("Please enter a valid phone number (at least 5 digits).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchByPhone({ data: cleanPhone });
      setAppointments(data as Appointment[]);
      setSearched(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("dental_house_last_phone", phone);
      }
    } catch (e) {
      console.error(e);
      setError("Could not retrieve appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(phoneInput);
  };

  const getStatusBadge = (status: string, payStatus: string) => {
    if (status === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
        </span>
      );
    } else if (status === "rejected" || payStatus === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
          <XCircle className="h-3.5 w-3.5" /> Declined
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          <Clock className="h-3.5 w-3.5" /> Pending
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-16 text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="text-base font-bold tracking-tight">My Appointments</h1>
          <div className="w-12"></div> {/* Spacer */}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Search Panel Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold">Find Your Tickets</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter the phone number used during booking to retrieve and track your appointments.
          </p>
          
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input 
                type="tel" 
                placeholder="e.g. 78599 41319" 
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full rounded-xl border border-input bg-background pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                required
              />
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm inline-flex items-center justify-center gap-1.5"
            >
              <Search className="h-4 w-4" />
              <span>{loading ? "Searching..." : "Search"}</span>
            </button>
          </form>

          {error && (
            <p className="mt-3 text-xs text-destructive font-medium">{error}</p>
          )}
        </div>

        {/* Display Results */}
        <div className="mt-8">
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-card">
              <div className="text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="mt-2 text-xs text-muted-foreground">Fetching your appointments...</p>
              </div>
            </div>
          ) : searched ? (
            appointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-base font-semibold">No Appointments Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We couldn't find any appointments linked to <strong>{phoneInput}</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Found {appointments.length} Appointment(s)
                </h3>
                <div className="space-y-3">
                  {appointments.map((appt) => {
                    const dateObj = appt.preferred_date ? new Date(appt.preferred_date) : null;
                    const formattedDate = dateObj 
                      ? dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                      : "Flexible Date";
                      
                    return (
                      <div 
                        key={appt.id} 
                        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(appt.status, appt.payment_status)}
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                Ticket: {appt.id.slice(0, 8)}
                              </span>
                            </div>
                            
                            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                              {appt.service}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>Patient: <strong>{appt.name}</strong></span>
                              <span>·</span>
                              <span>Doctor: {appt.doctor || "Dr. Zeal Vyas Pandya"}</span>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-xs font-medium w-fit">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{formattedDate}</span>
                              <span>·</span>
                              <span>{appt.preferred_time || "Flexible"}</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Link 
                              to="/ticket" 
                              search={{ appointment_id: appt.id }}
                              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-input bg-background px-4 py-2.5 text-xs font-semibold hover:bg-accent transition"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>View Ticket</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground text-sm">
              <Calendar className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
              Enter your phone number above to search and display your appointment tickets.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
