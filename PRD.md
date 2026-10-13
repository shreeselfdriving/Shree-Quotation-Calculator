# PRD - Self Drive Quotation Calculator

**Owner:** Shree Self Driving & Car Rental Service  |  **Version:** 1.0

## 1. Problem
Quotations are typed by hand in WhatsApp. Hours, extra-hour charges and the handover total are calculated manually, which is slow and error-prone.

## 2. Goal
A single web page where staff enter trip details and rates; all numbers calculate automatically and a ready-to-send WhatsApp quotation is produced in the existing format.

## 3. Users
Rental staff/owner (mobile first), sharing quotes with customers over WhatsApp.

## 4. Functional requirements

| ID | Requirement |
|----|-------------|
| F1 | Inputs: vehicle, fuel, seats, pickup & return date-time |
| F2 | Editable rates: per-day, extra-hour, included KM, extra-KM, deposit, token |
| F3 | Total hours = ceil(return - pickup). Days = max(1, floor(hours/24)). Extra hours = hours - days×24 |
| F4 | Rental = days × day rate; extra-hour charge = extra hours × hour rate |
| F5 | Payable at handover = total rental + deposit - token |
| F6 | Live update on every input change (no submit button) |
| F7 | Validation: return must be after pickup |
| F8 | Output text matches the current WhatsApp template (bold `*`, emojis, ₹ with Indian grouping) |
| F9 | Copy button, WhatsApp share link, Print/Save PDF |
| F10 | Dark / light theme toggle (preference remembered on the device) |
| F11 | Customer name and quotation date shown on the quotation |
| F12 | Offer / discount: flat amount or percent, capped at the rental amount |
| F13 | Calendar date picker with 12-hour (AM/PM) hour and minute selectors |
| F14 | Download a single-page PDF (print-optimised A4 layout) |
| F15 | Fully responsive layout for mobile, tablet and laptop |

## 5. Non-functional
- Static site, no backend, no data stored; works offline after load.
- Mobile, tablet and laptop responsive; dark + light themes; keyboard accessible.
- Loads < 1 s; zero dependencies.

## 6. Acceptance criteria (sample)
14 Oct 2026 3 PM → 17 Oct 2026 8 PM, ₹1500/day, ₹100/hr, deposit ₹4000, token ₹1000 → 77 hrs, 3 days, 5 extra hrs, rental ₹5,000, payable ₹8,000.

With a ₹500 offer: payable becomes ₹7,500. A 10% offer is also a flat ₹500 off here.

## 7. Out of scope (v1)
Login, saving quotes, invoice numbers, GST, customer database, auto extra-KM billing (needs odometer entry at return).
Possible v2: cap extra hours at 1 day rate, quote history, per-vehicle presets, business logo/phone number.

## 8. Test plan
1. Open `/tests.html` - all cases must show ✅ (happy path, edge cases and validation errors).
2. Manual: change dates/rates in `/` and confirm table + text update; try return < pickup (error shown); click Copy and paste into WhatsApp; test on phone width.

## 9. Run & deploy

**Localhost**
```
cd shree-quote
npx serve . -l 3000        # or: python -m http.server 3000
```
Open http://localhost:3000 (landing), /quote (calculator) and http://localhost:3000/tests.html

**Vercel**
- CLI: `npm i -g vercel` → `vercel` (preview) → `vercel --prod`
- Or: push folder to GitHub → vercel.com → Add New Project → import repo → Framework "Other", no build command, output directory root → Deploy.

## 10. Risks
Billing rule for extra hours (full-day cap, grace period) is business policy; confirm before v2.
