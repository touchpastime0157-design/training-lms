'use client';

import React, { useState, useEffect } from 'react';
import { PersistenceService } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Loader2, ArrowRight, AlertCircle, Power } from 'lucide-react';

export default function LoginPage() {
    const [mode, setMode] = useState<'user' | 'admin'>('user');
    const [name, setName] = useState(''); // for admin
    const [password, setPassword] = useState('');
    const [registeredUsers, setRegisteredUsers] = useState<{id:string, name:string}[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUsers = async () => {
            const users = await PersistenceService.getRegisteredUsers();
            setRegisteredUsers(users);
        };
        fetchUsers();
    }, []);

    const toggleUserSelection = (userName: string) => {
        if (selectedUsers.includes(userName)) {
            setSelectedUsers(selectedUsers.filter(n => n !== userName));
        } else {
            setSelectedUsers([...selectedUsers, userName]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (mode === 'user') {
            if (selectedUsers.length === 0) {
                setError('少なくとも1名の受講者を選択してください。');
                return;
            }
            setLoading(true);
            const success = await PersistenceService.loginByNames(selectedUsers);
            if (success) {
                setTimeout(() => router.push('/dashboard'), 800);
            } else {
                setError('ログインに失敗しました。');
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
        }
    };

    const handleCloseApp = () => {
        if (typeof window !== 'undefined') {
            window.close();
        }
    };

    return (
        <div className="h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)] pointer-events-none" />
            
            <button 
                onClick={handleCloseApp} 
                className="absolute top-6 right-6 z-50 px-6 py-4 bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-2xl shadow-xl transition-all flex items-center gap-3 group border border-slate-100"
            >
                <Power className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm tracking-widest">アプリを終了</span>
            </button>

            <div className="max-w-3xl w-full relative z-10 flex flex-col max-h-[90vh]">
                <div className="text-center mb-6 shrink-0">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-200 rotate-6 mb-4">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Transport LMS</h1>
                    <p className="text-slate-500 font-medium mt-2">安全教育の未来を、今ここで。</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 flex-1 flex flex-col min-h-0">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-50 p-1 rounded-2xl mb-6 shrink-0">
                        <button 
                            onClick={() => { setMode('user'); setError(null); }}
                            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${mode === 'user' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            受講者ログイン
                        </button>
                        <button 
                            onClick={() => { setMode('admin'); setError(null); }}
                            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${mode === 'admin' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            管理者ログイン
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-indigo-600 pl-4 shrink-0">
                        {mode === 'user' ? '複数名で同時受講モード' : '管理者ログイン'}
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-4">
                            {mode === 'user' ? (
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-slate-500 mb-2">受講する方全員にチェックを入れてください。</p>
                                    {registeredUsers.length === 0 ? (
                                        <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm font-bold">
                                            登録されているユーザーがいません。管理画面から登録してください。
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {registeredUsers.map(u => (
                                                <label key={u.id} className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${selectedUsers.includes(u.name) ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                        checked={selectedUsers.includes(u.name)}
                                                        onChange={() => toggleUserSelection(u.name)}
                                                    />
                                                    <span className={`ml-3 font-bold ${selectedUsers.includes(u.name) ? 'text-indigo-900' : 'text-slate-700'}`}>{u.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">管理者名</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="佐藤 太郎"
                                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg text-slate-900 font-bold"
                                                required
                                            />
                                        </div>
                                    </div>
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
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 mt-6 space-y-4">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (mode === 'user' ? selectedUsers.length === 0 : !name)}
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>{mode === 'user' ? `${selectedUsers.length}名で受講を開始` : 'ログイン'} <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 font-medium mt-6 shrink-0">
                    &copy; 2026 Transport LMS. All Rights Reserved.
                </p>
            </div>
        </div>
    );
}
