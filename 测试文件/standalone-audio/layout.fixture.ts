import { reactive } from 'vue'
export const layout = reactive({
    getUserInfo: { userId: 7, tenantId: 1, isPlatformSuperAdmin: false },
    currentTenant: { id: 1 },
    getStatus: { ACCESS_TOKEN: 'fixture-only' },
    forceLogout: async () => {}, refreshSession: async () => {}
})
export const useLayoutStore = () => layout
