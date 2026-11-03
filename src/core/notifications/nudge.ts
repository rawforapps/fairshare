/**
 * Friendly Nudge & Reminder Engine
 * Solves the social awkwardness of asking friends for money.
 * Generates pre-composed messages with embedded 1-tap payment deep-links.
 */

import { generatePaymentDeepLink, PaymentTarget } from '../payments/deeplink';

export type NudgeTone = 'CASUAL' | 'POLITE' | 'DIRECT';

export interface NudgeOptions {
  recipientName: string;
  recipientPhone?: string; // e.g. "+15551234567"
  groupName: string;
  amountCents: bigint;
  currency: string;
  paymentTarget?: PaymentTarget;
  tone?: NudgeTone;
}

export function generateNudgeMessage(options: NudgeOptions): string {
  const amountStr = (Number(options.amountCents) / 100).toFixed(2);
  const tone = options.tone ?? 'CASUAL';

  let paymentLink = '';
  if (options.paymentTarget) {
    paymentLink = `\n\nPay in 1 tap: ${generatePaymentDeepLink(options.paymentTarget)}`;
  }

  switch (tone) {
    case 'CASUAL':
      return `Hey ${options.recipientName}! Just wrapping up expenses for "${options.groupName}". Your share is ${options.currency} $${amountStr} whenever you get a sec! 🙌${paymentLink}`;

    case 'POLITE':
      return `Hi ${options.recipientName}, hope you’re doing well! Friendly reminder regarding our group expenses for "${options.groupName}". Your portion comes out to ${options.currency} $${amountStr}. Thanks! 😊${paymentLink}`;

    case 'DIRECT':
      return `Reminder: Outstanding balance of ${options.currency} $${amountStr} for "${options.groupName}". Please settle when possible.${paymentLink}`;
  }
}

/**
 * Creates a universal WhatsApp intent link that opens WhatsApp with pre-filled message
 */
export function generateWhatsAppLink(options: NudgeOptions): string {
  const message = generateNudgeMessage(options);
  const encodedMsg = encodeURIComponent(message);
  const cleanPhone = options.recipientPhone?.replace(/[^0-9]/g, '') ?? '';

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  }
  return `https://wa.me/?text=${encodedMsg}`;
}

/**
 * Creates an SMS intent URL
 */
export function generateSMSLink(options: NudgeOptions): string {
  const message = generateNudgeMessage(options);
  const encodedMsg = encodeURIComponent(message);
  const phone = options.recipientPhone ?? '';

  // Cross-platform SMS URI scheme
  return `sms:${phone}?&body=${encodedMsg}`;
}
