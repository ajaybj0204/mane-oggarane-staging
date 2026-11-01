# Demo database (mane-oggarane-demo)

Separate Supabase project used only for the public sales demo. Created 1 Nov 2026 in ap-south-1.

Contents: migrations 001–016 (008 skipped: cleanup runs via the reconciled Vercel cron), the live
32-dish menu, demo settings, 6 delivery PIN codes, rewards, a "Welcome back" campaign + coupon,
40 fictional customers (`demo.customerN@example.invalid`, phones 99999xxxxx, no passwords) and
~110 fictional delivered orders over 120 days so the Growth & retention dashboard has realistic data.
Razorpay IDs in the sample orders are fake (`demo_order_*`). Never copy real customers here.
