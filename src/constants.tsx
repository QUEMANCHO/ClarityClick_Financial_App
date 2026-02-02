
import { TrendingUp, TrendingDown, PiggyBank, Briefcase } from 'lucide-react';

export const CUENTAS = [
    { id: 'Efectivo', label: 'Efectivo' },
    { id: 'Bancolombia', label: 'Bancolombia' },
    { id: 'Nequi', label: 'Nequi' },
    { id: 'Davivienda', label: 'Davivienda' },
    { id: 'Nu Bank', label: 'Nu Bank' },
    { id: 'Tarjeta Crédito', label: 'Tarjeta Crédito' }
];

export const CATEGORIAS = ['Hogar', 'Transporte', 'Alimentación', 'Ocio', 'Salud', 'Educación', 'Servicios', 'Otros'];

export const PILARES = [
    {
        id: 'Ganar',
        icon: <TrendingUp size={20} />,
        color: 'bg-green-500',
        activeClass: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700',
        badgeClass: 'bg-green-100 text-green-700',
        text: 'Ganar'
    },
    {
        id: 'Gastar',
        icon: <TrendingDown size={20} />,
        color: 'bg-red-500',
        activeClass: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700',
        badgeClass: 'bg-red-100 text-red-700',
        text: 'Gastar'
    },
    {
        id: 'Ahorrar',
        icon: <PiggyBank size={20} />,
        color: 'bg-blue-500',
        activeClass: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700',
        badgeClass: 'bg-blue-100 text-blue-700',
        text: 'Ahorrar'
    },
    {
        id: 'Invertir',
        icon: <Briefcase size={20} />,
        color: 'bg-purple-500',
        activeClass: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700',
        badgeClass: 'bg-purple-100 text-purple-700',
        text: 'Invertir'
    },
];

export const getPillarBadgeStyle = (pilarName: string): string => {
    const pilar = PILARES.find(p => p.id === pilarName);
    return pilar ? pilar.badgeClass : 'bg-slate-100 text-slate-700';
};
