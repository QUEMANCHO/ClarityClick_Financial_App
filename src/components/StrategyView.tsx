import { useState, useRef, useEffect } from 'react';
import { Target, TrendingUp, ShieldCheck } from 'lucide-react';
import InvestmentGoals from './InvestmentGoals';
import CompoundInterestCalculator from './CompoundInterestCalculator';

export default function StrategyView() {
    const [activeSection, setActiveSection] = useState<'goals' | 'simulator' | null>('goals');

    const goalsRef = useRef<HTMLDivElement>(null);
    const simulatorRef = useRef<HTMLDivElement>(null);

    // Removed auto-scroll logic to prevent mobile glitch
    useEffect(() => {
        // Optional: Reset active section or specific logic if needed
    }, [activeSection]);

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="mb-4">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Estrategia de Inversión</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Planifica tu futuro financiero con metas claras y proyección.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => {
                        setActiveSection('goals');
                        setTimeout(() => goalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }}
                    className={`rounded-2xl p-6 text-white shadow-lg transition-all cursor-pointer transform hover:scale-105
                    ${activeSection === 'goals'
                            ? 'bg-blue-600 ring-4 ring-blue-200 dark:ring-blue-900 scale-105'
                            : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-xl'}`}
                >
                    <div className="bg-white/20 p-3 rounded-xl w-fit mb-4">
                        <Target size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Mis Metas</h3>
                    <p className="text-blue-100 text-sm">Define objetivos de ahorro y sigue tu progreso visualmente.</p>
                </div>

                <div
                    onClick={() => {
                        setActiveSection('simulator');
                        setTimeout(() => simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }}
                    className={`rounded-2xl p-6 text-white shadow-lg transition-all cursor-pointer transform hover:scale-105
                    ${activeSection === 'simulator'
                            ? 'bg-emerald-600 ring-4 ring-emerald-200 dark:ring-emerald-900 scale-105'
                            : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:shadow-xl'}`}
                >
                    <div className="bg-white/20 p-3 rounded-xl w-fit mb-4">
                        <TrendingUp size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Simulador</h3>
                    <p className="text-emerald-100 text-sm">Calculadora de interés compuesto y proyecciones.</p>
                </div>

                <div className="bg-slate-800 dark:bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700 opacity-60 cursor-not-allowed">
                    <div className="bg-white/10 p-3 rounded-xl w-fit mb-4">
                        <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Perfil de Riesgo</h3>
                    <p className="text-slate-400 text-sm">Próximamente</p>
                </div>
            </div>

            <div className="mt-8 space-y-12">
                {/* Always render, or conditional? User asked to scroll to sections, implying they might co-exist or we just scroll to the container?
                   Currently logic is conditional: {activeSection === 'goals' && ...}
                   If they are conditional, scrollIntoView might fail if the element isn't there yet.
                   However, useEffect runs after render.
                   Let's wrap them in divs with refs.
                */}

                {activeSection === 'goals' && (
                    <div ref={goalsRef} className="animate-fade-in">
                        <InvestmentGoals />
                    </div>
                )}
                {activeSection === 'simulator' && (
                    <div ref={simulatorRef} className="animate-fade-in">
                        <CompoundInterestCalculator />
                    </div>
                )}
            </div>
        </div>
    );
}
