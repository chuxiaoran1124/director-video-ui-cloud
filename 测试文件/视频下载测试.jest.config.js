module.exports = {
  rootDir: '..',
  testEnvironment: 'jsdom',
  moduleNameMapper: { '^/@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  globals: { 'ts-jest': { tsconfig: '<rootDir>/测试文件/视频下载测试.tsconfig.json', diagnostics: false } }
}
