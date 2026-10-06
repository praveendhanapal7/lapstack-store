-- Removes ALL customer data from the Lapstack database (Supabase). Products are kept.
-- Run it yourself in Supabase: SQL Editor -> paste -> Run. It cannot be undone.
-- Tip: first refund/cancel any real paid order (e.g. the Rs 1 test) so the record is not lost.

BEGIN;
DELETE FROM carts;           -- saved carts
DELETE FROM addresses;       -- saved addresses
DELETE FROM login_codes;     -- sign-in codes
DELETE FROM orders;          -- all orders
DELETE FROM sell_requests;   -- people who offered to sell a laptop
DELETE FROM users;           -- customer accounts
-- (optional) put product stock back to 1 each:
-- UPDATE products SET stock = 1;
COMMIT;

-- check: all of these should show 0
SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM orders) AS orders,
       (SELECT COUNT(*) FROM addresses) AS addresses, (SELECT COUNT(*) FROM sell_requests) AS sell_requests;
