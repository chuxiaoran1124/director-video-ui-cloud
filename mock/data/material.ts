import { mock, Random } from 'mockjs'

export const voices = mock({
    'list|15': [{
        'id|+1': 1,
        'name': () => Random.cname() + '的声音',
        'type': () => {
            const tags = ['甜美', '自信', '稳重', '活泼', '低沉']
            const selected = Random.shuffle(tags).slice(0, Random.integer(1, 3))
            return '|' + selected.join('|') + '|'
        },
        'source|1': [1, 2],
        'url': () => Random.url('http'),
        'createdAt': () => Random.datetime()
    }]
})

export const digitalHumans = mock({
    'list|12': [{
        'id|+1': 1,
        'name': () => Random.cname(),
        'type': () => {
            const tags = ['写实', '2D动漫', '3D超写实', '古风', '商务']
            const selected = Random.shuffle(tags).slice(0, Random.integer(1, 3))
            return '|' + selected.join('|') + '|'
        },
        'source|1': [1, 2],
        'avatar': () => Random.image('100x100', Random.color(), '#FFF', 'Digital Human'),
        'createdAt': () => Random.datetime()
    }]
})

export const relations = mock({
    'list|10': [{
        'id|+1': 1,
        'voiceId|1-15': 1,
        'digitalHumanId|1-12': 1,
        'createdAt': () => Random.datetime()
    }]
})
