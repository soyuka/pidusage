const pusage = require('../')

// stress test to compare with top or another tool
console.log('This is my PID: %s', process.pid)

// classic "drop somewhere"... yeah I'm a lazy guy
const formatBytes = function (bytes, precision) {
  const kilobyte = 1024
  const megabyte = kilobyte * 1024
  const gigabyte = megabyte * 1024
  const terabyte = gigabyte * 1024

  if ((bytes >= 0) && (bytes < kilobyte)) {
    return bytes + ' B   '
  } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
    return (bytes / kilobyte).toFixed(precision) + ' KB  '
  } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
    return (bytes / megabyte).toFixed(precision) + ' MB  '
  } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
    return (bytes / gigabyte).toFixed(precision) + ' GB  '
  } else if (bytes >= terabyte) {
    return (bytes / terabyte).toFixed(precision) + ' TB  '
  } else {
    return bytes + ' B   '
  }
}

let i = 0
const bigMemoryLeak = []

const stress = function (cb) {
  let j = 500
  const arr = []

  while (j--) {
    arr[j] = []

    for (let k = 0; k < 1000; k++) {
      arr[j][k] = { lorem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum non odio venenatis, pretium ligula nec, fringilla ipsum. Sed a erat et sem blandit dignissim. Pellentesque sollicitudin felis eu mattis porta. Nullam nec nibh nisl. Phasellus convallis vulputate massa vitae fringilla. Etiam facilisis lectus in odio lacinia rutrum. Praesent facilisis vitae urna a suscipit. Aenean lacinia blandit lorem, et ullamcorper metus sagittis faucibus. Nam porta eros nisi, at adipiscing quam varius eu. Vivamus sed sem quis lorem varius posuere ut quis elit.' }
    }
  }

  bigMemoryLeak.push(arr)

  pusage(process.pid, function (err, stat) {
    if (err) {
      throw err
    }

    console.log('Pcpu: %s', stat.cpu)
    console.log('Mem: %s', formatBytes(stat.memory))

    if (i === 100) {
      return cb(null, true)
    } else if (stat.memory > 3e8) {
      console.log("That's enough right?")
      cb(null, true)
    }

    i++
    return cb(null, false)
  })
}

const interval = function () {
  return setTimeout(function () {
    stress(function (err, stop) {
      if (err) {
        throw err
      }

      if (stop) {
        process.exit()
      } else {
        return interval()
      }
    })
  }, 400)
}

setTimeout(function () {
  interval()
}, 2000)
