var pusage = require('../').stat
    , os = require('os')
    , spawn = require('child_process').spawn
    , expect = require('chai').expect

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

function delay(func, delay) {
    var self=this;
    return function() {
        var arg = arguments;
        setTimeout(function () {
            func.apply(self, arg);
        }, delay)
    }
}
describe('pid usage', function() {
  // set some finite timeout for appveyor
  this.timeout(300000); // 5 min
  var i=1;
  beforeEach(function () {
      console.log(os.EOL + 'Starting test case #'+i++)
  })

  it('should get pid usage', function(cb) {
    pusage(process.pid, function(err, stat) {
      try {
        console.log('Pcpu: %s', stat.cpu)
        console.log('Mem: %s', formatBytes(stat.memory))

        expect(err).to.be.null
        expect(stat).to.be.an('object')
        expect(stat).to.have.property('cpu')
        expect(stat).to.have.property('memory')
        expect(stat.cpu).to.be.at.most(100)

        cb()
      }
      catch (e) {
        console.log('Error: %s', e)
        cb(e);
      }
    })
  })


  it('should get pid usage again', function(cb) {
    setTimeout(function() {
      pusage(process.pid, function(err, stat) {
        try {
          console.log('Pcpu: %s', stat.cpu)
          console.log('Mem: %s', formatBytes(stat.memory))
          expect(err).to.be.null
          expect(stat).to.be.an('object')
          expect(stat).to.have.property('cpu')
          expect(stat).to.have.property('memory')
          expect(stat.cpu).to.be.at.most(100)
          cb()
        }
        catch (e) {
          console.log('Error: %s', e)
          cb(e);
        }
      })
    }, 100)
  })

  it('should retrieve ~(99/[num of cpus])% of cpu usage for while(true); loop script.', function (done) {
    // report error with delay to let AppVeyor collect stdout properly
    done = delay(done, 1000);
    // process.argv[0] should be node (or full path of node)
    var loop ;
    try {
      loop = spawn(process.argv[0], ['loop.js', 'loopit'], {cwd : __dirname}) ;
    }
    catch(e) {
      console.log("Test skipped: failed to spawn a process: %s", e);
      return done();
    }

    pusage(loop.pid, function (err, stat) {
      try {
        console.log('Pcpu: %s', stat.cpu)
        console.log('Mem: %s', formatBytes(stat.memory));

        var numOfCpus = os.cpus().length
        var minCpu = 90.0 / numOfCpus, maxCpu = 100.0 / numOfCpus ;
        loop.kill();

        expect(stat.cpu).to.be.at.most(maxCpu)
        expect(stat.cpu).to.be.above(minCpu)

        done();
      }
      catch (e) {
        console.log('Error: %s', e)
        done(e);
      }

    });
  })
});
