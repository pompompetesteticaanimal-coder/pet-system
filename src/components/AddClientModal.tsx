
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Plus, Trash2, PawPrint, User, Phone, MapPin } from 'lucide-react';
import { Client, Pet } from '../types';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Client) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [complement, setComplement] = useState('');

    // Pet State
    const [pets, setPets] = useState<Partial<Pet>[]>([{ id: crypto.randomUUID(), name: '', breed: '', gender: 'Macho', size: 'Pequeno', coat: 'Curto' }]);

    if (!isOpen) return null;

    const handleAddPet = () => {
        setPets([...pets, { id: crypto.randomUUID(), name: '', breed: '', gender: 'Macho', size: 'Pequeno', coat: 'Curto' }]);
    };

    const handleRemovePet = (id: string) => {
        if (pets.length > 1) {
            setPets(pets.filter(p => p.id !== id));
        }
    };

    const handlePetChange = (id: string, field: keyof Pet, value: string) => {
        setPets(pets.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSave = () => {
        if (!name || !phone) {
            alert('Nome e Telefone são obrigatórios.');
            return;
        }

        const newClient: Client = {
            id: crypto.randomUUID(),
            name,
            phone,
            address,
            complement,
            pets: pets.map(p => ({
                id: p.id || crypto.randomUUID(),
                name: p.name || 'Pet sem nome',
                breed: p.breed || 'SRD',
                age: p.age || '',
                gender: p.gender || 'Macho',
                size: p.size || 'Pequeno',
                coat: p.coat || 'Curto',
                notes: p.notes || ''
            })) as Pet[],
            createdAt: new Date().toISOString()
        };

        onSave(newClient);
        onClose();
        // Reset form
        setName('');
        setPhone('');
        setAddress('');
        setComplement('');
        setPets([{ id: crypto.randomUUID(), name: '', breed: '', gender: 'Macho', size: 'Pequeno', coat: 'Curto' }]);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Cadastro</h2>
                        <p className="text-sm text-gray-500">Adicionar cliente e seus pets</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Client Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <User size={14} /> Dados do Tutor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Nome Completo *</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:ring-2 ring-brand-200 outline-none" placeholder="Ex: Maria Silva" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Telefone / WhatsApp *</label>
                                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:ring-2 ring-brand-200 outline-none" placeholder="(00) 00000-0000" />
                            </div>
                            <div className="md:col-span-2 flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Endereço</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                        <input value={address} onChange={e => setAddress(e.target.value)} className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:ring-2 ring-brand-200 outline-none" placeholder="Rua, Número, Bairro" />
                                    </div>
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Complemento</label>
                                    <input value={complement} onChange={e => setComplement(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:ring-2 ring-brand-200 outline-none" placeholder="Apto 101" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100" />

                    {/* Pets Info */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <PawPrint size={14} /> Pets ({pets.length})
                            </h3>
                            <button onClick={handleAddPet} className="text-xs bg-brand-50 text-brand-600 px-3 py-1.5 rounded-lg font-bold border border-brand-100 hover:bg-brand-100 transition flex items-center gap-1">
                                <Plus size={12} /> Adicionar outro Pet
                            </button>
                        </div>

                        {pets.map((pet, index) => (
                            <div key={pet.id} className="bg-gray-50/50 border border-gray-200 rounded-2xl p-4 relative group">
                                {pets.length > 1 && (
                                    <button onClick={() => handleRemovePet(pet.id!)} className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                                )}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nome do Pet</label>
                                        <input value={pet.name} onChange={e => handlePetChange(pet.id!, 'name', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold text-gray-800 focus:border-brand-300 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Raça</label>
                                        <input value={pet.breed} onChange={e => handlePetChange(pet.id!, 'breed', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-brand-300 outline-none" placeholder="SRD" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Idade</label>
                                        <input value={pet.age} onChange={e => handlePetChange(pet.id!, 'age', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-brand-300 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Porte</label>
                                        <select value={pet.size} onChange={e => handlePetChange(pet.id!, 'size', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-brand-300 outline-none">
                                            <option value="Pequeno">Pequeno</option>
                                            <option value="Médio">Médio</option>
                                            <option value="Grande">Grande</option>
                                            <option value="Gigante">Gigante</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Pelagem</label>
                                        <select value={pet.coat} onChange={e => handlePetChange(pet.id!, 'coat', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-brand-300 outline-none">
                                            <option value="Curta">Curta</option>
                                            <option value="Média">Média</option>
                                            <option value="Longa">Longa</option>
                                            <option value="Dupla">Dupla</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Sexo</label>
                                        <select value={pet.gender} onChange={e => handlePetChange(pet.id!, 'gender', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-brand-300 outline-none">
                                            <option value="Macho">Macho</option>
                                            <option value="Fêmea">Fêmea</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Observações</label>
                                        <textarea rows={1} value={pet.notes} onChange={e => handlePetChange(pet.id!, 'notes', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-brand-300 outline-none resize-none" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition">Cancelar</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-200 transition active:scale-95 flex items-center gap-2">
                        <Check size={20} /> Cadastrar Cliente
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
