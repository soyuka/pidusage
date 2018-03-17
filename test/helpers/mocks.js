import EventEmitter from 'events';
import streamify from 'string-to-stream';
import through from 'through';

module.exports = {
  spawn: (stdout, stderr, error, code, signal) => {
    const ee = new EventEmitter();

    ee.stdout = through(function(d){this.queue(d)});
    ee.stderr = through(function(d){this.queue(d)});

    streamify(stderr).pipe(ee.stderr);
    streamify(stdout).pipe(ee.stdout);

    if (error) {
      ee.emit('error', error);
    } else if (!stderr) {
      ee.stdout.on('end', () => ee.emit('close', code, signal));
    } else {
      ee.stderr.on('end', () => ee.emit('close', code, signal));
    }
    return ee;
  }
}
