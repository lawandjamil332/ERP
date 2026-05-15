# Module Reference

Quick reference for every module in the system.

## Accounting & GL
| Item                 | Path                                                       |
|----------------------|------------------------------------------------------------|
| Chart of accounts    | `src/app/[locale]/dashboard/accounting`                    |
| IUAS seed            | `src/lib/iraq/coa.ts`                                      |
| Journals             | `src/lib/iraq/journals.ts`                                 |
| Year-end closing     | `POST /api/closing/year-end` — `src/lib/iraq/closing.ts`   |
| Trial balance        | `GET /api/reports/trial-balance`                           |
| Income statement     | `GET /api/reports/profit-loss`                             |
| Balance sheet        | `GET /api/reports/balance-sheet`                           |
| Excel export         | `GET /api/export/trial-balance` (xls)                      |

## Sales
| Invoices list      | `/dashboard/invoices`                                                    |
| Create invoice     | `POST /api/invoices` (Iraq Nov-2025 fields)                              |
| Invoice detail     | `/dashboard/invoices/[id]` (bilingual print-ready)                       |
| Invoice PDF        | `GET /api/invoices/[id]/pdf`                                              |
| WhatsApp send      | `GET /api/invoices/[id]/whatsapp`                                         |
| ASYCUDA export     | `GET /api/invoices/[id]/asycuda`                                          |

## Purchases
| Bills              | `/dashboard/bills` · `POST /api/bills` (WHT 15% non-resident)            |
| Payments           | `/dashboard/payments` · `POST /api/payments`                             |
| Cheques            | `/dashboard/cheques` · `POST /api/cheques` (Iraqi essential)             |

## Inventory & Manufacturing
| Products           | `POST /api/products` (HS, origin, trademark)                              |
| Stock movements    | `POST /api/stock/movements`                                               |
| BOM                | `POST /api/manufacturing/bom`                                             |

## HR & Payroll
| Tax engine         | `src/lib/iraq/tax.ts`                                                     |
| EoS indemnity      | `src/lib/iraq/eosi.ts`                                                    |
| GCT D/4A           | `GET /api/reports/d4a?format=csv`                                         |

## POS
| Open / close session | `POST /api/pos/session`                                                  |
| Order checkout       | `POST /api/pos/order` (auto-posts journal)                               |

## Banking
| Import statement   | `POST /api/bank/import` (bulk rows)                                       |
| Reconcile          | `POST /api/bank/reconcile`                                                |

## Construction
| Projects           | `/dashboard/projects` · retention defaults to 10%                        |

## Hospitality
| Folios             | `POST /api/hospitality/folio` (10% IQ tax)                               |

## Fixed assets
| Monthly run        | `POST /api/depreciation/run`                                              |

## Security & access
| Login / signup     | `/auth/login` · `/auth/signup` · `POST /api/tenants/signup`              |
| 2FA                | `POST /api/auth/2fa/setup` then `POST /api/auth/2fa/verify`               |
| RBAC               | `src/lib/auth/rbac.ts`                                                    |

## Customer portal
| Read-only invoices | `/portal/[token]` · `POST /api/portal/create`                            |

## Audit & notifications
| Audit              | `/dashboard/audit` · `GET /api/audit`                                    |
| Notifications      | `GET /api/notifications`                                                  |

## Future (documented integration hooks)
| GCT e-invoicing    | `docs/E_INVOICING_GCT.md`                                                 |
| General VAT        | `docs/VAT_FUTURE.md` · `src/lib/iraq/vat.ts`                              |
| Mobile money       | `docs/MOBILE_MONEY.md`                                                    |
