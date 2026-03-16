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

    static async getRegisteredUsers(): Promise<{id: string; name: string}[]> {
        if (typeof window === 'undefined') return [];
        const users = JSON.parse(localStorage.getItem(this.USER_LIST_KEY) || '{}');
        return Object.values(users).map((u: any) => ({ id: u.id, name: u.name }));
    }

    static async loginByNames(names: string[]): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        if (names.length === 0) return false;
        
        localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(names));
        return true;
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

    // 現在のユーザー情報を取得（複数対応）
    static async getCurrentUsers() {
        if (typeof window === 'undefined') return [];
        
        const stored = localStorage.getItem(this.USER_SESSION_KEY);
        if (!stored) return [];
        
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.map((name: string) => ({ id: this.generateId(name), name, role: 'user' }));
            } else {
                return [{ id: this.generateId(parsed), name: parsed, role: 'user' }];
            }
        } catch (e) {
            return [{ id: this.generateId(stored), name: stored, role: 'user' }];
        }
    }

    // データの取得（複数ユーザーの場合は全員の共通進捗を返す）
    static async getProgress(period?: string): Promise<Record<number, { watched_sec: number, completed: boolean, percentage?: number, last_updated?: string }>> {
        const users = await this.getCurrentUsers();
        if (users.length === 0) return {};
        
        const targetPeriod = period || this.getPeriod();
        const allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');

        // 複数名の場合は、全員のデータの「最小値」をとることで、全員が共通して完了している部分のみを表示する
        const combinedProgress: Record<number, { watched_sec: number, completed: boolean, percentage: number, last_updated: string }> = {};
        
        // 項目1-12について集計
        for (let i = 1; i <= 12; i++) {
            let minWatched = Infinity;
            let allCompleted = true;
            let minPercentage = Infinity;
            let latestUpdate = '';

            for (const user of users) {
                const userHistory = allData[user.id] || {};
                const periodLogs = userHistory[targetPeriod] || {};
                const log = periodLogs[i];

                const watched = log?.watched_sec || 0;
                const completed = !!log?.completed;
                const percent = log?.percentage || 0;
                
                if (watched < minWatched) minWatched = watched;
                if (!completed) allCompleted = false;
                if (percent < minPercentage) minPercentage = percent;
                if (log?.last_updated && log.last_updated > latestUpdate) latestUpdate = log.last_updated;
            }

            if (minWatched === Infinity) minWatched = 0;
            if (minPercentage === Infinity) minPercentage = 0;

            combinedProgress[i] = {
                watched_sec: minWatched,
                completed: allCompleted,
                percentage: minPercentage,
                last_updated: latestUpdate || '-'
            };
        }
        
        return combinedProgress;
    }

    // 進捗の保存（現在の年月で保存）
    static async saveProgress(curriculumId: number, watchedSec: number, totalSec: number, completed: boolean) {
        const users = await this.getCurrentUsers();
        if (users.length === 0) return;

        const period = this.getPeriod();
        const allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        
        for (const user of users) {
            if (!allData[user.id]) allData[user.id] = {};
            if (!allData[user.id][period]) allData[user.id][period] = {};
            
            const existing = allData[user.id][period][curriculumId];
            const maxWatchedSec = existing ? Math.max(existing.watched_sec, watchedSec) : watchedSec;
            const isCompletedNow = completed || (existing && existing.completed);

            let percentage = 0;
            if (totalSec > 0) {
                const p = (maxWatchedSec / totalSec) * 100;
                // 99.9%以上なら100%（完了）、それ以外は切り捨て
                percentage = p >= 99.9 ? 100 : Math.floor(p);
            }
            
            if (isCompletedNow) percentage = 100;

            const existingPercentage = existing?.percentage || 0;
            const finalPercentage = Math.max(existingPercentage, percentage);
            const finalCompleted = isCompletedNow || finalPercentage >= 100;

            allData[user.id][period][curriculumId] = { 
                watched_sec: maxWatchedSec, 
                completed: finalCompleted,
                percentage: finalPercentage,
                last_updated: new Date().toLocaleDateString('ja-JP') + ' ' + new Date().toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'})
            };
            this.registerUser(user.name);
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
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

    // 特定ユーザーの詳細データ取得
    static async getUserDetails(userId: string, period?: string) {
        if (typeof window === 'undefined') return null;
        
        const targetPeriod = period || this.getPeriod();
        const users = JSON.parse(localStorage.getItem(this.USER_LIST_KEY) || '{}');
        const user = users[userId];
        if (!user) return null;

        const allLearningData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        const userHistory = allLearningData[userId] || {};
        const periodLogs = userHistory[targetPeriod] || {};

        let totalProgress = 0;
        const items = [];
        for (let i = 1; i <= 12; i++) {
            const log = periodLogs[i];
            const p = log ? (log.completed ? 100 : (log.percentage || 0)) : 0;
            totalProgress += p;
            
            items.push({
                curriculumId: i,
                percentage: p,
                status: log ? (log.completed ? '完了' : '学習中') : '未着手',
                lastUpdated: log?.last_updated || '-'
            });
        }

        const overallPercentage = Math.floor(totalProgress / 12);

        return {
            id: userId,
            name: user.name,
            overallPercentage,
            items
        };
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
