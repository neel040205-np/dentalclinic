import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import receptionImg from "@/assets/reception.jpg";
import dentalChairImg from "@/assets/dental-chair.jpg";
import physioImg from "@/assets/physio-equipment.jpg";
import { useState } from "react";
import { MessageCircle, Phone, Calendar } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dental House — Dental Clinic, MDS Oral & Maxillofacial Surgeon and Hair Transplant Centre, Lunawada" },
      { name: "description", content: "Dental House in Lunawada run by Dr. Zeal Vyas Pandya (MDS, PGDHM), the first & only oral and maxillofacial surgeon in Mahisagar. Expert mouth cancer, oral fracture, wisdom tooth surgery, implants, and hair transplant." },
      { property: "og:title", content: "Dental House — Dental, Maxillofacial Surgery & Hair Transplant" },
      { property: "og:description", content: "Homely feeling to the patient with all painless procedures along with latest instruments in Lunawada, Mahisagar, Gujarat." },
    ],
  }),
  component: Index,
});

const PHONE = "+917859941319";
const WHATSAPP_TEXT = encodeURIComponent(
  "Hello Dental House, I'd like to book an appointment.",
);
const WHATSAPP_URL = `https://wa.me/917859941319?text=${WHATSAPP_TEXT}`;

const TREATMENTS = [
  {
    title: "Hair Transplant",
    desc: "Advanced hair restoration and follicular transplant procedures.",
    tag: "Hair",
  },
  {
    title: "Mouth Cancer Care",
    desc: "Early detection, biopsy, and specialist treatment for oral oncology.",
    tag: "Specialist",
  },
  {
    title: "Wisdom Tooth Surgery",
    desc: "Safe and painless surgical extraction of impacted wisdom teeth.",
    tag: "Specialist",
  },
  {
    title: "Oral Fracture Surgery",
    desc: "Emergency and elective maxillofacial trauma management.",
    tag: "Specialist",
  },
  {
    title: "Dental Implants",
    desc: "Permanent and natural-looking tooth replacement solution.",
    tag: "Dental",
  },
  {
    title: "Root Canal Treatment (RCT)",
    desc: "Painless single-sitting procedures along with latest rotary endodontic instruments.",
    tag: "Dental",
  },
];

const REVIEWS = [
  {
    name: "divyesh patel",
    rating: 5,
    text: "Highly recommend her services for anyone seeking quality dental care.. 🙏🏽",
  },
  {
    name: "Harshit Patel",
    rating: 5,
    text: "Gr8 service n best experience @Lunawada",
  },
  {
    name: "PR Patel",
    rating: 5,
    text: "Best treatment given at this small town by Dr. Zeal vyas and there staff!!!",
  },
];

const FAQS = [
  {
    q: "What is an Oral and Maxillofacial Surgeon?",
    a: "It is a specialized branch of dentistry focusing on diagnosing and surgically treating diseases, injuries, and defects in the mouth, jaw, face, and neck, such as mouth cancer, facial fractures, and wisdom teeth.",
  },
  {
    q: "Is root canal treatment painful?",
    a: "We perform all procedures, including RCT, using modern techniques and advanced instruments to ensure a homely and completely painless experience.",
  },
  {
    q: "What methods do you use for Hair Transplant?",
    a: "We utilize advanced and safe hair restoration techniques tailored to the individual's needs, offering natural-looking results under the expert care of Dr. Zeal Vyas Pandya.",
  },
  {
    q: "Do you accept walk-ins?",
    a: "Yes, walk-ins are welcome during clinic hours (Mon–Sat, 9:30 AM onwards). We strongly recommend booking ahead to avoid waiting.",
  },
  {
    q: "What are the consultation charges?",
    a: "Initial consultation is affordable and transparent. Please call us at +91 78599 41319 for the current fee and any treatment estimate.",
  },
];

function Index() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="bg-gradient-to-r from-violet-600 via-primary to-indigo-600 text-white text-center py-2.5 px-4 text-xs sm:text-sm font-medium tracking-wide flex items-center justify-center gap-2 shadow-sm border-b border-primary/20">
        <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white mr-1 animate-pulse">New</span>
        <span>Now book, reschedule, or cancel with AI Assistant Priya! Click the phone call icon on the bottom right.</span>
      </div>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Lunawada, Gujarat</p>
            <h1 className="text-lg font-bold leading-tight">Dental House</h1>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm">
            <a href="#services" className="hidden sm:inline text-muted-foreground hover:text-foreground">Services</a>
            <a href="#reviews" className="hidden sm:inline text-muted-foreground hover:text-foreground">Reviews</a>
            <a href="#faq" className="hidden sm:inline text-muted-foreground hover:text-foreground">FAQs</a>
            <a href="#about" className="hidden sm:inline text-muted-foreground hover:text-foreground">About</a>
            <a href="#contact" className="hidden sm:inline text-muted-foreground hover:text-foreground">Contact</a>
            <Link to="/my-appointments" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
              <Calendar className="h-4 w-4" />
              <span>My Appointments</span>
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-border bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center items-center text-center md:items-start md:text-left">
            <span className="mb-3 inline-block w-fit rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              ★ 4.9 · 219 Google reviews
            </span>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              Dental House
            </h2>
            <p className="mt-2 text-sm text-primary uppercase font-semibold tracking-wider">
              Dental Clinic, MDS Oral & Maxillofacial Surgeon & Hair Transplant Centre
            </p>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              Dental House suggests a homely feeling to the patient with all painless procedures along with latest instruments. Run by Mahisagar district's first and only oral & maxillofacial surgeon.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-3 w-full">
              <Link to="/appointment" className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">
                Book an Appointment
              </Link>
              <a href={`tel:${PHONE}`} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-6 py-3 font-medium hover:bg-accent">
                <Phone className="h-4 w-4" /> Call Now
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 py-3 font-medium text-white hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" /> Book on WhatsApp
              </a>
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              Mon–Sat · 9:30 AM onwards &nbsp;·&nbsp; Sunday Closed
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Our Specialist</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-4 rounded-xl border border-border p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">ZP</div>
                <div>
                  <p className="font-semibold">Dr. Zeal Vyas Pandya <span className="text-xs text-muted-foreground">MDS, PGDHM</span></p>
                  <p className="text-xs font-semibold text-primary mt-0.5">First & Only Oral & Maxillofacial Surgeon of Mahisagar District</p>
                  <p className="text-sm text-muted-foreground mt-2">Work experience of more than 10 years. Formerly at Sola Civil Hospital (Ahmedabad), GCRI Hospital (Ahmedabad), Civil Hospital (Lunawada). Consultant at multiple multispeciality hospitals.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Gallery */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold">Inside Our Clinic</h2>
          <p className="mt-2 text-muted-foreground">A look at our homely setup and latest clinical instruments.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { src: receptionImg, label: "Reception & Waiting Area" },
              { src: dentalChairImg, label: "Modern Dental & Surgical Setup" },
              { src: physioImg, label: "Advanced Medical Equipment" },
            ].map((img) => (
              <figure key={img.label} className="overflow-hidden rounded-2xl border border-border bg-card">
                <img
                  src={img.src}
                  alt={img.label}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="px-4 py-3 text-sm font-medium">{img.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">Our Services</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-semibold text-primary">Specialist Services</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Mouth Cancer Consultation & Surgery</li>
              <li>• Oral Fracture Treatment</li>
              <li>• Wisdom Tooth Surgery</li>
              <li>• Hair Transplant</li>
              <li>• Dental Implants</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-semibold">Other Services Provided</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Root Canal Treatment (RCT)</li>
              <li>• Braces Treatment</li>
              <li>• Teeth Cleaning and Polishing</li>
              <li>• Cementations (Cavity Fillings)</li>
              <li>• Cap & Bridges</li>
              <li>• Denture</li>
              <li>• Pediatric Dental Procedures</li>
            </ul>
          </div>
        </div>

        {/* Treatment-specific cards */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold">Popular Treatments</h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TREATMENTS.map((t) => (
              <div key={t.title} className="rounded-2xl border border-border bg-card p-5 transition hover:shadow-md">
                <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  {t.tag}
                </span>
                <h4 className="mt-3 text-lg font-semibold">{t.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                <Link to="/appointment" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Book this treatment →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">What Our Patients Say</h2>
              <p className="mt-2 text-muted-foreground">
                <span className="font-semibold text-foreground">★ 4.9</span> · Based on 219 Google reviews
              </p>
            </div>
            <a
              href="https://www.google.com/search?q=Dental+house+-+Dental+Clinic,+MDS+oral+and+maxillofacial+surgeon+and+Hair+Transplant+centre+Lunawada"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              View all reviews on Google
            </a>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <article key={r.name} className="rounded-2xl border border-border bg-card p-5">
                <div className="text-yellow-500" aria-label={`${r.rating} star rating`}>
                  {"★".repeat(r.rating)}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">"{r.text}"</p>
                <p className="mt-4 text-sm font-semibold">— {r.name}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold">About Dental House</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Dr. Zeal Vyas Pandya (MDS, PGDHM) is the first and only oral and maxillofacial surgeon of Mahisagar district with work experience of more than 10 years. She has worked with prestigious institutes like Sola Civil Hospital (Ahmedabad), GCRI Hospital (Ahmedabad), Civil Hospital (Lunawada), and is a consultant at many other multispeciality hospitals.
          </p>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Dental House is designed to suggest a homely feeling to patients, ensuring completely painless procedures utilizing the latest medical instruments.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">Visit Us</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold">Address</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Kisan school lane, near bus station,<br />Chintamani Parshawanath Society,<br />Lunawada, Gujarat — 389230
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold">Hours</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Mon – Sat: 9:30 AM onwards<br />Sunday: Closed
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold">Phone</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <a href={`tel:${PHONE}`} className="text-primary hover:underline">+91 78599 41319</a>
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#25D366] hover:underline"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Google Map */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <iframe
            title="Dental House — Lunawada Map"
            src="https://www.google.com/maps?q=Dental+house+-+Dental+Clinic+Kisan+school+lane+near+bus+station+Chintamani+Parshawanath+Society+Lunawada+Gujarat+389230&output=embed"
            width="100%"
            height="360"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <div className="mt-10 rounded-2xl bg-primary p-8 text-primary-foreground">
          <h3 className="text-2xl font-semibold">Ready to book a visit?</h3>
          <p className="mt-2 opacity-90">Fill out the form and we'll confirm your slot on WhatsApp.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/appointment" className="rounded-md bg-background px-6 py-3 font-medium text-foreground hover:bg-background/90">
              Make an Appointment
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-6 py-3 font-medium text-white hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> Book on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between items-center gap-4 px-4 py-8 text-sm text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Dental House, Lunawada.
          </div>
          <div className="flex gap-4">
            <Link to="/my-appointments" className="hover:text-foreground">My Appointments</Link>
            <span>·</span>
            <Link to="/admin" className="hover:text-foreground">Staff Login</Link>
          </div>
        </div>
      </footer>

      {/* Floating contact buttons */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
        <a
          href={`tel:${PHONE}`}
          aria-label="Call clinic"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105"
        >
          <Phone className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium">{q}</span>
        <span className="text-xl leading-none text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="px-5 pb-5 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}
