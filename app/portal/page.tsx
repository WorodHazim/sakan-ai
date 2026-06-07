"use client";

import Link from "next/link";
import { useDemo } from "@/lib/demo-context";
import { MOCK_CASES } from "@/lib/mock-data";
import {
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Calendar,
  History,
  Languages,
  XCircle,
  FileWarning,
  UserCheck,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Currency helper ─────────────────────────────────────────────────────────
function aed(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

// ── Case-specific readiness config ───────────────────────────────────────────
type ReadinessItem = {
  icon: "check" | "warn" | "cross" | "pending";
  labelKey: string;
  subKey: string;
};

type CaseConfig = {
  readinessItems: ReadinessItem[];
  ctaLabelKey: string;
  ctaHref: string;
};

const CASE_CONFIGS: Record<string, CaseConfig> = {
  "CASE-A": {
    readinessItems: [
      { icon: "check",   labelKey: "identityVerified",    subKey: "viaUaePass" },
      { icon: "check",   labelKey: "loanDataRetrieved",   subKey: "moeiSystems" },
      { icon: "check",   labelKey: "noActiveRequests",    subKey: "eligibleApply" },
      { icon: "pending", labelKey: "salaryCertRequired",  subKey: "nextStep" },
    ],
    ctaLabelKey: "startRequest",
    ctaHref: "/apply",
  },
  "CASE-B": {
    readinessItems: [
      { icon: "check",   labelKey: "identityVerified",         subKey: "viaUaePass" },
      { icon: "check",   labelKey: "loanDataRetrieved",        subKey: "moeiSystems" },
      { icon: "check",   labelKey: "noActiveRequests",         subKey: "eligibleApply" },
      { icon: "warn",    labelKey: "updatedSalaryCertRequired", subKey: "certExpiredMismatch" },
    ],
    ctaLabelKey: "uploadDocuments",
    ctaHref: "/apply",
  },
  "CASE-C": {
    readinessItems: [
      { icon: "check", labelKey: "identityVerified",    subKey: "viaUaePass" },
      { icon: "check", labelKey: "loanDataRetrieved",   subKey: "moeiSystems" },
      { icon: "cross", labelKey: "activeRequestFound",  subKey: "requestPending" },
      { icon: "warn",  labelKey: "fastTrackUnavailable", subKey: "overrideRequired" },
      { icon: "warn",  labelKey: "humanReviewRequired", subKey: "exceptionalRouting" },
    ],
    ctaLabelKey: "requestHumanReview",
    ctaHref: "/apply",
  },
};

// ── Translations ─────────────────────────────────────────────────────────────
const T = {
  EN: {
    portalTitle: "Beneficiary Portal",
    welcome: "Welcome back",
    profileOverview: "Profile Overview",
    monthlyIncome: "Monthly Income",
    familyMembers: "Family Members",
    obligations: "Monthly Obligations",
    activeRequestLabel: "Active Request",
    loanArrears: "Loan & Arrears",
    originalAmount: "Original Amount",
    remainingBalance: "Remaining Balance",
    currentInstallment: "Current Installment",
    arrearsAmount: "Arrears Amount",
    unpaidInstallments: "Unpaid Installments",
    remainingTerm: "Remaining Term",
    paymentHistory: "Payment History",
    readinessTitle: "Application Readiness",
    identityVerified: "Identity Verified",
    viaUaePass: "via UAE PASS",
    loanDataRetrieved: "Loan Data Retrieved",
    moeiSystems: "from MOEI Systems",
    activeRequestFound: "Active Request Found",
    requestPending: "Simultaneous request pending",
    fastTrackUnavailable: "Automated fast-track not available",
    overrideRequired: "Requires policy rules override",
    humanReviewRequired: "Human review required",
    exceptionalRouting: "Exceptional routing triggered",
    noActiveRequests: "No Active Requests",
    eligibleApply: "Eligible to apply",
    salaryCertRequired: "Salary Certificate Required",
    nextStep: "Provide in next step",
    updatedSalaryCertRequired: "Updated Salary Certificate Required",
    certExpiredMismatch: "Certificate expired · Income mismatch detected",
    startRequest: "Start Request",
    uploadDocuments: "Upload Updated Documents",
    requestHumanReview: "Request Human Review",
    whatThisMeans: "What this means for you",
    yes: "Yes",
    none: "None",
    months: "Months",
  },
  AR: {
    portalTitle: "بوابة المتعامل",
    welcome: "مرحباً بك",
    profileOverview: "بيانات الملف الشخصي",
    monthlyIncome: "الدخل الشهري",
    familyMembers: "أفراد الأسرة",
    obligations: "الالتزامات الشهرية",
    activeRequestLabel: "طلب نشط حالي",
    loanArrears: "تفاصيل القرض والمتأخرات",
    originalAmount: "قيمة القرض الأصلية",
    remainingBalance: "الرصيد المتبقي",
    currentInstallment: "القسط الشهري الحالي",
    arrearsAmount: "مبلغ المتأخرات",
    unpaidInstallments: "الأقساط غير المدفوعة",
    remainingTerm: "مدة السداد المتبقية",
    paymentHistory: "سجل السداد",
    readinessTitle: "جاهزية تقديم الطلب",
    identityVerified: "تم التحقق من الهوية",
    viaUaePass: "عبر الهوية الرقمية UAE PASS",
    loanDataRetrieved: "تم استرداد بيانات القرض",
    moeiSystems: "من أنظمة وزارة الطاقة والبنية التحتية",
    activeRequestFound: "تم العثور على طلب نشط",
    requestPending: "يوجد طلب معالجة متزامن حالي",
    fastTrackUnavailable: "الموافقة التلقائية السريعة غير متاحة",
    overrideRequired: "يتطلب استثناء من ضوابط السياسات",
    humanReviewRequired: "يتطلب مراجعة بشرية من مختص",
    exceptionalRouting: "تم تفعيل التوجيه الاستثنائي للحالة",
    noActiveRequests: "لا توجد طلبات نشطة حالية",
    eligibleApply: "مؤهل لتقديم طلب إعادة الجدولة",
    salaryCertRequired: "شهادة الراتب مطلوبة",
    nextStep: "يرجى تقديمها في الخطوة التالية",
    updatedSalaryCertRequired: "مطلوب شهادة راتب محدثة",
    certExpiredMismatch: "الشهادة منتهية الصلاحية · تعارض في بيانات الدخل",
    startRequest: "بدء تقديم الطلب",
    uploadDocuments: "رفع المستندات المحدثة",
    requestHumanReview: "طلب مراجعة مختص",
    whatThisMeans: "ماذا يعني هذا لك؟",
    yes: "نعم",
    none: "لا يوجد",
    months: "شهر",
  },
} as const;

type LangKey = keyof typeof T;

// ── Beneficiary-facing explanations (bilingual) ──────────────────────────────
const EXPLANATION: Record<string, { en: string; ar: string; variant: "green" | "amber" | "blue" }> = {
  "CASE-A": {
    en: "Your request is eligible for fast-track approval. Your documents are valid and the proposed monthly deduction remains within the policy limit.",
    ar: "طلبكم مؤهل للموافقة المبدئية السريعة. المستندات صحيحة ومبلغ الاستقطاع المقترح ضمن الحد المسموح به.",
    variant: "green",
  },
  "CASE-B": {
    en: "Your request cannot continue yet because the salary certificate is expired and the income values do not match the bank transfer history. Please provide updated documents.",
    ar: "لا يمكن استكمال الطلب حالياً بسبب انتهاء صلاحية شهادة الراتب ووجود اختلاف بين بيانات الدخل وكشف الحساب البنكي. يرجى تزويدنا بمستندات محدثة.",
    variant: "amber",
  },
  "CASE-C": {
    en: "Your request requires specialist review because an active request already exists and your financial obligations are high. A human officer will review the case.",
    ar: "يتطلب طلبكم مراجعة مختص بسبب وجود طلب نشط وارتفاع الالتزامات المالية. سيتم تحويل الحالة إلى موظف مختص للمراجعة.",
    variant: "blue",
  },
};

// ── Readiness icon helper ─────────────────────────────────────────────────────
function ReadinessIcon({ type }: { type: ReadinessItem["icon"] }) {
  if (type === "check")   return <CheckCircle2  className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
  if (type === "cross")   return <XCircle       className="w-5 h-5 text-red-400    shrink-0 mt-0.5" />;
  if (type === "warn")    return <AlertTriangle className="w-5 h-5 text-amber-400  shrink-0 mt-0.5" />;
  return (
    <div className="w-5 h-5 rounded-full border-2 border-white/25 shrink-0 mt-0.5 flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
    </div>
  );
}

// ── Payment history translation ───────────────────────────────────────────────
function translatePaymentHistory(raw: string, lang: LangKey) {
  if (lang === "EN") return raw;
  const map: Record<string, string> = {
    "Mostly Regular": "منتظم في الغالب",
    "Irregular": "غير منتظم",
    "Delayed": "متأخر",
  };
  return map[raw] ?? raw;
}

// ── Page component ────────────────────────────────────────────────────────────
export default function BeneficiaryPortal() {
  const { selectedCaseId, language, setLanguage } = useDemo();
  const caseData = MOCK_CASES[selectedCaseId];
  const lang = language as LangKey;
  const t = T[lang];
  const isAr = lang === "AR";
  const config = CASE_CONFIGS[selectedCaseId];
  const explanation = EXPLANATION[selectedCaseId];

  return (
    <div
      className={`min-h-screen bg-sakan-bg p-4 md:p-8 lg:p-12 pb-24 ${isAr ? "font-arabic-premium" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Premium Arabic font loader */}
      {isAr && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap');
          .font-arabic-premium,
          .font-arabic-premium * {
            font-family: 'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif !important;
            line-height: 1.75;
            letter-spacing: 0;
          }
        `}} />
      )}

      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-sakan-navy">{t.portalTitle}</h1>
            <p className="text-sakan-text/70 mt-1 text-sm">
              {t.welcome}،&nbsp;<span className="font-semibold text-sakan-navy">{caseData.beneficiaryName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-sakan-border shadow-sm">
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

            {/* ID badge */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-sakan-border shadow-sm">
              <UserCheck className="w-4 h-4 text-sakan-gold" />
              <span className="font-mono font-medium text-sm text-sakan-navy">{caseData.beneficiaryId}</span>
            </div>
          </div>
        </header>

        {/* ── Main grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm"
            >
              <h2 className="text-base font-bold text-sakan-navy mb-5 flex items-center gap-2 uppercase tracking-wide">
                <User className="w-4 h-4 text-sakan-gold" />
                {t.profileOverview}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ProfileStat label={t.monthlyIncome}      value={aed(caseData.monthlyIncome)} />
                <ProfileStat label={t.familyMembers}      value={String(caseData.familyMembers)} />
                <ProfileStat label={t.obligations}        value={aed(caseData.financialObligations)} />
                <ProfileStat
                  label={t.activeRequestLabel}
                  value={caseData.activeRequest ? t.yes : t.none}
                  highlight={caseData.activeRequest}
                />
              </div>
            </motion.div>

            {/* "What this means" card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
            >
              <ExplanationCard
                title={t.whatThisMeans}
                text={isAr ? explanation.ar : explanation.en}
                variant={explanation.variant}
                isAr={isAr}
              />
            </motion.div>

            {/* Loan & Arrears card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13 }}
              className="bg-white rounded-2xl p-6 border border-sakan-border shadow-sm"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-base font-bold text-sakan-navy flex items-center gap-2 uppercase tracking-wide">
                  <CreditCard className="w-4 h-4 text-sakan-gold" />
                  {t.loanArrears}
                </h2>
                <span className="text-xs font-medium bg-sakan-bg px-3 py-1 rounded-full border border-sakan-border font-mono text-sakan-navy/70">
                  {caseData.loanId}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-7 gap-x-6">
                <LoanStat icon={<Wallet className="w-3 h-3" />} label={t.originalAmount}    value={aed(caseData.originalLoanAmount)} />
                <LoanStat                                        label={t.remainingBalance}  value={aed(caseData.remainingLoanBalance)} />
                <LoanStat icon={<Calendar className="w-3 h-3" />} label={t.remainingTerm}   value={`${caseData.remainingRepaymentMonths} ${t.months}`} />

                {/* Arrears highlight cells */}
                <div className="bg-red-50 p-3.5 rounded-xl border border-red-100">
                  <div className="text-xs text-red-600 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {t.arrearsAmount}
                  </div>
                  <div className="font-extrabold text-red-700 text-lg">{aed(caseData.arrearsAmount)}</div>
                </div>
                <div className="bg-red-50 p-3.5 rounded-xl border border-red-100">
                  <div className="text-xs text-red-600 uppercase tracking-wider font-bold mb-1.5">{t.unpaidInstallments}</div>
                  <div className="font-extrabold text-red-700 text-lg">{caseData.unpaidInstallments}</div>
                </div>
                <LoanStat label={t.currentInstallment} value={aed(caseData.currentInstallment)} />
              </div>

              {/* Payment history */}
              <div className="mt-6 pt-5 border-t border-sakan-border flex items-center gap-2 text-sm">
                <History className="w-4 h-4 text-sakan-text/40 shrink-0" />
                <span className="text-sakan-text/60">{t.paymentHistory}:</span>
                <span className="font-semibold text-sakan-navy">
                  {translatePaymentHistory(caseData.paymentHistory, lang)}
                </span>
              </div>
            </motion.div>

          </div>

          {/* Right sidebar: Readiness card */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: isAr ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-sakan-navy text-white rounded-2xl p-6 shadow-lg sticky top-6"
            >
              <h2 className="text-base font-bold mb-5 flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-sakan-gold" />
                {t.readinessTitle}
              </h2>

              <ul className="space-y-4 mb-7">
                {config.readinessItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <ReadinessIcon type={item.icon} />
                    <div>
                      <div className={`font-bold text-sm ${item.icon === "warn" || item.icon === "cross" ? "text-amber-300" : "text-white"}`}>
                        {t[item.labelKey as keyof typeof t]}
                      </div>
                      <div className="text-xs text-white/55 mt-0.5 leading-snug">
                        {t[item.subKey as keyof typeof t]}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href={config.ctaHref}
                className="w-full flex items-center justify-center gap-2 bg-sakan-gold hover:bg-sakan-gold/90 text-sakan-navy font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-md text-sm"
              >
                {t[config.ctaLabelKey as keyof typeof t]}
                <ArrowRight className={`w-4 h-4 text-sakan-navy ${isAr ? "rotate-180" : ""}`} />
              </Link>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-sakan-text/50 uppercase tracking-wider font-semibold mb-1">{label}</div>
      <div className={`font-semibold text-base ${highlight ? "text-amber-600" : "text-sakan-navy"}`}>{value}</div>
    </div>
  );
}

function LoanStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-sakan-text/50 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-medium text-sakan-navy">{value}</div>
    </div>
  );
}

function ExplanationCard({
  title,
  text,
  variant,
  isAr,
}: {
  title: string;
  text: string;
  variant: "green" | "amber" | "blue";
  isAr: boolean;
}) {
  const styles = {
    green: {
      wrapper: "bg-emerald-50 border-emerald-200",
      icon: <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
      title: "text-emerald-800",
      text: "text-emerald-900",
    },
    amber: {
      wrapper: "bg-amber-50 border-amber-200",
      icon: <FileWarning className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
      title: "text-amber-800",
      text: "text-amber-900",
    },
    blue: {
      wrapper: "bg-blue-50 border-blue-200",
      icon: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
      title: "text-blue-800",
      text: "text-blue-900",
    },
  }[variant];

  return (
    <div className={`rounded-2xl p-5 border ${styles.wrapper}`}>
      <div className="flex items-start gap-2.5">
        {styles.icon}
        <div>
          <div className={`text-xs font-extrabold uppercase tracking-wider mb-2 ${styles.title}`}>{title}</div>
          <p className={`text-sm leading-relaxed font-medium ${styles.text} ${isAr ? "leading-loose" : ""}`}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
