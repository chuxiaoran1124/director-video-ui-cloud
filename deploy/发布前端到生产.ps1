#requires -Version 7.0

param(
    [string]$Branch,
    [switch]$SkipPush,
    [switch]$SkipHealthCheck
)

. (Join-Path $PSScriptRoot 'common.ps1')

$config = Get-ProductionDeployConfig
$repoPath = $config.Local.FrontendRepo
$targetBranch = if ($Branch) { $Branch } else { Get-DeployBranch -RepoPath $repoPath -FallbackBranch $config.Frontend.DefaultBranch }

Write-Step '检查前端仓库状态'
Assert-TrackedChangesCommitted -RepoPath $repoPath
Assert-ExpectedOrigin -RepoPath $repoPath -ExpectedOrigin $config.Frontend.ExpectedOrigin

if (-not $SkipPush) {
    Invoke-GitPush -RepoPath $repoPath -Branch $targetBranch
}

Write-Step "发布前端到生产机 $($config.Server.Host)"
Invoke-RemoteRepoBranchScript `
    -Config $config `
    -RemoteRepoDir $config.Frontend.RepoDir `
    -Branch $targetBranch `
    -ServerScriptPath 'deploy/server/frontend-deploy.sh' `
    -ScriptArgs @($config.Server.RootDir)

if (-not $SkipHealthCheck) {
    Write-Step '执行前端健康检查'
    Invoke-RemoteHealthScript `
        -Config $config `
        -RemoteRepoDir $config.Frontend.RepoDir `
        -ServerScriptPath 'deploy/server/health-check.sh' `
        -ScriptArgs @('frontend', $config.Server.RootDir, $config.Server.SiteUrl, $config.Server.BackendHealthUrl)
}

Write-Host ''
Write-Host "前端发布完成：branch=$targetBranch" -ForegroundColor Green
