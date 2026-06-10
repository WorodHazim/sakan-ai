const fs = require('fs');
let content = fs.readFileSync('app/apply/page.tsx', 'utf8');

// 1. Remove addAuditLog block
content = content.replace(/\s*\/\/\s*Add audit log for MOEI loan record linked[\s\S]*?addAuditLog\([^;]*\);/, '');

// 2. Remove addAuditLog from dependency arrays
content = content.replace(/,\s*addAuditLog\]\);/g, ']);');

// 3. Make caseData safe
// The prompt said: replace `const caseData = MOCK_CASES[selectedCaseId];` with fallback.
// Let's check if `const caseData = MOCK_CASES[selectedCaseId];` exists.
if (content.includes('const caseData = MOCK_CASES[selectedCaseId];')) {
  content = content.replace(
    'const caseData = MOCK_CASES[selectedCaseId];',
    `const fallbackCaseId = selectedCaseId && MOCK_CASES[selectedCaseId]\n    ? selectedCaseId\n    : "CASE-A";\n  const caseData = MOCK_CASES[fallbackCaseId];`
  );
}

// 4. Fix direct reads
content = content.replace(/caseData\.monthlyIncome/g, '(caseData?.monthlyIncome ?? 0)');
// Since we might have replaced `caseData?.monthlyIncome` already:
content = content.replace(/\(caseData\?\.monthlyIncome \?\? 0\)/g, 'caseData?.monthlyIncome ?? 0'); // clean up parens first
content = content.replace(/caseData\?\.monthlyIncome \?\? 0/g, 'caseData?.monthlyIncome'); // temporarily simplify
content = content.replace(/caseData\?\.monthlyIncome/g, '(caseData?.monthlyIncome ?? 0)'); // apply uniformly

// Fix useState and setDeclaredIncome specifically to match prompt precisely if needed, 
// but the regex above might turn it into useState<number>((caseData?.monthlyIncome ?? 0)) which is fine in TS.
// Wait, the prompt specifically asked to change:
// `useState<number>(caseData.monthlyIncome)` -> `useState<number>(caseData?.monthlyIncome ?? 0)`
// Let's refine the replacements for exact matches requested by user.
content = content.replace(/useState<number>\(\(caseData\?\.monthlyIncome \?\? 0\)\)/g, 'useState<number>(caseData?.monthlyIncome ?? 0)');
content = content.replace(/setDeclaredIncome\(\(caseData\?\.monthlyIncome \?\? 0\)\)/g, 'setDeclaredIncome(caseData?.monthlyIncome ?? 0)');

// For dependency array, the prompt asked to change:
// `caseData.monthlyIncome` -> `caseData?.monthlyIncome`
content = content.replace(/\[([^\]]*)\(caseData\?\.monthlyIncome \?\? 0\)([^\]]*)\]/g, '[$1caseData?.monthlyIncome$2]');

// Fix other specific reads requested:
// * caseData.beneficiaryName -> caseData?.beneficiaryName
// * caseData.emiratesId -> caseData?.emiratesId
// * caseData.financialObligations -> (caseData?.financialObligations ?? 0)
// * caseData.familyMembers -> (caseData?.familyMembers ?? 1)
// * caseData.arrearsAmount -> (caseData?.arrearsAmount ?? 0)
// * caseData.currentInstallment -> (caseData?.currentInstallment ?? 0)
// * caseData.remainingRepaymentMonths -> (caseData?.remainingRepaymentMonths ?? 1)

content = content.replace(/caseData\.beneficiaryName/g, 'caseData?.beneficiaryName');
content = content.replace(/caseData\.emiratesId/g, 'caseData?.emiratesId');
content = content.replace(/caseData\.financialObligations/g, '(caseData?.financialObligations ?? 0)');
content = content.replace(/caseData\.familyMembers/g, '(caseData?.familyMembers ?? 1)');
content = content.replace(/caseData\.arrearsAmount/g, '(caseData?.arrearsAmount ?? 0)');
content = content.replace(/caseData\.currentInstallment/g, '(caseData?.currentInstallment ?? 0)');
content = content.replace(/caseData\.remainingRepaymentMonths/g, '(caseData?.remainingRepaymentMonths ?? 1)');

fs.writeFileSync('app/apply/page.tsx', content);
console.log('Applied fixes');
