import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Debt } from '../types';
import { Coins, Plus, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import CreateDebtModal from './CreateDebtModal';
import SnowballProjection from './SnowballProjection';
import DebtTableReport from './DebtTableReport';
import { useCurrency } from '../../../../context/CurrencyContext';

export default function DebtDashboard() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { formatCurrency } = useCurrency();

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('deudas')
                .select('*')
                .eq('user_id', user.id)
                .order('saldo_actual', { ascending: true }); // SNOWBALL RULE 1: Smallest balance first!

            if (error) throw error;
            setDebts(data || []);
        } catch (error) {
            console.error('Error fetching debts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, nombre: string) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la deuda "${nombre}"? \nEsta acción afectará la proyección actual de la Bola de Nieve.`)) {
            return;
        }

        setIsDeleting(id);
        try {
            const { error } = await supabase.from('deudas').delete().eq('id', id);
            if (error) throw error;
            fetchDebts();
        } catch (error) {
            console.error('Error deleting debt:', error);
            alert('Error al intentar eliminar la deuda.');
        } finally {
            setIsDeleting(null);
        }
    };

    useEffect(() => {
        fetchDebts();
    }, []);

    const totalDeuda = debts.reduce((acc, curr) => acc + curr.saldo_actual, 0);
    const totalCuotaObligatoria = debts.reduce((acc, curr) => acc + curr.cuota_minima, 0);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <TrendingDown className="text-rose-500" /> Plan Acelerador de Pagos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
                        Basado en el Método Bola de Nieve: Paga el mínimo en todas, y envía todo el dinero sobrante a la deuda más pequeña.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setDebtToEdit(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-rose-500/30 whitespace-nowrap"
                >
                    <Plus size={16} /> Añadir Deuda
                </button>
            </div>

            {loading ? (
                <div className="space-y-6 animate-pulse">
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                    </div>
                </div>
            ) : debts.length === 0 ? (
                // Empty State
                <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                        <Coins size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        ¡Libre de Deudas!
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                        No tienes compromisos activos registrados. ¿Adquiriste una nueva obligación? Regístrala para planificar su eliminación rápida.
                    </p>
                </div>
            ) : (
                <>
                    {/* Global Snapshot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Deuda Total Activa</span>
                            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">{formatCurrency(totalDeuda)}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Costo Fijo (Cuotas Mínimas)</span>
                            <span className="text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tight">{formatCurrency(totalCuotaObligatoria)}<span className="text-base font-medium text-slate-400">/mes</span></span>
                        </div>
                    </div>

                    {/* Snowball Calculator & List Layout */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Interactive Projection Tool */}
                        <div className="xl:col-span-2">
                            <SnowballProjection debts={debts} totalMinimo={totalCuotaObligatoria} />
                        </div>

                        {/* Priority List (Smallest to Largest) */}
                        <div className="xl:col-span-1 space-y-4">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Cola de Eliminación</h3>
                            <div className="space-y-3">
                                {debts.map((debt, idx) => (
                                    <div key={debt.id} className={`p-4 rounded-2xl border transition-all ${idx === 0 ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800 shadow-md ring-1 ring-rose-500/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-80'}`}>
                                        {idx === 0 && (
                                            <span className="inline-block px-2 py-0.5 bg-rose-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-md mb-2">
                                                🔥 Objetivo Principal
                                            </span>
                                        )}
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="pr-2">
                                                <h4 className="font-bold text-slate-800 dark:text-white leading-tight">{debt.nombre}</h4>
                                                <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(debt.saldo_actual)}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setDebtToEdit(debt);
                                                        setIsCreateModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Editar deuda"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(debt.id, debt.nombre)}
                                                    disabled={isDeleting === debt.id}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Eliminar deuda"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            Pago Fijo: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(debt.cuota_minima)}/mes</strong> {debt.tasa_interes > 0 && `• ${debt.tasa_interes}% E.M.`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Informe Tabular Detallado */}
                    <DebtTableReport debts={debts} />
                </>
            )}

            <CreateDebtModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setTimeout(() => setDebtToEdit(null), 300); // Clears after animation
                }}
                onSuccess={fetchDebts}
                debtToEdit={debtToEdit}
            />
        </div>
    );
}
