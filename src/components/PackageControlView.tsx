
import React from 'react';
import { Package, Plus } from 'lucide-react';
import { Client, Appointment, Service, Pet } from '../types';

interface PackageControlViewProps {
    clients: Client[];
    appointments: Appointment[];
    services: Service[];
    onViewPet: (pet: Pet, client: Client) => void;
}

const PackageControlView: React.FC<PackageControlViewProps> = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="text-indigo-500" /> Controle de Pacotes
                </h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                    <Plus size={16} /> Novo Pacote
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Em Breve</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    O controle de pacotes pré-pagos e assinaturas estará disponível em breve.
                    Você poderá gerenciar sessoes restantes e validades.
                </p>
            </div>
        </div>
    );
};

export default PackageControlView;
