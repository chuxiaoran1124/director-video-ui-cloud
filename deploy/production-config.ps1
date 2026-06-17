function Get-ProductionDeployConfig {
    return @{
        Server = @{
            User = 'root'
            Host = '8.148.213.7'
            SshTarget = 'root@8.148.213.7'
            RootDir = '/home/director-video-service-cloud'
            ComposeDir = '/home/director-video-service-cloud'
            SiteUrl = 'https://qqxxkj.com'
            BackendHealthUrl = 'http://127.0.0.1:8000/api/user/current-user/'
        }
        Local = @{
            FrontendRepo = 'E:\qianduan\director-video-ui-cloud'
        }
        Frontend = @{
            RepoDir = '/home/director-video-service-cloud/director-video-ui-cloud'
            DefaultBranch = 'main'
            ExpectedOrigin = 'https://github.com/chuxiaoran1124/director-video-ui-cloud.git'
            Services = @('frontend')
        }
    }
}
