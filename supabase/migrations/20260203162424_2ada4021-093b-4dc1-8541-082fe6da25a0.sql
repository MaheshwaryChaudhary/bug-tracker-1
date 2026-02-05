-- Change due_date from date to timestamptz to support time
ALTER TABLE public.tickets 
ALTER COLUMN due_date TYPE timestamptz USING due_date::timestamptz;