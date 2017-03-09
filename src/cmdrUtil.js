function sendExpr(expr, cb, accept, host, pname){
  var h = '';
  if(host)
    h = host;
  var headers = {          
    Accept: accept||"application/json; charset=utf-8",         
    "Content-Type": "text/plain; charset=utf-8"
  };
  if(host)
    headers.Cookie = Cookie;
  var data = 'ver:"2.0"\n'+
    'expr\n'+
    '"'+expr.replace(/"/g,'\\\"')+'"';
    //console.log(h+'/api/'+(pname?pname:project)+'/evalAll');
  $.ajax({
    type: 'POST',
    url: h+'/api/'+(pname?pname:project)+'/evalAll',
    headers: headers,
    data: data,
    xhrFields: {
      withCredentials: true
    },
    error: function(err){
      cb(err);
    },
    success: function(data){
      cb(null, data);
    }
  });
}

function parseZinc(zinc){
      var ret = {};
      ret.cols = [];
      ret.rows = [];
  if(zinc){
      var rows = zinc.split('\n');
      var meta = rows[0];
      var headers = rows[1].split(',');

      meta=meta.split(':');
      var version =meta[1].substring(1,4);
      var eErr='';
      var dErr='';
      var wId='';
      if(meta[2]){
        if(meta[2].split(' ')[1]=='watchId'){wId=replaceAll(meta[3],'"','');}
      }
      if(meta[4]&&meta[5]){
        if(meta[4]=="EvalErr"){eErr=meta[5];}
      }
      if(meta[9]&&meta[10]){
        if(meta[9]=="Err"){dErr=meta[10];}
      }
      ret.meta = {
        ver: version,
        dataErr:dErr,
        evalErr:eErr,
        watchId: wId
      };
      ret.cols = [];
      for(var k = 0; k < headers.length; k++){
        var obj = {};
        obj.name = headers[k];
        ret.cols.push(obj);
      }
      ret.rows = [];
      for(var i = 2; i < rows.length; i++){
        if(!rows[i]) continue;
        var str = rows[i];
        var inQuotes = false;
        var inCoords = false;
        var escaped = 0;
        var termStart = 0;
        var termEnd = 0;
        var data = {};
        var termNum = 0;
        var term;
        for(var j = 0; j < str.length; j++){
          if(str[j] == '\\'){
            escaped++;
            continue;
          }
          // if not escaped, track if we're in quotes
          if((escaped % 2) === 0){
            escaped = 0;
            if(str[j] == '"'){
              inQuotes = !inQuotes;
              continue;
            }
          }
        // if not escaped, track if we're in geoCoord
          if((escaped % 2) === 0){
            escaped = 0;
            if(str[j] == 'C' && str[j+1] == '('){
              inCoords = true;
              continue;
            }
            if(str[j] == ')'){
              inCoords = false;
              continue;
            }
          }
          // commas delimit if we're not in quotes or coordinates
          if(str[j] == ',' && !inQuotes && !inCoords){
            if (ret.cols[termNum]){
                termEnd = j-1;
                term = str.substring(termStart, termEnd+1);
                data[ret.cols[termNum].name] = parseTerm(term);
                termNum++;
                termStart = j+1;
            }
          }
          escaped = 0;
        }
        term = str.substring(termStart);
        if (ret.cols[termNum]){
            data[ret.cols[termNum].name] = parseTerm(term, ret.cols[termNum].name);
            termNum++;
            ret.rows.push(data);
        }
      }
      return ret;
    }else{
      return ret;
    }
}
function parseTerm(term, name){
  if(term[0] == '"')
    return term.substring(1,term.length-1);
  if(term[0] == '@')
    return term;
  if(term[0] == '`')
    return term;
  if(term == 'M')
    return '✓';
  if(term[term.length-1] == 'Z' || (name && name == 'mod'))
    return term;
  if(isNaN(term))
    return term;
  return parseInt(term);
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function setBoolCurVal(dataArray){
  for(var i in dataArray.rows){
    var pnt=dataArray.rows[i];
    if(pnt.kind=="Bool"){
      var e=pnt.enum;
      if(typeof(e)==='string'){
        var enumValues=e.split(',');
        if(enumValues.length>1){
          dataArray.rows[i].curVal=(pnt.curVal=='F')? enumValues[0] : enumValues[1];
        }else{
          dataArray.rows[i].curVal=(pnt.curVal=='F')? 'False':'True';
        }
      }else{
        dataArray.rows[i].curVal=(pnt.curVal=='F')? 'False':'True';
      }
    }
  }
  return dataArray;
}
var Cookie;
var Connected = false;
var autoUpdate=false;

function login(username,password){
 // get the userSalt and nonce from /auth/CloudProjectName/api?username
      var headers = {          
        Accept: "application/json; charset=utf-8",         
        "Content-Type": "text/plain; charset=utf-8"
      };
    if(host)
        headers.Cookie = Cookie;
    $.ajax({
      type: 'GET',
      url: host+'/auth/'+project+'/api?'+username,
      headers: headers,
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
        var rows = data.split('\n');
        var userSalt = rows[1].split(':')[1];
        var nonce = rows[3].split(':')[1];
        var shaObj = new jsSHA('SHA-1', "TEXT");
        shaObj.setHMACKey(password, "TEXT");
        shaObj.update(username+':'+userSalt);
        var hmac = shaObj.getHMAC("B64");
        var shaObj2 = new jsSHA('SHA-1', 'TEXT');
        shaObj2.update(hmac+':'+nonce);
        var hash = shaObj2.getHash('B64');
        data = 'nonce:'+nonce+'\n'+'digest:'+hash;
        $.ajax({
          type: 'POST',
          url: host+'/auth/'+project+'/api?'+username,
          headers: headers,
          xhrFields: {
            withCredentials: true
          },
          data: data,
          success: function(data){
            Cookie = data.substring(data.indexOf(':')+1);
            Connected = true;
            location.reload();
            loginSuccess();
          }
        }).fail(function(){
           loginFail();
        });
      }
    });
}
function logout(){
    var headers = {
      Accept: "application/json; charset=utf-8",
      "Content-Type": "text/plain; charset=utf-8"
    };
    $.ajax({
      type: 'GET',
      url: host+'/auth/'+project+'/logout',
      headers: headers,
      xhrFields: {
        withCredentials: true
      },
      success: function(data){
          Connected = false;
          location.reload();
          }
      });
 }

sendExpr('read(kmcInstallProfiles)', function(err, data){
  if(err) return;
  if(checkForLoginScreen(data)){showLogin();}
}, 'text/plain',host,project);

function checkForLoginScreen(data){
    if(data.substring(0,3)=='<ht'||data.substring(0,3)=='<!D'){
     return true;
  }else{
    return false;
  }
}