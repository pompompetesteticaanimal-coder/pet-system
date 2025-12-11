import React, { useState, useMemo } from 'react';
import { Client, Appointment, Service } from '../types';
import { Phone, CheckCircle, MessageCircle, Calendar as CalendarIcon, ArrowLeft, UserX, MapPin, Clock, Search, Filter, SortAsc, SortDesc, ChevronDown } from 'lucide-react';

interface InactiveClientsViewProps {
    clients: Client[];
    appointments: Appointment[];
    services: Service[];
    onMarkContacted: (client: Client, daysInactive: number) => void;
    onBack: () => void;
}

export const InactiveClientsView: React.FC<InactiveClientsViewProps> = ({ clients, appointments, services, onMarkContacted, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [minDays, setMinDays] = useState(15);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // 1. Calculate filtering logic
    const inactiveClients = useMemo(() => {
        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - minDays);

        return clients.map(client => {
            const clientApps = appointments
                .filter(a => a.clientId === client.id && a.status !== 'cancelado')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const lastApp = clientApps[0];

            if (!lastApp) return null;

            const lastDate = new Date(lastApp.date);
            if (lastDate > cutoffDate) return null;

            const diffTime = Math.abs(now.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                client,
                lastApp,
                daysInactive: diffDays
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => sortOrder === 'asc' ? a.daysInactive - b.daysInactive : b.daysInactive - a.daysInactive);
    }, [clients, appointments, minDays, sortOrder]);

    const filteredList = useMemo(() => {
        return inactiveClients.filter(({ client }) =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.pets.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [inactiveClients, searchTerm]);

    const getWhatsAppLink = (client: Client, petName: string, days: number) => {
        const phone = client.phone.replace(/\D/g, '');
        const message = `Olá ${client.name.split(' ')[0]}, o ${petName} está com saudades! Já faz ${days} dias que não o vemos. Vamos agendar um banho?`;
        return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="space-y-4 animate-fade-in pb-20">
            {/* Compact Header */}
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 sticky top-0 z-20 backdrop-blur-md bg-white/95">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-all active:scale-95 group">
                            <ArrowLeft size={20} className="text-gray-500 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            Painel de Inativos
                            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{filteredList.length}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-50 rounded-xl px-2 py-1.5 border border-gray-200 focus-within:ring-2 ring-orange-100 transition-all">
                            <Search className="text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-bold text-gray-700 w-24 placeholder:font-normal ml-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <Filter size={14} className="text-gray-400 ml-1" />
                        {[15, 30, 45, 60].map(days => (
                            <button
                                key={days}
                                onClick={() => setMinDays(days)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${minDays === days ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                            >
                                {days}+ dias
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold border border-gray-100 transition-colors"
                    >
                        {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                        {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 px-1">
                {filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 bg-white rounded-[2rem] border border-gray-100 border-dashed">
                        <UserX size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">Nenhum cliente encontrado</p>
                        <p className="text-xs">Tente ajustar os filtros.</p>
                    </div>
                ) : (
                    filteredList.map(({ client, lastApp, daysInactive }, index) => {
                        const pet = client.pets.find(p => p.id === lastApp.petId) || client.pets[0];
                        const dateObj = new Date(lastApp.date);

                        return (
                            <div
                                key={client.id}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                className="group bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up flex flex-col sm:flex-row gap-4"
                            >
                                <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:items-center sm:min-w-[80px] sm:border-r border-gray-50 sm:pr-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-gray-800">{daysInactive}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">dias</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{dateObj.toLocaleDateString('pt-BR').slice(0, 5)}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900 truncate flex items-center gap-2">
                                                {pet?.name}
                                                <span className="text-[10px] font-normal text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{pet?.breed}</span>
                                            </h3>
                                            <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{client.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mt-2">
                                        <div className="flex items-center gap-1 bg-gray-50/50 px-1.5 py-0.5 rounded">
                                            <Phone size={10} /> {client.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 border-t border-gray-50 pt-3 sm:pt-0 sm:border-t-0 sm:justify-center">
                                    <a
                                        href={getWhatsAppLink(client, pet?.name || 'Seu Pet', daysInactive)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-none flex items-center justify-center w-10 h-10 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                    </a>
                                    <button
                                        onClick={() => onMarkContacted(client, daysInactive)}
                                        className="flex-1 sm:flex-none flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <p className="text-center text-[10px] text-gray-300 font-medium mt-4">Lista ordenada por inatividade {sortOrder === 'asc' ? '(crescente)' : '(decrescente)'}</p>
        </div>
    );
};
