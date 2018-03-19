### 2.0

- allow multiple pids
- remove `advanced` option
- don't use `/proc` files anymore but use `ps` instead
- more tests
- API change no more `stat` method, module exports a single function
- no more `unmonitor` method, this is handed internally
- the default call now returns more data:

```
{
  cpu: 10.0,            // percentage (it may happen to be greater than 100%)
  memory: 357306368,    // bytes
  ppid: 312,            // PPID
  pid: 727,             // PID
  ctime: 867000,        // ms user + system time
  elapsed: 6650000,     // ms since the start of the process
  timestamp: 864000000  // ms since epoch
}
```

### 1.2.0

Introduce `advanced` option to get time, and start

### 1.1.0

Windows: (wmic) goes back to the first version of wmic, naming `wmic process {pid} get workingsetsize,usermodetime,kernelmodetime`. CPU usage % is computed on the flight, per pid.

### 1.0.5

Windows: (wmic) Use raw data instead of formatted this should speed up wmic

### 0.1.0
API changes:
```
require('pidusage').stat(pid, fn)
```
instead of:
```
require('pidusage')(pid, fn)
```
Adds a `unmonitor` method to clear process history
