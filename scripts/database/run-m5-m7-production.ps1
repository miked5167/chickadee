[CmdletBinding()]
param(
  [ValidateSet('Preflight', 'Apply', 'Verify')]
  [string]$Mode = 'Preflight',
  [string]$ApprovalPhrase = ''
)

$ErrorActionPreference = 'Stop'
if ($Mode -eq 'Apply' -and $ApprovalPhrase -ne 'APPROVE M5 M6 M7 PRODUCTION MIGRATIONS') {
  throw 'Exact M5-M7 production approval is required.'
}
$PasswordPointer = [IntPtr]::Zero
$SecurePassword = $null
try {
  $SecurePassword = Read-Host 'Enter the Hockey Directory PRODUCTION database password (hidden; not saved)' -AsSecureString
  $PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
  & node (Join-Path $PSScriptRoot 'm5-m7-release.mjs') ($Mode.ToLowerInvariant()) $ApprovalPhrase
  if ($LASTEXITCODE -ne 0) { throw 'Release stopped. Share the final output, never your password. Do not rerun older migration commands.' }
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($PasswordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer) }
  $SecurePassword = $null
}
