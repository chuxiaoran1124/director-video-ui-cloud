module.exports = {
    rootDir: '..',
    moduleNameMapper: { '/@/(.*)$': '<rootDir>/src/$1' },
    transform: { '^.+\\.(t|j)sx?$': 'ts-jest' },
    globals: { 'ts-jest': { tsconfig: '测试文件/zip-test-tsconfig.json' } },
    setupFiles: ['<rootDir>/测试文件/zip-test-globals.cjs'],
    testMatch: ['<rootDir>/测试文件/视频ZIP低内存.test.ts', '<rootDir>/测试文件/视频下载链路.test.ts']
}
