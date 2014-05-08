var os = require('os')
  , fs = require('fs')
  , p = require('path')
  , exec = require('child_process').exec
  , helpers = require('./helpers')

var stats = {
	history: {},
	proc: function(pid, options, done) {

		helpers.cpu(function(err, cpu) {

			//							Arguments to path.join must be strings
			fs.readFile(p.join('/proc', ''+pid, 'stat'), 'utf8', function(err, infos) {

				if(err)
					return done(err, null)

				//https://github.com/arunoda/node-usage/commit/a6ca74ecb8dd452c3c00ed2bde93294d7bb75aa8
				//preventing process space in name by removing values before last ) (pid (name) ...)
				var index = infos.lastIndexOf(')')
				infos = infos.substr(index + 2).split(' ')

				//according to http://man7.org/linux/man-pages/man5/proc.5.html (index 0 based - 2)
				var stat = {
				    utime: parseFloat(infos[12]),
				    stime: parseFloat(infos[11]),
				    cutime: parseFloat(infos[13]),
				    cstime: parseFloat(infos[14]),
				    /**
				     * In kernels before Linux 2.6, this value was
	                 * expressed in jiffies.  Since Linux 2.6, the value
	                 * is expressed in clock ticks
				     */
				    start: parseFloat(infos[19]) / cpu.clock_tick,
				    rss: parseFloat(infos[21])
				}

				//http://stackoverflow.com/questions/16726779/total-cpu-usage-of-an-application-from-proc-pid-stat/16736599#16736599
				var childrens = options.childrens ? stat.cutime + stat.cstime : 0
				  , total = (stat.stime + stat.utime + childrens) / cpu.clock_tick
			      , seconds = cpu.uptime - stat.start

				return done(null, {
					cpu: (total / seconds) * 100,
					memory: stat.rss * cpu.pagesize
				})
			})
		})

	},
	/**
	 * Get pid informations through ps command
	 * @param  {int}   pid
	 * @return  {Function} done (err, stat)
	 * on os x skip headers with pcpu=,rss=
	 * on linux it could be --no-header
	 * on solaris 11 can't figure out a way to do this properly so...
	 */
	ps: function(pid, options, done) {

		exec('ps -o pcpu,rss -p '+pid, function(error, stdout, stderr) {
			if(error) {
				return done(error)
			}

			stdout = stdout.split(os.EOL)[1]
			stdout = stdout.replace(/^\s+/, '').replace(/\s\s+/g, ' ').split(' ')

			return done(null, {
				cpu: parseFloat(stdout[0].replace(',', '.')),
				memory: parseFloat(stdout[1]) * 1024
			})
		})
	},
	/**
	 * This is really in a beta stage
	 */
	win: function(pid, options, done) {

		// var history = this.history[pid] ? this.history[pid] : {}
		//   , uptime = os.uptime()
		//   , self = this

		//http://social.msdn.microsoft.com/Forums/en-US/469ec6b7-4727-4773-9dc7-6e3de40e87b8/cpu-usage-in-for-each-active-process-how-is-this-best-determined-and-implemented-in-an?forum=csharplanguage
		exec('wmic PROCESS '+pid+' get workingsetsize,usermodetime,kernelmodetime', function(error, stdout, stderr) {
			if(error) {
				console.log(error)
				return done(error)
			}

			stdout = stdout.split(os.EOL)[1]
			stdout = stdout.replace(/\s\s+/g, ' ').split(' ')

			var stats = {
				kernelmodetime: parseFloat(stdout[0]),
				usermodetime: parseFloat(stdout[1]),
				workingsetsize: parseFloat(stdout[2])
			}

			//according to http://technet.microsoft.com/en-us/library/ee176718.aspx
			var total = (stats.usermodetime + stats.kernelmodetime) / 10000000 //seconds

		    return done(null, {
				cpu: total,
				memory: stats.workingsetsize
			})
		})
	}
}

module.exports = stats;
