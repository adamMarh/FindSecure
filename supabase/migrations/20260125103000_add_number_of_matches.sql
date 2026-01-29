-- Add number_of_matches column to inquiries
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS number_of_matches INTEGER DEFAULT 0;

-- Backfill existing inquiries using potential_matches counts (if any)
DO $$
BEGIN
  UPDATE public.inquiries i
  SET number_of_matches = COALESCE(pm.cnt, 0)
  FROM (
    SELECT inquiry_id, COUNT(*) AS cnt
    FROM public.potential_matches
    GROUP BY inquiry_id
  ) pm
  WHERE i.id = pm.inquiry_id;
END$$;
