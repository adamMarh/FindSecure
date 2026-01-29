export type AppRole = 'user' | 'assistant' | 'admin';
export type InquiryStatus = 'submitted' | 'under_review' | 'matched' | 'resolved' | 'rejected';
export type ItemCategory = 'electronics' | 'clothing' | 'accessories' | 'documents' | 'keys' | 'bags' | 'other';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface LostItem {
  id: string;
  name: string;
  description: string | null;
  category: ItemCategory;
  color: string | null;
  brand: string | null;
  distinguishing_features: string | null;
  location_found: string | null;
  date_found: string | null;
  image_urls: string[];
  is_claimed: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: ItemCategory | null;
  color: string | null;
  brand: string | null;
  distinguishing_features: string | null;
  location_lost: string | null;
  date_lost: string | null;
  image_urls: string[];
  status: InquiryStatus;
  assigned_assistant_id: string | null;
  confidence_score: number | null;
  rate_limit_count: number;
  created_at: string;
  updated_at: string;
}

export interface PotentialMatch {
  id: string;
  inquiry_id: string;
  lost_item_id: string;
  confidence_score: number;
  match_reasons: {
    reasons: string[];
    details?: string;
  } | null;
  is_approved: boolean | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Joined data
  lost_item?: LostItem;
  inquiry?: Inquiry;
}

export interface FollowUpQuestion {
  id: string;
  inquiry_id: string;
  question: string;
  answer: string | null;
  created_at: string;
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  electronics: 'Electronics',
  clothing: 'Clothing',
  accessories: 'Accessories',
  documents: 'Documents',
  keys: 'Keys',
  bags: 'Bags & Luggage',
  other: 'Other',
};

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  matched: 'Match Found',
  resolved: 'Resolved',
  rejected: 'No Match Found',
};

export const STATUS_COLORS: Record<InquiryStatus, string> = {
  submitted: 'bg-secondary text-secondary-foreground',
  under_review: 'bg-warning/20 text-warning',
  matched: 'bg-success/20 text-success',
  resolved: 'bg-accent/20 text-accent',
  rejected: 'bg-destructive/20 text-destructive',
};
