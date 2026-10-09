-- Removes only Praveen Dhanapal's test data (accounts, orders, addresses, carts, warranty claims, sell requests, sign-in codes).
-- Other customers and all products are kept. Run in Supabase: SQL Editor -> paste -> Run. It cannot be undone.

-- 1) PREVIEW: run this part alone first and check that only your own rows show up.
SELECT 'user' AS kind, id::text, email AS detail FROM users
  WHERE name ILIKE '%praveen%' OR email ILIKE 'praveendhanapal%'
UNION ALL
SELECT 'order', code, name || ' · ₹' || total || ' · ' || payment_status FROM orders
  WHERE name ILIKE '%praveen%' OR email ILIKE 'praveendhanapal%'
     OR user_id IN (SELECT id FROM users WHERE name ILIKE '%praveen%' OR email ILIKE 'praveendhanapal%')
UNION ALL
SELECT 'sell request', id::text, name || ' · ' || model FROM sell_requests
  WHERE name ILIKE '%praveen%' OR email ILIKE 'praveendhanapal%';

-- 2) DELETE: when the preview looks right, run this block.
BEGIN;
CREATE TEMP TABLE me ON COMMIT DROP AS
  SELECT id FROM users WHERE name ILIKE '%praveen%' OR email ILIKE 'praveendhanapal%';
CREATE TEMP TABLE my_orders ON COMMIT DROP AS
  SELECT id FROM orders WHERE name ILIKE '%praveen%' OR email ILIKE 'praveendhanapal%' OR user_id IN (SELECT id FROM me);
DELETE FROM warranty_claims WHERE order_id IN (SELECT id FROM my_orders) OR user_id IN (SELECT id FROM me);
DELETE FROM orders          WHERE id IN (SELECT id FROM my_orders);
DELETE FROM addresses       WHERE user_id IN (SELECT id FROM me);
DELETE FROM carts           WHERE user_id IN (SELECT id FROM me);
DELETE FROM login_codes     WHERE email ILIKE 'praveendhanapal%';
DELETE FROM sell_requests   WHERE name ILIKE '%praveen%' OR email ILIKE 'praveendhanapal%';
DELETE FROM users           WHERE id IN (SELECT id FROM me);
COMMIT;
