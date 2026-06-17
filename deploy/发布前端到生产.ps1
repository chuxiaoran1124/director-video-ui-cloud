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

$sourceArchivePath = New-GitReleaseArchive `
    -RepoPath $repoPath `
    -Ref $targetBranch `
    -ArchiveName 'director-video-ui-cloud-source-release.zip'

Write-Step '本地构建前端静态资源'
& npm.cmd run build --prefix $repoPath
if ($LASTEXITCODE -ne 0) {
    throw '前端本地打包失败，请先处理上面的报错。'
}

$distArchivePath = New-DirectoryZipArchive `
    -SourceDir (Join-Path $repoPath 'dist') `
    -ArchiveName 'director-video-ui-cloud-dist-release.zip'

$remoteSourceArchivePath = '/tmp/director-video-ui-cloud-source-release.zip'
$remoteDistArchivePath = '/tmp/director-video-ui-cloud-dist-release.zip'

Write-Step '上传前端源码包与静态资源包到生产机'
Send-FileToRemote -Config $config -LocalPath $sourceArchivePath -RemotePath $remoteSourceArchivePath
Send-FileToRemote -Config $config -LocalPath $distArchivePath -RemotePath $remoteDistArchivePath

Write-Step "发布前端到生产机 $($config.Server.Host)"
$rootDirText = Convert-ToBashSingleQuotedText $config.Server.RootDir
$repoDirText = Convert-ToBashSingleQuotedText $config.Frontend.RepoDir
$sourceArchivePathText = Convert-ToBashSingleQuotedText $remoteSourceArchivePath
$distArchivePathText = Convert-ToBashSingleQuotedText $remoteDistArchivePath
$remoteScript = @'
set -euo pipefail
ROOT_DIR=__ROOT_DIR__
REPO_DIR=__REPO_DIR__
SOURCE_ARCHIVE=__SOURCE_ARCHIVE__
DIST_ARCHIVE=__DIST_ARCHIVE__
WORK_ROOT="$ROOT_DIR/.release_work"
SOURCE_DIR="$WORK_ROOT/frontend_source_$(date +%Y%m%d%H%M%S)"
rm -rf "$SOURCE_DIR"
mkdir -p "$SOURCE_DIR"
unzip -oq "$SOURCE_ARCHIVE" -d "$SOURCE_DIR"
find "$SOURCE_DIR" -type f -name '*.sh' -exec sed -i 's/\r$//' {} +
chmod +x "$SOURCE_DIR"/deploy/server/*.sh
bash "$SOURCE_DIR/deploy/server/frontend-deploy.sh" "$ROOT_DIR" "$SOURCE_DIR" "$DIST_ARCHIVE"
rm -f "$SOURCE_ARCHIVE" "$DIST_ARCHIVE"
rm -rf "$WORK_ROOT"
'@
$remoteScript = $remoteScript.Replace('__ROOT_DIR__', $rootDirText)
$remoteScript = $remoteScript.Replace('__REPO_DIR__', $repoDirText)
$remoteScript = $remoteScript.Replace('__SOURCE_ARCHIVE__', $sourceArchivePathText)
$remoteScript = $remoteScript.Replace('__DIST_ARCHIVE__', $distArchivePathText)
Invoke-RemoteBashScript -SshTarget $config.Server.SshTarget -ScriptContent $remoteScript

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
