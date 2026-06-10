"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDemo } from "@/lib/demo-context";
import { runDecisionAgent } from "@/lib/agent-rules";
import { saveCustomCase } from "@/lib/services/caseService";
import { CaseData } from "@/lib/types";
import { MOCK_CASES } from "@/lib/mock-data";

import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Database,
  Server,
  FileText,
  Cpu,
  Calculator,
  BrainCircuit,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Languages,
  Activity,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const T = {
  EN: {
    title: "SAKAN Decision Agent",
    subtitle: "Processing rescheduling application autonomously",
    step: "Step",
    of: "of",
    completePercent: "complete",
    currentEngine: "Current engine",
    phases: [
      "Identity & Data Retrieval",
      "Document Intelligence",
      "Policy Rules Engine",
      "Decision & Explanation"
    ],
    status: {
      Completed: "Completed",
      Processing: "Processing...",
      Pending: "Pending",
      Warning: "Warning",
      Escalated: "Escalated"
    },
    whyThisMatters: "Why this matters",
    whyThisMattersText: "The SAKAN Decision Agent validates identity, retrieves loan data, checks document integrity, applies policy rules, calculates financial capacity, and generates an explainable recommendation with a full audit trail.",
    finalBadges: {
      CASE_A: "Approved recommendation generated",
      CASE_B: "Additional information request generated",
      CASE_C: "Human review escalation generated"
    },
    buttons: {
      CASE_A: "View Decision Report",
      CASE_B: "View Review Report",
      CASE_C: "View Escalation Report",
      Processing: "Processing..."
    },
    steps: [
      { label: "UAE PASS profile retrieved", source: "Mock UAE PASS API", icon: UserCheck, phase: 0 },
      { label: "Loan data retrieved", source: "Mock MOEI Loan System", icon: Server, phase: 0 },
      { label: "Arrears data retrieved", source: "Mock Arrears DB", icon: Server, phase: 0 },
      { label: "Payment history retrieved", source: "Mock Payment API", icon: Database, phase: 0 },
      
      { label: "Salary certificate received", source: "System", icon: FileText, phase: 1 },
      { label: "Salary certificate validated", source: "Document Intelligence", icon: Cpu, phase: 1 },
      { label: "Salary extracted from document", source: "Document Intelligence", icon: Cpu, phase: 1 },
      { label: "Bank transfer cross-check completed", source: "Rules Engine", icon: Calculator, phase: 1 },
      
      { label: "Active request checked", source: "Rules Engine", icon: Cpu, phase: 2 },
      { label: "Income per family member calculated", source: "Calculation Engine", icon: Calculator, phase: 2 },
      { label: "20% deduction cap calculated", source: "Calculation Engine", icon: Calculator, phase: 2 },
      { label: "Repayment period checked", source: "Policy Engine", icon: Cpu, phase: 2 },
      { label: "Policy rules applied", source: "Decision Engine", icon: BrainCircuit, phase: 2 },
      
      { label: "Recommendation generated", source: "Decision Engine", icon: BrainCircuit, phase: 3 },
      { label: "Beneficiary message drafted", source: "Decision Engine", icon: FileText, phase: 3 },
      { label: "Decision report created", source: "System", icon: Server, phase: 3 },
      { label: "Audit trail saved", source: "Audit System", icon: Database, phase: 3 }
    ]
  },
  AR: {
    title: "وكيل قرار سكن",
    subtitle: "جاري معالجة طلب إعادة الجدولة بشكل آلي ومنظم",
    step: "الخطوة",
    of: "من",
    completePercent: "تم إنجاز",
    currentEngine: "المحرك الحالي",
    phases: [
      "التحقق من الهوية واسترداد البيانات",
      "تحليل المستندات",
      "محرك قواعد السياسة",
      "القرار والتفسير"
    ],
    status: {
      Completed: "مكتمل",
      Processing: "جاري المعالجة...",
      Pending: "بانتظار المعالجة",
      Warning: "تنبيه",
      Escalated: "محوّل للمراجعة"
    },
    whyThisMatters: "لماذا هذا مهم؟",
    whyThisMattersText: "يقوم وكيل قرار سكن بالتحقق من الهوية، واسترداد بيانات القرض، وفحص سلامة المستندات، وتطبيق قواعد السياسة، واحتساب القدرة المالية، ثم إنشاء توصية قابلة للتفسير مع سجل تدقيق كامل.",
    finalBadges: {
      CASE_A: "تم إنشاء توصية بالموافقة",
      CASE_B: "تم إنشاء طلب معلومات إضافية",
      CASE_C: "تم تحويل الحالة للمراجعة البشرية"
    },
    buttons: {
      CASE_A: "عرض تقرير القرار",
      CASE_B: "عرض تقرير المراجعة",
      CASE_C: "عرض تقرير التحويل",
      Processing: "جاري المعالجة..."
    },
    steps: [
      { label: "تم استرداد ملف الهوية الرقمية", source: "واجهة الهوية الرقمية التجريبية", icon: UserCheck, phase: 0 },
      { label: "تم استرداد بيانات القرض", source: "نظام القروض التجريبي", icon: Server, phase: 0 },
      { label: "تم استرداد بيانات المتأخرات", source: "قاعدة بيانات المتأخرات التجريبية", icon: Server, phase: 0 },
      { label: "تم استرداد سجل المدفوعات", source: "واجهة المدفوعات التجريبية", icon: Database, phase: 0 },
      
      { label: "تم استلام شهادة الراتب", source: "النظام", icon: FileText, phase: 1 },
      { label: "تم التحقق من صحة شهادة الراتب", source: "تحليل المستندات", icon: Cpu, phase: 1 },
      { label: "تم استخراج الراتب من المستند", source: "تحليل المستندات", icon: Cpu, phase: 1 },
      { label: "اكتملت مطابقة التحويل البنكي", source: "محرك القواعد", icon: Calculator, phase: 1 },
      
      { label: "تم التحقق من الطلبات النشطة", source: "محرك القواعد", icon: Cpu, phase: 2 },
      { label: "تم احتساب الدخل لكل فرد من الأسرة", source: "محرك الحسابات", icon: Calculator, phase: 2 },
      { label: "تم احتساب سقف الاستقطاع ٢٠٪", source: "محرك الحسابات", icon: Calculator, phase: 2 },
      { label: "تم التحقق من فترة السداد", source: "محرك السياسة", icon: Cpu, phase: 2 },
      { label: "تم تطبيق قواعد السياسة", source: "محرك القرار", icon: BrainCircuit, phase: 2 },
      
      { label: "تم إنشاء التوصية", source: "محرك القرار", icon: BrainCircuit, phase: 3 },
      { label: "تمت صياغة رسالة المتعامل", source: "محرك القرار", icon: FileText, phase: 3 },
      { label: "تم إنشاء تقرير القرار", source: "النظام", icon: Server, phase: 3 },
      { label: "تم حفظ سجل التدقيق", source: "نظام التدقيق", icon: Database, phase: 3 }
    ]
  }
} as const;

type LangKey = keyof typeof T;

type StepState = {
  status: "pending" | "processing" | "completed" | "warning" | "escalated";
  time: string;
};

export default function AIProcessingScreen() {
  const { selectedCaseId, language, setLanguage } = useDemo();
  const lang = language as LangKey;
  const isAr = lang === "AR";
  const t = T[lang];

  const totalSteps = t.steps.length;
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [stepStates, setStepStates] = useState<StepState[]>(
    Array(totalSteps).fill({ status: "pending", time: "" })
  );
  const [isComplete, setIsComplete] = useState(false);
  const [report, setReport] = useState<any>(null);

  const [caseDataState, setCaseDataState] = useState<any>(null);

  useEffect(() => {
    let caseData = MOCK_CASES[selectedCaseId];
    if (!caseData && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`customCase_${selectedCaseId}`);
        if (stored) caseData = JSON.parse(stored);
      } catch (e) {
        console.warn(e);
      }
    }
    if (caseData) {
      setCaseDataState(caseData);
      setReport(runDecisionAgent(caseData));
    }
  }, [selectedCaseId]);

  useEffect(() => {
    let index = 0;
    setCurrentIndex(0);

    const interval = setInterval(() => {
      if (index >= totalSteps) {
        clearInterval(interval);
        setIsComplete(true);
        if (report && caseDataState) {
          saveCustomCase({
            ...caseDataState,
            recommendation: report.recommendation.status || report.recommendation,
            routingPath: report.recommendation.routingPath,
            nextOwner: report.recommendation.nextOwner,
            priority: report.recommendation.priority,
            confidenceScore: report.recommendation.confidence,
            reasonCodes: report.reasonCodes,
            status: report.recommendation.status || report.recommendation,
            nextBestAction: report.recommendation.nextBestAction
          });
        }
        return;
      }

      setStepStates(prev => {
        const next = [...prev];
        const now = new Date().toLocaleTimeString(isAr ? 'ar-AE' : 'en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
        
        // Handle previous step completion
        if (index > 0) {
          const prevIndex = index - 1;
          let finalStatus: StepState["status"] = "completed";

          // Inject Case-specific outcomes
          if (selectedCaseId === "CASE-B") {
            if (prevIndex === 5 || prevIndex === 7) finalStatus = "warning"; // Salary validated / Bank cross-check
          } else if (selectedCaseId === "CASE-C") {
            if (prevIndex === 8 || prevIndex === 9 || prevIndex === 10) finalStatus = "warning"; // Active request / Income / Cap
            if (prevIndex === 12) finalStatus = "escalated"; // Policy rules applied
          }

          next[prevIndex] = { ...next[prevIndex], status: finalStatus, time: now };
        }
        
        // Mark current step as processing
        if (index < next.length) {
          next[index] = { ...next[index], status: "processing" };
        }
        
        return next;
      });

      index++;
      setCurrentIndex(index);
    }, 600); // Speed of processing

    return () => clearInterval(interval);
  }, [totalSteps, selectedCaseId, isAr]);

  const activePhaseIndex = Math.min(
    t.steps[Math.max(0, Math.min(currentIndex, totalSteps - 1))]?.phase || 0,
    3
  );
  
  const currentEngine = currentIndex < totalSteps && currentIndex >= 0 
    ? t.steps[currentIndex].source 
    : isComplete 
    ? t.status.Completed 
    : "";

  const percentage = Math.min(Math.round(((currentIndex) / totalSteps) * 100), 100);

  const finalStatus = report?.recommendation?.status as string;
  const isRejected = 
    finalStatus === "Direct Beneficiary Outcome / Not Eligible" ||
    finalStatus === "Direct Beneficiary Outcome" ||
    finalStatus === "Rejection Recommendation / Not Eligible" ||
    finalStatus === "Rejection Recommendation / Not Eligible" ||
    finalStatus === "Rejected" ||
    finalStatus === "Not Eligible Under Current Rules" ||
    selectedCaseId === "CASE-D";

  const isApplicantAction = 
    finalStatus === "Applicant Action Required" ||
    selectedCaseId === "CASE-B";

  const redirectLink = isRejected 
    ? `/apply/result?caseId=${selectedCaseId}`
    : isApplicantAction
    ? `/apply?caseId=${selectedCaseId}`
    : `/officer/report/${selectedCaseId}`;

  let finalBadge = "";
  let buttonText = "";

  if (isAr) {
    if (isRejected) {
      finalBadge = "نتيجة الطلب: غير مؤهل حسب القواعد الحالية";
      buttonText = "عرض نتيجة الطلب";
    } else if (finalStatus === "Applicant Action Required") {
      finalBadge = "مطلب مستندات إضافية / تصحيح المستندات";
      buttonText = "عرض تقرير المراجعة";
    } else if (finalStatus === "Humanitarian Review Required") {
      finalBadge = "مطلب مراجعة إنسانية / محوّل للمراجعة";
      buttonText = "عرض تقرير التحويل";
    } else {
      finalBadge = "موصى بالموافقة / المسار السريع";
      buttonText = "عرض تقرير القرار";
    }
  } else {
    if (isRejected) {
      finalBadge = "Application Outcome: Not Eligible Under Current Rules";
      buttonText = "View Application Outcome";
    } else if (finalStatus === "Applicant Action Required") {
      finalBadge = "Additional Information Required / Document Correction Required";
      buttonText = "View Review Report";
    } else if (finalStatus === "Humanitarian Review Required") {
      finalBadge = "Humanitarian Review Required / Escalated";
      buttonText = "View Escalation Report";
    } else {
      finalBadge = "Recommended for Approval / Ready for Officer Confirmation";
      buttonText = "View Decision Report";
    }
  }

  return (
    <div 
      className={`min-h-screen bg-sakan-bg p-4 md:p-8 flex items-center justify-center pb-24 ${isAr ? "font-arabic-premium" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Arabic font loader */}
      {isAr && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap');
          .font-arabic-premium,
          .font-arabic-premium * {
            font-family: 'Tajawal', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', system-ui, sans-serif !important;
            line-height: 1.6;
          }
        `}} />
      )}

      {/* Language Toggle Fixed Top Right */}
      <div className={`absolute top-6 ${isAr ? 'left-6' : 'right-6'} flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-sakan-border shadow-sm`}>
        <Languages className="w-3.5 h-3.5 text-sakan-text/40" />
        <button
          onClick={() => setLanguage("EN")}
          className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all ${lang === "EN" ? "bg-sakan-navy text-white" : "text-sakan-navy/70 hover:bg-sakan-bg"}`}
        >EN</button>
        <button
          onClick={() => setLanguage("AR")}
          className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all ${lang === "AR" ? "bg-sakan-navy text-white" : "text-sakan-navy/70 hover:bg-sakan-bg"}`}
        >AR</button>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-10 lg:mt-0">
        
        {/* Main Workflow Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-center lg:text-start mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sakan-navy shadow-lg mb-5">
              <BrainCircuit className="w-7 h-7 text-sakan-gold" />
            </div>
            <h1 className="text-3xl font-bold text-sakan-navy mb-2">{t.title}</h1>
            <p className="text-sakan-text/70">{t.subtitle}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-sakan-border overflow-hidden">
            {/* Header with Progress */}
            <div className="bg-sakan-navy text-white px-6 py-5">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-xs text-sakan-gold font-bold uppercase tracking-widest mb-1">
                    {isComplete ? t.status.Completed : `${t.currentEngine}: ${currentEngine}`}
                  </div>
                  <div className="font-semibold text-lg">
                    {isComplete ? t.phases[3] : t.phases[activePhaseIndex]}
                  </div>
                </div>
                <div className={`text-right ${isAr ? 'text-left' : ''}`}>
                  <div className="text-2xl font-bold">{percentage}%</div>
                  <div className="text-xs opacity-70">
                    {isAr ? `${percentage}٪ ${t.completePercent}` : `${percentage}% ${t.completePercent}`} — {t.step} {Math.max(1, Math.min(currentIndex, totalSteps))} {t.of} {totalSteps}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-sakan-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ ease: "easeOut", duration: 0.5 }}
                />
              </div>
            </div>
            
            {/* Steps List */}
            <div className="p-6 max-h-[55vh] overflow-y-auto bg-sakan-bg/30">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-sakan-border before:to-transparent">
                {t.phases.map((phaseName, phaseIdx) => {
                  const phaseSteps = t.steps.map((s, i) => ({ ...s, globalIndex: i })).filter(s => s.phase === phaseIdx);
                  const isPhaseActiveOrDone = currentIndex >= phaseSteps[0].globalIndex;
                  if (!isPhaseActiveOrDone) return null;

                  return (
                    <div key={phaseIdx} className="relative z-10">
                      <div className="text-xs font-bold text-sakan-text/40 uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="bg-sakan-bg/80 backdrop-blur-sm px-2 rounded-md">{phaseName}</span>
                        <div className="h-px flex-1 bg-sakan-border/50" />
                      </div>
                      
                      <div className="space-y-3">
                        {phaseSteps.map((step) => {
                          const state = stepStates[step.globalIndex];
                          const isActive = state.status === "processing";
                          const isPending = state.status === "pending";
                          const isWarning = state.status === "warning";
                          const isEscalated = state.status === "escalated";
                          const isDone = state.status === "completed" || isWarning || isEscalated;
                          const Icon = step.icon;

                          if (isPending && step.globalIndex > currentIndex) return null;

                          return (
                            <motion.div
                              key={step.globalIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex items-start gap-4 p-3.5 rounded-2xl border transition-all ${
                                isActive ? "bg-white border-sakan-gold shadow-md" : 
                                isWarning ? "bg-amber-50 border-amber-200" :
                                isEscalated ? "bg-red-50 border-red-200" :
                                isDone ? "bg-white border-sakan-border/50 opacity-80" : 
                                "hidden"
                              }`}
                            >
                              <div className="shrink-0 mt-0.5 relative">
                                {isActive && (
                                  <span className="absolute inset-0 bg-sakan-gold/30 rounded-full animate-ping" />
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${
                                  isActive ? "bg-sakan-gold text-sakan-navy shadow-sm" :
                                  isWarning ? "bg-amber-100 text-amber-600" :
                                  isEscalated ? "bg-red-100 text-red-600" :
                                  "bg-emerald-100 text-emerald-600"
                                }`}>
                                  {isActive ? (
                                    <Activity className="w-4 h-4 animate-pulse" />
                                  ) : isWarning ? (
                                    <AlertTriangle className="w-4 h-4" />
                                  ) : isEscalated ? (
                                    <ShieldAlert className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className={`font-semibold text-sm ${isActive ? "text-sakan-navy" : "text-sakan-text/80"}`}>
                                    {step.label}
                                  </div>
                                  {isDone && (
                                    <div className="text-[10px] font-mono text-sakan-text/40">{state.time}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-[11px] font-medium text-sakan-text/50 flex items-center gap-1.5">
                                    <Icon className="w-3 h-3" />
                                    {step.source}
                                  </div>
                                  {isActive && (
                                    <span className="text-[10px] font-bold text-sakan-gold bg-sakan-gold/10 px-2 py-0.5 rounded-full animate-pulse">
                                      {t.status.Processing}
                                    </span>
                                  )}
                                  {isWarning && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                      {t.status.Warning}
                                    </span>
                                  )}
                                  {isEscalated && (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                      {t.status.Escalated}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-sakan-border">
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mb-4 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold text-center ${
                      finalStatus === "Recommended for Approval / Ready for Officer Confirmation" || finalStatus === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      finalStatus === "Applicant Action Required" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {finalStatus === "Recommended for Approval / Ready for Officer Confirmation" || finalStatus === "Approved" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {finalBadge}
                  </motion.div>
                ) : null}
              </AnimatePresence>
              
              <Link
                href={redirectLink}
                className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl transition-all shadow-md text-sm ${
                  isComplete 
                    ? "bg-sakan-navy hover:bg-sakan-navy/90 text-white" 
                    : "bg-sakan-bg border border-sakan-border text-sakan-text/40 cursor-not-allowed pointer-events-none"
                }`}
              >
                {isComplete ? buttonText : t.buttons.Processing}
                {isComplete && <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />}
              </Link>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: isAr ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm sticky top-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sakan-navy text-base">{t.whyThisMatters}</h3>
            </div>
            <p className="text-sm text-sakan-text/70 leading-relaxed">
              {t.whyThisMattersText}
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
