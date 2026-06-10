"use client";

import Link from "next/link";
import { Fingerprint, ArrowLeft, Languages, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useDemo } from "@/lib/demo-context";

export default function UaePassLogin() {
  const { language, setLanguage } = useDemo();
  const isAr = language === "AR";

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
        {isAr ? "رجوع" : "Back"}
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
            {isAr
              ? "تستخدم منصة سكن AI الهوية الرقمية للتحقق من هوية المتعامل قبل استرجاع بيانات القرض والمتأخرات السكنية."
              : "SAKAN AI uses UAE PASS to verify beneficiary identity before retrieving housing loan and arrears data."}
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
              UAE PASS
            </h1>
            <p className={`text-sm text-sakan-text/80 leading-relaxed ${isAr ? "leading-relaxed" : ""}`}>
              {isAr
                ? "تحقق من هويتك بأمان للمتابعة في طلب إعادة جدولة متأخرات القرض السكني."
                : "Verify your identity securely to continue your housing arrears rescheduling request."}
            </p>
          </div>

          {/* Demo UAE PASS fallback Notice */}
          <div className={`bg-amber-50 border border-amber-200 text-amber-900 text-xs p-4 rounded-xl ${isAr ? "text-right" : "text-left"} space-y-1`}>
            <p className="font-bold text-sm">
              {isAr ? "وضع العرض التجريبي" : "Demo UAE PASS fallback"}
            </p>
            <p className="leading-relaxed opacity-90">
              {isAr
                ? "وضع العرض التجريبي: تم محاكاة الهوية الرقمية لأغراض الهاكاثون. في البيئة الفعلية، يتم التحقق من الهوية من خلال التكامل الرسمي مع UAE PASS."
                : "Demo UAE PASS fallback: UAE PASS is mocked for this hackathon demo. In production, identity verification would be handled through official UAE PASS integration."}
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href="/portal"
            className="block w-full bg-sakan-navy text-white font-bold text-base py-4 rounded-xl hover:bg-sakan-navy/90 transition-colors shadow-sm"
          >
            {isAr ? "المتابعة عبر الهوية الرقمية" : "Continue with UAE PASS"}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
