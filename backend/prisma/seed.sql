-- Initial system settings
INSERT INTO system_settings (key, value, "updatedAt") VALUES
  ('platform_fee_percent', '10', NOW()),
  ('fixed_fee_egp', '5', NOW()),
  ('fixed_fee_threshold', '50', NOW()),
  ('min_withdrawal_egp', '100', NOW()),
  ('max_wallet_balance_egp', '5000', NOW())
ON CONFLICT (key) DO NOTHING;
