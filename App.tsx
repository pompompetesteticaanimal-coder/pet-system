
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { db } from './services/db';
import { googleService, DEFAULT_CLIENT_ID } from './services/googleCalendar';
import { Client, Service, Appointment, ViewState, Pet, GoogleUser, CostItem, AppSettings } from './types';
import { 
  Plus, Trash2, Check, X, 
  Sparkles, DollarSign, Calendar as CalendarIcon, MapPin,
  ExternalLink, Settings, PawPrint, LogIn, ShieldAlert, Lock, Copy,
  ChevronDown, ChevronRight, Search, AlertTriangle, ChevronLeft, Phone, Clock, FileText,
  Edit2, MoreVertical, Wallet, Filter, CreditCard, AlertCircle, CheckCircle, Loader2,
  Scissors, TrendingUp, AlertOctagon, BarChart2, TrendingDown, Calendar, PieChart as PieChartIcon,
  ShoppingBag, Tag, User, Key, Unlock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  LineChart, Line, CartesianGrid, Legend, ComposedChart, LabelList, PieChart, Pie
} from 'recharts';

// --- CONSTANTS ---
const PREDEFINED_SHEET_ID = '1qbb0RoKxFfrdyTCyHd5rJRbLNBPcOEk4Y_ctyy-ujLw';
const PREDEFINED_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfnUDOsMjn6iho8msiRw9ulfIEghwB1kEU_mrzz4PcSW97V-A/viewform';

const THEMES = [
    { name: 'Rose (PomPomPet)', colors: { 50:'#fff1f2', 100:'#ffe4e6', 200:'#fecdd3', 300:'#fda4af', 400:'#fb7185', 500:'#f43f5e', 600:'#e11d48', 700:'#be123c', 800:'#9f1239', 900:'#881337' } },
    { name: 'Ocean Blue', colors: { 50:'#f0f9ff', 100:'#e0f2fe', 200:'#bae6fd', 300:'#7dd3fc', 400:'#38bdf8', 500:'#0ea5e9', 600:'#0284c7', 700:'#0369a1', 800:'#075985', 900:'#0c4a6e' } },
    { name: 'Forest Green', colors: { 50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 300:'#86efac', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 700:'#15803d', 800:'#166534', 900:'#14532d' } },
    { name: 'Royal Purple', colors: { 50:'#faf5ff', 100:'#f3e8ff', 200:'#e9d5ff', 300:'#d8b4fe', 400:'#c084fc', 500:'#a855f7', 600:'#9333ea', 700:'#7e22ce', 800:'#6b21a8', 900:'#581c87' } },
    { name: 'Slate Dark', colors: { 50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1', 400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155', 800:'#1e293b', 900:'#0f172a' } },
];

// 1. Setup Screen
const SetupScreen: React.FC<{ onSave: (id: string) => void }> = ({ onSave }) => {
    const [clientId, setClientId] = useState(DEFAULT_CLIENT_ID);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 text-center">
                <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">P</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Configuração Inicial</h1>
                <p className="text-gray-500 mb-6">ID do Cliente Google (OAuth 2.0)</p>

                <div className="text-left mb-6">
                    <input 
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="Ex: 1234...apps.googleusercontent.com"
                        className="w-full border p-3 rounded-lg focus:ring-2 ring-brand-500 outline-none font-mono text-sm"
                    />
                </div>

                <button 
                    onClick={() => {
                        if(clientId.trim().length > 10) onSave(clientId);
                        else alert("ID inválido");
                    }}
                    className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition"
                >
                    Salvar e Continuar
                </button>
            </div>
        </div>
    );
};

// 2. Login Screen
const LoginScreen: React.FC<{ onLogin: () => void; onReset: () => void; logoUrl?: string; appName?: string }> = ({ onLogin, onReset, logoUrl, appName }) => {
    const currentOrigin = window.location.origin;
    
    return (
        <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="w-full flex justify-center mb-6">
                     <img src={logoUrl || "/logo.png"} alt="Logo" className="w-48 h-auto object-contain" onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Logo';
                    }}/>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{appName || "PomPomPet"}</h1>
                <p className="text-gray-500 mb-8">Faça login para acessar sua agenda e clientes.</p>

                <button 
                    onClick={onLogin}
                    className="w-full bg-white border-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50 text-gray-700 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all group mb-6"
                >
                    <div className="bg-white p-1 rounded-full"><LogIn className="text-brand-600 group-hover:scale-110 transition-transform" /></div>
                    Entrar com Google
                </button>
                
                <button onClick={onReset} className="mt-8 text-xs text-gray-400 hover:text-red-500 underline">
                    Alterar ID do Cliente
                </button>
            </div>
        </div>
    );
};

// 3. Pin Guard Component
const PinGuard: React.FC<{
    isUnlocked: boolean;
    onUnlock: (pin: string) => boolean;
    onSetPin: (pin: string) => void;
    hasPin: boolean;
    onReset: () => void;
}> = ({ isUnlocked, onUnlock, onSetPin, hasPin, onReset }) => {
    const [inputPin, setInputPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [mode, setMode] = useState<'enter' | 'create' | 'confirm'>(hasPin ? 'enter' : 'create');
    const [error, setError] = useState('');

    const handleDigit = (d: string) => {
        if (inputPin.length < 4) {
            const newVal = inputPin + d;
            setInputPin(newVal);
            if (newVal.length === 4) {
                setTimeout(() => processPin(newVal), 200);
            }
        }
    };

    const processPin = (val: string) => {
        setError('');
        if (mode === 'enter') {
            if (onUnlock(val)) {
                setInputPin('');
            } else {
                setError('Senha incorreta');
                setInputPin('');
            }
        } else if (mode === 'create') {
            setConfirmPin(val);
            setMode('confirm');
            setInputPin('');
        } else if (mode === 'confirm') {
            if (val === confirmPin) {
                onSetPin(val);
                setInputPin('');
                alert('Senha criada com sucesso!');
            } else {
                setError('Senhas não conferem. Tente novamente.');
                setMode('create');
                setInputPin('');
            }
        }
    };

    if (isUnlocked) return null;

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
                    {mode === 'enter' ? <Lock size={32} /> : <Key size={32} />}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {mode === 'enter' ? 'Área Protegida' : mode === 'create' ? 'Crie uma Senha' : 'Confirme a Senha'}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    {mode === 'enter' ? 'Digite sua senha de 4 dígitos para acessar.' : 'Defina um PIN para proteger os dados financeiros.'}
                </p>

                <div className="flex justify-center gap-4 mb-6">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < inputPin.length ? 'bg-brand-600 border-brand-600' : 'border-gray-300'}`} />
                    ))}
                </div>

                {error && <p className="text-red-500 text-xs font-bold mb-4 animate-shake">{error}</p>}

                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <button key={n} onClick={() => handleDigit(n.toString())} className="h-16 rounded-xl bg-gray-50 hover:bg-brand-50 text-xl font-bold text-gray-700 hover:text-brand-600 transition shadow-sm border border-gray-100 active:scale-95">{n}</button>
                    ))}
                    <div />
                    <button onClick={() => handleDigit('0')} className="h-16 rounded-xl bg-gray-50 hover:bg-brand-50 text-xl font-bold text-gray-700 hover:text-brand-600 transition shadow-sm border border-gray-100 active:scale-95">0</button>
                    <button onClick={() => setInputPin(prev => prev.slice(0, -1))} className="h-16 rounded-xl bg-gray-50 hover:bg-red-50 text-xl font-bold text-gray-400 hover:text-red-500 transition shadow-sm border border-gray-100 active:scale-95 flex items-center justify-center"><ChevronLeft /></button>
                </div>

                {mode === 'enter' && (
                    <button onClick={onReset} className="text-xs text-gray-400 underline hover:text-brand-600">Esqueci minha senha</button>
                )}
            </div>
        </div>
    );
};

const ScheduleManager: React.FC<{ appointments: Appointment[]; clients: Client[]; services: Service[]; onAdd: (app: Appointment, client: Client, pet: Pet, services: Service[], duration: number) => void; onEdit: (app: Appointment, client: Client, pet: Pet, services: Service[], duration: number) => void; onUpdateStatus: (id: string, status: Appointment['status']) => void; onDelete: (id: string) => void; googleUser: GoogleUser | null; }> = ({ appointments, clients, services, onAdd, onEdit, onUpdateStatus, onDelete }) => {
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [detailsApp, setDetailsApp] = useState<Appointment | null>(null);
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, appId: string} | null>(null);
    const [editingAppId, setEditingAppId] = useState<string | null>(null);

    // Form State
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedPet, setSelectedPet] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [selectedAddServices, setSelectedAddServices] = useState<string[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('09:00');
    const [notes, setNotes] = useState('');
    const [manualDuration, setManualDuration] = useState('0');

    const resetForm = () => {
        setClientSearch(''); setSelectedClient(''); setSelectedPet(''); setSelectedService('');
        setSelectedAddServices([]); setTime('09:00'); setNotes(''); setManualDuration('0');
        setEditingAppId(null); setIsModalOpen(false);
    };

    const handleStartEdit = (app: Appointment) => {
        setEditingAppId(app.id);
        setSelectedClient(app.clientId);
        setSelectedPet(app.petId);
        setSelectedService(app.serviceId);
        setSelectedAddServices(app.additionalServiceIds || []);
        const d = new Date(app.date);
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
        setNotes(app.notes || '');
        setManualDuration(app.durationTotal ? app.durationTotal.toString() : '0');
        setDetailsApp(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!selectedClient || !selectedPet || !selectedService || !date || !time) return;
        const client = clients.find(c => c.id === selectedClient);
        const pet = client?.pets.find(p => p.id === selectedPet);
        const mainSvc = services.find(s => s.id === selectedService);
        const addSvcs = selectedAddServices.map(id => services.find(s => s.id === id)).filter(s => s) as Service[];

        if (client && pet && mainSvc) {
            const newApp: Appointment = {
                id: editingAppId || `local_${Date.now()}`,
                clientId: client.id,
                petId: pet.id,
                serviceId: mainSvc.id,
                additionalServiceIds: selectedAddServices,
                date: `${date}T${time}:00`,
                status: 'agendado',
                notes: notes,
                googleEventId: editingAppId ? appointments.find(a=>a.id===editingAppId)?.googleEventId : undefined
            };

            const duration = parseInt(manualDuration);
            if (editingAppId) {
                onEdit(newApp, client, pet, [mainSvc, ...addSvcs], duration);
            } else {
                onAdd(newApp, client, pet, [mainSvc, ...addSvcs], duration);
            }
            resetForm();
        }
    };

    const handleDeleteFromContext = () => {
        if(contextMenu && confirm('Excluir agendamento?')) {
            onDelete(contextMenu.appId);
        }
        setContextMenu(null);
    }

    const filteredClients = clientSearch.length > 0 
        ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch) || c.pets.some(p => p.name.toLowerCase().includes(clientSearch.toLowerCase()))).slice(0, 5) 
        : [];
    const selectedClientData = clients.find(c => c.id === selectedClient);
    const pets = selectedClientData?.pets || [];
    const selectedPetData = pets.find(p => p.id === selectedPet);

    const getApplicableServices = (category: 'principal' | 'adicional') => {
        if (!selectedPetData) return [];
        return services.filter(s => {
            const matchesCategory = s.category === category;
            const matchesSize = s.targetSize === 'Todos' || !s.targetSize || (selectedPetData.size && s.targetSize.toLowerCase().includes(selectedPetData.size.toLowerCase()));
            const matchesCoat = s.targetCoat === 'Todos' || !s.targetCoat || (selectedPetData.coat && s.targetCoat.toLowerCase().includes(selectedPetData.coat.toLowerCase()));
            return matchesCategory && matchesSize && matchesCoat;
        });
    };

    const navigate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };

    const START_HOUR = 9;
    const END_HOUR = 18;
    const TOTAL_HOURS = END_HOUR - START_HOUR; 
    const PIXELS_PER_MINUTE = 2; 

    const arrangeAppointments = (apps: Appointment[]) => {
        const sorted = [...apps].sort((a, b) => {
            const startA = new Date(a.date).getTime();
            const startB = new Date(b.date).getTime();
            if (startA !== startB) return startA - startB;
            return (b.durationTotal || 60) - (a.durationTotal || 60);
        });

        const columns: Appointment[][] = [];
        
        sorted.forEach(app => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                const lastAppInCol = col[col.length - 1];
                const lastAppEnd = new Date(lastAppInCol.date).getTime() + (lastAppInCol.durationTotal || 60) * 60000;
                const currentAppStart = new Date(app.date).getTime();
                
                if (currentAppStart >= lastAppEnd) {
                    col.push(app);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([app]);
            }
        });

        const result: { app: Appointment, left: number, width: number }[] = [];
        const widthPerCol = 100 / columns.length;
        
        columns.forEach((col, colIndex) => {
            col.forEach(app => {
                result.push({
                    app,
                    left: colIndex * widthPerCol,
                    width: widthPerCol
                });
            });
        });

        return result;
    };

    const AppointmentCard = ({ app, style }: { app: Appointment, style?: React.CSSProperties }) => {
        const client = clients.find(c => c.id === app.clientId);
        const pet = client?.pets.find(p => p.id === app.petId);
        const mainSvc = services.find(srv => srv.id === app.serviceId);
        const addSvcs = app.additionalServiceIds?.map(id => services.find(s => s.id === id)).filter(x=>x) as Service[] || [];
        const allServiceNames = [mainSvc?.name, ...addSvcs.map(s => s.name)].filter(n => n).join(' ').toLowerCase();

        let colorClass = 'bg-sky-100 border-sky-300 text-sky-900';
        if (allServiceNames.includes('tesoura')) colorClass = 'bg-pink-100 border-pink-300 text-pink-900';
        else if (allServiceNames.includes('tosa normal')) colorClass = 'bg-orange-100 border-orange-300 text-orange-900';
        else if (allServiceNames.includes('higi')) colorClass = 'bg-amber-100 border-amber-300 text-amber-900';
        else if (allServiceNames.includes('pacote') && allServiceNames.includes('mensal')) colorClass = 'bg-purple-100 border-purple-300 text-purple-900';
        else if (allServiceNames.includes('pacote') && allServiceNames.includes('quinzenal')) colorClass = 'bg-indigo-100 border-indigo-300 text-indigo-900';

        const d = new Date(app.date);
        const endTime = new Date(d.getTime() + (app.durationTotal || 60) * 60000);
        const timeRange = `${d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;

        return (
            <div 
                className={`absolute rounded-md p-1 border shadow-sm ${colorClass} text-xs overflow-hidden cursor-pointer hover:brightness-95 hover:z-50 transition-all flex flex-col`}
                style={style}
                onClick={(e) => { e.stopPropagation(); setDetailsApp(app); }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, appId: app.id }); }}
            >
                <div className="font-bold flex justify-between items-center">
                    <span className="truncate">{pet?.name}</span>
                    <span className="text-[9px] opacity-80">{timeRange}</span>
                </div>
                <div className="truncate opacity-90 text-[10px]">{client?.name}</div>
                <div className="flex flex-wrap gap-0.5 mt-0.5 overflow-hidden">
                     {mainSvc && <span className="bg-white/50 px-1 rounded-[2px] text-[8px] whitespace-nowrap">{mainSvc.name}</span>}
                     {addSvcs.map((s,i) => <span key={i} className="bg-white/50 px-1 rounded-[2px] text-[8px] whitespace-nowrap">{s.name}</span>)}
                </div>
            </div>
        );
    };

    const renderDayColumn = (dayDate: Date) => {
        const dateStr = dayDate.toISOString().split('T')[0];
        const dayApps = appointments.filter(a => a.date.startsWith(dateStr) && a.status !== 'cancelado');
        const positionedApps = arrangeAppointments(dayApps);

        return (
            <div className="relative h-full border-r border-gray-100" style={{ height: TOTAL_HOURS * 60 * PIXELS_PER_MINUTE }}>
                {Array.from({length: TOTAL_HOURS}).map((_, h) => (
                    <div key={h} className="absolute w-full border-b border-gray-100" style={{ top: h * 60 * PIXELS_PER_MINUTE, height: 60 * PIXELS_PER_MINUTE }}>
                        <div className="border-b border-gray-50 h-1/6 w-full"></div>
                        <div className="border-b border-gray-50 h-1/6 w-full"></div>
                        <div className="border-b border-gray-50 h-1/6 w-full"></div>
                        <div className="border-b border-gray-50 h-1/6 w-full"></div>
                        <div className="border-b border-gray-50 h-1/6 w-full"></div>
                    </div>
                ))}
                
                {positionedApps.map(({ app, left, width }) => {
                    const start = new Date(app.date);
                    const startMins = start.getHours() * 60 + start.getMinutes();
                    const dayStartMins = START_HOUR * 60;
                    const top = (startMins - dayStartMins) * PIXELS_PER_MINUTE;
                    const height = (app.durationTotal || 60) * PIXELS_PER_MINUTE;
                    
                    if (top < 0) return null; 

                    return (
                        <AppointmentCard 
                            key={app.id} 
                            app={app} 
                            style={{ 
                                top: `${top}px`, 
                                height: `${height}px`, 
                                left: `${left}%`, 
                                width: `${width}%` 
                            }} 
                        />
                    );
                })}
            </div>
        );
    };

    const renderCalendar = () => {
        if (viewMode === 'month') {
             const start = new Date(currentDate); start.setHours(0,0,0,0);
             const year = start.getFullYear(); const month = start.getMonth(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const days = []; for(let i=0; i<new Date(year, month, 1).getDay(); i++) days.push(null); for(let i=1; i<=daysInMonth; i++) days.push(new Date(year, month, i));
             return ( <div className="grid grid-cols-7 gap-px h-full auto-rows-fr bg-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-inner"> {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="bg-gray-50 text-center py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{d}</div>)} {days.map((d, idx) => { if (!d) return <div key={`pad-${idx}`} className="bg-white min-h-[50px]" />; const dateStr = d.toISOString().split('T')[0]; const dayApps = appointments.filter(a => a.date.startsWith(dateStr) && a.status !== 'cancelado'); const isToday = dateStr === new Date().toISOString().split('T')[0]; return ( <div key={idx} className={`bg-white p-0.5 min-h-[60px] flex flex-col border border-gray-50 ${isToday ? 'bg-blue-50/50' : ''}`}> <div className={`text-[10px] font-bold mb-0.5 text-center w-5 h-5 mx-auto rounded-full flex items-center justify-center ${isToday ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500'}`}>{d.getDate()}</div> <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar p-0.5">{dayApps.map(app => <div key={app.id} className="text-[9px] bg-brand-50 text-brand-700 px-1 rounded truncate cursor-pointer" onClick={(e) => { e.stopPropagation(); setDetailsApp(app); }}>{clients.find(c=>c.id===app.clientId)?.pets.find(p=>p.id===app.petId)?.name}</div>)}</div> </div> ) })} </div> )
        }

        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const daysToShow = viewMode === 'week' ? [2, 3, 4, 5, 6] : [currentDate.getDay()]; // Ter-Sab or Today

        return (
            <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                 <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20">
                    <div className="w-12 md:w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50"></div>
                    {daysToShow.map(dayIdx => {
                         const d = new Date(startOfWeek);
                         if (viewMode === 'day') d.setDate(currentDate.getDate());
                         else d.setDate(d.getDate() + dayIdx);
                         const isToday = d.toDateString() === new Date().toDateString();
                         return (
                             <div key={dayIdx} className={`flex-1 text-center py-2 border-r border-gray-200 ${isToday ? 'bg-brand-50' : 'bg-gray-50'}`}>
                                 <div className={`text-[10px] font-bold uppercase ${isToday ? 'text-brand-600' : 'text-gray-500'}`}>{d.toLocaleDateString('pt-BR', {weekday: 'short'})}</div>
                                 <div className={`text-sm font-bold w-7 h-7 mx-auto rounded-full flex items-center justify-center mt-1 ${isToday ? 'bg-brand-600 text-white' : 'text-gray-700'}`}>{d.getDate()}</div>
                             </div>
                         )
                    })}
                 </div>
                 
                 <div className="flex-1 overflow-y-auto relative custom-scrollbar" onClick={() => setContextMenu(null)}>
                    <div className="flex relative">
                        <div className="w-12 md:w-16 flex-shrink-0 border-r border-gray-200 bg-white text-[10px] text-gray-400 font-medium text-right sticky left-0 z-10">
                            {Array.from({length: TOTAL_HOURS}).map((_, i) => (
                                <div key={i} className="h-[120px] pr-2 -mt-2">{String(i + START_HOUR).padStart(2,'0')}:00</div>
                            ))}
                        </div>
                        
                        {daysToShow.map(dayIdx => {
                             const d = new Date(startOfWeek);
                             if (viewMode === 'day') d.setDate(currentDate.getDate());
                             else d.setDate(d.getDate() + dayIdx);
                             
                             return (
                                 <div key={dayIdx} className="flex-1 min-w-[120px]">
                                     {renderDayColumn(d)}
                                 </div>
                             )
                        })}
                    </div>
                 </div>
            </div>
        );
    };

    const timeOptions = []; for (let h = 9; h <= 18; h++) { ['00', '10', '20', '30', '40', '50'].forEach(m => { if(h === 18 && m !== '00') return; timeOptions.push(`${String(h).padStart(2, '0')}:${m}`); }); }

    return (
        <div className="space-y-3 animate-fade-in relative h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 flex-shrink-0 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
                        <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'day' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Dia</button>
                        <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Semana</button>
                        <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'month' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Mês</button>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition"><ChevronLeft size={18}/></button>
                        <span className="text-sm font-bold text-gray-800 min-w-[90px] text-center truncate">{viewMode === 'day' && currentDate.toLocaleDateString('pt-BR')} {viewMode === 'week' && `Sem ${currentDate.getDate()}`} {viewMode === 'month' && currentDate.toLocaleDateString('pt-BR', {month:'short', year: 'numeric'})}</span>
                        <button onClick={() => navigate('next')} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition"><ChevronRight size={18}/></button>
                    </div>
                </div>
                <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full md:w-auto bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-brand-200 hover:bg-brand-700 active:scale-95 transition flex items-center justify-center gap-1.5 text-xs"><Plus size={18} /> Novo Agendamento</button>
            </div>

            <div className="flex-1 min-h-0 relative">
                {renderCalendar()}
                
                {contextMenu && (
                    <div className="fixed bg-white shadow-xl border border-gray-200 rounded-xl z-[100] py-1 min-w-[160px] overflow-hidden" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <button onClick={() => handleStartEdit(appointments.find(a => a.id === contextMenu.appId)!)} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-3 text-gray-700 font-medium border-b border-gray-50"><Edit2 size={16}/> Editar</button>
                        <button onClick={handleDeleteFromContext} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm flex items-center gap-3 font-medium"><Trash2 size={16}/> Excluir</button>
                    </div>
                )}
            </div>

            {detailsApp && (() => {
                const client = clients.find(c => c.id === detailsApp.clientId);
                const pet = client?.pets.find(p => p.id === detailsApp.petId);
                const s = services.find(srv => srv.id === detailsApp.serviceId);
                const addSvcs = detailsApp.additionalServiceIds?.map(id => services.find(srv => srv.id === id)).filter(x=>x);
                return (
                    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDetailsApp(null)}>
                        <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setDetailsApp(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><X size={20}/></button>
                            <div className="mb-6 text-center">
                                <h3 className="text-2xl font-bold text-gray-800">{pet?.name}</h3>
                                <p className="text-gray-500 font-medium">{client?.name}</p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm mb-6">
                                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Phone size={16}/></div><span className="font-medium text-gray-700">{client?.phone}</span></div>
                                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><MapPin size={16}/></div><span className="font-medium text-gray-700 truncate">{client?.address} {client?.complement}</span></div>
                                <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0"><FileText size={16}/></div><span className="font-medium italic text-gray-600 pt-1">{detailsApp.notes || pet?.notes || 'Sem obs'}</span></div>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Serviços</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg text-xs font-bold shadow-sm">{s?.name}</span>
                                    {addSvcs?.map(as => <span key={as?.id} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">{as?.name}</span>)}
                                </div>
                            </div>
                            <button onClick={() => handleStartEdit(detailsApp)} className="w-full py-3.5 bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-700 active:scale-95 transition shadow-lg shadow-brand-200"><Edit2 size={18}/> Editar Agendamento</button>
                        </div>
                    </div>
                )
            })()}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] md:min-h-[600px] animate-scale-up">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">{editingAppId ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                            <button onClick={resetForm}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente / Pet</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input value={selectedClientData ? selectedClientData.name : clientSearch} onChange={(e) => { setClientSearch(e.target.value); setSelectedClient(''); setSelectedPet(''); }} placeholder="Buscar..." className="w-full pl-9 pr-8 py-3 border rounded-xl outline-none focus:ring-2 ring-brand-200 text-base" />
                                    {selectedClientData && <button onClick={() => { setClientSearch(''); setSelectedClient(''); }} className="absolute right-2 top-3 text-gray-400"><X size={16}/></button>}
                                </div>
                                {clientSearch.length > 0 && !selectedClient && filteredClients.length > 0 && (
                                    <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                                        {filteredClients.map(c => (
                                            <button key={c.id} onClick={() => { setSelectedClient(c.id); setClientSearch(''); }} className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 flex justify-between items-center">
                                                <div className="text-base font-bold text-gray-800">{c.name} <span className="text-xs font-normal text-gray-500">({c.pets.map(p=>p.name).join(', ')})</span></div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {selectedClient && (
                                <div className="grid grid-cols-2 gap-2">
                                    {pets.map(p => (
                                        <button key={p.id} onClick={() => { setSelectedPet(p.id); setSelectedService(''); }} className={`p-3 rounded-xl border text-left text-sm transition-all ${selectedPet === p.id ? 'bg-brand-50 border-brand-500 shadow-sm ring-1 ring-brand-200' : 'hover:bg-gray-50'}`}>
                                            <div className="font-bold">{p.name}</div><div className="text-gray-500 text-xs">{p.size}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedPet && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Serviço Principal</label>
                                        <select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-base outline-none focus:border-brand-500"><option value="">Selecione...</option>{getApplicableServices('principal').map(s => <option key={s.id} value={s.id}>{s.name} - R${s.price}</option>)}</select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Serviço Adicional</label>
                                        <select className="w-full border p-3 rounded-xl bg-white text-base outline-none focus:border-brand-500" onChange={(e) => { const val = e.target.value; if(val && !selectedAddServices.includes(val)) setSelectedAddServices(prev => [...prev, val]); e.target.value = ''; }} >
                                            <option value="">Adicionar serviço...</option>
                                            {getApplicableServices('adicional').filter((service, index, self) => index === self.findIndex((t) => t.name === service.name)).map(s => <option key={s.id} value={s.id}>{s.name} - R${s.price}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap gap-2 min-h-[30px]">{selectedAddServices.map(id => <span key={id} onClick={() => setSelectedAddServices(p => p.filter(x => x !== id))} className="bg-purple-50 border border-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-purple-100 flex items-center gap-1">{services.find(s=>s.id===id)?.name} <X size={12}/></span>)}</div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-3 rounded-xl text-base outline-none" />
                                        <select value={time} onChange={e => setTime(e.target.value)} className="border p-3 rounded-xl text-base outline-none">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Duração Estimada</label>
                                        <select value={manualDuration} onChange={e => setManualDuration(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-base outline-none focus:border-brand-500">
                                            <option value="0">Automático (pelo serviço)</option>
                                            <option value="30">30 minutos</option>
                                            <option value="60">1 hora</option>
                                            <option value="90">1 hora e 30 min</option>
                                            <option value="120">2 horas</option>
                                            <option value="150">2 horas e 30 min</option>
                                            <option value="180">3 horas</option>
                                            <option value="240">4 horas</option>
                                        </select>
                                    </div>
                                    
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border p-3 rounded-xl text-sm outline-none focus:border-gray-400" rows={3} placeholder="Observações..." />
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={resetForm} className="px-5 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl text-sm transition">Cancelar</button>
                            <button onClick={handleSave} disabled={!selectedClient || !selectedPet || !selectedService} className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 text-sm shadow-lg shadow-brand-200 active:scale-95 transition">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RevenueView: React.FC<{ appointments: Appointment[]; services: Service[]; }> = () => (
    <div className="flex items-center justify-center h-full text-gray-500">Faturamento - Em desenvolvimento</div>
);

const CostsView: React.FC<{}> = () => (
    <div className="flex items-center justify-center h-full text-gray-500">Custos - Em desenvolvimento</div>
);

const PaymentManager: React.FC<{ appointments: Appointment[]; services: Service[]; onUpdateStatus: (id: string, s: Appointment['status']) => void; }> = () => (
    <div className="flex items-center justify-center h-full text-gray-500">Pagamentos - Em desenvolvimento</div>
);

const ClientManager: React.FC<{ clients: Client[]; onAdd: (c: Client) => void; onEdit: (c: Client) => void; onDelete: (id: string) => void; }> = () => (
    <div className="flex items-center justify-center h-full text-gray-500">Clientes - Em desenvolvimento</div>
);

const ServiceManager: React.FC<{ services: Service[]; onAdd: (s: Service) => void; onEdit: (s: Service) => void; onDelete: (id: string) => void; }> = () => (
    <div className="flex items-center justify-center h-full text-gray-500">Serviços - Em desenvolvimento</div>
);

export default function App() {
  const [view, setView] = useState<ViewState>('schedule');
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [clients, setClients] = useState<Client[]>(db.getClients());
  const [services, setServices] = useState<Service[]>(db.getServices());
  const [appointments, setAppointments] = useState<Appointment[]>(db.getAppointments());
  const [clientId, setClientId] = useState(localStorage.getItem('petgestor_client_id'));

  const handleLogin = () => {
     googleService.init((token) => {
        // Logic to get user profile and setGoogleUser
        if(token && token.access_token) {
            googleService.getUserProfile(token.access_token).then(u => {
                if(u) setGoogleUser(u);
            });
        }
     });
     googleService.login();
  };

  if (!clientId) return <SetupScreen onSave={(id) => { localStorage.setItem('petgestor_client_id', id); setClientId(id); }} />;

  return (
    <Layout currentView={view} setView={setView} googleUser={googleUser} onLogin={handleLogin} onLogout={() => setGoogleUser(null)}>
        {view === 'schedule' && (
            <ScheduleManager 
                appointments={appointments} 
                clients={clients} 
                services={services}
                onAdd={(app) => setAppointments(prev => [...prev, app])}
                onEdit={(app) => setAppointments(prev => prev.map(a => a.id === app.id ? app : a))}
                onUpdateStatus={(id, st) => setAppointments(prev => prev.map(a => a.id === id ? {...a, status: st} : a))}
                onDelete={(id) => setAppointments(prev => prev.filter(a => a.id !== id))}
                googleUser={googleUser}
            />
        )}
        {view === 'revenue' && <RevenueView appointments={appointments} services={services} />}
        {view === 'costs' && <CostsView />}
        {view === 'payments' && <PaymentManager appointments={appointments} services={services} onUpdateStatus={() => {}} />}
        {view === 'clients' && <ClientManager clients={clients} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />}
        {view === 'services' && <ServiceManager services={services} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />}
    </Layout>
  );
}
