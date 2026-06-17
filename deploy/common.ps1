#requires -Version 7.0

. (Join-Path $PSScriptRoot 'production-config.ps1')

function Write-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Get-DeployBranch {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath,
        [Parameter(Mandatory = $true)]
        [string]$FallbackBranch
    )

    $branch = (git -C $RepoPath rev-parse --abbrev-ref HEAD).Trim()
    if (-not $branch -or $branch -eq 'HEAD') {
        return $FallbackBranch
    }
    return $branch
}

function Assert-TrackedChangesCommitted {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath
    )

    $trackedChanges = git -C $RepoPath status --porcelain --untracked-files=no
    if ($trackedChanges) {
        throw "仓库 $RepoPath 仍有未提交的已跟踪改动，请先 commit 再发布。"
    }

    $untrackedChanges = git -C $RepoPath ls-files --others --exclude-standard
    if ($untrackedChanges) {
        Write-Warning "仓库 $RepoPath 存在未跟踪文件，这些文件不会随 Git 发布。"
    }
}

function Assert-ExpectedOrigin {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath,
        [Parameter(Mandatory = $true)]
        [string]$ExpectedOrigin
    )

    $originUrl = (git -C $RepoPath remote get-url origin).Trim()
    if ($originUrl -ne $ExpectedOrigin) {
        throw "仓库 $RepoPath 的 origin 是 $originUrl，预期应为 $ExpectedOrigin。请先修正远端后再发布。"
    }
}

function Invoke-GitPush {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath,
        [Parameter(Mandatory = $true)]
        [string]$Branch
    )

    Write-Step "推送本地提交到 origin/$Branch"
    & git -C $RepoPath push origin $Branch
    if ($LASTEXITCODE -ne 0) {
        throw 'git push 失败，请先处理上面的报错。'
    }
}

function Get-ReleaseTempDirectory {
    param(
        [string]$FolderName = 'director-video-cloud-release'
    )

    $tempPath = Join-Path $env:TEMP $FolderName
    New-Item -ItemType Directory -Force -Path $tempPath | Out-Null
    return $tempPath
}

function New-GitReleaseArchive {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath,
        [Parameter(Mandatory = $true)]
        [string]$Ref,
        [Parameter(Mandatory = $true)]
        [string]$ArchiveName
    )

    $archivePath = Join-Path (Get-ReleaseTempDirectory) $ArchiveName
    Remove-Item $archivePath -ErrorAction SilentlyContinue
    & git -C $RepoPath archive --format=zip --output=$archivePath $Ref
    if ($LASTEXITCODE -ne 0) {
        throw "打包仓库 $RepoPath 失败。"
    }
    return $archivePath
}

function New-DirectoryZipArchive {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourceDir,
        [Parameter(Mandatory = $true)]
        [string]$ArchiveName
    )

    $archivePath = Join-Path (Get-ReleaseTempDirectory) $ArchiveName
    Remove-Item $archivePath -ErrorAction SilentlyContinue

    Push-Location $SourceDir
    try {
        & tar.exe -a -c -f $archivePath *
        if ($LASTEXITCODE -ne 0) {
            throw "目录 $SourceDir 压缩失败。"
        }
    } finally {
        Pop-Location
    }

    return $archivePath
}

function Send-FileToRemote {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Config,
        [Parameter(Mandatory = $true)]
        [string]$LocalPath,
        [Parameter(Mandatory = $true)]
        [string]$RemotePath
    )

    & scp.exe -q $LocalPath "$($Config.Server.SshTarget):$RemotePath"
    if ($LASTEXITCODE -ne 0) {
        throw "上传文件到服务器失败：$LocalPath -> $RemotePath"
    }
}

function Convert-ToBashSingleQuotedText {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ($null -eq $Value) {
        return "''"
    }

    $replacement = "'" + '"' + "'" + '"' + "'"
    return "'" + $Value.Replace("'", $replacement) + "'"
}

function Invoke-RemoteBashScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SshTarget,
        [Parameter(Mandatory = $true)]
        [string]$ScriptContent
    )

    $encodedScript = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($ScriptContent))
    $remoteCommand = "printf '%s' '$encodedScript' | base64 -d | bash"
    & ssh.exe -o StrictHostKeyChecking=no $SshTarget $remoteCommand
    if ($LASTEXITCODE -ne 0) {
        throw '远程脚本执行失败，请先处理上面的服务器报错。'
    }
}

function Invoke-RemoteRepoBranchScript {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Config,
        [Parameter(Mandatory = $true)]
        [string]$RemoteRepoDir,
        [Parameter(Mandatory = $true)]
        [string]$Branch,
        [Parameter(Mandatory = $true)]
        [string]$ServerScriptPath,
        [string[]]$ScriptArgs = @()
    )

    $bashArgs = ($ScriptArgs | ForEach-Object { Convert-ToBashSingleQuotedText $_ }) -join ' '
    $branchText = Convert-ToBashSingleQuotedText $Branch
    $repoDirText = Convert-ToBashSingleQuotedText $RemoteRepoDir
    $scriptPathText = Convert-ToBashSingleQuotedText $ServerScriptPath

    $remoteScript = @"
set -euo pipefail
cd $repoDirText
git fetch --all --tags --prune
if git show-ref --verify --quiet refs/heads/$Branch; then
  git checkout $branchText
else
  git checkout -b $branchText origin/$Branch
fi
git pull --ff-only origin $branchText
chmod +x deploy/server/*.sh
bash $scriptPathText $bashArgs
"@

    Invoke-RemoteBashScript -SshTarget $Config.Server.SshTarget -ScriptContent $remoteScript
}

function Invoke-RemoteRepoRollbackScript {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Config,
        [Parameter(Mandatory = $true)]
        [string]$RemoteRepoDir,
        [Parameter(Mandatory = $true)]
        [string]$Ref,
        [Parameter(Mandatory = $true)]
        [string]$ServerScriptPath,
        [string[]]$ScriptArgs = @()
    )

    $bashArgs = ($ScriptArgs | ForEach-Object { Convert-ToBashSingleQuotedText $_ }) -join ' '
    $repoDirText = Convert-ToBashSingleQuotedText $RemoteRepoDir
    $refText = Convert-ToBashSingleQuotedText $Ref
    $scriptPathText = Convert-ToBashSingleQuotedText $ServerScriptPath

    $remoteScript = @"
set -euo pipefail
cd $repoDirText
git fetch --all --tags --prune
git checkout $refText
chmod +x deploy/server/*.sh
bash $scriptPathText $bashArgs
"@

    Invoke-RemoteBashScript -SshTarget $Config.Server.SshTarget -ScriptContent $remoteScript
}

function Invoke-RemoteHealthScript {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Config,
        [Parameter(Mandatory = $true)]
        [string]$RemoteRepoDir,
        [Parameter(Mandatory = $true)]
        [string]$ServerScriptPath,
        [string[]]$ScriptArgs = @()
    )

    $bashArgs = ($ScriptArgs | ForEach-Object { Convert-ToBashSingleQuotedText $_ }) -join ' '
    $repoDirText = Convert-ToBashSingleQuotedText $RemoteRepoDir
    $scriptPathText = Convert-ToBashSingleQuotedText $ServerScriptPath

    $remoteScript = @"
set -euo pipefail
cd $repoDirText
chmod +x deploy/server/*.sh
bash $scriptPathText $bashArgs
"@

    Invoke-RemoteBashScript -SshTarget $Config.Server.SshTarget -ScriptContent $remoteScript
}
