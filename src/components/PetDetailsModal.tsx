
import React from 'react';
import { X, Calendar, Clock, Scissors, User } from 'lucide-react';
import { Client, Pet, Appointment, Service } from '../types';

interface PetDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: Pet | null;
    client: Client | null;
    appointments: Appointment[];
    services: Service[];
}

export const PetDetailsModal: React.FC<PetDetailsModalProps> = ({ isOpen, onClose, pet, client, appointments, services }) => {
    if (!isOpen || !pet || !client) return null;

    const petAppointments = appointments
        .filter(a => a.petId === pet.id && a.clientId === client.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">🐾</span>
                        {pet.name}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    {/* Pet Info */}
                    <div className="flex gap-4 mb-6">
                        <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-3xl shadow-inner text-brand-600">
                            {pet.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm text-gray-500">Tutor</div>
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-1">
                                <User size={14} /> {client.name}
                            </div>
                            <div className="text-sm text-gray-500">Detalhes</div>
                            <div className="text-sm text-gray-700">
                                {pet.breed || 'SRD'} • {pet.age ? `${pet.age} anos` : 'Idade n/a'}
                                {pet.gender && ` • ${pet.gender}`}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {pet.notes && (
                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg mb-6">
                            <div className="text-xs font-bold text-yellow-700 uppercase mb-1">Observações</div>
                            <div className="text-sm text-gray-700 mb-1">🐶 {pet.notes}</div>
                        </div>
                    )}

                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Calendar size={18} className="text-brand-600" /> Historico de Agendamentos
                    </h3>

                    <div className="space-y-3">
                        {petAppointments.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                                Nenhum agendamento registrado
                            </div>
                        ) : (
                            petAppointments.map(app => {
                                const service = services.find(s => s.id === app.serviceId);
                                const appDate = new Date(app.date);
                                const timeStr = appDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={app.id} className="border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors shadow-sm bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-gray-900">
                                                {appDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${app.status === 'concluido' ? 'bg-blue-100 text-blue-700' :
                                                    app.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {app.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                            <Scissors size={14} />
                                            {service?.name || 'Serviço excluído'}
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-2 border-t pt-2 border-dashed">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {timeStr}</span>
                                            <span>R$ {app.paidAmount || service?.price || 0}</span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
