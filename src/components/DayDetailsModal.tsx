
import React, { useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Appointment, Client, Service } from '../types';

interface DayDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    appointments: Appointment[];
    clients: Client[];
    services: Service[];
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ isOpen, onClose, date, appointments, clients, services }) => {
    if (!isOpen) return null;
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const sortedApps = [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose} style={{ overflow: 'hidden' }}>
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="bg-brand-50 p-6 border-b border-brand-100 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-brand-500 transform rotate-12 pointer-events-none">
                        <CalendarIcon size={100} />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl text-brand-900 tracking-tight">{dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}</h3>
                        <p className="text-brand-700 font-medium">{dateObj.toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/50 hover:bg-white text-brand-700 p-2 rounded-full transition-all btn-spring z-10"><X size={20} /></button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50/50">
                    {sortedApps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <CalendarIcon size={48} className="mb-2 opacity-50" />
                            <p>Nenhum agendamento para este dia.</p>
                        </div>
                    ) : (
                        sortedApps.map((app, idx) => {
                            const client = clients.find(c => c.id === app.clientId);
                            const pet = client?.pets.find(p => p.id === app.petId);
                            const time = app.date.split('T')[1].slice(0, 5);
                            const endTime = new Date(new Date(app.date).getTime() + (app.durationTotal || 60) * 60000).toISOString().split('T')[1].slice(0, 5);
                            const mainSvc = services.find(s => s.id === app.serviceId);

                            return (
                                <div key={app.id} style={{ animationDelay: `${idx * 0.05}s` }} className="animate-slide-up bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-gray-100 pr-4">
                                        <span className="text-lg font-bold text-gray-800">{time}</span>
                                        <span className="text-xs text-gray-400 font-medium text-center">- {endTime}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 truncate">
                                                {pet?.name}
                                                <span className="text-gray-500 font-normal text-xs ml-1">
                                                    ({pet?.breed || 'Raça não inf.'} - {client?.name.split(' ')[0]})
                                                </span>
                                            </h4>
                                            <div className={`w-2 h-2 rounded-full ${app.status === 'concluido' ? 'bg-green-500' : app.status === 'cancelado' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                        </div>
                                        <p className="text-sm text-brand-600 font-medium truncate mt-0.5">{mainSvc?.name}</p>
                                        {app.notes && <p className="text-xs text-gray-400 mt-1 truncate bg-gray-50 p-1 rounded">Nota: {app.notes}</p>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-white text-center text-xs text-gray-400">
                    {sortedApps.length} agendamento(s)
                </div>
            </div>
        </div>
    );
};
