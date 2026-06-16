export type UserRole = 'hotel' | 'driver' | 'supervisor';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    phone?: string;
    avatar?: string;
    /** ID du Client (hôtel) associé — uniquement si role === 'hotel'. */
    clientId?: string | null;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
