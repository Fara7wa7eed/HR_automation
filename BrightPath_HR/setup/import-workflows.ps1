param([string]$Container='deploy-n8n-1')
$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$file=Join-Path $projectRoot 'workflows/all-workflows.json'
$data=[IO.File]::ReadAllText($file)
$data | docker exec -i $Container node -e 'let data="";process.stdin.on("data",part=>data+=part).on("end",()=>{JSON.parse(data);require("fs").writeFileSync("/tmp/brightpath-import.json",data)})'
if($LASTEXITCODE -ne 0){throw 'Could not copy workflow package'}
docker exec $Container n8n import:workflow --input=/tmp/brightpath-import.json
if($LASTEXITCODE -ne 0){throw 'Workflow import failed'}
Write-Host 'Imported as inactive drafts. Review configuration and tests before activation.'
