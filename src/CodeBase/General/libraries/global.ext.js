GlobalDefinitionsManager.prototype.extendStages = function () {
    this.stageDefinitions.workflow = configProperties.WORKFLOWNAME.setting;
    // this.stageDefinitions.listname = configProperties.NCMANAGEMENTLIST.setting;
    // this.stageDefinitions.workflowcode = "AUDMGT-";

    this.stageDefinitions.author = "Author";
    this.stageDefinitions.management = configProperties.MANAGEMENT.setting;
    this.stageDefinitions.admin = configProperties.REPORTADMIN.setting;

    this.stageDefinitions.employee = "Employee";
    // this.stageDefinitions.hod = "HOD";
    // this.stageDefinitions.hodGroup = configProperties.HOD.setting;
    // this.stageDefinitions.otherauditors = "OtherAuditors";
    // this.stageDefinitions.auditees = "Auditees";
};


GlobalDefinitionsManager.prototype.SetWorkflowRouting = function (customWorkflowEngine) {
    customWorkflowEngine.routingGroups = [
        //===============first level approver routes ===========
        {
            code: "AA0",
            initiationCode: "AAA",
            possibleRoutes: [{
                name: globalDefinitions.stageDefinitions.author,
                username: "",
                condition: true,
                authenticationType: customWorkflowEngine.stages.user,
                authenticationValue: null,
                actionType: "Actor",
                emails: [],
                doa: false,
                flow: globalDefinitions.stageDefinitions.normalflow,
                users: []
            }]
        },                
        {
            code: "AA1",
            initiationCode: "AA0",            
            possibleRoutes: [{
                name: globalDefinitions.stageDefinitions.employee,
                username: "",
                condition: true,
                authenticationType: customWorkflowEngine.stages.user,
                authenticationValue: null,
                actionType: "Actor",
                emails: [],
                doa: false,
                flow: globalDefinitions.stageDefinitions.normalflow,
                users: []
            }]
        }
        // {
        //     code: "AA2",
        //     initiationCode: "AA1",            
        //     possibleRoutes: [{
        //         name: globalDefinitions.stageDefinitions.management,
        //         username: "",
        //         condition: true,
        //         authenticationType: customWorkflowEngine.stages.group,
        //         authenticationValue: null,
        //         actionType: "Actor",
        //         emails: [],
        //         doa: false,
        //         flow: globalDefinitions.stageDefinitions.normalflow,
        //         users: []
        //     }]
        // },
        // {
        //     code: "AA3",
        //     initiationCode: "AA2",            
        //     possibleRoutes: [{
        //         name: globalDefinitions.stageDefinitions.ceo,
        //         username: "",
        //         condition: true,
        //         authenticationType: customWorkflowEngine.stages.group,
        //         authenticationValue: null,
        //         actionType: "Actor",
        //         emails: [],
        //         doa: false,
        //         flow: globalDefinitions.stageDefinitions.normalflow,
        //         users: []
        //     }]
        // }        
    ];
}

GlobalDefinitionsManager.prototype.EmailSetup = function (customWorkflowEngine, requestProperties, callback) {
    var body = "";
    var from = configProperties.EMAILFROM.setting;
    var subject = configProperties.EMAILSUBJECT.setting;
    //Change Request name
    var toRequester = [requestProperties.requestDetails.InitiatorEmailAddress];
    var cc = [];
    if (customWorkflowEngine.stages.emailAction == globalDefinitions.stageDefinitions.completed) {
        //send only mail to requester
        var mailTemplate = customWorkflowEngine.stages.emailAction;
        if(requestProperties.requestDetails.AccountState === "Rapid"){
            mailTemplate = "RapidCompleted";
        }

        body = globalDefinitions.templateReplacement(mailTemplate, requestProperties.requestDetails, MainApplication.messageTemplate);
        subject += " Completed";
        to = toRequester;

        if(requestProperties.requestDetails.AccountState === "Rapid"){
            var tofeedback = [configProperties.CUSTOMERSERVICEMAIL.setting, requestProperties.requestDetails.GroupHead.email];

            var feedbackbody = globalDefinitions.templateReplacement("Regularization", requestProperties.requestDetails, MainApplication.messageTemplate);
            if (feedbackbody !== "" && toRequester.length > 0)
                globalDefinitions.sendSPMail(tofeedback, feedbackbody, [], subject, from, function () {});
        }

    } else if (customWorkflowEngine.stages.emailAction == globalDefinitions.stageDefinitions.decline) {
        //send only mail to requester
        body = globalDefinitions.templateReplacement(customWorkflowEngine.stages.emailAction, requestProperties.requestDetails, MainApplication.messageTemplate);
        subject += " Declined";
        to = toRequester;
    } else if (customWorkflowEngine.stages.emailAction == globalDefinitions.stageDefinitions.correction) {
        //send only mail to requester
        body = globalDefinitions.templateReplacement(customWorkflowEngine.stages.emailAction, requestProperties.requestDetails, MainApplication.messageTemplate);
        to = toRequester;
    } else {
        //send mail to approver and requester
        var stageObject = customWorkflowEngine.getStagebyName(requestProperties.requestDetails.Current_Approver);
        if(requestProperties.requestDetails.Current_Approver === globalDefinitions.stageDefinitions.customerservice){
            to = [configProperties.CUSTOMERSERVICEMAIL.setting]
        }
        else if(requestProperties.requestDetails.Current_Approver === globalDefinitions.stageDefinitions.compliance){
            to = [configProperties.COMPLIANCEEMAIL.setting]
        }
        else{
            to = stageObject.emails;
        }
        
        body = globalDefinitions.templateReplacement(requestProperties.requestDetails.Current_Approver, requestProperties.requestDetails, MainApplication.messageTemplate);

        //requester feedback
        if (requestProperties.feedback) {
            var tofeedback = [requestProperties.requestDetails.InitiatorEmailAddress];
            var feedbackbody = globalDefinitions.templateReplacement("Feedback", requestProperties.requestDetails, MainApplication.messageTemplate);
            if (feedbackbody !== "" && toRequester.length > 0)
                globalDefinitions.sendSPMail(tofeedback, feedbackbody, [], subject, from, function () {});
        }
    }

    if (body !== "" && to.length > 0) {
        globalDefinitions.sendSPMail(to, body, cc, subject, from, function () {
            setTimeout(function () {
                callback();
            }, 1500);
        });
    } else {
        callback();
    }
}

GlobalDefinitionsManager.prototype.templateReplacement = function (templateStage, requestProperties, template) {

    var approvalLink = configProperties.EMAILURL.setting + `#/${AppRequest.messageType}approveindividual?itemId=${requestProperties.WorkflowRequestID}`;
    var viewLink = configProperties.EMAILURL.setting + `#/${AppRequest.messageType}viewindividual?itemId=${requestProperties.WorkflowRequestID}`;
    var moreLink = configProperties.EMAILURL.setting + `#/${AppRequest.messageType}accindividual?itemId=${requestProperties.WorkflowRequestID}`;

    //var pdfLink = configProperties.RootURL.setting + AppRequest.PDFReportUrl;
    var currentApprovalLink = "Here";
    var currentViewLink = "Here";
    var reportLink = "Here";

    var appResult = currentApprovalLink.link(approvalLink);
    var viewResult = currentViewLink.link(viewLink);
    var moreResult = currentApprovalLink.link(moreLink);
    //var pdfResult = reportLink.link(pdfLink);

    /**===========Main Replacement Engine ==============*/
    var messagebody = template[templateStage];
    for (var propName in requestProperties) {
        try {
            var stringToFind = "{{" + propName + "}}";
            var regex = new RegExp(stringToFind, "g");
            messagebody = messagebody.replace(regex, requestProperties[propName]);
        } catch (e) {}
    }

    try{
        messagebody = messagebody.replace(/{{currentapprover}}/g, customWorkflowEngine.stages.currentUserName);
        messagebody = messagebody.replace(/{{previousapprover}}/g, customWorkflowEngine.stages.previousUserName);
    }
    catch (e) {}
    messagebody = messagebody.replace(/{{currentcontextuser}}/g, CurrentUserProperties.title);
    messagebody = messagebody.replace(/{{newline}}/g, "<br><br>");
    messagebody = messagebody.replace(/{{ApproverLink}}/g, appResult);
    messagebody = messagebody.replace(/{{ViewLink}}/g, viewResult);
    messagebody = messagebody.replace(/{{MoreLink}}/g, moreResult);
    try {
        messagebody = messagebody.replace(/{{AuthorName}}/g, requestProperties.Author.value);
    } catch (e) {}

    /**===========Main Replacement Engine ==============*/
    try {
        messagebody = messagebody.replace(/{{Comments}}/g, AppRequest.comment);
    } catch (e) {}

    messagebody = '<div style="font-family: \'Arial\'; font-size: 11px;">' + messagebody + '</div>';
    return messagebody;

}