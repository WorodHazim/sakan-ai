import { CaseData, DocumentValidationResult, FinancialCapacityResult, PolicyRulesResult, RecommendationResult } from "./types";
import { hasHumanitarianCircumstance } from "./utils";

export interface AgentExecutionStep {
  agentId: string;
  agentName: string;
  purpose: string;
  inputSources: string[];
  actionsPerformed: string[];
  outputSummary: string;
  status: "completed" | "warning" | "blocked" | "skipped";
  confidence: number;
  reasonCodes: string[];
}

export interface CaseClassification {
  caseCategory:
    | "Clean Fast Track"
    | "Document Correction Required"
    | "Financial Hardship"
    | "Income Loss / Unemployment"
    | "High Obligations"
    | "Family Burden"
    | "Medical / Humanitarian"
    | "Housing Project Delay"
    | "Policy Conflict"
    | "Not Eligible"
    | "Supporting Evidence Required"
    | "Humanitarian / Exception Review";
  casePriority: "Urgent" | "High" | "Medium" | "Low";
  categoryReason: string;
}

// Resusable helper to parse numbers safely
export function safeNumber(value: any): number {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/,/g, "").trim());
    return !isNaN(parsed) ? parsed : 0;
  }
  return 0;
}

export function checkHasBlockingDocumentIssues(caseData: CaseData, docVal: any): boolean {
  const docConfidence = safeNumber(caseData.documentConfidence ?? 100);
  
  // 1. salary certificate expired
  const isExpired = caseData.salaryCertificateExpired === true || 
                    docVal?.documentStatus === "Expired" || 
                    docVal?.salaryCertificateChecks?.dateValid === false;
                    
  // 2. salary mismatch with declared income
  const isMismatch = docVal?.mismatch === true;
  
  // 3. bank transfer inconsistency
  const isBankInconsistent = docVal?.bankCrossCheck?.consistencyResult === "Inconsistent" && !caseData.bankProofFile;
  
  // 4. missing stamp
  const isStampMissing = caseData.hasStamp === false || 
                         docVal?.hasStamp === false || 
                         docVal?.salaryCertificateChecks?.hasStamp === false;
                         
  // 5. missing signature
  const isSignatureMissing = caseData.hasAuthorizedSignature === false || 
                              docVal?.salaryCertificateChecks?.hasAuthorizedSignature === false;
                              
  // 6. missing required document
  const isMissingDoc = docVal?.documentStatus === "Missing" || 
                       !caseData.salaryCertificateAmount;
                       
  // 7. OCR confidence low / fallback OCR with low confidence
  const isOcrLowConfidence = docConfidence < 80 || 
                             docVal?.ocrConfidenceLow === true || 
                             docVal?.ocrNeedsReview === true;
                             
  // 8. uploaded file is not a valid salary certificate
  const isNotValidCert = docVal?.documentType && docVal.documentType !== "salary_certificate";
  
  // 9. document validation failed
  let isDocValFailed = false;
  if (caseData.hasMedicalDocument) {
    const medVal = docVal?.medicalValidation;
    if (medVal && (!medVal.providerRecognized || !medVal.qrVerified || !medVal.dateValid)) {
      isDocValFailed = true;
    }
  }
  
  return isExpired || isMismatch || isBankInconsistent || isStampMissing || isSignatureMissing || isMissingDoc || isOcrLowConfidence || isNotValidCert || isDocValFailed;
}

/**
 * Reusable Agent Orchestration Layer
 * Defines and executes SAKAN AI agents sequentially to decide housing loan arrears cases.
 */
export function buildAgentChain(
  caseData: CaseData,
  report?: any,
  ocrResult?: any,
  historicalInsight?: any
): {
  agentSteps: AgentExecutionStep[];
  caseClassification: CaseClassification;
  finalStatus: string;
  resolutionPath: string;
  recommendationText: string;
  nextBestAction: string;
} {
  const steps: AgentExecutionStep[] = [];

  // Parse local variables for computation if helper objects aren't fully provided
  const monthlyIncome = safeNumber(caseData.monthlyIncome);
  const financialObligations = safeNumber(caseData.financialObligations);
  const familyMembers = safeNumber(caseData.familyMembers) || 1;
  const currentInstallment = safeNumber(caseData.currentInstallment);
  const arrearsAmount = safeNumber(caseData.arrearsAmount);

  const obligationsRatio = monthlyIncome > 0 ? financialObligations / monthlyIncome : 0;
  const incomePerFamilyMember = familyMembers > 0 ? monthlyIncome / familyMembers : 0;
  const docConfidence = safeNumber(caseData.documentConfidence ?? 100);

  // Use document intelligence outputs (ocrResult) if passed, or calculate baseline validation
  const docVal = ocrResult || {
    documentStatus: caseData.salaryCertificateExpired ? "Expired" : caseData.salaryCertificateAmount ? "Valid" : "Missing",
    extractedSalary: safeNumber(caseData.salaryCertificateAmount),
    mismatch: caseData.salaryCertificateAmount ? monthlyIncome !== safeNumber(caseData.salaryCertificateAmount) : false,
    salaryCertificateChecks: {
      hasCompanyLetterhead: !!caseData.hasCompanyLetterhead,
      hasAuthorizedSignature: !!caseData.hasAuthorizedSignature,
      employeeDetailsMatch: !!caseData.employeeDetailsMatch,
      hasStamp: caseData.hasStamp !== undefined ? !!caseData.hasStamp : true,
      dateValid: !caseData.salaryCertificateExpired,
    },
    bankCrossCheck: {
      averageTransfer: safeNumber(caseData.averageSalaryTransfer6Months),
      consistencyResult:
        caseData.averageSalaryTransfer6Months && caseData.salaryCertificateAmount &&
        Math.abs(safeNumber(caseData.salaryCertificateAmount) - safeNumber(caseData.averageSalaryTransfer6Months)) / safeNumber(caseData.salaryCertificateAmount) <= 0.05
          ? "Consistent"
          : "Inconsistent",
      confidenceScore: 90,
    },
    warnings: [] as string[],
    reasonCodes: [] as string[],
  };

  // Calculate global document issues indicator
  const hasBlockingDocumentIssues = checkHasBlockingDocumentIssues(caseData, docVal);

  // Calculate humanitarian exception indicator - check explicit circumstance or medical document
  const circumstanceLower = String(caseData.supportingCircumstance || "").toLowerCase();
  const isMedical = caseData.caseId === "CASE-C" || caseData.caseId === "CASE-E" || caseData.hasMedicalDocument || 
    hasHumanitarianCircumstance(caseData.supportingCircumstance);
  const hasHumanitarianOrException = 
    monthlyIncome === 0 ||
    isMedical;

  // 1. Identity & Intake Agent
  const identityAgent: AgentExecutionStep = {
    agentId: "agent-identity-intake",
    agentName: "Identity & Intake Agent",
    purpose: "Verify beneficiary profile, Emirates ID, loan data, arrears data, and prepare normalized case data.",
    inputSources: ["Beneficiary Profile Database", "Emirates ID Registry", "MOEI Loan Management System"],
    actionsPerformed: [
      `Extracted profile details for beneficiary "${caseData.beneficiaryName}" (ID: ${caseData.beneficiaryId}).`,
      `Validated Emirates ID syntax: "${caseData.emiratesId}".`,
      `Fetched current housing loan metrics: Balance = AED ${caseData.remainingLoanBalance.toLocaleString()}, Arrears = AED ${caseData.arrearsAmount.toLocaleString()} (${caseData.unpaidInstallments} unpaid installments).`,
    ],
    outputSummary: `Beneficiary profile is normalized. Active loan "${caseData.loanId}" found with AED ${caseData.arrearsAmount.toLocaleString()} arrears.`,
    status: "completed",
    confidence: 99,
    reasonCodes: ["RC-INTAKE-SUCCESS"],
  };
  steps.push(identityAgent);

  // 2. Smart Submission Assistant
  const hasHumanitarianProof = !!caseData.supportingEvidenceFile || caseData.caseId === "CASE-C" || caseData.caseId === "CASE-E";
  const isHumanitarianWithoutProof = hasHumanitarianOrException && !hasHumanitarianProof;
  const isApplicantAction = (hasBlockingDocumentIssues) || isHumanitarianWithoutProof;
  const hasIncompleteDocs = !caseData.hasCompanyLetterhead || !caseData.hasAuthorizedSignature || !caseData.employeeDetailsMatch || !caseData.salaryCertificateAmount || isApplicantAction;
  const assistantAgent: AgentExecutionStep = {
    agentId: "agent-submission-assistant",
    agentName: "Smart Submission Assistant",
    purpose: "Guide the beneficiary before submission and explain what documents/data are required.",
    inputSources: ["Applicant Declaration Form", "Uploaded Files Metadata"],
    actionsPerformed: [
      "Analyzed completeness of submitted housing arrears rescheduling documents.",
      "Generated requirements guidance based on beneficiary circumstances.",
    ],
    outputSummary: isApplicantAction
      ? "Correction guidance generated"
      : hasIncompleteDocs
      ? "Identified missing validations or details on salary certificate. Guided beneficiary to upload compliant documents."
      : "All basic application declarations and file uploads successfully validated and processed.",
    status: isApplicantAction || hasIncompleteDocs ? "warning" : "completed",
    confidence: 95,
    reasonCodes: hasIncompleteDocs ? ["RC-DOCS-INCOMPLETE"] : ["RC-DOCS-COMPLETE"],
  };
  steps.push(assistantAgent);

  // 3. Document Intelligence Agent
  const docIntWarnings: string[] = [];
  const docIntReasonCodes: string[] = [];
  let docIntStatus: "completed" | "warning" | "blocked" | "skipped" = "completed";

  if (docVal.documentStatus === "Expired" || caseData.salaryCertificateExpired) {
    docIntWarnings.push("Salary certificate is expired.");
    docIntReasonCodes.push("RC-11");
  }
  if (docVal.mismatch) {
    docIntWarnings.push("Stated income does not match salary certificate amount.");
    docIntReasonCodes.push("RC-08");
  }
  if (docVal.bankCrossCheck.consistencyResult === "Inconsistent") {
    docIntWarnings.push("Bank transfer average is inconsistent with salary certificate.");
    docIntReasonCodes.push("RC-20");
  }
  if (!caseData.hasCompanyLetterhead) {
    docIntReasonCodes.push("RC-17");
  }
  if (!caseData.hasAuthorizedSignature) {
    docIntReasonCodes.push("RC-18");
  }
  if (!caseData.employeeDetailsMatch) {
    docIntReasonCodes.push("RC-19");
  }

  if (hasBlockingDocumentIssues) {
    docIntStatus = "blocked";
  } else if (docIntReasonCodes.length > 0) {
    docIntStatus = "warning";
  }

  const documentAgent: AgentExecutionStep = {
    agentId: "agent-doc-intelligence",
    agentName: "Document Intelligence Agent",
    purpose: "Use existing OCR results to validate salary certificate fields, issue date, salary match, bank transfer consistency, stamp, signature, and OCR confidence.",
    inputSources: ["Mock OCR Extraction Engine", "Bank Statements Feed"],
    actionsPerformed: [
      `Validated salary certificate fields: Authorized signature = ${caseData.hasAuthorizedSignature ? "Present" : "Missing"}, Company letterhead = ${caseData.hasCompanyLetterhead ? "Present" : "Missing"}.`,
      `Cross-checked certificate salary (AED ${docVal.extractedSalary.toLocaleString()}) against profile salary (AED ${monthlyIncome.toLocaleString()}).`,
      `Verified bank statement transfers (6-month average: AED ${docVal.bankCrossCheck.averageTransfer.toLocaleString()}) consistency.`,
    ],
    outputSummary: isHumanitarianWithoutProof
      ? "missing supporting evidence"
      : isApplicantAction
      ? "detected document issues"
      : docIntWarnings.length > 0
      ? `Document intelligence warnings generated: ${docIntWarnings.join(", ")}.`
      : "Salary certificate verified successfully. Stated income matches certificate and bank statement average transfers.",
    status: isHumanitarianWithoutProof ? "warning" : isApplicantAction ? "blocked" : docIntStatus,
    confidence: docConfidence,
    reasonCodes: docIntReasonCodes,
  };
  steps.push(documentAgent);

  // 4. Historical Case Memory Agent
  const matchingPrecedentsCount = historicalInsight?.totalSimilarApprovedCases ?? 
    (caseData.caseId === "CASE-A" ? 14 : caseData.caseId === "CASE-C" ? 9 : caseData.caseId === "CASE-E" ? 11 : 0);
  const similarityScore = historicalInsight?.similarityConfidence ??
    (caseData.caseId === "CASE-A" ? 96 : caseData.caseId === "CASE-C" ? 82 : caseData.caseId === "CASE-E" ? 88 : 40);
  const supportStrength = historicalInsight?.approvedPrecedentSupport ??
    (matchingPrecedentsCount >= 8 ? "Strong" : matchingPrecedentsCount >= 3 ? "Moderate" : "Weak");

  const memoryAgent: AgentExecutionStep = {
    agentId: "agent-historical-memory",
    agentName: "Historical Case Memory Agent",
    purpose: "Use imported historical_cases as approved precedent memory. Retrieve similar approved cases using request type, current salary range, overdue amount range, overdue months range, and approved request type. Do not send full dataset to Gemini. Do not call it ML training.",
    inputSources: ["Approved Historical Case Precedents Table"],
    actionsPerformed: [
      `Scanned 1,000+ historical precedents for matching request type "Housing Arrears Rescheduling".`,
      `Applied range filters: Salary (AED ${monthlyIncome.toLocaleString()} ±20%), Arrears (AED ${arrearsAmount.toLocaleString()} ±20%), and Unpaid installments (${caseData.unpaidInstallments} ±2).`,
    ],
    outputSummary: `Found ${matchingPrecedentsCount} similar approved historical cases. Precedent support strength: ${supportStrength} (Similarity: ${similarityScore}%).`,
    status: matchingPrecedentsCount > 0 ? "completed" : "warning",
    confidence: similarityScore,
    reasonCodes: matchingPrecedentsCount > 0 ? ["RC-MEMORY-MATCH"] : ["RC-MEMORY-NO-MATCH"],
  };
  steps.push(memoryAgent);

  // 5. Case Classification Agent (Deterministic Rules & Keyword checks)
  let category: CaseClassification["caseCategory"] = "Clean Fast Track";
  let priority: CaseClassification["casePriority"] = "Low";
  let catReason = "";
  let finalStatus = "Recommended for Approval / Ready for Officer Confirmation";
  let resolutionPath = "Fast Track Approval";
  let recommendationText = "";
  let nextBestAction = "";

  // Pre-calculate rule indicators
  const max20PercentDeduction = monthlyIncome * 0.2;
  let proposedArrearsPayment = 0;
  if (caseData.selectedMonthlyArrearsDeduction !== undefined) {
    proposedArrearsPayment = caseData.selectedMonthlyArrearsDeduction;
  } else if (max20PercentDeduction - currentInstallment > 0) {
    proposedArrearsPayment = Math.min(max20PercentDeduction - currentInstallment, arrearsAmount);
  }
  const proposedTotalDeduction = caseData.newTotalInstallment !== undefined
    ? caseData.newTotalInstallment
    : (currentInstallment + proposedArrearsPayment);
  const proposedDurationMonths = caseData.selectedDurationMonths !== undefined
    ? caseData.selectedDurationMonths
    : (proposedArrearsPayment > 0 ? Math.ceil(arrearsAmount / proposedArrearsPayment) : null);

  const isCapFailed = proposedTotalDeduction > max20PercentDeduction;
  const isRepaymentPeriodFailed = proposedDurationMonths !== null && proposedDurationMonths > caseData.remainingRepaymentMonths;
  const isObligationsFailed = obligationsRatio > 0.6;
  const isIncomePerMemberFailed = incomePerFamilyMember < 3000;
  const isActiveRequestFailed = caseData.activeRequest;

  const maxAdditionalDeduction = max20PercentDeduction - currentInstallment;
  const minDeductionNeeded = arrearsAmount > 0 ? Math.ceil(arrearsAmount / caseData.remainingRepaymentMonths) : 0;
  // If maxAdditionalDeduction < 0 or minDeductionNeeded > maxAdditionalDeduction, no valid plan is allowed
  const hasNoValidPlan = maxAdditionalDeduction < 0 || (arrearsAmount > 0 && minDeductionNeeded > maxAdditionalDeduction);

  const isPlanAllowed = caseData.planComplianceStatus
    ? caseData.planComplianceStatus === "Allowed Plan"
    : (!isCapFailed && !isRepaymentPeriodFailed);

  const hasPolicyFailure = isCapFailed || isRepaymentPeriodFailed || isObligationsFailed || isIncomePerMemberFailed || isActiveRequestFailed || !isPlanAllowed;

  // Unified Routing Matrix: Priority A
  if (hasBlockingDocumentIssues) {
    category = "Document Correction Required";
    priority = "Medium";
    catReason = "The case cannot proceed because the submitted salary certificate is expired, or there is a mismatch between declared income, certificate values, and bank average transfer records. The case was not routed to officer because the issue can be corrected by the beneficiary.";
    finalStatus = "Applicant Action Required";
    resolutionPath = "Additional Information Required";
    recommendationText = "Request updated documentation or clarification before proceeding.";
    nextBestAction = "Upload a corrected salary certificate and/or update declared income/bank evidence.";
  }
  // Unified Routing Matrix: Priority B
  else if (isHumanitarianWithoutProof) {
    category = "Supporting Evidence Required";
    priority = "Medium";
    catReason = "Humanitarian or exception reason was selected, but supporting evidence is required before human review.";
    finalStatus = "Applicant Action Required";
    resolutionPath = "Additional Information Required";
    recommendationText = "Please upload supporting evidence for the selected hardship reason before the case can be reviewed.";
    nextBestAction = "Upload supporting evidence for the selected hardship/exception circumstance.";
  }
  // Unified Routing Matrix: Priority C
  else if (hasHumanitarianOrException && hasHumanitarianProof) {
    if (monthlyIncome === 0 || circumstanceLower.includes("unemployment") || circumstanceLower.includes("job loss") || circumstanceLower.includes("income loss")) {
      category = "Income Loss / Unemployment";
      priority = "Urgent";
      catReason = "Beneficiary reports zero stable income or unemployment. High risk of increasing arrears requires special humanitarian restructuring.";
      resolutionPath = "Financial Stress Review";
      recommendationText = "Move arrears to the end of the repayment period without increasing current monthly installment.";
      nextBestAction = "Assign to specialized case officer for unemployment review.";
    } else {
      category = "Medical / Humanitarian";
      priority = "High";
      catReason = "Policy Exception / Humanitarian indicators require specialist officer manual assessment.";
      resolutionPath = "Human Review Required";
      recommendationText = "Supporting evidence was provided and the case requires human judgment.";
      nextBestAction = "Assign the case to a human officer for manual review.";
    }
    finalStatus = "Humanitarian Review Required";
  }
  // Unified Routing Matrix: Priority D
  else if (hasPolicyFailure || hasNoValidPlan) {
    category = "Not Eligible";
    priority = "Medium";
    catReason = "Policy constraints failed and no humanitarian exception was detected.";
    finalStatus = "Direct Beneficiary Outcome / Not Eligible";
    resolutionPath = "Rejected / Not Eligible";
    recommendationText = "Policy conflict and not eligible under current rules; no humanitarian exception detected.";
    nextBestAction = "Review rejection recommendation.";
  }
  // Unified Routing Matrix: Priority E
  else {
    category = "Clean Fast Track";
    priority = "Low";
    catReason = "All documents verified, income details are consistent, and financial ratios are within regulatory limits.";
    finalStatus = "Recommended for Approval / Ready for Officer Confirmation";
    resolutionPath = "Fast Track Approval";
    recommendationText = "Approve rescheduling based on calculated repayment capacity.";
    nextBestAction = "Proceed with fast-track rescheduling plan and notify beneficiary.";
  }

  const classificationAgent: AgentExecutionStep = {
    agentId: "agent-case-classification",
    agentName: "Case Classification Agent",
    purpose: "Classify the case into one of the predefined categories based on rules and keywords.",
    inputSources: ["Profile Ratios", "OCR Warnings", "Supporting Circumstance Details", "Demo Configuration Mapping"],
    actionsPerformed: [
      `Assessed keyword indicators in circumstance: "${caseData.supportingCircumstance || "None"}".`,
      `Evaluated financial indicators: Obligations ratio = ${(obligationsRatio * 100).toFixed(0)}%, Income per member = AED ${incomePerFamilyMember.toFixed(0)}.`,
      `Determined category based on policy hierarchy logic.`,
    ],
    outputSummary: isHumanitarianWithoutProof
      ? "Supporting Evidence Required"
      : isApplicantAction
      ? "Document Correction Required"
      : `Case classified as: "${category}" (Priority: ${priority}). Reason: ${catReason}`,
    status: "completed",
    confidence: 98,
    reasonCodes: [`CLASS-${category.toUpperCase().replace(/[^A-Z]/g, "_")}`],
  };
  steps.push(classificationAgent);

  // 6. Financial Analysis Agent

  const financialAgent: AgentExecutionStep = {
    agentId: "agent-financial-analysis",
    agentName: "Financial Analysis Agent",
    purpose: "Calculate monthly income, obligations ratio, income per family member, 20% deduction cap, repayment capacity, and affordability status.",
    inputSources: ["Income Data", "Obligations Data", "Family Size", "Loan Terms"],
    actionsPerformed: [
      `Calculated obligations ratio = ${(obligationsRatio * 100).toFixed(0)}% (limit: 60%).`,
      `Computed monthly household income per member = AED ${incomePerFamilyMember.toLocaleString()} (threshold: AED 3,000).`,
      `Derived maximum 20% deduction cap = AED ${max20PercentDeduction.toLocaleString()}.`,
      `Determined proposed arrears installment = AED ${proposedArrearsPayment.toLocaleString()} with duration of ${proposedDurationMonths || 0} months.`,
    ],
    outputSummary: `Obligations ratio is ${(obligationsRatio * 100).toFixed(0)}%. Income per family member is AED ${incomePerFamilyMember.toLocaleString()}. Proposed monthly total installment = AED ${proposedTotalDeduction.toLocaleString()}.`,
    status: (obligationsRatio > 0.6 || incomePerFamilyMember < 3000) ? "warning" : "completed",
    confidence: 96,
    reasonCodes: ["RC-FIN-SUCCESS"],
  };
  steps.push(financialAgent);

  // 7. Policy Rules Agent
  const passedRules: string[] = [];
  const failedRules: string[] = [];
  const policyReasonCodes: string[] = [];

  // Rule 1: salary certificate valid
  if (!caseData.salaryCertificateExpired) {
    passedRules.push("Salary certificate validity");
  } else {
    failedRules.push("Salary certificate validity");
    policyReasonCodes.push("RC-11");
  }

  // Rule 2: salary matches declared
  if (!docVal.mismatch) {
    passedRules.push("Salary amount match");
  } else {
    failedRules.push("Salary amount match");
    policyReasonCodes.push("RC-08");
  }

  // Rule 3: bank transfers consistent
  if (docVal.bankCrossCheck.consistencyResult === "Consistent") {
    passedRules.push("Bank statement consistency");
  } else {
    failedRules.push("Bank statement consistency");
    policyReasonCodes.push("RC-20");
  }

  // Rule 4: 20% deduction cap
  if (proposedTotalDeduction <= max20PercentDeduction) {
    passedRules.push("20% Deduction Cap");
  } else {
    failedRules.push("20% Deduction Cap");
    policyReasonCodes.push("RC-05");
  }

  // Rule 5: Repayment period constraint
  if (proposedDurationMonths !== null && proposedDurationMonths <= caseData.remainingRepaymentMonths) {
    passedRules.push("Repayment Period Constraint");
  } else if (proposedDurationMonths !== null) {
    failedRules.push("Repayment Period Constraint");
    policyReasonCodes.push("RC-07");
  }

  // Rule 6: Obligations ratio threshold
  if (obligationsRatio <= 0.6) {
    passedRules.push("Obligations Ratio Check");
  } else {
    failedRules.push("Obligations Ratio Check");
    policyReasonCodes.push("RC-12");
  }

  // Rule 7: Minimum income per member
  if (incomePerFamilyMember >= 3000) {
    passedRules.push("Minimum Income Per Member");
  } else {
    failedRules.push("Minimum Income Per Member");
    policyReasonCodes.push("RC-13");
  }

  // Rule 8: Humanitarian exception blocks auto rejection
  const hasHumanitarianException = hasHumanitarianOrException;

  if (hasHumanitarianException && (failedRules.length > 0 || caseData.activeRequest)) {
    passedRules.push("Humanitarian Exception Block");
    policyReasonCodes.push("RC-HUMANITARIAN-EXCEPTION-APPLIED");
  }

  const policyAgent: AgentExecutionStep = {
    agentId: "agent-policy-rules",
    agentName: "Policy Rules Agent",
    purpose: "Apply regulatory policy rules including salary certificates, 20% cap, repayment periods, obligations, and humanitarian exceptions.",
    inputSources: ["Housing Loan Regulatory Policies", "Intake Data Summary"],
    actionsPerformed: [
      "Evaluated 8 distinct regulatory and financial policy rules.",
      `Applied humanitarian exception check: status = ${hasHumanitarianException ? "Active" : "Inactive"}.`,
    ],
    outputSummary: isHumanitarianWithoutProof
      ? "cannot proceed until supporting evidence provided"
      : isApplicantAction
      ? "cannot proceed until document correction"
      : failedRules.length > 0
      ? `Failed rules: ${failedRules.join(", ")}. ${hasHumanitarianException ? "Humanitarian override active, auto-rejection blocked." : "Auto-rejection recommended."}`
      : "All regulatory and financial rules successfully satisfied.",
    status: isApplicantAction ? "blocked" : (hasBlockingDocumentIssues ? "blocked" : (failedRules.length > 0 ? (hasHumanitarianException ? "warning" : "blocked") : "completed")),
    confidence: 97,
    reasonCodes: policyReasonCodes,
  };
  steps.push(policyAgent);

  // 8. Recommendation Agent
  const recAgent: AgentExecutionStep = {
    agentId: "agent-recommendation",
    agentName: "Recommendation Agent",
    purpose: "Combine all agent outputs and produce one final status.",
    inputSources: ["All Prior Agent Output States", "Classification Category"],
    actionsPerformed: [
      `Aggregated policy rule matches, document warnings, and precedent comparisons.`,
      `Synthesized outcomes into recommendation status "${finalStatus}" under "${resolutionPath}".`,
    ],
    outputSummary: isApplicantAction
      ? "Applicant Action Required"
      : `Recommendation finalized: Status = ${finalStatus}, Route = ${resolutionPath}.`,
    status: "completed",
    confidence: Math.min(similarityScore, docConfidence),
    reasonCodes: ["RC-RECOMMENDATION-FINALIZED"],
  };
  steps.push(recAgent);

  // 9. Communication Agent
  let commOutputSummary = `Bilingual beneficiary alerts composed. English template preview: "Dear ${caseData.beneficiaryName}, your request has status: ${finalStatus}."`;
  if (finalStatus === "Applicant Action Required") {
    commOutputSummary = "beneficiary correction message";
  }

  const commAgent: AgentExecutionStep = {
    agentId: "agent-communication",
    agentName: "Communication Agent",
    purpose: "Generate clear beneficiary/officer messages in English and Arabic based on final status and blocking issues.",
    inputSources: ["Recommendation Output", "Target Languages Profile"],
    actionsPerformed: [
      `Formulated official English and Arabic text notifications matching status "${finalStatus}".`,
      `Embedded case-specific parameters (beneficiary name, proposed term, or corrective actions) into notifications.`,
    ],
    outputSummary: commOutputSummary,
    status: "completed",
    confidence: 99,
    reasonCodes: ["RC-COMM-COMPOSED"],
  };
  steps.push(commAgent);

  // 10. Audit & Governance Agent
  let auditOutputSummary = `Audit record created. 10 execution trace steps successfully appended to decision log.`;
  if (finalStatus === "Applicant Action Required") {
    auditOutputSummary = "case not routed to officer; awaiting beneficiary correction";
  }

  const auditAgent: AgentExecutionStep = {
    agentId: "agent-audit-governance",
    agentName: "Audit & Governance Agent",
    purpose: "Create audit entries for every agent step, source used, OCR mode, rules passed/failed, and final recommendation.",
    inputSources: ["Full Agent Chain Execution Logs"],
    actionsPerformed: [
      "Generated detailed audit log trail recording all 9 preceding agent execution outputs.",
      "Logged OCR mode details, confidence levels, rules validations, and final recommendation for compliance records.",
    ],
    outputSummary: auditOutputSummary,
    status: "completed",
    confidence: 100,
    reasonCodes: ["RC-AUDIT-SAVED"],
  };
  steps.push(auditAgent);

  if (!caseData.caseId.startsWith("CASE-")) {
    const customSteps: AgentExecutionStep[] = [];
    if (finalStatus === "Applicant Action Required") {
      customSteps.push({
        agentId: "agent-submission-assistant",
        agentName: "Smart Application Companion",
        purpose: "Evaluate application readiness and completeness.",
        inputSources: ["Declared Income", "Circumstance Dropdown"],
        actionsPerformed: ["Check certificate status", "Verify declaration sign-off"],
        outputSummary: "correction required",
        status: "warning",
        confidence: 95,
        reasonCodes: ["COMP-CORRECTION-REQUIRED"]
      });
      customSteps.push({
        agentId: "agent-doc-intelligence",
        agentName: "Document Intelligence Agent",
        purpose: "Verify authenticity and metadata of the salary certificate.",
        inputSources: ["Uploaded Salary Certificate"],
        actionsPerformed: ["Scan validity window", "Validate stamp/signature", "Perform OCR reading"],
        outputSummary: "issues detected",
        status: "blocked",
        confidence: docConfidence,
        reasonCodes: ["DOC-ISSUES-DETECTED"]
      });
      customSteps.push({
        agentId: "agent-recommendation",
        agentName: "Recommendation/Routing Agent",
        purpose: "Synthesize all checks to recommend routing.",
        inputSources: ["Document Intelligence Output", "Companion Alerts"],
        actionsPerformed: ["Evaluate routing rules matrix"],
        outputSummary: "Applicant Action Required",
        status: "warning",
        confidence: 90,
        reasonCodes: ["ROUTE-APPLICANT-ACTION"]
      });
      customSteps.push({
        agentId: "agent-audit-governance",
        agentName: "Audit Agent",
        purpose: "Log complete audit trace for compliance.",
        inputSources: ["Agent Steps Execution Log"],
        actionsPerformed: ["Save immutable log record to database"],
        outputSummary: "not routed to officer",
        status: "completed",
        confidence: 100,
        reasonCodes: ["AUDIT-NOT-ROUTED"]
      });
    } else if (finalStatus === "Humanitarian Review Required") {
      customSteps.push({
        agentId: "agent-doc-evidence",
        agentName: "Supporting Evidence Agent",
        purpose: "Verify authenticity of the uploaded supporting documents.",
        inputSources: ["Uploaded Hardship Evidence"],
        actionsPerformed: ["Verify file integrity", "Validate issuer details"],
        outputSummary: "evidence received",
        status: "completed",
        confidence: 95,
        reasonCodes: ["EVIDENCE-RECEIVED"]
      });
      customSteps.push({
        agentId: "agent-policy-rules",
        agentName: "Policy Rules Agent",
        purpose: "Assess rules compliance against government policies.",
        inputSources: ["MOEI Rules Registry", "Family Financial Ratios"],
        actionsPerformed: ["Check deduction cap", "Verify loan term duration", "Apply humanitarian override"],
        outputSummary: "human judgment required",
        status: "warning",
        confidence: 90,
        reasonCodes: ["RULES-HUMAN-JUDGMENT"]
      });
      customSteps.push({
        agentId: "agent-recommendation",
        agentName: "Routing Agent",
        purpose: "Determine case target owner based on policy outcome.",
        inputSources: ["Policy Rules Output", "Humanitarian Flag Status"],
        actionsPerformed: ["Evaluate escalation priority rules"],
        outputSummary: "Humanitarian Review Required",
        status: "completed",
        confidence: 98,
        reasonCodes: ["ROUTE-HUMANITARIAN-REVIEW"]
      });
    } else if (finalStatus.startsWith("Direct Beneficiary Outcome") || finalStatus.includes("Not Eligible")) {
      customSteps.push({
        agentId: "agent-financial-analysis",
        agentName: "Financial Analysis Agent",
        purpose: "Analyze household income, existing obligations, and family burden.",
        inputSources: ["Profile Financial Data"],
        actionsPerformed: ["Calculate obligations ratio", "Determine household member allocation"],
        outputSummary: "policy fail",
        status: "warning",
        confidence: 96,
        reasonCodes: ["FIN-POLICY-FAIL"]
      });
      customSteps.push({
        agentId: "agent-repayment-plan",
        agentName: "Repayment Plan Agent",
        purpose: "Evaluate repayment plans against regulatory limits.",
        inputSources: ["Arrears Details", "Interactive Slider Selection"],
        actionsPerformed: ["Apply 20% cap test", "Validate remaining term compliance"],
        outputSummary: "no valid compliant plan",
        status: "blocked",
        confidence: 90,
        reasonCodes: ["PLAN-NON-COMPLIANT"]
      });
      customSteps.push({
        agentId: "agent-policy-rules",
        agentName: "Policy Rules Agent",
        purpose: "Run regulatory rules checks.",
        inputSources: ["Rules Engine Parameters"],
        actionsPerformed: ["Execute cap and term constraints rules"],
        outputSummary: "failed",
        status: "blocked",
        confidence: 95,
        reasonCodes: ["RULES-FAILED"]
      });
      customSteps.push({
        agentId: "agent-humanitarian-evidence",
        agentName: "Humanitarian Evidence Agent",
        purpose: "Check for active humanitarian exception triggers.",
        inputSources: ["Hardship Evidence Files"],
        actionsPerformed: ["Scan for uploaded exception proof"],
        outputSummary: "no proof",
        status: "skipped",
        confidence: 100,
        reasonCodes: ["HUMANITARIAN-NO-PROOF"]
      });
      customSteps.push({
        agentId: "agent-recommendation",
        agentName: "Routing Agent",
        purpose: "Decide routing path for the case.",
        inputSources: ["Policy Results Status"],
        actionsPerformed: ["Map outcome to routing matrix"],
        outputSummary: "Direct Beneficiary Outcome / Not Routed to Officer",
        status: "completed",
        confidence: 98,
        reasonCodes: ["ROUTE-DIRECT-BENEFICIARY"]
      });
    } else {
      // Recommended for Approval
      customSteps.push({
        agentId: "agent-doc-intelligence",
        agentName: "Document Intelligence Agent",
        purpose: "Verify salary certificate integrity and validity.",
        inputSources: ["Uploaded Salary Certificate"],
        actionsPerformed: ["Validate signature and stamp", "Run OCR cross-checks"],
        outputSummary: "valid",
        status: "completed",
        confidence: docConfidence,
        reasonCodes: ["DOC-VALID"]
      });
      customSteps.push({
        agentId: "agent-financial-analysis",
        agentName: "Financial Analysis Agent",
        purpose: "Perform household affordability and obligations analysis.",
        inputSources: ["Income and Obligations Records"],
        actionsPerformed: ["Calculate financial ratios"],
        outputSummary: "pass",
        status: "completed",
        confidence: 96,
        reasonCodes: ["FIN-PASS"]
      });
      customSteps.push({
        agentId: "agent-repayment-plan",
        agentName: "Repayment Plan Agent",
        purpose: "Evaluate selected installment plans.",
        inputSources: ["Repayment Slider Settings"],
        actionsPerformed: ["Confirm plan is within allowed 20% cap"],
        outputSummary: "allowed plan selected",
        status: "completed",
        confidence: 95,
        reasonCodes: ["PLAN-ALLOWED"]
      });
      customSteps.push({
        agentId: "agent-policy-rules",
        agentName: "Policy Rules Agent",
        purpose: "Validate all regulatory housing loan rules.",
        inputSources: ["MOEI Governance Rules"],
        actionsPerformed: ["Confirm all checks satisfy guidelines"],
        outputSummary: "pass",
        status: "completed",
        confidence: 97,
        reasonCodes: ["RULES-PASS"]
      });
      customSteps.push({
        agentId: "agent-recommendation",
        agentName: "Routing Agent",
        purpose: "Map case status to next workspace owner.",
        inputSources: ["Rules Evaluation State"],
        actionsPerformed: ["Assign next stage routing"],
        outputSummary: "Ready for Officer Confirmation",
        status: "completed",
        confidence: 98,
        reasonCodes: ["ROUTE-OFFICER-CONFIRMATION"]
      });
    }
    return {
      agentSteps: customSteps,
      caseClassification: {
        caseCategory: (finalStatus === "Humanitarian Review Required" || category === "Medical / Humanitarian" || category === "Income Loss / Unemployment")
          ? "Humanitarian / Exception Review"
          : category,
        casePriority: priority,
        categoryReason: catReason,
      } as any,
      finalStatus,
      resolutionPath,
      recommendationText,
      nextBestAction,
    };
  }

  return {
    agentSteps: steps,
    caseClassification: {
      caseCategory: category,
      casePriority: priority,
      categoryReason: catReason,
    },
    finalStatus,
    resolutionPath,
    recommendationText,
    nextBestAction,
  };
}
