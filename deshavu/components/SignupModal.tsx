import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from './icons/GoogleIcon';
import { FacebookIcon } from './icons/FacebookIcon';

interface SignupModalProps {
  onClose: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signup(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const SocialButton: React.FC<{children: React.ReactNode}> = ({ children, ...props }) => (
    <button 
        className="w-full flex items-center justify-center space-x-3 px-6 py-2.5 rounded-full bg-transparent border border-gray-600 hover:bg-gray-700/50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative group"
        disabled
        {...props}
    >
        {children}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center p-2">
            Social login requires a server and is not supported in this demo.
        </div>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-container p-8 w-full max-w-md transform transition-all relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl" disabled={isLoading}>&times;</button>
        
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
            <p className="text-sm text-[#9A9A9A] mb-8">to start building your video library.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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
                    placeholder="Create a password (min. 6 characters)"
                    className="w-full glass-inset p-3 text-white focus:outline-none placeholder-[#9A9A9A] text-center"
                    disabled={isLoading}
                />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
                type="submit"
                className="w-full px-8 py-2.5 rounded-full bg-[#5ECB6A] hover:opacity-90 transition-all font-bold text-white shadow-[0_0_15px_1px_rgba(94,203,106,0.3)] hover:shadow-[0_0_20px_3px_rgba(94,203,106,0.4)] disabled:bg-opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !email.trim() || !password.trim()}
            >
                {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
        </form>
        
        <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">Or continue with</span>
            <div className="flex-grow border-t border-gray-700"></div>
        </div>
        
        <div className="space-y-4">
            <SocialButton>
                <GoogleIcon className="w-6 h-6"/>
                <span>Google</span>
            </SocialButton>
            <SocialButton>
                <FacebookIcon className="w-6 h-6"/>
                <span>Facebook</span>
            </SocialButton>
        </div>
        
        <div className="text-center mt-8">
            <p className="text-sm text-[#9A9A9A]">
                Already have an account?{' '}
                <button onClick={onClose} className="font-semibold text-green-400 hover:text-green-300">
                    Login
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};