import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Target, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';

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
    }, []);

    const handleSave = async () => {
        if (!nombre || !montoObjetivo || !fechaLimite) return alert('Completa los campos obligatorios');

        const newGoal = {
            nombre,
            monto_objetivo: parseFloat(montoObjetivo),
            monto_actual: parseFloat(montoActual) || 0,
            fecha_limite: fechaLimite,
            color: ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-indigo-500'][Math.floor(Math.random() * 4)] // Random color for bar
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

    const calculateProgress = (current: number, target: number) => {
        return Math.min(Math.round((current / target) * 100), 100);
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
                                type="number" placeholder="Monto Objetivo"
                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-blue-500 border outline-none dark:text-white"
                                value={montoObjetivo} onChange={e => setMontoObjetivo(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input
                                type="number" placeholder="Ahorro Actual (Opcional)"
                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 rounded-xl border-transparent focus:border-blue-500 border outline-none dark:text-white"
                                value={montoActual} onChange={e => setMontoActual(e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.length === 0 && !loading && (
                    <div className="col-span-full text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Target size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No tienes metas definidas aún.</p>
                    </div>
                )}

                {goals.map((goal) => {
                    const progress = calculateProgress(goal.monto_actual, goal.monto_objetivo);
                    return (
                        <div key={goal.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative group overflow-hidden transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-white">{goal.nombre}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar size={12} />
                                        <span>Meta: {new Date(goal.fecha_limite).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(goal.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">${goal.monto_actual.toLocaleString()}</span>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">de ${goal.monto_objetivo.toLocaleString()}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${goal.color || 'bg-blue-500'}`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs font-bold">
                                <span className={`${progress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>{progress}% Completado</span>
                                <span className="text-slate-400">Faltan ${(goal.monto_objetivo - goal.monto_actual).toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
