loadSettingsComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenSettingsLoaded();
	} else {
		setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadSettingsComponent;
		}, 1000);
	}
};

function whenSettingsLoaded() {
	console.log("Settings Page Loaded successfully...");
}