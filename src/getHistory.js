//How to get history Data from Commander Bx

$.support.cors = true;
var devices=[];
var pollPointCount=0;
var tempPower;
function  readAPoint(cb){
  var usage=0;
  var energyUsage = {};
  var pointNameVal='';
  console.log('Getting the point data...');
    sendExpr('readAll(point and cmd)', function(err,data){
      data = parseZinc(data);
      $('#subHeader').text('Found:');
      if(data.rows.length){
        for(var i in data.rows){
            pointNameVal+=data.rows[i].navName+':'+data.rows[i].curVal+'\r\n';
        }
      }
      $('#getData').html(pointNameVal);

      if(cb){
        cb(err, energyUsage);
      }
  }, 'text/plain', host,project);
}
function  watchPoll(cb){
  var usage=0;
  var energyUsage = {};
  var pointNameVal='';
  console.log('Getting the point changes...');
    sendExpr('watchPoll(\"'+watchId+'\")', function(err,data){
      data = parseZinc(data);
      data = setBoolCurVal(data);
      pollPointCount=data.rows.length;
      if (data.meta.dataErr){
        $('#getData').html(data.meta.dataErr);
        stopUpdateTimerButton();
        return;
      }
      if(data.rows.length){updateValues(data.rows);}
      if(cb){
        cb(err, energyUsage);
      }
  }, 'text/plain', host,project);
}
var watchId;
function  watchOpen(cb){
  var usage=0;
  var energyUsage = {};
  devices=[];
  console.log('Subscribing to watch.');
    sendExpr('readAll(point and cmd).watchOpen("api Example App")', function(err,data){
      if(checkForLoginScreen(data)){
        showLogin();
      }else{
        data = parseZinc(data);
        data = setBoolCurVal(data);
        if (data.meta.evalErr){
          $('#getData').html(data.meta.evalErr);
          return;
        }
        watchId=data.meta.watchId;
        if(data.rows.length){updateValues(data.rows);}
        if(cb){
          cb(err, energyUsage);
        }
      }
  }, 'text/plain', host,project);
}
function updateValues(deviceList){
    for(var i in deviceList){
      var pntid=deviceList[i].id.split(' ')[0];
      if(devices[pntid]){
        //update point value
        devices[pntid].curVal=deviceList[i].curVal;
      }else{
        //Add new point to device list
        devices[pntid]=deviceList[i];
      }
    }
  displayPoints();
}
function displayPoints(){
  var pointNameVal='';
  var pntNum=0;
  for(var i in devices){
    pntNum++;
    pointNameVal+=pntNum+'. '+devices[i].navName+':'+devices[i].curVal+'\r\n';
  }
  $('#getData').html(pointNameVal);
}

function  watchClose(cb){
  console.log('Closing subscription');
    sendExpr('watchClose(\"'+watchId+'\")', function(err,data){
      data = parseZinc(data);
      console.log('Closed');
      if(cb){
        cb(err, energyUsage);
      }
  }, 'text/plain', host,project);
}

function  readAHistory(cb){
  var usage=0;
  var energyUsage = '';

  console.log('Getting the History...');
    sendExpr('read(dis==\"chA heat flow, + totalizer\").hisRead(today())', function(err,data){
      //data = parseZinc(data);
      var rows = data.split('\n');
      $('#subHeader').text('Meter Data');
      $('#getData').text('');
      var html="<tr><th>No.</th><th>timestamp</th><th>value</th></tr>" ;

      if(rows.length){
        for(var i = 2; i <= rows.length - 3; i++){
            var cData = rows[i].split(",");
            html += "<tr><td>"+(i-2)+"</td><td>"+cData[0]+"</td><td>"+cData[1]+"</td></tr>";
        }
      }
      
      

      $('#discover-data').html(html);

      if(cb){
        cb(err, energyUsage);
      }
    }, 'text/plain', host,project);
}

var updateIntervalSeconds=0.1;
var updateTimeout;
function update(){
  updateTimeout= setTimeout(function () {
    //readAPoint();
    //readAHistory();
    watchPoll();
    clearTimeout(leaseTimeOut); //Clear subscription timeout
    watchLeaseTimeout(); //Restart timeout
    updateIntervalSeconds=updateTimeSeconds;
    var pollPoints='';
    if(pollPointCount>0) pollPoints=pollPointCount+' at ';
    $('#last-update').text("updated: "+pollPoints+ new Date().toLocaleTimeString());
    if (autoUpdate){update();}
  }, updateIntervalSeconds*1000);
}

var leaseTimeMs=60000;
var leaseTimeout;
function watchLeaseTimeout(){
  leaseTimeOut=setTimeout(function () {
    stopUpdateTimerButton();
    clearTimeout(updateTimeout);
    $('#last-update').text('Lease Expired '+ new Date().toLocaleTimeString());
  }, leaseTimeMs);
}