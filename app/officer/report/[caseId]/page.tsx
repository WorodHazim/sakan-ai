"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_CASES } from "@/lib/mock-data";
import { runDecisionAgent } from "@/lib/agent-rules";
import { useDemo } from "@/lib/demo-context";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquareWarning,
  User,
  FileText,
  Calculator,
  ShieldAlert,
  BrainCircuit,
  MessageCircle,
  Copy,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Download,
  AlertOctagon,
  Languages,
  X,
  Loader2,
  ListOrdered,
  Smartphone,
  Mail,
  Send,
  FileArchive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US')}`;
}

const CONFIDENCE_VALUES: Record<string, { doc: number; fin: number; policy: number; overall: number }> = {
  "CASE-A": { doc: 94, fin: 92, policy: 96, overall: 94 },
  "CASE-B": { doc: 72, fin: 61, policy: 78, overall: 58 },
  "CASE-C": { doc: 89, fin: 84, policy: 70, overall: 72 },
};

const NEXT_BEST_ACTIONS: Record<string, string> = {
  "CASE-A": "Generate updated repayment schedule and notify beneficiary.",
  "CASE-B": "Request updated salary certificate and bank statement clarification.",
  "CASE-C": "Assign case to senior officer for manual review.",
};

const NEXT_BEST_ACTIONS_AR: Record<string, string> = {
  "CASE-A": "تحديث جدول السداد وإرسال إشعار للمتعامل.",
  "CASE-B": "طلب شهادة راتب محدثة وتوضيح كشف الحساب البنكي.",
  "CASE-C": "إسناد الحالة إلى موظف إسكان أول للمراجعة اليدوية.",
};

const BENEFICIARY_EXPLANATION: Record<string, { en: string; ar: string }> = {
  "CASE-A": {
    en: "Your request is eligible for fast-track approval because your documents are valid and the proposed deduction remains within the allowed limit.",
    ar: "طلبكم مؤهل للموافقة المبدئية السريعة لأن المستندات صحيحة، ولا يوجد طلب نشط، ومبلغ الاستقطاع المقترح ضمن الحد المسموح.",
  },
  "CASE-B": {
    en: "Your request cannot continue yet because the salary certificate is expired and the income values do not match the bank transfer history. Please provide updated documents.",
    ar: "لا يمكن استكمال الطلب حالياً بسبب انتهاء صلاحية شهادة الراتب ووجود اختلاف بين بيانات الدخل وكشف الحساب البنكي. يرجى تزويدنا بمستندات محدثة.",
  },
  "CASE-C": {
    en: "Your request requires specialist review because an active request already exists and your financial obligations are high. A human officer will review the case.",
    ar: "يتطلب طلبكم مراجعة مختص بسبب وجود طلب نشط وارتفاع الالتزامات المالية. سيتم تحويل الحالة إلى موظف مختص للمراجعة.",
  },
};

const T = {
  EN: {
    backToWorkspace: "Back to Workspace",
    reportLabel: "SAKAN Decision Agent — Report",
    rulesEngineDecision: "⚙ Rules Engine Decision",
    resolutionPath: "Resolution Path",
    overallAssessment: "Overall Assessment",
    exportReport: "Export Report",
    whyThisRec: "Why This Recommendation?",
    llmGen: "LLM-Generated Explanation",
    nextBestAction: "Next Best Action",
    whatThisMeans: "What this means for the beneficiary",
    caseSummary: "Case Summary",
    beneficiary: "Beneficiary",
    loanId: "Loan ID",
    paymentHistory: "Payment History",
    remBalance: "Remaining Balance",
    arrearsAmount: "Arrears Amount",
    unpaidInst: "Unpaid Installments",
    currInst: "Current Installment",
    remTerm: "Remaining Term",
    finAnalysis: "Financial Analysis",
    monthlyIncome: "Monthly Income",
    monthlyObligations: "Monthly Obligations",
    obligationsRatio: "Obligations Ratio",
    familyMembers: "Family Members",
    incomePerMember: "Income Per Member",
    cap20: "20% Deduction Cap",
    policyRulesApplied: "Policy Rules Applied",
    proposedPlan: "Proposed Rescheduling Plan",
    capMax: "20% Cap (Max)",
    arrearsDed: "Arrears Deduction",
    newTotalInst: "New Total Installment",
    arrearsDuration: "Arrears Duration",
    durCompliance: "Duration Compliance",
    withinTerm: "Within remaining term",
    exceedsTerm: "Exceeds remaining term",
    noPlanGen: "No automated rescheduling plan was generated because policy conflict requires human officer review.",
    confBreakdown: "📊 Confidence Breakdown",
    docConf: "Document Confidence",
    finConf: "Financial Data Confidence",
    polConf: "Policy Match Confidence",
    overallAss: "Overall Assessment",
    officerQuickDecisions: "⚡ Officer Quick Decisions",
    officerNoteTitle: "Officer Note",
    enterNote: "Enter review notes here...",
    saveNote: "Save Note",
    lastSaved: "Last saved at",
    govGuardrail: "Governance Guardrail",
    govDesc: "Rules Engine generates the recommendation. LLM explains the outcome. Human officers review exceptions. All actions are logged.",
    docValidation: "Document Validation",
    salaryCert: "Salary Certificate",
    compLetterhead: "Company Letterhead",
    authSignature: "Authorized Signature",
    empDetailsMatch: "Employee Details Match",
    issueDate30: "Issue Date (30-Day Validity)",
    extracted: "Extracted",
    conf: "Conf.",
    bankCrossCheck: "Bank Statement Cross-Check",
    certAmount: "Cert. Amount",
    avgTransfer: "6-Mo. Avg Transfer",
    consistency: "Consistency",
    medDoc: "Medical Document",
    recProvider: "Recognized Provider",
    qrVerified: "Digital QR Verified",
    issueDateValid: "Issue Date Valid",
    hrStatus: "Human Review Status",
    hrRequired: "Human Review Required",
    hrWaitClarification: "Awaiting Applicant Clarification",
    hrApproved: "Approved — No Officer Action Required",
    triggerMap: "Trigger Map",
    smartComm: "Smart Communication",
    auditTrail: "Audit Trail",
    viewFullAudit: "View Full Audit Trail",
    months: "months",
    
    statusApproved: "Approved",
    statusAddInfoReq: "Additional Information Required",
    statusHumanReviewReq: "Human Review Required",
    statusRejected: "Rejected",

    btnApproveRec: "Approve Recommendation",
    btnApproveRecLoading: "Approving...",
    btnApproveRecDone: "Recommendation Approved",
    statusOfficerApproved: "Officer Approved Recommendation",
    auditOfficerApproved: "Officer approved recommendation",
    toastOfficerApproved: "Recommendation approved and recorded in audit trail.",
    
    btnSendNotify: "Send Beneficiary Notification",
    modalNotifyTitle: "Beneficiary Notification",
    modalCancel: "Cancel",
    btnSendNotification: "Send Notification",
    btnSendNotificationLoading: "Sending...",
    btnSendNotificationDone: "Notification Sent",
    auditNotifySent: "Beneficiary notification sent",

    btnSendDocReq: "Send Document Request",
    modalDocReqTitle: "Request Additional Documents",
    docReqText: "Please upload an updated salary certificate and clarify the bank transfer discrepancy.",
    docReqTextAr: "يرجى رفع شهادة راتب محدثة وتوضيح الاختلاف في التحويل البنكي.",
    btnSendRequest: "Send Request",
    statusWaitingDocs: "Waiting for Applicant Documents",
    auditDocReqSent: "Additional document request sent",

    btnMarkWait: "Mark as Waiting",
    statusWaitingApp: "Waiting for Applicant",
    auditMarkWait: "Case marked as waiting for applicant response",

    btnAssignHuman: "Assign to Human Officer",
    modalAssignTitle: "Assign Case to Officer",
    assignOpt1: "Senior Housing Officer",
    assignOpt2: "Finance Review Officer",
    assignOpt3: "Exception Committee",
    assignComment: "Assignment comment (optional)",
    btnConfirmAssign: "Confirm Assignment",
    statusAssignedSnr: "Assigned to Senior Officer",
    auditAssignedHuman: "Case assigned to human officer",

    btnGoToNote: "Go to Officer Note",

    btnSaveNoteLoading: "Saving...",
    btnSaveNoteDone: "Saved",
    auditNoteSaved: "Officer note saved",

    auditReportExported: "Decision report exported",
    toastReportExported: "Decision report exported successfully.",

    modalAuditTitle: "Full Audit Trail",

    // Export Modal
    modalExportTitle: "Official Decision Report Preview",
    modalExportSubtitle: "Government-grade decision package generated for audit and review.",
    btnGeneratePdf: "Generate PDF",
    btnGeneratingPdf: "Generating PDF...",
    btnDownloadPdf: "Download / Print PDF",

    // Smart Comm additions
    btnCopyAr: "Copy Arabic",
    btnCopyEn: "Copy English",
    btnSendSms: "Send SMS",
    btnSendEmail: "Send Email",
    btnMarkNotifySent: "Mark Notification Sent",
    toastArCopied: "Arabic message copied.",
    toastEnCopied: "English message copied.",
    modalSmsTitle: "Send SMS to Beneficiary",
    modalEmailTitle: "Send Email to Beneficiary",
    btnSendingSms: "Sending SMS...",
    btnSmsSent: "SMS sent successfully.",
    btnSendingEmail: "Sending Email...",
    btnEmailSent: "Email sent successfully.",
    toastNotifyMarkedSent: "Notification sent successfully.",
    auditSmsSent: "SMS notification sent",
    auditEmailSent: "Email notification sent",
    auditNotifyMarkedSent: "Beneficiary notification marked as sent",
    
    // PDF Modal details
    lblCaseId: "Case ID",
    lblBeneficiary: "Beneficiary",
    lblRecommendation: "Recommendation",
    lblConfidence: "Confidence",
    lblReasonCodes: "Reason Codes",
    lblFinSummary: "Financial Summary",
    lblNextAction: "Next Best Action",
    lblOfficerAction: "Officer Action",
    lblSecHash: "Security Hash",
    lblGeneratedAt: "Generated At",
    lblPending: "Pending",
    // Decision Sandbox
    lblSandboxTitle: "Decision Sandbox",
    lblSandboxSubtitle: "Test how policy inputs affect the recommendation in real time.",
    lblMonthlyIncome: "Monthly Income",
    lblFinancialObligations: "Financial Obligations",
    lblFamilyMembers: "Family Members",
    lblCurrentInstallment: "Current Installment",
    lblArrearsAmount: "Arrears Amount",
    lblRemainingRepaymentMonths: "Remaining Repayment Months",
    lblActiveRequest: "Active Request",
    lblSalaryCertificateStatus: "Salary Certificate Status",
    lblSalaryCertificateAmount: "Salary Certificate Amount",
    lblBankAverageTransfer: "Bank Average Transfer",
    btnRerunDecision: "Re-run Decision Agent",
    lblSandboxDisclaimer: "This sandbox is for demo and officer testing. In production, these values would come from verified government, loan, document, and financial data sources.",
    lblDecisionTrace: "Decision Trace",
    lblStep: "Step",
    lblEvidenceUsed: "Evidence Used",
    lblRuleApplied: "Rule Applied",
    lblResult: "Result",
    lblReasonCode: "Reason Code",
    // Humanitarian Review
    lblHumanitarianTrigger: "Humanitarian Review Trigger",
    lblHumIncome: "Income per family member below AED 3,000",
    lblHumObligations: "Obligations exceed 60%",
    lblHumActiveReq: "Active request found",
    lblHumCircumstance: "Supporting circumstance detected",
    lblHumRejectionBlocked: "Automatic rejection blocked due to vulnerability"
  },
  AR: {
    backToWorkspace: "العودة إلى مساحة العمل",
    reportLabel: "وكيل قرار سكن — تقرير",
    rulesEngineDecision: "⚙ قرار محرك القواعد",
    resolutionPath: "مسار المعالجة",
    overallAssessment: "التقييم الشامل",
    exportReport: "تصدير التقرير",
    whyThisRec: "لماذا هذه التوصية؟",
    llmGen: "تفسير مولد بالذكاء الاصطناعي",
    nextBestAction: "الإجراء التالي الأفضل",
    whatThisMeans: "ماذا يعني هذا للمتعامل؟",
    caseSummary: "ملخص الحالة",
    beneficiary: "المتعامل",
    loanId: "رقم القرض",
    paymentHistory: "سجل المدفوعات",
    remBalance: "الرصيد المتبقي",
    arrearsAmount: "مبلغ المتأخرات",
    unpaidInst: "الأقساط غير المدفوعة",
    currInst: "القسط الحالي",
    remTerm: "المدة المتبقية",
    finAnalysis: "التحليل المالي",
    monthlyIncome: "الدخل الشهري",
    monthlyObligations: "الالتزامات الشهرية",
    obligationsRatio: "نسبة الالتزامات",
    familyMembers: "أفراد الأسرة",
    incomePerMember: "الدخل لكل فرد",
    cap20: "سقف الاستقطاع ٢٠٪",
    policyRulesApplied: "قواعد السياسة المطبقة",
    proposedPlan: "خطة إعادة الجدولة المقترحة",
    capMax: "سقف ٢٠٪ (الأقصى)",
    arrearsDed: "استقطاع المتأخرات",
    newTotalInst: "إجمالي القسط الجديد",
    arrearsDuration: "مدة سداد المتأخرات",
    durCompliance: "توافق المدة",
    withinTerm: "ضمن المدة المتبقية",
    exceedsTerm: "يتجاوز المدة المتبقية",
    noPlanGen: "لم يتم إنشاء خطة جدولة آلية بسبب تعارض مع السياسة يتطلب مراجعة بشرية.",
    confBreakdown: "📊 تفصيل مستوى الثقة",
    docConf: "ثقة المستندات",
    finConf: "ثقة البيانات المالية",
    polConf: "ثقة مطابقة السياسة",
    overallAss: "التقييم الشامل",
    officerQuickDecisions: "⚡ إجراءات الموظف السريعة",
    officerNoteTitle: "ملاحظة الموظف",
    enterNote: "أدخل ملاحظات المراجعة هنا...",
    saveNote: "حفظ الملاحظة",
    lastSaved: "آخر حفظ في",
    govGuardrail: "ضوابط الحوكمة",
    govDesc: "محرك القواعد يصدر التوصية، والذكاء الاصطناعي يشرح النتيجة، والموظف يراجع الحالات الاستثنائية، ويتم توثيق جميع الإجراءات.",
    docValidation: "التحقق من المستندات",
    salaryCert: "شهادة الراتب",
    compLetterhead: "ترويسة جهة العمل",
    authSignature: "التوقيع المعتمد",
    empDetailsMatch: "مطابقة بيانات الموظف",
    issueDate30: "تاريخ الإصدار (صلاحية 30 يوماً)",
    extracted: "المستخرج",
    conf: "الثقة",
    bankCrossCheck: "مطابقة كشف الحساب البنكي",
    certAmount: "مبلغ الشهادة",
    avgTransfer: "متوسط تحويل 6 أشهر",
    consistency: "الاتساق",
    medDoc: "المستند الطبي",
    recProvider: "جهة طبية معتمدة",
    qrVerified: "تم التحقق من الرمز الرقمي",
    issueDateValid: "تاريخ الإصدار صالح",
    hrStatus: "حالة المراجعة البشرية",
    hrRequired: "مطلوب مراجعة بشرية",
    hrWaitClarification: "بانتظار توضيح من المتعامل",
    hrApproved: "مقبول — لا يتطلب إجراء من الموظف",
    triggerMap: "خريطة المؤشرات",
    smartComm: "التواصل الذكي",
    auditTrail: "سجل التدقيق",
    viewFullAudit: "عرض سجل التدقيق الكامل",
    months: "أشهر",
    
    statusApproved: "مقبول مبدئياً",
    statusAddInfoReq: "مطلوب مستندات إضافية",
    statusHumanReviewReq: "يتطلب مراجعة بشرية",
    statusRejected: "مرفوض",

    btnApproveRec: "اعتماد التوصية",
    btnApproveRecLoading: "جاري اعتماد التوصية...",
    btnApproveRecDone: "تم اعتماد التوصية",
    statusOfficerApproved: "تم اعتماد التوصية من الموظف",
    auditOfficerApproved: "تم اعتماد التوصية من الموظف",
    toastOfficerApproved: "تم اعتماد التوصية وتسجيل الإجراء في سجل التدقيق.",
    
    btnSendNotify: "إرسال إشعار للمتعامل",
    modalNotifyTitle: "إشعار المتعامل",
    modalCancel: "إلغاء",
    btnSendNotification: "إرسال الإشعار",
    btnSendNotificationLoading: "جاري الإرسال...",
    btnSendNotificationDone: "تم إرسال الإشعار",
    auditNotifySent: "تم إرسال إشعار المتعامل",

    btnSendDocReq: "إرسال طلب مستندات",
    modalDocReqTitle: "طلب مستندات إضافية",
    docReqText: "Please upload an updated salary certificate and clarify the bank transfer discrepancy.",
    docReqTextAr: "يرجى رفع شهادة راتب محدثة وتوضيح الاختلاف في التحويل البنكي.",
    btnSendRequest: "إرسال الطلب",
    statusWaitingDocs: "بانتظار مستندات المتعامل",
    auditDocReqSent: "تم إرسال طلب مستندات إضافية",

    btnMarkWait: "الوضع في الانتظار",
    statusWaitingApp: "بانتظار رد المتعامل",
    auditMarkWait: "تم وضع الحالة بانتظار رد المتعامل",

    btnAssignHuman: "إسناد إلى موظف مختص",
    modalAssignTitle: "إسناد الحالة إلى موظف مختص",
    assignOpt1: "موظف إسكان أول",
    assignOpt2: "موظف مراجعة مالية",
    assignOpt3: "لجنة الحالات الاستثنائية",
    assignComment: "تعليق الإسناد (اختياري)",
    btnConfirmAssign: "تأكيد الإسناد",
    statusAssignedSnr: "تم إسناد الحالة إلى موظف أول",
    auditAssignedHuman: "تم إسناد الحالة إلى موظف مختص",

    btnGoToNote: "الانتقال إلى ملاحظة الموظف",

    btnSaveNoteLoading: "جاري الحفظ...",
    btnSaveNoteDone: "تم الحفظ",
    auditNoteSaved: "تم حفظ ملاحظة الموظف",

    auditReportExported: "تم تصدير تقرير القرار",
    toastReportExported: "تم تصدير تقرير القرار بنجاح.",

    modalAuditTitle: "سجل التدقيق الكامل",

    // Export Modal
    modalExportTitle: "معاينة تقرير القرار الرسمي",
    modalExportSubtitle: "حزمة قرار رسمية تم إنشاؤها لأغراض التدقيق والمراجعة",
    btnGeneratePdf: "إنشاء ملف PDF",
    btnGeneratingPdf: "جاري إنشاء ملف PDF...",
    btnDownloadPdf: "تنزيل / طباعة PDF",

    // Smart Comm additions
    btnCopyAr: "نسخ الرسالة العربية",
    btnCopyEn: "نسخ الرسالة الإنجليزية",
    btnSendSms: "إرسال رسالة نصية",
    btnSendEmail: "إرسال بريد إلكتروني",
    btnMarkNotifySent: "تأكيد إرسال الإشعار",
    toastArCopied: "تم نسخ الرسالة العربية",
    toastEnCopied: "تم نسخ الرسالة الإنجليزية",
    modalSmsTitle: "إرسال رسالة نصية للمتعامل",
    modalEmailTitle: "إرسال بريد إلكتروني للمتعامل",
    btnSendingSms: "جاري إرسال الرسالة النصية...",
    btnSmsSent: "تم إرسال الرسالة النصية بنجاح.",
    btnSendingEmail: "جاري إرسال البريد الإلكتروني...",
    btnEmailSent: "تم إرسال البريد الإلكتروني بنجاح.",
    toastNotifyMarkedSent: "تم تأكيد إرسال إشعار المتعامل",
    auditSmsSent: "تم إرسال إشعار عبر الرسائل النصية",
    auditEmailSent: "تم إرسال إشعار عبر البريد الإلكتروني",
    auditNotifyMarkedSent: "تم تأكيد إرسال إشعار المتعامل",

    // PDF Modal details
    lblCaseId: "رقم الحالة",
    lblBeneficiary: "المتعامل",
    lblRecommendation: "التوصية",
    lblConfidence: "نسبة الثقة",
    lblReasonCodes: "رموز الأسباب",
    lblFinSummary: "الملخص المالي",
    lblNextAction: "الإجراء التالي الأفضل",
    lblOfficerAction: "إجراء الموظف",
    lblSecHash: "الرمز الأمني",
    lblGeneratedAt: "تاريخ الإنشاء",
    lblPending: "قيد الانتظار",
    // Decision Sandbox
    lblSandboxTitle: "محاكي القرار",
    lblSandboxSubtitle: "اختبر كيف تؤثر بيانات الحالة على التوصية بشكل مباشر.",
    lblMonthlyIncome: "الدخل الشهري",
    lblFinancialObligations: "الالتزامات المالية",
    lblFamilyMembers: "عدد أفراد الأسرة",
    lblCurrentInstallment: "القسط الحالي",
    lblArrearsAmount: "مبلغ المتأخرات",
    lblRemainingRepaymentMonths: "مدة السداد المتبقية",
    lblActiveRequest: "طلب نشط",
    lblSalaryCertificateStatus: "حالة شهادة الراتب",
    lblSalaryCertificateAmount: "مبلغ شهادة الراتب",
    lblBankAverageTransfer: "متوسط التحويل البنكي",
    btnRerunDecision: "إعادة تشغيل وكيل القرار",
    lblSandboxDisclaimer: "هذا المحاكي مخصص للعرض واختبار الموظف. في البيئة الفعلية، يتم استرجاع هذه البيانات من مصادر حكومية ومالية ومستندية موثوقة.",
    lblDecisionTrace: "مسار القرار",
    lblStep: "الخطوة",
    lblEvidenceUsed: "الدليل المستخدم",
    lblRuleApplied: "القاعدة المطبقة",
    lblResult: "النتيجة",
    lblReasonCode: "كود السبب",
    // Humanitarian Review
    lblHumanitarianTrigger: "مؤشر مراجعة إنسانية",
    lblHumIncome: "دخل الفرد أقل من 3,000 درهم",
    lblHumObligations: "الالتزامات تتجاوز 60%",
    lblHumActiveReq: "يوجد طلب نشط",
    lblHumCircumstance: "تم رصد ظرف داعم",
    lblHumRejectionBlocked: "تم منع الرفض الآلي بسبب مؤشرات الضعف"
  }
} as const;

type LangKey = keyof typeof T;

export default function DecisionReportPage({
  params,
}: {
  params: React.ComponentProps<any>["params"];
}) {
  const resolvedParams = React.use<{ caseId: string }>(params);
  const caseId = resolvedParams.caseId;
  const caseData = MOCK_CASES[caseId];

  if (!caseData) return notFound();

  const {
    language,
    setLanguage,
    caseNotes,
    saveCaseNote,
    customAuditLogs,
    addAuditLog,
    caseStatuses,
    updateCaseStatus,
  } = useDemo();

  const lang = language as LangKey;
  const isAr = lang === "AR";
  const t = T[lang];

  const [noteText, setNoteText] = useState(caseNotes[caseId] || "");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  // Interactive States
  const [modalType, setModalType] = useState<"notify" | "requestDoc" | "assignOfficer" | "audit" | "export" | "sms" | "email" | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [exportState, setExportState] = useState<"idle" | "generating" | "ready" | "exported">("idle");
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  
  // Section inline confirmations
  const [inlineFeedback, setInlineFeedback] = useState<Record<string, string>>({});

  // Assign modal state
  const [assignOfficer, setAssignOfficer] = useState("Senior Housing Officer");
  const [assignComment, setAssignComment] = useState("");

  // Audit Trail UI state
  const [auditFilter, setAuditFilter] = useState<string>('All');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const actionTranslationsAr: Record<string, string> = {};
  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };
  const handleExportCsv = () => {
    const headers = ['Timestamp','Actor','Action','Result','Case ID','Reason Code','Channel','System Note'];
    const rows = combinedAuditTrail.map(ev => [
      ev.timestamp,
      ev.actor,
      ev.action,
      ev.result,
      ev.caseId || '-',
      ev.reasonCode || '-',
      ev.channel || '-',
      ev.systemNote || '-'
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_${caseId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const exportHash = React.useMemo(() => "SHA256-" + (Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)).toUpperCase(), []);

  const noteCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [sandboxMode, setSandboxMode] = useState(false);
  const [sandboxData, setSandboxData] = useState({ ...caseData });
  const [sandboxReport, setSandboxReport] = useState<any>(null);

  const handleRunSandbox = () => {
    setSandboxMode(true);
    setSandboxReport(runDecisionAgent(sandboxData));
    addAuditLog(caseId, {
      timestamp: new Date().toISOString(),
      actor: "Officer",
      action: isAr ? "تمت إعادة تشغيل محاكي القرار بواسطة الموظف" : "Decision sandbox re-run by officer",
      result: "Success",
    });
    showToast(isAr ? "تمت إعادة تشغيل محاكي القرار بنجاح" : "Decision sandbox re-run successfully.");
  };

  const currentCaseData = sandboxMode && sandboxReport ? sandboxReport.caseData : caseData;
  const report = sandboxMode && sandboxReport ? sandboxReport : runDecisionAgent(caseData);

  const combinedAuditTrail = [
    ...report.auditTrail,
    ...(customAuditLogs[caseId] || []),
  ];

  const currentStatus = caseStatuses[caseId] || report.recommendation.status;
  const confidenceData = CONFIDENCE_VALUES[caseId] || { doc: 90, fin: 90, policy: 90, overall: 90 };
  const explanationText = BENEFICIARY_EXPLANATION[caseId] || { en: "", ar: "" };

  const getStatusColor = (status: string) => {
    const raw = status;
    if (raw.includes("Approved") || raw.includes("مقبول") || raw.includes("اعتماد")) return "bg-sakan-success/10 text-sakan-success border-sakan-success/20";
    if (raw.includes("Required") || raw.includes("Waiting") || raw.includes("بانتظار") || raw.includes("مطلوب")) return "bg-sakan-warning/10 text-sakan-warning border-sakan-warning/20";
    if (raw.includes("Assigned") || raw.includes("إسناد") || raw.includes("Rejected") || raw.includes("مرفوض")) return "bg-sakan-danger/10 text-sakan-danger border-sakan-danger/20";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    const raw = status;
    if (raw.includes("Approved") || raw.includes("مقبول") || raw.includes("اعتماد")) return <CheckCircle2 className="w-7 h-7" />;
    if (raw.includes("Required") || raw.includes("Waiting") || raw.includes("بانتظار") || raw.includes("مطلوب")) return <Clock className="w-7 h-7" />;
    if (raw.includes("Assigned") || raw.includes("إسناد") || raw.includes("Rejected") || raw.includes("مرفوض")) return <AlertTriangle className="w-7 h-7" />;
    return <FileText className="w-7 h-7" />;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const setFeedback = (section: string, msg: string) => {
    setInlineFeedback(prev => ({ ...prev, [section]: msg }));
  };

  const executeAction = (actionKey: string, auditTextEn: string, auditTextAr: string, newStatusEn?: string, newStatusAr?: string, callback?: () => void) => {
    if (completedActions.has(actionKey)) return;
    setLoadingAction(actionKey);
    setTimeout(() => {
      // Add audit
      addAuditLog(caseId, {
        timestamp: new Date().toISOString(),
        actor: "Officer",
        action: isAr ? auditTextAr : auditTextEn,
        result: "Success",
      });
      // Update status if provided
      if (newStatusEn) {
        updateCaseStatus(caseId, isAr ? newStatusAr! : newStatusEn);
      }
      // Update UI state
      setLoadingAction(null);
      setCompletedActions(prev => new Set(prev).add(actionKey));
      if (callback) callback();
    }, 800);
  };

  // Action Handlers
  const handleApprove = () => {
    executeAction("approve", t.auditOfficerApproved, t.auditOfficerApproved, "Officer Approved Recommendation", t.statusOfficerApproved, () => {
      showToast(t.toastOfficerApproved);
    });
  };

  const handleSendNotification = () => {
    executeAction("notify", t.auditNotifySent, t.auditNotifySent, undefined, undefined, () => {
      setModalType(null);
      showToast(t.btnSendNotificationDone);
    });
  };

  const handleSendDocReq = () => {
    executeAction("docReq", t.auditDocReqSent, t.auditDocReqSent, "Waiting for Applicant Documents", t.statusWaitingDocs, () => {
      setModalType(null);
      showToast(t.statusWaitingDocs);
    });
  };

  const handleMarkWait = () => {
    executeAction("markWait", t.auditMarkWait, t.auditMarkWait, "Waiting for Applicant", t.statusWaitingApp, () => {
      showToast(t.statusWaitingApp);
    });
  };

  const handleAssignHuman = () => {
    executeAction("assign", t.auditAssignedHuman, t.auditAssignedHuman, "Assigned to Senior Officer", t.statusAssignedSnr, () => {
      setModalType(null);
      showToast(t.statusAssignedSnr);
    });
  };

  const handleSaveNote = () => {
    if (completedActions.has("saveNote")) return;
    setLoadingAction("saveNote");
    setTimeout(() => {
      saveCaseNote(caseId, noteText);
      addAuditLog(caseId, {
        timestamp: new Date().toISOString(),
        actor: "Officer",
        action: isAr ? t.auditNoteSaved : t.auditNoteSaved,
        result: "Success",
      });
      const time = new Date().toLocaleTimeString(isAr ? 'ar-AE' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(time);
      setFeedback("note", `${t.lastSaved} ${time}`);
      setLoadingAction(null);
      setCompletedActions(prev => new Set(prev).add("saveNote"));
      setTimeout(() => {
        setCompletedActions(prev => {
          const next = new Set(prev);
          next.delete("saveNote");
          return next;
        });
      }, 3000);
    }, 800);
  };

  const handleGoToNote = () => {
    if (noteCardRef.current) {
      noteCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      noteCardRef.current.classList.add("ring-2", "ring-sakan-gold", "transition-all", "duration-500");
      setTimeout(() => {
        noteCardRef.current?.classList.remove("ring-2", "ring-sakan-gold");
      }, 1000);
      document.getElementById("officerNoteInput")?.focus();
    }
  };

  const handleCopy = (text: string, type: "AR" | "EN") => {
    navigator.clipboard.writeText(text);
    if (type === "AR") showToast(t.toastArCopied);
    else showToast(t.toastEnCopied);
  };

  const handleSendSms = () => {
    executeAction("sendSms", t.auditSmsSent, t.auditSmsSent, undefined, undefined, () => {
      setModalType(null);
      setFeedback("comm", t.btnSmsSent);
    });
  };

  const handleSendEmail = () => {
    executeAction("sendEmail", t.auditEmailSent, t.auditEmailSent, undefined, undefined, () => {
      setModalType(null);
      setFeedback("comm", t.btnEmailSent);
    });
  };

  const handleMarkNotifySent = () => {
    executeAction("markNotify", t.auditNotifyMarkedSent, t.auditNotifyMarkedSent, undefined, undefined, () => {
      setFeedback("comm", t.toastNotifyMarkedSent);
    });
  };

  const handleGeneratePdf = () => {
    setExportState("generating");
    setTimeout(() => {
      setExportState("ready");
    }, 1000);
  };

  const handleDownloadPdf = () => {
    executeAction("exportPdf", t.auditReportExported, t.auditReportExported, undefined, undefined, () => {
      setModalType(null);
      setFeedback("export", t.toastReportExported);
      setExportState("exported");
      window.print();
    });
  };

  const getTranslatedStatus = (status: string) => {
    if (status === "Approved") return t.statusApproved;
    if (status === "Additional Information Required") return t.statusAddInfoReq;
    if (status === "Human Review Required") return t.statusHumanReviewReq;
    if (status === "Rejected") return t.statusRejected;
    return status;
  };

  return (
    <div 
      className={`min-h-screen bg-sakan-bg p-4 md:p-8 lg:p-12 pb-24 ${isAr ? "font-arabic-premium" : ""}`}
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

      <div className="max-w-7xl mx-auto space-y-8">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-sakan-navy text-white px-5 py-3 rounded-xl shadow-2xl border border-sakan-gold/40 flex items-center gap-3 animate-slide-in">
            <div className="w-2 h-2 rounded-full bg-sakan-gold animate-ping" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <Link href="/officer/workspace" className="inline-flex items-center gap-2 text-sakan-text/60 hover:text-sakan-navy font-medium transition-colors text-sm">
            <ArrowLeft className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} /> {t.backToWorkspace}
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-sakan-border shadow-sm">
              <Languages className="w-3.5 h-3.5 text-sakan-text/50" />
              <button
                onClick={() => setLanguage("EN")}
                className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${lang === "EN" ? "bg-sakan-navy text-white" : "text-sakan-navy hover:bg-sakan-bg"}`}
              >EN</button>
              <button
                onClick={() => setLanguage("AR")}
                className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${lang === "AR" ? "bg-sakan-navy text-white" : "text-sakan-navy hover:bg-sakan-bg"}`}
              >AR</button>
            </div>
            
            <div className="text-xs font-bold text-sakan-text/40 uppercase tracking-widest hidden md:block">
              {t.reportLabel} {caseId}
            </div>
          </div>
        </div>

        {/* Status Header */}
        <div className={`rounded-3xl p-8 border ${getStatusColor(currentStatus)} bg-white shadow-lg`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className={`p-3.5 rounded-2xl border ${getStatusColor(currentStatus)}`}>
                {getStatusIcon(currentStatus)}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider opacity-85 mb-2 bg-white/30 border border-current/20 px-2 py-1 rounded-md">
                  {t.rulesEngineDecision}
                </div>
                <h1 className="text-3xl font-bold mb-1">
                  {getTranslatedStatus(currentStatus)}
                </h1>
                <p className="text-sm opacity-70 font-medium mb-2">{t.resolutionPath}: {report.recommendation.resolutionPath}</p>
                <div className="flex gap-2 flex-wrap">
                  {report.reasonCodes.map(rc => (
                    <span key={rc} className="text-xs font-mono bg-white/60 px-2 py-1 rounded border border-current/20">
                      {rc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={`flex flex-col gap-3 shrink-0 ${isAr ? "items-start" : "items-end"}`}>
              <div className={`bg-white/50 p-4 rounded-xl border border-current/10 min-w-[150px] shadow-sm ${isAr ? "text-right" : "text-left"}`}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-60">{t.overallAssessment}</div>
                <div className="text-4xl font-black" dir="ltr">{confidenceData.overall}%</div>
              </div>
              <button
                onClick={() => setModalType("export")}
                className="flex items-center justify-center gap-1.5 bg-sakan-navy hover:bg-sakan-navy/90 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-md w-full"
              >
                <Download className="w-3.5 h-3.5" /> {t.exportReport}
              </button>
              {inlineFeedback["export"] && (
                <div className="text-[10px] font-bold text-sakan-success flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> {inlineFeedback["export"]}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Why This Recommendation & Next Best Action */}
            <div className="grid grid-cols-1 gap-6">
              <section className="bg-sakan-navy text-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-sakan-gold" /> {t.whyThisRec}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase text-sakan-gold bg-sakan-gold/10 px-2.5 py-1 rounded-md border border-sakan-gold/30">
                    <BrainCircuit className="w-3 h-3" /> {t.llmGen}
                  </span>
                </div>
                <p className="text-white/90 text-sm leading-7">{isAr ? explanationText.ar : report.recommendation.explanation}</p>
              </section>

              {/* Next Best Action Card */}
              <section className="bg-white rounded-2xl p-6 border-l-4 border-sakan-gold shadow-sm border border-sakan-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-sakan-gold/10 text-sakan-gold p-1.5 rounded-lg">
                    <ChevronRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                  </span>
                  <h3 className="font-bold text-sakan-navy text-sm uppercase tracking-wider">{t.nextBestAction}</h3>
                </div>
                <p className="text-sakan-navy text-sm font-semibold">{isAr ? NEXT_BEST_ACTIONS_AR[caseId] : NEXT_BEST_ACTIONS[caseId]}</p>
              </section>

              {/* Humanitarian Trigger Card */}
              {report.caseData.supportingCircumstance && (
                <section className="bg-sakan-danger/5 rounded-2xl p-6 border-l-4 border-sakan-danger shadow-sm border-t border-r border-b border-sakan-danger/20">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-sakan-danger" />
                    <h3 className="font-bold text-sakan-danger text-sm uppercase tracking-wider">{t.lblHumanitarianTrigger}</h3>
                  </div>
                  <ul className="space-y-2">
                    {report.financialCapacity.incomePerFamilyMember < 3000 && (
                      <li className="flex items-center gap-2 text-sm text-sakan-danger/90 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-sakan-danger shrink-0"></span> {t.lblHumIncome}
                      </li>
                    )}
                    {report.financialCapacity.obligationsRatio > 0.6 && (
                      <li className="flex items-center gap-2 text-sm text-sakan-danger/90 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-sakan-danger shrink-0"></span> {t.lblHumObligations}
                      </li>
                    )}
                    {report.caseData.activeRequest && (
                      <li className="flex items-center gap-2 text-sm text-sakan-danger/90 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-sakan-danger shrink-0"></span> {t.lblHumActiveReq}
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-sm text-sakan-danger/90 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-sakan-danger shrink-0"></span> {t.lblHumCircumstance}: {report.caseData.supportingCircumstance}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-sakan-danger/90 font-bold mt-2 pt-2 border-t border-sakan-danger/20">
                      <ShieldAlert className="w-4 h-4" /> {t.lblHumRejectionBlocked}
                    </li>
                  </ul>
                </section>
              )}
            </div>

            {/* What this means for the beneficiary */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
              <h2 className="text-base font-bold text-sakan-navy mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-sakan-gold" /> {t.whatThisMeans}
              </h2>
              <div className="bg-sakan-bg p-4 rounded-xl border border-sakan-border/60">
                <p className="text-sm leading-relaxed text-sakan-navy font-medium">
                  {isAr ? explanationText.ar : explanationText.en}
                </p>
              </div>
            </section>

            {/* Case Summary */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
              <h2 className="text-base font-bold text-sakan-navy mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-sakan-gold" /> {t.caseSummary}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
                <div><div className="text-xs text-sakan-text/40 uppercase font-bold mb-1">{t.beneficiary}</div><div className="font-semibold">{report.caseData.beneficiaryName}</div><div className="text-sakan-text/60 text-xs" dir="ltr">{report.caseData.beneficiaryId}</div></div>
                <div><div className="text-xs text-sakan-text/40 uppercase font-bold mb-1">{t.loanId}</div><div className="font-semibold" dir="ltr">{report.caseData.loanId}</div></div>
                <div><div className="text-xs text-sakan-text/40 uppercase font-bold mb-1">{t.paymentHistory}</div><div className="font-semibold">{report.caseData.paymentHistory}</div></div>

                <div className="col-span-full h-px bg-sakan-border/50" />

                <div><div className="text-xs text-sakan-text/40 uppercase font-bold mb-1">{t.remBalance}</div><div className="font-semibold" dir="ltr">{fmt(report.caseData.remainingLoanBalance)}</div></div>
                <div><div className="text-xs text-sakan-text/40 uppercase font-bold mb-1">{t.arrearsAmount}</div><div className="font-bold text-sakan-danger" dir="ltr">{fmt(report.caseData.arrearsAmount)}</div></div>
                <div><div className="text-xs text-sakan-text/40 uppercase font-bold mb-1">{t.unpaidInst}</div><div className="font-bold text-sakan-danger" dir="ltr">{report.caseData.unpaidInstallments}</div></div>
                <div><div className="text-xs text-sakan-text/40 uppercase font-bold mb-1">{t.currInst}</div><div className="font-semibold" dir="ltr">{fmt(report.caseData.currentInstallment)}</div></div>
                <div><div className="text-xs text-sakan-text/40 uppercase font-bold mb-1">{t.remTerm}</div><div className="font-semibold" dir="ltr">{report.caseData.remainingRepaymentMonths} {t.months}</div></div>
              </div>
            </section>

            {/* Financial Analysis & Policy Checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
                <h2 className="text-base font-bold text-sakan-navy mb-4 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-sakan-gold" /> {t.finAnalysis}
                </h2>
                <div className="space-y-3 text-sm">
                  {[
                    { label: t.monthlyIncome, val: fmt(report.financialCapacity.monthlyIncome) },
                    { label: t.monthlyObligations, val: fmt(report.caseData.financialObligations) },
                    { label: t.obligationsRatio, val: `${(report.financialCapacity.obligationsRatio * 100).toFixed(1)}%`, warn: report.financialCapacity.obligationsRatio > 0.6 },
                    { label: t.familyMembers, val: String(report.caseData.familyMembers) },
                    { label: t.incomePerMember, val: fmt(Math.round(report.financialCapacity.incomePerFamilyMember)), warn: report.financialCapacity.incomePerFamilyMember < 3000 },
                    { label: t.cap20, val: fmt(report.financialCapacity.max20PercentDeduction), highlight: true },
                  ].map(({ label, val, warn, highlight }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-sakan-border/30 last:border-0">
                      <span className="text-sakan-text/70">{label}</span>
                      <span className={`font-semibold ${warn ? "text-sakan-danger" : highlight ? "text-sakan-navy font-bold" : ""}`} dir="ltr">{val}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
                <h2 className="text-base font-bold text-sakan-navy mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-sakan-gold" /> {t.policyRulesApplied}
                </h2>
                <div className="space-y-2">
                  {report.policyRules.passedRules.map(rule => (
                    <div key={rule} className="flex items-start gap-2 p-2.5 rounded-lg bg-sakan-success/5 border border-sakan-success/10">
                      <CheckCircle2 className="w-4 h-4 text-sakan-success shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-sakan-success" dir="ltr">{rule}</span>
                    </div>
                  ))}
                  {report.policyRules.failedRules.map(rule => (
                    <div key={rule} className="flex items-start gap-2 p-2.5 rounded-lg bg-sakan-danger/5 border border-sakan-danger/10">
                      <AlertTriangle className="w-4 h-4 text-sakan-danger shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-sakan-danger" dir="ltr">{rule}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Proposed Plan */}
            <section className="bg-sakan-navy text-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-base font-bold mb-5 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-sakan-gold" /> {t.proposedPlan}
              </h2>
              {report.recommendation.proposedMonthlyDeduction ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <div className="text-xs text-white/40 uppercase font-bold mb-1">{t.capMax}</div>
                    <div className="text-base font-semibold" dir="ltr">{fmt(report.financialCapacity.max20PercentDeduction)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 uppercase font-bold mb-1">{t.currInst}</div>
                    <div className="text-base font-semibold" dir="ltr">{fmt(report.financialCapacity.currentInstallment)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-sakan-gold uppercase font-bold mb-1">{t.arrearsDed}</div>
                    <div className="text-base font-bold text-sakan-gold" dir="ltr">+ {fmt(report.financialCapacity.proposedArrearsPayment)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-sakan-success uppercase font-bold mb-1">{t.newTotalInst}</div>
                    <div className="text-xl font-black text-sakan-success" dir="ltr">{fmt(report.recommendation.proposedMonthlyDeduction)}</div>
                  </div>
                  <div className="col-span-full h-px bg-white/10" />
                  <div>
                    <div className="text-xs text-white/40 uppercase font-bold mb-1">{t.arrearsDuration}</div>
                    <div className="text-base font-semibold" dir="ltr">{report.recommendation.proposedDurationMonths} {t.months}</div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-xs text-white/40 uppercase font-bold mb-1">{t.durCompliance}</div>
                    <div className={`text-sm font-semibold inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-1 ${report.recommendation.proposedDurationMonths! <= report.caseData.remainingRepaymentMonths ? "bg-sakan-success/20 text-sakan-success" : "bg-sakan-danger/20 text-sakan-danger"}`}>
                      {report.recommendation.proposedDurationMonths! <= report.caseData.remainingRepaymentMonths
                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> {t.withinTerm}</>
                        : <><AlertTriangle className="w-3.5 h-3.5" /> {t.exceedsTerm}</>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-white/5 rounded-xl text-center border border-white/10">
                  <AlertTriangle className="w-7 h-7 text-sakan-warning mx-auto mb-2" />
                  <p className="text-white/95 text-sm leading-relaxed">
                    {t.noPlanGen}
                  </p>
                </div>
              )}
            </section>

            {/* Decision Sandbox */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
              <h2 className="text-base font-bold text-sakan-navy mb-2 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-sakan-gold" /> {t.lblSandboxTitle}
              </h2>
              <p className="text-xs text-sakan-text/70 mb-5">{t.lblSandboxSubtitle}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblMonthlyIncome}</label>
                  <input type="number" value={sandboxData.monthlyIncome} onChange={e => setSandboxData({...sandboxData, monthlyIncome: Number(e.target.value)})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblFinancialObligations}</label>
                  <input type="number" value={sandboxData.financialObligations} onChange={e => setSandboxData({...sandboxData, financialObligations: Number(e.target.value)})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblFamilyMembers}</label>
                  <input type="number" value={sandboxData.familyMembers} onChange={e => setSandboxData({...sandboxData, familyMembers: Number(e.target.value)})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblCurrentInstallment}</label>
                  <input type="number" value={sandboxData.currentInstallment} onChange={e => setSandboxData({...sandboxData, currentInstallment: Number(e.target.value)})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblArrearsAmount}</label>
                  <input type="number" value={sandboxData.arrearsAmount} onChange={e => setSandboxData({...sandboxData, arrearsAmount: Number(e.target.value)})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblRemainingRepaymentMonths}</label>
                  <input type="number" value={sandboxData.remainingRepaymentMonths} onChange={e => setSandboxData({...sandboxData, remainingRepaymentMonths: Number(e.target.value)})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblActiveRequest}</label>
                  <select value={sandboxData.activeRequest ? "Yes" : "No"} onChange={e => setSandboxData({...sandboxData, activeRequest: e.target.value === "Yes"})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr">
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblSalaryCertificateStatus}</label>
                  <select value={sandboxData.salaryCertificateExpired ? "Expired" : "Valid"} onChange={e => setSandboxData({...sandboxData, salaryCertificateExpired: e.target.value === "Expired"})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr">
                    <option value="Valid">Valid</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblSalaryCertificateAmount}</label>
                  <input type="number" value={sandboxData.salaryCertificateAmount} onChange={e => setSandboxData({...sandboxData, salaryCertificateAmount: Number(e.target.value)})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sakan-text/60 uppercase mb-1">{t.lblBankAverageTransfer}</label>
                  <input type="number" value={sandboxData.averageSalaryTransfer6Months} onChange={e => setSandboxData({...sandboxData, averageSalaryTransfer6Months: Number(e.target.value)})} className="w-full p-2 border border-sakan-border rounded bg-sakan-bg text-sm" dir="ltr" />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-4">
                <button
                  onClick={handleRunSandbox}
                  className="bg-sakan-navy text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-sakan-navy/90 transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Calculator className="w-4 h-4" /> {t.btnRerunDecision}
                </button>
                <p className="text-[10px] font-medium text-sakan-text/60 bg-sakan-bg p-2 rounded">
                  {t.lblSandboxDisclaimer}
                </p>
              </div>
            </section>

            {/* Decision Trace */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border overflow-hidden">
              <h2 className="text-base font-bold text-sakan-navy mb-4 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-sakan-gold" /> {t.lblDecisionTrace}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-sakan-border text-[10px] uppercase font-bold text-sakan-text/50">
                      <th className={`py-2 px-3 ${isAr ? "text-right" : "text-left"}`}>{t.lblStep}</th>
                      <th className={`py-2 px-3 ${isAr ? "text-right" : "text-left"}`}>{t.lblEvidenceUsed}</th>
                      <th className={`py-2 px-3 ${isAr ? "text-right" : "text-left"}`}>{t.lblRuleApplied}</th>
                      <th className={`py-2 px-3 ${isAr ? "text-right" : "text-left"}`}>{t.lblResult}</th>
                      <th className={`py-2 px-3 ${isAr ? "text-right" : "text-left"}`}>{t.lblReasonCode}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { step: 1, rule: "No Active Request", evidence: report.caseData.activeRequest ? "Active request found" : "No active request found", result: report.caseData.activeRequest ? "Failed" : "Passed", rc: report.caseData.activeRequest ? "RC-14" : "RC-02" },
                      { step: 2, rule: "Salary Certificate Validation", evidence: report.documentValidation.documentStatus === "Expired" ? "Salary certificate expired" : "Salary certificate valid", result: report.documentValidation.documentStatus === "Expired" ? "Failed" : "Passed", rc: report.documentValidation.documentStatus === "Expired" ? "RC-11" : "-" },
                      { step: 3, rule: "Income Matching", evidence: report.documentValidation.mismatch ? "Mismatched values" : "Values match", result: report.documentValidation.mismatch ? "Failed" : "Passed", rc: report.documentValidation.mismatch ? "RC-08" : "-" },
                      { step: 4, rule: "Bank Transfer Consistency", evidence: report.documentValidation.bankCrossCheck.consistencyResult, result: report.documentValidation.bankCrossCheck.consistencyResult === "Consistent" ? "Passed" : "Failed", rc: report.documentValidation.bankCrossCheck.consistencyResult === "Consistent" ? "-" : "RC-20" },
                      { step: 5, rule: "20% Deduction Cap", evidence: `Deduction: ${fmt(report.financialCapacity.proposedTotalDeduction)} / Cap: ${fmt(report.financialCapacity.max20PercentDeduction)}`, result: report.financialCapacity.proposedTotalDeduction <= report.financialCapacity.max20PercentDeduction ? "Passed" : "Failed", rc: report.financialCapacity.proposedTotalDeduction <= report.financialCapacity.max20PercentDeduction ? "RC-04" : "RC-05" },
                      { step: 6, rule: "Obligations Ratio ≤ 60%", evidence: `Ratio: ${(report.financialCapacity.obligationsRatio * 100).toFixed(1)}%`, result: report.financialCapacity.obligationsRatio <= 0.6 ? "Passed" : "Failed", rc: report.financialCapacity.obligationsRatio <= 0.6 ? "-" : "RC-12" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-sakan-border/50 last:border-0 text-xs">
                        <td className="py-2.5 px-3 font-semibold text-sakan-navy">{row.step}</td>
                        <td className="py-2.5 px-3 text-sakan-text/80">{row.evidence}</td>
                        <td className="py-2.5 px-3 text-sakan-text/80 font-medium">{row.rule}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.result === "Passed" ? "bg-sakan-success/10 text-sakan-success" :
                            "bg-sakan-danger/10 text-sakan-danger"
                          }`}>
                            {row.result}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-sakan-text/50" dir="ltr">
                          {row.rc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Decision Confidence Breakdown Card */}
            <div className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm space-y-4">
              <h3 className="font-bold text-sakan-navy text-sm uppercase tracking-wider flex items-center gap-2">
                {t.confBreakdown}
              </h3>
              <div className="space-y-3.5">
                {[
                  { label: t.docConf, val: confidenceData.doc },
                  { label: t.finConf, val: confidenceData.fin },
                  { label: t.polConf, val: confidenceData.policy },
                  { label: t.overallAss, val: confidenceData.overall, bold: true },
                ].map((item) => (
                  <div key={item.label} className={item.bold ? "pt-2 border-t border-sakan-border" : ""}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className={item.bold ? "text-sakan-navy font-bold" : "text-sakan-text/75"}>{item.label}</span>
                      <span className="text-sakan-navy font-extrabold" dir="ltr">{item.val}%</span>
                    </div>
                    <div className="w-full bg-sakan-bg rounded-full h-2 overflow-hidden" dir="ltr">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.val >= 85 ? "bg-sakan-success" : item.val >= 70 ? "bg-sakan-warning" : "bg-sakan-danger"
                        }`}
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Officer Action Buttons Card */}
            <div className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm space-y-4">
              <h3 className="font-bold text-sakan-navy text-sm uppercase tracking-wider flex items-center gap-2">
                {t.officerQuickDecisions}
              </h3>
              <div className="flex flex-col gap-2.5">
                {caseId === "CASE-A" && (
                  <>
                    <button
                      disabled={completedActions.has("approve")}
                      onClick={handleApprove}
                      className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 ${
                        completedActions.has("approve") ? "bg-sakan-success/20 text-sakan-success cursor-not-allowed" : "bg-sakan-success hover:bg-sakan-success/90 text-white"
                      }`}
                    >
                      {loadingAction === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {loadingAction === "approve" ? t.btnApproveRecLoading : completedActions.has("approve") ? t.btnApproveRecDone : t.btnApproveRec}
                    </button>
                    <button
                      disabled={completedActions.has("notify")}
                      onClick={() => setModalType("notify")}
                      className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 ${
                        completedActions.has("notify") ? "bg-sakan-navy/10 text-sakan-navy/50 cursor-not-allowed" : "bg-sakan-navy hover:bg-sakan-navy/90 text-white"
                      }`}
                    >
                      {completedActions.has("notify") ? <CheckCircle2 className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                      {completedActions.has("notify") ? t.btnSendNotificationDone : t.btnSendNotify}
                    </button>
                  </>
                )}

                {caseId === "CASE-B" && (
                  <>
                    <button
                      disabled={completedActions.has("docReq")}
                      onClick={() => setModalType("requestDoc")}
                      className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 ${
                        completedActions.has("docReq") ? "bg-sakan-warning/20 text-sakan-warning cursor-not-allowed" : "bg-sakan-warning text-sakan-navy hover:bg-sakan-warning/90"
                      }`}
                    >
                      {completedActions.has("docReq") ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      {completedActions.has("docReq") ? t.statusWaitingDocs : t.btnSendDocReq}
                    </button>
                    <button
                      disabled={completedActions.has("markWait")}
                      onClick={handleMarkWait}
                      className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 ${
                        completedActions.has("markWait") ? "bg-sakan-navy/10 text-sakan-navy/50 cursor-not-allowed" : "bg-sakan-navy hover:bg-sakan-navy/90 text-white"
                      }`}
                    >
                      {loadingAction === "markWait" ? <Loader2 className="w-4 h-4 animate-spin" /> : completedActions.has("markWait") ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {loadingAction === "markWait" ? t.btnApproveRecLoading : completedActions.has("markWait") ? t.statusWaitingApp : t.btnMarkWait}
                    </button>
                  </>
                )}

                {caseId === "CASE-C" && (
                  <>
                    <button
                      disabled={completedActions.has("assign")}
                      onClick={() => setModalType("assignOfficer")}
                      className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 ${
                        completedActions.has("assign") ? "bg-sakan-danger/20 text-sakan-danger cursor-not-allowed" : "bg-sakan-danger hover:bg-sakan-danger/90 text-white"
                      }`}
                    >
                      {completedActions.has("assign") ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                      {completedActions.has("assign") ? t.statusAssignedSnr : t.btnAssignHuman}
                    </button>
                    <button
                      onClick={handleGoToNote}
                      className="w-full bg-sakan-navy hover:bg-sakan-navy/90 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" /> {t.btnGoToNote}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Officer Note / Review Comment */}
            <section ref={noteCardRef} className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border space-y-3 scroll-mt-24">
              <h2 className="text-base font-bold text-sakan-navy flex items-center gap-2">
                <FileText className="w-4 h-4 text-sakan-gold" /> {t.officerNoteTitle}
              </h2>
              <textarea
                id="officerNoteInput"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t.enterNote}
                rows={4}
                className="w-full p-3 text-xs border border-sakan-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sakan-gold/50 resize-none bg-sakan-bg/30 text-sakan-navy font-medium"
              />
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-sakan-text/50 font-semibold">
                  {inlineFeedback["note"] || ""}
                </div>
                <button
                  disabled={loadingAction === "saveNote"}
                  onClick={handleSaveNote}
                  className="bg-sakan-navy hover:bg-sakan-navy/90 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {loadingAction === "saveNote" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : completedActions.has("saveNote") ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  {loadingAction === "saveNote" ? t.btnSaveNoteLoading : completedActions.has("saveNote") ? t.btnSaveNoteDone : t.saveNote}
                </button>
              </div>
            </section>

            {/* Governance Guardrail Card */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-gold/40 space-y-2 bg-sakan-gold/5">
              <h3 className="font-bold text-sakan-navy text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sakan-gold" />
                {t.govGuardrail}
              </h3>
              <p className="text-xs text-sakan-navy leading-relaxed font-semibold">
                {t.govDesc}
              </p>
            </section>

            {/* Document Validation */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
              <h2 className="text-base font-bold text-sakan-navy mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sakan-gold" /> {t.docValidation}
              </h2>
              <div className="space-y-5">
                {/* Salary Certificate */}
                <div>
                  <div className="text-[10px] font-bold text-sakan-text/40 uppercase tracking-wider mb-2">{t.salaryCert}</div>
                  <div className="space-y-2">
                    {[
                      { label: t.compLetterhead, pass: report.documentValidation.salaryCertificateChecks.hasCompanyLetterhead },
                      { label: t.authSignature, pass: report.documentValidation.salaryCertificateChecks.hasAuthorizedSignature },
                      { label: t.empDetailsMatch, pass: report.documentValidation.salaryCertificateChecks.employeeDetailsMatch },
                      { label: t.issueDate30, pass: report.documentValidation.salaryCertificateChecks.dateValid },
                    ].map(({ label, pass }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-sakan-text/70">{label}</span>
                        {pass ? <CheckCircle2 className="w-4 h-4 text-sakan-success" /> : <AlertTriangle className="w-4 h-4 text-sakan-danger" />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2.5 bg-sakan-bg rounded-lg border border-sakan-border flex justify-between text-xs">
                    <span><span className="text-sakan-text/40 font-semibold">{t.extracted}: </span><span className="font-bold" dir="ltr">{fmt(report.documentValidation.extractedSalary)}</span></span>
                    <span className="font-bold text-sakan-success" dir="ltr">{report.caseData.documentConfidence}% {t.conf}</span>
                  </div>
                </div>

                <div className="h-px bg-sakan-border/50" />

                {/* Bank Cross-Check */}
                <div>
                  <div className="text-[10px] font-bold text-sakan-text/40 uppercase tracking-wider mb-2">{t.bankCrossCheck}</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-sakan-bg border border-sakan-border">
                      <div className="text-sakan-text/50 mb-1">{t.certAmount}</div>
                      <div className="font-bold" dir="ltr">{fmt(report.documentValidation.extractedSalary)}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-sakan-bg border border-sakan-border">
                      <div className="text-sakan-text/50 mb-1">{t.avgTransfer}</div>
                      <div className="font-bold" dir="ltr">{fmt(report.documentValidation.bankCrossCheck.averageTransfer)}</div>
                    </div>
                  </div>
                  <div className={`mt-2 px-3 py-2 rounded-lg border text-xs flex items-center justify-between font-semibold ${report.documentValidation.bankCrossCheck.consistencyResult === "Consistent" ? "bg-sakan-success/5 border-sakan-success/20 text-sakan-success" : "bg-sakan-warning/5 border-sakan-warning/20 text-sakan-warning"}`}>
                    <span>{t.consistency}</span>
                    <span className="flex items-center gap-1">
                      {report.documentValidation.bankCrossCheck.consistencyResult === "Consistent" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {report.documentValidation.bankCrossCheck.consistencyResult}
                    </span>
                  </div>
                </div>

                {/* Medical Document */}
                {report.documentValidation.medicalValidation && (
                  <>
                    <div className="h-px bg-sakan-border/50" />
                    <div>
                      <div className="text-[10px] font-bold text-sakan-text/40 uppercase tracking-wider mb-2">{t.medDoc}</div>
                      <div className="space-y-2">
                        {[
                          { label: t.recProvider, pass: report.documentValidation.medicalValidation.providerRecognized },
                          { label: t.qrVerified, pass: report.documentValidation.medicalValidation.qrVerified },
                          { label: t.issueDateValid, pass: report.documentValidation.medicalValidation.dateValid },
                        ].map(({ label, pass }) => (
                          <div key={label} className="flex items-center justify-between text-xs">
                            <span className="text-sakan-text/70">{label}</span>
                            {pass ? <CheckCircle2 className="w-4 h-4 text-sakan-success" /> : <AlertTriangle className="w-4 h-4 text-sakan-danger" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Human Review Status */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
              <h2 className="text-base font-bold text-sakan-navy mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-sakan-gold" /> {t.hrStatus}
              </h2>
              <div className={`p-3 rounded-xl border text-sm mb-4 bg-white/20`}>
                {currentStatus === "Human Review Required" || currentStatus === "Assigned to Senior Officer" ? (
                  <div className="flex items-center gap-2 font-bold justify-center text-sakan-danger">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {t.hrRequired}
                  </div>
                ) : currentStatus === "Additional Information Required" || currentStatus.includes("Waiting") ? (
                  <div className="flex items-center gap-2 font-bold justify-center text-sakan-warning">
                    <Clock className="w-4 h-4 shrink-0" /> {t.hrWaitClarification}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-bold justify-center text-sakan-success">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {t.hrApproved}
                  </div>
                )}
              </div>

              {report.policyRules.humanReviewTriggers.length > 0 && (
                <div>
                  <div className="text-[10px] text-sakan-text/40 uppercase font-bold mb-2">{t.triggerMap}</div>
                  <ul className="space-y-1.5">
                    {report.policyRules.humanReviewTriggers.map((trigger, i) => (
                      <li key={i} className="text-xs bg-sakan-bg p-2.5 rounded-lg border border-sakan-border flex items-start gap-2" dir="ltr">
                        <AlertTriangle className="w-3.5 h-3.5 text-sakan-warning shrink-0 mt-0.5" />
                        {trigger}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Smart Communication */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
              <h2 className="text-base font-bold text-sakan-navy mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-sakan-gold" /> {t.smartComm}
              </h2>
              <div className="space-y-4">
                <div className={`bg-sakan-bg p-4 rounded-xl border border-sakan-border ${isAr ? "ring-2 ring-sakan-gold/50" : ""}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-sakan-navy tracking-wide">Arabic</span>
                    <button onClick={() => handleCopy(report.beneficiaryMessages.ar, "AR")} className="text-sakan-text/50 hover:text-sakan-navy transition-colors flex items-center gap-1 text-[10px] font-bold uppercase">
                      <Copy className="w-3 h-3" /> {t.btnCopyAr}
                    </button>
                  </div>
                  <p className="text-sm leading-loose text-sakan-navy text-right font-medium mb-3" dir="rtl">{report.beneficiaryMessages.ar}</p>
                </div>

                <div className={`bg-sakan-bg p-4 rounded-xl border border-sakan-border ${!isAr ? "ring-2 ring-sakan-gold/50" : ""}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-sakan-navy tracking-wide">English</span>
                    <button onClick={() => handleCopy(report.beneficiaryMessages.en, "EN")} className="text-sakan-text/50 hover:text-sakan-navy transition-colors flex items-center gap-1 text-[10px] font-bold uppercase">
                      <Copy className="w-3 h-3" /> {t.btnCopyEn}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-sakan-navy mb-3">{report.beneficiaryMessages.en}</p>
                </div>
              </div>
              
              <div className="mt-5 flex flex-wrap gap-2 pt-5 border-t border-sakan-border">
                {/* Full Audit Trail Modal */}
                {modalType === "audit" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl max-w-2xl w-full p-8 border border-sakan-border shadow-2xl flex flex-col h-[80vh]">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4 shrink-0">
                        <h3 className="text-xl font-bold text-sakan-navy flex items-center gap-2">
                          <ListOrdered className="w-5 h-5 text-sakan-gold" />
                          {isAr ? "سجل التدقيق" : t.modalAuditTitle}
                        </h3>
                        {/* Export CSV button */}
                        <button onClick={handleExportCsv} className="flex items-center gap-1 px-3 py-1 bg-sakan-bg hover:bg-sakan-border text-sakan-navy rounded-md text-sm font-medium">
                          {isAr ? "تصدير سجل التدقيق" : "Export Audit CSV"}
                        </button>
                        <button onClick={() => setModalType(null)} className="p-2 text-sakan-text/40 hover:text-sakan-navy bg-sakan-bg rounded-xl transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      {/* Filter Chips */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { key: "All", labelEn: "All", labelAr: "الكل" },
                          { key: "AI", labelEn: "AI Actions", labelAr: "إجراءات الذكاء الاصطناعي" },
                          { key: "Officer", labelEn: "Officer Actions", labelAr: "إجراءات الموظف" },
                          { key: "Warnings", labelEn: "Warnings", labelAr: "التنبيهات" },
                          { key: "Communications", labelEn: "Communications", labelAr: "الإشعارات" },
                          { key: "Exports", labelEn: "Exports", labelAr: "التصدير" },
                        ].map((chip) => (
                          <button
                            key={chip.key}
                            onClick={() => setAuditFilter(chip.key)}
                            className={`px-3 py-0.5 rounded-full text-xs font-medium border ${auditFilter === chip.key ? "bg-sakan-gold text-sakan-navy border-sakan-gold" : "bg-sakan-bg text-sakan-text border-sakan-border"}`}
                          >
                            {isAr ? chip.labelAr : chip.labelEn}
                          </button>
                        ))}
                      </div>
                      {/* Audit List */}
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2" dir={isAr ? "rtl" : "ltr"}>
                        {[...combinedAuditTrail]
                          .filter((event) => {
                            if (auditFilter === "All") return true;
                            if (auditFilter === "AI") return event.actor.includes("AI") || event.actor.includes("Agent");
                            if (auditFilter === "Officer") return event.actor.includes("Officer") || event.actor.includes("User");
                            if (auditFilter === "Warnings") return event.result === "Warning";
                            if (auditFilter === "Communications") return /email|sms|notification/i.test(event.action);
                            if (auditFilter === "Exports") return /export/i.test(event.action);
                            return true;
                          })
                          .reverse()
                          .map((event, i) => {
                            const isExpanded = expandedIds.has(i);
                            const formattedDate = isAr
                              ? new Intl.DateTimeFormat("ar-AE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }).format(new Date(event.timestamp))
                              : new Intl.DateTimeFormat("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }).format(new Date(event.timestamp));

                            const actionLabel = isAr ? actionTranslationsAr[event.action] || event.action : event.action;

                            return (
                              <div key={i} className="bg-sakan-bg/50 p-4 rounded-xl border border-sakan-border flex flex-col gap-2 text-sm cursor-pointer" onClick={() => toggleExpand(i)}>
                                <div className="flex items-start gap-3">
                                  <div className={`shrink-0 w-8 h-8 mt-0.5 rounded-full flex items-center justify-center text-white ${event.result === "Success" ? "bg-sakan-success" : event.result === "Warning" ? "bg-sakan-warning" : "bg-sakan-danger"}`}>
                                    {event.result === "Success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-bold text-sakan-navy flex items-center gap-1">
                                      <span>{actionLabel}</span>
                                      <span className="text-xs text-sakan-text/40">({isAr ? "عرض التفاصيل" : "View details"})</span>
                                    </div>
                                    <div className="text-sakan-text/40 mt-0.5 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{formattedDate}</span>
                                      <User className="w-3.5 h-3.5" />
                                      <span>{event.actor}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Expanded Details */}
                                {isExpanded && (
                                  <div className="mt-2 border-t border-sakan-border/30 pt-2 space-y-1 text-xs text-sakan-text/70">
                                    <div><strong>{isAr ? "المنفذ" : "Actor"}:</strong> {event.actor}</div>
                                    <div><strong>{isAr ? "الحالة" : "Status"}:</strong> {event.result}</div>
                                    <div><strong>{isAr ? "الوقت" : "Timestamp"}:</strong> {formattedDate}</div>
                                    <div><strong>{isAr ? "رقم الحالة" : "Case ID"}:</strong> {event.caseId || "-"}</div>
                                    {event.reasonCode && (
                                      <div><strong>{isAr ? "كود السبب" : "Reason code"}:</strong> {event.reasonCode}</div>
                                    )}
                                    {event.systemNote && (
                                      <div><strong>{isAr ? "ملاحظة النظام" : "System note"}:</strong> {event.systemNote}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
                <button
                  disabled={completedActions.has("sendSms")}
                  onClick={() => setModalType("sms")}
                  className={`flex-1 min-w-[120px] font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 ${
                    completedActions.has("sendSms") ? "bg-sakan-success/20 text-sakan-success cursor-not-allowed" : "bg-white border border-sakan-border text-sakan-navy hover:bg-sakan-bg"
                  }`}
                >
                  {completedActions.has("sendSms") ? <CheckCircle2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  {completedActions.has("sendSms") ? t.btnSmsSent : t.btnSendSms}
                </button>
                <button
                  disabled={completedActions.has("sendEmail")}
                  onClick={() => setModalType("email")}
                  className={`flex-1 min-w-[120px] font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 ${
                    completedActions.has("sendEmail") ? "bg-sakan-success/20 text-sakan-success cursor-not-allowed" : "bg-white border border-sakan-border text-sakan-navy hover:bg-sakan-bg"
                  }`}
                >
                  {completedActions.has("sendEmail") ? <CheckCircle2 className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  {completedActions.has("sendEmail") ? t.btnEmailSent : t.btnSendEmail}
                </button>
                <button
                  disabled={completedActions.has("markNotify")}
                  onClick={handleMarkNotifySent}
                  className={`flex-1 min-w-[150px] font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 ${
                    completedActions.has("markNotify") ? "bg-sakan-success/20 text-sakan-success cursor-not-allowed" : "bg-sakan-navy hover:bg-sakan-navy/90 text-white"
                  }`}
                >
                  {loadingAction === "markNotify" ? <Loader2 className="w-4 h-4 animate-spin" /> : completedActions.has("markNotify") ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {loadingAction === "markNotify" ? t.btnSendingEmail : completedActions.has("markNotify") ? t.toastNotifyMarkedSent : t.btnMarkNotifySent}
                </button>
              </div>
              {inlineFeedback["comm"] && (
                <div className="text-[10px] font-bold text-sakan-success flex items-center gap-1 mt-3">
                  <CheckCircle2 className="w-3 h-3" /> {inlineFeedback["comm"]}
                </div>
              )}
            </section>

            {/* Audit Trail */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-sakan-border">
              <h2 className="text-base font-bold text-sakan-navy mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sakan-gold" /> {t.auditTrail}
              </h2>
              <div className="space-y-3 mb-4">
                {combinedAuditTrail.slice(-6).map((event, i) => (
                  <div key={i} className="text-xs flex gap-2.5">
                    <div className={`shrink-0 w-2 h-2 mt-1 rounded-full ${event.result === "Success" ? "bg-sakan-success" : event.result === "Warning" ? "bg-sakan-warning" : "bg-sakan-danger"}`} />
                    <div>
                      <div className="font-semibold text-sakan-navy">{event.action}</div>
                      <div className="text-sakan-text/40 mt-0.5" dir="ltr" suppressHydrationWarning>
                        {isMounted ? (event.timestamp.includes("T") ? new Date(event.timestamp).toLocaleTimeString(isAr ? 'ar-AE' : 'en-US') : event.timestamp) : "..."} · {event.actor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setModalType("audit")}
                className="w-full flex items-center justify-center gap-2 bg-sakan-bg hover:bg-sakan-border text-sakan-navy font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm border border-sakan-border text-xs"
              >
                {t.viewFullAudit}
                <ChevronRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
              </button>
            </section>

          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      <AnimatePresence>
        {/* Export Report Modal */}
        {modalType === "export" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl max-w-2xl w-full p-8 border border-sakan-border shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 w-full h-2 bg-sakan-navy" />
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-sakan-navy flex items-center gap-2">
                    <FileArchive className="w-6 h-6 text-sakan-gold" />
                    {t.modalExportTitle}
                  </h3>
                  <p className="text-xs text-sakan-text/60 mt-1.5 font-medium">{t.modalExportSubtitle}</p>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-2 text-sakan-text/40 hover:text-sakan-navy bg-sakan-bg rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Structured PDF Preview inside modal */}
              <div className="border border-sakan-border rounded-xl p-6 bg-sakan-bg/30 space-y-5 text-sm font-medium text-sakan-navy relative">
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-sakan-border/50 pb-5">
                  <div>
                    <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblCaseId}</div>
                    <div className="font-bold" dir="ltr">DEC-RPT-{caseId}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblBeneficiary}</div>
                    <div className="font-bold">{report.caseData.beneficiaryName} <span className="text-sakan-text/50 font-normal" dir="ltr">({report.caseData.beneficiaryId})</span></div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblRecommendation}</div>
                    <div className="font-bold text-sakan-navy">{getTranslatedStatus(currentStatus)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-sakan-border/50 pb-5">
                  <div>
                    <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblConfidence}</div>
                    <div className="font-bold" dir="ltr">{confidenceData.overall}% <span className="text-sakan-text/50 font-normal">OVERALL</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblReasonCodes}</div>
                    <div className="font-mono text-xs" dir="ltr">{report.reasonCodes.join(", ")}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblFinSummary}</div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between"><span>Income:</span> <span dir="ltr">{fmt(report.financialCapacity.monthlyIncome)}</span></div>
                      <div className="flex justify-between"><span>Max Cap:</span> <span dir="ltr">{fmt(report.financialCapacity.max20PercentDeduction)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblNextAction}</div>
                    <div className="text-xs bg-white p-2.5 rounded border border-sakan-border font-semibold">
                      {isAr ? NEXT_BEST_ACTIONS_AR[caseId] : NEXT_BEST_ACTIONS[caseId]}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblSecHash}</div>
                      <div className="text-[10px] font-mono text-sakan-text/40 bg-white px-2 py-1 border rounded truncate" dir="ltr">{exportHash}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-sakan-text/40 font-bold uppercase mb-1">{t.lblGeneratedAt}</div>
                      <div className="text-[10px] font-mono text-sakan-text/40 bg-white px-2 py-1 border rounded truncate" dir="ltr" suppressHydrationWarning>
                        {isMounted ? new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC" : "..."}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="px-5 py-2.5 text-xs font-bold text-sakan-text hover:bg-sakan-bg rounded-xl transition-colors">{t.modalCancel}</button>
                {exportState === "idle" ? (
                  <button
                    onClick={handleGeneratePdf}
                    className="bg-sakan-navy text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-sakan-navy/90 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <FileArchive className="w-4 h-4" /> {t.btnGeneratePdf}
                  </button>
                ) : exportState === "generating" ? (
                  <button disabled className="bg-sakan-navy/50 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md flex items-center gap-1.5 cursor-not-allowed">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t.btnGeneratingPdf}
                  </button>
                ) : (
                  <button
                    onClick={handleDownloadPdf}
                    className="bg-sakan-gold text-sakan-navy text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-sakan-gold/90 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> {t.btnDownloadPdf}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Notify Beneficiary Modal (Legacy from prior step, but now handles generic notification preview if needed, keeping for backward compatibility in CASE-A quick decision) */}
        {modalType === "notify" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl max-w-lg w-full p-8 border border-sakan-border shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-sakan-navy flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-sakan-gold" /> {t.modalNotifyTitle}
              </h3>
              <div className="space-y-4">
                <div className="bg-sakan-bg p-4 rounded-xl border border-sakan-border">
                  <span className="text-[10px] font-bold text-sakan-text/40 uppercase mb-2 block">English Message</span>
                  <p className="text-xs leading-relaxed font-medium text-sakan-navy" dir="ltr">{report.beneficiaryMessages.en}</p>
                </div>
                <div className="bg-sakan-bg p-4 rounded-xl border border-sakan-border">
                  <span className="text-[10px] font-bold text-sakan-text/40 uppercase mb-2 block">Arabic Message</span>
                  <p className="text-xs leading-relaxed font-medium text-sakan-navy" dir="rtl">{report.beneficiaryMessages.ar}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="px-4 py-2 text-xs font-bold text-sakan-text hover:bg-sakan-bg rounded-xl transition-colors">{t.modalCancel}</button>
                <button
                  disabled={loadingAction === "notify"}
                  onClick={handleSendNotification}
                  className="bg-sakan-navy hover:bg-sakan-navy/90 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {loadingAction === "notify" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {loadingAction === "notify" ? t.btnSendNotificationLoading : t.btnSendNotification}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SMS Modal */}
        {modalType === "sms" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl max-w-sm w-full p-8 border border-sakan-border shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-sakan-navy flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sakan-gold" /> {t.modalSmsTitle}
              </h3>
              <div className="space-y-4">
                <div className="bg-sakan-bg p-4 rounded-xl border border-sakan-border relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-sakan-navy" />
                  <span className="text-[10px] font-bold text-sakan-text/40 uppercase mb-2 block mt-1">SMS Preview (Arabic)</span>
                  <p className="text-xs leading-relaxed font-medium text-sakan-navy" dir="rtl">{report.beneficiaryMessages.ar}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="px-4 py-2 text-xs font-bold text-sakan-text hover:bg-sakan-bg rounded-xl transition-colors">{t.modalCancel}</button>
                <button
                  disabled={loadingAction === "sendSms"}
                  onClick={handleSendSms}
                  className="bg-sakan-navy hover:bg-sakan-navy/90 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {loadingAction === "sendSms" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {loadingAction === "sendSms" ? t.btnSendingSms : t.btnSendSms}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Email Modal */}
        {modalType === "email" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl max-w-lg w-full p-8 border border-sakan-border shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-sakan-navy flex items-center gap-2">
                <Mail className="w-5 h-5 text-sakan-gold" /> {t.modalEmailTitle}
              </h3>
              <div className="space-y-4">
                <div className="bg-sakan-bg p-4 rounded-xl border border-sakan-border">
                  <span className="text-[10px] font-bold text-sakan-text/40 uppercase mb-2 block">English Preview</span>
                  <p className="text-xs leading-relaxed font-medium text-sakan-navy" dir="ltr">{report.beneficiaryMessages.en}</p>
                </div>
                <div className="bg-sakan-bg p-4 rounded-xl border border-sakan-border">
                  <span className="text-[10px] font-bold text-sakan-text/40 uppercase mb-2 block">Arabic Preview</span>
                  <p className="text-xs leading-relaxed font-medium text-sakan-navy" dir="rtl">{report.beneficiaryMessages.ar}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="px-4 py-2 text-xs font-bold text-sakan-text hover:bg-sakan-bg rounded-xl transition-colors">{t.modalCancel}</button>
                <button
                  disabled={loadingAction === "sendEmail"}
                  onClick={handleSendEmail}
                  className="bg-sakan-navy hover:bg-sakan-navy/90 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {loadingAction === "sendEmail" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {loadingAction === "sendEmail" ? t.btnSendingEmail : t.btnSendEmail}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Request Document Modal */}
        {modalType === "requestDoc" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl max-w-lg w-full p-8 border border-sakan-border shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-sakan-navy flex items-center gap-2">
                <FileText className="w-5 h-5 text-sakan-gold" /> {t.modalDocReqTitle}
              </h3>
              <div className="space-y-4">
                <div className="bg-sakan-bg p-4 rounded-xl border border-sakan-border">
                  <span className="text-[10px] font-bold text-sakan-text/40 uppercase mb-2 block">English Request</span>
                  <p className="text-xs font-medium text-sakan-navy" dir="ltr">{t.docReqText}</p>
                </div>
                <div className="bg-sakan-bg p-4 rounded-xl border border-sakan-border">
                  <span className="text-[10px] font-bold text-sakan-text/40 uppercase mb-2 block">Arabic Request</span>
                  <p className="text-xs font-medium text-sakan-navy" dir="rtl">{t.docReqTextAr}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="px-4 py-2 text-xs font-bold text-sakan-text hover:bg-sakan-bg rounded-xl transition-colors">{t.modalCancel}</button>
                <button
                  disabled={loadingAction === "docReq"}
                  onClick={handleSendDocReq}
                  className="bg-sakan-warning hover:bg-sakan-warning/90 text-sakan-navy text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {loadingAction === "docReq" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {loadingAction === "docReq" ? t.btnSendNotificationLoading : t.btnSendRequest}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Assign Officer Modal */}
        {modalType === "assignOfficer" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl max-w-sm w-full p-8 border border-sakan-border shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-sakan-navy flex items-center gap-2">
                <User className="w-5 h-5 text-sakan-gold" /> {t.modalAssignTitle}
              </h3>
              <div className="space-y-4">
                <select 
                  value={assignOfficer}
                  onChange={(e) => setAssignOfficer(e.target.value)}
                  className="w-full p-3 text-sm border border-sakan-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sakan-gold/50 bg-sakan-bg/50 text-sakan-navy font-semibold"
                >
                  <option value="Senior Housing Officer">{t.assignOpt1}</option>
                  <option value="Finance Review Officer">{t.assignOpt2}</option>
                  <option value="Exception Committee">{t.assignOpt3}</option>
                </select>
                <textarea
                  value={assignComment}
                  onChange={(e) => setAssignComment(e.target.value)}
                  placeholder={t.assignComment}
                  rows={3}
                  className="w-full p-3 text-xs border border-sakan-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sakan-gold/50 resize-none bg-sakan-bg/30 text-sakan-navy font-medium"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalType(null)} className="px-4 py-2 text-xs font-bold text-sakan-text hover:bg-sakan-bg rounded-xl transition-colors">{t.modalCancel}</button>
                <button
                  disabled={loadingAction === "assign"}
                  onClick={handleAssignHuman}
                  className="bg-sakan-danger hover:bg-sakan-danger/90 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  {loadingAction === "assign" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {loadingAction === "assign" ? t.btnSendNotificationLoading : t.btnConfirmAssign}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Full Audit Trail Modal */}
        {modalType === "audit" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl max-w-2xl w-full p-8 border border-sakan-border shadow-2xl flex flex-col h-[80vh]">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xl font-bold text-sakan-navy flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-sakan-gold" /> {t.modalAuditTitle}
                </h3>
                <button onClick={() => setModalType(null)} className="p-2 text-sakan-text/40 hover:text-sakan-navy bg-sakan-bg rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 (isAr ? pl-2 : pr-2)">
                {[...combinedAuditTrail].reverse().map((event, i) => (
                  <div key={i} className="bg-sakan-bg/50 p-4 rounded-xl border border-sakan-border flex items-start gap-3 text-sm">
                    <div className={`shrink-0 w-8 h-8 mt-0.5 rounded-full flex items-center justify-center text-white ${event.result === "Success" ? "bg-sakan-success" : event.result === "Warning" ? "bg-sakan-warning" : "bg-sakan-danger"}`}>
                      {event.result === "Success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-sakan-navy">{event.action}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-sakan-text/60">
                        <span className="font-semibold flex items-center gap-1"><User className="w-3.5 h-3.5" /> {event.actor}</span>
                        <span className="flex items-center gap-1" dir="ltr" suppressHydrationWarning>
                          <Clock className="w-3.5 h-3.5" /> 
                          {isMounted ? (event.timestamp.includes("T") ? new Date(event.timestamp).toLocaleString(isAr ? 'ar-AE' : 'en-US') : event.timestamp) : "..."}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
