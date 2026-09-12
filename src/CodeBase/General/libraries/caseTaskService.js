/**
 * CaseTaskService — stage updates + task creation from templates
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

  /** Turn SP / generic errors into a readable string */
  function formatError(err) {
    if (err == null) return "Unknown error";
    if (typeof err === "string") return err;
    try {
      if (err.get_message && typeof err.get_message === "function") {
        return err.get_message();
      }
    } catch (e) {}
    // updateItems onFailed(sender, args, meta) — sometimes only args is useful
    if (arguments.length >= 2) {
      var args = arguments[1];
      try {
        if (args && args.get_message) return args.get_message();
      } catch (e) {}
    }
    if (err.message) return err.message;
    if (err.err_description) return err.err_description;
    try {
      return JSON.stringify(err);
    } catch (e) {
      return String(err);
    }
  }

  /**
   * Normalize onFailed from SpeedPoint: (sender, args, meta)
   */
  function spFailToMessage(sender, args, meta) {
    var parts = [];
    try {
      if (args && args.get_message) parts.push(args.get_message());
      else if (args && args.message) parts.push(args.message);
    } catch (e) {}
    if (meta && meta.err_description) parts.push(meta.err_description);
    if (meta && meta.resource) parts.push("(" + meta.resource + ")");
    if (meta && meta.name) parts.push("[" + meta.name + "]");
    if (!parts.length) parts.push(formatError(args || sender || meta));
    return parts.join(" — ");
  }

  function createTasksForStage(context, callback) {
    callback = callback || function () {};

    if (!context || !context.CaseID || !context.Stage) {
      callback("CaseID and Stage are required");
      return;
    }

    if (typeof getTemplatesForStage !== "function") {
      console.warn("getTemplatesForStage missing — skipping task creation");
      callback(null, []);
      return;
    }

    var templates = getTemplatesForStage(
      context.Stage,
      context.ApplicationType || "MORTGAGE"
    );
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
        Stage: context.Stage,
      });

      var item = {
        Title: title,
        CaseID: context.CaseID,
        ApplicationType: context.ApplicationType || "",
        TaskStatus: "Open",
        Stage: context.Stage,
        TemplateKey: t.TemplateKey,
        IsAutoCreated: true,
        Priority: t.Priority || "Medium",
      };

      // Only set AssignedTo if we have a usable value.
      // Person fields often need login/email; if it fails SP will error — we can omit.
      if (assignee && typeof assignee === "string" && assignee.indexOf("@") !== -1) {
        item.AssignedTo = assignee;
      }

      if (t.DueInDays != null) {
        item.DueDate = addDays(now, t.DueInDays);
      }

      return item;
    });

    $spcontext.createItems(
      items,
      getTasksListName(),
      function (created) {
        callback(null, created || []);
      },
      function (sender, args, meta) {
        var msg = spFailToMessage(sender, args, meta);
        console.error("CaseTaskService.createTasksForStage failed", msg);
        callback(msg);
      }
    );
  }

  function changeStage(options, callback) {
    callback = callback || function () {};

    if (!options || !options.Stage) {
      callback("Stage is required");
      return;
    }

    var casesList = getCasesListName();

    // Only update fields that almost certainly exist.
    // Add LastAction* only if you confirmed those columns on CASESLIST.
    var updateObj = {
      CurrentStage: options.Stage,
    };

    // Optional metadata — comment in if columns exist on CASESLIST:
    // updateObj.LastActionDate = new Date();
    // Do NOT set LastActionBy to a raw email unless the column is Single line of text.
    // For Person columns you must ensureUser first.

    function afterUpdate() {
      if (options.skipTasks) {
        callback(null, { stageUpdated: true, tasks: [] });
        return;
      }
      createTasksForStage(
        {
          CaseID: options.CaseID,
          ApplicationType: options.ApplicationType,
          Stage: options.Stage,
          Client: options.Client,
          Adviser: options.Adviser,
          AdviserName: options.AdviserName,
          CaseManager: options.CaseManager,
          ProtectionAdviser: options.ProtectionAdviser,
          Initiator:
            options.Initiator ||
            (CurrentUserProperties && CurrentUserProperties.email),
        },
        function (err, tasks) {
          // Stage already saved — surface task errors as warning, not hard failure
          if (err) {
            console.warn("Stage updated but task creation failed:", err);
            callback(null, {
              stageUpdated: true,
              tasks: tasks || [],
              taskWarning: formatError(err),
            });
            return;
          }
          callback(null, { stageUpdated: true, tasks: tasks || [] });
        }
      );
    }

    function doUpdate(itemId) {
      if (!itemId && itemId !== 0) {
        callback("Missing CASESLIST item ID — cannot update stage");
        return;
      }
      updateObj.ID = itemId;
      console.log("[CaseTaskService] update stage", {
        list: casesList,
        id: itemId,
        stage: options.Stage,
      });

      $spcontext.updateItems(
        [updateObj],
        casesList,
        function () {
          afterUpdate();
        },
        function (sender, args, meta) {
          var msg = spFailToMessage(sender, args, meta);
          console.error("[CaseTaskService] updateItems failed", msg);
          callback(msg);
        }
      );
    }

    if (options.CaseListItemId) {
      doUpdate(parseInt(options.CaseListItemId, 10));
    } else if (options.CaseID) {
      var caml =
        "<View><Query><Where>" +
        "<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" +
        options.CaseID +
        "</Value></Eq>" +
        "</Where></Query></View>";

      $spcontext.getItem(
        casesList,
        caml,
        function (itemCollection) {
          var count =
            itemCollection && itemCollection.get_count
              ? itemCollection.get_count()
              : 0;
          if (!count) {
            callback("Case not found in CASESLIST: " + options.CaseID);
            return;
          }
          var spItem = itemCollection.getItemAtIndex(0);
          doUpdate(spItem.get_id());
        },
        function (sender, args, meta) {
          callback(spFailToMessage(sender, args, meta));
        }
      );
    } else {
      callback("CaseListItemId or CaseID is required");
    }
  }

  function completeTask(taskItemId, callback) {
    callback = callback || function () {};
    var updateObj = {
      ID: taskItemId,
      TaskStatus: "Done",
      CompletedDate: new Date(),
    };
    $spcontext.updateItems(
      [updateObj],
      getTasksListName(),
      function () {
        callback(null);
      },
      function (sender, args, meta) {
        callback(spFailToMessage(sender, args, meta));
      }
    );
  }

  function getOpenTasksForCase(caseId, callback) {
    var caml =
      "<View><Query><Where><And>" +
      "<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" +
      caseId +
      "</Value></Eq>" +
      "<Eq><FieldRef Name='TaskStatus'/><Value Type='Choice'>Open</Value></Eq>" +
      "</And></Where>" +
      "<OrderBy><FieldRef Name='DueDate' Ascending='TRUE'/></OrderBy>" +
      "</Query></View>";

    // Prefer getItem + map if getListToItems signature differs in your build
    $spcontext.getItem(
      getTasksListName(),
      caml,
      function (coll) {
        var out = [];
        try {
          var en = coll.getEnumerator();
          while (en.moveNext()) {
            var it = en.get_current();
            out.push({
              ID: it.get_id(),
              Title: it.get_item("Title"),
              CaseID: it.get_item("CaseID"),
              TaskStatus: it.get_item("TaskStatus"),
              Stage: it.get_item("Stage"),
              Priority: it.get_item("Priority"),
              DueDate: it.get_item("DueDate"),
            });
          }
        } catch (e) {
          console.warn("getOpenTasksForCase map error", e);
        }
        callback(null, out);
      },
      function (sender, args, meta) {
        callback(spFailToMessage(sender, args, meta), []);
      }
    );
  }

  function getAllTasksForCase(caseId, callback) {
    var caml =
      "<View><Query><Where>" +
      "<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" +
      caseId +
      "</Value></Eq>" +
      "</Where>" +
      "<OrderBy><FieldRef Name='ID' Ascending='TRUE'/></OrderBy>" +
      "</Query></View>";

    $spcontext.getItem(
      getTasksListName(),
      caml,
      function (coll) {
        var out = [];
        try {
          var en = coll.getEnumerator();
          while (en.moveNext()) {
            var it = en.get_current();
            out.push({
              ID: it.get_id(),
              Title: it.get_item("Title"),
              CaseID: it.get_item("CaseID"),
              TaskStatus: it.get_item("TaskStatus"),
              Stage: it.get_item("Stage"),
              Priority: it.get_item("Priority"),
              DueDate: it.get_item("DueDate"),
            });
          }
        } catch (e) {
          console.warn("getAllTasksForCase map error", e);
        }
        callback(null, out);
      },
      function (sender, args, meta) {
        // List may not exist yet — return empty rather than hard fail kanban
        console.warn("getAllTasksForCase failed", spFailToMessage(sender, args, meta));
        callback(null, []);
      }
    );
  }

  function onNewCaseCreated(context, callback) {
    var initialStage = context.InitialStage || "Lead";
    changeStage(
      {
        CaseID: context.CaseID,
        CaseListItemId: context.CaseListItemId,
        Stage: initialStage,
        ApplicationType: context.ApplicationType,
        Client: context.Client,
        Adviser: context.Adviser,
        AdviserName: context.AdviserName,
        CaseManager: context.CaseManager,
        Initiator: context.Initiator,
      },
      callback
    );
  }

  return {
    createTasksForStage: createTasksForStage,
    changeStage: changeStage,
    completeTask: completeTask,
    getOpenTasksForCase: getOpenTasksForCase,
    getAllTasksForCase: getAllTasksForCase,
    onNewCaseCreated: onNewCaseCreated,
    getTasksListName: getTasksListName,
    getCasesListName: getCasesListName,
    formatError: formatError,
  };
})();

if (typeof window !== "undefined") {
  window.CaseTaskService = CaseTaskService;
}