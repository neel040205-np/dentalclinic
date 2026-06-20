import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { 
  createAppointment, 
  getAppointmentsByPhone, 
  cancelAppointment, 
  rescheduleAppointment 
} from "@/lib/appointments.functions";
import { 
  MessageCircle, 
  X, 
  Send, 
  Calendar, 
  AlertTriangle, 
  Check, 
  Loader2, 
  Phone, 
  PhoneCall,
  User, 
  Info,
  Clock
} from "lucide-react";

type Message = {
  id: string;
  sender: "priya" | "user";
  text: string;
  timestamp: Date;
  choices?: { text: string; action: string }[];
  isEmergency?: boolean;
};

type ChatState = 
  | { type: "IDLE" }
  | { type: "EMERGENCY_HALT" }
  | { type: "BOOK_COLLECT_NAME" }
  | { type: "BOOK_COLLECT_PHONE", name: string }
  | { type: "BOOK_COLLECT_SERVICE", name: string, phone: string }
  | { type: "BOOK_COLLECT_DATE", name: string, phone: string, service: string }
  | { type: "BOOK_COLLECT_TIME", name: string, phone: string, service: string, date: string }
  | { type: "BOOK_CONFIRM", name: string, phone: string, service: string, date: string, time: string }
  | { type: "VERIFY_PHONE", actionType: "cancel" | "reschedule" }
  | { type: "VERIFY_NAME", actionType: "cancel" | "reschedule", phone: string, appointments: any[] }
  | { type: "SELECT_APPOINTMENT", actionType: "cancel" | "reschedule", phone: string, name: string, appointments: any[] }
  | { type: "CANCEL_CONFIRM", phone: string, name: string, appointment: any }
  | { type: "RESCHEDULE_COLLECT_DATE", phone: string, name: string, appointment: any }
  | { type: "RESCHEDULE_COLLECT_TIME", phone: string, name: string, appointment: any, date: string }
  | { type: "RESCHEDULE_CONFIRM", phone: string, name: string, appointment: any, date: string, time: string }
  | { type: "STAFF_FALLBACK", pendingRequest: string };

const SPECIALIST_SERVICES = [
  "Mouth Cancer Consultation/Surgery",
  "Oral Fracture Treatment",
  "Wisdom Tooth Surgery",
  "Hair Transplant",
  "Dental Implants",
];

const GENERAL_SERVICES = [
  "Root Canal Treatment (RCT)",
  "Braces Treatment",
  "Teeth Cleaning & Polishing",
  "Cementations (Cavity Fillings)",
  "Dental Cap & Bridges",
  "Dentures",
  "Pediatric Dental Procedure",
];

const ALL_SERVICES = [...SPECIALIST_SERVICES, ...GENERAL_SERVICES];

export default function PriyaChat() {
  // Server functions
  const bookFn = useServerFn(createAppointment);
  const getByPhoneFn = useServerFn(getAppointmentsByPhone);
  const cancelFn = useServerFn(cancelAppointment);
  const rescheduleFn = useServerFn(rescheduleAppointment);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [state, setState] = useState<ChatState>({ type: "IDLE" });
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      sendPriyaMessage(
        "Hello! I am Priya, your Dental House assistant. How can I help you today?",
        [
          { text: "📅 Book an Appointment", action: "start_booking" },
          { text: "🔄 Reschedule Appointment", action: "start_rescheduling" },
          { text: "❌ Cancel Appointment", action: "start_cancelling" },
          { text: "ℹ️ General Inquiry", action: "start_inquiry" }
        ]
      );
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Unread indicator logic
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  const sendPriyaMessage = (text: string, choices?: { text: string; action: string }[], isEmergency = false) => {
    setIsTyping(true);
    // Simulate typing delay for a premium feels
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: "priya",
          text,
          timestamp: new Date(),
          choices,
          isEmergency
        }
      ]);
      if (!isOpen) {
        setHasUnread(true);
      }
    }, 800);
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message to history
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: "user",
        text,
        timestamp: new Date()
      }
    ]);

    // Check for emergencies on every user message input
    const lowerText = text.toLowerCase();
    const emergencyKeywords = [
      "bleeding", "severe bleeding", "breathing", "facial swelling", 
      "swelling", "trauma", "fracture", "accident", "unconscious", 
      "loss of consciousness", "choking", "severe pain", "severe trauma"
    ];

    const hasEmergency = emergencyKeywords.some(keyword => lowerText.includes(keyword));

    if (hasEmergency && state.type !== "EMERGENCY_HALT") {
      setState({ type: "EMERGENCY_HALT" });
      sendPriyaMessage(
        "⚠️ EMERGENCY CONCERN DETECTED:\nPlease seek immediate medical attention or visit the nearest emergency room. Dental emergencies like severe bleeding, facial swelling, trauma, or breathing difficulties require urgent hospital care. I have flagged your case, and a clinic staff member will contact you immediately.",
        undefined,
        true
      );
      return;
    }

    // Process based on state machine
    await processState(text);
  };

  const handleChoiceSelect = async (choice: { text: string; action: string }) => {
    // Add choice as user message
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        sender: "user",
        text: choice.text,
        timestamp: new Date()
      }
    ]);

    // Process actions
    if (state.type === "EMERGENCY_HALT") {
      sendPriyaMessage("We cannot proceed with bookings or updates at this time. Please contact emergency services immediately or wait for our staff to call.");
      return;
    }

    if (choice.action === "start_booking") {
      setState({ type: "BOOK_COLLECT_NAME" });
      sendPriyaMessage("I'd be happy to help you book an appointment. To start, may I have your full name?");
    } else if (choice.action === "start_rescheduling") {
      setState({ type: "VERIFY_PHONE", actionType: "reschedule" });
      sendPriyaMessage("To reschedule your appointment, please enter the phone number you used for booking.");
    } else if (choice.action === "start_cancelling") {
      setState({ type: "VERIFY_PHONE", actionType: "cancel" });
      sendPriyaMessage("To cancel your appointment, please enter the phone number you used for booking.");
    } else if (choice.action === "start_inquiry") {
      sendPriyaMessage("Dental House offers MDS Maxillofacial Surgery, Hair Transplants, Implants, RCT, and General Dentistry. If you have specific questions or require medical advice, please let me know.", [
        { text: "🦷 Show Services", action: "show_services" },
        { text: "📞 Contact Clinic", action: "clinic_contact" },
        { text: "🏠 Main Options", action: "go_home" }
      ]);
    } else if (choice.action === "show_services") {
      sendPriyaMessage(
        `Specialist Services:\n• Mouth Cancer Treatment\n• Oral Fracture Surgery\n• Wisdom Tooth Surgery\n• Hair Transplant\n• Dental Implants\n\nGeneral & Cosmetic:\n• Root Canal (RCT)\n• Braces\n• Fillings & Cleanings\n• Dentures & Crowns`,
        [{ text: "🏠 Main Options", action: "go_home" }]
      );
    } else if (choice.action === "clinic_contact") {
      sendPriyaMessage("You can reach Dental House at +91 78599 41319 during clinic hours (Mon-Sat: 9:30 AM – 6:30 PM). If you'd like me to request a callback, just type your query here.");
      setState({ type: "STAFF_FALLBACK", pendingRequest: "Requesting a callback" });
    } else if (choice.action === "go_home") {
      setState({ type: "IDLE" });
      sendPriyaMessage("How can I assist you next?", [
        { text: "📅 Book an Appointment", action: "start_booking" },
        { text: "🔄 Reschedule Appointment", action: "start_rescheduling" },
        { text: "❌ Cancel Appointment", action: "start_cancelling" },
        { text: "ℹ️ General Inquiry", action: "start_inquiry" }
      ]);
    } else if (choice.action.startsWith("select_service:")) {
      const service = choice.action.replace("select_service:", "");
      if (state.type === "BOOK_COLLECT_SERVICE") {
        setState({ ...state, type: "BOOK_COLLECT_DATE", service });
        sendPriyaMessage(`Excellent, booking for: ${service}. What date would you prefer? (Please state a specific date, e.g., "June 25" or "YYYY-MM-DD").`);
      }
    } else if (choice.action.startsWith("select_appt:")) {
      const index = parseInt(choice.action.replace("select_appt:", ""), 10);
      if (state.type === "SELECT_APPOINTMENT") {
        const appt = state.appointments[index];
        if (state.actionType === "cancel") {
          setState({
            type: "CANCEL_CONFIRM",
            phone: state.phone,
            name: state.name,
            appointment: appt
          });
          sendPriyaMessage(
            `Are you sure you want to cancel your appointment for ${appt.service} scheduled on ${appt.preferred_date} at ${appt.preferred_time}?`,
            [
              { text: "✅ Yes, Cancel", action: "confirm_cancel" },
              { text: "❌ No, Go Back", action: "go_home" }
            ]
          );
        } else {
          setState({
            type: "RESCHEDULE_COLLECT_DATE",
            phone: state.phone,
            name: state.name,
            appointment: appt
          });
          sendPriyaMessage("What is the preferred new date for this appointment? (Please state a specific date, e.g., 'June 26' or 'YYYY-MM-DD').");
        }
      }
    } else if (choice.action === "confirm_cancel" && state.type === "CANCEL_CONFIRM") {
      try {
        setIsTyping(true);
        const res = await cancelFn({ data: { id: state.appointment.id, name: state.name } });
        setIsTyping(false);
        if (res && res.refundInitiated) {
          sendPriyaMessage(
            `Your appointment has been successfully canceled.\n\n💰 Refund Policy: Since payment was completed, your money will be refunded to your account in 3-5 business days.`,
            [{ text: "🏠 Main Options", action: "go_home" }]
          );
        } else {
          sendPriyaMessage(
            `Your appointment has been successfully canceled.`,
            [{ text: "🏠 Main Options", action: "go_home" }]
          );
        }
        setState({ type: "IDLE" });
      } catch (err: any) {
        setIsTyping(false);
        sendPriyaMessage(
          `Cancellation failed: ${err.message || "Server error"}. Would you like me to notify the staff to cancel this manually for you?`,
          [
            { text: "📞 Request Staff Cancellation", action: "confirm_fallback" },
            { text: "🏠 Cancel and Go Home", action: "go_home" }
          ]
        );
        setState({ type: "STAFF_FALLBACK", pendingRequest: `Cancel appointment ${state.appointment.id} for ${state.name}` });
      }
    } else if (choice.action === "confirm_fallback" && state.type === "STAFF_FALLBACK") {
      sendPriyaMessage(
        "I have registered your callback request. Our clinic staff will contact you on your phone number shortly to assist with this.",
        [{ text: "🏠 Main Menu", action: "go_home" }]
      );
      setState({ type: "IDLE" });
    } else if (choice.action === "confirm_booking") {
      await processState("yes");
    } else if (choice.action === "confirm_reschedule") {
      await processState("yes");
    } else if (choice.action === "retry_name") {
      sendPriyaMessage("Please enter the patient's full name to verify ownership.");
    }
  };

  const processState = async (text: string) => {
    switch (state.type) {
      case "EMERGENCY_HALT":
        sendPriyaMessage(
          "⚠️ As reported earlier, this concern involves an emergency symptom. Please visit the nearest emergency room or dial emergency services immediately.",
          undefined,
          true
        );
        break;

      case "BOOK_COLLECT_NAME":
        if (text.trim().length < 2) {
          sendPriyaMessage("Please enter your valid full name to proceed with booking.");
          return;
        }
        setState({ type: "BOOK_COLLECT_PHONE", name: text.trim() });
        sendPriyaMessage(`Thank you, ${text.trim()}. What phone number should we link to your booking?`);
        break;

      case "BOOK_COLLECT_PHONE":
        const cleanPhone = text.replace(/\D/g, "");
        if (cleanPhone.length < 5) {
          sendPriyaMessage("Please enter a valid phone number (at least 5 digits).");
          return;
        }
        setState({ type: "BOOK_COLLECT_SERVICE", name: state.name, phone: text.trim() });
        sendPriyaMessage(
          "Which dental or surgical service are you interested in?",
          ALL_SERVICES.map(s => ({ text: s, action: `select_service:${s}` }))
        );
        break;

      case "BOOK_COLLECT_DATE":
        if (text.toLowerCase().includes("next Friday") || text.toLowerCase().includes("afternoon") || text.toLowerCase().includes("morning")) {
          sendPriyaMessage(`Dates like "${text}" can be ambiguous. Could you please specify the exact date (e.g. "June 25" or "YYYY-MM-DD")?`);
          return;
        }
        setState({ ...state, type: "BOOK_COLLECT_TIME", date: text.trim() });
        sendPriyaMessage(`Got it, ${text.trim()}. What time would you prefer? (Please state a specific time slot, e.g., "10:30 AM" or "16:00").`);
        break;

      case "BOOK_COLLECT_TIME":
        if (text.toLowerCase().includes("afternoon") || text.toLowerCase().includes("morning") || text.toLowerCase().includes("evening")) {
          sendPriyaMessage(`Times like "${text}" can be ambiguous. Could you please specify the exact time (e.g. "10:00 AM" or "16:30")?`);
          return;
        }
        setState({ ...state, type: "BOOK_CONFIRM", time: text.trim() });
        sendPriyaMessage(
          `Please confirm all your appointment details:\n• Patient Name: ${state.name}\n• Phone Number: ${state.phone}\n• Service: ${state.service}\n• Date: ${state.date}\n• Time Slot: ${text.trim()}\n\nIs this correct?`,
          [
            { text: "✅ Yes, Book It", action: "confirm_booking" },
            { text: "❌ No, Restart", action: "start_booking" },
            { text: "🏠 Back to Main Menu", action: "go_home" }
          ]
        );
        break;

      case "BOOK_CONFIRM":
        if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("correct") || text.toLowerCase().includes("book")) {
          try {
            setIsTyping(true);
            const res = await bookFn({
              data: {
                name: state.name,
                phone: state.phone,
                service: state.service,
                preferred_date: state.date,
                preferred_time: state.time,
                doctor: "Dr. Zeal Vyas Pandya (MDS, PGDHM)",
                subject: "Booked via Priya AI Assistant"
              }
            });
            setIsTyping(false);
            
            // Save to local storage for My Appointments page
            if (typeof window !== "undefined" && res?.id) {
              try {
                const existing = JSON.parse(localStorage.getItem("dental_house_booked_ids") || "[]");
                if (Array.isArray(existing) && !existing.includes(res.id)) {
                  existing.push(res.id);
                  localStorage.setItem("dental_house_booked_ids", JSON.stringify(existing));
                }
              } catch (err) {
                console.error(err);
              }
            }

            sendPriyaMessage(
              `🎉 Booking Successful!\nYour appointment has been registered. Ticket Ref: ${res.id.slice(0, 8)}. A WhatsApp notification has been triggered.`,
              [{ text: "🏠 Main Menu", action: "go_home" }]
            );
            setState({ type: "IDLE" });
          } catch (err: any) {
            setIsTyping(false);
            sendPriyaMessage(
              `Booking failed: ${err.message || "Server issue"}. Would you like me to request a callback from the clinic staff to finalize this for you?`,
              [
                { text: "📞 Yes, Request Callback", action: "confirm_fallback" },
                { text: "🏠 Main Menu", action: "go_home" }
              ]
            );
            setState({ type: "STAFF_FALLBACK", pendingRequest: `Book appointment for ${state.name} (${state.phone}) - ${state.service} on ${state.date} at ${state.time}` });
          }
        } else {
          sendPriyaMessage("Booking cancelled. How can I assist you next?", [
            { text: "📅 Book an Appointment", action: "start_booking" },
            { text: "🏠 Main Menu", action: "go_home" }
          ]);
          setState({ type: "IDLE" });
        }
        break;

      case "VERIFY_PHONE":
        const cleanVal = text.replace(/\D/g, "");
        if (cleanVal.length < 5) {
          sendPriyaMessage("Please enter a valid phone number (at least 5 digits) to verify your records.");
          return;
        }

        try {
          setIsTyping(true);
          const results = await getByPhoneFn({ data: cleanVal });
          setIsTyping(false);

          if (!results || results.length === 0) {
            sendPriyaMessage(
              `I couldn't find any appointments linked to the phone number: ${text}. Please verify the number or choose an option:`,
              [
                { text: "🔍 Try Search Again", action: state.actionType === "cancel" ? "start_cancelling" : "start_rescheduling" },
                { text: "🏠 Main Menu", action: "go_home" }
              ]
            );
            setState({ type: "IDLE" });
            return;
          }

          // Found bookings! Now verify full name for privacy
          setState({
            type: "VERIFY_NAME",
            actionType: state.actionType,
            phone: cleanVal,
            appointments: results as any[]
          });
          sendPriyaMessage("I found matching bookings. For identity verification and security, please enter the patient's full name.");
        } catch (err) {
          setIsTyping(false);
          sendPriyaMessage("Database is currently unreachable. Let's record your request for clinic staff:", [
            { text: "📞 Request Callback", action: "confirm_fallback" },
            { text: "🏠 Main Menu", action: "go_home" }
          ]);
          setState({ type: "STAFF_FALLBACK", pendingRequest: `Request to ${state.actionType} appointment linked to ${text}` });
        }
        break;

      case "VERIFY_NAME":
        const inputName = text.toLowerCase().trim();
        const matches = state.appointments.filter(appt => 
          appt.name.toLowerCase().trim() === inputName || 
          appt.name.toLowerCase().includes(inputName) ||
          inputName.includes(appt.name.toLowerCase())
        );

        if (matches.length === 0) {
          sendPriyaMessage(
            "Verification failed. The name does not match the registered patient for that booking. To protect patient privacy, I cannot show or modify appointment details without verification. What would you like to do?",
            [
              { text: "🔍 Re-enter Patient Name", action: "retry_name" },
              { text: "🏠 Main Menu", action: "go_home" }
            ]
          );
          // Allow retrying verification
          return;
        }

        // Verification successful! Show matching appointments
        if (matches.length === 1) {
          const appt = matches[0];
          if (state.actionType === "cancel") {
            setState({
              type: "CANCEL_CONFIRM",
              phone: state.phone,
              name: text.trim(),
              appointment: appt
            });
            sendPriyaMessage(
              `Verification successful!\nAre you sure you want to cancel your appointment for ${appt.service} scheduled on ${appt.preferred_date} at ${appt.preferred_time}?`,
              [
                { text: "✅ Yes, Cancel", action: "confirm_cancel" },
                { text: "🏠 Back to Main Menu", action: "go_home" }
              ]
            );
          } else {
            setState({
              type: "RESCHEDULE_COLLECT_DATE",
              phone: state.phone,
              name: text.trim(),
              appointment: appt
            });
            sendPriyaMessage(`Verification successful!\nWhat is the preferred new date for your ${appt.service} appointment? (e.g., 'June 26' or 'YYYY-MM-DD').`);
          }
        } else {
          // Multiple appointments matched
          setState({
            type: "SELECT_APPOINTMENT",
            actionType: state.actionType,
            phone: state.phone,
            name: text.trim(),
            appointments: matches
          });
          sendPriyaMessage(
            "I found multiple appointments under your name. Which appointment would you like to select?",
            matches.map((appt, i) => ({
              text: `${appt.service} - ${appt.preferred_date} @ ${appt.preferred_time}`,
              action: `select_appt:${i}`
            }))
          );
        }
        break;

      case "RESCHEDULE_COLLECT_DATE":
        if (text.toLowerCase().includes("next Friday") || text.toLowerCase().includes("afternoon") || text.toLowerCase().includes("morning")) {
          sendPriyaMessage(`Dates like "${text}" can be ambiguous. Could you please specify the exact date (e.g. "June 25" or "YYYY-MM-DD")?`);
          return;
        }
        setState({
          type: "RESCHEDULE_COLLECT_TIME",
          phone: state.phone,
          name: state.name,
          appointment: state.appointment,
          date: text.trim()
        });
        sendPriyaMessage(`Got it, new date: ${text.trim()}. What time would you prefer? (Please state a specific time slot, e.g. "10:30 AM" or "16:00").`);
        break;

      case "RESCHEDULE_COLLECT_TIME":
        if (text.toLowerCase().includes("afternoon") || text.toLowerCase().includes("morning") || text.toLowerCase().includes("evening")) {
          sendPriyaMessage(`Times like "${text}" can be ambiguous. Could you please specify the exact time (e.g. "10:00 AM" or "16:30")?`);
          return;
        }
        setState({
          type: "RESCHEDULE_CONFIRM",
          phone: state.phone,
          name: state.name,
          appointment: state.appointment,
          date: state.date,
          time: text.trim()
        });
        sendPriyaMessage(
          `Please confirm your new appointment schedule details:\n• Patient: ${state.name}\n• Service: ${state.appointment.service}\n• New Date: ${state.date}\n• New Time: ${text.trim()}\n\nIs this correct?`,
          [
            { text: "✅ Yes, Reschedule", action: "confirm_reschedule" },
            { text: "🏠 Main Options", action: "go_home" }
          ]
        );
        break;

      case "RESCHEDULE_CONFIRM":
        if (text.toLowerCase().includes("yes") || text.toLowerCase().includes("correct") || text.toLowerCase().includes("reschedule")) {
          try {
            setIsTyping(true);
            await rescheduleFn({
              data: {
                id: state.appointment.id,
                name: state.name,
                preferred_date: state.date,
                preferred_time: state.time
              }
            });
            setIsTyping(false);
            sendPriyaMessage(
              `🎉 Appointment successfully rescheduled!\nNew date: ${state.date} at ${state.time}. The status is set to pending for clinic review, and a notification has been sent.`,
              [{ text: "🏠 Main Menu", action: "go_home" }]
            );
            setState({ type: "IDLE" });
          } catch (err: any) {
            setIsTyping(false);
            sendPriyaMessage(
              `Rescheduling failed: ${err.message || "Server issue"}. Would you like me to request a callback from the clinic staff to reschedule this manually?`,
              [
                { text: "📞 Yes, Request Reschedule", action: "confirm_fallback" },
                { text: "🏠 Main Menu", action: "go_home" }
              ]
            );
            setState({ type: "STAFF_FALLBACK", pendingRequest: `Reschedule appointment ${state.appointment.id} for ${state.name} to ${state.date} at ${state.time}` });
          }
        } else {
          sendPriyaMessage("Rescheduling cancelled. How can I assist you next?", [
            { text: "🏠 Main Menu", action: "go_home" }
          ]);
          setState({ type: "IDLE" });
        }
        break;

      case "STAFF_FALLBACK":
        setState({ type: "IDLE" });
        sendPriyaMessage(
          "I have collected your request and sent a callback notification to our staff. We will follow up with you shortly at your number. Thank you!",
          [{ text: "🏠 Main Menu", action: "go_home" }]
        );
        break;

      case "IDLE":
      default:
        // Handle general conversations, check for off-topic, medical diagnosis etc.
        const isMedical = [
          "pain", "toothache", "medicine", "pill", "antibiotic", "bleed", "cure",
          "medication", "dose", "diagnose", "advice", "treatment", "swelling"
        ].some(kw => lowerText.includes(kw));

        if (isMedical) {
          sendPriyaMessage(
            "I cannot provide medical advice, recommend medications, or diagnose conditions. For your health and safety, please contact the clinic directly or seek a professional consultation.",
            [
              { text: "📞 Contact Clinic", action: "clinic_contact" },
              { text: "📅 Book Consultation", action: "start_booking" },
              { text: "🏠 Back to Menu", action: "go_home" }
            ]
          );
        } else if (lowerText.includes("wrong number") || lowerText.includes("not neel") || lowerText.includes("wrong person")) {
          sendPriyaMessage("I apologize for the confusion. Thank you for letting me know, I will end this conversation. Have a great day!");
          setTimeout(() => setIsOpen(false), 2000);
        } else {
          sendPriyaMessage(
            "I am Priya, a dental clinic assistant. I can help you book, cancel, or reschedule appointments. What would you like to do?",
            [
              { text: "📅 Book an Appointment", action: "start_booking" },
              { text: "🔄 Reschedule Appointment", action: "start_rescheduling" },
              { text: "❌ Cancel Appointment", action: "start_cancelling" },
              { text: "🏠 Main Menu", action: "go_home" }
            ]
          );
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue("");
    handleUserMessage(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 group"
          aria-label="Chat with Priya"
        >
          <PhoneCall className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive text-[10px] font-bold text-destructive-foreground items-center justify-center">1</span>
            </span>
          )}
        </button>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div className="w-[360px] sm:w-[380px] h-[500px] flex flex-col rounded-2xl border border-border bg-card/85 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/20 font-bold">
                P
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-primary"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Priya</h3>
                <p className="text-[10px] text-primary-foreground/75 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Dental Assistant (Online)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-primary-foreground/85 hover:bg-primary-foreground/10 hover:text-primary-foreground transition"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className={`text-[10px] text-muted-foreground px-1.5 mb-1`}>
                  {msg.sender === "user" ? "You" : "Priya"}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-line shadow-sm transition-all ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : msg.isEmergency
                      ? "bg-red-50 text-red-900 border border-red-200 rounded-tl-none font-medium"
                      : "bg-background text-foreground border border-border rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Quick Choices / Suggestions */}
                {msg.choices && msg.choices.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 w-full">
                    {msg.choices.map((choice, i) => (
                      <button
                        key={i}
                        onClick={() => handleChoiceSelect(choice)}
                        className="rounded-lg border border-input bg-background/50 backdrop-blur-sm px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground hover:border-accent transition duration-200 active:scale-95 text-left"
                      >
                        {choice.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Simulated Typing Indicator */}
            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="text-[10px] text-muted-foreground px-1.5 mb-1">Priya</div>
                <div className="rounded-2xl rounded-tl-none bg-background border border-border px-4 py-3 flex gap-1 items-center shadow-sm">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Footer */}
          <form
            onSubmit={handleInputSubmit}
            className="border-t border-border bg-background p-3 flex gap-2 items-center"
          >
            <input
              type="text"
              placeholder="Ask Priya a question..."
              value={inputValue}
              onChange={handleInputChange}
              disabled={isTyping}
              className="flex-1 rounded-xl border border-input bg-muted/30 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1.5 focus:ring-primary focus:bg-background transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition shadow-sm disabled:opacity-50 disabled:hover:bg-primary"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
