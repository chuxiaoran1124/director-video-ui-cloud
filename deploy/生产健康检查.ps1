#requires -Version 7.0

param(
    [ValidateSet('frontend', 'all')]
    [string]$Component = 'frontend'
)

. (Join-Path $PSScriptRoot 'common.ps1')

$config = Get-ProductionDeployConfig

Write-Step "执行生产健康检查：$Component"
Invoke-RemoteHealthScript `
    -Config $config `
    -RemoteRepoDir $config.Frontend.RepoDir `
    -ServerScriptPath 'deploy/server/health-check.sh' `
    -ScriptArgs @($Component, $config.Server.RootDir, $config.Server.SiteUrl, $config.Server.BackendHealthUrl)

Write-Host ''
Write-Host '生产健康检查完成。' -ForegroundColor Green
