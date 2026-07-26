loadDashBoardComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenDashBoardLoaded();
	} else {
		setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadDashBoardComponent;
		}, 1000);
	}
};

var AppRequest;
var customWorkflowEngine;

MainApplication.DashBoardComponent.ApplicationDetails = function () {
	this.url = window.location.href;
	this.itemId = null;
	this.mode = null;
	this.requestDetails = {};
	this.approverComments = "";
	this.transactionHistory = [];
	this.defaultStage = "AA0";
	this.returned = null;
};

whenDashBoardLoaded = function () {
    globalDefinitions.callLoader();
    // globalDefinitions.extendStages();
    globalDefinitions.sortResponse();

    AppRequest = new MainApplication.DashBoardComponent.ApplicationDetails();
    AppRequest.fullTableData = [];
    AppRequest.dataForExport = [];

    customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);

    $spcontext.DataForTable.tablecontentId = "speed-data-table";
    $spcontext.DataForTable.pagesize = 20;
    $spcontext.DataForTable.paginateSize = 5;
    $spcontext.DataForTable.modifyTR = false;
    $spcontext.DataForTable.context = $spcontext;
    $spcontext.DataForTable.paginationbId = "myrequestpagination";
    $spcontext.DataForTable.paginationuId = "toppagination";

    $spcontext.DataForTable.propertiesHandler = {
      "Client": function (valueToEva) {
        return valueToEva.Client.value;
      },
      "Adviser": function (valueToEva) {
        return valueToEva.Adviser.value;
      }
    };

        MainApplication.DashBoardComponent.retrieveRequest();

        globalDefinitions.closeLoader();

};

MainApplication.DashBoardComponent.retrieveRequest = function () {
    // globalDefinitions.callLoader();
    var reportQuery = [{
            ascending: "FALSE",
            orderby: "Modified"
        }
    ];

    reportQuery = $spcontext.formQueryArrayGenerator(reportQuery);

    var query = $spcontext.camlBuilder(reportQuery);
    var extraProperties = {
        merge: true,
        data: [
            "ID", "Title", "Lender", "Adviser", "Client", "Modified", "Approval_Status", "ApplicationType", "LoanAmountRequired"
        ]
    };

    $spcontext.getListToItems(configProperties.CASESLIST.setting, query, extraProperties, true, null, function (tableData) {
        AppRequest.fullTableData = tableData;

        // KPIs are always calculated from the FULL result set returned by
        // the query, not just the 10 rows shown in the table below.
        MainApplication.DashBoardComponent.updateKPIs(tableData);

		globalDefinitions.closeLoader();
        MainApplication.DashBoardComponent.showTableData(tableData);
    });
};

// ---------------------------------------------------------------------
// KPI status matching — EDIT THESE ARRAYS to match the actual values
// stored in your Approval_Status column in SharePoint. As written these
// are placeholders based on common naming; swap in your real values.
// ---------------------------------------------------------------------
var CLOSED_STATUSES = ["Completed", "Declined"];
var COMPLETED_STATUSES = ["Completed"];
var PENDING_APPROVAL_STATUSES = ["Pending"];

MainApplication.DashBoardComponent.updateKPIs = function (tableData) {
    var now = new Date();
    var currentMonth = now.getMonth();
    var currentYear = now.getFullYear();

    var activeCases = 0;
    var pipelineValue = 0;
    var completionsThisMonth = 0;
    var pendingApprovals = 0;

    (tableData || []).forEach(function (item) {
        var status = item.Approval_Status;
        var loanAmount = parseFloat(item.LoanAmountRequired) || 0;
        var modifiedDate = item.Modified ? new Date(item.Modified) : null;

        var isClosed = CLOSED_STATUSES.indexOf(status) !== -1;

        if (!isClosed) {
            activeCases++;
            pipelineValue += loanAmount;
        }

        if (COMPLETED_STATUSES.indexOf(status) !== -1 && modifiedDate &&
            modifiedDate.getMonth() === currentMonth &&
            modifiedDate.getFullYear() === currentYear) {
            completionsThisMonth++;
        }

        if (PENDING_APPROVAL_STATUSES.indexOf(status) !== -1) {
            pendingApprovals++;
        }
    });

    AppRequest.kpi = {
        activeCases: activeCases,
        pipelineValue: pipelineValue,
        completionsThisMonth: completionsThisMonth,
        pendingApprovals: pendingApprovals
    };

    MainApplication.DashBoardComponent.renderKPIs(AppRequest.kpi);
};

MainApplication.DashBoardComponent.formatCurrency = function (value) {
    if (value >= 1000000) {
        return "£" + (value / 1000000).toFixed(1) + "M";
    }
    if (value >= 1000) {
        return "£" + (value / 1000).toFixed(0) + "K";
    }
    return "£" + value.toFixed(0);
};

MainApplication.DashBoardComponent.renderKPIs = function (kpi) {
    $("#dash-active").text(kpi.activeCases);
    $("#dash-pipeline").text(MainApplication.DashBoardComponent.formatCurrency(kpi.pipelineValue));
    $("#dash-completions").text(kpi.completionsThisMonth);
    $("#dash-approvals").text(kpi.pendingApprovals);
};

MainApplication.DashBoardComponent.showTableData = function (tableData) {
    // Only the 10 most recent cases are shown, and no pagination controls
    // are wired up for this widget — the query already sorts by Modified
    // descending, so slicing here just takes the top 10 of that order.
    var tableRows = (tableData || []).slice(0, 10);

    AppRequest.dataForExport = tableData;

    if (tableRows.length === 0) {
        $("#tasktable").hide();
        $("#speed-data-table").empty();
        $(".threport").hide();
        $(".norequest").show();
    } else {
        $("#tasktable").show();
        $(".threport").show();
        $(".norequest").hide();
        $spcontext.manualTable(tableRows);
    }
    globalDefinitions.closeLoader();
};