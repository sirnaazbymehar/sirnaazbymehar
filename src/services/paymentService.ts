// ─────────────────────────────────────────────────────────────
//  Payment gateway adapter — Razorpay goes here in Phase 9.
//
//  Planned flow:
//   1. POST /api/orders creates the order with payment_status 'pending'.
//   2. Server creates a Razorpay order with the SECRET key (server env only)
//      and returns { razorpayOrderId, amountPaise, keyId }.
//   3. Browser opens Razorpay Checkout with the PUBLIC keyId.
//   4. Server verifies the signature (and listens to Razorpay webhooks)
//      before marking the order 'paid'. The browser's word is never trusted.
//
//  Until then, Admin → Settings keeps "Online payments" switched off and
//  checkout offers Cash on Delivery only.
// ─────────────────────────────────────────────────────────────
export {}
