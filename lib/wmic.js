var format = require('util').format
var os = require('os')
var spawn = require('child_process').spawn

function wmic (pid, options, done) {
  var prefix = 'ProcessId='
  var whereClause = ''

  if (!Array.isArray(pid)) pid = [pid]
  var curr = pid[0]
  if (!options.history[curr]) options.history[curr] = {}
  whereClause = prefix + curr
  for (var i = 1; i < pid.length; i++) {
    curr = pid[i]
    if (!options.history[curr]) options.history[curr] = {}
    whereClause += ' or ' + prefix + curr
  }

  // http://social.msdn.microsoft.com/Forums/en-US/469ec6b7-4727-4773-9dc7-6e3de40e87b8/cpu-usage-in-for-each-active-process-how-is-this-best-determined-and-implemented-in-an?forum=csharplanguage
  var args = ['PROCESS', 'where', '"' + whereClause + '"', 'get', 'ProcessId,workingsetsize,usermodetime,kernelmodetime']
  var wmic = spawn('wmic', args, {detached: true, windowsHide: true, windowsVerbatimArguments: true})
  var stdout = ''
  var stderr = ''
  var error = ''

  // Note: On Windows the returned value includes fractions of a second. Use Math.floor() to get whole seconds.
  var uptime = Math.floor(os.uptime())

  wmic.stdout.on('data', function (d) {
    stdout += d.toString()
  })

  wmic.stderr.on('data', function (d) {
    stderr += d.toString()
  })

  wmic.on('error', function (err) {
    error = '[pidusage] Command "wmic ' + args.join(' ') + '" failed with error ' + err.message
  })

  wmic.on('close', function (code) {
    var date = Date.now()
    stdout = stdout.trim()
    stderr = stderr.trim()

    if (!stdout || code !== 0) {
      error += format('%s %s Wmic errored, please open an issue on https://github.com/soyuka/pidusage with this message.%s', os.EOL, new Date().toString(), os.EOL)
      error += format('Command was "wmic %s" %s System informations: %s - release: %s %s - type %s %s', args.join(' '), os.EOL, os.EOL, os.release(), os.EOL, os.type(), os.EOL)
      stderr = error + (stderr ? format('Wmic reported the following error: %s.', stderr) : 'Wmic reported no errors (stderr empty).')
      stderr = format('%s%s%sWmic exited with code %d.', os.EOL, stderr, os.EOL, code)
      stderr = format('%s%sStdout was %s', stderr, os.EOL, stdout || 'empty')

      return done(new Error(stderr), null)
    }

    stdout = stdout.split(os.EOL)

    var statistics = []
    for (var i = 1; i < stdout.length; i++) {
      var line = stdout[i].replace(/\s\s+/g, ' ').split(' ')

      // results are in alphabetical order
      var id = parseInt(line[1], 10)
      var hst = options.history[id]
      var workingsetsize = parseFloat(line[3])
      var stats = {
        kernelmodetime: parseFloat(line[0]),
        usermodetime: parseFloat(line[2])
      }

      // process usage since last call (obscure sheeeeet don't ask)
      var total = (stats.kernelmodetime - (hst.kernelmodetime || 0) + stats.usermodetime - (hst.usermodetime || 0)) / 10000000
      // time elapsed between calls
      var seconds = hst.uptime !== undefined ? uptime - hst.uptime : 0
      var cpu = seconds > 0 ? (total / seconds) * 100 : 0

      options.history[id] = stats
      options.history[id].uptime = uptime

      statistics[i - 1] = {
        cpu: cpu,
        memory: workingsetsize,
        time: stats.usermodetime + stats.kernelmodetime, // should be ms according to https://msdn.microsoft.com/en-us/library/aa394372(v=vs.85).aspx
        start: new Date(date - (stats.usermodetime + stats.kernelmodetime)),
        pid: id
      }
    }

    done(null, statistics)
  })

  wmic.stdin.end()
}

module.exports = wmic
