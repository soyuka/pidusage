var pusage = require('../')

//stress test to compare with top or another tool
console.log(process.pid)

//classic "drop somewhere"... yeah I'm a lazy guy 
var formatBytes = function(bytes, precision) {
  var kilobyte = 1024;
  var megabyte = kilobyte * 1024;
  var gigabyte = megabyte * 1024;
  var terabyte = gigabyte * 1024;

  if ((bytes >= 0) && (bytes < kilobyte)) {
    return bytes + ' B   ';
  } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
    return (bytes / kilobyte).toFixed(precision) + ' KB  ';
  } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
    return (bytes / megabyte).toFixed(precision) + ' MB  ';
  } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
    return (bytes / gigabyte).toFixed(precision) + ' GB  ';
  } else if (bytes >= terabyte) {
    return (bytes / terabyte).toFixed(precision) + ' TB  ';
  } else {
    return bytes + ' B   ';
  }
};

var i = 0


var stress = function(cb) {

	console.log('------ START ------')

	pusage(process.pid, function(err, stat) {
		console.log('Pcpu: %s', stat.cpu)
		console.log('Mem: %s', formatBytes(stat.memory))
		
		//this is to compare with node-usage results, but it's broken on v11.12
		// require('usage').lookup(process.pid, {keepHistory: true}, function(err, stat) {	
		// 	console.log('Usage Pcpu: %s', stat.cpu)
		// 	console.log('Usage Mem: %s', formatBytes(stat.memory))
			

			console.log('------ END ------')
			if(i == 100)
				return cb(true)

			i++
			return cb(false)
		// })
	})
}

var interval = function() {
	return setTimeout(function() {
		stress(function(stop) {
			if(stop)
				process.exit()
			else
				return interval()
		})
	}, 1000)
}

setTimeout(function() {
	interval()
}, 2000)

//memory increase
var j = 0, arr = []

while(j++) {
	arr[j] = {test: 'test'}
}