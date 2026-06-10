"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, CheckCircle2, AlertTriangle, ArrowRight, X, ShieldCheck, UserCheck, Scale, FileText, HeartHandshake } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo-context";
import { saveCustomCase, addAgentTrace } from "@/lib/services/caseService";
import { runDecisionAgent } from "@/lib/agent-rules";
import { MOCK_CASES } from "@/lib/mock-data";

const T = {
  EN: {
    modalCustomCaseTitle: "Custom Case Simulator",
    modalCustomCaseSubtitle: "Enter case details and let SAKAN AI determine the recommendation, routing path, and next action.",
    lblBeneficiaryName: "Beneficiary Name",
    lblActiveRequest: "Active Request",
    lblMonthlyIncome: "Monthly Income",
    lblFinancialObligations: "Financial Obligations",
    lblFamilyMembers: "Family Members",
    lblCurrentInstallment: "Current Installment",
    lblArrearsAmount: "Arrears Amount",
    lblRemainingRepaymentMonths: "Remaining Repayment Months",
    lblSalaryCertificateStatus: "Salary Certificate Status",
    lblSalaryCertificateAmount: "Salary Certificate Amount",
    lblBankAverageTransfer: "Bank Average Transfer",
    lblSupportingCircumstance: "Supporting Circumstance",
    optNone: "None",
    optJobLoss: "Job Loss",
    optLargeFamily: "Large Family",
    optMedical: "Medical Circumstance",
    optLowIncome: "Low Income Per Family Member",
    btnResetTestCase: "Reset Test Case",
    btnCancel: "Cancel",
    btnGenerateRecommendation: "Generate Custom Assessment",
    btnContinueUaePass: "Continue to UAE PASS Assessment",
    btnGenerating: "Running SAKAN Decision Agent...",
    
    // Success State
    successTitle: "Custom case generated successfully.",
    summaryLabel: "Case Summary",
    lblCaseCode: "Case Code",
    lblRecommendation: "Recommendation",
    lblRoutingPath: "Routing Path",
    lblPriority: "Priority",
    lblNextOwner: "Next Owner",
    btnContinueBeneficiary: "Continue as Beneficiary",
    btnOpenReport: "Open Decision Report",
  },
  AR: {
    modalCustomCaseTitle: "محاكاة حالة جديدة",
    modalCustomCaseSubtitle: "أدخل بيانات الحالة ليحدد سكن AI التوصية ومسار الطلب والإجراء التالي.",
    lblBeneficiaryName: "اسم المستفيد",
    lblActiveRequest: "طلب نشط",
    lblMonthlyIncome: "الدخل الشهري",
    lblFinancialObligations: "الالتزامات المالية",
    lblFamilyMembers: "عدد أفراد الأسرة",
    lblCurrentInstallment: "القسط الحالي",
    lblArrearsAmount: "مبلغ المتأخرات",
    lblRemainingRepaymentMonths: "مدة السداد المتبقية",
    lblSalaryCertificateStatus: "حالة شهادة الراتب",
    lblSalaryCertificateAmount: "مبلغ شهادة الراتب",
    lblBankAverageTransfer: "متوسط التحويل البنكي",
    lblSupportingCircumstance: "ظرف داعم",
    optNone: "لا يوجد",
    optJobLoss: "فقدان العمل",
    optLargeFamily: "أسرة كبيرة العدد",
    optMedical: "ظرف طبي",
    optLowIncome: "دخل منخفض للفرد",
    btnResetTestCase: "إعادة ضبط الحالة",
    btnCancel: "إلغاء",
    btnGenerateRecommendation: "إنشاء تقييم مخصص",
    btnContinueUaePass: "متابعة التقييم عبر الهوية الرقمية",
    btnGenerating: "جاري تشغيل وكيل قرار سكن...",
    
    // Success State
    successTitle: "تم إنشاء الحالة التجريبية بنجاح.",
    summaryLabel: "ملخص الحالة",
    lblCaseCode: "كود الحالة",
    lblRecommendation: "التوصية",
    lblRoutingPath: "مسار الطلب",
    lblPriority: "الأولوية",
    lblNextOwner: "المسؤول التالي",
    btnContinueBeneficiary: "المتابعة كمتعامل",
    btnOpenReport: "فتح تقرير القرار",
  }
};

const defaultCustomCaseData = {
  beneficiaryName: "Test Beneficiary",
  monthlyIncome: 18000,
  financialObligations: 6000,
  familyMembers: 5,
  currentInstallment: 2900,
  arrearsAmount: 4000,
  remainingRepaymentMonths: 96,
  activeRequest: false,
  salaryCertificateExpired: false,
  salaryCertificateAmount: 18000,
  averageSalaryTransfer6Months: 18000,
  supportingCircumstance: "None",
  evidenceUploaded: false,
  emiratesId: ""
};

interface CustomCaseSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseGenerated?: (newCaseCard: any, newCaseId: string) => void;
}

export function CustomCaseSimulatorModal({ isOpen, onClose, onCaseGenerated }: CustomCaseSimulatorModalProps) {
  const router = useRouter();
  const { language, setSelectedCaseId, identityVerified, identitySource, uaePassProfile } = useDemo();
  const isAr = language === "AR";
  const t = T[isAr ? "AR" : "EN"];

  const [customCaseData, setCustomCaseData] = useState(defaultCustomCaseData);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  
  // Success states
  const [step, setStep] = useState<"input" | "success">("input");
  const [generatedInfo, setGeneratedInfo] = useState<{
    caseId: string;
    recommendation: string;
    routingPath: string;
    priority: string;
    nextOwner: string;
  } | null>(null);

  const isUaePass = identityVerified && identitySource === "UAE PASS Staging";

  useEffect(() => {
    if (isOpen && isUaePass && uaePassProfile) {
      setCustomCaseData(prev => ({
        ...prev,
        beneficiaryName: uaePassProfile.fullName || "",
      }));
    }
  }, [isOpen, isUaePass, uaePassProfile]);

  const isValid = () => {
    if (customCaseData.monthlyIncome < 0) return false;
    if (customCaseData.financialObligations < 0) return false;
    if (customCaseData.familyMembers < 1) return false;
    if (customCaseData.remainingRepaymentMonths < 1) return false;
    if (customCaseData.arrearsAmount < 0) return false;
    if (customCaseData.currentInstallment < 0) return false;
    if (customCaseData.salaryCertificateAmount < 0) return false;
    return true;
  };

  const getExpectedRoute = () => {
    const {
      monthlyIncome, financialObligations, familyMembers, currentInstallment, arrearsAmount,
      remainingRepaymentMonths, activeRequest, salaryCertificateExpired, salaryCertificateAmount,
      averageSalaryTransfer6Months, supportingCircumstance
    } = customCaseData;

    const max20PercentDeduction = monthlyIncome * 0.20;
    const obligationsRatio = monthlyIncome > 0 ? financialObligations / monthlyIncome : 0;
    const incomePerFamilyMember = familyMembers > 0 ? monthlyIncome / familyMembers : 0;
    const proposedAvailableRoom = max20PercentDeduction - currentInstallment;
    
    let proposedArrearsPayment = 0;
    let proposedDurationMonths: number | null = null;
    if (proposedAvailableRoom > 0) {
      proposedArrearsPayment = Math.min(proposedAvailableRoom, arrearsAmount);
      if (proposedArrearsPayment > 0) {
        proposedDurationMonths = Math.ceil(arrearsAmount / proposedArrearsPayment);
      }
    }

    const mismatch = salaryCertificateAmount !== monthlyIncome;
    const variance = salaryCertificateAmount > 0 ? Math.abs(averageSalaryTransfer6Months - salaryCertificateAmount) / salaryCertificateAmount : 0;
    const bankInconsistent = variance > 0.10;

    const humanReviewTriggers = [];
    if (activeRequest) humanReviewTriggers.push("ACTIVE_REQUEST_FOUND");
    if (obligationsRatio > 0.6) humanReviewTriggers.push("HIGH_OBLIGATION_RATIO");
    if (incomePerFamilyMember < 3000) humanReviewTriggers.push("LOW_INCOME_PER_FAMILY_MEMBER");
    if (proposedArrearsPayment === 0 && arrearsAmount > 0) humanReviewTriggers.push("CAPACITY_UNAVAILABLE");
    if (proposedDurationMonths && proposedDurationMonths > remainingRepaymentMonths) humanReviewTriggers.push("PERIOD_EXCEEDED");
    if (supportingCircumstance !== "None") humanReviewTriggers.push("HUMANITARIAN_REVIEW");

    const isPolicyCapFail = !activeRequest && proposedAvailableRoom <= 0 && supportingCircumstance === "None" && obligationsRatio <= 0.6 && incomePerFamilyMember >= 3000;

    if (salaryCertificateExpired || mismatch || bankInconsistent) {
      return "Applicant Action Required → Document Correction Required";
    } else if (activeRequest) {
      return "Direct Beneficiary Outcome → Existing Active Request / Not Eligible";
    } else if (isPolicyCapFail) {
      return "Direct Beneficiary Outcome → Not Eligible Under Current Rules";
    } else if (humanReviewTriggers.length > 0) {
      return "Humanitarian Review Required";
    } else {
      return "Recommended for Approval → Ready for Officer Confirmation";
    }
  };

  const handleGenerateCustomCase = () => {
    if (!isValid()) return;
    setIsGeneratingCustom(true);
    setTimeout(() => {
      const {
        monthlyIncome, financialObligations, familyMembers, currentInstallment, arrearsAmount,
        remainingRepaymentMonths, activeRequest, salaryCertificateExpired, salaryCertificateAmount,
        averageSalaryTransfer6Months, supportingCircumstance
      } = customCaseData;

      const max20PercentDeduction = monthlyIncome * 0.20;
      const obligationsRatio = monthlyIncome > 0 ? financialObligations / monthlyIncome : 0;
      const incomePerFamilyMember = familyMembers > 0 ? monthlyIncome / familyMembers : 0;
      const proposedAvailableRoom = max20PercentDeduction - currentInstallment;
      
      let proposedArrearsPayment = 0;
      let proposedDurationMonths: number | null = null;
      if (proposedAvailableRoom > 0) {
        proposedArrearsPayment = Math.min(proposedAvailableRoom, arrearsAmount);
        if (proposedArrearsPayment > 0) {
          proposedDurationMonths = Math.ceil(arrearsAmount / proposedArrearsPayment);
        }
      }

      const mismatch = salaryCertificateAmount !== monthlyIncome;
      const variance = salaryCertificateAmount > 0 ? Math.abs(averageSalaryTransfer6Months - salaryCertificateAmount) / salaryCertificateAmount : 0;
      const bankInconsistent = variance > 0.10;

      let recStatus = "";
      let recStatusAr = "";
      let secondaryLabelEn = "";
      let secondaryLabelAr = "";
      let routingPathEn = "";
      let routingPathAr = "";
      let nextOwnerEn = "";
      let nextOwnerAr = "";
      let priorityEn = "";
      let priorityAr = "";
      let nextBestActionEn = "";
      let nextBestActionAr = "";
      let confidence = 0;
      
      const humanReviewTriggers = [];
      if (activeRequest) humanReviewTriggers.push("ACTIVE_REQUEST_FOUND");
      if (obligationsRatio > 0.6) humanReviewTriggers.push("HIGH_OBLIGATION_RATIO");
      if (incomePerFamilyMember < 3000) humanReviewTriggers.push("LOW_INCOME_PER_FAMILY_MEMBER");
      if (proposedArrearsPayment === 0 && arrearsAmount > 0) humanReviewTriggers.push("CAPACITY_UNAVAILABLE");
      if (proposedDurationMonths && proposedDurationMonths > remainingRepaymentMonths) humanReviewTriggers.push("PERIOD_EXCEEDED");
      if (supportingCircumstance !== "None") humanReviewTriggers.push("HUMANITARIAN_REVIEW");

      const isPolicyCapFail = !activeRequest && proposedAvailableRoom <= 0 && supportingCircumstance === "None" && obligationsRatio <= 0.6 && incomePerFamilyMember >= 3000;

      if (salaryCertificateExpired || mismatch || bankInconsistent) {
        recStatus = "Applicant Action Required";
        recStatusAr = "مطلوب إجراء من المتعامل";
        secondaryLabelEn = "Document Correction Required";
        secondaryLabelAr = "مطلوب تصحيح المستندات";
        routingPathEn = "Applicant Action Required";
        routingPathAr = "مطلوب إجراء من المتعامل";
        nextOwnerEn = "Beneficiary";
        nextOwnerAr = "المتعامل";
        priorityEn = "Medium";
        priorityAr = "متوسطة";
        nextBestActionEn = "Request updated salary certificate and bank statement clarification.";
        nextBestActionAr = "طلب شهادة راتب محدثة وتوضيح كشف الحساب البنكي.";
        confidence = 65;
      } else if (activeRequest) {
        recStatus = "Existing Active Request / Not Eligible";
        recStatusAr = "يوجد طلب نشط / غير مؤهل";
        secondaryLabelEn = "Duplicate / Active Request";
        secondaryLabelAr = "طلب مكرر / نشط";
        routingPathEn = "Direct Beneficiary Outcome";
        routingPathAr = "نتيجة مباشرة للمتعامل";
        nextOwnerEn = "Not routed to officer";
        nextOwnerAr = "لم يتم التوجيه للموظف";
        priorityEn = "Low";
        priorityAr = "منخفضة";
        nextBestActionEn = "Notify beneficiary of existing active request.";
        nextBestActionAr = "إبلاغ المتعامل بوجود طلب نشط حالي.";
        confidence = 99;
      } else if (isPolicyCapFail) {
        recStatus = "Not Eligible Under Current Rules";
        recStatusAr = "غير مؤهل حسب القواعد الحالية";
        secondaryLabelEn = "Policy Cap Failed";
        secondaryLabelAr = "فشل في سقف السياسة";
        routingPathEn = "Direct Beneficiary Outcome";
        routingPathAr = "نتيجة مباشرة للمتعامل";
        nextOwnerEn = "Not routed to officer";
        nextOwnerAr = "لم يتم التوجيه للموظف";
        priorityEn = "Low";
        priorityAr = "منخفضة";
        nextBestActionEn = "Notify beneficiary of rejection due to policy limits.";
        nextBestActionAr = "إبلاغ المتعامل بالرفض بسبب حدود السياسة.";
        confidence = 99;
      } else if (humanReviewTriggers.length > 0) {
        recStatus = "Humanitarian Review Required"; 
        recStatusAr = "يتطلب مراجعة إنسانية";
        secondaryLabelEn = "Humanitarian / Policy Conflict";
        secondaryLabelAr = "حالة إنسانية / تعارض في السياسة";
        routingPathEn = "Officer/Specialist Review";
        routingPathAr = "مراجعة الضابط/المختص";
        nextOwnerEn = "Senior Officer";
        nextOwnerAr = "موظف مختص";
        priorityEn = "High";
        priorityAr = "عالية";
        nextBestActionEn = "Assign case to senior officer for humanitarian review.";
        nextBestActionAr = "تحويل الحالة إلى موظف مختص للمراجعة الإنسانية.";
        confidence = 75;
      } else {
        recStatus = "Recommended for Approval";
        recStatusAr = "موصى بالموافقة";
        secondaryLabelEn = "Ready for Officer Confirmation";
        secondaryLabelAr = "جاهز لاعتماد الموظف";
        routingPathEn = "Ready for Officer Confirmation";
        routingPathAr = "جاهز لاعتماد الموظف";
        nextOwnerEn = "Officer Confirmation";
        nextOwnerAr = "اعتماد الموظف";
        priorityEn = "Low";
        priorityAr = "منخفضة";
        nextBestActionEn = "Generate updated repayment schedule and prepare for officer confirmation.";
        nextBestActionAr = "إنشاء جدول سداد محدث وتجهيز الحالة لاعتماد الموظف.";
        confidence = 95;
      }

      let newCaseId = "CUSTOM-001";
      if (typeof window !== "undefined" && localStorage.getItem(`customCase_CUSTOM-001`)) {
        newCaseId = `CUSTOM-${Date.now().toString().slice(-6)}`;
      }

      const newMockData = {
        caseId: newCaseId,
        beneficiaryName: customCaseData.beneficiaryName,
        beneficiaryId: isUaePass ? "Pending UAE PASS" : "BEN-784-CUS",
        emiratesId: isUaePass ? (uaePassProfile?.emiratesId || "") : (customCaseData.emiratesId || "784-1999-0000000-0"),
        loanId: "LOAN-CUS-001",
        monthlyIncome,
        financialObligations,
        familyMembers,
        originalLoanAmount: 800000,
        remainingLoanBalance: arrearsAmount + currentInstallment * remainingRepaymentMonths,
        arrearsAmount,
        unpaidInstallments: Math.floor(arrearsAmount / currentInstallment) || 0,
        currentInstallment,
        remainingRepaymentMonths,
        paymentHistory: "Custom Simulator",
        activeRequest,
        salaryCertificateAmount,
        salaryCertificateExpired,
        documentConfidence: 90,
        hasCompanyLetterhead: true,
        hasAuthorizedSignature: true,
        employeeDetailsMatch: true,
        averageSalaryTransfer6Months,
        hasMedicalDocument: supportingCircumstance === "Medical Circumstance" || customCaseData.evidenceUploaded,
        supportingEvidenceFile: customCaseData.evidenceUploaded && supportingCircumstance !== "None" ? "simulated_evidence.pdf" : undefined,
        supportingCircumstance: supportingCircumstance === "None" ? undefined : supportingCircumstance,
        identityVerified: isUaePass ? true : undefined,
        identitySource: isUaePass ? "UAE PASS Staging" : undefined,
        uaePassProfile: isUaePass ? uaePassProfile : undefined,
      };

      // Clear any potential stale state
      delete (newMockData as any).documentValidation;
      delete (newMockData as any).warnings;
      delete (newMockData as any).correctionRequired;
      delete (newMockData as any).applicantActionRequired;
      delete (newMockData as any).route;
      (newMockData as any).ocrWarnings = [];


      saveCustomCase({
        ...newMockData,
        recommendation: recStatus,
        routingPath: routingPathEn,
        nextOwner: nextOwnerEn,
        priority: priorityEn,
        confidenceScore: confidence,
        nextBestAction: nextBestActionEn,
        status: recStatus,
      }).then(() => {
        addAgentTrace(newCaseId, {
          actor: "Officer",
          action: "Custom case generated and evaluated by SAKAN AI",
          source: "Workspace",
          status: "Success",
        });
      });

      MOCK_CASES[newCaseId] = newMockData as any;
      const report = runDecisionAgent(newMockData as any);

      const newCaseCard = {
        caseId: newCaseId,
        en: {
          beneficiary: customCaseData.beneficiaryName,
          recommendation: recStatus,
          secondaryLabel: secondaryLabelEn,
          priority: priorityEn,
          routingPath: routingPathEn,
          nextOwner: nextOwnerEn,
          routingReason: "Custom case simulation.",
          nextBestAction: nextBestActionEn,
        },
        ar: {
          beneficiary: customCaseData.beneficiaryName,
          recommendation: recStatusAr,
          secondaryLabel: secondaryLabelAr,
          priority: priorityAr,
          routingPath: routingPathAr,
          nextOwner: nextOwnerAr,
          routingReason: "محاكاة حالة اختبار مخصصة.",
          nextBestAction: nextBestActionAr,
        },
        confidence: confidence + "%",
        priority: priorityEn,
        recommendationStatus: recStatus,
        dynamicStatus: null as string | null,
        isCustom: true,
        source: "custom",
      };

      if (onCaseGenerated) {
        onCaseGenerated(newCaseCard, newCaseId);
      }

      setGeneratedInfo({
        caseId: newCaseId,
        recommendation: isAr ? recStatusAr : recStatus,
        routingPath: isAr ? routingPathAr : routingPathEn,
        priority: isAr ? priorityAr : priorityEn,
        nextOwner: isAr ? nextOwnerAr : nextOwnerEn,
      });

      setIsGeneratingCustom(false);
      setStep("success");
    }, 1000);
  };

  const handleContinueAsBeneficiary = () => {
    if (generatedInfo) {
      setSelectedCaseId(generatedInfo.caseId as any);
      onClose();
      router.push(isUaePass ? "/apply?mode=uaepass-test" : "/portal");
    }
  };

  const handleOpenDecisionReport = () => {
    if (generatedInfo) {
      onClose();
      const isRejected = 
        generatedInfo.recommendation.includes("Not Eligible") || 
        generatedInfo.recommendation.includes("Rejected") ||
        generatedInfo.recommendation.includes("غير مؤهل");
      if (isRejected) {
        router.push(`/apply/result?caseId=${generatedInfo.caseId}`);
      } else {
        router.push(`/officer/report/${generatedInfo.caseId}`);
      }
    }
  };

  const resetForm = () => {
    setCustomCaseData(defaultCustomCaseData);
    setStep("input");
    setGeneratedInfo(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sakan-navy/60 backdrop-blur-md font-arabic-premium" dir={isAr ? "rtl" : "ltr"}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="bg-sakan-navy text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-sakan-gold" />
                <div>
                  <h2 className="text-xl font-bold">{t.modalCustomCaseTitle}</h2>
                  <p className="text-white/70 text-xs font-medium">{t.modalCustomCaseSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { resetForm(); onClose(); }}
                className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === "input" ? (
              <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Form Inputs */}
                <div className="flex-1 p-6 overflow-y-auto bg-sakan-bg">
                  <div className="space-y-8">

                    {/* Quick Presets */}
                    <div className="bg-white p-5 border border-sakan-border rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-sakan-navy font-bold text-sm uppercase tracking-wider border-b border-sakan-border pb-3">
                        <Calculator className="w-4 h-4 text-sakan-gold" />
                        Demo Presets (Test Pack Helpers)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomCaseData({ ...defaultCustomCaseData })}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-sakan-gold text-sakan-navy hover:bg-sakan-gold/10"
                        >
                          Clean Approval
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomCaseData({ ...defaultCustomCaseData, monthlyIncome: 18000, salaryCertificateAmount: 25000, averageSalaryTransfer6Months: 25000 })}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-sakan-gold text-sakan-navy hover:bg-sakan-gold/10"
                        >
                          Salary Mismatch
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomCaseData({ ...defaultCustomCaseData, salaryCertificateExpired: true })}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-sakan-gold text-sakan-navy hover:bg-sakan-gold/10"
                        >
                          Expired Certificate
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomCaseData({ ...defaultCustomCaseData, activeRequest: true })}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-sakan-gold text-sakan-navy hover:bg-sakan-gold/10"
                        >
                          Duplicate Active Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomCaseData({ ...defaultCustomCaseData, monthlyIncome: 9000, salaryCertificateAmount: 9000, averageSalaryTransfer6Months: 9000, supportingCircumstance: "Job loss", evidenceUploaded: true })}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-sakan-gold text-sakan-navy hover:bg-sakan-gold/10"
                        >
                          Humanitarian
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomCaseData({ ...defaultCustomCaseData, monthlyIncome: 10000, currentInstallment: 3000, salaryCertificateAmount: 10000, averageSalaryTransfer6Months: 10000 })}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-sakan-gold text-sakan-navy hover:bg-sakan-gold/10"
                        >
                          Policy Cap Fail
                        </button>
                      </div>
                    </div>
                    
                    {/* Section 1: Applicant Identity */}
                    <div className="bg-white p-5 border border-sakan-border rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-sakan-border pb-3">
                        <div className="flex items-center gap-2 text-sakan-navy font-bold text-sm uppercase tracking-wider">
                          <UserCheck className="w-4 h-4 text-sakan-gold" />
                          Section 1: Applicant Identity
                        </div>
                        <span className="text-[10px] font-mono bg-sakan-navy/5 text-sakan-navy px-2 py-1 rounded">Identity Intake Agent</span>
                      </div>
                      <p className="text-xs text-sakan-text/70">Identity data is used by the Identity Intake Agent to link the applicant to a loan record.</p>
                      
                      {isUaePass && (
                        <div className="flex flex-col gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-xs">
                          <div className="flex items-center gap-2 font-bold text-emerald-800">
                            <ShieldCheck className="w-4 h-4" /> Identity Verified via UAE PASS Staging
                          </div>
                          <div className="text-emerald-700 flex flex-wrap gap-2">
                            <span className="bg-emerald-100 px-2 py-1 rounded">Real Staging Login</span>
                            <span className="bg-emerald-100 px-2 py-1 rounded font-mono">UUID: {(uaePassProfile?.uuid || "").substring(0, 8)}...</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblBeneficiaryName}</label>
                          <input
                            type="text"
                            value={customCaseData.beneficiaryName}
                            onChange={e => setCustomCaseData({ ...customCaseData, beneficiaryName: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-sakan-border focus:ring-2 focus:ring-sakan-gold/50 outline-none text-sm font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">Emirates ID</label>
                          <input
                            type="text"
                            readOnly={isUaePass}
                            placeholder={isUaePass && !uaePassProfile?.emiratesId ? "Attribute not returned by staging profile" : "784-1999-0000000-0"}
                            value={isUaePass ? (uaePassProfile?.emiratesId || "") : customCaseData.emiratesId}
                            onChange={(e) => {
                              if (!isUaePass) {
                                setCustomCaseData({ ...customCaseData, emiratesId: e.target.value });
                              }
                            }}
                            className="w-full px-4 py-2 rounded-xl border border-sakan-border focus:ring-2 focus:ring-sakan-gold/50 outline-none text-sm font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">Identity Source</label>
                          <input
                            type="text"
                            readOnly
                            value={isUaePass ? "UAE PASS Staging" : "Manual Test Case"}
                            className="w-full px-4 py-2 rounded-xl border border-sakan-border bg-sakan-bg text-sm font-bold opacity-70"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Loan & Arrears Details */}
                    <div className="bg-white p-5 border border-sakan-border rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-sakan-border pb-3">
                        <div className="flex items-center gap-2 text-sakan-navy font-bold text-sm uppercase tracking-wider">
                          <Scale className="w-4 h-4 text-sakan-gold" />
                          Section 2: Loan & Arrears Details
                        </div>
                        <span className="text-[10px] font-mono bg-sakan-navy/5 text-sakan-navy px-2 py-1 rounded">Policy Rules Agent • Repayment Plan Agent</span>
                      </div>
                      <p className="text-xs text-sakan-text/70">Loan data is used to check policy conflicts and repayment feasibility.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblCurrentInstallment}</label>
                          <input
                            type="number"
                            value={customCaseData.currentInstallment}
                            onChange={e => setCustomCaseData({ ...customCaseData, currentInstallment: Number(e.target.value) })}
                            className={`w-full px-4 py-2 rounded-xl border ${customCaseData.currentInstallment < 0 ? 'border-red-500' : 'border-sakan-border'} outline-none text-sm font-bold`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblArrearsAmount}</label>
                          <input
                            type="number"
                            value={customCaseData.arrearsAmount}
                            onChange={e => setCustomCaseData({ ...customCaseData, arrearsAmount: Number(e.target.value) })}
                            className={`w-full px-4 py-2 rounded-xl border ${customCaseData.arrearsAmount < 0 ? 'border-red-500' : 'border-sakan-border'} outline-none text-sm font-bold`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblRemainingRepaymentMonths}</label>
                          <input
                            type="number"
                            value={customCaseData.remainingRepaymentMonths}
                            onChange={e => setCustomCaseData({ ...customCaseData, remainingRepaymentMonths: Number(e.target.value) })}
                            className={`w-full px-4 py-2 rounded-xl border ${customCaseData.remainingRepaymentMonths < 1 ? 'border-red-500' : 'border-sakan-border'} outline-none text-sm font-bold`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblActiveRequest}</label>
                          <select
                            value={customCaseData.activeRequest ? "Yes" : "No"}
                            onChange={e => setCustomCaseData({ ...customCaseData, activeRequest: e.target.value === "Yes" })}
                            className="w-full px-4 py-2 rounded-xl border border-sakan-border focus:ring-2 focus:ring-sakan-gold/50 outline-none text-sm font-bold"
                          >
                            <option value="No">{isAr ? "لا" : "No"}</option>
                            <option value="Yes">{isAr ? "نعم" : "Yes"}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Financial Capacity */}
                    <div className="bg-white p-5 border border-sakan-border rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-sakan-border pb-3">
                        <div className="flex items-center gap-2 text-sakan-navy font-bold text-sm uppercase tracking-wider">
                          <Calculator className="w-4 h-4 text-sakan-gold" />
                          Section 3: Financial Capacity
                        </div>
                        <span className="text-[10px] font-mono bg-sakan-navy/5 text-sakan-navy px-2 py-1 rounded">Financial Analysis Agent</span>
                      </div>
                      <p className="text-xs text-sakan-text/70">These values are analyzed by the Financial Analysis Agent.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblMonthlyIncome}</label>
                          <input
                            type="number"
                            value={customCaseData.monthlyIncome}
                            onChange={e => setCustomCaseData({ ...customCaseData, monthlyIncome: Number(e.target.value) })}
                            className={`w-full px-4 py-2 rounded-xl border ${customCaseData.monthlyIncome < 0 ? 'border-red-500' : 'border-sakan-border'} outline-none text-sm font-bold`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblFinancialObligations}</label>
                          <input
                            type="number"
                            value={customCaseData.financialObligations}
                            onChange={e => setCustomCaseData({ ...customCaseData, financialObligations: Number(e.target.value) })}
                            className={`w-full px-4 py-2 rounded-xl border ${customCaseData.financialObligations < 0 ? 'border-red-500' : 'border-sakan-border'} outline-none text-sm font-bold`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblFamilyMembers}</label>
                          <input
                            type="number"
                            value={customCaseData.familyMembers}
                            onChange={e => setCustomCaseData({ ...customCaseData, familyMembers: Number(e.target.value) })}
                            className={`w-full px-4 py-2 rounded-xl border ${customCaseData.familyMembers < 1 ? 'border-red-500' : 'border-sakan-border'} outline-none text-sm font-bold`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <div className="bg-sakan-navy/5 px-3 py-2 rounded-lg font-mono text-sakan-navy">
                          Obligations Ratio: <span className="font-bold">{customCaseData.monthlyIncome > 0 ? ((customCaseData.financialObligations / customCaseData.monthlyIncome) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="bg-sakan-navy/5 px-3 py-2 rounded-lg font-mono text-sakan-navy">
                          Income/Member: <span className="font-bold">AED {customCaseData.familyMembers > 0 ? (customCaseData.monthlyIncome / customCaseData.familyMembers).toFixed(0) : 0}</span>
                        </div>
                        <div className="bg-sakan-navy/5 px-3 py-2 rounded-lg font-mono text-sakan-navy">
                          20% Cap: <span className="font-bold">AED {(customCaseData.monthlyIncome * 0.20).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Document Scenario */}
                    <div className="bg-white p-5 border border-sakan-border rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-sakan-border pb-3">
                        <div className="flex items-center gap-2 text-sakan-navy font-bold text-sm uppercase tracking-wider">
                          <FileText className="w-4 h-4 text-sakan-gold" />
                          Section 4: Document Scenario
                        </div>
                        <span className="text-[10px] font-mono bg-sakan-navy/5 text-sakan-navy px-2 py-1 rounded">Document Intelligence Agent</span>
                      </div>
                      <p className="text-xs text-sakan-text/70">These fields simulate the document validation result before or after OCR.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblSalaryCertificateStatus}</label>
                          <select
                            value={customCaseData.salaryCertificateExpired ? "Expired" : "Valid"}
                            onChange={e => setCustomCaseData({ ...customCaseData, salaryCertificateExpired: e.target.value === "Expired" })}
                            className="w-full px-4 py-2 rounded-xl border border-sakan-border focus:ring-2 focus:ring-sakan-gold/50 outline-none text-sm font-bold"
                          >
                            <option value="Valid">Valid</option>
                            <option value="Expired">Expired</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblSalaryCertificateAmount}</label>
                          <input
                            type="number"
                            value={customCaseData.salaryCertificateAmount}
                            onChange={e => setCustomCaseData({ ...customCaseData, salaryCertificateAmount: Number(e.target.value) })}
                            className={`w-full px-4 py-2 rounded-xl border ${customCaseData.salaryCertificateAmount < 0 ? 'border-red-500' : 'border-sakan-border'} outline-none text-sm font-bold`}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblBankAverageTransfer}</label>
                          <input
                            type="number"
                            value={customCaseData.averageSalaryTransfer6Months}
                            onChange={e => setCustomCaseData({ ...customCaseData, averageSalaryTransfer6Months: Number(e.target.value) })}
                            className="w-full px-4 py-2 rounded-xl border border-sakan-border focus:ring-2 focus:ring-sakan-gold/50 outline-none text-sm font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Humanitarian / Exception */}
                    <div className="bg-white p-5 border border-sakan-border rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-sakan-border pb-3">
                        <div className="flex items-center gap-2 text-sakan-navy font-bold text-sm uppercase tracking-wider">
                          <HeartHandshake className="w-4 h-4 text-sakan-gold" />
                          Section 5: Humanitarian / Exception
                        </div>
                        <span className="text-[10px] font-mono bg-sakan-navy/5 text-sakan-navy px-2 py-1 rounded">Recommendation & Routing Agent</span>
                      </div>
                      <p className="text-xs text-sakan-text/70">Humanitarian cases are routed to review only when supporting evidence exists.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">{t.lblSupportingCircumstance}</label>
                          <select
                            value={customCaseData.supportingCircumstance}
                            onChange={e => {
                              const val = e.target.value;
                              setCustomCaseData(prev => ({ 
                                ...prev, 
                                supportingCircumstance: val,
                                evidenceUploaded: (val === "None") ? false : prev.evidenceUploaded 
                              }));
                            }}
                            className="w-full px-4 py-2 rounded-xl border border-sakan-border focus:ring-2 focus:ring-sakan-gold/50 outline-none text-sm font-bold"
                          >
                            <option value="None">{t.optNone}</option>
                            <option value="Job loss">Job loss</option>
                            <option value="Income reduction">Income reduction</option>
                            <option value="Medical Circumstance">Medical circumstance</option>
                            <option value="Social hardship">Social hardship</option>
                            <option value="Other exception">Other exception</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-sakan-navy">Supporting Evidence</label>
                          <select
                            value={customCaseData.evidenceUploaded ? "Yes" : "No"}
                            onChange={e => setCustomCaseData({ ...customCaseData, evidenceUploaded: e.target.value === "Yes" })}
                            disabled={customCaseData.supportingCircumstance === "None"}
                            className="w-full px-4 py-2 rounded-xl border border-sakan-border focus:ring-2 focus:ring-sakan-gold/50 outline-none text-sm font-bold disabled:opacity-50"
                          >
                            <option value="No">No evidence uploaded</option>
                            <option value="Yes">Evidence uploaded</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
                
                {/* Right Panel: Preview & Footer */}
                <div className="lg:w-80 bg-sakan-navy/5 border-l border-sakan-border p-6 flex flex-col justify-between shrink-0">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-sakan-navy uppercase tracking-wider">Expected Routing Preview</h3>
                    <div className="bg-white p-4 border border-sakan-border rounded-xl shadow-sm text-sm font-bold text-sakan-navy">
                      Likely route: {getExpectedRoute()}
                    </div>
                    <p className="text-xs text-sakan-text/70">
                      This is a preview. The final route is generated after document validation and policy rules are applied.
                    </p>
                    
                    {!isValid() && (
                      <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 mt-4 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Please fix invalid field values before generating assessment.</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mt-8">
                    <button
                      type="button"
                      disabled={isGeneratingCustom || !isValid()}
                      onClick={handleGenerateCustomCase}
                      className="w-full bg-sakan-navy text-white px-4 py-3 rounded-xl font-bold hover:bg-sakan-navy/90 transition-colors shadow-md disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                    >
                      {isGeneratingCustom && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {isGeneratingCustom ? t.btnGenerating : (isUaePass ? t.btnContinueUaePass : t.btnGenerateRecommendation)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomCaseData(defaultCustomCaseData)}
                      className="w-full px-4 py-3 text-sakan-navy font-bold rounded-xl border border-sakan-border hover:bg-white transition-colors text-sm bg-white"
                    >
                      {t.btnResetTestCase}
                    </button>
                    <button
                      type="button"
                      onClick={() => { resetForm(); onClose(); }}
                      className="w-full px-4 py-3 text-sakan-text font-bold hover:bg-white rounded-xl transition-colors text-sm"
                    >
                      {t.btnCancel}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Success View */}
                <div className="flex-1 p-8 overflow-y-auto bg-sakan-bg flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-sakan-navy">{t.successTitle}</h3>
                  </div>

                  <div className="w-full max-w-md bg-white border border-sakan-border rounded-2xl p-5 shadow-sm space-y-3.5 text-start">
                    <h4 className="text-xs font-bold text-sakan-navy uppercase tracking-wider pb-2 border-b border-sakan-border">{t.summaryLabel}</h4>
                    {generatedInfo && [
                      { label: t.lblCaseCode, val: generatedInfo.caseId, bold: true },
                      { label: t.lblRecommendation, val: generatedInfo.recommendation },
                      { label: t.lblRoutingPath, val: generatedInfo.routingPath },
                      { label: t.lblPriority, val: generatedInfo.priority },
                      { label: t.lblNextOwner, val: generatedInfo.nextOwner },
                    ].map((row, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-medium">
                        <span className="text-sakan-text/75">{row.label}</span>
                        <span className={`text-sakan-navy font-bold text-right ${row.bold ? 'font-mono text-sakan-gold bg-sakan-navy/5 px-2 py-0.5 rounded' : ''}`}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success Footer Buttons */}
                <div className="p-6 bg-white border-t border-sakan-border flex flex-col sm:flex-row gap-3 items-center justify-center shrink-0">
                  <button
                    type="button"
                    onClick={handleContinueAsBeneficiary}
                    className="w-full sm:w-auto bg-sakan-gold text-sakan-navy font-extrabold px-8 py-3 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 hover:bg-sakan-gold/90"
                  >
                    <span>{t.btnContinueBeneficiary}</span>
                    <ArrowRight className={`w-4 h-4 text-sakan-navy ${isAr ? "rotate-180" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenDecisionReport}
                    className="w-full sm:w-auto bg-sakan-navy text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 hover:bg-sakan-navy/90"
                  >
                    <span>{t.btnOpenReport}</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
