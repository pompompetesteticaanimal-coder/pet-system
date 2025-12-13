
import React, { useMemo } from 'react';
import { UserX, MessageCircle, Calendar } from 'lucide-react';
import { Client, Appointment, Service, Pet } from '../types';

interface InactiveClientsViewProps {
    clients: Client[];
    appointments: Appointment[];
    services: Service[];
    contactLogs: any[];
    onMarkContacted: (clientId: string) => void;
    onBack: () => void;
    onViewPet: (pet: Pet, client: Client) => void;
}

export const InactiveClientsView: React.FC<InactiveClientsViewProps> = ({ clients, appointments, onBack }) => {

    // Logic to find inactive clients (e.g. no visits in 60 days)
    const inactiveList = useMemo(() => {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        return clients.filter(c => {
            const clientApps = appointments.filter(a => a.clientId === c.id && a.status !== 'cancelado');
            if (clientApps.length === 0) return true; // Never visited? maybe ignore

            // Get last appointment
            const sorted = clientApps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const lastApp = sorted[0];
            return new Date(lastApp.date) < sixtyDaysAgo;
        }).slice(0, 50); // Limit to 50
    }, [clients, appointments]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800">← Voltar</button>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserX className="text-red-500" /> Clientes Inativos
                </h2>
            </div>

            {inactiveList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500">Nenhum cliente inativo encontrado nos últimos 60 dias.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {inactiveList.map(client => (
                        <div key={client.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{client.name}</h3>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {client.pets.map(p => (
                                        <span key={p.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{p.name}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-2">
                                    <MessageCircle size={16} /> WhatsApp
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
