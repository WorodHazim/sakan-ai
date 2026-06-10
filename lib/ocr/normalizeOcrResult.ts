import { CaseData } from "../types";

export interface NormalizedOcrResult {
  documentType: "salary_certificate" | "unknown";
  employeeName: string | null;
  employer: string | null;
  monthlySalary: number | null;
  issueDate: string | null;
  isIssueDateValid: boolean | null;
  hasSignature: boolean | null;
  hasStamp: boolean | null;
  confidence: number;
  extractedTextSummary: string;
  warnings: string[];
  geminiModelUsed?: string | null;
  debug?: any;
}

export function normalizeSalaryCertificateOcr(
  rawOcrResult: any,
  caseData: CaseData | any
): NormalizedOcrResult {
  if (!rawOcrResult) {
    // Default safe empty object
    return {
      documentType: "unknown",
      employeeName: null,
      employer: null,
      monthlySalary: null,
      issueDate: null,
      isIssueDateValid: null,
      hasSignature: null,
      hasStamp: null,
      confidence: 70,
      extractedTextSummary: "",
      warnings: []
    };
  }

  // 1. Normalize Confidence
  let confidenceVal = 70;
  const rawConfidence = rawOcrResult.confidence;
  if (rawConfidence !== undefined && rawConfidence !== null) {
    if (typeof rawConfidence === "number") {
      if (rawConfidence <= 1) {
        confidenceVal = Math.round(rawConfidence * 100);
      } else if (rawConfidence <= 100) {
        confidenceVal = Math.round(rawConfidence);
      }
    } else if (typeof rawConfidence === "string") {
      const cleaned = rawConfidence.replace(/%/g, "").trim();
      const parsed = Number(cleaned);
      if (!isNaN(parsed)) {
        if (parsed <= 1) {
          confidenceVal = Math.round(parsed * 100);
        } else if (parsed <= 100) {
          confidenceVal = Math.round(parsed);
        }
      }
    }
  }

  // 2. Normalize monthlySalary
  let monthlySalaryVal: number | null = null;
  const rawSalary = rawOcrResult.monthlySalary;
  if (rawSalary !== undefined && rawSalary !== null) {
    if (typeof rawSalary === "number") {
      monthlySalaryVal = rawSalary;
    } else if (typeof rawSalary === "string") {
      const cleaned = rawSalary.replace(/[^0-9\.]/g, "").trim();
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed) && parsed > 0) {
        monthlySalaryVal = parsed;
      }
    }
  }

  // 3. Normalize Issue Date & Calculate Validity
  let issueDateVal: string | null = null;
  const rawDate = rawOcrResult.issueDate;
  if (rawDate) {
    // Attempt parsing
    let parsedDate: Date | null = null;
    const dateStr = String(rawDate).trim();
    
    // Check various formats
    if (/^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(dateStr)) {
      // YYYY-MM-DD or YYYY/MM/DD
      parsedDate = new Date(dateStr.replace(/\//g, "-"));
    } else if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(dateStr)) {
      // DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
      const delimiter = dateStr.includes("/") ? "/" : "-";
      const parts = dateStr.split(delimiter);
      parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      // Let standard Date parser try (handles e.g. "27 Nov 2023", "27-Nov-2023", etc.)
      const attempt = new Date(dateStr);
      if (!isNaN(attempt.getTime())) {
        parsedDate = attempt;
      }
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const day = String(parsedDate.getDate()).padStart(2, "0");
      issueDateVal = `${year}-${month}-${day}`;
    } else {
      issueDateVal = dateStr; // Fallback to raw string if completely unparseable
    }
  }

  // Calculate validity: older than 30 days is Expired
  let isIssueDateValidVal: boolean | null = null;
  const warnings: string[] = [];

  if (issueDateVal) {
    const parsed = new Date(issueDateVal);
    if (!isNaN(parsed.getTime())) {
      const today = new Date();
      // Reset times to compare dates only
      today.setHours(0, 0, 0, 0);
      parsed.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - parsed.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays > 30) {
        isIssueDateValidVal = false;
        warnings.push("Salary certificate is older than 30 days.");
      } else if (diffDays < -1) {
        // Future date? Allow but flag or mark invalid
        isIssueDateValidVal = false;
        warnings.push("Salary certificate issue date is in the future.");
      } else {
        isIssueDateValidVal = true;
      }
    } else {
      isIssueDateValidVal = null;
      warnings.push("Issue date could not be verified.");
    }
  } else {
    isIssueDateValidVal = null;
    warnings.push("Issue date could not be verified.");
  }

  // 4. Incorporate existing warnings if any
  if (rawOcrResult.warnings && Array.isArray(rawOcrResult.warnings)) {
    rawOcrResult.warnings.forEach((w: string) => {
      if (!warnings.includes(w) && w) warnings.push(w);
    });
  }

  return {
    documentType: rawOcrResult.documentType === "salary_certificate" ? "salary_certificate" : "unknown",
    employeeName: rawOcrResult.employeeName || null,
    employer: rawOcrResult.employer || null,
    monthlySalary: monthlySalaryVal,
    issueDate: issueDateVal,
    isIssueDateValid: isIssueDateValidVal,
    hasSignature: rawOcrResult.hasSignature !== undefined ? Boolean(rawOcrResult.hasSignature) : null,
    hasStamp: rawOcrResult.hasStamp !== undefined ? Boolean(rawOcrResult.hasStamp) : null,
    confidence: confidenceVal,
    extractedTextSummary: rawOcrResult.extractedTextSummary || "",
    warnings,
    geminiModelUsed: rawOcrResult.geminiModelUsed || null,
    debug: rawOcrResult.debug || null
  };
}
