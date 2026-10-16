const base = require('./zip-test.jest.config.cjs')

module.exports = {
    ...base,
    rootDir: require('path').resolve(__dirname, '..'),
    testMatch: ['<rootDir>/测试文件/视频下载异常兜底.test.ts'],
    testTimeout: 10000,
    maxWorkers: 1,
    cache: false
}
