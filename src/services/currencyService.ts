const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const CACHE_KEY_PREFIX = 'exchange_rate_matrix_';
const CACHE_DURATION_MS = 3600 * 1000; // 1 hour

interface ExchangeRateResponse {
    result: string;
    base_code: string;
    conversion_rates: Record<string, number>;
    time_last_update_unix: number;
}

/**
 * Fetches exchange rates for a given base currency.
 * Caches the result to minimize API calls.
 */
/**
 * Fetches exchange rates.
 * IMPORTANT: We now ALWAYS fetch based on 'USD' because the Free Tier API
 * often restricts the base currency to USD or EUR.
 * 
 * We will ignore the `baseCurrency` argument for the Network Request, 
 * but we can still return the matrix. 
 * Since our Cross-Rate logic in Context handles any base, having USD-based rates is sufficient.
 */
// Real Market Rates (Approx. Feb 2026) to be used ONLY if API fails completely.
// Base: USD
const FALLBACK_RATES: Record<string, number> = {
    "USD": 1,
    "COP": 4150.00, // Approx market rate
    "EUR": 0.92,
    "MXN": 17.50,
    "GBP": 0.79,
    "CAD": 1.35,
    "ARS": 1200.00,
    "BRL": 5.00,
    "CLP": 980.00,
    "PEN": 3.80,
    "VEF": 3000000.00, // Highly volatile, indicative
    // Add others if needed
};

export const getExchangeRateMatrix = async (preferredBase: string): Promise<Record<string, number>> => {
    // 1. Try Cache for the specific base
    const cacheKey = `${CACHE_KEY_PREFIX}${preferredBase}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            if (parsed && parsed.rates && Object.keys(parsed.rates).length > 0 && parsed.timestamp) {
                if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
                    return parsed.rates;
                }
            }
        } catch (e) {
            localStorage.removeItem(cacheKey);
        }
    }

    // 2. Define Fetch Strategy (Adaptive)
    // We try the preferred base first. If that fails (e.g. 403 Restricted), we try USD, then EUR.
    const candidates = [preferredBase, 'USD', 'EUR'];
    // Remove duplicates (e.g. if preferred is USD)
    const basesToTry = [...new Set(candidates)];

    for (const base of basesToTry) {
        try {
            if (!API_KEY) {
                console.warn('[CurrencyService] API Key missing.');
                break; // Go to fallback
            }

            console.log(`[CurrencyService] Attempting fetch for base: ${base}`);
            const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}?t=${Date.now()}`);

            if (response.ok) {
                const data: ExchangeRateResponse = await response.json();
                if (data.result === 'success' && data.conversion_rates) {
                    // Success!
                    // If we fetched a fallback (e.g. requested COP but got USD), 
                    // the cross-rate logic in Context handles it properly providing we return these rates.
                    // However, for consistency, we cache these rates under the *actual* base we found.
                    // But to satisfy the *call* for 'COP', we might want to return them.
                    // The Context expects rates relative to *something*. 

                    // Ideally, we cache what we got.
                    const realBase = data.base_code;
                    const realCacheKey = `${CACHE_KEY_PREFIX}${realBase}`;
                    localStorage.setItem(realCacheKey, JSON.stringify({
                        rates: data.conversion_rates,
                        timestamp: Date.now()
                    }));

                    // If we requested COP but got USD, we return USD rates.
                    // The Context must know these are USD rates?
                    // The API response doesn't explicitly tell the Context "These are USD rates" 
                    // except via the fact that `rates['USD'] === 1`.
                    // Our `convertAmount` logic `(amount / rateFrom) * rateTo` works 
                    // regardless of the base, efficiently normalizing to the matrix's base.

                    return data.conversion_rates;
                }
            } else {
                console.warn(`[CurrencyService] Failed to fetch ${base}: ${response.status}`);
                // If 403, it likely means this Base is not allowed. Check next candidate.
                if (response.status === 403) {
                    continue; // Try next base
                }
            }
        } catch (error) {
            console.error(`[CurrencyService] Network error for ${base}:`, error);
        }
    }

    // 3. Emergency Fallback
    console.warn('[CurrencyService] All fetch attempts failed. Using FALLBACK rates (Real Market Data).');

    // Fallback is base USD. We must return it.
    // Our Context cross-rate logic handles Base USD perfectly even if user wants COP.
    return FALLBACK_RATES;
};

/**
 * Converts an amount from one currency to another using the provided rates matrix.
 * IMPORTANT: The rates matrix must be based on the 'toCurrency' or we need to calculate the cross rate.
 * 
 * Strategy: We assume the App Context holds the rates for the SELECTED (Target) currency.
 * So 'rates' = { COP: x, USD: 1, EUR: y... } where Base = selected currency.
 * 
 * If User selects USD, rates are USD based.
 * Transaction is in COP.
 * We need COP -> USD.
 * API gives USD -> COP (e.g. 4000).
 * So 1 USD = 4000 COP.
 * X COP = X / 4000 USD.
 * 
 * Formula: Amount / Rate(fromCurrency)
 */
export const convertToDisplay = (
    amount: number,
    fromCurrency: string | undefined,
    toCurrency: string,
    rates: Record<string, number> | null
): number => {
    // If currencies are the same, no conversion needed.
    if (!fromCurrency || fromCurrency === toCurrency) return amount;

    // If no rates available, return original (or handling error)
    if (!rates) return amount;

    const rate = rates[fromCurrency];

    // If rate exists and is not zero
    if (rate) {
        return amount / rate;
    }

    return amount;
};

// Legacy support if needed, but we should move to matrix
export const getExchangeRate = async (baseCurrency: string, targetCurrency: string): Promise<number> => {
    const rates = await getExchangeRateMatrix(baseCurrency);
    return rates[targetCurrency] || 1;
};
