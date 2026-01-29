-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'assistant', 'admin');

-- Create enum for inquiry status
CREATE TYPE public.inquiry_status AS ENUM ('submitted', 'under_review', 'matched', 'resolved', 'rejected');

-- Create enum for item category
CREATE TYPE public.item_category AS ENUM ('electronics', 'clothing', 'accessories', 'documents', 'keys', 'bags', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create lost_items table (private catalog - only assistants can see)
CREATE TABLE public.lost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category item_category NOT NULL DEFAULT 'other',
    color TEXT,
    brand TEXT,
    distinguishing_features TEXT,
    location_found TEXT,
    date_found DATE,
    image_urls TEXT[] DEFAULT '{}',
    is_claimed BOOLEAN DEFAULT FALSE,
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inquiries table (user submissions)
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category item_category,
    color TEXT,
    brand TEXT,
    distinguishing_features TEXT,
    location_lost TEXT,
    date_lost DATE,
    image_urls TEXT[] DEFAULT '{}',
    status inquiry_status NOT NULL DEFAULT 'submitted',
    assigned_assistant_id UUID REFERENCES auth.users(id),
    confidence_score DECIMAL(5,2),
    rate_limit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create potential_matches table (AI-generated matches for review)
CREATE TABLE public.potential_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
    lost_item_id UUID REFERENCES public.lost_items(id) ON DELETE CASCADE NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    match_reasons JSONB,
    is_approved BOOLEAN,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(inquiry_id, lost_item_id)
);

-- Create follow_up_questions table for narrowing matches
CREATE TABLE public.follow_up_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.potential_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_questions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user is assistant or admin
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('assistant', 'admin')
    )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User roles policies (only admins can manage roles)
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Lost items policies (only staff can view/manage)
CREATE POLICY "Staff can view lost items"
ON public.lost_items FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert lost items"
ON public.lost_items FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update lost items"
ON public.lost_items FOR UPDATE
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete lost items"
ON public.lost_items FOR DELETE
USING (public.is_staff(auth.uid()));

-- Inquiries policies
CREATE POLICY "Users can view own inquiries"
ON public.inquiries FOR SELECT
USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Users can create inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inquiries"
ON public.inquiries FOR UPDATE
USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- Potential matches policies (only staff can see matches)
CREATE POLICY "Staff can view potential matches"
ON public.potential_matches FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage potential matches"
ON public.potential_matches FOR ALL
USING (public.is_staff(auth.uid()));

-- Follow-up questions policies
CREATE POLICY "Users can view own follow-up questions"
ON public.follow_up_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.inquiries
        WHERE id = inquiry_id AND user_id = auth.uid()
    )
    OR public.is_staff(auth.uid())
);

CREATE POLICY "Staff can create follow-up questions"
ON public.follow_up_questions FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Users can answer follow-up questions"
ON public.follow_up_questions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.inquiries
        WHERE id = inquiry_id AND user_id = auth.uid()
    )
);

-- Create trigger for automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Default role is 'user'
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lost_items_updated_at
    BEFORE UPDATE ON public.lost_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

-- Storage policies
CREATE POLICY "Anyone can view item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated users can upload item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Staff can delete item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'item-images');