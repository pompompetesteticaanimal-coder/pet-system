
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthState, UserProfile } from '../types/auth';

const AuthContext = createContext<AuthState & {
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    loginAsDemo: () => Promise<void>;
}>({
    user: null,
    loading: true,
    initialized: false,
    signInWithGoogle: async () => { },
    signOut: async () => { },
    loginAsDemo: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        initialized: false,
    });

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState(prev => ({
                ...prev,
                user: session?.user ? mapUser(session.user) : null,
                loading: false,
                initialized: true
            }));
        }).catch(err => {
            console.error("Auth initialization error:", err);
            setState(prev => ({ ...prev, loading: false, initialized: true }));
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState(prev => ({
                ...prev,
                user: session?.user ? mapUser(session.user) : null,
                loading: false,
            }));
        });

        return () => subscription.unsubscribe();
    }, []);

    const mapUser = (u: any): UserProfile => ({
        id: u.id,
        email: u.email!,
        business_name: u.user_metadata?.business_name,
    });

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    };

    const loginAsDemo = async () => {
        setState({
            user: {
                id: 'demo-user-id',
                email: 'demo@petapp.com',
                business_name: 'Pet Shop Demo'
            },
            loading: false,
            initialized: true
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setState({ user: null, loading: false, initialized: true });
    };

    return (
        <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut, loginAsDemo }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
