'use client';

import React, { useState, useEffect } from 'react';
import { PersistenceService } from '@/lib/supabase';
import { exportToPDF } from '@/lib/pdf-export';
import { useRouter } from 'next/navigation';
import {
    Users,
    BookOpen,
    CheckCircle,
    AlertCircle,
    Download,
    Settings,
    Search,
    ArrowUpRight,
    LogOut,
    BarChart3,
    Plus,
    Trash2,
    Edit2,
    Shield,
    X
} from 'lucide-react';
import { CURRICULUM_DATA } from '@/constants/curriculum';

export default function AdminDashboard() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editingUserName, setEditingUserName] = useState<string>('');
    const [annualData, setAnnualData] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, active: 0 });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [reportMode, setReportMode] = useState<'monthly' | 'annual'>('monthly'); // レポート表示モード
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [newUserName, setNewUserName] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);

    const handleViewDetail = async (userId: string) => {
        const period = `${selectedYear}-${selectedMonth}`;
        const detail = await PersistenceService.getUserDetails(userId, period);
        setSelectedUserDetail(detail);
    };

    const loadData = async () => {
        const loggedIn = await PersistenceService.isAdminLoggedIn();
        if (!loggedIn) {
            router.push('/login');
            return;
        }

        const period = `${selectedYear}-${selectedMonth}`;
        const data = await PersistenceService.getAllUserStats(period);
        const mappedUsers = data.map(u => ({
            ...u,
            displayProgress: u.progress !== undefined ? Math.floor((u.progress / 12) * 100) : 0,
            status: u.progress === 12 ? 'Completed' : u.progress > 0 ? 'In Progress' : 'Not Started',
        }));
        setUsers(mappedUsers);
        
        // 年次データの読込
        const annual = await PersistenceService.getAnnualStats(selectedYear);
        setAnnualData(annual);
        
        const adminList = await PersistenceService.getAllAdmins();
        setAdmins(adminList);
        
        const completedCount = mappedUsers.filter(u => u.progress === 12).length;
        const activeCount = mappedUsers.filter(u => u.progress > 0 && u.progress < 12).length;
        
        setStats({
            total: mappedUsers.length,
            completed: completedCount, 
            active: activeCount
        });
    };

    useEffect(() => {
        loadData();
    }, [selectedYear, selectedMonth]);

    const handleExport = async () => {
        const periodLabel = reportMode === 'monthly' ? `${selectedYear}年${selectedMonth}月` : `${selectedYear}年度`;
        const filename = `運行管理教育_${periodLabel}_受講状況.pdf`;
        
        if (reportMode === 'monthly') {
            if (users.length === 0) return;
            await exportToPDF(users, filename, 'monthly');
        } else {
            if (annualData.length === 0) return;
            await exportToPDF(annualData, filename, 'annual', selectedYear);
        }
    };

    // ... (handleAddUser, handleUpdateUser, handleDeleteUser などの処理はそのまま維持)

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName.trim()) return;
        await PersistenceService.registerUser(newUserName.trim());
        setNewUserName('');
        loadData();
    };

    const handleUpdateUser = (id: string, currentName: string) => {
        setEditingUserId(id);
        setEditingUserName(currentName);
    };

    const confirmUpdateUser = async (id: string) => {
        if (!editingUserName.trim()) return;
        try {
            await PersistenceService.updateUser(id, editingUserName.trim());
            setEditingUserId(null);
            await loadData();
        } catch (err) {
            console.error('Update failed:', err);
            alert('名前の変更に失敗しました。');
        }
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (confirm(`${name} さんのデータを完全に削除しますか？\n(学習履歴もすべて削除されます)`)) {
            await PersistenceService.deleteUser(userId);
            loadData();
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminName.trim() || !newAdminPassword.trim()) return;
        await PersistenceService.registerAdmin(newAdminName.trim(), newAdminPassword.trim());
        setNewAdminName('');
        setNewAdminPassword('');
        loadData();
    };

    const handleUpdateAdmin = async (oldName: string) => {
        if (oldName === 'admin') {
            alert('マスターアカウント(admin)の名前とパスワードは変更できません。');
            return;
        }
        const newName = prompt('管理者の新しい名前を入力してください:', oldName);
        if (!newName || !newName.trim()) return;
        
        const newPassword = prompt('新しいパスワードを入力してください(空の場合は変更なし):');
        await PersistenceService.updateAdmin(oldName, newName.trim(), newPassword || undefined);
        loadData();
    };

    const handleDeleteAdmin = async (name: string) => {
        if (name === 'admin') {
            alert('マスターアカウント(admin)は削除できません。');
            return;
        }
        if (confirm(`管理者「${name}」を削除してもよろしいですか？`)) {
            await PersistenceService.deleteAdmin(name);
            loadData();
        }
    };

    const handleLogout = async () => {
        await PersistenceService.logout();
        router.push('/login');
    };

    return (
        <div className="h-screen overflow-hidden bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col sticky top-0 h-screen shrink-0">
                <div className="p-8">
                    <h1 className="text-2xl font-black tracking-tighter text-indigo-400">ADMIN PANEL</h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <BarChart3 className="w-5 h-5" /> ダッシュボード
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Users className="w-5 h-5" /> 受講者管理
                    </button>
                    <button 
                        onClick={() => setActiveTab('content')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <BookOpen className="w-5 h-5" /> 教材管理
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Settings className="w-5 h-5" /> 年度設定
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 transition-all"
                    >
                        <LogOut className="w-5 h-5" /> ログアウト
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0 p-8 overflow-y-auto no-scrollbar">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">
                            {activeTab === 'dashboard' ? '受講進捗確認' : 
                             activeTab === 'users' ? '受講者名簿管理' : 
                             activeTab === 'content' ? '教材コンテンツ管理' : 'システム設定'}
                        </h2>
                        {activeTab === 'dashboard' && (
                            <div className="flex items-center gap-3 mt-4">
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-700"
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}年度</option>)}
                                </select>
                                {reportMode === 'monthly' && (
                                    <select 
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-700"
                                    >
                                        {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                                            <option key={m} value={m}>{parseInt(m)}月</option>
                                        ))}
                                    </select>
                                )}
                                <div className="flex bg-slate-200 p-1 rounded-xl ml-4">
                                    <button 
                                        onClick={() => setReportMode('monthly')}
                                        className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${reportMode === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                    >月次</button>
                                    <button 
                                        onClick={() => setReportMode('annual')}
                                        className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${reportMode === 'annual' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                    >年次</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm whitespace-nowrap"
                    >
                        <Download className="w-5 h-5 text-slate-400" />
                        監査帳票出力 (PDF)
                    </button>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                            <StatCard title="登録人数" value={`${stats.total} 名`} icon={<Users />} />
                            <StatCard title="修了済み" value={`${stats.completed} 名`} icon={<CheckCircle />} />
                            <StatCard title="学習中" value={`${stats.active} 名`} icon={<BookOpen />} />
                            <StatCard title="未着手" value={`${stats.total - stats.completed - stats.active} 名`} icon={<AlertCircle />} />
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center gap-4">
                                <h3 className="text-xl font-bold text-slate-800">
                                    {reportMode === 'monthly' ? `${selectedYear}年${selectedMonth}月の受講状況` : `${selectedYear}年度の年間受講状況`}
                                </h3>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="名前で検索..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                {reportMode === 'monthly' ? (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">氏名</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">進捗</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">最終アクティブ</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {users.filter(u => u.name.includes(searchTerm)).map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-8 py-5 font-bold text-slate-800">{user.name}</td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 min-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-500" style={{ width: `${user.displayProgress}%` }} />
                                                            </div>
                                                            <span className="text-sm font-bold">{user.displayProgress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm text-slate-500">{user.last_active}</td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button 
                                                            onClick={() => handleViewDetail(user.id)}
                                                            className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1 ml-auto"
                                                        >
                                                            詳細 <ArrowUpRight className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50/50">氏名</th>
                                                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                                    <th key={m} className="px-4 py-4 text-center font-black text-slate-400 uppercase tracking-widest">{m}月</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {annualData.filter(u => u.name.includes(searchTerm)).map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-8 py-5 font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50">{user.name}</td>
                                                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                                        <td key={m} className="px-4 py-5 text-center">
                                                            {user.months[m] ? (
                                                                <span className="inline-flex w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-100" />
                                                            ) : (
                                                                <span className="inline-flex w-3 h-3 bg-slate-100 rounded-full" />
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-12">
                        {/* Section 1: Users */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">新規受講生の登録</h3>
                                <form onSubmit={handleAddUser} className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        placeholder="受講生の名前を入力"
                                        className="flex-1 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> 登録
                                    </button>
                                </form>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                                <div className="p-8 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800">受講生名簿</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">名前</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-8 py-5 font-bold text-slate-800">
                                                        {editingUserId === user.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="text"
                                                                    value={editingUserName}
                                                                    onChange={(e) => setEditingUserName(e.target.value)}
                                                                    className="px-3 py-1 bg-white border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-[200px]"
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') confirmUpdateUser(user.id);
                                                                        if (e.key === 'Escape') setEditingUserId(null);
                                                                    }}
                                                                />
                                                                <button 
                                                                    onClick={() => confirmUpdateUser(user.id)}
                                                                    className="p-1 px-2 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700"
                                                                >
                                                                    OK
                                                                </button>
                                                                <button 
                                                                    onClick={() => setEditingUserId(null)}
                                                                    className="p-1 px-2 bg-slate-200 text-slate-600 rounded-md text-xs hover:bg-slate-300"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            user.name
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-mono text-slate-400">{user.id}</td>
                                                    <td className="px-8 py-5 text-right space-x-2">
                                                        <button 
                                                            onClick={() => handleUpdateUser(user.id, user.name)}
                                                            className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                                                            title="名前変更"
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                            title="削除"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Admins */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">新規管理者の登録</h3>
                                <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-4">
                                    <input
                                        type="text"
                                        value={newAdminName}
                                        onChange={(e) => setNewAdminName(e.target.value)}
                                        placeholder="管理者名"
                                        className="flex-1 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        required
                                    />
                                    <input
                                        type="password"
                                        value={newAdminPassword}
                                        onChange={(e) => setNewAdminPassword(e.target.value)}
                                        placeholder="パスワード"
                                        className="flex-1 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition flex items-center gap-2 justify-center"
                                    >
                                        <Plus className="w-5 h-5" /> 管理者追加
                                    </button>
                                </form>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-lg font-bold text-slate-800">管理者リスト</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">管理者名</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* マスターアカウントはリストに固定表示（永続化データになくても） */}
                                            <tr className="bg-indigo-50/30">
                                                <td className="px-8 py-5 font-bold text-slate-800">admin <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full ml-2">MASTER</span></td>
                                                <td className="px-8 py-5 text-right text-xs text-slate-400 italic">
                                                    変更・削除不可
                                                </td>
                                            </tr>
                                            {admins.filter(a => a.name !== 'admin').map((admin) => (
                                                <tr key={admin.name} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-8 py-5 font-bold text-slate-800">{admin.name}</td>
                                                    <td className="px-8 py-5 text-right space-x-2">
                                                        <button 
                                                            onClick={() => handleUpdateAdmin(admin.name)}
                                                            className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                                                            title="設定変更"
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteAdmin(admin.name)}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                            title="削除"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'content' || activeTab === 'settings') && (
                    <div className="bg-white p-20 rounded-3xl border border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Settings className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{activeTab === 'content' ? '教材管理' : 'システム設定'}</h3>
                        <p className="text-slate-500">この機能は現在準備中です。</p>
                    </div>
                )}

                {selectedUserDetail && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen" onClick={() => setSelectedUserDetail(null)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">{selectedUserDetail.name} さんの受講進捗</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">{selectedYear}年{selectedMonth}月分 | 全体進捗: <span className="text-indigo-600">{selectedUserDetail.overallPercentage}%</span></p>
                                </div>
                                <button onClick={() => setSelectedUserDetail(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-8 space-y-4 overflow-y-auto flex-1 no-scrollbar">
                                {selectedUserDetail.items.map((item: any) => {
                                    const curriculum = CURRICULUM_DATA.find(c => c.order_no === item.curriculumId);
                                    return (
                                        <div key={item.curriculumId} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors bg-slate-50/30">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">項目 {item.curriculumId}</span>
                                                <h4 className="font-bold text-slate-800 truncate">{curriculum?.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-6 sm:w-auto mt-2 sm:mt-0">
                                                <div className="text-right w-20 shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">進捗</span>
                                                    <span className={`text-lg font-black ${item.percentage >= 100 ? 'text-green-600' : (item.percentage > 0 ? 'text-indigo-600' : 'text-slate-400')}`}>{item.percentage}%</span>
                                                </div>
                                                <div className="text-right w-36 border-l border-slate-100 pl-6 shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">最終受講日時</span>
                                                    <span className="text-sm font-bold text-slate-700">{item.lastUpdated}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ title, value, icon }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-xl text-indigo-600">
                    {React.cloneElement(icon, { size: 24 })}
                </div>
            </div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-3xl font-black text-slate-900">{value}</p>
        </div>
    );
}
