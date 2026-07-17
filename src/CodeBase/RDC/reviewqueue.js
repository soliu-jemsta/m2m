loadReviewQueueComponent = function () {
    if (MainApplication.cachedState.mode) {
        whenReviewQueueDependeciesLoaded();
    } else {
        MainApplication.cachedState.pageStateCall = loadReviewQueueComponent;
    }
};

var AppRequest;
var customWorkflowEngine;

MainApplication.ReviewQueueComponent.ApplicationDetails = function () {
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
    this.nonConformanceCounter = 1;
}

whenReviewQueueDependeciesLoaded = function () {
    // globalDefinitions.callLoader();
    globalDefinitions.extendStages();
    globalDefinitions.sortResponse();
    AppRequest = new MainApplication.ReviewQueueComponent.ApplicationDetails();
    AppRequest.pendingItems = [];
    AppRequest.myItems = [];
    customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);

    vbContext.DataForTable.tablecontentId = "speed-data-table";
    vbContext.DataForTable.pagesize = 30;
    vbContext.DataForTable.paginateSize = 5;
    vbContext.DataForTable.modifyTR = false;
    vbContext.DataForTable.context = vbContext;
    vbContext.DataForTable.paginationbId = "myrequestpagination";
    vbContext.DataForTable.paginationuId = "toppagination";
    vbContext.DataForTable.propertiesHandler = {
        "Modified": function (valueToEva) {
            return $spcontext.stringnifyDate({
                value: valueToEva.Modified,
                includeTime: false,
                format: "dd/mm/yy"
            });

        },

        "Approval_Status": function (valueToEva) {
            if (valueToEva.Approval_Status === "Pending" && valueToEva.Current_Approver === globalDefinitions.stageDefinitions.save) {
                `return <span class="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">Draft</span>`
            } else if (valueToEva.Approval_Status === "Completed") {
                return `<span class="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800">Approved</span>`
            } else if (valueToEva.Approval_Status === "Declined") {
                return `<span class="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800">Declined</span>`
            } else if (valueToEva.Approval_Status === "Pending") {
                return `<span class="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>`;
            } else if (valueToEva.Approval_Status === "Revise") {
                return `<span class="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">Revise</span>`
            }

        },

        "Created": function (valueToEva) {
            // var isActor = MainApplication.isUserAnActor;
            let isActor = false;
            try {
                isActor = CurrentUserProperties.email === valueToEva.PendingUserLogin || MainApplication.configuredTaskMembers[valueToEva.Current_Approver].belongs;
            } catch (error) { }

            var approvalStr = `${isActor ? `
                <a title="Action" href="#/approverequest?itemId=${valueToEva.WorkflowRequestID}" 
                    class="p-1 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-colors">
                    👍
                </a>` : ''}`;

            var editStr = `
                <a title="Modify" href="#/newrequest?itemId=${valueToEva.WorkflowRequestID}"
                    class="p-1 sm:p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                    🔄
                </a>`;

            var editDraftStr = `
                <a title="Modify" href="#/newrequest?itemId=${valueToEva.WorkflowRequestID}&mode=editdraft" 
                    class="p-1 sm:p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                    🔄
                </a>`;

            var viewStr = `
                <a title="View" href="#/viewrequest?itemId=${valueToEva.WorkflowRequestID}" 
                    class="p-1 sm:p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                    👁️
                </a>`;

            if ((valueToEva.Approval_Status === "Pending" && valueToEva.Current_Approver === globalDefinitions.stageDefinitions.save)) {

                return `<div class="flex space-x-1 sm:space-x-2">${viewStr} ${editDraftStr}</div>`;

            } else if (valueToEva.Approval_Status === "Revise" && valueToEva.ReturnForCorrection === "Yes") {

                return `<div class="flex space-x-1 sm:space-x-2">${viewStr} ${editStr}</div>`;

            } else if (valueToEva.Approval_Status === "Completed" || valueToEva.Approval_Status === "Declined") {

                return `<div class="flex space-x-1 sm:space-x-2">${viewStr}</div>`;

            } else {

                return `<div class="flex space-x-1 sm:space-x-2">${viewStr} ${approvalStr}</div>`;

            }

        }

    };

    $("#reportsearchfield").on("keyup", function () {
        var searchQuery = $(this).val();
        var data = AppRequest.pendingItems || [];
        var filteredItems = MainApplication.reportSyncSearch(searchQuery, data);
        MainApplication.ReportComponent.showTableData(filteredItems)
        MainApplication.updateNoDataState(filteredItems, searchQuery);
    });

    MainApplication.ReviewQueueComponent.pendingRequests();

    $(document).on("click", ".idea-card", function () {
        $(this).toggleClass("expanded");
    });

    setTimeout(function () {
        // $(".overlay-loader").hide();
        // globalDefinitions.closeLoader();
        $("#reportloader").hide();
        $("#page-reviewqueue").show();
    }, 2000);

};

MainApplication.ReviewQueueComponent.myRequests = function () {

    var queryToUse = [{

        ascending: "FALSE",

        orderby: "Modified",

        viewScope: "RecursiveAll"

    }, {

        operator: 'Eq',

        field: 'EmployeeEmail',

        type: 'Text',

        val: CurrentUserProperties.email

    }];

    var query = vbContext.camlBuilder(queryToUse);

    var extraProperties = {

        merge: true,

        data: [
            "ID", "Title", "WorkflowRequestID", "Current_Approver", "Current_Approver_Code", "Approval_Status",
            "Created", "InitiatorEmailAddress", "InitiatorLogin", "Transaction_History", "ReturnForCorrection",
            "Modified", "PendingUserEmail", "PendingUserLogin", "Attachment_Folder", "AttachmentURL", "Author",
            "Division", "Ideas"
        ]

    };

    vbContext.getListToItems(configProperties.VBLIST.setting, query, extraProperties, true, null, function (tableData) {

        var completedItems = tableData.filter(function (item) {

            return item.Approval_Status === "Completed";

        });

        var pendingItems = tableData.filter(function (item) {

            return item.Approval_Status === "Pending";

        });

        AppRequest.myItems = tableData;

        // AppRequest.ncData = MainApplication.AuditList;

        $("#dash-stats").empty();

        $("#dash-stats").append(
            `
                        <div class="stat-card blue">
                            <div class="stat-top">
                                <div class="stat-label">Submitted</div>
                                <div class="stat-icon">📨</div>
                            </div>
                            <div class="stat-num">${tableData.length || 0}</div>
                            <div class="stat-sub">Total ideas shared</div>
                        </div>
                        <div class="stat-card green">
                            <div class="stat-top">
                                <div class="stat-label">Approved</div>
                                <div class="stat-icon">✅</div>
                            </div>
                            <div class="stat-num">${completedItems.length || 0}</div>
                            <div class="stat-sub">In progress</div>
                        </div>
                        <div class="stat-card amber">
                            <div class="stat-top">
                                <div class="stat-label">Under Review</div>
                                <div class="stat-icon">⏳</div>
                            </div>
                            <div class="stat-num">${pendingItems.length || 0}</div>
                            <div class="stat-sub">Awaiting committee</div>
                        </div>
                        <div class="stat-card purple">
                            <div class="stat-top">
                                <div class="stat-label">Kreedland Pts</div>
                                <div class="stat-icon">🏆</div>
                            </div>
                            <div class="stat-num">0</div>
                            <div class="stat-sub">Keep contributing!</div>
                        </div>

            `

        );

        // MainApplication.ReviewQueueComponent.renderIdeaCards(tableData);
    });
    MainApplication.ReviewQueueComponent.pendingRequests();

};

MainApplication.ReviewQueueComponent.pendingRequests = function () {

    var queryCaml = [{

        ascending: "FALSE",

        orderby: "Modified"

    },

    {

        operator: 'Eq',

        field: 'Approval_Status',

        type: 'Text',

        val: "Pending"

    },

        // {

        //     operator: 'Eq',

        //     field: 'PendingUserLogin',

        //     type: 'Text',

        //     val: CurrentUserProperties.email

        // },

    ];

    if (MainApplication.configuredTaskMembers[globalDefinitions.stageDefinitions.management].belongs) {

        queryCaml.push({

            evaluator: "Or",

            operator: 'Eq',

            field: 'Current_Approver',

            type: 'Text',

            val: globalDefinitions.stageDefinitions.management

        });

    }

    if (MainApplication.configuredTaskMembers[globalDefinitions.stageDefinitions.ceo].belongs) {

        queryCaml.push({

            evaluator: "Or",

            operator: 'Eq',

            field: 'Current_Approver',

            type: 'Text',

            val: globalDefinitions.stageDefinitions.ceo

        });

    }

    if (globalDefinitions.stageDefinitions.employee) {

        queryCaml.push({

            evaluator: "Or",

            operator: 'Eq',

            field: 'PendingUserLogin',

            type: 'Text',

            val: CurrentUserProperties.email

        });

    }

    if (globalDefinitions.stageDefinitions.hod) {

        queryCaml.push({

            evaluator: "Or",

            operator: 'Eq',

            field: 'PendingUserLogin',

            type: 'Text',

            val: CurrentUserProperties.email

        });

    }

    queryCaml = customWorkflowEngine.setupTaskForGroups(queryCaml);

    var query = vbContext.camlBuilder(queryCaml);

    var extraProperties = {

        merge: true,

        data: [
            "ID", "Title", "WorkflowRequestID", "Current_Approver", "Current_Approver_Code", "Approval_Status",
            "Created", "InitiatorEmailAddress", "InitiatorLogin", "Transaction_History", "ReturnForCorrection",
            "Modified", "PendingUserEmail", "PendingUserLogin", "Attachment_Folder", "AttachmentURL", "Author",
            "HOD", "EmployeeEmail", "Year", "Month"
        ]

    };

    vbContext.getListToItems(configProperties.VBLIST.setting, query, extraProperties, true, null, function (tableData) {

        $("#reviewtask").html(tableData.length || 0);
        AppRequest.pendingItems = tableData;
        
        MainApplication.ReviewQueueComponent.showTableData(tableData);
    });

};

MainApplication.ReviewQueueComponent.showTableData = function (tableData) {

    if (tableData.length === 0) {
        $("#tasktable").hide();
        $("#speed-data-table").empty();
        $(".data-table").hide();
        $(".norequest").show();
    } else {
        $("#tasktable").show();
        $(".data-table").show();
        $(".norequest").hide();
        vbContext.manualTable(tableData);
    }
    globalDefinitions.closeLoader();
};
