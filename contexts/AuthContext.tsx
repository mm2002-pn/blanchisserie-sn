import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User } from '@/types/auth.types';
import { mockUsers } from '@/data/mock-users';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from storage on mount
    useEffect(() => {
        loadUserFromStorage();
    }, []);

    const loadUserFromStorage = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const storedToken = await AsyncStorage.getItem('token');

            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            }
        } catch (error) {
            console.error('Error loading user from storage:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // Simulate API call with mock data
            const foundUser = mockUsers.find(
                u => u.email === email && u.password === password
            );

            if (!foundUser) {
                throw new Error('Email ou mot de passe incorrect');
            }

            // Remove password from user object
            const { password: _, ...userWithoutPassword } = foundUser;

            // Generate mock JWT token
            const mockToken = `mock-jwt-token-${foundUser.id}-${Date.now()}`;

            // Save to state
            setUser(userWithoutPassword);
            setToken(mockToken);

            // Save to AsyncStorage
            await AsyncStorage.setItem('user', JSON.stringify(userWithoutPassword));
            await AsyncStorage.setItem('token', mockToken);

            // Return user for role-based navigation
            return userWithoutPassword;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setUser(null);
            setToken(null);
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
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
