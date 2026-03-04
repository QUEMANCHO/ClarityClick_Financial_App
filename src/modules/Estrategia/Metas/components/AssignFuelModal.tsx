import { useState, useEffect } from 'react';
import { X, Loader2, Zap, Target } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { GoalWithIntelligence } from '../types';

interface AssignFuelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoalAssigned: () => void;
    onCreateNewGoal: () => void;
    detectedAmount: number;
    detectedTransactionId?: number | null; // Nuevo prop para saber qué transacción descartar
    goals: GoalWithIntelligence[];
}

export default function AssignFuelModal({ isOpen, onClose, onGoalAssigned, onCreateNewGoal, detectedAmount, detectedTransactionId, goals }: AssignFuelModalProps) {
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [amountToAssign, setAmountToAssign] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAmountToAssign(detectedAmount.toString());
            // Pre-select the first goal if available
            if (goals.length > 0) {
                setSelectedGoalId(goals[0].meta_id.toString());
            } else {
                setSelectedGoalId('NEW');
            }
        }
    }, [isOpen, detectedAmount, goals]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setAmountToAssign(value);
    };

    const formatDisplay = (val: string) => {
        if (!val) return '';
        const numericOnly = val.toString().replace(/\D/g, '');
        if (!numericOnly) return '';
        return parseInt(numericOnly, 10).toLocaleString('es-CO');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (código existente de handleSubmit) ...
        e.preventDefault();

        if (selectedGoalId === 'NEW') {
            onClose();
            onCreateNewGoal();
            return;
        }

        const assignAmount = parseFloat(amountToAssign);
        if (isNaN(assignAmount) || assignAmount <= 0) {
            alert('Por favor, ingresa un monto válido a asignar.');
            return;
        }

        if (!selectedGoalId) {
            alert('Por favor, selecciona una meta.');
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            // Find the selected goal to get its currency and other details
            const selectedGoal = goals.find(g => g.meta_id.toString() === selectedGoalId);
            if (!selectedGoal) throw new Error('Meta seleccionada no encontrada');

            // Insert a new transaction associated with this goal
            const { error: txError } = await supabase
                .from('transacciones')
                .insert([{
                    user_id: user.id,
                    cantidad: assignAmount,
                    pilar: 'Ahorrar', // Or 'Invertir' if it's an investment goal, but 'Ahorrar' is safer as default fuel
                    categoria: 'Aporte Extraordinario (Combustible)',
                    fecha: new Date().toISOString(),
                    moneda: selectedGoal.moneda,
                    meta_id: parseInt(selectedGoalId, 10)
                }]);

            if (txError) throw txError;

            // Opcional: Si queríamos ser puristas, también marcaríamos la transacción original
            // con excluir_de_ia = true, y luego el ahorro anterior lo contrarresta.
            // Pero como la asignamos a una meta, la IA usará su algoritmo normal donde Ahorro y Ganancia se balancean.

            onGoalAssigned();
            onClose();

        } catch (error: any) {
            console.error('Error assigning fuel:', error);
            alert(`Error al asignar combustible: ${error.message || 'Intenta de nuevo'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = async () => {
        if (!detectedTransactionId) {
            onClose();
            return; // Fallback si no hay ID
        }

        setLoading(true);
        try {
            // Actualizar la transacción original que disparó la alerta
            // marcándola con excluir_de_ia = true
            const { error } = await supabase
                .from('transacciones')
                .update({ excluir_de_ia: true })
                .eq('id', detectedTransactionId);

            if (error) throw error;

            onGoalAssigned(); // Para recargar los datos
            onClose();

        } catch (err: any) {
            console.error("Error al descartar combustible", err);
            // Igual cerramos para no bloquear al usuario
            onClose();
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-400 shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Zap size={20} className="text-yellow-300 fill-yellow-300" />
                        Asignar Combustible
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Info text */}
                    <div className="text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Detectamos un ingreso extraordinario. Tienes la oportunidad de acelerar el progreso de una meta.
                        </p>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cantidad a Asignar</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                value={formatDisplay(amountToAssign)}
                                onChange={handleAmountChange}
                                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono font-bold text-2xl text-slate-900 dark:text-white"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Monto sugerido basado en tu nuevo ingreso.</p>
                    </div>

                    {/* Goal Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destino</label>
                        <div className="relative">
                            <select
                                value={selectedGoalId}
                                onChange={(e) => setSelectedGoalId(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium text-slate-800 dark:text-white appearance-none cursor-pointer"
                                required
                            >
                                {goals.length === 0 && (
                                    <option value="" disabled>No tienes metas activas</option>
                                )}
                                {goals.map(goal => (
                                    <option key={goal.meta_id} value={goal.meta_id.toString()}>
                                        {goal.meta_nombre} (Progreso: {goal.porcentaje_progreso}%)
                                    </option>
                                ))}
                                <option value="NEW" className="font-bold text-teal-600 dark:text-teal-400">
                                    ➕ Crear nueva meta...
                                </option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Target size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 space-y-3">
                        <button
                            type="submit"
                            disabled={loading || !amountToAssign || parseInt(amountToAssign, 10) <= 0}
                            className={`w-full px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-white ${selectedGoalId === 'NEW'
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-teal-500/30'
                                }`}
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap size={18} className="fill-current" />}
                            {selectedGoalId === 'NEW' ? 'Ir a Crear Meta' : 'Inyectar Combustible'}
                        </button>

                        <button
                            type="button"
                            onClick={handleDiscard}
                            disabled={loading}
                            className="w-full px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                        >
                            {loading && !selectedGoalId ? <Loader2 className="animate-spin w-4 h-4 mr-2 inline" /> : null}
                            Es para otra cosa (Descartar)
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
