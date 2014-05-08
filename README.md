pidusage
========

Process cpu % and memory use of a PID

Ideas from https://github.com/arunoda/node-usage/ but with no C-bindings

# API

```
var pusage = require('pidusage')

pusage(pid, function(err, results) {
	
})
```

# What do this script do?

A check on the `os.platform` is done to determine the method to use.

### Linux
We use `/proc/{pid}/stat` in addition to the the `PAGE_SIZE` and the `CLK_TCK` direclty from `getconf()` command. Uptime comes from the nodejs `os.uptime()`.

### On darwin, freebsd, solaris (tested on 10/11)
We use a fallback with the `ps -o pcpu,rss -p PID` command to get the same informations.

### Windows
Windows is really tricky, atm it uses the `wmic.exe`, feel free to share ideas on how to improve this.

# Licence

MIT
