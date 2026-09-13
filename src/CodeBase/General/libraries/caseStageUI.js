/**
 * CaseStageUI — stage select, advance, kanban (drag), manual task modal
 */

var CaseStageUI = (function () {
  "use strict";

  var _lastKanban = null; // { caseId, containerId, currentStage }

  function fillStageSelect(selectId, currentStage) {
    var el = document.getElementById(selectId);
    if (!el || !window.CASE_STAGES) return;

    el.innerHTML = CASE_STAGES.map(function (s) {
      var selected = s === currentStage ? " selected" : "";
      return '<option value="' + s + '"' + selected + ">" + s + "</option>";
    }).join("");
  }

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
      if (MainApplication.notyf) MainApplication.notyf.success("Already on this stage");
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
        Initiator: CurrentUserProperties && CurrentUserProperties.email
      },
      function (err, result) {
        globalDefinitions.closeLoader();
        if (err) {
          var msg =
            window.CaseTaskService && CaseTaskService.formatError
              ? CaseTaskService.formatError(err)
              : typeof err === "string"
              ? err
              : (err && err.message) || String(err);
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

        if (MainApplication.notyf) MainApplication.notyf.success(successMsg);
        else globalDefinitions.HandlerSuccess(successMsg);

        renderKanban(root.getAttribute("data-case-id"), "caseKanbanBoard", newStage);
      }
    );
  }

  function advanceWithData(data, callback) {
    CaseTaskService.changeStage(data, callback);
  }

  function dueClass(dueDate, isDone) {
    if (isDone) return "due-done";
    if (!dueDate) return "due-ok";
    var due = new Date(dueDate);
    var today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
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

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function taskCardHtml(t) {
    var id = t.ID || t.Id;
    var isDone = t.TaskStatus === "Done";
    var due = t.DueDate
      ? new Date(t.DueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
      : "—";
    var assignee = t.AssignedToDisplay || "";
    var desc = t.Description || "";
    if (desc.length > 120) desc = desc.substring(0, 117) + "…";

    return (
      '<div class="kb-card' +
      (isDone ? " done" : "") +
      '" data-task-id="' +
      id +
      '" draggable="true">' +
      '<div class="kb-card-top">' +
      '<div class="task-check' +
      (isDone ? " done" : "") +
      '"' +
      (isDone
        ? ""
        : ' onclick="event.stopPropagation();CaseStageUI.completeTask(' +
          id +
          ",'" +
          escapeHtml(t.CaseID || "") +
          "')\"") +
      ">" +
      (isDone ? "✓" : "") +
      "</div>" +
      '<div class="task-text' +
      (isDone ? " done" : "") +
      '">' +
      escapeHtml(t.Title || "") +
      "</div>" +
      "</div>" +
      (desc
        ? '<div class="kb-card-desc">' + escapeHtml(desc) + "</div>"
        : "") +
      '<div class="kb-card-meta">' +
      '<span class="kb-priority ' +
      priorityClass(t.Priority) +
      '">' +
      escapeHtml(t.Priority || "Medium") +
      "</span>" +
      '<span class="task-due ' +
      dueClass(t.DueDate, isDone) +
      '">' +
      due +
      "</span>" +
      "</div>" +
      (assignee
        ? '<div class="kb-card-assignee">👤 ' + escapeHtml(assignee) + "</div>"
        : "") +
      '<div class="kb-card-status">' +
      escapeHtml(t.TaskStatus || "Open") +
      (t.IsAutoCreated ? " · auto" : " · manual") +
      "</div>" +
      "</div>"
    );
  }

  function renderKanban(caseId, containerId, currentStage) {
    containerId = containerId || "caseKanbanBoard";
    var container = document.getElementById(containerId);
    if (!container) {
      console.warn("[Kanban] container not found:", containerId);
      return;
    }

    _lastKanban = { caseId: caseId, containerId: containerId, currentStage: currentStage };

    if (!window.CaseTaskService || typeof CaseTaskService.getAllTasksForCase !== "function") {
      container.innerHTML =
        '<div style="padding:12px;color:#dc2626">CaseTaskService is not loaded — cannot render Kanban.</div>';
      return;
    }

    var stages = window.CASE_STAGES || [];
    if (!stages.length) {
      container.innerHTML =
        '<div style="padding:12px;color:#dc2626">CASE_STAGES is empty — check taskTemplate.js is loaded.</div>';
      return;
    }

    container.innerHTML =
      '<div style="padding:12px;color:#94a3b8;font-size:13px">Loading tasks…</div>';

    CaseTaskService.getAllTasksForCase(caseId, function (err, tasks) {
      if (err) {
        container.innerHTML =
          '<div style="padding:12px;color:#dc2626">Could not load tasks: ' + err + "</div>";
        return;
      }

      var byStage = {};
      (tasks || []).forEach(function (t) {
        var s = t.Stage || "Lead";
        (byStage[s] = byStage[s] || []).push(t);
      });

      container.innerHTML = stages
        .map(function (stage) {
          var stageTasks = byStage[stage] || [];
          var openCount = stageTasks.filter(function (t) {
            return t.TaskStatus !== "Done";
          }).length;
          var isCurrent = stage === currentStage;

          var cardsHtml = stageTasks.length
            ? stageTasks.map(taskCardHtml).join("")
            : '<div class="kb-empty">No tasks — drop here</div>';

          return (
            '<div class="kb-col' +
            (isCurrent ? " current" : "") +
            '" data-stage="' +
            stage +
            '">' +
            '<div class="kb-col-hdr">' +
            "<span>" +
            stage +
            "</span>" +
            '<span class="kb-count">' +
            openCount +
            "/" +
            stageTasks.length +
            "</span>" +
            "</div>" +
            '<div class="kb-col-body" data-stage="' +
            stage +
            '">' +
            cardsHtml +
            "</div>" +
            
            "</div>"
          );
        })
        .join("");

      bindKanbanDragDrop(container, caseId);
      bindAddTaskButtons(container, caseId);
    });
  }

  function bindAddTaskButtons(container, caseId) {
    container.querySelectorAll(".kb-add-task").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openNewTaskModal(caseId, btn.getAttribute("data-stage"));
      });
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

        var root = document.getElementById("caseDetailRoot");
        var caseListId = root
          ? parseInt(root.getAttribute("data-case-list-id"), 10)
          : undefined;
        var appCaseId = root ? root.getAttribute("data-case-id") : caseId;

        CaseTaskService.moveTaskToStage(
          parseInt(taskId, 10),
          newStage,
          function (err, result) {
            if (err) {
              globalDefinitions.HandlerError("Could not move task: " + err, false);
              return;
            }

            // Reflect CASESLIST CurrentStage in header
            if (result && result.caseStageUpdated && root) {
              root.setAttribute("data-current-stage", newStage);
              $("#caseHeaderStage").text(newStage);
              var sel = document.getElementById("case_next_stage");
              if (sel) sel.value = newStage;
            }

            var msg = "Moved to " + newStage;
            if (result && result.caseStageUpdated) {
              msg += " (case stage updated)";
            } else if (result && result.caseStageWarning) {
              msg += " (case stage warning: " + result.caseStageWarning + ")";
            }
            if (MainApplication.notyf) MainApplication.notyf.success(msg);

            renderKanban(
              caseId,
              container.id,
              (root && root.getAttribute("data-current-stage")) || newStage
            );
          },
          {
            alsoUpdateCaseStage: true,
            CaseID: appCaseId,
            CaseListItemId: caseListId
          }
        );
      });
    });
  }

  function ensureNewTaskModal() {
    if (document.getElementById("newTaskModal")) return;

    var html =
      '<div id="newTaskModal" class="kb-modal-overlay" style="display:none">' +
      '<div class="kb-modal">' +
      '<div class="kb-modal-hdr">' +
      "<h3>New task</h3>" +
      '<button type="button" class="kb-modal-close" id="newTaskModalClose">×</button>' +
      "</div>" +
      '<div class="kb-modal-body">' +
      '<label class="kb-field"><span>Title *</span>' +
      '<input type="text" id="nt_title" placeholder="Task title" /></label>' +
      '<label class="kb-field"><span>Stage</span>' +
      '<select id="nt_stage"></select></label>' +
      '<label class="kb-field"><span>Priority</span>' +
      '<select id="nt_priority">' +
      '<option>High</option><option selected>Medium</option><option>Low</option>' +
      "</select></label>" +
      '<label class="kb-field"><span>Assign to (email)</span>' +
      '<input type="text" id="nt_assignee" placeholder="user@domain.com" /></label>' +
      '<label class="kb-field"><span>Due date</span>' +
      '<input type="date" id="nt_due" /></label>' +
      '<label class="kb-field"><span>Description / comment</span>' +
      '<textarea id="nt_desc" rows="3" placeholder="Details…"></textarea></label>' +
      "</div>" +
      '<div class="kb-modal-ftr">' +
      '<button type="button" class="btn btn-secondary btn-sm" id="newTaskModalCancel">Cancel</button>' +
      '<button type="button" class="btn btn-primary btn-sm" id="newTaskModalSave">Create task</button>' +
      "</div>" +
      "</div></div>";

    document.body.insertAdjacentHTML("beforeend", html);

    document.getElementById("newTaskModalClose").onclick = closeNewTaskModal;
    document.getElementById("newTaskModalCancel").onclick = closeNewTaskModal;
    document.getElementById("newTaskModalSave").onclick = saveNewTask;
  }

  function openNewTaskModal(caseId, defaultStage) {
    ensureNewTaskModal();
    var modal = document.getElementById("newTaskModal");
    modal.setAttribute("data-case-id", caseId);

    var stageSel = document.getElementById("nt_stage");
    var stages = window.CASE_STAGES || [];
    stageSel.innerHTML = stages
      .map(function (s) {
        var sel = s === defaultStage ? " selected" : "";
        return '<option value="' + s + '"' + sel + ">" + s + "</option>";
      })
      .join("");

    document.getElementById("nt_title").value = "";
    document.getElementById("nt_priority").value = "Medium";
    document.getElementById("nt_assignee").value = "";
    document.getElementById("nt_due").value = "";
    document.getElementById("nt_desc").value = "";

    modal.style.display = "flex";
    setTimeout(function () {
      document.getElementById("nt_title").focus();
    }, 50);
  }

  function closeNewTaskModal() {
    var modal = document.getElementById("newTaskModal");
    if (modal) modal.style.display = "none";
  }

  function saveNewTask() {
    var modal = document.getElementById("newTaskModal");
    var caseId = modal.getAttribute("data-case-id");
    var title = (document.getElementById("nt_title").value || "").trim();
    if (!title) {
      globalDefinitions.HandlerError("Title is required", false);
      return;
    }

    var root = document.getElementById("caseDetailRoot");
    var payload = {
      CaseID: caseId,
      Title: title,
      Stage: document.getElementById("nt_stage").value,
      Priority: document.getElementById("nt_priority").value,
      AssignedTo: (document.getElementById("nt_assignee").value || "").trim() || undefined,
      Description: (document.getElementById("nt_desc").value || "").trim() || undefined,
      DueDate: document.getElementById("nt_due").value || undefined,
      ApplicationType: root ? root.getAttribute("data-app-type") : ""
    };

    globalDefinitions.callLoader();
    CaseTaskService.createManualTask(payload, function (err) {
      globalDefinitions.closeLoader();
      if (err) {
        globalDefinitions.HandlerError("Could not create task: " + err, false);
        return;
      }
      closeNewTaskModal();
      if (MainApplication.notyf) MainApplication.notyf.success("Task created");
      var stage =
        (root && root.getAttribute("data-current-stage")) ||
        (_lastKanban && _lastKanban.currentStage) ||
        payload.Stage;
      renderKanban(caseId, "caseKanbanBoard", stage);
    });
  }

  function completeTask(taskId, caseId) {
    CaseTaskService.completeTask(taskId, function (err) {
      if (err) {
        if (MainApplication.notyf) MainApplication.notyf.error("Could not complete task");
        return;
      }
      if (MainApplication.notyf) MainApplication.notyf.success("Task completed");
      var stage =
        document.getElementById("caseDetailRoot") &&
        document.getElementById("caseDetailRoot").getAttribute("data-current-stage");
      renderKanban(caseId, _lastKanban && _lastKanban.containerId, stage);
    });
  }

  function reloadTasks(caseId) {
    var stage =
      document.getElementById("caseDetailRoot") &&
      document.getElementById("caseDetailRoot").getAttribute("data-current-stage");
    renderKanban(caseId, "caseKanbanBoard", stage);
  }

  return {
    fillStageSelect: fillStageSelect,
    advance: advance,
    advanceWithData: advanceWithData,
    reloadTasks: reloadTasks,
    completeTask: completeTask,
    renderKanban: renderKanban,
    openNewTaskModal: openNewTaskModal
  };
})();

if (typeof window !== "undefined") {
  window.CaseStageUI = CaseStageUI;
}