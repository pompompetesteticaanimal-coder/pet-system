import React, { useState, useMemo } from 'react';
import { Client, Appointment, Service } from '../types';
import { Phone, CheckCircle, MessageCircle, Calendar as CalendarIcon, ArrowLeft, UserX, MapPin, Clock, Search, Filter } from 'lucide-react';

interface InactiveClientsViewProps {
    clients: Client[];
    appointments: Appointment[];
    services: Service[];
    onMarkContacted: (client: Client, daysInactive: number) => void;
    onBack: () => void;
}

export const InactiveClientsView: React.FC<InactiveClientsViewProps> = ({ clients, appointments, services, onMarkContacted, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Calculate filtering logic
    const inactiveClients = useMemo(() => {
        const now = new Date();
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(now.getDate() - 15);

        return clients.map(client => {
            const clientApps = appointments
                .filter(a => a.clientId === client.id && a.status !== 'cancelado')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const lastApp = clientApps[0];

            if (!lastApp) return null;

            const lastDate = new Date(lastApp.date);
            if (lastDate > fifteenDaysAgo) return null;

            const diffTime = Math.abs(now.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                client,
                lastApp,
                daysInactive: diffDays
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => b.daysInactive - a.daysInactive);
    }, [clients, appointments]);

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
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 backdrop-blur-md bg-white/90">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onBack} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all active:scale-95 group">
                        <ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <UserX className="text-orange-500" size={28} />
                            Painel de Inativos
                        </h1>
                        <p className="text-sm text-gray-400 font-medium">Reconquiste seus clientes</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:ring-2 ring-orange-100 transition-all">
                    <Search className="text-gray-400 ml-2" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar cliente ou pet..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 w-full md:w-64 placeholder:font-normal"
                    />
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 flex flex-col items-center text-center">
                    <span className="text-4xl font-black text-orange-500 mb-1">{filteredList.length}</span>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Clientes Inativos</span>
                </div>
                <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex flex-col items-center text-center">
                    <span className="text-4xl font-black text-blue-500 mb-1">
                        {Math.round(filteredList.reduce((acc, curr) => acc + curr.daysInactive, 0) / (filteredList.length || 1))}
                    </span>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Média de Dias</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 bg-white rounded-[2.5rem] border border-gray-100 border-dashed">
                        <UserX size={64} className="mb-4 opacity-20" />
                        <p className="font-bold text-lg">Nenhum cliente encontrado</p>
                        <p className="text-sm">Todos os seus clientes estão ativos ou não correspondem à busca.</p>
                    </div>
                ) : (
                    filteredList.map(({ client, lastApp, daysInactive }, index) => {
                        const pet = client.pets.find(p => p.id === lastApp.petId) || client.pets[0];
                        const dateObj = new Date(lastApp.date);

                        return (
                            <div
                                key={client.id}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                className="group bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-300 animate-slide-up relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] transform rotate-12 group-hover:scale-150 transition-transform duration-700">
                                    <UserX size={150} />
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                    {/* Left: Time Info */}
                                    <div className="flex pt-2 md:flex-col md:items-center md:justify-center md:min-w-[100px] md:border-r border-gray-100 pr-6 gap-3 md:gap-1">
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-black text-gray-800 leading-none">{daysInactive}</span>
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide bg-red-50 px-2 py-0.5 rounded-full mt-1">Dias Off</span>
                                        </div>
                                        <div className="hidden md:block w-px h-8 bg-gray-100 my-2"></div>
                                        <div className="text-xs text-gray-400 font-medium text-center">
                                            <div className="flex items-center gap-1 justify-center"><CalendarIcon size={10} /> {dateObj.toLocaleDateString('pt-BR')}</div>
                                            <div className="flex items-center gap-1 justify-center mt-0.5"><Clock size={10} /> {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>

                                    {/* Middle: Client Info */}
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div>
                                            <div className="flex items-baseline justify-between">
                                                <h3 className="text-xl font-bold text-gray-900 truncate flex items-center gap-2">
                                                    {pet?.name}
                                                    <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{pet?.breed}</span>
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1">
                                                <UserX size={14} className="text-gray-400" />
                                                Tutor(a): <span className="text-gray-800">{client.name}</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                <Phone size={12} /> {client.phone}
                                            </div>
                                            {client.address && (
                                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 truncate max-w-[200px]">
                                                    <MapPin size={12} /> {client.address}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 md:border-t-0 md:pt-0">
                                        <a
                                            href={getWhatsAppLink(client, pet?.name || 'Seu Pet', daysInactive)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all hover:-translate-y-1 active:scale-95"
                                        >
                                            <MessageCircle size={18} />
                                            <span className="md:hidden">WhatsApp</span>
                                        </a>
                                        <button
                                            onClick={() => onMarkContacted(client, daysInactive)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95"
                                        >
                                            <CheckCircle size={18} />
                                            <span className="md:hidden">Contatado</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <p className="text-center text-xs text-gray-300 font-medium mt-8">Exibindo clientes com mais de 15 dias sem visitas</p>
        </div>
    );
};
