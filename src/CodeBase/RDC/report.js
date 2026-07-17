loadReportComponent = function () {
    if (MainApplication.cachedState.mode) {
        whenReportDependeciesLoaded();
    } else {
        MainApplication.cachedState.pageStateCall = loadReportComponent;
    }
};

whenReportDependeciesLoaded = function () {
    console.log("Report Page Loaded successfully...")
}
whenReportDependeciesLoadedOriginal = function () {
    globalDefinitions.extendStages();
    globalDefinitions.sortResponse();

    AppRequest = new MainApplication.NewRequestComponent.ApplicationDetails();
    AppRequest.fullTableData = [];

    $spcontext.DataForTable.tablecontentId = "speed-data-table";
    $spcontext.DataForTable.pagesize = 30;
    $spcontext.DataForTable.paginateSize = 5;
    $spcontext.DataForTable.modifyTR = false;
    $spcontext.DataForTable.context = $spcontext;

    // Formatters (ONLY what is used in your table)
    $spcontext.DataForTable.propertiesHandler = {
        "Modified": function (valueToEva) {
            return $spcontext.stringnifyDate({
                value: valueToEva.Modified,
                includeTime: false,
                format: "dd/mm/yy"
            });
        },
        "Division": function (valueToEva) {
            let division = valueToEva.Division || "";

            if (division === "Advanced Manufacturing") {
                return '<span class="pill pill-gold">AM</span>';
            } else {
                return '<span class="pill pill-teal">AI</span>';
            }
        },
        "NPSCategory": function (valueToEva) {
            let nps = valueToEva.NPSCategory || "";
            if (nps === "Promoter") {
                return '<span class="pill pill-green">Promoter</span>';
            } else if (nps === "Passive") {
                return '<span class="pill pill-amber">Passive</span>';
            } else if (nps === "Detractor") {
                return '<span class="pill pill-red">Detractor</span>';
            } else {
                return nps;
            }
        },
        "CSATCategory": function (valueToEva) {
            let csat = valueToEva.CSATCategory || "";
            if (csat === "Satisfied") {
                return '<span class="pill pill-green">Satisfied</span>';
            } else if (csat === "Neutral") {
                return '<span class="pill pill-amber">Neutral</span>';
            } else if (csat === "Dissatisfied") {
                return '<span class="pill pill-red">Dissatisfied</span>';
            } else {
                return csat;
            }
        }
    };

    // Filters (ONLY existing controls)
    $("#hist-div, #hist-nps, #hist-csat").on("change", function () {
        MainApplication.ReportComponent.applyFilters();
    });

    $("#hist-q").on("keyup", function () {
        MainApplication.ReportComponent.applyFilters();
    });

    $("#hist-export").on("click", function () {
        MainApplication.ReportComponent.exportToExcel();
    });

    if (MainApplication.isUserAnActor) {
        MainApplication.ReportComponent.retrieveRequest();
        globalDefinitions.closeLoader();
    } else {
        globalDefinitions.HandlerError("You are not authorized to access this resource...");
        $spcontext.redirect("#/", false);
        globalDefinitions.closeLoader();
    }
};

// ─── Fetch data ─────────────────────────────────────────

MainApplication.ReportComponent.retrieveRequest = function () {
    var reportQuery = [{
        ascending: "FALSE",
        orderby: "Modified"
    }];

    var query = $spcontext.camlBuilder(reportQuery);

    var extraProperties = {
        merge: true,
        data: [
            "ID", "Modified", "Division", "CustomerName",
            "JobNumber", "CSATCategory", "NPSCategory"
        ]
    };

    $spcontext.getListToItems(
        configProperties.CSLIST.setting,
        query,
        extraProperties,
        true,
        null,
        function (tableData) {
            AppRequest.fullTableData = tableData;
            MainApplication.ReportComponent.applyFilters();
        }
    );
};

// ─── Apply filters (client-side ONLY) ───────────────────

MainApplication.ReportComponent.applyFilters = function () {
    var data = AppRequest.fullTableData || [];

    var division = $("#hist-div").val();
    var nps = $("#hist-nps").val();
    var csat = $("#hist-csat").val();
    var query = ($("#hist-q").val() || "").toLowerCase();

    var filtered = data.filter(function (item) {

        // Division filter
        if (division && division !== "All Divisions" && item.Division !== division) {
            return false;
        }

        // NPS filter
        if (nps && nps !== "All NPS Categories" && item.NPSCategory !== nps) {
            return false;
        }

        // CSAT filter
        if (csat && csat !== "All CSAT Categories" && item.CSATCategory !== csat) {
            return false;
        }

        // Search filter
        if (query) {
            var text = (
                (item.CustomerName || "") +
                (item.JobNumber || "") +
                (item.ProjectTitle || "")
            ).toLowerCase();

            if (!text.includes(query)) return false;
        }

        return true;
    });

    MainApplication.ReportComponent.showTableData(filtered);
};

// ─── Render table ───────────────────────────────────────

MainApplication.ReportComponent.showTableData = function (tableData) {

    AppRequest.dataForExport = tableData; // ← ADD THIS

    $("#hist-count").text(tableData.length + " records");
    $("#hist-meta").text(tableData.length + " records");

    if (tableData.length === 0) {
        $("#speed-data-table").empty();
        $(".data-table").hide();
    } else {
        $(".data-table").show();
        $spcontext.manualTable(tableData);
    }

    globalDefinitions.closeLoader();
};

MainApplication.ReportComponent.exportToExcel = function () {

    var excelName = "SurveyHistory_" + $spcontext.stringnifyDate() + ".csv";

    var headers = [
        "Date",
        "Division",
        "Customer",
        "Job Number",
        "CSAT",
        "NPS"
    ];

    var csv = headers.join(",") + "\n";

    $.each(AppRequest.dataForExport || [], function (i, item) {

        var row = [];

        row.push($spcontext.stringnifyDate({
            value: item.Modified,
            includeTime: false
        }));

        row.push(MainApplication.ReportComponent.cleanCSV(item.Division));
        row.push(MainApplication.ReportComponent.cleanCSV(item.CustomerName));
        row.push(MainApplication.ReportComponent.cleanCSV(item.JobNumber));
        row.push(MainApplication.ReportComponent.cleanCSV(item.CSATCategory));
        row.push(MainApplication.ReportComponent.cleanCSV(item.NPSCategory));

        csv += row.join(",") + "\n";
    });

    csv = "\uFEFF" + csv;

    MainApplication.ReportComponent.downloadCSV(excelName, csv);
};

MainApplication.ReportComponent.downloadCSV = function (filename, data) {

    if (navigator.msSaveOrOpenBlob) {
        var blob = new Blob([data], { type: "text/csv" });
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(data));
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

MainApplication.ReportComponent.cleanCSV = function (value) {

    if (!value) return "";

    value = value.toString().replace(/\r?\n|\r/g, "");

    if (value.includes(",") || value.includes('"')) {
        value = '"' + value.replace(/"/g, '""') + '"';
    }

    return value;
};