-- Enable RLS on matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Users can view their own matches
CREATE POLICY "Users can view own matches"
ON public.matches
FOR SELECT
USING (auth.uid() = user_id);

-- Staff can insert matches
CREATE POLICY "Staff can insert matches"
ON public.matches
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- Staff can delete matches
CREATE POLICY "Staff can delete matches"
ON public.matches
FOR DELETE
USING (is_staff(auth.uid()));

-- Users can delete their own matches (for rejection flow)
CREATE POLICY "Users can delete own matches"
ON public.matches
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to view lost_items that are matched to their inquiries
CREATE POLICY "Users can view matched lost items"
ON public.lost_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.inquiries i ON m.inquiry_id = i.id
    WHERE m.lost_item_id = lost_items.id
      AND i.user_id = auth.uid()
  )
);

-- Allow users to delete lost_items that are matched to their confirmed inquiries
CREATE POLICY "Users can delete matched lost items on confirm"
ON public.lost_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.inquiries i ON m.inquiry_id = i.id
    WHERE m.lost_item_id = lost_items.id
      AND i.user_id = auth.uid()
  )
);