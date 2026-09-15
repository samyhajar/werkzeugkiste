param(
  [switch]$ApplyTemplates,
  [switch]$ApplyGroupRateLimit
)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class SupabaseCliCredential {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  private struct Credential {
    public uint Flags, Type;
    public string TargetName, Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize;
    public IntPtr CredentialBlob;
    public uint Persist, AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias, UserName;
  }
  [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)]
  private static extern bool CredRead(string target, uint type, uint flags, out IntPtr credential);
  [DllImport("advapi32.dll")] private static extern void CredFree(IntPtr credential);
  public static string Read() {
    foreach (var target in new[] {"Supabase CLI:supabase", "Supabase CLI:access-token"}) {
      IntPtr pointer;
      if (!CredRead(target, 1, 0, out pointer)) continue;
      try {
        var credential = (Credential)Marshal.PtrToStructure(pointer, typeof(Credential));
        var bytes = new byte[credential.CredentialBlobSize];
        Marshal.Copy(credential.CredentialBlob, bytes, 0, bytes.Length);
        return Encoding.UTF8.GetString(bytes);
      } finally { CredFree(pointer); }
    }
    throw new Exception("Supabase CLI login unavailable.");
  }
}
'@
$registrationToken = [SupabaseCliCredential]::Read()
$registrationHeaders = @{ Authorization = "Bearer $registrationToken" }
$registrationUri = 'https://api.supabase.com/v1/projects/bdjluwlwxqdgkulkjozj/config/auth'
try {
  $config = Invoke-RestMethod -Uri $registrationUri -Headers $registrationHeaders
  if ($ApplyTemplates) {
    if ($config.mailer_otp_exp -ne 86400) { throw 'Expected 24-hour expiry; review configuration before applying.' }
    # Get-Content adds provider metadata that Windows PowerShell serializes as an
    # object. Concat creates a plain System.String for the Management API payload.
    $template = [string]::Concat((Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot '../supabase/templates/confirmation.html')))
    $patch = @{
      mailer_templates_confirmation_content = $template
      mailer_subjects_confirmation = 'Werkzeugkiste: Neuesten Link zur Registrierung verwenden'
    } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri $registrationUri -Headers $registrationHeaders -Method Patch -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($patch))
    $config = Invoke-RestMethod -Uri $registrationUri -Headers $registrationHeaders
    if ($config.mailer_templates_confirmation_content -ne $template) { throw 'Remote template verification failed.' }
  }
  if ($ApplyGroupRateLimit) {
    $groupRateLimit = 100
    if ($config.smtp_host -ne 'rw1537.webhosting.systems') { throw 'SMTP host changed; review provider capacity before applying.' }
    if ($config.rate_limit_email_sent -lt $groupRateLimit) {
      $patch = @{ rate_limit_email_sent = $groupRateLimit } | ConvertTo-Json
      $null = Invoke-RestMethod -Uri $registrationUri -Headers $registrationHeaders -Method Patch -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($patch))
      $config = Invoke-RestMethod -Uri $registrationUri -Headers $registrationHeaders
    }
    if ($config.rate_limit_email_sent -ne $groupRateLimit) { throw 'Remote group email rate-limit verification failed.' }
  }
  $config | Select-Object site_url, mailer_otp_exp, smtp_host, smtp_port, smtp_admin_email, smtp_sender_name, smtp_max_frequency, rate_limit_email_sent, rate_limit_signup, mailer_autoconfirm, mailer_templates_confirmation_content, mailer_templates_recovery_content | ConvertTo-Json -Depth 4
} finally {
  $registrationToken = $null
  $registrationHeaders = $null
}
