### 2.0

There is no BC break but because the code got refactored a lot and that the default retrieval method has changed we're bumping a major version.

- allow multiple pids
- remove `advanced` option
- `start` result is now a `Date` instance
- don't use `/proc` files anymore but use `ps` instead
- more tests

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
