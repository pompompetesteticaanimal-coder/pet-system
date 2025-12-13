
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { LogIn, UserPlus, Dog, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
    const { loginAsDemo } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Verifique seu email para confirmar o cadastro!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
                        <Dog size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">PetGestor SaaS</h1>
                    <p className="text-gray-500">{isSignUp ? 'Crie sua conta' : 'Acesse seu painel'}</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? 'Processando...' : isSignUp ? (
                            <> <UserPlus size={20} /> Cadastrar </>
                        ) : (
                            <> <LogIn size={20} /> Entrar </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-brand-600 font-medium hover:underline text-sm"
                    >
                        {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem conta? Cadastre-se'}
                    </button>

                    <div className="my-6 border-t border-gray-100 relative">
                        <span className="bg-white px-3 text-xs text-gray-400 absolute left-1/2 -translate-x-1/2 -top-2">Ou experimente</span>
                    </div>

                    <button
                        type="button"
                        onClick={loginAsDemo}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                        🚀 Entrar no Modo Demo
                    </button>
                </div>

                {import.meta.env.VITE_SUPABASE_URL?.includes('YOUR_SUPABASE') && (
                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg border border-yellow-100 flex items-start gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>Parece que o arquivo <code>.env</code> ainda não foi configurado corretamente (está com os valores padrão). Use o Modo Demo acima.</span>
                    </div>
                )}

                {/* Debug Info Section */}
                <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 mb-2 font-mono">Status da Configuração:</p>
                    <div className="text-[10px] text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-200 inline-block text-left">
                        <div>URL: {import.meta.env.VITE_SUPABASE_URL?.substring(0, 15)}...</div>
                        <div>Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Definida (OK)' : 'Requerida'}</div>
                        <div className="mt-1 text-red-500 font-bold">
                            {import.meta.env.VITE_SUPABASE_URL?.includes('YOUR_SUPABASE')
                                ? "⚠ Usando valores padrão (Inválido)"
                                : "✅ Configuração detectada"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
