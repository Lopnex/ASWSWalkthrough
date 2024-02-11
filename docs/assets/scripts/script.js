(function($) {
	$(function() {
		// Get sections with new content
		let newSections = {};
		$('#menu').find('.wt-link').each(function() {
			let menuLink = $(this),
				sectionId = $(this).data('target'),
				newInSection = $('[class*="new-"]', $('#' + sectionId));
			
			newInSection.each(function() {
				versionNo = this.className.match(/(?<=new-)\d+\-\d+\-\d+\-\d+/);
				if(versionNo === null || typeof versionNo[0] == 'undefined') {
					console.log('Invalid new class', this);
					return true;
				}
				
				if(typeof newSections[versionNo] == "undefined") {
					newSections[versionNo] = [];
				}
				
				if(newSections[versionNo].indexOf(sectionId) == -1) {
					newSections[versionNo].push(sectionId);
					
					menuLink.addClass('new-' + versionNo);
				}
			});
		});
		
		// Derive latest version
		let versions = Object.keys(newSections),
			latestVersion = null;
			
		if(versions.length > 0) {
			versions.sort(function(aItem, bItem) {
				let a = aItem.match(/(\d+)\-(\d+)\-(\d+)\-(\d+)/),
					b = bItem.match(/(\d+)\-(\d+)\-(\d+)\-(\d+)/);
					
				for(let i = 1; i <= 4; i++) {
					if(parseInt(a[i]) > parseInt(b[i])) {
						return -1;
					} else if(parseInt(a[i]) < parseInt(b[i])) {
						return 1;
					}
				}
				
				return 0;
			});
			
			latestVersion = versions[0];
			$('#latest-version').text(latestVersion.replace(/\-/g, '.'));
		}
		
		// Process hidden sections cookie (if set)
		let hidden = Cookies.get('wt-hidden');
		if(typeof hidden == 'undefined') {
			hidden = {};
		} else {
			hidden = JSON.parse(hidden);
		}
		
		let hiddenKeys = Object.keys(hidden),
			i = 0;
		
		hiddenLoop:
		while(i < hiddenKeys.length) {
			let section = hiddenKeys[i],
				hiddenVersion = hidden[hiddenKeys[i]];
				
			hiddenVersionIdx = versions.indexOf(hiddenVersion);
			
			if(hiddenVersionIdx > 0) {
				for(let x = hiddenVersionIdx - 1; x >= 0; x--) {
					if(newSections[versions[x]].indexOf(section) != -1) {
						delete hidden[section];
						hiddenKeys.splice(i, 1);
						continue hiddenLoop;
					}
				}
			}
			
			i++;
		}
		
		for(i = 0; i < hiddenKeys.length; i++) {
			let menuItem = $('#menu [data-target="' + hiddenKeys[i] + '"]');
			menuItem.parent().hide();
			$('#hidden-section-list').append([
				'<tr>',
					'<td>' + menuItem.text() + '</td>',
					'<td>' + hidden[hiddenKeys[i]].replace(/\-/g, '.') + '</td>',
					'<td><span class="toggle-hidden" data-unhide="' + hiddenKeys[i] + '">Unhide</span></td>',
				'</tr>'
			].join(''));
		}
		
		// Jump between sections
		let currentSection = null;
		$('#main').on('click', '.wt-link', function(event) {
			event.preventDefault();
			
			let target = $(this).data('target');
			$('#menu .active').toggleClass('active', false);
			currentSection = target;
			
			if(target == 'hidden-sections') {
				$('#title').text('Manage Hidden Sections');
			} else {
				let menuLink = $('#menu .wt-link[data-target="' + target + '"]');
				menuLink.toggleClass('active', true);
				$('#title').text(menuLink.text());
			}
				
			if(['wt-info', 'hidden-sections'].indexOf(target) == -1) {
				$('#title').append('<span class="toggle-hidden">' + (hiddenKeys.indexOf(target) == -1 ? 'Hide' : 'Unhide') + '</span>');
			}
			
			$('#wt-body > div:visible').hide();
			$('#' + $(this).data('target')).show();
			$('#wt-body').scrollTop(0);
			
			return false;
		});
		$('#menu').find('.wt-link:first').trigger('click');
		
		// Hide section functionality
		$('#title').on('click', '.toggle-hidden', function(event) {
			event.preventDefault();
			
			hiddenIdx = hiddenKeys.indexOf(currentSection);
			if(hiddenIdx == -1) {
				hiddenKeys.push(currentSection);
				hidden[currentSection] = latestVersion;
				$(this).text('Unhide');
				
				let menuItem = $('#menu [data-target="' + currentSection + '"]');
				menuItem.parent().hide();
				$('#hidden-section-list').append([
					'<tr>',
						'<td>' + menuItem.text() + '</td>',
						'<td>' + hidden[hiddenKeys[i]].replace(/\-/g, '.') + '</td>',
						'<td><span class="toggle-hidden" data-unhide="' + hiddenKeys[i] + '">Unhide</span></td>',
					'</tr>'
				].join(''));
			} else {
				hiddenKeys.splice(hiddenIdx, 1);
				delete hidden[currentSection];
				$(this).text('Hide');
				$('#menu [data-target="' + currentSection + '"]').parent().show();
				$('#hidden-section-list').find('[data-unhide="' + currentSection + '"]').closest('tr').remove();
			}
			
			Cookies.set('wt-hidden', JSON.stringify(hidden), {expires: 365});
			
			return false;
		});
		
		// Unhide via Manage Hidden Sections
		$('#hidden-section-list').on('click', '.toggle-hidden', function(event) {
			event.preventDefault();
		
			let section = $(this).data('unhide'),
				hiddenIdx = hiddenKeys.indexOf(section);
			
			if(hiddenIdx != -1) {
				hiddenKeys.splice(hiddenIdx, 1);
				delete hidden[section];
				Cookies.set('wt-hidden', JSON.stringify(hidden), {expires: 365});
			}
			
			$('#menu [data-target="' + section + '"]').parent().show();
			$(this).closest('tr').remove();
		
			return false;
		});
		
		// Highlight section functionality
		let highlightStyle = $('<style>');
		highlightStyle.appendTo('head');
		
		$('#highlight-menu').on('click', '.highlight-link', function(event) {
			event.preventDefault();
			
			if($(this).hasClass('active')) {
				return false;
			}
			
			$('#highlight-menu .active').toggleClass('active', false);
			$(this).toggleClass('active', true);
			
			if($(this).data('highlight') == 'none') {
				highlightStyle.text('');
			} else {
				highlightStyle.text('.new-' + $(this).data('highlight') + ' { color: rgb(100, 255, 150); }');
			}
			
			return false;
		});
		
		// Build highlight section
		for(let i = 0; i < versions.length; i++) {
			$('#highlight-menu ul:first').append('<li><span class="highlight-link" data-highlight="' + versions[i] + '">New in ' + versions[i].replace(/\-/g, '.') + '</span></li>');
		}
		
		if(versions.length == 0) {
			$('#highlight-menu .highlight-link:first').trigger('click');
		} else {
			$('#highlight-menu .highlight-link[data-highlight="' + versions[0] + '"]').trigger('click');
		}
	});
})(jQuery);