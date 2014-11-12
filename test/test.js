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

describe('pid usage', function() {
  this.timeout(4000)

  it('should get pid usage', function(cb) {
    pusage(process.pid, function(err, stat) {
      try {
        expect(err).to.be.null
        expect(stat).to.be.an('object')
        expect(stat).to.have.property('cpu')
        expect(stat).to.have.property('memory')
        expect(stat.cpu).to.be.at.most(100)

        console.log('Pcpu: %s', stat.cpu)
        console.log('Mem: %s', formatBytes(stat.memory))

        cb()
      }
      catch (e) {
        cb(e);
      }
    })
  })

  it('should get pid usage again', function(cb) {
    setTimeout(function() {
      pusage(process.pid, function(err, stat) {
        try {
          expect(err).to.be.null
          expect(stat).to.be.an('object')
          expect(stat).to.have.property('cpu')
          expect(stat).to.have.property('memory')
          expect(stat.cpu).to.be.at.most(100)

          console.log('Pcpu: %s', stat.cpu)
          console.log('Mem: %s', formatBytes(stat.memory))

          cb()
        }
        catch (e) {
          cb(e);
        }
      })
    }, 2000)
  })

  it('should retrieve ~(99/[num of cpus])% of cpu usage for while(true); loop script.', function (done) {
    // process.argv[0] should be node (or full path of node)
    var loop    = spawn(process.argv[0], ['loop.js', 'loopit'], {cwd : __dirname}) ;
    pusage(loop.pid, function (err, stat) {
        var numOfCpus = os.cpus().length
        var minCpu = 90.0 / numOfCpus, maxCpu = 100.0 / numOfCpus;
        loop.kill();
        try {
          expect(stat.cpu).to.be.at.most(maxCpu)
          expect(stat.cpu).to.be.above(minCpu)

          done();
        }
        catch (e) {
          done(e);
        }
        console.log('Pcpu: %s', stat.cpu)
        console.log('Mem: %s', formatBytes(stat.memory))

    })
  })


});

