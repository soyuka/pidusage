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
  var flags = 0
      | 0x0 //wbemFlagReturnWhenComplete ;
  ;
  // lookup SWbemServices object
  // @see: http://msdn.microsoft.com/en-us/library/aa393854(v=vs.85).aspx
  var objSWbemServices = GetObject("winmgmts:");
  var query = "SELECT * FROM Win32_PerfFormattedData_PerfProc_Process WHERE IDProcess = '"
    + pid + "'  OR CreatingProcessID = '"+pid+"'";

  var objSWbemObjectSet = objSWbemServices.ExecQuery(query, "WQL", flags);
  if (objSWbemObjectSet.Count === 0) {
    quit('Process with pid = ' + pid + ' not found');
  }

  var mem = 0, cpu = 0, memTotal = 0, cpuTotal = 0;
  var mainPid = null;
  var children = [];
  // iterating over items to collect stats
  var e = new Enumerator(objSWbemObjectSet);
  e.moveFirst();
  while (e.atEnd() == false) {
    var proc = e.item();
    if (proc.IDProcess == pid) {
      mainPidFound = true;
      mem = parseInt(proc.WorkingSet);
      cpu = parseInt(proc.PercentProcessorTime);
      mainPid = proc.Name+'('+proc.IDProcess+') \t - '+proc.WorkingSet + ','+proc.PercentProcessorTime ;
    }
    else {
      children.push('  '+ proc.Name+'('+proc.IDProcess+') \t - '+proc.WorkingSet + ','+proc.PercentProcessorTime) ;
    }

    memTotal += parseInt(proc.WorkingSet);
    cpuTotal += parseInt(proc.PercentProcessorTime);
    e.moveNext();
  }

  if (null === mainPidFound) {
    quit('Process with pid = ' + pid + ' not found');
  }
  // this will not be shown when cscript is running with /b key
  if (children.length > 0) {
    WScript.Echo(mainPid);
    WScript.Echo('------- Child Processes ---------------');
    WScript.Echo(children.sort().join('\r\n'));
    WScript.Echo('---------------------------------------');
  }
  WScript.stdout.write(mem+","+cpu+","+memTotal+","+cpuTotal);

})(WScript.arguments(0));