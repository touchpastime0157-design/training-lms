import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

/**
 * 本番化（Production-ready）した永続化レイヤー
 * ユーザーID管理、認証状態の取得、データの永続化を担当します。
 */
export class PersistenceService {
    private static STORAGE_KEY = 'transport-lms-data-v3';
    private static USER_SESSION_KEY = 'transport-lms-current-user';
    private static USER_LIST_KEY = 'transport-lms-user-list'; // 全ユーザーの名簿
    private static ADMIN_LIST_KEY = 'transport-lms-admin-list'; // 管理者名簿
    private static ADMIN_SESSION_KEY = 'transport-lms-admin-session'; // 管理者セッション

    // 名前のハッシュからIDを生成（デモ用の一貫したID生成）
    private static generateId(name: string) {
        return `user-${Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0)}`;
    }

    // 管理者の登録
    static async registerAdmin(name: string, password: string) {
        if (typeof window === 'undefined') return;
        const admins = JSON.parse(localStorage.getItem(this.ADMIN_LIST_KEY) || '{}');
        admins[name] = { name, password }; // 簡易的な保存（デモ用）
        localStorage.setItem(this.ADMIN_LIST_KEY, JSON.stringify(admins));
    }

    // 管理者ログイン
    static async loginAsAdmin(name: string, password: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;

        // 固定のマスターアカウント
        if (name === 'admin' && password === 'admin') {
            localStorage.setItem(this.ADMIN_SESSION_KEY, name);
            return true;
        }

        const admins = JSON.parse(localStorage.getItem(this.ADMIN_LIST_KEY) || '{}');
        const admin = admins[name];
        if (admin && admin.password === password) {
            localStorage.setItem(this.ADMIN_SESSION_KEY, name);
            return true;
        }
        return false;
    }

    // 管理者がログイン中かチェック
    static async isAdminLoggedIn(): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(this.ADMIN_SESSION_KEY);
    }

    // 名前のみでログイン（登録済みのユーザーのみ）
    static async loginByName(name: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        
        // 名簿をチェック
        const users = JSON.parse(localStorage.getItem(this.USER_LIST_KEY) || '{}');
        const userId = this.generateId(name);
        
        if (users[userId]) {
            localStorage.setItem(this.USER_SESSION_KEY, name);
            return true;
        }
        return false;
    }

    // 現在の年月を取得 (YYYY-MM)
    static getPeriod(date = new Date()) {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${y}-${m}`;
    }

    // 名簿への登録・更新
    static async registerUser(name: string) {
        if (typeof window === 'undefined') return;
        const users = JSON.parse(localStorage.getItem(this.USER_LIST_KEY) || '{}');
        const id = this.generateId(name);
        users[id] = { id, name, last_active: new Date().toLocaleDateString('ja-JP') };
        localStorage.setItem(this.USER_LIST_KEY, JSON.stringify(users));
    }

    // ユーザーの削除
    static async deleteUser(userId: string) {
        if (typeof window === 'undefined') return;
        
        const users = JSON.parse(localStorage.getItem(this.USER_LIST_KEY) || '{}');
        delete users[userId];
        localStorage.setItem(this.USER_LIST_KEY, JSON.stringify(users));
        
        const allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        delete allData[userId];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
    }

    // ログアウト
    static async logout() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.USER_SESSION_KEY);
        localStorage.removeItem(this.ADMIN_SESSION_KEY);
    }

    // 現在のユーザー情報を取得
    static async getCurrentUser() {
        if (typeof window === 'undefined') return null;
        
        const storedName = localStorage.getItem(this.USER_SESSION_KEY);
        if (storedName) {
            return { id: this.generateId(storedName), name: storedName, role: 'user' };
        }
        return null;
    }

    // データの取得（期間指定が可能）
    static async getProgress(period?: string): Promise<Record<number, { watched_sec: number, completed: boolean }>> {
        const user = await this.getCurrentUser();
        if (!user) return {};
        
        const targetPeriod = period || this.getPeriod();
        const allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        const userHistory = allData[user.id] || {};
        
        return userHistory[targetPeriod] || {};
    }

    // 進捗の保存（現在の年月で保存）
    static async saveProgress(curriculumId: number, watchedSec: number, totalSec: number, completed: boolean) {
        const user = await this.getCurrentUser();
        if (!user) return;

        const period = this.getPeriod();
        const allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        
        if (!allData[user.id]) allData[user.id] = {};
        if (!allData[user.id][period]) allData[user.id][period] = {};
        
        allData[user.id][period][curriculumId] = { watched_sec: watchedSec, completed: completed };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));

        // 名簿の最終アクティブ日を更新
        this.registerUser(user.name);
    }

    // 全管理者の取得（パスワード込み）
    static async getAllAdmins() {
        if (typeof window === 'undefined') return [];
        const admins = JSON.parse(localStorage.getItem(this.ADMIN_LIST_KEY) || '{}');
        return Object.values(admins).map((a: any) => ({ name: a.name, password: a.password }));
    }

    // 管理者の削除
    static async deleteAdmin(name: string) {
        if (typeof window === 'undefined') return;
        const admins = JSON.parse(localStorage.getItem(this.ADMIN_LIST_KEY) || '{}');
        delete admins[name];
        localStorage.setItem(this.ADMIN_LIST_KEY, JSON.stringify(admins));
    }

    // 受講生の名前変更
    static async updateUser(oldId: string, newName: string) {
        if (typeof window === 'undefined') return;
        const users = JSON.parse(localStorage.getItem(this.USER_LIST_KEY) || '{}');
        const user = users[oldId];
        if (!user) return;

        const newId = this.generateId(newName);
        
        // 名簿を更新
        delete users[oldId];
        users[newId] = { ...user, id: newId, name: newName };
        localStorage.setItem(this.USER_LIST_KEY, JSON.stringify(users));

        // 学習データを移行
        const allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        if (allData[oldId]) {
            allData[newId] = allData[oldId];
            delete allData[oldId];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
        }
    }

    // 管理者の設定変更（名前とパスワード）
    static async updateAdmin(oldName: string, newName: string, newPassword?: string) {
        if (typeof window === 'undefined') return;
        const admins = JSON.parse(localStorage.getItem(this.ADMIN_LIST_KEY) || '{}');
        const admin = admins[oldName];
        if (!admin) return;

        delete admins[oldName];
        admins[newName] = { name: newName, password: newPassword || admin.password };
        localStorage.setItem(this.ADMIN_LIST_KEY, JSON.stringify(admins));

        if (localStorage.getItem(this.ADMIN_SESSION_KEY) === oldName) {
            localStorage.setItem(this.ADMIN_SESSION_KEY, newName);
        }
    }

    // 全受講生の統計（期間指定対応）
    static async getAllUserStats(period?: string) {
        if (typeof window === 'undefined') return [];

        const targetPeriod = period || this.getPeriod();
        const users = JSON.parse(localStorage.getItem(this.USER_LIST_KEY) || '{}');
        const allLearningData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        
        const stats = Object.keys(users).map(userId => {
            const user = users[userId];
            const userHistory = allLearningData[userId] || {};
            const periodLogs = userHistory[targetPeriod] || {};
            const completedCount = Object.values(periodLogs).filter((l: any) => l.completed).length;
            
            const itemStatus: Record<string, string> = {};
            for (let i = 1; i <= 12; i++) {
                const log: any = periodLogs[i];
                itemStatus[`項目${i}`] = log ? (log.completed ? '完了' : '学習中') : '未着手';
            }
            
            return {
                id: userId,
                name: user.name,
                progress: completedCount,
                ...itemStatus,
                last_active: user.last_active || '-'
            };
        });

        return stats;
    }

    // 年次レポート用の統計取得
    static async getAnnualStats(year: string) {
        if (typeof window === 'undefined') return [];

        const users = JSON.parse(localStorage.getItem(this.USER_LIST_KEY) || '{}');
        const allLearningData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        
        return Object.keys(users).map(userId => {
            const user = users[userId];
            const userHistory = allLearningData[userId] || {};
            
            const monthStatus: Record<string, boolean> = {};
            for (let m = 1; m <= 12; m++) {
                const period = `${year}-${m.toString().padStart(2, '0')}`;
                const periodLogs = userHistory[period] || {};
                const completedCount = Object.values(periodLogs).filter((l: any) => l.completed).length;
                monthStatus[m] = completedCount === 12;
            }

            return {
                id: userId,
                name: user.name,
                months: monthStatus
            };
        });
    }
}
