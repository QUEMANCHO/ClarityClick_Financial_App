import { useState, useEffect } from 'react';
import { X, Save, Loader2, Edit2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { CurrencyCode, PillarType, GoalWithIntelligence } from '../types';
import { useCurrency } from '../../../../context/CurrencyContext';

interface CreateGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoalCreated: () => void;
    goalToEdit?: GoalWithIntelligence | null;
}

export default function CreateGoalModal({ isOpen, onClose, onGoalCreated, goalToEdit }: CreateGoalModalProps) {
    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState<CurrencyCode>('COP');
    const [fechaLimite, setFechaLimite] = useState('');
    const [pilar, setPilar] = useState<PillarType>('Ahorrar');

    // New Planning Inputs
    const [aporteAhorro, setAporteAhorro] = useState('');
    const [aporteInversion, setAporteInversion] = useState('');
    const [frecuencia, setFrecuencia] = useState<'Diario' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual'>('Mensual');

    const { convertAmount } = useCurrency();

    const [loading, setLoading] = useState(false);
    const [capacidadNeta, setCapacidadNeta] = useState<number | null>(null);

    // Reset or Fill form when opening
    useEffect(() => {
        if (isOpen) {
            if (goalToEdit) {
                // Edit Mode
                setNombre(goalToEdit.meta_nombre);
                setMonto(goalToEdit.monto_objetivo.toString());
                setMoneda(goalToEdit.moneda as CurrencyCode);
                const dateVal = goalToEdit.fecha_limite ? goalToEdit.fecha_limite.split('T')[0] : '';
                setFechaLimite(dateVal);
                setPilar(goalToEdit.pilar_principal as PillarType);
                setAporteAhorro(goalToEdit.aporte_ahorro_base?.toString() || '');
                setAporteInversion(goalToEdit.aporte_inversion_base?.toString() || '');
                setFrecuencia(goalToEdit.aporte_frecuencia || 'Mensual');
            } else {
                // Create Mode
                setNombre('');
                setMonto('');
                setMoneda('COP');
                setFechaLimite('');
                setPilar('Ahorrar');
                setAporteAhorro('');
                setAporteInversion('');
                setFrecuencia('Mensual');
            }

            // Fetch net capacity
            const fetchCapacity = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Gross Capacity
                const { data: txs } = await supabase
                    .from('transacciones')
                    .select('pilar, cantidad, fecha')
                    .eq('user_id', user.id);

                let inTotal = 0; let outTotal = 0;
                const months = new Set<string>();
                txs?.forEach(t => {
                    if (t.pilar === 'Ganar') inTotal += t.cantidad;
                    if (t.pilar === 'Gastar') outTotal += t.cantidad;
                    months.add(t.fecha.substring(0, 7)); // YYYY-MM
                });
                const mc = months.size > 0 ? months.size : 1;
                const gross = (inTotal - outTotal) / mc;

                // Substract other goals
                const { data: metas } = await supabase
                    .from('metas')
                    .select('id, aporte_ahorro_base, aporte_inversion_base, aporte_frecuencia')
                    .eq('user_id', user.id);

                let sumOthers = 0;
                metas?.forEach(m => {
                    if (!goalToEdit || m.id !== goalToEdit.meta_id) {
                        const freq = m.aporte_frecuencia || 'Mensual';
                        const a = m.aporte_ahorro_base || 0;
                        const i = m.aporte_inversion_base || 0;
                        let multiplier = 1;
                        if (freq === 'Diario') multiplier = 30;
                        if (freq === 'Semanal') multiplier = 4;
                        if (freq === 'Quincenal') multiplier = 2;
                        if (freq === 'Anual') multiplier = 1 / 12;
                        sumOthers += (a + i) * multiplier;
                    }
                });
                setCapacidadNeta(gross - sumOthers);
            };
            fetchCapacity();
        }
    }, [isOpen, goalToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const goalData = {
                nombre: nombre,
                monto_objetivo: parseFloat(monto),
                moneda: moneda,
                fecha_limite: fechaLimite,
                pilar_principal: pilar,
                aporte_ahorro_base: parseFloat(aporteAhorro) || 0,
                aporte_inversion_base: parseFloat(aporteInversion) || 0,
                aporte_frecuencia: frecuencia
            };

            if (goalToEdit) {
                // UPDATE
                const { error } = await supabase
                    .from('metas')
                    .update(goalData)
                    .eq('id', goalToEdit.meta_id);

                if (error) throw error;
            } else {
                // CREATE

                // 1. Ensure a Strategy exists (or fetch the first one)
                let estrategiaId = null;

                const { data: strategies } = await supabase
                    .from('estrategias')
                    .select('id')
                    .eq('user_id', user.id)
                    .limit(1);

                if (strategies && strategies.length > 0) {
                    estrategiaId = strategies[0].id;
                } else {
                    // Create default strategy
                    const { data: newStrat, error: stratError } = await supabase
                        .from('estrategias')
                        .insert({ user_id: user.id, nombre: 'Estrategia Principal' })
                        .select()
                        .single();

                    if (stratError) throw stratError;
                    estrategiaId = newStrat.id;
                }

                // 2. Insert Goal
                const { error } = await supabase
                    .from('metas')
                    .insert({
                        user_id: user.id,
                        estrategia_id: estrategiaId,
                        ...goalData,
                        // monto_actual is calculated from transactions, do not insert
                    });

                if (error) throw error;
            }

            onGoalCreated();
            onClose();

        } catch (error: any) {
            console.error('Error saving goal:', error);
            alert(`Error al guardar la meta: ${error.message || error.error_description || 'Intenta de nuevo'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Calculamos equivalente mensual on-the-fly para el feedback
    const getMonthlyEquivalent = () => {
        const a = parseFloat(aporteAhorro) || 0;
        const i = parseFloat(aporteInversion) || 0;
        const totalBase = a + i;
        if (totalBase === 0) return 0;

        switch (frecuencia) {
            case 'Diario': return totalBase * 30;
            case 'Semanal': return totalBase * 4;
            case 'Quincenal': return totalBase * 2;
            case 'Anual': return totalBase / 12;
            default: return totalBase;
        }
    };
    const equivalentMonthly = getMonthlyEquivalent();

    const handleCurrencyChange = (newMoneda: CurrencyCode) => {
        if (newMoneda === moneda) return;
        if (monto) setMonto(Math.round(convertAmount(parseFloat(monto), moneda, newMoneda)).toString());
        if (aporteAhorro) setAporteAhorro(Math.round(convertAmount(parseFloat(aporteAhorro), moneda, newMoneda)).toString());
        if (aporteInversion) setAporteInversion(Math.round(convertAmount(parseFloat(aporteInversion), moneda, newMoneda)).toString());
        setMoneda(newMoneda);
    };

    const capacidadNetaMoneda = capacidadNeta !== null ? convertAmount(capacidadNeta, 'COP', moneda) : null;

    // Formateador visual
    const formatDisplay = (val: string) => {
        if (!val) return '';
        const numericOnly = val.toString().replace(/\D/g, '');
        if (!numericOnly) return '';
        return parseInt(numericOnly, 10).toLocaleString('es-CO');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">

                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {goalToEdit ? <Edit2 size={18} className="text-blue-500" /> : null}
                        {goalToEdit ? 'Editar Meta' : 'Nueva Meta Estratégica'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">

                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre de la Meta</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Fondo de Emergencia, Viaje a Europa..."
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white text-sm"
                        />
                    </div>

                    {/* Grid Compacto: Monto, Moneda, Fecha */}
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 sm:col-span-5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Monto Objetivo</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                placeholder="0"
                                value={formatDisplay(monto)}
                                onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono font-medium text-slate-800 dark:text-white text-sm"
                            />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Moneda</label>
                            <select
                                value={moneda}
                                onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800 dark:text-white text-sm"
                            >
                                <option value="COP">COP</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="MXN">MXN</option>
                            </select>
                        </div>
                        <div className="col-span-6 sm:col-span-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Límite</label>
                            <input
                                type="date"
                                required
                                value={fechaLimite}
                                onChange={(e) => setFechaLimite(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white text-sm"
                            />
                        </div>
                    </div>

                    {/* SECCIÓN DE APORTE PLANEADO (Compacta) */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <span className="text-emerald-500">⚡</span> Plan de Aportes
                            </h3>
                            <span className="text-[10px] text-slate-400">Opcional</span>
                        </div>

                        <div className="grid grid-cols-12 gap-3">
                            {/* Frecuencia (Nueva) */}
                            <div className="col-span-12 sm:col-span-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Frecuencia</label>
                                <select
                                    value={frecuencia}
                                    onChange={(e) => setFrecuencia(e.target.value as any)}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium text-slate-700 dark:text-white"
                                >
                                    <option value="Diario">Diario</option>
                                    <option value="Semanal">Semanal</option>
                                    <option value="Quincenal">Quincenal</option>
                                    <option value="Mensual">Mensual</option>
                                    <option value="Anual">Anual</option>
                                </select>
                            </div>
                            {/* Ahorro Planeado */}
                            <div className="col-span-6 sm:col-span-4">
                                <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Ahorro ($)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={formatDisplay(aporteAhorro)}
                                    onChange={(e) => setAporteAhorro(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                />
                            </div>
                            {/* Inversión Planeada */}
                            <div className="col-span-6 sm:col-span-4">
                                <label className="block text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Inversión ($)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={formatDisplay(aporteInversion)}
                                    onChange={(e) => setAporteInversion(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Proactive Feedback Label */}
                        {equivalentMonthly > 0 && capacidadNetaMoneda !== null && (
                            <div className={`text-[11px] p-2 rounded-lg flex items-start gap-2 ${equivalentMonthly > capacidadNetaMoneda
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800'
                                }`}>
                                <span className="mt-0.5">{equivalentMonthly > capacidadNetaMoneda ? '⚠️' : '💡'}</span>
                                <p>
                                    Esto equivale a <strong>{equivalentMonthly.toLocaleString('es-CO')} {moneda} mensuales</strong>.
                                    Tu capacidad neta actual es de <strong>{capacidadNetaMoneda.toLocaleString('es-CO')} {moneda}</strong>.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pilar Principal - Compact Grid (REMOVED PARA SIMPLICIDAD) */}
                    {/* 
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilar de Impacto</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['Ganar', 'Gastar', 'Ahorrar', 'Invertir'] as PillarType[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPilar(p)}
                                    className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all truncate ${pilar === p
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    */}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm
                                ${goalToEdit
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                                }`}
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={18} />}
                            {goalToEdit ? 'Actualizar Meta' : 'Crear Meta'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
