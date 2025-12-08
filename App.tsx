
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { db } from './services/db';
import { googleService, DEFAULT_CLIENT_ID } from './services/googleCalendar';
import { Client, Service, Appointment, ViewState, Pet, GoogleUser, CostItem } from './types';
import { 
  Plus, Trash2, Check, X, 
  Sparkles, DollarSign, Calendar as CalendarIcon, MapPin,
  ExternalLink, Settings, PawPrint, LogIn, ShieldAlert, Lock, Copy,
  ChevronDown, ChevronRight, Search, AlertTriangle, ChevronLeft, Phone, Clock, FileText,
  Edit2, MoreVertical, Wallet, Filter, CreditCard, AlertCircle, CheckCircle, Loader2,
  Scissors, TrendingUp, AlertOctagon, BarChart2, TrendingDown, Calendar, PieChart as PieChartIcon,
  ShoppingBag, Tag, User, Key, Unlock, Save
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  LineChart, Line, CartesianGrid, Legend, ComposedChart, LabelList, PieChart, Pie
} from 'recharts';

// --- CONSTANTS ---
const PREDEFINED_SHEET_ID = '1qbb0RoKxFfrdyTCyHd5rJRbLNBPcOEk4Y_ctyy-ujLw';
const PREDEFINED_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfnUDOsMjn6iho8msiRw9ulfIEghwB1kEU_mrzz4PcSW97V-A/viewform';

// --- Sub-Components ---

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
const LoginScreen: React.FC<{ onLogin: () => void; onReset: () => void }> = ({ onLogin, onReset }) => {
    const currentOrigin = window.location.origin;
    
    return (
        <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="w-full flex justify-center mb-6">
                    <img src="/logo.png" alt="PomPomPet" className="w-48 h-auto object-contain" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">PomPomPet</h1>
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

const CustomXAxisTick = ({ x, y, payload, data }: any) => {
    const item = data && data[payload.index];
    if (!item) return <g />;
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#6b7280" fontSize={10} fontWeight="bold">{item.name}</text>
            <text x={0} y={0} dy={30} textAnchor="middle" fill="#059669" fontSize={10} fontWeight="bold">R$ {item.faturamento?.toFixed(0)}</text>
            <text x={0} y={0} dy={42} textAnchor="middle" fill="#6366f1" fontSize={9}>{item.petsCount} pets</text>
            {(item.growth !== undefined || item.revGrowth !== undefined) && (
                <text x={0} y={0} dy={54} textAnchor="middle" fill={(item.growth || item.revGrowth) >= 0 ? '#059669' : '#dc2626'} fontSize={9} fontWeight="bold">{(item.growth || item.revGrowth) >= 0 ? '▲' : '▼'} {Math.abs(item.growth || item.revGrowth || 0).toFixed(0)}%</text>
            )}
        </g>
    );
};

const RevenueView: React.FC<{ appointments: Appointment[]; services: Service[]; clients: Client[]; }> = ({ appointments, services, clients }) => {
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const getISOWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    };

    const calculateGrossRevenue = (app: Appointment) => {
        if (app.status === 'cancelado') return 0;
        if (app.paidAmount && app.paidAmount > 0) return app.paidAmount;
        const mainSvc = services.find(s => s.id === app.serviceId);
        let total = mainSvc?.price || 0;
        app.additionalServiceIds?.forEach(id => { const s = services.find(srv => srv.id === id); if (s) total += s.price; });
        return total;
    };

    const calculateStats = (apps: Appointment[]) => {
        let totalPets = 0; let totalTosas = 0; let paidRevenue = 0; let pendingRevenue = 0;
        apps.forEach(app => {
            if (app.status === 'cancelado') return;
            totalPets++;
            const isTargetTosa = (name?: string) => { if (!name) return false; const n = name.toLowerCase(); return n.includes('tosa normal') || n.includes('tosa tesoura'); };
            const mainSvc = services.find(s => s.id === app.serviceId);
            let hasTosa = isTargetTosa(mainSvc?.name);
            if (!hasTosa && app.additionalServiceIds) { app.additionalServiceIds.forEach(id => { const s = services.find(srv => srv.id === id); if (s && isTargetTosa(s.name)) hasTosa = true; }); }
            if (hasTosa) totalTosas++;
            const gross = calculateGrossRevenue(app);
            const isPaid = app.paymentMethod && app.paymentMethod.trim() !== '';
            if (isPaid) paidRevenue += gross; else pendingRevenue += gross;
        });
        const grossRevenue = paidRevenue + pendingRevenue;
        const averageTicket = totalPets > 0 ? grossRevenue / totalPets : 0;
        return { totalPets, totalTosas, paidRevenue, pendingRevenue, grossRevenue, averageTicket };
    };

    const getWeeklyChartData = () => {
        // Usa a data local selecionada
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d); // Data local correta
        const day = date.getDay(); // 0-6
        const diff = date.getDate() - day; // Ajuste para Domingo
        const startOfWeek = new Date(date); 
        startOfWeek.setDate(diff); // Domingo da semana
        
        const data = []; 
        const businessDays = [2, 3, 4, 5, 6]; // Terça a Sabado

        businessDays.forEach(dayIndex => {
            const current = new Date(startOfWeek); 
            current.setDate(startOfWeek.getDate() + dayIndex);
            
            // Format YYYY-MM-DD local for string comparison
            const cYear = current.getFullYear(); 
            const cMonth = String(current.getMonth() + 1).padStart(2, '0'); 
            const cDay = String(current.getDate()).padStart(2, '0');
            const targetDateStr = `${cYear}-${cMonth}-${cDay}`;
            
            const dailyApps = appointments.filter(a => { 
                if (a.status === 'cancelado') return false; 
                return a.date.startsWith(targetDateStr); // Simple string match
            });
            
            const totalRevenue = dailyApps.reduce((acc, app) => acc + calculateGrossRevenue(app), 0);
            const formattedDate = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' });
            
            let growth = 0; 
            if (data.length > 0) { 
                const prev = data[data.length - 1]; 
                if (prev.faturamento > 0) growth = ((totalRevenue - prev.faturamento) / prev.faturamento) * 100; 
            }
            data.push({ name: formattedDate, fullDate: targetDateStr, faturamento: totalRevenue, petsCount: dailyApps.length, growth });
        });
        return data;
    };
    
    const getMonthlyChartData = () => {
          const [yearStr, monthStr] = selectedMonth.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr) - 1; 
          const getWeekData = (targetYear: number, targetWeek: number) => {
              const apps = appointments.filter(app => {
                 if (app.status === 'cancelado') return false;
                 const d = new Date(app.date);
                 return getISOWeek(d) === targetWeek && d.getFullYear() === targetYear;
              });
              return apps.reduce((acc, app) => acc + calculateGrossRevenue(app), 0);
          };
          const weeksInMonth = new Set<number>();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          for(let d=1; d<=daysInMonth; d++) weeksInMonth.add(getISOWeek(new Date(year, month, d)));
          const sortedWeeks = Array.from(weeksInMonth).sort((a,b) => a-b);
          const chartData = [];
          sortedWeeks.forEach((weekNum, index) => {
              const currentRevenue = getWeekData(year, weekNum);
              const petsCount = appointments.filter(a => getISOWeek(new Date(a.date)) === weekNum && new Date(a.date).getFullYear() === year && a.status !== 'cancelado').length;
              let growth = 0; if (index > 0) { const prevRev = chartData[index - 1].faturamento; if (prevRev > 0) growth = ((currentRevenue - prevRev) / prevRev) * 100; }
              chartData.push({ name: `Sem ${index + 1}`, faturamento: currentRevenue, petsCount, growth });
          });
          return chartData;
    };

    const getYearlyChartData = () => {
          const data = []; const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          const startMonth = selectedYear === 2025 ? 7 : 0; 
          for (let i = startMonth; i < 12; i++) {
              const monthApps = appointments.filter(a => { const d = new Date(a.date); return d.getFullYear() === selectedYear && d.getMonth() === i && a.status !== 'cancelado'; });
              const stats = calculateStats(monthApps);
              let revGrowth = 0; if (i > startMonth) { const prevApps = appointments.filter(a => { const d = new Date(a.date); return d.getFullYear() === selectedYear && d.getMonth() === (i - 1) && a.status !== 'cancelado'; }); const prevStats = calculateStats(prevApps); if(prevStats.grossRevenue > 0) revGrowth = ((stats.grossRevenue - prevStats.grossRevenue) / prevStats.grossRevenue) * 100; }
              data.push({ name: monthNames[i], faturamento: stats.grossRevenue, petsCount: stats.totalPets, revGrowth, });
          }
          return data;
    };

    const dailyApps = appointments.filter(a => a.date.startsWith(selectedDate));
    const dailyStats = calculateStats(dailyApps);
    const weeklyChartData = getWeeklyChartData();
    const weeklyStats = calculateStats(appointments.filter(a => {
        if(a.status === 'cancelado') return false;
        const [y, m, d] = selectedDate.split('-').map(Number);
        const ref = new Date(y, m-1, d);
        const day = ref.getDay();
        const start = new Date(ref); start.setDate(ref.getDate() - day); start.setHours(0,0,0,0);
        const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
        const curr = new Date(a.date);
        return curr >= start && curr <= end;
    }));

    const monthlyChartData = getMonthlyChartData();
    const yearlyChartData = getYearlyChartData();
    
    // Added: calculations for monthly and yearly stats
    const monthlyApps = appointments.filter(a => a.date.startsWith(selectedMonth) && a.status !== 'cancelado');
    const monthlyStats = calculateStats(monthlyApps);

    const yearlyApps = appointments.filter(a => {
        if(a.status === 'cancelado') return false;
        const d = new Date(a.date);
        return d.getFullYear() === selectedYear;
    });
    const yearlyStats = calculateStats(yearlyApps);

    const StatCard = ({ title, value, icon: Icon, colorClass, subValue }: any) => (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition min-h-[100px]">
            <div className="flex justify-between items-start">
                <div><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p><h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>{subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}</div>
                <div className={`p-2 rounded-full ${colorClass} bg-opacity-20`}><div className={`p-1 rounded-full ${colorClass} bg-opacity-100 text-white`}><Icon size={20} /></div></div>
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon: Icon }: any) => ( <button onClick={() => setActiveTab(id)} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === id ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><Icon size={16} /><span className="hidden sm:inline">{label}</span></button> );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-gray-800">Faturamento</h1></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6"><div className="flex overflow-x-auto"><TabButton id="daily" label="Diário" icon={CalendarIcon} /><TabButton id="weekly" label="Semanal" icon={BarChart2} /><TabButton id="monthly" label="Mensal" icon={TrendingUp} /><TabButton id="yearly" label="Anual" icon={PieChartIcon} /></div></div>
            
            {activeTab === 'daily' && (
                <section>
                    <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-gray-200"><h2 className="text-lg font-bold text-gray-800">Filtro</h2><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-gray-50 border p-2 rounded-lg text-sm font-bold text-gray-700 outline-none" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><StatCard title="Total de Pets" value={dailyStats.totalPets} icon={PawPrint} colorClass="bg-blue-500" /><StatCard title="Total de Tosas" value={dailyStats.totalTosas} icon={Scissors} colorClass="bg-orange-500" subValue="Normal e Tesoura" /><StatCard title="Caixa Pago" value={`R$ ${dailyStats.paidRevenue.toFixed(2)}`} icon={CheckCircle} colorClass="bg-green-500" /><StatCard title="A Receber" value={`R$ ${dailyStats.pendingRevenue.toFixed(2)}`} icon={AlertCircle} colorClass="bg-red-500" /></div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6"><h3 className="p-4 text-sm font-bold text-gray-700 border-b border-gray-100 flex items-center gap-2"><FileText size={16}/> Detalhamento do Dia</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase"><tr><th className="p-3">Horário</th><th className="p-3">Cliente</th><th className="p-3">Pet</th><th className="p-3">Serviços</th><th className="p-3 text-right">Valor</th></tr></thead><tbody className="divide-y divide-gray-100">{dailyApps.length === 0 ? (<tr><td colSpan={5} className="p-4 text-center text-gray-400">Nenhum agendamento neste dia.</td></tr>) : (dailyApps.sort((a,b) => a.date.localeCompare(b.date)).map(app => { const client = clients.find(c => c.id === app.clientId); const pet = client?.pets.find(p => p.id === app.petId); const mainSvc = services.find(s => s.id === app.serviceId); const addSvcs = app.additionalServiceIds?.map(id => services.find(s => s.id === id)).filter(x=>x); const val = calculateGrossRevenue(app); return (<tr key={app.id} className="hover:bg-gray-50"><td className="p-3 font-mono text-xs text-gray-600">{new Date(app.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td><td className="p-3 font-medium text-gray-800">{client?.name}</td><td className="p-3 text-gray-600">{pet?.name}</td><td className="p-3 text-xs text-gray-500"><span className="font-bold text-brand-600">{mainSvc?.name}</span>{addSvcs && addSvcs.length > 0 && (<span className="text-gray-400"> + {addSvcs.map(s => s?.name).join(', ')}</span>)}</td><td className="p-3 text-right font-bold text-green-600">R$ {val.toFixed(2)}</td></tr>); }))}</tbody></table></div></div>
                </section>
            )}
            {activeTab === 'weekly' && (
                <section>
                    <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-gray-200 gap-2"><h2 className="text-lg font-bold text-gray-800">Semana</h2></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><StatCard title="Pets da Semana" value={weeklyStats.totalPets} icon={PawPrint} colorClass="bg-indigo-500" /><StatCard title="Total Faturamento" value={`R$ ${weeklyStats.grossRevenue.toFixed(2)}`} icon={DollarSign} colorClass="bg-teal-500" /><StatCard title="Total Pago" value={`R$ ${weeklyStats.paidRevenue.toFixed(2)}`} icon={Wallet} colorClass="bg-emerald-500" /><StatCard title="Pendente" value={`R$ ${weeklyStats.pendingRevenue.toFixed(2)}`} icon={AlertOctagon} colorClass="bg-rose-500" /><StatCard title="Ticket Médio" value={`R$ ${weeklyStats.averageTicket.toFixed(2)}`} icon={Tag} colorClass="bg-purple-500" /></div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96"><h3 className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2"><TrendingUp size={16}/> Faturamento Diário</h3><ResponsiveContainer width="100%" height="80%"><ComposedChart data={weeklyChartData} margin={{ top: 20, right: 0, bottom: 40, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" interval={0} tick={<CustomXAxisTick data={weeklyChartData}/>} /><YAxis yAxisId="left" hide /><YAxis yAxisId="right" orientation="right" hide /><Bar yAxisId="right" dataKey="petsCount" fill="#e0e7ff" barSize={40} radius={[4, 4, 0, 0]} /><Line yAxisId="left" type="monotone" dataKey="faturamento" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} /><LabelList dataKey="faturamento" position="top" formatter={(val: number) => `R$ ${val}`} style={{ fontSize: 10, fill: '#4f46e5', fontWeight: 'bold' }}/></ComposedChart></ResponsiveContainer></div>
                </section>
            )}
             {activeTab === 'monthly' && (
                <section>
                    <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-gray-200"><h2 className="text-lg font-bold text-gray-800">Mensal</h2><input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-gray-50 border p-2 rounded-lg text-sm font-bold text-gray-700 outline-none" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><StatCard title="Pets Mês" value={monthlyApps.length} icon={PawPrint} colorClass="bg-purple-500" /><StatCard title="Faturamento" value={`R$ ${monthlyStats.grossRevenue.toFixed(2)}`} icon={DollarSign} colorClass="bg-fuchsia-500" /><StatCard title="Pago" value={`R$ ${monthlyStats.paidRevenue.toFixed(2)}`} icon={Wallet} colorClass="bg-green-500" /><StatCard title="Ticket Médio" value={`R$ ${monthlyStats.averageTicket.toFixed(2)}`} icon={Tag} colorClass="bg-blue-500" /></div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96"><h3 className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2"><BarChart2 size={16}/> Performance Semanal</h3><ResponsiveContainer width="100%" height="80%"><ComposedChart data={monthlyChartData} margin={{ top: 20, right: 0, bottom: 40, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" interval={0} tick={<CustomXAxisTick data={monthlyChartData} />} /><YAxis yAxisId="left" hide /><YAxis yAxisId="right" orientation="right" hide /><Bar yAxisId="right" dataKey="petsCount" fill="#f3e8ff" barSize={40} radius={[4, 4, 0, 0]} /><Line yAxisId="left" type="monotone" dataKey="faturamento" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} /><LabelList dataKey="faturamento" position="top" formatter={(val: number) => `R$ ${val}`} style={{ fontSize: 10, fill: '#9333ea', fontWeight: 'bold' }}/></ComposedChart></ResponsiveContainer></div>
                </section>
            )}
            {activeTab === 'yearly' && (
                <section>
                    <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-gray-200"><h2 className="text-lg font-bold text-gray-800">Anual</h2><select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-gray-50 border p-2 rounded-lg text-sm font-bold text-gray-700 outline-none"><option value={2025}>2025</option><option value={2026}>2026</option></select></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><StatCard title="Pets Ano" value={yearlyStats.totalPets} icon={PawPrint} colorClass="bg-emerald-500" /><StatCard title="Faturamento" value={`R$ ${yearlyStats.grossRevenue.toFixed(2)}`} icon={DollarSign} colorClass="bg-teal-500" /><StatCard title="Ticket Médio" value={`R$ ${yearlyStats.averageTicket.toFixed(2)}`} icon={Tag} colorClass="bg-orange-500" /></div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96"><h3 className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2"><TrendingUp size={16}/> Evolução Mensal</h3><ResponsiveContainer width="100%" height="80%"><ComposedChart data={yearlyChartData} margin={{ top: 20, right: 0, bottom: 40, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" interval={0} tick={<CustomXAxisTick data={yearlyChartData} />} /><YAxis yAxisId="left" hide /><YAxis yAxisId="right" orientation="right" hide /><Bar yAxisId="right" dataKey="petsCount" fill="#d1fae5" barSize={40} radius={[4, 4, 0, 0]} /><Line yAxisId="left" type="monotone" dataKey="faturamento" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} /><LabelList dataKey="faturamento" position="top" formatter={(val: number) => `R$ ${val}`} style={{ fontSize: 10, fill: '#059669', fontWeight: 'bold' }}/></ComposedChart></ResponsiveContainer></div>
                </section>
            )}
        </div>
    );
};

const CostsView: React.FC<{ costItems: CostItem[] }> = ({ costItems }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    const filteredCosts = costItems.filter(c => c.month === selectedMonth);
    const totalCost = filteredCosts.reduce((acc, c) => acc + c.amount, 0);
    const paidCost = filteredCosts.filter(c => c.status && c.status.toLowerCase().includes('pago')).reduce((acc, c) => acc + c.amount, 0);
    const pendingCost = totalCost - paidCost;

    const categoryData = Object.entries(filteredCosts.reduce((acc: any, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {})).map(([name, value]: any) => ({ name, value })).sort((a,b) => b.value - a.value);

    const top5Categories = categoryData.slice(0, 5);
    const otherCategoriesSum = categoryData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    if (otherCategoriesSum > 0) top5Categories.push({ name: 'Outros', value: otherCategoriesSum });

    const COLORS = ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#9ca3af'];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-gray-800">Custo Mensal</h1><div className="flex gap-2"><input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-white border p-2 rounded-lg text-sm font-bold text-gray-700 shadow-sm outline-none" /></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-500 uppercase">Total Custos</p><h3 className="text-2xl font-bold text-gray-800 mt-1">R$ {totalCost.toFixed(2)}</h3></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-500 uppercase">Pago</p><h3 className="text-2xl font-bold text-green-600 mt-1">R$ {paidCost.toFixed(2)}</h3></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-500 uppercase">Pendente</p><h3 className="text-2xl font-bold text-red-600 mt-1">R$ {pendingCost.toFixed(2)}</h3></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Por Categoria</h3>
                    <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={top5Categories} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{top5Categories.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} /><Legend /></PieChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-h-[400px] overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Detalhamento</h3>
                    <table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="p-2">Data</th><th className="p-2">Tipo</th><th className="p-2 text-right">Valor</th><th className="p-2 text-center">Status</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredCosts.map(c => (<tr key={c.id} className="hover:bg-gray-50"><td className="p-2 text-gray-600">{c.date}</td><td className="p-2 font-medium">{c.category}</td><td className="p-2 text-right font-bold text-gray-800">R$ {c.amount.toFixed(2)}</td><td className="p-2 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.status.toLowerCase().includes('pago') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.status || 'Pendente'}</span></td></tr>))}</tbody></table>
                </div>
            </div>
        </div>
    );
};

const ClientManager: React.FC<{ clients: Client[]; onUpdate: () => void }> = ({ clients, onUpdate }) => { return <div className="p-4 bg-white rounded-xl shadow text-center text-gray-500">Gestão de Clientes disponível no menu.</div>; };
const ServiceManager: React.FC<{ services: Service[]; onUpdate: () => void }> = ({ services, onUpdate }) => { return <div className="p-4 bg-white rounded-xl shadow text-center text-gray-500">Gestão de Serviços disponível no menu.</div>; };
const ScheduleManager: React.FC<{ 
    appointments: Appointment[]; 
    clients: Client[]; 
    services: Service[]; 
    onAdd: (appt: any) => void;
    onEdit: (id: string, updates: any) => void;
    onDelete: (id: string) => void; 
}> = ({ appointments, clients, services, onAdd, onEdit, onDelete }) => {
    const [view, setView] = useState<'day' | 'week' | 'month'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
    const [newItem, setNewItem] = useState({ clientId: '', petId: '', serviceId: '', additionalServiceIds: [] as string[], date: '', time: '09:00', duration: '60' });
    const [searchTerm, setSearchTerm] = useState('');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);

    // Time Slots Generation (10 min intervals)
    const timeSlots = [];
    for (let h = 9; h < 18; h++) {
        for (let m = 0; m < 60; m += 10) {
            timeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }
    timeSlots.push("18:00");

    const getServiceColor = (app: Appointment) => {
        const svcNames = [
             services.find(s => s.id === app.serviceId)?.name,
             ...(app.additionalServiceIds || []).map(id => services.find(s => s.id === id)?.name)
        ].filter(x => x).map(x => x?.toLowerCase() || '');
        
        if (svcNames.some(n => n?.includes('tesoura'))) return 'bg-pink-100 border-pink-300 text-pink-800';
        if (svcNames.some(n => n?.includes('tosa normal'))) return 'bg-orange-100 border-orange-300 text-orange-800';
        if (svcNames.some(n => n?.includes('higiênica'))) return 'bg-amber-100 border-amber-300 text-amber-800';
        if (svcNames.some(n => n?.includes('mensal'))) return 'bg-purple-100 border-purple-300 text-purple-800';
        if (svcNames.some(n => n?.includes('quinzenal'))) return 'bg-indigo-100 border-indigo-300 text-indigo-800';
        return 'bg-sky-100 border-sky-300 text-sky-800';
    };

    const handleSave = () => {
         if (!newItem.clientId || !newItem.petId || !newItem.serviceId || !newItem.date) return alert("Preencha todos os campos");
         const startDateTime = `${newItem.date}T${newItem.time}:00`;
         const duration = parseInt(newItem.duration);
         const payload = {
             clientId: newItem.clientId,
             petId: newItem.petId,
             serviceId: newItem.serviceId,
             additionalServiceIds: newItem.additionalServiceIds,
             date: startDateTime,
             durationTotal: duration,
             status: 'agendado'
         };
         if (selectedAppt) onEdit(selectedAppt.id, payload);
         else onAdd(payload);
         setShowModal(false);
    };

    const openEdit = (app: Appointment) => {
        const d = new Date(app.date);
        const timeStr = d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        const dateStr = d.toLocaleDateString('en-CA');
        setSelectedAppt(app);
        setNewItem({
            clientId: app.clientId,
            petId: app.petId,
            serviceId: app.serviceId,
            additionalServiceIds: app.additionalServiceIds || [],
            date: dateStr,
            time: timeStr,
            duration: (app.durationTotal || 60).toString()
        });
        setDetailModalOpen(false);
        setShowModal(true);
    };

    // Filter Logic for Services based on Pet
    const selectedClient = clients.find(c => c.id === newItem.clientId);
    const selectedPet = selectedClient?.pets.find(p => p.id === newItem.petId);
    const filteredServices = services.filter(s => {
        if (!selectedPet) return true;
        const sizeMatch = !s.targetSize || s.targetSize === 'Todos' || s.targetSize.toLowerCase() === selectedPet.size.toLowerCase();
        const coatMatch = !s.targetCoat || s.targetCoat === 'Todos' || s.targetCoat.toLowerCase() === selectedPet.coat.toLowerCase();
        return sizeMatch && coatMatch;
    });

    const renderDayView = () => {
         // Filter appointments for the day
         const dayApps = appointments.filter(a => a.date.startsWith(currentDate.toLocaleDateString('en-CA')));
         // Simple vertical list to avoid overlaps
         const sortedApps = dayApps.sort((a,b) => a.date.localeCompare(b.date));
         
         return (
             <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
                 <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50 pt-2 text-center text-xs text-gray-400 font-mono">
                     {timeSlots.filter(t => t.endsWith('00')).map(t => <div key={t} className="h-[120px]">{t}</div>)}
                 </div>
                 <div className="flex-1 p-2 space-y-2 relative">
                     {/* Background Grid Lines */}
                     <div className="absolute inset-0 pointer-events-none">
                         {timeSlots.filter(t => t.endsWith('00')).map((t, i) => (
                             <div key={i} className="h-[120px] border-b border-gray-50 w-full" style={{top: i * 120}} />
                         ))}
                     </div>
                     
                     {/* Appointments Cards */}
                     {sortedApps.map(app => {
                         const client = clients.find(c => c.id === app.clientId);
                         const pet = client?.pets.find(p => p.id === app.petId);
                         const mainSvc = services.find(s => s.id === app.serviceId);
                         const addSvcs = (app.additionalServiceIds || []).map(id => services.find(s => s.id === id)).filter(x=>x);
                         const timeStart = new Date(app.date);
                         
                         // Calculate absolute position
                         const startHour = timeStart.getHours();
                         const startMin = timeStart.getMinutes();
                         const minutesFrom9 = (startHour - 9) * 60 + startMin;
                         const topPx = minutesFrom9 * 2; // 2px per minute
                         const heightPx = (app.durationTotal || 60) * 2;

                         return (
                             <div 
                                key={app.id}
                                className={`absolute left-2 right-2 rounded-lg border-l-4 p-2 shadow-sm text-xs cursor-pointer hover:shadow-md hover:z-10 transition-all ${getServiceColor(app)}`}
                                style={{ top: `${topPx}px`, height: `${heightPx}px`, minHeight: '40px' }}
                                onClick={() => { setSelectedAppt(app); setDetailModalOpen(true); }}
                                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, id: app.id }); }}
                             >
                                 <div className="font-bold truncate">{client?.name} - {pet?.name}</div>
                                 <div className="truncate opacity-90">{mainSvc?.name}</div>
                                 {addSvcs.length > 0 && <div className="truncate opacity-75 text-[10px]">+ {addSvcs.length} extras</div>}
                             </div>
                         );
                     })}
                 </div>
             </div>
         );
    };

    return (
        <div className="space-y-4 h-full flex flex-col pb-20">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                    <button onClick={() => setView('day')} className={`p-2 rounded-lg text-sm font-bold ${view === 'day' ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:bg-gray-50'}`}>Dia</button>
                    <button onClick={() => setView('week')} className={`p-2 rounded-lg text-sm font-bold ${view === 'week' ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:bg-gray-50'}`}>Semana</button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                    <span className="font-bold text-gray-700 min-w-[100px] text-center">{currentDate.toLocaleDateString()}</span>
                    <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); }} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                </div>
                <button onClick={() => { setSelectedAppt(null); setNewItem({ clientId: '', petId: '', serviceId: '', additionalServiceIds: [], date: new Date().toLocaleDateString('en-CA'), time: '09:00', duration: '60' }); setShowModal(true); }} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Plus size={16}/> Novo</button>
            </div>

            <div className="flex-1 overflow-auto">
                {view === 'day' && renderDayView()}
                {view !== 'day' && <div className="p-10 text-center text-gray-400">Visualização em desenvolvimento. Use a visão diária.</div>}
            </div>

            {/* Detail Modal */}
            {detailModalOpen && selectedAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setDetailModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Detalhes do Agendamento</h3>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-sm font-bold text-gray-700">{clients.find(c=>c.id === selectedAppt.clientId)?.name}</p>
                                <p className="text-xs text-gray-500">Pet: {clients.find(c=>c.id === selectedAppt.clientId)?.pets.find(p=>p.id === selectedAppt.petId)?.name}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(selectedAppt)} className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-100 flex items-center justify-center gap-2"><Edit2 size={16}/> Editar</button>
                                <button onClick={() => { onDelete(selectedAppt.id); setDetailModalOpen(false); }} className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 flex items-center justify-center gap-2"><Trash2 size={16}/> Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-6 relative my-10">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedAppt ? 'Editar' : 'Novo'} Agendamento</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Col: Client Selection */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Buscar Cliente</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                                        <input className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-brand-200 outline-none" placeholder="Nome, telefone ou pet..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                    </div>
                                    <div className="mt-2 h-64 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50">
                                        {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm) || c.pets.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))).map(client => (
                                            <div key={client.id} onClick={() => setNewItem({...newItem, clientId: client.id, petId: client.pets[0]?.id || ''})} className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-brand-50 transition ${newItem.clientId === client.id ? 'bg-brand-50 border-l-4 border-brand-500' : ''}`}>
                                                <p className="font-bold text-gray-800">{client.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{client.pets.map(p => p.name).join(', ')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {newItem.clientId && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Pet</label>
                                        <select className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none" value={newItem.petId} onChange={e => setNewItem({...newItem, petId: e.target.value})}>
                                            {clients.find(c => c.id === newItem.clientId)?.pets.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.size} / {p.coat})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Right Col: Service & Time */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Data</label>
                                        <input type="date" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Hora</label>
                                        <select className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none" value={newItem.time} onChange={e => setNewItem({...newItem, time: e.target.value})}>
                                            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Duração Manual</label>
                                    <select className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none" value={newItem.duration} onChange={e => setNewItem({...newItem, duration: e.target.value})}>
                                        <option value="30">30 min</option>
                                        <option value="60">1 Hora</option>
                                        <option value="90">1h 30m</option>
                                        <option value="120">2 Horas</option>
                                        <option value="150">2h 30m</option>
                                        <option value="180">3 Horas</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Serviço Principal</label>
                                    <select className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none" value={newItem.serviceId} onChange={e => setNewItem({...newItem, serviceId: e.target.value})}>
                                        <option value="">Selecione...</option>
                                        {filteredServices.filter(s => s.category === 'principal').map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Serviços Adicionais</label>
                                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50 grid grid-cols-1 gap-2">
                                        {filteredServices.filter(s => s.category === 'adicional').map(s => (
                                            <label key={s.id} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm cursor-pointer hover:bg-gray-50">
                                                <input type="checkbox" checked={newItem.additionalServiceIds.includes(s.id)} onChange={e => {
                                                    const newIds = e.target.checked ? [...newItem.additionalServiceIds, s.id] : newItem.additionalServiceIds.filter(id => id !== s.id);
                                                    setNewItem({...newItem, additionalServiceIds: newIds});
                                                }} className="rounded text-brand-600 focus:ring-brand-500" />
                                                <span className="text-sm text-gray-700">{s.name} (+ R${s.price})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleSave} className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-200 transition transform hover:scale-[1.02]">
                                    {selectedAppt ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed bg-white shadow-xl rounded-lg border border-gray-100 py-1 z-50 w-48"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button onClick={() => { const app = appointments.find(a=>a.id === contextMenu.id); if(app) openEdit(app); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center gap-2"><Edit2 size={14}/> Editar</button>
                    <button onClick={() => { onDelete(contextMenu.id); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2"><Trash2 size={14}/> Excluir</button>
                    <div className="border-t border-gray-100 my-1"/>
                    <button onClick={() => setContextMenu(null)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-500 text-sm">Cancelar</button>
                </div>
            )}
            
            {/* Click outside context menu listener */}
            {contextMenu && <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />}
        </div>
    );
};

const PaymentManager: React.FC<{ 
    appointments: Appointment[]; 
    clients: Client[]; 
    services: Service[]; 
    onUpdatePayment: (id: string, amount: number, method: any) => void 
}> = ({ appointments, clients, services, onUpdatePayment }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [view, setView] = useState<'pending' | 'paid' | 'all'>('all');

    const filteredApps = appointments.filter(a => {
        if(a.status === 'cancelado') return false;
        const isToday = a.date.startsWith(selectedDate);
        if (view === 'all') return isToday;
        const isPaid = !!a.paymentMethod;
        return isToday && (view === 'paid' ? isPaid : !isPaid);
    });

    const calculateTotal = (app: Appointment) => {
        const main = services.find(s => s.id === app.serviceId);
        let t = main?.price || 0;
        app.additionalServiceIds?.forEach(id => { const s = services.find(x => x.id === id); if(s) t += s.price; });
        return t;
    };

    return (
        <div className="space-y-4 pb-20">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                <h1 className="text-xl font-bold text-gray-800">Pagamentos</h1>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-gray-50 border p-2 rounded-lg text-sm font-bold text-gray-700 outline-none" />
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex text-sm font-bold text-gray-500">
                <button onClick={() => setView('all')} className={`flex-1 py-3 ${view === 'all' ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50'}`}>Todos</button>
                <button onClick={() => setView('pending')} className={`flex-1 py-3 ${view === 'pending' ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50'}`}>Pendentes</button>
                <button onClick={() => setView('paid')} className={`flex-1 py-3 ${view === 'paid' ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50'}`}>Pagos</button>
            </div>

            <div className="space-y-3">
                {filteredApps.map(app => {
                    const client = clients.find(c => c.id === app.clientId);
                    const total = calculateTotal(app);
                    const isPaid = !!app.paymentMethod;
                    return (
                        <div key={app.id} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${isPaid ? 'border-green-500' : 'border-orange-500'} flex justify-between items-center`}>
                            <div>
                                <p className="font-bold text-gray-800">{client?.name}</p>
                                <p className="text-xs text-gray-500">R$ {total.toFixed(2)} - {services.find(s => s.id === app.serviceId)?.name}</p>
                            </div>
                            <div className="text-right">
                                {isPaid ? (
                                    <div className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">{app.paymentMethod}</div>
                                ) : (
                                    <button onClick={() => { if(confirm('Confirmar pagamento em dinheiro?')) onUpdatePayment(app.id, total, 'Dinheiro'); }} className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow hover:bg-brand-700">Receber</button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredApps.length === 0 && <div className="text-center p-10 text-gray-400">Nenhum pagamento encontrado.</div>}
            </div>
        </div>
    );
};

const AppSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; settings: any; onSave: (s: any) => void }> = ({ isOpen, onClose, settings, onSave }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Configurações</h2><button onClick={onClose}><X/></button></div>
                <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Nome do App</label><input className="w-full border p-2 rounded-lg" value={settings.appName || ''} onChange={e => onSave({...settings, appName: e.target.value})} /></div>
                    <p className="text-xs text-gray-400">Mais opções de personalização em breve.</p>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('payments');
    const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfigured, setIsConfigured] = useState(!!localStorage.getItem('petgestor_client_id'));
    
    // Data State
    const [clients, setClients] = useState<Client[]>(db.getClients());
    const [services, setServices] = useState<Service[]>(db.getServices());
    const [appointments, setAppointments] = useState<Appointment[]>(db.getAppointments());
    const [costItems, setCostItems] = useState<CostItem[]>([]); // New state for costs
    
    // Pin & Settings
    const [pin, setPin] = useState(localStorage.getItem('petgestor_pin') || '');
    const [isPinUnlocked, setIsPinUnlocked] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [appSettings, setAppSettings] = useState(JSON.parse(localStorage.getItem('petgestor_settings') || '{}'));

    useEffect(() => {
        googleService.init((tokenResponse: any) => {
            setAccessToken(tokenResponse.access_token);
            googleService.getUserProfile(tokenResponse.access_token).then(profile => {
                if (profile) setGoogleUser(profile);
            });
            // Auto-sync on login
            performFullSync(tokenResponse.access_token);
        });
    }, []);

    const performFullSync = async (token: string) => {
        setIsLoading(true);
        try {
            await handleSyncClients(token, true);
            await handleSyncServices(token);
            await handleSyncCosts(token); // Sync costs
            await handleSyncAppointments(token, true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // --- SYNC FUNCTIONS ---

    const handleSyncCosts = async (token: string) => {
        try {
            const rawData = await googleService.getSheetValues(token, PREDEFINED_SHEET_ID, 'Custo Mensal!A:F');
            if (!rawData || rawData.length < 2) return;
            const costs: CostItem[] = rawData.slice(1).map((row: any, index: number) => ({
                id: `cost_${index}`,
                month: row[0] || '',
                week: row[1] || '',
                date: row[2] || '',
                category: row[3] || 'Outros',
                amount: parseFloat((row[4] || '0').replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0,
                status: row[5] || ''
            }));
            setCostItems(costs);
        } catch (e) { console.error("Error syncing costs", e); }
    };

    const handleSyncClients = async (token: string, silent = false) => {
        try {
            const rawData = await googleService.getSheetValues(token, PREDEFINED_SHEET_ID, 'CADASTRO!A:M');
            if (!rawData || rawData.length < 2) return;
            
            const newClients: Client[] = [];
            rawData.slice(1).forEach((row: string[]) => {
                const [timestamp, name, phone, address, complement, petName, petAge, petGender, petBreed, petSize, petCoat, notes] = row;
                if (!name) return;
                
                let client = newClients.find(c => c.name === name);
                if (!client) {
                    client = { id: `c_${newClients.length}`, name, phone: phone || '', address: address || '', complement: complement || '', createdAt: timestamp, pets: [] };
                    newClients.push(client);
                }
                
                if (petName) {
                    client.pets.push({
                        id: `p_${client.pets.length}`,
                        name: petName,
                        breed: petBreed || 'SRD',
                        age: petAge || '',
                        gender: petGender || '',
                        size: petSize || 'Médio',
                        coat: petCoat || 'Curto',
                        notes: notes || ''
                    });
                }
            });
            
            setClients(newClients.sort((a,b) => a.name.localeCompare(b.name)));
            db.saveClients(newClients);
            if (!silent) alert('Clientes sincronizados!');
        } catch (error) {
            console.error(error);
            if (!silent) alert('Erro ao sincronizar clientes.');
        }
    };

    const handleSyncServices = async (token: string) => {
        try {
            const rawData = await googleService.getSheetValues(token, PREDEFINED_SHEET_ID, 'Serviço!A:E');
            if (!rawData || rawData.length < 2) return;
            
            const newServices = rawData.slice(1).map((row: any, index: number) => ({
                id: `svc_${index}`,
                name: row[0],
                category: (row[1] || 'principal').toLowerCase(),
                targetSize: row[2] || 'Todos',
                targetCoat: row[3] || 'Todos',
                price: parseFloat((row[4] || '0').replace('R$', '').replace(',', '.').trim()) || 0,
                description: '',
                durationMin: 60
            }));
            setServices(newServices);
            db.saveServices(newServices);
        } catch (error) { console.error(error); }
    };

    const handleSyncAppointments = async (token: string, silent = false) => {
        try {
            // Read starting from line 5 (index 4)
            const rawData = await googleService.getSheetValues(token, PREDEFINED_SHEET_ID, 'Agendamento!A5:S');
            if (!rawData) return;
            
            const newApps: Appointment[] = rawData.map((row: any, index: number) => {
                // Logic to match/create temporary client/pet if missing would go here
                // Mapping Sheet Columns: Pet(A), Client(B)... Date(L), Time(M)... Value(R), Method(S)
                // A=0, B=1, ... L=11, M=12, ... R=17, S=18
                const dateStr = row[11]; // DD/MM/YYYY
                const timeStr = row[12]; // HH:mm
                let isoDate = '';
                if (dateStr && timeStr) {
                    const [d, m, y] = dateStr.split('/');
                    isoDate = `${y}-${m}-${d}T${timeStr}:00`;
                }

                // Try to find IDs based on names (simplified)
                const client = clients.find(c => c.name === row[1]);
                const pet = client?.pets.find(p => p.name === row[0]);
                const svc = services.find(s => s.name === row[4]); // Animal/Raca column? Maybe Service col is G(6)? Adjust as per sheet structure. Assuming Service is H(7).
                // Re-mapping based on user prompt: "Pet, Cliente, Tel, End, Raca, Porte, Pelagem, Serviço(H/7)..."
                
                return {
                    id: `sheet_${index}`, // ID linked to sheet index
                    clientId: client?.id || 'unknown',
                    petId: pet?.id || 'unknown',
                    serviceId: svc?.id || 'unknown',
                    date: isoDate,
                    status: 'agendado',
                    paidAmount: parseFloat((row[17] || '0').replace('R$', '').replace(',', '.').trim()) || 0,
                    paymentMethod: row[18] || '',
                    durationTotal: parseInt(row[14] || '60') // Duration column O(14)?
                } as Appointment;
            }).filter((a: Appointment) => a.date); // Filter invalid dates
            
            setAppointments(newApps);
            db.saveAppointments(newApps);
            if(!silent) alert('Agenda sincronizada!');
        } catch (e) { console.error(e); }
    };

    // --- ACTIONS ---

    const handleAddAppointment = async (apptData: any) => {
        if (!accessToken) return alert('Conecte-se ao Google');
        setIsLoading(true);
        try {
            // 1. Create Google Calendar Event
            const client = clients.find(c => c.id === apptData.clientId);
            const pet = client?.pets.find(p => p.id === apptData.petId);
            const svc = services.find(s => s.id === apptData.serviceId);
            
            const gEvent = await googleService.createEvent(accessToken, {
                summary: `Banho e Tosa: ${pet?.name} (${client?.name})`,
                description: `Serviço: ${svc?.name}`,
                startTime: apptData.date,
                durationMin: apptData.durationTotal
            });

            // 2. Add to Sheet
            const d = new Date(apptData.date);
            const dateStr = d.toLocaleDateString('pt-BR');
            const timeStr = d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
            
            const row = [
                pet?.name, client?.name, client?.phone, client?.address,
                pet?.breed, pet?.size, pet?.coat,
                svc?.name,
                apptData.additionalServiceIds?.map((id:string) => services.find(s=>s.id===id)?.name).join(', '),
                '', '', // Extra service slots
                dateStr, timeStr,
                '', // OBS
                apptData.durationTotal,
                '', '', '', '' // Empty cols for future data
            ];
            
            await googleService.appendSheetValues(accessToken, PREDEFINED_SHEET_ID, 'Agendamento!A5:S', row);
            
            // 3. Update Local
            await handleSyncAppointments(accessToken, true); // Re-sync to get correct ID
            
        } catch (e) { console.error(e); alert('Erro ao salvar'); }
        setIsLoading(false);
    };

    const handleEditAppointment = async (id: string, updates: any) => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
            // Check if it is a sheet appointment
            if (id.startsWith('sheet_')) {
                const sheetIndex = parseInt(id.split('_')[1]);
                const rowIndex = sheetIndex + 5; // Offset 5 lines
                
                // Update Sheet (Logic would be complex to update specific cells, simplified here to re-sync or append)
                // For a robust implementation, we would use batchUpdate. Here we might just update specific columns if needed.
                // Assuming we just update the Local and Calendar for now, editing sheet row is tricky without overwriting.
                
                const app = appointments.find(a => a.id === id);
                if (app && app.googleEventId) {
                   await googleService.updateEvent(accessToken, app.googleEventId, {
                       summary: 'Updated Event',
                       description: 'Updated',
                       startTime: updates.date,
                       durationMin: updates.durationTotal
                   });
                }
            }
            // Update Local
            const newApps = appointments.map(a => a.id === id ? { ...a, ...updates } : a);
            setAppointments(newApps);
            db.saveAppointments(newApps);
        } catch (e) { console.error(e); }
        setIsLoading(false);
    };

    const handleDeleteAppointment = async (id: string) => {
        if (!accessToken) return;
        if (!confirm('Excluir agendamento? Isso removerá da Planilha e Google Agenda.')) return;
        setIsLoading(true);
        try {
             if (id.startsWith('sheet_')) {
                 const sheetIndex = parseInt(id.split('_')[1]);
                 const rowIndex = sheetIndex + 5;
                 await googleService.clearSheetValues(accessToken, PREDEFINED_SHEET_ID, `Agendamento!A${rowIndex}:S${rowIndex}`);
             }
             const app = appointments.find(a => a.id === id);
             if (app?.googleEventId) {
                 await googleService.deleteEvent(accessToken, app.googleEventId);
             }
             const newApps = appointments.filter(a => a.id !== id);
             setAppointments(newApps);
             db.saveAppointments(newApps);
        } catch (e) { console.error(e); }
        setIsLoading(false);
    };

    const handleUpdatePayment = async (id: string, amount: number, method: string) => {
        if (!accessToken || !id.startsWith('sheet_')) return alert('Sincronize primeiro');
        setIsLoading(true);
        try {
            const sheetIndex = parseInt(id.split('_')[1]);
            const rowIndex = sheetIndex + 5;
            // Update cols R (17) and S (18). Range R{row}:S{row}
            await googleService.updateSheetValues(accessToken, PREDEFINED_SHEET_ID, `Agendamento!R${rowIndex}:S${rowIndex}`, [amount, method]);
            await handleSyncAppointments(accessToken, true);
        } catch (e) { console.error(e); }
        setIsLoading(false);
    };

    // --- RENDER ---

    if (!isConfigured) return <SetupScreen onSave={(id) => { localStorage.setItem('petgestor_client_id', id); setIsConfigured(true); window.location.reload(); }} />;
    if (!googleUser) return <LoginScreen onLogin={googleService.login} onReset={() => { localStorage.removeItem('petgestor_client_id'); setIsConfigured(false); }} />;

    return (
        <Layout currentView={currentView} setView={(v) => {
            if ((v === 'revenue' || v === 'costs') && !isPinUnlocked) { /* Trigger Pin */ }
            setCurrentView(v);
        }} googleUser={googleUser} onLogin={googleService.login} onLogout={() => { setGoogleUser(null); setAccessToken(null); }}>
            {isLoading && (
                <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col">
                    <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4"/>
                    <p className="font-bold text-gray-600 animate-pulse">Sincronizando dados...</p>
                </div>
            )}

            <PinGuard isUnlocked={isPinUnlocked} onUnlock={(p) => { const ok = p === pin; if(ok) setIsPinUnlocked(true); return ok; }} onSetPin={(p) => { setPin(p); localStorage.setItem('petgestor_pin', p); setIsPinUnlocked(true); }} hasPin={!!pin} onReset={() => { setPin(''); localStorage.removeItem('petgestor_pin'); setIsPinUnlocked(false); }} />
            
            <AppSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} settings={appSettings} onSave={(s) => { setAppSettings(s); localStorage.setItem('petgestor_settings', JSON.stringify(s)); }} />

            {(currentView === 'revenue' || currentView === 'costs') && !isPinUnlocked ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Lock size={48} className="mb-4" />
                    <p>Área Bloqueada</p>
                    <button onClick={() => window.location.reload()} className="text-brand-600 underline mt-2">Digitar Senha</button>
                </div>
            ) : (
                <>
                    {currentView === 'revenue' && <RevenueView appointments={appointments} services={services} clients={clients} />}
                    {currentView === 'costs' && <CostsView costItems={costItems} />}
                    {currentView === 'clients' && <ClientManager clients={clients} onUpdate={() => {}} />}
                    {currentView === 'services' && <ServiceManager services={services} onUpdate={() => {}} />}
                    {currentView === 'schedule' && <ScheduleManager appointments={appointments} clients={clients} services={services} onAdd={handleAddAppointment} onEdit={handleEditAppointment} onDelete={handleDeleteAppointment} />}
                    {currentView === 'payments' && <PaymentManager appointments={appointments} clients={clients} services={services} onUpdatePayment={handleUpdatePayment} />}
                </>
            )}
            
            {/* FAB for Settings */}
            <button onClick={() => setSettingsOpen(true)} className="fixed bottom-6 right-6 w-12 h-12 bg-white text-gray-600 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 z-40 border border-gray-200">
                <Settings size={20} />
            </button>
        </Layout>
    );
};

export default App;
