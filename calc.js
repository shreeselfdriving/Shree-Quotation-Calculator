/* Self Drive Quotation Calculator - shared calculation core.
   No dependencies. Exposed as window.RentalCalc (or CommonJS module). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RentalCalc = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function toDate(value) {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    if (value === null || value === undefined || value === '') return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  /* Lenient numeric coercion for display formatting (unparseable -> 0). */
  function num(value) {
    var n = typeof value === 'number' ? value : parseFloat(value);
    return isFinite(n) ? n : 0;
  }

  /* Strict parse: returns NaN when empty/non-numeric, so missing input can be
     told apart from an explicit 0. */
  function rawNum(value) {
    if (value === null || value === undefined) return NaN;
    if (typeof value === 'number') return isFinite(value) ? value : NaN;
    var s = String(value).trim();
    if (s === '') return NaN;
    var n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  }

  /* Monetary input: never negative, missing/invalid -> 0. */
  function money(value) {
    var n = rawNum(value);
    return isFinite(n) ? Math.max(0, n) : 0;
  }

  /* Core billing rules (PRD section 4, F3-F5):
     totalHours      = ceil(return - pickup)
     days            = max(1, floor(totalHours / 24))
     includedHours   = days * 24
     extraHours      = totalHours - includedHours  (never below 0)
     rental          = days * ratePerDay
     extraHourCharge = extraHours * extraHourRate
     totalRental     = rental + extraHourCharge
     discount        = amount, or percent of totalRental, capped at totalRental
     payable         = totalRental - discount + deposit - token
     Validation: both dates required; return must be after pickup; the day rate
     must be a number; the extra-hour rate is required only when extra hours
     apply. Negative amounts are clamped to 0. */
  function compute(input) {
    input = input || {};

    var pickup = toDate(input.pickup);
    var ret = toDate(input.return);
    var error = null;
    var totalHours = 0;

    if (!pickup || !ret) {
      error = 'Enter both pickup and return date/time.';
    } else if (ret.getTime() <= pickup.getTime()) {
      error = 'Return date/time must be after the pickup date/time.';
    } else {
      totalHours = Math.ceil((ret.getTime() - pickup.getTime()) / 3600000);
    }

    var days = Math.max(1, Math.floor(totalHours / 24));
    var includedHours = days * 24;
    var extraHours = Math.max(0, totalHours - includedHours);

    var ratePerDay = money(input.ratePerDay);
    var extraHourRate = money(input.extraHourRate);
    var includedKM = money(input.includedKM);
    var extraKMRate = money(input.extraKMRate);
    var deposit = money(input.deposit);
    var token = money(input.token);

    if (!error) {
      if (!isFinite(rawNum(input.ratePerDay))) {
        error = 'Enter a valid rate per day.';
      } else if (extraHours > 0 && !isFinite(rawNum(input.extraHourRate))) {
        error = 'Enter a valid extra hour rate.';
      }
    }

    var rental = ratePerDay * days;
    var extraHourCharge = extraHours * extraHourRate;
    var totalRental = rental + extraHourCharge;

    var discountType = input.discountType === 'percent' ? 'percent' : 'amount';
    var discountValue = money(input.discountValue);
    var discount = discountType === 'percent'
      ? totalRental * Math.min(100, discountValue) / 100
      : discountValue;
    discount = Math.round(Math.max(0, Math.min(totalRental, discount)));

    var payable = totalRental - discount + deposit - token;

    return {
      error: error,
      totalHours: totalHours,
      days: days,
      includedHours: includedHours,
      extraHours: extraHours,
      ratePerDay: ratePerDay,
      extraHourRate: extraHourRate,
      includedKM: includedKM,
      extraKMRate: extraKMRate,
      rental: rental,
      extraHourCharge: extraHourCharge,
      totalRental: totalRental,
      discountType: discountType,
      discountValue: discountValue,
      discount: discount,
      deposit: deposit,
      token: token,
      payable: payable
    };
  }

  /* Indian rupee formatting, e.g. 4500 -> "₹4,500" */
  function formatINR(value) {
    var v = num(value);
    var sign = v < 0 ? '-' : '';
    return sign + '\u20B9' + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  /* "14 October 2026 | 03:00 PM" (12-hour clock) */
  function formatDateTime(value) {
    var d = toDate(value);
    if (!d) return '';
    var h = d.getHours();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    var hh = (h < 10 ? '0' : '') + h;
    var mm = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' | ' + hh + ':' + mm + ' ' + ampm;
  }

  /* "2026-10-14" -> "14 October 2026" (timezone-safe) */
  function formatDateOnly(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value == null ? '' : value));
    if (!m) return '';
    return (+m[3]) + ' ' + MONTHS[(+m[2]) - 1] + ' ' + (+m[1]);
  }

  var DIVIDER = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';

  function plural(n, unit) {
    return n + ' ' + unit + (n === 1 ? '' : 's');
  }

  /* "3 Days 5 Hours" (0 extra hours -> just the days). */
  function formatDuration(days, extraHours) {
    var parts = [];
    if (days > 0) parts.push(plural(days, 'Day'));
    if (extraHours > 0) parts.push(plural(extraHours, 'Hour'));
    if (!parts.length) parts.push('0 Hours');
    return parts.join(' ');
  }

  function termLines(inputs, calc) {
    var text = (inputs.terms || '')
      .replace(/\{deposit\}/g, formatINR(calc.deposit))
      .replace(/\{includedKM\}/g, calc.includedKM)
      .replace(/\{extraKMRate\}/g, formatINR(calc.extraKMRate))
      .replace(/\{extraHourRate\}/g, formatINR(calc.extraHourRate))
      .replace(/\{rate\}/g, formatINR(calc.ratePerDay));
    return text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  }

  /* Single source of truth for the quotation content: which sections and rows
     exist, and their values. Both the plain-text and the HTML renderers read
     this view, so the layout rules (and the omit-when-zero conditions) live in
     exactly one place. */
  function buildView(inputs, calc) {
    var customer = [];
    if (inputs.customerName) customer.push({ label: 'Prepared For', value: inputs.customerName });
    if (inputs.quotationDate) customer.push({ label: 'Quotation Date', value: formatDateOnly(inputs.quotationDate) });

    var charges = [
      { label: 'Rental Charges (' + formatINR(calc.ratePerDay) + ' \u00D7 ' + calc.days + ' Days)', value: formatINR(calc.rental) }
    ];
    if (calc.extraHours > 0) {
      charges.push({ label: 'Extra Hours (' + calc.extraHours + ' \u00D7 ' + formatINR(calc.extraHourRate) + ')', value: formatINR(calc.extraHourCharge) });
    }
    charges.push({ label: 'Total Rental Amount', value: formatINR(calc.totalRental), bold: true });
    if (calc.discount > 0) {
      var pct = calc.discountType === 'percent' ? ' (' + calc.discountValue + '%)' : '';
      charges.push({ label: 'Less Offer / Discount' + pct, value: '\u2212' + formatINR(calc.discount), credit: true });
    }
    if (calc.deposit > 0) charges.push({ label: 'Refundable Security Deposit', value: formatINR(calc.deposit) });
    if (calc.token > 0) charges.push({ label: 'Less Token Payment Received', value: '\u2212' + formatINR(calc.token) });

    var sections = [
      { title: '\uD83D\uDE98 VEHICLE DETAILS', rows: [
        { label: 'Vehicle', value: inputs.vehName },
        { label: 'Fuel Type', value: inputs.vehFuel },
        { label: 'Rental Type', value: inputs.vehType },
        { label: 'Seating Capacity', value: inputs.vehSeats }
      ] },
      { title: '\uD83D\uDCC5 TRIP DETAILS', gap: true, rows: [
        { label: '\uD83D\uDFE2 Pickup', value: formatDateTime(inputs.pickup), labelBold: true },
        { label: '\uD83D\uDD34 Return', value: formatDateTime(inputs.return), labelBold: true }
      ] },
      { title: '\u23F3 RENTAL DURATION', rows: [
        { label: 'Total Duration', value: formatDuration(calc.days, calc.extraHours), bold: true },
        { label: 'Total Rental Days', value: plural(calc.days, 'Day') },
        { label: 'Extra Hours', value: calc.extraHours > 0 ? plural(calc.extraHours, 'Hour') : 'Nil' }
      ] },
      { title: '\uD83D\uDEE3\uFE0F KM PACKAGE', rows: [
        { label: 'Included KM Limit', value: calc.includedKM > 0 ? calc.includedKM + ' KM' : 'Unlimited' },
        { label: 'Extra KM Charges', value: formatINR(calc.extraKMRate) + ' Per KM' },
        { label: 'Extra Hour Charges', value: formatINR(calc.extraHourRate) + ' Per Hour' }
      ] },
      { title: '\uD83D\uDCB0 RENTAL CHARGES', gap: true, rows: charges }
    ];

    if (customer.length) {
      sections.unshift({ title: '\uD83E\uDDFE CUSTOMER DETAILS', gap: false, rows: customer });
    }

    return {
      bizName: inputs.bizName,
      sub: inputs.vehType,
      sections: sections,
      payable: { label: 'TOTAL PAYABLE AT HANDOVER', value: formatINR(calc.payable) },
      termsTitle: '\uD83D\uDCCC TERMS & CONDITIONS',
      terms: termLines(inputs, calc),
      phone: inputs.bizPhone
    };
  }

  /* Plain-text quotation (WhatsApp template). */
  function buildText(view) {
    var L = [];
    L.push('\uD83D\uDE97 *' + view.bizName.toUpperCase() + '*');
    L.push('');
    L.push('*' + view.sub.toUpperCase() + ' QUOTATION*');
    view.sections.forEach(function (sec) {
      L.push('', DIVIDER, '');
      L.push('*' + sec.title + '*');
      if (sec.gap) L.push('');
      sec.rows.forEach(function (r) {
        if (r.bold) L.push('\u2022 *' + r.label + ': ' + r.value + '*');
        else if (r.labelBold) L.push('\u2022 *' + r.label + ':* ' + r.value);
        else L.push('\u2022 ' + r.label + ': ' + r.value);
      });
    });
    L.push('', DIVIDER, '');
    L.push('\u2705 *' + view.payable.label + ': ' + view.payable.value + '*');
    L.push('', DIVIDER, '');
    L.push('*' + view.termsTitle + '*');
    view.terms.forEach(function (t) { L.push('\u2022 ' + t); });
    L.push('', DIVIDER, '');
    L.push('\uD83D\uDE4F *THANK YOU!*');
    L.push('');
    L.push('Thank you for choosing *' + view.bizName + '.*');
    L.push('');
    L.push('We look forward to providing you with a safe and comfortable self-drive experience. \uD83D\uDE97');
    if (view.phone) L.push('', '\uD83D\uDCDE Bookings / Enquiries: ' + view.phone);
    return L.join('\n');
  }

  return {
    MONTHS: MONTHS,
    toDate: toDate,
    compute: compute,
    formatINR: formatINR,
    formatDateTime: formatDateTime,
    formatDateOnly: formatDateOnly,
    buildView: buildView,
    buildText: buildText
  };
});
