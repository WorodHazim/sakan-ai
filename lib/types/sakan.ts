export type CaseSource = 'demo' | 'submitted' | 'custom' | 'imported_excel' | 'database';

export type CaseRecommendation = 
  | 'recommended_for_approval' 
  | 'additional_information_required' 
  | 'human_review_required' 
  | 'humanitarian_review_required' 
  | 'rejection_review';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface SakanCase {
  caseCode: string;
  source: CaseSource;
  beneficiaryName: string | null;
  emiratesId: string | null;
  beneficiaryId: string | null;
  loanId: string | null;
  monthlyIncome: number | null;
  financialObligations: number | null;
  familyMembers: number | null;
  currentInstallment: number | null;
  arrearsAmount: number | null;
  unpaidInstallments: number | null;
  remainingBalance: number | null;
  remainingRepaymentMonths: number | null;
  activeRequest: boolean;
  paymentHistory: string | null;
  supportingCircumstance: string | null;
  recommendation: string | null;
  routingPath: string | null;
  nextOwner: string | null;
  priority: string | null;
  confidence: number | null;
  reasonCodes: string[];
  nextBestAction: string | null;
  status: string | null;
  averageSalaryTransfer6Months?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DecisionTraceRow {
  step: number;
  evidenceUsed: string;
  ruleApplied: string;
  result: string;
  reasonCode: string;
}

export interface AgentTrace {
  id?: string;
  caseCode: string;
  actor: string;
  action: string;
  source: string;
  status: string;
  details?: any;
  createdAt?: string;
}
