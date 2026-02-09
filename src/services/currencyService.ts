const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const CACHE_KEY_PREFIX = 'exchange_rate_';
const CACHE_DURATION_MS = 3600 * 1000; // 1 hour

interface ExchangeRateResponse {
    result: string;
    conversion_rates: Record<string, number>;
    time_last_update_unix: number;
}

export const getExchangeRate = async (baseCurrency: string, targetCurrency: string): Promise<number> => {
    if (baseCurrency === targetCurrency) return 1;

    const cacheKey = `${CACHE_KEY_PREFIX}${baseCurrency}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        const { rates, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION_MS) {
            if (rates[targetCurrency]) {
                return rates[targetCurrency];
            }
        }
    }

    // Fetch from API
    try {
        if (!API_KEY) {
            console.error('ExchangeRate API Key is missing');
            return 1; // Fallback
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

            return data.conversion_rates[targetCurrency] || 1;
        } else {
            console.error('ExchangeRate API error:', data);
            return 1;
        }
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return 1;
    }
};
