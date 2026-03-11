/**
 * ネットワーク制限のある環境でも確実に動作する「印刷機能を活用したPDF出力」
 * 外部からのフォントダウンロードを不要にし、システムの日本語フォントを使用します。
 */

// 監査用印字会社名（他社への転売防止用）
// 開発者はこの定数を変更することで、出力される会社名を変更できます。
const AUDIT_COMPANY_NAME = '有限会社ライジング';

export async function exportToPDF(users: any[], filename: string, reportMode: 'monthly' | 'annual' = 'monthly', year?: string) {
    if (users.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('ポップアップがブロックされました。許可してから再度お試しください。');
        return;
    }

    const today = new Date().toLocaleDateString('ja-JP');
    
    // 年度（4月〜3月）の配列を作成
    const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${filename}</title>
            <style>
                body {
                    font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", sans-serif;
                    padding: 40px; color: #333;
                }
                .header { margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                .header-main { display: flex; justify-content: space-between; align-items: flex-end; }
                h1 { margin: 0; font-size: 22px; color: #1e1b4b; }
                .company-name { font-size: 16px; font-weight: bold; color: #4f46e5; }
                .meta { font-size: 11px; color: #666; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
                th { background-color: #f8fafc; border: 1px solid #e2e8f0; text-align: center; padding: 8px 4px; font-size: 10px; color: #64748b; }
                td { border: 1px solid #e2e8f0; padding: 8px 4px; font-size: 11px; text-align: center; }
                .name-col { text-align: left; padding-left: 10px; width: 150px; }
                .status-ok { color: #15803d; font-weight: bold; }
                .status-ng { color: #cbd5e1; }
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="header-main">
                    <h1>運行管理教育受講状況報告書 (${reportMode === 'monthly' ? '月次' : year + '年度 年次'})</h1>
                    <div class="company-name">${AUDIT_COMPANY_NAME}</div>
                </div>
                <div class="meta">出力日: ${today} | 対象人数: ${users.length}名</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th class="name-col">氏名</th>
                        ${reportMode === 'monthly' 
                            ? `<th>進捗率</th><th>ステータス</th><th>最終アクティブ</th>`
                            : months.map(m => `<th>${m}月</th>`).join('')
                        }
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td class="name-col" style="font-weight: bold;">${user.name}</td>
                            ${reportMode === 'monthly' 
                                ? `
                                    <td>${user.displayProgress}%</td>
                                    <td>${user.displayProgress === 100 ? '完了' : '未完了'}</td>
                                    <td>${user.last_active || '-'}</td>
                                  `
                                : months.map(m => `
                                    <td class="${user.months && user.months[m] ? 'status-ok' : 'status-ng'}">
                                        ${user.months && user.months[m] ? '●' : '－'}
                                    </td>
                                  `).join('')
                            }
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>
                window.onload = () => { window.print(); };
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

