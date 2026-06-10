export type WorkloadGroup = "officer_action" | "beneficiary_action" | "direct_outcome";

export function getWorkloadGroup(status: string, caseCategory?: string): WorkloadGroup {
  const s = status || "";

  if (
    s === "Recommended for Approval / Ready for Officer Confirmation" ||
    s === "Recommended for Approval / Ready for Officer Confirmation" ||
    s === "Approved" ||
    s === "Officer Approved Recommendation" ||
    s === "Humanitarian Review Required" ||
    s === "Human Review Required" ||
    s === "Assigned to Senior Officer"
  ) {
    return "officer_action";
  }

  if (
    s === "Applicant Action Required" ||
    s === "Additional Information Required" ||
    s === "Waiting for Applicant Documents" ||
    s === "Awaiting Applicant Response" ||
    caseCategory === "Document Correction Required" ||
    caseCategory === "Supporting Evidence Required"
  ) {
    return "beneficiary_action";
  }

  return "direct_outcome";
}

export function isReadyForConfirmationStatus(status: string): boolean {
  const s = status || "";
  return (
    s === "Recommended for Approval / Ready for Officer Confirmation" ||
    s === "Recommended for Approval / Ready for Officer Confirmation" ||
    s === "Approved" ||
    s === "Officer Approved Recommendation"
  );
}

export function isHumanitarianReviewStatus(status: string): boolean {
  const s = status || "";
  return (
    s === "Humanitarian Review Required" ||
    s === "Human Review Required" ||
    s === "Assigned to Senior Officer"
  );
}

export function getWorkspaceDisplayStatus(caseId: string, status: string, isAr: boolean): string {
  if (caseId === "CASE-A") {
    return isAr ? "جاهز لاعتماد الموظف" : "Ready for Officer Confirmation";
  }
  if (caseId === "CASE-B") {
    return isAr ? "بانتظار تصحيح المستفيد" : "Awaiting Beneficiary Correction";
  }
  if (caseId === "CASE-C" || caseId === "CASE-E") {
    return isAr ? "مراجعة إنسانية مطلوبة" : "Humanitarian Review Required";
  }
  if (caseId === "CASE-D") {
    return isAr ? "لم يتم التوجيه للموظف" : "Not Routed to Officer";
  }

  if (isReadyForConfirmationStatus(status)) {
    return isAr ? "جاهز لاعتماد الموظف" : "Ready for Officer Confirmation";
  }
  if (isHumanitarianReviewStatus(status)) {
    return isAr ? "مراجعة إنسانية مطلوبة" : "Humanitarian Review Required";
  }
  if (getWorkloadGroup(status) === "beneficiary_action") {
    return isAr ? "بانتظار تصحيح المستفيد" : "Awaiting Beneficiary Correction";
  }
  return isAr ? "لم يتم التوجيه للموظف" : "Not Routed to Officer";
}
