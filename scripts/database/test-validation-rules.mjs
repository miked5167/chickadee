import { readFile } from 'node:fs/promises'
import {
  baselinePath,
  buildFingerprint,
  repositoryRoot,
} from './generate-schema-fingerprint.mjs'
import {
  validateActiveFileNames,
  validateM2SqlSafety,
  validateM3SqlSafety,
  validateM4SqlSafety,
  validateM3PreflightScript,
  validateM3ApplyScript,
  validateM3PostVerificationScript,
  validateProductionApplyScript,
  validateRegister,
  validateSensitiveText,
  validateSqlSafety,
} from './validate-migrations.mjs'
import path from 'node:path'

function expectFailure(label, action) {
  try {
    action()
  } catch {
    return
  }
  throw new Error(`Negative validation case was not rejected: ${label}`)
}

const baseline = await readFile(baselinePath, 'utf8')
const fingerprint = buildFingerprint(baseline)
const m2 = await readFile(path.join(repositoryRoot, 'supabase', 'migrations', '20260719000001_add_companies_updated_at_trigger.sql'), 'utf8')
const m3 = await readFile(path.join(repositoryRoot, 'supabase', 'migrations', '20260719000002_administrator_authorization_foundation.sql'), 'utf8')
const m4 = await readFile(path.join(repositoryRoot, 'supabase', 'migrations', '20260719000003_company_reviews.sql'), 'utf8')
const productionApplyScript = await readFile(path.join(repositoryRoot, 'scripts', 'database', 'run-m2-production-apply.ps1'), 'utf8')
const m3PreflightScript = await readFile(path.join(repositoryRoot, 'scripts', 'database', 'run-m3-production-preflight.ps1'), 'utf8')
const m3ApplyScript = await readFile(path.join(repositoryRoot, 'scripts', 'database', 'run-m3-production-apply.ps1'), 'utf8')
const m3PostVerificationScript = await readFile(path.join(repositoryRoot, 'scripts', 'database', 'run-m3-production-post-verification.ps1'), 'utf8')

validateM2SqlSafety(m2)
validateM3SqlSafety(m3)
validateM4SqlSafety(m4)
validateProductionApplyScript(productionApplyScript)
validateM3PreflightScript(m3PreflightScript)
validateM3ApplyScript(m3ApplyScript)
validateM3PostVerificationScript(m3PostVerificationScript)

expectFailure('duplicate migration version', () => validateActiveFileNames([
  '20260719000000_one.sql',
  '20260719000000_two.sql',
]))
expectFailure('malformed migration filename', () => validateActiveFileNames(['20260719_short.sql']))
expectFailure('legacy migration reintroduction', () => validateActiveFileNames(['20250104000000_reintroduced.sql']))
expectFailure('out-of-order active migration chain', () => validateActiveFileNames([
  '20260719000001_second.sql',
  '20260719000000_first.sql',
]))
expectFailure('destructive SQL', () => validateSqlSafety(`${baseline}\nDROP TABLE public.companies;`, fingerprint))
expectFailure('row-bearing SQL', () => validateSqlSafety(`${baseline}\nINSERT INTO public.companies DEFAULT VALUES;`, fingerprint))
expectFailure('company-targeted advisor_id', () => validateSqlSafety(`${baseline}\nCOMMENT ON COLUMN public.listing_claims.advisor_id IS 'ambiguous';`, fingerprint))
expectFailure('production-adoption command', () => validateSqlSafety(`${baseline}\nsupabase migration repair 20260719000000 --status applied`, fingerprint))
expectFailure('missing baseline guard', () => validateSqlSafety(baseline.replace('DO $guard$', 'DO $missing_guard$'), fingerprint))
expectFailure('missing production object', () => validateRegister({ ...fingerprint, policies: fingerprint.policies.slice(1) }))
expectFailure('unexpected production object', () => validateRegister({ ...fingerprint, triggers: [...fingerprint.triggers, { table: 'companies', name: 'unexpected' }] }))
expectFailure('credential-bearing URL', () => validateSensitiveText(['postgresql', '://user:password@example.invalid/database'].join(''), 'negative fixture'))
expectFailure('protected backup path', () => validateSensitiveText(['C:', 'Users', 'example', ['HockeyAdvisorDirectory', 'Backups'].join('-')].join('\\'), 'negative fixture'))
expectFailure('M2 row-bearing DML', () => validateM2SqlSafety(m2.replace('RESET statement_timeout;', 'INSERT INTO public.companies DEFAULT VALUES;\nRESET statement_timeout;')))
expectFailure('M2 unrelated schema object', () => validateM2SqlSafety(m2.replace('RESET statement_timeout;', 'CREATE TABLE public.unrelated(id integer);\nRESET statement_timeout;')))
expectFailure('M2 missing function-definition guard', () => validateM2SqlSafety(m2.replace('function_proc.prosrc', 'function_proc.missing_source_guard')))
expectFailure('M2 missing CRLF normalization guard', () => validateM2SqlSafety(m2.replace("E'\\r\\n',\n             E'\\n'", "E'\\n',\n             E'\\n'")))
expectFailure('M2 missing equivalent-trigger guard', () => validateM2SqlSafety(m2.replace('equivalent_trigger.tgfoid = timestamp_function_oid', 'equivalent_trigger.tgfoid IS NOT NULL')))
expectFailure('M2 changed trigger target', () => validateM2SqlSafety(m2.replace('BEFORE UPDATE ON public.companies', 'BEFORE UPDATE ON public.advisors')))
expectFailure('M3 administrator seed row', () => validateM3SqlSafety(m3.replace('RESET statement_timeout;', "INSERT INTO public.admin_users(user_id) VALUES ('00000000-0000-0000-0000-000000000001');\nRESET statement_timeout;")))
expectFailure('M3 email PII column', () => validateM3SqlSafety(m3.replace('user_id uuid NOT NULL,', 'user_id uuid NOT NULL,\n  email text,')))
expectFailure('M3 missing fixed search path', () => validateM3SqlSafety(m3.replace("SET search_path TO ''", '')))
expectFailure('M3 invoker-security predicate', () => validateM3SqlSafety(m3.replace('SECURITY DEFINER', 'SECURITY INVOKER')))
expectFailure('M3 unintended anonymous execution', () => validateM3SqlSafety(m3.replace('REVOKE ALL ON FUNCTION public.is_admin() FROM anon;', 'GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;')))
expectFailure('M3 authenticated grant mutation', () => validateM3SqlSafety(m3.replace('FOR SELECT\n  TO authenticated', 'FOR ALL\n  TO authenticated')))
expectFailure('M3 missing role privilege guard', () => validateM3SqlSafety(m3.replace("role.rolname = 'service_role'", "role.rolname = 'missing_role'")))
expectFailure('M3 missing owner guard', () => validateM3SqlSafety(m3.replace("current_user <> 'postgres'", 'current_user IS NULL')))
expectFailure('M3 missing M2 prerequisite', () => validateM3SqlSafety(m3.replace("companies_trigger.tgname = 'update_companies_updated_at'", 'companies_trigger.tgname IS NOT NULL')))
expectFailure('M3 wrong identity FK target', () => validateM3SqlSafety(m3.replaceAll('REFERENCES auth.users(id)', 'REFERENCES public.users(id)')))
expectFailure('M4 row-bearing seed', () => validateM4SqlSafety(m4.replace('RESET statement_timeout;', 'INSERT INTO public.reviews DEFAULT VALUES;\nRESET statement_timeout;')))
expectFailure('M4 legacy company identifier', () => validateM4SqlSafety(m4.replace('company_id uuid NOT NULL,', 'advisor_id uuid NOT NULL,')))
expectFailure('M4 reviewer impersonation policy', () => validateM4SqlSafety(m4.replace('(reviewer_user_id = auth.uid())', '(reviewer_user_id IS NOT NULL)')))
expectFailure('M4 administrator mutation policy', () => validateM4SqlSafety(m4.replace('FOR UPDATE\n  TO authenticated', 'FOR UPDATE\n  TO authenticated, service_role')))
expectFailure('M4 exposes reviewer identity', () => validateM4SqlSafety(m4.replace('GRANT SELECT (id, company_id, rating', 'GRANT SELECT (id, company_id, reviewer_user_id, rating')))
expectFailure('M4 allows company cascade deletion', () => validateM4SqlSafety(m4.replace('REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE RESTRICT', 'REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE CASCADE')))
expectFailure('M3 preflight can apply migrations', () => validateM3PreflightScript(m3PreflightScript.replace("'db', 'push', '--dry-run', '--db-url'", "'db', 'push', '--db-url'")))
expectFailure('M3 preflight skips M2 evidence validation', () => validateM3PreflightScript(m3PreflightScript.replace('--target m2', '--target current')))
expectFailure('M3 preflight omits object-absence guard', () => validateM3PreflightScript(m3PreflightScript.replaceAll("'m3_objects_absent'", "'objects_unknown'")))
expectFailure('M3 apply missing approval phrase', () => validateM3ApplyScript(m3ApplyScript.replaceAll('APPROVE M3 PRODUCTION MIGRATION', 'UNAPPROVED')))
expectFailure('M3 apply skips immediate dry run', () => validateM3ApplyScript(m3ApplyScript.replace("'db','push','--dry-run','--db-url'", "'db','push','--db-url'")))
expectFailure('M3 apply broadens migration scope', () => validateM3ApplyScript(`${m3ApplyScript}\n--include-all`))
expectFailure('M3 apply creates a first administrator', () => validateM3ApplyScript(`${m3ApplyScript}\nINSERT INTO public.admin_users DEFAULT VALUES;`))
expectFailure('M3 post-verification can reapply', () => validateM3PostVerificationScript(`${m3PostVerificationScript}\n'db','push'`))
expectFailure('M3 post-verification claims apply reinvocation', () => validateM3PostVerificationScript(m3PostVerificationScript.replaceAll('apply_reinvoked=$false', 'apply_reinvoked=$true')))
expectFailure('M3 post-verification skips current evidence validation', () => validateM3PostVerificationScript(m3PostVerificationScript.replace('--target current', '--target m2')))
expectFailure('production apply missing approval phrase', () => validateProductionApplyScript(productionApplyScript.replace('APPROVE M2 PRODUCTION MIGRATION', 'UNAPPROVED')))
expectFailure('production apply broadens migration scope', () => validateProductionApplyScript(`${productionApplyScript}\n--include-all`))
expectFailure('production apply skips current evidence validation', () => validateProductionApplyScript(productionApplyScript.replace('--target current', '--target baseline')))
expectFailure('production verification resume can reapply', () => validateProductionApplyScript(productionApplyScript.replace('apply_reinvoked = $false', 'apply_reinvoked = $true')))

process.stdout.write('Negative baseline, M2, M3, and M4 migration safety rule tests passed.\n')
