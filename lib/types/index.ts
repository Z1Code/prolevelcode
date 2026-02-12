export type UserRole = "student" | "admin" | "superadmin";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseCard {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail_url: string | null;
  price_cents: number;
  currency: string;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  category: string | null;
  tags: string[] | null;
  total_duration_minutes: number | null;
  total_lessons: number | null;
  is_published: boolean;
  is_featured: boolean;
  is_coming_soon: boolean;
  tier_access: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: "active" | "refunded" | "expired";
  amount_paid_cents: number | null;
  currency: string;
  enrolled_at: string;
}

export interface VideoTokenResponse {
  token: string;
  videoUrl: string;
  expiresAt: string;
  remainingViews: number;
}

export interface ServiceOrder {
  id: string;
  user_id: string;
  service_id: string;
  status: "pending_payment" | "pending_kickoff" | "in_progress" | "completed" | "cancelled" | "refunded";
  quoted_amount_cents: number;
  currency: string;
}

export interface AdminMetric {
  totalRevenueCents: number;
  monthlyRevenueCents: number;
  newUsers: number;
  activeCourses: number;
  activeTokens: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface TierPurchaseInfo {
  id: string;
  tier: "basic" | "pro";
  status: string;
  payment_provider: string;
  purchased_at: string;
  expires_at: string | null;
}

export interface ScholarshipInfo {
  id: string;
  recipient_email: string;
  status: string;
  invite_token: string;
  granted_at: string;
  redeemed_at: string | null;
  expires_at: string | null;
}


