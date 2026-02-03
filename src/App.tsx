import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import { Sidebar } from './components/Sidebar';
import DashboardSummary from './components/DashboardSummary';
import CashFlowChart from './components/CashFlowChart';
import ExpensesPieChart from './components/ExpensesPieChart';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import AccountsSummary from './components/AccountsSummary';
import FinancialHealth from './components/FinancialHealth';
import Configuration from './components/Configuration';
import StrategyView from './components/StrategyView';
import WelcomeModal from './components/WelcomeModal';
import './index.css';
import { Transaction } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [session, setSession] = useState<Session | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [initialPillar, setInitialPillar] = useState<string | undefined>(undefined);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (userId: string) => {
    console.log('[App] Checking profile for user:', userId);
    const { data, error } = await supabase
      .from('perfiles')
      .select('onboarding_completed, full_name')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      setShowOnboarding(true);
    } else if (data) {
      if (!data.onboarding_completed) {
        setShowOnboarding(true);
      }
      if (data.full_name) {
        setUserName(data.full_name);
      }
    }
  };

  const handleOnboardingComplete = async (name: string) => {
    if (!session) return;
    setUserName(name);
    const { error, data } = await supabase
      .from('perfiles')
      .update({
        email: session.user.email,
        full_name: name,
        onboarding_completed: true
      })
      .eq('id', session.user.id)
      .select();

    if (error) {
      console.error('Error updating profile:', error);
      alert(`Error al guardar perfil: ${error.message}`);
    } else {
      if (data && data.length === 0) {
        const { error: insertError } = await supabase
          .from('perfiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: name,
            onboarding_completed: true
          });
        if (insertError) {
          alert(`Error al crear perfil: ${insertError.message}`);
          return;
        }
      }
      setShowOnboarding(false);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleTransactionSuccess = () => {
    setLastUpdated(Date.now());
    setEditingTransaction(null);
    setInitialPillar(undefined);
  };

  const handlePillarNavigation = (pillar: string) => {
    setInitialPillar(pillar);
    setActiveTab('transactions');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    closeMobileMenu();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <DashboardSummary
                  refreshTrigger={lastUpdated}
                  userName={userName}
                  onPillarClick={handlePillarNavigation}
                />
              </div>
              <div className="md:col-span-1">
                <FinancialHealth refreshTrigger={lastUpdated} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashFlowChart refreshTrigger={lastUpdated} />
              <ExpensesPieChart refreshTrigger={lastUpdated} />
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Registro de Movimientos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="w-full">
                <TransactionForm
                  onSuccess={handleTransactionSuccess}
                  transactionToEdit={editingTransaction}
                  onCancelEdit={() => setEditingTransaction(null)}
                  initialPillar={initialPillar}
                />
              </div>
              <TransactionList
                onEdit={(t) => setEditingTransaction(t)}
                refreshTrigger={lastUpdated}
                onDataChange={handleTransactionSuccess}
              />
            </div>
          </div>
        );
      case 'accounts':
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Estado de Cuentas</h2>
            <AccountsSummary />
          </div>
        );
      case 'settings':
        return (
          <Configuration
            onTruncateComplete={handleTransactionSuccess}
            toggleTheme={toggleTheme}
            currentTheme={theme}
          />
        );
      case 'strategy':
        return <StrategyView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex transition-colors duration-300">

      {!session ? (
        <Auth />
      ) : (
        <>
          {showOnboarding && <WelcomeModal onComplete={handleOnboardingComplete} />}

          {/* Sidebar Navigation */}
          {/* Note: Sidebar will now handle its own mobile visibility via isOpen prop if we update it */}
          {/* We are passing isOpen and onClose to Sidebar, but we need to update Sidebar to accept them first. */}
          {/* Assuming next step will update Sidebar.tsx */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            userEmail={session.user.email}
            userName={userName}
            // @ts-ignore - Prop will be added in next step
            isOpen={isMobileMenuOpen}
            // @ts-ignore - Prop will be added in next step
            onClose={closeMobileMenu}
          />

          {/* Main Content Area */}
          <main className="flex-1 md:ml-64 p-4 md:p-8 pb-8 md:pb-8 transition-all duration-300">
            <header className="flex justify-between items-center mb-6 md:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">ClarityClick</h1>
              </div>
            </header>

            {renderContent()}
          </main>
        </>
      )}
    </div >
  );
};

export default App;