import { supabase, isSupabaseConfigured } from "../supabase/client";
import { SakanCase, AgentTrace } from "../types/sakan";
import { DEMO_CASES } from "../data/demoCases";

// Helper to map DB row (snake_case) to SakanCase (camelCase)
export function mapRowToCase(row: any): SakanCase {
  return {
    caseCode: row.case_code,
    source: row.source,
    beneficiaryName: row.beneficiary_name,
    emiratesId: row.emirates_id,
    beneficiaryId: row.beneficiary_id,
    loanId: row.loan_id,
    monthlyIncome: row.monthly_income ? Number(row.monthly_income) : null,
    financialObligations: row.financial_obligations ? Number(row.financial_obligations) : null,
    familyMembers: row.family_members,
    currentInstallment: row.current_installment ? Number(row.current_installment) : null,
    arrearsAmount: row.arrears_amount ? Number(row.arrears_amount) : null,
    unpaidInstallments: row.unpaid_installments,
    remainingBalance: row.remaining_balance ? Number(row.remaining_balance) : null,
    remainingRepaymentMonths: row.remaining_repayment_months,
    activeRequest: !!row.active_request,
    paymentHistory: row.payment_history,
    supportingCircumstance: row.supporting_circumstance,
    recommendation: row.recommendation,
    routingPath: row.routing_path,
    nextOwner: row.next_owner,
    priority: row.priority,
    confidence: row.confidence ? Number(row.confidence) : null,
    reasonCodes: Array.isArray(row.reason_codes) ? row.reason_codes : [],
    nextBestAction: row.next_best_action,
    status: row.status,
    averageSalaryTransfer6Months: row.monthly_income ? Number(row.monthly_income) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to map SakanCase (camelCase) to DB row (snake_case)
export function mapCaseToRow(c: SakanCase): any {
  return {
    case_code: c.caseCode,
    source: c.source,
    beneficiary_name: c.beneficiaryName,
    emirates_id: c.emiratesId,
    beneficiary_id: c.beneficiaryId,
    loan_id: c.loanId,
    monthly_income: c.monthlyIncome,
    financial_obligations: c.financialObligations,
    family_members: c.familyMembers,
    current_installment: c.currentInstallment,
    arrears_amount: c.arrearsAmount,
    unpaid_installments: c.unpaidInstallments,
    remaining_balance: c.remainingBalance,
    remaining_repayment_months: c.remainingRepaymentMonths,
    active_request: c.activeRequest,
    payment_history: c.paymentHistory,
    supporting_circumstance: c.supportingCircumstance,
    recommendation: c.recommendation,
    routing_path: c.routingPath,
    next_owner: c.nextOwner,
    priority: c.priority,
    confidence: c.confidence,
    reason_codes: c.reasonCodes,
    next_best_action: c.nextBestAction,
    status: c.status,
  };
}

// 1. Get Demo Cases
export function getDemoCases(): SakanCase[] {
  return DEMO_CASES;
}

// 2. Get Cases (Supabase + local fallback + demo merge)
export async function getCases(): Promise<SakanCase[]> {
  const localCases: SakanCase[] = [];
  
  // Try to load any custom cases from local storage
  if (typeof window !== "undefined") {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith("customCase_")) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const raw = JSON.parse(stored);
            localCases.push({
              caseCode: raw.caseId || key.replace("customCase_", ""),
              source: "custom",
              beneficiaryName: raw.beneficiaryName || "Custom Case",
              emiratesId: raw.emiratesId || null,
              beneficiaryId: raw.beneficiaryId || null,
              loanId: raw.loanId || null,
              monthlyIncome: raw.monthlyIncome || 0,
              financialObligations: raw.financialObligations || 0,
              familyMembers: raw.familyMembers || 0,
              currentInstallment: raw.currentInstallment || 0,
              arrearsAmount: raw.arrearsAmount || 0,
              unpaidInstallments: raw.unpaidInstallments || 0,
              remainingBalance: raw.remainingLoanBalance || 0,
              remainingRepaymentMonths: raw.remainingRepaymentMonths || 0,
              activeRequest: !!raw.activeRequest,
              paymentHistory: raw.paymentHistory || "Custom Case",
              supportingCircumstance: raw.supportingCircumstance || null,
              recommendation: raw.recommendation || "Recommended for Approval",
              routingPath: raw.routingPath || "Fast Track",
              nextOwner: raw.nextOwner || "Officer Confirmation",
              priority: raw.priority || "Low",
              confidence: raw.confidenceScore || 90,
              reasonCodes: [],
              nextBestAction: raw.nextBestAction || null,
              status: raw.status || "Recommended for Approval",
              averageSalaryTransfer6Months: raw.averageSalaryTransfer6Months || raw.monthlyIncome || 0,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load local custom cases", e);
    }
  }

  // Base list starts with local custom cases and demo cases
  const allDemoCases = getDemoCases();
  let mergedCases: SakanCase[] = [...localCases];

  // If Supabase is configured, retrieve database cases
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase getCases error:", error);
      } else if (data) {
        const dbCases = data.map(mapRowToCase);
        // Add DB cases that are not duplicates of local cases
        for (const dbCase of dbCases) {
          if (!mergedCases.some(c => c.caseCode === dbCase.caseCode)) {
            mergedCases.push(dbCase);
          }
        }
      }
    } catch (e) {
      console.error("Supabase connection failed:", e);
    }
  }

  // Ensure all standard demo cases are included
  for (const demoCase of allDemoCases) {
    if (!mergedCases.some(c => c.caseCode === demoCase.caseCode)) {
      mergedCases.push(demoCase);
    }
  }

  return mergedCases;
}

// 3. Get Case By Code
export async function getCaseByCode(caseCode: string): Promise<SakanCase | null> {
  // A. Check localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`customCase_${caseCode}`);
      if (stored) {
        const raw = JSON.parse(stored);
        return {
          caseCode: raw.caseId || caseCode,
          source: "custom",
          beneficiaryName: raw.beneficiaryName || "Custom Case",
          emiratesId: raw.emiratesId || null,
          beneficiaryId: raw.beneficiaryId || null,
          loanId: raw.loanId || null,
          monthlyIncome: raw.monthlyIncome || 0,
          financialObligations: raw.financialObligations || 0,
          familyMembers: raw.familyMembers || 0,
          currentInstallment: raw.currentInstallment || 0,
          arrearsAmount: raw.arrearsAmount || 0,
          unpaidInstallments: raw.unpaidInstallments || 0,
          remainingBalance: raw.remainingLoanBalance || 0,
          remainingRepaymentMonths: raw.remainingRepaymentMonths || 0,
          activeRequest: !!raw.activeRequest,
          paymentHistory: raw.paymentHistory || "Custom Case",
          supportingCircumstance: raw.supportingCircumstance || null,
          recommendation: raw.recommendation || "Recommended for Approval",
          routingPath: raw.routingPath || "Fast Track",
          nextOwner: raw.nextOwner || "Officer Confirmation",
          priority: raw.priority || "Low",
          confidence: raw.confidenceScore || 90,
          reasonCodes: [],
          nextBestAction: raw.nextBestAction || null,
          status: raw.status || "Recommended for Approval",
          averageSalaryTransfer6Months: raw.averageSalaryTransfer6Months || raw.monthlyIncome || 0,
        };
      }
    } catch (e) {
      console.warn("Failed to check localStorage for case", e);
    }
  }

  // B. Check Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("case_code", caseCode)
        .maybeSingle();

      if (error) {
        console.error("Supabase getCaseByCode error:", error);
      } else if (data) {
        return mapRowToCase(data);
      }
    } catch (e) {
      console.error("Supabase connection failed:", e);
    }
  }

  // C. Check Demo cases
  const demo = DEMO_CASES.find(c => c.caseCode === caseCode);
  if (demo) {
    return demo;
  }

  return null;
}

// 4. Save Custom Case
export async function saveCustomCase(caseData: any): Promise<boolean> {
  const caseId = caseData.caseId || caseData.caseCode || ("CUSTOM-" + Math.floor(100000 + Math.random() * 900000).toString());
  
  // Save to localStorage immediately
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`customCase_${caseId}`, JSON.stringify(caseData));
    } catch (e) {
      console.warn("Failed to save case to localStorage", e);
    }
  }

  // Save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const sakanCase: SakanCase = {
        caseCode: caseId,
        source: "custom",
        beneficiaryName: caseData.beneficiaryName || "Custom Case",
        emiratesId: caseData.emiratesId || "784-1999-0000000-0",
        beneficiaryId: caseData.beneficiaryId || "BEN-784-CUS",
        loanId: caseData.loanId || "LOAN-CUS-001",
        monthlyIncome: caseData.monthlyIncome || 0,
        financialObligations: caseData.financialObligations || 0,
        familyMembers: caseData.familyMembers || 0,
        currentInstallment: caseData.currentInstallment || 0,
        arrearsAmount: caseData.arrearsAmount || 0,
        unpaidInstallments: caseData.unpaidInstallments || 0,
        remainingBalance: caseData.remainingLoanBalance || 0,
        remainingRepaymentMonths: caseData.remainingRepaymentMonths || 0,
        activeRequest: !!caseData.activeRequest,
        paymentHistory: caseData.paymentHistory || "Custom Simulator",
        supportingCircumstance: caseData.supportingCircumstance || null,
        recommendation: caseData.recommendation || "Recommended for Approval",
        routingPath: caseData.routingPath || "Fast Track",
        nextOwner: caseData.nextOwner || "Officer Confirmation",
        priority: caseData.priority || "Low",
        confidence: caseData.confidenceScore || 90,
        reasonCodes: caseData.reasonCodes || [],
        nextBestAction: caseData.nextBestAction || null,
        status: caseData.status || "Recommended for Approval",
        averageSalaryTransfer6Months: caseData.averageSalaryTransfer6Months || caseData.monthlyIncome || 0,
      };

      const dbRow = mapCaseToRow(sakanCase);
      const { error } = await supabase
        .from("cases")
        .upsert(dbRow, { onConflict: "case_code" });

      if (error) {
        console.error("Supabase saveCustomCase error:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Supabase upsert failed:", e);
      return false;
    }
  }

  return true;
}

// 5. Save Recommendation
export async function saveRecommendation(caseCode: string, recommendation: any): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("recommendations")
        .insert({
          case_code: caseCode,
          recommendation: recommendation.recommendation,
          routing_path: recommendation.routingPath,
          next_owner: recommendation.nextOwner,
          priority: recommendation.priority,
          confidence: recommendation.confidenceScore || recommendation.confidence,
          reason_codes: recommendation.reasonCodes || [],
          decision_trace: recommendation.decisionTrace || [],
          smart_message_ar: recommendation.smartMessageAr || recommendation.ar || null,
          smart_message_en: recommendation.smartMessageEn || recommendation.en || null,
        });

      if (error) {
        console.warn("Supabase saveRecommendation error:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("Supabase saveRecommendation failed:", e);
      return false;
    }
  }
  return false;
}

// 6. Add Agent Trace
export async function addAgentTrace(caseCode: string, trace: Omit<AgentTrace, "caseCode">): Promise<boolean> {
  // If Supabase is configured, save to Supabase agent_traces
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("agent_traces")
        .insert({
          case_code: caseCode,
          actor: trace.actor,
          action: trace.action,
          source: trace.source,
          status: trace.status,
          details: trace.details || {},
        });

      if (error) {
        console.error("Supabase addAgentTrace error:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Supabase addAgentTrace failed:", e);
      return false;
    }
  }
  return false;
}

// 7. Get Agent Traces
export async function getAgentTraces(caseCode: string): Promise<AgentTrace[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("agent_traces")
        .select("*")
        .eq("case_code", caseCode)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase getAgentTraces error:", error);
      } else if (data) {
        return data.map((row: any) => ({
          id: row.id,
          caseCode: row.case_code,
          actor: row.actor,
          action: row.action,
          source: row.source,
          status: row.status,
          details: row.details,
          createdAt: row.created_at,
        }));
      }
    } catch (e) {
      console.error("Supabase getAgentTraces failed:", e);
    }
  }
  return [];
}
