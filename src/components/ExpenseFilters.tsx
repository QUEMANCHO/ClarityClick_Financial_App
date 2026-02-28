import { useState, useRef, useEffect } from 'react';
import { Filter, Calendar, Target, Tag, ChevronDown } from 'lucide-react';
import { CATEGORIAS, PILARES } from '../constants';

export interface FilterState {
    category: string;
    tags: string[];
    startDate: string;
    endDate: string;
    pilar: string; // New Filter
}

interface ExpenseFiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    onClear: () => void;
    availableTags: string[]; // New Prop
}

export default function ExpenseFilters({ filters, onFilterChange, onClear, availableTags }: ExpenseFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isTagsOpen, setIsTagsOpen] = useState(false);
    const tagsWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (tagsWrapperRef.current && !tagsWrapperRef.current.contains(event.target as Node)) {
                setIsTagsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'tags') return (value as string[]).length > 0;
        return Boolean(value);
    }).length;

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isOpen || activeFilterCount > 0
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
            >
                <Filter size={16} />
                Filtros Avanzados
                {activeFilterCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 animate-fade-in flex flex-col gap-4">

                    {/* Filters Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
                        {/* Pilar Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pilar</label>
                            <div className="relative group">
                                <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <select
                                    value={filters.pilar || ''}
                                    onChange={(e) => handleChange('pilar', e.target.value)}
                                    className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-pointer truncate"
                                >
                                    <option value="">Todos</option>
                                    {PILARES.map(p => (
                                        <option key={p.id} value={p.id}>{p.text}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Categoría</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-pointer truncate"
                            >
                                <option value="">Todas</option>
                                {CATEGORIAS.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tag Filter */}
                        <div className="space-y-1.5 min-w-[140px]" ref={tagsWrapperRef}>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Etiquetas {filters.tags?.length > 0 && `(${filters.tags.length})`}
                            </label>
                            <div className="relative group">
                                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors z-10 pointer-events-none" />
                                <button
                                    type="button"
                                    onClick={() => setIsTagsOpen(!isTagsOpen)}
                                    className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-pointer text-left truncate flex items-center justify-between"
                                >
                                    <span className="truncate">
                                        {filters.tags?.length > 0
                                            ? filters.tags.length === 1
                                                ? filters.tags[0]
                                                : `${filters.tags.length} seleccionadas`
                                            : 'Todas'}
                                    </span>
                                </button>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                                {isTagsOpen && (
                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 pl-3 pr-2 py-2 max-h-[200px] overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xl custom-scrollbar">
                                        {availableTags.length === 0 ? (
                                            <div className="text-xs text-slate-400 py-1">No hay etiquetas</div>
                                        ) : (
                                            <div className="flex flex-col gap-1.5">
                                                {availableTags.map(tag => (
                                                    <label key={tag} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer group/item py-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={filters.tags?.includes(tag) || false}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                const newTags = isChecked
                                                                    ? [...(filters.tags || []), tag]
                                                                    : (filters.tags || []).filter(t => t !== tag);
                                                                handleChange('tags', newTags);
                                                            }}
                                                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 cursor-pointer"
                                                        />
                                                        <span className="leading-tight group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors break-words w-full">{tag}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Date Range - Start */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Desde</label>
                            <div className="relative group">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white dark:[color-scheme:dark] hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Date Range - End */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hasta</label>
                            <div className="relative group">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white dark:[color-scheme:dark] hover:border-slate-300 dark:hover:border-slate-500 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={onClear}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span>Limpiar Filtros</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
