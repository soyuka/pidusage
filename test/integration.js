import {spawn} from 'child_process'

import test from 'ava'

import pify from 'pify'

import m from '..'

test('should work with a single pid', async t => {
  const pid = process.pid

  const result = await pify(m)(pid)

  t.log(result)

  t.is(typeof result, 'object')

  t.is(typeof result, 'object', 'result')
  t.is(typeof result.cpu, 'number', 'cpu')
  t.false(isNaN(result.cpu), 'cpu')
  t.is(typeof result.memory, 'number', 'memory')
  t.false(isNaN(result.memory), 'memory')
  t.is(typeof result.pid, 'number', 'pid')
  t.false(isNaN(result.pid), 'pid')
  t.is(typeof result.elapsed, 'number', 'elapsed')
  t.false(isNaN(result.elapsed), 'elapsed')
  t.is(typeof result.timestamp, 'number', 'timestamp')
  t.false(isNaN(result.timestamp), 'timestamp')
})

test('should work with an array of pids', async t => {
  const child = spawn('node', ['-e', 'console.log("started"); const c = 0; while(true) {c = pow(c, c);}'])
  const ppid = process.pid
  const pid = child.pid

  await new Promise(resolve => {
    child.stdout.on('data', resolve())
  })

  const pids = [ppid, pid]
  let result
  try {
    result = await pify(m)(pids)
    child.kill()
  } catch (err) {
    child.kill()
    t.notThrows(() => { throw err })
  }

  t.log(result)

  t.is(typeof result, 'object')
  t.deepEqual(Object.keys(result), pids.map(pid => pid.toString()))

  pids.forEach(pid => {
    t.is(typeof result[pid], 'object', 'result')
    t.is(typeof result[pid].cpu, 'number', 'cpu')
    t.false(isNaN(result[pid].cpu), 'cpu')
    t.is(typeof result[pid].memory, 'number', 'memory')
    t.false(isNaN(result[pid].memory), 'memory')
    t.is(typeof result[pid].pid, 'number', 'pid')
    t.false(isNaN(result[pid].pid), 'pid')
    t.is(typeof result[pid].elapsed, 'number', 'elapsed')
    t.false(isNaN(result[pid].elapsed), 'elapsed')
    t.is(typeof result[pid].timestamp, 'number', 'timestamp')
    t.false(isNaN(result[pid].timestamp), 'timestamp')
  })
})

test('should throw an error if no pid is provided', async t => {
  const err = await t.throws(pify(m)([]))
  t.is(err.message, 'You must provide at least one pid')
})

test('should throw an error if one of the pid is invalid', async t => {
  let err = await t.throws(pify(m)(null))
  t.is(err.message, 'One of the pids provided is invalid')
  err = await t.throws(pify(m)([null]))
  t.is(err.message, 'One of the pids provided is invalid')
  err = await t.throws(pify(m)(['invalid']))
  t.is(err.message, 'One of the pids provided is invalid')
  err = await t.throws(pify(m)(-1))
  t.is(err.message, 'One of the pids provided is invalid')
  err = await t.throws(pify(m)([-1]))
  t.is(err.message, 'One of the pids provided is invalid')
})

test('should not throw an error if one of the pids does not exists', async t => {
  await t.notThrows(pify(m)([process.pid, 65535]))
  await t.notThrows(pify(m)([65535, process.pid]))
})

test('should throw an error if the pid does not exists', async t => {
  await t.throws(pify(m)([65535]))
})

test('should throw an error if the pid is too large', async t => {
  await t.throws(pify(m)(99999999))
})
