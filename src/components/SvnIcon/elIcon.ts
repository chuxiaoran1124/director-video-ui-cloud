import { h, defineComponent, Component } from 'vue'
import * as ElIcons from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'

const iconAliasMap: Record<string, keyof typeof ElIcons> = {
    home: 'House',
    setting: 'Setting',
    lock: 'Lock',
    menu: 'Menu',
    security: 'Unlock',
    user: 'User',
    apartment: 'OfficeBuilding',
    branches: 'Share',
    appstore: 'Grid',
    'video-camera': 'VideoCamera',
    thunderbolt: 'Lightning',
    'play-circle': 'VideoPlay'
}

function normalizeIconName(icon: string): keyof typeof ElIcons {
    const normalizedIcon = icon.trim().toLowerCase()
    if (iconAliasMap[normalizedIcon]) {
        return iconAliasMap[normalizedIcon]
    }

    const pascalCaseName = normalizedIcon
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join('') as keyof typeof ElIcons

    if (pascalCaseName in ElIcons) {
        return pascalCaseName
    }

    return 'QuestionFilled'
}

export function UseElIcon(icon: string, color = 'inherit', size?: number | string): Component {
    return defineComponent({
        name: 'UseElIcon',
        render() {
            const iconComponentName = normalizeIconName(icon || 'QuestionFilled')
            const iconComponent = ElIcons[iconComponentName] || ElIcons.QuestionFilled

            return h(ElIcon, {
                color,
                size: size || ''
            }, () => [
                h(iconComponent)
            ])
        }
    })
}
