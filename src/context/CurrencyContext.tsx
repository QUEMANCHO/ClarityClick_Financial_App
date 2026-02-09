// @ts-ignore
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getExchangeRateMatrix, convertToDisplay } from '../services/currencyService';

interface CurrencyContextType {
    currency: string;
    setCurrency: (currency: string) => Promise<void>;
    formatCurrency: (amount: number, originalCurrency?: string) => string;
    convertAmount: (amount: number, originalCurrency?: string) => number;
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
    const [currency, setCurrencyState] = useState('COP'); // Default to COP
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
            } finally {
                setLoading(false);
            }
        };

        loadCurrencyPreference();
    }, []);

    // Fetch Rates whenever the *target* currency changes
    useEffect(() => {
        const fetchRates = async () => {
            const rates = await getExchangeRateMatrix(currency);
            setExchangeRates(rates || {});
        };

        fetchRates();
    }, [currency]);

    const setCurrency = async (newCurrency: string) => {
        setCurrencyState(newCurrency);
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

    const convertAmount = (amount: number, originalCurrency: string = 'COP') => {
        // If current selected currency is same as original, no conversion needed
        if (currency === originalCurrency) return amount;

        // Use the utility service to calculate
        return convertToDisplay(amount, originalCurrency, currency, exchangeRates);
    };

    const formatCurrency = (amount: number, originalCurrency?: string) => {
        const value = originalCurrency ? convertAmount(amount, originalCurrency) : amount;

        const currencyConfig = AVAILABLE_CURRENCIES.find(c => c.code === currency) || AVAILABLE_CURRENCIES[0];

        return new Intl.NumberFormat(currencyConfig.locale, {
            style: 'currency',
            currency: currencyConfig.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2, // Allow decimals for USD/EUR if needed, though previously 0
        }).format(value);
    };

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
