"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDemo } from "@/lib/demo-context";
import { Building2, ArrowRight, ShieldCheck, User, FileSearch, Cpu, AlertOctagon, Languages } from "lucide-react";
import { motion } from "framer-motion";
import { CustomCaseSimulatorModal } from "@/components/CustomCaseSimulatorModal";

const TRANSLATIONS = {
  EN: {
    heroSubtitle: "Housing Loan Arrears Rescheduling Agent",
    deptTitle: "Sheikh Zayed Housing Programme | MOEI",
    valueStatement: "SAKAN AI is a governed decision agent — not a generic chatbot — that validates documents, applies policy rules, explains recommendations, and escalates exceptions to human officers.",
    capabilities: [
      {
        label: "Document Integrity Validation",
        desc: "Validates salary certificate authenticity, issue date, signature, and bank transfer consistency."
      },
      {
        label: "Policy Rules Engine",
        desc: "Applies the 20% deduction cap, repayment period rules, active request checks, and obligations thresholds."
      },
      {
        label: "Human Review Escalation",
        desc: "Escalates exceptional or high-risk cases to officers with clear trigger reasons."
      }
    ],
    loginBeneficiary: "Login as Beneficiary",
    loginBeneficiaryDesc: "Submit a rescheduling request",
    loginOfficer: "Login as Officer",
    loginOfficerDesc: "Review AI-processed cases",
    officialDemo: "Official Hackathon Demo · MOEI Challenge"
  },
  AR: {
    heroSubtitle: "نظام ذكي لإعادة جدولة متأخرات القروض السكنية",
    deptTitle: "برنامج الشيخ زايد للإسكان | وزارة الطاقة والبنية التحتية",
    valueStatement: "منصة سكن AI هي وكيل قرار ذكي محكوم بالقواعد — وليست مجرد روبوت محادثة تقليدي — تتحقق من المستندات، وتطبق السياسات، وتشرح التوصيات، وتحوّل الحالات الاستثنائية إلى الموظف المختص.",
    capabilities: [
      {
        label: "التحقق من المستندات",
        desc: "يتحقق من شهادة الراتب والتوقيع والصلاحية ويقارن الدخل مع كشف الحساب البنكي."
      },
      {
        label: "محرك السياسات والقواعد",
        desc: "يطبق حد الاستقطاع 20%، مدة السداد، حالة الطلب النشط، ونسب الالتزامات المالية."
      },
      {
        label: "التوجيه للمراجعة البشرية",
        desc: "يحوّل الحالات الاستثنائية أو عالية المخاطر إلى الموظف المختص مع أسباب واضحة."
      }
    ],
    loginBeneficiary: "تسجيل الدخول كمتعامل",
    loginBeneficiaryDesc: "تقديم طلب إعادة جدولة جديد",
    loginOfficer: "تسجيل الدخول كموظف مختص",
    loginOfficerDesc: "مراجعة واعتماد الحالات المعالجة",
    officialDemo: "العرض التجريبي الرسمي الهاكاثون · تحدي وزارة الطاقة والبنية التحتية"
  }
};

export default function LandingPage() {
  const { language, setLanguage } = useDemo();
  const [customCaseOpen, setCustomCaseOpen] = useState(false);
  const t = TRANSLATIONS[language];
  const isAr = language === "AR";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-16 md:py-24 bg-sakan-bg ${isAr ? "font-arabic-premium" : ""}`} dir={isAr ? "rtl" : "ltr"}>

      {/* Load premium Arabic fonts & set styles dynamically */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        .font-arabic-premium {
          font-family: 'IBM Plex Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif !important;
        }
        .font-arabic-premium h1 {
          font-family: 'Tajawal', system-ui, sans-serif !important;
          font-weight: 800;
        }
        .font-arabic-premium h3 {
          font-family: 'Tajawal', system-ui, sans-serif !important;
          font-weight: 700;
        }
      `}} />

      {/* Decorative gradient blobs to replace harsh top background */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-sakan-gold/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-sakan-navy/5 rounded-full blur-3xl -z-10" />

      {/* Floating Language Toggle (Muted borders, readable text) */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-1 bg-white border border-sakan-border px-2 py-1.5 rounded-xl shadow-sm">
        <Languages className="w-3.5 h-3.5 text-sakan-navy/50 mx-1.5" />
        <button
          onClick={() => setLanguage("EN")}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${!isAr ? "bg-sakan-navy text-white font-extrabold shadow-sm scale-105" : "text-sakan-navy/70 hover:bg-sakan-bg"}`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("AR")}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${isAr ? "bg-sakan-navy text-white font-extrabold shadow-sm scale-105" : "text-sakan-navy/70 hover:bg-sakan-bg"}`}
        >
          AR
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-4xl px-4 w-full space-y-8"
      >
        {/* Logo Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-sakan-border/80">
            <Building2 className="w-8 h-8 text-sakan-gold" />
          </div>
        </div>

        {/* Hero Title & Subtitle in Deep Government Navy */}
        <div className="space-y-3">
          <h1 className={`text-4xl md:text-6xl font-extrabold text-sakan-navy tracking-tight ${isAr ? "leading-tight" : "tracking-tight"}`}>
            {isAr ? (
              <>منصة سكن <span className="text-sakan-gold">AI</span></>
            ) : (
              <>SAKAN <span className="text-sakan-gold">AI</span></>
            )}
          </h1>

          <p className={`text-xl md:text-2xl text-sakan-navy/90 font-bold leading-normal ${isAr ? "leading-relaxed" : ""}`}>
            {t.heroSubtitle}
          </p>

          <p className={`text-xs md:text-sm text-sakan-gold font-bold uppercase ${isAr ? "tracking-normal" : "tracking-widest"}`}>
            {t.deptTitle}
          </p>
        </div>

        {/* High-Contrast Value Statement Card (White bg, Navy border & Text) */}
        <div className="bg-white border-2 border-sakan-border rounded-2xl px-6 py-5 max-w-2xl mx-auto shadow-sm">
          <p className={`text-sm md:text-base text-sakan-navy font-semibold leading-relaxed ${isAr ? "text-center leading-loose font-medium text-[15px]" : ""}`}>
            {t.valueStatement}
          </p>
        </div>

        {/* Capability Cards with descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: FileSearch, key: 0 },
            { icon: Cpu, key: 1 },
            { icon: AlertOctagon, key: 2 },
          ].map(({ icon: Icon, key }) => {
            const cap = t.capabilities[key];
            return (
              <div key={key} className="bg-white rounded-2xl p-6 text-start border border-sakan-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[170px]">
                <div className="space-y-4">
                  <div className="w-9 h-9 rounded-xl bg-sakan-bg flex items-center justify-center border border-sakan-border/40">
                    <Icon className="w-5 h-5 text-sakan-gold" />
                  </div>
                  <div>
                    <h3 className={`text-sakan-navy font-bold text-sm mb-1.5 ${isAr ? "leading-normal text-[15px]" : ""}`}>{cap.label}</h3>
                    <p className={`text-sakan-text/90 text-xs leading-relaxed ${isAr ? "leading-relaxed text-[13px]" : ""}`}>{cap.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Login Cards Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border border-sakan-border max-w-xl mx-auto flex flex-col gap-4">
          <Link
            href="/login/beneficiary"
            className="group flex items-center justify-between bg-sakan-navy text-white px-6 py-4 rounded-xl hover:bg-sakan-navy/95 transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2.5 rounded-xl">
                <User className="w-6 h-6 text-sakan-gold" />
              </div>
              <div className={isAr ? "text-right" : "text-left"}>
                <div className={`font-bold text-base md:text-lg text-white ${isAr ? "leading-normal" : ""}`}>{t.loginBeneficiary}</div>
                <div className={`text-xs text-white/70 mt-0.5 ${isAr ? "text-[11px]" : ""}`}>{t.loginBeneficiaryDesc}</div>
              </div>
            </div>
            <ArrowRight className={`w-5 h-5 text-sakan-gold transition-transform duration-300 ${isAr ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
          </Link>

          <Link
            href="/officer/workspace"
            className="group flex items-center justify-between bg-white text-sakan-navy px-6 py-4 rounded-xl border-2 border-sakan-border hover:border-sakan-gold/40 hover:bg-sakan-bg/20 transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="bg-sakan-bg/80 p-2.5 rounded-xl border border-sakan-border">
                <ShieldCheck className="w-6 h-6 text-sakan-navy" />
              </div>
              <div className={isAr ? "text-right" : "text-left"}>
                <div className={`font-bold text-base md:text-lg text-sakan-navy ${isAr ? "leading-normal" : ""}`}>{t.loginOfficer}</div>
                <div className={`text-xs text-sakan-text/70 mt-0.5 ${isAr ? "text-[11px]" : ""}`}>{t.loginOfficerDesc}</div>
              </div>
            </div>
            <ArrowRight className={`w-5 h-5 text-sakan-navy transition-transform duration-300 ${isAr ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
          </Link>

          <button
            onClick={() => setCustomCaseOpen(true)}
            className="group flex items-center justify-between bg-white text-sakan-gold px-6 py-4 rounded-xl border-2 border-dashed border-sakan-gold hover:bg-sakan-gold/10 transition-all shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="bg-sakan-gold/10 p-2.5 rounded-xl border border-sakan-gold/25">
                <Cpu className="w-6 h-6 text-sakan-gold" />
              </div>
              <div className={isAr ? "text-right" : "text-left"}>
                <div className={`font-bold text-base md:text-lg text-sakan-navy ${isAr ? "leading-normal text-start" : "text-start"}`}>
                  {isAr ? "إنشاء حالة تجريبية مخصصة" : "Create Custom Demo Case"}
                </div>
                <div className={`text-xs text-sakan-text/70 mt-0.5 text-start ${isAr ? "text-[11px]" : ""}`}>
                  {isAr ? "محاكاة حالة جديدة وتقييمها بالذكاء الاصطناعي" : "Simulate and evaluate a new custom case"}
                </div>
              </div>
            </div>
            <ArrowRight className={`w-5 h-5 text-sakan-gold transition-transform duration-300 ${isAr ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
          </button>
        </div>

        {/* Footer Challenge Label */}
        <div className={`text-xs text-sakan-text/50 font-bold uppercase pt-4 ${isAr ? "tracking-normal text-[11px]" : "tracking-wider"}`}>
          {t.officialDemo}
        </div>
      </motion.div>

      <CustomCaseSimulatorModal
        isOpen={customCaseOpen}
        onClose={() => setCustomCaseOpen(false)}
      />
    </div>
  );
}
