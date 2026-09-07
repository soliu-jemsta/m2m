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

  function completeTask(taskId, caseId) {
    CaseTaskService.completeTask(taskId, function (err) {
      if (err) {
        if (window.showToast) showToast("Could not complete task", "error");
        return;
      }
      if (window.showToast) showToast("Task completed", "success");
      reloadTasks(caseId);
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
