import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Target, Plus, Trash2, Calendar, DollarSign, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { GoalThermometer } from './GoalThermometer';

interface Goal {
    id: number;
    nombre: string;
    monto_objetivo: number;
    monto_actual: number;
    fecha_limite: string;
    color?: string;
}

export default function InvestmentGoals() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [nombre, setNombre] = useState('');
    const [montoObjetivo, setMontoObjetivo] = useState('');
    const [montoActual, setMontoActual] = useState('');
    const [fechaLimite, setFechaLimite] = useState('');
    const { currency } = useCurrency(); // Ensure currency is available
    const [monthlySavings, setMonthlySavings] = useState(0);

    const fetchMonthlySavings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calculate savings based on 'Ahorrar' pillar (Simple approximation: Last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const { data } = await supabase
            .from('transacciones')
            .select('cantidad')
            .eq('user_id', user.id)
            .eq('pilar', 'Ahorrar')
            .gte('fecha', thirtyDaysAgo.toISOString());

        const total = data?.reduce((sum, t) => sum + t.cantidad, 0) || 0;
        setMonthlySavings(total);
    };

    const fetchGoals = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('metas')
            .select('*')
            .order('fecha_limite', { ascending: true });

        if (data) setGoals(data);
        if (error) console.error('Error fetching goals:', error);
        setLoading(false);
    };

    useEffect(() => {
        fetchGoals();
        fetchMonthlySavings();
    }, []);

    // Helper functions for masking (same as TransactionForm roughly)
    const getSeparators = (curr: string) => {
        if (['USD', 'MXN'].includes(curr)) return { group: ',', decimal: '.' };
        return { group: '.', decimal: ',' };
    };

    const formatNumber = (value: string, curr: string) => {
        if (!value) return '';
        const { group, decimal } = getSeparators(curr);
        let raw = value.split(group).join('');
        const parts = raw.split(decimal);
        let integerPart = parts[0].replace(/\D/g, '');
        let decimalPart = parts.length > 1 ? parts[1].replace(/\D/g, '') : null;
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
        if (decimalPart !== null) return `${formattedInteger}${decimal}${decimalPart}`;
        return formattedInteger;
    };

    const parseToNumber = (displayValue: string, curr: string): number => {
        const { group, decimal } = getSeparators(curr);
        let raw = displayValue.split(group).join('');
        raw = raw.replace(decimal, '.');
        return parseFloat(raw);
    };

    const handleMontoChange = (value: string, setter: (val: string) => void) => {
        if (value === '') {
            setter('');
            return;
        }
        const { group, decimal } = getSeparators(currency);
        const lastChar = value.slice(-1);
        if (/[0-9]/.test(lastChar) || lastChar === decimal || lastChar === group) {
            setter(formatNumber(value, currency));
        }
    };

    const handleSave = async () => {
        if (!nombre || !montoObjetivo || !fechaLimite) return alert('Completa los campos obligatorios');

        const realObjetivo = parseToNumber(montoObjetivo, currency);
        const realActual = parseToNumber(montoActual, currency) || 0;

        const newGoal = {
            nombre,
            monto_objetivo: realObjetivo,
            monto_actual: realActual,
            fecha_limite: fechaLimite,
            color: '#10b981' // unused if using GoalThermometer logic, but keeping for DB
        };

        const { error } = await supabase.from('metas').insert([newGoal]);

        if (error) {
            alert('Error al guardar la meta');
            console.error(error);
        } else {
            setShowForm(false);
            resetForm();
            fetchGoals();
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Eliminar esta meta?')) {
            const { error } = await supabase.from('metas').delete().eq('id', id);
            if (!error) fetchGoals();
        }
    };

    const resetForm = () => {
        setNombre('');
        setMontoObjetivo('');
        setMontoActual('');
        setFechaLimite('');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Target className="text-blue-600" /> Mis Metas Financieras
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-md text-sm font-medium"
                >
                    {showForm ? 'Cancelar' : <><Plus size={18} /> Nueva Meta</>}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-700 transition-colors">
                    <h4 className="font-bold text-slate-700 dark:text-white mb-4">Definir Nueva Meta</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text" placeholder="Nombre (ej. Fondo de Emergencia)"
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-blue-500 border outline-none dark:text-white"
                            value={nombre} onChange={e => setNombre(e.target.value)}
                        />
                        <input
                            type="date"
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-blue-500 border outline-none text-slate-600 dark:text-slate-300"
                            value={fechaLimite} onChange={e => setFechaLimite(e.target.value)}
                        />
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Monto Objetivo"
                                inputMode="decimal"
                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-blue-500 border outline-none dark:text-white font-bold"
                                value={montoObjetivo}
                                onChange={e => handleMontoChange(e.target.value, setMontoObjetivo)}
                            />
                        </div>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Ahorro Actual (Opcional)"
                                inputMode="decimal"
                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-blue-500 border outline-none dark:text-white"
                                value={montoActual}
                                onChange={e => handleMontoChange(e.target.value, setMontoActual)}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors">
                            Guardar Meta
                        </button>
                    </div>
                </div>
            )}

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.length === 0 && !loading && (
                    <div className="col-span-full text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Target size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No tienes metas definidas aún.</p>
                    </div>
                )}

                {goals.map((goal) => (
                    <div key={goal.id} className="relative group">
                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => handleDelete(goal.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 bg-white/50 dark:bg-black/20 rounded-full hover:bg-white dark:hover:bg-slate-700">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <GoalThermometer
                            current={goal.monto_actual}
                            target={goal.monto_objetivo}
                            label={goal.nombre}
                        />

                        {/* Projection Card */}
                        <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                            {monthlySavings > 0 ? (
                                (goal.monto_objetivo - goal.monto_actual) > 0 ? (
                                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Clock size={16} className="text-blue-500" />
                                        <span>Logro estimado en <span className="font-bold text-slate-800 dark:text-white">{Math.ceil((goal.monto_objetivo - goal.monto_actual) / monthlySavings)} meses</span></span>
                                    </p>
                                ) : <p className="text-emerald-500 font-bold flex items-center gap-2"><CheckCircle2 size={16} /> ¡Meta Cumplida!</p>
                            ) : (
                                <p className="text-orange-500 text-xs font-medium flex items-center gap-2">
                                    <AlertCircle size={14} /> Define un ahorro mensual para calcular proyección.
                                </p>
                            )}
                        </div>

                        {/* Date overlay below or inside? GoalThermometer doesn't actally confirm date showing. 
                            The user requested "GoalThermometer.tsx" with specific visuals. 
                            I should ideally let GoalThermometer handle main visuals, but GoalThermometer logic from previous step 
                            DOES NOT show the date. 
                            I will add the date below the thermometer or modify GoalThermometer. 
                            For now I'll add it below. 
                        */}
                        <div className="flex items-center gap-2 mt-2 px-2 text-xs text-slate-400">
                            <Calendar size={12} />
                            <span>Meta: {new Date(goal.fecha_limite).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
