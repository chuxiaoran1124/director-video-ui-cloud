module.exports = {
    rootDir: '../..',
    testEnvironment: 'jsdom',
    moduleNameMapper: { '/@/(.*)$': '<rootDir>/src/$1' },
    transform: { '^.+\\.(t|j)sx?$': 'ts-jest' },
    globals: { 'ts-jest': { tsconfig: '测试文件/zip-test-tsconfig.json' } },
    testMatch: ['<rootDir>/测试文件/standalone-audio/*.test.ts']
}
