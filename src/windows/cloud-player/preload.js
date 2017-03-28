process.once('loaded', function() {
  window.addEventListener('load', function(){
    document.querySelector('body').classList.add('native', 'desktop');
    window.mode='NATIVE_DESKTOP';
    window.appVersion =  '0.1.7';
  })
});