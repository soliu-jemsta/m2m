loadViewRequestComponent = function () {
    if (MainApplication.cachedState.mode) {
		whenViewRequestDependeciesLoaded();
	}else{
        MainApplication.cachedState.pageStateCall = loadViewRequestComponent;
    }
};



var AppRequest;
var customWorkflowEngine;

MainApplication.ViewRequestComponent.ApplicationDetails = function () {
    this.url = window.location.href;
    this.itemId = null;
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
    this.returned = false;
    this.messageType = "standard";
    this.documentsToUpdate = {};
    this.mode = null;
}

whenViewRequestDependeciesLoaded = function () {
    // globalDefinitions.callLoader();
    globalDefinitions.extendStages();
    $spcontext.assignAttributes();

    $spcontext.filesDictionary = {};
    
    AppRequest = new MainApplication.ViewRequestComponent.ApplicationDetails();
    globalDefinitions.extendStages();
    customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);
    globalDefinitions.SetWorkflowRouting(customWorkflowEngine);
    AppRequest.itemId = $spcontext.getParameterByName("itemid", window.location.href);
    AppRequest.mode = $spcontext.getParameterByName("mode", window.location.href);

    $spcontext.filesDictionary = {};

    $spcontext.appliedEvents.attachments = [];
    $spcontext.applyAttachmentEvent({
        o365: true,
        appendFiles: true,
        cancelClear: false,
    }, function (elementName, listOfFiles, fileId) {
        $("div[speed-file-bind='" + elementName + "']").empty();

        if (listOfFiles.files.length !== 0) {
            for (var y = 0; y < listOfFiles.files.length; y++) {
                if (typeof listOfFiles.files[y] === "string") {
                    var splitedLinks = listOfFiles.files[y].split("/");
                    var pos = splitedLinks.length - 1;
                    displayName = splitedLinks[pos];
                    var attachmentBlock = "<p id='" + elementName + "display" + y + "' style='color : #002c4d'><a href='" + listOfFiles.files[y] + "'>" + displayName + "<span><a style='color: red; cursor: pointer; padding-left: 5px' class='attachment-inline-delete' onclick='MainApplication.WorkflowsComponent.BPMS.Onboarding.ApproveRequest.deleteRowAttachment(\"" + elementName + "\", " + y + ",\"" + fileId + "\")'>x</a></span></a></p>";
                    $("div[speed-file-bind='" + elementName + "']").append(attachmentBlock);
                } else {
                    var attachmentBlock = "<p id='" + elementName + "display" + y + "' style='color : #002c4d'>" + listOfFiles.files[y].dataName +
                        "<span><a class='attachment-inline-delete' style='color: red; cursor: pointer; padding-left: 5px' onclick='MainApplication.WorkflowsComponent.BPMS.ProcessInitiation.NewRequest.deleteRowAttachment(\"" + elementName + "\", " + y + ",\"" + fileId + "\")'>x</a></span></p>";
                    $("div[speed-file-bind='" + elementName + "']").append(attachmentBlock);
                }
            }
        }
    }, function (errors) {
        globalDefinitions.HandlerError(errors.msg, false);
    });

    $spcontext.applyValidationEvents();
    // MainApplication.ViewRequestComponent.displayManagementDetails();
    MainApplication.ViewRequestComponent.recoverListData();
    // setTimeout(function () {
    //     // $(".overlay-loader").hide();
    //     // globalDefinitions.closeLoader();
    //     $("#approvalloader").hide();
    //     $("#page-approval").show();
    // }, 2000);
};


MainApplication.ViewRequestComponent.recoverListData = function() {
    
    if (AppRequest.itemId !== null && AppRequest.itemId !== "") {

        var query = vbContext.camlBuilder([{
            rowlimit: 1
        },

            {
                operator: 'Eq',
                field: 'WorkflowRequestID',
                type: 'Text',
                val: AppRequest.itemId
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
            "Benefits",
            "ImprovementArea",
            "CustomerImpact",
            "OperationalImpact",
            "FinancialImpact",
            "StrategicAlignment",
            "SafetyConsideration",
		];

        vbContext.getListToControl(globalDefinitions.stageDefinitions.listname, query, extraProperties, function (listProperties) {
            if ($.isEmptyObject(listProperties)) {
                MainApplication.notyf.error("Request does not exist...");
                $spcontext.redirect("#/", false);
                globalDefinitions.closeLoader();
                
            }
            else {
                customWorkflowEngine.routeEngine(customWorkflowEngine).updateRoutesinFlow(listProperties, function (resolved) {
                    customWorkflowEngine.routeEngine(customWorkflowEngine).
                    PageSecurity(customWorkflowEngine.stages.securityModeView, listProperties.Current_Approver, listProperties.Approval_Status, function (error) {

                        // if (MainApplication.configuredTaskMembers[listProperties.Current_Approver].belongs) {
                        if (typeof error === "undefined") {
                            
                            listProperties.Created = $spcontext.stringnifyDate({
                                value: listProperties.Created
                            });

                            listProperties.RequestCreated = $spcontext.stringnifyDate({
                                value: listProperties.RequestCreated,
                                includeTime: false,
                                format : "dd/mm/yy"
                            });

                            listProperties.ApprovalDate = $spcontext.stringnifyDate({
                                value: listProperties.ApprovalDate,
                                includeTime: false,
                                format : "dd/mm/yy"
                            });

                            listProperties.TargetCompletion = $spcontext.stringnifyDate({
                                value: listProperties.TargetCompletion,
                                includeTime: false,
                                format : "dd/mm/yy"
                            });
                            

                            listProperties.Transaction_History = $spcontext.JSONToObject(listProperties.Transaction_History);
                            listProperties.AttachmentURL = $spcontext.JSONToObject(listProperties.AttachmentURL, 'object');

                            AppRequest.FolderUrl = listProperties.Attachment_Folder;
                            AppRequest.FileUrls = $spcontext.deferenceObject(listProperties.AttachmentURL);

                            for(var file in AppRequest.FileUrls) {
                                $spcontext.filesDictionary[file] = { files : AppRequest.FileUrls[file]};
                            }


                            // AppRequest.FileUrls = $spcontext.deferenceObject(listProperties.AttachmentURL);

                            if (listProperties.Transaction_History.length !== 0) {
                                $("#transaction-history").show();
                                globalDefinitions.displayHistory(listProperties.Transaction_History);
                            }

                            // if (listProperties.OtherBenefits) {
                            //     $("#otherBenefitContainer").removeClass("hidden");
                            // }

                            // MainApplication.populateDisabledMultiSelect("benefits", listProperties?.Benefits);
                            // MainApplication.populateDisabledMultiSelect("improvementArea", listProperties?.ImprovementArea);
                            // MainApplication.normalizeMultiSelectData(listProperties?.Benefits);
                            // MainApplication.normalizeMultiSelectData(listProperties?.ImprovementArea);

                            MainApplication.populateBadgeList("benefits", listProperties?.Benefits);
                            MainApplication.populateBadgeList("improvementArea", listProperties?.ImprovementArea);

                            const existingData = {
                                CustomerImpact: listProperties.CustomerImpact,
                                OperationalImpact: listProperties.OperationalImpact,
                                FinancialImpact: listProperties.FinancialImpact,
                                StrategicAlignment: listProperties.StrategicAlignment,
                                SafetyConsideration: listProperties.SafetyConsideration
                            };

                            MainApplication.ViewRequestComponent.populateStarRatings(existingData);

                            if (listProperties.Approval_Status === "Pending"){
                                $(".idea-right").html(`<span class="badge badge-amber">⏳ Pending</span>`);
                            }else if (listProperties.Approval_Status === "Completed"){
                                $(".idea-right").html(`<span class="badge badge-green">✅ Approved</span>`);
                            }else if (listProperties.Approval_Status === "Declined"){
                                $(".idea-right").html(`<span class="badge badge-red">❌ Declined</span>`);
                            }else if (listProperties.Approval_Status === "Revise"){
                                $(".idea-right").html(`<span class="badge badge-blue">💬 Revise</span>`);
                            }

                            if (AppRequest.mode === "updatestatus") {
                                // $("#implementationStatus").removeClass("hidden");
                                // $("#implementationStatus").addClass("grid");
                                $("#statusSelect").prop("disabled", false);
                                $(".update-button").removeClass("hidden");
                                $("#reviewerSection").removeClass("hidden");
                                if (listProperties.ImplementationStatus === "Completed") {
                                    $("#statusSelect").prop("disabled", true);
                                    $(".update-button").addClass("hidden");
                                }
                            }
                            AppRequest.requestDetails = listProperties;
                                                        

                            
                            $spcontext.htmlBind(listProperties);
                            $spcontext.attachmentLinkBind(listProperties.AttachmentURL);
                            // globalDefinitions.closeLoader();
                            $("#approvalloader").hide();
        					$("#page-approval").show();
                            
                        } else {
                            globalDefinitions.HandlerError("You are not allowed to access this request");
                            globalDefinitions.AuditLogManager_SaveLog({
                                Action: `Unauthorized action on Voice Box ${listProperties.WorkflowRequestID}`,
                                Message: "User is not allowed to act on this request"
                            });
                            setTimeout(function () {
                                globalDefinitions.closeLoader();
                            }, 1000);
                            $spcontext.redirect("#/", false);
                        }
                    }); //commented here
                    
                }); //commented here
            }
        });
    } else {
        globalDefinitions.closeLoader();
        MainApplication.notyf.error("Invalid Request...");
        $spcontext.redirect("#/", false);
    }
}

MainApplication.ViewRequestComponent.updateStatus = function () {
    globalDefinitions.callLoader();
    var formData = {};
    formData.ImplementationStatus = $("#statusSelect").val();
    formData.ID = AppRequest.requestDetails.ID;
    var historyProp = {
        stage: "Admin",
        comment: AppRequest.comment,
        action: "Status Updated",
    };

    formData = customWorkflowEngine.routeEngine(customWorkflowEngine).requestHistoryHandler(formData, AppRequest.requestDetails.Transaction_History, historyProp);

    vbContext.updateItems([formData], globalDefinitions.stageDefinitions.listname, function () {
        // AppRequest.requestDetails.Current_Approver = formData.Current_Approver;
        globalDefinitions.closeLoader();
        $("#currentStatus").val(formData.ImplementationStatus);
        if (formData.ImplementationStatus === "Completed") {
            $("#statusSelect").prop("disabled", true);
        }
        globalDefinitions.HandlerSuccess(`You have successfully updated the status of this idea implementation`);
        globalDefinitions.AuditLogManager_SaveLog({
            Action: `took action on the idea status update ${AppRequest.requestDetails.WorkflowRequestID}`,
        });
    });		
    globalDefinitions.closeLoader();
    
}


MainApplication.ViewRequestComponent.populateStarRatings = function (data) {
    $('.star-row').each(function () {
        const $row = $(this);
        const field = $row.data('field');

        if (data[field] != null) {
            const value = parseInt(data[field]);

            // fill stars (same logic as click handler)
            $row.find('.star').each(function () {
                const v = parseInt($(this).data('v'));

                $(this)
                    .toggleClass('active text-yellow-400', v <= value)
                    .toggleClass('text-gray-400', v > value);
            });

            // store value
            $row.attr('value', value);
        }
    });
}