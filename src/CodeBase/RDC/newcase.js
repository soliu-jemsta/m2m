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
var customWorkflowEngine;

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
	globalDefinitions.extendStages();

	AppRequest.itemId = $spcontext.getParameterByName("itemid", window.location.href);

	customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);
	globalDefinitions.SetWorkflowRouting(customWorkflowEngine);
	customWorkflowEngine.routeEngine(customWorkflowEngine).setCurrentUserAsInitiator();

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
		console.log("New Case page has finished loading!!!");
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
	

	// formData.Title = formData.ManagementRepEmail;

	// var dateCreatedCode = $spcontext.stringnifyDate({
	// 	includeTime: true,
	// 	timeSpace: false,
	// 	format: "dd-mm-yy",
	// });
	// formData.WorkflowRequestID = formData.NCReferenceID;
	// delete formData.DateCreated;
	formData.Year = $spcontext.serverDate().getFullYear();
	formData.Month = $spcontext.serverDate().getMonth();
	
	if ($spcontext.checkPassedValidation()) {
		// formData.Title = CurrentUserProperties.title;
		var people = PeoplePicker.getValue();
		var peopleEmail = PeoplePicker.getConfiguredValue();

		let adviserMail = peopleEmail.Adviser;
		formData.Client = people.Client;
		formData.Adviser = people.Adviser;

		formData.Title = MainApplication.clientDetails[peopleEmail.Client].Title;

		globalDefinitions.callLoader();
		// AppRequest.returned = AppRequest.requestDetails.ReturnForCorrection;

		customWorkflowEngine.updateStageByName({
			name: globalDefinitions.stageDefinitions.adviser,
			username: MainApplication.adviserDetails[adviserMail].Title,
			authenticationValue: adviserMail,
			emails: [adviserMail],
		});

		formData = customWorkflowEngine.routeEngine(customWorkflowEngine).requestHistoryHandler(formData, AppRequest.transactionHistory, { stage: "Author", action: "Case created" });
		formData = customWorkflowEngine.routeEngine(customWorkflowEngine).runRouting(formData);

		globalDefinitions.onActionCompleted();
		MainApplication.NewCaseComponent.proceedToList(formData, false);
	} else {
		globalDefinitions.HandlerError("", true);
		globalDefinitions.onActionFailed();
	}
};

MainApplication.NewCaseComponent.proceedToList = function (formData) {

	$spcontext.createItems([formData], configProperties.CASESLIST.setting, function (createdItemsProperties) {
		var itemID = createdItemsProperties[0].get_id();
		var updateObj = {};
		if (formData.ApplicationType === "MORTGAGE"){
			AppRequest.workflowID = configProperties.MORTGAGECODE.setting;
		} else if (formData.ApplicationType === "P4L"){
			AppRequest.workflowID = configProperties.P4LCODE.setting;
		} else {
			AppRequest.workflowID = configProperties.GICODE.setting;
		}
		updateObj.ID = itemID;
		
		// $("#idOnSuccess").html(updateObj.WorkflowRequestID);

		AppRequest.requestDetails = formData;
		AppRequest.requestDetails.WorkflowRequestID = updateObj.WorkflowRequestID;
	
		updateObj.Year = $spcontext.serverDate().getFullYear();
		updateObj.LastTimeItemModifiedByWorklow = $spcontext.serverDate();
		updateObj.SLA_COUNT_UPDATED = "No";

		updateObj.WorkflowRequestID = AppRequest.workflowID + updateObj.Year + "-" + itemID;

		$spcontext.updateItems([updateObj], configProperties.CASESLIST.setting, function () {
			globalDefinitions.HandlerSuccess(`Case created successfully`);
			// $spcontext.redirect("#/", false);
			// globalDefinitions.closeLoader();

			globalDefinitions.AuditLogManager_SaveLog({
				Action: `Created Case  ${AppRequest.requestDetails.WorkflowRequestID}`,
			});
			// });

			globalDefinitions.onActionCompleted();
			$spcontext.redirect("#/cases", false);
			globalDefinitions.closeLoader();

		});
	});

};
