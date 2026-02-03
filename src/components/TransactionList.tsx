import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Pencil, Trash2, CreditCard, Tag } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

import { Transaction } from '../types';
import { getPillarBadgeStyle } from '../constants';

interface TransactionListProps {
    onEdit: (t: Transaction) => void;
    refreshTrigger: number;
    onDataChange?: () => void;
}

export default function TransactionList({ onEdit, refreshTrigger, onDataChange }: TransactionListProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency } = useCurrency();

    const fetchTransactions = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('transacciones')
            .select('*')
            .eq('user_id', user.id)
            .order('fecha', { ascending: false }); // Order by fecha

        if (error) {
            console.error('Error fetching transactions:', error);
        } else if (data) {
            setTransactions(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [refreshTrigger]);

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
            const { error } = await supabase
                .from('transacciones')
                .delete()
                .eq('id', id);

            if (!error) {
                // Optimistic update or refetch
                setTransactions(prev => prev.filter(t => t.id !== id));
                if (onDataChange) onDataChange();
            } else {
                alert('Error al eliminar');
                console.error(error);
            }
        }
    };

    if (loading && transactions.length === 0) return <div className="p-4 text-center text-slate-500">Cargando transacciones...</div>;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Historial de Transacciones</h2>

            {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p>No hay transacciones registradas.</p>
                    <p className="text-xs mt-1">Añade un movimiento nuevo para comenzar.</p>
                </div>
            ) : (
                <>
                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
                                    <th className="py-2">Fecha</th>
                                    <th className="py-2">Descripción</th>
                                    <th className="py-2">Pilar</th>
                                    <th className="py-2 text-right">Monto</th>
                                    <th className="py-2 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t) => (
                                    <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                                        <td className="py-3 text-sm">{new Date(t.fecha).toLocaleDateString()}</td>
                                        <td className="py-3 font-medium">
                                            <div className="flex flex-col">
                                                <span>{t.descripcion}</span>
                                                {(t.cuenta || t.categoria) && (
                                                    <span className="text-xs text-slate-400">
                                                        {t.cuenta || 'Sin cuenta'}
                                                        {t.categoria && t.categoria !== t.descripcion ? ` • ${t.categoria}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPillarBadgeStyle(t.pilar)}`}>
                                                {t.pilar}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(t.cantidad)}
                                        </td>
                                        <td className="py-3 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEdit(t)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="md:hidden space-y-4">
                        {transactions.map((t) => (
                            <div key={t.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm relative transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{t.descripcion}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(t.fecha).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                                            {formatCurrency(t.cantidad)}
                                        </p>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${getPillarBadgeStyle(t.pilar)}`}>
                                            {t.pilar}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                                        <CreditCard size={12} />
                                        {t.cuenta}
                                    </div>
                                    {t.categoria && (
                                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                                            <Tag size={12} />
                                            {t.categoria}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/60">
                                    <button
                                        onClick={() => onEdit(t)}
                                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 px-2 py-1"
                                    >
                                        <Pencil size={14} /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 px-2 py-1"
                                    >
                                        <Trash2 size={14} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )
            }
        </div >
    );
}
