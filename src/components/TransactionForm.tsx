import { useState, useEffect } from 'react';
import { PlusCircle, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Transaction } from '../types';

import { PILARES, CUENTAS, CATEGORIAS } from '../constants';


interface TransactionFormProps {
    onSuccess?: () => void;
    transactionToEdit?: Transaction | null;
    onCancelEdit?: () => void;
}

export default function TransactionForm({ onSuccess, transactionToEdit, onCancelEdit }: TransactionFormProps) {
    const [monto, setMonto] = useState('');
    const [pilar, setPilar] = useState('Gastar');
    const [cuenta, setCuenta] = useState('Efectivo');
    const [categoria, setCategoria] = useState('Otros');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transactionToEdit) {
            setMonto(transactionToEdit.cantidad.toString());
            setPilar(transactionToEdit.pilar);
            setCuenta(transactionToEdit.cuenta);
            setCategoria(transactionToEdit.categoria || 'Otros');

        } else {
            resetForm();
        }
    }, [transactionToEdit]);

    const resetForm = () => {
        setMonto('');
        setPilar('Gastar');
        setCuenta('Efectivo');
        setCategoria('Otros');

    };

    const handleGuardar = async () => {
        if (!monto) return alert("Ingresa un monto");
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return alert("Usuario no autenticado");
        }

        const transactionData = {
            cantidad: parseFloat(monto),
            pilar: pilar,
            cuenta: cuenta,
            categoria: categoria,
            descripcion: categoria || 'Movimiento', // Use category as description
            fecha: new Date().toISOString(),
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

            // alert(`¡${pilar} ${transactionToEdit ? 'actualizado' : 'registrado'} con éxito!`); 
            // Removed alert for smoother UX

            resetForm();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            alert("Error al conectar con Supabase");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={(e) => e.preventDefault()} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 space-y-6 max-w-lg mx-auto md:sticky md:top-8 transition-colors duration-300">
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
                            setCategoria(''); // Reset category when switching pillars
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
                </div>
            ) : (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Etiqueta (Opcional)</label>
                    <input
                        type="text"
                        placeholder="Ej. Cripto, Salario, Regalo..."
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-slate-200 dark:focus:border-slate-700 text-sm dark:text-white placeholder:text-slate-400"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                    />
                </div>
            )}
            <div className="relative">
                <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
                <input
                    type="number"
                    placeholder="0"
                    className="w-full p-4 pl-8 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-transparent focus:border-slate-200 dark:focus:border-slate-700 text-3xl font-bold text-slate-800 dark:text-white placeholder:text-slate-300 transition-colors"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    inputMode="decimal" // Better keyboard on mobile
                />
            </div>
            <button
                onClick={handleGuardar}
                disabled={loading}
                className={`w-full text-white dark:text-slate-900 py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2
                        ${loading ? 'bg-slate-400' : transactionToEdit ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200'}`}
            >
                {transactionToEdit ? <Save size={24} /> : <PlusCircle size={24} />}
                {loading ? 'Sincronizando...' : transactionToEdit ? 'Actualizar Movimiento' : 'Registrar'}
            </button>
        </form>
    );
}
