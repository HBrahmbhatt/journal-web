import { useState } from 'react';
import PasswordInput from '../components/PasswordInput';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/http';
import { setAccessToken } from '../lib/authManager';

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    type Mode = 'login' | 'registerPrompt';
    const [mode, setMode] = useState<Mode>('login');
    const [error, setError] = useState<string | null>(null);


    async function onLoginClick() {
        if (!username || !password) {
            setError("Username and password are required");
            return;
        }
        console.log("LOGIN", { username, password });
        setError(null);
        setLoading(true);
        // Calling login API, handling responses and auth token
        try {
            const { ok, status, data } =
                await apiRequest<{ token: string; username: string; roles: string[] }>(
                    '/api/v1/auth/login',
                    { method: 'POST', body: { username, password } }
                );

            if (ok) {
                setAccessToken(data.token); // to store and schedule refresh
                navigate('/dashboard');
                return;
            }

            if (status === 404) {
                setMode('registerPrompt');
                setError("We can't find this user. You can create an account.");
                return
            }
            if (status === 401) { setError('Invalid username or password'); return; }
            if (status === 403) { setError('Access denied'); return; }
            if (status === 500) { setError('Server error, please try again later'); return; }
            if (status === 400) { setError('Bad request, please check your input'); return; }

            setError((data as any)?.message || `Login failed (${status})`);
        } finally {
            setTimeout(() => setLoading(false), 300);
        }
    }


    async function onRegisterClick() {
        console.log("REGISTER", { username, password })
        if (!username || !password) {
            setError("Username and password are required");
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        console.log('REGISTER', { username, password });
        setError(null);
        setLoading(true);
        // calling register API, handling responses and auth token
        try {
            const { ok, status, data } =
                await apiRequest<{ token: string; username: string; roles: string[] }>(
                    '/api/v1/auth/register',
                    { method: 'POST', body: { username, password } }
                )

            if (ok || status === 201) {
                setAccessToken(data.token); // to store and schedule refresh
                navigate('/dashboard');
                return;
            }
            if (status === 409) { setMode('login'); setError('User already exists. Please log in.'); return; }
            if (status === 401) { setError('Invalid username or password'); return; }
            if (status === 403) { setError('Access denied'); return; }
            if (status === 500) { setError('Server error, please try again later'); return; }
            if (status === 400) { setError('Bad request, please check your input'); return; }

            setError((data as any)?.message || `Register failed (${status})`);
        } finally {
            setTimeout(() => setLoading(false), 300);
        }
    }


    return (
        <main className="login__wrapper">
            <section className="login__card" role="form" aria-label="Login">
                <header>
                    <h1 className="login__title">
                        {mode === 'login' ? 'Welcome!' : mode === 'registerPrompt' ? 'Create account?' : 'Create your account'}
                    </h1>
                    <p className="login__subtitle">Sign in to your Journal</p>
                </header>


                <form className="login__form" onSubmit={(e) => { e.preventDefault(); if (mode === 'login') { onLoginClick() } else if (mode === 'registerPrompt') onRegisterClick() }}>
                    <div className="login__row">
                        <label className="login__label" htmlFor="username">Username</label>
                        <input id="username" name="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="login__input" placeholder="username" />
                    </div>

                    {(mode === 'login' || mode === 'registerPrompt') && (
                        <div className="login__row">
                            <label className="login__label" htmlFor="password">Password</label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={setPassword}
                                placeholder={mode === 'login' ? 'Password' : 'Create a password'}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                containerClassName='login__row'
                                inputClassName='login__input'
                            />
                        </div>
                    )}

                    {/* Confirm password (only in register mode) */}
                    {mode === 'registerPrompt' && (
                        <div className="login__row">
                            <label className="login__label" htmlFor="confirm">Confirm password</label>
                            <PasswordInput
                                id="confirm"
                                value={confirm}
                                onChange={setConfirm}
                                placeholder="Confirm password"
                                autoComplete="new-password"
                                containerClassName="login__row"
                                inputClassName='login__input'
                            />
                        </div>
                    )}

                    {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                    <div className="login__actions">
                        {mode === 'login' ? (
                            <>
                                <button type="submit" className="login__btn-primary" disabled={loading}>
                                    {loading ? 'Logging in…' : 'Log in'}
                                </button>
                                <button type="button" className="login__btn-ghost" onClick={() => setMode('registerPrompt')} disabled={loading}>
                                    Register
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Login hidden; show Register as primary */}
                                <button type="button" className="login__btn-primary" onClick={onRegisterClick} disabled={loading}>
                                    Create account
                                </button>
                                <button type="button" className="login__btn-ghost" onClick={() => setMode('login')} disabled={loading}>
                                    Back to login
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </section>
        </main>
    )
}