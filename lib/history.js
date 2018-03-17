'use strict'

var timeouts = {}
var history = {}
var expiration = 60000

function get (pid) {
  stopTimeout(pid)
  if (history[pid] !== undefined) startTimeout(pid)
  return history[pid]
}

function set (pid, object) {
  stopTimeout(pid)
  startTimeout(pid)
  history[pid] = object
}

function remove (pid) {
  stopTimeout(pid)
  delete history[pid]
}

function removeAll (pid) {
  Object.keys(history).forEach(function (k) {
    remove(k)
  })
}

function stopTimeout (pid) {
  if (timeouts[pid]) {
    clearTimeout(timeouts[pid])
    delete timeouts[pid]
  }
}

function startTimeout (pid) {
  timeouts[pid] = setTimeout(remove, expiration, pid)
}

module.exports = {
  get: get,
  set: set,
  remove: remove,
  removeAll: removeAll
}
