// Bengali digit + date helpers
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

const BN_WEEKDAYS = [
  "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার",
  "বৃহস্পতিবার", "শুক্রবার", "শনিবার",
];

export function formatBnDate(date: Date): string {
  const day = toBnDigits(date.getDate());
  const month = BN_MONTHS[date.getMonth()];
  const year = toBnDigits(date.getFullYear());
  const weekday = BN_WEEKDAYS[date.getDay()];
  return `${day} ${month} ${year}, ${weekday}`;
}

export function formatBnCurrency(n: number): string {
  return `৳ ${toBnDigits(Math.round(Number(n) || 0).toLocaleString("en-IN"))}`;
}

// Phase 4 alias — Indian-style lakh/crore grouping with ৳ prefix.
export const formatBDT = formatBnCurrency;

