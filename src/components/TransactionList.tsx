import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Pencil, Trash2, CreditCard, Tag } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

import { Transaction } from '../types';
import { getPillarBadgeStyle } from '../constants';
import ExpenseFilters, { FilterState } from './ExpenseFilters';
import FilterSummary from './FilterSummary';

interface TransactionListProps {
    onEdit: (t: Transaction) => void;
    refreshTrigger: number;
    onDataChange?: () => void;
}

export default function TransactionList({ onEdit, refreshTrigger, onDataChange }: TransactionListProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
        category: '',
        tag: '',
        startDate: '',
        endDate: ''
    });
    const { formatCurrency } = useCurrency();

    const fetchTransactions = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('transacciones')
            .select('*')
            .eq('user_id', user.id)
            .order('fecha', { ascending: false });

        if (filters.category) {
            query = query.eq('categoria', filters.category);
        }
        if (filters.tag) {
            query = query.ilike('tag', `%${filters.tag}%`);
        }
        if (filters.startDate) {
            // Convert 'YYYY-MM-DD' (Local) to UTC Start of Day
            const [y, m, d] = filters.startDate.split('-').map(Number);
            const startUtc = new Date(y, m - 1, d).toISOString();
            query = query.gte('fecha', startUtc);
        }
        if (filters.endDate) {
            // Convert 'YYYY-MM-DD' (Local) to UTC End of Day
            const [y, m, d] = filters.endDate.split('-').map(Number);
            const endUtc = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
            query = query.lte('fecha', endUtc);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
        } else if (data) {
            setTransactions(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTransactions();
        }, 300); // Debounce for text input
        return () => clearTimeout(timeoutId);
    }, [refreshTrigger, filters]);

    const handleClearFilters = () => {
        setFilters({
            category: '',
            tag: '',
            startDate: '',
            endDate: ''
        });
    };

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Historial de Transacciones</h2>
                {/* Filters added here if desired, but component handles its own layout mostly */}
            </div>

            <ExpenseFilters
                filters={filters}
                onFilterChange={setFilters}
                onClear={handleClearFilters}
            />

            <FilterSummary transactions={transactions} />

            {loading ? (
                <div className="py-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="font-medium">No se encontraron transacciones.</p>
                    <p className="text-sm mt-1">Intenta ajustar los filtros o añade un nuevo movimiento.</p>
                    {(filters.category || filters.tag || filters.startDate || filters.endDate) && (
                        <button
                            onClick={handleClearFilters}
                            className="mt-4 text-blue-600 hover:underline text-sm font-bold"
                        >
                            Limpiar todos los filtros
                        </button>
                    )}
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
                                                {t.tag && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide ml-1 w-fit">
                                                        {t.tag}
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
                                            {/* Display converted value in Current App Currency */}
                                            {formatCurrency(t.cantidad, 'COP')}
                                            {/* Optional: Show original in tooltip or subtext if different
                                            <div className="text-xs text-slate-400 font-normal">
                                                {t.moneda_original && t.moneda_original !== currency && 
                                                    `(${t.monto_original} ${t.moneda_original})`
                                                }
                                            </div>
                                            */}
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
                                            {formatCurrency(t.cantidad, 'COP')}
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
                                    {t.tag && (
                                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100 text-blue-600">
                                            <Tag size={12} />
                                            {t.tag}
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
