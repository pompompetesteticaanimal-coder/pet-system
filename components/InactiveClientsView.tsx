import React, { useMemo } from 'react';
import { Client, Appointment, Service } from '../types';
import { Phone, CheckCircle, MessageCircle, Calendar as CalendarIcon, ArrowLeft, MapPin, Dog, Clock, AlertCircle } from 'lucide-react';

interface InactiveClientsViewProps {
    clients: Client[];
    appointments: Appointment[];
    services: Service[];
    contactLogs: { clientId: string, date: string }[];
    onMarkContacted: (client: Client, daysInactive: number) => void;
    onBack: () => void;
}

export const InactiveClientsView: React.FC<InactiveClientsViewProps> = ({ clients, appointments, services, contactLogs, onMarkContacted, onBack }) => {
    // 1. Calculate filtering logic
    const inactiveClients = useMemo(() => {
        const now = new Date();
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(now.getDate() - 15);

        return clients.map(client => {
            // Find last completed/scheduled appointment (ignore canceled)
            const clientApps = appointments
                .filter(a => a.clientId === client.id && a.status !== 'cancelado')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const lastApp = clientApps[0];

            if (!lastApp) return null; // No history

            // Get last contact date
            const clientContacts = contactLogs
                .filter(l => l.clientId === client.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const lastContact = clientContacts[0];

            // Determine effective "Last Activity" date (Visit OR Contact)
            const lastAppDate = new Date(lastApp.date);
            const lastContactDate = lastContact ? new Date(lastContact.date) : new Date(0);

            const effectiveLastDate = lastAppDate > lastContactDate ? lastAppDate : lastContactDate;

            // Filter if activity is recent
            if (effectiveLastDate > fifteenDaysAgo) return null;

            const diffTime = Math.abs(now.getTime() - effectiveLastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                client,
                lastApp,
                daysInactive: diffDays,
                lastActivityType: effectiveLastDate === lastAppDate ? 'visit' : 'contact'
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => b.daysInactive - a.daysInactive); // Most inactive first
    }, [clients, appointments, contactLogs]);

    const getWhatsAppLink = (client: Client, petName: string, days: number) => {
        const phone = client.phone.replace(/\D/g, '');
        const message = `Olá *${client.name.split(' ')[0]}*, o *${petName}* está com saudades! 🐶\n\nJá faz *${days} dias* que não o vemos aqui na PomPomPet.\nVamos agendar um banho para deixá-lo lindo e cheiroso? 🛁✂️`;
        return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 bg-gray-50/50 min-h-full">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100 shadow-sm">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Painel de Inativos</h1>
                    <p className="text-xs text-gray-500 font-medium">Clientes ausentes há mais de 15 dias</p>
                </div>
            </div>

            {/* List */}
            <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveClients.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={40} className="text-gray-300" />
                        </div>
                        <p className="font-bold text-lg">Tudo em dia!</p>
                        <p className="text-sm">Nenhum cliente inativo no momento.</p>
                    </div>
                ) : (
                    inactiveClients.map(({ client, lastApp, daysInactive }, index) => {
                        const pet = client.pets.find(p => p.id === lastApp.petId) || client.pets[0];
                        const dateObj = new Date(lastApp.date);

                        return (
                            <div
                                key={client.id}
                                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group animate-slide-up relative overflow-hidden"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Inactivity Badge */}
                                <div className="absolute top-0 right-0 bg-rose-50 px-4 py-2 rounded-bl-2xl border-l border-b border-rose-100">
                                    <span className="text-xs font-black text-rose-600 uppercase flex items-center gap-1">
                                        <Clock size={12} /> {daysInactive} dias off
                                    </span>
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-600 shadow-inner shrink-0">
                                        <Dog size={28} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{pet?.name || 'Pet'}</h3>
                                        <p className="text-sm text-gray-500 font-medium">{pet?.breed || 'Raça não inf.'}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg w-fit">
                                            <CalendarIcon size={10} />
                                            Última vez: {dateObj.toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                        </div>
                                        <span className="font-bold">{client.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                            <Phone size={12} />
                                        </div>
                                        <span className="font-mono">{client.phone}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <a
                                        href={getWhatsAppLink(client, pet?.name || 'Seu Pet', daysInactive)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors border border-green-100 active:scale-95"
                                    >
                                        <MessageCircle size={18} />
                                        WhatsApp
                                    </a>
                                    <button
                                        onClick={() => onMarkContacted(client, daysInactive)}
                                        className="flex items-center justify-center gap-2 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 active:scale-95"
                                    >
                                        <CheckCircle size={18} />
                                        Já Falei
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
