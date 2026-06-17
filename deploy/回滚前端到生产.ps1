#requires -Version 7.0

param(
    [Parameter(Mandatory = $true)]
    [string]$Ref
)

. (Join-Path $PSScriptRoot 'common.ps1')

$config = Get-ProductionDeployConfig

Write-Step "回滚前端到 $Ref"
Invoke-RemoteRepoRollbackScript `
    -Config $config `
    -RemoteRepoDir $config.Frontend.RepoDir `
    -Ref $Ref `
    -ServerScriptPath 'deploy/server/frontend-rollback.sh' `
    -ScriptArgs @($config.Server.RootDir)

Write-Step '执行前端健康检查'
Invoke-RemoteHealthScript `
    -Config $config `
    -RemoteRepoDir $config.Frontend.RepoDir `
    -ServerScriptPath 'deploy/server/health-check.sh' `
    -ScriptArgs @('frontend', $config.Server.RootDir, $config.Server.SiteUrl, $config.Server.BackendHealthUrl)

Write-Host ''
Write-Host '前端回滚完成。注意：服务器前端仓库当前可能处于 detached HEAD，后续重新发版时会自动切回分支。' -ForegroundColor Yellow
