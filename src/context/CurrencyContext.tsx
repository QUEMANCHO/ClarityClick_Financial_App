// @ts-ignore
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getExchangeRateMatrix } from '../services/currencyService';

interface CurrencyContextType {
    currency: string;
    setCurrency: (currency: string) => Promise<void>;
    formatCurrency: (amount: number, originalCurrency?: string) => string;
    convertAmount: (amount: number, originalCurrency?: string, targetCurrency?: string) => number;
    loading: boolean;
    exchangeRates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const AVAILABLE_CURRENCIES = [
    { code: 'COP', locale: 'es-CO', label: 'Peso Colombiano ($)' },
    { code: 'USD', locale: 'en-US', label: 'Dólar Estadounidense ($)' },
    { code: 'EUR', locale: 'es-ES', label: 'Euro (€)' },
    { code: 'MXN', locale: 'es-MX', label: 'Peso Mexicano ($)' },
];

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('currency_preference') || 'COP';
        }
        return 'COP';
    });
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    // Initial Load: User preference
    useEffect(() => {
        const loadCurrencyPreference = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('perfiles')
                        .select('currency')
                        .eq('id', user.id)
                        .single();

                    if (data?.currency) {
                        setCurrencyState(data.currency);
                    }
                }
            } catch (err) {
                console.error('Error loading currency preference:', err);
                // Fallback to COP if error
                setCurrencyState('COP');
            } finally {
                setLoading(false);
            }
        };

        loadCurrencyPreference();
    }, []);

    // Fetch Rates - Always fetch USD based rates (Universal Pivot)
    useEffect(() => {
        const fetchRates = async () => {
            // Requests rates for the current currency.
            // The service now handles "Adaptive Base" fetching. 
            // If 'COP' works, great. If not, it falls back to USD/EUR automatically.
            const rates = await getExchangeRateMatrix(currency);

            // Audit Log
            /*
            if (rates && Object.keys(rates).length > 0) {
                console.group('Currency Audit: Rates Loaded (Base: USD)');
                console.log(`App Target Currency: ${currency}`);
                console.table(rates);
                console.groupEnd();
            } else {
                console.warn('Currency Audit: No rates loaded.');
            }
            */

            setExchangeRates(rates || {});
        };

        fetchRates();
        // We reload rates if currency changes just to trigger re-render or check, 
        // but technically rates are static (USD based) for the session until expiry.
    }, [currency]);

    const setCurrency = async (newCurrency: string) => {
        if (!newCurrency) return; // Prevent empty/undefined
        setCurrencyState(newCurrency);
        localStorage.setItem('currency_preference', newCurrency);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('perfiles')
                    .update({ currency: newCurrency })
                    .eq('id', user.id);

                if (error) throw error;
            }
        } catch (err) {
            console.error('Error saving currency preference:', err);
        }
    };

    /**
     * Strict Conversion Logic
     * Formula: (Amount * Rate(to)) / Rate(from)
     * 
     * NOTE: This assumes 'exchangeRates' is relative to the CURRENT 'currency' (Base).
     * If 'currency' is COP, then exchangeRates['USD'] is how many USD you get for 1 COP? 
     * OR is it how many COP are in 1 USD?
     * 
     * checking `currencyService.ts`:
     * response = fetch(.../latest/${baseCurrency})
     * conversion_rates: { USD: 1, COP: 4000 } -> This means 1 Base (USD) = 4000 COP.
     * 
     * So if we fetch with `currency` (e.g. COP) as base:
     * rates = { COP: 1, USD: 0.00025 } -> 1 COP = 0.00025 USD.
     * 
     * To convert 10000 COP to USD: 10000 * 0.00025 = 2.5 USD. Correct.
     * 
     * What if we want to convert 10 USD to COP (and base is COP)?
     * We don't have USD based rates. We have COP based rates.
     * To go FROM USD TO COP using COP-based rates:
     * We know 1 COP = Rate(USD) * USD.
     * So 1 USD = 1 / Rate(USD) COP.
     * Amount(COP) = Amount(USD) * (1 / Rate(USD)).
     * 
     * Let's generalize using a "Universal Base" approach or Cross-Calculation?
     * Actually, if we always fetch rates for the *current application currency* (Target),
     * then `exchangeRates` tells us: "1 AppCurrency = X OtherCurrency".
     * 
     * Case 1: Displaying a transaction (Original: USD) in App (COP).
     * App Base = COP. Rates = { COP: 1, USD: 0.00025 }.
     * We have 10 USD. We want COP.
     * value = 10 / 0.00025 = 40,000.
     * 
     * Case 2: Displaying a transaction (Original: COP) in App (USD).
     * App Base = USD. Rates = { USD: 1, COP: 4000 }.
     * We have 40,000 COP. We want USD.
     * value = 40000 / 4000 = 10.
     * 
     * General Formula when Rates are based on Target (App Currency):
     * Value(Target) = Value(Source) / Rate(Source)
     */
    /**
     * Strict Conversion Logic with Cross-Rate Support
     * Formula: (Amount / Rate(from)) * Rate(to)
     * 
     * Why? 
     * API returns rates relative to a Base (e.g. USD).
     * Rate(from) = Amount of FromCurrency needed to buy 1 Base.
     * Rate(to) = Amount of ToCurrency needed to buy 1 Base.
     * 
     * Example: Base=USD. Rates={COP: 4000, EUR: 0.9}
     * We have 100,000 COP. Want EUR.
     * 1. Convert to Base (USD): 100,000 / 4000 = 25 USD.
     * 2. Convert Base to Target (EUR): 25 * 0.9 = 22.5 EUR.
     * 
     * Combined: (100,000 / 4000) * 0.9 = 22.5.
     */
    const convertAmount = useCallback((amount: number, originalCurrency: string = 'COP', targetCurrency?: string) => {
        const target = targetCurrency || currency;

        // Edge case: Same currency
        if (originalCurrency === target) return amount;

        // Validation: Rates exist?
        if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
            console.warn('[CurrencyContext] Rates not loaded. Returning original amount.');
            return amount;
        }

        const rateFrom = exchangeRates[originalCurrency];
        const rateTo = exchangeRates[target];

        // If either rate is missing, we can't convert accurately.
        // Return amount to avoid 0/NaN glitches in UI, but warn.
        if (!rateFrom || !rateTo) {
            // Warn only if we expected to convert
            console.warn(`[CurrencyContext] Tasa no disponible para ${originalCurrency} -> ${target}`);
            return amount;
        }

        // Formula: (Amount / Rate(from)) * Rate(to)
        // This works because all rates are relative to Universl Pivot (USD).
        const result = (amount / rateFrom) * rateTo;

        // Return number with 2 decimal precision (but as number)
        return Number(result.toFixed(2));
    }, [currency, exchangeRates]);

    const formatCurrency = useCallback((amount: number, originalCurrency?: string) => {
        // 1. Convert
        let value = amount;
        if (originalCurrency && originalCurrency !== currency) {
            value = convertAmount(amount, originalCurrency);
        }

        // 2. Format
        const currencyConfig = AVAILABLE_CURRENCIES.find(c => c.code === currency) || AVAILABLE_CURRENCIES[0];

        return new Intl.NumberFormat(currencyConfig.locale, {
            style: 'currency',
            currency: currencyConfig.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value);
    }, [currency, convertAmount]);

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, convertAmount, loading, exchangeRates }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
