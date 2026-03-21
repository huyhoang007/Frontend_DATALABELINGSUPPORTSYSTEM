import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    manifest: "demo/demo-seed.manifest.json",
    baseUrl: process.env.DEMO_API_BASE_URL || "http://localhost:8080",
    managerUser: process.env.DEMO_MANAGER_USER || "",
    managerPass: process.env.DEMO_MANAGER_PASS || "",
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--manifest") args.manifest = argv[++i];
    else if (arg === "--base-url") args.baseUrl = argv[++i];
    else if (arg === "--manager-user") args.managerUser = argv[++i];
    else if (arg === "--manager-pass") args.managerPass = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
  }

  return args;
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/$/, "");
}

async function apiRequest(baseUrl, token, pathname, options = {}) {
  const url = `${normalizeBaseUrl(baseUrl)}${pathname}`;
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.json) headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ?? (options.json ? JSON.stringify(options.json) : undefined)
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const error = new Error(String(data?.message || data || `HTTP ${response.status}`));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function login(baseUrl, username, password) {
  const auth = await apiRequest(baseUrl, null, "/api/auth/login", {
    method: "POST",
    json: { username, password }
  });
  return auth.accessToken || auth.token || auth.jwt || null;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function findByName(items, field, expected) {
  const needle = String(expected).trim().toLowerCase();
  return items.find((item) => String(item?.[field] || "").trim().toLowerCase() === needle);
}

async function listFilesRecursive(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(fullPath));
    } else if (/\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

async function ensureLabel(baseUrl, token, spec) {
  const labels = toArray(await apiRequest(baseUrl, token, "/api/labels"));
  const existing = findByName(labels, "labelName", spec.labelName);
  if (existing) return { id: existing.labelId || existing.id, created: false };

  const payload = {
    labelName: spec.labelName,
    colorCode: spec.colorCode,
    labelType: spec.labelType,
    description: spec.description || "",
    shortcutKey: spec.shortcutKey || null
  };

  let created;
  try {
    created = await apiRequest(baseUrl, token, "/api/labels", {
      method: "POST",
      json: payload
    });
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    if (!payload.shortcutKey || !message.includes("shortcut")) throw error;
    created = await apiRequest(baseUrl, token, "/api/labels", {
      method: "POST",
      json: { ...payload, shortcutKey: null }
    });
  }
  return { id: created.labelId || created.id, created: true };
}

async function ensureRule(baseUrl, token, spec, labelIds) {
  const rules = toArray(await apiRequest(baseUrl, token, "/api/label-rules"));
  const existing = findByName(rules, "name", spec.name) || findByName(rules, "ruleName", spec.name);
  if (existing) return { id: existing.ruleId || existing.id, created: false };

  const created = await apiRequest(baseUrl, token, "/api/label-rules", {
    method: "POST",
    json: {
      name: spec.name,
      ruleContent: spec.ruleContent,
      labelIds
    }
  });
  return { id: created.ruleId || created.id, created: true };
}

async function listPolicies(baseUrl, token) {
  const response = await apiRequest(baseUrl, token, "/api/policies?page=0&size=200");
  return toArray(response?.data ?? response);
}

async function ensurePolicy(baseUrl, token, spec) {
  const policies = await listPolicies(baseUrl, token);
  const existing = findByName(policies, "errorName", spec.errorName);
  if (existing) return { id: existing.policyId || existing.id, created: false };

  const created = await apiRequest(baseUrl, token, "/api/policies", {
    method: "POST",
    json: {
      errorName: spec.errorName,
      errorLevel: spec.errorLevel,
      description: spec.description || ""
    }
  });
  return { id: created.policyId || created.id, created: true };
}

async function ensureProject(baseUrl, token, spec) {
  const projects = toArray(await apiRequest(baseUrl, token, "/api/projects/my-projects"));
  const existing = findByName(projects, "name", spec.name);
  if (existing) {
    const updated = await apiRequest(baseUrl, token, `/api/projects/${existing.projectId || existing.id}`, {
      method: "PUT",
      json: {
        name: spec.name,
        dataType: "IMAGE",
        description: spec.description,
        guidelineContent: spec.guidelineContent || "",
        guidelineVersion: spec.guidelineVersion || "1.0"
      }
    });
    return { id: updated.projectId || updated.id, created: false };
  }

  const created = await apiRequest(baseUrl, token, "/api/projects", {
    method: "POST",
    json: {
      name: spec.name,
      dataType: "IMAGE",
      description: spec.description,
      guidelineContent: spec.guidelineContent || "",
      guidelineVersion: spec.guidelineVersion || "1.0"
    }
  });
  return { id: created.projectId || created.id, created: true };
}

async function ensureProjectRules(baseUrl, token, projectId, ruleIds) {
  await apiRequest(baseUrl, token, `/api/projects/${projectId}/label-rules`, {
    method: "PUT",
    json: { ruleIds }
  });
}

async function ensureProjectPolicies(baseUrl, token, projectId, policyIds) {
  const projectPolicies = toArray(await apiRequest(baseUrl, token, `/api/policies/project/${projectId}`));
  const existingIds = new Set(projectPolicies.map((item) => item.policyId || item.id));
  for (const policyId of policyIds) {
    if (!existingIds.has(policyId)) {
      await apiRequest(baseUrl, token, `/api/policies/assign?projectId=${projectId}&policyId=${policyId}`, {
        method: "POST"
      });
    }
  }
}

async function ensureDataset(baseUrl, token, projectId, projectSlug, batch, curatedRoot, generatedRoot) {
  const datasets = toArray(await apiRequest(baseUrl, token, `/api/projects/${projectId}/datasets`));
  const existing = findByName(datasets, "name", batch.name);
  if (existing) return { id: existing.datasetId || existing.id, created: false };

  const preferredDir = path.resolve(curatedRoot, projectSlug, batch.name);
  const fallbackDir = path.resolve(generatedRoot, projectSlug, batch.name);
  let files = [];
  try { files = await listFilesRecursive(preferredDir); } catch {}
  if (files.length === 0) {
    try { files = await listFilesRecursive(fallbackDir); } catch {}
  }
  if (files.length === 0) {
    throw new Error(`Không tìm thấy asset cho ${projectSlug}/${batch.name}. Hãy thêm curated assets hoặc chạy demo:assets.`);
  }

  const form = new FormData();
  form.append("batch_name", batch.name);
  for (const filePath of files.slice(0, batch.count)) {
    const buffer = await fs.readFile(filePath);
    form.append("files", new Blob([buffer]), path.basename(filePath));
  }

  const created = await apiRequest(baseUrl, token, `/api/projects/${projectId}/datasets`, {
    method: "POST",
    body: form
  });
  return { id: created.datasetId || created.id, created: true };
}

async function ensureAssignment(baseUrl, token, projectId, datasetId, annotatorId, reviewerId) {
  const assignments = toArray(await apiRequest(baseUrl, token, `/api/projects/${projectId}/assignments`));
  const existing = assignments.find((assignment) =>
    Number(assignment.datasetId) === Number(datasetId)
    && Number(assignment.annotatorId) === Number(annotatorId)
    && Number(assignment.reviewerId) === Number(reviewerId)
  );
  if (existing) return { id: existing.assignmentId || existing.id, created: false };

  const created = await apiRequest(baseUrl, token, `/api/projects/${projectId}/assignments`, {
    method: "POST",
    json: { datasetId, annotatorId, reviewerId }
  });
  return { id: created.assignmentId || created.id, created: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await fs.readFile(args.manifest, "utf8"));
  if (args.dryRun) {
    console.log(JSON.stringify({
      mode: "dry-run",
      manifest: path.resolve(args.manifest),
      projects: manifest.projects.map((project) => ({
        slug: project.slug,
        projectName: project.name,
        batches: project.batches.map((batch) => batch.name),
        labels: project.labels.length,
        rules: project.rules.length,
        errorTypes: project.errorTypes.length,
        assignments: project.assignments.length
      }))
    }, null, 2));
    return;
  }

  if (!args.managerUser || !args.managerPass) throw new Error("Thiếu --manager-user hoặc --manager-pass");

  const token = await login(args.baseUrl, args.managerUser, args.managerPass);
  const users = toArray(await apiRequest(args.baseUrl, token, "/api/users?page=0&size=200"));
  const resolveUserId = (username) => {
    const user = findByName(users, "username", username);
    if (!user) throw new Error(`Không tìm thấy user "${username}"`);
    return user.userId || user.id;
  };

  const labelMap = new Map();
  for (const labelSpec of manifest.libraries.labels) {
    const label = await ensureLabel(args.baseUrl, token, labelSpec);
    labelMap.set(labelSpec.key, label.id);
  }

  const ruleMap = new Map();
  for (const ruleSpec of manifest.libraries.rules) {
    const labelIds = ruleSpec.labelKeys.map((key) => {
      const labelId = labelMap.get(key);
      if (!labelId) throw new Error(`Label key "${key}" chưa có ID`);
      return labelId;
    });
    const rule = await ensureRule(args.baseUrl, token, ruleSpec, labelIds);
    ruleMap.set(ruleSpec.key, rule.id);
  }

  const policyMap = new Map();
  for (const policySpec of manifest.libraries.errorTypes) {
    const policy = await ensurePolicy(args.baseUrl, token, policySpec);
    policyMap.set(policySpec.key, policy.id);
  }

  const report = [];
  for (const projectSpec of manifest.projects) {
    const project = await ensureProject(args.baseUrl, token, projectSpec);
    const projectId = project.id;
    const ruleIds = projectSpec.rules.map((key) => ruleMap.get(key)).filter(Boolean);
    const policyIds = projectSpec.errorTypes.map((key) => policyMap.get(key)).filter(Boolean);

    await ensureProjectRules(args.baseUrl, token, projectId, ruleIds);
    await ensureProjectPolicies(args.baseUrl, token, projectId, policyIds);

    const datasets = new Map();
    for (const batch of projectSpec.batches) {
      const dataset = await ensureDataset(
        args.baseUrl,
        token,
        projectId,
        projectSpec.slug,
        batch,
        manifest.settings.curatedAssetRoot || "demo-assets/curated",
        manifest.settings.generatedAssetRoot || "demo-assets/generated"
      );
      datasets.set(batch.name, dataset);
    }

    const assignmentRows = [];
    for (const assignmentSpec of projectSpec.assignments) {
      const dataset = datasets.get(assignmentSpec.datasetName);
      if (!dataset) throw new Error(`Không tìm thấy dataset "${assignmentSpec.datasetName}" trong project "${projectSpec.slug}"`);
      const annotatorId = resolveUserId(assignmentSpec.annotatorUsername || manifest.defaultAccounts.annotatorUsername);
      const reviewerId = resolveUserId(assignmentSpec.reviewerUsername || manifest.defaultAccounts.reviewerUsername);
      const assignment = await ensureAssignment(args.baseUrl, token, projectId, dataset.id, annotatorId, reviewerId);
      assignmentRows.push({
        datasetName: assignmentSpec.datasetName,
        assignmentId: assignment.id,
        created: assignment.created,
        scenario: assignmentSpec.scenario
      });
    }

    report.push({
      slug: projectSpec.slug,
      projectId,
      datasets: Array.from(datasets.entries()).map(([datasetName, dataset]) => ({
        datasetName,
        datasetId: dataset.id,
        created: dataset.created
      })),
      assignments: assignmentRows
    });
  }

  const reportPath = path.resolve("demo/demo-seed-report.json");
  await fs.writeFile(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    baseUrl: args.baseUrl,
    report
  }, null, 2));

  console.log(JSON.stringify({ ok: true, reportPath, projects: report }, null, 2));
}

main().catch((error) => {
  console.error("[demo:seed] failed:", error.message);
  process.exitCode = 1;
});
