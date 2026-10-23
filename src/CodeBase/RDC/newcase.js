/**
 * Create Case
 * ───────────
 * - Select existing client → load & edit basic info
 * - Multi-select case types (MORTGAGE / P4L / GI)
 * - Type-specific field panels are placeholders until field specs exist
 * - On save: update client basic fields, then create one case per selected type
 */

loadNewCaseComponent = function () {
  if (MainApplication.cachedState.mode) {
    whenNewCaseLoaded();
  } else {
    setTimeout(function () {
      MainApplication.cachedState.pageStateCall = loadNewCaseComponent;
    }, 1000);
  }
};

var AppRequest;

MainApplication.NewCaseComponent = MainApplication.NewCaseComponent || {};

MainApplication.NewCaseComponent.ApplicationDetails = function () {
  this.url = window.location.href;
  this.itemId = null;
  this.mode = null;
  this.requestDetails = {};
  this.selectedClientId = null;
  this.loadedClient = null;
  this.selectedCaseTypes = [];
};

function whenNewCaseLoaded() {
  globalDefinitions.callLoader();
  
  $spcontext.assignAttributes();
  MainApplication.CurrentPageSubmitFunction =
    MainApplication.NewCaseComponent.confirmSubmit;
  AppRequest = new MainApplication.NewCaseComponent.ApplicationDetails();

  AppRequest.itemId = $spcontext.getParameterByName(
    "itemid",
    window.location.href
  );

  // Reuse helpers from newclient.js when available
  if (typeof populateNationalityDropdown === "function") {
    populateNationalityDropdown();
  }
  if (typeof bindAddressAutocomplete === "function") {
    bindAddressAutocomplete(
      "cl_residentialAddress",
      "residentialAddressSuggestions"
    );
    bindAddressAutocomplete(
      "cl_correspondenceAddress",
      "correspondenceAddressSuggestions"
    );
  }
  if (typeof bindSameAsResidential === "function") {
    bindSameAsResidential();
  }

  
  MainApplication.loadClientDetails(
    populateCaseClientSelect()
  );
  bindCaseClientSearch();
  populateAdviserSelect();
  bindCaseTypeToggles();

  if (window.ClientFormUtils) {
    document.querySelectorAll("[data-validate]").forEach(function (el) {
      el.addEventListener("input", function () {
        ClientFormUtils.clearFieldError(el.id);
      });
      el.addEventListener("change", function () {
        ClientFormUtils.clearFieldError(el.id);
      });
    });
  }

  setTimeout(function () {
    globalDefinitions.closeLoader();
  }, 500);
}

function clientsListName() {
  return (
    (configProperties.CLIENTSLIST && configProperties.CLIENTSLIST.setting) ||
    "ClientsList"
  );
}

function escapeHtml(str) {
  if (window.ClientFormUtils && ClientFormUtils.escapeHtml) {
    return ClientFormUtils.escapeHtml(str);
  }
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trim(v) {
  return v == null ? "" : String(v).trim();
}

/* ── Client picker ───────────────────────────────────────── */

function populateCaseClientSelect() {
  var sel = document.getElementById("caseClientSelect");
  if (!sel) return;

  var list = (MainApplication.clientList || []).slice().sort(function (a, b) {
    return String(a.Title || "").localeCompare(String(b.Title || ""));
  });

  sel.innerHTML = '<option value="">Select a client…</option>';
  list.forEach(function (c) {
    if (!c.ID) return;
    var opt = document.createElement("option");
    opt.value = String(c.ID);
    opt.textContent =
      (c.Title || "Unnamed") + (c.Email ? " · " + c.Email : "");
    sel.appendChild(opt);
  });

  sel.addEventListener("change", function () {
    if (sel.value) loadCaseClientById(sel.value);
  });
}

function bindCaseClientSearch() {
  var input = document.getElementById("caseClientSearch");
  var results = document.getElementById("caseClientResults");
  if (!input || !results) return;

  var debounce = null;
  input.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      var q = trim(input.value).toLowerCase();
      results.innerHTML = "";
      if (q.length < 2) return;

      var matches = (MainApplication.clientList || [])
        .filter(function (c) {
          var title = String(c.Title || "").toLowerCase();
          var email = String(c.Email || "").toLowerCase();
          return title.indexOf(q) >= 0 || email.indexOf(q) >= 0;
        })
        .slice(0, 8);

      if (!matches.length) {
        results.innerHTML =
          '<div class="client-search-empty">No matches</div>';
        return;
      }

      matches.forEach(function (c) {
        var row = document.createElement("button");
        row.type = "button";
        row.className = "client-search-item";
        row.innerHTML =
          "<strong>" +
          escapeHtml(c.Title || "Unnamed") +
          "</strong>" +
          (c.Email
            ? '<span class="client-search-email">' +
              escapeHtml(c.Email) +
              "</span>"
            : "");
        row.addEventListener("click", function () {
          input.value = c.Title || c.Email || "";
          results.innerHTML = "";
          var sel = document.getElementById("caseClientSelect");
          if (sel) sel.value = String(c.ID);
          loadCaseClientById(c.ID);
        });
        results.appendChild(row);
      });
    }, 200);
  });
}

function loadCaseClientById(id) {
  var status = document.getElementById("caseClientStatus");
  if (status) status.textContent = "Loading client…";
  globalDefinitions.callLoader();

  var caml =
    "<View><Query><Where>" +
    "<Eq><FieldRef Name='ID'/><Value Type='Counter'>" +
    id +
    "</Value></Eq>" +
    "</Where></Query></View>";

  $spcontext.getItem(
    clientsListName(),
    caml,
    function (itemCollection) {
      try {
        var count =
          typeof itemCollection.get_count === "function"
            ? itemCollection.get_count()
            : 0;
        if (!count) {
          if (status) status.textContent = "Client not found.";
          globalDefinitions.closeLoader();
          return;
        }

        var mapped = mapSpClientItem(itemCollection.getItemAtIndex(0));
        AppRequest.selectedClientId = mapped.ID;
        AppRequest.loadedClient = mapped;

        populateClientBasicForm(mapped);
        showCaseSections(true);

        if (status) {
          status.textContent =
            "Selected: " +
            (mapped.Title || mapped.EmailAddress || "#" + mapped.ID);
        }
      } catch (e) {
        console.error("[NewCase] load client error", e);
        if (status) status.textContent = "Could not read client data.";
      }
      globalDefinitions.closeLoader();
    },
    function (sender, args) {
      var msg =
        (args && args.get_message && args.get_message()) ||
        "Failed to load client";
      if (status) status.textContent = msg;
      globalDefinitions.closeLoader();
    }
  );
}

function mapSpClientItem(spItem) {
  function field(name) {
    try {
      return spItem.get_item(name);
    } catch (e) {
      return null;
    }
  }

  var title = field("Title") || "";
  var first = field("FirstName");
  var last = field("LastName");
  if ((!first || !last) && title) {
    var parts = String(title).trim().split(/\s+/);
    if (!first && parts.length) first = parts[0];
    if (!last && parts.length > 1) last = parts.slice(1).join(" ");
  }

  function fmtDate(val) {
    if (!val) return "";
    try {
      var d = val instanceof Date ? val : new Date(val);
      if (isNaN(d.getTime())) return "";
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return y + "-" + m + "-" + day;
    } catch (e) {
      return "";
    }
  }

  return {
    ID: spItem.get_id(),
    Title: title,
    FirstName: first || "",
    LastName: last || "",
    EmailAddress: field("EmailAddress") || "",
    MobileNumber: field("MobileNumber") || "",
    DOB: fmtDate(field("DOB")),
    Nationality: field("Nationality") || "",
    MaritalStatus: field("MaritalStatus") || "",
    ContactPreference: field("ContactPreference") || "",
    HomePhone: field("HomePhone") || "",
    ResidentialAddress: field("ResidentialAddress") || "",
    CorrespondenceAddress: field("CorrespondenceAddress") || "",
  };
}

function setField(id, value) {
  var el = document.getElementById(id);
  if (!el) return;
  el.value = value != null ? String(value) : "";
  if (window.ClientFormUtils) ClientFormUtils.clearFieldError(id);
}

function populateClientBasicForm(item) {
  setField("cl_firstName", item.FirstName);
  setField("cl_lastName", item.LastName);
  setField("cl_email", item.EmailAddress);
  setField("cl_mobile", item.MobileNumber);
  setField("cl_dob", item.DOB);
  setField("cl_nationality", item.Nationality);
  setField("cl_maritalStatus", item.MaritalStatus);
  setField("cl_contactPreference", item.ContactPreference);
  setField("cl_homePhone", item.HomePhone);
  setField("cl_residentialAddress", item.ResidentialAddress);
  setField("cl_correspondenceAddress", item.CorrespondenceAddress);

  var chk = document.getElementById("cl_sameAddress");
  if (chk) {
    var same =
      item.ResidentialAddress &&
      item.ResidentialAddress === item.CorrespondenceAddress;
    chk.checked = !!same;
    if (typeof bindSameAsResidential === "function") {
      // re-apply readonly state
      chk.dispatchEvent(new Event("change"));
    }
  }
}

function showCaseSections(show) {
  var basic = document.getElementById("caseClientBasicSection");
  var setup = document.getElementById("caseSetupSection");
  if (basic) basic.style.display = show ? "" : "none";
  if (setup) setup.style.display = show ? "" : "none";
}

/* ── Advisers ────────────────────────────────────────────── */

function populateAdviserSelect() {
  var sel = document.getElementById("case_adviser");
  if (!sel) return;

  var list = (MainApplication.advisersList || []).slice().sort(function (a, b) {
    return String(a.Title || "").localeCompare(String(b.Title || ""));
  });

  sel.innerHTML = '<option value="">Select adviser…</option>';
  list.forEach(function (a) {
    var email = a.Email || a.EmailAddress || "";
    if (!email) return;
    var opt = document.createElement("option");
    opt.value = email;
    opt.textContent = (a.Title || email) + (email ? " · " + email : "");
    opt.setAttribute("data-title", a.Title || email);
    sel.appendChild(opt);
  });
}

/* ── Case types ──────────────────────────────────────────── */

function bindCaseTypeToggles() {
  document.querySelectorAll('input[name="caseType"]').forEach(function (cb) {
    cb.addEventListener("change", syncCaseTypePanels);
  });
  syncCaseTypePanels();
}

function syncCaseTypePanels() {
  var selected = [];
  document.querySelectorAll('input[name="caseType"]').forEach(function (cb) {
    var panel = document.getElementById("panel_" + cb.value);
    if (cb.checked) {
      selected.push(cb.value);
      if (panel) panel.style.display = "";
    } else {
      if (panel) panel.style.display = "none";
    }
  });
  AppRequest.selectedCaseTypes = selected;

  var err = document.querySelector('[data-error-for="caseTypeGrid"]');
  if (err) err.textContent = "";
}

function getSelectedCaseTypes() {
  var out = [];
  document.querySelectorAll('input[name="caseType"]:checked').forEach(function (cb) {
    out.push(cb.value);
  });
  return out;
}

/* ── Collect client basic fields from form ───────────────── */

function collectClientBasicFromForm() {
  var ids = {
    FirstName: "cl_firstName",
    LastName: "cl_lastName",
    EmailAddress: "cl_email",
    MobileNumber: "cl_mobile",
    DOB: "cl_dob",
    Nationality: "cl_nationality",
    MaritalStatus: "cl_maritalStatus",
    ContactPreference: "cl_contactPreference",
    HomePhone: "cl_homePhone",
    ResidentialAddress: "cl_residentialAddress",
    CorrespondenceAddress: "cl_correspondenceAddress",
  };
  var data = {};
  Object.keys(ids).forEach(function (key) {
    var el = document.getElementById(ids[key]);
    data[key] = el ? trim(el.value) : "";
  });
  if (data.EmailAddress) data.EmailAddress = data.EmailAddress.toLowerCase();
  data.Title = trim(
    (data.FirstName || "") + (data.LastName ? " " + data.LastName : "")
  );
  return data;
}

/* ── Submit ──────────────────────────────────────────────── */

MainApplication.NewCaseComponent.confirmSubmit = function () {
  MainApplication.confirmAction =
    MainApplication.NewCaseComponent.actionConfirmed;
  $("#confirmModal").modal("show");
};

MainApplication.NewCaseComponent.actionConfirmed = function () {
  MainApplication.NewCaseComponent.saveDataToList();
};

MainApplication.NewCaseComponent.saveDataToList = function () {
  globalDefinitions.onActionClicked();

  if (!AppRequest.selectedClientId) {
    globalDefinitions.HandlerError("Please select a client first.", false);
    globalDefinitions.onActionFailed();
    return;
  }

  // Validate basic client fields
  if (window.ClientFormUtils) {
    var validation = ClientFormUtils.validateForm(
      document.getElementById("caseClientBasicSection") || document
    );
    if (!validation.ok) {
      var first = validation.errors[0];
      globalDefinitions.HandlerError(
        first ? "Please fix: " + first.message : "Please correct the client fields.",
        false
      );
      globalDefinitions.onActionFailed();
      if (first && first.id) {
        var fel = document.getElementById(first.id);
        if (fel) fel.focus();
      }
      return;
    }
  }

  var adviserSel = document.getElementById("case_adviser");
  var adviserEmail = adviserSel ? trim(adviserSel.value) : "";
  if (!adviserEmail) {
    var aerr = document.querySelector('[data-error-for="case_adviser"]');
    if (aerr) aerr.textContent = "Please select an adviser";
    globalDefinitions.HandlerError("Please select an adviser.", false);
    globalDefinitions.onActionFailed();
    return;
  }

  var caseTypes = getSelectedCaseTypes();
  if (!caseTypes.length) {
    var terr = document.querySelector('[data-error-for="caseTypeGrid"]');
    if (terr) terr.textContent = "Select at least one case type";
    globalDefinitions.HandlerError("Select at least one case type.", false);
    globalDefinitions.onActionFailed();
    return;
  }

  if (typeof syncCorrespondenceFromResidential === "function") {
    syncCorrespondenceFromResidential();
  }

  var clientData = collectClientBasicFromForm();
  clientData.ID = AppRequest.selectedClientId;

  var priorityEl = document.getElementById("case_priority");
  var priority = priorityEl ? priorityEl.value || "Normal" : "Normal";

  var adviserTitle =
    (adviserSel &&
      adviserSel.options[adviserSel.selectedIndex] &&
      adviserSel.options[adviserSel.selectedIndex].getAttribute("data-title")) ||
    adviserEmail;

  globalDefinitions.callLoader();

  // 1) Update client basic info
  $spcontext.updateItems(
    [clientData],
    clientsListName(),
    function () {
      // 2) Create a case for each selected type (sequentially)
      createCasesSequentially(
        caseTypes,
        {
          clientData: clientData,
          adviserEmail: adviserEmail,
          adviserTitle: adviserTitle,
          priority: priority,
        },
        function (err, createdIds) {
          globalDefinitions.closeLoader();
          if (err) {
            globalDefinitions.HandlerError(
              "Some cases may not have been created: " + err,
              false
            );
            globalDefinitions.onActionFailed();
            return;
          }
          var msg =
            createdIds.length === 1
              ? "Case created: " + createdIds[0]
              : "Cases created: " + createdIds.join(", ");
          globalDefinitions.HandlerSuccess(msg);
          try {
            globalDefinitions.AuditLogManager_SaveLog({
              Action: "Created case(s) " + createdIds.join(", "),
              Message: "Client #" + AppRequest.selectedClientId,
            });
          } catch (e) {}
          globalDefinitions.onActionCompleted();
          $spcontext.redirect("#/cases", false);
        }
      );
    },
    function (sender, args) {
      globalDefinitions.closeLoader();
      var msg =
        (args && args.get_message && args.get_message()) ||
        "Could not update client";
      globalDefinitions.HandlerError(msg, false);
      globalDefinitions.onActionFailed();
    }
  );
};

/**
 * Create one case per application type, sequentially.
 * Uses existing module lists + CASESLIST mirror pattern.
 */
function createCasesSequentially(caseTypes, ctx, done) {
  var created = [];
  var index = 0;

  function next() {
    if (index >= caseTypes.length) {
      done(null, created);
      return;
    }
    var appType = caseTypes[index++];
    createSingleCase(appType, ctx, function (err, caseId) {
      if (err) {
        done(err, created);
        return;
      }
      if (caseId) created.push(caseId);
      next();
    });
  }

  next();
}

function resolveListForType(appType) {
  if (appType === "MORTGAGE") {
    return {
      listName: configProperties.MORTGAGECASELIST.setting,
      codePrefix: configProperties.MORTGAGECODE.setting,
    };
  }
  if (appType === "P4L") {
    return {
      listName: configProperties.P4LCASELIST.setting,
      codePrefix: configProperties.P4LCODE.setting,
    };
  }
  return {
    listName: configProperties.GILIST.setting,
    codePrefix: configProperties.GICODE.setting,
  };
}

function createSingleCase(appType, ctx, callback) {
  var resolved = resolveListForType(appType);
  var listName = resolved.listName;
  var codePrefix = resolved.codePrefix;

  var formData = {
    ApplicationType: appType,
    CasePriority: ctx.priority,
    Title: ctx.clientData.Title || appType,
    Client: ctx.clientData.Title,
    Adviser: ctx.adviserTitle,
    RequestCreated: $spcontext.serverDate
      ? $spcontext.serverDate()
      : new Date(),
    InitiatorLogin: CurrentUserProperties.email,
    InitiatorEmailAddress: CurrentUserProperties.email,
    InitiatorName: CurrentUserProperties.title,
    Year: ($spcontext.serverDate
      ? $spcontext.serverDate()
      : new Date()
    ).getFullYear(),
    // Type-specific fields: none yet — add when specs are known
  };

  // Prefer person fields as email/login when the list expects that
  try {
    formData.Client = ctx.clientData.EmailAddress || ctx.clientData.Title;
    formData.Adviser = ctx.adviserEmail;
  } catch (e) {}

  $spcontext.createItems(
    [formData],
    listName,
    function (createdItemsProperties) {
      var itemID = createdItemsProperties[0].get_id();
      var year = ($spcontext.serverDate
        ? $spcontext.serverDate()
        : new Date()
      ).getFullYear();
      var caseId = codePrefix + year + "-" + itemID;

      var updateObj = {
        ID: itemID,
        Year: year,
        LastTimeItemModifiedByWorklow: $spcontext.serverDate
          ? $spcontext.serverDate()
          : new Date(),
        SLA_COUNT_UPDATED: "No",
        WorkflowRequestID: caseId,
      };

      var mirrorData = {
        CaseID: caseId,
        ApplicationType: appType,
        Client: formData.Client,
        Adviser: formData.Adviser,
        Title: appType,
        Status: "Open",
        CurrentStage: "Lead",
        ModuleListName: listName,
        ModuleItemID: itemID,
        LastActionDate: $spcontext.serverDate
          ? $spcontext.serverDate()
          : new Date(),
      };

      $spcontext.createItems(
        [mirrorData],
        configProperties.CASESLIST.setting,
        function (mirrorCreated) {
          var mirrorItemID = mirrorCreated[0].get_id();
          updateObj.CaseListID = mirrorItemID;

          $spcontext.updateItems(
            [updateObj],
            listName,
            function () {
              if (
                window.CaseTaskService &&
                typeof CaseTaskService.onNewCaseCreated === "function"
              ) {
                CaseTaskService.onNewCaseCreated(
                  {
                    CaseID: caseId,
                    CaseListItemId: mirrorItemID,
                    ApplicationType: appType,
                    Client: ctx.clientData.Title,
                    Adviser: formData.Adviser,
                    AdviserName: ctx.adviserEmail,
                    CaseManager: formData.Adviser,
                    Initiator: CurrentUserProperties.email,
                    InitialStage: "Lead",
                  },
                  function (err) {
                    if (err) console.warn("Initial tasks warning:", err);
                    callback(null, caseId);
                  }
                );
              } else {
                callback(null, caseId);
              }
            },
            function (sender, args) {
              callback(
                (args && args.get_message && args.get_message()) ||
                  "Failed to finalise case " + appType
              );
            }
          );
        },
        function (sender, args) {
          callback(
            (args && args.get_message && args.get_message()) ||
              "Failed to mirror case " + appType
          );
        }
      );
    },
    function (sender, args) {
      callback(
        (args && args.get_message && args.get_message()) ||
          "Failed to create case " + appType
      );
    }
  );
}