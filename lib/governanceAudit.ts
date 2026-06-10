import { checkHasBlockingDocumentIssues } from "@/lib/agent-orchestrator";
import { DecisionReportPackage, AuditTrailEvent } from "@/lib/types";

export type AuditFilterCategory = "All" | "Document" | "Financial" | "Policy" | "Routing" | "Communication";

export const AUDIT_FILTER_TABS: AuditFilterCategory[] = [
  "All",
  "Document",
  "Financial",
  "Policy",
  "Routing",
  "Communication",
];

export type GovernanceAuditEvent = AuditTrailEvent & {
  agentName: string;
  inputSource: string;
  reasonCode: string;
  governanceRule: string;
  routeImpact: string;
  category: Exclude<AuditFilterCategory, "All">;
};

function ts(offsetMs: number) {
  return new Date(Date.now() - offsetMs).toISOString();
}

export function getOcrDataSourceLabel(caseId: string, hasCachedOcr: boolean): string {
  if (caseId.startsWith("CASE-")) return "Demo OCR";
  if (hasCachedOcr) return "Cached OCR";
  return "Live OCR";
}

function isReadyForConfirmation(status: string): boolean {
  return (
    status === "Recommended for Approval / Ready for Officer Confirmation" ||
    status === "Recommended for Approval / Ready for Officer Confirmation" ||
    status === "Approved" ||
    status === "Officer Approved Recommendation"
  );
}

function isApplicantAction(status: string): boolean {
  return (
    status === "Applicant Action Required" ||
    status === "Additional Information Required" ||
    status === "Waiting for Applicant Documents"
  );
}

function isHumanitarian(status: string): boolean {
  return (
    status === "Humanitarian Review Required" ||
    status === "Human Review Required" ||
    status === "Assigned to Senior Officer"
  );
}

function getDocumentReasonCodes(report: DecisionReportPackage): string[] {
  const dv = report.documentValidation;
  const codes: string[] = [];
  if (dv.documentStatus === "Expired" || report.caseData.salaryCertificateExpired) {
    codes.push("DOC_EXPIRED_CERTIFICATE");
  }
  if (dv.mismatch) codes.push("DOC_SALARY_MISMATCH");
  if (dv.bankCrossCheck.consistencyResult === "Inconsistent") codes.push("DOC_BANK_INCONSISTENCY");
  if (!dv.salaryCertificateChecks.hasAuthorizedSignature) codes.push("DOC_MISSING_SIGNATURE");
  if (dv.salaryCertificateChecks.hasStamp === false) codes.push("DOC_MISSING_STAMP");
  if (dv.ocrConfidenceLow || dv.ocrNeedsReview) codes.push("DOC_LOW_CONFIDENCE");
  if (codes.length === 0) codes.push("DOC_VALID");
  return codes;
}

function getRouteReasonCode(status: string): string {
  if (isReadyForConfirmation(status)) return "ROUTE_READY_FOR_CONFIRMATION";
  if (isApplicantAction(status)) return "ROUTE_APPLICANT_ACTION";
  if (isHumanitarian(status)) return "ROUTE_HUMAN_REVIEW";
  return "ROUTE_DIRECT_BENEFICIARY_OUTCOME";
}

function getRouteImpact(status: string): string {
  if (isReadyForConfirmation(status)) return "Routed for officer confirmation";
  if (isApplicantAction(status)) return "Not routed to officer";
  if (isHumanitarian(status)) return "Routed to specialist/human review";
  return "Direct beneficiary outcome — not routed to officer";
}

function getOfficerRoutingStatus(status: string, isAr: boolean): string {
  if (isReadyForConfirmation(status) || isHumanitarian(status)) {
    return isAr ? "يتطلب اعتماد/مراجعة موظف مخول" : "Requires authorized officer confirmation or review";
  }
  return isAr ? "لم يتم التوجيه للموظف" : "Not routed to officer";
}

export function buildGovernanceAuditTrail(
  report: DecisionReportPackage,
  ocrSource: string
): GovernanceAuditEvent[] {
  const status = report.recommendation.status;
  const fc = report.financialCapacity;
  const dv = report.documentValidation;
  const docCodes = getDocumentReasonCodes(report);
  const hasDocIssues = checkHasBlockingDocumentIssues(report.caseData, dv);
  const capPassed = fc.proposedTotalDeduction <= fc.max20PercentDeduction;
  const termPassed =
    fc.proposedDurationMonths === null ||
    fc.proposedDurationMonths <= report.caseData.remainingRepaymentMonths;

  const events: GovernanceAuditEvent[] = [
    {
      timestamp: ts(120000),
      actor: "Beneficiary",
      agentName: "Applicant Intake",
      action: "Applicant declaration submitted",
      inputSource: "Applicant Form",
      result: "Success",
      reasonCode: "AUDIT_TRACE_COMPLETED",
      governanceRule: "All submissions require a signed applicant declaration",
      routeImpact: "Processing started",
      category: "Communication",
    },
    {
      timestamp: ts(110000),
      actor: "AI Agent",
      agentName: "Identity Intake Agent",
      action: "Identity and profile data loaded",
      inputSource: "UAE PASS Mock Profile",
      result: "Success",
      reasonCode: "AUDIT_TRACE_COMPLETED",
      governanceRule: "Identity must be verified before loan review",
      routeImpact: "Eligible for document validation",
      category: "Routing",
    },
    {
      timestamp: ts(100000),
      actor: "AI Agent",
      agentName: "Loan Data Agent",
      action: "MOEI loan record and payment history retrieved",
      inputSource: "MOEI Mock Loan Record",
      result: "Success",
      reasonCode: "AUDIT_TRACE_COMPLETED",
      governanceRule: "Active loan context is required for rescheduling review",
      routeImpact: "Financial analysis enabled",
      category: "Financial",
    },
    {
      timestamp: ts(90000),
      actor: "AI Agent",
      agentName: "Document Intelligence Agent",
      action: hasDocIssues ? "Document issue detected" : "Salary certificate validated",
      inputSource: ocrSource,
      result: hasDocIssues ? "Warning" : "Success",
      reasonCode: docCodes.join(", "),
      governanceRule: "Salary certificate must be valid, recent, and consistent with bank records",
      routeImpact: hasDocIssues ? "Submission blocked before officer routing" : "Continue to financial analysis",
      category: "Document",
    },
  ];

  if (isReadyForConfirmation(status)) {
    events.push(
      {
        timestamp: ts(75000),
        actor: "AI Agent",
        agentName: "Financial Analysis Agent",
        action: "Financial capacity analysis completed",
        inputSource: "Applicant Form, MOEI Mock Loan Record",
        result: "Success",
        reasonCode: "FIN_AFFORDABILITY_PASS",
        governanceRule: "Obligations ratio and income per family member must be assessed",
        routeImpact: "Affordability confirmed",
        category: "Financial",
      },
      {
        timestamp: ts(65000),
        actor: "AI Agent",
        agentName: "Repayment Plan Agent",
        action: "Repayment plan selected and validated",
        inputSource: "Repayment Slider",
        result: capPassed && termPassed ? "Success" : "Warning",
        reasonCode: capPassed && termPassed ? "PLAN_ALLOWED" : "PLAN_EXCEEDS_20_CAP",
        governanceRule: "Selected plan must stay within the 20% deduction cap and remaining loan term",
        routeImpact: capPassed && termPassed ? "Plan compliant" : "Plan non-compliant",
        category: "Financial",
      },
      {
        timestamp: ts(55000),
        actor: "AI Agent",
        agentName: "Policy Rules Agent",
        action: "Applied 20% deduction cap",
        inputSource: "Monthly income, current installment, selected repayment plan",
        result: capPassed ? "Success" : "Warning",
        reasonCode: capPassed ? "FIN_AFFORDABILITY_PASS" : "PLAN_EXCEEDS_20_CAP",
        governanceRule: "Maximum monthly deduction must not exceed 20% of income",
        routeImpact: capPassed ? "Eligible for recommendation" : "Policy check failed",
        category: "Policy",
      },
      {
        timestamp: ts(45000),
        actor: "AI Agent",
        agentName: "Case Memory Agent",
        action: "Historical approved cases checked",
        inputSource: "Historical Approved Cases",
        result: "Success",
        reasonCode: "AUDIT_TRACE_COMPLETED",
        governanceRule: "Similar approved precedents support recommendation confidence",
        routeImpact: "Precedent support recorded",
        category: "Policy",
      },
      {
        timestamp: ts(35000),
        actor: "AI Agent",
        agentName: "Recommendation Agent",
        action: "Rules-based recommendation generated",
        inputSource: "Policy Rules Engine",
        result: "Success",
        reasonCode: "ROUTE_READY_FOR_CONFIRMATION",
        governanceRule: "Clean cases produce a governed recommendation — not final approval",
        routeImpact: "Routed for officer confirmation",
        category: "Routing",
      }
    );
  } else if (isApplicantAction(status)) {
    events.push(
      {
        timestamp: ts(70000),
        actor: "AI Agent",
        agentName: "Document Intelligence Agent",
        action: "Document validation failed — correction required",
        inputSource: ocrSource,
        result: "Warning",
        reasonCode: docCodes.join(", "),
        governanceRule: "Correctable document issues must be resolved by the beneficiary",
        routeImpact: "Submission blocked before officer routing",
        category: "Document",
      },
      {
        timestamp: ts(50000),
        actor: "AI Agent",
        agentName: "Routing Agent",
        action: "Officer routing blocked — applicant action required",
        inputSource: "Policy Rules Engine",
        result: "Warning",
        reasonCode: "ROUTE_APPLICANT_ACTION",
        governanceRule: "Cases with correctable issues are not escalated to officer workload",
        routeImpact: "Not routed to officer",
        category: "Routing",
      },
      {
        timestamp: ts(40000),
        actor: "AI Agent",
        agentName: "Communication Agent",
        action: "Correction guidance generated for beneficiary",
        inputSource: "Applicant Form",
        result: "Success",
        reasonCode: "AUDIT_TRACE_COMPLETED",
        governanceRule: "Beneficiaries receive actionable correction instructions",
        routeImpact: "Awaiting beneficiary correction",
        category: "Communication",
      }
    );
  } else if (isHumanitarian(status)) {
    const hasEvidence =
      !!report.caseData.supportingEvidenceFile ||
      report.caseData.caseId === "CASE-C" ||
      report.caseData.caseId === "CASE-E";
    events.push(
      {
        timestamp: ts(70000),
        actor: "AI Agent",
        agentName: "Humanitarian Evidence Agent",
        action: hasEvidence
          ? "Supporting evidence for hardship received"
          : "Humanitarian circumstance detected — evidence review required",
        inputSource: "Applicant Form",
        result: hasEvidence ? "Success" : "Warning",
        reasonCode: hasEvidence ? "HUMANITARIAN_EVIDENCE_RECEIVED" : "HUMANITARIAN_EVIDENCE_REQUIRED",
        governanceRule: "Humanitarian cases require supporting evidence before specialist review",
        routeImpact: hasEvidence ? "Evidence on record" : "Evidence required",
        category: "Document",
      },
      {
        timestamp: ts(55000),
        actor: "AI Agent",
        agentName: "Policy Rules Agent",
        action: "Automatic rejection blocked due to humanitarian indicators",
        inputSource: "Policy Rules Engine",
        result: "Warning",
        reasonCode: "HUMANITARIAN_REVIEW_TRIGGERED",
        governanceRule: "Humanitarian indicators block automatic rejection",
        routeImpact: "Human judgment required",
        category: "Policy",
      },
      {
        timestamp: ts(40000),
        actor: "AI Agent",
        agentName: "Routing Agent",
        action: "Routed to specialist/human review",
        inputSource: "Policy Rules Engine, Officer Workspace",
        result: "Success",
        reasonCode: "ROUTE_HUMAN_REVIEW",
        governanceRule: "Exception cases require authorized officer or specialist review",
        routeImpact: "Routed to specialist/human review",
        category: "Routing",
      }
    );
  } else {
    events.push(
      {
        timestamp: ts(70000),
        actor: "AI Agent",
        agentName: "Policy Rules Agent",
        action: "Policy conflict detected",
        inputSource: "Policy Rules Engine",
        result: "Warning",
        reasonCode: "FIN_OBLIGATION_RATIO_HIGH",
        governanceRule: "Policy requirements must be met without humanitarian override",
        routeImpact: "Not eligible under current rules",
        category: "Policy",
      },
      {
        timestamp: ts(55000),
        actor: "AI Agent",
        agentName: "Humanitarian Evidence Agent",
        action: "No supporting humanitarian evidence detected",
        inputSource: "Applicant Form",
        result: "Warning",
        reasonCode: "HUMANITARIAN_EVIDENCE_REQUIRED",
        governanceRule: "Humanitarian exception requires uploaded supporting evidence",
        routeImpact: "No humanitarian override applied",
        category: "Document",
      },
      {
        timestamp: ts(45000),
        actor: "AI Agent",
        agentName: "Routing Agent",
        action: "Officer routing blocked — direct beneficiary outcome",
        inputSource: "Policy Rules Engine",
        result: "Success",
        reasonCode: "ROUTE_DIRECT_BENEFICIARY_OUTCOME",
        governanceRule: "Clearly not-eligible cases receive a direct beneficiary outcome",
        routeImpact: "Not routed to officer",
        category: "Routing",
      },
      {
        timestamp: ts(35000),
        actor: "AI Agent",
        agentName: "Communication Agent",
        action: "Beneficiary outcome explanation generated",
        inputSource: "Applicant Form, Policy Rules Engine",
        result: "Success",
        reasonCode: "AUDIT_TRACE_COMPLETED",
        governanceRule: "Beneficiaries receive a plain-language rules-based outcome",
        routeImpact: "Direct beneficiary outcome delivered",
        category: "Communication",
      }
    );
  }

  events.push({
    timestamp: ts(10000),
    actor: "AI Agent",
    agentName: "Audit & Governance Agent",
    action: "Governance audit trace completed",
    inputSource: "Policy Rules Engine",
    result: "Success",
    reasonCode: "NO_AUTO_GOVERNMENT_APPROVAL",
    governanceRule: "SAKAN AI does not issue final government approval or rejection",
    routeImpact: getRouteImpact(status),
    category: "Routing",
    relatedReasonCode: getRouteReasonCode(status),
  });

  return events;
}

export function filterAuditEvents(
  events: GovernanceAuditEvent[],
  filter: AuditFilterCategory
): GovernanceAuditEvent[] {
  if (filter === "All") return events;
  return events.filter((e) => e.category === filter);
}

export type GovernanceSummary = {
  decisionType: { en: string; ar: string };
  finalRoute: string;
  officerAccountability: { en: string; ar: string };
  aiUsage: { en: string; ar: string };
  dataSources: { en: string; ar: string };
  auditCompleteness: { en: string; ar: string };
};

export function getGovernanceSummary(
  report: DecisionReportPackage,
  displayStatus: string,
  ocrSource: string,
  isAr: boolean
): GovernanceSummary {
  const status = report.recommendation.status;
  return {
    decisionType: {
      en: "Rules-Based Recommendation",
      ar: "توصية مبنية على القواعد",
    },
    finalRoute: displayStatus,
    officerAccountability: {
      en: isReadyForConfirmation(status) || isHumanitarian(status)
        ? "Final approval remains with authorized officer where applicable."
        : "No officer action required — beneficiary correction or direct outcome applied.",
      ar: isReadyForConfirmation(status) || isHumanitarian(status)
        ? "يبقى الاعتماد النهائي مع الموظف المخول عند الاقتضاء."
        : "لا يلزم إجراء موظف — تم تطبيق تصحيح المستفيد أو نتيجة مباشرة.",
    },
    aiUsage: {
      en: "Gemini used only for document OCR on new custom uploads or explicit explanation generation. Not used for automatic final decision.",
      ar: "يُستخدم Gemini فقط لاستخراج OCR للمستندات المخصصة أو عند طلب الشرح صراحة. لا يُستخدم للقرار النهائي التلقائي.",
    },
    dataSources: {
      en: `Applicant form, ${ocrSource}, repayment slider, historical approved cases, policy rules.`,
      ar: `نموذج المتعامل، ${ocrSource}، شريط السداد، الحالات التاريخية المعتمدة، قواعد السياسة.`,
    },
    auditCompleteness: {
      en: "All agent checks recorded with reason codes.",
      ar: "جميع فحوصات الوكلاء مسجلة مع رموز الأسباب.",
    },
  };
}

export const NO_AUTO_APPROVAL_NOTICE = {
  en: "SAKAN AI does not issue final government approval or rejection. It produces a governed recommendation or beneficiary outcome based on policy rules, with human confirmation where required.",
  ar: "لا يصدر سكن AI اعتمادًا أو رفضًا حكوميًا نهائيًا. يقوم بإنتاج توصية محكومة بالقواعد أو نتيجة مباشرة للمستفيد، مع بقاء الاعتماد البشري عند الحاجة.",
};

export function buildAuditSummaryText(
  caseId: string,
  report: DecisionReportPackage,
  displayStatus: string
): string {
  const status = report.recommendation.status;
  const keyCodes = [
    ...getDocumentReasonCodes(report).slice(0, 2),
    getRouteReasonCode(status),
    "NO_AUTO_GOVERNMENT_APPROVAL",
  ].filter(Boolean);
  const officerRouting = getOfficerRoutingStatus(status, false);
  return [
    `Case ID: ${caseId}`,
    `Final Route: ${displayStatus}`,
    `Key Reason Codes: ${keyCodes.join(", ")}`,
    `Officer Routing: ${officerRouting}`,
    `Timestamp: ${new Date().toISOString()}`,
  ].join("\n");
}

export function mergeWithOfficerLogs(
  governanceTrail: GovernanceAuditEvent[],
  officerLogs: AuditTrailEvent[]
): GovernanceAuditEvent[] {
  const mappedOfficer: GovernanceAuditEvent[] = officerLogs.map((log) => ({
    ...log,
    agentName: log.actor === "Officer" ? "Officer Workspace" : "System",
    inputSource: "Officer Workspace",
    reasonCode: log.relatedReasonCode || "AUDIT_TRACE_COMPLETED",
    governanceRule: "Officer actions are logged for accountability",
    routeImpact: log.result === "Success" ? "Officer action recorded" : "Officer action pending",
    category: "Communication" as const,
  }));
  return [...governanceTrail, ...mappedOfficer];
}
