window.onload = onWindowLoad;
function onWindowLoad(event) {
	var searchField = document.querySelector('.searchField');
	var ui = {
		champions: document.querySelectorAll('.champs > .champ')
	};

	for(var i = 0, champion; champion = ui.champions[i]; i++) {
		champion.onclick = setChampionClick(champion.dataset.index);
	}

	searchField.oninput = onSearch;

	function setChampionClick(championIndex) {
		return onClick;

		function onClick(event) {
			console.log(champions[championIndex]);
		}
	}

	function onSearch(event) {
		var query = new RegExp('^' + event.target.value.toUpperCase());
		var championData;

		for(var i = 0, champion; champion = ui.champions[i]; i++) {
			championData = champions[chamption.dataset.index];
			if(championData.name.toUpperCase().match(query)) {
				champion.classList.remove('hidden');
			}
			else {
				champion.classList.add('hidden');
			}
		}
	}



}