import { CaseData, RecommendationResult } from "./types";

export const WORKSPACE_STORAGE_KEY = "sakan_workspace_cases";

export type WorkspaceCase = {
  caseData: CaseData;
  recommendation: RecommendationResult;
  reasonCodes: string[];
  caseClassification?: {
    caseCategory: string;
    casePriority: string;
    categoryReason: string;
  };
  createdAt: string;
  source: "CUSTOM";
};

export function saveWorkspaceCase(workspaceCase: WorkspaceCase) {
  if (typeof window === "undefined") return;
  try {
    const existingStr = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    let existingCases: WorkspaceCase[] = [];
    if (existingStr) {
      existingCases = JSON.parse(existingStr);
    }

    const index = existingCases.findIndex(c => c.caseData.caseId === workspaceCase.caseData.caseId);
    if (index >= 0) {
      existingCases[index] = workspaceCase;
    } else {
      existingCases.push(workspaceCase);
    }

    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(existingCases));
    if (process.env.NODE_ENV === "development") {
      console.log("saved custom workspace case", workspaceCase);
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
      return JSON.parse(existingStr) as WorkspaceCase[];
    }
  } catch (err) {
    console.error("Failed to load workspace cases from localStorage", err);
  }
  return [];
}
