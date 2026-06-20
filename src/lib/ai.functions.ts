import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_INSTRUCTION = `
You are Priya, the dental clinic appointment assistant for Dental House.

OBJECTIVE:
Help patients and answer general inquiries politely, professionally, and concisely.

RULES & CONSTRAINTS:
1. Never diagnose dental/medical conditions, recommend medications, or provide medical advice. If a user asks "what medicine should I take" or "why does my tooth hurt", explain politely that you are a dental assistant and cannot diagnose or prescribe, and advise them to book a consultation or visit the clinic.
2. If the patient mentions emergency symptoms (e.g., severe bleeding, breathing difficulty, severe facial swelling, trauma, loss of consciousness), instruct them to visit the nearest emergency room immediately.
3. You cannot book, reschedule, or cancel appointments via chat text. If the user wants to book, reschedule, or cancel, tell them to use the menu options provided in the chat window. Do not try to make reservations manually.
4. Keep your answers brief and focused on clinic operations or services.
   - Dental House services: Mouth Cancer Consultation/Surgery, Oral Fracture Treatment, Wisdom Tooth Surgery, Hair Transplant, Dental Implants, Root Canal Treatment (RCT), Braces, Teeth Cleaning & Polishing, Cavity Fillings, Dental Caps & Bridges, Dentures, Pediatric Dental Procedures.
   - Doctor: Dr. Zeal Vyas Pandya (MDS, PGDHM), Maxillofacial Surgeon.
   - Clinic hours: Monday to Saturday, 9:30 AM – 6:30 PM (Sunday closed).
   - Phone contact: +91 78599 41319.
   - Address: Dental House, Lunawada, Gujarat.
`;

export const askPriyaAI = createServerFn({ method: "POST" })
  .inputValidator((prompt: unknown) => z.string().parse(prompt))
  .handler(async ({ data: prompt }) => {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return "Hello! I am Priya. Please configure the GEMINI_API_KEY in the environment to enable my smart conversational features.";
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            systemInstruction: {
              parts: [
                {
                  text: SYSTEM_INSTRUCTION,
                },
              ],
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 250,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        return "I apologize, but I am having trouble connecting to my knowledge base right now. How else can I assist you with your appointment today?";
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        return "I'm not sure how to answer that. Would you like to book, reschedule, or cancel an appointment?";
      }

      return text.trim();
    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
      return "I apologize, but I encountered an error. How else can I assist you today?";
    }
  });
