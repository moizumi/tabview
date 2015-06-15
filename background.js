(function(){
    chrome.browserAction.onClicked.addListener(function(){
        chrome.tabs.query({title: 'tabview'}, function(tabs){
            if(tabs.length) {
                chrome.windows.update(tabs[0].windowId, {'focused': true});
                return;
            }
            chrome.windows.create({
                'url': 'tabview.html',
                'focused': true,
                'type': 'panel'
            });
        });
    });
})();
