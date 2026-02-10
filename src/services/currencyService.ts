const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const CACHE_KEY_PREFIX = 'exchange_rate_matrix_';
const CACHE_DURATION_MS = 3600 * 1000; // 1 hour

// Open Exchange Rates Response Interface
interface OpenExchangeRatesResponse {
    disclaimer: string;
    license: string;
    timestamp: number;
    base: string;
    rates: Record<string, number>;
}

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
                    console.info(`%c [CurrencyService] Cache Válido (Base: ${parsed.base || 'N/A'})`, 'color: #3b82f6');
                    return parsed.rates;
                }
            }
        } catch (e) {
            localStorage.removeItem(cacheKey);
        }
    }

    // 2. Define Fetch Strategy (Adaptive)
    // Open Exchange Rates Free Tier allows ONLY 'USD' base.
    // However, enterprise plans allow changing base. 
    // We try 'USD' first if preferred is not set, or we try preferred then USD.
    // Given the prompt "Mantener moneda base COP", we try COP first.
    const candidates = [preferredBase, 'USD'];
    const basesToTry = [...new Set(candidates)];

    for (const base of basesToTry) {
        try {
            if (!API_KEY) {
                console.warn('[CurrencyService] API Key missing.');
                break; // Go to fallback
            }

            // OER Endpoint
            const url = `https://openexchangerates.org/api/latest.json?app_id=${API_KEY}&base=${base}`;

            const response = await fetch(url, {
                mode: 'cors'
            });

            if (response.ok) {
                const data: OpenExchangeRatesResponse = await response.json();

                // OER returns 'rates', not 'conversion_rates'
                if (data && data.rates) {
                    // Success!
                    console.info(`%c [CurrencyService] Conexión Real Establecida (Base: ${data.base})`, 'color: #10b981; font-weight: bold;');

                    const realBase = data.base;
                    const realCacheKey = `${CACHE_KEY_PREFIX}${realBase}`;

                    // Update Cache
                    localStorage.setItem(realCacheKey, JSON.stringify({
                        rates: data.rates,
                        timestamp: Date.now(),
                        base: realBase
                    }));

                    return data.rates;
                }
            } else {
                console.warn(`[CurrencyService] Failed to fetch ${base}: ${response.status}`);
                // 403 likely means Base Restricted (Free Tier)
                if (response.status === 403 || response.status === 401) {
                    continue; // Try next base
                }
            }
        } catch (error) {
            console.error(`[CurrencyService] Network error for ${base}:`, error);
        }
    }

    // 3. Emergency Fallback
    console.warn('[CurrencyService] Todos los intentos de conexión fallaron. Activando Modo Contingencia (Datos Locales).');
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
