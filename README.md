# Shree Self Drive - Quotation Calculator

Static web app that turns trip details, rates and offers into a formatted
WhatsApp-ready self-drive quotation, plus a single-page PDF. All numbers
calculate automatically. No backend, no build step, zero runtime dependencies.

## Pages
- `/` (`index.html`) - landing page
- `/quote` (`quote/index.html`) - the quotation calculator
- `/tests.html` - calculation/test runner (should show all ✅)

Shared files: `calc.js` (calculation + quotation text/view), `theme.js`
(dark/light toggle), `styles.css` (themes + layout).

## Features
- Live auto calculation of duration, days, extra hours, rental, discount and
  the handover total.
- Customer name and quotation date on the quotation.
- Pickup/return picked from a calendar (`<input type="date">`) with 12-hour
  hour + minute + AM/PM selectors.
- Offer/discount as a flat amount or a percent (capped at the rental amount).
- Dark and light themes via the toggle; the choice is remembered on the device.
- Copy, WhatsApp share, and a print-optimised **single-page PDF** (A4).
- Responsive layout for mobile, tablet and laptop.

## Run locally
```
npx serve . -l 3000
# or
python -m http.server 3000
```
Open http://localhost:3000

## Tests
Open http://localhost:3000/tests.html . All cases must show ✅ (happy path,
edge cases, validation errors, discounts, and the WhatsApp template output).

## Billing rules
- totalHours = ceil(return - pickup)
- days = max(1, floor(totalHours / 24))
- includedHours = days * 24 ; extraHours = max(0, totalHours - includedHours)
- rental = days * ratePerDay ; extraHourCharge = extraHours * extraHourRate
- totalRental = rental + extraHourCharge
- discount = amount, or percent of totalRental, capped at totalRental
- payable = totalRental - discount + deposit - token

Missing dates or an empty day rate raise a validation error instead of producing
a misleading quote. Negative amounts are clamped to 0. Extra-KM billing is
intentionally out of scope (would need an odometer reading at return); included
KM and extra-KM rate are shown in the quotation only.

## Theme storage
The only thing stored on the device is the theme preference (`localStorage`,
key `sdr-theme`). No customer or quote data is saved.

## Deploy to Vercel
CLI:
```
npm i -g vercel
vercel          # preview
vercel --prod   # production
```
Or import the repo/folder in the Vercel dashboard with Framework preset
"Other", no build command, output directory root. `vercel.json` pins this.
