import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Helper to load env vars from .env.local or .env
function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.substring(0, firstEqual).trim();
            const value = trimmed.substring(firstEqual + 1).trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = value;
          }
        }
      });
    }
  }
}

function getFilePath(): string {
  const args = process.argv.slice(2);
  const argPath = args.find(arg => arg !== '--' && (arg.endsWith('.xlsx') || arg.endsWith('.csv')));
  if (argPath) {
    const absoluteArgPath = path.isAbsolute(argPath) ? argPath : path.join(process.cwd(), argPath);
    if (fs.existsSync(absoluteArgPath)) {
      return absoluteArgPath;
    } else {
      console.warn(`File not found at CLI path: ${argPath}`);
    }
  }

  // Check data/ folder
  const defaultDir = path.join(process.cwd(), 'data');
  if (fs.existsSync(defaultDir)) {
    const files = fs.readdirSync(defaultDir);
    const excelFile = files.find(f => f.endsWith('.xlsx') || f.endsWith('.csv'));
    if (excelFile) {
      return path.join(defaultDir, excelFile);
    }
  }

  // Check lib/data/ folder
  const libDataDir = path.join(process.cwd(), 'lib', 'data');
  if (fs.existsSync(libDataDir)) {
    const files = fs.readdirSync(libDataDir);
    const excelFile = files.find(f => f.endsWith('.xlsx') || f.endsWith('.csv'));
    if (excelFile) {
      return path.join(libDataDir, excelFile);
    }
  }

  return path.join(process.cwd(), 'lib', 'data', 'RescheduleArrears.xlsx');
}

function findColumnValue(row: any, candidates: string[]): any {
  for (const candidate of candidates) {
    const upperCandidate = candidate.toUpperCase();
    for (const key of Object.keys(row)) {
      const upperKey = key.toUpperCase().trim();
      if (upperKey === upperCandidate) {
        return row[key];
      }
    }
  }
  // Try partial match if exact match not found
  for (const candidate of candidates) {
    const upperCandidate = candidate.toUpperCase();
    for (const key of Object.keys(row)) {
      const upperKey = key.toUpperCase().trim();
      if (upperKey.includes(upperCandidate) || upperCandidate.includes(upperKey)) {
        return row[key];
      }
    }
  }
  return null;
}

function cleanNumber(val: any): number | null {
  if (val === undefined || val === null) return null;
  let s = String(val).trim();
  s = s.replace(/,/g, '');
  s = s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const num = Number(s);
  return isNaN(num) ? null : num;
}

function cleanString(val: any): string | null {
  if (val === undefined || val === null) return null;
  return String(val).trim();
}

function cleanInteger(val: any): number | null {
  const num = cleanNumber(val);
  return num !== null ? Math.round(num) : null;
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const filePath = getFilePath();

  if (!fs.existsSync(filePath)) {
    console.error(`Historical data Excel/CSV file not found at: ${filePath}`);
    process.exit(1);
  }

  const fileName = path.basename(filePath);
  console.log(`Processing historical file: ${filePath}`);

  // Parse Excel
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  if (rows.length === 0) {
    console.error("No rows found in the sheet.");
    process.exit(1);
  }

  // Delete existing records from the same file name to avoid duplicates
  console.log(`Removing previously imported records for file: ${fileName}...`);
  const { error: deleteError } = await supabase
    .from('historical_cases')
    .delete()
    .eq('raw_data->>_source_file', fileName);

  if (deleteError) {
    console.warn("Could not delete existing records. Attempting insert directly.", deleteError);
  }

  const dbRows: any[] = [];
  let parsedCount = 0;
  let loanIdCount = 0;
  let arrearsCount = 0;
  let statusCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row: any = rows[i];
    parsedCount++;

    const loanIdRaw = findColumnValue(row, ['AGREEM', 'AGREEMENT', 'LOAN', 'EEDB_LOA']);
    // Fallback: search for any value in columns that starts with "LD" (common UAE loan id)
    let loanId = cleanString(loanIdRaw);
    if (!loanId) {
      for (const k of Object.keys(row)) {
        const val = String(row[k]).trim();
        if (val.startsWith('LD')) {
          loanId = val;
          break;
        }
      }
    }

    const beneficiaryId = cleanString(findColumnValue(row, ['ID', 'APPLICAN', 'APPLICANT', 'BENEFICIARY', 'CUSTOMER']));
    const requestType = cleanString(findColumnValue(row, ['REQUEST', 'REQUEST_TYPE', 'UPDATE_INSTALLMI', 'TRANSFER_ARREA', 'SERVICE_TYPE']));
    const arrearsAmount = cleanNumber(findColumnValue(row, ['OVER_DUE_AM', 'OVERDUE_AMOUNT', 'OVER_DUE_AMOUNT', 'ARREARS_AMOUNT', 'TOTAL_ARREARS']));
    const currentInstallment = cleanNumber(findColumnValue(row, ['CURRENT', 'CURRENT_INSTALLMENT', 'INSTALLMENT', 'EMI', 'CURRENT_EMI']));
    const unpaidInstallments = cleanInteger(findColumnValue(row, ['OVER_DUE_MONT', 'OVERDUE_MONTHS', 'UNPAID_INSTALLMENTS', 'UNPAID_COUNT']));
    const approvalStatus = cleanString(findColumnValue(row, ['STATUS', 'APPROVE', 'APPROVED', 'DECISION']));
    const remarks = cleanString(findColumnValue(row, ['REMARKS', 'APPROVE JUSTIFIC', 'JUSTIFICATION', 'NOTES', 'COMMENT']));
    const month = cleanInteger(findColumnValue(row, ['START_M', 'MONTH']));
    const year = cleanInteger(findColumnValue(row, ['START_Y', 'YEAR']));
    const approvedNewEmi = cleanNumber(findColumnValue(row, ['NEW_EMI', 'CURRENTNEW_EMI']));
    const officerUser = cleanString(findColumnValue(row, ['AUTH_SIC', 'USER', 'OFFICER']));

    if (loanId) loanIdCount++;
    if (arrearsAmount !== null) arrearsCount++;
    if (approvalStatus) statusCount++;

    // Enrichment metadata for raw_data
    const enrichedRaw = {
      ...row,
      _source_file: fileName,
      _imported_at: new Date().toISOString()
    };

    const mappedData = {
      loanId,
      beneficiaryId,
      requestType,
      arrearsAmount,
      currentInstallment,
      unpaidInstallments,
      approvalStatus,
      remarks,
      month,
      year,
      approvedNewEmi,
      officerUser
    };

    dbRows.push({
      source_row_index: i,
      raw_data: enrichedRaw,
      mapped_data: mappedData,
      loan_id: loanId,
      beneficiary_id: beneficiaryId,
      request_type: requestType,
      arrears_amount: arrearsAmount,
      current_installment: currentInstallment,
      unpaid_installments: unpaidInstallments,
      approval_status: approvalStatus,
      remarks: remarks,
      month,
      year
    });
  }

  // Insert rows in batches of 100
  console.log(`Inserting ${dbRows.length} rows into historical_cases table...`);
  const batchSize = 100;
  let insertedCount = 0;

  for (let i = 0; i < dbRows.length; i += batchSize) {
    const batch = dbRows.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('historical_cases')
      .insert(batch);

    if (insertError) {
      console.error(`Error inserting batch starting at index ${i}:`, insertError);
      process.exit(1);
    }
    insertedCount += batch.length;
  }

  console.log("\nImported historical cases successfully.");
  console.log(`Source file: ${fileName}`);
  console.log(`Total rows parsed: ${parsedCount}`);
  console.log(`Rows inserted: ${insertedCount}`);
  console.log(`Rows with loan_id: ${loanIdCount}`);
  console.log(`Rows with arrears_amount: ${arrearsCount}`);
  console.log(`Rows with approval_status: ${statusCount}`);
}

main().catch(err => {
  console.error("Unhandled import exception:", err);
  process.exit(1);
});
