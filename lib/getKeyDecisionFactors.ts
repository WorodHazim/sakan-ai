export type KeyDecisionFactors = { en: string[]; ar: string[] };

export function getKeyDecisionFactors(status: string): KeyDecisionFactors {
  const s = status || "";

  if (
    s === "Recommended for Approval / Ready for Officer Confirmation" ||
    s === "Approved" ||
    s === "Officer Approved Recommendation" ||
    s === "Recommended for Approval / Ready for Officer Confirmation"
  ) {
    return {
      en: [
        "Salary certificate valid and recent.",
        "Selected repayment plan stays within the 20% deduction cap.",
        "No blocking document or policy issues detected.",
        "Similar approved historical cases found.",
      ],
      ar: [
        "شهادة الراتب صالحة وحديثة.",
        "خطة السداد المحددة ضمن سقف الاستقطاع 20%.",
        "لم يتم رصد مشاكل مستندات أو سياسات حاجبة.",
        "تم العثور على حالات تاريخية مشابهة تمت الموافقة عليها.",
      ],
    };
  }

  if (
    s === "Applicant Action Required" ||
    s === "Additional Information Required" ||
    s === "Waiting for Applicant Documents"
  ) {
    return {
      en: [
        "Document issue detected and correction is required.",
        "Request was not routed to officer because the issue is correctable by the beneficiary.",
        "Correction guidance has been generated.",
      ],
      ar: [
        "تم رصد مشكلة في المستند ويلزم التصحيح.",
        "لم يتم تحويل الطلب للموظف لأن المشكلة قابلة للتصحيح من المستفيد.",
        "تم إنشاء إرشادات التصحيح.",
      ],
    };
  }

  if (
    s === "Humanitarian Review Required" ||
    s === "Human Review Required" ||
    s === "Assigned to Senior Officer"
  ) {
    return {
      en: [
        "Supporting evidence for hardship was uploaded.",
        "Automatic rejection was blocked due to humanitarian indicators.",
        "Case requires human judgment.",
      ],
      ar: [
        "تم رفع مستندات داعمة للظرف الاستثنائي.",
        "تم حجب الرفض التلقائي بسبب مؤشرات إنسانية.",
        "الحالة تتطلب حكمًا بشريًا.",
      ],
    };
  }

  return {
    en: [
      "Policy requirements were not met.",
      "Case was not routed to officer.",
      "Beneficiary outcome explanation was generated.",
    ],
    ar: [
      "لم يتم استيفاء متطلبات السياسة.",
      "لم يتم تحويل الحالة للموظف.",
      "تم إنشاء شرح نتيجة للمستفيد.",
    ],
  };
}
