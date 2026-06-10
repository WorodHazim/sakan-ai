"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { MOCK_CASES } from "@/lib/mock-data";

const ACTIVE_CASE_KEY = "activeCaseCode";

type CaseId = "CASE-A" | "CASE-B" | "CASE-C" | "CASE-D" | "CASE-E" | string;

interface DemoContextType {
  selectedCaseId: CaseId;
  setSelectedCaseId: (id: CaseId) => void;
  language: "EN" | "AR";
  setLanguage: (lang: "EN" | "AR") => void;
  caseNotes: Record<string, string>;
  saveCaseNote: (caseId: string, note: string) => void;
  customAuditLogs: Record<string, any[]>;
  addAuditLog: (caseId: string, event: any) => void;
  caseStatuses: Record<string, string>;
  updateCaseStatus: (caseId: string, status: string) => void;
  identityVerified: boolean;
  setIdentityVerified: (verified: boolean) => void;
  identitySource: string;
  setIdentitySource: (source: string) => void;
  uaePassProfile: any;
  setUaePassProfile: (profile: any) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

/**
 * Read the persisted activeCaseCode from localStorage.
 * Returns "CASE-A" if nothing is stored or on SSR.
 */
function getInitialCaseId(): CaseId {
  if (typeof window === "undefined") return "CASE-A";
  try {
    const stored = localStorage.getItem(ACTIVE_CASE_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch { /* ignore */ }
  return "CASE-A";
}

/**
 * If the persisted case is a CUSTOM-* case, restore its data
 * into the in-memory MOCK_CASES map so pages that read from
 * MOCK_CASES[selectedCaseId] find it immediately.
 */
function restoreCustomCaseIntoMockData(caseId: string): void {
  if (typeof window === "undefined") return;
  if (!caseId.startsWith("CUSTOM")) return;
  // Already in MOCK_CASES (e.g. session hasn't reloaded)
  if (MOCK_CASES[caseId]) return;
  try {
    const raw = localStorage.getItem(`customCase_${caseId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      MOCK_CASES[caseId] = {
        caseId: parsed.caseId || caseId,
        beneficiaryName: parsed.beneficiaryName || "Custom Case",
        beneficiaryId: parsed.beneficiaryId || "BEN-784-CUS",
        emiratesId: parsed.emiratesId || "784-1999-0000000-0",
        loanId: parsed.loanId || "LOAN-CUS-001",
        monthlyIncome: parsed.monthlyIncome || 0,
        financialObligations: parsed.financialObligations || 0,
        familyMembers: parsed.familyMembers || 1,
        originalLoanAmount: parsed.originalLoanAmount || 0,
        remainingLoanBalance: parsed.remainingLoanBalance || 0,
        arrearsAmount: parsed.arrearsAmount || 0,
        unpaidInstallments: parsed.unpaidInstallments || 0,
        currentInstallment: parsed.currentInstallment || 0,
        remainingRepaymentMonths: parsed.remainingRepaymentMonths || 0,
        paymentHistory: parsed.paymentHistory || "Custom Simulator",
        activeRequest: !!parsed.activeRequest,
        salaryCertificateAmount: parsed.salaryCertificateAmount || parsed.monthlyIncome || 0,
        salaryCertificateExpired: !!parsed.salaryCertificateExpired,
        documentConfidence: parsed.documentConfidence || 90,
        hasCompanyLetterhead: parsed.hasCompanyLetterhead ?? true,
        hasAuthorizedSignature: parsed.hasAuthorizedSignature ?? true,
        employeeDetailsMatch: parsed.employeeDetailsMatch ?? true,
        averageSalaryTransfer6Months: parsed.averageSalaryTransfer6Months || parsed.monthlyIncome || 0,
        hasMedicalDocument: !!parsed.hasMedicalDocument,
        supportingCircumstance: parsed.supportingCircumstance,
      } as any;
    }
  } catch {
    /* ignore parse errors */
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  // Initialize with default case to avoid SSR/client mismatch
  const [selectedCaseId, setSelectedCaseIdRaw] = useState<CaseId>("CASE-A");

  // Wrapped setter that also writes to localStorage
  const setSelectedCaseId = useCallback((id: CaseId) => {
    setSelectedCaseIdRaw(id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ACTIVE_CASE_KEY, id);
      } catch { /* ignore */ }
    }
    // Ensure custom case data is in MOCK_CASES
    restoreCustomCaseIntoMockData(id);
  }, []);

  // On client mount, load persisted case if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACTIVE_CASE_KEY);
      if (stored && stored !== selectedCaseId) {
        setSelectedCaseIdRaw(stored as CaseId);
        restoreCustomCaseIntoMockData(stored);
      } else {
        // Ensure a value is stored for future loads
        localStorage.setItem(ACTIVE_CASE_KEY, selectedCaseId);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [language, setLanguage] = useState<"EN" | "AR">("EN");
  const [caseNotes, setCaseNotes] = useState<Record<string, string>>({
    "CASE-A": "Fast-track recommendation is ready for officer confirmation.",
    "CASE-B": "Awaiting updated salary certificate and bank statement clarification.",
    "CASE-C": "Case escalated due to active request and high financial stress. Review repayment history and supporting documents before final decision.",
    "CASE-D": "SAKAN AI detects that the beneficiary already has an active rescheduling request, so it prevents a duplicate officer workload item and returns a direct beneficiary outcome.",
    "CASE-E": "Humanitarian review recommended due to income loss / unemployment.",
  });
  const [customAuditLogs, setCustomAuditLogs] = useState<Record<string, any[]>>({
    "CASE-A": [],
    "CASE-B": [],
    "CASE-C": [],
    "CASE-D": [],
    "CASE-E": [],
  });
  const [caseStatuses, setCaseStatuses] = useState<Record<string, string>>({
    "CASE-A": "",
    "CASE-B": "",
    "CASE-C": "",
    "CASE-D": "",
    "CASE-E": "",
  });

  // UAE PASS identity state
  const [identityVerified, setIdentityVerified] = useState<boolean>(false);
  const [identitySource, setIdentitySource] = useState<string>("");
  const [uaePassProfile, setUaePassProfile] = useState<any>(null);

  const saveCaseNote = (caseId: string, note: string) => {
    setCaseNotes(prev => ({ ...prev, [caseId]: note }));
  };

  const addAuditLog = (caseId: string, event: any) => {
    setCustomAuditLogs(prev => ({
      ...prev,
      [caseId]: [...(prev[caseId] || []), event]
    }));
  };

  const updateCaseStatus = (caseId: string, status: string) => {
    setCaseStatuses(prev => ({ ...prev, [caseId]: status }));
  };

  return (
    <DemoContext.Provider
      value={{
        selectedCaseId,
        setSelectedCaseId,
        language,
        setLanguage,
        caseNotes,
        saveCaseNote,
        customAuditLogs,
        addAuditLog,
        caseStatuses,
        updateCaseStatus,
        identityVerified,
        setIdentityVerified,
        identitySource,
        setIdentitySource,
        uaePassProfile,
        setUaePassProfile,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
