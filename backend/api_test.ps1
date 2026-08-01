<#
Exercises the Candidate Screening Platform API from PowerShell.
Equivalent to running the Postman collection.

Usage (from backend/):
    .\api_test.ps1
    .\api_test.ps1 -BaseUrl http://127.0.0.1:8001
    .\api_test.ps1 -Cleanup        # re-seed the DB afterwards

Requires the backend to be running:
    .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
#>
param(
    [string]$BaseUrl = 'http://127.0.0.1:8000',
    [string]$RecruiterEmail = 'recruiter@demo.com',
    [string]$CandidateEmail = 'candidate@demo.com',
    [string]$Password = 'password123',
    [switch]$Cleanup
)

$ErrorActionPreference = 'Stop'

function Invoke-Api {
    param(
        [string]$Method = 'GET',
        [Parameter(Mandatory)][string]$Path,
        $Body,
        [string]$Token
    )
    $headers = @{}
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }

    $params = @{ Uri = "$BaseUrl$Path"; Method = $Method; Headers = $headers }
    if ($null -ne $Body) {
        $params['Body'] = ($Body | ConvertTo-Json -Depth 5)
        $params['ContentType'] = 'application/json'
    }
    Invoke-RestMethod @params
}

function Step($label) { Write-Host "`n>> $label" -ForegroundColor Cyan }

# --- Health -------------------------------------------------------------
Step 'Health check'
Invoke-Api -Path '/' | Format-List

# --- Auth ---------------------------------------------------------------
Step 'Login as recruiter'
$recruiter = Invoke-Api -Method POST -Path '/auth/login' -Body @{ email = $RecruiterEmail; password = $Password }
$recruiterToken = $recruiter.access_token
Write-Host "   $($recruiter.user.full_name) <$($recruiter.user.email)> role=$($recruiter.user.role)"

Step 'Login as candidate'
$candidate = Invoke-Api -Method POST -Path '/auth/login' -Body @{ email = $CandidateEmail; password = $Password }
$candidateToken = $candidate.access_token
Write-Host "   $($candidate.user.full_name) <$($candidate.user.email)> role=$($candidate.user.role)"

Step 'Current user (/auth/me)'
Invoke-Api -Path '/auth/me' -Token $recruiterToken | Format-List id, email, full_name, role

# --- Jobs ---------------------------------------------------------------
Step 'List my jobs (recruiter)'
Invoke-Api -Path '/jobs?mine=true' -Token $recruiterToken |
    Format-Table id, title, status, application_count -AutoSize

Step 'List open jobs (candidate)'
Invoke-Api -Path '/jobs' -Token $candidateToken |
    Format-Table id, title, status, has_applied -AutoSize

Step 'Create a job (recruiter)'
$job = Invoke-Api -Method POST -Path '/jobs' -Token $recruiterToken -Body @{
    title           = 'Platform Engineer'
    description     = 'Own our deployment tooling and CI pipelines.'
    location        = 'Remote'
    employment_type = 'Full-time'
    salary_range    = '$110k - $140k'
}
Write-Host "   created job id=$($job.id)"

Step 'Update the job (PATCH)'
$job = Invoke-Api -Method PATCH -Path "/jobs/$($job.id)" -Token $recruiterToken -Body @{
    title        = 'Senior Platform Engineer'
    salary_range = '$130k - $165k'
}
Write-Host "   title is now '$($job.title)'"

# --- Applications -------------------------------------------------------
Step 'Apply to the job (candidate)'
$application = Invoke-Api -Method POST -Path "/jobs/$($job.id)/applications" -Token $candidateToken -Body @{
    resume_url   = 'https://example.com/resumes/my-resume.pdf'
    cover_letter = 'I would love to join the team.'
}
Write-Host "   application id=$($application.id) status=$($application.status)"

Step 'Review applications for the job (recruiter)'
Invoke-Api -Path "/jobs/$($job.id)/applications" -Token $recruiterToken |
    Format-Table id, status, @{ n = 'candidate'; e = { $_.candidate.email } } -AutoSize

Step 'Move the application to interview (recruiter)'
$application = Invoke-Api -Method PATCH -Path "/applications/$($application.id)/status" -Token $recruiterToken -Body @{ status = 'interview' }
Write-Host "   status is now '$($application.status)'"

Step 'My applications (candidate)'
Invoke-Api -Path '/applications/me' -Token $candidateToken |
    Format-Table id, status, @{ n = 'job'; e = { $_.job.title } } -AutoSize

Step 'Close the job (recruiter)'
$job = Invoke-Api -Method POST -Path "/jobs/$($job.id)/close" -Token $recruiterToken
Write-Host "   status is now '$($job.status)'"

Write-Host "`nAll requests succeeded." -ForegroundColor Green

if ($Cleanup) {
    Step 'Re-seeding the database'
    & .\.venv\Scripts\python.exe seed.py
}
