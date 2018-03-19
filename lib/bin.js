'use strict'

var os = require('os')
var spawn = require('child_process').spawn
var format = require('util').format

/**
  * Spawn a binary and read its stdout.
  * @param  {String} cmd
  * @param  {String[]} args
  * @param  {Function} done(err, stdout)
  */
function run (cmd, args, options, done) {
  if (typeof options === 'function') {
    done = options
    options = undefined
  }

  var executed = false
  var ch = spawn(cmd, args, options)
  var stdout = ''
  var stderr = ''

  ch.stdout.on('data', function (d) {
    stdout += d.toString()
  })

  ch.stderr.on('data', function (d) {
    stderr += d.toString()
  })

  ch.on('error', function (err) {
    if (executed) return
    executed = true
    done(new Error(err))
  })

  ch.on('close', function (code, signal) {
    if (executed) return
    executed = true

    if (!stdout || stderr || code !== 0 || signal !== null) {
      var error = format('[pidusage] Command: "%s %s" failed.%s', cmd, args.join(' '), os.EOL)
      error += format('[pidusage] System informations: type %s - release %s%s', os.type(), os.release(), os.EOL)
      error += format('[pidusage] stdout: %s%s', stdout, os.EOL)
      error += format('[pidusage] stderr: %s%s', stderr, os.EOL)
      error += format('[pidusage] code: %s%s', code, os.EOL)
      error += format('[pidusage] signal: %s%s', signal, os.EOL)
      error += format('[pidusage] Please open an issue on https://github.com/soyuka/pidusage with this message.%s', os.EOL)

      return done(new Error(error))
    }
    done(null, stdout)
  })
}

module.exports = run
