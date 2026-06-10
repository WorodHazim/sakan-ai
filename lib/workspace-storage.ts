import { CaseData, RecommendationResult } from "./types";

export const WORKSPACE_STORAGE_KEY = "sakan_workspace_cases";
export const CUSTOM_REPORTS_KEY = "sakan_custom_reports";

export type WorkspaceCase = {
  caseData: CaseData;
  recommendation: RecommendationResult;
  reasonCodes: string[];
  caseClassification?: {
    caseCategory: string;
    casePriority: string;
    categoryReason: string;
  };
  fullReport?: any;
  createdAt: string;
  source: "CUSTOM";
};

export function saveWorkspaceCase(workspaceCase: WorkspaceCase) {
  if (typeof window === "undefined") return;
  try {
    // 1. Separate the heavy fullReport to prevent QuotaExceededError in workspace array
    const { fullReport, ...lightweightCase } = workspaceCase;

    // 2. Load existing workspace cases
    const existingStr = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    let existingCases: WorkspaceCase[] = [];
    if (existingStr) {
      existingCases = JSON.parse(existingStr);
    }

    // 3. Update or append in workspace cases array
    const index = existingCases.findIndex(c => c.caseData.caseId === lightweightCase.caseData.caseId);
    if (index >= 0) {
      existingCases[index] = lightweightCase as WorkspaceCase;
    } else {
      existingCases.push(lightweightCase as WorkspaceCase);
    }

    // Sort to keep newest first
    existingCases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(existingCases));
    if (process.env.NODE_ENV === "development") {
      console.log("PERSISTENCE: saved workspace case", lightweightCase.caseData.caseId);
    }

    // 4. If there's a fullReport, save it to the reports key
    if (fullReport) {
      saveCustomReport(lightweightCase.caseData.caseId, fullReport);
    }
  } catch (err) {
    console.error("Failed to save workspace case to localStorage", err);
  }
}

export function getWorkspaceCases(): WorkspaceCase[] {
  if (typeof window === "undefined") return [];
  try {
    const existingStr = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (existingStr) {
      const parsed = JSON.parse(existingStr) as WorkspaceCase[];
      if (process.env.NODE_ENV === "development") {
        console.log("PERSISTENCE: loaded workspace cases", parsed.length);
      }
      return parsed;
    }
  } catch (err) {
    console.error("Failed to load workspace cases from localStorage", err);
  }
  return [];
}

export function saveCustomReport(caseId: string, fullReport: any) {
  if (typeof window === "undefined") return;
  try {
    const existingStr = localStorage.getItem(CUSTOM_REPORTS_KEY);
    let reports: Record<string, any> = {};
    if (existingStr) {
      reports = JSON.parse(existingStr);
    }
    reports[caseId] = fullReport;
    localStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(reports));
    if (process.env.NODE_ENV === "development") {
      console.log("PERSISTENCE: saved custom report", caseId);
    }
  } catch (err) {
    console.error("Failed to save custom report to localStorage", err);
  }
}

export function getCustomReport(caseId: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const existingStr = localStorage.getItem(CUSTOM_REPORTS_KEY);
    if (existingStr) {
      const reports = JSON.parse(existingStr);
      const found = !!reports[caseId];
      if (process.env.NODE_ENV === "development") {
        console.log("PERSISTENCE: loaded custom report", caseId, found);
      }
      return reports[caseId] || null;
    }
  } catch (err) {
    console.error("Failed to load custom report from localStorage", err);
  }
  return null;
}
