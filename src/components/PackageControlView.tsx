
import React, { useMemo } from 'react';
import { Package, Plus, AlertCircle, Calendar } from 'lucide-react';
import { Client, Appointment, Service, Pet } from '../types';

interface PackageControlViewProps {
    clients: Client[];
    appointments: Appointment[];
    services: Service[];
    onViewPet: (pet: Pet, client: Client, showReactivate?: boolean) => void;
}

const PackageControlView: React.FC<PackageControlViewProps> = ({ clients, appointments, services, onViewPet }) => {

    const inactivePackages = useMemo(() => {
        const now = new Date();
        const results: { client: Client, pet: Pet, lastApp: Appointment, serviceName: string }[] = [];

        clients.forEach(client => {
            client.pets.forEach(pet => {
                // Get all appointments for this pet
                const petApps = appointments.filter(a => a.petId === pet.id && a.status !== 'cancelado');

                // Sort by date desc
                petApps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                // Check if has ANY package appointment
                const packageApps = petApps.filter(a => {
                    const svc = services.find(s => s.id === a.serviceId);
                    return svc?.name.toLowerCase().includes('pacote');
                });

                if (packageApps.length === 0) return;

                // Check for future package appointments
                const hasFuturePackage = packageApps.some(a => new Date(a.date) > now);

                if (!hasFuturePackage) {
                    // It is inactive! Get the last one
                    const lastApp = packageApps[0];
                    const svc = services.find(s => s.id === lastApp.serviceId);
                    if (lastApp && svc) {
                        results.push({
                            client,
                            pet,
                            lastApp,
                            serviceName: svc.name
                        });
                    }
                }
            });
        });

        return results.sort((a, b) => new Date(b.lastApp.date).getTime() - new Date(a.lastApp.date).getTime());
    }, [clients, appointments, services]);

    return (
        <div className="space-y-6 animate-fade-in p-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 bg-gradient-to-r from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                            <Package size={24} />
                        </div>
                        Controle de Pacotes
                    </h2>
                    <p className="text-gray-500 font-medium ml-1 mt-1">Gerencie renovações e clientes inativos</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white text-gray-600 px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 border border-gray-200 shadow-sm transition-all flex items-center gap-2">
                        Histórico Geral
                    </button>
                    <button className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 hover:scale-[1.02] shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                        <Plus size={18} /> Novo Pacote
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertCircle size={16} /> Pacotes Vencidos / Inativos ({inactivePackages.length})
                    </h3>

                    {inactivePackages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inactivePackages.map(({ client, pet, lastApp, serviceName }) => (
                                <div
                                    key={`${client.id}-${pet.id}`}
                                    onClick={() => onViewPet(pet, client, true)}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 group-hover:scale-125 transition-transform" />

                                    <div className="flex justify-between items-start mb-3 relative">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">{pet.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{client.name}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {pet.name[0]}
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <Package size={14} className="text-indigo-500" />
                                            <span className="truncate">{serviceName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-red-500 font-medium pl-1">
                                            <Calendar size={12} />
                                            Último: {new Date(lastApp.date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                        <span className="text-xs font-bold text-indigo-600 group-hover:underline">Reativar agora →</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package size={32} />
                            </div>
                            <h3 className="text-gray-900 font-bold">Tudo em dia!</h3>
                            <p className="text-gray-500 text-sm mt-1">Nenhum pacote inativo encontrado no momento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackageControlView;
