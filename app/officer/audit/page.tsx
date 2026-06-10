"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { MOCK_CASES } from "@/lib/mock-data";
import { runDecisionAgent } from "@/lib/agent-rules";
import { useDemo } from "@/lib/demo-context";
import {
  AUDIT_FILTER_TABS,
  AuditFilterCategory,
  NO_AUTO_APPROVAL_NOTICE,
  buildAuditSummaryText,
  buildGovernanceAuditTrail,
  filterAuditEvents,
  getOcrDataSourceLabel,
  mergeWithOfficerLogs,
} from "@/lib/governanceAudit";
import {
  ArrowLeft,
  History,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Languages,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AuditTrailPage() {
  const { selectedCaseId, customAuditLogs, language, setLanguage } = useDemo();
  const isAr = language === "AR";
  const [auditFilter, setAuditFilter] = useState<AuditFilterCategory>("All");
  const [copyToast, setCopyToast] = useState(false);

  const caseData = MOCK_CASES[selectedCaseId];
  const report = caseData ? runDecisionAgent(caseData) : null;

  const ocrSource = getOcrDataSourceLabel(
    selectedCaseId,
    typeof window !== "undefined" && !!localStorage.getItem(`docOcr_${selectedCaseId}`)
  );

  const governanceTrail = useMemo(() => {
    if (!report) return [];
    return mergeWithOfficerLogs(
      buildGovernanceAuditTrail(report, ocrSource),
      customAuditLogs[selectedCaseId] || []
    );
  }, [report, ocrSource, customAuditLogs, selectedCaseId]);

  const filteredTrail = useMemo(
    () => filterAuditEvents(governanceTrail, auditFilter),
    [governanceTrail, auditFilter]
  );

  const handleCopySummary = () => {
    if (!report) return;
    const text = buildAuditSummaryText(selectedCaseId, report, report.recommendation.status);
    navigator.clipboard.writeText(text).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 3000);
    });
  };

  if (!report) {
    return (
      <div className="min-h-screen bg-sakan-bg flex items-center justify-center">
        <p className="text-sakan-navy font-semibold">{isAr ? "لا توجد بيانات تدقيق" : "No audit data available"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sakan-bg p-4 md:p-8 lg:p-12 pb-24" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-sakan-border">
          <div className="flex items-center gap-4">
            <div className="bg-sakan-bg p-3 rounded-2xl border border-sakan-border">
              <History className="w-8 h-8 text-sakan-navy" />
            </div>
            <div>
              <Link href="/officer/workspace" className="text-sm font-medium text-sakan-text/50 hover:text-sakan-navy transition-colors mb-1 inline-flex items-center gap-1">
                <ArrowLeft className={`w-3 h-3 ${isAr ? "rotate-180" : ""}`} /> {isAr ? "مساحة العمل" : "Workspace"}
              </Link>
              <h1 className="text-2xl font-bold text-sakan-navy">{isAr ? "سجل التدقيق" : "System Audit Trail"}</h1>
              <p className="text-xs text-sakan-text/50 mt-1 font-mono" dir="ltr">{selectedCaseId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 bg-sakan-navy text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-sakan-navy/90"
            >
              <Copy className="w-3.5 h-3.5" />
              {isAr ? "نسخ ملخص التدقيق" : "Copy Audit Summary"}
            </button>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-sakan-border shadow-sm">
              <Languages className="w-3.5 h-3.5 text-sakan-text/40" />
              <button onClick={() => setLanguage("EN")} className={`px-2 py-0.5 text-xs font-bold rounded ${language === "EN" ? "bg-sakan-navy text-white" : "text-sakan-navy"}`}>EN</button>
              <button onClick={() => setLanguage("AR")} className={`px-2 py-0.5 text-xs font-bold rounded ${language === "AR" ? "bg-sakan-navy text-white" : "text-sakan-navy"}`}>AR</button>
            </div>
          </div>
        </header>

        {copyToast && (
          <div className="text-sm font-bold text-sakan-success bg-white border border-sakan-success/20 rounded-xl px-4 py-2">
            {isAr ? "تم نسخ ملخص التدقيق" : "Audit summary copied"}
          </div>
        )}

        <section className="bg-sakan-gold/5 rounded-2xl p-4 border border-sakan-gold/30">
          <p className="text-xs text-sakan-navy font-semibold leading-relaxed">
            {isAr ? NO_AUTO_APPROVAL_NOTICE.ar : NO_AUTO_APPROVAL_NOTICE.en}
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          {AUDIT_FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setAuditFilter(tab)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                auditFilter === tab ? "bg-sakan-navy text-white border-sakan-navy" : "bg-white text-sakan-navy border-sakan-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-sakan-border p-6 md:p-8">
          <div className="relative border-l-2 border-sakan-border ml-3 space-y-6 pb-4">
            {[...filteredTrail].reverse().map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative pl-8"
              >
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                  event.result === "Success" ? "bg-sakan-success" :
                  event.result === "Warning" ? "bg-sakan-warning" : "bg-sakan-danger"
                }`} />
                <div className="bg-sakan-bg/50 border border-sakan-border rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sakan-navy text-sm">{event.action}</div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      event.result === "Success" ? "bg-sakan-success/10 text-sakan-success" :
                      event.result === "Warning" ? "bg-sakan-warning/10 text-sakan-warning" :
                      "bg-sakan-danger/10 text-sakan-danger"
                    }`}>
                      {event.result}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sakan-text/70">
                    <div><span className="font-bold text-sakan-navy">{isAr ? "الوكيل:" : "Agent:"}</span> {event.agentName}</div>
                    <div dir="ltr"><span className="font-bold text-sakan-navy">{isAr ? "الوقت:" : "Timestamp:"}</span> {new Date(event.timestamp).toLocaleString(isAr ? "ar-AE" : "en-US")}</div>
                    <div className="sm:col-span-2"><span className="font-bold text-sakan-navy">{isAr ? "المصدر:" : "Input/Data Source:"}</span> {event.inputSource}</div>
                    <div><span className="font-bold text-sakan-navy">{isAr ? "رمز السبب:" : "Reason Code:"}</span> <span className="font-mono">{event.reasonCode}</span></div>
                    <div><span className="font-bold text-sakan-navy">{isAr ? "التصنيف:" : "Category:"}</span> {event.category}</div>
                    <div className="sm:col-span-2"><span className="font-bold text-sakan-navy">{isAr ? "قاعدة الحوكمة:" : "Governance Rule:"}</span> {event.governanceRule}</div>
                    <div className="sm:col-span-2"><span className="font-bold text-sakan-navy">{isAr ? "أثر المسار:" : "Route Impact:"}</span> {event.routeImpact}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
