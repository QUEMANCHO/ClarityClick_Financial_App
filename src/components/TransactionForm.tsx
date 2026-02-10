import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Save, X } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { supabase } from '../lib/supabaseClient';
import { Transaction } from '../types';

import { PILARES, CUENTAS, CATEGORIAS } from '../constants';
import { AVAILABLE_CURRENCIES } from '../context/CurrencyContext';


interface TransactionFormProps {
    onSuccess?: () => void;
    transactionToEdit?: Transaction | null;
    onCancelEdit?: () => void;
    initialPillar?: string;
}

export default function TransactionForm({ onSuccess, transactionToEdit, onCancelEdit, initialPillar }: TransactionFormProps) {
    const [monto, setMonto] = useState('');
    const [pilar, setPilar] = useState('Gastar');
    const [cuenta, setCuenta] = useState('Efectivo');
    const [categoria, setCategoria] = useState('Otros');
    const [tag, setTag] = useState('');
    const { currency, formatCurrency, convertAmount } = useCurrency();
    const [inputCurrency, setInputCurrency] = useState(currency);
    const [loading, setLoading] = useState(false);

    // Refs for scrolling and focus
    const formRef = useRef<HTMLFormElement>(null);
    const montoRef = useRef<HTMLInputElement>(null);
    const categoriaRef = useRef<HTMLInputElement>(null);

    // Helper to identify separators based on currency
    const getSeparators = (curr: string) => {
        // Simple heuristic: USD and MXN use comma for thousands, others (COP, EUR) use dot.
        if (['USD', 'MXN'].includes(curr)) return { group: ',', decimal: '.' };
        return { group: '.', decimal: ',' };
    };

    const formatNumber = (value: string, curr: string) => {
        if (!value) return '';
        const { group, decimal } = getSeparators(curr);

        // Remove existing invalid chars (everything that is not digit or decimal separator)
        // We allow one decimal separator.
        // First, normalize: remove group separators
        let raw = value.split(group).join('');

        // If we have multiple decimals, keep only first (basic protection)
        const parts = raw.split(decimal);
        let integerPart = parts[0].replace(/\D/g, ''); // Ensure only digits
        let decimalPart = parts.length > 1 ? parts[1].replace(/\D/g, '') : null;

        // Format integer part with thousands
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);

        if (decimalPart !== null) {
            return `${formattedInteger}${decimal}${decimalPart}`;
        }
        return formattedInteger;
    };

    const parseToNumber = (displayValue: string, curr: string): number => {
        const { group, decimal } = getSeparators(curr);
        // Remove groups
        let raw = displayValue.split(group).join('');
        // Replace decimal with standard dot
        raw = raw.replace(decimal, '.');
        return parseFloat(raw);
    };

    const resetForm = (pilarOverride?: string) => {
        setMonto('');
        setPilar(pilarOverride || 'Gastar');
        setCuenta('Efectivo');
        // If not 'Gastar', category usually blank or custom, but 'Otros' is a safe default or empty?
        setCategoria(pilarOverride && pilarOverride !== 'Gastar' ? '' : 'Otros');
        setTag('');
        setInputCurrency(currency);
    };

    useEffect(() => {
        if (transactionToEdit) {
            // ... existing edit logic ...
            // We need to handle how we show the amount. 
            // Ideally, we show the ORIGINAL amount and currency if available.
            // But for now, let's stick to the simpler approach of editing the converted amount 
            // UNLESS we have original data.

            const originalAmount = transactionToEdit.monto_original || transactionToEdit.cantidad;
            const originalCurrency = transactionToEdit.moneda_original || currency;

            setInputCurrency(originalCurrency);

            const initialVal = originalAmount.toString();
            const { decimal } = getSeparators(originalCurrency);
            const parts = initialVal.split('.');
            let localFormat = parts[0];
            if (parts.length > 1) {
                localFormat = `${parts[0]}${decimal}${parts[1]}`;
            }
            setMonto(formatNumber(localFormat, originalCurrency));

            setPilar(transactionToEdit.pilar);
            setCuenta(transactionToEdit.cuenta);
            setCategoria(transactionToEdit.categoria || 'Otros');
            setTag(transactionToEdit.tag || '');

            // Scroll to form and focus amount for quick edit
            setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Small delay for focus to ensure scroll started/completed or UI rendered
                setTimeout(() => {
                    montoRef.current?.focus();
                }, 300);
            }, 100);

        } else {
            resetForm(initialPillar);
            setInputCurrency(currency); // Ensure we reset to current base currency
        }
    }, [transactionToEdit, initialPillar, currency]);

    // Focus and Scroll Effect for Smart Navigation
    useEffect(() => {
        if (initialPillar) {
            // 1. Scroll to form
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // 2. Focus logic
            setTimeout(() => {
                if (initialPillar === 'Gastar') {
                    // For 'Gastar', category is buttons, so focus 'Monto'
                    montoRef.current?.focus();
                } else {
                    // For others, we have a text input for category/tag
                    // Focus that first
                    categoriaRef.current?.focus();
                }
            }, 300); // 300ms delay to allow tab switching/animation
        }
    }, [initialPillar]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow user to clear
        if (val === '') {
            setMonto('');
            return;
        }

        // Basic validation: Check if last char is valid
        const { group, decimal } = getSeparators(currency);

        // If user typed the decimal separator, allow it if it's the first one
        // If user typed valid digit, format it.
        const lastChar = val.slice(-1);
        if (/[0-9]/.test(lastChar) || lastChar === decimal || lastChar === group) {
            setMonto(formatNumber(val, inputCurrency));
        }
    };

    // Calculate equivalent value for display
    // STRICT REACTIVITY: This depends on monto, inputCurrency, and currency (context)
    const equivalentValue = (() => {
        const inputAmount = parseToNumber(monto, inputCurrency);
        if (isNaN(inputAmount)) return 0;
        return convertAmount(inputAmount, inputCurrency);
    })();

    const handleGuardar = async () => {
        if (!monto) return alert("Ingresa un monto");
        setLoading(true);

        const inputAmount = parseToNumber(monto, inputCurrency);
        if (isNaN(inputAmount) || inputAmount <= 0) {
            setLoading(false);
            return alert("Monto inválido");
        }

        // Final Amount for DB (Standardized to Base Currency: COP)
        // We ALWAYS store the 'canonical' value in COP so aggregations work correctly.
        const finalAmount = convertAmount(inputAmount, inputCurrency, 'COP');

        // Validation: If no rate available, finalAmount might be equal to inputAmount (fallback)
        if (inputCurrency !== 'COP' && finalAmount === inputAmount && inputAmount > 0) {
            console.warn("Saving transaction with 1:1 conversion to COP (Potential rate failure)");
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return alert("Usuario no autenticado");
        }

        const transactionData = {
            cantidad: finalAmount, // Saved in COP
            pilar: pilar,
            cuenta: cuenta,
            categoria: categoria,
            tag: tag ? tag.trim() : null,
            descripcion: categoria || 'Movimiento',
            fecha: transactionToEdit?.fecha || new Date().toISOString(),
            user_id: user.id,
            moneda_original: inputCurrency,
            monto_original: inputAmount,
            // Rate = COP Value / Original Value
            tasa_cambio: inputAmount !== 0 ? finalAmount / inputAmount : 1
        };

        try {
            let error;
            if (transactionToEdit) {
                // Update
                const { error: updateError } = await supabase
                    .from('transacciones')
                    .update(transactionData)
                    .eq('id', transactionToEdit.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('transacciones')
                    .insert([transactionData]);
                error = insertError;
            }

            if (error) throw error;

            if (onSuccess) onSuccess();
            // Only reset if NOT editing (editing usually closes the form or resets state via parent)
            // But here we are just clearing the form for next use.
            if (!transactionToEdit) resetForm();

        } catch (error: any) {
            console.error(error);
            alert(`Error al guardar: ${error.message || error.error_description || "Verifica la consola"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            ref={formRef}
            onSubmit={(e) => e.preventDefault()}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 space-y-6 max-w-lg mx-auto md:sticky md:top-8 transition-colors duration-300"
        >
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {transactionToEdit ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                </h2>
                {transactionToEdit && onCancelEdit && (
                    <button onClick={onCancelEdit} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1">
                        <X size={16} /> Cancelar
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {PILARES.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => {
                            setPilar(p.id);
                            // If switching pilar manually, check if we need to clear categoria
                            setCategoria(p.id === 'Gastar' ? 'Otros' : '');
                        }}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-200 border-2 shadow-sm
                                ${pilar === p.id
                                ? `${p.activeClass} border-transparent shadow-md transform scale-105`
                                : `bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-100 dark:border-slate-700`
                            }`}
                    >
                        <div className={`p-1.5 rounded-full ${pilar === p.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                            {p.icon}
                        </div>
                        <span className="text-sm">{p.id}</span>
                    </button>
                ))}
            </div>

            {/* Account Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Cuenta de origen/destino</label>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {CUENTAS.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setCuenta(c.id)}
                            className={`px-5 py-3 rounded-2xl whitespace-nowrap text-sm font-bold transition-all border
                                    ${cuenta === c.id
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category / Tag */}
            {pilar === 'Gastar' ? (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Categoría</label>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIAS.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoria(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95
                                        ${categoria === cat
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    {/* Optional Tag for Expenses */}
                    <div className="mt-4 animate-fade-in">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Etiqueta <span className="text-xs text-slate-400 font-normal">(Opcional)</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Cena familiar, Viaje Pereira, etc."
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-slate-200 dark:focus:border-slate-700 text-sm dark:text-white placeholder:text-slate-400"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Etiqueta (Opcional)</label>
                    <input
                        ref={categoriaRef}
                        type="text"
                        placeholder="Ej. Cripto, Salario, Regalo..."
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-slate-200 dark:focus:border-slate-700 text-sm dark:text-white placeholder:text-slate-400"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                    />
                </div>
            )
            }

            {/* Amount & Currency */}
            <div className="relative flex gap-2">
                <div className="w-1/3">
                    <select
                        value={inputCurrency}
                        onChange={(e) => setInputCurrency(e.target.value)}
                        className="w-full h-full p-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-white outline-none border-r-8 border-transparent"
                    >
                        {AVAILABLE_CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                        ))}
                    </select>
                </div>
                <div className="relative w-2/3">
                    <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
                    <input
                        ref={montoRef}
                        type="text"
                        placeholder="0"
                        className="w-full p-4 pl-8 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-slate-200 dark:focus:border-slate-700 text-3xl font-bold text-slate-800 dark:text-white placeholder:text-slate-300 transition-colors"
                        value={monto}
                        onChange={handleAmountChange}
                        inputMode="decimal"
                    />
                </div>
            </div>

            {/* Conversion Preview */}
            {inputCurrency !== currency && monto && (
                <div className={`p-3 rounded-xl border text-sm flex justify-between items-center animate-fade-in transition-colors
                    ${equivalentValue === 0
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`
                }>
                    <span className={`${equivalentValue === 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'} font-medium`}>
                        {equivalentValue === 0 ? 'Tasa no disponible' : `Equivalente en ${currency}:`}
                    </span>
                    <span className={`font-bold ${equivalentValue === 0 ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                        {equivalentValue === 0 ? '---' : formatCurrency(equivalentValue)}
                    </span>
                </div>
            )}

            {/* Sticky Mobile Button Container */}
            <div className="pt-4 md:pt-0 sticky bottom-0 md:relative bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 z-10 md:z-auto">
                <button
                    onClick={handleGuardar}
                    disabled={loading}
                    className={`w-full text-white dark:text-slate-900 py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2
                            ${loading ? 'bg-slate-400' : transactionToEdit ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200'}`}
                >
                    {transactionToEdit ? <Save size={24} /> : <PlusCircle size={24} />}
                    {loading ? 'Sincronizando...' : transactionToEdit ? 'Actualizar Movimiento' : 'Registrar'}
                </button>
            </div>
        </form >
    );
}
