/**
 * CaseTaskService
 * ---------------
 * Lightweight helpers for:
 *  - Creating tasks from templates when a stage is set/changed
 *  - Updating CASESLIST stage
 *  - Completing tasks
 *
 * Depends on:
 *  - $spcontext (your existing SpeedPoint / SP helper)
 *  - configProperties.CASESLIST / CASETASKSLIST
 *  - taskTemplates.js (CASE_STAGES, getTemplatesForStage, applyTaskTokens, resolveAssignee)
 *  - CurrentUserProperties
 *
 * Usage:
 *   CaseTaskService.onStageSet({
 *     CaseID: "MB-2026-000024",
 *     ApplicationType: "MORTGAGE",
 *     Stage: "Fact Find",
 *     Client: "James Harrington",
 *     Adviser: <SP user or login>,
 *     CaseManager: <SP user or login>,
 *     CaseListItemId: 42   // optional — ID in CASESLIST for direct update
 *   });
 */

var CaseTaskService = (function () {
  "use strict";

  function getTasksListName() {
    if (typeof configProperties !== "undefined" && configProperties.CASETASKSLIST) {
      return configProperties.CASETASKSLIST.setting;
    }
    return "CaseTasks";
  }

  function getCasesListName() {
    if (typeof configProperties !== "undefined" && configProperties.CASESLIST) {
      return configProperties.CASESLIST.setting;
    }
    return "Cases";
  }

  function addDays(date, days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + (days || 0));
    return d;
  }

  /**
   * Create CaseTasks items from templates for a stage.
   * context: { CaseID, ApplicationType, Stage, Client, Adviser, CaseManager, ProtectionAdviser, Initiator }
   * callback: function(err, createdItems)
   */
  function createTasksForStage(context, callback) {
    callback = callback || function () {};

    if (!context || !context.CaseID || !context.Stage) {
      callback("CaseID and Stage are required");
      return;
    }

    var templates = getTemplatesForStage(context.Stage, context.ApplicationType || "MORTGAGE");
    if (!templates.length) {
      callback(null, []);
      return;
    }

    var now = new Date();
    var items = templates.map(function (t) {
      var assignee = resolveAssignee(t.AssignToRole, context);
      var title = applyTaskTokens(t.TaskTitle, {
        Client: context.Client,
        CaseID: context.CaseID,
        Adviser: context.AdviserName || "",
        Stage: context.Stage
      });

      var item = {
        Title: title,
        CaseID: context.CaseID,
        ApplicationType: context.ApplicationType || "",
        TaskStatus: "Open",
        Stage: context.Stage,
        TemplateKey: t.TemplateKey,
        IsAutoCreated: true,
        Priority: t.Priority || "Medium"
      };

      if (assignee) {
        item.AssignedTo = assignee; // expects format $spcontext understands (login or people field value)
      }
      if (t.DueInDays != null) {
        item.DueDate = addDays(now, t.DueInDays);
      }

      return item;
    });

    $spcontext.createItems(items, getTasksListName(), function (created) {
      callback(null, created || []);
    }, function (err) {
      console.error("CaseTaskService.createTasksForStage failed", err);
      callback(err);
    });
  }

  /**
   * Update CurrentStage on CASESLIST and create tasks for the new stage.
   * options: {
   *   CaseID,
   *   CaseListItemId,      // preferred if known
   *   Stage,
   *   ApplicationType,
   *   Client, Adviser, CaseManager, ...
   *   skipTasks: false     // set true if you only want to change stage
   * }
   */
  function changeStage(options, callback) {
    callback = callback || function () {};

    if (!options || !options.Stage) {
      callback("Stage is required");
      return;
    }

    var casesList = getCasesListName();
    var updateObj = {
      CurrentStage: options.Stage,
      LastActionDate: new Date(),
      LastActionBy: CurrentUserProperties && CurrentUserProperties.email
        ? CurrentUserProperties.email
        : undefined
    };

    function afterUpdate() {
      if (options.skipTasks) {
        callback(null, { stageUpdated: true, tasks: [] });
        return;
      }
      createTasksForStage({
        CaseID: options.CaseID,
        ApplicationType: options.ApplicationType,
        Stage: options.Stage,
        Client: options.Client,
        Adviser: options.Adviser,
        AdviserName: options.AdviserName,
        CaseManager: options.CaseManager,
        ProtectionAdviser: options.ProtectionAdviser,
        Initiator: options.Initiator || (CurrentUserProperties && CurrentUserProperties.email)
      }, function (err, tasks) {
        callback(err, { stageUpdated: true, tasks: tasks || [] });
      });
    }

    if (options.CaseListItemId) {
      updateObj.ID = options.CaseListItemId;
      $spcontext.updateItems([updateObj], casesList, function () {
        afterUpdate();
      }, function (err) {
        callback(err);
      });
    } else if (options.CaseID) {
      // Lookup by CaseID then update
      var caml =
        "<View><Query><Where>" +
        "<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" + options.CaseID + "</Value></Eq>" +
        "</Where></Query></View>";

      $spcontext.getItem(casesList, caml, function (items) {
        if (!items || !items.length) {
          callback("Case not found in CASESLIST: " + options.CaseID);
          return;
        }
        updateObj.ID = items[0].ID || items[0].get_id && items[0].get_id();
        $spcontext.updateItems([updateObj], casesList, function () {
          afterUpdate();
        }, function (err) {
          callback(err);
        });
      }, function (err) {
        callback(err);
      });
    } else {
      callback("CaseListItemId or CaseID is required");
    }
  }

  /**
   * Mark a task as Done
   */
  function completeTask(taskItemId, callback) {
    callback = callback || function () {};
    var updateObj = {
      ID: taskItemId,
      TaskStatus: "Done",
      CompletedDate: new Date(),
      CompletedBy: CurrentUserProperties && CurrentUserProperties.email
        ? CurrentUserProperties.email
        : undefined
    };
    $spcontext.updateItems([updateObj], getTasksListName(), function () {
      callback(null);
    }, function (err) {
      callback(err);
    });
  }

  /**
   * Load open tasks for a case
   */
  function getOpenTasksForCase(caseId, callback) {
    var caml =
      "<View><Query><Where><And>" +
      "<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" + caseId + "</Value></Eq>" +
      "<Eq><FieldRef Name='TaskStatus'/><Value Type='Choice'>Open</Value></Eq>" +
      "</And></Where>" +
      "<OrderBy><FieldRef Name='DueDate' Ascending='TRUE'/></OrderBy>" +
      "</Query></View>";

    $spcontext.getListToItems(getTasksListName(), caml, function (items) {
      callback(null, items || []);
    }, function (err) {
      callback(err, []);
    });
  }

  /**
   * Called right after a new case is created (from proceedToList).
   * Sets initial stage and creates the first tasks.
   */
  function onNewCaseCreated(context, callback) {
    // context must include: CaseID, CaseListItemId, ApplicationType, Client, Adviser, ...
    var initialStage = context.InitialStage || "Lead";
    changeStage({
      CaseID: context.CaseID,
      CaseListItemId: context.CaseListItemId,
      Stage: initialStage,
      ApplicationType: context.ApplicationType,
      Client: context.Client,
      Adviser: context.Adviser,
      AdviserName: context.AdviserName,
      CaseManager: context.CaseManager,
      Initiator: context.Initiator
    }, callback);
  }

  /**
   * Load ALL tasks for a case (Open + Done) — used by the Kanban board.
   */
  function getAllTasksForCase(caseId, callback) {
    var caml =
      "<View><Query><Where>" +
      "<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" + caseId + "</Value></Eq>" +
      "</Where>" +
      "<OrderBy><FieldRef Name='DueDate' Ascending='TRUE'/></OrderBy>" +
      "</Query></View>";

    $spcontext.getListToItems(getTasksListName(), caml, function (items) {
      callback(null, items || []);
    }, function (err) {
      callback(err, []);
    });
  }

  return {
    createTasksForStage: createTasksForStage,
    changeStage: changeStage,
    completeTask: completeTask,
    getOpenTasksForCase: getOpenTasksForCase,
    onNewCaseCreated: onNewCaseCreated,
    getTasksListName: getTasksListName,
    getCasesListName: getCasesListName,
    getAllTasksForCase: getAllTasksForCase,
  };
})();

if (typeof window !== "undefined") {
  window.CaseTaskService = CaseTaskService;
}
