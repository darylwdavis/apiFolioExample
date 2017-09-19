function startUpdateTimerButton(){
    autoUpdate=true;
    update();
    $('#update-timer-enable').text('Updating...');
}
function stopUpdateTimerButton(){
    clearTimeout(updateTimeout);
    clearTimeout(leaseTimeOut);
    watchClose();
    autoUpdate=false;
    $('#watch-subscribe').text('Open Watch');
    $('#update-timer-enable').text('Auto Update');
}
function addMilliseconds(date, ms) {
    return new Date(date.getTime() + ms);
}
function showLogin(){
  return $('#loginModal').modal('show');
}
function loginFail(){
  $('#cloud-host-basicStatus').text('Invalid username or password');
}
function loginSuccess(){
  $('#loginModal').modal('hide');
}

$(document).ready(function(){
  $('#cloud-modal-login').click(function(){
    $('#cloud-host-basicStatus').text('');
    login($('#cloud-host-username').val(),
          $('#cloud-host-password').val());
  });

  $('#navbar-subtitle-host').text('Host: '+host);
  $('#navbar-subtitle-project').text('Project: '+project);
  $('#watch-subscribe').click(function(){
    watchOpen();
    runAdhocCommand();
    watchLeaseTimeout();
    $('#last-update').text('Lease Expires at '+ addMilliseconds(new Date(),leaseTimeMs).toLocaleTimeString());
    $('#watch-subscribe').text('Watch Open');
  });
  $('#navbar_logout').click(function(){
    logout();
  });
  $('#update-timer-enable').click(function(){
    if($('#update-timer-enable').text()=='Updating...'){
      stopUpdateTimerButton();
    }else{
      startUpdateTimerButton();
    }
  });
  $('#cloud-host-username').keyup(function(event){
      if ( event.which == 13 ) {
           $('#cloud-host-password').focus();
      }
   });
   $('#cloud-host-password').keyup(function(event){
      if ( event.which == 13 ) {
          $('#cloud-modal-login').click();
      }
   });
   $('#loginModal').on('shown.bs.modal', function (){
     $('#cloud-host-username').focus();
   });


});