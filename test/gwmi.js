const mockery = require('mockery')
const test = require('ava')
const os = require('os')
const mockdate = require('mockdate')
const { promisify } = require('util')

const mocks = require('./helpers/_mocks')

const timeout = ms => new Promise((resolve, reject) => setTimeout(resolve, ms))

test.before(() => {
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
  })
  mockdate.set(new Date(1427749200000))
})

test.beforeEach(() => {
  mockery.resetCache()
})

test.after(() => {
  mockery.disable()
  mockdate.reset()
})

test.serial('should spawn powershell without the user profile', async t => {
  const stdout = '' +
    'Active code page: 936' + os.EOL +
    '' + os.EOL +
    '' + os.EOL +
    'CreationDate               KernelModeTime  ParentProcessId  ProcessId  UserModeTime  WorkingSetSize' + os.EOL +
    '------------               -----------     -----------     ------------   --------  --------' + os.EOL +
    '20150329221650.080654+060  153750000       0                777        8556250000    110821376'

  const calls = []

  mockery.registerMock('child_process', {
    spawn: (cmd, args, options) => {
      calls.push({ cmd, args, options })
      return mocks.spawn(stdout, '', null, 0, null)
    }
  })

  const gwmi = require('../lib/gwmi')

  await promisify(gwmi)([777], { maxage: 1000 })

  t.true(calls.length > 0, 'powershell was spawned')

  calls.forEach(call => {
    t.is(call.cmd, 'powershell.exe')
    t.true(call.args.indexOf('-NoProfile') !== -1, '-NoProfile is passed')
    t.true(call.args.indexOf('-NonInteractive') !== -1, '-NonInteractive is passed')
    t.is(call.args[call.args.length - 2], '-Command')
    t.is(
      call.args[call.args.length - 1],
      "gwmi win32_process -Filter 'ProcessId=777' | select " +
      'CreationDate,KernelModeTime,ParentProcessId,ProcessId,UserModeTime,WorkingSetSize' +
      ' | format-table'
    )
    // the command is a single argument, it must not be reassembled by a shell
    t.is(call.options.shell, undefined, 'no shell option')
    t.is(call.options.windowsVerbatimArguments, undefined, 'no verbatim arguments')
  })

  mockery.deregisterMock('child_process')
})

test('should parse gwmi output on Windows', async t => {
  const stdout = '' +
    'Active code page: 936' + os.EOL +
    '' + os.EOL +
    '' + os.EOL +
    'CreationDate               KernelModeTime  ParentProcessId  ProcessId  UserModeTime  WorkingSetSize' + os.EOL +
    '------------               -----------     -----------     ------------   --------  --------' + os.EOL +
    '20150329221650.080654+060  153750000       0                777        8556250000    110821376'

  let calls = 0

  mockery.registerMock('child_process', {
    spawn: () => {
      calls++
      return mocks.spawn(stdout, '', null, 0, null)
    }
  })

  const gwmi = require('../lib/gwmi')

  let result = await promisify(gwmi)([6456], { maxage: 1000 })
  t.deepEqual(result, {
    777: {
      cpu: 0,
      memory: 110821376,
      ppid: 0,
      pid: 777,
      ctime: (855625 + 15375),
      elapsed: 1427749200000 - new Date('2015-03-29T22:16:50.080654+0100').getTime(),
      timestamp: 1427749200000
    }
  })

  result = await promisify(gwmi)([6456], { maxage: 1000 })

  t.is(calls, 3, '2 first calls to put in history + 1')

  mockdate.set(new Date(1427749202000))

  // wait 1 second, it should do 2 calls again
  await timeout(1000)

  calls = 0
  result = await promisify(gwmi)([6456], { maxage: 1000 })

  t.is(calls, 2, '2 first calls')

  mockery.deregisterMock('child_process')
})
