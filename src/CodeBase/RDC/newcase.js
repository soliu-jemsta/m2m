/**
 * Create Case
 * ───────────
 * - Select one or more clients → load & edit basic info for each
 * - Category → Type cascade
 * - Type-specific field panels are placeholders until field specs exist
 * - On save: update all selected clients, then create one case
 *   (primary = first client; joint names reflected in Title)
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
  /** @type {Array<{ID:number, data:object}>} */
  this.selectedClients = [];
  this.applicationType = null;
  this.caseSubType = null;
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

  populateCaseClientSelect();
  bindCaseClientSearch();
  populateAdviserSelect();
  bindCategoryTypeCascade();
  refreshClientSelectionStatus();

  // Surface current max on the page hint
  var maxHint = document.getElementById("caseClientMaxHint");
  if (maxHint) {
    maxHint.textContent = String(maxCaseClients());
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

/**
 * Maximum clients that can be attached to one case.
 * Override via config list item title MAXCASECLIENTS (setting = number).
 * Default: 2 (typical joint application).
 */
function maxCaseClients() {
  var fallback = 2;
  try {
    if (
      typeof configProperties !== "undefined" &&
      configProperties.MAXCASECLIENTS &&
      configProperties.MAXCASECLIENTS.setting != null &&
      configProperties.MAXCASECLIENTS.setting !== ""
    ) {
      var n = parseInt(configProperties.MAXCASECLIENTS.setting, 10);
      if (isFinite(n) && n >= 1) return n;
    }
  } catch (e) {}
  return fallback;
}

function isAtClientLimit() {
  return AppRequest.selectedClients.length >= maxCaseClients();
}

function updateClientPickerAvailability() {
  var atLimit = isAtClientLimit();
  var search = document.getElementById("caseClientSearch");
  var sel = document.getElementById("caseClientSelect");
  if (search) {
    search.disabled = atLimit;
    search.placeholder = atLimit
      ? "Maximum of " + maxCaseClients() + " clients reached"
      : "Start typing name or email…";
  }
  if (sel) {
    sel.disabled = atLimit;
  }
}

function refreshClientSelectionStatus() {
  var status = document.getElementById("caseClientStatus");
  var count = AppRequest.selectedClients.length;
  var max = maxCaseClients();
  if (!status) return;
  if (!count) {
    status.textContent =
      "No clients selected yet. You can add up to " + max + ".";
  } else if (count >= max) {
    status.textContent =
      count +
      " of " +
      max +
      " clients selected (maximum reached). First is primary.";
  } else {
    status.textContent =
      count +
      " of " +
      max +
      " clients selected. First is treated as primary.";
  }
  updateClientPickerAvailability();
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

/* ── Client multi-select ─────────────────────────────────── */

function populateCaseClientSelect() {
  var sel = document.getElementById("caseClientSelect");
  if (!sel) return;

  var list = (MainApplication.clientList || []).slice().sort(function (a, b) {
    return String(a.Title || "").localeCompare(String(b.Title || ""));
  });

  sel.innerHTML = '<option value="">Select a client to add…</option>';
  list.forEach(function (c) {
    if (!c.ID) return;
    var opt = document.createElement("option");
    opt.value = String(c.ID);
    opt.textContent =
      (c.Title || "Unnamed") + (c.Email ? " · " + c.Email : "");
    sel.appendChild(opt);
  });

  sel.addEventListener("change", function () {
    if (sel.value) {
      addCaseClientById(sel.value);
      sel.value = "";
    }
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
          input.value = "";
          results.innerHTML = "";
          addCaseClientById(c.ID);
        });
        results.appendChild(row);
      });
    }, 200);
  });
}

function isClientSelected(id) {
  return AppRequest.selectedClients.some(function (c) {
    return String(c.ID) === String(id);
  });
}

function addCaseClientById(id) {
  var status = document.getElementById("caseClientStatus");
  if (isClientSelected(id)) {
    if (status) status.textContent = "That client is already added.";
    return;
  }

  if (isAtClientLimit()) {
    if (status) {
      status.textContent =
        "Maximum of " + maxCaseClients() + " clients allowed on a case.";
    }
    try {
      globalDefinitions.HandlerError(
        "You can only select up to " + maxCaseClients() + " clients.",
        false
      );
    } catch (e) {}
    updateClientPickerAvailability();
    return;
  }

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
        // Re-check limit in case of concurrent adds
        if (isAtClientLimit()) {
          if (status) {
            status.textContent =
              "Maximum of " + maxCaseClients() + " clients allowed on a case.";
          }
          globalDefinitions.closeLoader();
          return;
        }

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
        AppRequest.selectedClients.push({ ID: mapped.ID, data: mapped });
        renderSelectedClientChips();
        renderClientFormCard(mapped);
        showCaseSetupIfReady();
        refreshClientSelectionStatus();
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

function removeCaseClient(id) {
  AppRequest.selectedClients = AppRequest.selectedClients.filter(function (c) {
    return String(c.ID) !== String(id);
  });
  var card = document.getElementById("clientCard_" + id);
  if (card && card.parentNode) card.parentNode.removeChild(card);
  renderSelectedClientChips();
  showCaseSetupIfReady();
  refreshClientSelectionStatus();
}

function renderSelectedClientChips() {
  var host = document.getElementById("selectedClientChips");
  if (!host) return;
  host.innerHTML = "";

  AppRequest.selectedClients.forEach(function (entry, index) {
    var d = entry.data || {};
    var chip = document.createElement("span");
    chip.className = "client-chip";
    if (index === 0) chip.classList.add("primary");
    chip.innerHTML =
      '<span class="client-chip-label">' +
      (index === 0 ? "Primary · " : "") +
      escapeHtml(d.Title || d.EmailAddress || "#" + entry.ID) +
      "</span>" +
      '<button type="button" class="client-chip-remove" aria-label="Remove">&times;</button>';
    chip
      .querySelector(".client-chip-remove")
      .addEventListener("click", function () {
        removeCaseClient(entry.ID);
      });
    host.appendChild(chip);
  });
}

function showCaseSetupIfReady() {
  var setup = document.getElementById("caseSetupSection");
  if (setup) {
    setup.style.display = AppRequest.selectedClients.length ? "" : "none";
  }
  if (!AppRequest.selectedClients.length) {
    var detail = document.getElementById("caseTypeDetailSection");
    if (detail) detail.style.display = "none";
  }
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
    ResidentialAddress: field("ResidentialAddress") || "",
    CorrespondenceAddress: field("CorrespondenceAddress") || "",
  };
}

/* ── Per-client basic form card ──────────────────────────── */

function fieldId(clientId, name) {
  return "cl_" + clientId + "_" + name;
}

function renderClientFormCard(item) {
  var host = document.getElementById("selectedClientsForms");
  if (!host) return;

  var existing = document.getElementById("clientCard_" + item.ID);
  if (existing) existing.parentNode.removeChild(existing);

  var index = AppRequest.selectedClients.findIndex(function (c) {
    return String(c.ID) === String(item.ID);
  });
  var isPrimary = index === 0;

  var section = document.createElement("div");
  section.className = "form-section client-basic-card";
  section.id = "clientCard_" + item.ID;
  section.setAttribute("data-client-id", String(item.ID));

  var titleText =
    (isPrimary ? "Primary client · " : "Client · ") +
    (item.Title || item.EmailAddress || "#" + item.ID);

  section.innerHTML =
    '<div class="form-section-title">' +
    escapeHtml(titleText) +
    '</div>' +
    '<p class="client-type-hint">Review and update if needed. Changes are saved when you create the case.</p>' +
    '<div class="form-row">' +
    fieldGroupHtml(item.ID, "firstName", "First name", "text", true, "required|name", item.FirstName) +
    fieldGroupHtml(item.ID, "lastName", "Last name", "text", true, "required|name", item.LastName) +
    "</div>" +
    '<div class="form-row">' +
    fieldGroupHtml(item.ID, "email", "Email address", "email", true, "required|email", item.EmailAddress) +
    fieldGroupHtml(item.ID, "mobile", "Mobile number", "tel", true, "required|phone", item.MobileNumber) +
    "</div>" +
    '<div class="form-row">' +
    fieldGroupHtml(item.ID, "dob", "Date of birth", "date", false, "dob", item.DOB) +
    nationalityGroupHtml(item.ID, item.Nationality) +
    "</div>" +
    '<div class="form-row">' +
    maritalGroupHtml(item.ID, item.MaritalStatus) +
    contactPrefGroupHtml(item.ID, item.ContactPreference) +
    "</div>" +
    '<div class="form-row">' +
    addressGroupHtml(item.ID, "residentialAddress", "Residential address", item.ResidentialAddress) +
    "</div>" +
    '<div class="form-row single">' +
    '<div class="form-group"><label class="checkbox-label" for="' +
    fieldId(item.ID, "sameAddress") +
    '"><input type="checkbox" id="' +
    fieldId(item.ID, "sameAddress") +
    '"' +
    (item.ResidentialAddress &&
    item.ResidentialAddress === item.CorrespondenceAddress
      ? " checked"
      : "") +
    ' /><span>Correspondence address is the same as residential</span></label></div></div>' +
    '<div class="form-row single" id="' +
    fieldId(item.ID, "correspondenceRow") +
    '">' +
    addressGroupHtml(
      item.ID,
      "correspondenceAddress",
      "Correspondence address",
      item.CorrespondenceAddress
    ) +
    "</div>";

  host.appendChild(section);

  // Nationality options
  if (typeof populateNationalityDropdown === "function") {
    // global helper fills #cl_nationality — we need per-client
    fillNationalitySelect(
      document.getElementById(fieldId(item.ID, "nationality")),
      item.Nationality
    );
  } else {
    fillNationalitySelect(
      document.getElementById(fieldId(item.ID, "nationality")),
      item.Nationality
    );
  }

  // Address autocomplete
  if (typeof bindAddressAutocomplete === "function") {
    // bindAddressAutocomplete expects fixed ids — use local bind
  }
  bindClientAddressAutocomplete(
    fieldId(item.ID, "residentialAddress"),
    fieldId(item.ID, "residentialSuggestions")
  );
  bindClientAddressAutocomplete(
    fieldId(item.ID, "correspondenceAddress"),
    fieldId(item.ID, "correspondenceSuggestions")
  );
  bindClientSameAsResidential(item.ID);

  // Clear validation on input
  section.querySelectorAll("[data-validate]").forEach(function (el) {
    el.addEventListener("input", function () {
      if (window.ClientFormUtils) ClientFormUtils.clearFieldError(el.id);
    });
    el.addEventListener("change", function () {
      if (window.ClientFormUtils) ClientFormUtils.clearFieldError(el.id);
    });
  });
}

function fieldGroupHtml(clientId, name, label, type, required, rules, value) {
  var id = fieldId(clientId, name);
  return (
    '<div class="form-group">' +
    "<label for=\"" +
    id +
    '">' +
    escapeHtml(label) +
    (required ? ' <span class="req">*</span>' : "") +
    "</label>" +
    '<input type="' +
    type +
    '" id="' +
    id +
    '" data-validate="' +
    (rules || "") +
    '" value="' +
    escapeHtml(value || "") +
    '" maxLength="250" />' +
    '<span class="field-error" data-error-for="' +
    id +
    '"></span></div>'
  );
}

function addressGroupHtml(clientId, name, label, value) {
  var id = fieldId(clientId, name);
  var sugId =
    name === "residentialAddress"
      ? fieldId(clientId, "residentialSuggestions")
      : fieldId(clientId, "correspondenceSuggestions");
  return (
    '<div class="form-group address-autocomplete-group">' +
    "<label for=\"" +
    id +
    '">' +
    escapeHtml(label) +
    "</label>" +
    '<input type="text" id="' +
    id +
    '" placeholder="Start typing an address…" maxLength="250" autocomplete="off" value="' +
    escapeHtml(value || "") +
    '" />' +
    '<div id="' +
    sugId +
    '" class="address-suggestions"></div></div>'
  );
}

function nationalityGroupHtml(clientId, value) {
  var id = fieldId(clientId, "nationality");
  return (
    '<div class="form-group"><label for="' +
    id +
    '">Nationality</label>' +
    '<select id="' +
    id +
    '"><option value="">Select country…</option></select></div>'
  );
}

function maritalGroupHtml(clientId, value) {
  var id = fieldId(clientId, "maritalStatus");
  var opts = ["", "Single", "Married", "Divorced", "Widowed", "Civil Partnership"];
  var html =
    '<div class="form-group"><label for="' +
    id +
    '">Marital status</label><select id="' +
    id +
    '">';
  opts.forEach(function (o) {
    html +=
      '<option value="' +
      o +
      '"' +
      (o === (value || "") ? " selected" : "") +
      ">" +
      (o || "Select…") +
      "</option>";
  });
  return html + "</select></div>";
}

function contactPrefGroupHtml(clientId, value) {
  var id = fieldId(clientId, "contactPreference");
  var opts = ["", "Email", "Mobile", "Phone", "SMS"];
  var html =
    '<div class="form-group"><label for="' +
    id +
    '">Contact preference</label><select id="' +
    id +
    '">';
  opts.forEach(function (o) {
    html +=
      '<option value="' +
      o +
      '"' +
      (o === (value || "") ? " selected" : "") +
      ">" +
      (o || "Select…") +
      "</option>";
  });
  return html + "</select></div>";
}

function fillNationalitySelect(sel, current) {
  if (!sel) return;
  var countries =
    typeof WORLD_COUNTRIES !== "undefined" && WORLD_COUNTRIES.length
      ? WORLD_COUNTRIES
      : [
          "United Kingdom",
          "Ireland",
          "United States",
          "Canada",
          "Australia",
          "India",
          "Nigeria",
          "South Africa",
        ];
  var preferred = [
    "United Kingdom",
    "Ireland",
    "United States",
    "Canada",
    "Australia",
    "India",
    "Nigeria",
    "South Africa",
  ];
  sel.innerHTML = '<option value="">Select country…</option>';
  preferred.forEach(function (c) {
    if (countries.indexOf(c) < 0) return;
    var o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    if (c === current) o.selected = true;
    sel.appendChild(o);
  });
  var sep = document.createElement("option");
  sep.disabled = true;
  sep.textContent = "──────────";
  sel.appendChild(sep);
  countries.forEach(function (c) {
    if (preferred.indexOf(c) >= 0) return;
    var o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    if (c === current) o.selected = true;
    sel.appendChild(o);
  });
}

function bindClientAddressAutocomplete(inputId, suggestionsId) {
  var input = document.getElementById(inputId);
  var box = document.getElementById(suggestionsId);
  if (!input || !box) return;

  var debounceTimer = null;
  var lastQuery = "";

  function hide() {
    box.innerHTML = "";
    box.classList.remove("open");
  }

  function showItems(items) {
    box.innerHTML = "";
    if (!items || !items.length) {
      hide();
      return;
    }
    items.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "address-suggestion-item";
      btn.textContent = item.display_name;
      btn.addEventListener("mousedown", function (e) {
        e.preventDefault();
        input.value = item.display_name;
        hide();
      });
      box.appendChild(btn);
    });
    box.classList.add("open");
  }

  input.addEventListener("input", function () {
    var q = trim(input.value);
    clearTimeout(debounceTimer);
    if (q.length < 3) {
      hide();
      return;
    }
    debounceTimer = setTimeout(function () {
      if (q === lastQuery) return;
      lastQuery = q;
      if (typeof fetchNominatim === "function") {
        fetchNominatim(q, function (results) {
          if (trim(input.value) !== q) return;
          showItems(results);
        });
      }
    }, 350);
  });

  input.addEventListener("blur", function () {
    setTimeout(hide, 200);
  });
}

function bindClientSameAsResidential(clientId) {
  var chk = document.getElementById(fieldId(clientId, "sameAddress"));
  var res = document.getElementById(fieldId(clientId, "residentialAddress"));
  var cor = document.getElementById(fieldId(clientId, "correspondenceAddress"));
  var row = document.getElementById(fieldId(clientId, "correspondenceRow"));
  if (!chk || !cor) return;

  function apply() {
    if (chk.checked) {
      cor.value = res ? res.value : "";
      cor.readOnly = true;
      cor.classList.add("is-readonly");
      if (row) row.style.opacity = "0.7";
    } else {
      cor.readOnly = false;
      cor.classList.remove("is-readonly");
      if (row) row.style.opacity = "";
    }
  }

  chk.addEventListener("change", apply);
  if (res) {
    res.addEventListener("input", function () {
      if (chk.checked) cor.value = res.value;
    });
  }
  apply();
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

/* ── Category → Type cascade ─────────────────────────────── */

var TYPES_BY_CATEGORY = {
  MORTGAGE: [
    { value: "Residential Purchase", text: "Residential Purchase" },
    { value: "Residential Remortgage", text: "Residential Remortgage" },
    { value: "Buy-to-Let Purchase", text: "Buy-to-Let Purchase" },
    { value: "Buy-to-Let Remortgage", text: "Buy-to-Let Remortgage" },
    { value: "Product Transfer", text: "Product Transfer" },
    { value: "Shared Ownership", text: "Shared Ownership" },
    { value: "Bridging", text: "Bridging" },
    { value: "Second Charge", text: "Second Charge" },
    { value: "Right to Buy", text: "Right to Buy" },
  ],
  P4L: [
    { value: "Business Protection", text: "Business Protection" },
    { value: "Life Insurance", text: "Life Insurance" },
    { value: "Critical Illness Cover", text: "Critical Illness Cover" },
    { value: "Income Protection", text: "Income Protection" },
  ],
  GI: [
    { value: "Buildings Only", text: "Buildings Only" },
    { value: "Content Only", text: "Content Only" },
    {
      value: "Buildings and Content Insurance",
      text: "Buildings and Content Insurance",
    },
    { value: "Landlord Insurance", text: "Landlord Insurance" },
  ],
};

var CATEGORY_LABELS = {
  MORTGAGE: "Mortgage",
  P4L: "Protection for Life",
  GI: "General Insurance",
};

function bindCategoryTypeCascade() {
  var cat = document.getElementById("case_category");
  var typ = document.getElementById("case_type");
  if (!cat || !typ) return;

  cat.addEventListener("change", function () {
    var val = cat.value;
    var cerr = document.querySelector('[data-error-for="case_category"]');
    if (cerr) cerr.textContent = "";

    typ.innerHTML = "";
    if (!val || !TYPES_BY_CATEGORY[val]) {
      typ.disabled = true;
      typ.innerHTML = '<option value="">Select category first…</option>';
      AppRequest.applicationType = null;
      AppRequest.caseSubType = null;
      updateTypeDetailPanel(null, null);
      return;
    }

    typ.disabled = false;
    typ.innerHTML = '<option value="">Select type…</option>';
    TYPES_BY_CATEGORY[val].forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t.value;
      opt.textContent = t.text;
      typ.appendChild(opt);
    });
    AppRequest.applicationType = val;
    AppRequest.caseSubType = null;
    updateTypeDetailPanel(val, null);
  });

  typ.addEventListener("change", function () {
    var terr = document.querySelector('[data-error-for="case_type"]');
    if (terr) terr.textContent = "";
    AppRequest.caseSubType = typ.value || null;
    updateTypeDetailPanel(AppRequest.applicationType, AppRequest.caseSubType);
  });
}

function updateTypeDetailPanel(category, subType) {
  var section = document.getElementById("caseTypeDetailSection");
  var title = document.getElementById("caseTypeDetailTitle");
  var body = document.getElementById("caseTypeDetailBody");
  if (!section) return;

  if (!category) {
    section.style.display = "none";
    return;
  }

  section.style.display = "";
  var catLabel = CATEGORY_LABELS[category] || category;
  if (title) {
    title.textContent = subType
      ? catLabel + " · " + subType
      : catLabel + " details";
  }
  if (body) {
    if (subType) {
      body.innerHTML =
        "<p>Fields for <strong>" +
        escapeHtml(catLabel) +
        " — " +
        escapeHtml(subType) +
        "</strong> will appear here once they are defined. Nothing is assumed yet.</p>";
    } else {
      body.innerHTML =
        "<p>Select a type to continue. Type-specific fields will appear here once they are defined.</p>";
    }
  }
}

/* ── Collect / validate all client forms ─────────────────── */

function val(id) {
  var el = document.getElementById(id);
  return el ? trim(el.value) : "";
}

function collectClientDataFromCard(clientId) {
  var data = {
    ID: clientId,
    FirstName: val(fieldId(clientId, "firstName")),
    LastName: val(fieldId(clientId, "lastName")),
    EmailAddress: val(fieldId(clientId, "email")).toLowerCase(),
    MobileNumber: val(fieldId(clientId, "mobile")),
    DOB: val(fieldId(clientId, "dob")) || null,
    Nationality: val(fieldId(clientId, "nationality")),
    MaritalStatus: val(fieldId(clientId, "maritalStatus")),
    ContactPreference: val(fieldId(clientId, "contactPreference")),
    ResidentialAddress: val(fieldId(clientId, "residentialAddress")),
    CorrespondenceAddress: val(fieldId(clientId, "correspondenceAddress")),
  };
  data.Title = trim(
    (data.FirstName || "") + (data.LastName ? " " + data.LastName : "")
  );
  return data;
}

function validateAllClientCards() {
  if (!window.ClientFormUtils) return { ok: true, errors: [] };
  var host = document.getElementById("selectedClientsForms");
  if (!host) return { ok: true, errors: [] };
  return ClientFormUtils.validateForm(host);
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

  if (!AppRequest.selectedClients.length) {
    globalDefinitions.HandlerError(
      "Please add at least one client.",
      false
    );
    globalDefinitions.onActionFailed();
    return;
  }

  // Sync same-as-residential on each card
  AppRequest.selectedClients.forEach(function (entry) {
    var chk = document.getElementById(fieldId(entry.ID, "sameAddress"));
    var res = document.getElementById(fieldId(entry.ID, "residentialAddress"));
    var cor = document.getElementById(
      fieldId(entry.ID, "correspondenceAddress")
    );
    if (chk && chk.checked && res && cor) cor.value = res.value;
  });

  var validation = validateAllClientCards();
  if (!validation.ok) {
    var first = validation.errors[0];
    globalDefinitions.HandlerError(
      first
        ? "Please fix client details: " + first.message
        : "Please correct the client fields.",
      false
    );
    globalDefinitions.onActionFailed();
    if (first && first.id) {
      var fel = document.getElementById(first.id);
      if (fel) fel.focus();
    }
    return;
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

  var catEl = document.getElementById("case_category");
  var typEl = document.getElementById("case_type");
  var category = catEl ? trim(catEl.value) : "";
  var subType = typEl ? trim(typEl.value) : "";

  if (!category) {
    var cerr = document.querySelector('[data-error-for="case_category"]');
    if (cerr) cerr.textContent = "Please select a category";
    globalDefinitions.HandlerError("Please select a category.", false);
    globalDefinitions.onActionFailed();
    return;
  }
  if (!subType) {
    var terr = document.querySelector('[data-error-for="case_type"]');
    if (terr) terr.textContent = "Please select a type";
    globalDefinitions.HandlerError("Please select a type.", false);
    globalDefinitions.onActionFailed();
    return;
  }

  var clientsPayload = AppRequest.selectedClients.map(function (entry) {
    return collectClientDataFromCard(entry.ID);
  });

  var priorityEl = document.getElementById("case_priority");
  var priority = priorityEl ? priorityEl.value || "Normal" : "Normal";

  var adviserTitle =
    (adviserSel &&
      adviserSel.options[adviserSel.selectedIndex] &&
      adviserSel.options[adviserSel.selectedIndex].getAttribute("data-title")) ||
    adviserEmail;

  globalDefinitions.callLoader();

  // 1) Update all clients
  updateClientsSequentially(clientsPayload, function (err) {
    if (err) {
      globalDefinitions.closeLoader();
      globalDefinitions.HandlerError(
        "Could not update client(s): " + err,
        false
      );
      globalDefinitions.onActionFailed();
      return;
    }

    var primary = clientsPayload[0];
    var jointTitle = clientsPayload
      .map(function (c) {
        return c.Title || c.EmailAddress;
      })
      .filter(Boolean)
      .join(" & ");

    // 2) Create single case — primary client on person field
    createSingleCase(
      category,
      {
        clientData: primary,
        jointTitle: jointTitle,
        allClients: clientsPayload,
        adviserEmail: adviserEmail,
        adviserTitle: adviserTitle,
        priority: priority,
        subType: subType,
      },
      function (createErr, caseId) {
        globalDefinitions.closeLoader();
        if (createErr) {
          globalDefinitions.HandlerError(
            "Case could not be created: " + createErr,
            false
          );
          globalDefinitions.onActionFailed();
          return;
        }
        globalDefinitions.HandlerSuccess("Case created: " + caseId);
        try {
          globalDefinitions.AuditLogManager_SaveLog({
            Action: "Created case " + caseId,
            Message:
              category +
              " / " +
              subType +
              " · Clients: " +
              jointTitle,
          });
        } catch (e) {}
        globalDefinitions.onActionCompleted();
        $spcontext.redirect("#/cases", false);
      }
    );
  });
};

function updateClientsSequentially(list, done) {
  var i = 0;
  function next() {
    if (i >= list.length) {
      done(null);
      return;
    }
    var item = list[i++];
    $spcontext.updateItems(
      [item],
      clientsListName(),
      function () {
        next();
      },
      function (sender, args) {
        done(
          (args && args.get_message && args.get_message()) ||
            "Update failed for client #" + item.ID
        );
      }
    );
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

  // ClientName / ClientEmail: semicolon-separated, primary first.
  // Example Name:  "Jane Smith; John Doe"
  // Example Email: "jane@example.com; john@example.com"
  // Power Automate: split(ClientEmail, ';') then trim — index 0 = primary.
  var clients = ctx.allClients && ctx.allClients.length
    ? ctx.allClients
    : ctx.clientData
      ? [ctx.clientData]
      : [];
  var clientNames = clients
    .map(function (c) {
      return trim(c.Title || ((c.FirstName || "") + " " + (c.LastName || "")));
    })
    .filter(Boolean);
  var clientEmails = clients
    .map(function (c) {
      return trim(c.EmailAddress || "").toLowerCase();
    })
    .filter(Boolean);

  var formData = {
    ApplicationType: appType,
    CasePriority: ctx.priority,
    Title: ctx.jointTitle || clientNames.join(" & ") || appType,
    ClientName: clientNames.join("; "),
    ClientEmail: clientEmails.join("; "),
    Adviser: ctx.adviserEmail,
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
  };

  if (ctx.subType) {
    if (appType === "MORTGAGE") formData.MortgageType = ctx.subType;
    else if (appType === "P4L") formData.P4LType = ctx.subType;
    else if (appType === "GI") formData.GIType = ctx.subType;
  }


  console.log("[NewCase] Creating module case", {
    listName: listName,
    codePrefix: codePrefix,
    applicationType: appType,
    subType: ctx.subType,
    formData: formData,
    ctxSummary: {
      priority: ctx.priority,
      adviserEmail: ctx.adviserEmail,
      jointTitle: ctx.jointTitle,
      primaryClient: ctx.clientData,
      allClients: ctx.allClients,
    },
  });

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

      console.log("[NewCase] Module case created", {
        listName: listName,
        itemID: itemID,
        caseId: caseId,
      });

      var updateObj = {
        ID: itemID,
        Year: year,
        LastTimeItemModifiedByWorklow: $spcontext.serverDate
          ? $spcontext.serverDate()
          : new Date(),
        SLA_COUNT_UPDATED: "No",
        WorkflowRequestID: caseId,
      };

      var casesListName = configProperties.CASESLIST.setting;
      var mirrorData = {
        CaseID: caseId,
        ApplicationType: appType,
        ClientName: formData.ClientName,
        ClientEmail: formData.ClientEmail,
        Adviser: formData.Adviser,
        Title: formData.Title,
        Status: "Open",
        CurrentStage: "Lead",
        ModuleListName: listName,
        ModuleItemID: itemID,
        LastActionDate: $spcontext.serverDate
          ? $spcontext.serverDate()
          : new Date(),
      };

      console.log("[NewCase] Creating CASESLIST mirror", {
        listName: casesListName,
        mirrorData: mirrorData,
      });

      $spcontext.createItems(
        [mirrorData],
        casesListName,
        function (mirrorCreated) {
          var mirrorItemID = mirrorCreated[0].get_id();
          updateObj.CaseListID = mirrorItemID;

          console.log("[NewCase] CASESLIST mirror created", {
            mirrorItemID: mirrorItemID,
            updateObj: updateObj,
          });

          $spcontext.updateItems(
            [updateObj],
            listName,
            function () {
              if (
                window.CaseTaskService &&
                typeof CaseTaskService.onNewCaseCreated === "function"
              ) {
                var taskPayload = {
                  CaseID: caseId,
                  CaseListItemId: mirrorItemID,
                  ApplicationType: appType,
                  Client: ctx.jointTitle || ctx.clientData.Title,
                  Adviser: formData.Adviser,
                  AdviserName: ctx.adviserEmail,
                  CaseManager: formData.Adviser,
                  Initiator: CurrentUserProperties.email,
                  InitialStage: "Lead",
                };
                console.log("[NewCase] Creating initial tasks", taskPayload);
                CaseTaskService.onNewCaseCreated(
                  taskPayload,
                  function (err) {
                    if (err) console.warn("[NewCase] Initial tasks warning:", err);
                    callback(null, caseId);
                  }
                );
              } else {
                callback(null, caseId);
              }
            },
            function (sender, args) {
              var msg =
                (args && args.get_message && args.get_message()) ||
                "Failed to finalise case";
              console.error("[NewCase] Failed module list update", {
                listName: listName,
                updateObj: updateObj,
                error: msg,
                sender: sender,
                args: args,
              });
              callback(msg);
            }
          );
        },
        function (sender, args) {
          var msg =
            (args && args.get_message && args.get_message()) ||
            "Failed to mirror case";
          console.error("[NewCase] Failed CASESLIST create", {
            listName: casesListName,
            mirrorData: mirrorData,
            error: msg,
            sender: sender,
            args: args,
          });
          callback(msg);
        }
      );
    },
    function (sender, args) {
      var msg =
        (args && args.get_message && args.get_message()) ||
        "Failed to create case";
      console.error("[NewCase] Failed module list create", {
        listName: listName,
        formData: formData,
        error: msg,
        sender: sender,
        args: args,
      });
      callback(msg);
    }
  );
}