
import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Layout } from './src/components/Layout';
import { InactiveClientsView } from './src/components/InactiveClientsView';
import { PetDetailsModal } from './src/components/PetDetailsModal';
import PackageControlView from './src/components/PackageControlView';
import { MenuView } from './src/components/MenuView';
import { SettingsModal } from './src/components/SettingsModal';
import { RevenueView } from './src/components/RevenueView';
import { CostsView } from './src/components/CostsView';
import { PaymentManager } from './src/components/PaymentManager';
import { ClientManager } from './src/components/ClientManager';
import { AddClientModal } from './src/components/AddClientModal';
import { ServiceManager } from './src/components/ServiceManager';
import { ScheduleManager } from './src/components/ScheduleManager';

import { useAuth } from './src/contexts/AuthContext';
import { Login } from './src/pages/Login';
import { db } from './src/services/db';
import { Client, Service, Appointment, CostItem, Pet, AppSettings, ViewState } from './src/types';

const App: React.FC = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const [currentView, setCurrentView] = useState<ViewState>('home');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // Data State
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [costs, setCosts] = useState<CostItem[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ appName: 'PomPomPet', logoUrl: '', theme: 'rose', sidebarOrder: ['operacional', 'cadastros', 'gerencial'], darkMode: false });

    // UI State
    const [petDetailsData, setPetDetailsData] = useState<{ pet: Pet, client: Client, showReactivate?: boolean } | null>(null);
    const [preSelectedForSchedule, setPreSelectedForSchedule] = useState<{ client: Client, pet?: Pet } | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Initial Data Load (SaaS)
    useEffect(() => {
        if (!authLoading && user) {
            Promise.all([
                db.getClients(),
                db.getServices(),
                db.getAppointments(),
                db.getCosts()
            ]).then(([c, s, a, co]) => {
                setClients(c);
                setServices(s);
                setAppointments(a);
                setCosts(co);
            }).catch(e => console.error("Error loading data:", e));
        }
    }, [user, authLoading]);

    // Dark Mode Sync
    useEffect(() => {
        if (settings.darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        const themes: Record<string, string> = { rose: '#e11d48', blue: '#2563eb', purple: '#9333ea', green: '#16a34a', orange: '#ea580c' };
        document.documentElement.style.setProperty('--brand-600', themes[settings.theme] || themes.rose);
    }, [settings]);

    // --- Action Handlers (Wrapped around db calls) ---
    const handleDeleteClient = async (id: string) => {
        await db.deleteClient(id);
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const handleUpdateClient = async (updatedClient: Client) => {
        await db.updateClient(updatedClient);
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    };

    const handleAddService = async (service: Service) => {
        try {
            await db.addService(service);
        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
            alert("Aviso: Serviço salvo apenas localmente (Erro de conexão/banco).");
        }
        setServices(prev => [...prev, service]);
    };

    const handleDeleteService = async (id: string) => {
        try {
            await db.deleteService(id);
        } catch (error) {
            console.error("Erro ao excluir serviço:", error);
            alert("Aviso: Exclusão local. Falha ao excluir do banco.");
        }
        setServices(prev => prev.filter(s => s.id !== id));
    };

    const handleAddAppointment = async (appOrApps: Appointment | Appointment[], client: Client, pet: Pet, appServices: Service[], manualDuration: number) => {
        // Simplified version for SaaS (No Google Calendar Sync for now)
        const appsToAdd = Array.isArray(appOrApps) ? appOrApps : [appOrApps];
        for (const app of appsToAdd) {
            const totalDuration = manualDuration > 0 ? manualDuration : (appServices[0] ? appServices[0].durationMin : 60);
            const newApp = { ...app, durationTotal: totalDuration };

            try {
                await db.addAppointment(newApp);
            } catch (error) {
                console.error("Erro ao salvar agendamento:", error);
                alert("Aviso: Agendamento salvo localmente. Falha ao salvar na nuvem.");
            }

            setAppointments(prev => [...prev, newApp]);
        }
    };

    const handleEditAppointment = async (app: Appointment, client: Client, pet: Pet, appServices: Service[], manualDuration: number) => {
        const totalDuration = manualDuration > 0 ? manualDuration : (appServices[0] ? appServices[0].durationMin : 60);
        const updatedApp = { ...app, durationTotal: totalDuration };
        await db.updateAppointment(updatedApp);
        setAppointments(prev => prev.map(a => a.id === app.id ? updatedApp : a));
    };

    const handleUpdateStatus = async (appId: string, status: 'agendado' | 'concluido' | 'cancelado' | 'nao_veio') => {
        const updated = appointments.find(a => a.id === appId);
        if (updated) {
            const final = { ...updated, status };
            await db.updateAppointment(final);
            setAppointments(prev => prev.map(a => a.id === appId ? final : a));
        }
    };

    const handleAddClient = async (newClient: Client) => {
        try {
            await db.addClient(newClient);
        } catch (error) {
            console.error("Erro ao salvar no banco (possível Modo Demo ou conexão):", error);
            alert("Atenção: Não foi possível salvar no banco de dados (Online). O cliente será exibido apenas localmente enquanto você não recarregar a página.");
        }
        setClients(prev => [...prev, newClient]);
    };

    const handleDeleteAppointment = async (id: string) => {
        if (!confirm("Tem certeza?")) return;
        await db.deleteAppointment(id);
        setAppointments(prev => prev.filter(a => a.id !== id));
    };

    const handleRemovePayment = async (app: Appointment) => {
        const updated = { ...app, paidAmount: 0, paymentMethod: '' as any };
        await db.updateAppointment(updated);
        setAppointments(prev => prev.map(a => a.id === app.id ? updated : a));
    };

    const handleNoShow = async (app: Appointment) => {
        const updated = { ...app, status: 'nao_veio' as const };
        await db.updateAppointment(updated);
        setAppointments(prev => prev.map(a => a.id === app.id ? updated : a));
    };

    const handleReactivatePackage = (pet: Pet, client: Client) => {
        setPetDetailsData(null);
        setPreSelectedForSchedule({ client, pet });
        setIsScheduleModalOpen(true);
    };

    // --- RENDER ---

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" size={48} /></div>;
    if (!user) return <Login />;

    return (
        <HashRouter>
            <Layout
                currentView={currentView}
                setView={setCurrentView}
                user={user}
                onLogin={() => { }}
                onLogout={signOut}
                settings={settings}
                onOpenSettings={() => setIsSettingsOpen(true)}
                isLoading={false}
                onAddAppointment={() => setIsScheduleModalOpen(true)}
            >
                {currentView === 'home' && <RevenueView appointments={appointments} services={services} clients={clients} costs={costs} defaultTab="daily" onRemovePayment={handleRemovePayment} onNoShow={handleNoShow} onViewPet={(pet, client) => setPetDetailsData({ pet, client })} />}
                {currentView === 'revenue' && <RevenueView appointments={appointments} services={services} clients={clients} costs={costs} defaultTab="monthly" onRemovePayment={handleRemovePayment} onNoShow={handleNoShow} onViewPet={(pet, client) => setPetDetailsData({ pet, client })} />}
                {currentView === 'costs' && <CostsView costs={costs} />}
                {currentView === 'payments' && <PaymentManager appointments={appointments} clients={clients} services={services}
                    onUpdateAppointment={(app) => {
                        const client = clients.find(c => c.id === app.clientId);
                        const pet = client?.pets?.find(p => p.id === app.petId);
                        if (client && pet) handleEditAppointment(app, client, pet, [], 0);
                    }}
                    onRemovePayment={handleRemovePayment}
                    onNoShow={handleNoShow}
                    onViewPet={(pet, client) => setPetDetailsData({ pet, client })}
                />}
                {currentView === 'clients' && <ClientManager clients={clients} appointments={appointments} onDeleteClient={handleDeleteClient} onUpdateClient={handleUpdateClient} onAddClient={handleAddClient} />}
                {currentView === 'services' && <ServiceManager services={services} onAddService={handleAddService} onDeleteService={handleDeleteService} onSyncServices={() => { }} />}
                {currentView === 'schedule' && <ScheduleManager appointments={appointments} clients={clients} services={services} onAdd={handleAddAppointment} onEdit={handleEditAppointment} onUpdateStatus={handleUpdateStatus} onDelete={handleDeleteAppointment} isOpen={isScheduleModalOpen} onClose={() => { setIsScheduleModalOpen(false); setPreSelectedForSchedule(null); }} onOpen={() => setIsScheduleModalOpen(true)} preSelected={preSelectedForSchedule} onViewPet={(pet, client) => setPetDetailsData({ pet, client })} />}
                {currentView === 'menu' && <MenuView setView={setCurrentView} onOpenSettings={() => setIsSettingsOpen(true)} />}
                {currentView === 'inactive_clients' && <InactiveClientsView clients={clients} appointments={appointments} services={services} contactLogs={[]} onMarkContacted={() => { }} onBack={() => setCurrentView('menu')} onViewPet={(pet, client) => setPetDetailsData({ pet, client })} />}
                {currentView === 'packages' && <PackageControlView clients={clients} appointments={appointments} services={services} onViewPet={(pet, client, showReactivate) => setPetDetailsData({ pet, client, showReactivate })} />}
            </Layout>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={(s) => { setSettings(s); /* persist settings */ }} />
            <PetDetailsModal
                isOpen={!!petDetailsData}
                onClose={() => setPetDetailsData(null)}
                pet={petDetailsData?.pet || null}
                client={petDetailsData?.client || null}
                appointments={appointments}
                services={services}
                showReactivate={petDetailsData?.showReactivate}
                onReactivate={handleReactivatePackage}
            />
        </HashRouter>
    );
};

export default App;
