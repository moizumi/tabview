(function() {

    var MAIN_TAB_NAME = "tabview";

    var $body = $('body');

    var items;
    var windowMap = {};

    chrome.tabs.onRemoved.addListener(function(tabId){
      items.$data.windows.forEach(function(w){
        var index = 0;
        if(!w.tabs) {
          return;
        }
        w.tabs.forEach(function(t){
          if(t.id === tabId) {
            w.tabs.splice(index, 1);
            return;
          }
          index++;
        });
      });
    });


    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
      var w = windowMap[tab.windowId];
      if(!w) {
        return;
      }
      var tabs = w.tabs;
      for(var i = 0; i < tabs.length; i++) {
        if(tabs[i].id === tabId) {
          tabs.$set(i, tab);
          return;
        }
      }
    });

    chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId){
      chrome.tabs.get(addedTabId,function(tab){
        items.$data.windows.forEach(function(w){
            var tabs =  w.tabs;
            for(var i =0; i < tabs.length;i++){
              if(tabs[i].id == removedTabId) {
                tabs.$set(i, tab);
              }
            }
        });
      });
    });


    chrome.tabs.onCreated.addListener(function(tab){
      var w = windowMap[tab.windowId];
      if(w) {
        w.tabs.push(tab);
      }
    });

    chrome.windows.onCreated.addListener(function(w){
      chrome.windows.get(w.id, {populate:true},function(w){
        items.$data.windows.push(w);
      });
    });

    chrome.windows.onRemoved.addListener(function(w){
        var windows = items.$data.windows;
        for(var i= 0; i < windows.length; i++) {
          if(windows[i].id === w) {
            windows.$remove(i);
          }
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
          template: '#template',
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

    Vue.filter('favicon', function(value){
      if(!value) {
          return 'img/default-favicon.png';
      }

      if(value.indexOf('chrome') === 0) {
        return 'img/system-favicon.png';
      }

      return value;
    });

    chrome.tabs.onMoved.addListener(function(id, info){
      var tabs = windowMap[info.windowId].tabs;
      var tab = tabs[info.fromIndex];
      tabs.splice(info.fromIndex,1);
      tabs.splice(info.toIndex,0,tab);
    });

    chrome.tabs.onAttached.addListener(function(w){
      console.log("onAttached")
    });

    chrome.tabs.onDetached.addListener(function(w){
      console.log("onDetached")
    });

})();
