import { supabase, isSupabaseConfigured } from "../supabase/client";
import { SakanCase } from "../types/sakan";

export interface HistoricalMatch {
  id: string;
  sourceRowIndex: number;
  loanId: string | null;
  beneficiaryId: string | null;
  requestType: string | null;
  arrearsAmount: number | null;
  currentInstallment: number | null;
  unpaidInstallments: number | null;
  approvalStatus: string | null;
  remarks: string | null;
  month: number | null;
  year: number | null;
  score: number;
  matchedFields: string[];
}

export interface HistoricalInsights {
  totalSimilarApprovedCases: number;
  averageArrearsAmount: number;
  medianArrearsAmount: number;
  averageCurrentInstallment: number;
  averageUnpaidInstallments: number;
  mostCommonRequestType: string;
  mostCommonRemarkPattern: string;
  similarityConfidence: number;
  approvedPrecedentSupport: 'Strong' | 'Moderate' | 'Weak';
  approvedPrecedentSupportAr: string;
  matches: HistoricalMatch[];
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[half];
  }
  return (sorted[half - 1] + sorted[half]) / 2.0;
}

export async function getApprovedHistoricalPrecedents(currentCase: SakanCase): Promise<HistoricalInsights> {
  const emptyResult: HistoricalInsights = {
    totalSimilarApprovedCases: 0,
    averageArrearsAmount: 0,
    medianArrearsAmount: 0,
    averageCurrentInstallment: 0,
    averageUnpaidInstallments: 0,
    mostCommonRequestType: "-",
    mostCommonRemarkPattern: "-",
    similarityConfidence: 0,
    approvedPrecedentSupport: 'Weak',
    approvedPrecedentSupportAr: 'ضعيف',
    matches: []
  };

  if (!isSupabaseConfigured || !supabase) {
    return emptyResult;
  }

  try {
    // Retrieve historical cases
    const { data: records, error } = await supabase
      .from("historical_cases")
      .select("*")
      .limit(1000); // Retrieve up to 1000 records for scoring

    if (error || !records || records.length === 0) {
      return emptyResult;
    }

    const matches: HistoricalMatch[] = [];

    for (const record of records) {
      let score = 0;
      const matchedFields: string[] = [];

      // 1. Same request type (all SAKAN cases are housing arrears rescheduling)
      const hReq = record.request_type ? record.request_type.toLowerCase() : "";
      if (hReq.includes("reschedule") || hReq.includes("arrear") || hReq.includes("installment") || hReq.includes("تأجيل") || hReq.includes("جدولة")) {
        score += 30;
        matchedFields.push("Request Type");
      }

      // 2. Arrears amount within 20% range
      if (currentCase.arrearsAmount !== null && record.arrears_amount !== null) {
        const arrearsDiff = Math.abs(Number(record.arrears_amount) - currentCase.arrearsAmount);
        const percentDiff = arrearsDiff / currentCase.arrearsAmount;
        if (percentDiff <= 0.20) {
          score += 20;
          matchedFields.push("Arrears Amount (±20%)");
        }
      }

      // 3. Current installment within 20% range
      if (currentCase.currentInstallment !== null && record.current_installment !== null) {
        const installmentDiff = Math.abs(Number(record.current_installment) - currentCase.currentInstallment);
        const percentDiff = installmentDiff / currentCase.currentInstallment;
        if (percentDiff <= 0.20) {
          score += 15;
          matchedFields.push("Current Installment (±20%)");
        }
      }

      // 4. Unpaid installments close range (±2 months)
      if (currentCase.unpaidInstallments !== null && record.unpaid_installments !== null) {
        const installmentsDiff = Math.abs(record.unpaid_installments - currentCase.unpaidInstallments);
        if (installmentsDiff <= 2) {
          score += 15;
          matchedFields.push("Unpaid Installments (±2)");
        }
      }

      // 5. Approval status contains APPROVED or APPROVE
      const status = record.approval_status ? record.approval_status.toUpperCase() : "";
      if (status.includes("APPROV") || status.includes("موافق") || status.includes("اعتمد")) {
        score += 10;
        matchedFields.push("Approved Precedent");
      }

      // 6. Remarks keyword match
      let keywordMatch = false;
      if (currentCase.supportingCircumstance && record.remarks) {
        const circ = currentCase.supportingCircumstance.toLowerCase();
        const rem = record.remarks.toLowerCase();
        const keywords = ['medical', 'health', 'unemploy', 'job', 'loss', 'hardship', 'family', 'income', 'مرض', 'علاج', 'عمل', 'وظيفة', 'بطالة', 'دخل', 'ظرف', 'صحي'];
        for (const kw of keywords) {
          if (circ.includes(kw) && rem.includes(kw)) {
            keywordMatch = true;
            break;
          }
        }
      }
      if (keywordMatch) {
        score += 10;
        matchedFields.push("Supporting Circumstance Keyword");
      }

      // Only count if it passes a threshold score (e.g. at least matches request type plus some amount/installments range)
      if (score >= 45) {
        matches.push({
          id: record.id,
          sourceRowIndex: record.source_row_index,
          loanId: record.loan_id,
          beneficiaryId: record.beneficiary_id,
          requestType: record.request_type,
          arrearsAmount: record.arrears_amount ? Number(record.arrears_amount) : null,
          currentInstallment: record.current_installment ? Number(record.current_installment) : null,
          unpaidInstallments: record.unpaid_installments,
          approvalStatus: record.approval_status,
          remarks: record.remarks,
          month: record.month,
          year: record.year,
          score,
          matchedFields
        });
      }
    }

    // Sort descending by similarity score
    matches.sort((a, b) => b.score - a.score);

    // Take top 20 matches for benchmark calculations
    const topMatches = matches.slice(0, 20);

    if (topMatches.length === 0) {
      return emptyResult;
    }

    // Calculate benchmarks
    const totalSimilarApproved = matches.length;
    const arrearsList = topMatches.map(m => m.arrearsAmount).filter((v): v is number => v !== null);
    const installmentList = topMatches.map(m => m.currentInstallment).filter((v): v is number => v !== null);
    const unpaidList = topMatches.map(m => m.unpaidInstallments).filter((v): v is number => v !== null);

    const averageArrears = arrearsList.length > 0 ? arrearsList.reduce((a, b) => a + b, 0) / arrearsList.length : 0;
    const medianArrears = arrearsList.length > 0 ? calculateMedian(arrearsList) : 0;
    const averageInstallment = installmentList.length > 0 ? installmentList.reduce((a, b) => a + b, 0) / installmentList.length : 0;
    const averageUnpaid = unpaidList.length > 0 ? unpaidList.reduce((a, b) => a + b, 0) / unpaidList.length : 0;

    // Get most common request type
    const requestTypesCount: Record<string, number> = {};
    topMatches.forEach(m => {
      if (m.requestType) {
        requestTypesCount[m.requestType] = (requestTypesCount[m.requestType] || 0) + 1;
      }
    });
    let mostCommonRequestType = "-";
    let maxRequestCount = 0;
    Object.keys(requestTypesCount).forEach(k => {
      if (requestTypesCount[k] > maxRequestCount) {
        mostCommonRequestType = k;
        maxRequestCount = requestTypesCount[k];
      }
    });

    // Get most common remarks patterns
    const remarksCount: Record<string, number> = {};
    topMatches.forEach(m => {
      if (m.remarks) {
        const cleanRem = m.remarks.trim();
        remarksCount[cleanRem] = (remarksCount[cleanRem] || 0) + 1;
      }
    });
    let mostCommonRemarkPattern = "-";
    let maxRemarkCount = 0;
    Object.keys(remarksCount).forEach(k => {
      if (remarksCount[k] > maxRemarkCount) {
        mostCommonRemarkPattern = k;
        maxRemarkCount = remarksCount[k];
      }
    });

    // Determine Precedent Support Strength
    let approvedPrecedentSupport: 'Strong' | 'Moderate' | 'Weak' = 'Weak';
    let approvedPrecedentSupportAr = 'ضعيف';
    let similarityConfidence = 30;

    const topScore = topMatches[0]?.score || 0;
    if (totalSimilarApproved >= 8 && topScore >= 75) {
      approvedPrecedentSupport = 'Strong';
      approvedPrecedentSupportAr = 'قوي';
      similarityConfidence = Math.min(topScore + 10, 98);
    } else if (totalSimilarApproved >= 3 && topScore >= 60) {
      approvedPrecedentSupport = 'Moderate';
      approvedPrecedentSupportAr = 'متوسط';
      similarityConfidence = Math.min(topScore, 80);
    } else {
      approvedPrecedentSupport = 'Weak';
      approvedPrecedentSupportAr = 'ضعيف';
      similarityConfidence = Math.max(topScore - 10, 20);
    }

    return {
      totalSimilarApprovedCases: totalSimilarApproved,
      averageArrearsAmount: Math.round(averageArrears),
      medianArrearsAmount: Math.round(medianArrears),
      averageCurrentInstallment: Math.round(averageInstallment),
      averageUnpaidInstallments: Number(averageUnpaid.toFixed(1)),
      mostCommonRequestType,
      mostCommonRemarkPattern,
      similarityConfidence,
      approvedPrecedentSupport,
      approvedPrecedentSupportAr,
      matches: topMatches
    };
  } catch (e) {
    console.error("Error calculating approved historical precedents", e);
    return emptyResult;
  }
}
