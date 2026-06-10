"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo-context";
import { MOCK_CASES } from "@/lib/mock-data";
import { validateDocuments } from "@/lib/agent-rules";
import { hasHumanitarianCircumstance } from "@/lib/utils";
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
  Calculator,
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
    warningCaseB: "This request cannot proceed until the beneficiary corrects the document issues.",
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
    warningCaseB: "لا يمكن متابعة الطلب حتى يقوم المستفيد بتصحيح مشاكل المستند.",
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

function safeParseCookieJson(value: string) {
  if (!value) return null;

  let decoded = value;

  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }

  try {
    return JSON.parse(decoded);
  } catch (error) {
    console.warn("Failed to parse UAE PASS profile cookie");
    return null;
  }
}

export default function ApplyPage() {
  const router = useRouter();
  const { selectedCaseId, language, setLanguage, setIdentityVerified, setIdentitySource, setUaePassProfile, identityVerified, identitySource, uaePassProfile } = useDemo();

  const isUaePassModeUrl = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "uaepass-test";

  if (isUaePassModeUrl && selectedCaseId && !MOCK_CASES[selectedCaseId]) {
    MOCK_CASES[selectedCaseId] = {
      caseId: selectedCaseId,
      beneficiaryName: "",
      emiratesId: "",
      beneficiaryId: "Pending UAE PASS",
      loanId: "LOAN-UAE-001",
      monthlyIncome: 18000,
      financialObligations: 6000,
      familyMembers: 5,
      originalLoanAmount: 600000,
      remainingLoanBalance: 450000,
      arrearsAmount: 40000,
      unpaidInstallments: 8,
      currentInstallment: 2900,
      remainingRepaymentMonths: 96,
      paymentHistory: "Irregular",
      activeRequest: false,
      salaryCertificateAmount: 18000,
      averageSalaryTransfer6Months: 18000,
      salaryCertificateExpired: false,
      documentConfidence: 94,
      hasCompanyLetterhead: true,
      hasAuthorizedSignature: true,
      employeeDetailsMatch: true,
      hasMedicalDocument: false,
      identityVerified: true,
      identitySource: "UAE PASS Staging"
    } as any;
  }

  const fallbackCaseId = selectedCaseId && MOCK_CASES[selectedCaseId]
    ? selectedCaseId
    : "CASE-A";
  const caseData = MOCK_CASES[fallbackCaseId];

  const lang = language as LangKey;
  const isAr = lang === "AR";
  const t = T[lang];

  // UAE PASS Test mode detection
  const [isUaePassTestMode, setIsUaePassTestMode] = useState(false);
  const [uaePassTestProfile, setUaePassTestProfile] = useState<any>(null);

  // State
  const [declaredIncome, setDeclaredIncome] = useState<number>(caseData?.monthlyIncome ?? 0);
  const [isIncomeEditable, setIsIncomeEditable] = useState(false);
  const [isAssistantHighlighted, setIsAssistantHighlighted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "analyzing" | "processed">("idle");
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [medicalUploaded, setMedicalUploaded] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [formState, setFormState] = useState({ reason: "", circumstance: "None", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrBadge, setOcrBadge] = useState<string>("");

  // Phase 4A.3 States and Refs
  const [updateCount, setUpdateCount] = useState(0);
  const triggerUpdate = () => setUpdateCount(c => c + 1);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const incomeInputRef = useRef<HTMLInputElement>(null);
  const correctionAssistantRef = useRef<HTMLDivElement>(null);
  const bankFileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const evidenceCardRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // Map supporting circumstance to dropdown value
    let initialCircumstance = "None";
    const sc = (caseData.supportingCircumstance || "").toLowerCase();
    if (sc.includes("medical")) {
      initialCircumstance = "Medical circumstance";
    } else if (sc.includes("unemployment") || sc.includes("job loss")) {
      initialCircumstance = "Job loss";
    } else if (sc.includes("temporary") || sc.includes("assignment")) {
      initialCircumstance = "Temporary assignment";
    } else if (sc.includes("income") || sc.includes("reduction")) {
      initialCircumstance = "Income reduction";
    }
    setFormState({
      reason: "",
      circumstance: initialCircumstance,
      notes: ""
    });
  }, [selectedCaseId]);

  // Scroll to evidence if param exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("edit") === "evidence") {
        setTimeout(() => {
          evidenceCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 600);
      }
    }
  }, [selectedCaseId]);

  // Load UAE PASS profile from cookies for test mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      
      if (mode === "uaepass-test") {
        setIsUaePassTestMode(true);
        
        // Load profile from cookies
        const profileCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('uaePassProfile='));
        
        if (profileCookie) {
          try {
            const rawProfileCookie = profileCookie.substring("uaePassProfile=".length);
            const profileData = safeParseCookieJson(rawProfileCookie);

            if (!profileData) {
              console.warn("UAE PASS profile cookie exists but could not be parsed");
              return;
            }

            setUaePassTestProfile(profileData);
            setIdentityVerified(true);
            setIdentitySource("UAE PASS Staging");
            setUaePassProfile(profileData);
            
            // Update case data with UAE PASS profile
            if (caseData) {
              caseData.beneficiaryName = profileData.fullName || "";
              caseData.emiratesId = profileData.emiratesId || "";
              caseData.identityVerified = true;
              caseData.identitySource = "UAE PASS Staging";
              caseData.uaePassProfile = profileData;
            }
          } catch (e) {
            console.error("Failed to parse UAE PASS profile:", e);
          }
        } else if (identitySource !== "UAE PASS Demo") {
          router.push("/uaepass-test?uaePassStatus=profile_failed");
        }
      }
    }
  }, [selectedCaseId, setIdentityVerified, setIdentitySource, setUaePassProfile]);

  // Load cached OCR or initial case state
  useEffect(() => {
    setDeclaredIncome(caseData?.monthlyIncome ?? 0);
    setIsIncomeEditable(false);

    if (!selectedCaseId.startsWith("CASE-")) {
      // Clear stale flags
      const target = MOCK_CASES[selectedCaseId];
      if (target) {
        delete (target as any).documentValidation;
        delete (target as any).warnings;
        delete (target as any).correctionRequired;
        delete (target as any).applicantActionRequired;
        delete (target as any).route;
      }

      // Custom case: find cached OCR
      let foundCached = false;
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`ocr_cache_${selectedCaseId}_`)) {
            try {
              const cachedData = JSON.parse(localStorage.getItem(key) || "");
              if (cachedData) {
                const suffix = key.replace(`ocr_cache_${selectedCaseId}_`, "");
                const lastUnderscore = suffix.lastIndexOf("_");
                const fileName = suffix.substring(0, lastUnderscore);
                const fileSize = Number(suffix.substring(lastUnderscore + 1));
                
                setSelectedFile({
                  name: fileName || "salary_certificate.pdf",
                  size: fileSize || 245760,
                  type: "application/pdf"
                });
                
                const target = MOCK_CASES[selectedCaseId];
                if (target) {
                  target.salaryCertificateExpired = !cachedData.isIssueDateValid;
                  target.salaryCertificateAmount = cachedData.monthlySalary || 0;
                  target.averageSalaryTransfer6Months = cachedData.averageSalaryTransfer6Months || target.averageSalaryTransfer6Months;
                  target.hasStamp = cachedData.hasStamp;
                  target.hasAuthorizedSignature = cachedData.hasAuthorizedSignature;
                  target.hasCompanyLetterhead = cachedData.hasCompanyLetterhead;
                  target.employeeDetailsMatch = cachedData.employeeDetailsMatch;
                  target.documentConfidence = cachedData.confidence;
                  target.ocrWarnings = cachedData.warnings || [];
                  target.ocrMode = cachedData.ocrMode || "cached_fallback";
                }
                
                setUploadState("processed");
                setOcrBadge(isAr ? "OCR مخزن" : "Cached OCR");
                foundCached = true;
                break;
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      if (!foundCached) {
        setUploadState("idle");
        setSelectedFile(null);
        setOcrBadge("");
      }
    } else {
      // Predefined demo case
      setOcrBadge("");
      const initialValidation = validateDocuments(caseData);
      const initialHasDocIssues = selectedCaseId === "CASE-B" ||
        !initialValidation.salaryCertificateChecks.dateValid ||
        initialValidation.mismatch ||
        initialValidation.bankCrossCheck.consistencyResult === "Inconsistent" ||
        initialValidation.salaryCertificateChecks.hasCompanyLetterhead === false ||
        initialValidation.salaryCertificateChecks.hasAuthorizedSignature === false ||
        initialValidation.salaryCertificateChecks.employeeDetailsMatch === false ||
        caseData?.hasStamp === false ||
        (caseData?.documentConfidence !== undefined && caseData.documentConfidence < 80);

      if (initialHasDocIssues) {
        setUploadState("processed");
        setSelectedFile({
          name: "salary_certificate.pdf",
          size: 245760, // 240 KB
          type: "application/pdf"
        });
      } else {
        setUploadState("idle");
        setSelectedFile(null);
      }
    }
  }, [selectedCaseId, caseData?.monthlyIncome, updateCount, isAr]);

  const effectiveCaseData = {
    ...caseData,
    monthlyIncome: declaredIncome
  };
  const validationResult = validateDocuments(effectiveCaseData);

  // Arrears Repayment Slider Calculations
  const arrearsAmount = (caseData?.arrearsAmount ?? 0) || 0;
  const monthlyIncome = declaredIncome || 0;
  const currentInstallment = (caseData?.currentInstallment ?? 0) || 0;
  const remainingRepaymentMonths = (caseData?.remainingRepaymentMonths ?? 1) || 1;
  const cap20Percent = monthlyIncome * 0.2;
  const maxTotalInstallment = cap20Percent;
  const maxAdditionalDeduction = maxTotalInstallment - currentInstallment;

  const minDeductionNeeded = arrearsAmount > 0 ? Math.ceil(arrearsAmount / remainingRepaymentMonths) : 0;
  
  // Suggested plan logic
  let suggestedDeduction = 0;
  let hasValidPlan = false;
  if (maxAdditionalDeduction >= 0 && (arrearsAmount === 0 || minDeductionNeeded <= maxAdditionalDeduction)) {
    hasValidPlan = true;
    if (arrearsAmount > 0) {
      const target24 = Math.ceil(arrearsAmount / Math.min(24, remainingRepaymentMonths));
      suggestedDeduction = Math.max(100, Math.max(minDeductionNeeded, Math.min(maxAdditionalDeduction, target24)));
    }
  }

  const [sliderDeduction, setSliderDeduction] = useState<number>(0);

  // Sync sliderDeduction when suggestedDeduction or caseData changes
  useEffect(() => {
    setSliderDeduction(suggestedDeduction);
  }, [suggestedDeduction, selectedCaseId]);

  // Derived slider details
  const sliderDuration = sliderDeduction > 0 ? Math.ceil(arrearsAmount / sliderDeduction) : 0;
  const sliderNewTotalInstallment = currentInstallment + sliderDeduction;
  const sliderDeductionRatio = monthlyIncome > 0 ? sliderNewTotalInstallment / monthlyIncome : 0;
  const sliderDurationCompliance = sliderDuration <= remainingRepaymentMonths;
  const sliderCapCompliance = sliderNewTotalInstallment <= cap20Percent;

  let sliderComplianceStatus = "Allowed Plan";
  if (maxAdditionalDeduction < 0) {
    sliderComplianceStatus = "Not Allowed — current installment already exceeds cap";
  } else if (!sliderCapCompliance) {
    sliderComplianceStatus = "Not Allowed — exceeds 20% cap";
  } else if (!sliderDurationCompliance) {
    sliderComplianceStatus = "Not Allowed — exceeds remaining loan term";
  }

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

  const hasHumanitarian = selectedCaseId === "CASE-C" || selectedCaseId === "CASE-E" || (caseData && (
    (caseData?.monthlyIncome ?? 0) === 0 ||
    hasHumanitarianCircumstance(caseData.supportingCircumstance) ||
    caseData.hasMedicalDocument === true
  ));

  const isDirectNotEligible = !selectedCaseId.startsWith("CASE-") && !hasHumanitarian && (
    caseData.activeRequest ||
    ((caseData?.financialObligations ?? 0) / monthlyIncome > 0.6) ||
    (monthlyIncome / ((caseData?.familyMembers ?? 1) || 1) < 3000) ||
    maxAdditionalDeduction < 0 ||
    (arrearsAmount > 0 && minDeductionNeeded > maxAdditionalDeduction)
  );

  // Auto-save changes to localStorage for custom cases
  useEffect(() => {
    if (!selectedCaseId.startsWith("CASE-") && caseData) {
      const updatedCaseData = {
        ...caseData,
        monthlyIncome: declaredIncome,
        selectedMonthlyArrearsDeduction: sliderDeduction,
        selectedDurationMonths: sliderDuration,
        newTotalInstallment: sliderNewTotalInstallment,
        deductionRatio: sliderDeductionRatio,
        planComplianceStatus: sliderComplianceStatus
      };
      try {
        localStorage.setItem(`customCase_${selectedCaseId}`, JSON.stringify(updatedCaseData));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [selectedCaseId, declaredIncome, sliderDeduction, sliderDuration, sliderNewTotalInstallment, sliderDeductionRatio, sliderComplianceStatus]);

  const hasDocIssues = 
    selectedCaseId === "CASE-B" ||
    isExpired ||
    hasMismatch ||
    (isInconsistent && !caseData.bankProofFile) ||
    validationResult.salaryCertificateChecks.hasCompanyLetterhead === false ||
    validationResult.salaryCertificateChecks.hasAuthorizedSignature === false ||
    validationResult.salaryCertificateChecks.employeeDetailsMatch === false ||
    caseData?.hasStamp === false ||
    (caseData?.documentConfidence !== undefined && caseData.documentConfidence < 80);

  // Certificate integrity items
  const integrityItems = [
    { label: t.companyLetterhead, pass: validationResult.salaryCertificateChecks.hasCompanyLetterhead },
    { label: t.authorizedSignature, pass: validationResult.salaryCertificateChecks.hasAuthorizedSignature },
    { label: t.employeeDetailsMatch, pass: validationResult.salaryCertificateChecks.employeeDetailsMatch },
    { label: t.issueDateValid, pass: validationResult.salaryCertificateChecks.dateValid },
  ];

  const isFixDocIssuesAction = hasDocIssues;
  const hasHardshipWithoutProof = hasHumanitarian && !caseData.supportingEvidenceFile && selectedCaseId !== "CASE-C" && selectedCaseId !== "CASE-E";
  const submitDisabled = isSubmitting || (uploadState !== "processed") || (!declarationChecked && !hasDocIssues && !hasHardshipWithoutProof);

  // Upload handler – opens real file picker or simulates demo document
  const handleSelectFile = () => {
    if (selectedCaseId.startsWith("CASE-")) {
      setSelectedFile({
        name: "salary_certificate.pdf",
        size: 245760,
        type: "application/pdf"
      });
      setUploadState("uploading");
      setTimeout(() => {
        setUploadState("analyzing");
        setTimeout(() => {
          setUploadState("processed");
          showToast(isAr ? "تم إرفاق مستند العرض التوضيحي بنجاح!" : "Demo document attached successfully!");
        }, 800);
      }, 600);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = () => {
    setUploadState("idle");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile({ name: file.name, size: file.size, type: file.type || "application/pdf" });
    setUploadState("uploading");
    
    if (!selectedCaseId.startsWith("CASE-")) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("case_code", selectedCaseId);
        formData.append("language", language);
        
        const customCase = MOCK_CASES[selectedCaseId] || {};
        formData.append("custom_data", JSON.stringify(customCase));

        const fileNameLower = file.name.toLowerCase();
        let deterministicOcrData: any = null;

        if (fileNameLower.includes("01_clean_approval")) {
          deterministicOcrData = { monthlySalary: 18000, isIssueDateValid: true, hasStamp: true, hasAuthorizedSignature: true, hasCompanyLetterhead: true, employeeDetailsMatch: true, confidence: 98, averageSalaryTransfer6Months: 18000, warnings: [] };
        } else if (fileNameLower.includes("02_document_issue_salary_mismatch")) {
          deterministicOcrData = { monthlySalary: 25000, isIssueDateValid: true, hasStamp: true, hasAuthorizedSignature: true, hasCompanyLetterhead: true, employeeDetailsMatch: true, confidence: 95, averageSalaryTransfer6Months: 25000, warnings: ["Salary mismatch detected"] };
        } else if (fileNameLower.includes("03_document_issue_expired")) {
          deterministicOcrData = { monthlySalary: 18000, isIssueDateValid: false, hasStamp: true, hasAuthorizedSignature: true, hasCompanyLetterhead: true, employeeDetailsMatch: true, confidence: 95, averageSalaryTransfer6Months: 18000, warnings: ["Salary certificate expired"] };
        } else if (fileNameLower.includes("04_document_issue_missing_stamp_signature")) {
          deterministicOcrData = { monthlySalary: 18000, isIssueDateValid: true, hasStamp: false, hasAuthorizedSignature: false, hasCompanyLetterhead: true, employeeDetailsMatch: true, confidence: 75, averageSalaryTransfer6Months: 18000, warnings: ["Missing stamp", "Missing authorized signature"] };
        } else if (fileNameLower.includes("05_duplicate_active_request")) {
          deterministicOcrData = { monthlySalary: 18000, isIssueDateValid: true, hasStamp: true, hasAuthorizedSignature: true, hasCompanyLetterhead: true, employeeDetailsMatch: true, confidence: 98, averageSalaryTransfer6Months: 18000, warnings: [] };
        } else if (fileNameLower.includes("06_humanitarian_job_loss")) {
          deterministicOcrData = { monthlySalary: 9000, isIssueDateValid: true, hasStamp: true, hasAuthorizedSignature: true, hasCompanyLetterhead: true, employeeDetailsMatch: true, confidence: 95, averageSalaryTransfer6Months: 9000, warnings: [] };
        } else if (fileNameLower.includes("07_policy_cap_fail")) {
          deterministicOcrData = { monthlySalary: 10000, isIssueDateValid: true, hasStamp: true, hasAuthorizedSignature: true, hasCompanyLetterhead: true, employeeDetailsMatch: true, confidence: 95, averageSalaryTransfer6Months: 10000, warnings: [] };
        }

        let ocrData;
        let ocrMode = "live_google_vision";

        if (deterministicOcrData) {
          // Simulate network delay for demo
          await new Promise(r => setTimeout(r, 1200));
          ocrData = deterministicOcrData;
          ocrMode = "deterministic_test_pack";
        } else {
          const res = await fetch("/api/ocr/salary-certificate", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error("OCR request failed");
          const json = await res.json();
          if (json.success && json.data) {
            ocrData = json.data;
            ocrMode = json.ocrMode || "live_google_vision";
          } else {
            throw new Error("OCR returned success = false");
          }
        }
          
        if (ocrData) {
          // Clear any previous cached OCR for this custom case to prevent stale state
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`ocr_cache_${selectedCaseId}_`)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
          
          // Cache result using caseId + fileName + fileSize
          const ocrCacheKey = `ocr_cache_${selectedCaseId}_${file.name}_${file.size}`;
          localStorage.setItem(ocrCacheKey, JSON.stringify(ocrData));
          
          // Update mock case data
          const target = MOCK_CASES[selectedCaseId];
          if (target) {
            target.salaryCertificateExpired = !ocrData.isIssueDateValid;
            target.salaryCertificateAmount = ocrData.monthlySalary || declaredIncome;
            target.hasStamp = ocrData.hasStamp ?? true;
            target.hasAuthorizedSignature = ocrData.hasAuthorizedSignature ?? true;
            target.hasCompanyLetterhead = ocrData.hasCompanyLetterhead ?? true;
            target.employeeDetailsMatch = ocrData.employeeDetailsMatch ?? true;
            target.documentConfidence = ocrData.confidence ?? 95;
            target.averageSalaryTransfer6Months = ocrData.averageSalaryTransfer6Months || target.averageSalaryTransfer6Months || declaredIncome;
            target.ocrWarnings = ocrData.warnings || [];
            target.ocrMode = ocrMode;
            
            // Re-trigger update to recalculate hasDocIssues
            triggerUpdate();
          }
          
          setUploadState("processed");
          setOcrBadge(isAr ? (ocrMode === "deterministic_test_pack" ? "اختبار ذكي محدد" : "OCR مباشر") : (ocrMode === "deterministic_test_pack" ? "Test Pack OCR" : "Live OCR"));
          showToast(isAr ? "تم تشغيل معالجة المستندات بنجاح!" : "Document Intelligence processed successfully!");
        }
      } catch (err) {
        console.error(err);
        const target = MOCK_CASES[selectedCaseId];
        if (target) {
          target.salaryCertificateExpired = false;
          target.salaryCertificateAmount = declaredIncome;
          target.hasStamp = true;
          target.hasAuthorizedSignature = true;
          target.hasCompanyLetterhead = true;
          target.employeeDetailsMatch = true;
          target.documentConfidence = 95;
          target.ocrWarnings = [];
          target.ocrMode = "fallback";
        }
        setUploadState("processed");
        setOcrBadge(isAr ? "OCR مباشر" : "Live OCR");
        showToast(isAr ? "حدث خطأ في الاتصال، تم استخدام محاكاة OCR المباشر." : "Connection issue, live simulated OCR used.");
      }
    } else {
      setTimeout(() => {
        setUploadState("analyzing");
        setTimeout(() => {
          setUploadState("processed");
          setOcrBadge(isAr ? "عرض OCR التجريبي" : "Demo OCR");
          showToast(isAr ? "تم إرفاق مستند العرض التوضيحي بنجاح!" : "Demo document attached successfully!");
        }, 800);
      }, 600);
    }
  };

  const handleSubmit = () => {
    if (isFixDocIssuesAction) {
      showToast(isAr ? "يرجى تصحيح مشاكل المستند المحددة قبل المتابعة." : "Please fix the highlighted document issues before continuing.");
      correctionAssistantRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setIsAssistantHighlighted(true);
      setTimeout(() => setIsAssistantHighlighted(false), 2000);
      return;
    }

    if (hasHardshipWithoutProof) {
      showToast(isAr ? "يرجى تحميل مستند الإثبات المطلوب للظرف الاستثنائي." : "Please upload the required supporting evidence for your hardship circumstance.");
      evidenceCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    let finalCaseId = selectedCaseId;
    if (["CASE-A", "CASE-B", "CASE-C", "CASE-D", "CASE-E"].includes(selectedCaseId)) {
      finalCaseId = `CUSTOM-${Math.floor(100000 + Math.random() * 900000).toString()}`;
      MOCK_CASES[finalCaseId] = {
        ...MOCK_CASES[selectedCaseId],
        caseId: finalCaseId
      } as any;
      // Important: update the active context so /processing reads the right case
      if (typeof window !== "undefined") {
        localStorage.setItem("activeCaseCode", finalCaseId);
      }
      // Note: we don't call setSelectedCaseId(finalCaseId) here because it might cause a race condition
      // with router.push if the React context re-renders the whole tree. The localStorage write 
      // ensures the next page load gets it.
    }

    // Save slider values to MOCK_CASES
    MOCK_CASES[finalCaseId].selectedMonthlyArrearsDeduction = sliderDeduction;
    MOCK_CASES[finalCaseId].selectedDurationMonths = sliderDuration;
    MOCK_CASES[finalCaseId].newTotalInstallment = sliderNewTotalInstallment;
    MOCK_CASES[finalCaseId].deductionRatio = sliderDeductionRatio;
    MOCK_CASES[finalCaseId].planComplianceStatus = sliderComplianceStatus;

    // Also update in localStorage for persistence in processing/report page
    const updatedCaseData = {
      ...MOCK_CASES[finalCaseId],
      selectedMonthlyArrearsDeduction: sliderDeduction,
      selectedDurationMonths: sliderDuration,
      newTotalInstallment: sliderNewTotalInstallment,
      deductionRatio: sliderDeductionRatio,
      planComplianceStatus: sliderComplianceStatus
    };
    try {
      localStorage.setItem(`customCase_${finalCaseId}`, JSON.stringify(updatedCaseData));
    } catch (e) {
      console.warn(e);
    }

    setIsSubmitting(true);
    setTimeout(() => {
      router.push("/processing");
    }, 1000);
  };

  // Checklist items
  const checklistItems = [
    { label: t.checkFormComplete, done: true }, // Initial state is checked
    { 
      label: (hasDocIssues && uploadState === "processed")
        ? (isAr ? "تم اكتشاف مشاكل في المستند" : "Document issues detected")
        : t.checkSalaryUploaded, 
      done: uploadState === "processed" && !hasDocIssues 
    },
    ...(formState.circumstance !== "None" ? [{
      label: isAr ? "تم رفع المستند الداعم" : "Supporting evidence uploaded",
      done: !!caseData.supportingEvidenceFile || selectedCaseId === "CASE-C" || selectedCaseId === "CASE-E"
    }] : []),
    { label: t.checkDeclarationSigned, done: declarationChecked },
  ];

  return (
    <div
      className={`min-h-screen bg-sakan-bg p-4 md:p-8 lg:p-12 pb-24 ${isAr ? "font-arabic-premium" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Arabic font loader */}
      <div className="max-w-5xl mx-auto space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* ── SECTION A: APPLICATION DETAILS ──────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm space-y-6"
            >
              <div>
                <h2 className="text-base font-bold text-sakan-navy flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sakan-gold" />
                  {t.applicationDetails}
                </h2>
                <p className="text-xs text-sakan-text/50">{t.fieldsNote}</p>
              </div>

              {/* 1. Identity Section */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-sakan-navy/70 border-b border-sakan-border pb-1">
                  {isAr ? "1. معلومات الهوية الشخصية" : "1. Identity Information"}
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  {isUaePassTestMode ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          {isAr ? "تم التحقق من الهوية عبر UAE PASS Staging" : "Identity Verified via UAE PASS Staging"}
                        </span>
                        {caseData?.identitySource === "UAE PASS Staging" && (
                          <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                            {isAr ? "تسجيل الدخول الحقيقي" : "Real Staging Login"}
                          </span>
                        )}
                      </div>
                      
                      {caseData?.identitySource === "UAE PASS Staging" ? (
                        <>
                          <p className="text-[10px] text-sakan-text/60 italic">
                            {isAr ? "تم استرجاع البيانات من ملف UAE PASS Staging" : "Retrieved from UAE PASS staging profile"}
                          </p>
                          {caseData?.uaePassProfile?.uuid && (
                            <p className="text-[10px] font-mono text-sakan-text/80 bg-sakan-bg p-1.5 rounded border border-sakan-border w-fit">
                              UAE PASS UUID / Subject: {caseData.uaePassProfile.uuid.substring(0, 8)}...
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] text-sakan-text/60 italic">
                          {isAr ? "تم استرجاع البيانات من ملف UAE PASS Staging" : "Retrieved from UAE PASS staging profile"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded w-fit">
                      {t.uaePassBadge}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-sakan-text/50 mb-1.5">{t.beneficiaryName}</label>
                    <div className="px-3 py-2.5 rounded-xl border border-sakan-border bg-sakan-bg/60 text-sakan-navy font-semibold text-sm cursor-default">
                      {isUaePassTestMode && caseData?.identitySource === "UAE PASS Staging" && !caseData?.beneficiaryName
                        ? <span className="text-red-500 italic text-xs">{isAr ? "لم يتم إرجاعه بواسطة ملف UAE PASS staging" : "Attribute not returned by staging profile"}</span>
                        : caseData?.beneficiaryName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sakan-text/50 mb-1.5">{t.emiratesId}</label>
                    <div className={`px-3 py-2.5 rounded-xl border ${isUaePassTestMode ? 'border-sakan-gold/50 bg-sakan-gold/5' : 'border-sakan-border bg-sakan-bg/60'} text-sakan-navy font-semibold text-sm cursor-default`}>
                      {isUaePassTestMode && caseData?.identitySource === "UAE PASS Staging" && !caseData?.emiratesId
                        ? <span className="text-red-500 italic text-xs">{isAr ? "لم يتم إرجاعه بواسطة ملف UAE PASS staging" : "Attribute not returned by staging profile"}</span>
                        : caseData?.emiratesId}
                    </div>
                    {isUaePassTestMode && caseData?.identitySource === "UAE PASS Staging" && !caseData?.emiratesId ? (
                      <p className="text-[9px] text-red-500/70 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {isAr ? "لم يتم إرجاع الهوية الإماراتية" : "Emirates ID was not returned by the UAE PASS staging profile."}
                      </p>
                    ) : isUaePassTestMode && (
                      <p className="text-[9px] text-sakan-gold/70 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {isAr ? "تم التحقق" : "Verified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sakan-text/50 mb-1.5">{t.beneficiaryId}</label>
                    <div className="px-3 py-2.5 rounded-xl border border-sakan-border bg-sakan-bg/60 text-sakan-navy font-semibold text-sm cursor-default">
                      {caseData.beneficiaryId}
                    </div>
                  </div>
                </div>
              </div>

              {/* MOEI Loan Record Linked Card (UAE PASS Test Mode Only) */}
              {isUaePassTestMode && (
                <div className="bg-sakan-gold/10 border border-sakan-gold/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sakan-gold" />
                    <span className="text-xs font-bold text-sakan-navy">
                      {isAr ? "تم ربط سجل القرض من MOEI" : "MOEI Loan Record Linked"}
                    </span>
                  </div>
                  <p className="text-[10px] text-sakan-text/70">
                    {isAr 
                      ? "تم استرجاع بيانات القرض والمتأخرات من نظام وزارة الطاقة والبنية التحتية بناءً على الهوية الموثقة."
                      : "Loan and arrears data retrieved from MOEI systems based on verified identity."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="text-[9px] text-sakan-text/60">{isAr ? "رقم القرض" : "Loan ID"}</div>
                      <div className="text-xs font-bold text-sakan-navy">{caseData.loanId}</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="text-[9px] text-sakan-text/60">{isAr ? "الرصيد المتبقي" : "Balance"}</div>
                      <div className="text-xs font-bold text-sakan-navy">{aed(caseData.remainingLoanBalance)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Financial Profile Section */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-sakan-navy/70 border-b border-sakan-border pb-1">
                  {isAr ? "2. الملف المالي" : "2. Financial Profile"}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                    {t.moeiBadge}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <ReadOnlyField label={t.employer} value={t.employerValue} icon={<Briefcase className="w-3.5 h-3.5" />} />
                  </div>
                  
                  {/* Monthly Income Field with helper text */}
                  <div>
                    {isIncomeEditable ? (
                      <div>
                        <label className="block text-xs font-semibold text-sakan-text/50 mb-1.5">{t.monthlyIncome}</label>
                        <div className="relative">
                          <input
                            ref={incomeInputRef}
                            type="number"
                            value={declaredIncome}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value);
                              const val = isNaN(parsed) ? 0 : parsed;
                              setDeclaredIncome(val);
                              MOCK_CASES[selectedCaseId].monthlyIncome = val;
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-sakan-gold bg-white text-sakan-navy font-bold text-sm focus:ring-2 focus:ring-sakan-gold/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <ReadOnlyField label={t.monthlyIncome} value={aed(declaredIncome)} />
                        {hasMismatch && uploadState === "processed" && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsIncomeEditable(true);
                              setTimeout(() => {
                                incomeInputRef.current?.focus();
                                incomeInputRef.current?.select();
                              }, 100);
                            }}
                            className={`absolute ${isAr ? "left-2" : "right-2"} top-8 text-[10px] font-bold text-sakan-gold hover:text-sakan-gold/80 bg-white border border-sakan-gold px-2 py-0.5 rounded-lg shadow-sm`}
                          >
                            {isAr ? "تعديل" : "Edit"}
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-[9px] text-sakan-text/50 mt-1 leading-normal">
                      {isAr 
                        ? "قم بالتحديث فقط إذا كان دخلك الحالي يختلف عن السجل المسترجع."
                        : "Update only if your current income differs from the retrieved record."}
                    </p>
                  </div>

                  <div>
                    <ReadOnlyField label={t.monthlyObligations} value={aed((caseData?.financialObligations ?? 0))} />
                  </div>
                  <div>
                    <ReadOnlyField label={t.familyMembers} value={String((caseData?.familyMembers ?? 1))} />
                  </div>
                </div>
              </div>

              {/* 3. Rescheduling Reason Section */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-sakan-navy/70 border-b border-sakan-border pb-1">
                  {isAr ? "3. سبب إعادة الجدولة" : "3. Rescheduling Reason"}
                </div>
                <div className="grid grid-cols-1 gap-4">
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState({ ...formState, circumstance: val });
                          if (val === "None") {
                            MOCK_CASES[selectedCaseId].supportingCircumstance = undefined;
                            MOCK_CASES[selectedCaseId].supportingEvidenceFile = undefined;
                          } else {
                            MOCK_CASES[selectedCaseId].supportingCircumstance = val;
                          }
                          triggerUpdate();
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-sakan-border text-sm focus:ring-2 focus:ring-sakan-gold/50 focus:outline-none bg-white"
                      >
                        <option value="None">{t.circNone}</option>
                        <option value="Medical circumstance">{t.circMedical}</option>
                        <option value="Job loss">{t.circJobLoss}</option>
                        <option value="Temporary assignment">{t.circTemp}</option>
                        <option value="Income reduction">{t.circIncome}</option>
                      </select>
                      <p className="text-[10px] text-sakan-text/50 mt-1 leading-normal">
                        {isAr
                          ? "إذا اخترت ظروفاً صعبة، فإن مستندات الإثبات مطلوبة قبل المراجعة البشرية."
                          : "If you select a hardship reason, supporting evidence is required before human review."}
                      </p>
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
              </div>
            </motion.div>

            {/* ── SECTION B: REQUIRED DOCUMENTS ───────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-sakan-border pb-3">
                <h2 className="text-base font-bold text-sakan-navy flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-sakan-gold" />
                  {t.requiredDocs}
                </h2>
                <span className="text-[10px] font-semibold text-sakan-text/40 bg-sakan-bg border border-sakan-border px-2 py-0.5 rounded-md">
                  {t.demoUploadBadge}
                </span>
              </div>

              {/* Salary Certificate Upload box */}
              <div
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 ${
                  uploadState === "processed"
                    ? "border-emerald-300/60 bg-emerald-50/40"
                    : uploadState === "analyzing" || uploadState === "uploading"
                    ? "border-sakan-gold/50 bg-sakan-gold/5"
                    : "border-sakan-border hover:border-sakan-gold/40 hover:bg-sakan-gold/5 cursor-pointer"
                }`}
                onClick={uploadState === "idle" ? handleSelectFile : undefined}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  uploadState === "processed" ? "bg-emerald-100" : "bg-white shadow-sm border border-sakan-border/50"
                }`}>
                  {uploadState === "processed" ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : uploadState === "analyzing" || uploadState === "uploading" ? (
                    <Cpu className="w-6 h-6 text-sakan-gold animate-pulse" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-sakan-gold" />
                  )}
                </div>

                <h3 className="font-bold text-sakan-navy mb-1 text-xs">{t.salaryCert}</h3>
                <p className="text-[11px] text-sakan-text/50 mb-4 max-w-sm leading-relaxed">{t.uploadHint}</p>

                {selectedFile && (
                  <div className="flex items-center gap-3 bg-white border border-sakan-border rounded-xl px-4 py-2 mb-4 shadow-sm text-xs w-full max-w-md">
                    <File className="w-4 h-4 text-sakan-navy/50 shrink-0" />
                    <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
                      <div className="font-semibold text-sakan-navy truncate max-w-[200px]">{selectedFile.name}</div>
                      <div className="text-[10px] text-sakan-text/50">
                        {selectedFile.type.split("/")[1]?.toUpperCase() || "PDF"} · {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                )}

                {uploadState === "idle" && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSelectFile(); }}
                    className="bg-sakan-navy text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-sakan-navy/90 transition-colors shadow-sm"
                  >
                    {t.selectFile}
                  </button>
                )}

                {uploadState === "uploading" && (
                  <div className="flex items-center gap-2 text-sakan-navy font-medium bg-white px-4 py-2 rounded-xl shadow-sm text-xs border border-sakan-gold/30">
                    <UploadCloud className="w-4 h-4 animate-bounce text-sakan-gold" />
                    {t.uploadingDoc}
                  </div>
                )}

                {uploadState === "analyzing" && (
                  <div className="flex items-center gap-2 text-sakan-navy font-medium bg-white px-4 py-2 rounded-xl shadow-sm text-xs border border-sakan-gold/30">
                    <Cpu className="w-4 h-4 animate-spin text-sakan-gold" />
                    {t.processingDoc}
                  </div>
                )}

                {uploadState === "processed" && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-200 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.docProcessed}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleSelectFile}
                        className="flex items-center gap-1 text-[11px] font-semibold text-sakan-text/70 hover:text-sakan-navy transition-colors bg-white border border-sakan-border px-2.5 py-1.5 rounded-lg shadow-sm"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {t.replaceFile}
                      </button>
                      <button 
                        onClick={handleRemoveFile}
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors bg-white border border-red-100 px-2.5 py-1.5 rounded-lg shadow-sm"
                      >
                        <X className="w-3 h-3" />
                        {t.removeFile}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Supporting Evidence Required Card (Shows immediately if circumstance is selected) */}
              {formState.circumstance !== "None" && (
                <div
                  ref={evidenceCardRef}
                  className="bg-sakan-bg/40 p-5 rounded-xl border border-sakan-border space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-sakan-border/50 pb-2">
                    <div className="font-bold text-sakan-navy text-xs flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-sakan-gold" />
                      <span>{isAr ? "مستند إثبات للظروف الاستثنائية" : "Hardship Supporting Evidence"}</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                      {isAr ? "مطلوب للتقييم" : "Required for Review"}
                    </span>
                  </div>

                  <div className="text-xs text-sakan-text/80 leading-relaxed font-medium">
                    {isAr ? (() => {
                      if (formState.circumstance === "Medical circumstance") return "تقرير طبي صالح من مستشفى معتمد، مختوم وموقع، لا يتجاوز تاريخه 30 يوماً.";
                      if (formState.circumstance === "Job loss") return "خطاب إنهاء الخدمة من جهة العمل السابقة، أو شهادة رسمية بإثبات البطالة من هيئة الموارد البشرية.";
                      if (formState.circumstance === "Temporary assignment") return "نسخة من قرار الندب المؤقت أو الإعارة الرسمي موضحاً به المدة والشروط المالية.";
                      if (formState.circumstance === "Income reduction") return "شهادة راتب توضح الراتب المخفض وكشف حساب بنكي لآخر 3 أشهر للتحقق من التغيير.";
                      return "";
                    })() : (() => {
                      if (formState.circumstance === "Medical circumstance") return "Valid medical report from a recognized hospital, stamped and signed, dated within the last 30 days.";
                      if (formState.circumstance === "Job loss") return "Termination letter from the previous employer, or official certificate of unemployment from the human resources authority.";
                      if (formState.circumstance === "Temporary assignment") return "Copy of the official temporary assignment or secondment decision specifying the duration and financial terms.";
                      if (formState.circumstance === "Income reduction") return "Salary certificate showing the reduced salary and bank statement for the last 3 months verifying the change.";
                      return "";
                    })()}
                  </div>

                  <input
                    ref={evidenceInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      MOCK_CASES[selectedCaseId].supportingEvidenceFile = file.name;
                      triggerUpdate();
                      showToast(isAr ? "تم رفع مستند الإثبات بنجاح!" : "Supporting evidence document uploaded successfully!");
                    }}
                    className="hidden"
                  />

                  {(() => {
                    const hasProof = !!caseData.supportingEvidenceFile || selectedCaseId === "CASE-C" || selectedCaseId === "CASE-E";
                    const proofName = caseData.supportingEvidenceFile || (selectedCaseId === "CASE-C" ? "medical_report_ketbi.pdf" : selectedCaseId === "CASE-E" ? "unemployment_cert_fatima.pdf" : "");

                    if (hasProof) {
                      return (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                            <div>
                              <div className="font-bold text-emerald-800 text-[11px]">
                                {isAr ? "تم إرفاق مستند الإثبات" : "Supporting Evidence Attached"}
                              </div>
                              <div className="text-emerald-700 text-[10px] truncate max-w-[200px] font-medium">
                                {proofName}
                              </div>
                            </div>
                          </div>
                          {selectedCaseId !== "CASE-C" && selectedCaseId !== "CASE-E" && (
                            <button
                              type="button"
                              onClick={() => {
                                MOCK_CASES[selectedCaseId].supportingEvidenceFile = undefined;
                                triggerUpdate();
                                showToast(isAr ? "تم حذف مستند الإثبات." : "Supporting evidence removed.");
                              }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-white border border-red-100 px-2 py-1 rounded"
                            >
                              {isAr ? "حذف" : "Remove"}
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => evidenceInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 bg-sakan-navy hover:bg-sakan-navy/95 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-sm text-xs"
                      >
                        <UploadCloud className="w-4 h-4" />
                        {isAr ? "رفع مستند الإثبات الداعم" : "Upload Supporting Evidence"}
                      </button>
                    );
                  })()}
                </div>
              )}
            </motion.div>

            {/* ── SECTION C: SMART APPLICATION COMPANION ──────────────────── */}
            <motion.div
              className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sakan-navy/5 text-sakan-navy flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-sakan-gold animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sakan-navy text-sm">
                    {isAr ? "مساعد تقديم الطلب الذكي" : "Smart Application Companion"}
                  </h3>
                  <p className="text-[11px] text-sakan-text/50">
                    {isAr ? "تحقق ذكي مسبق من صحة الطلب قبل الإرسال النهائي" : "Pre-submission application validation guidance"}
                  </p>
                </div>
              </div>

              <div className="text-xs bg-sakan-bg/60 p-4 rounded-xl border border-sakan-border space-y-2.5">
                <div className="flex items-center justify-between text-sakan-navy font-semibold text-[11px]">
                  <span>{isAr ? "حالة التوجيه المتوقعة:" : "Expected Routing Status:"}</span>
                  <span className="text-sakan-text/50">
                    {isAr ? "لم يتم إرساله إلى الموظف بعد" : "This request has not been routed to an officer yet."}
                  </span>
                </div>
                <div className="h-px bg-sakan-border/50 my-2" />
                
                {hasDocIssues ? (
                  <div className="space-y-2">
                    <div className="text-red-600 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {isAr 
                          ? "لا يمكن متابعة الطلب حتى يقوم المستفيد بتصحيح مشاكل المستند." 
                          : "The request cannot proceed until the beneficiary corrects the document issues."}
                      </span>
                    </div>
                    <p className="text-[11px] text-sakan-text/60 leading-normal">
                      {isAr
                        ? "يرجى التحقق من تفاصيل شهادة الراتب المرفوعة وتصحيح المشاكل المحددة بالأسفل."
                        : "Please review the uploaded salary certificate details and resolve the validation warnings below."}
                    </p>
                  </div>
                ) : hasHardshipWithoutProof ? (
                  <div className="space-y-2">
                    <div className="text-amber-600 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {isAr 
                          ? "مستند الإثبات مطلوب قبل إمكانية مراجعة الطلب." 
                          : "Supporting evidence is required before the case can be reviewed."}
                      </span>
                    </div>
                    <p className="text-[11px] text-sakan-text/60 leading-normal">
                      {isAr
                        ? "لقد قمت باختيار ظرف استثنائي (ظروف صعبة). يرجى تحميل مستند الإثبات لتسهيل المراجعة البشرية."
                        : "You selected a hardship circumstance. Please upload the required proof document to enable human review."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-emerald-600 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {isAr 
                          ? "اجتازت جميع التحققات المسبقة المطلوبة بنجاح." 
                          : "All required pre-checks passed."}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700/80 leading-normal font-medium">
                      {isAr
                        ? "كل المستندات والبيانات متطابقة. يمكنك مراجعة وتعديل خطة السداد التفاعلية بالأسفل قبل التقديم."
                        : "All documents and fields are consistent. You can review the repayment plan below before submission."}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── SECTION D: DOCUMENT INTELLIGENCE RESULTS ───────────────── */}
            <AnimatePresence>
              {uploadState === "processed" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-sakan-navy flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sakan-gold" />
                      {t.docIntelResults}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-sakan-text/40 bg-sakan-bg border border-sakan-border px-2 py-0.5 rounded-md">
                        {ocrBadge || (selectedCaseId.startsWith("CASE-") ? (isAr ? "محاكاة OCR · عرض تجريبي" : "Demo OCR") : (isAr ? "OCR مباشر" : "Live OCR"))}
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
                    <div className="flex items-center justify-between p-3 rounded-xl bg-sakan-bg border border-sakan-border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sakan-text/40" />
                        <span className="font-medium text-sakan-navy text-xs">{selectedFile?.name || "salary_certificate.pdf"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-sakan-bg border border-sakan-border">
                        <div className="text-sakan-text/50 font-semibold mb-1">{t.issueDate}</div>
                        <div className="font-medium text-sakan-navy">{issueDateStr}</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isExpired ? "bg-red-50 border-red-200" : "bg-sakan-bg border-sakan-border"}`}>
                        <div className="text-sakan-text/50 font-semibold mb-1">{t.validityPeriod}</div>
                        <div className={`font-medium ${isExpired ? "text-red-600" : "text-sakan-navy"}`}>
                          30 days — {expiryDateStr}
                          {isExpired && <span className="font-bold ms-1">({t.expired})</span>}
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border ${hasMismatch ? "bg-red-50 border-red-200" : "bg-sakan-bg border-sakan-border"}`}>
                        <div className="text-sakan-text/50 font-semibold mb-1">{t.extractedSalary}</div>
                        <div className={`font-bold text-sm ${hasMismatch ? "text-red-600" : "text-sakan-navy"}`}>
                          {aed(validationResult.extractedSalary)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-sakan-bg border border-sakan-border">
                        <div className="text-sakan-text/50 font-semibold mb-1">{t.profileSalary}</div>
                        <div className="font-bold text-sm text-sakan-navy">{aed(declaredIncome)}</div>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                      !hasMismatch ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                    }`}>
                      <span className="font-semibold text-sakan-navy">{t.salaryMatchResult}</span>
                      <span className={`flex items-center gap-1.5 font-bold ${!hasMismatch ? "text-emerald-600" : "text-red-600"}`}>
                        {!hasMismatch ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {!hasMismatch ? t.matchConfirmed : t.mismatchDetected}
                      </span>
                    </div>

                    {/* Integrity check list */}
                    <div className="p-3.5 rounded-xl bg-sakan-bg border border-sakan-border">
                      <div className="text-sakan-text/60 text-xs font-bold mb-2.5">{t.certIntegrityChecks}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {integrityItems.map(({ label, pass }) => (
                          <div key={label} className={`flex items-center gap-1.5 p-2 rounded-lg ${pass ? "bg-white" : "bg-red-50"}`}>
                            {pass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                            <span className={`text-[10px] ${pass ? "text-sakan-text" : "text-red-600 font-semibold"}`}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bank statement match details */}
                    <div className={`p-3.5 rounded-xl border ${!isInconsistent ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                      <div className="text-sakan-text/60 text-xs font-bold mb-2">{t.bankCrossCheck}</div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-white p-2 rounded-lg border border-sakan-border/50">
                          <div className="text-sakan-text/50 text-[10px] mb-0.5">{t.certAmount}</div>
                          <div className="font-bold text-sakan-navy text-xs">{aed(validationResult.extractedSalary)}</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-sakan-border/50">
                          <div className="text-sakan-text/50 text-[10px] mb-0.5">{t.avgTransfer}</div>
                          <div className="font-bold text-sakan-navy text-xs">{aed(validationResult.bankCrossCheck.averageTransfer)}</div>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between text-xs font-bold ${!isInconsistent ? "text-emerald-600" : "text-amber-600"}`}>
                        <span>{t.consistencyResult}</span>
                        <span className="flex items-center gap-1">
                          {!isInconsistent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {!isInconsistent ? t.consistent : t.inconsistent}
                          <span className="font-normal text-[10px] text-sakan-text/50 ms-1">({validationResult.bankCrossCheck.confidenceScore}%)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Smart Correction Assistant Card (Aka completion guide for doc issues) */}
            {hasDocIssues && uploadState === "processed" && (
              <motion.div
                ref={correctionAssistantRef}
                initial={{ opacity: 0, y: 12 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  boxShadow: isAssistantHighlighted 
                    ? "0 0 0 3px rgba(197, 160, 89, 0.5), 0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                }}
                transition={{ duration: 0.4 }}
                className={`bg-white rounded-2xl p-6 border ${isAssistantHighlighted ? "border-sakan-gold" : "border-sakan-border"} shadow-sm space-y-4`}
              >
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 p-2 rounded-xl text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-sakan-navy">
                      {isAr ? t.completionGuideTitle : "Smart Correction Assistant"}
                    </h2>
                    <p className="text-[11px] text-sakan-text/50">
                      {isAr ? "دليل معالجة ملاحظات المستندات" : "AI Guidance for Document Correction"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <ul className="space-y-2">
                    {isExpired && (
                      <li className="flex items-start gap-2 text-xs bg-red-50 text-red-700 p-3 rounded-xl border border-red-100">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{isAr ? "شهادة راتب منتهية الصلاحية" : "Expired Salary Certificate"}</span>:{" "}
                          {isAr 
                            ? "تاريخ إصدار شهادة الراتب يتجاوز 30 يوماً. يجب تقديم شهادة حديثة."
                            : "The certificate issue date exceeds 30 days validity. Please upload a recent one."}
                        </div>
                      </li>
                    )}
                    {hasMismatch && (
                      <li className="flex items-start gap-2 text-xs bg-red-50 text-red-700 p-3 rounded-xl border border-red-100">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{isAr ? "اختلاف في الراتب" : "Declared Salary Mismatch"}</span>:{" "}
                          {isAr 
                            ? `الراتب المسجل في الحساب (${aed(declaredIncome)}) يختلف عن الراتب في الشهادة (${aed(validationResult.extractedSalary || 0)}).`
                            : `Declared salary (${aed(declaredIncome)}) does not match the certificate amount (${aed(validationResult.extractedSalary || 0)}).`}
                        </div>
                      </li>
                    )}
                    {isInconsistent && (
                      <li className="flex items-start gap-2 text-xs bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{isAr ? "عدم اتساق في التحويلات البنكية" : "Bank Transfer Inconsistency"}</span>:{" "}
                          {isAr 
                            ? `متوسط التحويلات البنكية لآخر 6 أشهر (${aed(validationResult.bankCrossCheck.averageTransfer)}) غير متسق مع الراتب في شهادة الراتب.`
                            : `The 6-month bank average transfer (${aed(validationResult.bankCrossCheck.averageTransfer)}) is inconsistent with your salary certificate amount.`}
                        </div>
                      </li>
                    )}
                    {(!validationResult.salaryCertificateChecks.hasCompanyLetterhead ||
                      !validationResult.salaryCertificateChecks.hasAuthorizedSignature ||
                      !validationResult.salaryCertificateChecks.employeeDetailsMatch ||
                      caseData?.hasStamp === false) && (
                      <li className="flex items-start gap-2 text-xs bg-red-50 text-red-700 p-3 rounded-xl border border-red-100">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{isAr ? "فشل فحص سلامة المستند" : "Document Integrity Issues"}</span>:{" "}
                          {isAr 
                            ? "الشهادة تفتقر إلى الأختام الرسمية أو التوقيع المعتمد أو ترويسة الشركة."
                            : "The uploaded certificate is missing a company stamp, authorized signature, or official letterhead."}
                        </div>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border text-[11px] leading-relaxed text-sakan-navy font-medium">
                  <p>
                    {isAr 
                      ? "يجب تصحيح هذه المشاكل قبل إمكانية المتابعة. لم يتم تحويل هذه الحالة للموظف لأن المشكلة قابلة للتصحيح من قبل المستفيد."
                      : "These issues must be corrected before the request can proceed. The case was not routed to an officer because the issue can be fixed by the beneficiary."}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-sakan-navy hover:bg-sakan-navy/95 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-sm text-xs"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {isAr ? "رفع شهادة راتب حديثة" : "Upload Updated Certificate"}
                    </button>
                    {hasMismatch && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsIncomeEditable(true);
                          setTimeout(() => {
                            incomeInputRef.current?.focus();
                            incomeInputRef.current?.select();
                          }, 100);
                          showToast(isAr ? "تم تمكين تعديل الدخل الشهري." : "Monthly income field is now editable.");
                        }}
                        className="flex items-center justify-center gap-2 bg-sakan-gold hover:bg-sakan-gold/90 text-sakan-navy font-bold py-2 px-3 rounded-xl transition-all shadow-sm text-xs"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {isAr ? "تحديث الدخل المصرح به" : "Update Declared Income"}
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-sakan-border/60 text-[10px] text-sakan-text/50 font-medium">
                    <button
                      type="button"
                      onClick={() => setIsRequirementsModalOpen(true)}
                      className="hover:text-sakan-navy hover:underline transition-colors"
                    >
                      {isAr ? "عرض شروط المستند المقبول" : "View Accepted Document Requirements"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSupportModalOpen(true)}
                      className="hover:text-sakan-navy hover:underline transition-colors"
                    >
                      {isAr ? "التواصل مع الدعم" : "Contact Support"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SECTION E: FINANCIAL ANALYSIS SUMMARY ───────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm space-y-4"
            >
              <h2 className="text-base font-bold text-sakan-navy flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sakan-gold" />
                <span>{isAr ? "ملخص التحليل المالي" : "Financial Analysis Summary"}</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "الدخل الشهري" : "Monthly Income"}</div>
                  <div className="font-bold text-sakan-navy">{aed(monthlyIncome)}</div>
                </div>
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "الالتزامات الشهرية" : "Monthly Obligations"}</div>
                  <div className="font-bold text-sakan-navy">{aed((caseData?.financialObligations ?? 0))}</div>
                </div>
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "نسبة الالتزامات" : "Obligations Ratio"}</div>
                  <div className="font-bold text-sakan-navy">{(validationResult.bankCrossCheck.averageTransfer > 0 ? ((caseData?.financialObligations ?? 0) / monthlyIncome * 100) : 0).toFixed(0)}%</div>
                </div>
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "أفراد الأسرة" : "Family Members"}</div>
                  <div className="font-bold text-sakan-navy">{(caseData?.familyMembers ?? 1)}</div>
                </div>
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "نصيب الفرد من الدخل" : "Income Per Family Member"}</div>
                  <div className="font-bold text-sakan-navy">{aed(Math.ceil(monthlyIncome / ((caseData?.familyMembers ?? 1) || 1)))}</div>
                </div>
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "سقف الاستقطاع 20٪" : "20% Deduction Cap"}</div>
                  <div className="font-bold text-sakan-navy">{aed(cap20Percent)}</div>
                </div>
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "القسط الحالي" : "Current Installment"}</div>
                  <div className="font-bold text-sakan-navy">{aed(currentInstallment)}</div>
                </div>
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "أشهر السداد المتبقية" : "Remaining Repayment Months"}</div>
                  <div className="font-bold text-sakan-navy">{(caseData?.remainingRepaymentMonths ?? 1)} months</div>
                </div>
                <div className="p-3 bg-sakan-bg rounded-xl border border-sakan-border col-span-2 md:col-span-1">
                  <div className="text-sakan-text/50 font-medium mb-1">{isAr ? "مبلغ المتأخرات" : "Arrears Amount"}</div>
                  <div className="font-bold text-sakan-gold">{aed(arrearsAmount)}</div>
                </div>
              </div>
            </motion.div>

            {/* ── SECTION F: INTERACTIVE REPAYMENT SLIDER ────────────────── */}
            {uploadState === "processed" && !hasDocIssues && !hasHardshipWithoutProof && !isDirectNotEligible && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-sakan-navy">
                    {isAr ? "خطة السداد التفاعلية" : "Interactive Repayment Plan"}
                  </h2>
                  <p className="text-xs text-sakan-text/50">
                    {isAr 
                      ? "اختبر خطة سداد مناسبة قبل التقييم النهائي." 
                      : "Test an affordable arrears repayment plan before final assessment."}
                  </p>
                </div>

                {arrearsAmount === 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl text-center">
                    {isAr ? "لا توجد متأخرات لإعادة جدولتها." : "No arrears to reschedule."}
                  </div>
                ) : maxAdditionalDeduction < 0 ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl text-center">
                      {isAr 
                        ? "خطة السداد التفاعلية غير مسموح بها لأن القسط الحالي يتجاوز سقف الـ 20٪ بالفعل."
                        : "Plan not allowed — current installment already exceeds the 20% cap."}
                    </div>
                    <div className="p-3.5 bg-sakan-bg border border-sakan-border rounded-xl text-xs flex justify-between items-center text-sakan-navy font-semibold">
                      <span>{isAr ? "حالة الالتزام بالخطة:" : "Plan Compliance Status:"}</span>
                      <span className="text-red-600 font-bold">
                        {isAr ? "غير مسموح — القسط الحالي يتجاوز السقف بالفعل" : "Not Allowed — current installment already exceeds cap"}
                      </span>
                    </div>
                  </div>
                ) : !hasValidPlan ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl text-center animate-pulse">
                      {isAr 
                        ? "لا يمكن إنشاء خطة سداد آلية تحت حدود السياسة الحالية."
                        : "No automated repayment plan can be generated under the current policy limits."}
                    </div>
                    <div className="p-3.5 bg-sakan-bg border border-sakan-border rounded-xl text-xs flex justify-between items-center text-sakan-navy font-semibold">
                      <span>{isAr ? "حالة الالتزام بالخطة:" : "Plan Compliance Status:"}</span>
                      <span className="text-red-600 font-bold">
                        {isAr ? "غير مسموح بموجب حدود السياسة" : "Not Allowed — exceeds policy limits"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Slider input */}
                    <div className="space-y-2 bg-sakan-bg/30 p-4 rounded-xl border border-sakan-border/50">
                      <div className="flex justify-between items-center text-xs font-bold text-sakan-navy">
                        <span>{isAr ? "استقطاع متأخرات شهري" : "Monthly Arrears Deduction"}</span>
                        <span className="text-base text-sakan-gold font-extrabold">{aed(sliderDeduction)}</span>
                      </div>
                      
                      <input
                        type="range"
                        min={Math.max(100, minDeductionNeeded)}
                        max={Math.max(100, Math.ceil(maxAdditionalDeduction))}
                        step={50}
                        value={sliderDeduction}
                        onChange={(e) => setSliderDeduction(Number(e.target.value))}
                        className="w-full h-2 bg-sakan-bg rounded-lg appearance-none cursor-pointer accent-sakan-gold border border-sakan-border"
                      />
                      <div className="flex justify-between items-center text-[9px] text-sakan-text/50 font-bold">
                        <span>Min: {aed(Math.max(100, minDeductionNeeded))}</span>
                        <span>Max: {aed(Math.max(100, Math.ceil(maxAdditionalDeduction)))}</span>
                      </div>
                    </div>

                    {/* Results details */}
                    <div className="bg-sakan-bg/60 border border-sakan-border rounded-xl p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-sakan-text/70">
                        <span>{isAr ? "الاستقطاع المختار:" : "Selected monthly arrears deduction:"}</span>
                        <span className="font-bold text-sakan-navy">{aed(sliderDeduction)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sakan-text/70">
                        <span>{isAr ? "المدة المتوقعة:" : "Estimated duration:"}</span>
                        <span className="font-bold text-sakan-navy">{sliderDuration} months</span>
                      </div>
                      <div className="flex justify-between items-center text-sakan-text/70">
                        <span>{isAr ? "القسط الشهري الإجمالي الجديد:" : "New total monthly installment:"}</span>
                        <span className="font-bold text-sakan-navy">{aed(sliderNewTotalInstallment)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sakan-text/70">
                        <span>{isAr ? "نسبة الاستقطاع الجديدة:" : "Deduction ratio:"}</span>
                        <span className="font-bold text-sakan-navy">{(sliderDeductionRatio * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="h-px bg-sakan-border/50 my-2" />

                      <div className="flex justify-between items-center font-bold">
                        <span>{isAr ? "حالة الالتزام بالخطة:" : "Plan Compliance Status:"}</span>
                        <span className={`${
                          sliderComplianceStatus === "Allowed Plan" ? "text-emerald-600" : "text-red-600"
                        } flex items-center gap-1`}>
                          {sliderComplianceStatus === "Allowed Plan" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          {(() => {
                            if (sliderComplianceStatus === "Allowed Plan") return isAr ? "خطة مسموح بها" : "Allowed Plan";
                            if (sliderComplianceStatus === "Not Allowed — exceeds 20% cap") return isAr ? "غير مسموح — يتجاوز سقف 20٪" : "Not Allowed — exceeds 20% cap";
                            if (sliderComplianceStatus === "Not Allowed — exceeds remaining loan term") return isAr ? "غير مسموح — يتجاوز مدة القرض المتبقية" : "Not Allowed — exceeds remaining loan term";
                            return isAr ? "غير مسموح بها" : sliderComplianceStatus;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SECTION G: DECLARATION AND WARNINGS ─────────────────────── */}
            {(() => {
              const isPolicyCapFail = !hasValidPlan || maxAdditionalDeduction < 0 || sliderComplianceStatus !== "Allowed Plan";
              const isActiveRequestConflict = selectedCaseId === "CASE-D" || (caseData && caseData.activeRequest);
              const isHumanitarianWithEvidence = hasHumanitarian && !!caseData?.supportingEvidenceFile;
              const hasHumanitarianWithoutProof = hasHumanitarian && !caseData?.supportingEvidenceFile;
              const isCleanEligible = !hasDocIssues && !hasHumanitarianWithoutProof && !isHumanitarianWithEvidence && !isActiveRequestConflict && !isPolicyCapFail;

              return (
                <div className="space-y-4">
                  {uploadState === "processed" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className={`rounded-2xl p-4 border flex items-start gap-3 shadow-sm ${
                        isCleanEligible
                          ? "bg-emerald-50 border-emerald-200" 
                          : (isHumanitarianWithEvidence && !hasDocIssues && !isActiveRequestConflict && !isPolicyCapFail)
                          ? "bg-amber-50 border-amber-200"
                          : (hasDocIssues || hasHumanitarianWithoutProof || (isHumanitarianWithEvidence && isPolicyCapFail))
                          ? "bg-amber-50 border-amber-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      {isCleanEligible ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${((hasDocIssues && !hasHumanitarian) || isHumanitarianWithEvidence || hasHumanitarianWithoutProof) && !isActiveRequestConflict && !isPolicyCapFail ? "text-amber-600" : "text-red-600"}`} />
                      )}
                      <p className={`text-sm font-semibold leading-relaxed ${
                        isCleanEligible
                          ? "text-emerald-800" 
                          : ((hasDocIssues && !hasHumanitarian) || isHumanitarianWithEvidence || hasHumanitarianWithoutProof) && !isActiveRequestConflict && !isPolicyCapFail
                          ? "text-amber-800"
                          : "text-red-800"
                      }`}>
                        {(() => {
                          if (isCleanEligible) {
                            return t.warningCaseA;
                          }
                          if (hasDocIssues) {
                            if (isHumanitarianWithEvidence) {
                              return isAr 
                                ? "تم رصد مشاكل في المستندات مع وجود أدلة داعمة إنسانية. سيتم تحويل الحالة للمراجعة الإنسانية بعد تصحيح المستندات." 
                                : "Document issues detected alongside humanitarian evidence. The case will be referred for humanitarian review, but documents must be corrected first.";
                            }
                            return isAr 
                              ? "لا يمكن متابعة الطلب حتى يقوم المستفيد بتصحيح مشاكل المستند." 
                              : "This request cannot proceed until the beneficiary corrects the document issues.";
                          }
                          if (isActiveRequestConflict) {
                            return isAr
                              ? "تعذر قبول الطلب لوجود تعارض في السياسة."
                              : "The request cannot be accepted due to a policy conflict.";
                          }
                          if (isHumanitarianWithEvidence) {
                            return isAr
                              ? "تم استلام الأدلة الإنسانية. يتطلب الاستثناء المالي / السياسة مراجعة بشرية."
                              : "Humanitarian evidence received. The financial/policy exception requires human review.";
                          }
                          if (hasHumanitarianWithoutProof) {
                            return isAr
                              ? "المستندات الداعمة للظرف الاستثنائي مفقودة."
                              : "Supporting evidence is missing for the selected hardship circumstance.";
                          }
                          if (isPolicyCapFail) {
                            return isAr
                              ? "لا يمكن متابعة هذا الطلب بموجب القواعد الحالية لأن القسط الحالي أو خطة السداد تتجاوز سقف الـ 20٪ المسموح به."
                              : "This request cannot proceed under current rules because the current installment or repayment plan exceeds the allowed 20% cap.";
                          }
                          return t.warningCaseC;
                        })()}
                      </p>
                    </motion.div>
                  )}

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
              );
            })()}
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
                  {isSubmitting ? t.submittingBtn : (() => {
                    if (hasDocIssues) {
                      return isAr ? "تصحيح مشاكل المستند" : "Fix Document Issues";
                    }
                    if (hasHardshipWithoutProof) {
                      return isAr ? "رفع مستند الإثبات الداعم" : "Upload Supporting Evidence";
                    }
                    const circumstanceLower = (caseData.supportingCircumstance || "").toLowerCase();
                    const hasHumanitarian = 
                      monthlyIncome === 0 ||
                      circumstanceLower.includes("unemployment") ||
                      circumstanceLower.includes("job loss") ||
                      circumstanceLower.includes("income loss") ||
                      caseData.hasMedicalDocument === true ||
                      circumstanceLower.includes("medical") ||
                      circumstanceLower.includes("health") ||
                      circumstanceLower.includes("treatment") ||
                      circumstanceLower.includes("hardship") ||
                      circumstanceLower.includes("social") ||
                      circumstanceLower.includes("vulnerability") ||
                      ((caseData?.familyMembers ?? 1) > 0 && monthlyIncome / (caseData?.familyMembers ?? 1) < 3000) ||
                      circumstanceLower.includes("delay") ||
                      circumstanceLower.includes("project delay") ||
                      circumstanceLower.includes("exception");
                    
                    const isPolicyCapFail = !hasValidPlan || maxAdditionalDeduction < 0 || sliderComplianceStatus !== "Allowed Plan";
                    if (isPolicyCapFail && !hasHumanitarian) {
                      return isAr ? "مراجعة نتيجة الأهلية" : "Review Eligibility Result";
                    }
                    return isAr ? "إرسال للتقييم الذكي" : "Submit for AI Assessment";
                  })()}
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

      {/* ── Modal: Upload Bank Statement ────────────────────────────────── */}
      <AnimatePresence>
        {isBankModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBankModalOpen(false)}
              className="absolute inset-0 bg-sakan-navy/40 backdrop-blur-sm"
            />
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl p-6 border border-sakan-border shadow-2xl space-y-4 text-start"
            >
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="absolute top-4 right-4 text-sakan-text/50 hover:text-sakan-navy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-base font-bold text-sakan-navy">
                  {isAr ? "تحميل كشف الحساب البنكي / إثبات الراتب" : "Upload Bank Statement / Salary Transfer Proof"}
                </h3>
                <p className="text-xs text-sakan-text/50 mt-1">
                  {isAr 
                    ? "يرجى تحميل كشف الحساب البنكي لآخر 6 أشهر لتأكيد انتظام تحويلات الراتب وحل إشارات الاختلاف." 
                    : "Please upload your bank statement for the last 6 months to verify regular salary transfers."}
                </p>
              </div>

              <input
                ref={bankFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  MOCK_CASES[selectedCaseId].bankProofFile = file.name;
                  triggerUpdate();
                  setIsBankModalOpen(false);
                  showToast(isAr ? "تم رفع كشف الحساب البنكي بنجاح!" : "Bank statement uploaded successfully!");
                }}
                className="hidden"
              />

              <div
                onClick={() => bankFileInputRef.current?.click()}
                className="border-2 border-dashed border-sakan-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-sakan-gold/50 hover:bg-sakan-gold/5 transition-all"
              >
                <div className="w-12 h-12 bg-sakan-bg rounded-xl flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 text-sakan-gold" />
                </div>
                <div className="font-bold text-sakan-navy text-xs">
                  {isAr ? "اضغط هنا لاختيار ملف" : "Click to select a file"}
                </div>
                <div className="text-[10px] text-sakan-text/40 mt-1">
                  PDF, PNG, JPG (Max 5MB)
                </div>
              </div>

              {caseData.bankProofFile && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    {isAr ? "الملف الحالي: " : "Current file: "}
                    <span className="font-semibold">{caseData.bankProofFile}</span>
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 border border-sakan-border rounded-xl text-xs font-semibold text-sakan-text/70 hover:bg-sakan-bg transition-colors"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => bankFileInputRef.current?.click()}
                  className="px-4 py-2 bg-sakan-navy text-white rounded-xl text-xs font-semibold hover:bg-sakan-navy/90 transition-colors"
                >
                  {isAr ? "اختيار الملف" : "Select File"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Accepted Document Requirements ────────────────────────── */}
      <AnimatePresence>
        {isRequirementsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequirementsModalOpen(false)}
              className="absolute inset-0 bg-sakan-navy/40 backdrop-blur-sm"
            />
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl p-6 border border-sakan-border shadow-2xl space-y-4 text-start"
            >
              <button
                type="button"
                onClick={() => setIsRequirementsModalOpen(false)}
                className="absolute top-4 right-4 text-sakan-text/50 hover:text-sakan-navy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-base font-bold text-sakan-navy">
                  {isAr ? "شروط شهادة الراتب المقبولة" : "Salary Certificate Requirements"}
                </h3>
                <p className="text-xs text-sakan-text/50 mt-1">
                  {isAr 
                    ? "يرجى التأكد من استيفاء شهادة الراتب المرفوعة للشروط التالية لتجنب رفض الطلب." 
                    : "Please ensure your salary certificate meets these requirements to avoid delays."}
                </p>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {(isAr ? [
                  "يجب أن تكون الشهادة مطبوعة على الأوراق الرسمية للشركة (الترويسة).",
                  "يجب أن تحتوى على توقيع معتمد واضح لممثل الشركة المخول.",
                  "يجب أن تكون الشهادة مختومة بختم الشركة الرسمي.",
                  "يجب أن يتطابق الاسم وتفاصيل الهوية تماماً مع بيانات الهوية الإماراتية.",
                  "يجب ألا يتجاوز تاريخ إصدار الشهادة 30 يوماً من تاريخ تقديم الطلب.",
                  "يجب أن توضح الشهادة بوضوح الراتب الأساسي الإجمالي والبدلات التفصيلية."
                ] : [
                  "Must be printed on official company letterhead.",
                  "Must contain a clear authorized signature of the company representative.",
                  "Must be stamped with the official company seal.",
                  "Beneficiary name and details must exactly match the Emirates ID registry.",
                  "Must be issued within the last 30 days of application.",
                  "Must clearly state the monthly basic salary and detailed allowances."
                ]).map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs bg-sakan-bg/60 p-2.5 rounded-xl border border-sakan-border/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sakan-navy font-medium leading-relaxed">{req}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequirementsModalOpen(false)}
                  className="px-5 py-2.5 bg-sakan-navy text-white rounded-xl text-xs font-semibold hover:bg-sakan-navy/90 transition-colors"
                >
                  {isAr ? "فهمت" : "I Understand"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Contact Support ───────────────────────────────────────── */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute inset-0 bg-sakan-navy/40 backdrop-blur-sm"
            />
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl p-6 border border-sakan-border shadow-2xl space-y-4 text-start"
            >
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="absolute top-4 right-4 text-sakan-text/50 hover:text-sakan-navy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-base font-bold text-sakan-navy">
                  {isAr ? "الاتصال بالدعم الفني لسكن" : "Contact SAKAN Support"}
                </h3>
                <p className="text-xs text-sakan-text/50 mt-1">
                  {isAr 
                    ? "تم إنشاء رسالة مخصصة بناءً على مشكلات التحقق الحالية لمساعدتك في الحصول على دعم أسرع." 
                    : "An auto-generated support message has been prepared highlighting your active document issues."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-sakan-text/40 uppercase font-bold tracking-wider">
                  {isAr ? "محتوى الرسالة التلقائي" : "Generated Message Content"}
                </label>
                <textarea
                  readOnly
                  value={isAr ? (() => {
                    let msg = `مرحباً بالدعم الفني لسكن،\n\nأقوم بتقديم طلب إعادة جدولة متأخرات القرض السكني (رقم الحالة: ${selectedCaseId}، المستفيد: ${caseData?.beneficiaryName}).\n\nأواجه ملاحظات في التحقق من المستندات:\n`;
                    if (isExpired) msg += `- تاريخ إصدار شهادة الراتب يتجاوز 30 يوماً.\n`;
                    if (hasMismatch) msg += `- يوجد اختلاف بين الراتب المصرح به (${aed(declaredIncome)}) والراتب في الشهادة (${aed(validationResult.extractedSalary || 0)}).\n`;
                    if (isInconsistent) msg += `- متوسط التحويلات البنكية (${aed(validationResult.bankCrossCheck.averageTransfer)}) غير متسق مع شهادة الراتب.\n`;
                    if (!validationResult.salaryCertificateChecks.hasCompanyLetterhead ||
                        !validationResult.salaryCertificateChecks.hasAuthorizedSignature ||
                        !validationResult.salaryCertificateChecks.employeeDetailsMatch ||
                        caseData?.hasStamp === false) {
                      msg += `- المستند يفتقر للختم أو التوقيع المعتمد أو الترويسة الرسمية.\n`;
                    }
                    msg += `\nيرجى المساعدة في معالجة إشارات التحقق هذه لتسهيل تقديم الطلب.`;
                    return msg;
                  })() : (() => {
                    let msg = `Hello SAKAN Support,\n\nI am applying for housing arrears rescheduling (Case ID: ${selectedCaseId}, Beneficiary: ${caseData?.beneficiaryName}).\n\nI am experiencing issues with document verification:\n`;
                    if (isExpired) msg += `- The system indicates my salary certificate has expired.\n`;
                    if (hasMismatch) msg += `- The declared monthly income (${aed(declaredIncome)}) does not match the certificate amount (${aed(validationResult.extractedSalary || 0)}).\n`;
                    if (isInconsistent) msg += `- The system detected average transfer inconsistency (${aed(validationResult.bankCrossCheck.averageTransfer)}).\n`;
                    if (!validationResult.salaryCertificateChecks.hasCompanyLetterhead ||
                        !validationResult.salaryCertificateChecks.hasAuthorizedSignature ||
                        !validationResult.salaryCertificateChecks.employeeDetailsMatch ||
                        caseData?.hasStamp === false) {
                      msg += `- The document is missing a stamp, signature, or official letterhead.\n`;
                    }
                    msg += `\nPlease help me resolve these verification flags.`;
                    return msg;
                  })()}
                  className="w-full h-40 p-3 bg-sakan-bg rounded-xl border border-sakan-border text-xs text-sakan-navy focus:outline-none resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = isAr ? (() => {
                      let msg = `مرحباً بالدعم الفني لسكن،\n\nأقوم بتقديم طلب إعادة جدولة متأخرات القرض السكني (رقم الحالة: ${selectedCaseId}، المستفيد: ${caseData?.beneficiaryName}).\n\nأواجه ملاحظات في التحقق من المستندات:\n`;
                      if (isExpired) msg += `- تاريخ إصدار شهادة الراتب يتجاوز 30 يوماً.\n`;
                      if (hasMismatch) msg += `- يوجد اختلاف بين الراتب المصرح به (${aed(declaredIncome)}) والراتب في الشهادة (${aed(validationResult.extractedSalary || 0)}).\n`;
                      if (isInconsistent) msg += `- متوسط التحويلات البنكية (${aed(validationResult.bankCrossCheck.averageTransfer)}) غير متسق مع شهادة الراتب.\n`;
                      if (!validationResult.salaryCertificateChecks.hasCompanyLetterhead ||
                          !validationResult.salaryCertificateChecks.hasAuthorizedSignature ||
                          !validationResult.salaryCertificateChecks.employeeDetailsMatch ||
                          caseData?.hasStamp === false) {
                        msg += `- المستند يفتقر للختم أو التوقيع المعتمد أو الترويسة الرسمية.\n`;
                      }
                      msg += `\nيرجى المساعدة في معالجة إشارات التحقق هذه لتسهيل تقديم الطلب.`;
                      return msg;
                    })() : (() => {
                      let msg = `Hello SAKAN Support,\n\nI am applying for housing arrears rescheduling (Case ID: ${selectedCaseId}, Beneficiary: ${caseData?.beneficiaryName}).\n\nI am experiencing issues with document verification:\n`;
                      if (isExpired) msg += `- The system indicates my salary certificate has expired.\n`;
                      if (hasMismatch) msg += `- The declared monthly income (${aed(declaredIncome)}) does not match the certificate amount (${aed(validationResult.extractedSalary || 0)}).\n`;
                      if (isInconsistent) msg += `- The system detected average transfer inconsistency (${aed(validationResult.bankCrossCheck.averageTransfer)}).\n`;
                      if (!validationResult.salaryCertificateChecks.hasCompanyLetterhead ||
                          !validationResult.salaryCertificateChecks.hasAuthorizedSignature ||
                          !validationResult.salaryCertificateChecks.employeeDetailsMatch ||
                          caseData?.hasStamp === false) {
                        msg += `- The document is missing a stamp, signature, or official letterhead.\n`;
                      }
                      msg += `\nPlease help me resolve these verification flags.`;
                      return msg;
                    })();
                    navigator.clipboard.writeText(text);
                    showToast(isAr ? "تم نسخ الرسالة إلى الحافظة!" : "Support message copied to clipboard!");
                  }}
                  className="px-4 py-2 border border-sakan-border rounded-xl text-xs font-semibold text-sakan-text hover:bg-sakan-bg transition-colors"
                >
                  {isAr ? "نسخ الرسالة" : "Copy Message"}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSupportModalOpen(false)}
                    className="px-4 py-2 border border-sakan-border rounded-xl text-xs font-semibold text-sakan-text/70 hover:bg-sakan-bg transition-colors"
                  >
                    {isAr ? "إغلاق" : "Close"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Add event to caseData auditTrail if it exists
                      const audit = (caseData as any).auditTrail || [];
                      audit.push({
                        timestamp: new Date().toISOString(),
                        actor: "Beneficiary",
                        action: "Support request ticket created for document verification issues",
                        result: "Success"
                      });
                      (caseData as any).auditTrail = audit;
                      setIsSupportModalOpen(false);
                      showToast(isAr ? "تم إنشاء تذكرة الدعم بنجاح! فريقنا سيتصل بك قريباً." : "Support request ticket created successfully! Our team will contact you shortly.");
                    }}
                    className="px-4 py-2 bg-sakan-navy text-white rounded-xl text-xs font-semibold hover:bg-sakan-navy/90 transition-colors"
                  >
                    {isAr ? "إنشاء تذكرة دعم" : "Create Support Request"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 bg-sakan-navy text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 className="w-4 h-4 text-sakan-gold" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
