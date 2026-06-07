export type CaseData = {
  caseId: string;
  beneficiaryName: string;
  beneficiaryId: string;
  emiratesId: string;
  loanId: string;
  monthlyIncome: number;
  financialObligations: number;
  familyMembers: number;
  originalLoanAmount: number;
  remainingLoanBalance: number;
  arrearsAmount: number;
  unpaidInstallments: number;
  currentInstallment: number;
  remainingRepaymentMonths: number;
  paymentHistory: string;
  activeRequest: boolean;
  salaryCertificateAmount: number;
  salaryCertificateExpired: boolean;
  documentConfidence: number;
  hasCompanyLetterhead: boolean;
  hasAuthorizedSignature: boolean;
  employeeDetailsMatch: boolean;
  averageSalaryTransfer6Months: number;
  hasMedicalDocument: boolean;
  medicalProviderRecognized?: boolean;
  medicalQRVerified?: boolean;
  medicalDateValid?: boolean;
  supportingCircumstance?: string;
};

export type DocumentValidationResult = {
  documentStatus: "Valid" | "Expired" | "Missing";
  extractedSalary: number;
  mismatch: boolean;
  salaryCertificateChecks: {
    hasCompanyLetterhead: boolean;
    hasAuthorizedSignature: boolean;
    employeeDetailsMatch: boolean;
    dateValid: boolean;
  };
  bankCrossCheck: {
    averageTransfer: number;
    consistencyResult: "Consistent" | "Inconsistent";
    confidenceScore: number;
  };
  medicalValidation?: {
    providerRecognized: boolean;
    qrVerified: boolean;
    dateValid: boolean;
  };
  reasonCodes: string[];
  warnings: string[];
};

export type FinancialCapacityResult = {
  monthlyIncome: number;
  obligationsRatio: number;
  netAvailableIncome: number;
  incomePerFamilyMember: number;
  max20PercentDeduction: number;
  currentInstallment: number;
  proposedArrearsPayment: number;
  proposedTotalDeduction: number;
  deductionRatio: number;
  proposedDurationMonths: number | null;
};

export type PolicyRulesResult = {
  passedRules: string[];
  failedRules: string[];
  reasonCodes: string[];
  humanReviewTriggers: string[];
};

export type RecommendationResult = {
  status: "Approved" | "Additional Information Required" | "Human Review Required" | "Rejected";
  resolutionPath: "Fast Track Approval" | "Additional Information Required" | "Financial Stress Review" | "Human Review Required" | "Rejected / Not Eligible";
  recommendation: string;
  nextBestAction: string;
  proposedMonthlyDeduction: number | null;
  proposedDurationMonths: number | null;
  confidenceScore: number;
  humanReviewRequired: boolean;
  explanation: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  priorityReason: string;
};

export type DecisionReportPackage = {
  caseData: CaseData;
  documentValidation: DocumentValidationResult;
  financialCapacity: FinancialCapacityResult;
  policyRules: PolicyRulesResult;
  recommendation: RecommendationResult;
  reasonCodes: string[];
  beneficiaryMessages: { en: string; ar: string };
  auditTrail: AuditTrailEvent[];
};

export type AuditTrailEvent = {
  timestamp: string;
  actor: "AI Agent" | "Beneficiary" | "Officer";
  action: string;
  result: "Success" | "Warning" | "Failed";
  relatedReasonCode?: string;
};
