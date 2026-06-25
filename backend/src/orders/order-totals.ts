export const FREE_SHIPPING_THRESHOLD = 200000;
export const STANDARD_SHIPPING_FEE = 12000;
export const TAX_RATE = 0.035;

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export function calculateOrderTotals(
  subtotal: number,
  discount = 0,
): OrderTotals {
  const normalizedSubtotal = Math.max(0, Math.round(subtotal));
  const normalizedDiscount = Math.min(
    Math.max(0, Math.round(discount)),
    normalizedSubtotal,
  );
  const shipping =
    normalizedSubtotal === 0 || normalizedSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;
  const tax = Math.round(normalizedSubtotal * TAX_RATE);
  const total = Math.max(
    0,
    normalizedSubtotal - normalizedDiscount + shipping + tax,
  );

  return {
    subtotal: normalizedSubtotal,
    discount: normalizedDiscount,
    shipping,
    tax,
    total,
  };
}
