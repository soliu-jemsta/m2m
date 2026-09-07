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

// The three category tabs. These values match exactly what's already stored
// in the ApplicationType field on CASESLIST (confirmed via debug logging —
// ApplicationType holds "MORTGAGE"/"P4L"/"GI" directly, not the granular
// type like "Residential Purchase").
var CASE_CATEGORIES = ["MORTGAGE", "P4L", "GI"];

// Maps each category to the DOM ids from the Cases.tsx template.
var CATEGORY_TABLE_MAP = {
    MORTGAGE: { tableBodyId: "speed-data-table-mortgage", paginationId: "pagination-mortgage", filterRowId: "status-filters-mortgage" },
    P4L: { tableBodyId: "speed-data-table-p4l", paginationId: "pagination-p4l", filterRowId: "status-filters-p4l" },
    GI: { tableBodyId: "speed-data-table-gi", paginationId: "pagination-gi", filterRowId: "status-filters-gi" }
};

// Explicit column list per category, in the exact order each category's
// <th speed-table-data="..."> columns appear in Cases.tsx.
//
// This exists because Speed.prototype.manualTable always calls
// this.getControls(true, "") internally (hardcoded empty group), which scans
// *every* [speed-table-data] element on the whole page rather than scoping to
// the active table's group. With three tables in the DOM at once, that merges
// all three tables' columns into one list. Passing `controls` explicitly in
// manualTable's settings skips that DOM scan entirely, so each category only
// ever renders its own columns.
var CATEGORY_CONTROLS = {
    MORTGAGE: ["WorkflowRequestID", "Client", "Adviser", "MortgageType", "LoanAmountRequired", "Approval_Status", "Modified"],
    P4L: ["WorkflowRequestID", "Client", "Adviser", "P4LType", "SumAssured", "Approval_Status", "Modified"],
    GI: ["WorkflowRequestID", "Client", "Adviser", "GIType", "InsuranceType", "Approval_Status", "Modified"]
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
	this.activeCategory = "MORTGAGE";
	// Each category tab remembers its own All/Pending/Closed selection
	// independently, so switching tabs doesn't reset a filter you'd already set.
	this.filtersByCategory = { MORTGAGE: "all", P4L: "all", GI: "all" };
};

whenCasesLoaded = function () {
    globalDefinitions.callLoader();
    // globalDefinitions.extendStages();
    globalDefinitions.sortResponse();

    AppRequest = new MainApplication.CasesComponent.ApplicationDetails();
    AppRequest.fullTableData = [];
    AppRequest.dataForExport = [];

    customWorkflowEngine = new WorkflowManagerEngine(CurrentUserProperties);

    // tablecontentId / paginationbId are no longer set here — they now switch
    // per-category inside switchCategory(), since each tab renders into its
    // own table + pagination container.
    $spcontext.DataForTable.pagesize = 20;
    $spcontext.DataForTable.paginateSize = 5;
    $spcontext.DataForTable.modifyTR = false;
    $spcontext.DataForTable.context = $spcontext;
    $spcontext.DataForTable.paginationuId = "toppagination";

    $spcontext.DataForTable.propertiesHandler = {
		"Client": function (valueToEva) {
			return valueToEva.Client.value;
		},
		"Adviser": function (valueToEva) {
			return valueToEva.Adviser.value;
		},
        "LoanAmountRequired": function (valueToEva) {
            return valueToEva.LoanAmountRequired
                ? "£" + Number(valueToEva.LoanAmountRequired).toLocaleString()
                : "-";
        },
        // TODO: confirm "SumAssured" / "InsuranceType" are the real internal
        // column names on CASESLIST — these are placeholders based on the
        // field keys used for those case types in dynamicrenderer.js.
        "SumAssured": function (valueToEva) {
            return valueToEva.SumAssured
                ? "£" + Number(valueToEva.SumAssured).toLocaleString()
                : "-";
        },
        "InsuranceType": function (valueToEva) {
            return valueToEva.InsuranceType || "-";
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

    $("#employeeName, #nextApprover, #statusSelect, #rdcStatusSelect, #requeststrDate, #requestendDate").on("keyup change", function () {
        MainApplication.CasesComponent.retrieveRequest();
    });

    // Category tabs — Mortgages / P4L / General Insurance
    $(".ft-category").click(function () {
        var category = $(this).data("category");
        MainApplication.CasesComponent.switchCategory(category);
    });

    // Status tabs — each lives inside a [data-status-row] scoped to one
    // category, so a click here only ever affects that category's filter.
    $(".ft-status").click(function () {
        var $row = $(this).closest("[data-status-row]");
        var category = $row.data("statusRow");

        $row.find(".ft-status").removeClass("active");
        $(this).addClass("active");

        AppRequest.filtersByCategory[category] = $(this).data("filter") || "all";

        if (category === AppRequest.activeCategory) {
            MainApplication.CasesComponent.applyFilters();
        }
    });

    $("#searchbar").on("keyup", function () {
        MainApplication.CasesComponent.applyFilters();
    });

    MainApplication.CasesComponent.switchCategory(AppRequest.activeCategory);
    MainApplication.CasesComponent.retrieveRequest();

    globalDefinitions.closeLoader();
};

// Points $spcontext.DataForTable at the active category's table/pagination
// ids and shows/hides each category's section accordingly.
MainApplication.CasesComponent.switchCategory = function (category) {
    AppRequest.activeCategory = category;

    CASE_CATEGORIES.forEach(function (cat) {
        var isActive = cat === category;
        $("[data-category-section='" + cat + "']").toggle(isActive);
    });

    $(".ft-category").removeClass("active");
    $(".ft-category[data-category='" + category + "']").addClass("active");

    var ids = CATEGORY_TABLE_MAP[category];
    $spcontext.DataForTable.tablecontentId = ids.tableBodyId;
    $spcontext.DataForTable.paginationbId = ids.paginationId;

    if (AppRequest.fullTableData && AppRequest.fullTableData.length) {
        MainApplication.CasesComponent.applyFilters();
    }
};

MainApplication.CasesComponent.retrieveRequest = function () {
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
            "ID", "Title", "Lender", "Adviser", "Client", "Modified", "Approval_Status", "ApplicationType",
            "LoanAmountRequired", "SumAssured", "InsuranceType",
            // Granular type per category — ApplicationType only holds the
            // category code (MORTGAGE/P4L/GI), the specific type lives here.
            "MortgageType", "P4LType", "GIType"
        ]
    };

    $spcontext.getListToItems(configProperties.CASESLIST.setting, query, extraProperties, true, null, function (tableData) {
        $("#caseBadge").html(tableData.length || 0);
        AppRequest.fullTableData = tableData;

		globalDefinitions.closeLoader();
        MainApplication.CasesComponent.applyFilters();
    });
};

// Applies: active category tab -> that category's status filter -> search box,
// on top of the last fetched data.
MainApplication.CasesComponent.applyFilters = function () {
    var data = AppRequest.fullTableData || [];
    var category = AppRequest.activeCategory;

    // ApplicationType stores the category directly ("MORTGAGE"/"P4L"/"GI"),
    // so this is a straight equality check — no reverse-lookup needed.
    data = data.filter(function (item) {
        return item.ApplicationType === category;
    });

    var filter = AppRequest.filtersByCategory[category] || "all";
    if (filter === "completed") {
        data = data.filter(function (item) {
            return CASES_STATUS.closedStatuses.indexOf(item.Approval_Status) !== -1;
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
    var ids = CATEGORY_TABLE_MAP[AppRequest.activeCategory];
    var $section = $("[data-category-section='" + AppRequest.activeCategory + "']");

    if (tableData.length === 0) {
        $section.find(".table-wrap").hide();
        $("#" + ids.tableBodyId).empty();
        $section.find(".norequest").show();
    } else {
        $section.find(".table-wrap").show();
        $section.find(".norequest").hide();
        $spcontext.manualTable(tableData, { controls: CATEGORY_CONTROLS[AppRequest.activeCategory] });
    }
    globalDefinitions.closeLoader();
};