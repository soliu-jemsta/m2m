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
          globalDefinitions.HandlerError("Could not update stage: " + err, true);
          return;
        }

        root.setAttribute("data-current-stage", newStage);
        if (window.showToast) {
          showToast("Stage updated to " + newStage + " — tasks created", "success");
        } else {
          globalDefinitions.HandlerSuccess("Stage updated to " + newStage);
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
    if (!container) return;

    _lastKanban = { caseId: caseId, containerId: containerId };

    CaseTaskService.getAllTasksForCase(caseId, function (err, tasks) {
      if (err) {
        container.innerHTML = '<div style="padding:12px;color:var(--red)">Could not load tasks: ' + err + '</div>';
        return;
      }

      var byStage = {};
      (tasks || []).forEach(function (t) {
        var s = t.Stage || "Lead";
        (byStage[s] = byStage[s] || []).push(t);
      });

      var stages = window.CASE_STAGES || [];
      container.innerHTML = stages.map(function (stage) {
        var stageTasks = byStage[stage] || [];
        var openCount = stageTasks.filter(function (t) { return t.TaskStatus !== "Done"; }).length;
        var isCurrent = stage === currentStage;

        var cardsHtml = stageTasks.length
          ? stageTasks.map(taskCardHtml).join("")
          : '<div class="kb-empty">No tasks at this stage</div>';

        return (
          '<div class="kb-col' + (isCurrent ? " current" : "") + '">' +
            '<div class="kb-col-hdr">' +
              '<span>' + stage + '</span>' +
              '<span class="kb-count">' + openCount + '/' + stageTasks.length + '</span>' +
            '</div>' +
            '<div class="kb-col-body">' + cardsHtml + '</div>' +
          '</div>'
        );
      }).join("");
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
    completeTask: completeTask
  };
})();

if (typeof window !== "undefined") {
  window.CaseStageUI = CaseStageUI;
}
