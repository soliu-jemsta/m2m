loadApproveRequestComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenApproveRequestDependeciesLoaded();
	} else {
		MainApplication.cachedState.pageStateCall = loadApproveRequestComponent;
	}
};

var AppRequest;
var customWorkflowEngine;

MainApplication.ApproveRequestComponent.ApplicationDetails = function () {
	this.url = window.location.href;
	this.itemId = null;
	this.requestDetails = {};
	this.Attachments = [];
	this.FileUrls = {};
	this.FolderUrl = "";
	this.AttachmentLoader = {};
	this.messageTemplate = {};
	this.feedback = false;
	this.approverComment = "";
	this.transactionHistory = [];
	this.defaultStage = "AA0";
	this.returned = false;
	this.messageType = "standard";
	this.documentsToUpdate = {};
	this.mode = null;
};

whenApproveRequestDependeciesLoaded = function () {
	// console.log("Approval page is working fine");
	// globalDefinitions.callLoader();
	// globalDefinitions.extendStages();
	$spcontext.assignAttributes();

	$spcontext.filesDictionary = {};

	AppRequest = new MainApplication.ApproveRequestComponent.ApplicationDetails();
	globalDefinitions.extendStages();
	customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);
	globalDefinitions.SetWorkflowRouting(customWorkflowEngine);
	AppRequest.itemId = $spcontext.getParameterByName("itemid", window.location.href);
	AppRequest.mode = $spcontext.getParameterByName("mode", window.location.href);

	$spcontext.filesDictionary = {};

	$spcontext.validationProperties.text.extend["Comment"] = function (field) {
		var passed = false;
		if ((field.trim() !== "" && (AppRequest.actionTaken === globalDefinitions.stageDefinitions.decline || AppRequest.actionTaken === globalDefinitions.stageDefinitions.correction || AppRequest.actionTaken === "Revise")) || AppRequest.actionTaken === globalDefinitions.stageDefinitions.approve)
			passed = true;
		return passed;
	};

	$("#implementationOwner")
		.empty()
		.append('<option value="" disabled selected>Select Division/Unit...</option>')
		.append(
			MainApplication.Divisions.map(dept =>
				`<option value="${dept}">${dept}</option>`
			).join('')
		);

	$('.star-row .star').on('click', function () {

		const $star = $(this);
		const $row = $star.closest('.star-row');
		const value = parseInt($star.data('v'));

		// fill stars
		$row.find('.star').each(function () {
			const v = parseInt($(this).data('v'));
			$(this).toggleClass('active text-yellow-400', v <= value)
				.toggleClass('text-gray-400', v > value);
		});

		// store value
		$row.attr('value', value);

		$row.closest('.impact-row').removeClass('border-red-500 bg-red-50');
	});

	// $(".star-row").each(function () {
	//     const field = $(this).data("field");
	//     const value = $(this).attr("data-value") || null;

	//     formData[field] = value;
	// });

	$spcontext.applyValidationEvents();
	MainApplication.ApproveRequestComponent.recoverListData();
	// setTimeout(function () {
	// 	globalDefinitions.closeLoader();
	// }, 2000);
};

MainApplication.ApproveRequestComponent.recoverListData = function () {
	if (AppRequest.itemId !== null && AppRequest.itemId !== "") {
		var query = vbContext.camlBuilder([
			{
				rowlimit: 1,
			},

			{
				operator: "Eq",
				field: "WorkflowRequestID",
				type: "Text",
				val: AppRequest.itemId,
			},
			{
				operator: 'Eq',
				field: 'Approval_Status',
				type: 'Text',
				val: globalDefinitions.stageDefinitions.pending
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
			"HODEmail",
			"ImprovementArea",
			"Benefits",
			"Points",
			"EmployeeName"
		];

		vbContext.getListToControl(globalDefinitions.stageDefinitions.listname, query, extraProperties, function (listProperties) {
			if ($.isEmptyObject(listProperties)) {
				MainApplication.notyf.error("Request is not pending approval...");
				$spcontext.redirect("#/", false);
				$(".overlay-loader").hide();
				globalDefinitions.closeLoader();
			} else {
				customWorkflowEngine.routeEngine(customWorkflowEngine).updateRoutesinFlow(listProperties, function (resolved) {
					customWorkflowEngine.routeEngine(customWorkflowEngine).PageSecurity(customWorkflowEngine.stages.securityModeTask, listProperties.Current_Approver, listProperties.Approval_Status, function (error) {
						// if (MainApplication.configuredTaskMembers[listProperties.Current_Approver].belongs) {

						if (typeof error === "undefined") {
							listProperties.Created = $spcontext.stringnifyDate({
								value: listProperties.Created,
							});

							listProperties.RequestCreated = $spcontext.stringnifyDate({
								value: listProperties.RequestCreated,
								includeTime: false,
								format: "dd/mm/yy"
							});

							listProperties.Transaction_History = $spcontext.JSONToObject(listProperties.Transaction_History);
							listProperties.AttachmentURL = $spcontext.JSONToObject(listProperties.AttachmentURL, "object");

							MainApplication.populateBadgeList("benefits", listProperties?.Benefits);
							MainApplication.populateBadgeList("improvementArea", listProperties?.ImprovementArea);

							AppRequest.FolderUrl = listProperties.Attachment_Folder;
							AppRequest.FileUrls = $spcontext.deferenceObject(listProperties.AttachmentURL);

							for (var file in AppRequest.FileUrls) {
								$spcontext.filesDictionary[file] = { files: AppRequest.FileUrls[file] };
							}

							if (listProperties.Approval_Status === "Pending"){
                                $(".idea-right").html(`<span class="badge badge-amber">⏳ Pending</span>`);
                            }else if (listProperties.Approval_Status === "Completed"){
                                $(".idea-right").html(`<span class="badge badge-green">✅ Approved</span>`);
                            }else if (listProperties.Approval_Status === "Declined"){
                                $(".idea-right").html(`<span class="badge badge-red">❌ Declined</span>`);
                            }else if (listProperties.Approval_Status === "Revise"){
                                $(".idea-right").html(`<span class="badge badge-blue">💬 Revise</span>`);
                            }
							
							// AppRequest.FileUrls = $spcontext.deferenceObject(listProperties.AttachmentURL);

							if (listProperties.Transaction_History.length !== 0) {
								$("#transaction-history").show();
								globalDefinitions.displayHistory(listProperties.Transaction_History);
							}

							// if (listProperties.Current_Approver !== "Employee" && listProperties.Current_Approver_Code !== "AA1") {
							// 	listProperties.Comment = "";
							// }
							// MainApplication.populateDisabledMultiSelect("benefits", listProperties?.Benefits);
							// MainApplication.populateDisabledMultiSelect("improvementArea", listProperties?.ImprovementArea);
							AppRequest.requestDetails = listProperties;

							$spcontext.htmlBind(listProperties);

							// if (AppRequest.requestDetails.Current_Approver !== 'Employee'){
							$spcontext.attachmentLinkBind(listProperties.AttachmentURL);
							// }

							// setTimeout(function () {
								// $(".overlay-loader").hide();
								$("#approvalloader").hide();
        						$("#page-approval").show();
							// 	globalDefinitions.closeLoader();
							// }, 2000);
						} else {
							globalDefinitions.HandlerError("You are not allowed to access this request");
							globalDefinitions.AuditLogManager_SaveLog({
								Action: `Unauthorized action on Voice Box ${listProperties.WorkflowRequestID}`,
								Message: "User is not allowed to act on this request",
							});
							setTimeout(function () {
								$(".overlay-loader").hide();
								globalDefinitions.closeLoader();
							}, 1000);
							$spcontext.redirect("#/", false);
						}

						// }
					}); //commented here
				}); //commented here
			}
		});
	} else {
		$(".overlay-loader").hide();
		globalDefinitions.closeLoader();
		MainApplication.notyf.error("Invalid Request...");
		$spcontext.redirect("#/", false);
	}
};

MainApplication.ApproveRequestComponent.confirmSubmit = function (actionTaken) {
	$("#confirmModal").modal("show");
	if (actionTaken === "Revise" || actionTaken === "Declined") {
		if (actionTaken === "Revise") {
			$("#approvercomment").removeAttr("speed-validate-msg");
			$("#approvercomment").attr("speed-validate-msg", "Please tell us what information you require");
		}

		if (actionTaken === "Declined") {
			$("#approvercomment").removeAttr("speed-validate-msg");
			$("#approvercomment").attr("speed-validate-msg", "Please tell us why you want to decline this idea!");
		}
		$("#targetCompletion, #implementationOwner").removeAttr("speed-bind-validate");
	} else {
		$("#targetCompletion").attr("speed-bind-validate", "TargetCompletion");
		$("#implementationOwner").attr("speed-bind-validate", "ImplementationOwner");
	}
	AppRequest.actionTaken = actionTaken;
	MainApplication.confirmAction = MainApplication.ApproveRequestComponent.actionConfirmed;
};

MainApplication.ApproveRequestComponent.actionConfirmed = function () {
	$("#confirmModal").modal("hide");
	MainApplication.ApproveRequestComponent.saveDataToList(AppRequest.actionTaken);
};

MainApplication.ApproveRequestComponent.saveDataToList = function (actionTaken) {
	globalDefinitions.onActionClicked();

	// if (actionTaken === "Approved") {
	var tempData = $spcontext.bind({});
	// }
	// if (actionTaken === "Declined" || actionTaken === "Revise") {
	// 	$('#implementationOwner, #targetCompletion')
	//     .removeAttr('speed-bind-validate')
	//     .removeAttr('speed-validate-msg')
	// 	.removeAttr('speed-bind-class');
	// }

	

	if ($spcontext.checkPassedValidation()) {
		if (actionTaken === "Approved") {
			var formData = $spcontext.bind({}, "ApprovalData");
		} else {
			var formData = {};
		}
		formData.ApprovalDate = $spcontext.serverDate();

		let kreedpoint = configProperties.APPROVALPOINT.setting || 0;
		kreedpoint = Number(kreedpoint);
		totalKreedPoint = kreedpoint + (AppRequest.requestDetails.Points || 0);

		if (actionTaken === "Approved") {
			if (!validateImpactAssessment()) {
				// e.preventDefault();
				return false;
			}
			formData.CustomerImpact = $('[data-field="CustomerImpact"]').attr('value');
			formData.OperationalImpact = $('[data-field="OperationalImpact"]').attr('value');
			formData.FinancialImpact = $('[data-field="FinancialImpact"]').attr('value');
			formData.StrategicAlignment = $('[data-field="StrategicAlignment"]').attr('value');
			formData.SafetyConsideration = $('[data-field="SafetyConsideration"]').attr('value');
			formData.ImplementationStatus = "Not Started";
			formData.OwnerHOD = MainApplication.divisionDetails[`${formData.ImplementationOwner}`]?.HODEmail || "";
			formData.OwnerDivisionEmail = MainApplication.newDivisionDetails[`${formData.ImplementationOwner}`]?.divisionEmail || "";
			formData.Points = totalKreedPoint;
		};
		AppRequest.comment = $("#approvercomment").val();
		formData.Comment = AppRequest.comment;

		var historyProp = {
			stage: AppRequest.requestDetails.Current_Approver,
			comment: AppRequest.comment,
			action: actionTaken,
		};

		formData = customWorkflowEngine.routeEngine(customWorkflowEngine).requestHistoryHandler(formData, AppRequest.requestDetails.Transaction_History, historyProp);

		if (actionTaken === "Approved" || actionTaken === "Declined") {
			formData = customWorkflowEngine.routeEngine(customWorkflowEngine).runRouting(formData, AppRequest.requestDetails.Current_Approver_Code, actionTaken);
		} else if (actionTaken === "Revise") {
			formData.Current_Approver = AppRequest.requestDetails.EmployeeName;
			formData.Current_Approver_Code = AppRequest.defaultStage;
			formData.PendingUserLogin = AppRequest.requestDetails.InitiatorEmailAddress;
			formData.PendingUserEmail = AppRequest.requestDetails.InitiatorEmailAddress;
			formData.Approval_Status = "Revise";
			formData.ReturnForCorrection = "Yes";
		}

		globalDefinitions.onActionCompleted();
		MainApplication.ApproveRequestComponent.proceedToList(formData);
	} else {
		globalDefinitions.HandlerError("", true);
		globalDefinitions.onActionFailed();
	}
};

MainApplication.ApproveRequestComponent.proceedToList = function (formData) {
	globalDefinitions.callLoader();

	formData.ID = AppRequest.requestDetails.ID;

	vbContext.updateItems([formData], globalDefinitions.stageDefinitions.listname, function () {
		// AppRequest.requestDetails.Current_Approver = formData.Current_Approver;
		globalDefinitions.closeLoader();
		globalDefinitions.HandlerSuccess(`You have successfully taken action on this request`);
		globalDefinitions.AuditLogManager_SaveLog({
			Action: `took action on this idea ${AppRequest.requestDetails.WorkflowRequestID}`,
		});
		MainApplication.pendingRequests();
		$spcontext.redirect("#/", false);

	});
	globalDefinitions.closeLoader();
};

function validateImpactAssessment() {
    const fields = [
        { name: 'Customer Impact', selector: '[data-field="CustomerImpact"]' },
        { name: 'Operational Impact', selector: '[data-field="OperationalImpact"]' },
        { name: 'Financial Impact', selector: '[data-field="FinancialImpact"]' },
        { name: 'Strategic Alignment', selector: '[data-field="StrategicAlignment"]' },
        { name: 'Safety Consideration', selector: '[data-field="SafetyConsideration"]' }
    ];

    let isValid = true;
    const missingFields = [];

    fields.forEach(field => {
        const value = $(field.selector).attr('value');
        
        // Check if value exists and is a valid number between 1-5
        if (!value || isNaN(parseInt(value)) || parseInt(value) < 1 || parseInt(value) > 5) {
            isValid = false;
            missingFields.push(field.name);
            
            // Optional: Highlight the missing row
            $(field.selector).closest('.impact-row').addClass('border-red-500 bg-red-50');
        } else {
            // Remove highlight if it was previously marked
            $(field.selector).closest('.impact-row').removeClass('border-red-500 bg-red-50');
        }
    });

    if (!isValid) {
        const message = `Please select a rating for:\n• ${missingFields.join('\n• ')}`;
        globalDefinitions.HandlerError(message);
        
        // Scroll to the first missing field
        const firstMissing = $(fields.find(f => missingFields.includes(f.name)).selector);
        if (firstMissing.length) {
            firstMissing[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}
