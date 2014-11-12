function quit(text, code) {
  with (WScript) {
    stderr.writeLine('\r\n  Error: ' + text + '\r\n' );
    stderr.writeLine('Usage:\r\n\t cscript [/b] perf.js <pid> ');
    Quit(code || 1);
  }
}

if (WScript.arguments.length == 0) {
  quit('No PID provided');
}

(function(pid) {
  if (!pid.match(/^\d+$/)) quit ('PID must be numeric');
  // See flags here: http://msdn.microsoft.com/en-us/library/aa393866(v=vs.85).aspx

  // lookup SWbemServices object
  // @see: http://msdn.microsoft.com/en-us/library/aa393854(v=vs.85).aspx
  var objSWbemServices = GetObject("winmgmts:");
  // using refresher object to ger accurate results
  var objRefresher = new ActiveXObject("WbemScripting.SWbemRefresher");

  var objSWbemObjectSet = objRefresher.AddEnum(objSWbemServices, "Win32_PerfFormattedData_PerfProc_Process").objectSet
  objRefresher.Refresh();
  WScript.Sleep(100); // 2nd refresh gets the real results
  objRefresher.Refresh();

  var mem = 0, cpu = 0, memTotal = 0, cpuTotal = 0;
  var mainProc = null;
  var children = [];
  // iterating over items to collect stats
  var e = new Enumerator(objSWbemObjectSet);
  e.moveFirst();
  while (e.atEnd() == false) {
    var proc = e.item();
    e.moveNext();
    if (proc.IDProcess == pid) {
      mem = parseInt(proc.WorkingSet);
      cpu = parseInt(proc.PercentProcessorTime);
      mainProc = proc.Name+'('+proc.IDProcess+') \t - '+proc.WorkingSet + ','+proc.PercentProcessorTime ;
    }
    else if (proc.CreatingProcessID == pid){
      children.push('  '+ proc.Name+'('+proc.IDProcess+') \t - '+proc.WorkingSet + ','+proc.PercentProcessorTime) ;
    }
    else {continue} // skip others

    memTotal += parseInt(proc.WorkingSet);
    cpuTotal += parseInt(proc.PercentProcessorTime);
  }

  if (null === mainProc) {
    quit('Process with pid = ' + pid + ' not found');
  }

  // this will not be shown when cscript is running with /b key
  WScript.Echo(mainProc);
  WScript.Echo('------- Child Processes ---------------');
  WScript.Echo(children.sort().join('\r\n'));
  WScript.Echo('---------------------------------------');

  WScript.stdout.write(mem+","+cpu+","+memTotal+","+cpuTotal);

})(WScript.arguments(0));