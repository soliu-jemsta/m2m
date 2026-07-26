loadCasesComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenCasesLoaded();
	} else {
		setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadCasesComponent;
		}, 1000);
	}
};

var AppRequest;

// Update to match your actual Approval_Status choice values
var CASES_STATUS = {
    closedStatuses: ["Completed", "Declined"],
    pendingApprovalStatus: "Pending"
};

MainApplication.CasesComponent.ApplicationDetails = function () {
	this.url = window.location.href;
	this.itemId = null;
	this.mode = null;
	this.requestDetails = {};
	this.approverComments = "";
	this.transactionHistory = [];
	this.defaultStage = "AA0";
	this.returned = null;
	this.activeFilter = "all";
};

whenCasesLoaded = function () {
    globalDefinitions.callLoader();
    // globalDefinitions.extendStages();
    globalDefinitions.sortResponse();


    // $("#requeststrDate").datepicker({ dateFormat: 'yy-mm-dd', beforeShow: function () { jQuery(this).datepicker('option', 'maxDate', $('#requestendDate').val()); } });
    // $("#requestendDate").datepicker({ dateFormat: 'yy-mm-dd', beforeShow: function () { jQuery(this).datepicker('option', 'minDate', $('#requeststrDate').val()); } });
    AppRequest = new MainApplication.CasesComponent.ApplicationDetails();
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
		},
        "Modified": function (valueToEva) {
            var viewStr = `
                <a href="#/viewrequest?itemId=${valueToEva.ID}" class="btn btn-sm btn-primary btn-icon">
                    <i class="fa-solid fa-eye" style="font-size:11px"></i>
                </a>`;

            var editStr = `
                <a href="#/?itemId=${valueToEva.ID}" class="btn btn-sm btn-primary btn-icon">
                    <i class="fa-solid fa-pen" style="font-size:11px"></i>
                </a>`;

            // if (valueToEva.Status === "Save"){
            //     return `<div>${editStr} ${viewStr}</div`
            // } else {
            //     return viewStr; 
            // }
               
			return `<button class="btn btn-secondary btn-sm">View</button>`;
        }
    };

    // $("#searchbtn").click(() => {
    //     MainApplication.CasesComponent.retrieveRequest();
    // });

    // let debounceTimer;

    $("#employeeName, #nextApprover, #statusSelect, #rdcStatusSelect, #requeststrDate, #requestendDate").on("keyup change", function () {
        // clearTimeout(debounceTimer);
        // debounceTimer = setTimeout(() => {
            MainApplication.CasesComponent.retrieveRequest();
        // }, 500);
    });

    $(".ft").click(function () {
        $(".ft").removeClass("active");
        $(this).addClass("active");
        AppRequest.activeFilter = $(this).data("filter") || "all";
        MainApplication.CasesComponent.applyFilters();
    });

    $("#searchbar").on("keyup", function () {
        MainApplication.CasesComponent.applyFilters();
    });

    // $("#exportbtn").click(() => {
    //     MainApplication.CasesComponent.exportToExcel();
    // });

    // $("#reportsearchfield").on("keyup", function () {
    //     var searchQuery = $(this).val();
    //     var data = AppRequest.fullTableData || [];
    //     var filteredItems = MainApplication.reportSyncSearch(searchQuery, data);
    //     MainApplication.CasesComponent.showTableData(filteredItems);
    // });

    // $("#filter-btn, #closesearchfilter").click(() => {
    //     $(".sort-box").toggleClass("hidden");
    // });

    // if (MainApplication.isUserAnActor) {
        MainApplication.CasesComponent.retrieveRequest();

    // }
    // else {
    //     globalDefinitions.HandlerError("You are not authorized to access this resource...");
    //     $spcontext.redirect("#/", false);
        globalDefinitions.closeLoader();
    // }

};

MainApplication.CasesComponent.retrieveRequest = function () {
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
        $("#caseBadge").html(tableData.length || 0);
        AppRequest.fullTableData = tableData;

		globalDefinitions.closeLoader();
        MainApplication.CasesComponent.applyFilters();
    });
};

// Applies the active status tab, then the search box, on top of the last fetched data
MainApplication.CasesComponent.applyFilters = function () {
    var data = AppRequest.fullTableData || [];
    var filter = AppRequest.activeFilter || "all";

    if (filter === "completed") {
    data = data.filter(function (item) {
        return CASES_STATUS.closedStatuses.indexOf(item.Approval_Status) !== -1; // ✅ keeps only closed cases
    });
} else if (filter === "pending") {
        data = data.filter(function (item) {
            return item.Approval_Status === CASES_STATUS.pendingApprovalStatus;
        });
    }

    var searchQuery = $("#searchbar").val();
    if (searchQuery) {
        data = MainApplication.reportSyncSearch(searchQuery, data);
    }

    MainApplication.CasesComponent.showTableData(data);
};

MainApplication.CasesComponent.showTableData = function (tableData) {
    AppRequest.dataForExport = tableData;
    if (tableData.length === 0) {
        $("#tasktable").hide();
        $("#speed-data-table").empty();
        $(".threport").hide();
        $(".norequest").show();
    } else {
        $("#tasktable").show();
        $(".threport").show();
        $(".norequest").hide();
        $spcontext.manualTable(tableData);
    }
    globalDefinitions.closeLoader();
};