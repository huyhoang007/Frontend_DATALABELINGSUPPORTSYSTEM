import React, { useState, useEffect } from 'react';
import { activityLogApi } from '../../api/activityLogApi';
import { useToast } from '../../context/ToastContext';

export default function AdminActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;
    const [filters, setFilters] = useState({
        action: '',
        dateFrom: '',
        dateTo: ''
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const data = await activityLogApi.getAllLogs({ page: 0, size: 50 });
            setLogs(data.content || data || []);
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
            addToast('Không thể tải nhật ký hoạt động', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            let data;
            if (filters.dateFrom && filters.dateTo) {
                data = await activityLogApi.getLogsByDateRange(
                    filters.dateFrom + 'T00:00:00',
                    filters.dateTo + 'T23:59:59'
                );
            } else if (filters.action) {
                const result = await activityLogApi.getLogsByAction(filters.action);
                data = result.content || result || [];
            } else {
                const result = await activityLogApi.getAllLogs({ page: 0, size: 50 });
                data = result.content || result || [];
            }
            setLogs(Array.isArray(data) ? data : data.content || []);
        } catch (error) {
            console.error('Failed to search logs:', error);
            addToast('Không thể tìm kiếm nhật ký hoạt động', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const getActionColor = (action) => {
        const actionLower = action?.toLowerCase() || '';
        if (actionLower.includes('login') || actionLower.includes('auth')) return '#10b981';
        if (actionLower.includes('create') || actionLower.includes('add')) return '#3b82f6';
        if (actionLower.includes('update') || actionLower.includes('edit')) return '#f59e0b';
        if (actionLower.includes('delete') || actionLower.includes('remove')) return '#ef4444';
        return '#6b7280';
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(logs.length / logsPerPage);

    return (
        <div className="flex h-screen bg-background">
            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Nhật ký hoạt động toàn hệ thống
                        </h1>
                        <p className="text-muted-foreground">
                            Theo dõi tất cả hoạt động hệ thống và hành động người dùng
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Bộ lọc</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Hành động</label>
                                <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground">
                                    <option value="">Tất cả hành động</option>
                                    <option value="LOGIN">Đăng nhập</option>
                                    <option value="CREATE">Tạo mới</option>
                                    <option value="UPDATE">Cập nhật</option>
                                    <option value="DELETE">Xóa</option>
                                    <option value="VIEW">Xem</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Từ ngày</label>
                                <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Đến ngày</label>
                                <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground" />
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleSearch} disabled={isLoading} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors">
                                    {isLoading ? 'Đang tải...' : 'Tìm kiếm'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        {isLoading ? (
                            <div className="text-center text-muted-foreground py-12"><p>Đang tải nhật ký hoạt động...</p></div>
                        ) : logs.length === 0 ? (
                            <div className="text-center text-muted-foreground py-12"><p className="text-lg font-medium mb-2">Không tìm thấy nhật ký hoạt động</p><p className="text-sm">Nhật ký hoạt động sẽ xuất hiện ở đây khi người dùng thực hiện các hành động</p></div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-background/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Thời gian</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Người dùng</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hành động</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Đối tượng</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {currentLogs.map((log, index) => (
                                        <tr key={log.logId || log.id || index} className="hover:bg-accent/30 transition-colors">
                                            <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{formatDateTime(log.timestamp || log.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{log.username?.[0]?.toUpperCase() || log.userId?.[0] || '?'}</div>
                                                    <span className="text-sm text-foreground">{log.username || `User #${log.userId}`}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${getActionColor(log.action)}20`, color: getActionColor(log.action) }}>{log.action}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">{log.target || log.targetType || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{log.details || log.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!isLoading && logs.length > logsPerPage && (
                            <div className="flex items-center justify-between p-4 border-t border-border">
                                <div className="text-sm text-muted-foreground">Hiển thị {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, logs.length)} trong {logs.length} nhật ký</div>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Trước</button>
                                    <div className="px-3 py-1.5 text-sm border border-border rounded-lg bg-blue-600/10 text-blue-600 font-medium">{currentPage} / {totalPages}</div>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Sau</button>
                                </div>
                            </div>
                        )}
                    </div>
                    {logs.length > 0 && (<div className="mt-4 text-sm text-muted-foreground">Tổng cộng {logs.length} hoạt động</div>)}
                </div>
            </main>
        </div>
    );
}
