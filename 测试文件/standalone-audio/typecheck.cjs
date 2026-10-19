// Check the owned TypeScript and compiled Vue scripts while reporting (not modifying) baseline errors separately.
const ts = require('typescript')
const { parse, compileScript } = require('@vue/compiler-sfc')
const fs = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '../..')
const virtual = new Map()
for (const relative of ['src/components/StandaloneAudioTools/index.vue', 'src/components/StandaloneAudioTools/VoicePicker.vue', 'src/views/PriorDisposal/VoiceTraining.vue', 'src/views/GenerateMaterials/AudioDubbing.vue']) {
    const file = path.join(root, relative)
    const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file })
    virtual.set(file + '.ts', compileScript(descriptor, { id: 'audio-typecheck' }).content)
}
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile).config
delete config.compilerOptions.ignoreDeprecations
config.compilerOptions.skipLibCheck = true
config.compilerOptions.noEmit = true
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root)
const host = ts.createCompilerHost(parsed.options)
const originalRead = host.readFile
const originalExists = host.fileExists
const originalSource = host.getSourceFile
host.readFile = file => virtual.get(file) || originalRead(file)
host.fileExists = file => virtual.has(file) || originalExists(file)
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => virtual.has(file)
    ? ts.createSourceFile(file, virtual.get(file), languageVersion, true)
    : originalSource(file, languageVersion, onError, shouldCreateNewSourceFile)
const program = ts.createProgram([...parsed.fileNames, ...virtual.keys()], parsed.options, host)
const diagnostics = ts.getPreEmitDiagnostics(program)
const owned = diagnostics.filter(item => item.file && /StandaloneAudioTools|standaloneAudio\.ts|standalone-audio|downloadSafety|downloadInteraction|videoZipWriter|utils[\\/]download\.ts/.test(item.file.fileName))
if (owned.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(owned, { getCurrentDirectory: () => root, getCanonicalFileName: file => file, getNewLine: () => '\n' }))
    process.exitCode = 1
} else console.log(`PASS owned TypeScript and four Vue scripts; ${diagnostics.length} unrelated baseline diagnostics remain`)
