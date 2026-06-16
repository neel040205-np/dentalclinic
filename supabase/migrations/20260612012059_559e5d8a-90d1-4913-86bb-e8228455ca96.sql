
-- Add owner column
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON public.appointments(user_id);

-- Replace staff/admin policies with admin + per-user policies
DROP POLICY IF EXISTS "Staff or admin can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff or admin can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can book" ON public.appointments;

-- Public booking: anyone may insert. If signed in, user_id must match auth.uid().
CREATE POLICY "Anyone can book"
  ON public.appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Admins can read everything
CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Regular users can read only their own
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can update any
CREATE POLICY "Admins can update all appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Regular users can update only their own
CREATE POLICY "Users can update own appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
