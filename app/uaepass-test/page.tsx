"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fingerprint, ArrowLeft, Languages, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDemo } from "@/lib/demo-context";
import { MOCK_CASES } from "@/lib/mock-data";

const TRANSLATIONS = {
  EN: {
    pageTitle: "UAE PASS Staging Test",
    pageSubtitle: "Use UAE PASS staging to verify identity before continuing the application.",
    loginButton: "Login with UAE PASS Staging",
    fallbackButton: "Continue with Demo UAE PASS",
    backToHome: "Back to Home",
    failedWarning: "UAE PASS staging login completed but profile attributes could not be retrieved. You may retry or continue with Demo UAE PASS.",
    profileFailedWarning: "UAE PASS staging login was completed, but profile attributes could not be retrieved from the staging environment. Please retry UAE PASS Staging or use Demo UAE PASS fallback for presentation continuity.",
    tokenFailedWarning: "UAE PASS authentication completed, but token exchange failed.",
    stateFailedWarning: "UAE PASS authentication state validation failed. Please retry.",
    oauthErrorWarning: "UAE PASS authentication returned an error from the provider.",
    missingCodeWarning: "UAE PASS authentication did not return a valid authorization code.",
    missingAccessTokenWarning: "UAE PASS authentication token exchange did not return an access token.",
    userInfoFailedWarning: "UAE PASS authentication completed, but userinfo retrieval failed.",
    retryButton: "Retry UAE PASS Staging",
    fallbackExplanation: "Use UAE PASS staging to verify identity before continuing the application.",
    stagingNotice: "Staging POC Mode",
    stagingDescription: "Use the primary button to authenticate through UAE PASS Staging. If staging is unavailable during the demo, use the demo fallback below.",
    debugText: "Redirects to UAE PASS Staging OAuth endpoint",
  },
  AR: {
    pageTitle: "اختبار عبر UAE PASS Staging",
    pageSubtitle: "استخدم UAE PASS Staging للتحقق من الهوية قبل متابعة الطلب.",
    loginButton: "تسجيل الدخول عبر UAE PASS Staging",
    fallbackButton: "المتابعة عبر UAE PASS التجريبي",
    backToHome: "العودة إلى الرئيسية",
    failedWarning: "اكتمل تسجيل الدخول عبر UAE PASS Staging ولكن تعذر استرداد سمات الملف الشخصي. يمكنك إعادة المحاولة أو المتابعة باستخدام UAE PASS التجريبي.",
    profileFailedWarning: "تم تسجيل الدخول عبر UAE PASS Staging، لكن لم يتم استرجاع بيانات الملف الشخصي من بيئة الاختبار. يمكنك إعادة المحاولة أو استخدام خيار Demo UAE PASS لاستمرار العرض.",
    tokenFailedWarning: "اكتملت مصادقة UAE PASS، ولكن فشل تبادل الرمز المميز.",
    stateFailedWarning: "فشل التحقق من حالة مصادقة UAE PASS. يرجى إعادة المحاولة.",
    oauthErrorWarning: "أعادت مصادقة UAE PASS خطأ من المزود.",
    missingCodeWarning: "لم ترجع مصادقة UAE PASS رمز تفويض صالح.",
    missingAccessTokenWarning: "لم يرجع تبادل رمز مصادقة UAE PASS رمز وصول.",
    userInfoFailedWarning: "اكتملت مصادقة UAE PASS، ولكن فشل استرجاع معلومات المستخدم.",
    retryButton: "إعادة المحاولة عبر UAE PASS Staging",
    fallbackExplanation: "استخدم UAE PASS Staging للتحقق من الهوية قبل متابعة الطلب.",
    stagingNotice: "وضع إثبات المفهوم Staging",
    stagingDescription: "استخدم الزر الأساسي للمصادقة عبر UAE PASS Staging. إذا كانت بيئة Staging غير متاحة أثناء العرض التجريبي، استخدم البديل التجريبي أدناه.",
    debugText: "يعيد التوجيه إلى نقطة نهاية OAuth لـ UAE PASS Staging",
  }
};

function UaePassTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage, identityVerified, setIdentityVerified, setIdentitySource, setUaePassProfile, setSelectedCaseId, addAuditLog } = useDemo();
  const isAr = language === "AR";
  const t = TRANSLATIONS[isAr ? "AR" : "EN"];
  const uaePassStatus = searchParams.get("uaePassStatus");

  const handleDemoFallback = () => {
    // Set demo identity
    setIdentityVerified(true);
    setIdentitySource("UAE PASS Demo");
    setUaePassProfile({
      fullName: "UAE PASS Demo User",
      emiratesId: "784-1990-1234567-1",
      nationality: "United Arab Emirates",
      mobile: "+971501234567",
      email: "demo@uaepass.ae",
      uuid: "demo-uuid-fallback",
    });

    // Create a custom case for UAE PASS test
    const uaePassTestCaseId = "UAE-PASS-TEST-" + Date.now().toString().slice(-6);
    
    // Add audit log for demo UAE PASS fallback
    addAuditLog(uaePassTestCaseId, {
      timestamp: new Date().toISOString(),
      actor: "Beneficiary",
      action: "Demo UAE PASS fallback used",
      result: "Success",
      reasonCode: "IDENTITY_UAE_PASS_DEMO_VERIFIED",
      dataSource: "UAE PASS Demo",
    });

    MOCK_CASES[uaePassTestCaseId] = {
      caseId: uaePassTestCaseId,
      beneficiaryName: "UAE PASS Demo User",
      beneficiaryId: "BEN-784-UAE",
      emiratesId: "784-1990-1234567-1",
      loanId: "LOAN-UAE-001",
      monthlyIncome: 18000,
      financialObligations: 6000,
      familyMembers: 4,
      originalLoanAmount: 600000,
      remainingLoanBalance: 450000,
      arrearsAmount: 15000,
      unpaidInstallments: 3,
      currentInstallment: 2500,
      remainingRepaymentMonths: 84,
      paymentHistory: "Regular",
      activeRequest: false,
      salaryCertificateAmount: 18000,
      salaryCertificateExpired: false,
      documentConfidence: 90,
      hasCompanyLetterhead: true,
      hasAuthorizedSignature: true,
      employeeDetailsMatch: true,
      averageSalaryTransfer6Months: 18000,
      hasMedicalDocument: false,
      identityVerified: true,
      identitySource: "UAE PASS Demo",
      uaePassProfile: {
        fullName: "UAE PASS Demo User",
        emiratesId: "784-1990-1234567-1",
        nationality: "United Arab Emirates",
        mobile: "+971501234567",
        email: "demo@uaepass.ae",
        uuid: "demo-uuid-fallback",
      },
    } as any;

    setSelectedCaseId(uaePassTestCaseId as any);
    router.push("/apply?mode=uaepass-test");
  };



  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center relative p-4 bg-sakan-bg ${isAr ? "font-arabic-premium" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Load premium Arabic fonts */}
      {isAr && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap');
          .font-arabic-premium { font-family: 'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif !important; }
        `}} />
      )}

      {/* Subtle background decoration */}
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-sakan-navy/4 to-transparent -z-10" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-sakan-gold/4 rounded-full blur-3xl -z-10" />

      {/* Back button */}
      <Link
        href="/"
        className={`absolute top-8 ${isAr ? "right-8" : "left-8"} flex items-center gap-2 text-sakan-text/60 hover:text-sakan-navy transition-colors font-medium text-sm`}
      >
        <ArrowLeft className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
        {t.backToHome}
      </Link>

      {/* Language Toggle */}
      <div className={`absolute top-8 ${isAr ? "left-8" : "right-8"} flex items-center gap-1 bg-white border border-sakan-border px-2 py-1.5 rounded-xl shadow-sm`}>
        <Languages className="w-3.5 h-3.5 text-sakan-navy/50 mx-1.5" />
        <button
          onClick={() => setLanguage("EN")}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${!isAr ? "bg-sakan-navy text-white shadow-sm" : "text-sakan-navy/70 hover:bg-sakan-bg"}`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("AR")}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${isAr ? "bg-sakan-navy text-white shadow-sm" : "text-sakan-navy/70 hover:bg-sakan-bg"}`}
        >
          AR
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Page heading above the card */}
        <div className="text-center space-y-2 px-2">
          <div className="inline-flex items-center gap-2 bg-sakan-navy/8 border border-sakan-border/60 px-4 py-1.5 rounded-full mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-sakan-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-sakan-navy/70">
              {isAr ? "التحقق الآمن من الهوية" : "Secure Identity Verification"}
            </span>
          </div>
          <p className={`text-sm text-sakan-text/80 leading-relaxed font-medium max-w-sm mx-auto ${isAr ? "leading-loose" : ""}`}>
            {t.pageSubtitle}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-3xl shadow-md border border-sakan-border max-w-md w-full text-center mx-auto space-y-6">
          
          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className="w-18 h-18 w-[72px] h-[72px] bg-sakan-bg rounded-2xl flex items-center justify-center border border-sakan-border shadow-sm">
              <Fingerprint className="w-9 h-9 text-sakan-navy" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className={`text-2xl font-extrabold text-sakan-navy ${isAr ? "leading-normal" : ""}`}>
              {t.pageTitle}
            </h1>
            <p className={`text-sm text-sakan-text/80 leading-relaxed ${isAr ? "leading-relaxed" : ""}`}>
              {t.fallbackExplanation}
            </p>
          </div>

          {/* Failed Warning */}
          {!identityVerified && (uaePassStatus === "failed" || uaePassStatus === "profile_failed" || uaePassStatus === "token_failed" || uaePassStatus === "state_failed" || uaePassStatus === "oauth_error" || uaePassStatus === "missing_code" || uaePassStatus === "missing_access_token" || uaePassStatus === "userinfo_failed") && (
            <div className={`bg-amber-50 border border-amber-200 text-amber-900 text-xs p-4 rounded-xl ${isAr ? "text-right" : "text-left"} space-y-2`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                {isAr ? "تحذير" : "Warning"}
              </div>
              <p className="leading-relaxed opacity-90">
                {uaePassStatus === "profile_failed" ? t.profileFailedWarning : 
                 uaePassStatus === "token_failed" ? t.tokenFailedWarning :
                 uaePassStatus === "state_failed" ? t.stateFailedWarning :
                 uaePassStatus === "oauth_error" ? t.oauthErrorWarning :
                 uaePassStatus === "missing_code" ? t.missingCodeWarning :
                 uaePassStatus === "missing_access_token" ? t.missingAccessTokenWarning :
                 uaePassStatus === "userinfo_failed" ? t.userInfoFailedWarning :
                 t.failedWarning}
              </p>
            </div>
          )}

          {/* Staging POC Mode Notice */}
          <div className={`bg-blue-50 border border-blue-200 text-blue-900 text-xs p-4 rounded-xl ${isAr ? "text-right" : "text-left"} space-y-1`}>
            <p className="font-bold text-sm">
              {t.stagingNotice}
            </p>
            <p className="leading-relaxed opacity-90">
              {t.stagingDescription}
            </p>
          </div>

          {/* Primary Button - Login with UAE PASS Staging */}
          <button
            onClick={() => {
              // Ensure we have a UAE PASS Test case selected BEFORE redirecting
              const uaePassTestCaseId = "UAE-PASS-TEST-" + Date.now().toString().slice(-6);
              setSelectedCaseId(uaePassTestCaseId as any);
              window.location.href = "/api/uaepass/login?flow=uaepass-test";
            }}
            className="block w-full bg-sakan-navy text-white font-bold text-base py-4 rounded-xl hover:bg-sakan-navy/90 transition-colors shadow-sm"
          >
            {(uaePassStatus === "failed" || uaePassStatus === "profile_failed" || uaePassStatus === "token_failed" || uaePassStatus === "state_failed" || uaePassStatus === "oauth_error" || uaePassStatus === "missing_code" || uaePassStatus === "missing_access_token" || uaePassStatus === "userinfo_failed") ? t.retryButton : t.loginButton}
          </button>
          <p className="text-[10px] text-sakan-text/50 text-center">
            {t.debugText}
          </p>

          {/* Fallback Button - Continue with Demo UAE PASS */}
          <button
            onClick={handleDemoFallback}
            className="block w-full bg-white text-sakan-navy font-bold text-base py-4 rounded-xl border-2 border-sakan-border hover:bg-sakan-bg/20 transition-colors shadow-sm"
          >
            {t.fallbackButton}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function UaePassTestLoading() {
  return (
    <div className="min-h-screen bg-sakan-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-sakan-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function UaePassTestPage() {
  return (
    <Suspense fallback={<UaePassTestLoading />}>
      <UaePassTestContent />
    </Suspense>
  );
}
