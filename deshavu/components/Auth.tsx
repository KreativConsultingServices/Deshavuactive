
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SignupModal } from './SignupModal';

export const Auth: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const { login } = useAuth();

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please enter your email and password.');
            return;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await login(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred. Please sign up if you are a new user.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-[#2C2D31] text-white p-4">
                <div className="w-full max-w-sm">
                    <div className="glass-container p-8 text-center">
                        <h1 className="text-4xl font-bold mb-2">Deshavu</h1>
                        <p className="text-sm text-[#9A9A9A] mb-8">Your intelligent video library</p>

                        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.trim())}
                                    placeholder="Enter your email"
                                    className="w-full glass-inset p-3 text-white focus:outline-none placeholder-[#9A9A9A] text-center"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full glass-inset p-3 text-white focus:outline-none placeholder-[#9A9A9A] text-center"
                                    disabled={isLoading}
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <div className="flex flex-col space-y-4 pt-2">
                                <button
                                    type="submit"
                                    className="w-full px-8 py-2 rounded-full bg-[#5ECB6A] hover:opacity-90 transition-all font-bold text-white shadow-[0_0_15px_1px_rgba(94,203,106,0.3)] hover:shadow-[0_0_20px_3px_rgba(94,203,106,0.4)] disabled:bg-opacity-50 disabled:cursor-not-allowed"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </button>
                                <button
                                    type="button"
                                    className="w-full px-6 py-2 rounded-full bg-transparent border border-gray-600 hover:bg-gray-700/50 transition-colors font-semibold disabled:opacity-50"
                                    disabled={isLoading}
                                    onClick={() => setIsSignupModalOpen(true)}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {isSignupModalOpen && <SignupModal onClose={() => setIsSignupModalOpen(false)} />}
        </>
    );
};
