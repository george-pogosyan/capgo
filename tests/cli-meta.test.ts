import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupCli, getSemver, prepareCli, runCli, setDependencies } from './cli-utils'
import { resetAndSeedAppData, resetAppData, resetAppDataStats } from './test-utils'

describe('tests CLI metadata', () => {
  const id = randomUUID()
  const APPNAME = `com.demo.app.cli_${id}`
  const semver = getSemver()
  beforeAll(async () => {
    await resetAndSeedAppData(APPNAME)
    await prepareCli(APPNAME, id)
  })
  afterAll(async () => {
    await cleanupCli(APPNAME)
    await resetAppData(APPNAME)
    await resetAppDataStats(APPNAME)
  })
  it('should test compatibility table', async () => {
    const output = await runCli(['bundle', 'upload', '-b', semver, '-c', 'production'], id, false)
    expect(output).toContain('Bundle uploaded')

    const assertCompatibilityTableColumns = async (column1: string, column2: string, column3: string, column4: string) => {
      const output = await runCli(['bundle', 'compatibility', '-c', 'production'], id, false)
      const androidPackage = output.split('\n').find(l => l.includes('│ @capacitor/android'))
      expect(androidPackage).toBeDefined()

      const columns = androidPackage!.split('│').slice(2, -1)
      expect(columns.length).toBe(4)
      expect(columns[0]).toContain(column1)
      expect(columns[1]).toContain(column2)
      expect(columns[2]).toContain(column3)
      expect(columns[3]).toContain(column4)
    }

    // await assertCompatibilityTableColumns('@capacitor/android', '7.0.0', 'None', '❌')

    // semver = getSemver()
    await runCli(['bundle', 'upload', '-b', semver, '-c', 'production', '--ignore-metadata-check'], id)

    await assertCompatibilityTableColumns('@capacitor/android', '7.0.0', '7.0.0', '✅')

    setDependencies({
      '@capacitor/android': '7.0.0',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', '7.0.0', '7.0.0', '✅')

    setDependencies({}, id, APPNAME)

    // well, the local version doesn't exist, so I expect an empty string ???
    await assertCompatibilityTableColumns('@capacitor/android', '', '7.0.0', '❌')

    // Test different version formats
    setDependencies({
      '@capacitor/android': '^7.0.0',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', '7.0.0', '7.0.0', '✅')

    setDependencies({
      '@capacitor/android': '~7.0.0',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', '7.0.0', '7.0.0', '✅')

    setDependencies({
      '@capacitor/android': '7.0.0-beta.1',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', '7.0.0-beta.1', '7.0.0', '❌')

    setDependencies({
      '@capacitor/android': 'jsr:@capacitor/android@7.0.0',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', 'jsr:@capacitor/android@7.0.0', '7.0.0', '❌')

    setDependencies({
      '@capacitor/android': 'npm:@capacitor/android@7.0.0',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', 'npm:@capacitor/android@7.0.0', '7.0.0', '❌')

    setDependencies({
      '@capacitor/android': 'file:../capacitor-android',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', 'file:../capacitor-android', '7.0.0', '❌')

    setDependencies({
      '@capacitor/android': 'github:capacitorjs/capacitor#main',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', 'github:capacitorjs/capacitor#main', '7.0.0', '❌')

    setDependencies({
      '@capacitor/android': 'git+https://github.com/capacitorjs/capacitor.git#main',
    }, id, APPNAME)
    await assertCompatibilityTableColumns('@capacitor/android', 'git+https://github.com/capacitorjs/capacitor.git#main', '7.0.0', '❌')
  })
})
