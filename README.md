# SAKAN AI

**Agentic AI for Housing Loan Arrears Rescheduling**
MOEI x Agentera x 42 Abu Dhabi Hackathon

Live Demo: https://sakan-ai-5c2u.vercel.app
GitHub Repository: https://github.com/WorodHazim/sakan-ai

---

## 1. Overview

SAKAN AI is a government-grade agentic AI workflow for assessing housing loan arrears rescheduling requests.

The solution transforms a process that normally requires multiple manual checks into an instant, structured, explainable assessment workflow.

SAKAN AI validates application completeness, checks supporting documents, analyzes financial capacity, applies policy rules such as the 20% deduction cap, recommends an appropriate route, and produces an officer-ready report with decision trace and auditability.

SAKAN AI is not a chatbot and not a simple dashboard.
It is a governed multi-agent decision workflow.

---

## 2. Problem

Housing arrears rescheduling requests require officers to manually review:

* Applicant identity and loan profile
* Salary certificate validity
* Salary mismatch against declared/profile salary
* Bank transfer consistency
* Income, obligations, family size, and arrears amount
* Active or duplicate requests
* Repayment feasibility
* 20% deduction cap compliance
* Humanitarian or exceptional circumstances
* Decision justification and audit trail

This creates delays, inconsistent review quality, and unnecessary officer workload from incomplete or correctable applications.

---

## 3. Solution

SAKAN AI standardizes the process using specialized agents that work together to:

1. Verify applicant identity
2. Guide the beneficiary while filling the application
3. Validate salary certificates and supporting documents
4. Analyze financial affordability
5. Test repayment plan feasibility
6. Apply policy and governance rules
7. Route the case to the correct outcome
8. Generate explainable reports and audit trails

The system supports multiple outcomes:

* **Recommended for Approval**
  Clean cases that are ready for officer confirmation.

* **Applicant Action Required**
  Cases with document issues or missing evidence that should be corrected before reaching the officer.

* **Humanitarian Review Required**
  Exceptional cases with supporting evidence that require human judgment.

* **Direct Beneficiary Outcome**
  Cases that fail policy rules, have active duplicate requests, or exceed allowed repayment conditions.

---

## 4. Live Demo

Production deployment:

https://sakan-ai-5c2u.vercel.app

Recommended demo flow:

1. Open the live demo link.
2. Start from the landing page.
3. Use the custom case flow or demo scenarios.
4. Upload the salary certificate test files.
5. Review the AI assessment result.
6. Open the officer report.
7. Inspect the agent orchestration trace, decision factors, and audit trail.
8. Open the officer workspace to see routed cases.

---

## 5. Key Demo Scenarios

### Scenario 1 — Clean Approval

Purpose: Demonstrates the full successful assessment workflow.

Suggested input:

* Monthly income: AED 18,000
* Monthly obligations: AED 6,000
* Family members: 5
* Current installment: AED 2,900
* Arrears amount: AED 40,000
* Remaining months: 96
* Active request: No
* Supporting circumstance: None
* Salary certificate: `01_CLEAN_APPROVAL_valid_salary_18000.pdf`

Expected outcome:

* Recommended for Approval
* Ready for Officer Confirmation
* Officer report generated
* Agent trace and audit trail available

---

### Scenario 2 — Salary Mismatch

Purpose: Demonstrates applicant correction before officer workload.

Suggested input:

* Monthly income: AED 18,000
* Salary certificate: `02_DOCUMENT_ISSUE_salary_mismatch_25000.pdf`

Expected outcome:

* Applicant Action Required
* Document Correction Required
* Salary mismatch detected
* Smart Correction Assistant shown
* Case is not routed to officer confirmation

---

### Scenario 3 — Humanitarian Case With Evidence

Purpose: Demonstrates human review trigger for exceptional cases.

Suggested input:

* Monthly income: AED 9,000
* Monthly obligations: AED 4,000
* Family members: 5
* Current installment: AED 1,500
* Arrears amount: AED 40,000
* Remaining months: 96
* Active request: No
* Supporting circumstance: Job loss
* Supporting evidence: Uploaded
* Salary certificate: `06_HUMANITARIAN_JOB_LOSS_valid_salary_9000.pdf`

Expected outcome:

* Humanitarian Review Required
* Humanitarian / Exception Review
* Requires Officer Action
* Case routed to human/specialist review

---

### Scenario 4 — Policy Cap Fail

Purpose: Demonstrates direct beneficiary outcome when policy rules fail.

Suggested input:

* Monthly income: AED 10,000
* Current installment: AED 2,900 or AED 3,000
* Salary certificate: `07_POLICY_CAP_FAIL_valid_salary_10000.pdf`

Expected outcome:

* Not Eligible Under Current Rules
* Direct Beneficiary Outcome
* Not Routed to Officer
* Reason: current installment or selected repayment plan exceeds the 20% deduction cap

---

## 6. Multi-Agent Workflow

SAKAN AI uses a chain of specialized agents.

### 1. Identity Intake Agent

Validates applicant identity through UAE PASS staging or demo fallback and links the user to the case profile.

Outputs:

* Verified identity
* Identity source
* Applicant profile
* Linked loan context

---

### 2. Smart Application Companion Agent

Guides the beneficiary while completing the form.

Checks:

* Required fields
* Missing documents
* Missing humanitarian evidence
* Application readiness

Outputs:

* Application complete
* Applicant action required
* Supporting evidence required

---

### 3. Document Intelligence Agent

Analyzes uploaded salary certificates and supporting documents.

Checks:

* Extracted salary
* Salary match
* Issue date validity
* Authorized signature
* Company letterhead
* Employee details
* Bank transfer consistency
* OCR confidence

Outputs:

* Valid document
* Salary mismatch
* Expired certificate
* Missing signature/stamp/letterhead
* Bank inconsistency
* Document correction required

---

### 4. Financial Analysis Agent

Analyzes applicant affordability and financial stress.

Inputs:

* Monthly income
* Obligations
* Family size
* Current installment
* Arrears amount

Outputs:

* Obligations ratio
* Income per family member
* Financial stress level
* 20% deduction cap

---

### 5. Interactive Repayment Plan Agent

Tests the repayment plan against policy constraints.

Checks:

* Monthly arrears deduction
* Repayment duration
* New total installment
* Deduction ratio
* 20% cap compliance

Outputs:

* Allowed plan
* Not allowed plan
* Estimated repayment duration
* Cap violation reason

---

### 6. Policy Rules Agent

Applies governance rules consistently across cases.

Checks:

* 20% deduction cap
* Active or duplicate request
* Document validity
* Humanitarian evidence requirements
* Policy eligibility

Outputs:

* Rule passed
* Rule failed
* Policy conflict
* Direct beneficiary outcome
* Human review trigger

---

### 7. Historical Case Memory Agent

Uses historical case patterns to support consistency.

Purpose:

* Compare similar cases
* Support standardized handling
* Provide consistency insight

Note:

This agent supports reasoning and consistency. It does not override approved policy rules.

---

### 8. Recommendation & Routing Agent

Combines all previous agent outputs and selects the final route.

Possible routes:

* Recommended for Approval
* Applicant Action Required
* Humanitarian Review Required
* Direct Beneficiary Outcome
* Not Eligible Under Current Rules

---

### 9. Communication & Audit Agent

Generates explanation, decision trace, audit logs, and editable communication drafts.

Outputs:

* Officer report
* Decision trace
* Reason codes
* Governance summary
* Audit trail
* AI-generated editable communication draft

---

## 7. Decision Routing Logic

SAKAN AI follows a governed routing priority.

### 1. Blocking document issue

If the case has a real document issue such as salary mismatch, expired certificate, missing signature, missing letterhead, bank inconsistency, or low OCR confidence:

Outcome:

* Applicant Action Required
* Document Correction Required

---

### 2. Humanitarian case without evidence

If a humanitarian circumstance is selected but no supporting evidence is uploaded:

Outcome:

* Applicant Action Required
* Supporting Evidence Required

---

### 3. Humanitarian case with evidence

If a humanitarian circumstance is selected and supporting evidence is uploaded, with no blocking document issue:

Outcome:

* Humanitarian Review Required
* Officer / Specialist Review

---

### 4. Clean policy-compliant case

If documents are valid and the repayment plan satisfies the 20% deduction cap:

Outcome:

* Recommended for Approval
* Ready for Officer Confirmation

---

### 5. Policy conflict or cap failure

If the case fails policy constraints such as active request, duplicate request, or repayment cap violation:

Outcome:

* Direct Beneficiary Outcome
* Not Eligible Under Current Rules
* Not Routed to Officer

---

## 8. UAE PASS Integration

SAKAN AI includes UAE PASS Staging support.

Supported identity paths:

* UAE PASS Staging login
* Demo UAE PASS fallback
* Custom test case simulation

The UAE PASS staging path is designed to avoid silent fallback. If real staging profile retrieval fails, the system does not continue as a verified staging identity. The demo fallback is separate and clearly labeled.

---

## 9. Explainability and Governance

Every recommendation includes:

* Why this recommendation was made
* Key decision factors
* Agent orchestration trace
* Input, action, output, and reason code per agent
* Document validation summary
* Financial analysis summary
* Repayment plan assessment
* Governance rule outcomes
* Audit trail
* Officer-ready report

This ensures the system remains explainable, auditable, and suitable for government review.

---

## 10. Officer Workspace

The Officer Workspace organizes cases by action type:

* Ready for Officer Confirmation
* Requires Officer Action
* Humanitarian Reviews
* Awaiting Beneficiary Action
* Direct Beneficiary Outcomes

The workspace helps officers focus on cases that truly require human attention instead of manually reviewing incomplete or clearly ineligible requests.

---

## 11. Technology Stack

Frontend:

* Next.js
* React
* TypeScript
* Tailwind CSS

Backend / APIs:

* Next.js API routes
* UAE PASS OAuth callback handling
* OCR processing endpoint
* Decision explanation endpoint

Data / Persistence:

* Supabase
* Local demo persistence for custom cases
* Historical Excel dataset planned as case memory

AI / Intelligence:

* Gemini OCR and explanation support
* Rule-based governance engine
* Multi-agent orchestration logic

Deployment:

* Vercel

---

## 12. Environment Variables

The project requires environment variables for Supabase, Gemini, and UAE PASS.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=
GEMINI_API_KEY_BACKUP=
GEMINI_OCR_MODEL_PRIMARY=gemini-2.5-flash
GEMINI_OCR_MODEL_FALLBACK=gemini-2.0-flash
LOCAL_OCR_TIMEOUT_MS=20000

UAE_PASS_CLIENT_ID=sandbox_stage
UAE_PASS_CLIENT_SECRET=sandbox_stage
UAE_PASS_AUTHORIZE_URL=https://stg-id.uaepass.ae/idshub/authorize
UAE_PASS_TOKEN_URL=https://stg-id.uaepass.ae/idshub/token
UAE_PASS_USERINFO_URL=https://stg-id.uaepass.ae/idshub/userinfo
UAE_PASS_REDIRECT_URI=https://sakan-ai-5c2u.vercel.app/api/uaepass/callback
```

Important:

* Do not commit `.env.local`.
* Production environment variables are configured in Vercel.
* Local development should use `http://localhost:3000/api/uaepass/callback`.
* Vercel deployment should use the production callback URL.

---

## 13. Running Locally

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build production version:

```bash
npm run build
```

---

## 14. Repository Notes for Judges

This project demonstrates:

* End-to-end beneficiary application flow
* Document intelligence
* Financial affordability analysis
* 20% deduction cap rule enforcement
* Interactive repayment plan testing
* Humanitarian review routing
* Officer workspace
* Decision report
* Agent trace
* Audit trail
* UAE PASS staging integration
* Vercel deployment

SAKAN AI intentionally avoids positioning the AI as the final government decision maker.

The system produces a governed recommendation and routes the case appropriately. Final approval and exceptional decisions remain under human officer responsibility.

---

## 15. Demo Safety Notes

For the smoothest demo experience:

* Use the live Vercel link: https://sakan-ai-5c2u.vercel.app
* Use the provided salary certificate test files.
* For custom cases, create and review the case in the same browser session.
* Demo cases CASE-A/B/C/D/E are stable and available for predefined testing.
* UAE PASS Staging is available, with demo fallback clearly separated for presentation continuity.

---

## 16. Impact

SAKAN AI helps transform housing arrears rescheduling from a manual multi-day process into a faster, standardized, explainable service.

Expected impact:

* Faster initial assessment
* Reduced officer workload
* Fewer incomplete cases reaching officers
* Consistent policy application
* Better beneficiary guidance
* Human review reserved for exceptional cases
* Transparent decision trace and auditability

---

## 17. Closing Statement

SAKAN AI is not a chatbot.

It is a governed multi-agent decision workflow that helps MOEI assess housing arrears rescheduling requests instantly, consistently, and transparently while preserving human accountability for final and exceptional decisions.
