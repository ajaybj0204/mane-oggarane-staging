-- Mane & Oggarane FINAL QA: all synthetic writes are inside a transaction
-- that MUST ROLLBACK. No payment provider/API calls, no emails, no refunds.
-- Run as the database owner/postgres on the staging Supabase project ONLY.
BEGIN;
SET LOCAL statement_timeout = '25s';
DO $qa$
DECLARE
  v_paid uuid;
  v_expired uuid;
  v_partial uuid;
  v_full uuid;
  v_paid_rzp text := 'mno_qa_ord_paid_'||replace(gen_random_uuid()::text,'-','');
  v_expired_rzp text := 'mno_qa_ord_expired_'||replace(gen_random_uuid()::text,'-','');
  v_partial_rzp text := 'mno_qa_payment_partial_'||replace(gen_random_uuid()::text,'-','');
  v_full_rzp text := 'mno_qa_payment_full_'||replace(gen_random_uuid()::text,'-','');
  v_refund_one text := 'mno_qa_refund_1_'||replace(gen_random_uuid()::text,'-','');
  v_refund_two text := 'mno_qa_refund_2_'||replace(gen_random_uuid()::text,'-','');
  v_event_id text := 'mno_qa_event_'||replace(gen_random_uuid()::text,'-','');
  v_rejected boolean := false;
  v_status text;
  v_payment_status text;
  v_refund_status text;
  v_review boolean;
  v_rows integer;
BEGIN
  -- Fake local database row, not a real Razorpay order.
  INSERT INTO public.orders
    (customer_name,customer_email,customer_phone,fulfillment_type,subtotal_paise,total_paise,
     razorpay_order_id,payment_status,status)
  VALUES('QA Rollback','rollback@example.invalid','9999999999','pickup',10000,10000,
     v_paid_rzp,'pending','awaiting_payment') RETURNING id INTO v_paid;
  PERFORM public.mark_order_paid(v_paid,v_paid_rzp,'mno_qa_payment_paid');
  PERFORM public.mark_order_paid(v_paid,v_paid_rzp,'mno_qa_payment_paid');
  SELECT payment_status,status INTO v_payment_status,v_status FROM public.orders WHERE id=v_paid;
  IF v_payment_status<>'paid' OR v_status<>'placed' THEN
    RAISE EXCEPTION 'FAIL: payment and idempotent retry not recognized';
  END IF;
  BEGIN
    PERFORM public.mark_order_paid(v_paid,v_paid_rzp,'mno_qa_other_payment');
  EXCEPTION WHEN OTHERS THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'FAIL: different second payment accepted';END IF;

  -- Expired reservation that cleanup has NOT released yet: a late captured payment is honoured.
  INSERT INTO public.orders
    (customer_name,customer_email,customer_phone,fulfillment_type,subtotal_paise,total_paise,
     razorpay_order_id,payment_status,status,reservation_expires_at)
  VALUES('QA Late','rollback@example.invalid','9999999999','pickup',10000,10000,
     v_expired_rzp||'_late','pending','awaiting_payment',now()-interval '1 minute')
  RETURNING id INTO v_partial;
  PERFORM public.mark_order_paid(v_partial,v_expired_rzp||'_late','mno_qa_late_ok');
  SELECT payment_status INTO v_payment_status FROM public.orders WHERE id=v_partial;
  IF v_payment_status<>'paid' THEN RAISE EXCEPTION 'FAIL: unreleased late capture not honoured'; END IF;

  INSERT INTO public.orders
    (customer_name,customer_email,customer_phone,fulfillment_type,subtotal_paise,total_paise,
     razorpay_order_id,payment_status,status,reservation_expires_at)
  VALUES('QA Expired','rollback@example.invalid','9999999999','pickup',10000,10000,
     v_expired_rzp,'pending','awaiting_payment',now()-interval '1 minute')
  RETURNING id INTO v_expired;
  -- Migration 012: an expired-but-unreleased order still holds its reservations, so cleanup
  -- reconciles with Razorpay first. Once RELEASED, a late payment must be rejected (and the
  -- application records it in payment_reviews for a refund).
  IF public.release_unpaid_order(v_expired) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL: expired reservation not released';
  END IF;
  v_rejected:=false;
  BEGIN
    PERFORM public.mark_order_paid(v_expired,v_expired_rzp,'mno_qa_late_payment');
  EXCEPTION WHEN OTHERS THEN v_rejected:=true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'FAIL: released order accepted late payment'; END IF;
  IF public.release_unpaid_order(v_expired) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'FAIL: duplicate release not idempotent';
  END IF;
  SELECT payment_status,status INTO v_payment_status,v_status FROM public.orders WHERE id=v_expired;
  IF v_payment_status<>'failed' OR v_status<>'cancelled' THEN
    RAISE EXCEPTION 'FAIL: expired reservation not cancelled safely';
  END IF;

  INSERT INTO public.orders
    (customer_name,customer_email,customer_phone,fulfillment_type,subtotal_paise,total_paise,
     razorpay_payment_id,payment_status,status)
  VALUES('QA Partial','rollback@example.invalid','9999999999','pickup',10000,10000,
     v_partial_rzp,'paid','placed') RETURNING id INTO v_partial;
  INSERT INTO public.refund_requests(order_id,requested_amount_paise,status)
  VALUES(v_partial,10000,'initiated');
  PERFORM public.confirm_provider_refund(v_partial,v_refund_one,4000);
  SELECT payment_status INTO v_payment_status FROM public.orders WHERE id=v_partial;
  SELECT status,needs_loyalty_review INTO v_refund_status,v_review FROM public.refund_requests WHERE order_id=v_partial;
  IF v_payment_status<>'partially_refunded' OR v_refund_status<>'needs_review' OR v_review IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL: partial refund did not flag review';
  END IF;
  PERFORM public.confirm_provider_refund(v_partial,v_refund_two,10000);
  SELECT payment_status,status INTO v_payment_status,v_status FROM public.orders WHERE id=v_partial;
  IF v_payment_status<>'refunded' OR v_status<>'cancelled' THEN
    RAISE EXCEPTION 'FAIL: partial-then-full refund did not finalize';
  END IF;

  INSERT INTO public.orders
    (customer_name,customer_email,customer_phone,fulfillment_type,subtotal_paise,total_paise,
     razorpay_payment_id,payment_status,status)
  VALUES('QA Full','rollback@example.invalid','9999999999','pickup',10000,10000,
     v_full_rzp,'paid','placed') RETURNING id INTO v_full;
  INSERT INTO public.refund_requests(order_id,requested_amount_paise,status)
  VALUES(v_full,10000,'initiated');
  PERFORM public.confirm_provider_refund(v_full,v_refund_two||'_full',10000);
  PERFORM public.confirm_provider_refund(v_full,v_refund_two||'_full',10000);
  SELECT payment_status,status INTO v_payment_status,v_status FROM public.orders WHERE id=v_full;
  SELECT status,needs_loyalty_review INTO v_refund_status,v_review FROM public.refund_requests WHERE order_id=v_full;
  IF v_payment_status<>'refunded' OR v_status<>'cancelled'
    OR v_refund_status<>'processed' OR v_review IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'FAIL: full refund retry not idempotent';
  END IF;
  INSERT INTO public.payment_events(id,event_type) VALUES(v_event_id,'payment.failed');
  INSERT INTO public.payment_events(id,event_type) VALUES(v_event_id,'payment.failed') ON CONFLICT(id) DO NOTHING;
  SELECT count(*) INTO v_rows FROM public.payment_events WHERE id=v_event_id;
  IF v_rows<>1 THEN RAISE EXCEPTION 'FAIL: duplicate webhook ledger accepted';END IF;
  IF has_function_privilege('anon','public.mark_order_paid(uuid,text,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.confirm_provider_refund(uuid,text,integer)','EXECUTE')
    OR has_function_privilege('anon','public.release_unpaid_order(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: direct payment/refund RPC privileges exposed';
  END IF;
  RAISE NOTICE 'PASS: retry idempotence; wrong-payment rejection; expiry; safe release; partial refund/manual-review; full-refund repeat; event dedupe; RPC permissions. All fixtures will ROLLBACK.';
END;
$qa$;
ROLLBACK;
-- If this final SELECT executes, the complete DO assertions ran and no fixture remains.
SELECT 'PASS: transactional QA assertions completed and ROLLED BACK' AS final_result;
