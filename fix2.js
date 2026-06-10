const fs = require('fs');
let content = fs.readFileSync('app/apply/page.tsx', 'utf8');

content = content.replace(/caseData\?\.beneficiaryName =/g, 'caseData.beneficiaryName =');
content = content.replace(/caseData\?\.emiratesId =/g, 'caseData.emiratesId =');

fs.writeFileSync('app/apply/page.tsx', content);
console.log('Fixed assignment to optional chaining');
