ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'upi',
  ADD COLUMN IF NOT EXISTS upi_vpa text,
  ADD COLUMN IF NOT EXISTS payee_vpa text;