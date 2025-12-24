
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Calendar as CalendarIcon, Wallet, Activity, DollarSign,
    PawPrint, TrendingUp, BarChart2, CheckCircle, AlertCircle,
    TrendingDown, Scissors, PieChart as PieChartIcon, ChevronDown, FileText, Star
} from 'lucide-react';
import {
    ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line
} from 'recharts';
import { Appointment, Service, Client, CostItem, Pet } from '../types';
import { calculateTotal, formatDateWithWeek } from '../utils/helpers';

export const RevenueView: React.FC<{ appointments: Appointment[]; services: Service[]; clients: Client[]; costs: CostItem[]; defaultTab?: 'daily' | 'weekly' | 'monthly' | 'yearly'; onRemovePayment: (app: Appointment) => void; onNoShow?: (app: Appointment) => void; onViewPet?: (pet: Pet, client: Client) => void }> = ({ appointments, services, clients, costs, defaultTab = 'daily', onRemovePayment, onNoShow, onViewPet }) => {
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(defaultTab);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const touchStart = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => touchStart.current = e.touches[0].clientX;
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (activeTab === 'daily' && Math.abs(diff) > 100) {
            const [y, m, d] = selectedDate.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const isNext = diff > 0;
            date.setDate(date.getDate() + (isNext ? 1 : -1));
            setSlideDirection(isNext ? 'right' : 'left'); // Next day comes from right, Prev day comes from left
            setSelectedDate(date.toISOString().split('T')[0]);
        }
        touchStart.current = null;
    };

    const getISOWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const isOperationalCost = (c: CostItem) => {
        const cat = c.category?.toLowerCase() || '';
        return cat !== 'sócio' && cat !== 'socio' && !cat.includes('extraordinário') && !cat.includes('extraordinario');
    };

    const calculateStats = (apps: Appointment[]) => {
        let totalPets = 0; let totalTosas = 0; let paidRevenue = 0; let pendingRevenue = 0;
        apps.forEach(app => {
            if (app.status === 'cancelado' || app.status === 'nao_veio') return;
            // ... (rest of logic same)
            totalPets++;
            const isTargetTosa = (name?: string) => { if (!name) return false; const n = name.toLowerCase(); return n.includes('tosa normal') || n.includes('tosa tesoura'); };
            const mainSvc = services.find(s => s.id === app.serviceId);
            let hasTosa = isTargetTosa(mainSvc?.name);
            if (!hasTosa && app.additionalServiceIds) { app.additionalServiceIds.forEach(id => { const s = services.find(srv => srv.id === id); if (s && isTargetTosa(s.name)) hasTosa = true; }); }
            if (hasTosa) totalTosas++;
            const gross = calculateTotal(app, services);
            // Strict Payment Check: Payment Method is MANDATORY.
            // Then checks if amount is paid OR status is concluded.
            const isPaid = (!!app.paymentMethod && app.paymentMethod.trim() !== '') && ((!!app.paidAmount && app.paidAmount > 0) || app.status === 'concluido');
            if (isPaid) paidRevenue += gross; else pendingRevenue += gross;
        });
        const grossRevenue = paidRevenue + pendingRevenue;
        const averageTicket = totalPets > 0 ? grossRevenue / totalPets : 0;
        return { totalPets, totalTosas, paidRevenue, pendingRevenue, grossRevenue, averageTicket };
    };

    const getWeeklyChartData = useCallback(() => {
        // ...
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const day = date.getDay();
        const diff = date.getDate() - day;
        const startOfWeek = new Date(date); startOfWeek.setDate(diff);
        const data: any[] = []; const businessDays = [2, 3, 4, 5, 6];
        businessDays.forEach(dayIndex => {
            const current = new Date(startOfWeek); current.setDate(startOfWeek.getDate() + dayIndex);
            const cYear = current.getFullYear(); const cMonth = String(current.getMonth() + 1).padStart(2, '0'); const cDay = String(current.getDate()).padStart(2, '0');
            const targetDateStr = `${cYear}-${cMonth}-${cDay}`;
            const dailyApps = appointments.filter(a => { if (a.status === 'cancelado') return false; const aDate = new Date(a.date); const aYear = aDate.getFullYear(); const aMonth = String(aDate.getMonth() + 1).padStart(2, '0'); const aDay = String(aDate.getDate()).padStart(2, '0'); return `${aYear}-${aMonth}-${aDay}` === targetDateStr; });
            const totalRevenue = dailyApps.reduce((acc, app) => acc + calculateTotal(app, services), 0);
            const formattedDate = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' });
            let growth = 0; if (data.length > 0) { const prev = data[data.length - 1]; if (prev.faturamento > 0) growth = ((totalRevenue - prev.faturamento) / prev.faturamento) * 100; }
            data.push({ name: formattedDate, fullDate: targetDateStr, faturamento: totalRevenue, rawRevenue: totalRevenue, pets: dailyApps.length, growth });
        });
        return data;
    }, [selectedDate, appointments, services]);

    const getMonthlyChartData = useCallback(() => {
        const [yearStr, monthStr] = selectedMonth.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1;
        const getWeekData = (targetYear: number, targetWeek: number) => {
            const apps = appointments.filter(app => {
                if (app.status === 'cancelado') return false;
                const d = new Date(app.date);
                return getISOWeek(d) === targetWeek && d.getFullYear() === targetYear;
            });
            const rev = apps.reduce((acc, app) => acc + calculateTotal(app, services), 0);
            return { revenue: rev, pets: apps.length };
        };
        const weeksInMonth = new Set<number>();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) weeksInMonth.add(getISOWeek(new Date(year, month, d)));
        const sortedWeeks = Array.from(weeksInMonth).sort((a, b) => a - b);
        const chartData: any[] = [];
        sortedWeeks.forEach((weekNum, index) => {
            const { revenue, pets } = getWeekData(year, weekNum);
            let growth = 0; if (index > 0) { const prevRev = chartData[index - 1].faturamento; if (prevRev > 0) growth = ((revenue - prevRev) / prevRev) * 100; }
            chartData.push({ name: `S${index + 1}`, faturamento: revenue, rawRevenue: revenue, pets: pets, growth });
        });
        return chartData;
    }, [selectedMonth, appointments, services]);

    const getYearlyChartData = useCallback(() => {
        const data: any[] = []; const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const startMonth = selectedYear === 2025 ? 7 : 0;
        for (let i = startMonth; i < 12; i++) {
            const monthApps = appointments.filter(a => { const d = new Date(a.date); return d.getFullYear() === selectedYear && d.getMonth() === i && a.status !== 'cancelado'; });
            const stats = calculateStats(monthApps);
            let revGrowth = 0; if (i > startMonth) { const prevApps = appointments.filter(a => { const d = new Date(a.date); return d.getFullYear() === selectedYear && d.getMonth() === (i - 1) && a.status !== 'cancelado'; }); const prevStats = calculateStats(prevApps); if (prevStats.grossRevenue > 0) revGrowth = ((stats.grossRevenue - prevStats.grossRevenue) / prevStats.grossRevenue) * 100; }
            data.push({ name: monthNames[i], faturamento: stats.grossRevenue, rawRevenue: stats.grossRevenue, pets: stats.totalPets, revGrowth, });
        }
        return data;
    }, [selectedYear, appointments, services]);

    const dailyApps = useMemo(() => appointments.filter(a => a.date.startsWith(selectedDate)), [appointments, selectedDate]);
    const dailyStats = useMemo(() => calculateStats(dailyApps), [dailyApps, services]);
    const weeklyChartData = useMemo(() => getWeeklyChartData(), [getWeeklyChartData]);

    // Calculate weeklyStats
    const calculateWeeklyStats = () => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const day = date.getDay();
        const diff = date.getDate() - day;
        const startOfWeek = new Date(date); startOfWeek.setDate(diff); startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);
        const wApps = appointments.filter(a => { if (a.status === 'cancelado') return false; const ad = new Date(a.date); return ad >= startOfWeek && ad <= endOfWeek; });
        return calculateStats(wApps);
    };
    // eslint-disable-next-line
    const weeklyStats = useMemo(() => calculateWeeklyStats(), [selectedDate, appointments, services]);

    const monthlyChartData = useMemo(() => getMonthlyChartData(), [getMonthlyChartData]);
    const yearlyChartData = useMemo(() => getYearlyChartData(), [getYearlyChartData]);

    const monthlyApps = appointments.filter(a => a.date.startsWith(selectedMonth));
    const monthlyStats = calculateStats(monthlyApps);
    const yearlyApps = appointments.filter(a => new Date(a.date).getFullYear() === selectedYear);
    const yearlyStats = calculateStats(yearlyApps);

    // --- NEW STATS LOGIC ---
    const calculatePeriodStats = (rangeApps: Appointment[], daysCount: number, periodCost?: number, businessDaysOverride?: number) => {
        const stats = calculateStats(rangeApps);
        const avgRevPerDay = daysCount > 0 ? stats.grossRevenue / daysCount : 0;
        const avgPetsPerDay = daysCount > 0 ? stats.totalPets / daysCount : 0;

        let dailyCost = 0;
        const validBusinessDays = businessDaysOverride || daysCount; // Use override if provided (e.g. Tue-Sat specific count)
        if (periodCost && validBusinessDays > 0) {
            dailyCost = periodCost / validBusinessDays;
        }

        return { ...stats, avgRevPerDay, avgPetsPerDay, dailyCost };
    };

    const getGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Count Tuesdays-Saturdays in a range
    const countBusinessDays = (start: Date, end: Date) => {
        let count = 0;
        const cur = new Date(start);
        while (cur <= end) {
            const day = cur.getDay();
            if (day >= 2 && day <= 6) count++; // 2=Tue, 6=Sat
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

    // Helper to get cost for a specific month (YYYY-MM format in sheet usually)
    const getCostForMonth = (date: Date) => {
        // Month name logic or simple matching based on costs data structure
        // Assuming costs have 'month' field like 'Janeiro', 'Fevereiro' etc or simply summing all costs in that month's date range
        // For simplicity, let's filter costs by date if available, or just sum everything if cost date matches period.
        // Better approach given `costs` structure: filter by ISO date range
        const m = date.getMonth();
        const y = date.getFullYear();
        return costs.filter(c => {
            const cDate = new Date(c.date);
            return cDate.getMonth() === m && cDate.getFullYear() === y && isOperationalCost(c);
        }).reduce((acc, c) => acc + c.amount, 0);
    };

    // Calculate Data for Tabs
    const metricData = useMemo(() => {
        // Current Date Reference
        const currDate = new Date(selectedDate);
        if (activeTab === 'weekly') {
            const getWeekRange = (date: Date) => {
                const day = date.getDay();
                const start = new Date(date); start.setDate(date.getDate() - day); start.setHours(0, 0, 0, 0);
                const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
                return { start, end };
            };
            const curr = getWeekRange(currDate);
            const prevStart = new Date(curr.start); prevStart.setDate(prevStart.getDate() - 7);
            const prev = getWeekRange(prevStart);

            const currApps = appointments.filter(a => { const d = new Date(a.date); return d >= curr.start && d <= curr.end; });
            const prevApps = appointments.filter(a => { const d = new Date(a.date); return d >= prev.start && d <= prev.end; });

            // For weekly cost, we can approximate: MonthCost / 4.3 or sum costs if they have precise dates within this week.
            // Let's use precise dates if possible, or fallback to pro-rated.
            const getRangeCost = (s: Date, e: Date) => costs.filter(c => { const d = new Date(c.date); return d >= s && d <= e; }).reduce((acc, c) => acc + c.amount, 0);

            const cDays = countBusinessDays(curr.start, curr.end);
            const pDays = countBusinessDays(prev.start, prev.end);

            const cStats = calculatePeriodStats(currApps, cDays, getRangeCost(curr.start, curr.end));
            const pStats = calculatePeriodStats(prevApps, pDays, getRangeCost(prev.start, prev.end));

            return { current: cStats, previous: pStats, rangeLabel: `${curr.start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${curr.end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` };
        }
        else if (activeTab === 'monthly') {
            const [yStr, mStr] = selectedMonth.split('-');
            const y = parseInt(yStr), m = parseInt(mStr) - 1;
            const currStart = new Date(y, m, 1); const currEnd = new Date(y, m + 1, 0);
            const prevStart = new Date(y, m - 1, 1); const prevEnd = new Date(y, m, 0);

            const currApps = appointments.filter(a => { const d = new Date(a.date); return d >= currStart && d <= currEnd; });
            const prevApps = appointments.filter(a => { const d = new Date(a.date); return d >= prevStart && d <= prevEnd; });

            const cDays = countBusinessDays(currStart, currEnd);
            const pDays = countBusinessDays(prevStart, prevEnd);

            const cCost = getCostForMonth(currStart); // This sums all costs in that month
            const pCost = getCostForMonth(prevStart);

            const cStats = calculatePeriodStats(currApps, cDays, cCost);
            const pStats = calculatePeriodStats(prevApps, pDays, pCost);

            return { current: cStats, previous: pStats, rangeLabel: currStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) };
        }
        else if (activeTab === 'yearly') {
            const currApps = appointments.filter(a => new Date(a.date).getFullYear() === selectedYear);
            const prevApps = appointments.filter(a => new Date(a.date).getFullYear() === selectedYear - 1);

            // Yearly Cost
            const getYearCost = (year: number) => costs.filter(c => new Date(c.date).getFullYear() === year).reduce((acc, c) => acc + c.amount, 0);

            // Count biz days in year
            const countYearBizDays = (year: number) => {
                let d = new Date(year, 0, 1);
                let count = 0;
                while (d.getFullYear() === year) {
                    const w = d.getDay();
                    if (w >= 2 && w <= 6) count++;
                    d.setDate(d.getDate() + 1);
                }
                return count;
            };

            const cDays = countYearBizDays(selectedYear);
            const pDays = countYearBizDays(selectedYear - 1);

            const cStats = calculatePeriodStats(currApps, cDays, getYearCost(selectedYear));
            const pStats = calculatePeriodStats(prevApps, pDays, getYearCost(selectedYear - 1));

            return { current: cStats, previous: pStats, rangeLabel: selectedYear.toString() };
        }
        return null;
    }, [activeTab, appointments, selectedDate, selectedMonth, selectedYear, costs]);

    interface StatCardProps { title: string; value: string | number; icon: any; colorClass: string; growth?: number; subValue?: string; }
    const StatCard = ({ title, value, icon: Icon, colorClass, growth, subValue }: StatCardProps) => (
        <div className="bg-white p-5 rounded-[2rem] shadow-soft border border-gray-100/50 btn-spring hover:shadow-lg hover:-translate-y-2 flex flex-col justify-between group h-full relative overflow-hidden">
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${colorClass.split('-')[1]}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={22} className="animate-pulse-slow" />
                </div>
                {growth !== undefined && (
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${growth >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(growth).toFixed(0)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight leading-none">{value}</h3>
                {subValue && <p className="text-xs font-medium text-gray-400 mt-2">{subValue}</p>}
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon: Icon }: any) => (<button onClick={() => setActiveTab(id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 btn-spring ${activeTab === id ? 'bg-white text-brand-600 shadow-md transform scale-100' : 'text-gray-400 hover:bg-white/50 hover:text-gray-600'}`}><Icon size={16} /><span className="hidden sm:inline">{label}</span></button>);

    const animationClass = slideDirection === 'right' ? 'animate-slide-right' : slideDirection === 'left' ? 'animate-slide-left' : '';

    return (
        <div className="space-y-6 animate-fade-in pb-10" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {defaultTab === 'daily' ? null : (
                <>
                    <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-gray-900 tracking-tight">Faturamento</h1></div>
                    <div className="bg-gray-100/50 p-1 rounded-2xl mb-8 flex gap-1 shadow-inner"><TabButton id="daily" label="Diário" icon={CalendarIcon} /><TabButton id="weekly" label="Semanal" icon={BarChart2} /><TabButton id="monthly" label="Mensal" icon={TrendingUp} /><TabButton id="yearly" label="Anual" icon={PieChartIcon} /></div>
                </>
            )}

            {activeTab === 'daily' && (
                <section key={selectedDate} className={animationClass}>
                    <div className="sticky top-0 z-30 flex justify-between items-center mb-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-gray-200 shadow-sm transition-all">
                        <h2 className="text-lg font-bold text-gray-800">Diário</h2>
                        <div className="relative text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors cursor-pointer group flex items-center gap-1 z-50 select-none" onClick={() => (document.getElementById('daily-date-picker') as HTMLInputElement)?.showPicker()}>
                            <span className="pointer-events-none">{formatDateWithWeek(selectedDate)}</span>
                            <ChevronDown size={14} className="opacity-50 pointer-events-none" />
                            <input
                                id="daily-date-picker"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-50 appearance-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><StatCard title="Total de Pets" value={dailyStats.totalPets} icon={PawPrint} colorClass="bg-blue-500" /><StatCard title="Total de Tosas" value={dailyStats.totalTosas} icon={Scissors} colorClass="bg-orange-500" subValue="Normal e Tesoura" /><StatCard title="Caixa Pago" value={`R$ ${dailyStats.paidRevenue.toFixed(2)}`} icon={CheckCircle} colorClass="bg-green-500" /><StatCard title="A Receber" value={`R$ ${dailyStats.pendingRevenue.toFixed(2)}`} icon={AlertCircle} colorClass="bg-red-500" /></div>
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-glass border border-white/40 overflow-hidden mt-6">
                        <h3 className="p-5 text-sm font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100/50 dark:border-gray-700/50 flex items-center gap-2 uppercase tracking-wider"><FileText size={16} /> Detalhamento do Dia</h3>
                        <div className="p-4 space-y-3">
                            {dailyApps.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 font-medium">Nenhum agendamento neste dia.</div>
                            ) : (
                                dailyApps.sort((a, b) => a.date.localeCompare(b.date)).map((app, index) => {
                                    const client = clients.find(c => c.id === app.clientId);
                                    const pet = client?.pets?.find(p => p.id === app.petId);
                                    const mainSvc = services.find(s => s.id === app.serviceId);
                                    const addSvcs = app.additionalServiceIds?.map(id => services.find(srv => srv.id === id)).filter(x => x);
                                    const val = calculateTotal(app, services);
                                    // Payment Fix: Payment Method is MANDATORY.
                                    const isPaid = (!!app.paymentMethod && app.paymentMethod.trim() !== '') && ((!!app.paidAmount && app.paidAmount > 0) || app.status === 'concluido');

                                    return (
                                        <div key={app.id} style={{ animationDelay: `${index * 0.05}s` }} className={`animate-slide-up bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-stretch gap-4 transition-all ${isPaid ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'}`}>
                                            <div className="flex flex-col justify-center items-center px-2 border-r border-gray-100 dark:border-gray-700 min-w-[70px]">
                                                <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">Horário</span>
                                            </div>
                                            <div className="flex-1 py-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4
                                                            className="font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-brand-600 transition-colors flex items-center gap-2"
                                                            onClick={() => pet && client && onViewPet?.(pet, client)}
                                                        >
                                                            {pet?.name}
                                                            {(() => {
                                                                const pApps = appointments.filter(a => a.petId === pet?.id && a.rating);
                                                                if (pApps.length > 0) {
                                                                    const avg = pApps.reduce((acc, c) => acc + (c.rating || 0), 0) / pApps.length;
                                                                    return (
                                                                        <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100">
                                                                            <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                                                            <span className="text-[9px] font-bold text-yellow-700">{avg.toFixed(1)}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{client?.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-bold ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`}>R$ {val.toFixed(2)}</div>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isPaid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                            {isPaid ? 'Pago' : app.status === 'nao_veio' ? 'Não Veio' : 'Pendente'}
                                                        </span>
                                                        {(!isPaid && app.status !== 'nao_veio' && app.status !== 'cancelado' && onNoShow) && (
                                                            <button onClick={() => onNoShow(app)} className="ml-2 px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-500 text-[9px] font-bold rounded uppercase border border-red-100 transition-colors">
                                                                Não Veio
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-600 truncate max-w-full">
                                                        {mainSvc?.name}
                                                    </span>
                                                    {addSvcs && addSvcs.length > 0 && addSvcs.map((s, i) => (
                                                        <span key={i} className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-gray-700 truncate">
                                                            + {s?.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </section>
            )}
            {activeTab === 'weekly' && metricData && (
                <section className="animate-fade-in text-left">
                    <div className="sticky top-0 z-30 flex justify-between items-center mb-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm"><h2 className="text-lg font-bold text-gray-800">Semana</h2><span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{metricData.rangeLabel}</span></div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                        <StatCard title="Faturamento Total" value={`R$ ${metricData.current.grossRevenue.toFixed(0)}`} icon={Wallet} colorClass="bg-green-500" growth={getGrowth(metricData.current.grossRevenue, metricData.previous.grossRevenue)} />
                        <StatCard title="Total Recebido" value={`R$ ${metricData.current.paidRevenue.toFixed(0)}`} icon={CheckCircle} colorClass="bg-emerald-500" growth={getGrowth(metricData.current.paidRevenue, metricData.previous.paidRevenue)} />
                        <StatCard title="Média / Dia" value={`R$ ${metricData.current.avgRevPerDay.toFixed(0)}`} icon={BarChart2} colorClass="bg-blue-500" growth={getGrowth(metricData.current.avgRevPerDay, metricData.previous.avgRevPerDay)} />
                        <StatCard title="Custo Diário (Ter-Sab)" value={`R$ ${metricData.current.dailyCost.toFixed(0)}`} icon={AlertCircle} colorClass="bg-red-500" />
                        <StatCard title="Ticket Médio / Pet" value={`R$ ${metricData.current.averageTicket.toFixed(0)}`} icon={DollarSign} colorClass="bg-purple-500" growth={getGrowth(metricData.current.averageTicket, metricData.previous.averageTicket)} />
                        <StatCard title="Qtd. Pets" value={metricData.current.totalPets} icon={PawPrint} colorClass="bg-orange-500" growth={getGrowth(metricData.current.totalPets, metricData.previous.totalPets)} />
                        <StatCard title="Média Pets / Dia" value={metricData.current.avgPetsPerDay.toFixed(1)} icon={Activity} colorClass="bg-pink-500" growth={getGrowth(metricData.current.avgPetsPerDay, metricData.previous.avgPetsPerDay)} />
                    </div>

                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 h-96 mb-6"><h3 className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2 uppercase tracking-wide"><TrendingUp size={16} /> Evolução Diária</h3><ResponsiveContainer width="100%" height="80%"><ComposedChart data={weeklyChartData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} /><YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Bar yAxisId="right" dataKey="pets" fill="#c7d2fe" radius={[4, 4, 0, 0]} barSize={20} /><Line yAxisId="left" type="monotone" dataKey="faturamento" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer></div>
                </section>
            )}

            {activeTab === 'monthly' && metricData && (
                <section className="animate-fade-in text-left">
                    <div className="sticky top-0 z-30 flex justify-between items-center mb-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm"><h2 className="text-lg font-bold text-gray-800">Mensal</h2><input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-gray-50 border-0 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 ring-brand-100" /></div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                        <StatCard title="Faturamento Total" value={`R$ ${metricData.current.grossRevenue.toFixed(0)}`} icon={Wallet} colorClass="bg-green-500" growth={getGrowth(metricData.current.grossRevenue, metricData.previous.grossRevenue)} />
                        <StatCard title="Total Recebido" value={`R$ ${metricData.current.paidRevenue.toFixed(0)}`} icon={CheckCircle} colorClass="bg-emerald-500" growth={getGrowth(metricData.current.paidRevenue, metricData.previous.paidRevenue)} />
                        <StatCard title="Média / Dia" value={`R$ ${metricData.current.avgRevPerDay.toFixed(0)}`} icon={BarChart2} colorClass="bg-blue-500" growth={getGrowth(metricData.current.avgRevPerDay, metricData.previous.avgRevPerDay)} />
                        <StatCard title="Custo Diário (Ter-Sab)" value={`R$ ${metricData.current.dailyCost.toFixed(0)}`} icon={AlertCircle} colorClass="bg-red-500" />
                        <StatCard title="Ticket Médio / Pet" value={`R$ ${metricData.current.averageTicket.toFixed(0)}`} icon={DollarSign} colorClass="bg-purple-500" growth={getGrowth(metricData.current.averageTicket, metricData.previous.averageTicket)} />
                        <StatCard title="Qtd. Pets" value={metricData.current.totalPets} icon={PawPrint} colorClass="bg-orange-500" growth={getGrowth(metricData.current.totalPets, metricData.previous.totalPets)} />
                        <StatCard title="Média Pets / Dia" value={metricData.current.avgPetsPerDay.toFixed(1)} icon={Activity} colorClass="bg-pink-500" growth={getGrowth(metricData.current.avgPetsPerDay, metricData.previous.avgPetsPerDay)} />
                    </div>

                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 h-96 mb-6"><h3 className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2 uppercase tracking-wide"><BarChart2 size={16} /> Semanas do Mês</h3><ResponsiveContainer width="100%" height="80%"><ComposedChart data={monthlyChartData} margin={{ top: 10, right: 0, bottom: 0, left: -10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip /><Bar yAxisId="right" dataKey="pets" fill="#e9d5ff" radius={[4, 4, 0, 0]} barSize={30} /><Line yAxisId="left" type="monotone" dataKey="faturamento" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} /></ComposedChart></ResponsiveContainer></div>
                </section>
            )}

            {activeTab === 'yearly' && metricData && (
                <section className="animate-fade-in text-left">
                    <div className="sticky top-0 z-30 flex justify-between items-center mb-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm"><h2 className="text-lg font-bold text-gray-800">Anual</h2><select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-gray-50 border-0 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 ring-brand-100">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select></div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                        <StatCard title="Faturamento Total" value={`R$ ${(metricData.current.grossRevenue / 1000).toFixed(1)}k`} icon={Wallet} colorClass="bg-green-500" growth={getGrowth(metricData.current.grossRevenue, metricData.previous.grossRevenue)} />
                        <StatCard title="Total Recebido" value={`R$ ${(metricData.current.paidRevenue / 1000).toFixed(1)}k`} icon={CheckCircle} colorClass="bg-emerald-500" growth={getGrowth(metricData.current.paidRevenue, metricData.previous.paidRevenue)} />
                        <StatCard title="Média / Dia" value={`R$ ${metricData.current.avgRevPerDay.toFixed(0)}`} icon={BarChart2} colorClass="bg-blue-500" growth={getGrowth(metricData.current.avgRevPerDay, metricData.previous.avgRevPerDay)} />
                        <StatCard title="Custo Diário (Ter-Sab)" value={`R$ ${metricData.current.dailyCost.toFixed(0)}`} icon={AlertCircle} colorClass="bg-red-500" />
                        <StatCard title="Ticket Médio" value={`R$ ${metricData.current.averageTicket.toFixed(0)}`} icon={DollarSign} colorClass="bg-purple-500" growth={getGrowth(metricData.current.averageTicket, metricData.previous.averageTicket)} />
                        <StatCard title="Qtd. Pets" value={metricData.current.totalPets} icon={PawPrint} colorClass="bg-orange-500" growth={getGrowth(metricData.current.totalPets, metricData.previous.totalPets)} />
                        <StatCard title="Média Pets / Dia" value={metricData.current.avgPetsPerDay.toFixed(1)} icon={Activity} colorClass="bg-pink-500" growth={getGrowth(metricData.current.avgPetsPerDay, metricData.previous.avgPetsPerDay)} />
                    </div>

                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 h-96 mb-6"><h3 className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2 uppercase tracking-wide"><TrendingUp size={16} /> Evolução Mensal</h3><ResponsiveContainer width="100%" height="80%"><ComposedChart data={yearlyChartData} margin={{ top: 10, right: 0, bottom: 0, left: -10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip /><Bar yAxisId="right" dataKey="pets" fill="#a7f3d0" radius={[4, 4, 0, 0]} barSize={20} /><Line yAxisId="left" type="monotone" dataKey="faturamento" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer></div>
                </section>
            )}
        </div>
    );
};
