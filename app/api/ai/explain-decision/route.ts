import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { MOCK_CASES } from "@/lib/mock-data";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      case_code,
      recommendation,
      routing_path,
      priority,
      next_owner,
      failed_rules,
      passed_rules,
      document_validation,
      financial_analysis,
      historical_pattern_insight,
      decision_trace,
      blocking_factors,
      next_best_action,
    } = payload;

    if (!case_code) {
      return NextResponse.json({ success: false, error: "Missing case_code" }, { status: 400 });
    }

    console.log("=== EXPLANATION REQUEST STARTED ===");
    console.log(`Case Code: ${case_code}`);
    console.log(`Recommendation: ${JSON.stringify(recommendation)}`);

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeyConfigured = !!apiKey;
    console.log(`Gemini Key Configured: ${isKeyConfigured}`);

    if (!isKeyConfigured) {
      console.log("Gemini Attempted: false");
      console.log("Gemini Success: false");
      console.log("Fallback Used: true");
      console.log("=== EXPLANATION REQUEST ENDED ===");
      return NextResponse.json({
        success: true,
        source: "fallback_explanation",
        data: getFallbackExplanation(recommendation, case_code),
      });
    }

    console.log("Gemini Attempted: true");
    const modelName = process.env.GEMINI_MODEL_PRIMARY || "gemini-2.5-flash";
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are generating an explanation for a government housing loan arrears rescheduling decision.
The decision was already made by a rules engine. You must NOT change the decision, recommendation, priority, routing, or next action.
Explain the decision based on the provided inputs.
Use clear, professional, government-friendly language. Avoid casual words.
Do not say the AI made the decision. Say "Based on policy rules..." or "In accordance with document validation checks...".
Arabic output must be in professional, official government Arabic.

Decision Payload:
- Case Code: ${case_code}
- Recommendation: ${JSON.stringify(recommendation)}
- Routing Path: ${routing_path}
- Priority: ${priority}
- Next Owner: ${next_owner}
- Failed Rules: ${JSON.stringify(failed_rules)}
- Passed Rules: ${JSON.stringify(passed_rules)}
- Document Validation: ${JSON.stringify(document_validation)}
- Financial Analysis: ${JSON.stringify(financial_analysis)}
- Historical Pattern Insight: ${JSON.stringify(historical_pattern_insight)}
- Decision Trace: ${JSON.stringify(decision_trace)}
- Blocking Factors: ${JSON.stringify(blocking_factors)}
- Next Best Action: ${next_best_action}

Generate a response matching this JSON schema:
{
  "whyThisRecommendation": {
    "en": string,
    "ar": string
  },
  "beneficiaryExplanation": {
    "en": string,
    "ar": string
  },
  "officerSummary": {
    "en": string,
    "ar": string
  },
  "smartCommunication": {
    "en": string,
    "ar": string
  },
  "keyReasons": {
    "en": string[],
    "ar": string[]
  },
  "nextBestAction": {
    "en": string,
    "ar": string
  }
}
Return valid JSON only. Do not wrap in markdown or backticks.
`;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [prompt],
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text?.trim() || "";
      const resultData = JSON.parse(text);

      console.log("Gemini Success: true");
      console.log("Fallback Used: false");
      console.log("=== EXPLANATION REQUEST ENDED ===");

      // Save to recommendations metadata or agent_traces if Supabase is available
      if (isSupabaseServerConfigured && supabaseAdmin) {
        try {
          await supabaseAdmin
            .from("agent_traces")
            .insert({
              case_code,
              actor: "AI Agent",
              action: "Generated dynamic Gemini explanation",
              source: "gemini_explanation",
              status: "Success",
              details: {
                explanation_source: "gemini_explanation",
                model: modelName,
                explanation: resultData,
              },
            });
        } catch (dbErr) {
          console.warn("Failed to save explanation trace to Supabase:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        source: "gemini_explanation",
        data: resultData,
      });

    } catch (geminiErr: any) {
      console.error("Gemini API call failed:", geminiErr.message || geminiErr);
      console.log("Gemini Success: false");
      console.log("Fallback Used: true");
      console.log(`Safe Error Message: ${geminiErr.message || "Unknown error"}`);
      console.log("=== EXPLANATION REQUEST ENDED ===");
      return NextResponse.json({
        success: true,
        source: "fallback_explanation",
        data: getFallbackExplanation(recommendation, case_code),
      });
    }

  } catch (err: any) {
    console.error("Explain Decision Route Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function getFallbackExplanation(recommendation: any, case_code: string) {
  const recStatus = (typeof recommendation === "string" ? recommendation : recommendation?.status) || "";
  const normalized = recStatus.toLowerCase();

  // 1. Additional Information Required
  if (normalized.includes("additional") || case_code === "CASE-B") {
    return {
      whyThisRecommendation: {
        en: "The case cannot proceed because the uploaded salary certificate is expired, and there is a mismatch between declared income, certificate values, and bank average transfer records.",
        ar: "يتعذر معالجة الطلب حالياً بسبب انتهاء صلاحية شهادة الراتب ووجود تعارض بين الدخل المسجل والشهادة وكشف الحساب البنكي.",
      },
      beneficiaryExplanation: {
        en: "Your request cannot proceed yet because the submitted salary certificate is expired or does not match the declared income and bank transfer records. Please upload an updated salary certificate and supporting bank statement.",
        ar: "لا يمكن متابعة الطلب حاليًا لأن شهادة الراتب المقدمة منتهية أو لا تتطابق مع الدخل المصرح به وسجلات التحويل البنكي. يرجى رفع شهادة راتب حديثة وكشف حساب داعم.",
      },
      officerSummary: {
        en: "Additional documents needed. Stated income does not match salary certificate, and certificate is expired (>30 days).",
        ar: "الحالة تتطلب مستندات إضافية. الدخل المصرح به لا يتطابق مع شهادة الراتب، والشهادة المرفقة منتهية الصلاحية (>30 يوماً).",
      },
      smartCommunication: {
        en: "Please upload a recent salary certificate issued within the last 30 days. The extracted salary does not match your declared income, and the bank transfer average is inconsistent with the salary certificate.",
        ar: "يرجى رفع شهادة راتب حديثة صادرة خلال آخر 30 يومًا. الراتب المستخرج لا يتطابق مع الدخل المصرح به، كما أن متوسط التحويل البنكي غير متسق مع شهادة الراتب.",
      },
      keyReasons: {
        en: ["Salary certificate expired", "Profile income mismatch", "Bank transfers inconsistent"],
        ar: ["شهادة الراتب منتهية الصلاحية", "تعارض في الدخل المصرح به", "التحويلات البنكية غير متسقة"],
      },
      nextBestAction: {
        en: "Send request for an updated salary certificate issued within the last 30 days and request bank statement clarification.",
        ar: "إرسال طلب لاستكمال شهادة راتب حديثة صادرة خلال آخر 30 يومًا وطلب توضيح كشف الحساب البنكي.",
      },
    };
  }

  // 2. Rejection Review
  if (normalized.includes("reject") || case_code === "CASE-D") {
    return {
      whyThisRecommendation: {
        en: "A policy conflict exists and the request is not eligible under current housing loan rules.",
        ar: "يوجد تعارض في السياسة والطلب غير مؤهل بموجب لوائح القروض السكنية الحالية.",
      },
      beneficiaryExplanation: {
        en: "Your request was not approved because it does not meet our housing loan policy criteria and no humanitarian exception was detected.",
        ar: "تعذر قبول طلبكم بسبب تعارض السياسات وعدم الأهلية بموجب الشروط الحالية، مع عدم توفر استثناء إنساني.",
      },
      officerSummary: {
        en: "Policy conflict and not eligible under current rules; no humanitarian exception detected.",
        ar: "يوجد تعارض في السياسة والطلب غير مؤهل بموجب القواعد الحالية، ولم يتم رصد ظرف إنساني استثنائي.",
      },
      smartCommunication: {
        en: "Your request was not approved because it does not meet our housing loan policy criteria and no humanitarian exception was detected.",
        ar: "تعذر قبول طلبكم بسبب تعارض السياسات وعدم الأهلية بموجب الشروط الحالية، مع عدم توفر استثناء إنساني.",
      },
      keyReasons: {
        en: ["Policy conflict detected", "No humanitarian exception found"],
        ar: ["تم رصد تعارض في السياسة", "لم يتم رصد ظرف إنساني استثنائي"],
      },
      nextBestAction: {
        en: "Review policy conflict and prepare rejection rationale for officer confirmation.",
        ar: "مراجعة تعارض السياسة وتجهيز مبررات الرفض لاعتماد الموظف المختص.",
      },
    };
  }

  // 3. Fast Track Approved
  if (normalized.includes("approved") || normalized.includes("fast track") || case_code === "CASE-A") {
    return {
      whyThisRecommendation: {
        en: "The beneficiary's application fully satisfies the policy rules, showing clean document validation and a proposed monthly deduction within the 20% limit.",
        ar: "يستوفي طلب المتعامل قواعد السياسة بالكامل، حيث أظهر التحقق من المستندات سلامتها ومطابقتها، ومبلغ الاستقطاع المقترح يقع ضمن حدود ٢٠٪.",
      },
      beneficiaryExplanation: {
        en: "Your rescheduling request is eligible for fast-track approval. Your documents are valid and the proposed monthly deduction remains within the policy limit.",
        ar: "طلبكم مؤهل للموافقة المبدئية السريعة. المستندات صحيحة ومبلغ الاستقطاع المقترح ضمن الحد المسموح به.",
      },
      officerSummary: {
        en: "Auto-approval ready. Stated income matches salary certificate, bank transfers are consistent, and all rules pass.",
        ar: "الحالة جاهزة للموافقة التلقائية. يتطابق الدخل المصرح به مع شهادة الراتب، والتحويلات البنكية متسقة، وجميع القواعد مستوفاة.",
      },
      smartCommunication: {
        en: "Your rescheduling request has received preliminary approval. Your updated payment schedule will be issued to you shortly.",
        ar: "تمت الموافقة المبدئية على طلب إعادة جدولة متأخرات القرض السكني، وسيتم إشعاركم بجدول السداد المحدّث قريباً.",
      },
      keyReasons: {
        en: ["Income matches salary certificate", "Proposed deduction is within 20% cap", "Bank transfer records are consistent"],
        ar: ["تطابق الدخل مع شهادة الراتب", "الاستقطاع المقترح يقل عن سقف ٢٠٪", "سجلات التحويل البنكي متسقة"],
      },
      nextBestAction: {
        en: "Generate the updated repayment schedule and prepare the case for officer confirmation.",
        ar: "إنشاء جدول السداد المحدث وتجهيز الحالة لاعتماد الموظف المختص.",
      },
    };
  }

  // 4. Human Review Required
  return {
    whyThisRecommendation: {
      en: "Policy conflicts or humanitarian vulnerability indicators require manual officer assessment before final rescheduling approval.",
      ar: "وجود تعارض مع السياسات أو رصد مؤشرات ضعف إنسانية يستدعي مراجعة الموظف المختص بشكل يدوي قبل الاعتماد النهائي.",
    },
    beneficiaryExplanation: {
      en: "Your rescheduling request has been referred for specialist human review due to policy limits or vulnerability factors. Our case officers will contact you shortly.",
      ar: "تم تحويل طلبكم للمراجعة البشرية من قبل الموظف المختص لمراجعة الالتزامات المالية والظروف الاستثنائية. سيتم التواصل معكم قريباً.",
    },
    officerSummary: {
      en: "Escalated for human review. Policy thresholds exceeded or policy exceptions require review. Review supporting documents.",
      ar: "تمت إحالة الملف للمراجعة البشرية لتجاوز نسب الاستقطاع أو الالتزامات، أو لتعارض السياسة. يرجى مراجعة المرفقات.",
    },
    smartCommunication: {
      en: "Your rescheduling request has been referred for specialist human review. Our case officers will contact you once the review has been completed.",
      ar: "تم تحويل طلبكم للمراجعة البشرية بسبب وجود طلب نشط وارتفاع الالتزامات المالية. سيتم التواصل معكم بعد مراجعة المختص.",
    },
    keyReasons: {
      en: ["Vulnerability factors detected", "Financial obligations exceed limits", "Manual override or policy exception check required"],
      ar: ["تم رصد ظروف معيشية استثنائية", "الالتزامات المالية تتجاوز الحدود المسموحة", "مطلوب مراجعة يدوية أو التحقق من السياسة"],
    },
    nextBestAction: {
      en: "Assign the case to a human officer for manual review.",
      ar: "إحالة الحالة إلى الموظف المختص للمراجعة اليدوية.",
    },
  };
}
