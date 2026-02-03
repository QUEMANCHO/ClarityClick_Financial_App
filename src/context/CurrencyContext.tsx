import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface CurrencyContextType {
    currency: string;
    setCurrency: (currency: string) => Promise<void>;
    formatCurrency: (amount: number) => string;
    loading: boolean;
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user preference on load
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
            // Optionally revert state here if critical
        }
    };

    const formatCurrency = (amount: number) => {
        const currencyConfig = AVAILABLE_CURRENCIES.find(c => c.code === currency) || AVAILABLE_CURRENCIES[0];
        return new Intl.NumberFormat(currencyConfig.locale, {
            style: 'currency',
            currency: currencyConfig.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, loading }}>
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
