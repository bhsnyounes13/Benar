
-- ============================================
-- AdConnect Database Schema
-- ============================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('client', 'designer', 'media_buyer', 'admin');

-- 2. Project status enum
CREATE TYPE public.project_status AS ENUM ('draft', 'open', 'in_progress', 'under_review', 'completed', 'cancelled');

-- 3. Proposal status enum
CREATE TYPE public.proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- 4. Contract status enum
CREATE TYPE public.contract_status AS ENUM ('in_progress', 'under_review', 'completed', 'cancelled');

-- 5. Payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'released', 'refunded');

-- 6. Withdrawal status enum
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'processed');

-- 7. Dispute status enum
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved');

-- 8. Service type enum
CREATE TYPE public.service_type AS ENUM ('design', 'campaign', 'full_package');

-- 9. Notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'new_proposal', 'proposal_accepted', 'proposal_rejected',
  'message_received', 'payment_released', 'review_received',
  'contract_created', 'dispute_opened', 'dispute_resolved',
  'withdrawal_approved', 'withdrawal_rejected'
);

-- ============================================
-- TABLES
-- ============================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  service_type public.service_type NOT NULL DEFAULT 'design',
  budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ,
  required_skills TEXT[] DEFAULT '{}',
  status public.project_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proposals
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 7,
  message TEXT DEFAULT '',
  status public.proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.contract_status NOT NULL DEFAULT 'in_progress',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, reviewer_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disputes
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  admin_notes TEXT DEFAULT '',
  resolution TEXT DEFAULT '',
  status public.dispute_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Logs
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform Settings
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.platform_settings (commission_rate) VALUES (10.00);

-- ============================================
-- HELPER FUNCTIONS (Security Definer)
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_contract_participant(_user_id UUID, _contract_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contracts
    WHERE id = _contract_id AND (client_id = _user_id OR freelancer_id = _user_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.get_profile_user_id(_profile_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.profiles WHERE id = _profile_id
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create wallet for freelancers
CREATE OR REPLACE FUNCTION public.handle_new_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('designer', 'media_buyer') THEN
    INSERT INTO public.wallets (user_id) VALUES (NEW.user_id) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_role_created
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_role();

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- PROFILES
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admin can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role != 'admin');
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- PROJECTS
CREATE POLICY "Anyone can view open projects" ON public.projects FOR SELECT TO authenticated USING (
  status = 'open' OR client_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Clients can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = client_id AND public.has_role(auth.uid(), 'client')
);
CREATE POLICY "Clients can update own projects" ON public.projects FOR UPDATE TO authenticated USING (
  auth.uid() = client_id OR public.is_admin(auth.uid())
);
CREATE POLICY "Clients can delete own open projects" ON public.projects FOR DELETE TO authenticated USING (
  (auth.uid() = client_id AND status = 'open') OR public.is_admin(auth.uid())
);

-- PROPOSALS
CREATE POLICY "View proposals" ON public.proposals FOR SELECT TO authenticated USING (
  freelancer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.client_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Freelancers can submit proposals" ON public.proposals FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = freelancer_id
  AND (public.has_role(auth.uid(), 'designer') OR public.has_role(auth.uid(), 'media_buyer'))
);
CREATE POLICY "Freelancers can update own pending proposals" ON public.proposals FOR UPDATE TO authenticated USING (
  (auth.uid() = freelancer_id AND status = 'pending')
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.client_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Freelancers can delete own pending proposals" ON public.proposals FOR DELETE TO authenticated USING (
  (auth.uid() = freelancer_id AND status = 'pending') OR public.is_admin(auth.uid())
);

-- CONTRACTS
CREATE POLICY "Participants can view contracts" ON public.contracts FOR SELECT TO authenticated USING (
  client_id = auth.uid() OR freelancer_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "System/admin can create contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = client_id OR public.is_admin(auth.uid())
);
CREATE POLICY "Participants can update contracts" ON public.contracts FOR UPDATE TO authenticated USING (
  client_id = auth.uid() OR freelancer_id = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Admin can delete contracts" ON public.contracts FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- MESSAGES
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT TO authenticated USING (
  public.is_contract_participant(auth.uid(), contract_id) OR public.is_admin(auth.uid())
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND public.is_contract_participant(auth.uid(), contract_id)
);
CREATE POLICY "Admin can delete messages" ON public.messages FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- PAYMENTS
CREATE POLICY "Participants can view payments" ON public.payments FOR SELECT TO authenticated USING (
  public.is_contract_participant(auth.uid(), contract_id) OR public.is_admin(auth.uid())
);
CREATE POLICY "Clients can create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = payer_id
);
CREATE POLICY "Admin can update payments" ON public.payments FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- WALLETS
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);
CREATE POLICY "System creates wallets" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can update wallets" ON public.wallets FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- WITHDRAWALS
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);
CREATE POLICY "Users can create withdrawals" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can update withdrawals" ON public.withdrawals FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- REVIEWS
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Contract participants can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = reviewer_id AND public.is_contract_participant(auth.uid(), contract_id)
);
CREATE POLICY "Admin can manage reviews" ON public.reviews FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DISPUTES
CREATE POLICY "Participants can view disputes" ON public.disputes FOR SELECT TO authenticated USING (
  public.is_contract_participant(auth.uid(), contract_id) OR public.is_admin(auth.uid())
);
CREATE POLICY "Participants can create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = reported_by AND public.is_contract_participant(auth.uid(), contract_id)
);
CREATE POLICY "Admin can update disputes" ON public.disputes FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- ADMIN LOGS
CREATE POLICY "Admin can view logs" ON public.admin_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin can create logs" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- PLATFORM SETTINGS
CREATE POLICY "Anyone can view settings" ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can update settings" ON public.platform_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_proposals_project_id ON public.proposals(project_id);
CREATE INDEX idx_proposals_freelancer_id ON public.proposals(freelancer_id);
CREATE INDEX idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX idx_contracts_freelancer_id ON public.contracts(freelancer_id);
CREATE INDEX idx_messages_contract_id ON public.messages(contract_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_disputes_contract_id ON public.disputes(contract_id);
CREATE INDEX idx_reviews_target_id ON public.reviews(target_id);
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
