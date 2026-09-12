/**
 * Change Stage UI helper
 * ----------------------
 * Call from Case Detail page when user picks a new stage and clicks "Advance Stage".
 *
 * Expected DOM (simple version):
 *   <select id="case_next_stage">...</select>
 *   <button onclick="CaseStageUI.advance()">Advance Stage</button>
 *
 * Or call CaseStageUI.advanceWithData({...}) from React.
 */

var CaseStageUI = (function () {
  "use strict";

  /**
   * Populate a <select> with CASE_STAGES
   */
  function fillStageSelect(selectId, currentStage) {
    var el = document.getElementById(selectId);
    if (!el || !window.CASE_STAGES) return;

    el.innerHTML = CASE_STAGES.map(function (s) {
      var selected = s === currentStage ? " selected" : "";
      return '<option value="' + s + '"' + selected + ">" + s + "</option>";
    }).join("");
  }

  /**
   * Read from a page that has data attributes or hidden fields, then change stage.
   * Expected hidden fields / data on #caseDetailRoot:
   *   data-case-id, data-case-list-id, data-app-type, data-client, data-adviser
   */
  function advance() {
    var root = document.getElementById("caseDetailRoot");
    var stageEl = document.getElementById("case_next_stage");
    if (!root || !stageEl) {
      console.error("caseDetailRoot or case_next_stage not found");
      return;
    }

    var newStage = stageEl.value;
    var current = root.getAttribute("data-current-stage");
    if (newStage === current) {
      if (window.showToast) showToast("Already on this stage", "info");
      else alert("Already on this stage");
      return;
    }

    if (!confirm("Move case to stage: " + newStage + "?\n\nThis will create the standard tasks for that stage.")) {
      return;
    }

    globalDefinitions.callLoader();

    CaseTaskService.changeStage(
      {
        CaseID: root.getAttribute("data-case-id"),
        CaseListItemId: parseInt(root.getAttribute("data-case-list-id"), 10) || undefined,
        Stage: newStage,
        ApplicationType: root.getAttribute("data-app-type"),
        Client: root.getAttribute("data-client"),
        Adviser: root.getAttribute("data-adviser"),
        CaseManager: root.getAttribute("data-case-manager") || root.getAttribute("data-adviser"),
        Initiator: CurrentUserProperties.email
      },
      function (err, result) {
        globalDefinitions.closeLoader();
        if (err) {
          var msg = (window.CaseTaskService && CaseTaskService.formatError)
            ? CaseTaskService.formatError(err)
            : (typeof err === "string" ? err : (err && err.message) || String(err));
          globalDefinitions.HandlerError("Could not update stage: " + msg, false);
          return;
        }

        root.setAttribute("data-current-stage", newStage);
        $("#caseHeaderStage").text(newStage);

        var successMsg = "Stage updated to " + newStage;
        if (result && result.taskWarning) {
          successMsg += " (tasks warning: " + result.taskWarning + ")";
        } else {
          successMsg += " — tasks created";
        }

        if (window.showToast) {
          showToast(successMsg, "success");
        } else {
          globalDefinitions.HandlerSuccess(successMsg);
        }

        // Refresh open tasks panel if present
        if (typeof CaseStageUI.reloadTasks === "function") {
          CaseStageUI.reloadTasks(root.getAttribute("data-case-id"));
        }

        // Optional: refresh stage pill / progress bar
        if (typeof CaseStageUI.refreshProgress === "function") {
          CaseStageUI.refreshProgress(newStage);
        }
      }
    );
  }

  /**
   * Programmatic version for React / SPFx pages
   */
  function advanceWithData(data, callback) {
    CaseTaskService.changeStage(data, callback);
  }

  /**
   * Render open tasks into a container
   */
  function reloadTasks(caseId, containerId) {
    containerId = containerId || "caseOpenTasks";
    var container = document.getElementById(containerId);
    if (!container) return;

    CaseTaskService.getOpenTasksForCase(caseId, function (err, tasks) {
      if (err || !tasks.length) {
        container.innerHTML =
          '<div style="padding:12px;color:#94a3b8;font-size:13px">No open tasks for this case.</div>';
        return;
      }

      container.innerHTML = tasks
        .map(function (t) {
          var due = t.DueDate
            ? new Date(t.DueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
            : "—";
          var priority = t.Priority || "Medium";
          var id = t.ID || t.Id;
          return (
            '<div class="task-item" data-task-id="' + id + '">' +
            '<div class="task-check" onclick="CaseStageUI.completeTask(' + id + ',\'' + caseId + '\')"></div>' +
            '<div class="task-text">' + (t.Title || "") + "</div>" +
            '<span class="task-due">' + due + "</span>" +
            '<span class="pill">' + priority + "</span>" +
            "</div>"
          );
        })
        .join("");
    });
  }

    var _lastKanban = null; // { caseId, containerId }

  function dueClass(dueDate, isDone) {
    if (isDone) return "due-done";
    if (!dueDate) return "due-ok";
    var due = new Date(dueDate);
    var today = new Date();
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    if (due < today) return "due-over";
    if (due.getTime() === today.getTime()) return "due-today";
    return "due-ok";
  }

  function priorityClass(p) {
    p = (p || "Medium").toLowerCase();
    if (p === "high") return "kb-priority-high";
    if (p === "low") return "kb-priority-low";
    return "kb-priority-medium";
  }

  function taskCardHtml(t) {
    var id = t.ID || t.Id;
    var isDone = t.TaskStatus === "Done";
    var due = t.DueDate
      ? new Date(t.DueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
      : "—";

    return (
      '<div class="kb-card' + (isDone ? " done" : "") + '" data-task-id="' + id + '">' +
        '<div class="kb-card-top">' +
          '<div class="task-check' + (isDone ? " done" : "") + '"' +
            (isDone ? "" : ' onclick="CaseStageUI.completeTask(' + id + ',\'' + t.CaseID + '\')"') +
            '>' + (isDone ? "✓" : "") + '</div>' +
          '<div class="task-text' + (isDone ? " done" : "") + '">' + (t.Title || "") + '</div>' +
        '</div>' +
        '<div class="kb-card-meta">' +
          '<span class="kb-priority ' + priorityClass(t.Priority) + '">' + (t.Priority || "Medium") + '</span>' +
          '<span class="task-due ' + dueClass(t.DueDate, isDone) + '">' + due + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  /**
   * Render a per-case Kanban board: one column per CASE_STAGES entry,
   * cards = this case's tasks in that stage.
   */
  function renderKanban(caseId, containerId, currentStage) {
    containerId = containerId || "caseKanbanBoard";
    var container = document.getElementById(containerId);
    if (!container) {
      console.warn("[Kanban] container not found:", containerId);
      return;
    }

    _lastKanban = { caseId: caseId, containerId: containerId, currentStage: currentStage };

    if (!window.CaseTaskService || typeof CaseTaskService.getAllTasksForCase !== "function") {
      container.innerHTML = '<div style="padding:12px;color:#dc2626">CaseTaskService is not loaded — cannot render Kanban.</div>';
      return;
    }

    var stages = window.CASE_STAGES || [];
    if (!stages.length) {
      container.innerHTML = '<div style="padding:12px;color:#dc2626">CASE_STAGES is empty — check taskTemplate.js is loaded.</div>';
      return;
    }

    container.innerHTML = '<div style="padding:12px;color:#94a3b8;font-size:13px">Loading tasks…</div>';

    CaseTaskService.getAllTasksForCase(caseId, function (err, tasks) {
      if (err) {
        container.innerHTML = '<div style="padding:12px;color:#dc2626">Could not load tasks: ' + err + '</div>';
        return;
      }

      var byStage = {};
      (tasks || []).forEach(function (t) {
        var s = t.Stage || "Lead";
        (byStage[s] = byStage[s] || []).push(t);
      });

      container.innerHTML = stages.map(function (stage) {
        var stageTasks = byStage[stage] || [];
        var openCount = stageTasks.filter(function (t) { return t.TaskStatus !== "Done"; }).length;
        var isCurrent = stage === currentStage;

        var cardsHtml = stageTasks.length
          ? stageTasks.map(taskCardHtml).join("")
          : '<div class="kb-empty">No tasks — drop here</div>';

        return (
          '<div class="kb-col' + (isCurrent ? " current" : "") + '" data-stage="' + stage + '">' +
            '<div class="kb-col-hdr">' +
              '<span>' + stage + '</span>' +
              '<span class="kb-count">' + openCount + '/' + stageTasks.length + '</span>' +
            '</div>' +
            '<div class="kb-col-body" data-stage="' + stage + '">' + cardsHtml + '</div>' +
          '</div>'
        );
      }).join("");

      bindKanbanDragDrop(container, caseId);
    });
  }

  function bindKanbanDragDrop(container, caseId) {
    var cards = container.querySelectorAll(".kb-card[data-task-id]");
    cards.forEach(function (card) {
      card.setAttribute("draggable", "true");
      card.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", card.getAttribute("data-task-id"));
        e.dataTransfer.effectAllowed = "move";
        card.classList.add("kb-dragging");
      });
      card.addEventListener("dragend", function () {
        card.classList.remove("kb-dragging");
        container.querySelectorAll(".kb-col-body").forEach(function (b) {
          b.classList.remove("kb-drop-target");
        });
      });
    });

    var bodies = container.querySelectorAll(".kb-col-body");
    bodies.forEach(function (body) {
      body.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        body.classList.add("kb-drop-target");
      });
      body.addEventListener("dragleave", function () {
        body.classList.remove("kb-drop-target");
      });
      body.addEventListener("drop", function (e) {
        e.preventDefault();
        body.classList.remove("kb-drop-target");
        var taskId = e.dataTransfer.getData("text/plain");
        var newStage = body.getAttribute("data-stage");
        if (!taskId || !newStage) return;

        if (!CaseTaskService.moveTaskToStage) {
          // fallback: update Stage field directly
          $spcontext.updateItems(
            [{ ID: parseInt(taskId, 10), Stage: newStage }],
            CaseTaskService.getTasksListName(),
            function () {
              if (window.CaseStageUI) {
                CaseStageUI.renderKanban(caseId, container.id, _lastKanban && _lastKanban.currentStage);
              }
              if (MainApplication.notyf) MainApplication.notyf.success("Moved to " + newStage);
            },
            function (sender, args) {
              var msg = (args && args.get_message && args.get_message()) || "Move failed";
              globalDefinitions.HandlerError(msg, false);
            }
          );
          return;
        }

        CaseTaskService.moveTaskToStage(parseInt(taskId, 10), newStage, function (err) {
          if (err) {
            globalDefinitions.HandlerError("Could not move task: " + err, false);
            return;
          }
          if (MainApplication.notyf) MainApplication.notyf.success("Moved to " + newStage);
          renderKanban(caseId, container.id, _lastKanban && _lastKanban.currentStage);
        });
      });
    });
  }
  
  function completeTask(taskId, caseId) {
    CaseTaskService.completeTask(taskId, function (err) {
      if (err) {
        if (window.showToast) showToast("Could not complete task", "error");
        return;
      }
      if (window.showToast) showToast("Task completed", "success");
      reloadTasks(caseId);
      if (_lastKanban && _lastKanban.caseId === caseId) {
        renderKanban(caseId, _lastKanban.containerId,
          document.getElementById("caseDetailRoot") &&
          document.getElementById("caseDetailRoot").getAttribute("data-current-stage"));
      }
    });
  }

  return {
    fillStageSelect: fillStageSelect,
    advance: advance,
    advanceWithData: advanceWithData,
    reloadTasks: reloadTasks,
    completeTask: completeTask,
    renderKanban: renderKanban
  };
})();

if (typeof window !== "undefined") {
  window.CaseStageUI = CaseStageUI;
}