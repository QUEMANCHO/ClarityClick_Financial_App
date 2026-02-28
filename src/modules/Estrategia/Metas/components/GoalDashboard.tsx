import { useEffect, useState } from 'react';
import { Target, AlertTriangle, Plus, Zap, X } from 'lucide-react';
import { useGoalIntelligence } from '../hooks/useGoalIntelligence';
import GoalCard from './GoalCard';
import CreateGoalModal from './CreateGoalModal';
import { supabase } from '../../../../lib/supabaseClient';
import { GoalWithIntelligence } from '../types';

export default function GoalDashboard() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<GoalWithIntelligence | null>(null);

    // 2. Fetch Intelligence & Goals
    const { goals, loading, error, refresh } = useGoalIntelligence();
    const [newFuelDetected, setNewFuelDetected] = useState(false);

    // 3. Monitor for "New Fuel"
    useEffect(() => {
        const checkFuel = async () => {
            if (!goals || goals.length === 0) return;
            const avgIncome = goals[0].promedio_ingresos_mensual;
            if (avgIncome <= 0) return;

            // Check for recent large incomes (last 7 days)
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('transacciones')
                .select('cantidad')
                .eq('user_id', user.id)
                .eq('pilar', 'Ganar')
                .gte('fecha', lastWeek.toISOString());

            // Check if any recent income > 50% of monthly average
            if (data && data.some(t => t.cantidad > avgIncome * 0.5)) {
                setNewFuelDetected(true);
            }
        };
        checkFuel();
    }, [goals]);

    const handleEditGoal = (goal: GoalWithIntelligence) => {
        setEditingGoal(goal);
        setIsCreateModalOpen(true);
    };

    const handleDeleteGoal = async (goalId: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta meta? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('metas')
                .delete()
                .eq('id', goalId);

            if (error) throw error;
            refresh();
        } catch (err) {
            console.error('Error deleting goal:', err);
            alert('Error al eliminar la meta');
        }
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setEditingGoal(null); // Reset editing state
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 text-red-600 rounded-2xl flex items-center gap-4">
                <AlertTriangle />
                <div>
                    <p className="font-bold">Error cargando metas</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Summary */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Target className="text-blue-600" /> Tablero de Control
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {goals.length} Metas Activas • Supervisión por IA
                    </p>
                </div>
                {goals.length > 0 && (
                    <button
                        onClick={() => { setEditingGoal(null); setIsCreateModalOpen(true); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={16} /> Nueva Meta
                    </button>
                )}
            </div>

            {/* Income Interceptor Alert */}
            {newFuelDetected && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 p-4 rounded-2xl text-white shadow-lg flex items-center justify-between animate-fade-in relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 pattern-diagonal-stripes pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-inner">
                            <Zap size={24} className="text-yellow-300 fill-yellow-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">¡Detección de Nuevo Combustible!</h3>
                            <p className="text-sm opacity-90 mt-0.5">
                                Registraste ingresos superiores al 50% de tu promedio mensual.
                            </p>
                            <button
                                onClick={() => {
                                    setNewFuelDetected(false);
                                    setEditingGoal(null);
                                    setIsCreateModalOpen(true);
                                }}
                                className="mt-3 px-4 py-1.5 bg-white text-teal-700 hover:bg-teal-50 rounded-full text-xs font-bold transition-colors shadow-sm"
                            >
                                Asignar a una Meta
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setNewFuelDetected(false)}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
                        aria-label="Cerrar aviso"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {goals.length === 0 ? (
                // Empty State
                <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                        <Target size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        Define tu Primera Meta
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                        "La claridad es poder". Comienza definiendo un objetivo y deja que la IA trace el camino óptimo.
                    </p>
                    <button
                        onClick={() => { setEditingGoal(null); setIsCreateModalOpen(true); }}
                        className="px-8 py-3 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold inline-flex items-center gap-2 transition-transform active:scale-95 shadow-xl"
                    >
                        <Plus size={20} />
                        Definir Meta
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {goals.map(goal => (
                        <GoalCard
                            key={goal.meta_id}
                            goal={goal}
                            onEdit={handleEditGoal}
                            onDelete={handleDeleteGoal}
                        />
                    ))}
                </div>
            )}

            {/* Modal de Creación / Edición */}
            <CreateGoalModal
                isOpen={isCreateModalOpen}
                onClose={closeModal}
                onGoalCreated={refresh}
                goalToEdit={editingGoal}
            />
        </div>
    );
}
