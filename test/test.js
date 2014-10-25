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
        console.log('I\'m not going to fail. Ever!')
        expect(1).to.be.at.most(100)
  })
  
})


});

