
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT NOT NULL,
  doctor TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.appointments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can book" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated staff can view" ON public.appointments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can update" ON public.appointments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
