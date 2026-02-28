import { useState, useEffect } from 'react';
import { X, Brain, CheckCircle2, AlertTriangle } from 'lucide-react';
import { GoalWithIntelligence, AdviceResponse } from '../types';
import { getFinancialAdvice } from '../../../../services/aiService';
import { useExpenseAnalysis } from '../hooks/useExpenseAnalysis';

interface StrategyAdvisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: GoalWithIntelligence;
}

const LOADING_MESSAGES = [
    "Analizando tus pilares financieros...",
    "Calculando fricción de gastos...",
    "Proyectando rutas de inversión...",
    "Consultando al Estratega Virtual..."
];

export default function StrategyAdvisorModal({ isOpen, onClose, goal }: StrategyAdvisorModalProps) {
    const { topExpenses, loading: loadingExpenses } = useExpenseAnalysis(); // Get Top 3 Expenses
    const [advice, setAdvice] = useState<AdviceResponse | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    // Message Rotation Effect
    useEffect(() => {
        if (loadingAI) {
            const interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [loadingAI]);

    // Main AI Call Effect
    useEffect(() => {
        if (isOpen && !loadingExpenses) {
            fetchAdvice();
        }
    }, [isOpen, loadingExpenses]);

    const fetchAdvice = async () => {
        setLoadingAI(true);
        setError(null);
        setAdvice(null);

        try {
            // Orchestrate Data for AI
            const context = {
                meta: {
                    nombre: goal.meta_nombre,
                    monto: goal.monto_objetivo,
                    progreso: goal.porcentaje_progreso,
                    moneda: goal.moneda
                },
                inteligencia: {
                    estado: goal.intelligence.estado,
                    capacidad_neta: goal.capacidad_neta_disponible,
                    aporte_planeado: goal.aporte_planeado_total,
                    meses_ganados: goal.intelligence.acelerador.ahorro_tiempo_meses,
                    friccion_score: goal.intelligence.friccion
                },
                contexto_gastos: topExpenses.map(e => ({
                    categoria: e.categoria,
                    porcentaje_del_gasto_total: e.porcentaje
                }))
            };

            const response = await getFinancialAdvice(context);
            setAdvice(response);

        } catch (err) {
            console.error(err);
            setError("Nuestros analistas están ocupados. Por favor intenta de nuevo.");
        } finally {
            setLoadingAI(false);
        }
    };

    if (!isOpen) return null;

    // Status Colors for Header
    const getStatusColor = () => {
        switch (goal.intelligence.estado) {
            case 'CRITICAL': return 'bg-red-600';
            case 'AT_RISK': return 'bg-amber-500';
            case 'OPTIMIZED': return 'bg-emerald-600';
            default: return 'bg-blue-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className={`${getStatusColor()} p-6 text-white flex justify-between items-start shrink-0`}>
                    <div>
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <Brain size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Estratega Virtual</span>
                        </div>
                        <h2 className="text-2xl font-bold leading-tight">
                            {advice ? advice.titulo_estrategia : "Analizando Estrategia..."}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* LOADING STATE */}
                    {(loadingAI || loadingExpenses) && (
                        <div className="py-12 flex flex-col items-center text-center space-y-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain size={24} className="text-blue-500 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium animate-pulse">
                                {LOADING_MESSAGES[loadingMessageIndex]}
                            </p>
                            {/* Skeleton Steps */}
                            <div className="w-full max-w-md space-y-3 opacity-50">
                                <div className="h-12 bg-slate-100 rounded-xl w-full" />
                                <div className="h-12 bg-slate-100 rounded-xl w-3/4" />
                                <div className="h-12 bg-slate-100 rounded-xl w-5/6" />
                            </div>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {!loadingAI && error && (
                        <div className="py-10 text-center">
                            <div className="inline-block p-4 bg-red-100 text-red-600 rounded-full mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Error de Conexión</h3>
                            <p className="text-slate-500 mb-6">{error}</p>
                            <button
                                onClick={fetchAdvice}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                            >
                                Reintentar Análisis
                            </button>
                        </div>
                    )}

                    {/* SUCCESS STATE */}
                    {!loadingAI && advice && (
                        <div className="space-y-8 animate-slide-up">

                            {/* Viabilidad / Diagnóstico */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Brain size={16} className="text-blue-500" />
                                    Estado de Viabilidad
                                </h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                    {advice.diagnostico}
                                </p>
                            </div>

                            {/* Plan Estratégico Detallado */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Plan de Acción / Estrategia Maestra</h3>
                                <div className="space-y-4">
                                    {advice.pasos.map((paso, idx) => (
                                        <div key={idx} className={`p-5 rounded-2xl border flex flex-col gap-2 relative overflow-hidden transition-all hover:shadow-md
                                            ${paso.tipo === 'DIAGNOSTICO'
                                                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
                                                : paso.tipo === 'CORRECCION'
                                                    ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                                                    : 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
                                            }
                                        `}>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white
                                                        ${paso.tipo === 'DIAGNOSTICO' ? 'bg-amber-500' : paso.tipo === 'CORRECCION' ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    >
                                                        {paso.orden}
                                                    </span>
                                                    {paso.accion}
                                                </h4>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded
                                                    ${paso.tipo === 'DIAGNOSTICO' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                                                        paso.tipo === 'CORRECCION' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                                                    }`}>
                                                    {paso.tipo}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 ml-8 leading-relaxed">
                                                {paso.descripcion}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>


                            {/* Disclaimer */}
                            <p className="text-[10px] text-slate-400 text-center mt-8">
                                {advice.disclaimer}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <CheckCircle2 size={18} />
                        Entendido, aplicar plan
                    </button>
                </div>
            </div>
        </div>
    );
}
