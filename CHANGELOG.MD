### 1.0.5

Wmic: Use raw data instead of formatted this should speed up wmic

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
