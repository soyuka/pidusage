const { spawn } = require('child_process')
const test = require('ava')
const tspan = require('time-span')

const m = require('..')

async function create (pidno) {
  const code = `
    console.log(process.pid);
    setInterval(function(){}, 1000); // Does nothing, but prevents exit
  `
  let count = 0
  const childs = []

  return new Promise((resolve, reject) => {
    for (let i = 0; i < pidno; i++) {
      const child = spawn('node', ['-e', code], { windowsHide: true })
      childs.push(child)

      child.stdout.on('data', function (childs) {
        if (++count === pidno) resolve(childs)
      }.bind(this, childs))
      child.stderr.on('data', function (data) {
        reject(data.toString())
      })
      child.on('error', reject)
    }
  })
}

async function destroy (childs) {
  childs.forEach(child => child.kill())
}

async function execute (childs, pidno, times, options = {}) {
  const pids = childs.map(child => child.pid).slice(0, pidno)

  const end = tspan()
  try {
    for (let i = 0; i < times; i++) {
      await m(pids, options)
    }
    const time = end()
    return Promise.resolve(time)
  } catch (err) {
    end()
    return Promise.reject(err)
  }
}

test.serial('should execute the benchmark', async t => {
  const childs = await create(100)

  let time = await execute(childs, 1, 100, { usePs: true })
  t.log(`1 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 1, 100)
  t.log(`(procfile) 1 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 2, 100, { usePs: true })
  t.log(`2 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 2, 100)
  t.log(`(procfile) 2 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 5, 100, { usePs: true })
  t.log(`5 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 5, 100)
  t.log(`(procfile) 5 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 10, 100, { usePs: true })
  t.log(`10 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 10, 100)
  t.log(`(procfile) 10 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 25, 100, { usePs: true })
  t.log(`25 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 25, 100)
  t.log(`(procfile) 25 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 50, 100, { usePs: true })
  t.log(`50 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 50, 100)
  t.log(`(procfile) 50 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 100, 100, { usePs: true })
  t.log(`100 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  time = await execute(childs, 100, 100)
  t.log(`(procfile) 100 pid 100 times done in ${time.toFixed(3)} ms (${(1000 * 100 / time).toFixed(3)} op/s)`)

  await destroy(childs)

  t.pass()
})
