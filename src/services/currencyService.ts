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
export const getExchangeRateMatrix = async (baseCurrency: string): Promise<Record<string, number>> => {
    const cacheKey = `${CACHE_KEY_PREFIX}${baseCurrency}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        const { rates, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION_MS) {
            return rates;
        }
    }

    // Fetch from API
    try {
        if (!API_KEY) {
            console.error('ExchangeRate API Key is missing');
            return {};
        }

        const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`);
        if (!response.ok) throw new Error('Failed to fetch exchange rates');

        const data: ExchangeRateResponse = await response.json();

        if (data.result === 'success') {
            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify({
                rates: data.conversion_rates,
                timestamp: Date.now()
            }));

            return data.conversion_rates;
        } else {
            console.error('ExchangeRate API error:', data);
            return {};
        }
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return {};
    }
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
