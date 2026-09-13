/**
 * CaseTaskService — stage updates + task creation + manual tasks + kanban moves
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

  function formatError(err) {
    if (err == null) return "Unknown error";
    if (typeof err === "string") return err;
    try {
      if (typeof err.get_message === "function") return err.get_message();
    } catch (e) {}
    if (err.message) return err.message;
    if (err.err_description) return err.err_description;
    try {
      return JSON.stringify(err);
    } catch (e) {
      return String(err);
    }
  }

  function spFailToMessage(sender, args, meta) {
    var parts = [];
    try {
      if (args && typeof args.get_message === "function") parts.push(args.get_message());
      else if (args && args.message) parts.push(args.message);
    } catch (e) {}
    if (meta && meta.err_description) parts.push(meta.err_description);
    if (meta && meta.resource) parts.push("(" + meta.resource + ")");
    if (meta && meta.name) parts.push("[" + meta.name + "]");
    if (!parts.length) parts.push("SharePoint operation failed");
    return parts.join(" — ");
  }

  function personDisplay(val) {
    if (!val) return "";
    if (typeof val === "string") return val;
    try {
      if (val.get_lookupValue) return val.get_lookupValue() || "";
    } catch (e) {}
    try {
      if (val.get_title) return val.get_title() || "";
    } catch (e) {}
    if (val.Title) return val.Title;
    if (val.value) return val.value;
    return "";
  }


  /**
   * Build SP.FieldUserValue for Person/Group columns from an email or login.
   */
  function toFieldUserValue(emailOrLogin) {
    if (!emailOrLogin) return null;
    // Already a FieldUserValue-like object
    if (typeof emailOrLogin === "object" && emailOrLogin.get_lookupId) {
      return emailOrLogin;
    }
    var key = String(emailOrLogin).trim();
    if (!key) return null;
    try {
      if (typeof SP !== "undefined" && SP.FieldUserValue && SP.FieldUserValue.fromUser) {
        return SP.FieldUserValue.fromUser(key);
      }
    } catch (e) {
      console.warn("toFieldUserValue fromUser failed", e);
    }
    // Last resort — some tenants accept email string via ensureUser on create
    return key;
  }


  /**
   * Extract an email/login usable for FieldUserValue from mixed person shapes.
   */
  function resolvePersonEmail(value, fallback) {
    if (value && typeof value === "object") {
      try {
        if (value.get_email && value.get_email()) return value.get_email();
      } catch (e) {}
      try {
        if (value.get_lookupValue && String(value.get_lookupValue()).indexOf("@") !== -1) {
          return value.get_lookupValue();
        }
      } catch (e) {}
      if (value.Email) return value.Email;
      if (value.email) return value.email;
      if (value.Login) return value.Login;
      if (value.login) return value.login;
      if (value.value && String(value.value).indexOf("@") !== -1) return value.value;
    }
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (fallback && typeof fallback === "string" && fallback.trim()) {
      return fallback.trim();
    }
    return "";
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
      var assigneeRaw =
        typeof resolveAssignee === "function"
          ? resolveAssignee(t.AssignToRole, context)
          : context.Adviser;
      // Prefer explicit email from context (AdviserName / Initiator), then person object
      var assigneeEmail =
        resolvePersonEmail(assigneeRaw, null) ||
        resolvePersonEmail(context.Adviser, null) ||
        resolvePersonEmail(context.AdviserName, null) ||
        resolvePersonEmail(context.Initiator, null) ||
        (CurrentUserProperties && CurrentUserProperties.email) ||
        "";

      var title = applyTaskTokens(t.TaskTitle, {
        Client: context.Client,
        CaseID: context.CaseID,
        Adviser: context.AdviserName || assigneeEmail || "",
        Stage: context.Stage
      });

      var item = {
        Title: title,
        CaseID: context.CaseID,
        ApplicationType: context.ApplicationType || "",
        TaskStatus: "Open",
        Stage: context.Stage,
        TemplateKey: t.TemplateKey || "",
        IsAutoCreated: true,
        Priority: t.Priority || "Medium"
      };

      if (assigneeEmail) {
        item.AssignedTo = toFieldUserValue(assigneeEmail);
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

  /**
   * Manually create a single task
   * data: { CaseID, Title, Stage, Priority, AssignedTo, Description/Comments, DueDate, ApplicationType }
   */
  function createManualTask(data, callback) {
    callback = callback || function () {};

    if (!data || !data.CaseID || !data.Title) {
      callback("CaseID and Title are required");
      return;
    }

    var item = {
      Title: data.Title,
      CaseID: data.CaseID,
      ApplicationType: data.ApplicationType || "",
      TaskStatus: data.TaskStatus || "Open",
      Stage: data.Stage || "Lead",
      Priority: data.Priority || "Medium",
      IsAutoCreated: false
    };

    if (data.AssignedTo) {
      // Person/Group column — must be SP.FieldUserValue, not a plain email string
      item.AssignedTo = toFieldUserValue(data.AssignedTo);
    }
    if (data.Description) {
      item.Description = data.Description;
    }
    if (data.Comments) {
      item.Comments = data.Comments;
    }
    // Prefer Description; also map Comments → Description if only one column exists
    if (data.Description && !data.Comments) {
      item.Comments = data.Description;
    }
    if (data.DueDate) {
      item.DueDate = data.DueDate instanceof Date ? data.DueDate : new Date(data.DueDate);
    }

    console.log("[CaseTaskService] createManualTask", item);

    $spcontext.createItems(
      [item],
      getTasksListName(),
      function (created) {
        callback(null, created);
      },
      function (sender, args, meta) {
        // Retry without optional fields that may not exist
        var msg = spFailToMessage(sender, args, meta);
        console.warn("createManualTask first attempt failed:", msg, "— retrying minimal fields");

        var minimal = {
          Title: item.Title,
          CaseID: item.CaseID,
          TaskStatus: item.TaskStatus,
          Stage: item.Stage,
          Priority: item.Priority
        };
        if (item.AssignedTo) minimal.AssignedTo = item.AssignedTo;

        $spcontext.createItems(
          [minimal],
          getTasksListName(),
          function (created) {
            callback(null, created);
          },
          function (s2, a2, m2) {
            callback(spFailToMessage(s2, a2, m2));
          }
        );
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
    var updateObj = {
      CurrentStage: options.Stage
    };

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
            (CurrentUserProperties && CurrentUserProperties.email)
        },
        function (err, tasks) {
          if (err) {
            console.warn("Stage updated but task creation failed:", err);
            callback(null, {
              stageUpdated: true,
              tasks: tasks || [],
              taskWarning: formatError(err)
            });
            return;
          }
          callback(null, { stageUpdated: true, tasks: tasks || [] });
        }
      );
    }

    function doUpdate(itemId) {
      if (itemId == null || isNaN(Number(itemId))) {
        callback("Missing or invalid CASESLIST item ID");
        return;
      }
      updateObj.ID = Number(itemId);
      console.log("[CaseTaskService] update stage", {
        list: casesList,
        id: updateObj.ID,
        stage: options.Stage
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
      doUpdate(options.CaseListItemId);
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
            itemCollection && typeof itemCollection.get_count === "function"
              ? itemCollection.get_count()
              : 0;
          if (!count) {
            callback("Case not found in CASESLIST: " + options.CaseID);
            return;
          }
          doUpdate(itemCollection.getItemAtIndex(0).get_id());
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
    $spcontext.updateItems(
      [{ ID: taskItemId, TaskStatus: "Done", CompletedDate: new Date() }],
      getTasksListName(),
      function () {
        callback(null);
      },
      function (sender, args, meta) {
        callback(spFailToMessage(sender, args, meta));
      }
    );
  }

  function mapTaskItem(it) {
    var assigned = null;
    try {
      assigned = it.get_item("AssignedTo");
    } catch (e) {}
    var description = "";
    try {
      description = it.get_item("Description") || "";
    } catch (e) {}
    if (!description) {
      try {
        description = it.get_item("Comments") || "";
      } catch (e) {}
    }
    if (!description) {
      try {
        description = it.get_item("Body") || "";
      } catch (e) {}
    }

    return {
      ID: it.get_id(),
      Title: it.get_item("Title"),
      CaseID: it.get_item("CaseID"),
      TaskStatus: it.get_item("TaskStatus"),
      Stage: it.get_item("Stage"),
      Priority: it.get_item("Priority"),
      DueDate: it.get_item("DueDate"),
      AssignedTo: assigned,
      AssignedToDisplay: personDisplay(assigned),
      Description: description,
      IsAutoCreated: (function () {
        try {
          return it.get_item("IsAutoCreated");
        } catch (e) {
          return null;
        }
      })()
    };
  }

  function getAllTasksForCase(caseId, callback) {
    var caml =
      "<View><Query><Where>" +
      "<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" +
      caseId +
      "</Value></Eq>" +
      "</Where></Query></View>";

    $spcontext.getItem(
      getTasksListName(),
      caml,
      function (coll) {
        var out = [];
        try {
          if (!coll || typeof coll.getEnumerator !== "function") {
            callback(null, []);
            return;
          }
          var en = coll.getEnumerator();
          while (en.moveNext()) {
            out.push(mapTaskItem(en.get_current()));
          }
        } catch (e) {
          console.warn("getAllTasksForCase map error", e);
        }
        callback(null, out);
      },
      function (sender, args, meta) {
        console.warn("getAllTasksForCase failed", spFailToMessage(sender, args, meta));
        callback(null, []);
      }
    );
  }

  function getOpenTasksForCase(caseId, callback) {
    getAllTasksForCase(caseId, function (err, tasks) {
      if (err) {
        callback(err, []);
        return;
      }
      callback(
        null,
        (tasks || []).filter(function (t) {
          return t.TaskStatus !== "Done" && t.TaskStatus !== "Cancelled";
        })
      );
    });
  }

  /**
   * Move a task card to a new stage column.
   * options (optional): { alsoUpdateCaseStage: true, CaseID, CaseListItemId }
   * When alsoUpdateCaseStage is true, CASESLIST.CurrentStage is set to newStage.
   */

  /**
   * If every task for the case is in "Completion" or every task is in "Case Closed",
   * update CASESLIST.Status (and CurrentStage) accordingly.
   * Status values: "Completed" for Completion, "Case Closed" for Case Closed.
   */
  function maybeSyncCaseStatusFromTasks(caseId, caseListItemId, callback) {
    callback = callback || function () {};
    if (!caseId) {
      callback({});
      return;
    }

    getAllTasksForCase(caseId, function (err, tasks) {
      if (err || !tasks || !tasks.length) {
        callback({});
        return;
      }

      var stages = tasks.map(function (t) { return t.Stage || ""; });
      var allCompletion = stages.every(function (s) { return s === "Completion"; });
      var allClosed = stages.every(function (s) { return s === "Case Closed"; });

      if (!allCompletion && !allClosed) {
        callback({});
        return;
      }

      var newStatus = allClosed ? "Case Closed" : "Completed";
      var newStage = allClosed ? "Case Closed" : "Completion";
      var casesList = getCasesListName();

      function applyUpdate(itemId) {
        if (!itemId) {
          callback({});
          return;
        }
        var updateObj = {
          ID: itemId,
          Status: newStatus,
          CurrentStage: newStage
        };
        console.log("[CaseTaskService] all tasks in", newStage, "→ Status =", newStatus);
        $spcontext.updateItems(
          [updateObj],
          casesList,
          function () {
            callback({
              caseStatusUpdated: true,
              caseStatus: newStatus,
              caseStage: newStage
            });
          },
          function (sender, args, meta) {
            console.warn("Status sync failed", spFailToMessage(sender, args, meta));
            callback({ caseStatusWarning: spFailToMessage(sender, args, meta) });
          }
        );
      }

      if (caseListItemId) {
        applyUpdate(parseInt(caseListItemId, 10));
      } else {
        var caml =
          "<View><Query><Where>" +
          "<Eq><FieldRef Name='CaseID'/><Value Type='Text'>" +
          caseId +
          "</Value></Eq>" +
          "</Where></Query></View>";
        $spcontext.getItem(
          casesList,
          caml,
          function (coll) {
            var count = coll && coll.get_count ? coll.get_count() : 0;
            if (!count) {
              callback({});
              return;
            }
            applyUpdate(coll.getItemAtIndex(0).get_id());
          },
          function () {
            callback({});
          }
        );
      }
    });
  }

  function moveTaskToStage(taskId, newStage, callback, options) {
    callback = callback || function () {};
    options = options || {};

    var listName = getTasksListName();
    var id = parseInt(taskId, 10);
    console.log("[CaseTaskService] moveTaskToStage", {
      list: listName,
      taskId: id,
      newStage: newStage,
      alsoUpdateCaseStage: !!options.alsoUpdateCaseStage
    });

    if (!id) {
      callback("Invalid task ID: " + taskId);
      return;
    }

    $spcontext.updateItems(
      [{ ID: id, Stage: newStage }],
      listName,
      function () {
        function finish(extra) {
          extra = extra || {};
          // After any move, if ALL tasks are in Completion or Case Closed → update Status
          maybeSyncCaseStatusFromTasks(options.CaseID, options.CaseListItemId, function (statusResult) {
            callback(null, Object.assign({
              list: listName,
              id: id,
              stage: newStage
            }, extra, statusResult || {}));
          });
        }

        if (!options.alsoUpdateCaseStage) {
          console.log("[CaseTaskService] moveTaskToStage OK (task only)");
          finish({});
          return;
        }

        // Also update Universal CASESLIST.CurrentStage
        changeStage(
          {
            CaseID: options.CaseID,
            CaseListItemId: options.CaseListItemId,
            Stage: newStage,
            skipTasks: true
          },
          function (err) {
            if (err) {
              console.warn("Task moved but CASESLIST CurrentStage failed:", err);
              finish({ caseStageWarning: formatError(err) });
              return;
            }
            console.log("[CaseTaskService] moveTaskToStage OK (task + CASESLIST)");
            finish({ caseStageUpdated: true });
          }
        );
      },
      function (sender, args, meta) {
        var msg = spFailToMessage(sender, args, meta);
        console.error("[CaseTaskService] moveTaskToStage FAILED", msg);
        callback(msg);
      }
    );
  }

  function onNewCaseCreated(context, callback) {
    changeStage(
      {
        CaseID: context.CaseID,
        CaseListItemId: context.CaseListItemId,
        Stage: context.InitialStage || "Lead",
        ApplicationType: context.ApplicationType,
        Client: context.Client,
        Adviser: context.Adviser,
        AdviserName: context.AdviserName,
        CaseManager: context.CaseManager,
        Initiator: context.Initiator
      },
      callback
    );
  }

  return {
    createTasksForStage: createTasksForStage,
    createManualTask: createManualTask,
    changeStage: changeStage,
    completeTask: completeTask,
    getOpenTasksForCase: getOpenTasksForCase,
    getAllTasksForCase: getAllTasksForCase,
    moveTaskToStage: moveTaskToStage,
    onNewCaseCreated: onNewCaseCreated,
    getTasksListName: getTasksListName,
    getCasesListName: getCasesListName,
    formatError: formatError
  };
})();

if (typeof window !== "undefined") {
  window.CaseTaskService = CaseTaskService;
}
