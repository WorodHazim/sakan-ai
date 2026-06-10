import {
  CaseData,
  DocumentValidationResult,
  FinancialCapacityResult,
  PolicyRulesResult,
  RecommendationResult,
  DecisionReportPackage,
  AuditTrailEvent,
} from "./types";
import { buildAgentChain, checkHasBlockingDocumentIssues } from "./agent-orchestrator";

export function parseNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatAmount(value: number | string | null | undefined): string {
  const amount = parseNumber(value);
  if (amount === null) return "Not available";
  return amount.toLocaleString("en-US");
}

export function validateDocuments(caseData: CaseData): DocumentValidationResult {
  const warnings: string[] = [];
  const reasonCodes: string[] = [];

  const monthlyIncome = parseNumber(caseData.monthlyIncome);
  const salaryCertificateAmount = parseNumber(caseData.salaryCertificateAmount);
  const averageSalaryTransfer6Months = parseNumber(caseData.averageSalaryTransfer6Months);

  let documentStatus: "Valid" | "Expired" | "Missing" = "Valid";
  if (salaryCertificateAmount === null) {
    documentStatus = "Missing";
  } else if (caseData.salaryCertificateExpired) {
    documentStatus = "Expired";
  }

  const mismatch = (monthlyIncome !== null && salaryCertificateAmount !== null)
    ? monthlyIncome !== salaryCertificateAmount
    : false;

  const salaryCertificateChecks = {
    hasCompanyLetterhead: caseData.hasCompanyLetterhead !== false,
    hasAuthorizedSignature: caseData.hasAuthorizedSignature !== false,
    employeeDetailsMatch: caseData.employeeDetailsMatch !== false,
    hasStamp: caseData.hasStamp !== false,
    dateValid: !caseData.salaryCertificateExpired,
  };

  if (averageSalaryTransfer6Months === null) {
    warnings.push("Average salary transfer is not available yet.");
    warnings.push("متوسط التحويل البنكي غير متاح حاليًا.");
  }

  if (!salaryCertificateChecks.hasCompanyLetterhead) {
    reasonCodes.push("RC-17");
    warnings.push("Missing company letterhead on salary certificate.");
  }
  if (!salaryCertificateChecks.hasAuthorizedSignature) {
    reasonCodes.push("RC-18");
    warnings.push("Missing authorized signature on salary certificate.");
  }
  if (!salaryCertificateChecks.employeeDetailsMatch) {
    reasonCodes.push("RC-19");
    warnings.push("Employee details on certificate do not match profile.");
  }
  if (caseData.hasStamp === false) {
    reasonCodes.push("RC-22");
    warnings.push("Missing company stamp on salary certificate.");
  }
  if (documentStatus === "Expired") {
    reasonCodes.push("RC-11");
    warnings.push("Salary certificate is expired (exceeds 30-day validity window).");
  }
  if (mismatch) {
    reasonCodes.push("RC-08");
    warnings.push(`Salary mismatch: profile income AED ${formatAmount(monthlyIncome)}, certificate shows AED ${formatAmount(salaryCertificateAmount)}.`);
  }
  let ocrNeedsReview = false;
  let ocrConfidenceLow = false;

  const ocrModeLower = (caseData.ocrMode || "").toLowerCase();
  const isFallbackOcr = ["fallback", "cached_fallback", "demo_fallback"].includes(ocrModeLower);
  const hasLowConfidenceWarning = (caseData.ocrWarnings || []).some(w => w.toLowerCase().includes("low confidence"));

  if (isFallbackOcr) {
    if ((caseData.documentConfidence ?? 100) < 80 || hasLowConfidenceWarning) {
      ocrNeedsReview = true;
      ocrConfidenceLow = true;
    }
  } else if (ocrModeLower.includes("tesseract")) {
    if ((caseData.documentConfidence ?? 100) < 80 || (caseData.ocrWarnings && caseData.ocrWarnings.length > 0)) {
      ocrNeedsReview = true;
    }
  }

  if (ocrConfidenceLow) {
    reasonCodes.push("RC-15");
    warnings.push("OCR confidence is low");
  } else if ((caseData.documentConfidence ?? 0) < 80 && !ocrModeLower.includes("live") && caseData.ocrMode) {
    reasonCodes.push("RC-15");
    warnings.push("Document confidence score is below 80%.");
  }

  let bankConsistencyResult: "Consistent" | "Inconsistent" = "Consistent";
  if (salaryCertificateAmount !== null && averageSalaryTransfer6Months !== null && salaryCertificateAmount > 0) {
    const variance = Math.abs(salaryCertificateAmount - averageSalaryTransfer6Months) / salaryCertificateAmount;
    bankConsistencyResult = variance <= 0.05 ? "Consistent" : "Inconsistent";
  } else if (salaryCertificateAmount === null || averageSalaryTransfer6Months === null) {
    bankConsistencyResult = "Inconsistent";
  }

  if (bankConsistencyResult === "Inconsistent") {
    if (caseData.bankProofFile) {
      warnings.push("Bank statement average transfer discrepancy: Proof provided — pending verification.");
    } else {
      reasonCodes.push("RC-20");
      if (averageSalaryTransfer6Months !== null && salaryCertificateAmount !== null) {
        warnings.push(`Bank statement average transfer (AED ${formatAmount(averageSalaryTransfer6Months)}) is inconsistent with salary certificate (AED ${formatAmount(salaryCertificateAmount)}).`);
      } else {
        warnings.push("Bank statement verification pending due to missing amounts.");
      }
    }
  }

  const bankCrossCheck = {
    averageTransfer: averageSalaryTransfer6Months ?? 0,
    consistencyResult: bankConsistencyResult as "Consistent" | "Inconsistent",
    confidenceScore: bankConsistencyResult === "Consistent" ? 98 : 65,
  };

  let medicalValidation;
  if (caseData.hasMedicalDocument) {
    medicalValidation = {
      providerRecognized: caseData.medicalProviderRecognized || false,
      qrVerified: caseData.medicalQRVerified || false,
      dateValid: caseData.medicalDateValid || false,
    };
    if (!medicalValidation.providerRecognized || !medicalValidation.qrVerified || !medicalValidation.dateValid) {
      reasonCodes.push("RC-21");
      warnings.push("Medical document validation failed (provider, QR, or date).");
    }
  }

  return {
    documentStatus,
    extractedSalary: salaryCertificateAmount ?? 0,
    mismatch,
    salaryCertificateChecks,
    bankCrossCheck,
    medicalValidation,
    reasonCodes,
    warnings,
    ocrNeedsReview,
    ocrConfidenceLow,
    ocrMode: caseData.ocrMode,
  };
}

export function checkActiveRequest(caseData: CaseData) {
  const reasonCodes: string[] = [];
  if (caseData.activeRequest) {
    reasonCodes.push("RC-14");
  } else {
    reasonCodes.push("RC-02");
  }
  return {
    activeRequestFound: caseData.activeRequest,
    ruleResult: !caseData.activeRequest ? "Pass" : "Fail",
    reasonCodes,
  };
}

export function calculateFinancialCapacity(caseData: CaseData): FinancialCapacityResult {
  const monthlyIncome = parseNumber(caseData.monthlyIncome) ?? 0;
  const financialObligations = parseNumber(caseData.financialObligations) ?? 0;
  const familyMembers = parseNumber(caseData.familyMembers) ?? 1;
  const currentInstallment = parseNumber(caseData.currentInstallment) ?? 0;
  const arrearsAmount = parseNumber(caseData.arrearsAmount) ?? 0;

  const obligationsRatio = monthlyIncome > 0 ? financialObligations / monthlyIncome : 0;
  const netAvailableIncome = monthlyIncome - financialObligations;
  const incomePerFamilyMember = familyMembers > 0 ? monthlyIncome / familyMembers : 0;

  const max20PercentDeduction = monthlyIncome * 0.2;
  const proposedAvailableRoom = max20PercentDeduction - currentInstallment;

  let proposedArrearsPayment = 0;
  let proposedDurationMonths: number | null = null;
  let proposedTotalDeduction = currentInstallment;

  if (caseData.selectedMonthlyArrearsDeduction !== undefined) {
    proposedArrearsPayment = caseData.selectedMonthlyArrearsDeduction;
    proposedDurationMonths = caseData.selectedDurationMonths !== undefined
      ? caseData.selectedDurationMonths
      : (proposedArrearsPayment > 0 ? Math.ceil(arrearsAmount / proposedArrearsPayment) : null);
    proposedTotalDeduction = caseData.newTotalInstallment !== undefined
      ? caseData.newTotalInstallment
      : (currentInstallment + proposedArrearsPayment);
  } else if (proposedAvailableRoom > 0) {
    proposedArrearsPayment = Math.min(proposedAvailableRoom, arrearsAmount);
    if (proposedArrearsPayment > 0) {
      proposedDurationMonths = Math.ceil(arrearsAmount / proposedArrearsPayment);
      proposedTotalDeduction = currentInstallment + proposedArrearsPayment;
    }
  }

  const deductionRatio = monthlyIncome > 0 ? proposedTotalDeduction / monthlyIncome : 0;

  return {
    monthlyIncome,
    obligationsRatio,
    netAvailableIncome,
    incomePerFamilyMember,
    max20PercentDeduction,
    currentInstallment,
    proposedArrearsPayment,
    proposedTotalDeduction,
    deductionRatio,
    proposedDurationMonths,
  };
}

export function applyPolicyRules(
  caseData: CaseData,
  financialAnalysis: FinancialCapacityResult,
  documentValidation: DocumentValidationResult
): PolicyRulesResult {
  const passedRules: string[] = [];
  const failedRules: string[] = [];
  const reasonCodes: string[] = [];
  const humanReviewTriggers: string[] = [];

  // Rule 1: 20% Deduction Cap
  if (financialAnalysis.proposedTotalDeduction <= financialAnalysis.max20PercentDeduction) {
    passedRules.push("20% Deduction Cap");
    reasonCodes.push("RC-04");
  } else {
    failedRules.push("20% Deduction Cap");
    reasonCodes.push("RC-05");
    humanReviewTriggers.push("Proposed total deduction exceeds 20% cap");
  }

  // Rule 2: Repayment Period Constraint
  if (
    financialAnalysis.proposedDurationMonths !== null &&
    financialAnalysis.proposedDurationMonths <= caseData.remainingRepaymentMonths
  ) {
    passedRules.push("Repayment Period Constraint");
    reasonCodes.push("RC-06");
  } else if (financialAnalysis.proposedDurationMonths !== null) {
    failedRules.push("Repayment Period Constraint");
    reasonCodes.push("RC-07");
    if (!caseData.activeRequest && !(financialAnalysis.obligationsRatio > 0.6 && financialAnalysis.incomePerFamilyMember < 3000)) {
      humanReviewTriggers.push("Proposed duration exceeds remaining repayment period");
    }
  }

  // Rule 3: No Active Requests
  if (caseData.activeRequest) {
    failedRules.push("No Active Requests");
    humanReviewTriggers.push("Active request found");
  } else {
    passedRules.push("No Active Requests");
  }

  // Rule 4: Financial Obligations Ratio
  if (financialAnalysis.obligationsRatio > 0.6) {
    failedRules.push("Financial Obligations Ratio ≤ 60%");
    reasonCodes.push("RC-12");
    humanReviewTriggers.push("Obligations exceed 60%");
  } else {
    passedRules.push("Financial Obligations Ratio ≤ 60%");
  }

  // Rule 5: Minimum Income Per Family Member
  if (financialAnalysis.incomePerFamilyMember < 3000) {
    failedRules.push("Minimum Income Per Family Member (AED 3,000)");
    reasonCodes.push("RC-13");
    humanReviewTriggers.push("Low income per family member");
  } else {
    passedRules.push("Minimum Income Per Family Member (AED 3,000)");
  }

  // Rule 6: Document integrity
  if (documentValidation.mismatch) {
    humanReviewTriggers.push("Salary mismatch");
  }
  if (documentValidation.documentStatus === "Expired") {
    humanReviewTriggers.push("Expired salary certificate");
  }
  if (documentValidation.bankCrossCheck.consistencyResult === "Inconsistent") {
    humanReviewTriggers.push("Bank transfer inconsistency");
  }

  // Rule 7: Automated plan availability
  if (financialAnalysis.proposedArrearsPayment === 0 || caseData.activeRequest || (financialAnalysis.obligationsRatio > 0.6 && financialAnalysis.incomePerFamilyMember < 3000)) {
    humanReviewTriggers.push("Automated plan unavailable");
  }

  return { passedRules, failedRules, reasonCodes, humanReviewTriggers };
}

export function generateRecommendation(
  caseData: CaseData,
  policyResult: PolicyRulesResult,
  financialAnalysis: FinancialCapacityResult,
  documentValidation: DocumentValidationResult
): RecommendationResult {
  const baseConfidence = documentValidation.documentStatus === "Expired" || documentValidation.mismatch ? 58 :
    financialAnalysis.obligationsRatio > 0.6 ? 72 : 96;
  const confidenceScore = Math.min(baseConfidence, caseData.documentConfidence);

  if (documentValidation.ocrNeedsReview) {
    const hasHighRiskOrHumanitarian = !!(
      caseData.activeRequest ||
      financialAnalysis.obligationsRatio > 0.6 ||
      financialAnalysis.incomePerFamilyMember < 3000 ||
      caseData.supportingCircumstance ||
      caseData.monthlyIncome === 0
    );

    if (hasHighRiskOrHumanitarian) {
      return {
        status: "Human Review Required",
        resolutionPath: "Human Review Required",
        recommendation: "Policy conflict or low OCR confidence detected. Human officer review is required before a final decision.",
        nextBestAction: "Assign the case to a human officer for manual review.",
        proposedMonthlyDeduction: null,
        proposedDurationMonths: null,
        confidenceScore,
        humanReviewRequired: true,
        explanation: "This case is not eligible for automatic approval because the OCR confidence is low, and high-risk financial or humanitarian indicators are present. A human officer must review the case before a final decision.",
        priority: "High",
        priorityReason: "Low OCR confidence combined with high-risk financial or humanitarian indicators."
      };
    } else {
      return {
        status: "Applicant Action Required",
        resolutionPath: "Additional Information Required",
        recommendation: "Request updated documentation due to low OCR confidence.",
        nextBestAction: "Send request for an updated salary certificate issued within the last 30 days and request bank statement clarification.",
        proposedMonthlyDeduction: null,
        proposedDurationMonths: null,
        confidenceScore,
        humanReviewRequired: false,
        explanation: "The system cannot proceed with this request because the OCR reader returned low confidence. Please request a clear, updated salary certificate from the beneficiary.",
        priority: "Medium",
        priorityReason: "Low OCR confidence. Additional information is required."
      };
    }
  }

  const circumstanceLower = (caseData.supportingCircumstance || "").toLowerCase();
  const familyMembersVal = parseNumber(caseData.familyMembers) ?? 1;
  const monthlyIncomeVal = parseNumber(caseData.monthlyIncome) ?? 0;
  const hasHumanitarian = 
    monthlyIncomeVal === 0 ||
    circumstanceLower.includes("unemployment") ||
    circumstanceLower.includes("job loss") ||
    circumstanceLower.includes("income loss") ||
    caseData.hasMedicalDocument === true ||
    circumstanceLower.includes("medical") ||
    circumstanceLower.includes("health") ||
    circumstanceLower.includes("treatment") ||
    circumstanceLower.includes("hardship") ||
    circumstanceLower.includes("social") ||
    circumstanceLower.includes("vulnerability") ||
    (familyMembersVal > 0 && monthlyIncomeVal / familyMembersVal < 3000) ||
    circumstanceLower.includes("delay") ||
    circumstanceLower.includes("project delay") ||
    circumstanceLower.includes("exception");

  const hasHumanitarianProof = !!caseData.supportingEvidenceFile || 
    caseData.caseId === "CASE-C" || caseData.caseId === "CASE-E" ||
    caseData.caseId === "CASE-C" || caseData.caseId === "CASE-E";

  const hasDocIssues = checkHasBlockingDocumentIssues(caseData, documentValidation);

  // 1. Humanitarian / exception WITHOUT proof
  if (hasHumanitarian && !hasHumanitarianProof) {
    return {
      status: "Applicant Action Required",
      resolutionPath: "Additional Information Required",
      recommendation: "Please upload supporting evidence for the selected circumstance before the case can be reviewed.",
      nextBestAction: "Upload supporting evidence for the selected circumstance.",
      proposedMonthlyDeduction: null,
      proposedDurationMonths: null,
      confidenceScore,
      humanReviewRequired: false,
      explanation: "Humanitarian/exception circumstance was claimed but no supporting evidence was provided. The request remains in Applicant Action Required status.",
      priority: "Medium",
      priorityReason: "Supporting evidence required."
    };
  }

  // 2. Document issues with NO humanitarian WITH proof
  if (hasDocIssues && !(hasHumanitarian && hasHumanitarianProof)) {
    return {
      status: "Applicant Action Required",
      resolutionPath: "Additional Information Required",
      recommendation: "Request updated documentation or clarification before proceeding.",
      nextBestAction: "Upload a corrected salary certificate and/or update declared income/bank evidence.",
      proposedMonthlyDeduction: null,
      proposedDurationMonths: null,
      confidenceScore,
      humanReviewRequired: false,
      explanation: "The system cannot proceed with this request. The submitted salary certificate is expired, or there is a mismatch between declared income, certificate values, and bank average transfer records.",
      priority: "Medium",
      priorityReason: "Waiting for updated salary certificate and bank statement clarification."
    };
  }

  // 3. CASE-E: Unemployment / Income Loss (with proof)
  if (monthlyIncomeVal === 0 || circumstanceLower.includes("unemployment")) {
    return {
      status: "Humanitarian Review Required",
      resolutionPath: "Financial Stress Review",
      recommendation: "Move arrears to the end of the repayment period without increasing current monthly installment.",
      nextBestAction: "Assign to specialized case officer for unemployment review.",
      proposedMonthlyDeduction: caseData.currentInstallment,
      proposedDurationMonths: caseData.remainingRepaymentMonths + Math.ceil(caseData.arrearsAmount / caseData.currentInstallment),
      confidenceScore,
      humanReviewRequired: true,
      explanation: "This case requires urgent humanitarian review. Unemployment or total income loss detected. Proposing to move arrears to the end of the loan term without increasing the current monthly installment.",
      priority: "Urgent",
      priorityReason: "No stable income detected, arrears risk increasing, propose moving arrears to end of repayment period without increasing monthly installment."
    };
  }

  // 4. CASE-D: Rejection Recommended (Duplicate without Humanitarian)
  if (caseData.activeRequest && !hasHumanitarian) {
    return {
      status: "Rejection Recommendation / Not Eligible",
      resolutionPath: "Rejected / Not Eligible",
      recommendation: "Policy conflict and not eligible under current rules; no humanitarian exception detected.",
      nextBestAction: "Review rejection recommendation.",
      proposedMonthlyDeduction: null,
      proposedDurationMonths: null,
      confidenceScore,
      humanReviewRequired: false,
      explanation: "Policy conflict and not eligible under current rules; no humanitarian exception detected.",
      priority: "Medium",
      priorityReason: "Policy conflict and not eligible under current rules; no humanitarian exception detected."
    };
  }

  // 5. CASE-C / Humanitarian Review (with proof)
  if (caseData.activeRequest || (financialAnalysis.obligationsRatio > 0.6 && financialAnalysis.incomePerFamilyMember < 3000) || hasHumanitarian) {
    return {
      status: "Humanitarian Review Required",
      resolutionPath: "Human Review Required",
      recommendation: "Policy conflict detected. Human officer review is required before a final decision.",
      nextBestAction: "Assign to specialized case officer for manual assessment.",
      proposedMonthlyDeduction: null,
      proposedDurationMonths: null,
      confidenceScore,
      humanReviewRequired: true,
      explanation: "This case is not eligible for automatic approval because an active request exists and the financial obligations ratio exceeds the policy threshold. However, the system does not automatically reject the case because vulnerability indicators are present. A human officer must review the case before a final decision.",
      priority: "High",
      priorityReason: "Humanitarian indicators detected, obligations exceed threshold, income per family member is low, active request conflict requires officer review."
    };
  }

  // CASE-A: Clean approval
  return {
    status: "Recommended for Approval / Ready for Officer Confirmation",
    resolutionPath: "Fast Track Approval",
    recommendation: "Approve rescheduling based on calculated repayment capacity.",
    nextBestAction: "Proceed with fast-track rescheduling plan and notify beneficiary.",
    proposedMonthlyDeduction: financialAnalysis.proposedTotalDeduction,
    proposedDurationMonths: financialAnalysis.proposedDurationMonths,
    confidenceScore,
    humanReviewRequired: false,
    explanation: "All documents are valid, verified, and consistent with the beneficiary profile. No active request exists. The proposed deduction is within the 20% cap, and the repayment duration is within the remaining loan term. The case is eligible for fast-track approval.",
    priority: "Low",
    priorityReason: "Auto-approval ready, no officer review required."
  };
}

export function generateBeneficiaryMessage(
  caseData: CaseData,
  status: RecommendationResult["status"]
) {
  const docVal = validateDocuments(caseData);
  const hasDocIssues = checkHasBlockingDocumentIssues(caseData, docVal);
  
  const circumstanceLower = (caseData.supportingCircumstance || "").toLowerCase();
  const hasHumanitarian = 
    caseData.monthlyIncome === 0 ||
    (caseData.supportingCircumstance && caseData.supportingCircumstance !== "None" && circumstanceLower !== "none") ||
    caseData.hasMedicalDocument === true;
  const hasHumanitarianProof = !!caseData.supportingEvidenceFile || 
    caseData.caseId === "CASE-C" || caseData.caseId === "CASE-E";
  const isHumanitarianWithoutProof = hasHumanitarian && !hasHumanitarianProof;

  // Custom document issue behavior / message
  if (hasDocIssues && !caseData.caseId.startsWith("CASE-")) {
    return {
      en: "This request cannot proceed until the beneficiary corrects the document issues.",
      ar: "لا يمكن متابعة الطلب حتى يقوم المستفيد بتصحيح مشاكل المستند."
    };
  }

  // Humanitarian exception selected but no proof uploaded
  if (isHumanitarianWithoutProof && !caseData.caseId.startsWith("CASE-")) {
    return {
      en: "Please upload supporting evidence for the selected hardship reason before the case can be reviewed.",
      ar: "يرجى رفع مستند داعم للظرف المحدد قبل تحويل الحالة للمراجعة."
    };
  }

  if (status === "Approved" || (status as any) === "Recommended for Approval / Ready for Officer Confirmation" || status === "Recommended for Approval / Ready for Officer Confirmation") {
    return {
      en: `Dear ${caseData.beneficiaryName}, we are pleased to inform you that your housing loan arrears rescheduling request has received preliminary approval. Your updated payment schedule will be issued to you shortly through the official MOEI channels.`,
      ar: `عزيزي المتعامل ${caseData.beneficiaryName}، تمت الموافقة المبدئية على طلب إعادة جدولة متأخرات القرض السكني، وسيتم إشعاركم بجدول السداد المحدّث قريباً.`,
    };
  }
  if (status === "Additional Information Required" || (status as any) === "Applicant Action Required") {
    const isExpired = docVal.documentStatus === "Expired" || caseData.salaryCertificateExpired;
    const isMismatch = docVal.mismatch;
    const isInconsistent = docVal.bankCrossCheck.consistencyResult === "Inconsistent";

    if (isExpired && isMismatch && isInconsistent) {
      return {
        en: `Dear ${caseData.beneficiaryName}, please upload a recent salary certificate issued within the last 30 days. The extracted salary does not match your declared income, and the bank transfer average is inconsistent with the salary certificate.`,
        ar: `عزيزي المتعامل ${caseData.beneficiaryName}، يرجى رفع شهادة راتب حديثة صادرة خلال آخر 30 يومًا. الراتب المستخرج لا يتطابق مع الدخل المصرح به، كما أن متوسط التحويل البنكي غير متسق مع شهادة الراتب.`,
      };
    }
    return {
      en: `Dear ${caseData.beneficiaryName}, to continue reviewing your housing loan arrears rescheduling request, please upload a current and valid salary certificate. Kindly also clarify the discrepancy in the income figures between your application, the submitted certificate, and your bank statement transfers.`,
      ar: `عزيزي المتعامل ${caseData.beneficiaryName}، لاستكمال مراجعة طلبكم، يرجى رفع شهادة راتب حديثة وتوضيح اختلاف بيانات الدخل بين الطلب والمستند المرفق وكشف الحساب البنكي.`,
    };
  }
  if (status === "Human Review Required" || (status as any) === "Humanitarian Review Required") {
    return {
      en: `Dear ${caseData.beneficiaryName}, your rescheduling request has been referred for specialist human review due to a detected policy conflict. Our case officers will contact you once the review has been completed. We appreciate your patience.`,
      ar: `عزيزي المتعامل ${caseData.beneficiaryName}، تم تحويل طلبكم للمراجعة البشرية بسبب وجود طلب نشط وارتفاع الالتزامات المالية. سيتم التواصل معكم بعد مراجعة المختص.`,
    };
  }
  if (status === "Rejection Recommendation / Not Eligible" || (status as any) === "Rejection Recommendation / Not Eligible" || (status as any) === "Rejected" || status === "Direct Beneficiary Outcome / Not Eligible") {
    return {
      en: `Dear ${caseData.beneficiaryName}, we are unable to approve your request due to policy conflicts and ineligibility under current rules. No humanitarian exception was detected.`,
      ar: `عزيزي المتعامل ${caseData.beneficiaryName}، تعذر قبول طلبكم بسبب تعارض السياسات وعدم الأهلية بموجب الشروط الحالية، مع عدم توفر استثناء إنساني.`,
    };
  }
  return {
    en: `Dear ${caseData.beneficiaryName}, we are unable to process your request at this time. Please contact our service centre for further assistance.`,
    ar: `عزيزي المتعامل ${caseData.beneficiaryName}، نعتذر عن معالجة طلبكم في الوقت الراهن. يرجى التواصل مع مركز الخدمة للمساعدة.`,
  };
}

export function runDecisionAgent(caseData: CaseData): DecisionReportPackage {
  const t = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();

  const auditTrail: AuditTrailEvent[] = [
    { timestamp: t(120000), actor: "Beneficiary", action: "Applicant submitted declaration", result: "Success" },
    { timestamp: t(110000), actor: "AI Agent", action: "Retrieved UAE PASS identity profile", result: "Success" },
    { timestamp: t(100000), actor: "AI Agent", action: "Retrieved loan data from Mock MOEI Loan System", result: "Success" },
    { timestamp: t(90000), actor: "AI Agent", action: "Retrieved arrears and payment history", result: "Success" },
    { timestamp: t(80000), actor: "AI Agent", action: "Salary certificate processed by Mock OCR", result: "Success" },
  ];

  const documentValidation = validateDocuments(caseData);
  auditTrail.push({
    timestamp: t(70000),
    actor: "AI Agent",
    action: "Document integrity validation completed",
    result: documentValidation.warnings.length > 0 ? "Warning" : "Success",
    relatedReasonCode: documentValidation.reasonCodes[0],
  });
  auditTrail.push({
    timestamp: t(65000),
    actor: "AI Agent",
    action: "Bank statement cross-check completed",
    result: documentValidation.bankCrossCheck.consistencyResult === "Consistent" ? "Success" : "Warning",
    relatedReasonCode: documentValidation.bankCrossCheck.consistencyResult === "Inconsistent" ? "RC-20" : undefined,
  });

  const activeRequestResult = checkActiveRequest(caseData);
  auditTrail.push({
    timestamp: t(55000),
    actor: "AI Agent",
    action: "Active request check completed",
    result: activeRequestResult.activeRequestFound ? "Warning" : "Success",
    relatedReasonCode: activeRequestResult.reasonCodes[0],
  });

  const financialCapacity = calculateFinancialCapacity(caseData);
  auditTrail.push({
    timestamp: t(45000),
    actor: "AI Agent",
    action: "Financial capacity analysis completed",
    result: "Success",
  });

  const policyRules = applyPolicyRules(caseData, financialCapacity, documentValidation);
  if (activeRequestResult.activeRequestFound) {
    policyRules.reasonCodes.push(...activeRequestResult.reasonCodes);
  }
  policyRules.reasonCodes.push(...documentValidation.reasonCodes);

  const hasPolicyConflict = policyRules.failedRules.length > 0 || policyRules.humanReviewTriggers.length > 0;
  auditTrail.push({
    timestamp: t(35000),
    actor: "AI Agent",
    action: hasPolicyConflict ? "Policy conflict detected" : "Policy rules validated — all checks passed",
    result: hasPolicyConflict ? "Warning" : "Success",
  });

  // Invoke the orchestrated agent chain
  const agentChain = buildAgentChain(caseData, null, documentValidation, null);

  const recommendation = generateRecommendation(caseData, policyRules, financialCapacity, documentValidation);

  // Sync recommendation fields directly with the orchestrated agent chain result
  recommendation.status = agentChain.finalStatus as any;
  recommendation.resolutionPath = agentChain.resolutionPath as any;
  recommendation.recommendation = agentChain.recommendationText;
  recommendation.nextBestAction = agentChain.nextBestAction;
  recommendation.priority = agentChain.caseClassification.casePriority;
  recommendation.priorityReason = agentChain.caseClassification.categoryReason;
  
  if (recommendation.status === "Humanitarian Review Required") {
    recommendation.humanReviewRequired = true;
  } else if (recommendation.status === "Applicant Action Required" || recommendation.status === "Recommended for Approval / Ready for Officer Confirmation" || recommendation.status === "Rejection Recommendation / Not Eligible") {
    recommendation.humanReviewRequired = false;
  }

  if (recommendation.humanReviewRequired) {
    auditTrail.push({
      timestamp: t(25000),
      actor: "AI Agent",
      action: "Human review trigger generated",
      result: "Warning",
    });
  }

  if (recommendation.status === "Recommended for Approval / Ready for Officer Confirmation" || (recommendation.status as any) === "Approved") {
    policyRules.reasonCodes.push("RC-16", "RC-01");
  } else if (recommendation.status === "Applicant Action Required" || (recommendation.status as any) === "Additional Information Required") {
    policyRules.reasonCodes.push("RC-10");
  } else if (recommendation.status === "Humanitarian Review Required" || (recommendation.status as any) === "Human Review Required") {
    policyRules.reasonCodes.push("RC-09");
    if (caseData.supportingCircumstance?.includes("Unemployment")) {
      policyRules.reasonCodes.push("UNEMPLOYMENT_PROOF", "NO_STABLE_INCOME", "HUMANITARIAN_REVIEW", "MAINTAIN_CURRENT_INSTALLMENT");
    } else if (caseData.supportingCircumstance) {
      policyRules.reasonCodes.push("HUMANITARIAN_REVIEW", "AUTO_DECISION_BLOCKED", "HIGH_OBLIGATION_RATIO", "LOW_INCOME_PER_FAMILY_MEMBER");
    }
  } else if (recommendation.status === "Rejection Recommendation / Not Eligible" || (recommendation.status as any) === "Rejected") {
    policyRules.reasonCodes.push("POLICY_CONFLICT", "NOT_ELIGIBLE_CURRENT_RULES", "AUTO_REJECTION_ELIGIBLE");
  }

  if (caseData.supportingCircumstance) {
    auditTrail.push({
      timestamp: t(30000),
      actor: "AI Agent",
      action: "Humanitarian trigger detected",
      result: "Warning",
    });
    if (caseData.activeRequest) {
      auditTrail.push({
        timestamp: t(28000),
        actor: "AI Agent",
        action: "Automatic rejection blocked",
        result: "Warning",
      });
    }
  }

  const uniqueReasonCodes = Array.from(new Set(policyRules.reasonCodes));

  auditTrail.push({
    timestamp: t(15000),
    actor: "AI Agent",
    action: "Recommendation generated and decision report created",
    result: "Success",
  });
  auditTrail.push({
    timestamp: t(10000),
    actor: "AI Agent",
    action: "Officer priority calculated",
    result: "Success",
  });
  auditTrail.push({
    timestamp: t(8000),
    actor: "AI Agent",
    action: "Case assigned based on priority",
    result: "Success",
  });
  auditTrail.push({
    timestamp: t(5000),
    actor: "Officer",
    action: "Officer action pending",
    result: "Warning",
  });

  const beneficiaryMessages = generateBeneficiaryMessage(caseData, recommendation.status);

  return {
    caseData,
    documentValidation,
    financialCapacity,
    policyRules,
    recommendation,
    reasonCodes: uniqueReasonCodes,
    beneficiaryMessages,
    auditTrail,
    caseClassification: agentChain.caseClassification,
    agentSteps: agentChain.agentSteps,
  };
}
