'use client';

import React, { useState } from 'react';
import { PersistenceService } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [mode, setMode] = useState<'user' | 'admin' | 'register'>('user');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (mode === 'user') {
            if (!name.trim()) return;
            setLoading(true);
            const success = await PersistenceService.loginByName(name);
            if (success) {
                setTimeout(() => router.push('/dashboard'), 800);
            } else {
                setError('受講者として登録されていません。管理者に連絡してください。');
                setLoading(false);
            }
        } else if (mode === 'admin') {
            setLoading(true);
            const success = await PersistenceService.loginAsAdmin(name, password);
            if (success) {
                router.push('/admin');
            } else {
                setError('名前またはパスワードが正しくありません。');
                setLoading(false);
            }
        } else if (mode === 'register') {
            setLoading(true);
            await PersistenceService.registerAdmin(name, password);
            alert('管理者登録が完了しました。ログインしてください。');
            setMode('admin');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)] pointer-events-none" />
            
            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-200 rotate-6 mb-6">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Transport LMS</h1>
                    <p className="text-slate-500 font-medium mt-2">安全教育の未来を、今ここで。</p>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-50 p-1 rounded-2xl mb-10">
                        <button 
                            onClick={() => { setMode('user'); setError(null); }}
                            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${mode === 'user' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            受講者
                        </button>
                        <button 
                            onClick={() => { setMode('admin'); setError(null); }}
                            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${mode === 'admin' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            管理者
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 mb-8 border-l-4 border-indigo-600 pl-4">
                        {mode === 'user' ? '受講者ログイン' : '管理者ログイン'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                {mode === 'user' ? 'お名前' : '管理者名'}
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={mode === 'user' ? '山田 太郎' : 'admin'}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg text-slate-900 font-bold"
                                    required
                                />
                            </div>
                        </div>

                        {mode !== 'user' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">パスワード</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg text-slate-900 font-bold"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>{'ログイン'} <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-300 font-medium mt-10">
                    &copy; 2026 Transport LMS. All Rights Reserved.
                </p>
            </div>
        </div>
    );
}
