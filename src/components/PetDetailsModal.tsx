import React, { useMemo } from 'react';
import { X, Calendar, Clock, Scissors, User, MessageCircle, RefreshCw } from 'lucide-react';
import { Client, Pet, Appointment, Service } from '../types';

interface PetDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: Pet | null;
    client: Client | null;
    appointments: Appointment[];
    services: Service[];
    showReactivate?: boolean;
    onReactivate?: (pet: Pet, client: Client) => void;
}

export const PetDetailsModal: React.FC<PetDetailsModalProps> = ({ isOpen, onClose, pet, client, appointments, services, showReactivate, onReactivate }) => {
    if (!isOpen || !pet || !client) return null;

    const { futureApps, pastApps } = useMemo(() => {
        const now = new Date();
        const relevantApps = appointments
            .filter(a => a.petId === pet.id && a.clientId === client.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            futureApps: relevantApps.filter(a => new Date(a.date) >= now).reverse(), // Closest first
            pastApps: relevantApps.filter(a => new Date(a.date) < now)
        };
    }, [appointments, pet.id, client.id]);

    const handleChat = () => {
        const phone = client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="font-black text-2xl text-gray-800 flex items-center gap-2">
                            {pet.name}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                            <User size={14} /> {client.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleChat} className="py-3 px-4 bg-green-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <MessageCircle size={20} /> Conversar
                        </button>
                        {showReactivate && onReactivate && (
                            <button onClick={() => onReactivate(pet, client)} className="py-3 px-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                <RefreshCw size={20} /> Reativar Pacote
                            </button>
                        )}
                    </div>

                    {/* Pet Info Chips */}
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-gray-100/80 rounded-lg text-xs font-bold text-gray-600 border border-gray-200">{pet.breed || 'SRD'}</span>
                        <span className="px-3 py-1 bg-gray-100/80 rounded-lg text-xs font-bold text-gray-600 border border-gray-200">{pet.age || '?'} anos</span>
                        <span className="px-3 py-1 bg-gray-100/80 rounded-lg text-xs font-bold text-gray-600 border border-gray-200">{pet.gender || '?'}</span>
                    </div>

                    {/* Notes */}
                    {pet.notes && (
                        <div className="bg-amber-50 border border-amber-100/50 p-4 rounded-2xl relative">
                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-2">Observações</div>
                            <p className="text-sm font-medium text-amber-900 leading-relaxed">{pet.notes}</p>
                        </div>
                    )}

                    {/* Future Appointments */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Calendar size={18} className="text-brand-600" /> Próximos Agendamentos
                        </h3>
                        {futureApps.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                Nenhum agendamento futuro
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {futureApps.map(app => (
                                    <AppointmentItem key={app.id} app={app} services={services} isFuture />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Appointments */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 mt-2">
                            <Clock size={18} className="text-gray-400" /> Histórico
                        </h3>
                        {pastApps.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                Nenhum histórico recente
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pastApps.map(app => (
                                    <AppointmentItem key={app.id} app={app} services={services} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AppointmentItem = ({ app, services, isFuture }: { app: Appointment, services: Service[], isFuture?: boolean }) => {
    const service = services.find(s => s.id === app.serviceId);
    const date = new Date(app.date);

    return (
        <div className={`border rounded-2xl p-4 transition-all ${isFuture ? 'bg-white border-brand-100 shadow-sm' : 'bg-gray-50/50 border-gray-100 opacity-80'}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className={`text-sm font-bold capitalize ${isFuture ? 'text-brand-700' : 'text-gray-700'}`}>
                        {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <StatusBadge status={app.status} />
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Scissors size={14} className="text-gray-400" />
                {service?.name || 'Serviço removido'}
            </div>
            {(app.paidAmount || 0) > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100/50 flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium">Valor Pago</span>
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">R$ {app.paidAmount}</span>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        agendado: 'bg-blue-50 text-blue-600 border-blue-100',
        concluido: 'bg-green-50 text-green-600 border-green-100',
        cancelado: 'bg-red-50 text-red-600 border-red-100',
        nao_veio: 'bg-gray-100 text-gray-500 border-gray-200'
    };
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${styles[status] || styles.agendado}`}>
            {status.replace('_', ' ')}
        </span>
    );
};
