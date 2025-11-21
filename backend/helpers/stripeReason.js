// helpers/stripeReason.js
export function normalizeStripeReason(input) {
  if (!input) return 'requested_by_customer';

  const normalized = String(input).toLowerCase().trim();

  
  const allowed = new Set(['duplicate', 'fraudulent', 'requested_by_customer']);

  
  const map = {
    'fraud': 'fraudulent',
    'fraudulent': 'fraudulent',
    'duplicate': 'duplicate',
    'requested': 'requested_by_customer',
    'requested_by_customer': 'requested_by_customer',
    'cancelled by admin': 'requested_by_customer',
    'canceled by admin': 'requested_by_customer',
    'out of stock': 'requested_by_customer',
    'customer_changed_mind': 'requested_by_customer',
    'customer changed mind': 'requested_by_customer',
  };

  if (map[normalized]) return map[normalized];
  if (allowed.has(normalized)) return normalized;

  return 'requested_by_customer';
}
