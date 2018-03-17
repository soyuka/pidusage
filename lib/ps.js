var spawn = require('child_process').spawn
var os = require('os')
var PLATFORM = os.platform()

/**
  * Get pid informations through ps command
  * @param   {Number|Number[]}  pid
  * @param   {Object}           options
  * @return  {Function}         callback(err, stat)
  * on os x skip headers with pcpu=,rss=
  * on linux it could be --no-header
  * on solaris 11 can't figure out a way to do this properly so...
  */
function ps (pid, options, done) {
  if (!Array.isArray(pid)) {
    pid = [pid]
  }

  var pids = pid.join(',')
  var doParseTime = true
  var headers

  switch (PLATFORM) {
    case 'darwin':
      headers = 'pcpu,rss,pid,etime'
      break
    case 'aix':
      headers = 'pcpu,rsssize,pid,etime'
      break
    default:
      headers = 'pcpu,rss,pid,etimes'
      doParseTime = false
  }

  var args = ['-o', headers, '-p', pids]

  var ps = spawn('ps', args)
  var error
  var stdout

  ps.on('error', function (err) {
    error = err
  })

  ps.stdout.on('data', function (d) {
    stdout += d.toString()
  })

  ps.on('close', function () {
    var date = Date.now()
    if (error) return done(error, null)

    stdout = stdout.split(os.EOL)

    var statistics = {}
    for (var i = 1; i < stdout.length; i++) {
      stdout[i] = stdout[i].trim()

      if (!stdout[i]) {
        continue
      }

      var line = stdout[i].replace(/^\s+/, '').replace(/\s\s+/g, ' ').split(' ')
      var id = parseInt(line[2], 0)
      var time = doParseTime ? parseTime(line[3]) : parseInt(line[3], 10)

      statistics[id] = {
        cpu: parseFloat(line[0].replace(',', '.')),
        memory: parseFloat(line[1]) * 1024,
        pid: id,
        time: time, // time in seconds
        start: new Date(date - time * 1000)
      }
    }

    var results = []
    for (i = 0; i < pid.length; i++) {
      if (statistics[pid[i]]) {
        results[i] = statistics[pid[i]]
        continue
      }

      results[i] = {cpu: 0, memory: 0, pid: parseInt(pid[i], 10), time: 0, start: new Date(date)}
    }

    done(null, results)
  })
}

module.exports = ps

/**
 * Get ps etime in seconds
 * POSIX format should be: [[dd-]hh:]mm:ss
 * on linux take "etimes" which is already the number of seconds since process started
 *
 * @param {String}
 * @return seconds
 */
function parseTime (time) {
  // Example output 7-22:43:36
  var tmp = time.split(':')

  if (~tmp[0].indexOf('-')) {
    var daysAndHours = tmp[0].split('-')
    tmp[0] = daysAndHours[1] // hours
    tmp.unshift(daysAndHours[0]) // days
  }

  var l = tmp.length
  var k = Math.pow(60, l - 1)
  time = 0

  for (var i = 0; i < l; i++) {
    time += k * parseInt(tmp[i], 10)
    k /= 60
  }

  return time
}
