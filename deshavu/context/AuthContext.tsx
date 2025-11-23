

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import { db, getUserById, getUserByEmail, createUser } from '../services/db';

interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLoggedInUser = async () => {
            try {
                const userIdStr = sessionStorage.getItem('deshavu_userId');
                if (userIdStr) {
                    const userId = parseInt(userIdStr, 10);
                    const user = await getUserById(userId);
                    setCurrentUser(user || null);
                }
            } catch (error) {
                console.error("Failed to check for logged in user", error);
                setCurrentUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkLoggedInUser();
    }, []);

    const login = async (email: string, password: string) => {
        // NOTE: For this client-side demo, we are not checking the password.
        // A real application would do this on the server.
        const user = await getUserByEmail(email);
        if (!user || !user.id) {
            throw new Error('No account found with this email. Please sign up.');
        }

        setCurrentUser(user);
        sessionStorage.setItem('deshavu_userId', String(user.id));
    };
    
    const signup = async (email: string, password: string) => {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            throw new Error('An account with this email already exists.');
        }

        // NOTE: We do not store the password in the client-side database.
        const newUserId = await createUser(email);
        const newUser = await getUserById(newUserId);

        if (!newUser || !newUser.id) {
            throw new Error('Failed to create a new user account.');
        }
        
        setCurrentUser(newUser);
        sessionStorage.setItem('deshavu_userId', String(newUser.id));
    };

    const logout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('deshavu_userId');
    };

    return (
        // FIX: Corrected a typo from `Auth.Provider` to `AuthContext.Provider`.
        // The `Auth` component was being incorrectly referenced instead of the `AuthContext`.
        <AuthContext.Provider value={{ currentUser, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
