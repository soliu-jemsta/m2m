/**
 * New Client — basic information only
 * ───────────────────────────────────
 * Saves FirstName, LastName, contact, DOB, nationality (country list),
 * addresses (OpenStreetMap Nominatim suggestions + same-as-residential).
 * No email notifications. Advanced fields hidden for now.
 */

var _newClientLoadRetries = 0;

loadNewClientComponent = function () {
  if (MainApplication.cachedState && MainApplication.cachedState.mode) {
    _newClientLoadRetries = 0;
    whenNewClientLoaded();
  } else {
    // App still booting — register callback and retry a few times
    if (MainApplication.cachedState) {
      MainApplication.cachedState.pageStateCall = loadNewClientComponent;
    }
    if (_newClientLoadRetries < 20) {
      _newClientLoadRetries += 1;
      setTimeout(function () {
        loadNewClientComponent();
      }, 500);
    } else {
      // Give up waiting — still try to init the form so the page is usable
      console.warn("[NewClient] app mode not ready; initialising form anyway");
      whenNewClientLoaded();
    }
  }
};

var AppRequest;

MainApplication.NewClientComponent =
  MainApplication.NewClientComponent || {};

MainApplication.NewClientComponent.ApplicationDetails = function () {
  this.url = window.location.href;
  this.itemId = null;
  this.mode = null;
  this.requestDetails = {};
};

/* ═══════════════════════════════════════════════════════════
   ClientFormUtils — validation & data handling
   ═══════════════════════════════════════════════════════════ */

var ClientFormUtils = (function () {
  "use strict";

  var EMAIL_RE =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  var PHONE_RE = /^(?:(?:\+?44)|0)[\d\s\-()]{9,16}$/;
  var NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-\s]{1,80}$/;

  function trim(v) {
    return v == null ? "" : String(v).trim();
  }

  function isEmpty(v) {
    return trim(v) === "";
  }

  function toNumber(v) {
    if (isEmpty(v)) return null;
    var n = Number(String(v).replace(/,/g, ""));
    return isFinite(n) ? n : NaN;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function validateRule(rule, value) {
    var v = trim(value);
    switch (rule) {
      case "required":
        if (isEmpty(v)) return "This field is required";
        break;
      case "email":
        if (!isEmpty(v) && !EMAIL_RE.test(v)) return "Enter a valid email address";
        break;
      case "phone":
        if (!isEmpty(v)) {
          var digits = v.replace(/[\s\-()]/g, "");
          if (digits.length < 10 || !PHONE_RE.test(v.replace(/\s+/g, " ").trim())) {
            return "Enter a valid phone number";
          }
        }
        break;
      case "name":
        if (!isEmpty(v) && !NAME_RE.test(v)) {
          return "Use letters, spaces, hyphens or apostrophes only";
        }
        break;
      case "dob":
        if (!isEmpty(v)) {
          var d = new Date(v);
          if (isNaN(d.getTime())) return "Enter a valid date";
          var now = new Date();
          if (d > now) return "Date of birth cannot be in the future";
          var age = (now - d) / (365.25 * 24 * 3600 * 1000);
          if (age > 120) return "Please check the date of birth";
          if (age < 16) return "Client must be at least 16 years old";
        }
        break;
      case "currency":
        if (!isEmpty(v)) {
          var n = toNumber(v);
          if (isNaN(n)) return "Enter a valid number";
          if (n < 0) return "Value cannot be negative";
        }
        break;
      default:
        break;
    }
    return null;
  }

  function clearFieldError(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("is-invalid");
    var err = document.querySelector('[data-error-for="' + id + '"]');
    if (err) err.textContent = "";
  }

  function setFieldError(id, msg) {
    var el = document.getElementById(id);
    if (el) el.classList.add("is-invalid");
    var err = document.querySelector('[data-error-for="' + id + '"]');
    if (err) err.textContent = msg || "";
  }

  function validateForm(root) {
    root = root || document;
    var nodes = root.querySelectorAll("[data-validate]");
    var errors = [];

    nodes.forEach(function (el) {
      if (el.closest("#advancedInfoSection")) {
        clearFieldError(el.id);
        return;
      }

      var rules = (el.getAttribute("data-validate") || "")
        .split("|")
        .map(function (r) {
          return r.trim();
        })
        .filter(Boolean);

      var msg = null;
      for (var i = 0; i < rules.length; i++) {
        msg = validateRule(rules[i], el.value);
        if (msg) break;
      }

      if (msg) {
        setFieldError(el.id, msg);
        errors.push({ id: el.id, message: msg });
      } else {
        clearFieldError(el.id);
      }
    });

    return { ok: errors.length === 0, errors: errors };
  }

  function collectFormData(root) {
    root = root || document;
    var data = {};
    var nodes = root.querySelectorAll(
      "[speed-bind], [speed-bind-validate]"
    );
    nodes.forEach(function (el) {
      if (el.closest("#advancedInfoSection")) return;

      var key =
        el.getAttribute("speed-bind-validate") ||
        el.getAttribute("speed-bind");
      if (!key) return;

      var val = el.value;
      if (el.type === "date") {
        data[key] = isEmpty(val) ? null : val;
      } else {
        data[key] = trim(val);
      }
    });
    return data;
  }

  return {
    trim: trim,
    isEmpty: isEmpty,
    escapeHtml: escapeHtml,
    validateForm: validateForm,
    collectFormData: collectFormData,
    clearFieldError: clearFieldError,
    setFieldError: setFieldError,
    EMAIL_RE: EMAIL_RE,
  };
})();

if (typeof window !== "undefined") {
  window.ClientFormUtils = ClientFormUtils;
}

/* ═══════════════════════════════════════════════════════════
   Country list (nationality dropdown)
   ═══════════════════════════════════════════════════════════ */

var WORLD_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador",
  "Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu",
  "Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

function populateNationalityDropdown() {
  var sel = document.getElementById("cl_nationality");
  if (!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">Select country…</option>';
  var preferred = ["United Kingdom", "Ireland", "United States", "Canada", "Australia", "India", "Nigeria", "South Africa"];
  preferred.forEach(function (c) {
    if (WORLD_COUNTRIES.indexOf(c) >= 0) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    }
  });
  var sep = document.createElement("option");
  sep.disabled = true;
  sep.textContent = "──────────";
  sel.appendChild(sep);
  WORLD_COUNTRIES.forEach(function (c) {
    if (preferred.indexOf(c) >= 0) return;
    var o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    sel.appendChild(o);
  });
  if (current) sel.value = current;
}

/* ═══════════════════════════════════════════════════════════
   Address autocomplete — OpenStreetMap Nominatim (free)
   ═══════════════════════════════════════════════════════════ */

function bindAddressAutocomplete(inputId, suggestionsId) {
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
        ClientFormUtils.clearFieldError(inputId);
        hide();
        if (inputId === "cl_residentialAddress") {
          syncCorrespondenceFromResidential();
        }
      });
      box.appendChild(btn);
    });
    box.classList.add("open");
  }

  input.addEventListener("input", function () {
    var q = ClientFormUtils.trim(input.value);
    clearTimeout(debounceTimer);
    if (q.length < 3) {
      hide();
      return;
    }
    debounceTimer = setTimeout(function () {
      if (q === lastQuery) return;
      lastQuery = q;
      fetchNominatim(q, function (results) {
        if (ClientFormUtils.trim(input.value) !== q) return;
        showItems(results);
      });
    }, 350);
  });

  input.addEventListener("blur", function () {
    setTimeout(hide, 200);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hide();
  });
}

function fetchNominatim(query, callback) {
  var url =
    "https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=6&q=" +
    encodeURIComponent(query);

  try {
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Nominatim " + res.status);
        return res.json();
      })
      .then(function (data) {
        callback(Array.isArray(data) ? data : []);
      })
      .catch(function (err) {
        console.warn("[NewClient] address lookup failed", err);
        callback([]);
      });
  } catch (e) {
    console.warn("[NewClient] fetch not available", e);
    callback([]);
  }
}

function bindSameAsResidential() {
  var chk = document.getElementById("cl_sameAddress");
  var row = document.getElementById("correspondenceAddressRow");
  var res = document.getElementById("cl_residentialAddress");
  var cor = document.getElementById("cl_correspondenceAddress");
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

function syncCorrespondenceFromResidential() {
  var chk = document.getElementById("cl_sameAddress");
  var res = document.getElementById("cl_residentialAddress");
  var cor = document.getElementById("cl_correspondenceAddress");
  if (chk && chk.checked && res && cor) {
    cor.value = res.value;
  }
}

/* ═══════════════════════════════════════════════════════════
   Page init & save
   ═══════════════════════════════════════════════════════════ */

var _newClientInitDone = false;

function whenNewClientLoaded() {
  // Avoid double-init if boot callback + retry both fire
  if (_newClientInitDone) {
    try {
      globalDefinitions.closeLoader();
    } catch (e) {}
    return;
  }
  _newClientInitDone = true;

  // Page setup is local only — do not open the loader here.
  // Always dismiss any loader left open from app bootstrap.
  try {
    globalDefinitions.closeLoader();
  } catch (e) {}

  try {
    $spcontext.assignAttributes();
    MainApplication.CurrentPageSubmitFunction =
      MainApplication.NewClientComponent.confirmSubmit;
    AppRequest = new MainApplication.NewClientComponent.ApplicationDetails();

    AppRequest.itemId = $spcontext.getParameterByName(
      "itemid",
      window.location.href
    );
    AppRequest.mode = $spcontext.getParameterByName(
      "mode",
      window.location.href
    );

    populateNationalityDropdown();
    bindAddressAutocomplete(
      "cl_residentialAddress",
      "residentialAddressSuggestions"
    );
    bindAddressAutocomplete(
      "cl_correspondenceAddress",
      "correspondenceAddressSuggestions"
    );
    bindSameAsResidential();

    document.querySelectorAll("[data-validate]").forEach(function (el) {
      el.addEventListener("input", function () {
        ClientFormUtils.clearFieldError(el.id);
      });
      el.addEventListener("change", function () {
        ClientFormUtils.clearFieldError(el.id);
      });
    });
  } catch (err) {
    console.error("[NewClient] init error", err);
  }

  // Extra safety: force-hide the loader element in case the modal API lags
  try {
    globalDefinitions.closeLoader();
    var loader = document.getElementById("erploader");
    if (loader) {
      loader.classList.remove("show");
      loader.style.display = "none";
      loader.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("modal-open");
    var backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach(function (bd) {
      if (bd && bd.parentNode) bd.parentNode.removeChild(bd);
    });
  } catch (e2) {}
}

function clientsListName() {
  return (
    (configProperties.CLIENTSLIST && configProperties.CLIENTSLIST.setting) ||
    "ClientsList"
  );
}

MainApplication.NewClientComponent.confirmSubmit = function (action) {
  AppRequest.action = action;
  MainApplication.confirmAction =
    MainApplication.NewClientComponent.actionConfirmed;
  $("#confirmModal").modal("show");
};

MainApplication.NewClientComponent.actionConfirmed = function () {
  MainApplication.NewClientComponent.saveDataToList();
};

MainApplication.NewClientComponent.saveDataToList = function () {
  globalDefinitions.onActionClicked();

  var validation = ClientFormUtils.validateForm(document);
  if (!validation.ok) {
    var first = validation.errors[0];
    globalDefinitions.HandlerError(
      first
        ? "Please fix: " + first.message
        : "Please correct the highlighted fields.",
      false
    );
    globalDefinitions.onActionFailed();
    if (first && first.id) {
      var el = document.getElementById(first.id);
      if (el) el.focus();
    }
    return;
  }

  syncCorrespondenceFromResidential();

  var formData = ClientFormUtils.collectFormData(document);

  try {
    var bound = $spcontext.bind({});
    Object.keys(bound || {}).forEach(function (k) {
      if (
        formData[k] === undefined ||
        formData[k] === null ||
        formData[k] === ""
      ) {
        if (bound[k] !== undefined && bound[k] !== null && bound[k] !== "") {
          formData[k] = bound[k];
        }
      }
    });
  } catch (e) {}

  // Basic fields only
  delete formData.NIN;
  delete formData.EmploymentStatus;
  delete formData.EmployerDetails;
  delete formData.JobTitle;
  delete formData.AnnualIncome;
  delete formData.AdditionalIncome;
  delete formData.MonthlyExpenditure;
  delete formData.CreditProfileIndicator;
  delete formData.ExistingMortgages;
  delete formData.Loans;
  delete formData.CreditCommitments;
  delete formData.ExistingLifeInsurance;
  delete formData.CriticalIllnessCover;
  delete formData.IncomeProtection;
  delete formData.FamilyProtectionArrangements;

  formData.FirstName = ClientFormUtils.trim(formData.FirstName);
  formData.LastName = ClientFormUtils.trim(formData.LastName);
  formData.EmailAddress = ClientFormUtils.trim(formData.EmailAddress).toLowerCase();
  formData.Title = ClientFormUtils.trim(
    (formData.FirstName || "") +
      (formData.LastName ? " " + formData.LastName : "")
  );

  console.log("[NewClient] saving basic info", formData);
  MainApplication.NewClientComponent.proceedToList(formData);
};

MainApplication.NewClientComponent.proceedToList = function (formData) {
  var listName = clientsListName();

  formData.RequestCreated = $spcontext.serverDate
    ? $spcontext.serverDate()
    : new Date();

  $spcontext.createItems(
    [formData],
    listName,
    function () {
      globalDefinitions.HandlerSuccess("Client saved successfully.");
      globalDefinitions.closeLoader();
      try {
        globalDefinitions.AuditLogManager_SaveLog({
          Action:
            "Client created " +
            (formData.Title || formData.EmailAddress || ""),
          Message: "Basic client details saved",
        });
      } catch (e) {}
      globalDefinitions.onActionCompleted();
      $spcontext.redirect("#/clients", false);
    },
    function (sender, args) {
      var msg =
        (args && args.get_message && args.get_message()) ||
        "Could not create client";
      globalDefinitions.HandlerError(msg, false);
      globalDefinitions.onActionFailed();
      globalDefinitions.closeLoader();
    }
  );
};