(function() {

    var MAIN_TAB_NAME = "tabview";

    var $body = $('body');

    var windows;
    var taviewId;


    function searchWindow(id){
      for(var i= 0, max = windows.length; i < max; i++) {
        if(windows[i].id === id) {
          return windows[i];
        }
      }
    }

    function removeTab(window, id){
      if(!window) {
        return;
      }
      var tabs = window.tabs;
      if(!tabs){
        return;
      }
      var index = 0;
      for(var i= 0, max = tabs.length; i < max; i++) {
          if(tabs[i].id === id) {
            tabs.splice(index, 1);
            return tabs[i];
          }
          index++;
      }
    }

    chrome.tabs.onRemoved.addListener(function(tabId){
      for(var i= 0, max = windows.length; i < max; i++) {
        if(removeTab(windows[i], tabId)) {
          return;
        }
      }
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
      var w = searchWindow(tab.windowId);
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
        windows.forEach(function(w){
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
      var w = searchWindow(tab.windowId);
      if(w) {
        w.tabs.push(tab);
      }
    });

    chrome.windows.onCreated.addListener(function(w){
      chrome.windows.get(w.id, {populate:true},function(w){
        windows.push(w);
      });
    });

    chrome.windows.onRemoved.addListener(function(w){
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
          taviewId = w.id;
          return;
        }
        filtered.push(w);
      });
      convert(filtered);
    });

    function convert(allWindows) {
      items = new Vue({
          el: 'body',
          template: '#template',
          data : {windows: allWindows},
            methods: {
              highlight: function(window) {
                // chrome.windows.update(window.id, {focused:true});
                // chrome.windows.update(taviewId, {focused:true});
              },
              focus: function(tab, e) {
                chrome.windows.update(tab.windowId, {focused:true});
                chrome.tabs.update(tab.id, {active:true});
                e.stopPropagation();
              },
              activate: function(tab){
              //    chrome.tabs.update(tab.id, {active:true});
              },
              remove: function(item, e){
                  chrome.tabs.remove(item.id);
                  e.stopPropagation();
              },
              dragStart: function(item, e){
                  e.dataTransfer.setData('id', item.id);
                  e.dataTransfer.setData('class', item.$el.classList[0]);
                  item.$add('drag', true);
                  e.stopPropagation();
              },
              dragEnd: function(e){
                  console.log('dragEnd');
              },
              dragover: function(e) {
                e.preventDefault();
              },
              dropItem: function(item, e) {
                e.preventDefault();
                var origin = e.dataTransfer;
                var id = parseInt(origin.getData('id'), 10);
                var className = origin.getData('class');
                if(className === 'tab') {
                  chrome.tabs.move(id, {windowId: item.windowId, index:item.index});
                  e.stopPropagation();
                  return;
                }
                var index = item.index;
                chrome.tabs.query({windowId: id}, function(tabs){
                  for(var i = 0, max = tabs.length; i < max; i++) {
                    chrome.tabs.move(tabs[i].id, {windowId:item.windowId, index:index},
                    function(){index++;});
                  }
                });
                e.stopPropagation();
              },
              mouseover: function(item, e) {
                item.$set('hovered', true);
                item.className = item.className + " hovered";
              },
              mouseout: function(item, e) {
                item.$set('hovered', false);
              },
              toNewWindow: function(item, e) {
                e.preventDefault();
                var className = e.dataTransfer.getData('class');
                if(className === 'window') {
                  return;
                }
                var origin = e.dataTransfer;
                var id = parseInt(origin.getData('id'), 10);
                chrome.windows.create({tabId: id});
                //chrome.tabs.move(id, {windowId: item.windowId, index:item.index});
              }
            }
          });
        windows = items.$data.windows;
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
      var tabs = searchWindow(info.windowId).tabs;
      var tab = tabs[info.fromIndex];
      tabs.splice(info.fromIndex,1);
      tabs.splice(info.toIndex,0,tab);
    });

    chrome.tabs.onAttached.addListener(function(tabId, info){
      chrome.windows.get(info.newWindowId, {populate:true},function(w){
          for(var i= 0, max = windows.length; i < max; i++) {
            if(windows[i].id === w.id) {
              return windows.$set(i, w);
            }
          }
      });
    });

    chrome.tabs.onDetached.addListener(function(tabId, info){
      removeTab(searchWindow(info.oldWindowId),tabId);
    });



})();
