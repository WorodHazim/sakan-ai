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
  hasStamp?: boolean;
  averageSalaryTransfer6Months: number;
  hasMedicalDocument: boolean;
  medicalProviderRecognized?: boolean;
  medicalQRVerified?: boolean;
  medicalDateValid?: boolean;
  supportingCircumstance?: string;
  ocrMode?: string;
  ocrWarnings?: string[];
  bankProofFile?: string;
  supportingEvidenceFile?: string;
  selectedMonthlyArrearsDeduction?: number;
  selectedDurationMonths?: number;
  newTotalInstallment?: number;
  deductionRatio?: number;
  planComplianceStatus?: string;
  identityVerified?: boolean;
  identitySource?: string;
  uaePassProfile?: {
    fullName?: string;
    emiratesId?: string;
    nationality?: string;
    mobile?: string;
    email?: string;
    uuid?: string;
  };
};

export type DocumentValidationResult = {
  documentStatus: "Valid" | "Expired" | "Missing";
  extractedSalary: number;
  mismatch: boolean;
  salaryCertificateChecks: {
    hasCompanyLetterhead: boolean;
    hasAuthorizedSignature: boolean;
    employeeDetailsMatch: boolean;
    hasStamp?: boolean;
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
  ocrNeedsReview?: boolean;
  ocrConfidenceLow?: boolean;
  ocrMode?: string;
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
  status: "Approved" | "Additional Information Required" | "Human Review Required" | "Rejected" | "Applicant Action Required" | "Humanitarian Review Required" | "Direct Beneficiary Outcome / Not Eligible" | "Recommended for Approval / Ready for Officer Confirmation" | "Rejection Recommendation / Not Eligible";
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
  caseClassification?: {
    caseCategory: string;
    casePriority: string;
    categoryReason: string;
  };
  agentSteps?: any[];
};

export type AuditTrailEvent = {
  timestamp: string;
  actor: "AI Agent" | "Beneficiary" | "Officer";
  action: string;
  result: "Success" | "Warning" | "Failed";
  relatedReasonCode?: string;
  agentName?: string;
  inputSource?: string;
  reasonCode?: string;
  governanceRule?: string;
  routeImpact?: string;
  category?: "Document" | "Financial" | "Policy" | "Routing" | "Communication";
};
