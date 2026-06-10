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
      
      const summary = buildWorkspaceCaseFromReport(report);
      saveWorkspaceCase(summary);
      
      const route = report.route || report.outcome || summary.recommendation.status;
      const bucket = "Requires Officer Action / Humanitarian Reviews";
      if (summary.recommendation.status === "Humanitarian Review Required") {
        console.log("WORKSPACE SAVE custom case", caseId, route, bucket);
      } else {
        console.log("WORKSPACE SAVE custom case", caseId, route, summary.recommendation.status);
      }
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
  const summary: any = {
    caseData: report.caseData || report,
    recommendation: { ...(report.recommendation || {}) },
    reasonCodes: report.reasonCodes || [],
    caseClassification: report.caseClassification || { caseCategory: "Normal" },
    fullReport: report,
    createdAt: report.createdAt || new Date().toISOString(),
    source: "CUSTOM"
  };

  const status = report.recommendation?.status || report.status || "";
  const route = report.route || report.outcome || report.finalRoute || "";
  const category = report.caseClassification?.caseCategory || report.caseCategory || "";
  const resPath = report.recommendation?.resolutionPath || report.resolutionPath || "";
  const nextAct = report.recommendation?.nextBestAction || report.nextBestAction || "";
  const factorsStr = JSON.stringify(report.keyDecisionFactors || []);
  const rcStr = JSON.stringify(report.reasonCodes || []);

  const isHumanitarian = 
    status.includes("Humanitarian Review Required") ||
    route.includes("Humanitarian Review Required") ||
    category.includes("Humanitarian") ||
    resPath.includes("Financial Stress Review") ||
    resPath.includes("Humanitarian") ||
    resPath.includes("Officer / Specialist Review") ||
    rcStr.includes("HUMANITARIAN_REVIEW") ||
    rcStr.includes("ROUTE_HUMANITARIAN_REVIEW") ||
    factorsStr.toLowerCase().includes("supporting evidence") ||
    factorsStr.toLowerCase().includes("human review") ||
    nextAct.toLowerCase().includes("human officer") ||
    nextAct.toLowerCase().includes("specialist");

  const hasEvidence = !!(summary.caseData?.supportingEvidenceFile) || ["CASE-C", "CASE-E"].includes(summary.caseData?.caseId);
  const isHumanitarianWithEvidence = isHumanitarian && hasEvidence;

  console.log("HUMANITARIAN NORMALIZE INPUT", summary.caseData?.caseId || report.caseCode, report);
  console.log("HUMANITARIAN NORMALIZE DETECTED", summary.caseData?.caseId || report.caseCode, isHumanitarianWithEvidence);

  if (isHumanitarianWithEvidence) {
    summary.workspaceBucket = "requiresOfficerAction";
    summary.section = "requiresOfficerAction";
    summary.group = "requiresOfficerAction";
    summary.recommendation.status = "Humanitarian Review Required";
    summary.recommendation.resolutionPath = "Financial Stress Review";
    summary.secondaryLabel = "Financial Stress Review";
    summary.caseClassification.caseCategory = "Humanitarian";
    summary.recommendation.priority = "Urgent";
    summary.recommendation.priorityReason = "Supporting evidence received; humanitarian officer review required.";
    summary.recommendation.nextBestAction = "Assign to specialist or human officer for humanitarian review.";
    console.log("HUMANITARIAN NORMALIZE OUTPUT BUCKET", summary.caseData?.caseId || report.caseCode, summary.workspaceBucket);
  } else if (isHumanitarian && !hasEvidence) {
    summary.workspaceBucket = "awaitingBeneficiaryAction";
    summary.section = "awaitingBeneficiaryAction";
    summary.group = "awaitingBeneficiaryAction";
    summary.recommendation.status = "Applicant Action Required";
    summary.caseClassification.caseCategory = "Supporting Evidence Required";
    summary.recommendation.priority = "Medium";
    summary.recommendation.priorityReason = "Missing supporting evidence for humanitarian request.";
    summary.recommendation.nextBestAction = "Wait for beneficiary to upload missing evidence.";
  }

  return summary;
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
