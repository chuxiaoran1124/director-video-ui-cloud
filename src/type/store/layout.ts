export enum IMenubarStatus {
    PCE,
    PCN,
    PHE,
    PHN
}

export interface ISetting {
    theme: number
    showTags: boolean
    color: {
        primary: string
    }
    usePinyinSearch: boolean
    mode: 'horizontal' | 'vertical'
}

export interface ITenantSummary {
    id: number
    tenantCode: string
    tenantName: string
    tenantShortName?: string | null
    status: string
    deployMode: string
}

export interface IPermissionFlags {
    canManageUsers: boolean
    canManageRoles: boolean
    canManageRolePermissions: boolean
    canManageTenantRoutes: boolean
}

export interface ITenantRoleProfile {
    id: number
    role_code: string
    role_name: string
    data_scope: string
    role_level: number
    can_manage_users: boolean
    can_manage_roles: boolean
    can_manage_role_permissions: boolean
    can_manage_tenant_routes: boolean
    is_system: boolean
}

export interface IUserInfo {
    userId: number | string
    username: string
    email?: string | null
    name: string
    phone?: string | null
    status: string
    role: string
    photoUrl?: string | null
    tenantId?: number
    tenantCode?: string
    tenantRoleIds: number[]
    tenantRoleCodes: string[]
    tenantRoleNames?: string[]
    tenantRoleProfiles: ITenantRoleProfile[]
    globalRoleCodes: string[]
    globalRoleNames?: string[]
    permissionFlags: IPermissionFlags
    dataScope: string
    isPlatformSuperAdmin: boolean
}

export interface IMenubar {
    status: IMenubarStatus
    menuList: Array<IMenubarList>
    isPhone: boolean
}

export interface ITags {
    tagsList: Array<ITagsList>
    cachedViews: string[]
    isNocacheView: boolean
}

export interface IStatus {
    isLoading: boolean
    ACCESS_TOKEN: string
    REFRESH_TOKEN: string
    isUserLoaded: boolean
    isRoutesLoaded: boolean
    isLoggingOut: boolean
}

export interface ILayout {
    menubar: IMenubar
    userInfo: IUserInfo
    tags: ITags
    setting: ISetting
    status: IStatus
    currentTenant: ITenantSummary | null
    tenantList: ITenantSummary[]
    dynamicRouteNames: string[]
}

export interface IRouteMeta {
    icon: string
    title: string
    permission?: string[]
    activeMenu?: string
    noCache?: boolean
    hidden?: boolean
    alwaysShow?: boolean
    routeScope?: string
}

export interface IMenubarList {
    parentId?: number | string
    id?: number | string
    name: string
    path: string
    redirect?: string | { name: string }
    meta: IRouteMeta
    component: (() => Promise<typeof import('*.vue')>) | string
    children?: Array<IMenubarList>
}

export interface ITagsList {
    name: string
    title: string
    path: string
    isActive: boolean
}
