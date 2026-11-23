param([Parameter(Mandatory=$true)][string]$Email,[Parameter(Mandatory=$true)][string]$EmployeeId)
$ErrorActionPreference='Stop'
if($Email -notmatch '^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$'){throw 'Enter a valid work email'}
$secret=Read-Host 'Choose this employee access password (14–256 characters)' -AsSecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try{
 $plain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
 $hash=$plain | node (Join-Path $PSScriptRoot '../server/hash-password.mjs')
 if($LASTEXITCODE -ne 0){throw 'Password hashing failed'}
}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer);$plain=$null}
$file=Join-Path $PSScriptRoot '../server/.env'
if(-not(Test-Path -LiteralPath $file)){Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../server/.env.example') -Destination $file}
$lines=[IO.File]::ReadAllLines($file);$users=@{}
foreach($line in $lines){if($line.StartsWith('EMPLOYEE_USERS_JSON=')){$users=ConvertFrom-Json $line.Substring(20) -AsHashtable}}
$users[$Email.Trim().ToLowerInvariant()]=@{passwordHash=$hash.Trim();employeeId=$EmployeeId}
$updated='EMPLOYEE_USERS_JSON='+($users|ConvertTo-Json -Depth 5 -Compress)
$found=$false
$lines=@($lines|ForEach-Object {if($_.StartsWith('EMPLOYEE_USERS_JSON=')){$found=$true;$updated}else{$_}})
if(-not $found){$lines+=$updated}
[IO.File]::WriteAllLines([IO.Path]::GetFullPath($file),$lines)
Write-Host 'Saved the employee mapping and salted password hash in the private server/.env file.'
