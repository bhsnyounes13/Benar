
-- Create a security definer function to credit freelancer wallet on payment release
CREATE OR REPLACE FUNCTION public.credit_freelancer_wallet(_freelancer_id uuid, _amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert wallet: create if not exists, update if exists
  INSERT INTO public.wallets (user_id, balance, total_earned)
  VALUES (_freelancer_id, _amount, _amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = wallets.balance + _amount,
    total_earned = wallets.total_earned + _amount,
    updated_at = now();
END;
$$;
