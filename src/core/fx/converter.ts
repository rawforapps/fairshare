/**
 * Free Multi-Currency FX Conversion Engine
 * Eliminates Splitwise's paywalled currency conversion.
 * Supports offline cached rates with automatic triangulation.
 */

export interface ExchangeRates {
  base: string; // e.g. "USD"
  rates: Record<string, number>;
  timestamp: number;
}

// Fallback rates cached for offline airplane mode
const DEFAULT_CACHED_RATES: ExchangeRates = {
  base: 'USD',
  rates: {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 154.5,
    CAD: 1.38,
    AUD: 1.52,
    INR: 84.1,
    BRL: 5.75,
  },
  timestamp: Date.now(),
};

export class CurrencyConverter {
  private rates: ExchangeRates = DEFAULT_CACHED_RATES;

  /**
   * Converts an amount in integer cents from one currency to another
   */
  public convertCents(
    amountCents: bigint,
    fromCurrency: string,
    toCurrency: string
  ): bigint {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) return amountCents;

    const fromRate = this.rates.rates[from];
    const toRate = this.rates.rates[to];

    if (!fromRate || !toRate) {
      console.warn(`Missing exchange rate for ${from} or ${to}. Returning original amount.`);
      return amountCents;
    }

    // Triangulate via base currency (USD) with integer cent precision:
    // toAmount = amount * (toRate / fromRate)
    const amountFloat = Number(amountCents);
    const convertedFloat = amountFloat * (toRate / fromRate);

    return BigInt(Math.round(convertedFloat));
  }

  /**
   * Formats cents into currency symbol string
   */
  public formatCents(amountCents: bigint, currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      INR: '₹',
      BRL: 'R$',
    };

    const symbol = symbols[currency.toUpperCase()] ?? `${currency} `;
    const floatVal = Number(amountCents) / (currency.toUpperCase() === 'JPY' ? 1 : 100);

    return `${symbol}${floatVal.toLocaleString('en-US', {
      minimumFractionDigits: currency.toUpperCase() === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency.toUpperCase() === 'JPY' ? 0 : 2,
    })}`;
  }
}
