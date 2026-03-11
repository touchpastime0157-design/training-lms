'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PersistenceService } from '@/lib/supabase';
import { CURRICULUM_DATA } from '@/constants/curriculum';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Quiz } from '@/components/Quiz';
import { ChevronLeft, Info, CheckCircle2, Award } from 'lucide-react';
import Link from 'next/link';

import { QUIZ_DATA } from '@/constants/quiz';

export default function LearningPage() {
    const params = useParams();
    const router = useRouter();
    const id = parseInt(params.id as string);
    const data = CURRICULUM_DATA.find((item) => item.order_no === id);

    const [isCompleted, setIsCompleted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [initialStartTime, setInitialStartTime] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // 既存の進捗を読み込む
    useEffect(() => {
        const loadProgress = async () => {
            const allProgress = await PersistenceService.getProgress();
            const saved = allProgress[id];
            if (saved) {
                setInitialStartTime(saved.watched_sec);
                if (saved.completed) setIsCompleted(true);
            }
            setIsLoaded(true);
        };
        loadProgress();
    }, [id]);

    if (!data) return <div>Data not found</div>;

    const videoId = data.youtube_url.split('v=')[1];

    const handleProgress = async (seconds: number, total: number) => {
        const p = Math.floor((seconds / total) * 100);
        setProgress(p);
        
        // バックグラウンドで常に時刻を記録
        if (seconds > 0) {
            await PersistenceService.saveProgress(id, seconds, total, isCompleted || p >= 100);
        }

        if (p >= 100 && !isCompleted) {
            setIsCompleted(true);
        }
    };

    const handleStop = async (seconds: number, total: number) => {
        const p = Math.floor((seconds / total) * 100);
        // 停止ボタン押下時に確実に保存して戻る
        await PersistenceService.saveProgress(id, seconds, total, isCompleted || p >= 100);
        router.push('/dashboard');
    };

    const handleComplete = async () => {
        setIsCompleted(true);
        await PersistenceService.saveProgress(id, progress, 100, true);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Nav */}
            <nav className="bg-white border-b border-slate-200 h-16 flex items-center px-4 shrink-0">
                <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </Link>
                <div className="ml-4 overflow-hidden">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">項目 {id}</p>
                    <h1 className="text-slate-900 font-bold truncate text-sm sm:text-base">
                        {data.title}
                    </h1>
                </div>
            </nav>

            <div className="flex-1 flex flex-col lg:flex-row gap-8 p-4 sm:p-8 max-w-[1600px] mx-auto w-full">
                {/* Left: Video Area */}
                <div className="flex-[2] space-y-6">
                    {isLoaded ? (
                        <VideoPlayer
                            videoId={videoId}
                            onProgress={handleProgress}
                            onComplete={handleComplete}
                            onStop={handleStop}
                            initialStartTime={initialStartTime}
                        />
                    ) : (
                        <div className="aspect-video bg-slate-200 rounded-3xl animate-pulse flex items-center justify-center">
                            <div className="text-slate-400 font-bold">進捗を読み込み中...</div>
                        </div>
                    )}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Info className="w-5 h-5 text-indigo-500" />
                                受講のガイドライン
                            </h2>
                            <div className="text-right">
                                <span className="text-2xl font-black text-indigo-600">{progress}%</span>
                                <span className="text-xs font-bold text-slate-400 uppercase block">視聴進捗</span>
                            </div>
                        </div>
                        <ul className="space-y-3 text-slate-600 text-sm">
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                                ビデオを最後まで視聴するとこの項目は「完了」となります。
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                                停止ボタンを押すと現在の場所を保存して戻ることができます。
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                                シークバーによる早送りは制限されています。
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right: Status / Actions */}
                <div className="flex-1 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">受講状況</h3>

                        <div className="space-y-8 relative">
                            {/* Step 1 */}
                            <div className="flex gap-4 relative">
                                <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold ${progress >= 100 ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'
                                    }`}>
                                    {progress >= 100 ? <CheckCircle2 className="w-6 h-6" /> : '1'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">動画講義の視聴</h4>
                                    <p className="text-sm text-slate-500">
                                        {progress >= 100 ? '受講完了' : `${progress}% 完了`}
                                    </p>
                                </div>
                                {/* Connector */}
                                <div className="absolute left-5 top-10 w-0.5 h-10 bg-slate-100" />
                            </div>

                            {/* Final Status */}
                            <div className="flex gap-4">
                                <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold ${progress >= 100 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`font-bold ${progress >= 100 ? 'text-slate-800' : 'text-slate-400'}`}>
                                        項目修了
                                    </h4>
                                    <p className="text-sm text-slate-400">100%視聴で自動記録</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full py-5 rounded-2xl font-black text-lg bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                            >
                                ダッシュボードに戻る
                            </button>
                        </div>

                        {/* Background design */}
                        <div className="absolute top-0 right-0 p-4">
                            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full -mr-12 -mt-12" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
