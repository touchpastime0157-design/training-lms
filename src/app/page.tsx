'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Video, FileCheck, BarChart3, ChevronRight, Award, Power } from 'lucide-react';

export default function Home() {
  const handleCloseApp = () => {
    if (typeof window !== 'undefined') {
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden no-scrollbar">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-[100vh] bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] pointer-events-none opacity-60" />

      {/* App Close Button */}
      <button 
        onClick={handleCloseApp} 
        className="fixed top-6 right-6 z-50 px-6 py-4 bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-2xl shadow-xl transition-all flex items-center gap-3 group border border-slate-100"
      >
        <Power className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="font-bold text-sm tracking-widest hidden sm:inline">アプリを終了</span>
      </button>

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-indigo-200">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Transport LMS</span>
        </div>
        <div className="flex gap-4">
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-20 items-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-indigo-100">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            2026年 運行管理教育プログラム
          </div>
          <h1 className="text-6xl sm:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
            プロドライバーの<br />
            <span className="text-indigo-600">安全教育をDX。</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-lg mb-12 leading-relaxed font-medium">
            国土交通省告示に基づく指導監督12項目を完全カバー。視聴制御とテスト合格必須化により、確実な知識定着と法的遵守を支援します。
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login" className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3">
              今すぐ受講を開始 <ChevronRight className="w-6 h-6" />
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400 font-bold">
              <span className="text-slate-900">+10 社</span> 以上の導入実績
            </p>
          </div>
        </div>

        <div className="relative group animate-fade-in [animation-delay:200ms]">
          <div className="relative bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl shadow-indigo-300 ring-1 ring-white/20 transform group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
            {/* Mock UI inside device */}
            <div className="bg-slate-50 rounded-[1.8rem] aspect-video overflow-hidden relative">
              <div className="absolute inset-0 bg-slate-900/5 items-center justify-center flex">
                <PlayIcon />
              </div>
              <div className="absolute bottom-0 left-0 w-full p-6 space-y-3">
                <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-indigo-500" />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>再生中: 指導監督項目①</span>
                  <span>68% 完了</span>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -right-10 top-20 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 animate-bounce [animation-duration:5s]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">合格</p>
                  <p className="text-sm font-black text-slate-800">理解度テスト 100点</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-10 bottom-20 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">発行済み</p>
                  <p className="text-sm font-black text-slate-800">年間修了証 PDF</p>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] -z-10 group-hover:bg-indigo-500/30 transition-colors" />
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-4xl font-black text-slate-900 mb-4">運行管理者・ドライバーの双方に。</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">
              複雑な受講管理と帳票出力を自動化し、運行管理者の負担を極限まで減らします。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Video />}
              title="100% 視聴制御"
              desc="YouTube IFrame APIを活用し、早送り禁止・スキップ禁止を徹底。確実な教育を保証します。"
            />
            <FeatureCard
              icon={<FileCheck />}
              title="合格必須クイズ"
              desc="各項目5問のテスト。80%以上正解しないと次に進めず、理解を確実にします。"
            />
            <FeatureCard
              icon={<Award />}
              title="修了証PDF発行"
              desc="12項目すべて完了時に法的要件を満たした修了証を自動生成。いつでもDL可能です。"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8">
        {React.cloneElement(icon, { className: 'w-7 h-7' })}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  );
}

function PlayIcon() {
  return (
    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-2" />
    </div>
  );
}
