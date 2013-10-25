(function($) {
	var tabShots;
	var bodyOverflow;
	var totalLength = 90; // search result total length

	function closeTabShots() {
		$('#tsWrapper').remove();
		$('body').css('overflow', bodyOverflow);
	}

	//if (location.href.match(/^http[s]?\:\/\//)) {
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

		if (request.action == 'getInnerText') {
	//		$('title').text(request.tabId);
			var innerText = $('body')[0].innerText || "";
			chrome.runtime.sendMessage({innerText: innerText});
		}
		else if (request.capture == 'loading') {
			$('#tabShotIndicator').show();
		}
		else if (request.capture == 'done') {
			$('#tabShotIndicator').hide();
		}
		else if (request.action == 'animate') {
			$('body').remove('#tsWrapper');

			$tsWrapper = $('<div id="tsWrapper"></div>');


			$returnImage = $('<div class="ts_return"></div>')
				.on('click', function() {
					closeTabShots();
				})
				.appendTo($tsWrapper);


			$searchContainer = $('<input id="tsSearchBox" name="field" type="text" />');

			$('<div id="tsSearchWrapper" />').append($searchContainer).appendTo($tsWrapper);


			$tsAnimateWrapper = $('<div class="ts_animate ts_container"></div>')
				.appendTo($tsWrapper);
			
			var first = request.tabShots[ Object.keys(request.tabShots)[0] ];
	/*		
			request.tabShots = {};
			for (i = 0; i < 10; i++) {
				request.tabShots[i] = first;
			}
	*/
			
			tabShots = request.tabShots;
			$.each(request.tabShots, function(tabId, data) {
				tabId = parseInt(tabId);
				if (!data.src) {
					return;
				}

				$(	'<div class="ts_tabview" data-id="'+tabId+'">'+
						'<div class="ts_results"></div>'+
					'</div>')
					.css('background-image','url('+data.src+')')
					.click(function() {
						if (parseInt(first.tabId) == tabId)
							$('#tsWrapper').remove();
						chrome.runtime.sendMessage({selectedTabId: tabId});
					})
					.appendTo($tsAnimateWrapper);
			});
			setTimeout(function() {
				$('.ts_tabview').css('background-position', '25px 25px');
				$searchContainer.trigger('focus');
			}, 500);

			$('body').css('overflow', 'hidden');

			$tsWrapper.appendTo('body');
		}
	});
	$(document).ready(function() {
		bodyOverflow = $('body').css('overflow')
		$('<div>', {
			id: 'tabShotIndicator',
			style: 'display:none;width:50px;height:50px;z-index:1000;bottom:0;left:0;position:fixed;background:yellow;border:5px solid black'
		}).appendTo('body')
	});
	$(document).keyup(function(e) {
	  if (e.keyCode == 27) { 
	  		closeTabShots();
	  }   // esc
	});


	/** search.js **/


	// http://stackoverflow.com/a/3410557
	function getIndicesOf(searchStr, str, caseSensitive) {
	    var startIndex = 0, searchStrLen = searchStr.length;
	    var index, indices = [];
	    if (!caseSensitive) {
	        str = str.toLowerCase();
	        searchStr = searchStr.toLowerCase();
	    }
	    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
	        indices.push(index);
	        startIndex = index + searchStrLen;
	    }
	    return indices;
	}

	function search() {
		$('.ts_results').hide();

		var val = $('#tsSearchBox').val();
		$('.ts_results').empty();

		$('.ts_tabview').show();
		if (val.length > 3) {
			$.each(tabShots, function(tabId) {
				tabId = parseInt(tabId);
				var htmls = [],
					innerText = this.innerText,
					i = 0, 
					maxResults = 5;
					;

				if (!innerText) {
					return;
				}

				indices = getIndicesOf(val, this.innerText);

				$.each(indices, function() {
					var startPos = this;

					var len = Math.floor((totalLength-val.length)/2);

					innerText.replace(/(\r\n|\n|\r)/gm, '').replace('/  /g', ' ');

					var startTxt = innerText.substr(startPos-len, len);
					var resultTxt = innerText.substr(startPos, val.length);
					var endTxt = innerText.substr(startPos+val.length, len);

					var html = '<p class="ts_result">'+startTxt+'<strong>'+resultTxt+'</strong>'+endTxt+'</p>';
					if ($.inArray(html, htmls) == -1) {
						if (i++ < maxResults) {
							htmls.push(html);
							$('div[data-id="'+tabId+'"] .ts_results').append(html);
						}
						else if (i == (maxResults+1)) {
							moreHtml = '<p class="ts_result"><i>+'+(indices.length-maxResults)+' more results...</i></p>';
							$('div[data-id="'+tabId+'"] .ts_results').append(moreHtml);
						}
					}
				});
			});
			if ($('.ts_results p').length > 0) {
				$('.ts_results').show();
				$('.ts_tabview').hide();
				$('.ts_results p').closest('.ts_tabview').show();
			}	
		}
	}

	$(document)
		.on('keyup', '#tsSearchBox', function() {
			search();
		})
		.on('-mouseenter', '.ts_tabview', function() {
			if ($(this).find('p.ts_result').length > 0) {
				$(this).find('.ts_results').hide();
			}
		})
		.on('-mouseleave', '.ts_tabview', function() {
			if ($(this).find('p.ts_result').length > 0) {
				$(this).find('#tsResults').show();
			}
		});



})(jQuery);
