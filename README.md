pidusage
========

[![Build Status](https://travis-ci.org/soyuka/pidusage.svg?branch=master)](https://travis-ci.org/soyuka/pidusage)
[![Build status](https://ci.appveyor.com/api/projects/status/dqs82fp92pf2rey5)](https://ci.appveyor.com/project/soyuka/pidusage)

Process cpu % and memory use of a PID

Ideas from https://github.com/arunoda/node-usage/ but with no C-bindings

# API

```
var pusage = require('pidusage')

pusage.stat(process.pid, function(err, stat) {

	expect(err).to.be.null
	expect(stat).to.be.an('object')
	expect(stat).to.have.property('cpu')
	expect(stat).to.have.property('memory')

	console.log('Pcpu: %s', stat.cpu)
	console.log('Mem: %s', stat.memory) //those are bytes

})

// Unmonitor process
pusage.unmonitor(18902);
```

# What do this script do?

A check on the `os.platform` is done to determine the method to use.

### Linux
We use `/proc/{pid}/stat` in addition to the the `PAGE_SIZE` and the `CLK_TCK` direclty from `getconf()` command. Uptime comes from `proc/uptime` file because it's more accurate than the nodejs `os.uptime()`.

### On darwin, freebsd, solaris (tested on 10/11)
We use a fallback with the `ps -o pcpu,rss -p PID` command to get the same informations.

### On AIX
AIX is tricky because I have no AIX test environement, at the moment we use: `ps -o pcpu,rssize -p PID` but `/proc` results should be more accurate! If you're familiar with the AIX environment and now how to get the same results as we've got with Linux systems, please help.
[#4](https://github.com/soyuka/pidusage/issues/4)

### Windows
We use `typeperf` tool in Windows. 
First `typeperf "\Process(*)\ID Process" -sc 1` command is run to resolve `process name` from `PID`, 
afterwards information from `typeperf -sc 1 "\Process(<process name>)\% Processor Time" "\Process(<process name>)\Working Set"` commands output is parsed for stats report. 
To get reports from other(extra) counters like `Working Set - Private` (which is not available in old `Windows`-es) you can provide their name in options as follows:

```
var pusage = require('pidusage')

pusage.stat(process.pid, {extra : ['Virtual Bytes', 'Working Set - Private']}, function(err, stat) {

	console.log('Pcpu: %s', stat.cpu) //same as parseFloat(stat.all['% Processor Time'])
	console.log('Mem: %s', stat.memory) //same as parseFloat(stat.all['Working Set'])
	
	console.log('Virtual Bytes: %s', stat.all['Virtual Bytes']) 
	console.log('Working Set - Private: %s', stat.all['Working Set - Private']) 

})

```

# Licence

MIT
