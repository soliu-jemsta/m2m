loadNewCaseComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenNewCaseLoaded();
	} else {
		setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadNewCaseComponent;
		}, 1000);
	}
};

var AppRequest;

MainApplication.NewCaseComponent.ApplicationDetails = function () {
	this.url = window.location.href;
	this.itemId = null;
	this.mode = null;
	this.requestDetails = {};
	this.approverComments = "";
	this.transactionHistory = [];
	this.defaultStage = "AA0";
	this.returned = null;
	this.workflowID = "";
};

function whenNewCaseLoaded() {
	console.log("New Case page is up!!!");
	globalDefinitions.callLoader();
	$spcontext.assignAttributes();
	MainApplication.CurrentPageSubmitFunction = MainApplication.NewCaseComponent.confirmSubmit;
	AppRequest = new MainApplication.NewCaseComponent.ApplicationDetails();
	// globalDefinitions.extendStages();

	AppRequest.itemId = $spcontext.getParameterByName("itemid", window.location.href);

	// customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);
	// globalDefinitions.SetWorkflowRouting(customWorkflowEngine);
	// customWorkflowEngine.routeEngine(customWorkflowEngine).setCurrentUserAsInitiator();

	const peopleData = {
		"Client": MainApplication.clientList,
		"Adviser": MainApplication.advisersList,
	};
	PeoplePicker.initializePeoplePickers(peopleData);

	if (window.DynamicMortgageForm && typeof window.DynamicMortgageForm.initDynamicMortgageForm === "function") {
		window.DynamicMortgageForm.initDynamicMortgageForm();
	} else {
		console.error("Dynamic mortgage form initializer is not available.");
	}
	
	setTimeout(() => {
		globalDefinitions.closeLoader();
	}, 2000);
}

// Form submission processes
MainApplication.NewCaseComponent.confirmSubmit = function (action) {
	MainApplication.confirmAction = MainApplication.NewCaseComponent.actionConfirmed;
	$("#confirmModal").modal("show");
};

MainApplication.NewCaseComponent.actionConfirmed = function () {
	MainApplication.NewCaseComponent.saveDataToList();
};

MainApplication.NewCaseComponent.saveDataToList = function () {
  globalDefinitions.onActionClicked();
  var formData = $spcontext.bind({});
  formData.RequestCreated = $spcontext.serverDate();
  formData.InitiatorLogin = CurrentUserProperties.email;
  formData.InitiatorEmailAddress = CurrentUserProperties.email;
  formData.InitiatorName = CurrentUserProperties.title;
  formData.Year = $spcontext.serverDate().getFullYear();
  formData.Month = $spcontext.serverDate().getMonth();

  if ($spcontext.checkPassedValidation()) {
    var people = PeoplePicker.getValue();
    var peopleEmail = PeoplePicker.getConfiguredValue();

    formData.Client = people.Client;
    formData.Adviser = people.Adviser;
    formData.Title = MainApplication.clientDetails[peopleEmail.Client].Title;

    // Optional: store CaseManager if you collect it on the form
    // formData.CaseManager = people.CaseManager;

    globalDefinitions.callLoader();
    globalDefinitions.onActionCompleted();
	console.log("FormData: ", formData);
    // No workflow engine routing — go straight to list write
    MainApplication.NewCaseComponent.proceedToList(formData);
  } else {
    globalDefinitions.HandlerError("", true);
    globalDefinitions.onActionFailed();
  }
};

// ─────────────────────────────────────────────────────────────
// REPLACE: MainApplication.NewCaseComponent.proceedToList
// ─────────────────────────────────────────────────────────────
MainApplication.NewCaseComponent.proceedToList = function (formData) {
  var listName;
  var codePrefix;

  if (formData.ApplicationType === "MORTGAGE") {
    listName = configProperties.MORTGAGECASELIST.setting;
    codePrefix = configProperties.MORTGAGECODE.setting; // e.g. "MB"
  } else if (formData.ApplicationType === "P4L") {
    listName = configProperties.P4LCASELIST.setting;
    codePrefix = configProperties.P4LCODE.setting; // e.g. "P4"
  } else {
    listName = configProperties.GILIST.setting;
    codePrefix = configProperties.GICODE.setting; // e.g. "GI"
  }

  $spcontext.createItems([formData], listName, function (createdItemsProperties) {
    var itemID = createdItemsProperties[0].get_id();
    var year = $spcontext.serverDate().getFullYear();
    var caseId = codePrefix + year + "-" + itemID; // e.g. MB2026-42 or MB-2026-000042 — match your existing format

    // Prefer zero-padded if you already use that style:
    // var caseId = codePrefix + "-" + year + "-" + String(itemID).padStart(6, "0");

    var updateObj = {
      ID: itemID,
      Year: year,
      LastTimeItemModifiedByWorklow: $spcontext.serverDate(), // keep field if it exists; harmless
      SLA_COUNT_UPDATED: "No",
      WorkflowRequestID: caseId
    };

    // Mirror into universal CASESLIST
    var mirrorData = {
      CaseID: caseId,
      ApplicationType: formData.ApplicationType,
      Client: formData.Client,
      Adviser: formData.Adviser,
      Title: formData.ApplicationType,
      Status: "Open",
      CurrentStage: "Lead", // <-- stage model starts here
      ModuleListName: listName,
      ModuleItemID: itemID,
      LastActionDate: $spcontext.serverDate()
    };

    // If CaseManager was captured on the form:
    // mirrorData.CaseManager = formData.CaseManager;

    $spcontext.createItems([mirrorData], configProperties.CASESLIST.setting, function (mirrorCreated) {
      var mirrorItemID = mirrorCreated[0].get_id();
      updateObj.CaseListID = mirrorItemID;

      $spcontext.updateItems([updateObj], listName, function () {
        // Create initial tasks for "Lead" stage
        var clientName = formData.Title;

        // peopleEmail is in outer scope from saveDataToList — if not, resolve again
        var adviserLogin =
          (typeof peopleEmail !== "undefined" && peopleEmail.Adviser) ||
          CurrentUserProperties.email;

        CaseTaskService.onNewCaseCreated(
          {
            CaseID: caseId,
            CaseListItemId: mirrorItemID,
            ApplicationType: formData.ApplicationType,
            Client: clientName,
            Adviser: formData.Adviser,
            AdviserName: adviserLogin,
            CaseManager: formData.CaseManager || formData.Adviser,
            Initiator: CurrentUserProperties.email,
            InitialStage: "Lead"
          },
          function (err) {
            if (err) {
              console.warn("Initial tasks creation warning:", err);
              // Case itself is already created — don't fail the whole flow
            }

            globalDefinitions.AuditLogManager_SaveLog({
              Action: "Created Case " + caseId
            });

            globalDefinitions.HandlerSuccess("Case created successfully");
            globalDefinitions.onActionCompleted();
            $spcontext.redirect("#/cases", false);
            globalDefinitions.closeLoader();
          }
        );
      });
    });
  });
};

/**
 * IMPORTANT — whenNewCaseLoaded()
 * -------------------------------
 * Remove or comment out the WorkflowEngine bootstrap:
 *
 *   // customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);
 *   // globalDefinitions.SetWorkflowRouting(customWorkflowEngine);
 *   // customWorkflowEngine.routeEngine(customWorkflowEngine).setCurrentUserAsInitiator();
 *
 * Keep:
 *   - PeoplePicker.initializePeoplePickers
 *   - DynamicMortgageForm.initDynamicMortgageForm
 *   - globalDefinitions.extendStages()  ← only if something else still needs it; otherwise remove
 */
