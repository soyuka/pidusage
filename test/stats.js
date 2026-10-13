const mockery = require('mockery')
const test = require('ava')
const os = require('os')
const fs = require('fs')
const path = require('path')

const wmicPath = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'wbem', 'WMIC.exe')

function load (wmicExists) {
  const wmicChecks = []

  mockery.registerMock('os', { ...os, platform: () => 'win32' })
  mockery.registerMock('fs', {
    ...fs,
    existsSync: (p) => {
      if (p === wmicPath) {
        wmicChecks.push(p)
        return wmicExists
      }
      return fs.existsSync(p)
    }
  })
  mockery.registerMock('./wmic', (pids, options, done) => done(null, { [pids[0]]: { marker: 'wmic' } }))
  mockery.registerMock('./gwmi', (pids, options, done) => done(null, { [pids[0]]: { marker: 'gwmi' } }))

  const get = require('../lib/stats')
  const call = (options = {}) => new Promise((resolve, reject) => {
    get(1, options, (err, stat) => err ? reject(err) : resolve(stat))
  })

  return { call, wmicChecks }
}

test.beforeEach(() => {
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
  })
})

test.afterEach.always(() => {
  mockery.deregisterAll()
  mockery.disable()
})

test.serial('should use wmic when WMIC.exe exists', async t => {
  const { call } = load(true)
  t.is((await call()).marker, 'wmic')
})

test.serial('should use gwmi when WMIC.exe is missing', async t => {
  const { call } = load(false)
  t.is((await call()).marker, 'gwmi')
})

test.serial('should use gwmi without detection when useGwmi is true', async t => {
  const { call, wmicChecks } = load(true)
  t.is((await call({ useGwmi: true })).marker, 'gwmi')
  t.is(wmicChecks.length, 0)
})

test.serial('should detect wmic only once', async t => {
  const { call, wmicChecks } = load(true)
  await call()
  await call()
  t.is(wmicChecks.length, 1)
})
