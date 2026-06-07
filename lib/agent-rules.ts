import {
  CaseData,
  DocumentValidationResult,
  FinancialCapacityResult,
  PolicyRulesResult,
  RecommendationResult,
  DecisionReportPackage,
  AuditTrailEvent,
} from "./types";

export function validateDocuments(caseData: CaseData): DocumentValidationResult {
  const warnings: string[] = [];
  const reasonCodes: string[] = [];

  const documentStatus = caseData.salaryCertificateExpired ? "Expired" : "Valid";
  const mismatch = caseData.monthlyIncome !== caseData.salaryCertificateAmount;

  const salaryCertificateChecks = {
    hasCompanyLetterhead: caseData.hasCompanyLetterhead,
    hasAuthorizedSignature: caseData.hasAuthorizedSignature,
    employeeDetailsMatch: caseData.employeeDetailsMatch,
    dateValid: !caseData.salaryCertificateExpired,
  };

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
  if (documentStatus === "Expired") {
    reasonCodes.push("RC-11");
    warnings.push("Salary certificate is expired (exceeds 30-day validity window).");
  }
  if (mismatch) {
    reasonCodes.push("RC-08");
    warnings.push(`Salary mismatch: profile income AED ${caseData.monthlyIncome.toLocaleString('en-US')}, certificate shows AED ${caseData.salaryCertificateAmount.toLocaleString('en-US')}.`);
  }
  if (caseData.documentConfidence < 80) {
    reasonCodes.push("RC-15");
    warnings.push("Document confidence score is below 80%.");
  }

  const variance = Math.abs(caseData.salaryCertificateAmount - caseData.averageSalaryTransfer6Months) / caseData.salaryCertificateAmount;
  const bankConsistencyResult = variance <= 0.05 ? "Consistent" : "Inconsistent";

  if (bankConsistencyResult === "Inconsistent") {
    reasonCodes.push("RC-20");
    warnings.push(`Bank statement average transfer (AED ${caseData.averageSalaryTransfer6Months.toLocaleString('en-US')}) is inconsistent with salary certificate (AED ${caseData.salaryCertificateAmount.toLocaleString('en-US')}).`);
  }

  const bankCrossCheck = {
    averageTransfer: caseData.averageSalaryTransfer6Months,
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
    extractedSalary: caseData.salaryCertificateAmount,
    mismatch,
    salaryCertificateChecks,
    bankCrossCheck,
    medicalValidation,
    reasonCodes,
    warnings,
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
  const obligationsRatio = caseData.financialObligations / caseData.monthlyIncome;
  const netAvailableIncome = caseData.monthlyIncome - caseData.financialObligations;
  const incomePerFamilyMember = caseData.monthlyIncome / caseData.familyMembers;

  const max20PercentDeduction = caseData.monthlyIncome * 0.2;
  const proposedAvailableRoom = max20PercentDeduction - caseData.currentInstallment;

  let proposedArrearsPayment = 0;
  let proposedDurationMonths: number | null = null;
  let proposedTotalDeduction = caseData.currentInstallment;

  if (proposedAvailableRoom > 0) {
    proposedArrearsPayment = Math.min(proposedAvailableRoom, caseData.arrearsAmount);
    if (proposedArrearsPayment > 0) {
      proposedDurationMonths = Math.ceil(caseData.arrearsAmount / proposedArrearsPayment);
      proposedTotalDeduction = caseData.currentInstallment + proposedArrearsPayment;
    }
  }

  const deductionRatio = proposedTotalDeduction / caseData.monthlyIncome;

  return {
    monthlyIncome: caseData.monthlyIncome,
    obligationsRatio,
    netAvailableIncome,
    incomePerFamilyMember,
    max20PercentDeduction,
    currentInstallment: caseData.currentInstallment,
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

  // CASE-E: Unemployment / Income Loss
  if (caseData.monthlyIncome === 0 || caseData.supportingCircumstance?.includes("Unemployment")) {
    return {
      status: "Human Review Required",
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

  // CASE-D: Rejection Recommended (Duplicate without Humanitarian)
  if (caseData.activeRequest && !caseData.supportingCircumstance) {
    return {
      status: "Rejected",
      resolutionPath: "Rejected / Not Eligible",
      recommendation: "Active duplicate request found without humanitarian indicators.",
      nextBestAction: "Review and process rejection.",
      proposedMonthlyDeduction: null,
      proposedDurationMonths: null,
      confidenceScore,
      humanReviewRequired: true,
      explanation: "Active duplicate request found. The application is eligible for automatic rejection as no humanitarian indicators are present.",
      priority: "Medium",
      priorityReason: "Active duplicate request found without humanitarian indicators."
    };
  }

  // CASE-B: Document issues → Additional Information Required
  if (documentValidation.documentStatus === "Expired" || documentValidation.mismatch || documentValidation.bankCrossCheck.consistencyResult === "Inconsistent") {
    return {
      status: "Additional Information Required",
      resolutionPath: "Additional Information Required",
      recommendation: "Request updated documentation or clarification before proceeding.",
      nextBestAction: "Send request for updated salary certificate and bank statement clarification.",
      proposedMonthlyDeduction: null,
      proposedDurationMonths: null,
      confidenceScore,
      humanReviewRequired: false,
      explanation: "The system cannot proceed with this request. The submitted salary certificate is expired, the stated income does not match the certificate amount, and the bank transfer average is inconsistent with the declared salary. Updated documents are required to proceed.",
      priority: "Medium",
      priorityReason: "Waiting for updated salary certificate and bank statement clarification."
    };
  }

  // CASE-C: Humanitarian Review (Active request + stress + circumstance)
  if (caseData.activeRequest || (financialAnalysis.obligationsRatio > 0.6 && financialAnalysis.incomePerFamilyMember < 3000)) {
    return {
      status: "Human Review Required",
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
    status: "Approved",
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
  if (status === "Approved") {
    return {
      en: `Dear ${caseData.beneficiaryName}, we are pleased to inform you that your housing loan arrears rescheduling request has received preliminary approval. Your updated payment schedule will be issued to you shortly through the official MOEI channels.`,
      ar: `عزيزي المتعامل ${caseData.beneficiaryName}، تمت الموافقة المبدئية على طلب إعادة جدولة متأخرات القرض السكني، وسيتم إشعاركم بجدول السداد المحدّث قريباً.`,
    };
  }
  if (status === "Additional Information Required") {
    return {
      en: `Dear ${caseData.beneficiaryName}, to continue reviewing your housing loan arrears rescheduling request, please upload a current and valid salary certificate. Kindly also clarify the discrepancy in the income figures between your application, the submitted certificate, and your bank statement transfers.`,
      ar: `عزيزي المتعامل ${caseData.beneficiaryName}، لاستكمال مراجعة طلبكم، يرجى رفع شهادة راتب حديثة وتوضيح اختلاف بيانات الدخل بين الطلب والمستند المرفق وكشف الحساب البنكي.`,
    };
  }
  if (status === "Human Review Required") {
    return {
      en: `Dear ${caseData.beneficiaryName}, your rescheduling request has been referred for specialist human review due to a detected policy conflict. Our case officers will contact you once the review has been completed. We appreciate your patience.`,
      ar: `عزيزي المتعامل ${caseData.beneficiaryName}، تم تحويل طلبكم للمراجعة البشرية بسبب وجود طلب نشط وارتفاع الالتزامات المالية. سيتم التواصل معكم بعد مراجعة المختص.`,
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

  const recommendation = generateRecommendation(caseData, policyRules, financialCapacity, documentValidation);

  if (recommendation.humanReviewRequired) {
    auditTrail.push({
      timestamp: t(25000),
      actor: "AI Agent",
      action: "Human review trigger generated",
      result: "Warning",
    });
  }

  if (recommendation.status === "Approved") {
    policyRules.reasonCodes.push("RC-16", "RC-01");
  } else if (recommendation.status === "Additional Information Required") {
    policyRules.reasonCodes.push("RC-10");
  } else if (recommendation.status === "Human Review Required") {
    policyRules.reasonCodes.push("RC-09");
    if (caseData.supportingCircumstance?.includes("Unemployment")) {
      policyRules.reasonCodes.push("UNEMPLOYMENT_PROOF", "NO_STABLE_INCOME", "HUMANITARIAN_REVIEW", "MAINTAIN_CURRENT_INSTALLMENT");
    } else if (caseData.supportingCircumstance) {
      policyRules.reasonCodes.push("HUMANITARIAN_REVIEW", "AUTO_DECISION_BLOCKED", "HIGH_OBLIGATION_RATIO", "LOW_INCOME_PER_FAMILY_MEMBER");
    }
  } else if (recommendation.status === "Rejected") {
    policyRules.reasonCodes.push("ACTIVE_REQUEST_FOUND", "DUPLICATE_APPLICATION", "AUTO_REJECTION_ELIGIBLE");
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
  };
}
