/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { MOCK_CASES } from "@/lib/mock-data";
import { runDecisionAgent } from "@/lib/agent-rules";
import {
  getWorkloadGroup,
  getWorkspaceDisplayStatus,
  isHumanitarianReviewStatus,
  isReadyForConfirmationStatus,
} from "@/lib/workspaceWorkload";
import { getWorkspaceCases } from "@/lib/workspace-storage";
import { useDemo } from "@/lib/demo-context";
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  FileText,
  Zap,
  Languages,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";

/* ─── Translations ───────────────────────────────────────────────────── */
const T = {
  EN: {
    officerWorkspace: "Officer Workspace",
    reviewSubtitle: "Review AI-processed rescheduling applications",
    rulesDescription: "Review AI-processed rescheduling applications.",
    totalCases: "Total Cases",
    escalated: "Escalated",
    approving: "Approving…",
    approvedMessage: "Recommendation approved and recorded in audit trail.",
    noticeSent: "Notice sent and recorded in audit trail.",
    docsRequested: "Document request generated and recorded.",
    markWaiting: "Case marked as waiting for applicant.",
    assigned: "Case assigned to senior officer.",
    caseId: "Case ID",
    aiRecommendation: "AI Recommendation",
    nextBestAction: "Next Best Action",
    confidence: "Confidence",
    searchPlaceholder: "Search by Case ID or Beneficiary...",
    filterCases: "Filter Cases",
    clearFilter: "Clear Filter",
    approveCase: "Confirm Recommendation",
    sendNotice: "Send Notice",
    requestDocs: "Request Docs",
    markWaitingBtn: "Mark Waiting",
    assignHuman: "Assign Human",
    openReport: "Open Report",
    emptyState: "No cases match your criteria.",
    enterNote: "Enter note (optional)",
    modalCancel: "Cancel",
    btnApproveRec: "Confirm Recommendation",
    modalNotifyTitle: "Beneficiary Notification",
    btnSendNotification: "Send Notification",
    modalDocReqTitle: "Document Request",
    docReqText: "Please upload the required documents.",
    btnSendRequest: "Send Request",
    modalAssignTitle: "Assign to Officer",
    assignOpt1: "Senior Housing Officer",
    assignOpt2: "Finance Review Officer",
    assignOpt3: "Exception Committee",
    assignComment: "Assignment comment (optional)",
    btnConfirmAssign: "Confirm Assignment",
    // Priority labels
    lblPriority: "Priority",
    lblPriorityReason: "Priority Reason",
    lblPrioritySla: "SLA Indicator",
    lblNextBestActionLbl: "Next Best Action",
    priorityUrgent: "Urgent",
    priorityHigh: "High",
    priorityMedium: "Medium",
    priorityLow: "Low",
    // Arabic translations
    arEnterNote: "أدخل ملاحظة (اختياري)",
    arModalCancel: "إلغاء",
    arBtnApproveRec: "تأكيد الاعتماد",
    arModalNotifyTitle: "إشعار المستفيد",
    arBtnSendNotification: "إرسال إشعار",
    arModalDocReqTitle: "طلب مستندات",
    arDocReqText: "يرجى رفع المستندات المطلوبة.",
    arBtnSendRequest: "إرسال طلب",
    arModalAssignTitle: "إسناد إلى موظف",
    arAssignOpt1: "الموظف السكني الأعلى",
    arAssignOpt2: "موظف مراجعة مالية",
    arAssignOpt3: "لجنة الاستثناء",
    arAssignComment: "تعليق الإسناد (اختياري)",
    arBtnConfirmAssign: "تأكيد الإسناد",
    metricReadyConfirm: "Ready for Officer Confirmation",
    metricHumanitarian: "Humanitarian Reviews",
    metricAwaitingBeneficiary: "Awaiting Beneficiary Correction",
    metricDirectOutcomes: "Direct Beneficiary Outcomes",
    metricWorkloadReduced: "Estimated Officer Workload Reduced",
    workloadExplainTitle: "How SAKAN AI reduces officer workload",
    workloadExplainText: "Correctable document issues are returned to the beneficiary. Clearly not-eligible cases receive a direct beneficiary outcome. Officers only review clean recommendations and humanitarian cases that require human judgment.",
    groupOfficerAction: "Requires Officer Action",
    groupBeneficiaryAction: "Awaiting Beneficiary Action",
    groupDirectOutcomes: "Direct Beneficiary Outcomes",
    openConfirmationReport: "Open Confirmation Report",
    openHumanReviewReport: "Open Human Review Report",
    assignSpecialist: "Assign Specialist",
    requestMoreEvidence: "Request More Evidence",
    viewCorrectionStatus: "View Correction Status",
    sendCorrectionNotice: "Send Correction Notice",
    viewBeneficiaryOutcome: "View Beneficiary Outcome",
    viewReasonCodes: "View Reason Codes",
    modalCorrectionTitle: "Beneficiary Correction Status",
    modalReasonCodesTitle: "Outcome Reason Codes",
    notOfficerWorkload: "Informational — not officer workload",
  },
  AR: {
    officerWorkspace: "مساحة عمل الموظف المختص",
    reviewSubtitle: "مراجعة طلبات إعادة جدولة المتأخرات التي تم تقييمها بالذكاء الاصطناعي",
    rulesDescription: "مراجعة طلبات إعادة جدولة المتأخرات التي تم تقييمها بالذكاء الاصطناعي.",
    totalCases: "إجمالي الحالات",
    escalated: "الحالات المحو",
    approving: "جاري اعتماد التوصية…",
    approvedMessage: "تم اعتماد التوصية وتسجيلها في سجل التدقيق.",
    noticeSent: "تم إرسال الإشعار وتسجيله في سجل التدقيق.",
    docsRequested: "تم إنشاء طلب المستندات وتسجيله.",
    markWaiting: "تم وضع الحالة في انتظار المتقدم.",
    assigned: "تم إسناد الحالة إلى الموظف الأعلى.",
    caseId: "رقم الحالة",
    aiRecommendation: "توصية الذكاء الاصطناعي",
    nextBestAction: "الإجراء الأفضل التالي",
    confidence: "الثقة",
    searchPlaceholder: "بحث برقم الحالة أو المستفيد...",
    filterCases: "تصفية الحالات",
    clearFilter: "مسح التصفية",
    approveCase: "اعتماد التوصية",
    sendNotice: "إرسال إشعار",
    requestDocs: "طلب مستندات",
    markWaitingBtn: "وضع في انتظار",
    assignHuman: "إسناد إلى إنسان",
    openReport: "فتح التقرير",
    emptyState: "لا توجد حالات تطابق معايير البحث.",
    traceData: "بيانات التتبع",
    enterNote: "أدخل ملاحظة (اختياري)",
    modalCancel: "إلغاء",
    btnApproveRec: "اعتماد التوصية",
    modalNotifyTitle: "إشعار المستفيد",
    btnSendNotification: "إرسال إشعار",
    modalDocReqTitle: "طلب مستندات",
    docReqText: "يرجى رفع المستندات المطلوبة.",
    btnSendRequest: "إرسال طلب",
    modalAssignTitle: "إسناد إلى موظف",
    assignOpt1: "الموظف السكني الأعلى",
    assignOpt2: "موظف مراجعة مالية",
    assignOpt3: "لجنة الاستثناء",
    assignComment: "تعليق الإسناد (اختياري)",
    btnConfirmAssign: "تأكيد الإسناد",
    // Priority labels
    lblPriority: "الأولوية",
    lblPriorityReason: "سبب الأولوية",
    lblPrioritySla: "مؤشر مدة الانتظار",
    lblNextBestActionLbl: "الإجراء التالي المقترح",
    priorityUrgent: "عاجلة",
    priorityHigh: "عالية",
    priorityMedium: "متوسطة",
    priorityLow: "منخفضة",
    metricReadyConfirm: "جاهز لاعتماد الموظف",
    metricHumanitarian: "مراجعات إنسانية",
    metricAwaitingBeneficiary: "بانتظار تصحيح المستفيد",
    metricDirectOutcomes: "نتائج مباشرة للمستفيد",
    metricWorkloadReduced: "تقدير تخفيف عبء الموظف",
    workloadExplainTitle: "كيف يقلل SAKAN AI عبء الموظفين",
    workloadExplainText: "تُعاد مشاكل المستندات القابلة للتصحيح إلى المستفيد، وتحصل الحالات غير المؤهلة بوضوح على نتيجة مباشرة. يراجع الموظفون فقط التوصيات الجاهزة والحالات الإنسانية التي تحتاج حكمًا بشريًا.",
    groupOfficerAction: "يتطلب إجراء الموظف",
    groupBeneficiaryAction: "بانتظار إجراء المستفيد",
    groupDirectOutcomes: "نتائج مباشرة للمستفيد",
    openConfirmationReport: "فتح تقرير الاعتماد",
    openHumanReviewReport: "فتح تقرير المراجعة الإنسانية",
    assignSpecialist: "إسناد إلى مختص",
    requestMoreEvidence: "طلب مستندات إضافية",
    viewCorrectionStatus: "عرض حالة التصحيح",
    sendCorrectionNotice: "إرسال إشعار التصحيح",
    viewBeneficiaryOutcome: "عرض نتيجة المستفيد",
    viewReasonCodes: "عرض رموز الأسباب",
    modalCorrectionTitle: "حالة تصحيح المستفيد",
    modalReasonCodesTitle: "رموز أسباب النتيجة",
    notOfficerWorkload: "للاطلاع فقط — ليس عبء عمل الموظف",
  },
} as const;

type LangKey = keyof typeof T;

const FILTERS = [
  { id: "all", en: "All Cases", ar: "جميع الحالات" },
  { id: "approved", en: "Approved", ar: "مقبول" },
  { id: "additional_info", en: "Additional Info Required", ar: "مطلوب مستندات" },
  { id: "human_review", en: "Human Review Required", ar: "مراجعة بشرية" },
  { id: "humanitarian", en: "Humanitarian", ar: "حالة إنسانية" },
  { id: "high_priority", en: "High Priority", ar: "أولوية عالية" },
  { id: "missing_documents", en: "Missing Documents", ar: "مستندات ناقصة" },
];

const initialCases = Object.values(MOCK_CASES).map(c => {
  const report = runDecisionAgent(c);
  return {
    caseData: c,
    recommendation: report.recommendation,
    reasonCodes: report.reasonCodes,
    caseClassification: report.caseClassification,
  };
});

const SHORT_NEXT_BEST_ACTIONS: Record<string, string> = {
  "CASE-A": "Generate updated repayment schedule and notify beneficiary.",
  "CASE-B": "Request updated salary certificate and bank statement clarification.",
  "CASE-C": "Assign case to senior officer for manual review.",
};

const BENEFICIARY_EXPLANATION: Record<string, { en: string; ar: string }> = {
  "CASE-A": { en: "Your repayment schedule has been updated.", ar: "تم تحديث جدول سدادك." },
  "CASE-B": { en: "We need additional financial documents.", ar: "نحتاج إلى مستندات مالية إضافية." },
  "CASE-C": { en: "Your application is under senior review.", ar: "طلبك قيد المراجعة العليا." },
};

export default function OfficerWorkspace() {
  const { addAuditLog, language, setLanguage } = useDemo();
  const [modalType, setModalType] = useState<"approve" | "notify" | "requestDoc" | "assignHuman" | "correctionStatus" | "reasonCodes" | null>(null);
  const [modalCaseId, setModalCaseId] = useState<string>("");
  const [noteText, setNoteText] = useState<string>("");
  const [assignOfficer, setAssignOfficer] = useState<string>("Senior Housing Officer");
  const [assignComment, setAssignComment] = useState<string>("");
  const lang = language as LangKey;
  const isAr = lang === "AR";
  const t = T[lang];

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilterId, setActiveFilterId] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  // click‑outside & ESC handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Recommended for Approval / Ready for Officer Confirmation":
      case "Officer Approved Recommendation":
      case "Recommended for Approval / Ready for Officer Confirmation":
        return "bg-sakan-success/10 text-sakan-success border-sakan-success/20";
      case "Additional Information Required":
      case "Applicant Action Required":
      case "Waiting for Applicant Documents":
        return "bg-sakan-warning/10 text-sakan-warning border-sakan-warning/20";
      case "Human Review Required":
      case "Humanitarian Review Required":
      case "Assigned to Senior Officer":
        return "bg-sakan-danger/10 text-sakan-danger border-sakan-danger/20";
      case "Awaiting Applicant Response":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Rejected":
      case "Rejection Recommendation / Not Eligible":
      case "Rejection Recommendation / Not Eligible":
      case "Direct Beneficiary Outcome / Not Eligible":
        return "bg-sakan-text/10 text-sakan-text border-sakan-text/20";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
      case "Recommended for Approval / Ready for Officer Confirmation":
      case "Officer Approved Recommendation":
      case "Recommended for Approval / Ready for Officer Confirmation":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Additional Information Required":
      case "Applicant Action Required":
      case "Waiting for Applicant Documents":
        return <Clock className="w-4 h-4" />;
      case "Human Review Required":
      case "Humanitarian Review Required":
      case "Assigned to Senior Officer":
        return <AlertTriangle className="w-4 h-4" />;
      case "Rejected":
      case "Rejection Recommendation / Not Eligible":
      case "Rejection Recommendation / Not Eligible":
      case "Direct Beneficiary Outcome / Not Eligible":
        return <MessageSquareWarning className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadCases() {
      try {
        const { getCases } = await import("@/lib/services/caseService");
        const sakanCases = await getCases();
        if (!isMounted) return;

        const mapped = sakanCases.map(sc => {
          let caseData: any = MOCK_CASES[sc.caseCode];
          if (!caseData && typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem(`customCase_${sc.caseCode}`);
              if (stored) caseData = JSON.parse(stored);
            } catch(e) {}
          }
          if (!caseData) {
            caseData = {
              caseId: sc.caseCode,
              beneficiaryName: sc.beneficiaryName,
              emiratesId: sc.emiratesId,
              beneficiaryId: sc.beneficiaryId,
              loanId: sc.loanId,
              monthlyIncome: sc.monthlyIncome || 0,
              financialObligations: sc.financialObligations || 0,
              familyMembers: sc.familyMembers || 1,
              currentInstallment: sc.currentInstallment || 0,
              arrearsAmount: sc.arrearsAmount || 0,
              unpaidInstallments: sc.unpaidInstallments || 0,
              remainingLoanBalance: sc.remainingBalance || 0,
              remainingRepaymentMonths: sc.remainingRepaymentMonths || 0,
              activeRequest: !!sc.activeRequest,
              paymentHistory: sc.paymentHistory || "Custom Case",
              supportingCircumstance: sc.supportingCircumstance,
            };
          }
          
          const report = runDecisionAgent(caseData);
          return {
            caseData,
            recommendation: report.recommendation,
            reasonCodes: report.reasonCodes,
            caseClassification: report.caseClassification,
            createdAt: sc.createdAt || new Date().toISOString(),
          };
        });

        // sort newest first
        mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (process.env.NODE_ENV === "development") {
          console.log("merged workspace cases count", mapped.length);
          console.log("PERSISTENCE DO NOT CLEAR custom storage keys");
        }
        setCases(mapped);
      } catch (err) {
        console.error("Failed to load workspace cases", err);
      }
    }
    loadCases();
    return () => { isMounted = false; };
  }, []);

  const officerActionCases = cases.filter(c =>
    getWorkloadGroup(c.recommendation.status, c.caseClassification?.caseCategory) === "officer_action"
  );
  const beneficiaryActionCases = cases.filter(c =>
    getWorkloadGroup(c.recommendation.status, c.caseClassification?.caseCategory) === "beneficiary_action"
  );
  const directOutcomeCases = cases.filter(c =>
    getWorkloadGroup(c.recommendation.status, c.caseClassification?.caseCategory) === "direct_outcome"
  );

  const readyForConfirmationCount = officerActionCases.filter(c =>
    isReadyForConfirmationStatus(c.recommendation.status)
  ).length;
  const humanitarianReviewCount = officerActionCases.filter(c =>
    isHumanitarianReviewStatus(c.recommendation.status)
  ).length;
  const workloadReducedCount = beneficiaryActionCases.length + directOutcomeCases.length;

  const priorityOrder: Record<string, number> = {
    Urgent: 1,
    High: 2,
    Medium: 3,
    Low: 4,
  };

  const filteredCases = cases.filter(pkg => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      pkg.caseData.caseId.toLowerCase().includes(term) ||
      pkg.caseData.beneficiaryName.toLowerCase().includes(term) ||
      pkg.recommendation.resolutionPath.toLowerCase().includes(term);
    const matchesFilter = (() => {
      if (activeFilterId === "all") return true;
      if (activeFilterId === "approved")
        return ["Approved", "Recommended for Approval / Ready for Officer Confirmation", "Officer Approved Recommendation"].includes(pkg.recommendation.status);
      if (activeFilterId === "additional_info")
        return ["Additional Information Required", "Applicant Action Required", "Waiting for Applicant Documents"].includes(pkg.recommendation.status);
      if (activeFilterId === "human_review")
        return ["Human Review Required", "Humanitarian Review Required", "Assigned to Senior Officer"].includes(pkg.recommendation.status);
      if (activeFilterId === "humanitarian") 
        return !!pkg.caseData.supportingCircumstance;
      if (activeFilterId === "high_priority") 
        return ["Urgent", "High"].includes(pkg.recommendation.priority);
      if (activeFilterId === "missing_documents") 
        return ["Additional Information Required", "Applicant Action Required"].includes(pkg.recommendation.status);
      return true;
    })();
    return matchesSearch && matchesFilter;
  }).sort((a, b) => (priorityOrder[a.recommendation.priority] || 99) - (priorityOrder[b.recommendation.priority] || 99));

  const updateCase = (caseId: string, updates: Partial<any>) => {
    setCases(prev =>
      prev.map(c => (c.caseData.caseId === caseId ? { ...c, ...updates } : c))
    );
  };

  const handleApprove = (caseId: string) => {
    updateCase(caseId, {
      recommendation: {
        ...cases.find(c => c.caseData.caseId === caseId)!.recommendation,
        status: "Officer Approved Recommendation",
      },
    });
    addAuditLog(caseId, {
      timestamp: new Date().toISOString(),
      actor: "Officer",
      action: "Officer approved recommendation",
      result: "Success",
    });
    setToastMessage(t.approvedMessage);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendNotice = (caseId: string) => {
    addAuditLog(caseId, {
      timestamp: new Date().toISOString(),
      actor: "Officer",
      action: "Beneficiary notification sent",
      result: "Success",
    });
    setToastMessage(t.noticeSent);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRequestDocs = (caseId: string) => {
    updateCase(caseId, {
      recommendation: {
        ...cases.find(c => c.caseData.caseId === caseId)!.recommendation,
        status: "Waiting for Applicant Documents",
      },
    });
    addAuditLog(caseId, {
      timestamp: new Date().toISOString(),
      actor: "Officer",
      action: "Document request generated",
      result: "Success",
    });
    setToastMessage(t.docsRequested);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMarkWaiting = (caseId: string) => {
    updateCase(caseId, {
      recommendation: {
        ...cases.find(c => c.caseData.caseId === caseId)!.recommendation,
        status: "Awaiting Applicant Response",
      },
    });
    addAuditLog(caseId, {
      timestamp: new Date().toISOString(),
      actor: "Officer",
      action: "Case marked as waiting for applicant",
      result: "Success",
    });
    setToastMessage(t.markWaiting);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAssignHuman = (caseId: string) => {
    updateCase(caseId, {
      recommendation: {
        ...cases.find(c => c.caseData.caseId === caseId)!.recommendation,
        status: "Assigned to Senior Officer",
      },
    });
    addAuditLog(caseId, {
      timestamp: new Date().toISOString(),
      actor: "Officer",
      action: "Case assigned to human officer",
      result: "Success",
    });
    setToastMessage(t.assigned);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const renderModal = () => {
    if (!modalType) return null;
    const close = () => setModalType(null);
    const caseId = modalCaseId;
    const commonCls = "fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm z-50";
    const modalCls = "bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4";
    const btnCls = "px-4 py-2 rounded-lg font-medium transition-colors";
    switch (modalType) {
      case "approve": {
        return (
          <div className={commonCls}>
            <div className={modalCls}>
              <h2 className="text-lg font-bold">{t.approveCase}</h2>
              <textarea
                className="w-full h-24 border rounded p-2"
                placeholder={t.enterNote}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={close} className={`${btnCls} bg-gray-200 hover:bg-gray-300`}> {t.modalCancel} </button>
                <button
                  onClick={() => { handleApprove(caseId); close(); }}
                  className={`${btnCls} bg-sakan-success text-white hover:bg-sakan-success/80`}
                >{t.btnApproveRec}</button>
              </div>
            </div>
          </div>
        );
      }
      case "notify": {
        const benMsgEn = BENEFICIARY_EXPLANATION[caseId]?.en || "";
        const benMsgAr = BENEFICIARY_EXPLANATION[caseId]?.ar || "";
        return (
          <div className={commonCls}>
            <div className={modalCls}>
              <h2 className="text-lg font-bold">{t.modalNotifyTitle}</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold">English:</p>
                  <p className="border rounded p-2">{benMsgEn}</p>
                </div>
                <div>
                  <p className="font-semibold">Arabic:</p>
                  <p className="border rounded p-2 text-right">{benMsgAr}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={close} className={`${btnCls} bg-gray-200 hover:bg-gray-300`}> {t.modalCancel} </button>
                <button onClick={() => { handleSendNotice(caseId); close(); }} className={`${btnCls} bg-sakan-navy text-white hover:bg-sakan-navy/80`}> {t.btnSendNotification} </button>
              </div>
            </div>
          </div>
        );
      }
      case "requestDoc": {
        return (
          <div className={commonCls}>
            <div className={modalCls}>
              <h2 className="text-lg font-bold">{t.modalDocReqTitle}</h2>
              <p className="text-sm text-gray-600">{t.docReqText}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={close} className={`${btnCls} bg-gray-200 hover:bg-gray-300`}> {t.modalCancel} </button>
                <button onClick={() => { handleRequestDocs(caseId); close(); }} className={`${btnCls} bg-sakan-warning text-white hover:bg-sakan-warning/80`}> {t.btnSendRequest} </button>
              </div>
            </div>
          </div>
        );
      }
      case "assignHuman": {
        return (
          <div className={commonCls}>
            <div className={modalCls}>
              <h2 className="text-lg font-bold">{t.modalAssignTitle}</h2>
              <select
                className="w-full border rounded p-2"
                value={assignOfficer}
                onChange={e => setAssignOfficer(e.target.value)}
              >
                <option value="Senior Housing Officer">{t.assignOpt1}</option>
                <option value="Finance Review Officer">{t.assignOpt2}</option>
                <option value="Exception Committee">{t.assignOpt3}</option>
              </select>
              <textarea
                className="w-full h-20 border rounded p-2 mt-2"
                placeholder={t.assignComment}
                value={assignComment}
                onChange={e => setAssignComment(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={close} className={`${btnCls} bg-gray-200 hover:bg-gray-300`}> {t.modalCancel} </button>
                <button onClick={() => { handleAssignHuman(caseId); close(); }} className={`${btnCls} bg-sakan-danger text-white hover:bg-sakan-danger/80`}> {t.btnConfirmAssign} </button>
              </div>
            </div>
          </div>
        );
      }
      case "correctionStatus": {
        const pkg = cases.find(c => c.caseData.caseId === caseId);
        const category = pkg?.caseClassification?.caseCategory;
        const categoryReason = pkg?.caseClassification?.categoryReason || pkg?.recommendation.explanation;
        return (
          <div className={commonCls}>
            <div className={modalCls}>
              <h2 className="text-lg font-bold">{t.modalCorrectionTitle}</h2>
              <p className="text-sm font-semibold text-sakan-navy">{caseId}</p>
              {category && (
                <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg inline-block">
                  {category}
                </p>
              )}
              <p className="text-sm text-sakan-text/80 leading-relaxed">{categoryReason}</p>
              <p className="text-xs text-sakan-text/60 font-medium">
                {isAr
                  ? "لم يتم تحويل الطلب للموظف. ينتظر المستفيد تصحيح المستندات."
                  : "Case was not routed to officer. Awaiting beneficiary document correction."}
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={close} className={`${btnCls} bg-sakan-navy text-white hover:bg-sakan-navy/80`}>{t.modalCancel}</button>
              </div>
            </div>
          </div>
        );
      }
      case "reasonCodes": {
        const pkg = cases.find(c => c.caseData.caseId === caseId);
        const codes = pkg?.reasonCodes || [];
        return (
          <div className={commonCls}>
            <div className={modalCls}>
              <h2 className="text-lg font-bold">{t.modalReasonCodesTitle}</h2>
              <p className="text-sm font-semibold text-sakan-navy">{caseId}</p>
              <div className="flex flex-wrap gap-2">
                {codes.map((code: string) => (
                  <span key={code} className="text-xs font-mono bg-sakan-bg border border-sakan-border px-2.5 py-1 rounded-lg text-sakan-navy">
                    {code}
                  </span>
                ))}
              </div>
              <p className="text-xs text-sakan-text/60 font-medium">
                {isAr
                  ? "هذه الحالة لم تُحوَّل للموظف. النتيجة أُبلغت للمستفيد مباشرة."
                  : "This case was not routed to officer. Outcome was delivered directly to the beneficiary."}
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={close} className={`${btnCls} bg-sakan-navy text-white hover:bg-sakan-navy/80`}>{t.modalCancel}</button>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const openModal = (type: any, caseId: string) => {
    setModalCaseId(caseId);
    setModalType(type);
  };

  const officerQueue = filteredCases.filter(pkg =>
    getWorkloadGroup(pkg.recommendation.status, pkg.caseClassification?.caseCategory) === "officer_action"
  );

  const beneficiaryQueue = filteredCases.filter(pkg =>
    getWorkloadGroup(pkg.recommendation.status, pkg.caseClassification?.caseCategory) === "beneficiary_action"
  );

  const directOutcomeQueue = filteredCases.filter(pkg =>
    getWorkloadGroup(pkg.recommendation.status, pkg.caseClassification?.caseCategory) === "direct_outcome"
  );

  const renderCaseRow = (pkg: typeof cases[0], i: number, queueType: "officer_action" | "beneficiary_action" | "direct_outcome") => {
    const displayStatus = getWorkspaceDisplayStatus(pkg.caseData.caseId, pkg.recommendation.status, isAr);
    const isConfirmation = isReadyForConfirmationStatus(pkg.recommendation.status);
    const isHumanitarian = isHumanitarianReviewStatus(pkg.recommendation.status);
    return (
      <motion.div
        key={pkg.caseData.caseId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="bg-white border border-sakan-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row md:items-center gap-6"
      >
        <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs font-semibold text-sakan-text/50 uppercase tracking-wider mb-1">{t.caseId}</div>
            <div className="font-bold text-sakan-navy">{pkg.caseData.caseId}</div>
            <div className="text-sm mt-1 font-semibold text-sakan-navy mb-3">{pkg.caseData.beneficiaryName}</div>
            
            {/* Priority */}
            <div className="text-xs font-semibold text-sakan-text/50 uppercase tracking-wider mb-1 mt-2">{t.lblPriority}</div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${
                pkg.recommendation.priority === "Urgent" ? "bg-red-100 text-red-800 border-red-200" :
                pkg.recommendation.priority === "High" ? "bg-orange-100 text-orange-800 border-orange-200" :
                pkg.recommendation.priority === "Medium" ? "bg-blue-100 text-blue-800 border-blue-200" :
                "bg-gray-100 text-gray-800 border-gray-200"
              }`}>
                {pkg.recommendation.priority === "Urgent" ? t.priorityUrgent :
                 pkg.recommendation.priority === "High" ? t.priorityHigh :
                 pkg.recommendation.priority === "Medium" ? t.priorityMedium : t.priorityLow}
              </span>
              {pkg.recommendation.priority === "Urgent" && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">SLA: 2h</span>}
              {pkg.recommendation.priority === "High" && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">SLA: 24h</span>}
              {pkg.recommendation.priority === "Medium" && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">SLA: 48h</span>}
            </div>
          </div>
          <div className="md:col-span-2 space-y-3">
            <div>
              <div className="text-xs font-semibold text-sakan-text/50 uppercase tracking-wider mb-2">{t.aiRecommendation}</div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(pkg.recommendation.status)}`}>
                  {getStatusIcon(pkg.recommendation.status)}
                  {displayStatus}
                </span>
                <span className="text-sm font-medium text-sakan-navy bg-sakan-bg px-3 py-1 rounded-full border border-sakan-border">
                  {pkg.recommendation.resolutionPath}
                </span>
                {queueType === "beneficiary_action" && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {t.notOfficerWorkload}
                  </span>
                )}
                {queueType === "direct_outcome" && (
                  <span className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                    {isAr ? "لم يتم التوجيه للموظف" : "Not Routed to Officer"}
                  </span>
                )}
              </div>
            </div>
            
            {/* Priority Reason */}
            {pkg.recommendation.priorityReason && (
              <div className="text-xs">
                <span className="font-bold text-sakan-navy uppercase tracking-wider mr-1">{t.lblPriorityReason}:</span>
                <span className="text-sakan-text/80">{pkg.recommendation.priorityReason}</span>
              </div>
            )}

            <div className="bg-sakan-bg/70 p-2.5 rounded-lg border border-sakan-border/60 text-xs mt-2">
              <div className="font-bold text-sakan-navy uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-sakan-gold shrink-0" />
                {t.lblNextBestActionLbl}
              </div>
              <p className="text-sakan-text/90 font-medium">{pkg.recommendation.nextBestAction}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-semibold text-sakan-text/50 uppercase tracking-wider">{t.confidence}</div>
              <div className={`text-sm font-bold ${pkg.recommendation.confidenceScore > 85 ? "text-sakan-success" : "text-sakan-warning"}`}> {pkg.recommendation.confidenceScore}% </div>
            </div>
            <div className="w-full bg-sakan-bg rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${pkg.recommendation.confidenceScore > 85 ? "bg-sakan-success" : "bg-sakan-warning"}`}
                style={{ width: `${pkg.recommendation.confidenceScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-sakan-border pt-4 md:pt-0 md:pl-6 w-full md:w-52">
          {queueType === "officer_action" && isConfirmation && (
            <>
              <Link href={`/officer/report/${pkg.caseData.caseId}`} className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-sakan-navy text-sakan-navy hover:bg-sakan-navy hover:text-white px-4 py-2 rounded-xl font-bold transition-all text-xs">
                {t.openConfirmationReport}
                <ChevronRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
              </Link>
              <button onClick={() => openModal("approve", pkg.caseData.caseId)} className="w-full inline-flex items-center justify-center bg-sakan-success/15 text-sakan-success hover:bg-sakan-success/25 px-4 py-1.5 rounded-xl font-bold transition-all text-xs border border-sakan-success/20 shadow-sm">
                {t.approveCase}
              </button>
            </>
          )}

          {queueType === "officer_action" && isHumanitarian && (
            <>
              <Link href={`/officer/report/${pkg.caseData.caseId}`} className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-sakan-navy text-sakan-navy hover:bg-sakan-navy hover:text-white px-4 py-2 rounded-xl font-bold transition-all text-xs">
                {t.openHumanReviewReport}
                <ChevronRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
              </Link>
              <button onClick={() => openModal("assignHuman", pkg.caseData.caseId)} className="w-full inline-flex items-center justify-center bg-sakan-danger/15 text-sakan-danger hover:bg-sakan-danger/25 px-4 py-1.5 rounded-xl font-bold transition-all text-xs border border-sakan-danger/20 shadow-sm">
                {t.assignSpecialist}
              </button>
              <button onClick={() => openModal("requestDoc", pkg.caseData.caseId)} className="w-full inline-flex items-center justify-center bg-sakan-warning/15 text-sakan-warning hover:bg-sakan-warning/25 px-4 py-1.5 rounded-xl font-bold transition-all text-xs border border-sakan-warning/20 shadow-sm">
                {t.requestMoreEvidence}
              </button>
            </>
          )}

          {queueType === "beneficiary_action" && (
            <>
              <button onClick={() => openModal("correctionStatus", pkg.caseData.caseId)} className="w-full inline-flex items-center justify-center bg-sakan-warning/15 text-sakan-warning hover:bg-sakan-warning/25 px-4 py-1.5 rounded-xl font-bold transition-all text-xs border border-sakan-warning/20 shadow-sm">
                {t.viewCorrectionStatus}
              </button>
              <button onClick={() => openModal("notify", pkg.caseData.caseId)} className="w-full inline-flex items-center justify-center bg-sakan-navy text-white hover:bg-sakan-navy/90 px-4 py-1.5 rounded-xl font-bold transition-all text-xs shadow-sm">
                {t.sendCorrectionNotice}
              </button>
            </>
          )}

          {queueType === "direct_outcome" && (
            <>
              <Link href={`/apply/result?caseId=${pkg.caseData.caseId}`} className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-sakan-navy text-sakan-navy hover:bg-sakan-navy hover:text-white px-4 py-2 rounded-xl font-bold transition-all text-xs">
                {t.viewBeneficiaryOutcome}
                <ChevronRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
              </Link>
              <button onClick={() => openModal("reasonCodes", pkg.caseData.caseId)} className="w-full inline-flex items-center justify-center bg-gray-100 text-sakan-navy hover:bg-gray-200 px-4 py-1.5 rounded-xl font-bold transition-all text-xs border border-gray-200 shadow-sm">
                {t.viewReasonCodes}
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-sakan-bg p-4 md:p-8 lg:p-12 pb-24 font-arabic-premium" dir={isAr ? "rtl" : "ltr"}>
      {isAr && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap');
            .font-arabic-premium, .font-arabic-premium * {
              font-family: 'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif !important;
              line-height: 1.6;
            }
            `,
          }}
        />
      )}

      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-sakan-navy text-white px-5 py-3 rounded-xl shadow-2xl border border-sakan-gold/40 flex items-center gap-3 animate-slide-in">
          <div className="w-2 h-2 rounded-full bg-sakan-gold animate-ping" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-sakan-navy text-white p-8 rounded-3xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20">
            <ShieldCheck className="w-8 h-8 text-sakan-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.officerWorkspace}</h1>
            <p className="text-white/70 mt-1">{t.reviewSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-sakan-border shadow-sm shrink-0">
          <Languages className="w-3.5 h-3.5 text-sakan-text/40" />
          <button
            onClick={() => setLanguage("EN")}
            className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all ${
              lang === "EN" ? "bg-sakan-navy text-white" : "text-sakan-navy/70 hover:bg-sakan-bg"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("AR")}
            className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all ${
              lang === "AR" ? "bg-sakan-navy text-white" : "text-sakan-navy/70 hover:bg-sakan-bg"
            }`}
          >
            AR
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
        {[
          { value: readyForConfirmationCount, label: t.metricReadyConfirm, color: "text-emerald-600" },
          { value: humanitarianReviewCount, label: t.metricHumanitarian, color: "text-sakan-danger" },
          { value: beneficiaryActionCases.length, label: t.metricAwaitingBeneficiary, color: "text-amber-600" },
          { value: directOutcomeCases.length, label: t.metricDirectOutcomes, color: "text-gray-600" },
          { value: workloadReducedCount, label: t.metricWorkloadReduced, color: "text-sakan-gold" },
        ].map((metric) => (
          <div key={metric.label} className="bg-white rounded-2xl p-4 border border-sakan-border shadow-sm text-center">
            <div className={`text-2xl font-black ${metric.color}`}>{metric.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-sakan-text/50 font-bold mt-1 leading-tight">{metric.label}</div>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl p-5 border border-sakan-border shadow-sm mt-4 flex gap-3 items-start">
        <div className="bg-sakan-gold/10 p-2 rounded-xl shrink-0">
          <Info className="w-5 h-5 text-sakan-gold" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-sakan-navy mb-1">{t.workloadExplainTitle}</h2>
          <p className="text-xs text-sakan-text/80 leading-relaxed font-medium">{t.workloadExplainText}</p>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sakan-text/40" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sakan-border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sakan-gold/50"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-sakan-border text-sakan-text font-medium hover:bg-sakan-bg transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            {t.filterCases}
          </button>
          {isFilterOpen && (
            <div className={`absolute mt-2 ${isAr ? "left-0" : "right-0"} w-64 bg-white border border-sakan-border rounded-xl shadow-lg z-10`}>
              <ul className="py-2">
                {FILTERS.map(f => (
                  <li
                    key={f.id}
                    className={`px-4 py-2 cursor-pointer hover:bg-sakan-bg ${activeFilterId === f.id ? "bg-sakan-bg/50 font-semibold" : ""}`}
                    onClick={() => {
                      setActiveFilterId(f.id);
                      setIsFilterOpen(false);
                    }}
                  >
                    {isAr ? f.ar : f.en}
                  </li>
                ))}
                {activeFilterId !== "all" && (
                  <li
                    className="px-4 py-2 cursor-pointer text-red-500 hover:bg-sakan-bg"
                    onClick={() => {
                      setActiveFilterId("all");
                      setIsFilterOpen(false);
                    }}
                  >
                    {t.clearFilter}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {filteredCases.length === 0 && (
          <div className="text-center text-gray-500 py-10 bg-white border border-sakan-border rounded-2xl shadow-sm">{t.emptyState}</div>
        )}
        
        {filteredCases.length > 0 && (
          <>
            {officerQueue.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-sakan-navy uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t.groupOfficerAction}
                  <span className="text-xs bg-sakan-navy/5 text-sakan-navy px-2 py-0.5 rounded-full border border-sakan-navy/10 font-bold ml-1">
                    {officerQueue.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {officerQueue.map((pkg, i) => renderCaseRow(pkg, i, "officer_action"))}
                </div>
              </div>
            )}

            {beneficiaryQueue.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {t.groupBeneficiaryAction}
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-bold ml-1">
                    {beneficiaryQueue.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {beneficiaryQueue.map((pkg, i) => renderCaseRow(pkg, i, "beneficiary_action"))}
                </div>
              </div>
            )}

            {directOutcomeQueue.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  {t.groupDirectOutcomes}
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-bold ml-1">
                    {directOutcomeQueue.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {directOutcomeQueue.map((pkg, i) => renderCaseRow(pkg, i, "direct_outcome"))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Render Modals */}
      {renderModal()}
    </div>
  );
}
    
