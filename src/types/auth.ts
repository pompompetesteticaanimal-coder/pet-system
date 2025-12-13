
export type UserProfile = {
    id: string;
    email: string;
    business_name?: string;
    subscription_status?: 'active' | 'trial' | 'expired';
};

export type AuthState = {
    user: UserProfile | null;
    loading: boolean;
    initialized: boolean;
};
