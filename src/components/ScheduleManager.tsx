
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronLeft, ChevronRight, Edit2, Trash2, X, Star, Phone, MapPin, FileText, Calendar as CalendarIcon, Scissors, Plus, Check, User, Search, AlertCircle, ArrowRightLeft, ChevronDown
} from 'lucide-react';
import { Appointment, Client, Service, Pet } from '../types';
import { formatDateWithWeek } from '../utils/helpers';
import { DayDetailsModal } from './DayDetailsModal';

export const ScheduleManager: React.FC<{ appointments: Appointment[]; clients: Client[]; services: Service[]; onAdd: (app: Appointment | Appointment[], client: Client, pet: Pet, services: Service[], duration: number) => void; onEdit: (app: Appointment, client: Client, pet: Pet, services: Service[], duration: number) => void; onUpdateStatus: (id: string, status: Appointment['status']) => void; onDelete: (id: string) => void; isOpen: boolean; onClose: () => void; onOpen: () => void; }> = ({ appointments, clients, services, onAdd, onEdit, onUpdateStatus, onDelete, isOpen, onClose, onOpen }) => {
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [detailsApp, setDetailsApp] = useState<Appointment | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, appId: string } | null>(null);

    // App Form State
    const [editingApp, setEditingApp] = useState<Appointment | null>(null);
    const [editingAppId, setEditingAppId] = useState<string | null>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedAddServices, setSelectedAddServices] = useState<string[]>([]);
    const [selectedDayForDetails, setSelectedDayForDetails] = useState<string | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('09:00');
    const [manualDuration, setManualDuration] = useState<number | string>(0);
    const [notes, setNotes] = useState('');

    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [nowMinutes, setNowMinutes] = useState(0);

    useEffect(() => {
        const updateNow = () => {
            const now = new Date();
            const mins = (now.getHours() - 8) * 60 + now.getMinutes();
            setNowMinutes(mins);
        };
        updateNow();
        const interval = setInterval(updateNow, 60000);
        return () => clearInterval(interval);
    }, []);

    const resetForm = () => {
        setEditingApp(null); setEditingAppId(null);
        setSelectedClient(null); setSelectedPetIds([]);
        setSelectedService(''); setSelectedAddServices([]);
        setDate(new Date().toISOString().split('T')[0]); setTime('09:00');
        setManualDuration(0); setNotes('');
        setClientSearch('');
        onClose();
    };

    const handleStartEdit = (app: Appointment) => {
        const client = clients.find(c => c.id === app.clientId);
        setEditingApp(app); setEditingAppId(app.id);
        setSelectedClient(client || null); setClientSearch(client?.name || '');
        setSelectedPetIds(app.petId ? [app.petId] : []);
        setSelectedService(app.serviceId); setSelectedAddServices(app.additionalServiceIds || []);
        setDate(app.date.split('T')[0]); setTime(app.date.split('T')[1].substring(0, 5));
        setManualDuration(app.durationTotal || 0); setNotes(app.notes || '');
        onOpen();
        setDetailsApp(null); setContextMenu(null);
    };

    const handleSave = () => {
        if (!selectedClient || selectedPetIds.length === 0 || !selectedService || !date || !time) return;
        const client = selectedClient;
        const mainSvc = services.find(s => s.id === selectedService);
        const addSvcs = selectedAddServices.map(id => services.find(s => s.id === id)).filter(s => s) as Service[];

        if (client && mainSvc) {
            const allAppsToCreate: Appointment[] = [];
            selectedPetIds.forEach(petId => {
                const pet = client.pets.find(p => p.id === petId);
                if (!pet) return;

                const newApp: Appointment = {
                    id: editingAppId && selectedPetIds.length === 1 ? editingAppId : `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    clientId: client.id,
                    petId: pet.id,
                    serviceId: mainSvc.id,
                    additionalServiceIds: selectedAddServices,
                    date: `${date}T${time}:00`,
                    status: 'agendado',
                    notes: notes,
                    googleEventId: editingAppId ? appointments.find(a => a.id === editingAppId)?.googleEventId : undefined
                };

                const serviceNameLower = mainSvc.name.toLowerCase();
                const isPackage = serviceNameLower.includes('pacote');

                if (isPackage && !editingAppId) {
                    let iterations = 0;
                    let intervalDays = 0;
                    if (serviceNameLower.includes('mensal')) { iterations = 3; intervalDays = 7; }
                    else if (serviceNameLower.includes('quinzenal')) { iterations = 1; intervalDays = 14; }

                    allAppsToCreate.push(newApp);
                    if (iterations > 0) {
                        const baseDate = new Date(newApp.date);
                        for (let i = 1; i <= iterations; i++) {
                            const nextDate = new Date(baseDate);
                            nextDate.setDate(baseDate.getDate() + (i * intervalDays));
                            const isoDate = nextDate.toISOString().split('T')[0] + 'T' + time + ':00';
                            allAppsToCreate.push({ ...newApp, id: `local_${Date.now()}_recur_${Math.random()}_${i}`, date: isoDate, googleEventId: undefined });
                        }
                    }
                } else {
                    allAppsToCreate.push(newApp);
                }
            });

            if (editingAppId && selectedPetIds.length === 1) {
                const appToEdit = allAppsToCreate[0];
                const original = appointments.find(a => a.id === editingAppId);
                appToEdit.paidAmount = original?.paidAmount;
                appToEdit.paymentMethod = original?.paymentMethod;
                const pet = client.pets.find(p => p.id === appToEdit.petId)!;
                onEdit(appToEdit, client, pet, [mainSvc, ...addSvcs], parseInt(manualDuration as string));
            } else {
                selectedPetIds.forEach(petId => {
                    const pet = client.pets.find(p => p.id === petId);
                    if (!pet) return;
                    const appsForThisPet = allAppsToCreate.filter(a => a.petId === petId);
                    if (appsForThisPet.length > 0) {
                        onAdd(appsForThisPet, client, pet, [mainSvc, ...addSvcs], parseInt(manualDuration as string));
                    }
                });
            }
            resetForm();
        }
    };

    const handleDeleteFromContext = () => { if (contextMenu && confirm('Excluir?')) onDelete(contextMenu.appId); setContextMenu(null); }
    const filteredClients = useMemo(() => {
        if (!clientSearch) return [];
        const term = clientSearch.toLowerCase();
        const termClean = term.replace(/\D/g, '');
        const uniqueClients = new Map<string, Client>();
        clients.forEach(c => {
            const nameMatch = c.name.toLowerCase().includes(term);
            const phoneRawMatch = c.phone.includes(clientSearch);
            const phoneCleanMatch = termClean.length > 2 && c.phone.replace(/\D/g, '').includes(termClean);
            const petMatch = c.pets.some(p => p.name.toLowerCase().includes(term));
            if (nameMatch || phoneRawMatch || phoneCleanMatch || petMatch) {
                const key = c.phone.replace(/\D/g, '') || c.id;
                if (!uniqueClients.has(key)) uniqueClients.set(key, c);
            }
        });
        return Array.from(uniqueClients.values()).slice(0, 20);
    }, [clients, clientSearch]);

    const selectedClientData = selectedClient;
    const selectedPetData = selectedClient?.pets?.find(p => p.id === selectedPetIds[0]);

    const getApplicableServices = (category: 'principal' | 'adicional') => {
        if (!selectedPetData) return [];
        const isPetCat = (selectedPetData.breed || '').toLowerCase().includes('gato');
        return services.filter(s => {
            const matchesCategory = s.category === category;
            const matchesSize = s.targetSize === 'Todos' || !s.targetSize || (selectedPetData.size && s.targetSize.toLowerCase().includes(selectedPetData.size.toLowerCase()));
            const matchesCoat = s.targetCoat === 'Todos' || !s.targetCoat || (selectedPetData.coat && s.targetCoat.toLowerCase().includes(selectedPetData.coat.toLowerCase()));
            const isServiceForCat = s.name.toLowerCase().includes('gato') || s.name.toLowerCase().includes('felino');
            if (isServiceForCat && !isPetCat) return false;
            return matchesCategory && matchesSize && matchesCoat;
        });
    };
    const navigate = (direction: 'prev' | 'next') => {
        setSlideDirection(direction === 'next' ? 'right' : 'left');
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };

    const getLayout = useCallback((dayApps: Appointment[]) => {
        const sorted = [...dayApps].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const nodes = sorted.map(app => { const start = new Date(app.date).getTime(); const end = start + (app.durationTotal || 60) * 60000; return { app, start, end }; });
        const clusters: typeof nodes[] = [];
        if (nodes.length > 0) {
            let currentCluster = [nodes[0]];
            let clusterEnd = nodes[0].end;
            for (let i = 1; i < nodes.length; i++) {
                if (nodes[i].start < clusterEnd) { currentCluster.push(nodes[i]); clusterEnd = Math.max(clusterEnd, nodes[i].end); } else { clusters.push(currentCluster); currentCluster = [nodes[i]]; clusterEnd = nodes[i].end; }
            }
            clusters.push(currentCluster);
        }
        const layoutResult: { app: Appointment, left: string, width: string, zIndex: number, topOffset: number, index: number, totalCount: number }[] = [];
        clusters.forEach(cluster => {
            cluster.forEach((node, index) => {
                const count = cluster.length;
                const isStack = count > 1;
                layoutResult.push({ app: node.app, left: isStack ? `${index * 15}%` : '0%', width: isStack ? '85%' : '100%', zIndex: 10 + index, topOffset: 0, index: index, totalCount: count });
            });
        });
        return layoutResult;
    }, []);

    const AppointmentCard = ({ app, style, onClick, onContext, stackIndex, stackTotal }: { app: Appointment, style: any, onClick: any, onContext: any, stackIndex?: number, stackTotal?: number }) => {
        const client = clients.find(c => c.id === app.clientId); const pet = client?.pets?.find(p => p.id === app.petId); const mainSvc = services.find(srv => srv.id === app.serviceId); const addSvcs = app.additionalServiceIds?.map((id: string) => services.find(s => s.id === id)).filter((x): x is Service => !!x) || []; const allServiceNames = [mainSvc?.name, ...addSvcs.map(s => s.name)].filter(n => n).join(' ').toLowerCase();
        let colorClass = 'bg-blue-100 border-blue-200 text-blue-900';
        if (allServiceNames.includes('tosa normal')) colorClass = 'bg-orange-100 border-orange-200 text-orange-900';
        else if (allServiceNames.includes('tosa higi') || allServiceNames.includes('tosa higienica') || allServiceNames.includes('higi')) colorClass = 'bg-yellow-100 border-yellow-200 text-yellow-900';
        else if (allServiceNames.includes('tesoura')) colorClass = 'bg-pink-100 border-pink-200 text-pink-900';
        else if (allServiceNames.includes('pacote') && allServiceNames.includes('quinzenal')) colorClass = 'bg-indigo-100 border-indigo-200 text-indigo-900';
        else if (allServiceNames.includes('pacote') && allServiceNames.includes('mensal')) colorClass = 'bg-purple-100 border-purple-200 text-purple-900';

        let starsValues: number[] = [];
        const petApps = appointments.filter(a => a.petId === app.petId && a.rating);
        if (petApps.length > 0) starsValues = petApps.map(a => a.rating || 0);
        const avgRating = starsValues.length > 0 ? starsValues.reduce((a, b) => a + b, 0) / starsValues.length : 0;

        return (
            <div style={style} className={`animate-pop absolute rounded-lg p-1.5 border shadow-sm ${colorClass} text-xs cursor-pointer btn-spring hover:shadow-md hover:scale-[1.05] hover:z-[100] transition-all overflow-hidden flex flex-col justify-start leading-none group min-w-[200px]`} onClick={(e) => { e.stopPropagation(); onClick(app); }} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContext(e, app.id); }}>
                <div className="flex justify-between items-center mb-1 w-full"><span className="font-bold truncate text-[11px] flex-1">{client?.name.split(' ')[0]} - {pet?.name}</span>{avgRating > 0 && <div className="flex bg-white/60 px-1 rounded-md items-center ml-1"><Star size={8} className="fill-yellow-500 text-yellow-500" /><span className="text-[9px] font-bold ml-0.5 text-yellow-700">{avgRating.toFixed(1)}</span></div>}</div>
                <div className="flex flex-col gap-0.5 opacity-90 w-full">{mainSvc && <div className="truncate font-semibold text-[10px]">{mainSvc.name}</div>}{addSvcs.length > 0 && (<div className="flex flex-wrap gap-1">{addSvcs.map((s, i) => <span key={i} className="bg-white/40 px-1 rounded-[3px] text-[8px] truncate max-w-[80px]">{s.name}</span>)}</div>)}</div>
            </div>
        );
    };

    const renderDayView = () => {
        const animationClass = slideDirection === 'right' ? 'animate-slide-right' : slideDirection === 'left' ? 'animate-slide-left' : '';
        const dateStr = currentDate.toISOString().split('T')[0]; const dayApps = appointments.filter(a => a.date.startsWith(dateStr) && a.status !== 'cancelado'); const layoutItems = getLayout(dayApps);
        return (
            <div key={dateStr} className={`relative h-[1440px] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex mx-1 ${animationClass}`}>
                <div className="w-14 bg-gray-50/50 backdrop-blur-sm border-r border-gray-100 flex-shrink-0 sticky left-0 z-10 flex flex-col"> {Array.from({ length: 12 }, (_, i) => i + 8).map(h => (<div key={h} className="flex-1 border-b border-gray-100 text-[10px] text-gray-400 font-bold p-2 text-right relative"> <span className="-top-2.5 relative">{h}:00</span> </div>))} </div>
                <div className="flex-1 relative bg-[repeating-linear-gradient(0deg,transparent,transparent_119px,rgba(243,244,246,0.6)_120px)] overflow-x-auto"> {Array.from({ length: 60 }, (_, i) => i).map(i => <div key={i} className="absolute w-full border-t border-gray-50" style={{ top: i * 20 }} />)}
                    <div className="absolute top-0 right-0 h-full w-[60px] pointer-events-none z-50 flex flex-col items-end">
                        {layoutItems.filter((item: any) => item.index === 0 && item.totalCount > 2).map((item: any) => {
                            const startMin = (new Date(item.app.date).getHours() - 8) * 60 + new Date(item.app.date).getMinutes();
                            return (<div key={`overflow-${item.app.id}`} className="absolute right-1 bg-red-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-0.5 animate-pulse" style={{ top: `${startMin * 2 + 5}px` }}>+{item.totalCount - 2} <ChevronRight size={10} /></div>);
                        })}
                    </div>
                    {layoutItems.map((item: any, idx) => {
                        const app = item.app; const d = new Date(app.date); const startMin = (d.getHours() - 8) * 60 + d.getMinutes(); const height = (app.durationTotal || 60) * 2; const top = startMin * 2;
                        return (<AppointmentCard key={app.id} app={app} style={{ animationDelay: `${idx * 0.02}s`, top: `${top}px`, height: `${height}px`, left: item.left, width: item.width, zIndex: item.zIndex }} onClick={setDetailsApp} onContext={(e: any, id: string) => setContextMenu({ x: e.clientX, y: e.clientY, appId: id })} />);
                    })}
                    {nowMinutes >= 0 && nowMinutes <= 720 && (
                        <div className="absolute w-full border-t-2 border-red-500 border-dashed opacity-70 pointer-events-none z-20 flex items-center" style={{ top: `${nowMinutes * 2}px` }}><div className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-r shadow-sm absolute -top-2.5 left-0">Agora</div><div className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 -right-1" /></div>
                    )}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const start = new Date(currentDate); start.setDate(start.getDate() - start.getDay()); const days = [2, 3, 4, 5, 6];
        return (
            <div className="flex h-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex-col mx-1">
                <div className="flex border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm"> <div className="w-10 bg-transparent border-r border-gray-100"></div> {days.map(dIdx => { const d = new Date(start); d.setDate(d.getDate() + dIdx); const dateStr = d.toISOString().split('T')[0]; const isToday = dateStr === new Date().toISOString().split('T')[0]; return (<div key={dIdx} onClick={() => setSelectedDayForDetails(dateStr)} className={`flex-1 text-center py-3 text-xs font-bold border-r border-gray-100 cursor-pointer hover:bg-brand-50/30 transition-colors ${isToday ? 'bg-brand-50/50 text-brand-600' : 'text-gray-500'}`}> {d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()} <div className={`text-sm mt-0.5 ${isToday ? 'text-brand-700' : 'text-gray-800'}`}>{d.getDate()}</div> </div>) })} </div>
                <div className="flex-1 overflow-y-auto relative flex"> <div className="w-10 bg-gray-50/30 border-r border-gray-100 flex-shrink-0 sticky left-0 z-10"> {Array.from({ length: 12 }, (_, i) => i + 8).map(h => (<div key={h} className="h-[120px] border-b border-gray-100 text-[9px] text-gray-400 font-bold p-1 text-right relative bg-gray-50/30"> <span className="-top-2 relative">{h}</span> </div>))} </div> {days.map(dIdx => {
                    const d = new Date(start); d.setDate(d.getDate() + dIdx); const dateStr = d.toISOString().split('T')[0];
                    const dayApps = appointments.filter(a => a.date.startsWith(dateStr) && a.status !== 'cancelado');
                    const clusters: { start: number, end: number, apps: Appointment[] }[] = [];
                    dayApps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(app => {
                        const appStart = (new Date(app.date).getHours() - 8) * 60 + new Date(app.date).getMinutes();
                        const appEnd = appStart + (app.durationTotal || 60);
                        const existing = clusters.find(c => (appStart >= c.start && appStart < c.end) || (appStart <= c.start && appEnd > c.start));
                        if (existing) { existing.apps.push(app); existing.end = Math.max(existing.end, appEnd); } else { clusters.push({ start: appStart, end: appEnd, apps: [app] }); }
                    });
                    return (
                        <div key={dIdx} className="flex-1 border-r border-gray-50 relative min-w-[60px]">
                            {Array.from({ length: 60 }, (_, i) => i).map(i => <div key={i} className="absolute w-full border-t border-gray-50" style={{ top: i * 20 }} />)}
                            {clusters.map((cluster, idx) => {
                                const mainApp = cluster.apps[0]; const count = cluster.apps.length; const top = cluster.start * 2; const height = (cluster.end - cluster.start) * 2;
                                return (
                                    <div key={mainApp.id} style={{ top: `${top}px`, height: `${height}px`, width: '95%', left: '2.5%' }} className="absolute z-10 transition-all hover:z-20">
                                        <AppointmentCard app={mainApp} style={{ width: '100%', height: '100%' }} onClick={setDetailsApp} onContext={(e: any, id: string) => setContextMenu({ x: e.clientX, y: e.clientY, appId: id })} />
                                        {count > 1 && (<div className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pop z-50 border-2 border-white" title={`${count} agendamentos neste horário`}>+{count - 1}</div>)}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })} </div>
            </div>
        )
    }

    const renderMonthView = () => {
        const year = currentDate.getFullYear(); const month = currentDate.getMonth(); const firstDay = new Date(year, month, 1); const startDay = firstDay.getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const slots = []; for (let i = 0; i < startDay; i++) slots.push(null); for (let i = 1; i <= daysInMonth; i++) slots.push(new Date(year, month, i));
        return (<div className="h-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col mx-1"> <div className="grid grid-cols-7 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200"> {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>)} </div> <div className="flex-1 grid grid-cols-7 auto-rows-fr"> {slots.map((date, idx) => { if (!date) return <div key={`empty-${idx}`} className="bg-gray-50/30 border-b border-r border-gray-100" />; const dateStr = date.toISOString().split('T')[0]; const isToday = dateStr === new Date().toISOString().split('T')[0]; const dayApps = appointments.filter(a => a.date.startsWith(dateStr) && a.status !== 'cancelado').sort((a, b) => a.date.localeCompare(b.date)); return (<div key={idx} className={`border-b border-r border-gray-100 p-1 flex flex-col transition-colors cursor-pointer hover:bg-brand-50/30 ${isToday ? 'bg-orange-50/30' : ''}`} onClick={() => setSelectedDayForDetails(dateStr)}> <span className={`text-[10px] font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-brand-600 text-white shadow-md scale-110' : 'text-gray-500'}`}>{date.getDate()}</span> <div className="flex-1 overflow-hidden space-y-1"> {dayApps.slice(0, 3).map(app => (<div key={app.id} className="text-[9px] bg-white border border-gray-200 text-gray-700 rounded-md px-1.5 py-0.5 truncate font-medium shadow-sm"> {clients.find(c => c.id === app.clientId)?.pets?.find(p => p.id === app.petId)?.name} </div>))} {dayApps.length > 3 && <div className="text-[8px] text-gray-400 pl-1 font-medium">+ {dayApps.length - 3} mais</div>} </div> </div>) })} </div> </div>)
    };

    return (
        <div className="space-y-3 animate-fade-in relative h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 flex-shrink-0 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
                        <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all btn-spring ${viewMode === 'day' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Dia</button>
                        <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all btn-spring ${viewMode === 'week' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Semana</button>
                        <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all btn-spring ${viewMode === 'month' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Mês</button>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition"><ChevronLeft size={18} /></button>
                        <div className="relative min-w-[100px] text-center cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors group">
                            <span className="text-sm font-bold text-gray-800 group-hover:text-brand-600 block truncate">
                                {formatDateWithWeek(currentDate.toISOString().split('T')[0])}
                            </span>
                            <input type="date" value={currentDate.toISOString().split('T')[0]} onChange={(e) => { if (e.target.value) { const [y, m, d] = e.target.value.split('-').map(Number); setCurrentDate(new Date(y, m - 1, d)); } }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                        </div>
                        <button onClick={() => navigate('next')} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative overflow-hidden">
                {viewMode === 'day' && <div className="h-full overflow-y-auto">{renderDayView()}</div>}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
                {contextMenu && (
                    <div className="fixed bg-white shadow-xl border border-gray-200 rounded-xl z-[100] py-1 min-w-[160px] overflow-hidden" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <button onClick={() => handleStartEdit(appointments.find(a => a.id === contextMenu.appId)!)} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-3 text-gray-700 font-medium border-b border-gray-50"><Edit2 size={16} /> Editar</button>
                        <button onClick={handleDeleteFromContext} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm flex items-center gap-3 font-medium"><Trash2 size={16} /> Excluir</button>
                    </div>
                )}
            </div>

            {detailsApp && createPortal((() => {
                const client = clients.find(c => c.id === detailsApp.clientId);
                const pet = client?.pets?.find(p => p.id === detailsApp.petId);
                const s = services.find(srv => srv.id === detailsApp.serviceId);
                const addSvcs = detailsApp.additionalServiceIds?.map(id => services.find(srv => srv.id === id)).filter(x => x);
                const rating = detailsApp.rating;
                const tags = detailsApp.ratingTags;
                return (
                    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDetailsApp(null)}>
                        <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setDetailsApp(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><X size={20} /></button>
                            {(rating || tags) && (
                                <div className="flex justify-center flex-col items-center mb-6 bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100">
                                    <div className="flex text-yellow-500 mb-2 drop-shadow-sm">{[1, 2, 3, 4, 5].map(st => <Star key={st} size={24} className={(rating || 0) >= st ? "fill-current" : "text-gray-200"} strokeWidth={(rating || 0) >= st ? 0 : 2} />)}</div>
                                    {tags && tags.length > 0 && (<div className="flex flex-wrap gap-2 justify-center">{tags.map(t => <span key={t} className="px-3 py-1 bg-white text-yellow-700 rounded-full text-xs font-bold shadow-sm border border-yellow-100">{t}</span>)}</div>)}
                                </div>
                            )}
                            <div className="mb-6 text-center"><h3 className="text-2xl font-bold text-gray-800">{pet?.name}</h3><p className="text-gray-500 font-medium">{client?.name}</p></div>
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm mb-6">
                                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Phone size={16} /></div><span className="font-medium text-gray-700">{client?.phone}</span></div>
                                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><MapPin size={16} /></div><span className="font-medium text-gray-700 truncate">{client?.address} {client?.complement}</span></div>
                                <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0"><FileText size={16} /></div><span className="font-medium italic text-gray-600 pt-1">{(() => { let displayNote = detailsApp.notes || pet?.notes || 'Sem obs'; displayNote = displayNote.replace(/\[Avaliação: \d+\/5\]/g, '').replace(/\[Tags: .*?\]/g, '').trim(); return displayNote || 'Sem obs'; })()}</span></div>
                            </div>
                            <div className="mb-6"><h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Serviços</h4><div className="flex flex-wrap gap-2"><span className="px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg text-xs font-bold shadow-sm">{s?.name}</span>{addSvcs?.map(as => <span key={as?.id} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">{as?.name}</span>)}</div></div>
                            <button onClick={() => { setDetailsApp(null); handleStartEdit(detailsApp); }} className="w-full py-3.5 bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-700 active:scale-95 transition shadow-lg shadow-brand-200"><Edit2 size={18} /> Editar Agendamento</button>
                        </div>
                    </div>
                );
            })(), document.body)}

            {isOpen && createPortal(
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end md:items-center justify-center md:p-6 backdrop-blur-sm animate-fade-in">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => { resetForm(); onClose(); }} />
                    <div className="bg-white relative z-10 md:rounded-3xl rounded-none w-full max-w-6xl h-[100dvh] md:h-[90vh] md:max-h-[800px] shadow-2xl flex flex-col overflow-hidden animate-scale-up ring-1 ring-black/5 font-sans">
                        <div className="px-5 py-4 md:px-8 md:py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                            <div><h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{editingAppId ? 'Editar Agendamento' : 'Novo Agendamento'}</h2><p className="text-xs md:text-sm text-gray-400 font-medium mt-0.5">Preencha os detalhes do serviço abaixo</p></div>
                            <button onClick={() => { resetForm(); onClose(); }} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all duration-300"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-gray-50/50">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto h-full">
                                <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100/80 flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center"><User size={20} /></div><h3 className="text-lg font-bold text-gray-800">Cliente & Pet</h3></div>
                                        <div className="space-y-6 flex-1">
                                            <div className="relative group z-30">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Buscar Cliente</label>
                                                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} /><input type="text" placeholder="Nome, telefone ou pet..." value={clientSearch} onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); setSelectedPetIds([]); }} className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-2xl text-sm font-semibold text-gray-700 outline-none transition-all placeholder:font-normal placeholder:text-gray-400" /></div>
                                                {clientSearch && !selectedClient && (
                                                    <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-2xl mt-2 border border-gray-100 max-h-64 overflow-y-auto custom-scrollbar animate-slide-up-sm">
                                                        {filteredClients.length > 0 ? (filteredClients.map(c => (<div key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(c.name); }} className="p-4 hover:bg-brand-50/30 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group/item"><div className="flex justify-between items-center mb-1"><span className="font-bold text-gray-800 group-hover/item:text-brand-700 transition-colors">{c.name}</span><span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{c.phone}</span></div><div className="flex gap-2 flex-wrap mt-1.5">{c.pets.slice(0, 5).map(p => (<span key={p.id} className="text-[11px] bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-md font-bold shadow-sm">{p.name}</span>))}</div></div>))) : (<div className="p-8 text-center text-gray-400 text-sm font-medium flex flex-col items-center gap-2"><AlertCircle size={24} className="opacity-20" />Nenhum cliente encontrado</div>)}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedClient && (
                                                <div className="animate-fade-in space-y-6">
                                                    <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100 flex items-start gap-4"><div className="w-12 h-12 rounded-full bg-white text-brand-600 flex items-center justify-center font-bold text-lg shadow-sm">{selectedClient.name[0]}</div><div><h4 className="font-bold text-gray-900">{selectedClient.name}</h4><div className="flex items-center gap-2 text-xs text-gray-500 mt-1"><Phone size={12} /> {selectedClient.phone}</div><div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5"><MapPin size={12} /> {selectedClient.address || 'Sem endereço'}</div></div><button onClick={() => { setSelectedClient(null); setSelectedPetIds([]); setClientSearch(''); }} className="ml-auto text-gray-400 hover:text-red-500 transition"><X size={16} /></button></div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block ml-1">Selecionar Pet</label>
                                                        <div className="space-y-2">
                                                            {selectedClient.pets.map(p => {
                                                                const pApps = appointments.filter(a => a.petId === p.id && a.rating);
                                                                const pAvg = pApps.length > 0 ? pApps.reduce((acc, curr) => acc + (curr.rating || 0), 0) / pApps.length : 0;
                                                                return (
                                                                    <div key={p.id} onClick={() => { if (selectedPetIds.includes(p.id)) { setSelectedPetIds(prev => prev.filter(id => id !== p.id)); } else { setSelectedPetIds(prev => [...prev, p.id]); } }} className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${selectedPetIds.includes(p.id) ? 'border-brand-500 bg-brand-50 shadow-md transform scale-[1.02]' : 'border-gray-100 hover:border-brand-200 bg-white hover:bg-gray-50'}`}>
                                                                        <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedPetIds.includes(p.id) ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-100 group-hover:text-brand-500'}`}><User size={18} /></div><div><div className="flex items-center gap-2"><h5 className={`font-bold text-sm ${selectedPetIds.includes(p.id) ? 'text-brand-900' : 'text-gray-700'}`}>{p.name}</h5>{pAvg > 0 && (<div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100"><Star size={10} className="fill-yellow-400 text-yellow-400" /><span className="text-[10px] font-bold text-yellow-600">{pAvg.toFixed(1)}</span></div>)}</div><p className="text-xs text-gray-500 font-medium">{p.breed} • {p.size || '?'} • {p.coat || '?'}</p></div></div>
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPetIds.includes(p.id) ? 'border-brand-500 bg-brand-500' : 'border-gray-200'}`}>{selectedPetIds.includes(p.id) && <Check size={12} className="text-white" strokeWidth={4} />}</div>
                                                                    </div>
                                                                );
                                                            })}
                                                            <button className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-xs hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-all flex items-center justify-center gap-2"><Plus size={16} /> Adicionar Novo Pet</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-7 space-y-6 flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100/80 p-6 relative">
                                    {!selectedPetIds.length && (<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl"><div className="text-gray-400 font-medium flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100"><ArrowRightLeft size={16} /> Selecione pelo menos um pet</div></div>)}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2 text-gray-800 font-bold"><div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><CalendarIcon size={16} /></div><h3>Data e Hora</h3></div>
                                            <div className="space-y-3">
                                                <div className="relative"><label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all" /></div>
                                                <div className="relative"><label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Horário</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all" /></div>
                                                <div className="relative"><label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Duração Estimada</label><select value={manualDuration} onChange={e => setManualDuration(Number(e.target.value))} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"><option value={0}>Automático (Soma dos serviços)</option>{Array.from({ length: 10 }, (_, i) => (i + 1) * 30).map(min => { const h = Math.floor(min / 60); const m = min % 60; const label = h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}` : `${m}min`; return <option key={min} value={min}>{label}</option>; })}</select></div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2 text-gray-800 font-bold"><div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><Scissors size={16} /></div><h3>Serviços</h3></div>
                                            <div className="space-y-4">
                                                <div className="relative"><label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Serviço Principal</label><select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer hover:bg-white"><option value="">Selecione...</option>{getApplicableServices('principal').map(s => (<option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>))}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} /></div>
                                                <div>
                                                    {selectedAddServices.length > 0 && (<div className="flex flex-wrap gap-2 mb-3">{selectedAddServices.map(id => { const s = services.find(srv => srv.id === id); if (!s) return null; return (<div key={id} className="flex items-center gap-1 pl-3 pr-1 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-200 shadow-sm animate-scale-up-sm"><span>{s.name}</span><span className="opacity-60 text-[10px]">+R${s.price}</span><button onClick={() => setSelectedAddServices(prev => prev.filter(pid => pid !== id))} className="p-1 hover:bg-white/50 rounded-md transition-colors text-purple-800"><X size={12} /></button></div>); })}</div>)}
                                                    <div className="relative"><label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Adicionar Extra</label><select value="" onChange={e => { if (e.target.value) { setSelectedAddServices(prev => [...prev, e.target.value]); } }} className="w-full pt-6 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer hover:bg-white"><option value="">Selecione para adicionar...</option>{(() => { const available = getApplicableServices('adicional').filter(s => !selectedAddServices.includes(s.id)); const uniqueAvailable = Array.from(new Map(available.map(s => [s.name, s])).values()); return uniqueAvailable.map(s => (<option key={s.id} value={s.id}>{s.name} (+R$ {s.price})</option>)); })()}</select><Plus className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} /></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 mb-2 text-gray-800 font-bold"><div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><FileText size={16} /></div><h3>Observações</h3></div>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full flex-1 bg-yellow-50/50 hover:bg-yellow-50 border border-yellow-100 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 rounded-2xl p-4 text-sm outline-none transition-all resize-none font-medium text-gray-700 placeholder:text-gray-400 leading-relaxed" placeholder="Detalhes especiais, alergias, comportamento..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-white z-20 flex justify-between items-center">
                            <div className="hidden md:block">
                                {selectedService && (
                                    <div className="text-right"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Estimado</span><span className="text-2xl font-black text-brand-600">R$ {((services.find(s => s.id === selectedService)?.price || 0) + selectedAddServices.reduce((acc, id) => acc + (services.find(s => s.id === id)?.price || 0), 0)).toFixed(2)}</span></div>
                                )}
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <button onClick={() => { resetForm(); onClose(); }} className="flex-1 md:flex-none px-8 py-4 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors text-sm">Cancelar</button>
                                <button onClick={handleSave} disabled={!selectedClient || selectedPetIds.length === 0 || !selectedService} className="flex-1 md:flex-none px-10 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-200 hover:shadow-brand-300 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"><Check size={20} strokeWidth={3} /> Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}

            {selectedDayForDetails && createPortal(<DayDetailsModal isOpen={!!selectedDayForDetails} onClose={() => setSelectedDayForDetails(null)} date={selectedDayForDetails || ''} appointments={appointments.filter(a => a.date.startsWith(selectedDayForDetails || '') && a.status !== 'cancelado')} clients={clients} services={services} />, document.body)}
        </div>
    );
};
