import { analyticsApi } from "../api/analyticsApi";
import { assignmentApi } from "../api/assignmentApi";
import { datasetApi } from "../api/datasetApi";
import { projectApi } from "../api/projectApi";
import { isFeatureEnabled } from "../config/featureFlags";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const averageScore = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + toNumber(item?.performanceScore), 0);
  return total / items.length;
};

const normalizeUserId = (item) =>
  item?.userId ?? item?.user_id ?? item?.memberId ?? item?.member_id;

export const projectQueryKeys = {
  summaryList: (viewerId = "me", status = "all", scope = "active") => [
    "projects",
    "summary-list",
    viewerId,
    status,
    scope,
  ],
  detail: (projectId) => ["projects", "detail", Number(projectId)],
  overview: (projectId) => ["projects", "overview", Number(projectId)],
  datasets: (projectId) => ["projects", "datasets", Number(projectId)],
  assignments: (projectId) => ["projects", "assignments", Number(projectId)],
};

export const getHotspotQueryBehavior = (staleTime, gcTime) => {
  const cacheEnabled = isFeatureEnabled("perf_hotspot_cache");
  return {
    staleTime: cacheEnabled ? staleTime : 0,
    gcTime: cacheEnabled ? gcTime : 0,
    refetchOnMount: cacheEnabled ? false : "always",
  };
};

export const normalizeProjectCard = (project, fallbackManagerName = "Me") => ({
  project_id: project?.projectId ?? project?.project_id,
  name: project?.name ?? "Untitled",
  data_type: (project?.dataType ?? project?.data_type ?? project?.type ?? "unknown").toLowerCase(),
  status: (project?.computedDisplayStatus ?? project?.status ?? "unknown").toLowerCase(),
  raw_status: (project?.status ?? "unknown").toLowerCase(),
  manager_id: project?.managerId ?? project?.manager_id,
  manager: {
    full_name: project?.managerName ?? project?.manager?.full_name ?? fallbackManagerName,
  },
  created_at: project?.createdAt ?? project?.created_at ?? null,
  assignment_count: toNumber(project?.assignmentCount),
  approved_assignment_count: toNumber(project?.approvedAssignmentCount),
  in_progress_assignment_count: toNumber(project?.inProgressAssignmentCount),
  rejected_assignment_count: toNumber(project?.rejectedAssignmentCount),
  dataset_count: toNumber(project?.datasetCount),
  datasets: [],
});

export const normalizeProjectDetail = (raw, projectId) => ({
  project_id: raw?.projectId ?? raw?.project_id ?? Number(projectId),
  projectId: raw?.projectId ?? raw?.project_id ?? Number(projectId),
  name: raw?.name ?? "Untitled",
  data_type: (raw?.type ?? raw?.dataType ?? raw?.data_type ?? "unknown").toLowerCase(),
  status: (raw?.computedDisplayStatus ?? raw?.status ?? "unknown").toLowerCase(),
  raw_status: (raw?.status ?? "unknown").toLowerCase(),
  description: raw?.description ?? "",
  guidelineContent: raw?.guidelineContent ?? "",
  guidelineVersion: raw?.guidelineVersion ?? "v1.0",
  guidelineFileUrl: raw?.guidelineFileUrl ?? "",
  manager_name: raw?.managerName ?? raw?.manager_name ?? "",
  manager_id: raw?.managerId ?? raw?.manager_id ?? null,
  created_at: raw?.createdAt ?? raw?.created_at ?? "",
});

export const normalizeDatasetSummary = (dataset) => ({
  datasetId: dataset?.datasetId ?? dataset?.id,
  id: String(dataset?.datasetId ?? dataset?.id ?? ""),
  name: dataset?.batchName ?? dataset?.name ?? `Dataset ${dataset?.datasetId ?? dataset?.id ?? ""}`,
  status: dataset?.status ?? "PENDING",
  computedStatus: dataset?.computedStatus ?? dataset?.status ?? "PENDING",
  createdAt: dataset?.createdAt ?? dataset?.created_at ?? null,
  projectId: dataset?.projectId ?? dataset?.project_id ?? null,
  totalItems: toNumber(dataset?.totalItems),
});

export const normalizeAssignments = (raw) => {
  const arr = Array.isArray(raw) ? raw : raw?.content || raw?.data || [];
  return arr.map((item) => ({
    ...item,
    assignmentId: item?.assignmentId ?? item?.assignment_id,
    datasetId: item?.datasetId ?? item?.dataset_id,
    annotatorId: item?.annotatorId ?? item?.annotator_id,
    reviewerId: item?.reviewerId ?? item?.reviewer_id,
  }));
};

export async function fetchProjectSummaryList(viewerName = "Me") {
  const raw = await projectApi.getMyProjects();
  const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.content ?? [];
  return list.map((project) => normalizeProjectCard(project, viewerName));
}

export async function fetchProjectDetail(projectId) {
  const raw = await projectApi.getProjectById(Number(projectId));
  return normalizeProjectDetail(raw, projectId);
}

export async function fetchProjectOverview(projectId) {
  const [
    summaryData,
    progressData,
    qualityData,
    contributionData,
    memberScoreData,
    assignmentData,
    datasetData,
  ] = await Promise.all([
    analyticsApi.getProjectSummary(projectId),
    analyticsApi.getProjectProgress(projectId).catch(() => null),
    analyticsApi.getQualityMetrics(projectId).catch(() => null),
    analyticsApi.getTeamContributions(projectId).catch(() => []),
    analyticsApi.getMemberScores(projectId).catch(() => []),
    assignmentApi.getAssignmentsByProject(Number(projectId)).catch(() => []),
    datasetApi.getDatasetsByProject(Number(projectId)).catch(() => []),
  ]);

  const contributionRows = Array.isArray(contributionData) ? contributionData : [];
  const memberScores = Array.isArray(memberScoreData) ? memberScoreData : [];
  const contributorsByUserId = new Map();
  const scoreByUserId = new Map();

  memberScores.forEach((item) => {
    const userId = normalizeUserId(item);
    if (userId === undefined || userId === null) return;
    scoreByUserId.set(userId, toNumber(item?.performanceScore));
  });

  contributionRows.forEach((item) => {
    const userId = normalizeUserId(item);
    if (userId === undefined || userId === null) return;
    contributorsByUserId.set(userId, {
      ...item,
      userId,
      performanceScore: scoreByUserId.get(userId) ?? 0,
    });
  });

  memberScores.forEach((item) => {
    const userId = normalizeUserId(item);
    if (userId === undefined || userId === null) return;
    contributorsByUserId.set(userId, {
      ...(contributorsByUserId.get(userId) || {}),
      ...item,
      userId,
      performanceScore: scoreByUserId.get(userId) ?? 0,
    });
  });

  const contributors = Array.from(contributorsByUserId.values())
    .map((item) => ({
      ...item,
      userId: normalizeUserId(item),
      fullName: item?.fullName ?? item?.full_name ?? item?.name ?? item?.username ?? "N/A",
      username: item?.username ?? item?.fullName ?? item?.full_name ?? item?.name ?? "N/A",
      role: item?.role ?? item?.memberRole ?? item?.userRole ?? "ANNOTATOR",
      totalAssignments: toNumber(item?.totalAssignments ?? item?.assignedTasks ?? item?.taskCount),
      completedAssignments: toNumber(item?.completedAssignments ?? item?.completedTasks ?? item?.completedCount),
      performanceScore: scoreByUserId.get(normalizeUserId(item)) ?? 0,
    }))
    .sort((a, b) =>
      b.performanceScore - a.performanceScore ||
      b.completedAssignments - a.completedAssignments ||
      b.totalAssignments - a.totalAssignments,
    );

  return {
    summary: {
      ...summaryData,
      progress: progressData ?? summaryData?.progress,
      qualityMetrics: qualityData ?? summaryData?.qualityMetrics,
    },
    contributors,
    assignments: normalizeAssignments(assignmentData),
    datasets: (Array.isArray(datasetData) ? datasetData : datasetData?.content || datasetData?.data || []).map(normalizeDatasetSummary),
    teamAverageScore:
      memberScores.length > 0
        ? averageScore(memberScores)
        : toNumber(summaryData?.teamAveragePerformanceScore),
  };
}

export async function fetchProjectDatasets(projectId) {
  const raw = await datasetApi.getDatasetsByProject(Number(projectId));
  const arr = Array.isArray(raw) ? raw : raw?.content || raw?.data || [];
  return arr.map(normalizeDatasetSummary);
}

export async function fetchProjectAssignments(projectId) {
  const raw = await assignmentApi.getAssignmentsByProject(Number(projectId));
  return normalizeAssignments(raw);
}

export async function invalidateProjectSummaryData(queryClient, projectId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["projects", "summary-list"] }),
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(projectId) }),
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.overview(projectId) }),
  ]);
}

export async function invalidateProjectDatasetData(queryClient, projectId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.datasets(projectId) }),
    invalidateProjectSummaryData(queryClient, projectId),
  ]);
}

export async function invalidateProjectAssignmentData(queryClient, projectId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.assignments(projectId) }),
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.datasets(projectId) }),
    invalidateProjectSummaryData(queryClient, projectId),
  ]);
}
