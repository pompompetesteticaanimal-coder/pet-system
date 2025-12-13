
import React, { useState } from 'react';
import { BarChart2, Tag } from 'lucide-react';
import {
    ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts'; // Assuming recharts is installed
import { CostItem } from '../types';

export const CostsView: React.FC<{ costs: CostItem[] }> = ({ costs }) => {
    const isOperationalCost = (c: CostItem) => {
        const cat = c.category?.toLowerCase() || '';
        return cat !== 'sócio' && cat !== 'socio' && !cat.includes('extraordinário') && !cat.includes('extraordinario');
    };
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('yearly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const filterCosts = () => {
        if (viewMode === 'monthly') { const [y, m] = selectedMonth.split('-'); return costs.filter(c => { const d = new Date(c.date); return d.getFullYear() === parseInt(y) && d.getMonth() === (parseInt(m) - 1); }); }
        return costs.filter(c => new Date(c.date).getFullYear() === selectedYear);
    };
    const allFilteredCosts = filterCosts();
    const filteredCosts = allFilteredCosts.filter(isOperationalCost);
    const personalCosts = allFilteredCosts.filter(c => !isOperationalCost(c));

    const totalCost = filteredCosts.reduce((acc, c) => acc + c.amount, 0);
    const totalPersonal = personalCosts.reduce((acc, c) => acc + c.amount, 0);
    const paidCost = filteredCosts.filter(c => c.status && c.status.toLowerCase() === 'pago').reduce((acc, c) => acc + c.amount, 0);
    const pendingCost = filteredCosts.filter(c => !c.status || c.status.toLowerCase() !== 'pago').reduce((acc, c) => acc + c.amount, 0);

    const getCostByCategory = () => { const counts: Record<string, number> = {}; filteredCosts.forEach(c => { const cat = c.category || 'Outros'; counts[cat] = (counts[cat] || 0) + c.amount; }); const sorted = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); const top5 = sorted.slice(0, 5); const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0); if (others > 0) top5.push({ name: 'Outros', value: others }); return top5; };
    const getCostByMonth = () => { const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']; const data = Array(12).fill(0).map((_, i) => ({ name: monthNames[i], value: 0 })); const yearCosts = costs.filter(c => new Date(c.date).getFullYear() === selectedYear && isOperationalCost(c)); yearCosts.forEach(c => { const d = new Date(c.date); if (!isNaN(d.getTime())) data[d.getMonth()].value += c.amount; }); const startIdx = selectedYear === 2025 ? 7 : 0; return data.slice(startIdx); };
    const PIE_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#64748b'];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold text-gray-800">Custo Mensal</h1><div className="flex bg-white rounded-lg p-1 border"><button onClick={() => setViewMode('monthly')} className={`px-4 py-1.5 text-xs font-bold rounded ${viewMode === 'monthly' ? 'bg-brand-600 text-white' : 'text-gray-600'}`}>Mês</button><button onClick={() => setViewMode('yearly')} className={`px-4 py-1.5 text-xs font-bold rounded ${viewMode === 'yearly' ? 'bg-brand-600 text-white' : 'text-gray-600'}`}>Ano</button></div></div>
            <div className="flex items-center mb-6 bg-white p-3 rounded-xl border border-gray-200"><h2 className="text-lg font-bold text-gray-800 mr-4">Período:</h2>{viewMode === 'monthly' ? (<input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-gray-50 border p-2 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 ring-brand-100" />) : (<select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-gray-50 border p-2 rounded-lg text-sm font-bold text-gray-700 outline-none">{[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>)}</div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase">Custo Operacional</p>
                    <h3 className="text-2xl font-bold text-rose-600">R$ {totalCost.toFixed(2)}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase">Pago</p>
                    <h3 className="text-2xl font-bold text-green-600">R$ {paidCost.toFixed(2)}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase">Pendente</p>
                    <h3 className="text-2xl font-bold text-orange-600">R$ {pendingCost.toFixed(2)}</h3>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-100 flex flex-col justify-between">
                    <p className="text-xs font-bold text-purple-600 uppercase">Retiradas/Extras</p>
                    <h3 className="text-2xl font-bold text-purple-700">R$ {totalPersonal.toFixed(2)}</h3>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80"><h3 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2"><BarChart2 size={16} /> Evolução</h3><ResponsiveContainer width="100%" height="100%"><BarChart data={getCostByMonth()} margin={{ top: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(val) => `R$${val}`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 'auto']} /><Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} /><Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]}><LabelList dataKey="value" position="top" style={{ fontSize: 10, fill: '#e11d48' }} formatter={(val: number) => val > 0 ? `R$${val.toFixed(0)}` : ''} /></Bar></BarChart></ResponsiveContainer></div><div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80"><h3 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2"><Tag size={16} /> Categorias</h3><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={getCostByCategory()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">{getCostByCategory().map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} /><Legend layout="vertical" verticalAlign="middle" align="right" /></PieChart></ResponsiveContainer></div></div>
        </div>
    );
};
