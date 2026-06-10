"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MOCK_CASES } from "@/lib/mock-data";
import { runDecisionAgent } from "@/lib/agent-rules";
import { hasHumanitarianCircumstance } from "@/lib/utils";
import { getKeyDecisionFactors } from "@/lib/getKeyDecisionFactors";
import { NO_AUTO_APPROVAL_NOTICE } from "@/lib/governanceAudit";
import { saveWorkspaceCase } from "@/lib/workspace-storage";
import { useDemo } from "@/lib/demo-context";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  FileText,
  HelpCircle,
  Info,
  Languages,
  Loader2,
  Mail,
  ShieldAlert,
  Smartphone,
  Upload,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const T = {
  EN: {
    title: "Application Outcome",
    subtitle: "Not Eligible Under Current Rules",
    statusLabel: "Status:",
    reasonsTitle: "Policy Requirements Not Met",
    nextStepsTitle: "What can you do next?",
    btnUploadEvidence: "Upload Supporting Evidence",
    btnReviewEligibility: "Review Eligibility Requirements",
    btnContactSupport: "Contact Support",
    btnBack: "Back to Application",
    ruleCap: "The proposed monthly deduction exceeds the allowed 20% cap.",
    rulePeriod: "The repayment period exceeds the remaining loan term.",
    ruleIncome: "The income per family member is below the required AED 3,000 threshold.",
    ruleObligations: "Financial obligations exceed the regulatory 60% threshold.",
    ruleActiveRequest: "An active duplicate request exists in the system.",
    ruleNoEvidence: "Hardship circumstance was claimed, but no supporting evidence was uploaded.",
    explanationTitle: "Explanation",
    btnGeneratePlain: "Generate Plain-Language Explanation",
    btnGenerating: "Generating...",
    badgeRules: "Rules-Based Explanation",
    badgeAi: "AI-Generated Explanation",
    eligibilityModalTitle: "Eligibility Requirements Policy Summary",
    rule1: "1. 20% Deduction Cap: Rescheduling payment must not exceed 20% of your monthly income.",
    rule2: "2. Loan Term: Repayment period cannot exceed the remaining term of your existing loan.",
    rule3: "3. Financial Obligations: Total obligations (existing liabilities + new payment) must be 60% or less of monthly income.",
    rule4: "4. Income Per Family Member: After basic deductions, income per family member must be at least AED 3,000.",
    rule5: "5. Active Requests: No other active rescheduling requests are allowed concurrently.",
    close: "Close",
    supportModalTitle: "Contact SAKAN Support",
    send: "Send Message",
    sending: "Sending...",
    msgPlaceholder: "Type your message here...",
    toastSupport: "Support message sent successfully!"
  },
  AR: {
    title: "نتيجة الطلب",
    subtitle: "غير مؤهل حسب القواعد الحالية",
    statusLabel: "الحالة:",
    reasonsTitle: "متطلبات السياسة غير المستوفاة",
    nextStepsTitle: "ماذا يمكنك أن تفعل بعد ذلك؟",
    btnUploadEvidence: "رفع المستندات الداعمة",
    btnReviewEligibility: "مراجعة شروط الأهلية",
    btnContactSupport: "التواصل مع الدعم الفني",
    btnBack: "العودة للطلب",
    ruleCap: "مبلغ الاستقطاع المقترح يتجاوز الحد المسموح وهو 20٪.",
    rulePeriod: "مدة السداد تتجاوز المدة المتبقية للقرض.",
    ruleIncome: "الدخل لكل فرد من العائلة أقل من الحد المطلوب (3,000 درهم).",
    ruleObligations: "الالتزامات المالية تتجاوز الحد الأقصى المسموح به وهو 60٪.",
    ruleActiveRequest: "يوجد طلب نشط آخر قيد المعالجة في النظام.",
    ruleNoEvidence: "تم تحديد ظرف استثنائي ولكن لم يتم تحميل المستند الداعم المطلوب.",
    explanationTitle: "التفسير والتفاصيل",
    btnGeneratePlain: "تبسيط الشرح بالذكاء الاصطناعي",
    btnGenerating: "جاري التوليد...",
    badgeRules: "شرح مبني على القواعد",
    badgeAi: "شرح مولد بالذكاء الاصطناعي",
    eligibilityModalTitle: "ملخص شروط الأهلية والسياسات",
    rule1: "1. سقف الاستقطاع 20٪: يجب ألا يتجاوز قسط إعادة الجدولة 20٪ من دخلك الشهري.",
    rule2: "2. مدة القرض: لا يمكن أن تتجاوز فترة إعادة الجدولة المدة المتبقية لقرضك الحالي.",
    rule3: "3. الالتزامات المالية: يجب ألا تتجاوز الالتزامات الإجمالية 60٪ من الدخل الشهري.",
    rule4: "4. نصيب الفرد من الدخل: يجب ألا يقل نصيب الفرد من الأسرة عن 3,000 درهم بعد الاستقطاعات.",
    rule5: "5. الطلبات النشطة: لا يُسمح بوجود أكثر من طلب إعادة جدولة نشط واحد في نفس الوقت.",
    close: "إغلاق",
    supportModalTitle: "التواصل مع دعم سكن",
    send: "إرسال الرسالة",
    sending: "جاري الإرسال...",
    msgPlaceholder: "اكتب رسالتك هنا...",
    toastSupport: "تم إرسال رسالة الدعم بنجاح!"
  }
};

type LangKey = keyof typeof T;

function ApplyResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage } = useDemo();
  const lang = language as LangKey;
  const isAr = lang === "AR";
  const t = T[lang];

  const caseId = searchParams.get("caseId") || "CASE-D";

  // Load caseData
  const [caseData, setCaseData] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [isEligibilityOpen, setIsEligibilityOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMsg, setSupportMsg] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Explanation loading and caching
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    const rawDemo = MOCK_CASES[caseId];
    if (rawDemo) {
      setCaseData(rawDemo);
      setReport(runDecisionAgent(rawDemo));
    } else {
      const stored = localStorage.getItem(`customCase_${caseId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCaseData(parsed);
          const rpt = runDecisionAgent(parsed);
          setReport(rpt);
          
          saveWorkspaceCase({
            caseData: parsed,
            recommendation: rpt.recommendation,
            reasonCodes: rpt.reasonCodes,
            caseClassification: rpt.caseClassification,
            fullReport: rpt,
            createdAt: new Date().toISOString(),
            source: "CUSTOM",
          });
        } catch (e) {
          console.warn("Failed parsing custom case from local storage", e);
        }
      }
    }
  }, [caseId]);

  // Load cached AI explanation if available
  useEffect(() => {
    if (caseId) {
      const cached = localStorage.getItem(`beneficiaryAiExplanation_${caseId}`);
      if (cached) {
        setAiExplanation(cached);
      }
    }
  }, [caseId]);

  const handleGenerateAiExplanation = async () => {
    if (!report) return;
    setIsGeneratingAi(true);
    console.log("[AI Budget] Gemini explanation called by explicit user action");

    try {
      const response = await fetch("/api/ai/explain-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_code: caseId,
          recommendation: report.recommendation,
          routing_path: report.recommendation.resolutionPath,
          priority: report.recommendation.priority,
          failed_rules: report.policyRules?.failedRules || [],
          passed_rules: report.policyRules?.passedRules || [],
          document_validation: report.documentValidation,
          financial_analysis: report.financialCapacity,
          blocking_factors: [],
          next_best_action: ""
        })
      });

      if (!response.ok) throw new Error();
      const res = await response.json();
      if (res.success && res.data?.beneficiaryExplanation) {
        const text = isAr ? res.data.beneficiaryExplanation.ar : res.data.beneficiaryExplanation.en;
        setAiExplanation(text);
        localStorage.setItem(`beneficiaryAiExplanation_${caseId}`, text);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback
      const text = isAr 
        ? "بناءً على قواعد السياسة، لم يستوف طلبك شروط إعادة الجدولة المقررة لعدم وجود إثبات كاف للظرف الاستثنائي وتجاوز حدود الالتزامات المالية."
        : "Based on policy rules, your application does not meet the guidelines for loan rescheduling because no supporting evidence was provided for your hardship and financial capacity parameters exceed rules.";
      setAiExplanation(text);
      localStorage.setItem(`beneficiaryAiExplanation_${caseId}`, text);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendSupport = () => {
    setIsSendingSupport(true);
    setTimeout(() => {
      setIsSendingSupport(false);
      setIsSupportOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1200);
  };

  if (!caseData || !report) {
    return (
      <div className="min-h-screen bg-sakan-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sakan-gold" />
      </div>
    );
  }

  // Determine failed rules
  const failedRulesList = report.policyRules?.failedRules || [];
  
  const hasHumanitarian = hasHumanitarianCircumstance(caseData.supportingCircumstance);
  
  const hasHardshipNoEvidence = hasHumanitarian && !caseData.supportingEvidenceFile;
  const hasHardshipWithEvidence = hasHumanitarian && !!caseData.supportingEvidenceFile;
  
  const hasDocIssues = report.documentValidation && (report.documentValidation.warnings && report.documentValidation.warnings.length > 0);
  const isDuplicate = caseId === "CASE-D" || caseData.activeRequest;
  const isPolicyCapFail = failedRulesList.some((r: string) => r.toLowerCase().includes("deduction") || r.toLowerCase().includes("cap")) || 
    (caseData.currentInstallment > caseData.monthlyIncome * 0.2) || 
    failedRulesList.some((r: string) => r.toLowerCase().includes("period") || r.toLowerCase().includes("term")) ||
    caseData.planComplianceStatus?.includes("Not Allowed");

  const failedReasons: string[] = [];

  // Make reason selection priority explicit
  if (hasDocIssues) {
    if (report.documentValidation?.warnings && report.documentValidation.warnings.length > 0) {
      report.documentValidation.warnings.forEach((warning: string) => {
        failedReasons.push(isAr ? `مشكلة في المستند: ${warning}` : `Document issue: ${warning}`);
      });
    } else {
      failedReasons.push(isAr ? "مشاكل في المستندات تتطلب إجراء من المستفيد" : "Document issues require applicant action");
    }
  } else if (isDuplicate) {
    failedReasons.push(isAr ? "يوجد طلب نشط مسبقاً لهذا المستفيد" : "Existing active request found for this beneficiary");
  } else if (isPolicyCapFail) {
    let pushedPolicyReason = false;
    if (failedRulesList.some((r: string) => r.toLowerCase().includes("deduction") || r.toLowerCase().includes("cap")) || caseData.newTotalInstallment > (caseData.monthlyIncome * 0.2) || (caseData.planComplianceStatus?.includes("Not Allowed") && !caseData.planComplianceStatus?.includes("already exceeds"))) {
      failedReasons.push(isAr ? "خطة السداد المحددة تتجاوز سقف الاستقطاع البالغ 20%" : "Selected repayment plan exceeds the 20% deduction cap");
      pushedPolicyReason = true;
    }
    if (caseData.currentInstallment > (caseData.monthlyIncome * 0.2) || caseData.planComplianceStatus?.includes("already exceeds cap")) {
      failedReasons.push(isAr ? "القسط الحالي يتجاوز بالفعل السقف المسموح به (20%)" : "Current installment already exceeds the allowed 20% cap");
      pushedPolicyReason = true;
    }
    if (failedRulesList.some((r: string) => r.toLowerCase().includes("period") || r.toLowerCase().includes("term"))) {
      failedReasons.push(isAr ? "لا يمكن سداد المتأخرات خلال الفترة المتبقية من القرض" : "Arrears cannot be repaid within remaining loan term");
      pushedPolicyReason = true;
    }
    
    if (!pushedPolicyReason) {
      failedReasons.push(isAr ? "لم يتم استيفاء متطلبات السياسة" : "Policy requirements were not met");
    }
  } else if (hasHardshipNoEvidence) {
    failedReasons.push(isAr ? "لم يتم تقديم أي مستندات داعمة للظرف الإنساني المختار" : "No supporting humanitarian evidence was provided");
  } else if (hasHardshipWithEvidence) {
    failedReasons.push(isAr ? "الاستثناء المالي / السياسة يتطلب مراجعة بشرية للظرف الإنساني" : "Financial/policy exception requires human review of humanitarian circumstance");
  } else {
    // Safety fallback
    failedRulesList.forEach((rule: string) => {
      if (rule.includes("Obligations")) failedReasons.push(t.ruleObligations);
      else if (rule.includes("Minimum Income") || rule.includes("family")) failedReasons.push(t.ruleIncome);
      else failedReasons.push(rule);
    });
    if (failedReasons.length === 0) {
      failedReasons.push(isAr ? "لم يتم استيفاء متطلبات السياسة" : "Policy requirements were not met");
    }
  }

  const showRulesExplanation = isAr
    ? "طلبك غير مؤهل لإعادة الجدولة التلقائية بموجب شروط وضوابط السياسة الحالية."
    : "Your request is not eligible for automated rescheduling under the current housing loan policy criteria.";

  const keyDecisionFactors = getKeyDecisionFactors(report.recommendation?.status || "Direct Beneficiary Outcome / Not Eligible");

  return (
    <div className={`min-h-screen bg-sakan-bg p-4 md:p-8 flex items-center justify-center pb-24 ${isAr ? "font-arabic-premium" : ""}`} dir={isAr ? "rtl" : "ltr"}>
      {isAr && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
          .font-arabic-premium, .font-arabic-premium * {
            font-family: 'Tajawal', system-ui, sans-serif !important;
            line-height: 1.6;
          }
        `}} />
      )}

      {/* Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {t.toastSupport}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Toggle */}
      <div className={`absolute top-6 ${isAr ? 'left-6' : 'right-6'} flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-sakan-border shadow-sm z-30`}>
        <Languages className="w-3.5 h-3.5 text-sakan-text/40" />
        <button onClick={() => setLanguage("EN")} className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all ${lang === "EN" ? "bg-sakan-navy text-white" : "text-sakan-navy/70 hover:bg-sakan-bg"}`}>EN</button>
        <button onClick={() => setLanguage("AR")} className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all ${lang === "AR" ? "bg-sakan-navy text-white" : "text-sakan-navy/70 hover:bg-sakan-bg"}`}>AR</button>
      </div>

      <div className="max-w-3xl w-full space-y-6 mt-12">
        <div className="bg-white rounded-3xl p-8 border border-sakan-border shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-sakan-danger" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-sakan-danger mb-2">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-sakan-navy">{t.title}</h1>
            <p className="text-sakan-danger text-sm font-bold bg-red-50 border border-red-100 px-4 py-1.5 rounded-full inline-block">
              {t.subtitle}
            </p>
            {(!caseId.startsWith("CASE-") || caseId === "CASE-D") && (
              <div className="flex justify-center gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-red-50 text-sakan-danger border border-red-100 rounded-full">
                  {isAr ? "نتيجة مباشرة للمستفيد" : "Direct Beneficiary Outcome"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-gray-50 text-sakan-text/60 border border-gray-200 rounded-full">
                  {isAr ? "لم يتم التوجيه للموظف" : "Not Routed to Officer"}
                </span>
              </div>
            )}
          </div>

          <div className="h-px bg-sakan-border/60" />

          <div className="bg-sakan-gold/5 p-3 rounded-xl border border-sakan-gold/30">
            <p className="text-[11px] text-sakan-navy font-semibold leading-relaxed">
              {isAr ? NO_AUTO_APPROVAL_NOTICE.ar : NO_AUTO_APPROVAL_NOTICE.en}
            </p>
          </div>

          <div className="bg-sakan-bg p-4 rounded-2xl border border-sakan-border space-y-2">
            <h3 className="text-xs font-bold text-sakan-text/40 uppercase tracking-wider">
              {isAr ? "عوامل القرار الرئيسية" : "Key Decision Factors"}
            </h3>
            <ul className="space-y-2">
              {(isAr ? keyDecisionFactors.ar : keyDecisionFactors.en).map((factor) => (
                <li key={factor} className="flex items-start gap-2 text-xs text-sakan-navy font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-sakan-gold shrink-0 mt-1.5" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reasons List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-sakan-text/40 uppercase tracking-wider">{t.reasonsTitle}</h2>
            <div className="space-y-2">
              {failedReasons.map((reason: string) => (
                <div key={reason} className="flex items-start gap-3 bg-sakan-bg p-3.5 rounded-xl border border-sakan-border text-xs text-sakan-navy font-semibold">
                  <AlertTriangle className="w-4 h-4 text-sakan-danger shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation with AI Option */}
          <div className="bg-sakan-bg p-5 rounded-2xl border border-sakan-border space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-sm font-bold text-sakan-navy flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sakan-gold" /> {t.explanationTitle}
              </h3>
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-sakan-navy/5 text-sakan-navy border border-sakan-navy/10 rounded-full">
                {aiExplanation ? t.badgeAi : t.badgeRules}
              </span>
            </div>

            <p className="text-xs text-sakan-text/80 leading-relaxed font-semibold">
              {aiExplanation || (isAr ? "لا يمكن متابعة طلبك بموجب قواعد السياسة الحالية." : "Your request cannot proceed under the current policy rules.") || showRulesExplanation}
            </p>

            {!aiExplanation && (
              <button
                onClick={handleGenerateAiExplanation}
                disabled={isGeneratingAi}
                className="w-full bg-sakan-navy hover:bg-sakan-navy/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                {isGeneratingAi ? t.btnGenerating : t.btnGeneratePlain}
              </button>
            )}
          </div>

          {/* Smart Next Steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-sakan-text/40 uppercase tracking-wider">{t.nextStepsTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => router.push(`/apply?edit=evidence&caseId=${caseId}`)}
                className="flex items-center justify-between p-3.5 bg-white border border-sakan-border hover:border-sakan-gold hover:bg-sakan-gold/5 rounded-2xl transition-all text-xs font-bold text-sakan-navy group text-left"
              >
                <span className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-sakan-gold" />
                  {t.btnUploadEvidence}
                </span>
                <span className="text-sakan-text/30 group-hover:text-sakan-gold transition-colors">→</span>
              </button>

              <button
                onClick={() => setIsEligibilityOpen(true)}
                className="flex items-center justify-between p-3.5 bg-white border border-sakan-border hover:border-sakan-gold hover:bg-sakan-gold/5 rounded-2xl transition-all text-xs font-bold text-sakan-navy group text-left"
              >
                <span className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-sakan-gold" />
                  {t.btnReviewEligibility}
                </span>
                <span className="text-sakan-text/30 group-hover:text-sakan-gold transition-colors">→</span>
              </button>

              <button
                onClick={() => {
                  const prefill = isAr 
                    ? `مرحباً دعم سكن،\n\nأود الاستفسار بخصوص طلب إعادة الجدولة الخاص بي (رمز الحالة: ${caseId}). تعذر قبول الطلب لعدم استيفاء القواعد التالية:\n- ${failedRulesList.join("\n- ")}`
                    : `Hello SAKAN Support,\n\nI am writing to inquire about my rescheduling application (Case ID: ${caseId}). The request cannot proceed due to unmet policy rules:\n- ${failedRulesList.join("\n- ")}`;
                  setSupportMsg(prefill);
                  setIsSupportOpen(true);
                }}
                className="flex items-center justify-between p-3.5 bg-white border border-sakan-border hover:border-sakan-gold hover:bg-sakan-gold/5 rounded-2xl transition-all text-xs font-bold text-sakan-navy group text-left"
              >
                <span className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-sakan-gold" />
                  {t.btnContactSupport}
                </span>
                <span className="text-sakan-text/30 group-hover:text-sakan-gold transition-colors">→</span>
              </button>

              <button
                onClick={() => router.push(`/apply?caseId=${caseId}`)}
                className="flex items-center justify-between p-3.5 bg-white border border-sakan-border hover:border-sakan-gold hover:bg-sakan-gold/5 rounded-2xl transition-all text-xs font-bold text-sakan-navy group text-left"
              >
                <span className="flex items-center gap-2.5">
                  <ArrowLeft className="w-4 h-4 text-sakan-gold" />
                  {t.btnBack}
                </span>
                <span className="text-sakan-text/30 group-hover:text-sakan-gold transition-colors">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Review Eligibility */}
      <AnimatePresence>
        {isEligibilityOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sakan-navy/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-6 border border-sakan-border shadow-2xl max-w-md w-full space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sakan-navy text-sm uppercase tracking-wider">{t.eligibilityModalTitle}</h3>
                <button onClick={() => setIsEligibilityOpen(false)} className="text-sakan-text/50 hover:text-sakan-navy"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2.5 text-xs text-sakan-text/80 font-medium leading-relaxed">
                <p>{t.rule1}</p>
                <p>{t.rule2}</p>
                <p>{t.rule3}</p>
                <p>{t.rule4}</p>
                <p>{t.rule5}</p>
              </div>
              <button onClick={() => setIsEligibilityOpen(false)} className="w-full bg-sakan-navy hover:bg-sakan-navy/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs">
                {t.close}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Contact Support */}
      <AnimatePresence>
        {isSupportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sakan-navy/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-6 border border-sakan-border shadow-2xl max-w-md w-full space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sakan-navy text-sm uppercase tracking-wider">{t.supportModalTitle}</h3>
                <button onClick={() => setIsSupportOpen(false)} className="text-sakan-text/50 hover:text-sakan-navy"><X className="w-5 h-5" /></button>
              </div>
              <textarea
                value={supportMsg}
                onChange={e => setSupportMsg(e.target.value)}
                placeholder={t.msgPlaceholder}
                rows={6}
                className="w-full p-3 border border-sakan-border rounded-xl text-xs focus:ring-1 focus:ring-sakan-gold/50 focus:outline-none resize-none bg-sakan-bg/40 text-sakan-navy font-medium"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsSupportOpen(false)} className="w-1/2 bg-sakan-bg border border-sakan-border text-sakan-navy font-bold py-2.5 px-4 rounded-xl text-xs">
                  {t.close}
                </button>
                <button onClick={handleSendSupport} disabled={isSendingSupport} className="w-1/2 bg-sakan-gold text-sakan-navy font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm">
                  {isSendingSupport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSendingSupport ? t.sending : t.send}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ApplyResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sakan-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sakan-gold" />
      </div>
    }>
      <ApplyResultContent />
    </Suspense>
  );
}
