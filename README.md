pidusage
========

[![Build Status](https://travis-ci.org/soyuka/pidusage.svg?branch=master)](https://travis-ci.org/soyuka/pidusage)
[![Build status](https://ci.appveyor.com/api/projects/status/dqs82fp92pf2rey5)](https://ci.appveyor.com/project/soyuka/pidusage)

Cross-platform process cpu % and memory usage of a PID

Ideas from https://github.com/arunoda/node-usage/ but with no C-bindings

Please note that if you need to check a nodejs script process cpu usage, you can use [`process.cpuUsage`](https://nodejs.org/api/process.html#process_process_cpuusage_previousvalue) since node v6.1.0. This script remain useful when you have no control over the remote script, or if the process is not a nodejs process.

## API

```javascript
var pusage = require('pidusage')

// Compute statistics every second:

setInterval(function () {
    pusage.stat(process.pid, function (err, stat) {

	expect(err).to.be.null
	expect(stat).to.be.an('object')
	expect(stat).to.have.property('cpu')
	expect(stat).to.have.property('memory')

	console.log('Pcpu: %s', stat.cpu)
	console.log('Mem: %s', stat.memory) //those are bytes

    })
}, 1000)

```

When you're done with the given `pid`, you may want to clear `pidusage` history (it only keeps the last stat values):

```
pusage.unmonitor(process.pid);
```

The `stat` object will contain the following:

```
- `cpu` cpu percent
- `memory` memory bytes
- `time` elapsed time since started
- `start` Date when process was started
```

Pidusage also supports an array of pids:

```javascript
var pusage = require('pidusage')

pusage.stat([0,1,2], function (err, stats) {
  // stats is an array of statistics objects
})
```

## How it works

A check on the `os.platform` is done to determine the method to use.

### Linux (aix, darwin, freebsd, solaris (tested on 10/11))
Use the `ps -o pcpu,rss -p PID` command to get the same informations.

Memory usage will also display the RSS only, process cpu usage might differ from a distribution to another. Please check the correspoding `man ps` for more insights on the subject.

[#4](https://github.com/soyuka/pidusage/issues/4)

### Windows
Windows uses the `wmic.exe`: `wmic PROCESS {PID} get workingsetsize,usermodetime,kernelmodetime`.

The memory usage here is what windows calls the "Working Set":

> Maximum number of bytes in the working set of this process at any point in time. The working set is the set of memory pages touched recently by the threads in the process. If free memory in the computer is above a threshold, pages are left in the working set of a process even if they are not in use. When free memory falls below a threshold, pages are trimmed from working sets. If they are needed, they are then soft-faulted back into the working set before they leave main memory.

The CPU usage is computed the same as it is on linux systems. We have the `kernelmodetime` and the `usermodetime` processor use. Every time `pidusage.stat` is called, we can calculate the processor usage according to the time spent between calls (uses `os.uptime()` internally).

Note that before we used `wmic path Win32_PerfFormattedData_PerfProc_Process WHERE IDProcess=` (which is slow as hell) and `Win32_PerfRawData_PerfProc_Process` (which api breaks on Windows 10 and Windows server 2012). Not every Windows bugged but just some of those. However, the `wmic PROCESS` call is faster.

#### pidusage-tree

If you want to compute a pidusage tree take a look at [pidusage-tree](https://github.com/soyuka/pidusage-tree).

#### pidusage-promise

Need promise? Use [pidusage-promise](https://github.com/soyuka/pidusage-promise)!

#### Legacy

Prior 2.0.0, on linux procfiles where used. It has been removed due to performance issues when reading files. Indeed, `ps` is faster.

Benchmark:

```
Benching 246 process
NANOBENCH version 2
> node test/bench.js

# procfile
ok ~70 ms (0 s + 70322060 ns)

# ps
ok ~9.99 ms (0 s + 9991419 ns)

all benchmarks completed
ok ~80 ms (0 s + 80313479 ns)
```

## Licence

MIT
