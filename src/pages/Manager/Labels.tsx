import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { labelApi } from "../../api/labelApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ConfirmDialog } from "../../components/ui/Modal";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../components/ui/Table";

export default function Labels() {
    const navigate = useNavigate();
    const [labels, setLabels] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadLabels = async () => {
        setLoading(true);
        try {
            const data = await labelApi.getAllLabels();
            setLabels(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.message || "Không thể tải danh sách nhãn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLabels(); }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await labelApi.deleteLabel(deleteTarget.labelId ?? deleteTarget.id);
            setDeleteTarget(null);
            loadLabels();
        } catch (err) {
            setError(err?.message || "Xóa thất bại");
        } finally {
            setDeleting(false);
        }
    };

    const filtered = labels.filter((l) =>
        (l.labelName || l.name || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Quản lí nhãn</h1>
                <Button variant="secondary" onClick={() => navigate("/manager/labels/new")}>
                    <span className="material-symbols-outlined text-base mr-1">add</span>
                    Thêm nhãn
                </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Card className="p-6 space-y-4">
                <Input
                    placeholder="Tìm kiếm nhãn..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />

                {loading ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Đang tải...</p>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2 block">label_off</span>
                        <p className="text-muted-foreground">
                            {search ? "Không tìm thấy nhãn phù hợp" : "Chưa có nhãn nào"}
                        </p>
                        {!search && (
                            <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate("/manager/labels/new")}>
                                Tạo nhãn đầu tiên
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">Color</TableHead>
                                <TableHead>Tên nhãn</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Mô tả</TableHead>
                                <TableHead>Phím tắt</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((label) => (
                                <TableRow key={label.labelId ?? label.id}>
                                    <TableCell>
                                        <div
                                            className="w-5 h-5 rounded-full border border-border"
                                            style={{ backgroundColor: label.colorCode || "#888" }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{label.labelName ?? label.name}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                            {label.labelType ?? label.type ?? "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{label.description || "—"}</TableCell>
                                    <TableCell>
                                        {label.shortcutKey ? (
                                            <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs font-mono border border-border">{label.shortcutKey}</kbd>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(label)} title="Xóa nhãn">
                                            <span className="material-symbols-outlined text-base text-destructive">delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Xóa nhãn"
                message={`Bạn có chắc muốn xóa nhãn "${deleteTarget?.labelName ?? deleteTarget?.name}"?`}
                confirmText={deleting ? "Đang xóa..." : "Xóa"}
                isDestructive
            />
        </div>
    );
}
