const EventEmitter = require('events')
const { PassThrough, Readable } = require('stream')

module.exports = {
  spawn: (stdout, stderr, error, code, signal) => {
    const ee = new EventEmitter()

    ee.stdout = new PassThrough()
    ee.stderr = new PassThrough()

    Readable.from([stderr]).pipe(ee.stderr)
    Readable.from([stdout]).pipe(ee.stdout)

    if (error) {
      ee.emit('error', error)
    } else if (!stderr) {
      ee.stdout.on('end', () => ee.emit('close', code, signal))
    } else {
      ee.stderr.on('end', () => ee.emit('close', code, signal))
    }
    return ee
  }
}
