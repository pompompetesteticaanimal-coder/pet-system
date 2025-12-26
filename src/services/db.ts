
import { supabase } from './supabaseClient';
import { Client, Service, Appointment, CostItem } from '../types';

export const db = {
    // --- HELPERS for Mapping ---
    // Supabase uses snake_case, App uses camelCase.

    // --- CLIENTS ---
    getClients: async (): Promise<Client[]> => {
        const { data, error } = await supabase.from('clients').select('*');
        if (error) throw error;
        // Map created_at -> createdAt
        return (data || []).map((c: any) => ({
            ...c,
            createdAt: c.created_at,
            // Access pets directly from JSON column. No explicit parse needed if column is jsonb.
        }));
    },

    addClient: async (client: Client) => {
        // Map createdAt -> created_at
        const { createdAt, ...rest } = client;
        const dbClient = { ...rest, created_at: createdAt };

        const { error } = await supabase.from('clients').insert(dbClient);
        if (error) throw error;
    },

    updateClient: async (client: Client) => {
        const { createdAt, ...rest } = client;
        const dbClient = { ...rest, created_at: createdAt };
        const { error } = await supabase.from('clients').update(dbClient).eq('id', client.id);
        if (error) throw error;
    },

    deleteClient: async (id: string) => {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
    },

    // --- SERVICES ---
    getServices: async (): Promise<Service[]> => {
        const { data, error } = await supabase.from('services').select('*');
        if (error) throw error;
        // Map snake_case -> camelCase
        return (data || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            durationMin: s.duration_min,
            description: s.description,
            category: s.category,
            targetSize: s.target_size,
            targetCoat: s.target_coat
        }));
    },

    addService: async (service: Service) => {
        // Map camelCase -> snake_case
        const dbService = {
            id: service.id,
            name: service.name,
            price: service.price,
            duration_min: service.durationMin,
            description: service.description,
            category: service.category,
            target_size: service.targetSize,
            target_coat: service.targetCoat
        };
        const { error } = await supabase.from('services').insert(dbService);
        if (error) throw error;
    },

    updateService: async (service: Service) => {
        const dbService = {
            id: service.id,
            name: service.name,
            price: service.price,
            duration_min: service.durationMin,
            description: service.description,
            category: service.category,
            target_size: service.targetSize,
            target_coat: service.targetCoat
        };
        const { error } = await supabase.from('services').update(dbService).eq('id', service.id);
        if (error) throw error;
    },

    deleteService: async (id: string) => {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
    },

    // --- APPOINTMENTS ---
    getAppointments: async (): Promise<Appointment[]> => {
        const { data, error } = await supabase.from('appointments').select('*');
        if (error) throw error;
        // Map snake_case -> camelCase
        return (data || []).map((a: any) => ({
            id: a.id,
            clientId: a.client_id,
            petId: a.pet_id,
            serviceId: a.service_id,
            additionalServiceIds: a.additional_service_ids,
            date: a.date,
            status: a.status,
            notes: a.notes,
            durationTotal: a.duration_total,
            paidAmount: a.paid_amount,
            paymentMethod: a.payment_method,
            rating: a.rating,
            ratingTags: a.rating_tags,
            paymentStatus: a.payment_status
            // googleEventId not present in DB currently
        }));
    },

    addAppointment: async (app: Appointment) => {
        // Map camelCase -> snake_case
        const dbApp = {
            id: app.id,
            client_id: app.clientId,
            pet_id: app.petId,
            service_id: app.serviceId,
            additional_service_ids: app.additionalServiceIds,
            date: app.date,
            status: app.status,
            notes: app.notes,
            duration_total: app.durationTotal,
            paid_amount: app.paidAmount,
            paid_amount: app.paidAmount,
            payment_method: app.paymentMethod,
            rating: app.rating,
            rating_tags: app.ratingTags,
            payment_status: app.paymentStatus
        };
        const { error } = await supabase.from('appointments').insert(dbApp);
        if (error) throw error;
    },

    updateAppointment: async (app: Appointment) => {
        const dbApp = {
            client_id: app.clientId,
            pet_id: app.petId,
            service_id: app.serviceId,
            additional_service_ids: app.additionalServiceIds,
            date: app.date,
            status: app.status,
            notes: app.notes,
            duration_total: app.durationTotal,
            paid_amount: app.paidAmount,
            payment_method: app.paymentMethod,
            rating: app.rating,
            rating_tags: app.ratingTags,
            payment_status: app.paymentStatus
        };
        const { error } = await supabase.from('appointments').update(dbApp).eq('id', app.id);
        if (error) throw error;
    },

    deleteAppointment: async (id: string) => {
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) throw error;
    },

    // --- COSTS ---
    // Costs match (almost), but checking types
    getCosts: async (): Promise<CostItem[]> => {
        const { data, error } = await supabase.from('costs').select('*');
        if (error) throw error;
        return data || [];
    },

    addCost: async (cost: CostItem) => {
        const { error } = await supabase.from('costs').insert(cost);
        if (error) throw error;
    },

    deleteCost: async (id: string) => {
        const { error } = await supabase.from('costs').delete().eq('id', id);
        if (error) throw error;
    },

    // Legacy helpers removed for clarity
};
