
import React from 'react';
import { Home, Calendar, DollarSign, Users, Scissors, CreditCard, Package, UserX, Settings, LogOut } from 'lucide-react';
import { ViewState } from '../types';

interface MenuViewProps {
    setView: (view: ViewState) => void;
    onOpenSettings: () => void;
}

export const MenuView: React.FC<MenuViewProps> = ({ setView, onOpenSettings }) => {
    const menuItems = [
        { id: 'home', label: 'Dashboard', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'schedule', label: 'Agenda', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'revenue', label: 'Receita', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'payments', label: 'Pagamentos', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'clients', label: 'Clientes', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'services', label: 'Serviços', icon: Scissors, color: 'text-pink-600', bg: 'bg-pink-50' },
        { id: 'packages', label: 'Pacotes', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'inactive_clients', label: 'Inativos', icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
    ] as const;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 px-1">Menu</h2>

            <div className="grid grid-cols-2 gap-4">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id as ViewState)}
                        className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
                    >
                        <div className={`p-3 rounded-xl ${item.bg} ${item.color} mb-3`}>
                            <item.icon size={28} />
                        </div>
                        <span className="font-medium text-gray-700">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-2 pt-6 border-t">
                <button onClick={onOpenSettings} className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 text-gray-700 font-medium">
                    <Settings className="text-gray-500" /> Configurações
                </button>
            </div>
        </div>
    );
};
