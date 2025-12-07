
import { Client, Service, Appointment } from '../types';

const KEYS = {
  CLIENTS: 'petgestor_clients',
  SERVICES: 'petgestor_services',
  APPOINTMENTS: 'petgestor_appointments',
};

// Initial Seed Data
const seedClients: Client[] = [
  {
    id: '1',
    name: 'Ana Silva',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123',
    complement: 'Casa 2',
    pets: [{ 
      id: 'p1', 
      name: 'Rex', 
      breed: 'Golden Retriever', 
      age: '3 anos', 
      gender: 'Macho',
      size: 'Grande',
      coat: 'Longo',
      notes: 'Alergia a perfume' 
    }]
  },
  {
    id: '2',
    name: 'Carlos Souza',
    phone: '(11) 98888-8888',
    address: 'Av. Paulista, 1000',
    complement: 'Apto 45',
    pets: [{ 
      id: 'p2', 
      name: 'Mia', 
      breed: 'Gato', 
      age: '2 anos', 
      gender: 'Fêmea',
      size: 'Pequeno',
      coat: 'Curto',
      notes: 'Arisca' 
    }]
  }
];

// Helper to create services easily
const createSvc = (name: string, cat: 'principal'|'adicional', size: string, coat: string, price: number): Service => ({
    id: `svc_${name}_${size}_${coat}`.replace(/\s+/g, '').toLowerCase(),
    name, category: cat, targetSize: size, targetCoat: coat, price, durationMin: 60, description: `${name} (${size}/${coat})`
});

const seedServices: Service[] = [
    // --- PRINCIPAL: BANHO ---
    createSvc('Banho', 'principal', 'Pequeno', 'Curto', 50),
    createSvc('Banho', 'principal', 'Pequeno', 'Longo', 60),
    createSvc('Banho', 'principal', 'Médio', 'Curto', 80),
    createSvc('Banho', 'principal', 'Médio', 'Longo', 100),
    createSvc('Banho', 'principal', 'Grande', 'Curto', 100),
    createSvc('Banho', 'principal', 'Grande', 'Longo', 160),

    // --- PRINCIPAL: PACOTE 1 QUINZENAL ---
    createSvc('Pacote 1 Quinzenal', 'principal', 'Pequeno', 'Curto', 110),
    createSvc('Pacote 1 Quinzenal', 'principal', 'Pequeno', 'Longo', 120),
    createSvc('Pacote 1 Quinzenal', 'principal', 'Médio', 'Curto', 140),
    createSvc('Pacote 1 Quinzenal', 'principal', 'Médio', 'Longo', 120),
    createSvc('Pacote 1 Quinzenal', 'principal', 'Grande', 'Curto', 140),
    createSvc('Pacote 1 Quinzenal', 'principal', 'Grande', 'Longo', 150),

    // --- PRINCIPAL: PACOTE 1 MENSAL ---
    createSvc('Pacote 1 Mensal', 'principal', 'Pequeno', 'Curto', 180),
    createSvc('Pacote 1 Mensal', 'principal', 'Pequeno', 'Longo', 200),
    createSvc('Pacote 1 Mensal', 'principal', 'Médio', 'Curto', 220),
    createSvc('Pacote 1 Mensal', 'principal', 'Médio', 'Longo', 240),
    createSvc('Pacote 1 Mensal', 'principal', 'Grande', 'Curto', 280),
    createSvc('Pacote 1 Mensal', 'principal', 'Grande', 'Longo', 300),

    // --- PRINCIPAL: CONTROLE DE PACOTES ---
    // Pacote Quinzenal 1 (Cobranca igual quinzenal acima, ou avulso? Assumindo avulso tabela)
    createSvc('Pacote Quinzenal 1°', 'principal', 'Pequeno', 'Curto', 110), // Exemplo genérico P/C
    createSvc('Pacote Quinzenal 2°', 'principal', 'Todos', 'Todos', 0),

    // Pacote Mensal 1° Banho (Cobranca)
    createSvc('Pacote Mensal 1° Banho', 'principal', 'Pequeno', 'Curto', 180),
    createSvc('Pacote Mensal 1° Banho', 'principal', 'Pequeno', 'Longo', 200),
    createSvc('Pacote Mensal 1° Banho', 'principal', 'Médio', 'Curto', 220),
    createSvc('Pacote Mensal 1° Banho', 'principal', 'Médio', 'Longo', 240),
    createSvc('Pacote Mensal 1° Banho', 'principal', 'Grande', 'Curto', 280),
    createSvc('Pacote Mensal 1° Banho', 'principal', 'Grande', 'Longo', 300),

    // Pacote Mensal 2, 3, 4 (Baixa) - Valor Zero
    createSvc('Pacote Mensal 2° Banho', 'principal', 'Todos', 'Todos', 0),
    createSvc('Pacote Mensal 3° Banho', 'principal', 'Todos', 'Todos', 0),
    createSvc('Pacote Mensal 4° Banho', 'principal', 'Todos', 'Todos', 0),


    // --- ADICIONAIS: TOSA NORMAL ---
    createSvc('Tosa normal', 'adicional', 'Pequeno', 'Curto', 20),
    createSvc('Tosa normal', 'adicional', 'Pequeno', 'Longo', 20),
    createSvc('Tosa normal', 'adicional', 'Médio', 'Curto', 20),
    createSvc('Tosa normal', 'adicional', 'Médio', 'Longo', 40),
    createSvc('Tosa normal', 'adicional', 'Grande', 'Curto', 30),
    createSvc('Tosa normal', 'adicional', 'Grande', 'Longo', 40),

    // --- ADICIONAIS: TOSA TESOURA ---
    createSvc('Tosa tesoura', 'adicional', 'Pequeno', 'Curto', 30),
    createSvc('Tosa tesoura', 'adicional', 'Pequeno', 'Longo', 50),
    createSvc('Tosa tesoura', 'adicional', 'Médio', 'Curto', 40),
    createSvc('Tosa tesoura', 'adicional', 'Médio', 'Longo', 50),
    createSvc('Tosa tesoura', 'adicional', 'Grande', 'Curto', 40),
    createSvc('Tosa tesoura', 'adicional', 'Grande', 'Longo', 50),

    // --- ADICIONAIS: FIXOS ---
    createSvc('Corte de unha', 'adicional', 'Todos', 'Todos', 10),
    createSvc('Escovar dentes', 'adicional', 'Todos', 'Todos', 5),
    createSvc('Remoção de sub pele', 'adicional', 'Todos', 'Todos', 10),
    createSvc('Hidratação', 'adicional', 'Todos', 'Todos', 10),
    createSvc('Banho de ozônio', 'adicional', 'Todos', 'Todos', 10),
    createSvc('Desembolo', 'adicional', 'Todos', 'Todos', 10),

    // --- ADICIONAIS: TOSA HIGIÊNICA ---
    createSvc('Tosa higiênica', 'adicional', 'Pequeno', 'Todos', 10),
    createSvc('Tosa higiênica', 'adicional', 'Médio', 'Todos', 20),
    createSvc('Tosa higiênica', 'adicional', 'Grande', 'Todos', 20),
];

export const db = {
  getClients: (): Client[] => {
    const data = localStorage.getItem(KEYS.CLIENTS);
    return data ? JSON.parse(data) : seedClients;
  },
  saveClients: (clients: Client[]) => {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },
  getServices: (): Service[] => {
    const data = localStorage.getItem(KEYS.SERVICES);
    // Se não tiver dados salvos, usa a nova lista completa.
    // Se tiver, vamos forçar um merge ou reset para garantir que a nova estrutura entre.
    // Para simplificar: Se o usuário ainda estiver com os dados antigos de teste, substituímos.
    if (!data) return seedServices;
    const parsed = JSON.parse(data);
    if (parsed.length > 0 && !parsed[0].category) return seedServices; // Migração forçada
    return parsed;
  },
  saveServices: (services: Service[]) => {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
  },
  getAppointments: (): Appointment[] => {
    const data = localStorage.getItem(KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveAppointments: (appointments: Appointment[]) => {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }
};
