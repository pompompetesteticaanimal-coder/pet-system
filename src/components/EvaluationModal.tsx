import React, { useState } from 'react';
import { Star, X, Tag } from 'lucide-react';
import { createPortal } from 'react-dom';

interface EvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (rating: number, tags: string[], notes: string) => void;
    clientName?: string;
    petName?: string;
}

const AVAILABLE_TAGS = [
    'Dócil', 'Agitado', 'Morde', 'Atrasado', 'Matou horário',
    'Pêlo embolado', 'Cheio de nós', 'Pulgas/Carrapatos', 'Exigente'
];

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ isOpen, onClose, onSave, clientName, petName }) => {
    const [rating, setRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSave = () => {
        onSave(rating, selectedTags, notes);
        // Reset state after save? OR let parent handle it. 
        // Usually better to keep state until closed or saved.
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up border border-gray-100">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6 mt-2">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Avaliação do Cliente</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">
                        {clientName} • <span className="text-brand-600">{petName}</span>
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comportamento do Pet</span>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none hover:scale-110 transition-transform p-1"
                                >
                                    <Star
                                        size={32}
                                        className={`${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} transition-colors`}
                                        strokeWidth={rating >= star ? 0 : 2}
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="text-xs font-bold text-brand-600 h-4">
                            {rating === 1 && 'Difícil / Agressivo'}
                            {rating === 2 && 'Trabalhoso'}
                            {rating === 3 && 'Normal'}
                            {rating === 4 && 'Tranquilo'}
                            {rating === 5 && 'Muito Dócil / Exemplar'}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">Observações Rápidas (Tags)</span>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${selectedTags.includes(tag)
                                        ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">Outras Observações</span>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Digite alguma observação extra..."
                            rows={3}
                            className="w-full bg-gray-50/50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 ring-brand-200 outline-none transition-all resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={rating === 0}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-brand-200 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale mb-2"
                    >
                        Confirmar Avaliação
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
