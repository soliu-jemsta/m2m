loadOnBoardComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenOnBoardDependeciesLoaded();
	} else {
		// setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadOnBoardComponent;
		// }, 1000);
	}
};

var AppRequest;
var customWorkflowEngine;

MainApplication.OnBoardComponent.ApplicationDetails = function () {
	this.url = window.location.href;
	this.itemId = null;
	this.mode = null;
	this.requestDetails = {};
	this.Attachments = [];
	this.FileUrls = {};
	this.FolderUrl = "";
	this.AttachmentLoader = {};
	this.messageTemplate = {};
	this.feedback = false;
	this.approverComments = "";
	this.transactionHistory = [];
	this.defaultStage = "AA0";
	this.returned = null;
	this.sectionArr = [];
	this.sections = {};
	this.finalrating = [];
	this.questionSetCounter = 0;
	this.groupProperties = {};
	this.hodName = "";
	this.hodEmail = "";
	this.selectedDivision = null;
	this.contactName = "";
	this.contactEmail = "";
};

function whenOnBoardDependeciesLoaded() {
	$spcontext.assignAttributes();
	// MainApplication.CurrentPageSubmitFunction = MainApplication.OnBoardComponent.confirmSubmit;
	AppRequest = new MainApplication.OnBoardComponent.ApplicationDetails();
	// globalDefinitions.extendStages();

	// AppRequest.itemId = $spcontext.getParameterByName("itemid", window.location.href);
	// AppRequest.mode = $spcontext.getParameterByName("mode", window.location.href);

	// customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);
	// globalDefinitions.SetWorkflowRouting(customWorkflowEngine);
	// customWorkflowEngine.routeEngine(customWorkflowEngine).setCurrentUserAsInitiator();
	console.log("Onboard loaded");
	  const select = document.getElementById("f-dept");
  select.innerHTML =
    MainApplication.Department.map(
      (dept) => `<option value="${dept.title}">${dept.title}</option>`,
    ).join("");

	if (!MainApplication.isAnAdmin){
		globalDefinitions.HandlerError("You are not authorized to access this page...");
        $spcontext.redirect("#/", false);
        globalDefinitions.closeLoader();
	}

}

// MainApplication.OnBoardComponent.selectDiv = function (div) {
//     ['am', 'ai'].forEach(function (d) {
//         $('#dopt-' + d).attr('class', 'div-opt');
//         $('#form-' + d).removeClass('open');
//     });

//     $('#success-bar').removeClass('open');

//     $('#dopt-' + div).addClass(div === 'am' ? 'sel-gold' : 'sel-teal');

//     var fc = $('#form-' + div);
//     fc.addClass('open');

//     setTimeout(function () {
//         fc[0].scrollIntoView({
//             behavior: 'smooth',
//             block: 'nearest'
//         });
//     }, 60);
// };

MainApplication.OnBoardComponent.selectDiv = function (div) {
    ['am', 'ai'].forEach(function (d) {
		$('#dopt-' + d).attr('class', 'div-opt');
        $('#form-' + d).removeClass('open');

        // Disable all inputs in inactive forms
        $('#form-' + d).find('[speed-bind-validate]').prop('disabled', true);
    });

	// $('#success-bar').removeClass('open');

    $('#dopt-' + div).addClass(div === 'am' ? 'sel-gold' : 'sel-teal');

    $('#form-' + div).addClass('open');

    // Enable only active form
    $('#form-' + div).find('[speed-bind-validate]').prop('disabled', false);
};

MainApplication.OnBoardComponent.resetDivSelection = function () {
    // Reset both options
    $('#dopt-am').removeClass('sel-gold sel-teal').addClass('div-opt');
    $('#dopt-ai').removeClass('sel-gold sel-teal').addClass('div-opt');

    // Close both forms
    $('#form-am, #form-ai').removeClass('open');

    // Disable all inputs in both forms
    $('#form-am, #form-ai').find('[speed-bind-validate]').prop('disabled', true);

    // Hide success bar
    // $('#success-bar').removeClass('open');
};

// Form submission processes
MainApplication.OnBoardComponent.confirmSubmit = function (action) {
	MainApplication.confirmAction = MainApplication.OnBoardComponent.actionConfirmed;
	$("#confirmModal").modal("show");
};

MainApplication.OnBoardComponent.actionConfirmed = function () {
	MainApplication.OnBoardComponent.saveDataToList();
};

MainApplication.OnBoardComponent.saveDataToList = function () {
	globalDefinitions.onActionClicked();
	if (AppRequest.selectedDivision === "Advanced Manufacturing") {
		var formData = $spcontext.bind({}, "AdvancedManufacturing");
	}
	if (AppRequest.selectedDivision === "Asset Integrity") {
		var formData = $spcontext.bind({}, "AssetIntegrity");
	}
	
	formData.RequestCreated = $spcontext.serverDate();
	formData.InitiatorLogin = CurrentUserProperties.email;
	formData.InitiatorEmailAddress = CurrentUserProperties.email;
	formData.InitiatorName = CurrentUserProperties.title;
	formData.Division = AppRequest.selectedDivision;
	formData.ContactName = AppRequest.contactName;
	formData.ContactEmail = AppRequest.contactEmail;
	formData.Title = formData.CustomerName;
	// formData.EmployeeShortName = CurrentUserProperties.shortName;
	// formData.EmployeeInitials = CurrentUserProperties.initials;
	// formData.CommitteeGroup = configProperties.CUSTOMERSERVICE.setting;
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
		// formData.EmployeeEmail = CurrentUserProperties.email;
		// formData.HOD = SP.FieldUserValue.fromUser(hodmail);

		globalDefinitions.callLoader();
		AppRequest.returned = AppRequest.requestDetails.ReturnForCorrection;

		// formData = customWorkflowEngine.routeEngine(customWorkflowEngine).requestHistoryHandler(formData, AppRequest.transactionHistory, { stage: "Author", action: "Idea Process has started" });
		// formData = customWorkflowEngine.routeEngine(customWorkflowEngine).runRouting(formData);

		if (AppRequest.returned === "Yes") {
			formData = customWorkflowEngine.routeEngine(customWorkflowEngine).requestHistoryHandler(formData, AppRequest.requestDetails.Transaction_History, { stage: "Initiator", action: "Idea Re-Submitted" });
			formData = customWorkflowEngine.routeEngine(customWorkflowEngine).runRouting(formData);
		}
		else {
			formData = customWorkflowEngine.routeEngine(customWorkflowEngine).requestHistoryHandler(formData, AppRequest.transactionHistory, { stage: "Initiator", action: "Idea Submitted" });
			formData = customWorkflowEngine.routeEngine(customWorkflowEngine).runRouting(formData);
		}
		globalDefinitions.onActionCompleted();
		MainApplication.OnBoardComponent.proceedToList(formData, false);
	} else {
		globalDefinitions.HandlerError("", true);
		globalDefinitions.onActionFailed();
	}
};

MainApplication.OnBoardComponent.proceedToList = function (formData) {

	var Attachments = $spcontext.grabAllAttachments();
	//used to grab all string links so that it can be updated.
	//mostly used when return for more information is part of the workflow process
	AppRequest.FileUrls = $spcontext.grabAllAttachmentsLinks();
	globalDefinitions.uploadAttachment($spcontext, Attachments, globalDefinitions.stageDefinitions.foldername, globalDefinitions.stageDefinitions.documentlib, function () {
		if (AppRequest.itemId == null) {
			$spcontext.createItems([formData], globalDefinitions.stageDefinitions.listname, function (createdItemsProperties) {
				var itemID = createdItemsProperties[0].get_id();
				var updateObj = {};
				updateObj.ID = itemID;
				updateObj.WorkflowRequestID = globalDefinitions.stageDefinitions.workflowcode + itemID;
				$("#idOnSuccess").html(updateObj.WorkflowRequestID);

				AppRequest.requestDetails = formData;
				AppRequest.requestDetails.WorkflowRequestID = updateObj.WorkflowRequestID;
				if (!jQuery.isEmptyObject(AppRequest.AttachmentLoader)) {
					updateObj.Attachment_Folder = AppRequest.AttachmentLoader.Attachmentfolder;
					updateObj.AttachmentURL = AppRequest.AttachmentLoader.Attachmentlinks;
				}
				updateObj.Year = $spcontext.serverDate().getFullYear();
				updateObj.LastTimeItemModifiedByWorklow = $spcontext.serverDate();
				updateObj.SLA_COUNT_UPDATED = "No";

				$spcontext.updateItems([updateObj], globalDefinitions.stageDefinitions.listname, function () {
					globalDefinitions.HandlerSuccess(`Request submitted successfully`);
					// $spcontext.redirect("#/", false);
					// globalDefinitions.closeLoader();

					globalDefinitions.AuditLogManager_SaveLog({
						Action: `Submitted Request for document  ${AppRequest.requestDetails.WorkflowRequestID}`,
					});
					// });

					globalDefinitions.onActionCompleted();
					AppRequest.transactionHistory = [];
					$spcontext.resetBind();
					// MainApplication.OnBoardComponent.clearAllAttachments("SupportingDocuments", "fu");
					// $spcontext.redirect("#/", false);
					globalDefinitions.closeLoader();
					$("#newSuccessModal").modal("show");
					MainApplication.OnBoardComponent.resetDivSelection();

				});
			});
		} else {
			formData.ID = AppRequest.requestDetails.ID;
			formData.AttachmentURL = JSON.stringify(AppRequest.FileUrls);

			$("#idOnSuccess").html(formData.WorkflowRequestID);
			$spcontext.updateItems([formData], globalDefinitions.stageDefinitions.listname, function () {
				if (AppRequest.requestDetails.ReturnForCorrection !== "Yes") {
					AppRequest.requestDetails.Current_Approver = formData.Current_Approver;
				}

				setTimeout(() => {
					globalDefinitions.closeLoader();
				}, 2000);
				globalDefinitions.HandlerSuccess("Request Modified & Submitted Successfully");

				globalDefinitions.AuditLogManager_SaveLog({
					Action: `submitted Request ${AppRequest.requestDetails.WorkflowRequestID}`
				});
				globalDefinitions.onActionCompleted();
				$spcontext.resetBind();
				$spcontext.redirect("#/", false);
				globalDefinitions.closeLoader();
				$("#newSuccessModal").modal("show");
				MainApplication.OnBoardComponent.resetDivSelection();
			});
		}
	});
};

MainApplication.OnBoardComponent.dateHandler = function () {
	const today = $spcontext.serverDate();

	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, "0");
	const dd = String(today.getDate()).padStart(2, "0");
	const todayStr = `${yyyy}-${mm}-${dd}`;

	// Set Request Date default to today
	// $('#requestDate').val(todayStr);
	// $('#requestDate').attr('readOnly', true);

	// Set Expected Date min to tomorrow
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);
	const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

	$("#expectedDate").attr("min", tomorrowStr);
};

MainApplication.OnBoardComponent.deleteRowAttachment = function (elementBindProperty, index, elementId) {

    const el = document.getElementById(elementId);

    let property =
        el.getAttribute("speed-file-validate") ||
        el.getAttribute("speed-file-bind");

    const fileStore = $spcontext.filesDictionary[property];

    if (!fileStore || !Array.isArray(fileStore.files)) return;

    // Remove file safely
    fileStore.files.splice(index, 1);

    // Clear input (important for re-uploading same file)
    $spcontext.clearFileInput(elementId);

    // Re-render UI
    MainApplication.OnBoardComponent.renderAttachments(
        elementBindProperty,
        property,
        elementId
    );
};

MainApplication.OnBoardComponent.clearAllAttachments = function (elementBindProperty, elementId) {

    const el = document.getElementById(elementId);

    let property =
        el.getAttribute("speed-file-validate") ||
        el.getAttribute("speed-file-bind");

    const fileStore = $spcontext.filesDictionary[property];

    if (!fileStore || !Array.isArray(fileStore.files)) return;

    // Drain the array the same way deleteRowAttachment does it (splice), 
    // but all at once instead of one by one
    fileStore.files.splice(0, fileStore.files.length);

    // Clear the actual file input
    $spcontext.clearFileInput(elementId);

    // Re-render UI (will render empty since files array is now empty)
    MainApplication.OnBoardComponent.renderAttachments(
        elementBindProperty,
        property,
        elementId
    );
};

MainApplication.OnBoardComponent.renderAttachments = function (elementBindProperty, property, elementId) {

    const container = $("div[speed-file-bind='" + elementBindProperty + "']");
    const files = $spcontext.filesDictionary[property]?.files || [];

    container.empty();

    files.forEach((file, index) => {

        let fileName, fileUrl = null;

        if (typeof file === "string") {
            fileUrl = file;
            fileName = file.split("/").pop();
        } else {
            fileName = file.dataName;
        }

        const $p = $("<p>", {
            id: `${elementBindProperty}display${index}`,
            css: { color: "#002c4d" }
        });

        if (fileUrl) {
            $("<a>", {
                href: fileUrl,
                text: fileName,
                target: "_blank"
            }).appendTo($p);
        } else {
            $p.text(fileName);
        }

        const $deleteBtn = $("<a>", {
            href: "#",
            text: " x",
            class: "attachment-inline-delete",
            "data-element": elementBindProperty,
            "data-index": index,
            "data-fileid": elementId,
            css: {
                color: "red",
                cursor: "pointer",
                paddingLeft: "5px"
            }
        });

        $p.append($deleteBtn);
        container.append($p);
    });
};

MainApplication.OnBoardComponent.recoverListData = function () {

	var query = $spcontext.camlBuilder([{
		rowlimit: 1
	},

	{
		operator: 'Eq',
		field: 'WorkflowRequestID',
		type: 'Text',
		val: AppRequest.itemId
	},
	{
		evaluator: "Or",
		operator: 'Eq',
		field: 'Approval_Status',
		type: 'Text',
		val: "Revise"
	},
	{
		evaluator: "Or",
		operator: 'Eq',
		field: 'Approval_Status',
		type: 'Text',
		val: "Declined"
	}
	]);

	var extraProperties = [
		"ID",
		"Title",
		"WorkflowRequestID",
		"Current_Approver",
		"Current_Approver_Code",
		"Approval_Status",
		"Created",
		"InitiatorEmailAddress",
		"InitiatorLogin",
		"Transaction_History",
		"ReturnForCorrection",
		"Modified",
		"PendingUserEmail",
		"PendingUserLogin",
		"Attachment_Folder",
		"AttachmentURL",
		"Author",
		"HOD",
		"EmployeeEmail",
		"Year",
		"Comment",
		"ImprovementArea",
		"Benefits",
		"RequestCreated",
		"OtherBenefits",
		"Points"
	];

	$spcontext.getListToControl(globalDefinitions.stageDefinitions.listname, query, extraProperties, function (listProperties) {
		if (!$.isEmptyObject(listProperties)) {
			if (listProperties.InitiatorEmailAddress.toLowerCase() !== CurrentUserProperties.email.toLowerCase()) {
				globalDefinitions.HandlerError("You are unauthorized to handle this audit... ");
				$spcontext.redirect("#/", false);
			}

			listProperties.RequestCreated = $spcontext.stringnifyDate({
				value: listProperties.RequestCreated
			});

			listProperties.Transaction_History = $spcontext.JSONToObject(listProperties.Transaction_History);
			listProperties.AttachmentURL = $spcontext.JSONToObject(listProperties.AttachmentURL, 'object');

			AppRequest.FolderUrl = listProperties.Attachment_Folder;
			AppRequest.FileUrls = $spcontext.deferenceObject(listProperties.AttachmentURL);

			for (var file in AppRequest.FileUrls) {
				$spcontext.filesDictionary[file] = { files: AppRequest.FileUrls[file] };
			}

			// MainApplication.populateDisabledMultiSelect("benefits", listProperties?.Benefits);
			// MainApplication.populateDisabledMultiSelect("improvementArea", listProperties?.ImprovementArea);

			listProperties.Benefits = MainApplication.normalizeMultiSelectData(listProperties.Benefits);
			const selectedBenefits = listProperties.Benefits || [];
			$('#benefits').val(selectedBenefits).trigger('change');

			listProperties.ImprovementArea = MainApplication.normalizeMultiSelectData(listProperties.ImprovementArea);
			const selectedImprovementArea = listProperties.ImprovementArea || [];
			$('#improvementArea').val(selectedImprovementArea).trigger('change');

			AppRequest.requestDetails = listProperties;



			$spcontext.htmlBind(listProperties);
			$spcontext.attachmentLinkBind(listProperties.AttachmentURL);

			globalDefinitions.closeLoader();
		}
		else {
			globalDefinitions.HandlerError("Request doesnt exist...");
			$spcontext.redirect("#/", false);
		}
	});
}

MainApplication.OnBoardComponent.getRandomItem = function (array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

MainApplication.OnBoardComponent.renderRandomHeader = function () {
    const container = document.getElementById('page-header');
    
    if (!container) {
        console.error('Container with id "page-header" not found');
        return;
    }

	const data = MainApplication.headlines || [];
    const randomItem = MainApplication.OnBoardComponent.getRandomItem(data);

    // Create the HTML structure
    const html = `
        <div>
            <h3>${randomItem.header}</h3>
            <p>${randomItem.subheader}</p>
        </div>
    `;

    container.innerHTML = html;
}