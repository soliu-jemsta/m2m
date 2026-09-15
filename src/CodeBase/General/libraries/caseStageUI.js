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

  function isLockedStage(stage) {
    return stage === "Completion" || stage === "Case Closed";
  }

  function updateNewTaskButtonState(stage) {
    var btn = document.getElementById("btnNewTask");
    if (!btn) return;
    var locked = isLockedStage(stage);
    btn.disabled = locked;
    if (locked) {
      btn.classList.add("disabled");
      btn.setAttribute("title", "Cannot add tasks when case is " + stage);
      btn.style.opacity = "0.5";
      btn.style.pointerEvents = "none";
    } else {
      btn.classList.remove("disabled");
      btn.removeAttribute("title");
      btn.style.opacity = "";
      btn.style.pointerEvents = "";
    }
  }

  function taskCardHtml(t) {
    var id = t.ID || t.Id;
    var isDone = t.TaskStatus === "Done";
    var locked = isLockedStage(t.Stage);
    var due = t.DueDate
      ? new Date(t.DueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
      : "—";
    var assignee = t.AssignedToDisplay || "";
    var fullDesc = t.Description || "";
    var comments = t.Comments || "";
    var commentLines = comments
      ? comments.split("\n").filter(function (l) { return l.trim(); })
      : [];
    var commentCount = commentLines.length;
    var hasExpandable = !!(fullDesc || commentCount);

    var previewDesc = fullDesc;
    if (previewDesc.length > 100) previewDesc = previewDesc.substring(0, 97) + "…";

    var actions = "";
    if (!locked) {
      actions =
        '<div class="kb-card-actions">' +
        '<button type="button" class="kb-btn-edit" data-action="edit" title="Edit task">Edit</button>' +
        '<button type="button" class="kb-btn-comment" data-action="comment" title="Add comment">Comment</button>' +
        "</div>";
    } else {
      actions =
        '<div class="kb-card-actions">' +
        '<button type="button" class="kb-btn-comment" data-action="comment" title="Comments">Comment</button>' +
        "</div>";
    }

    var expandBlock = "";
    if (hasExpandable) {
      expandBlock =
        '<button type="button" class="kb-expand-toggle" data-action="toggle-expand" aria-expanded="false">' +
        '<span class="kb-expand-label">Show more</span></button>' +
        '<div class="kb-card-expand" hidden>' +
        (fullDesc
          ? '<div class="kb-expand-section"><div class="kb-expand-title">Description</div>' +
            '<div class="kb-expand-body">' +
            escapeHtml(fullDesc) +
            "</div></div>"
          : "") +
        (commentCount
          ? '<div class="kb-expand-section"><div class="kb-expand-title">Comments (' +
            commentCount +
            ")</div>" +
            '<div class="kb-expand-comments">' +
            commentLines
              .map(function (l) {
                return '<div class="kb-comment-line">' + escapeHtml(l) + "</div>";
              })
              .join("") +
            "</div></div>"
          : '<div class="kb-expand-section"><div class="kb-expand-title">Comments</div>' +
            '<div class="kb-comment-empty">No comments yet.</div></div>') +
        "</div>";
    }

    return (
      '<div class="kb-card' +
      (isDone ? " done" : "") +
      (locked ? " kb-locked" : "") +
      '" data-task-id="' +
      id +
      '" data-stage="' +
      escapeHtml(t.Stage || "") +
      '" data-case-id="' +
      escapeHtml(t.CaseID || "") +
      '"' +
      (locked ? ' draggable="false"' : ' draggable="true"') +
      ">" +
      '<div class="kb-card-top">' +
      '<div class="task-check' +
      (isDone ? " done" : "") +
      '" data-action="complete" title="' +
      (isDone ? "Completed" : "Mark done") +
      '">' +
      (isDone ? "✓" : "") +
      "</div>" +
      '<div class="task-text' +
      (isDone ? " done" : "") +
      '">' +
      escapeHtml(t.Title || "") +
      "</div>" +
      "</div>" +
      (previewDesc
        ? '<div class="kb-card-desc">' + escapeHtml(previewDesc) + "</div>"
        : "") +
      expandBlock +
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
      (commentCount ? " · 💬 " + commentCount : "") +
      "</div>" +
      actions +
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
    updateNewTaskButtonState(currentStage);

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

          var colExtra = "";
          if (stage === "Completion") colExtra = " kb-col-completion";
          else if (stage === "Case Closed") colExtra = " kb-col-closed";
          if (isLockedStage(stage)) colExtra += " kb-col-locked";

          return (
            '<div class="kb-col' +
            (isCurrent ? " current" : "") +
            colExtra +
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
      bindCardActions(container, caseId, tasks || []);
    });
  }



  var _tasksById = {};

  function bindCardActions(container, caseId, tasks) {
    _tasksById = {};
    (tasks || []).forEach(function (t) {
      _tasksById[String(t.ID || t.Id)] = t;
    });

    container.querySelectorAll(".kb-card[data-task-id]").forEach(function (card) {
      card.addEventListener("click", function (e) {
        var actionEl = e.target.closest("[data-action]");
        if (!actionEl) return;
        e.preventDefault();
        e.stopPropagation();

        var action = actionEl.getAttribute("data-action");
        var taskId = card.getAttribute("data-task-id");
        var taskCaseId = card.getAttribute("data-case-id") || caseId;
        var task = _tasksById[String(taskId)];

        if (action === "toggle-expand") {
          var panel = card.querySelector(".kb-card-expand");
          var label = actionEl.querySelector(".kb-expand-label") || actionEl;
          if (!panel) return;
          var open = panel.hasAttribute("hidden");
          if (open) {
            panel.removeAttribute("hidden");
            actionEl.setAttribute("aria-expanded", "true");
            if (label) label.textContent = "Show less";
            card.classList.add("kb-expanded");
          } else {
            panel.setAttribute("hidden", "");
            actionEl.setAttribute("aria-expanded", "false");
            if (label) label.textContent = "Show more";
            card.classList.remove("kb-expanded");
          }
          return;
        }
        if (action === "complete") {
          if (card.classList.contains("kb-locked")) return;
          if (task && task.TaskStatus === "Done") return;
          completeTask(taskId, taskCaseId, task);
          return;
        }
        if (action === "edit") {
          if (!task || isLockedStage(task.Stage)) return;
          openEditTaskModal(task);
          return;
        }
        if (action === "comment") {
          if (!task) return;
          openCommentModal(task);
          return;
        }
      });
    });
  }

  function bindKanbanDragDrop(container, caseId) {
    var cards = container.querySelectorAll(".kb-card[data-task-id]");
    cards.forEach(function (card) {
      var stage = card.getAttribute("data-stage") || "";
      if (isLockedStage(stage) || card.classList.contains("kb-locked")) {
        card.setAttribute("draggable", "false");
        return; // cannot drag out of Completion / Case Closed
      }
      card.setAttribute("draggable", "true");
      card.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", card.getAttribute("data-task-id"));
        e.dataTransfer.setData(
          "application/x-kb-stage",
          card.getAttribute("data-stage") || ""
        );
        // Some browsers only expose custom types after setData; also stash on element
        card.setAttribute("data-drag-from-stage", card.getAttribute("data-stage") || "");
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

        // Same column drop — cancel, no update
        var fromStage =
          e.dataTransfer.getData("application/x-kb-stage") ||
          (function () {
            var dragged = container.querySelector(
              '.kb-card[data-task-id="' + taskId + '"]'
            );
            return dragged
              ? dragged.getAttribute("data-drag-from-stage") ||
                  dragged.getAttribute("data-stage") ||
                  ""
              : "";
          })();
        if (fromStage && fromStage === newStage) {
          return;
        }

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
            if (result && result.caseStatusUpdated) {
              msg += " — Status set to " + result.caseStatus;
              if (root) {
                root.setAttribute("data-current-stage", result.caseStage || newStage);
                $("#caseHeaderStage").text(result.caseStage || newStage);
              }
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
            CaseListItemId: caseListId,
            fromStage: fromStage
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
      '<label class="kb-field"><span>Assign to</span>' +
      '<select id="nt_assignee" custom-people="nt_assignee" class="kb-people-select" style="width:100%">' +
      '<option value=""></option></select></label>' +
      '<label class="kb-field"><span>Due date</span>' +
      '<input type="date" id="nt_due" /></label>' +
      '<label class="kb-field"><span>Description</span>' +
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
    var root = document.getElementById("caseDetailRoot");
    var stage =
      defaultStage ||
      (root && root.getAttribute("data-current-stage")) ||
      "Lead";
    if (isLockedStage(stage)) {
      if (MainApplication.notyf) {
        MainApplication.notyf.error("Cannot add tasks when case is " + stage);
      } else {
        globalDefinitions.HandlerError("Cannot add tasks when case is " + stage, false);
      }
      return;
    }

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
    document.getElementById("nt_due").value = "";
    document.getElementById("nt_desc").value = "";

    // People picker from MainApplication.advisersList (Title + Email)
    initAssigneePicker();

    modal.style.display = "flex";
    setTimeout(function () {
      document.getElementById("nt_title").focus();
    }, 50);
  }

  function initAssigneePicker() {
    var $sel = $("#nt_assignee");
    if (!$sel.length) return;

    var list =
      (window.MainApplication && MainApplication.advisersList) || [];

    // Prefer existing PeoplePicker + Select2 if available
    if (typeof PeoplePicker !== "undefined" && typeof PeoplePicker.initializePeoplePickers === "function") {
      try {
        if ($sel.data("select2")) {
          $sel.select2("destroy");
        }
      } catch (e) {}
      $sel.empty().append('<option></option>');
      // initializePeoplePickers expects array of { Title, Email } or map by picker id
      PeoplePicker.initializePeoplePickers(
        { nt_assignee: list },
        undefined,
        "custom-people"
      );
      // dropdownParent so Select2 works inside our modal
      try {
        if ($sel.data("select2")) {
          $sel.select2("destroy");
        }
        $sel.select2({
          placeholder: "Select adviser",
          allowClear: true,
          width: "100%",
          dropdownParent: $("#newTaskModal .kb-modal"),
          data: list
            .filter(function (p) { return p && p.Email; })
            .map(function (p) {
              return { id: p.Email, text: p.Title || p.Email };
            })
        });
      } catch (e2) {
        console.warn("Select2 init fallback", e2);
        fillAssigneeOptionsPlain($sel, list);
      }
      return;
    }

    fillAssigneeOptionsPlain($sel, list);
  }

  function fillAssigneeOptionsPlain($sel, list) {
    $sel.empty().append('<option value="">— Unassigned —</option>');
    (list || []).forEach(function (p) {
      if (!p || !p.Email) return;
      var label = p.Title || p.Email;
      $sel.append(
        $("<option></option>").attr("value", p.Email).text(label)
      );
    });
  }

  function getSelectedAssigneeEmail() {
    var $sel = $("#nt_assignee");
    if (!$sel.length) return "";
    var val = $sel.val();
    if (Array.isArray(val)) val = val[0];
    return (val || "").trim();
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
      AssignedTo: getSelectedAssigneeEmail() || undefined,
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


  function ensureEditTaskModal() {
    if (document.getElementById("editTaskModal")) return;
    var html =
      '<div id="editTaskModal" class="kb-modal-overlay" style="display:none">' +
      '<div class="kb-modal">' +
      '<div class="kb-modal-hdr"><h3>Edit task</h3>' +
      '<button type="button" class="kb-modal-close" id="editTaskModalClose">×</button></div>' +
      '<div class="kb-modal-body">' +
      '<input type="hidden" id="et_id" />' +
      '<label class="kb-field"><span>Title *</span><input type="text" id="et_title" /></label>' +
      '<label class="kb-field"><span>Priority</span><select id="et_priority">' +
      '<option>High</option><option>Medium</option><option>Low</option></select></label>' +
      '<label class="kb-field"><span>Assign to</span>' +
      '<select id="et_assignee" custom-people="et_assignee" class="kb-people-select" style="width:100%">' +
      '<option value=""></option></select></label>' +
      '<label class="kb-field"><span>Due date</span><input type="date" id="et_due" /></label>' +
      '<label class="kb-field"><span>Description</span><textarea id="et_desc" rows="3"></textarea></label>' +
      '<label class="kb-field"><span>Task status</span><select id="et_status">' +
      '<option value="Open">Open</option><option value="Done">Done</option>' +
      '<option value="Cancelled">Cancelled</option></select></label>' +
      '</div>' +
      '<div class="kb-modal-ftr">' +
      '<button type="button" class="btn btn-secondary btn-sm" id="editTaskModalCancel">Cancel</button>' +
      '<button type="button" class="btn btn-primary btn-sm" id="editTaskModalSave">Save</button>' +
      '</div></div></div>';
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("editTaskModalClose").addEventListener("click", closeEditTaskModal);
    document.getElementById("editTaskModalCancel").addEventListener("click", closeEditTaskModal);
    document.getElementById("editTaskModalSave").addEventListener("click", saveEditTask);
  }

  function openEditTaskModal(task) {
    ensureEditTaskModal();
    document.getElementById("et_id").value = task.ID;
    document.getElementById("et_title").value = task.Title || "";
    document.getElementById("et_priority").value = task.Priority || "Medium";
    document.getElementById("et_desc").value = task.Description || "";
    document.getElementById("et_status").value = task.TaskStatus || "Open";
    if (task.DueDate) {
      var d = new Date(task.DueDate);
      document.getElementById("et_due").value =
        d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    } else {
      document.getElementById("et_due").value = "";
    }
    // Assignee select
    initEditAssigneePicker(task.AssignedToDisplay, task.AssignedTo);
    document.getElementById("editTaskModal").style.display = "flex";
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function initEditAssigneePicker(displayName, assignedObj) {
    var $sel = $("#et_assignee");
    if (!$sel.length) return;
    var list = (window.MainApplication && MainApplication.advisersList) || [];
    var currentEmail = "";
    try {
      if (assignedObj && assignedObj.get_email) currentEmail = assignedObj.get_email() || "";
    } catch (e) {}
    if (!currentEmail && displayName) {
      // try match by title
      list.forEach(function (p) {
        if (p.Title === displayName) currentEmail = p.Email;
      });
    }
    try {
      if ($sel.data("select2")) $sel.select2("destroy");
    } catch (e) {}
    $sel.empty().append('<option value=""></option>');
    list.forEach(function (p) {
      if (!p || !p.Email) return;
      $sel.append($("<option></option>").attr("value", p.Email).text(p.Title || p.Email));
    });
    try {
      $sel.select2({
        placeholder: "Select adviser",
        allowClear: true,
        width: "100%",
        dropdownParent: $("#editTaskModal .kb-modal")
      });
      if (currentEmail) $sel.val(currentEmail).trigger("change");
    } catch (e2) {
      if (currentEmail) $sel.val(currentEmail);
    }
  }

  function closeEditTaskModal() {
    var m = document.getElementById("editTaskModal");
    if (m) m.style.display = "none";
  }

  function saveEditTask() {
    var id = parseInt(document.getElementById("et_id").value, 10);
    var title = (document.getElementById("et_title").value || "").trim();
    if (!title) {
      globalDefinitions.HandlerError("Title is required", false);
      return;
    }
    var assignee = ($("#et_assignee").val() || "").trim() || undefined;
    var payload = {
      ID: id,
      Title: title,
      Priority: document.getElementById("et_priority").value,
      Description: (document.getElementById("et_desc").value || "").trim(),
      TaskStatus: document.getElementById("et_status").value,
      DueDate: document.getElementById("et_due").value || undefined,
      AssignedTo: assignee
    };
    globalDefinitions.callLoader();
    CaseTaskService.updateTask(payload, function (err) {
      globalDefinitions.closeLoader();
      if (err) {
        globalDefinitions.HandlerError("Could not update task: " + err, false);
        return;
      }
      closeEditTaskModal();
      if (MainApplication.notyf) MainApplication.notyf.success("Task updated");
      var root = document.getElementById("caseDetailRoot");
      var caseId = root && root.getAttribute("data-case-id");
      var stage = root && root.getAttribute("data-current-stage");
      renderKanban(caseId, "caseKanbanBoard", stage);
    });
  }

  function ensureCommentModal() {
    if (document.getElementById("commentTaskModal")) return;
    var html =
      '<div id="commentTaskModal" class="kb-modal-overlay" style="display:none">' +
      '<div class="kb-modal">' +
      '<div class="kb-modal-hdr"><h3>Comments</h3>' +
      '<button type="button" class="kb-modal-close" id="commentTaskModalClose">×</button></div>' +
      '<div class="kb-modal-body">' +
      '<input type="hidden" id="ct_id" />' +
      '<div id="ct_thread" class="kb-comment-thread"></div>' +
      '<label class="kb-field"><span>Add a comment</span>' +
      '<textarea id="ct_new" rows="3" placeholder="Your opinion on this task…"></textarea></label>' +
      '</div>' +
      '<div class="kb-modal-ftr">' +
      '<button type="button" class="btn btn-secondary btn-sm" id="commentTaskModalCancel">Close</button>' +
      '<button type="button" class="btn btn-primary btn-sm" id="commentTaskModalSave">Post comment</button>' +
      '</div></div></div>';
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("commentTaskModalClose").addEventListener("click", closeCommentModal);
    document.getElementById("commentTaskModalCancel").addEventListener("click", closeCommentModal);
    document.getElementById("commentTaskModalSave").addEventListener("click", saveComment);
  }

  function openCommentModal(task) {
    ensureCommentModal();
    document.getElementById("ct_id").value = task.ID;
    document.getElementById("commentTaskModal").setAttribute("data-existing", task.Comments || "");
    document.getElementById("ct_new").value = "";
    var thread = document.getElementById("ct_thread");
    var lines = (task.Comments || "").split("\n").filter(function (l) { return l.trim(); });
    if (!lines.length) {
      thread.innerHTML = '<div class="kb-comment-empty">No comments yet.</div>';
    } else {
      thread.innerHTML = lines
        .map(function (l) {
          return '<div class="kb-comment-line">' + escapeHtml(l) + "</div>";
        })
        .join("");
    }
    document.getElementById("commentTaskModal").style.display = "flex";
  }

  function closeCommentModal() {
    var m = document.getElementById("commentTaskModal");
    if (m) m.style.display = "none";
  }

  function saveComment() {
    var id = parseInt(document.getElementById("ct_id").value, 10);
    var textVal = (document.getElementById("ct_new").value || "").trim();
    if (!textVal) {
      globalDefinitions.HandlerError("Comment cannot be empty", false);
      return;
    }
    var existing = document.getElementById("commentTaskModal").getAttribute("data-existing") || "";
    globalDefinitions.callLoader();
    CaseTaskService.appendComment(id, textVal, existing, function (err, next) {
      globalDefinitions.closeLoader();
      if (err) {
        globalDefinitions.HandlerError("Could not save comment: " + err, false);
        return;
      }
      closeCommentModal();
      if (MainApplication.notyf) MainApplication.notyf.success("Comment added");
      var root = document.getElementById("caseDetailRoot");
      var caseId = root && root.getAttribute("data-case-id");
      var stage = root && root.getAttribute("data-current-stage");
      renderKanban(caseId, "caseKanbanBoard", stage);
    });
  }

  function completeTask(taskId, caseId, taskMeta) {
    CaseTaskService.completeTask(
      taskId,
      function (err) {
        if (err) {
          globalDefinitions.HandlerError("Could not complete task: " + err, false);
          return;
        }
        if (MainApplication.notyf) MainApplication.notyf.success("Task marked Done");
        var root = document.getElementById("caseDetailRoot");
        var stage = root && root.getAttribute("data-current-stage");
        renderKanban(
          caseId || (root && root.getAttribute("data-case-id")),
          (_lastKanban && _lastKanban.containerId) || "caseKanbanBoard",
          stage
        );
      },
      {
        CaseID: caseId || (taskMeta && taskMeta.CaseID) || "",
        Title: (taskMeta && taskMeta.Title) || ""
      }
    );
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
    openNewTaskModal: openNewTaskModal,
    updateNewTaskButtonState: updateNewTaskButtonState
  };
})();

if (typeof window !== "undefined") {
  window.CaseStageUI = CaseStageUI;
}