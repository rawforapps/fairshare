/**
 * Universal Payment Deep-Link Engine
 * Generates 1-tap direct settlement URIs across global payment rails.
 */

export interface PaymentTarget {
  method: 'VENMO' | 'CASH_APP' | 'UPI' | 'REVOLUT' | 'PAYPAL';
  recipientHandle: string; // e.g. "@alice", "$alice", "alice@okaxis", "alice"
  amountCents: bigint;
  currency: string;
  note?: string;
}

export function generatePaymentDeepLink(target: PaymentTarget): string {
  const amountFloat = (Number(target.amountCents) / 100).toFixed(2);
  const noteEncoded = encodeURIComponent(target.note ?? 'FairShare Settle Up');

  switch (target.method) {
    case 'VENMO': {
      // Clean handle (remove leading @ if present)
      const handle = target.recipientHandle.replace(/^@/, '');
      // venmo://paycharge?txn=pay&recipients=handle&amount=25.00&note=Trip
      return `venmo://paycharge?txn=pay&recipients=${handle}&amount=${amountFloat}&note=${noteEncoded}`;
    }

    case 'CASH_APP': {
      // Clean cashtag (remove leading $ if present)
      const cashtag = target.recipientHandle.replace(/^\$/, '');
      // https://cash.app/$handle/25.00
      return `https://cash.app/$${cashtag}/${amountFloat}`;
    }

    case 'UPI': {
      // Common across GPay, PhonePe, Paytm, BHIM in India
      // upi://pay?pa=handle@bank&pn=Recipient&am=250.00&cu=INR&tn=FairShare
      return `upi://pay?pa=${target.recipientHandle}&am=${amountFloat}&cu=${target.currency}&tn=${noteEncoded}`;
    }

    case 'REVOLUT': {
      // revolut.me/handle
      const handle = target.recipientHandle.replace(/^@/, '');
      return `https://revolut.me/${handle}/${amountFloat}`;
    }

    case 'PAYPAL': {
      // paypal.me/handle/25.00USD
      const handle = target.recipientHandle.replace(/^@/, '');
      return `https://paypal.me/${handle}/${amountFloat}${target.currency}`;
    }

    default:
      return '';
  }
}
