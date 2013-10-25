var tabShots = {};
var doormatTabs = {};

var activeWindowId = null;
var activeTabId = null;

var captureTime = 5000; // every 5 seconds

var extensionUrl = null;

function initVars(windowId, tabId) {
	if (!tabShots[windowId]) {
		tabShots[windowId] = {};
	}

	if (tabId && !tabShots[windowId][tabId]) {
		tabShots[windowId][tabId] = {};
	}

	if (!doormatTabs[windowId]) {
		doormatTabs[windowId] = null;
	}
}

/*
Take screenshot of visible tab
*/
function captureVisibleTab(callback) {
	var currentTabId = activeTabId;

	chrome.tabs.sendMessage(activeTabId, {capture:'loading'});
	chrome.tabs.captureVisibleTab(function(dataUrl) {
		chrome.tabs.sendMessage(activeTabId, {capture:'done'});
		if (currentTabId == activeTabId) {
			tabShots[activeWindowId][activeTabId]['src'] = dataUrl;
		}
		if (typeof callback == 'function') {
			callback();
		}
	});

}

/*
Capture the selected tab
*/
function captureTab(callback) {
	chrome.tabs.getSelected(function(tab) {
		if (tab.url.match(/^http[s]?:\/\//)) {
			activeWindowId = tab.windowId;
			activeTabId = tab.id;

			initVars(tab.windowId, tab.id);

			captureVisibleTab(callback);
			captureInnerText();
		}
	});
}

/*
Capture inner text of the selected tab
*/
function captureInnerText() {
	chrome.tabs.sendMessage(activeTabId, {tabId: activeTabId, action:"getInnerText"});
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete') {
		captureTab();
	}
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	captureTab();
});

// React when a browser action's icon is clicked.
chrome.browserAction.onClicked.addListener(function(tab) {
	captureTab(function() {
		// clone tabShotsc[activeWindowId] to currentTabShots
		var currentTabShots = JSON.parse(JSON.stringify(tabShots[activeWindowId]));

		// set active tab first
		var orderedShots = {};
		orderedShots[activeTabId] = currentTabShots[activeTabId];

		delete currentTabShots[activeTabId];

		Object.keys(currentTabShots).forEach(function(key) {
			orderedShots[key+"!"] = currentTabShots[key];
		});

		chrome.tabs.sendMessage(activeTabId, {
			action: 'animate', 
			tabShots: orderedShots
		});
	});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// change the tab when clicked/selected in doormat page
	if (request.selectedTabId) {
		chrome.tabs.update(parseInt(request.selectedTabId), {selected: true});
	}
	// insert the innerText into variable when received from the content page
	if (typeof request.innerText == "string") {
		tabShots[sender.tab.windowId][sender.tab.id]['innerText'] = request.innerText;
	}
});
