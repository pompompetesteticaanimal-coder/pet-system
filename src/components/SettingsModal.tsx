
import React, { useState } from 'react';
import { Sparkles, X, Check, Moon } from 'lucide-react';
import { AppSettings } from '../types';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; settings: AppSettings; onSave: (s: AppSettings) => void }> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    if (!isOpen) return null;
    const themes = [
        { name: 'Rose (Padrão)', value: 'rose', color: '#e11d48' },
        { name: 'Azul Moderno', value: 'blue', color: '#2563eb' },
        { name: 'Roxo Criativo', value: 'purple', color: '#9333ea' },
        { name: 'Verde Natureza', value: 'green', color: '#16a34a' },
        { name: 'Laranja Vibrante', value: 'orange', color: '#ea580c' },
    ];
    return (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/40 ring-1 ring-white/50 animate-scale-up">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
                    <h3 className="font-bold text-xl text-gray-900 tracking-tight flex items-center gap-2"><Sparkles size={18} className="text-yellow-500" /> Aparência</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors btn-spring"><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    <div className="grid grid-cols-1 gap-3">
                        {themes.map(t => (
                            <button key={t.value} onClick={() => setLocalSettings({ ...localSettings, theme: t.value })} className={`p-4 rounded-2xl border flex items-center justify-between transition-all btn-spring ${localSettings.theme === t.value ? 'border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: t.color }}></div><span className="font-bold text-gray-800">{t.name}</span></div>
                                {localSettings.theme === t.value && <div className="bg-brand-600 text-white p-1 rounded-full animate-pop"><Check size={16} /></div>}
                            </button>
                        ))}
                        <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center"><Moon size={20} /></div>
                                <div>
                                    <span className="block font-bold text-gray-800">Modo Escuro</span>
                                    <span className="text-xs text-gray-500">Interface com cores escuras</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setLocalSettings({ ...localSettings, darkMode: !localSettings.darkMode })}
                                className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${localSettings.darkMode ? 'bg-brand-600' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${localSettings.darkMode ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100/50 bg-gray-50/50 flex justify-end gap-3 glass">
                    <button onClick={onClose} className="px-5 py-3 text-gray-600 hover:bg-gray-200/50 rounded-xl font-bold text-sm transition-colors btn-spring">Cancelar</button>
                    <button onClick={() => { onSave(localSettings); onClose(); }} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-brand-200 btn-spring">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
}
