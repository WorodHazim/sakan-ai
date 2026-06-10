-- ==========================================
-- SAKAN AI - Hackathon Demo Schema
-- ==========================================
-- This schema represents a simplified data structure for testing and demonstration purposes.
-- Row-level security (RLS) is disabled for now to allow seamless frontend simulator updates.

-- 1. cases Table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL DEFAULT 'demo',
    beneficiary_name TEXT,
    emirates_id TEXT,
    beneficiary_id TEXT,
    loan_id TEXT,
    monthly_income NUMERIC,
    financial_obligations NUMERIC,
    family_members INTEGER,
    current_installment NUMERIC,
    arrears_amount NUMERIC,
    unpaid_installments INTEGER,
    remaining_balance NUMERIC,
    remaining_repayment_months INTEGER,
    active_request BOOLEAN DEFAULT FALSE,
    payment_history TEXT,
    supporting_circumstance TEXT,
    recommendation TEXT,
    routing_path TEXT,
    next_owner TEXT,
    priority TEXT,
    confidence NUMERIC,
    reason_codes JSONB DEFAULT '[]'::jsonb,
    next_best_action TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT,
    document_type TEXT,
    salary_certificate_status TEXT,
    extracted_salary NUMERIC,
    bank_average_transfer NUMERIC,
    issue_date DATE,
    confidence NUMERIC,
    validation_result TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT NOT NULL,
    recommendation TEXT,
    routing_path TEXT,
    next_owner TEXT,
    priority TEXT,
    confidence NUMERIC,
    reason_codes JSONB DEFAULT '[]'::jsonb,
    decision_trace JSONB DEFAULT '[]'::jsonb,
    smart_message_ar TEXT,
    smart_message_en TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. agent_traces Table
CREATE TABLE IF NOT EXISTS agent_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT NOT NULL,
    actor TEXT,
    action TEXT,
    source TEXT,
    status TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code TEXT NOT NULL,
    channel TEXT,
    recipient TEXT,
    message TEXT,
    status TEXT,
    provider_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. historical_cases Table
CREATE TABLE IF NOT EXISTS historical_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_row_index INTEGER,
    raw_data JSONB DEFAULT '{}'::jsonb,
    mapped_data JSONB DEFAULT '{}'::jsonb,
    loan_id TEXT,
    beneficiary_id TEXT,
    request_type TEXT,
    arrears_amount NUMERIC,
    current_installment NUMERIC,
    unpaid_installments INTEGER,
    approval_status TEXT,
    remarks TEXT,
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance & quick queries
CREATE INDEX IF NOT EXISTS idx_cases_case_code ON cases(case_code);
CREATE INDEX IF NOT EXISTS idx_cases_source ON cases(source);
CREATE INDEX IF NOT EXISTS idx_agent_traces_case_code ON agent_traces(case_code);
CREATE INDEX IF NOT EXISTS idx_recommendations_case_code ON recommendations(case_code);
CREATE INDEX IF NOT EXISTS idx_historical_cases_loan_id ON historical_cases(loan_id);
