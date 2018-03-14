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
  if (Array.isArray(pid)) {
    pid = pid.join(',')
  }

  var args = ['-o', 'pcpu,rss,pid,time', '-p', pid]

  if (PLATFORM === 'aix') {
    args = ['-o', 'pcpu,rsssize,pid,time', '-p', pid]
  }

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

    var statistics = []
    for (var i = 1; i < stdout.length; i++) {
      stdout[i] = stdout[i].trim()

      if (!stdout[i]) {
        continue
      }

      var line = stdout[i].replace(/^\s+/, '').replace(/\s\s+/g, ' ').split(' ')
      var time = 0

      // Example output 7-22:43:36
      var tmp = line[3].split(':')
      var days = 0

      if (~tmp[0].indexOf('-')) {
        var daysAndHours = tmp[0].split('-')
        tmp[0] = daysAndHours[1]
        days = daysAndHours[0]
      }

      time = (days * 86400 + tmp[0] * 3600 + tmp[1] * 60 + tmp[2]) * 1000

      statistics[i - 1] = {
        cpu: parseFloat(line[0].replace(',', '.')),
        memory: parseFloat(line[1]) * 1024,
        pid: parseInt(line[2], 0),
        time: time, // time in ms
        start: new Date(date - time)
      }
    }

    done(null, statistics)
  })
}

module.exports = ps
