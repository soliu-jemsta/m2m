loadClientsComponent = function () {
	if (MainApplication.cachedState.mode) {
		whenClientsLoaded();
	} else {
		setTimeout(function () {
			MainApplication.cachedState.pageStateCall = loadClientsComponent;
		}, 1000);
	}
};

var AppRequest;

MainApplication.ClientsComponent.ApplicationDetails = function () {
	this.url = window.location.href;
	this.itemId = null;
	this.mode = null;
	this.requestDetails = {};
	this.approverComments = "";
	this.transactionHistory = [];
	this.defaultStage = "AA0";
	this.returned = null;
};

whenClientsLoaded = function () {
    globalDefinitions.callLoader();
    // globalDefinitions.extendStages();
    globalDefinitions.sortResponse();


    // $("#requeststrDate").datepicker({ dateFormat: 'yy-mm-dd', beforeShow: function () { jQuery(this).datepicker('option', 'maxDate', $('#requestendDate').val()); } });
    // $("#requestendDate").datepicker({ dateFormat: 'yy-mm-dd', beforeShow: function () { jQuery(this).datepicker('option', 'minDate', $('#requeststrDate').val()); } });
    AppRequest = new MainApplication.ClientsComponent.ApplicationDetails();
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
    //     MainApplication.ClientsComponent.retrieveRequest();
    // });

    // let debounceTimer;

    $("#employeeName, #nextApprover, #statusSelect, #rdcStatusSelect, #requeststrDate, #requestendDate").on("keyup change", function () {
        // clearTimeout(debounceTimer);
        // debounceTimer = setTimeout(() => {
            MainApplication.ClientsComponent.retrieveRequest();
        // }, 500);
    });

    // $("#exportbtn").click(() => {
    //     MainApplication.ClientsComponent.exportToExcel();
    // });

    // $("#reportsearchfield").on("keyup", function () {
    //     var searchQuery = $(this).val();
    //     var data = AppRequest.fullTableData || [];
    //     var filteredItems = MainApplication.reportSyncSearch(searchQuery, data);
    //     MainApplication.ClientsComponent.showTableData(filteredItems);
    // });

    // $("#filter-btn, #closesearchfilter").click(() => {
    //     $(".sort-box").toggleClass("hidden");
    // });

    // if (MainApplication.isUserAnActor) {
        MainApplication.ClientsComponent.retrieveRequest();

    // }
    // else {
    //     globalDefinitions.HandlerError("You are not authorized to access this resource...");
    //     $spcontext.redirect("#/", false);
        globalDefinitions.closeLoader();
    // }

};

MainApplication.ClientsComponent.retrieveRequest = function () {
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
            "ID", "Title", "EmailAddress", "MobileNumber", "EmploymentStatus", "Modified", "Cases"
        ]
    };

    $spcontext.getListToItems(configProperties.CLIENTSLIST.setting, query, extraProperties, true, null, function (tableData) {
        
        AppRequest.fullTableData = tableData;

		globalDefinitions.closeLoader();
        MainApplication.ClientsComponent.showTableData(tableData);
    });
};

MainApplication.ClientsComponent.showTableData = function (tableData) {
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