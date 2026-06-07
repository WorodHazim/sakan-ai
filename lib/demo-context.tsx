"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type CaseId = "CASE-A" | "CASE-B" | "CASE-C";

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
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [selectedCaseId, setSelectedCaseId] = useState<CaseId>("CASE-A");
  const [language, setLanguage] = useState<"EN" | "AR">("EN");
  const [caseNotes, setCaseNotes] = useState<Record<string, string>>({
    "CASE-A": "Fast-track recommendation is ready for officer confirmation.",
    "CASE-B": "Awaiting updated salary certificate and bank statement clarification.",
    "CASE-C": "Case escalated due to active request and high financial stress. Review repayment history and supporting documents before final decision.",
  });
  const [customAuditLogs, setCustomAuditLogs] = useState<Record<string, any[]>>({
    "CASE-A": [],
    "CASE-B": [],
    "CASE-C": [],
  });
  const [caseStatuses, setCaseStatuses] = useState<Record<string, string>>({
    "CASE-A": "",
    "CASE-B": "",
    "CASE-C": "",
  });

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
