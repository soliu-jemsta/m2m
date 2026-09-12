loadCaseDetailComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenCaseDetailLoaded();
	} else {
		setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadCaseDetailComponent;
		}, 1000);
	}
};

function whenCaseDetailLoaded() {
	globalDefinitions.callLoader();

	var caseId = $spcontext.getParameterByName("itemid", window.location.href);
	if (!caseId) {
		globalDefinitions.HandlerError("No case specified.", true);
		globalDefinitions.closeLoader();
		return;
	}

	var caml =
		"<View><Query><Where>" +
		"<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" + caseId + "</Value></Eq>" +
		"</Where></Query></View>";

	$spcontext.getItem(configProperties.CASESLIST.setting, caml, function (items) {
		if (!items || !items.length) {
			globalDefinitions.HandlerError("Case not found: " + caseId, true);
			globalDefinitions.closeLoader();
			return;
		}

		var caseItem = items[0];
		console.log("[CaseDetail] loaded case item:", caseItem); // debug — confirm CurrentStage/Client/Adviser shape once, then remove
		MainApplication.CaseDetailComponent.currentCase = caseItem;

		var clientName = caseItem.Client && caseItem.Client.value ? caseItem.Client.value : (caseItem.Client || "");
		var adviser = caseItem.Adviser && caseItem.Adviser.value ? caseItem.Adviser.value : (caseItem.Adviser || "");
		var stage = caseItem.CurrentStage || "Lead";

		var root = document.getElementById("caseDetailRoot");
		root.setAttribute("data-case-id", caseItem.CaseID);
		root.setAttribute("data-case-list-id", caseItem.ID);
		root.setAttribute("data-app-type", caseItem.ApplicationType);
		root.setAttribute("data-client", clientName);
		root.setAttribute("data-adviser", adviser);
		root.setAttribute("data-current-stage", stage);

		$("#caseHeaderRef").text(caseItem.CaseID);
		$("#caseHeaderClient").text(clientName);
		$("#caseHeaderStage").text(stage);

		CaseStageUI.fillStageSelect("case_next_stage", stage);
		CaseStageUI.renderKanban(caseItem.CaseID, "caseKanbanBoard", stage);

		globalDefinitions.closeLoader();
	}, function (err) {
		globalDefinitions.HandlerError("Could not load case: " + err, true);
		globalDefinitions.closeLoader();
	});
}

MainApplication.CaseDetailComponent.advanceStage = function () {
	CaseStageUI.advance();
};