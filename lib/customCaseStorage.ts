export function saveCustomReport(report: any) {
  if (typeof window === "undefined") return;
  try {
    const key = "sakan_custom_reports";
    const raw = localStorage.getItem(key);
    let data: Record<string, any> = {};
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(r => {
            if (r.caseData?.caseId) data[r.caseData.caseId] = r;
          });
        } else if (typeof parsed === "object") {
          data = parsed;
        }
      } catch (e) {}
    }
    const caseId = report.caseData?.caseId || report.caseCode;
    if (caseId) {
      data[caseId] = report;
      localStorage.setItem(key, JSON.stringify(data));
      console.log("CUSTOM STORAGE save report", caseId, report.recommendation?.status || report.recommendation);
    }
  } catch (e) {
    console.error("Failed to save custom report", e);
  }
}

export function getCustomReports(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("sakan_custom_reports");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    let arr: any[] = [];
    if (Array.isArray(parsed)) {
      arr = parsed;
    } else if (typeof parsed === "object") {
      arr = Object.values(parsed);
    }
    console.log("CUSTOM STORAGE load reports count", arr.length);
    return arr;
  } catch (e) {
    console.warn("Failed to load custom reports", e);
    return [];
  }
}

export function getCustomReportById(caseId: string): any | null {
  const reports = getCustomReports();
  const found = reports.find(r => r.caseData?.caseId === caseId || r.caseCode === caseId);
  console.log("CUSTOM STORAGE report found", caseId, !!found);
  return found || null;
}

export function buildWorkspaceCaseFromReport(report: any) {
  return {
    caseData: report.caseData || report,
    recommendation: report.recommendation,
    reasonCodes: report.reasonCodes || [],
    caseClassification: report.caseClassification || { caseCategory: "Normal" },
    fullReport: report,
    createdAt: report.createdAt || new Date().toISOString(),
    source: "CUSTOM"
  };
}

export function saveWorkspaceCase(summary: any) {
  if (typeof window === "undefined") return;
  try {
    const key = "sakan_workspace_cases";
    const raw = localStorage.getItem(key);
    let arr: any[] = [];
    if (raw) {
      try {
        arr = JSON.parse(raw);
        if (!Array.isArray(arr)) arr = [];
      } catch (e) {}
    }
    const existingIdx = arr.findIndex(c => c.caseData?.caseId === summary.caseData?.caseId);
    if (existingIdx >= 0) {
      arr[existingIdx] = summary;
    } else {
      arr.push(summary);
    }
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error("Failed to save workspace case", e);
  }
}

export function getWorkspaceCases(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("sakan_workspace_cases");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    console.warn("Failed to load workspace cases", e);
    return [];
  }
}
