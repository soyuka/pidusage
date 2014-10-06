"use strict";
var os = require('os')
  , fs = require('fs')
  , p = require('path')
  , exec = require('child_process').exec
  , helpers = require('./helpers')

var stats = {
  history: {},
  cpu: null, //used to store cpu informations
  proc: function(pid, options, done) {
        var self = this

    if(this.cpu !== null) {
      fs.readFile('/proc/uptime', 'utf8', function(err, uptime) {
        if(err) {
          return done(err, null)
        } else if(uptime === undefined) {
          console.error("We couldn't find uptime from /proc/uptime")
          self.cpu.uptime = os.uptime()
        } else {
          self.cpu.uptime = uptime.split(' ')[0]
        }

        return self.proc_calc(pid, options, done)
      })
    } else {
      helpers.cpu(function(err, cpu) {
        self.cpu = cpu
        return self.proc_calc(pid, options, done)
      })
    }
  },
  proc_calc: function(pid, options, done) {
    var history = this.history[pid] ? this.history[pid] : {}, cpu = this.cpu
      , self = this

    //Arguments to path.join must be strings
    fs.readFile(p.join('/proc', ''+pid, 'stat'), 'utf8', function(err, infos) {

      if(err)
        return done(err, null)

      //https://github.com/arunoda/node-usage/commit/a6ca74ecb8dd452c3c00ed2bde93294d7bb75aa8
      //preventing process space in name by removing values before last ) (pid (name) ...)
      var index = infos.lastIndexOf(')')
      infos = infos.substr(index + 2).split(' ')

      //according to http://man7.org/linux/man-pages/man5/proc.5.html (index 0 based - 2)
      //In kernels before Linux 2.6, start was expressed in jiffies. Since Linux 2.6, the value is expressed in clock ticks
      var stat = {
          utime: parseFloat(infos[11]),
          stime: parseFloat(infos[12]),
          cutime: parseFloat(infos[13]),
          cstime: parseFloat(infos[14]),
          start: parseFloat(infos[19]) / cpu.clock_tick,
          rss: parseFloat(infos[21])
      }

      //http://stackoverflow.com/questions/16726779/total-cpu-usage-of-an-application-from-proc-pid-stat/16736599#16736599

      var childrens = options.childrens ? stat.cutime + stat.cstime : 0;
      var total = 0;

      if(history.utime) {
        total = (stat.stime - history.stime) + (stat.utime - history.utime) + childrens
      } else {
        total = stat.stime + stat.utime + childrens
      }

      total = total / cpu.clock_tick

        //time elapsed between calls
        var seconds = history.uptime !== undefined ? cpu.uptime - history.uptime : stat.start - cpu.uptime
        seconds = Math.abs(seconds)
        seconds = seconds === 0 ? 0.1 : seconds //we sure can't divide through 0

      self.history[pid] = stat
      self.history[pid].seconds = seconds
      self.history[pid].uptime = cpu.uptime

      return done(null, {
        cpu: (total / seconds) * 100,
        memory: stat.rss * cpu.pagesize
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

    var cmd = 'ps -o pcpu,rss -p '

    if(os.platform() == 'aix')
      cmd = 'ps -o pcpu,rssize -p ' //this one could work on other platforms

    exec(cmd + pid, function(error, stdout, stderr) {
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
  win: function(pid, options, done) {

    if (options.extra) {
      if (!Array.isArray(options.extra)) {
        return done('options.extra must be array') ;
      }
    }

    function collectStat(history) {

      var command = ['% Processor Time', 'Working Set']
        .concat(options.extra)
        .reduce(function(val, el){
          return val + ' '+ history._counterPrefix + '\\' + el + '"' ;
        }, 'typeperf -sc 1');


      exec(command, function (error, stdout, stderr) {
        if (error) {
          console.log(error)
          return done(error)
        }

        var l = stdout.replace(/[\'\"]/g,'').split(os.EOL)
          , titles = l[1].split(',')
          , values = l[2].split(',');

        var allStats = titles.reduce(function(obj, el, index){
          el = el.substring(el.lastIndexOf('\\')+1);
          obj[el] = values[index];
          return obj;
        }, {});

        return done(null, {
          cpu: parseFloat(values[1]),
          memory: parseFloat(values[2]),
          all: allStats
        })
      });
    }

    var history = this.history[pid]
       , self = this;

    if (history) { // if we already have in cache the process name as used in typeperf tool
      collectStat(history);
    } else {
      exec('typeperf "\\Process(*)\\ID Process" -sc 1', function (error, stdout, stderr) {
        if (error) {
          console.log(error);
          return done(error)
        }
        var lines = stdout.split(os.EOL)
          , nameList = lines[1].split(',')
          , pidList = lines[2].split(',');

        var p = '"' + pid + '.';
        for (var i = 0; i < pidList.length; i++) {
          if (pidList[i].indexOf(p) === 0) {
            history = self.history[pid] = {
              _counterPrefix: nameList[i].substr(0, nameList[i].lastIndexOf('\\'))
            };
            break;
          }
        }
        collectStat(history);
      })
    }

  }
}

module.exports = stats;
