-- Alert admins when a confirmed payment exceeds available stock.
create or replace function public.confirm_order_payment(
  p_reference text,
  p_amount_minor bigint,
  p_currency text,
  p_channel text,
  p_card_last4 text,
  p_card_brand text,
  p_gateway_response text,
  p_paid_at timestamptz,
  p_verified_via text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_item record;
  v_expected_minor bigint;
begin
  select * into v_payment from public.payments where reference = p_reference for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_reference');
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'already_processed', true, 'order_id', v_order.id);
  end if;

  v_expected_minor := round(v_order.total * 100)::bigint;
  if p_amount_minor <> v_expected_minor or upper(p_currency) <> upper(v_order.currency) then
    update public.payments set status = 'failed', gateway_response = 'Amount or currency mismatch'
      where id = v_payment.id;
    insert into public.notifications (audience, type, title, body, link)
      values ('admin', 'payment_mismatch', 'Payment amount mismatch',
              'Reference ' || p_reference || ' paid ' || p_amount_minor || ' ' || p_currency ||
              ' but order ' || v_order.order_number || ' expects ' || v_expected_minor,
              '/admin/orders/' || v_order.id);
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch', 'order_id', v_order.id);
  end if;

  update public.payments set
    status = 'success', channel = p_channel, card_last4 = p_card_last4, card_brand = p_card_brand,
    gateway_response = p_gateway_response, paid_at = coalesce(p_paid_at, now()), verified_via = p_verified_via
  where id = v_payment.id;

  update public.orders set
    payment_status = 'paid',
    status = case when status = 'pending_payment' then 'payment_confirmed' else status end,
    paid_at = coalesce(p_paid_at, now())
  where id = v_order.id;

  insert into public.order_status_history (order_id, status, note)
    values (v_order.id, 'payment_confirmed', 'Payment confirmed via ' || p_verified_via);

  -- Deduct stock exactly once.
  if not v_order.stock_deducted then
    for v_item in select variant_id, product_id, quantity from public.order_items where order_id = v_order.id loop
      if v_item.variant_id is not null then
        -- Payment can complete for the last unit twice (stock is reserved only at payment).
        -- Never go negative, and alert the team so they can resolve the shortfall.
        if exists (select 1 from public.inventory where variant_id = v_item.variant_id and quantity < v_item.quantity) then
          insert into public.notifications (audience, type, title, body, link)
            values ('admin', 'oversold', 'Stock shortfall on paid order ' || v_order.order_number,
                    'A paid item exceeded available stock. Please contact the customer or restock.',
                    '/admin/orders/' || v_order.id);
        end if;
        update public.inventory set quantity = greatest(0, quantity - v_item.quantity)
          where variant_id = v_item.variant_id;
      end if;
      if v_item.product_id is not null then
        update public.products set sales_count = sales_count + v_item.quantity where id = v_item.product_id;
      end if;
    end loop;
    update public.orders set stock_deducted = true where id = v_order.id;
  end if;

  if v_order.coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, order_id, user_id, email, amount)
      values (v_order.coupon_id, v_order.id, v_order.user_id, v_order.email, v_order.discount_total)
      on conflict (order_id) do nothing;
    if found then
      update public.coupons set used_count = used_count + 1 where id = v_order.coupon_id;
    end if;
  end if;

  if v_order.quotation_id is not null then
    update public.quotation_requests set status = 'converted' where id = v_order.quotation_id;
  end if;

  if v_order.user_id is not null then
    insert into public.notifications (user_id, audience, type, title, body, link)
      values (v_order.user_id, 'customer', 'order_paid', 'Payment received',
              'We have received payment for order ' || v_order.order_number || '.',
              '/account/orders/' || v_order.id);
  end if;
  insert into public.notifications (audience, type, title, body, link)
    values ('admin', 'new_order', 'New paid order ' || v_order.order_number,
            v_order.full_name || ' paid ' || v_order.currency || ' ' || v_order.total,
            '/admin/orders/' || v_order.id);

  return jsonb_build_object('ok', true, 'already_processed', false, 'order_id', v_order.id);
end;
$$;

