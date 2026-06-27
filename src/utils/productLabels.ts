const routeTitleMap: Record<string, string> = {
    dashboard: '工作台',
    permission: '账号与功能',
    'menu-management': '功能导航',
    'role-permission-management': '岗位与权限',
    'user-management': '成员管理',
    'tenant-management': '团队管理',
    'tenant-route-management': '团队功能范围',
    'temporary-access-management': '临时访问分发',
    'legacy-material-export': '旧版素材导出',
    'prior-disposal': '素材管理',
    'material-management': '素材管理',
    'document-management': '文案管理',
    'generate-materials': '内容生成',
    'fast-task': '训练',
    'video-task': '数字人生成'
}

const permissionLabelMap: Record<string, string> = {
    view: '查看',
    create: '新增',
    edit: '编辑',
    delete: '删除',
    assign: '授权'
}

const roleLabelMap: Record<string, string> = {
    平台超级管理员: '平台管理员',
    租户管理员: '团队管理员',
    业务运营: '内容运营',
    普通用户: '普通成员'
}

const statusLabelMap: Record<string, string> = {
    active: '启用',
    inactive: '停用'
}

const deployModeLabelMap: Record<string, string> = {
    cloud: '云上部署',
    internal: '内网部署',
    hybrid: '混合部署'
}

const storageProviderLabelMap: Record<string, string> = {
    tos: '连山云对象存储',
    minio: 'MinIO',
    s3: 'S3',
    local: '本地存储'
}

const dataScopeLabelMap: Record<string, string> = {
    tenant_all: '团队全部内容',
    self: '仅本人内容'
}

export function getProductRouteTitle(routeName?: string, fallbackTitle?: string) {
    if (routeName && routeTitleMap[routeName]) {
        return routeTitleMap[routeName]
    }
    return fallbackTitle || routeName || '未命名页面'
}

export function getPermissionDisplayName(permissionName: string) {
    return permissionLabelMap[permissionName] || permissionName
}

export function getRoleDisplayName(roleName: string) {
    return roleLabelMap[roleName] || roleName
}

export function getStatusDisplayName(status: string) {
    return statusLabelMap[status] || status
}

export function getDeployModeDisplayName(mode: string) {
    return deployModeLabelMap[mode] || mode
}

export function getStorageProviderDisplayName(provider: string) {
    return storageProviderLabelMap[provider] || provider
}

export function getDataScopeDisplayName(scope: string) {
    return dataScopeLabelMap[scope] || scope
}

export {
    routeTitleMap
}
