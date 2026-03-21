import React, { useState, useEffect } from 'react';
import { labelApi } from '../../api/labelApi';
import { labelRuleApi } from '../../api/labelRuleApi';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

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
const useTypedToast = () => useToast() as { addToast: (message: string, type?: 'success' | 'error' | 'info') => void };

interface Label {
  labelId?: number;
  label_id?: number;
  labelName?: string;
  label_name?: string;
  colorCode?: string;
  color_code?: string;
  labelType?: string;
  description?: string;
  shortcutKey?: string;
  isActive?: boolean;
}

interface LabelSummary {
  labelId: number;
  labelName: string;
  colorCode: string;
}

interface LabelRule {
  ruleId?: number;
  rule_id?: number;
  name: string;
  ruleContent?: string;
  rule_content?: string;
  labels?: LabelSummary[] | Label[];
}

const ModernLabelsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'labels' | 'rules'>('labels');
  const [showCreateLabelModal, setShowCreateLabelModal] = useState(false);
  const [showEditLabelModal, setShowEditLabelModal] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [showAttachLabelsModal, setShowAttachLabelsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isUpdatingRule, setIsUpdatingRule] = useState(false);
  const [isAttachingLabels, setIsAttachingLabels] = useState(false);
  const { addToast } = useTypedToast();

  // Real data from backend
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelView, setLabelView] = useState<'all' | 'active' | 'inactive'>('all');
  const [labelRules, setLabelRules] = useState<LabelRule[]>([]);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [editingRule, setEditingRule] = useState<LabelRule | null>(null);
  const [attachingRule, setAttachingRule] = useState<LabelRule | null>(null);

  // Form state for new label
  const [newLabel, setNewLabel] = useState({
    labelName: '',
    colorCode: '#3b82f6',
    labelType: 'OBJECT',
    description: '',
    shortcutKey: ''
  });

  // Form state for editing label
  const [editLabel, setEditLabel] = useState({
    labelName: '',
    colorCode: '#3b82f6',
    labelType: 'OBJECT',
    description: '',
    shortcutKey: ''
  });

  // Form state for new rule
  const [newRule, setNewRule] = useState({ name: '', ruleContent: '' });
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);

  // Form state for editing rule
  const [editRule, setEditRule] = useState({ name: '', ruleContent: '' });

  // Label ids to attach
  const [attachLabelIds, setAttachLabelIds] = useState<number[]>([]);

  const toggleLabelSelection = (id: number) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAttachLabelSelection = (id: number) => {
    setAttachLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Fetch labels and rules on mount
  useEffect(() => {
    fetchLabels();
    fetchLabelRules();
  }, []);

  const fetchLabels = async () => {
    setIsLoading(true);
    try {
      // Lấy tất cả labels để manager có thể kích hoạt lại label đã bị ngưng sử dụng
      const data = await labelApi.getAllLabels();
      setLabels(data || []);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabel.labelName.trim() || !newLabel.colorCode) {
      addToast('Tên nhãn và mã màu là bắt buộc', 'error');
      return;
    }

    setIsCreating(true);
    try {
      await labelApi.createLabel({
        labelName: newLabel.labelName.trim(),
        colorCode: newLabel.colorCode,
        labelType: newLabel.labelType,
        description: newLabel.description || null,
        shortcutKey: newLabel.shortcutKey || null
      });
      addToast('Tạo nhãn thành công!', 'success');
      setShowCreateLabelModal(false);
      setNewLabel({
        labelName: '',
        colorCode: '#3b82f6',
        labelType: 'OBJECT',
        description: '',
        shortcutKey: ''
      });
      fetchLabels(); // Refresh list
    } catch (error: any) {
      addToast(error.message || 'Không thể tạo nhãn', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (label: Label) => {
    setEditingLabel(label);
    setEditLabel({
      labelName: getLabelName(label),
      colorCode: getLabelColor(label),
      labelType: label.labelType || 'OBJECT',
      description: label.description || '',
      shortcutKey: label.shortcutKey || ''
    });
    setShowEditLabelModal(true);
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel || !editLabel.labelName.trim()) {
      addToast('Tên nhãn là bắt buộc', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      await labelApi.updateLabel(getLabelId(editingLabel), {
        labelName: editLabel.labelName.trim(),
        colorCode: editLabel.colorCode,
        labelType: editLabel.labelType,
        description: editLabel.description || null,
        shortcutKey: editLabel.shortcutKey || null
      });
      addToast('Cập nhật nhãn thành công!', 'success');
      setShowEditLabelModal(false);
      setEditingLabel(null);
      fetchLabels(); // Refresh list
    } catch (error: any) {
      addToast(error.message || 'Không thể cập nhật nhãn', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn ngưng sử dụng nhãn này?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await labelApi.deleteLabel(labelId);
      addToast('Đã ngưng sử dụng nhãn!', 'success');
      fetchLabels(); // Refresh list
    } catch (error: any) {
      addToast(error.message || 'Không thể xóa nhãn', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateLabel = async (labelId: number) => {
    if (!window.confirm('Kích hoạt lại nhãn này?')) {
      return;
    }

    setIsActivating(true);
    try {
      await labelApi.activateLabel(labelId);
      addToast('Kích hoạt lại nhãn thành công!', 'success');
      fetchLabels();
    } catch (error: any) {
      addToast(error.message || 'Không thể kích hoạt lại nhãn', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const fetchLabelRules = async () => {
    try {
      const data = await labelRuleApi.getAllRules();
      setLabelRules(data || []);
    } catch (error) {
      console.error('Failed to fetch label rules:', error);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      addToast('Tên rule là bắt buộc', 'error');
      return;
    }
    if (selectedLabelIds.length === 0) {
      addToast('Vui lòng chọn ít nhất một label', 'error');
      return;
    }

    setIsCreatingRule(true);
    try {
      await labelRuleApi.createRule({
        name: newRule.name.trim(),
        ruleContent: newRule.ruleContent || null,
        labelIds: selectedLabelIds
      });
      addToast('Tạo rule thành công!', 'success');
      setShowCreateRuleModal(false);
      setNewRule({ name: '', ruleContent: '' });
      setSelectedLabelIds([]);
      fetchLabelRules();
    } catch (error: any) {
      addToast(error.message || 'Không thể tạo rule', 'error');
    } finally {
      setIsCreatingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa rule này?')) return;
    try {
      await labelRuleApi.deleteRule(ruleId);
      addToast('Xóa rule thành công!', 'success');
      fetchLabelRules();
    } catch (error: any) {
      addToast(error.message || 'Không thể xóa rule', 'error');
    }
  };

  const handleEditRuleClick = (rule: LabelRule) => {
    setEditingRule(rule);
    setEditRule({ name: rule.name, ruleContent: rule.ruleContent ?? rule.rule_content ?? '' });
    setShowEditRuleModal(true);
  };

  const handleUpdateRule = async () => {
    if (!editingRule || !editRule.name.trim()) {
      addToast('Tên rule là bắt buộc', 'error');
      return;
    }
    setIsUpdatingRule(true);
    try {
      await labelRuleApi.updateRule((editingRule.ruleId ?? editingRule.rule_id) as number, {
        name: editRule.name.trim(),
        ruleContent: editRule.ruleContent || null
      });
      addToast('Cập nhật rule thành công!', 'success');
      setShowEditRuleModal(false);
      setEditingRule(null);
      fetchLabelRules();
    } catch (error: any) {
      addToast(error.message || 'Không thể cập nhật rule', 'error');
    } finally {
      setIsUpdatingRule(false);
    }
  };

  const handleAttachLabelsClick = (rule: LabelRule) => {
    setAttachingRule(rule);
    setAttachLabelIds([]);
    setShowAttachLabelsModal(true);
  };

  const handleAttachLabels = async () => {
    if (!attachingRule || attachLabelIds.length === 0) {
      addToast('Vui lòng chọn ít nhất một label', 'error');
      return;
    }
    setIsAttachingLabels(true);
    try {
      await labelRuleApi.attachLabels(
        (attachingRule.ruleId ?? attachingRule.rule_id) as number,
        attachLabelIds
      );
      addToast('Thêm label vào rule thành công!', 'success');
      setShowAttachLabelsModal(false);
      setAttachingRule(null);
      setAttachLabelIds([]);
      fetchLabelRules();
    } catch (error: any) {
      addToast(error.message || 'Không thể thêm label', 'error');
    } finally {
      setIsAttachingLabels(false);
    }
  };

  // Helper to get label name/color from backend response
  const getLabelName = (label: Label) => label.labelName || label.label_name || 'Unknown';
  const getLabelColor = (label: Label) => label.colorCode || label.color_code || '#3b82f6';
  const getLabelId = (label: Label) => label.labelId || label.label_id || 0;
  const isLabelActive = (label: Label) => label.isActive !== false;

  const visibleLabels = labels.filter((label) => {
    if (labelView === 'active') return isLabelActive(label);
    if (labelView === 'inactive') return !isLabelActive(label);
    return true;
  });

  const activeLabels = labels.filter((label) => isLabelActive(label));

  return (
    <div style={{
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: T.bg,
    }}>
      {/* Header */}
      <Card className="p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: T.textPrimary,
              marginBottom: '8px',
            }}>
              Quản lý nhãn & quy tắc
            </h1>
            <p style={{
              fontSize: '15px',
              color: T.textSecondary,
            }}>
              Quản lý labels và label rules cho các dự án gán nhãn
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowCreateLabelModal(true)}
            >
              Tạo Label
            </Button>
            <Button
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { setSelectedLabelIds([]); setNewRule({ name: '', ruleContent: '' }); setShowCreateRuleModal(true); }}
            >
              Tạo Rule
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveTab('labels')}
            className={cn(
              "flex-1 py-3 px-5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === 'labels'
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            Nhãn ({labels.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              "flex-1 py-3 px-5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === 'rules'
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            Quy tắc nhãn ({labelRules.length})
          </button>
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'labels' ? (
        // Labels Grid
        <>
          <Card className="p-4 mb-6 bg-card dark:bg-slate-800/60 backdrop-blur-xl border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Tổng nhãn: <span className="font-semibold text-foreground">{labels.length}</span>
                {' · '}
                Đang hoạt động: <span className="font-semibold text-emerald-600">{activeLabels.length}</span>
                {' · '}
                Ngưng sử dụng: <span className="font-semibold text-amber-600">{labels.length - activeLabels.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={labelView === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setLabelView('all')}>
                  Tất cả
                </Button>
                <Button variant={labelView === 'active' ? 'primary' : 'secondary'} size="sm" onClick={() => setLabelView('active')}>
                  Đang hoạt động
                </Button>
                <Button variant={labelView === 'inactive' ? 'primary' : 'secondary'} size="sm" onClick={() => setLabelView('inactive')}>
                  Ngưng sử dụng
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {visibleLabels.map((label) => (
            <Card
              key={getLabelId(label)}
              className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/80 backdrop-blur border-border/60 group cursor-pointer"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground mb-1 truncate">
                  {getLabelName(label)}
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: getLabelColor(label) }}
                  />
                  <div className="text-xs text-muted-foreground font-mono">
                    {getLabelColor(label)}
                  </div>
                </div>
                <div className="mt-3">
                  <span
                    className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: isLabelActive(label) ? `${T.green}20` : `${T.amber}20`,
                      color: isLabelActive(label) ? T.green : T.amber,
                    }}
                  >
                    {isLabelActive(label) ? 'Đang hoạt động' : 'Ngưng sử dụng'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: `${getLabelColor(label)}20`,
                    color: getLabelColor(label)
                  }}
                >
                  Mã: {getLabelId(label)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-blue-500 hover:bg-blue-500/10"
                    onClick={(e) => { e.stopPropagation(); handleEditClick(label); }}
                    disabled={isDeleting || isActivating}
                  >
                    Sửa
                  </Button>
                  {isLabelActive(label) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-amber-600 hover:bg-amber-500/10"
                      onClick={(e) => { e.stopPropagation(); handleDeleteLabel(getLabelId(label)); }}
                      disabled={isDeleting || isActivating}
                    >
                      Ngưng dùng
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10"
                      onClick={(e) => { e.stopPropagation(); handleActivateLabel(getLabelId(label)); }}
                      disabled={isDeleting || isActivating}
                    >
                      Kích hoạt lại
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          </div>
        </>
      ) : (
        // Label Rules List
        <Card className="bg-card dark:bg-slate-800/60 backdrop-blur-xl border-border/50 overflow-hidden">
          {labelRules.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Chưa có rule nào. Hãy tạo rule đầu tiên!</p>
            </div>
          ) : null}
          {labelRules.map((rule, index) => (
            <div
              key={rule.ruleId ?? rule.rule_id}
              className={cn(
                "p-6 transition-all duration-200 hover:bg-muted/40",
                index < labelRules.length - 1 && "border-b border-border/50"
              )}
            >
              <div className="flex items-start gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {rule.name}
                    </h3>
                    <div className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold uppercase tracking-wide">
                      Quy tắc #{rule.ruleId ?? rule.rule_id}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {rule.ruleContent ?? rule.rule_content}
                  </p>

                  {/* Associated Labels */}
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2 font-medium">
                      Nhãn liên kết ({rule.labels?.length || 0}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rule.labels?.map((label: any) => (
                        <div
                          key={getLabelId(label)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border"
                          style={{
                            backgroundColor: `${getLabelColor(label)}10`,
                            borderColor: `${getLabelColor(label)}30`,
                            color: getLabelColor(label)
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getLabelColor(label) }}
                          />
                          {getLabelName(label)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800"
                      onClick={() => handleEditRuleClick(rule)}
                    >
                      Chỉnh sửa
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800"
                      onClick={() => handleAttachLabelsClick(rule)}
                    >
                      Thêm label
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs text-red-600 bg-red-500/10 hover:bg-red-500/20 border-red-200 dark:border-red-800"
                      onClick={() => handleDeleteRule((rule.ruleId ?? rule.rule_id) as number)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Create Label Modal */}
      {showCreateLabelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              Tạo label mới
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tên nhãn *</label>
                <input
                  type="text"
                  placeholder="Tên label (vd: Person, Car, Building)"
                  value={newLabel.labelName}
                  onChange={(e) => setNewLabel({ ...newLabel, labelName: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mã màu *</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={newLabel.colorCode}
                    onChange={(e) => setNewLabel({ ...newLabel, colorCode: e.target.value })}
                    className="w-12 h-10 p-0.5 rounded-lg border border-input bg-background cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Mã màu (vd: #3b82f6)"
                    value={newLabel.colorCode}
                    onChange={(e) => setNewLabel({ ...newLabel, colorCode: e.target.value })}
                    className="flex-1 px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Loại nhãn *</label>
                <select
                  value={newLabel.labelType}
                  onChange={(e) => setNewLabel({ ...newLabel, labelType: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                >
                  <option value="OBJECT">Phát hiện đối tượng</option>
                  <option value="CLASSIFICATION">Phân loại</option>
                  <option value="SEGMENTATION">Phân đoạn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phím tắt (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="VD: P, ctrl+1, alt+a, ..."
                  value={newLabel.shortcutKey}
                  onChange={(e) => setNewLabel({ ...newLabel, shortcutKey: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground mt-1">Có thể nhập nhiều ký tự để tìm kiếm nhanh khi gán nhãn</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => setShowCreateLabelModal(false)}
                disabled={isCreating}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateLabel}
                disabled={isCreating}
                leftIcon={isCreating ? "loading" : "save"}
              >
                {isCreating ? 'Đang tạo...' : 'Tạo mới'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Label Modal */}
      {showEditLabelModal && editingLabel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              Chỉnh sửa label
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tên nhãn *</label>
                <input
                  type="text"
                  value={editLabel.labelName}
                  onChange={(e) => setEditLabel({ ...editLabel, labelName: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mã màu *</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={editLabel.colorCode}
                    onChange={(e) => setEditLabel({ ...editLabel, colorCode: e.target.value })}
                    className="w-12 h-10 p-0.5 rounded-lg border border-input bg-background cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editLabel.colorCode}
                    onChange={(e) => setEditLabel({ ...editLabel, colorCode: e.target.value })}
                    className="flex-1 px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Loại nhãn *</label>
                <select
                  value={editLabel.labelType}
                  onChange={(e) => setEditLabel({ ...editLabel, labelType: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                >
                  <option value="OBJECT">Phát hiện đối tượng</option>
                  <option value="CLASSIFICATION">Phân loại</option>
                  <option value="SEGMENTATION">Phân đoạn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phím tắt (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="VD: P, ctrl+1, alt+a, ..."
                  value={editLabel.shortcutKey}
                  onChange={(e) => setEditLabel({ ...editLabel, shortcutKey: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground mt-1">Có thể nhập nhiều ký tự để tìm kiếm nhanh khi gán nhãn</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => setShowEditLabelModal(false)}
                disabled={isUpdating}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateLabel}
                disabled={isUpdating}
                leftIcon={isUpdating ? "loading" : "save"}
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateRuleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              Tạo rule mới
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tên rule *</label>
                <input
                  type="text"
                  placeholder="Tên quy tắc"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nội dung rule (tùy chọn)</label>
                <textarea
                  placeholder="Mô tả chi tiết quy tắc..."
                  value={newRule.ruleContent}
                  onChange={(e) => setNewRule({ ...newRule, ruleContent: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Chọn labels *{' '}
                  <span className="text-primary font-semibold">
                    ({selectedLabelIds.length} đã chọn)
                  </span>
                </label>
                {activeLabels.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">Chưa có label nào. Hãy tạo label trước.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-input rounded-lg divide-y divide-border/50 bg-background">
                    {activeLabels.map((label) => {
                      const id = getLabelId(label);
                      const color = getLabelColor(label);
                      const name = getLabelName(label);
                      const checked = selectedLabelIds.includes(id);
                      return (
                        <label
                          key={id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors",
                            checked && "bg-primary/5"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLabelSelection(id)}
                            className="accent-primary w-4 h-4 cursor-pointer"
                          />
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm text-foreground font-medium">{name}</span>
                          <span className="text-xs text-muted-foreground font-mono ml-auto">{color}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => { setShowCreateRuleModal(false); setSelectedLabelIds([]); setNewRule({ name: '', ruleContent: '' }); }}
                disabled={isCreatingRule}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateRule}
                disabled={isCreatingRule}
                leftIcon={isCreatingRule ? "loading" : "save"}
              >
                {isCreatingRule ? 'Đang tạo...' : 'Tạo rule'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Rule Modal */}
      {showEditRuleModal && editingRule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              {showEditRuleModal ? 'Chỉnh sửa rule' : 'Tạo rule mới'}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tên rule *</label>
                <input
                  type="text"
                  value={editRule.name}
                  onChange={(e) => setEditRule({ ...editRule, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nội dung rule (tùy chọn)</label>
                <textarea
                  value={editRule.ruleContent}
                  onChange={(e) => setEditRule({ ...editRule, ruleContent: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => { setShowEditRuleModal(false); setEditingRule(null); }}
                disabled={isUpdatingRule}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateRule}
                disabled={isUpdatingRule}
                leftIcon={isUpdatingRule ? "loading" : "save"}
              >
                {isUpdatingRule ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Attach Labels Modal */}
      {showAttachLabelsModal && attachingRule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-card dark:bg-slate-900 shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              Thêm label vào rule
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Rule: <span className="font-semibold text-foreground">{attachingRule.name}</span>
            </p>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Chọn labels để thêm{' '}
                <span className="text-primary font-semibold">({attachLabelIds.length} đã chọn)</span>
              </label>
              {activeLabels.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">Chưa có label nào.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-input rounded-lg divide-y divide-border/50 bg-background mb-6">
                  {activeLabels.map((label) => {
                    const id = getLabelId(label);
                    const color = getLabelColor(label);
                    const name = getLabelName(label);
                    const checked = attachLabelIds.includes(id);
                    // Gray out labels already attached to this rule
                    const alreadyAttached = (attachingRule.labels as any[])?.some(
                      (l: any) => (l.labelId ?? l.label_id) === id
                    );
                    return (
                      <label
                        key={id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors",
                          checked && "bg-primary/5",
                          alreadyAttached && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={alreadyAttached}
                          onChange={() => !alreadyAttached && toggleAttachLabelSelection(id)}
                          className="accent-primary w-4 h-4 cursor-pointer"
                        />
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm text-foreground font-medium">{name}</span>
                        {alreadyAttached && (
                          <span className="text-[10px] text-muted-foreground ml-auto">đã có</span>
                        )}
                        {!alreadyAttached && (
                          <span className="text-xs text-muted-foreground font-mono ml-auto">{color}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={() => { setShowAttachLabelsModal(false); setAttachingRule(null); setAttachLabelIds([]); }}
                disabled={isAttachingLabels}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleAttachLabels}
                disabled={isAttachingLabels || attachLabelIds.length === 0}
                leftIcon={isAttachingLabels ? "loading" : "save"}
              >
                {isAttachingLabels ? 'Đang thêm...' : `Thêm ${attachLabelIds.length > 0 ? attachLabelIds.length + ' label' : ''}`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernLabelsPage;