'use client';

import React, { useState, useEffect } from 'react';
import { supabase, PersistenceService } from '@/lib/supabase';
import { CURRICULUM_DATA } from '@/constants/curriculum';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, PlayCircle, Trophy, BarChart3, Clock, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
    const router = useRouter();
    const [progress, setProgress] = useState<Record<number, number>>({});
    const [completed, setCompleted] = useState<number[]>([]);
    const [user, setUser] = useState<any>(null);

    // 実データの読み込み
    useEffect(() => {
        const fetchUserData = async () => {
            const currentUser = await PersistenceService.getCurrentUser();
            setUser(currentUser);
            
            // 現在の年月の進捗を取得 (月が替われば自動的に空になる)
            const data = await PersistenceService.getProgress();
            const progMap: Record<number, number> = {};
            const compList: number[] = [];

            Object.entries(data).forEach(([id, stats]) => {
                const curriculumId = parseInt(id);
                progMap[curriculumId] = stats.completed ? 100 : Math.min(99, 10);
                if (stats.completed) compList.push(curriculumId);
            });

            setProgress(progMap);
            setCompleted(compList);
        };
        fetchUserData();
    }, []);

    const currentPeriod = PersistenceService.getPeriod();
    const [year, month] = currentPeriod.split('-');
    const totalProgress = Math.floor((completed.length / 12) * 100);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">運行管理 LMS</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">現在のユーザー</p>
                            <p className="text-sm font-bold text-slate-700">{user?.name || user?.email}</p>
                        </div>
                        <button 
                            onClick={async () => {
                                if (supabase) await supabase.auth.signOut();
                                router.push('/login');
                            }}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                            title="ログアウト"
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Progress Overview Card */}
                <div className="bg-gradient-to-br from-indigo-700 to-violet-800 rounded-3xl p-8 mb-12 shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div className="md:col-span-2">
                            <h2 className="text-3xl font-bold mb-4">こんにちは、{user?.name || user?.email || '受講者'}さん！</h2>
                            <p className="text-indigo-100 mb-8 text-lg max-w-xl">
                                <span className="underline decoration-indigo-400 underline-offset-4">{year}年{parseInt(month)}月分</span> の教育プログラムを完了しましょう。
                            </p>
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-200 bg-indigo-900/30">
                                            全体の修了率
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-white">{totalProgress}%</span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-indigo-900/40">
                                    <div
                                        style={{ width: `${totalProgress}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white transition-all duration-1000 ease-out"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center md:justify-end">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center w-full max-w-[200px]">
                                <BarChart3 className="w-10 h-10 mx-auto mb-2 text-indigo-200" />
                                <p className="text-3xl font-black">{completed.length} / 12</p>
                                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mt-1">項目修了</p>
                            </div>
                        </div>
                    </div>
                    {/* Abstract background elements */}
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
                </div>

                {/* Curriculum Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {CURRICULUM_DATA.map((item) => {
                        const isCompleted = completed.includes(item.order_no);
                        const itemProgress = progress[item.order_no] || 0;

                        return (
                            <Link
                                key={item.order_no}
                                href={`/learning/${item.order_no}`}
                                className="group block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-slate-100'}`}>
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                            ) : itemProgress > 0 ? (
                                                <PlayCircle className="w-6 h-6 text-indigo-600 animate-pulse" />
                                            ) : (
                                                <Circle className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">項目 {item.order_no}</span>
                                    </div>

                                    <h3 className="text-slate-900 font-bold mb-4 line-clamp-3 min-h-[4.5rem] leading-snug group-hover:text-indigo-600 transition-colors">
                                        {item.title}
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">進行状況</span>
                                            <span className={`font-bold ${isCompleted ? 'text-green-600' : 'text-slate-700'}`}>
                                                {itemProgress}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${itemProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={`px-6 py-4 text-xs font-bold border-t flex items-center justify-between ${isCompleted ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-600'
                                    }`}>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{item.duration || '約 15 分'}</span>
                                    </div>
                                    <span>{isCompleted ? '学習完了' : itemProgress > 0 ? '学習中' : '学習を開始する'}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
