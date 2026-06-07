"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo-context";
import { MOCK_CASES } from "@/lib/mock-data";
import { validateDocuments } from "@/lib/agent-rules";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  Briefcase,
  ShieldCheck,
  Database,
  User,
  Info,
  Languages,
  File,
  X,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Currency helper ──────────────────────────────────────────────────── */
function aed(v: number) {
  return `AED ${v.toLocaleString("en-US")}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Translations ─────────────────────────────────────────────────────── */
const T = {
  EN: {
    pageTitle: "Application Form & Documents",
    pageSubtitle: "Some fields are pre-filled from UAE PASS and the MOEI loan system. Please confirm your details, upload the required document, and sign the declaration.",
    backToPortal: "Back to Portal",
    applicationDetails: "Application Details",
    fieldsNote: "Fields marked as read-only are retrieved from official government systems.",
    uaePassBadge: "Auto-filled from UAE PASS",
    moeiBadge: "Retrieved from Mock MOEI Loan System",
    applicantBadge: "Applicant Provided",
    beneficiaryName: "Beneficiary Name",
    emiratesId: "Emirates ID",
    beneficiaryId: "Beneficiary ID",
    employer: "Employer",
    employerValue: "Government Entity",
    monthlyIncome: "Monthly Income",
    monthlyObligations: "Monthly Obligations",
    familyMembers: "Family Members",
    reasonLabel: "Reason for Rescheduling",
    reasonPlaceholder: "e.g., Financial hardship due to unexpected expenses",
    circumstanceLabel: "Supporting Circumstance (Optional)",
    notesLabel: "Additional Notes (Optional)",
    notesPlaceholder: "Any additional details...",
    circNone: "None",
    circMedical: "Medical circumstance",
    circJobLoss: "Job loss",
    circTemp: "Temporary assignment",
    circIncome: "Income reduction",
    requiredDocs: "Required Documents",
    salaryCert: "Salary Certificate",
    uploadHint: "Upload a recent salary certificate (not older than 30 days). PDF, JPG, PNG accepted.",
    selectFile: "Select File",
    replaceFile: "Replace file",
    removeFile: "Remove file",
    uploadingDoc: "Uploading document...",
    processingDoc: "Running document intelligence...",
    docProcessed: "Document processed",
    docIntelResults: "Document Intelligence Results",
    simOcrBadge: "Simulated OCR · Demo",
    issueDate: "Issue Date",
    validityPeriod: "Validity Period",
    extractedSalary: "Extracted Salary",
    profileSalary: "Profile Salary",
    salaryMatchResult: "Salary Match Result",
    matchConfirmed: "Match Confirmed",
    mismatchDetected: "Mismatch Detected",
    certIntegrityChecks: "Certificate Integrity Checks",
    companyLetterhead: "Company Letterhead",
    authorizedSignature: "Authorized Signature",
    employeeDetailsMatch: "Employee Details Match",
    issueDateValid: "Issue Date Valid",
    bankCrossCheck: "Bank Statement Cross-check",
    certAmount: "Salary Certificate Amount",
    avgTransfer: "6-Month Average Transfer",
    consistencyResult: "Consistency Result",
    consistent: "Consistent",
    inconsistent: "Inconsistent",
    confidence: "Confidence",
    mandatoryDeclaration: "Mandatory Declaration",
    declarationText: "I confirm that all uploaded documents are authentic, accurate, and have not been altered or fabricated.",
    submissionChecklist: "Submission Checklist",
    checkFormComplete: "Application details confirmed",
    checkSalaryUploaded: "Salary certificate uploaded",
    checkDeclarationSigned: "Declaration signed",
    submitBtn: "Submit for AI Assessment",
    submittingBtn: "Submitting to SAKAN Decision Agent...",
    submitNote: "All submissions are encrypted and processed by the SAKAN Decision Agent.",
    whatHappensNext: "What happens next?",
    whatHappensNextText: "After submission, SAKAN Decision Agent will validate the document, apply policy rules, calculate financial capacity, and generate an explainable recommendation.",
    optionalDoc: "Optional Supporting Document",
    medicalReport: "Medical / Supporting Report",
    medicalHint: "Upload proof for your selected circumstance",
    upload: "Upload",
    attached: "Attached",
    expired: "EXPIRED",
    demoUploadBadge: "Demo Upload",
    warningCaseA: "No issues detected. This request is eligible for automated assessment.",
    warningCaseB: "Document inconsistencies detected. The request can be submitted, but additional information may be required.",
    warningCaseC: "High-risk indicators detected. This request may be routed to a human officer for review.",
    // Completion Guide
    completionGuideTitle: "Completion Guide",
    cgReqItemLabel: "Required item:",
    cgReqItemValue: "Updated salary certificate",
    cgWhyNeededLabel: "Why needed:",
    cgWhyNeededValue: "The uploaded salary certificate is expired or does not match income records.",
    cgHowToCompleteLabel: "How to complete:",
    cgStep1: "1. Request a new salary certificate from your employer.",
    cgStep2: "2. Ensure the issue date is within the last 30 days.",
    cgStep3: "3. Ensure the certificate clearly shows your name, employer, monthly salary, issue date, and authorized signature.",
    cgStep4: "4. Upload it as PDF, JPG, or PNG.",
    cgWhatNextLabel: "What happens next:",
    cgWhatNextText: "SAKAN AI will automatically re-check the document and update your request status.",
    cgUploadBtn: "Upload Updated Certificate",
    cgViewReqBtn: "View Accepted Document Requirements",
    cgContactBtn: "Contact Support",
    cgRecheckStarted: "Document re-check started"
  },
  AR: {
    pageTitle: "نموذج الطلب والمستندات",
    pageSubtitle: "تمت تعبئة بعض البيانات تلقائياً من الهوية الرقمية ونظام القروض. يرجى تأكيد البيانات ورفع المستند المطلوب والتوقيع على الإقرار.",
    backToPortal: "العودة إلى البوابة",
    applicationDetails: "بيانات الطلب",
    fieldsNote: "الحقول المعلّمة للقراءة فقط يتم استرجاعها من الأنظمة الحكومية الرسمية.",
    uaePassBadge: "تمت التعبئة من الهوية الرقمية",
    moeiBadge: "تم الاسترجاع من نظام القروض التجريبي",
    applicantBadge: "مدخل من المتعامل",
    beneficiaryName: "اسم المتعامل",
    emiratesId: "رقم الهوية الإماراتية",
    beneficiaryId: "رقم المتعامل",
    employer: "جهة العمل",
    employerValue: "جهة حكومية",
    monthlyIncome: "الدخل الشهري",
    monthlyObligations: "الالتزامات الشهرية",
    familyMembers: "عدد أفراد الأسرة",
    reasonLabel: "سبب طلب إعادة الجدولة",
    reasonPlaceholder: "مثال: ضائقة مالية بسبب نفقات غير متوقعة",
    circumstanceLabel: "ظرف داعم (اختياري)",
    notesLabel: "ملاحظات إضافية (اختياري)",
    notesPlaceholder: "أي تفاصيل إضافية...",
    circNone: "لا يوجد",
    circMedical: "ظرف طبي",
    circJobLoss: "فقدان وظيفة",
    circTemp: "انتداب مؤقت",
    circIncome: "انخفاض الدخل",
    requiredDocs: "المستندات المطلوبة",
    salaryCert: "شهادة الراتب",
    uploadHint: "ارفع شهادة راتب حديثة لا يتجاوز تاريخ إصدارها 30 يوماً. الصيغ المقبولة: PDF و JPG و PNG.",
    selectFile: "اختيار ملف",
    replaceFile: "استبدال الملف",
    removeFile: "حذف الملف",
    uploadingDoc: "جاري رفع المستند...",
    processingDoc: "جاري تحليل المستند...",
    docProcessed: "تم تحليل المستند",
    docIntelResults: "نتائج تحليل المستندات",
    simOcrBadge: "محاكاة OCR · عرض تجريبي",
    issueDate: "تاريخ الإصدار",
    validityPeriod: "مدة الصلاحية",
    extractedSalary: "الراتب المستخرج",
    profileSalary: "الراتب المسجل",
    salaryMatchResult: "نتيجة مطابقة الراتب",
    matchConfirmed: "تم تأكيد المطابقة",
    mismatchDetected: "تم اكتشاف اختلاف",
    certIntegrityChecks: "فحوصات سلامة الشهادة",
    companyLetterhead: "ترويسة جهة العمل",
    authorizedSignature: "التوقيع المعتمد",
    employeeDetailsMatch: "مطابقة بيانات الموظف",
    issueDateValid: "تاريخ الإصدار صالح",
    bankCrossCheck: "مطابقة كشف الحساب البنكي",
    certAmount: "مبلغ شهادة الراتب",
    avgTransfer: "متوسط تحويلات 6 أشهر",
    consistencyResult: "نتيجة الاتساق",
    consistent: "متسق",
    inconsistent: "غير متسق",
    confidence: "الثقة",
    mandatoryDeclaration: "الإقرار الإلزامي",
    declarationText: "أقر بأن جميع المستندات المرفوعة صحيحة ودقيقة ولم يتم تعديلها أو تزويرها.",
    submissionChecklist: "قائمة التحقق من الطلب",
    checkFormComplete: "تم تأكيد بيانات الطلب",
    checkSalaryUploaded: "تم رفع شهادة الراتب",
    checkDeclarationSigned: "تم توقيع الإقرار",
    submitBtn: "إرسال الطلب للتقييم الآلي",
    submittingBtn: "جاري إرسال الطلب إلى وكيل قرار سكن...",
    submitNote: "تتم معالجة الطلبات بشكل آمن بواسطة وكيل قرار سكن.",
    whatHappensNext: "ماذا يحدث بعد الإرسال؟",
    whatHappensNextText: "بعد الإرسال، سيقوم وكيل قرار سكن بالتحقق من المستند، وتطبيق قواعد السياسة، واحتساب القدرة المالية، وإنشاء توصية قابلة للتفسير.",
    optionalDoc: "مستند داعم اختياري",
    medicalReport: "تقرير طبي / مستند داعم",
    medicalHint: "ارفع إثباتاً للظرف الذي اخترته",
    upload: "رفع",
    attached: "تم الإرفاق",
    expired: "منتهية الصلاحية",
    demoUploadBadge: "رفع تجريبي",
    warningCaseA: "لم يتم اكتشاف أي ملاحظات. الطلب مؤهل للتقييم الآلي.",
    warningCaseB: "تم اكتشاف اختلافات في المستندات. يمكن إرسال الطلب، لكن قد تكون هناك حاجة إلى معلومات إضافية.",
    warningCaseC: "تم اكتشاف مؤشرات عالية الخطورة. قد يتم تحويل الطلب إلى موظف مختص للمراجعة.",
    // Completion Guide
    completionGuideTitle: "دليل استكمال الطلب",
    cgReqItemLabel: "المطلوب:",
    cgReqItemValue: "شهادة راتب حديثة",
    cgWhyNeededLabel: "سبب الطلب:",
    cgWhyNeededValue: "شهادة الراتب المرفوعة منتهية أو لا تتطابق مع بيانات الدخل.",
    cgHowToCompleteLabel: "طريقة الاستكمال:",
    cgStep1: "1. اطلب شهادة راتب حديثة من جهة العمل.",
    cgStep2: "2. تأكد أن تاريخ الإصدار خلال آخر 30 يومًا.",
    cgStep3: "3. تأكد أن الشهادة تحتوي بوضوح على الاسم، جهة العمل، الراتب الشهري، تاريخ الإصدار، والتوقيع المعتمد.",
    cgStep4: "4. ارفع الملف بصيغة PDF أو JPG أو PNG.",
    cgWhatNextLabel: "ماذا يحدث بعد ذلك:",
    cgWhatNextText: "سيعيد SAKAN AI التحقق من المستند تلقائيًا وتحديث حالة الطلب.",
    cgUploadBtn: "رفع شهادة حديثة",
    cgViewReqBtn: "عرض شروط المستند المقبول",
    cgContactBtn: "التواصل مع الدعم",
    cgRecheckStarted: "بدأ إعادة التحقق من المستند"
  },
} as const;

type LangKey = keyof typeof T;

/* ─── Sub-components ───────────────────────────────────────────────────── */

function SourceBadge({ label, icon: Icon, color = "default" }: { label: string; icon: React.ElementType; color?: "default" | "blue" | "green" }) {
  const styles = {
    default: "text-sakan-text/70 bg-white border-sakan-border",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    green: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold border rounded-md px-2.5 py-1 shadow-sm ${styles[color]}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function SectionDivider({ badge }: { badge: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-sakan-border/40" />
      {badge}
      <div className="h-px flex-1 bg-sakan-border/40" />
    </div>
  );
}

function ReadOnlyField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-sakan-text/50 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sakan-text/40">{icon}</span>}
        <input
          readOnly
          value={value}
          className={`w-full ${icon ? "pl-8 pr-3" : "px-3"} py-2.5 rounded-xl border border-sakan-border bg-sakan-bg/60 text-sakan-navy font-medium text-sm focus:outline-none cursor-default`}
        />
      </div>
    </div>
  );
}

/* ─── Main Page Component ──────────────────────────────────────────────── */

export default function ApplyPage() {
  const router = useRouter();
  const { selectedCaseId, language, setLanguage } = useDemo();
  const caseData = MOCK_CASES[selectedCaseId];
  const validationResult = validateDocuments(caseData);

  const lang = language as LangKey;
  const isAr = lang === "AR";
  const t = T[lang];

  // State
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "analyzing" | "processed">("idle");
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [medicalUploaded, setMedicalUploaded] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [formState, setFormState] = useState({ reason: "", circumstance: "None", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload handler – opens real file picker
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setUploadState("idle");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile({ name: file.name, size: file.size, type: file.type || "application/pdf" });
    setUploadState("uploading");
    
    // Simulate uploading, then analyzing
    setTimeout(() => {
      setUploadState("analyzing");
      setTimeout(() => {
        setUploadState("processed");
      }, 1500);
    }, 1000);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      router.push("/processing");
    }, 1000);
  };

  // Date calculations
  const today = new Date();
  const issueDate = new Date(today);
  issueDate.setDate(today.getDate() - (caseData.salaryCertificateExpired ? 45 : 10));
  const expiryDate = new Date(issueDate);
  expiryDate.setDate(issueDate.getDate() + 30);
  const issueDateStr = issueDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const expiryDateStr = expiryDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Validation results
  const isExpired = !validationResult.salaryCertificateChecks.dateValid;
  const hasMismatch = validationResult.mismatch;
  const isInconsistent = validationResult.bankCrossCheck.consistencyResult === "Inconsistent";

  // Certificate integrity items
  const integrityItems = [
    { label: t.companyLetterhead, pass: validationResult.salaryCertificateChecks.hasCompanyLetterhead },
    { label: t.authorizedSignature, pass: validationResult.salaryCertificateChecks.hasAuthorizedSignature },
    { label: t.employeeDetailsMatch, pass: validationResult.salaryCertificateChecks.employeeDetailsMatch },
    { label: t.issueDateValid, pass: validationResult.salaryCertificateChecks.dateValid },
  ];

  // Checklist items
  const checklistItems = [
    { label: t.checkFormComplete, done: true }, // Initial state is checked
    { label: t.checkSalaryUploaded, done: uploadState === "processed" },
    { label: t.checkDeclarationSigned, done: declarationChecked },
  ];

  const submitDisabled = uploadState !== "processed" || !declarationChecked || isSubmitting;

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

      {/* Hidden real file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 text-sakan-text/60 hover:text-sakan-navy mb-3 font-medium transition-colors text-sm"
            >
              <ArrowLeft className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
              {t.backToPortal}
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-sakan-navy">{t.pageTitle}</h1>
            <p className="text-sakan-text/60 mt-1.5 text-sm max-w-2xl leading-relaxed">{t.pageSubtitle}</p>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-sakan-border shadow-sm shrink-0">
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
        </header>

        {/* ── Main grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Application Form Card ──────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm"
            >
              <h2 className="text-base font-bold text-sakan-navy mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sakan-gold" />
                {t.applicationDetails}
              </h2>
              <p className="text-xs text-sakan-text/50 mb-5">{t.fieldsNote}</p>

              {/* UAE PASS Fields */}
              <SectionDivider badge={<SourceBadge label={t.uaePassBadge} icon={ShieldCheck} color="green" />} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-1">
                <ReadOnlyField label={t.beneficiaryName} value={caseData.beneficiaryName} />
                <ReadOnlyField label={t.emiratesId} value={caseData.emiratesId} />
                <ReadOnlyField label={t.beneficiaryId} value={caseData.beneficiaryId} />
              </div>

              {/* MOEI Fields */}
              <SectionDivider badge={<SourceBadge label={t.moeiBadge} icon={Database} color="blue" />} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-1">
                <ReadOnlyField label={t.employer} value={t.employerValue} icon={<Briefcase className="w-3.5 h-3.5" />} />
                <ReadOnlyField label={t.monthlyIncome} value={aed(caseData.monthlyIncome)} />
                <ReadOnlyField label={t.monthlyObligations} value={aed(caseData.financialObligations)} />
                <ReadOnlyField label={t.familyMembers} value={String(caseData.familyMembers)} />
              </div>

              {/* Applicant-Provided Fields */}
              <SectionDivider badge={<SourceBadge label={t.applicantBadge} icon={User} />} />
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-sakan-text/70 mb-1.5">
                    {t.reasonLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t.reasonPlaceholder}
                    value={formState.reason}
                    onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-sakan-border text-sm focus:ring-2 focus:ring-sakan-gold/50 focus:outline-none bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-sakan-text/70 mb-1.5">{t.circumstanceLabel}</label>
                    <select
                      value={formState.circumstance}
                      onChange={(e) => setFormState({ ...formState, circumstance: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-sakan-border text-sm focus:ring-2 focus:ring-sakan-gold/50 focus:outline-none bg-white"
                    >
                      <option value="None">{t.circNone}</option>
                      <option value="Medical circumstance">{t.circMedical}</option>
                      <option value="Job loss">{t.circJobLoss}</option>
                      <option value="Temporary assignment">{t.circTemp}</option>
                      <option value="Income reduction">{t.circIncome}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sakan-text/70 mb-1.5">{t.notesLabel}</label>
                    <input
                      type="text"
                      placeholder={t.notesPlaceholder}
                      value={formState.notes}
                      onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-sakan-border text-sm focus:ring-2 focus:ring-sakan-gold/50 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Upload Card ────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-sakan-navy flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-sakan-gold" />
                  {t.requiredDocs}
                </h2>
                <span className="text-[10px] font-semibold text-sakan-text/40 bg-sakan-bg border border-sakan-border px-2 py-0.5 rounded-md">
                  {t.demoUploadBadge}
                </span>
              </div>

              <div
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 ${
                  uploadState === "processed"
                    ? "border-emerald-300/60 bg-emerald-50/40"
                    : uploadState === "analyzing" || uploadState === "uploading"
                    ? "border-sakan-gold/50 bg-sakan-gold/5"
                    : "border-sakan-border hover:border-sakan-gold/40 hover:bg-sakan-gold/5 cursor-pointer"
                }`}
                onClick={uploadState === "idle" ? handleSelectFile : undefined}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  uploadState === "processed" ? "bg-emerald-100" : "bg-white shadow-sm border border-sakan-border/50"
                }`}>
                  {uploadState === "processed" ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  ) : uploadState === "analyzing" || uploadState === "uploading" ? (
                    <Cpu className="w-7 h-7 text-sakan-gold animate-pulse" />
                  ) : (
                    <UploadCloud className="w-7 h-7 text-sakan-gold" />
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-sakan-navy mb-1 text-sm">{t.salaryCert}</h3>
                <p className="text-xs text-sakan-text/50 mb-5 max-w-sm leading-relaxed">{t.uploadHint}</p>

                {/* File info (shown after selection) */}
                {selectedFile && (
                  <div className="flex items-center gap-3 bg-white border border-sakan-border rounded-xl px-4 py-2.5 mb-4 shadow-sm text-xs w-full max-w-md">
                    <File className="w-5 h-5 text-sakan-navy/50 shrink-0" />
                    <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
                      <div className="font-semibold text-sakan-navy truncate max-w-[200px]">{selectedFile.name}</div>
                      <div className="text-sakan-text/50">
                        {selectedFile.type.split("/")[1]?.toUpperCase() || "PDF"} · {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                )}

                {/* State: Idle */}
                {uploadState === "idle" && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSelectFile(); }}
                    className="bg-sakan-navy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sakan-navy/90 transition-colors shadow-sm"
                  >
                    {t.selectFile}
                  </button>
                )}

                {/* State: Uploading */}
                {uploadState === "uploading" && (
                  <div className="flex items-center gap-2 text-sakan-navy font-medium bg-white px-5 py-2.5 rounded-xl shadow-sm text-sm border border-sakan-gold/30">
                    <UploadCloud className="w-4 h-4 animate-bounce text-sakan-gold" />
                    {t.uploadingDoc}
                  </div>
                )}

                {/* State: Analyzing */}
                {uploadState === "analyzing" && (
                  <div className="flex items-center gap-2 text-sakan-navy font-medium bg-white px-5 py-2.5 rounded-xl shadow-sm text-sm border border-sakan-gold/30">
                    <Cpu className="w-4 h-4 animate-spin text-sakan-gold" />
                    {t.processingDoc}
                  </div>
                )}

                {/* State: Done */}
                {uploadState === "processed" && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold bg-white px-5 py-2.5 rounded-xl shadow-sm border border-emerald-200 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.docProcessed}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <button 
                        onClick={handleSelectFile}
                        className="flex items-center gap-1.5 text-xs font-semibold text-sakan-text/70 hover:text-sakan-navy transition-colors bg-white border border-sakan-border px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {t.replaceFile}
                      </button>
                      <button 
                        onClick={handleRemoveFile}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors bg-white border border-red-100 px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                        {t.removeFile}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Document Intelligence Results ──────────────────────────── */}
            <AnimatePresence>
              {uploadState === "processed" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-sakan-navy flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sakan-gold" />
                      {t.docIntelResults}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-sakan-text/40 bg-sakan-bg border border-sakan-border px-2 py-0.5 rounded-md">
                        {t.simOcrBadge}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        caseData.documentConfidence >= 80
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-amber-50 text-amber-600 border-amber-200"
                      }`}>
                        {caseData.documentConfidence}% {t.confidence}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">

                    {/* File info row */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-sakan-bg border border-sakan-border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sakan-text/40" />
                        <span className="font-medium text-sakan-navy">{selectedFile?.name || "salary_certificate.pdf"}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-sakan-text/40 bg-white border border-sakan-border px-2 py-0.5 rounded-md">
                        {t.simOcrBadge}
                      </span>
                    </div>

                    {/* Date / Salary grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-sakan-bg border border-sakan-border">
                        <div className="text-sakan-text/50 text-xs font-semibold mb-1">{t.issueDate}</div>
                        <div className="font-medium text-sakan-navy">{issueDateStr}</div>
                      </div>
                      <div className={`p-3.5 rounded-xl border ${isExpired ? "bg-red-50 border-red-200" : "bg-sakan-bg border-sakan-border"}`}>
                        <div className="text-sakan-text/50 text-xs font-semibold mb-1">{t.validityPeriod}</div>
                        <div className={`font-medium ${isExpired ? "text-red-600" : "text-sakan-navy"}`}>
                          30 days — {expiryDateStr}
                          {isExpired && <span className="font-bold ms-1">({t.expired})</span>}
                        </div>
                      </div>
                      <div className={`p-3.5 rounded-xl border ${hasMismatch ? "bg-red-50 border-red-200" : "bg-sakan-bg border-sakan-border"}`}>
                        <div className="text-sakan-text/50 text-xs font-semibold mb-1">{t.extractedSalary}</div>
                        <div className={`font-bold text-base ${hasMismatch ? "text-red-600" : "text-sakan-navy"}`}>
                          {aed(validationResult.extractedSalary)}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-sakan-bg border border-sakan-border">
                        <div className="text-sakan-text/50 text-xs font-semibold mb-1">{t.profileSalary}</div>
                        <div className="font-bold text-base text-sakan-navy">{aed(caseData.monthlyIncome)}</div>
                      </div>
                    </div>

                    {/* Salary match result */}
                    <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      !hasMismatch ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                    }`}>
                      <span className="font-semibold text-sakan-navy">{t.salaryMatchResult}</span>
                      <span className={`flex items-center gap-1.5 font-bold ${!hasMismatch ? "text-emerald-600" : "text-red-600"}`}>
                        {!hasMismatch ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {!hasMismatch ? t.matchConfirmed : t.mismatchDetected}
                      </span>
                    </div>

                    {/* Certificate integrity */}
                    <div className="p-4 rounded-xl bg-sakan-bg border border-sakan-border">
                      <div className="text-sakan-text/60 text-xs font-bold mb-3">{t.certIntegrityChecks}</div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {integrityItems.map(({ label, pass }) => (
                          <div key={label} className={`flex items-center gap-1.5 p-2.5 rounded-lg ${pass ? "bg-white" : "bg-red-50"}`}>
                            {pass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                            <span className={`text-xs ${pass ? "text-sakan-text" : "text-red-600 font-semibold"}`}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bank cross-check */}
                    <div className={`p-4 rounded-xl border ${!isInconsistent ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                      <div className="text-sakan-text/60 text-xs font-bold mb-3">{t.bankCrossCheck}</div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white p-3 rounded-lg border border-sakan-border/50">
                          <div className="text-sakan-text/50 text-xs mb-1">{t.certAmount}</div>
                          <div className="font-bold text-sakan-navy text-sm">{aed(validationResult.extractedSalary)}</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-sakan-border/50">
                          <div className="text-sakan-text/50 text-xs mb-1">{t.avgTransfer}</div>
                          <div className="font-bold text-sakan-navy text-sm">{aed(validationResult.bankCrossCheck.averageTransfer)}</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-sm font-bold ${!isInconsistent ? "text-emerald-600" : "text-amber-600"}`}>
                        <span>{t.consistencyResult}</span>
                        <span className="flex items-center gap-1.5">
                          {!isInconsistent ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          {!isInconsistent ? t.consistent : t.inconsistent}
                          <span className="font-normal text-xs text-sakan-text/50 ms-1">({validationResult.bankCrossCheck.confidenceScore}%)</span>
                        </span>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Optional Medical Document ───────────────────────────────── */}
            {formState.circumstance !== "None" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm"
              >
                <h2 className="text-base font-bold text-sakan-navy mb-4 flex justify-between items-center">
                  <span>{t.optionalDoc}</span>
                  <span className="text-xs font-normal bg-sakan-bg px-2 py-1 rounded text-sakan-text/60">{formState.circumstance}</span>
                </h2>
                <div className="border border-dashed border-sakan-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Stethoscope className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-medium text-sm">{t.medicalReport}</h3>
                      <p className="text-xs text-sakan-text/60">{t.medicalHint}</p>
                    </div>
                  </div>
                  {!medicalUploaded ? (
                    <button onClick={() => setMedicalUploaded(true)} className="text-xs font-medium text-sakan-navy bg-sakan-bg px-3 py-1.5 rounded-lg border border-sakan-border hover:bg-sakan-border/50 transition-colors">
                      {t.upload}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t.attached}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Completion Guide (CASE-B only) ──────────────────────────── */}
            {uploadState === "processed" && selectedCaseId === "CASE-B" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-amber-600" />
                  <h2 className="text-base font-bold text-amber-900">{t.completionGuideTitle}</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                    <div className="text-xs text-amber-800/60 font-bold uppercase tracking-wider mb-1">{t.cgReqItemLabel}</div>
                    <div className="font-semibold text-amber-900 mb-3">{t.cgReqItemValue}</div>
                    <div className="text-xs text-amber-800/60 font-bold uppercase tracking-wider mb-1">{t.cgWhyNeededLabel}</div>
                    <div className="text-sm text-amber-900 leading-relaxed">{t.cgWhyNeededValue}</div>
                  </div>

                  <div>
                    <h3 className="font-bold text-amber-900 text-sm mb-2">{t.cgHowToCompleteLabel}</h3>
                    <ul className="space-y-2 text-sm text-amber-800 leading-relaxed">
                      <li>{t.cgStep1}</li>
                      <li>{t.cgStep2}</li>
                      <li>{t.cgStep3}</li>
                      <li>{t.cgStep4}</li>
                    </ul>
                  </div>

                  <div className="bg-amber-100/50 p-4 rounded-xl border border-amber-200/50">
                    <h3 className="font-bold text-amber-900 text-sm mb-1">{t.cgWhatNextLabel}</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">{t.cgWhatNextText}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button 
                      onClick={handleSelectFile}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {t.cgUploadBtn}
                    </button>
                    <button className="bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm">
                      {t.cgViewReqBtn}
                    </button>
                    <button className="bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm">
                      {t.cgContactBtn}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Pre-declaration Case Warning ────────────────────────────── */}
            {uploadState === "processed" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={`rounded-2xl p-4 border flex items-start gap-3 shadow-sm ${
                  selectedCaseId === "CASE-A" 
                    ? "bg-emerald-50 border-emerald-200" 
                    : selectedCaseId === "CASE-B"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {selectedCaseId === "CASE-A" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : selectedCaseId === "CASE-B" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <p className={`text-sm font-semibold leading-relaxed ${
                  selectedCaseId === "CASE-A" 
                    ? "text-emerald-800" 
                    : selectedCaseId === "CASE-B"
                    ? "text-amber-800"
                    : "text-red-800"
                }`}>
                  {selectedCaseId === "CASE-A" ? t.warningCaseA : selectedCaseId === "CASE-B" ? t.warningCaseB : t.warningCaseC}
                </p>
              </motion.div>
            )}

            {/* ── Declaration ─────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-sakan-border rounded-2xl p-5 flex gap-3.5 shadow-sm"
            >
              <input
                type="checkbox"
                id="declaration"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
                className="w-5 h-5 rounded border-sakan-border text-sakan-navy focus:ring-sakan-navy mt-0.5 cursor-pointer shrink-0 accent-sakan-navy"
              />
              <label htmlFor="declaration" className="text-sm text-sakan-text/80 leading-relaxed cursor-pointer select-none">
                <span className="font-bold text-sakan-navy">{t.mandatoryDeclaration} — </span>
                {t.declarationText}
              </label>
            </motion.div>
          </div>

          {/* ── Right sidebar: Submission Checklist ───────────────────────── */}
          <div>
            <div className="space-y-6 sticky top-6">
              <motion.div
                initial={{ opacity: 0, x: isAr ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-sakan-navy text-white rounded-2xl p-6 shadow-lg"
              >
                <h3 className="font-bold text-base mb-4">{t.submissionChecklist}</h3>
                <div className="space-y-3 mb-7 text-sm">
                  {checklistItems.map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-sakan-gold shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />
                      )}
                      <span className={`${done ? "text-white/90" : "text-white/40"} transition-colors`}>{label}</span>
                    </div>
                  ))}
                </div>
                <button
                  disabled={submitDisabled}
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 bg-sakan-gold hover:bg-sakan-gold/90 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-sakan-navy font-bold py-3.5 px-4 rounded-xl transition-all shadow-md text-sm"
                >
                  {isSubmitting ? t.submittingBtn : t.submitBtn}
                  {!isSubmitting && <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />}
                </button>
                <p className="text-xs text-white/35 text-center mt-3 leading-relaxed">{t.submitNote}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: isAr ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-5 border border-sakan-border shadow-sm flex items-start gap-3"
              >
                <Info className="w-5 h-5 text-sakan-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sakan-navy text-sm mb-1.5">{t.whatHappensNext}</h4>
                  <p className="text-xs text-sakan-text/70 leading-relaxed">{t.whatHappensNextText}</p>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
