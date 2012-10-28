function addPinyin(){
  	chrome.tabs.executeScript(null, {file: "jquery-1.7.1.min.js"});
    chrome.tabs.executeScript(null, {file: "cedict.json"});
    chrome.tabs.executeScript(null, {file: "chineseReader.js"});
}
chrome.browserAction.onClicked.addListener(addPinyin);
