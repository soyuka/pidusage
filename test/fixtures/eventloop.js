var pidusage = require('../../')

pidusage(process.pid, {maxage: 1500}, function (err, stat) {
  if (err) {
    throw err
  }

  console.log('Got stats', stat)
  // clean the event loop right away
  if (process.argv[2] === '1') {
    pidusage.clear()
  }
})

console.log('My pid is ' + process.pid)
