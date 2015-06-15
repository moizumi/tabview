(function() {

    var MAIN_TAB_NAME = "tabview";

    var $body = $('body');

    var items;
    var windowMap = {};

    chrome.tabs.onRemoved.addListener(function(tabId){
      items.$data.windows.forEach(function(w){
        var index = 0;
        w.tabs.forEach(function(t){
          if(t.id === tabId) {
            w.tabs.splice(index, 1);
            return;
          }
          index++;
        });
      });
    });


    chrome.tabs.onCreated.addListener(function(tab){
      var w = windowMap[tab.windowId];
      if(w) {
        w.tabs.push(tab);
      }
    });


    chrome.windows.getAll({populate: true}, function(windows) {
      var filtered = [];
      windows.forEach(function(w){
        var t = w.tabs[0];
        if(/^chrome-extension:.*tabview.html$/.test(t.url)
          && t.title === 'tabview'){
          return;
        }
        filtered.push(w);
      });
      convert(filtered);
    });

    function convert(windows) {
      items = new Vue({
          el: '#items',
          data : {windows: windows},
            methods: {
              focus: function(item){
                  chrome.windows.update(item.windowId, {focused:true});
                  chrome.tabs.update(item.id, {active:true});
              },
              remove: function(item){
                  chrome.tabs.remove(item.id);
              }
            }
        });

        items.$data.windows.forEach(function(w) {
          windowMap[w.id] = w;
        });
    }

})();
