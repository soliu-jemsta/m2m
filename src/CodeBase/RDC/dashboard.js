/**
 * Dashboard — KPIs from CASESLIST + CaseTasks, recent cases, activity feed
 */

loadDashBoardComponent = function () {
  if (MainApplication.cachedState.mode) {
    whenDashBoardLoaded();
  } else {
    setTimeout(function () {
      MainApplication.cachedState.pageStateCall = loadDashBoardComponent;
    }, 1000);
  }
};

MainApplication.DashBoardComponent = MainApplication.DashBoardComponent || {};

MainApplication.DashBoardComponent.ApplicationDetails = function () {
  this.url = window.location.href;
  this.itemId = null;
  this.mode = null;
  this.fullTableData = [];
  this.dataForExport = [];
  this.kpi = {};
};

function getCasesListName() {
  if (typeof configProperties !== "undefined" && configProperties.CASESLIST) {
    return configProperties.CASESLIST.setting;
  }
  return "Cases";
}

function getTasksListName() {
  if (typeof configProperties !== "undefined" && configProperties.CASETASKSLIST) {
    return configProperties.CASETASKSLIST.setting;
  }
  return "CaseTasks";
}

function personVal(v) {
  if (!v) return "—";
  if (typeof v === "string") return v;
  if (v.value) return v.value;
  try {
    if (v.get_lookupValue) return v.get_lookupValue() || "—";
  } catch (e) {}
  return "—";
}

function relativeTime(dateVal) {
  if (!dateVal) return "";
  var d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  var sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + " mins ago";
  if (sec < 86400) return Math.floor(sec / 3600) + " hour" + (Math.floor(sec / 3600) === 1 ? "" : "s") + " ago";
  if (sec < 172800) return "Yesterday";
  if (sec < 604800) return Math.floor(sec / 86400) + " days ago";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function activityIcon(stage, status) {
  var s = (stage || "").toLowerCase();
  var st = (status || "").toLowerCase();
  if (st === "done") return { emoji: "✅", bg: "#f0fdf4" };
  if (s.indexOf("closed") !== -1) return { emoji: "🔒", bg: "#fef2f2" };
  if (s.indexOf("completion") !== -1) return { emoji: "🏁", bg: "#ecfdf5" };
  if (s.indexOf("offer") !== -1) return { emoji: "✅", bg: "#f0fdf4" };
  if (s.indexOf("document") !== -1) return { emoji: "📄", bg: "#eff6ff" };
  if (s.indexOf("underwriting") !== -1) return { emoji: "⚠️", bg: "#fffbeb" };
  if (s.indexOf("lead") !== -1) return { emoji: "🔔", bg: "#f0fdfa" };
  if (s.indexOf("fact") !== -1) return { emoji: "📋", bg: "#eff6ff" };
  return { emoji: "📌", bg: "#f8fafc" };
}

whenDashBoardLoaded = function () {
  globalDefinitions.callLoader();

  AppRequest = new MainApplication.DashBoardComponent.ApplicationDetails();

  $spcontext.DataForTable.tablecontentId = "speed-data-table";
  $spcontext.DataForTable.pagesize = 10;
  $spcontext.DataForTable.paginateSize = 5;
  $spcontext.DataForTable.modifyTR = false;
  $spcontext.DataForTable.context = $spcontext;
  $spcontext.DataForTable.paginationbId = "myrequestpagination";
  $spcontext.DataForTable.paginationuId = "toppagination";

  $spcontext.DataForTable.propertiesHandler = {
    Client: function (row) {
      return personVal(row.Client);
    },
    Adviser: function (row) {
      return personVal(row.Adviser);
    },
    CaseID: function (row) {
      var id = row.CaseID || "";
      return (
        '<a href="#/case?itemId=' +
        encodeURIComponent(id) +
        '" class="btn btn-sm btn-primary btn-icon">' +
        id +
        "</a>"
      );
    },
    CurrentStage: function (row) {
      return row.CurrentStage || row.Stage || "—";
    },
    Status: function (row) {
      return row.Status || "—";
    }
  };

  MainApplication.DashBoardComponent.loadAll();
};

MainApplication.DashBoardComponent.loadAll = function () {
  var casesDone = false;
  var tasksDone = false;
  var casesData = [];
  var tasksData = [];

  function maybeFinish() {
    if (!casesDone || !tasksDone) return;

    MainApplication.DashBoardComponent.updateKPIs(casesData, tasksData);
    MainApplication.DashBoardComponent.showRecentCases(casesData);
    MainApplication.DashBoardComponent.renderActivityFeed(tasksData);
    globalDefinitions.closeLoader();
  }

  // —— CASESLIST (Universal) ——
  var caseCaml =
    "<View><Query>" +
    "<OrderBy><FieldRef Name='Modified' Ascending='FALSE'/></OrderBy>" +
    "</Query></View>";

  $spcontext.getItem(
    getCasesListName(),
    caseCaml,
    function (coll) {
      casesData = [];
      try {
        if (coll && typeof coll.getEnumerator === "function") {
          var en = coll.getEnumerator();
          while (en.moveNext()) {
            var it = en.get_current();
            function f(name) {
              try {
                return it.get_item(name);
              } catch (e) {
                return null;
              }
            }
            casesData.push({
              ID: it.get_id(),
              CaseID: f("CaseID") || "",
              Title: f("Title") || "",
              Client: f("Client"),
              Adviser: f("Adviser"),
              Status: f("Status") || "Open",
              CurrentStage: f("CurrentStage") || f("Stage") || "",
              ApplicationType: f("ApplicationType") || "",
              Modified: f("Modified")
            });
          }
        }
      } catch (e) {
        console.error("[Dashboard] cases map error", e);
      }
      AppRequest.fullTableData = casesData;
      casesDone = true;
      maybeFinish();
    },
    function (sender, args) {
      console.error(
        "[Dashboard] CASESLIST load failed",
        args && args.get_message && args.get_message()
      );
      casesData = [];
      casesDone = true;
      maybeFinish();
    }
  );

  // —— CaseTasks ——
  var taskCaml =
    "<View><Query>" +
    "<OrderBy><FieldRef Name='Modified' Ascending='FALSE'/></OrderBy>" +
    "</Query>" +
    "<RowLimit>100</RowLimit></View>";

  $spcontext.getItem(
    getTasksListName(),
    taskCaml,
    function (coll) {
      tasksData = [];
      try {
        if (coll && typeof coll.getEnumerator === "function") {
          var en = coll.getEnumerator();
          while (en.moveNext()) {
            var it = en.get_current();
            function f(name) {
              try {
                return it.get_item(name);
              } catch (e) {
                return null;
              }
            }
            var assigned = f("AssignedTo");
            tasksData.push({
              ID: it.get_id(),
              Title: f("Title") || "",
              CaseID: f("CaseID") || "",
              Stage: f("Stage") || "",
              TaskStatus: f("TaskStatus") || "Open",
              Priority: f("Priority") || "",
              Modified: f("Modified"),
              Created: f("Created"),
              AssignedToDisplay: personVal(assigned)
            });
          }
        }
      } catch (e) {
        console.error("[Dashboard] tasks map error", e);
      }
      tasksDone = true;
      maybeFinish();
    },
    function (sender, args) {
      console.warn(
        "[Dashboard] CaseTasks load failed",
        args && args.get_message && args.get_message()
      );
      tasksData = [];
      tasksDone = true;
      maybeFinish();
    }
  );
};

/**
 * KPIs:
 *  Active   = CASESLIST Status = Open
 *  Completed = CASESLIST Status = Completed
 *  Closed   = CASESLIST Status = Case Closed
 *  Pending Tasks = CaseTasks Stage NOT in (Completion, Case Closed, Completed)
 */
MainApplication.DashBoardComponent.updateKPIs = function (cases, tasks) {
  var active = 0;
  var completed = 0;
  var closed = 0;

  (cases || []).forEach(function (c) {
    var status = (c.Status || "").trim();
    if (status === "Open") active++;
    else if (status === "Completed") completed++;
    else if (status === "Case Closed") closed++;
  });

  var terminalStages = {
    Completion: true,
    "Case Closed": true,
    Completed: true // defensive alias
  };

  var pendingTasks = 0;
  (tasks || []).forEach(function (t) {
    var stage = (t.Stage || "").trim();
    var taskStatus = (t.TaskStatus || "").trim();
    // Pending action: not in terminal stage, and not already Done
    if (!terminalStages[stage] && taskStatus !== "Done" && taskStatus !== "Cancelled") {
      pendingTasks++;
    }
  });

  AppRequest.kpi = {
    activeCases: active,
    completedCases: completed,
    closedCases: closed,
    pendingTasks: pendingTasks
  };

  MainApplication.DashBoardComponent.renderKPIs(AppRequest.kpi);
};

MainApplication.DashBoardComponent.renderKPIs = function (kpi) {
  $("#dash-active").text(kpi.activeCases);
  $("#dash-completed").text(kpi.completedCases);
  $("#dash-closed").text(kpi.closedCases);
  $("#dash-pending-tasks").text(kpi.pendingTasks);

  // Optional badge under pending tasks
  var $badge = $("#dash-pending-badge");
  if ($badge.length) {
    if (kpi.pendingTasks > 0) {
      $badge.text("Needs action").show();
    } else {
      $badge.text("All clear").show();
    }
  }
};

/**
 * Recent Cases — 10 latest from CASESLIST, no pagination, no Loan column
 */
MainApplication.DashBoardComponent.showRecentCases = function (cases) {
  var rows = (cases || []).slice(0, 10);
  AppRequest.dataForExport = cases || [];

  var $tbody = $("#speed-data-table");
  if (!$tbody.length) {
    console.warn("[Dashboard] #speed-data-table not found");
    return;
  }

  if (!rows.length) {
    $("#tasktable").hide();
    $tbody.empty();
    $(".threport").hide();
    $(".norequest").show();
    return;
  }

  $("#tasktable").show();
  $(".threport").show();
  $(".norequest").hide();

  // Hide pagination if present
  $("#myrequestpagination, #toppagination").hide();

  var html = rows
    .map(function (row, idx) {
      var caseId = row.CaseID || "";
      var client = personVal(row.Client);
      var adviser = personVal(row.Adviser);
      var status = row.Status || "—";
      var link =
        '<a href="#/case?itemId=' +
        encodeURIComponent(caseId) +
        '">' +
        caseId +
        "</a>";

      return (
        "<tr>" +
        "<td>" +
        (idx + 1) +
        "</td>" +
        "<td>" +
        link +
        "</td>" +
        "<td>" +
        client +
        "</td>" +
        "<td>" +
        adviser +
        "</td>" +
        "<td>" +
        status +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  $tbody.html(html);
};

/**
 * Activity Feed — from CaseTasks (recent), styled like the previous dummy feed
 */
MainApplication.DashBoardComponent.renderActivityFeed = function (tasks) {
  var $feed = $("#dash-activity-feed");
  if (!$feed.length) return;

  var items = (tasks || []).slice(0, 5);

  if (!items.length) {
    $feed.html(
      '<div class="act-item"><div class="act-text" style="color:var(--muted)">No recent task activity</div></div>'
    );
    return;
  }

  var html = items
    .map(function (t) {
      var icon = activityIcon(t.Stage, t.TaskStatus);
      var who = t.AssignedToDisplay && t.AssignedToDisplay !== "—" ? t.AssignedToDisplay : "Team";
      var title = t.Title || "Task update";
      var stageBit = t.Stage ? " · <strong>" + t.Stage + "</strong>" : "";
      var statusBit =
        t.TaskStatus && t.TaskStatus !== "Open"
          ? " <span style=\"opacity:0.75\">(" + t.TaskStatus + ")</span>"
          : "";
      var when = relativeTime(t.Modified || t.Created);
      var caseRef = t.CaseID || "";

      return (
        '<div class="act-item">' +
        '<div class="act-dot" style="background:' +
        icon.bg +
        '">' +
        icon.emoji +
        "</div>" +
        "<div>" +
        '<div class="act-text">' +
        who +
        " — " +
        title +
        stageBit +
        statusBit +
        "</div>" +
        '<div class="act-time">' +
        (caseRef
          ? '<a href="#/case?itemId=' +
            encodeURIComponent(caseRef) +
            '">' +
            caseRef +
            "</a> · "
          : "") +
        when +
        "</div>" +
        "</div>" +
        "</div>"
      );
    })
    .join("");

  $feed.html(html);
};