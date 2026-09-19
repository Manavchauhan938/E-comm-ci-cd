# Run AFTER: gh auth login succeeds
# Sets GitHub Actions secrets for Netlify CD

$ErrorActionPreference = 'Stop'
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
$env:Path += ";$env:APPDATA\npm"

$cfg = Get-Content "$env:APPDATA\netlify\Config\config.json" -Raw | ConvertFrom-Json
$token = $cfg.users.PSObject.Properties.Value | ForEach-Object { $_.auth.token } | Select-Object -First 1
$siteId = '7a4121b7-ed10-46fa-8269-a1f60e8e0afe'

if (-not $token) { throw 'Netlify token not found. Run: netlify login' }

gh auth status
gh secret set NETLIFY_AUTH_TOKEN --repo Manavchauhan938/E-comm-ci-cd --body $token
gh secret set NETLIFY_SITE_ID --repo Manavchauhan938/E-comm-ci-cd --body $siteId
gh secret set VITE_STRIPE_PUBLISHABLE_KEY --repo Manavchauhan938/E-comm-ci-cd --body 'pk_test_placeholder'
gh variable set VITE_API_URL --repo Manavchauhan938/E-comm-ci-cd --body 'https://ecomm-api-placeholder.onrender.com/api'

Write-Host 'GitHub secrets/variables set. Triggering workflow...'
gh workflow run 'CI/CD' --repo Manavchauhan938/E-comm-ci-cd
gh run list --repo Manavchauhan938/E-comm-ci-cd --limit 3
