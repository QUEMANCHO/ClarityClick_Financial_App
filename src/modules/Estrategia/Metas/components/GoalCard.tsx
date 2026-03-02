import { GoalWithIntelligence } from '../types';
import { AlertTriangle, Lightbulb, TrendingUp, CheckCircle2, Rocket, Target, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import { useState, useRef, useEffect } from 'react';
import StrategyAdvisorModal from './StrategyAdvisorModal';

interface GoalCardProps {
    goal: GoalWithIntelligence;
    onEdit: (goal: GoalWithIntelligence) => void;
    onDelete: (goalId: number) => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Menu toggle state
    const menuRef = useRef<HTMLDivElement>(null); // For click outside

    const { formatCurrency } = useCurrency();
    const { intelligence, moneda } = goal;
    const { estado, recomendacion_clave, combustible, dataQualityWarning } = intelligence;

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Status Styling Map
    const statusStyles = {
        CRITICAL: {
            border: 'border-red-500 shadow-red-500/10',
            bg: 'bg-white dark:bg-slate-900',
            badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            icon: AlertTriangle
        },
        AT_RISK: {
            border: 'border-amber-500 shadow-amber-500/10',
            bg: 'bg-white dark:bg-slate-900',
            badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            icon: AlertTriangle
        },
        ON_TRACK: {
            border: 'border-blue-500 shadow-blue-500/10',
            bg: 'bg-white dark:bg-slate-900',
            badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            icon: Target
        },
        AGGRESSIVE_PLAN: {
            border: 'border-violet-500 shadow-violet-500/10 ring-1 ring-violet-400/30',
            bg: 'bg-gradient-to-br from-violet-50/30 to-white dark:from-violet-900/10 dark:to-slate-900',
            badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
            icon: TrendingUp
        },
        OPTIMIZED: {
            border: 'border-emerald-500 shadow-emerald-500/20 ring-1 ring-emerald-400/50',
            bg: 'bg-gradient-to-br from-emerald-50/50 via-white to-white dark:from-emerald-900/10 dark:via-slate-900 dark:to-slate-900',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            icon: Rocket
        }
    };

    const currentStyle = statusStyles[estado];



    return (
        <div className={`relative rounded-3xl p-6 border-2 transition-all duration-300 hover:shadow-xl ${currentStyle.border} ${currentStyle.bg} group`}>

            {/* Action Menu (Absolute Top Right) */}
            <div className="absolute top-4 right-4 z-30" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <MoreVertical size={20} />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in-down">
                        <button
                            onClick={() => { setIsMenuOpen(false); onEdit(goal); }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                            <Edit size={16} /> Editar
                        </button>
                        <button
                            onClick={() => { setIsMenuOpen(false); onDelete(goal.meta_id); }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Eliminar
                        </button>
                    </div>
                )}
            </div>

            {/* Data Quality Warning */}
            {dataQualityWarning && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        {dataQualityWarning}
                    </p>
                </div>
            )}

            {/* Header: Name & Amount */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4 pr-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentStyle.badge}`}>
                            {estado.replace('_', ' ')}
                        </span>

                        {/* Fuel Gauge Enhanced: Plan vs Real */}
                        <div className="flex items-center gap-1.5" title={`Combustible: ${combustible}% (Capacidad Real vs Promesa)`}>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`w-1 h-3 rounded-full ${combustible >= (i * 20) ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                                {combustible}% Capacidad
                            </span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                        {goal.meta_nombre}
                    </h3>

                    {/* Explicit Plan vs Real Text */}
                    {goal.aporte_planeado_total > 0 && (
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                            <span className="text-slate-500">Plan: <b>{formatCurrency(goal.aporte_planeado_total)}/m</b></span>
                            {goal.capacidad_ahorro_mensual < goal.total_aporte_planeado_global && (
                                <span className="text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-1 rounded">
                                    ⚠️ Capacidad Real Insuficiente
                                </span>
                            )}
                        </div>
                    )}

                </div>
                <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed border-slate-200 dark:border-slate-800">
                    <span className="block text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {formatCurrency(goal.monto_objetivo)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{moneda}</span>
                </div>
            </div>

            {/* MONEY PROGRESS (Standard) */}
            <div className="mb-8">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    <span>Progreso Monetario</span>
                    <span className="text-slate-900 dark:text-white font-bold">{goal.porcentaje_progreso}%</span>
                </div>
                <div
                    className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={goal.porcentaje_progreso}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Barra de progreso monetario"
                >
                    <div
                        style={{ width: `${goal.porcentaje_progreso}%` }}
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${estado === 'CRITICAL' ? 'bg-red-500' : 'bg-blue-600'}`}
                    />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-400 items-start">
                    <span>{formatCurrency(goal.monto_actual)}</span>
                    <div className="text-right">
                        <span>Meta: {formatCurrency(goal.monto_objetivo)}</span>
                        {goal.aporte_ahorro_base > 0 && (
                            <div className="mt-0.5 text-blue-500 dark:text-blue-400 font-medium flex items-center justify-end gap-1">
                                <span>Cuota:</span>
                                <span className="font-bold">{formatCurrency(goal.aporte_ahorro_base)}</span>
                                <span className="lowercase">/ {goal.aporte_frecuencia}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ANÁLISIS DE VIABILIDAD ESCRITO */}
            <div className="relative mb-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-3 text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-2"><Lightbulb size={14} className="text-blue-500" /> Reporte de Viabilidad</span>
                </div>

                <div className="space-y-3 mt-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        El ritmo de aportes planeado requiere <strong className="text-slate-900 dark:text-white">{formatCurrency(goal.aporte_planeado_total)} {moneda}</strong> mensuales.
                        Tus registros indican una capacidad neta libre de <strong className="text-slate-900 dark:text-white">{formatCurrency(goal.capacidad_neta_disponible)} {moneda}</strong> por mes.
                    </p>
                    {goal.capacidad_neta_disponible < goal.aporte_planeado_total ? (
                        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">
                                <strong>Precaución:</strong> Existe un déficit de <span className="font-bold">{formatCurrency((goal.aporte_planeado_total - goal.capacidad_neta_disponible))} {moneda}</span>. No tienes liquidez suficiente para sostener este plan sin recortar otros gastos.
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                <strong>Óptimo:</strong> Tu plan es perfectamente sostenible. Tienes un sobrante mensual de <span className="font-bold">{formatCurrency((goal.capacidad_neta_disponible - goal.aporte_planeado_total))} {moneda}</span> que puedes agrupar en inteligencia adicional.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* INTELLIGENCE FOOTER (Action) */}
            <div className="bg-slate-50 dark:bg-slate-800 -mx-6 -mb-6 p-4 rounded-b-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 dark:border-slate-700 gap-4 sm:gap-0">
                <div className="flex gap-3 items-center w-full sm:w-2/3">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg text-yellow-600 dark:text-yellow-400 shrink-0">
                        <Lightbulb size={18} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                        <span className="font-bold block text-slate-800 dark:text-slate-200 mb-0.5">Consejo Estratégico:</span>
                        {recomendacion_clave}
                    </p>
                </div>
                <button
                    onClick={() => setIsAdvisorOpen(true)}
                    className="group w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all duration-300 active:scale-[0.98] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2 border border-blue-500/50"
                >
                    <span className="flex items-center gap-2">
                        {estado === 'CRITICAL' ? 'Corregir Plan' : estado === 'OPTIMIZED' ? 'Acelerar Meta' : 'Obtener Estrategia de Mejora'}
                        <span className="group-hover:rotate-12 transition-transform duration-300 text-blue-200">✨</span>
                    </span>
                </button>
            </div>

            {/* AI Advisor Modal */}
            <StrategyAdvisorModal
                isOpen={isAdvisorOpen}
                onClose={() => setIsAdvisorOpen(false)}
                goal={goal}
            />
        </div>
    );
}
