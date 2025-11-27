'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

interface LaravelAuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const LaravelAuthContext = createContext<LaravelAuthContextType>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: () => { },
    logout: () => { },
    refreshUser: async () => { },
});

export const useLaravelAuth = () => useContext(LaravelAuthContext);

export const LaravelAuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('jwt_token');
        const storedUser = localStorage.getItem('jwt_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('jwt_token', newToken);
        localStorage.setItem('jwt_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('jwt_user');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    const refreshUser = async () => {
        if (!token) return;
        try {
            const response = await fetch('https://wattch-beta.vercel.app/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                method: 'POST',
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                localStorage.setItem('jwt_user', JSON.stringify(userData));
            } else {
                // If token is invalid, logout
                logout();
            }
        } catch (error) {
            console.error('Failed to refresh user', error);
        }
    };

    return (
        <LaravelAuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}>
            {children}
        </LaravelAuthContext.Provider>
    );
};
