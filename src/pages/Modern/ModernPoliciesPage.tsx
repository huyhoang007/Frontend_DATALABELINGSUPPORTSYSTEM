import React, { useState, useEffect } from "react";
import { policyApi } from "../../api/policyApi";
import { projectApi } from "../../api/projectApi";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";

// Bảng màu Modern Enterprise UI (Atlassian/Jira style)
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  borderStrong: "#B3B9C4",
  textPrimary: "#172B4D",
  textSecondary: "#44546F",
  textMuted: "#626F86",
  brand: "#0C66E4",
  brandHover: "#0055CC",
  brandLight: "#E9F2FF",
  green: "#1F845A",
  greenBg: "#DCFFF1",
  amber: "#A54800",
  amberBg: "#FFF7D6",
  purple: "#5E4DB2",
  purpleBg: "#F3F0FF",
  red: "#DE350B",
  redBg: "#FFEBE6",
};

// Type declaration for toast
const useTypedToast = () =>
  useToast() as {
    addToast: (message: string, type?: "success" | "error" | "info") => void;
  };

interface Project {
  project_id: number;
  name: string;
  data_type: string;
  status: string;
  manager_id?: number;
}

interface Policy {
  policyId?: number;
  policy_id?: number;
  errorName?: string;
  error_name?: string;
  description?: string;
  errorLevel?: string;
  projects?: Project[];
}

const ModernPoliciesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useTypedToast();

  // Real data from backend
  const [policies, setPolicies] = useState<Policy[]>([]);

  // Form state for new policy
  const [newPolicy, setNewPolicy] = useState({
    errorName: "",
    description: "",
    errorLevel: "MEDIUM",
  });

  // Fetch policies on mount
  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const response = (await policyApi.list()) as {
        data: Policy[];
        meta: any;
      };
      const policyList: Policy[] = Array.isArray(response?.data)
        ? response.data
        : [];

      // Nếu backend không trả về projects trong policy,
      // fetch danh sách project rồi build ngược lại map policyId → projects[]
      const hasProjects = policyList.some((p) => (p.projects?.length || 0) > 0);
      if (!hasProjects && policyList.length > 0) {
        try {
          const projects: any[] = (await projectApi.getMyProjects()) as any[];
          // Với mỗi project, lấy policies áp dụng
          const projectPolicies = await Promise.all(
            projects.map(async (proj) => {
              // BE trả về projectId (camelCase)
              const pid = proj.projectId || proj.project_id;
              try {
                const pp = await policyApi.getByProject(pid);
                // BE có thể trả về object đơn hoặc array → normalize
                const ppList: Policy[] = Array.isArray(pp)
                  ? pp
                  : pp
                    ? [pp as Policy]
                    : [];
                return {
                  project: proj,
                  policyIds: ppList.map(
                    (p: Policy) => p.policyId || p.policy_id,
                  ),
                };
              } catch {
                return { project: proj, policyIds: [] };
              }
            }),
          );
          // Build map: policyId → Project[]
          const policyProjectMap: Record<number, Project[]> = {};
          projectPolicies.forEach(({ project, policyIds }) => {
            policyIds.forEach((pid) => {
              if (pid == null) return;
              if (!policyProjectMap[pid]) policyProjectMap[pid] = [];
              policyProjectMap[pid].push(project);
            });
          });
          // Gắn projects vào từng policy
          const enriched = policyList.map((p) => ({
            ...p,
            projects: policyProjectMap[p.policyId || p.policy_id || 0] || [],
          }));
          setPolicies(enriched);
        } catch {
          setPolicies(policyList);
        }
      } else {
        setPolicies(policyList);
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!newPolicy.errorName.trim()) {
      addToast("Tên lỗi là bắt buộc", "error");
      return;
    }

    setIsCreating(true);
    try {
      await policyApi.create({
        errorName: newPolicy.errorName.trim(),
        description: newPolicy.description || null,
        errorLevel: newPolicy.errorLevel,
      });
      addToast("Tạo lỗi thành công!", "success");
      setShowCreateModal(false);
      setNewPolicy({
        errorName: "",
        description: "",
        errorLevel: "MEDIUM",
      });
      fetchPolicies(); // Refresh list
    } catch (error: any) {
      addToast(error.message || "Không thể tạo lỗi", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    setNewPolicy({
      errorName: getPolicyName(policy),
      description: policy.description || "",
      errorLevel: (policy.errorLevel || "MEDIUM") as string,
    });
    setShowEditModal(true);
  };

  const handleUpdatePolicy = async () => {
    if (!selectedPolicy || !newPolicy.errorName.trim()) {
      addToast("Tên lỗi là bắt buộc", "error");
      return;
    }

    setIsCreating(true);
    try {
      await policyApi.update(getPolicyId(selectedPolicy), {
        errorName: newPolicy.errorName.trim(),
        description: newPolicy.description || null,
        errorLevel: newPolicy.errorLevel,
      });
      addToast("Cập nhật lỗi thành công!", "success");
      setShowEditModal(false);
      setSelectedPolicy(null);
      setNewPolicy({
        errorName: "",
        description: "",
        errorLevel: "MEDIUM",
      });
      fetchPolicies();
    } catch (error: any) {
      addToast(error.message || "Không thể cập nhật lỗi", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (policy: Policy) => {
    setPolicyToDelete(policy);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!policyToDelete) return;

    setIsDeleting(true);
    try {
      await policyApi.delete(getPolicyId(policyToDelete));
      addToast("Xóa lỗi thành công!", "success");
      setShowDeleteConfirm(false);
      setPolicyToDelete(null);
      fetchPolicies();
    } catch (error: any) {
      const errorMsg = error.message || "";
      // Check if error is due to foreign key constraint
      if (
        errorMsg.includes("foreign key") ||
        errorMsg.includes("is still referenced")
      ) {
        addToast(
          "Policy này đang được sử dụng bởi các review task. Vui lòng xóa policy ra khỏi các reviewing trước khi xóa.",
          "error",
        );
      } else {
        addToast(errorMsg || "Không thể xóa lỗi", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper functions
  const getPolicyName = (policy: Policy) =>
    policy.errorName || policy.error_name || "Unknown";
  const getPolicyId = (policy: Policy) =>
    policy.policyId || policy.policy_id || 0;

  const getPolicyIcon = (errorName: string) => {
    if (errorName.includes("Quality")) return "Q";
    if (errorName.includes("Consistency")) return "C";
    if (errorName.includes("Completeness")) return "M";
    if (errorName.includes("Boundary")) return "B";
    if (errorName.includes("Review")) return "R";
    return "P";
  };

  const getPolicyColor = (errorName: string) => {
    if (errorName.includes("Quality")) return "#f59e0b";
    if (errorName.includes("Consistency")) return "#3b82f6";
    if (errorName.includes("Completeness")) return "#10b981";
    if (errorName.includes("Boundary")) return "#8b5cf6";
    if (errorName.includes("Review")) return "#ef4444";
    return "#6b7280";
  };

  return (
    <div
      style={{
        padding: "32px",
        minHeight: "100vh",
        backgroundColor: T.bg,
      }}
    >
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: T.textPrimary,
                marginBottom: "8px",
              }}
            >
              Quản lý lỗi
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: T.textSecondary,
              }}
            >
              Quản lý các loại lỗi và tiêu chuẩn chất lượng cho dự án
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon="add"
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            Tạo lỗi mới
          </Button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              border: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              backgroundColor: T.brandLight,
              color: T.brand,
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {policies.length}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "500",
                opacity: 0.8,
              }}
            >
              Tổng các lỗi
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              border: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              backgroundColor: T.greenBg,
              color: T.green,
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {policies.reduce(
                (sum, policy) => sum + (policy.projects?.length || 0),
                0,
              )}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "500",
                opacity: 0.8,
              }}
            >
              Áp dụng cho dự án
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              border: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              backgroundColor: T.redBg,
              color: T.red,
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {policies.filter((p) => p.errorLevel === "CRITICAL").length}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "500",
                opacity: 0.8,
              }}
            >
              Lỗi cực nghiêm trọng
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              border: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              backgroundColor: "#FFEBE6",
              color: "#BF2600",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {policies.filter((p) => p.errorLevel === "HIGH").length}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "500",
                opacity: 0.8,
              }}
            >
              Lỗi cao
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              border: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              backgroundColor: T.amberBg,
              color: T.amber,
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {policies.filter((p) => p.errorLevel === "MEDIUM").length}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "500",
                opacity: 0.8,
              }}
            >
              Lỗi trung bình
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              border: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              backgroundColor: T.greenBg,
              color: T.green,
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {policies.filter((p) => p.errorLevel === "LOW").length}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "500",
                opacity: 0.8,
              }}
            >
              Lỗi nhẹ
            </div>
          </div>
        </div>
      </Card>

      {/* Policies Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "24px",
          marginTop: "32px",
        }}
      >
        {policies.map((policy) => (
          <Card
            key={policy.policy_id}
            className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60 hover:border-primary/30 group cursor-pointer"
            onClick={() => {
              setSelectedPolicy(policy);
              setShowDetailModal(true);
            }}
          >
            <div className="mb-4">
              <h3
                className="text-lg font-bold text-foreground truncate mb-1"
                title={getPolicyName(policy)}
              >
                {getPolicyName(policy)}
              </h3>
              <div
                className="inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: `${getPolicyColor(getPolicyName(policy))}15`,
                  color: getPolicyColor(getPolicyName(policy)),
                }}
              >
                Lỗi #{getPolicyId(policy)}
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
              {policy.description}
            </p>

            {/* Applied Projects */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Áp dụng cho {policy.projects?.length || 0} dự án:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {policy.projects?.slice(0, 2).map((project) => (
                  <div
                    key={project.project_id}
                    className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded-md text-[10px] font-medium"
                  >
                    {project.name}
                  </div>
                ))}
                {(policy.projects?.length || 0) > 2 && (
                  <div className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-[10px] font-medium">
                    +{(policy.projects?.length || 0) - 2} khác
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPolicy(policy);
                  }}
                  leftIcon="edit"
                >
                  Sửa
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 px-2 text-xs text-destructive bg-destructive/10 hover:bg-destructive/20 border-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(policy);
                  }}
                  leftIcon="delete"
                />
              </div>
              <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                {policy.projects?.length || 0} dự án
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Policy Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              {showEditModal ? "Chỉnh sửa lỗi" : "Tạo lỗi mới"}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Tên lỗi *
                </label>
                <input
                  type="text"
                  placeholder="Tên lỗi (vd: Annotation Quality)"
                  value={newPolicy.errorName}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, errorName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Mô tả
                </label>
                <textarea
                  placeholder="Mô tả lỗi..."
                  rows={4}
                  value={newPolicy.description}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-y min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Mức độ lỗi *
                </label>
                <select
                  value={newPolicy.errorLevel}
                  onChange={(e) =>
                    setNewPolicy({ ...newPolicy, errorLevel: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                >
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                  <option value="CRITICAL">Nghiêm trọng</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                disabled={isCreating}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={
                  showEditModal ? handleUpdatePolicy : handleCreatePolicy
                }
                isLoading={isCreating}
              >
                {showEditModal ? "Cập nhật" : "Tạo lỗi"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Policy Detail Modal */}
      {showDetailModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl p-0 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/20">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {getPolicyName(selectedPolicy)}
                </h2>
                <div
                  className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1"
                  style={{
                    backgroundColor: `${getPolicyColor(getPolicyName(selectedPolicy))}20`,
                    color: getPolicyColor(getPolicyName(selectedPolicy)),
                  }}
                >
                  Lỗi #{getPolicyId(selectedPolicy)}
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
              >
                X
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">
                  Mô tả lỗi
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-foreground/80 leading-relaxed border border-border/50">
                  {selectedPolicy.description}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  Dự án áp dụng
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                    {selectedPolicy.projects?.length || 0}
                  </span>
                </h3>
                <div className="space-y-2">
                  {selectedPolicy.projects?.map((project) => (
                    <div
                      key={project.project_id}
                      className="p-3 bg-card border border-border/60 rounded-lg flex items-center justify-between hover:border-primary/30 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-foreground text-sm">
                          {project.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {project.data_type} • {project.status}
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded text-xs font-mono">
                        Mã: {project.project_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/50 bg-muted/20 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowDetailModal(false)}>
                Đóng
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && policyToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Xác nhận xóa
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Bạn có chắc chắn muốn xóa policy{" "}
              <span className="font-semibold text-foreground">
                "{getPolicyName(policyToDelete)}"
              </span>{" "}
              không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Xóa
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernPoliciesPage;
