# Iraq Mobile Money Integration

## Status (May 2026)

Three providers dominate B2C and B2B small-ticket payments in Iraq:

| Provider     | Operator           | API access                                          |
|--------------|--------------------|-----------------------------------------------------|
| Zain Cash    | Zain Iraq          | Merchant account required, REST API on request      |
| FastPay (FIB) | First Iraqi Bank  | Merchant onboarding via FIB, REST API privately doc'd |
| Asia Hawala  | Asiacell           | Less mature API; mostly USSD                        |

All three require an Iraqi commercial registration, a signed merchant
agreement, and provider-issued API credentials (not public).

We cannot integrate without a real merchant account, but we have prepared
the plumbing so it's a **plug-in** when you onboard.

## Already in place

### Payment methods (Prisma enum)

```prisma
enum PaymentMethod { CASH BANK_TRANSFER CHEQUE CARD ZAIN_CASH ASIA_HAWALA FIB OTHER }
```

### Chart of accounts

`1115 — Mobile Wallets (Zain Cash, FIB)` is in the seeded IUAS COA.

### Environment variables to add

```
ZAIN_CASH_MERCHANT_ID=""
ZAIN_CASH_API_KEY=""
ZAIN_CASH_API_URL=""
FIB_MERCHANT_ID=""
FIB_API_KEY=""
FIB_API_URL=""
```

## What to build per provider

1. **Outbound (charging a customer)**:
   `src/lib/iraq/mobile-money/<provider>.ts` exporting
   `requestPayment({ to, amount, reference, callbackUrl }) -> { transactionId, status }`.
2. **Inbound webhook** for payment completion:
   `src/app/api/webhooks/<provider>/route.ts` that verifies signature and creates a `Payment`.
3. **Reconciliation report** matching provider statements to our `Payment` ledger.

Expect ~4 hours per provider once you have credentials.
