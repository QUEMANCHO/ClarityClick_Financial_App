import { useEffect, useState } from 'react';

interface DashboardHeaderProps {
    userName?: string;
}

const MOTIVATIONAL_QUOTES = [
    "Hoy es un buen día para invertir",
    "El control financiero es el camino a la libertad",
    "Cada pequeño ahorro cuenta para tu futuro",
    "Gestiona tu energía vital con sabiduría",
    "El dinero es una herramienta, no el objetivo",
    "Invierte en ti mismo, es la mejor inversión",
    "La paciencia es clave en el crecimiento financiero"
];

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
    const [quote, setQuote] = useState('');

    useEffect(() => {
        setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    }, []);

    return (
        <div className="mb-6 animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    Hola, <span className="text-blue-600 dark:text-blue-400">{userName || 'Usuario'}</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 italic text-sm">
                    "{quote}"
                </p>
            </div>
            {/* Optional: Add date or other meta info here if needed in future */}
        </div>
    );
}
