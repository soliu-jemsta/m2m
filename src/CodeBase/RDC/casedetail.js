/**
 * Case Detail — loads CASESLIST by CaseID from #/case?itemId=...
 *
 * IMPORTANT:
 *  $spcontext.getItem success returns an SP.ListItemCollection, NOT a JS array.
 *  Use get_count() / getItemAtIndex() / getEnumerator(), never items[0] / items.length.
 */

loadCaseDetailComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenCaseDetailLoaded();
	} else {
		setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadCaseDetailComponent;
		}, 1000);
	}
};

MainApplication.CaseDetailComponent = MainApplication.CaseDetailComponent || {};

function whenCaseDetailLoaded() {
	globalDefinitions.callLoader();

	// getParameterByName is case-insensitive (speedpoint lowercases both)
	var caseId =
		$spcontext.getParameterByName("itemId", window.location.href) ||
		$spcontext.getParameterByName("itemid", window.location.href);

	if (!caseId) {
		// Second arg MUST be false when passing your own message string
		globalDefinitions.HandlerError("No case specified in the URL.", false);
		globalDefinitions.closeLoader();
		return;
	}

	var listName =
		(configProperties.CASESLIST && configProperties.CASESLIST.setting) ||
		"Cases";

	var caml =
		"<View><Query><Where>" +
		"<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" +
		caseId +
		"</Value></Eq>" +
		"</Where></Query></View>";

	$spcontext.getItem(
		listName,
		caml,
		function (itemCollection) {
			try {
				// itemCollection is SP.ListItemCollection
				var count =
					typeof itemCollection.get_count === "function"
						? itemCollection.get_count()
						: 0;

				if (!count) {
					globalDefinitions.HandlerError("Case not found: " + caseId, false);
					globalDefinitions.closeLoader();
					return;
				}

				var spItem = itemCollection.getItemAtIndex(0);
				var caseItem = mapSpItemToCase(spItem);

				console.log("[CaseDetail] loaded:", caseItem);
				MainApplication.CaseDetailComponent.currentCase = caseItem;

				var clientName = caseItem.ClientDisplay || "";
				var adviser = caseItem.AdviserDisplay || "";
				var stage = caseItem.CurrentStage || "Lead";

				var root = document.getElementById("caseDetailRoot");
				if (root) {
					root.setAttribute("data-case-id", caseItem.CaseID || caseId);
					root.setAttribute("data-case-list-id", String(caseItem.ID || ""));
					root.setAttribute("data-app-type", caseItem.ApplicationType || "");
					root.setAttribute("data-client", clientName);
					root.setAttribute("data-adviser", adviser);
					root.setAttribute("data-current-stage", stage);
				}

				$("#caseHeaderRef").text(caseItem.CaseID || caseId);
				$("#caseHeaderClient").text(clientName || "—");
				$("#caseHeaderStage").text(stage);

				if (window.CaseStageUI) {
					if (typeof CaseStageUI.fillStageSelect === "function") {
						CaseStageUI.fillStageSelect("case_next_stage", stage);
					}
					if (typeof CaseStageUI.renderKanban === "function") {
						CaseStageUI.renderKanban(caseItem.CaseID || caseId, "caseKanbanBoard", stage);
					}
				}

				globalDefinitions.closeLoader();
			} catch (e) {
				console.error("[CaseDetail] parse error:", e);
				globalDefinitions.HandlerError(
					"Could not read case data: " + (e.message || e),
					false
				);
				globalDefinitions.closeLoader();
			}
		},
		function (sender, args) {
			var msg =
				(args && args.get_message && args.get_message()) ||
				(args && args.message) ||
				"SharePoint query failed";
			console.error("[CaseDetail] getItem failed:", msg, args);
			// false → show our message; true would require $spcontext.errors[0]
			globalDefinitions.HandlerError("Could not load case: " + msg, false);
			globalDefinitions.closeLoader();
		}
	);
}

/**
 * SP.ListItem → plain object used by the UI
 */
function mapSpItemToCase(spItem) {
	function field(name) {
		try {
			return spItem.get_item(name);
		} catch (e) {
			return null;
		}
	}

	function personDisplay(val) {
		if (!val) return "";
		if (typeof val === "string") return val;
		try {
			if (val.get_lookupValue) return val.get_lookupValue() || "";
		} catch (e) {}
		try {
			if (val.get_title) return val.get_title() || "";
		} catch (e) {}
		if (val.Title) return val.Title;
		if (val.value) return val.value;
		return "";
	}

	var client = field("Client");
	var adviser = field("Adviser");
	var caseManager = field("CaseManager");

	return {
		ID: spItem.get_id(),
		CaseID: field("CaseID") || "",
		Title: field("Title") || "",
		ApplicationType: field("ApplicationType") || "",
		CurrentStage: field("CurrentStage") || field("Stage") || "Lead",
		Status: field("Status") || "Open",
		Client: client,
		ClientDisplay: personDisplay(client),
		Adviser: adviser,
		AdviserDisplay: personDisplay(adviser),
		CaseManager: caseManager,
		CaseManagerDisplay: personDisplay(caseManager),
		ModuleListName: field("ModuleListName") || "",
		ModuleItemID: field("ModuleItemID") || null,
		LastActionDate: field("LastActionDate") || field("Modified"),
		Notes: field("Notes") || "",
	};
}

MainApplication.CaseDetailComponent.advanceStage = function () {
	if (window.CaseStageUI && typeof CaseStageUI.advance === "function") {
		CaseStageUI.advance();
	} else {
		globalDefinitions.HandlerError("CaseStageUI is not loaded.", false);
	}
};