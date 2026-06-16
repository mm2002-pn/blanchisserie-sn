import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContextType, User } from '@/types/auth.types';
import {
  ApiError,
} from '@/services/api';
import {
  flushSession,
  loginRequest,
  logoutRequest,
  persistSession,
} from '@/services/auth.service';
import { STORAGE_KEYS, getItem } from '@/services/storage';
import { registerPushToken, unregisterPushToken } from '@/services/push.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUserFromStorage();
    }, []);

    const loadUserFromStorage = async () => {
        try {
            const [storedUser, storedToken] = await Promise.all([
                getItem(STORAGE_KEYS.USER),
                getItem(STORAGE_KEYS.ACCESS_TOKEN),
            ]);
            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser) as User);
                setToken(storedToken);
            }
        } catch (error) {
            console.error('Error loading user from storage:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<User> => {
        setIsLoading(true);
        try {
            const res = await loginRequest(email, password);
            const mapped = await persistSession(res);
            // Vide tout le cache avant de set le nouvel user pour eviter de voir
            // les donnees de la session precedente (scope clientId).
            queryClient.clear();
            setUser(mapped);
            setToken(res.accessToken);
            // Push token enregistré en arrière-plan, n'attend pas
            void registerPushToken();
            return mapped;
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.code === 'UNAUTHORIZED'
                        ? 'Email ou mot de passe incorrect'
                        : error.message
                    : error instanceof Error
                      ? error.message
                      : 'Erreur de connexion';
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await unregisterPushToken();
            const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
            await logoutRequest(refreshToken);
        } finally {
            setUser(null);
            setToken(null);
            await flushSession();
            // Vide tout le cache react-query (sinon la session suivante voit
            // les donnees scope-ees du user precedent).
            queryClient.clear();
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
