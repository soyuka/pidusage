# pidusage

[![Mac/Linux Build Status](https://img.shields.io/travis/soyuka/pidusage/master.svg?label=MacOS%20%26%20Linux)](https://travis-ci.org/soyuka/pidusage)
[![Windows Build status](https://img.shields.io/appveyor/ci/soyuka/pidusage/master.svg?label=Windows)](https://ci.appveyor.com/project/soyuka/pidusage)
[![npm version](https://img.shields.io/npm/v/pidusage.svg)](https://www.npmjs.com/package/pidusage)
[![license](https://img.shields.io/github/license/soyuka/pidusage.svg)](https://github.com/soyuka/pidusage/tree/master/license)

Cross-platform process cpu % and memory usage of a PID.

## Synopsis

Ideas from https://github.com/arunoda/node-usage but with no C-bindings.

Please note that if you need to check a Node.JS script process cpu and memory usage, you can use [`process.cpuUsage`][node:cpuUsage] and [`process.memoryUsage`][node:memUsage] since node v6.1.0. This script remain useful when you have no control over the remote script, or if the process is not a Node.JS process.


## Usage

```js
var pusage = require('pidusage')

// Compute statistics every second:
setInterval(function () {
  pusage(process.pid, function (err, stat) {
    console.log(stat)
    // => {
    //   cpu: 10.0,            // percentage (it may happen to be greater than 100%)
    //   memory: 357306368,    // bytes
    //   ppid: 312,            // PPID
    //   pid: 727,             // PID
    //   ctime: 867000,        // ms user + system time
    //   elapsed: 6650000,     // ms since the start of the process
    //   timestamp: 864000000  // ms since epoch
    // }
  })
}, 1000)

// It supports also multiple pids
pusage([727, 1234], function (err, stat) {
  console.log(stat)
  // => {
  //   727: {
  //     cpu: 10.0,            // percentage
  //     memory: 357306368,    // bytes
  //     ppid: 312,            // PPID
  //     pid: 727,             // PID
  //     ctime: 867000,        // ms user + system time
  //     elapsed: 6650000,     // ms since the start of the process
  //     timestamp: 864000000  // ms since epoch
  //   },
  //   1234: {
  //     cpu: 0.1,             // percentage
  //     memory: 3846144,      // bytes
  //     ppid: 727,            // PPID
  //     pid: 1234,            // PID
  //     ctime: 0,             // ms user + system time
  //     elapsed: 20000,       // ms since the start of the process
  //     timestamp: 864000000  // ms since epoch
  //   }
  // }
})
```

## Compatibility

| Property | Linux | FreeBSD | NetBSD | SunOS | macOS | Win | AIX |
| ---         | --- | --- | --- | --- | --- | --- | --- |
| `cpu`       | ✅ | ❓ | ❓ | ❓ | ✅ | ℹ️ | ❓ |
| `memory`    | ✅ | ❓ | ❓ | ❓ | ✅ | ✅ | ❓ |
| `pid`       | ✅ | ❓ | ❓ | ❓ | ✅ | ✅ | ❓ |
| `ctime`     | ✅ | ❓ | ❓ | ❓ | ✅ | ✅ | ❓ |
| `elapsed`   | ✅ | ❓ | ❓ | ❓ | ✅ | ✅ | ❓ |
| `timestamp` | ✅ | ❓ | ❓ | ❓ | ✅ | ✅ | ❓ |

✅ = Working
ℹ️ = Not Accurate
❓ = Should Work
❌ = Not Working

Please if your platform is not supported or if you have reported wrong readings
[file an issue][new issue].

## API

<a name="pidusage"></a>

### pidusage(pids, callback)
Get pid informations.

**Kind**: global function  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| pids | <code>Number</code> \| <code>Array.&lt;Number&gt;</code> \| <code>String</code> \| <code>Array.&lt;String&gt;</code> | A pid or a list of pids. |
| callback | [<code>pidCallback</code>](#pidCallback) | Called when the statistics are ready. |

<a name="pidCallback"></a>

### pidCallback : <code>function</code>
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | A possible error. |
| statistics | <code>Object</code> | The object containing the statistics. |

## Related
- [pidusage-tree][gh:pidusage-tree] -
Promisified version of pidusage
- [pidusage-tree][gh:pidusage-tree] -
Compute a pidusage tree

## Authors
- **Antoine Bluchet** - [@soyuka][github:soyuka]
- **Simone Primarosa** - [@simonepri][github:simonepri]

See also the list of [contributors][contributors] who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE][license] file for details.

<!-- Links -->
[new issue]: https://github.com/soyuka/pidusage/issues/new
[license]: https://github.com/soyuka/pidusage/tree/master/LICENSE
[contributors]: https://github.com/soyuka/pidusage/contributors

[github:soyuka]: https://github.com/soyuka
[github:simonepri]: https://github.com/simonepri

[gh:pidusage-tree]: https://github.com/soyuka/pidusage-tree
[gh:pidusage-promise]: https://github.com/soyuka/pidusage-promise

[node:cpuUsage]: https://nodejs.org/api/process.html#process_process_cpuusage_previousvalue
[node:memUsage]: https://nodejs.org/api/process.html#process_process_memoryusage
