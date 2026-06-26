# Evals

Offline evaluation suite for the AI Receipt Reader pipeline. Runs without any API keys, network access, or database connection.

```
pnpm eval
```

## What it tests

### Section 1 — Receipt Extraction (Vision AI)

Simulates structured JSON outputs from the vision AI pipeline and validates them against Zod schema + hand-labelled ground truth. Tests the fields returned when a user uploads a receipt image.

| Fixture                  | Scenario                        | Expected outcome                                       |
| ------------------------ | ------------------------------- | ------------------------------------------------------ |
| `01-grocery-tesco.json`  | UK grocery, GBP, 3 items, debit | 10/10 — perfect match                                  |
| `02-restaurant-nyc.json` | US restaurant, USD, credit card | 8/10 — minor tax/total drift                           |
| `03-pharmacy-boots.json` | UK pharmacy                     | **Zod fail** — `"medicine"` not in category enum       |
| `04-petrol-station.json` | UK fuel, £ symbol               | 7/10 — address empty, currency symbol vs code          |
| `05-retail-zara.json`    | EU retail                       | **Zod fail** — `"apple_pay"` not in paymentMethod enum |

### Section 2 — Bank Statement Parsing

Tests structured extraction from PDF bank statements. Validates transaction count, statement period, and account number.

| Fixture                              | Scenario                                         | Expected outcome                                 |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------ |
| `06-statement-barclays.json`         | UK current account, 3 clean transactions         | 4/4 — perfect match                              |
| `07-statement-invalid-category.json` | Mortgage payment with unknown category           | **Zod fail** — `"mortgage"` not in category enum |
| `08-statement-field-mismatch.json`   | HSBC statement, wrong end date + missing account | 2/4 — endDate and accountNumber mismatch         |

### Section 3 — Reconciliation Engine

Inline unit tests for the fuzzy receipt↔transaction matching algorithm. No fixtures needed — test data is built programmatically.

| Case        | Scenario                        | Expected                    |
| ----------- | ------------------------------- | --------------------------- |
| Exact match | Tesco £5.98 same day            | confidence ≥ 0.7 → matched  |
| Near match  | Restaurant 1-day lag            | confidence ≥ 0.6 → matched  |
| No match    | Pharmacy £9.48 vs £42.99        | confidence < 0.6 → no match |
| Substring   | `Shell` vs `SHELL STATION 0847` | confidence ≥ 0.7 → matched  |

Reconciliation weights: **amount 50% · date proximity 30% · merchant name 20%**

## Skills demonstrated

- Vision AI receipt extraction (OpenAI / Anthropic)
- PDF bank statement parsing
- Zod v4 schema validation with enum enforcement
- Multi-currency support (GBP, USD, EUR)
- Fuzzy reconciliation — bigram similarity + amount/date scoring
- AI hallucination detection — invalid enum values caught at runtime
- Numeric tolerance handling (±0.01)
- Type-safe TypeScript throughout (strict mode)

## Exit codes

| Code | Meaning                                                                         |
| ---- | ------------------------------------------------------------------------------- |
| `0`  | All schema-valid fixtures evaluated (field mismatches are warnings, not errors) |
| `1`  | One or more fixtures produced output that fails Zod schema validation           |

Zod failures represent cases where the AI returned an out-of-enum value or missing required field — the kind of hallucination that would corrupt the database without this validation layer.
