
import React from 'react';
import { Menu, Home, DollarSign, Users, Calendar, Settings, LogOut, Package, UserX, Scissors, CreditCard } from 'lucide-react';
import { ViewState, AppSettings } from '../types';
import { UserProfile } from '../types/auth';

interface LayoutProps {
    children: React.ReactNode;
    currentView: ViewState;
    setView: (view: ViewState) => void;
    user: UserProfile | null;
    onLogin: () => void;
    onLogout: () => void;
    settings: AppSettings;
    onOpenSettings: () => void;
    isLoading: boolean;
    onAddAppointment: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children, currentView, setView, user, onLogout, settings, onOpenSettings, onAddAppointment
}) => {

    const navItems = [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'schedule', label: 'Agenda', icon: Calendar },
        { id: 'revenue', label: 'Receita', icon: DollarSign },
        { id: 'costs', label: 'Custos', icon: DollarSign }, // Note: duplicate icon, maybe change
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'services', label: 'Serviços', icon: Scissors },
        { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    ] as const;

    // A simple sidebar implementation
    const Sidebar = () => (
        <div className={`hidden md:flex flex-col w-64 border-r bg-white h-full fixed left-0 top-0 z-10 transition-colors`}>
            <div className="p-6 flex items-center gap-3 border-b border-gray-100">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    P
                </div>
                <h1 className="font-bold text-xl tracking-tight text-gray-800">{settings.appName}</h1>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id as ViewState)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentView === item.id
                            ? 'bg-brand-50 text-brand-600'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </button>
                ))}

                <div className="pt-4 mt-6 border-t border-gray-100">
                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Outros</p>
                    <button onClick={() => setView('packages')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        <Package size={18} /> Pacotes
                    </button>
                    <button onClick={() => setView('inactive_clients')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        <UserX size={18} /> Inativos
                    </button>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg mb-2"
                >
                    <Settings size={18} /> Configurações
                </button>
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                        {user?.business_name?.[0] || user?.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.business_name || 'Usuário'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button onClick={onLogout} className="text-gray-400 hover:text-red-500">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    // Mobile Header
    const MobileHeader = () => (
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20">
            <div className="font-bold text-lg text-brand-600">{settings.appName}</div>
            <button onClick={() => setView('menu')} className="p-2 -mr-2 text-gray-600">
                <Menu size={24} />
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 transition-colors">
            <Sidebar />
            <div className="md:pl-64 flex flex-col min-h-screen">
                <MobileHeader />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* FAB for Mobile */}
            <button
                onClick={onAddAppointment}
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all z-40"
            >
                <Calendar size={24} />
            </button>
        </div>
    );
};
