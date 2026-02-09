import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Save, X } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { supabase } from '../lib/supabaseClient';
import { Transaction } from '../types';

import { PILARES, CUENTAS, CATEGORIAS } from '../constants';


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
    const { currency } = useCurrency();
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
    };

    useEffect(() => {
        if (transactionToEdit) {
            const initialVal = transactionToEdit.cantidad.toString();
            const { decimal } = getSeparators(currency);
            const parts = initialVal.split('.');
            let localFormat = parts[0];
            if (parts.length > 1) {
                localFormat = `${parts[0]}${decimal}${parts[1]}`;
            }
            setMonto(formatNumber(localFormat, currency));

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
            setMonto(formatNumber(val, currency));
        }
    };

    const handleGuardar = async () => {
        if (!monto) return alert("Ingresa un monto");
        setLoading(true);

        const realAmount = parseToNumber(monto, currency);
        if (isNaN(realAmount) || realAmount <= 0) {
            setLoading(false);
            return alert("Monto inválido");
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return alert("Usuario no autenticado");
        }

        const transactionData = {
            cantidad: realAmount, // Use parsed value
            pilar: pilar,
            cuenta: cuenta,
            categoria: categoria,
            tag: tag ? tag.trim() : null,
            descripcion: categoria || 'Movimiento',
            fecha: transactionToEdit?.fecha || new Date().toISOString(),
            user_id: user.id
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

        } catch (error) {
            console.error(error);
            alert("Error al conectar con Supabase");
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

            {/* Amount */}
            <div className="relative">
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
