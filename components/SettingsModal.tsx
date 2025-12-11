import React, { useState } from 'react';
import { Sparkles, X, Check, Moon, Database, RefreshCw, Save } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (s: AppSettings) => void;
    sheetId: string;
    onChangeSheetId: (id: string) => void;
    onSync: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, sheetId, onChangeSheetId, onSync }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [localSheetId, setLocalSheetId] = useState(sheetId);
    const [isSyncing, setIsSyncing] = useState(false);

    if (!isOpen) return null;

    const themes = [
        { name: 'Rose (Padrão)', value: 'rose', color: '#e11d48' },
        { name: 'Azul Moderno', value: 'blue', color: '#2563eb' },
        { name: 'Roxo Criativo', value: 'purple', color: '#9333ea' },
        { name: 'Verde Natureza', value: 'green', color: '#16a34a' },
        { name: 'Laranja Vibrante', value: 'orange', color: '#ea580c' },
    ];

    const handleSyncClick = async () => {
        setIsSyncing(true);
        try {
            await onSync();
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/40 ring-1 ring-white/50 animate-scale-up">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
                    <h3 className="font-bold text-xl text-gray-900 tracking-tight flex items-center gap-2"><Sparkles size={18} className="text-yellow-500" /> Configurações</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors btn-spring"><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-8 flex-1">

                    {/* Database Config Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Database size={14} /> Dados & Sincronização
                        </h4>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">ID da Planilha Google (Spreadsheet ID)</label>
                                <input
                                    value={localSheetId}
                                    onChange={(e) => setLocalSheetId(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-600 focus:ring-2 ring-brand-200 outline-none transition-all"
                                    placeholder="Ex: 1qbb0RoKxFfrdyTCyHd5rJRbLN..."
                                />
                                <p className="text-[10px] text-gray-400 mt-2 px-1 leading-relaxed">
                                    Este é o identificador único da sua planilha no Google Sheets. Encontrado na URL entre /d/ e /edit.
                                </p>
                            </div>
                            <button
                                onClick={handleSyncClick}
                                disabled={isSyncing}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'}`}
                            >
                                <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                            </button>
                        </div>
                    </div>

                    {/* Appearance Config Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Sparkles size={14} /> Aparência & Tema
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            {themes.map(t => (
                                <button key={t.value} onClick={() => setLocalSettings({ ...localSettings, theme: t.value })} className={`p-3 rounded-2xl border flex items-center justify-between transition-all btn-spring ${localSettings.theme === t.value ? 'border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: t.color }}></div><span className="font-bold text-gray-700 text-sm">{t.name}</span></div>
                                    {localSettings.theme === t.value && <div className="bg-brand-600 text-white p-1 rounded-full animate-pop"><Check size={14} /></div>}
                                </button>
                            ))}
                            <div className="border-t border-gray-100 my-2 pt-2"></div>
                            <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center"><Moon size={16} /></div>
                                    <div>
                                        <span className="block font-bold text-gray-700 text-sm">Modo Escuro</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setLocalSettings({ ...localSettings, darkMode: !localSettings.darkMode })}
                                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${localSettings.darkMode ? 'bg-brand-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${localSettings.darkMode ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
                <div className="p-5 border-t border-gray-100/50 bg-gray-50/50 flex justify-end gap-3 glass">
                    <button onClick={onClose} className="px-5 py-3 text-gray-600 hover:bg-gray-200/50 rounded-xl font-bold text-sm transition-colors btn-spring">Cancelar</button>
                    <button onClick={() => { onSave(localSettings); onChangeSheetId(localSheetId); onClose(); }} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-brand-200 btn-spring flex items-center gap-2">
                        <Save size={16} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};
