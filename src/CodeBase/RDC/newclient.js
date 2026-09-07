loadNewClientComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenNewClientLoaded();
	} else {
		setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadNewClientComponent;
		}, 1000);
	}
};

var AppRequest;

MainApplication.NewClientComponent.ApplicationDetails = function () {
	this.url = window.location.href;
	this.itemId = null;
	this.mode = null;
	this.requestDetails = {};
	this.approverComments = "";
	this.transactionHistory = [];
	this.defaultStage = "AA0";
	this.returned = null;
	this.npsRating = null;
	this.csatRating = null;
	this.npsCategory = null;
	this.csatCategory = null;
};

function whenNewClientLoaded() {
	globalDefinitions.callLoader();
	$spcontext.assignAttributes();
  MainApplication.CurrentPageSubmitFunction = MainApplication.NewClientComponent.confirmSubmit;
  AppRequest = new MainApplication.NewClientComponent.ApplicationDetails();
//   globalDefinitions.extendStages();

  AppRequest.itemId = $spcontext.getParameterByName(
    "itemid",
    window.location.href,
  );
  AppRequest.mode = $spcontext.getParameterByName("mode", window.location.href);

//   customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);
//   globalDefinitions.SetWorkflowRouting(customWorkflowEngine);
//   customWorkflowEngine
//     .routeEngine(customWorkflowEngine)
//     .setCurrentUserAsInitiator();
  setTimeout(() => {
		globalDefinitions.closeLoader();
	}, 2000);
}

MainApplication.NewClientComponent.confirmSubmit = function (action) {
  AppRequest.action = action;
  MainApplication.confirmAction =
    MainApplication.NewClientComponent.actionConfirmed;
  $("#confirmModal").modal("show");
};

MainApplication.NewClientComponent.actionConfirmed = function () {
  MainApplication.NewClientComponent.saveDataToList();
};

MainApplication.NewClientComponent.saveDataToList = function () {
  globalDefinitions.onActionClicked();

  var formData = $spcontext.bind({});

  if ($spcontext.checkPassedValidation()) {
    formData.RequestCreated = $spcontext.serverDate();

    formData.Title = formData.FirstName + " " + formData.LastName;
	console.log("FormData: ", formData);
    MainApplication.NewClientComponent.proceedToList(formData);
  } else {
    globalDefinitions.HandlerError("", true);
    globalDefinitions.onActionFailed();
  }
};

MainApplication.NewClientComponent.proceedToList = function (formData) {
  if (AppRequest.itemId == null) {
    $spcontext.createItems(
      [formData],
      configProperties.CLIENTSLIST.setting,
      function (createdItemsProperties) {
        globalDefinitions.HandlerSuccess(`Client Saved Successfully`);
            //   MainApplication.NewClientComponent.resetFoodInspectionForm();
            
            globalDefinitions.closeLoader();

            globalDefinitions.AuditLogManager_SaveLog({
              Action: `Client created ${AppRequest.requestDetails.WorkflowRequestID}`,
            });
            // });
            globalDefinitions.onActionCompleted();
			$spcontext.redirect("#/clients", false);
      },
    );
  } else {
    formData.ID = AppRequest.requestDetails.ID;

    $spcontext.updateItems(
      [formData],
      configProperties.CLIENTSLIST.setting,
      function () {
        globalDefinitions.HandlerSuccess(`Client Updated Successfully`);
        //   MainApplication.NewClientComponent.resetFoodInspectionForm();
		$spcontext.resetBind();
        // $spcontext.redirect("#/", false);
        globalDefinitions.closeLoader();

        globalDefinitions.AuditLogManager_SaveLog({
          Action: `Client saved ${AppRequest.requestDetails.WorkflowRequestID}`,
        });
        // });

        globalDefinitions.onActionCompleted();
		whenNewRequestDependeciesLoaded();
      },
    );
  }
};