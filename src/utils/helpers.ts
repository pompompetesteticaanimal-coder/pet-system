
import { Appointment, Service } from '../types';

export const formatDateWithWeek = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    // Custom format to avoid ".,"
    const w = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const dStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${w.charAt(0).toUpperCase() + w.slice(1)}, ${dStr}`;
};

export const calculateTotal = (app: Appointment, services: Service[]) => {
    if (app.status === 'cancelado' || app.status === 'nao_veio') return 0;

    // Use actual paid amount if available (even without method, to catch imports/manual edits)
    if (app.paidAmount !== undefined && app.paidAmount > 0) {
        return app.paidAmount;
    }

    const mainSvc = services.find(s => s.id === app.serviceId);
    let total = mainSvc?.price || 0;
    app.additionalServiceIds?.forEach(id => {
        const s = services.find(srv => srv.id === id);
        if (s) total += s.price;
    });
    return total;
};
