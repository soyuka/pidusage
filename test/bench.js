var bench = require('nanobench')
var fs = require('fs')
var history = {}

function clear () {
  for (var i in history) {
    delete history[i]
  }
}

function getProcessList (cb) {
  fs.readdir('/proc', function (err, list) {
    if (err) throw err

    cb(list.filter(function (v) {
      return !isNaN(parseInt(v))
    }))
  })
}

getProcessList(function (list) {
  console.log('Benching %d process', list.length)

  bench('procfile', function (b) {
    var procfile = require('../lib/procfile')
    b.start()

    procfile(list, {history: history}, function (err, data) {
      if (err) throw err

      b.end()
      clear()
    })
  })

  bench('ps', function (b) {
    var ps = require('../lib/ps')
    b.start()

    ps(list, {history: history}, function (err, data) {
      if (err) throw err

      b.end()
      clear()
    })
  })
})
