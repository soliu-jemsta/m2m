var MainApplication = new MainStartPoint();
var customWorkflowEngine;
var CurrentUserProperties = {};

var configProperties = {
  restrictedlinks: [],
};

var configProperties = {
  restrictedlinks: [],
};

var speedctxRoot;
var globalDefinitions;
var rsBAContext;
var popContext;
var $spcontext;
// var testContext;
var dependencyState = {
  userLoaded: false,
  configLoaded: false,
  groupChecksStarted: false,
};

function MainStartPoint() {
  this.url = window.location.href;
  this.notyf = new Notyf({
    duration: 5000,
    //dismissible: true,
    position: {
      x: "right", // 'left' or 'right'
      y: "top", // 'top' or 'bottom'
    },
    types: [
      {
        type: "black",
        background: "black",
        icon: {
          className: "material-icons",
          tagName: "i",
          text: "info", // optional icon
        },
        duration: 3000,
      },
    ],
  });
  this.profilephoto = `/_layouts/15/userphoto.aspx?size=M&accountname=`;
  this.profilephotoLarge = `/_layouts/15/userphoto.aspx?size=L&accountname=`;
  this.messageTemplate = {};
  this.cachedState = {
    mode: false,
    pageStateCall: null,
    reportAdmin: false,
    isWorkflowActor: false,
    workflowActors: {},
    isAdmin: false,
    isReportAdmin: false,
    ipaddress: "",
    departments: [],
    hods: {},
    currentUserIsHod: {
      auth: false,
      department: "",
    },
  };
  this.isAnAdmin;
  this.isManagement;
  this.clientDetails = {};
  this.clientList = [];

  this.adviserDetails = {};
  this.advisersList = [];

  this.AuditDetails = {};
  this.AuditList = [];

  this.configuredTaskMembers = {};
  this.isUserAnActor = false;
  this.isPureHOD = false;

  this.CaseApprovalComponent = {};
  this.DashBoardComponent = {};
  this.CasesComponent = {};
  this.ClientsComponent = {};
  this.ReportComponent = {};
  this.NewCaseComponent = {};
  this.NewClientComponent = {};
  this.ReportComponent = {};
  this.SettingsComponent = {};
  this.CaseDetailComponent = {};

  this.CurrentPageSubmitFunction = null;
  this.auditType = [];
  this.processes = [];
  this.Department = [];
  this.departmentDetails = {};
  // this.procedures = [];

  this.auditNavigationClicks = function (clicklocation) {
    globalDefinitions.AuditLogManager_SaveLog({
      Action: `Authorized accessed ${clicklocation}`,
      Message: `user visited the ${clicklocation} at ${$spcontext.stringnifyDate({ format: "dd/mm/yy", includeTime: true })}`,
    });
  };
}

function whenLayoutLoaded() {
  //load view port to enable page to be mobile responsive
  $("head").append(
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
  );
  //============================================================================================
  console.log("Main.js started");
  $spcontext.loadSPDependencies(function () {
    // console.log("SP dependencies started");
    var dependenciesCount = 0;
    var expectedDepenciesCount = 7;
    // speedctxRoot = new Speed();
    globalDefinitions = new GlobalDefinitionsManager();

    // globalDefinitions.callLoader();

    window.globalProp
      .getClientIP()
      .then((response) => {
        // console.log("IP loaded");
        MainApplication.cachedState.ipaddress = response;
        checkAppDependency();
      })
      .catch((error) => {
        checkAppDependency();
      });

    $spcontext.currentUserDetails((user) => {
      // console.log("User loaded");
      CurrentUserProperties.email = user.get_email();
      CurrentUserProperties.email = CurrentUserProperties.email.toLowerCase();
      CurrentUserProperties.login = CurrentUserProperties.email;
      CurrentUserProperties.title = user.get_title();

      var nameParts = $.trim(CurrentUserProperties.title).split(/\s+/);
      var initials = "";
      var shortName = "";
      var firstName = "";

      if (nameParts.length > 0) {
        firstName = nameParts[0];
        initials = nameParts[0].charAt(0).toUpperCase();

        if (nameParts.length > 1) {
          initials += nameParts[1].charAt(0).toUpperCase();
          shortName =
            nameParts[0] + " " + nameParts[1].charAt(0).toUpperCase() + ".";
        } else {
          shortName = nameParts[0];
        }
      }

      // store if you want to reuse elsewhere
      CurrentUserProperties.initials = initials;
      CurrentUserProperties.shortName = shortName;
      CurrentUserProperties.firstName = firstName;

      // $("#top-username").text(CurrentUserProperties.firstName);
      $("#shortname").text(CurrentUserProperties.shortName);

      dependencyState.userLoaded = true;
      tryRunGroupChecks();
      checkAppDependency();
    });

    $spcontext.getItem(
      "Configuration",
      $spcontext.camlBuilder(),
      function (configObjects) {
        // console.log("Root Config loaded");
        var listEnumerator = configObjects.getEnumerator();
        while (listEnumerator.moveNext()) {
          var settingType = listEnumerator
            .get_current()
            .get_item("SettingType");
          var configObj = {};
          configObj.title = listEnumerator.get_current().get_item("Title");
          configObj.setting = listEnumerator.get_current().get_item("Setting");
          if (settingType == "Restricted") {
            configProperties.restrictedlinks.push(configObj);
          } else {
            configProperties[configObj.title] = configObj;
          }
        }

        $spcontext.errorHandler = globalDefinitions.errorHandler;

        globalDefinitions.stageDefinitions.workflowcode =
          configProperties.WORKFLOWCODE.setting;
        globalDefinitions.stageDefinitions.workflow =
          configProperties.WORKFLOWNAME.setting;

        $("#jemstaLogo").attr("src", configProperties.JEMSTALOGO.setting);
        // $("#auditmanagementversion").text(configProperties.NCVERSION.setting);
        // $("#versioneffectivedate").text(configProperties.VERSIONEFFECTIVEDATE.setting);
        // $("#auditmanagementversionMobile").text(configProperties.NCVERSION.setting);
        // $("#versioneffectivedateMobile").text(configProperties.VERSIONEFFECTIVEDATE.setting);

        dependencyState.configLoaded = true;
        tryRunGroupChecks();

        MainApplication.getMortgageDetails(checkAppDependency);

        // $spcontext.getItem("MachineType", $spcontext.camlBuilder(titleQuery), function (_spMeta) {
        //   var listEnumerator = _spMeta.getEnumerator();
        //   MainApplication.machineTypes = [];
        //   while (listEnumerator.moveNext()) {
        //     var title = listEnumerator.get_current().get_item("Title");
        //     MainApplication.machineTypes.push(title);
        //   }
        //   checkAppDependency();
        // })

        // $spcontext.getItem("ServiceLine", $spcontext.camlBuilder(titleQuery), function (_spMeta) {
        //   var listEnumerator = _spMeta.getEnumerator();
        //   MainApplication.serviceLines = [];
        //   while (listEnumerator.moveNext()) {
        //     var title = listEnumerator.get_current().get_item("Title");
        //     MainApplication.serviceLines.push(title);
        //   }
        //   checkAppDependency();
        // })

        // $spcontext.getItem("CustomerList", $spcontext.camlBuilder(titleQuery), function (_spMeta) {
        //   var listEnumerator = _spMeta.getEnumerator();
        //   MainApplication.customerList = [];
        //   while (listEnumerator.moveNext()) {
        //     var customerObj = {};
        //     customerObj.title = listEnumerator.get_current().get_item("Title");
        //     customerObj.contactName = listEnumerator.get_current().get_item("ContactName");
        //     customerObj.contactEmail = listEnumerator.get_current().get_item("EmailAddress");
        //     MainApplication.customerList.push(customerObj);
        //   }
        //   checkAppDependency();
        // })
        var clientInfoColumns = [
          "ID",
          "Title",
          "EmailAddress",
          "DOB",
          "Nationality",
          "MaritalStatus",
          "MobileNumber",
        ];

        $spcontext.getListToItems(
          "ClientsList",
          [
            {
              orderby: "ID",
              ascending: "FALSE",
            },
          ],
          {
            ignoreThreshold: false,
            data: clientInfoColumns,
            merge: false,
          },
          false,
          function (item) {
            const client = {
              ID: item.ID || "",
              Title: item.Title || "",
              Email: item.EmailAddress || "",
              DOB: item.DOB || "",
              Nationality: item.Nationality || "",
              MaritalStatus: item.MaritalStatus || "",
              MobileNumber: item.MobileNumber || "",
            };

            if (client.Email) {
              MainApplication.clientDetails[client.Email.toLowerCase()] = client;
              MainApplication.clientList.push(client);
            }

            return client;
          },
          function (items) {
            MainApplication.clientList = items;

            checkAppDependency();
          }
        );

        var advisersColumn = [
          "ID",
          "Title",
          "EmailAddress",
        ];

        $spcontext.getListToItems(
          "Advisers",
          [
            {
              orderby: "ID",
              ascending: "FALSE",
            },
          ],
          {
            ignoreThreshold: false,
            data: advisersColumn,
            merge: false,
          },
          false,
          function (item) {

            const adviser = {
              Title: item.Title || "",
              Email: item.EmailAddress || "",
            };

            if (adviser.Email) {
              MainApplication.adviserDetails[adviser.Email.toLowerCase()] = adviser;
              MainApplication.advisersList.push(adviser);
            }

            return adviser;
          },
          function (items) {
            MainApplication.advisersList = items;

            checkAppDependency();
          }
        );
      },
    );

    function checkAppDependency() {
      dependenciesCount++;
      if (dependenciesCount === expectedDepenciesCount) {
        console.log("Dependency count: ", dependenciesCount);
        console.log("Expected Dependencies: ", expectedDepenciesCount);
        globalDefinitions.AuditLogManager_SaveLog({
          Action: `Logged into/Opened M2M`,
          Message: `user logged in to application at ${$spcontext.stringnifyDate({ format: "dd/mm/yy", includeTime: true })}`,
        });

        const userEmail = CurrentUserProperties.email?.toLowerCase();
        const pp = MainApplication.profilephoto + userEmail;

        if (userEmail) {
          try {
            // $("#greeting").text(
            //     `${MainApplication.getGreeting()}, ${CurrentUserProperties.firstName}`
            // );
            $("#shortname").text(CurrentUserProperties.shortName || "");
            // $("#top-username").text(CurrentUserProperties.shortName || "");
            // $(".av").text(CurrentUserProperties.shortName || "");
            // $("#user-role").text(MainApplication.staffDetails[userEmail].Designation || "");
            $(".avatar").attr(
              "src",
              pp ||
                `https://placehold.co/120x120/8B5CF6/FFFFFF?text=${CurrentUserProperties.initials}`,
            );
            $(".avatar-sm").attr(
              "src",
              pp ||
                `https://placehold.co/120x120/8B5CF6/FFFFFF?text=${CurrentUserProperties.initials}`,
            );
          } catch (e) {
            console.error("Error setting user profile photo: ", e);
          }
        }

        if (!MainApplication.isAnAdmin) {
          $("#onboardNav").hide();
          // $(".reviewNav").show();
          // MainApplication.pendingRequests();
          // $(".newNCNav").show();
          // $(".newNCNavMobile").show();
        }

        MainApplication.pendingRequests();
        $spcontext.errorHandler = globalDefinitions.errorHandler;
        MainApplication.cachedState.mode = true;
        MainApplication.cachedState.pageStateCall();
      }
    }

    function runGroupChecks() {
      if (!CurrentUserProperties.email || !configProperties.MANAGEMENT) return;

      $spcontext.isUserMemberOfGroup(
        [
          configProperties.MANAGEMENT.setting,
          // configProperties.CEO.setting,
          configProperties.REPORTADMIN.setting,
          // configProperties.HOD.setting,
          // configProperties.CUSTOMERUNIT.setting
        ],
        { email: CurrentUserProperties.email, groupEmails: true },
        function (isUserMember, groupUserProperties) {
          MainApplication.isUserAnActor = isUserMember || false;
          MainApplication.configuredTaskMembers = groupUserProperties || {};

          // const isInHOD = groupUserProperties[configProperties.HOD.setting]?.belongs || false;
          const isInManagement =
            groupUserProperties[configProperties.MANAGEMENT.setting]?.belongs ||
            false; // adjust key if needed
          MainApplication.isManagement = isInManagement;
          // const isInCEO = groupUserProperties[configProperties.CEO.setting]?.belongs || false; // adjust key
          const isInReportAdmin =
            groupUserProperties[configProperties.REPORTADMIN.setting]
              ?.belongs || false; // adjust key
          MainApplication.isAnAdmin = isInReportAdmin;
          // const isInCustomerUnit = groupUserProperties[configProperties.CUSTOMERUNIT.setting]?.belongs || false; // adjust key

          // MainApplication.isPureHOD = isInHOD && !isInManagement && !isInCEO && !isInReportAdmin && !isInCustomerUnit;
          checkAppDependency();
        },
      );

      $spcontext.isCurrentUserMemberOfGroup(
        configProperties.REPORTADMIN.setting,
        function (isAdmin) {
          MainApplication.cachedState.isReportAdmin = isAdmin || false;
          checkAppDependency();
        },
      );
    }

    function tryRunGroupChecks() {
      // console.log("Trying to run group checks...");
      if (
        dependencyState.userLoaded &&
        dependencyState.configLoaded &&
        !dependencyState.groupChecksStarted
      ) {
        dependencyState.groupChecksStarted = true;
        runGroupChecks();
      }
    }
  });
}

// MainApplication.loadTransferCodes = function (callback = null) {
//   var transQuery = [
//       {
//         ascending: "TRUE",
//         orderby: "TransferCode",
//       }
//     ];
//     $spcontext.getItem(
//         "TransferCodes",
//         $spcontext.camlBuilder(transQuery),
//         function (_spMeta) {
//             MainApplication.transfercodes = [];

//             const listEnumerator = _spMeta.getEnumerator();

//             while (listEnumerator.moveNext()) {
//                 MainApplication.transfercodes.push({
//                     ID: listEnumerator.get_current().get_item("ID") || "",
//                     name: listEnumerator.get_current().get_item("Title") || "",
//                     code: listEnumerator.get_current().get_item("TransferCode") || ""
//                 });
//             }

//             callback?.();
//         }
//     );
// }

MainApplication.getMortgageDetails = function (callback = null) {
  var transQuery = [
    {
      ascending: "TRUE",
      orderby: "Title",
    },
  ];

  $spcontext.getItem(
    "MortgageTypes",
    $spcontext.camlBuilder(transQuery),
    function (_spMeta) {
      MainApplication.mortgageTypes = [];
      MainApplication.mortgageCategory = [];
      MainApplication.mortgageCategoryDetails = {};

      const listEnumerator = _spMeta.getEnumerator();

      while (listEnumerator.moveNext()) {
        const item = listEnumerator.get_current();

        const name = item.get_item("Title") || "";
        const category = item.get_item("Category")
          ? item.get_item("Category").get_lookupValue()
          : "";

        // Flat array (keep the objects if you still need them)
        MainApplication.mortgageTypes.push({
          name,
          category,
        });

        if (category) {
          // Create the category if it doesn't exist
          if (!MainApplication.mortgageCategoryDetails[category]) {
            MainApplication.mortgageCategoryDetails[category] = [];
            MainApplication.mortgageCategory.push(category);
          }

          // Store ONLY the name
          MainApplication.mortgageCategoryDetails[category].push(name);
        }
      }

      callback?.();
    }
  );
};

MainApplication.reportSyncSearch = function (keyquery, data) {
  if (!keyquery || keyquery.trim().length < 3) {
    return data;
  }

  keyquery = keyquery.trim().toLowerCase();

  return data.filter(
    (item) =>
      item.EmployeeName?.toLowerCase().includes(keyquery) ||
      item.WorkflowRequestID?.toLowerCase().includes(keyquery) ||
      item.Title?.toLowerCase().includes(keyquery) ||
      item.EmployeeDivision?.toLowerCase().includes(keyquery) ||
      item.EmployeeEmail?.toLowerCase().includes(keyquery) ||
      item.Approval_Status?.toLowerCase().includes(keyquery) ||
      item.Current_Approver?.toLowerCase().includes(keyquery) ||
      item.Division?.toLowerCase().includes(keyquery),
  );
};

MainApplication.populateDisabledMultiSelect = function (
  selectId,
  rawData,
  options = {},
) {
  const defaults = {
    placeholderWhenEmpty: "No items available",
    placeholderWhenFilled: "Pre-selected items (view only)",
  };
  const config = { ...defaults, ...options };

  // Normalize input to array
  let items = [];

  const raw = (rawData ?? "").toString().trim();

  if (Array.isArray(rawData)) {
    items = rawData;
  } else if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    } catch {
      // fallback: comma-separated string
      items = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // Get the select element
  const $select = $(`#${selectId}`);

  if (!$select.length) {
    return;
  }

  // Clear existing options
  $select.empty();

  // Add options (all pre-selected)
  items.forEach((item) => {
    if (item && typeof item === "string") {
      // skip empty/invalid
      const opt = new Option(item, item, true, true);
      $select.append(opt);
    }
  });

  // Initialize or re-initialize Select2
  $select.select2({
    placeholder: items.length
      ? config.placeholderWhenFilled
      : config.placeholderWhenEmpty,
    allowClear: false,
    disabled: true,
    width: "100%",
  });

  // Optional: trigger change just in case
  $select.trigger("change");
};

MainApplication.normalizeMultiSelectData = function (rawData) {
  let items = [];

  const raw = (rawData ?? "").toString().trim();

  if (Array.isArray(rawData)) {
    items = rawData;
  } else if (raw) {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        items = parsed;
      }
    } catch {
      items = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return items;
};

MainApplication.populateBadgeList = function (
  containerId,
  rawData,
  options = {},
) {
  const defaults = {
    emptyText: "No items available",
    baseClass: "badge",
    colorClasses: ["badge-blue", "badge-green", "badge-orange", "badge-amber"],
  };

  const config = { ...defaults, ...options };

  // Normalize input to array
  let items = [];
  const raw = (rawData ?? "").toString().trim();

  if (Array.isArray(rawData)) {
    items = rawData;
  } else if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    } catch {
      items = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // Get container
  const $container =
    containerId instanceof jQuery ? containerId : $(`#${containerId}`);

  if (!$container.length) {
    return;
  }

  // Clear existing content
  $container.empty();

  // Handle empty state
  if (!items.length) {
    $container.append(`<span class="text-gray-400">${config.emptyText}</span>`);
    return;
  }

  // Render badges with alternating colors
  items.forEach((item, index) => {
    if (item && typeof item === "string") {
      const colorClass =
        config.colorClasses[index % config.colorClasses.length];
      const badge = `<span class="${config.baseClass} ${colorClass}" style="margin-right:6px;">${item}</span>`;
      $container.append(badge);
    }
  });
};

MainApplication.pendingRequests = function () {
  var queryCaml = [
    {
      ascending: "FALSE",
      orderby: "Modified",
    },
    {
      operator: "Eq",
      field: "Approval_Status",
      type: "Text",
      val: "Pending",
    },
  ];
  // if (MainApplication.isUserAnActor) {
  //   queryCaml.push({
  //     operator: "Eq",
  //     field: "Current_Approver",
  //     type: "Text",
  //     val: globalDefinitions.stageDefinitions.management,
  //   });
  // }

  // queryCaml = customWorkflowEngine.setupTaskForGroups(queryCaml);
  var query = $spcontext.camlBuilder(queryCaml);
  var extraProperties = {
    merge: true,
    data: [
      "ID",
      "Title",
      "WorkflowRequestID",
      "Current_Approver",
      "Current_Approver_Code",
      "Approval_Status",
      "Created",
      "InitiatorEmailAddress",
      "InitiatorLogin",
      "Transaction_History",
      "ReturnForCorrection",
      "Modified",
      "PendingUserEmail",
      "PendingUserLogin",
      "Lender", "Adviser", "Client",
      "ApplicationType", "LoanAmountRequired",
      "Year",
      "Month",
    ],
  };
  $spcontext.getListToItems(
    configProperties.CASESLIST.setting,
    query,
    extraProperties,
    true,
    null,
    function (data) {
      $("#caseBadge").html(data.length || 0);
    },
  );
};

MainApplication.updateNoDataState = function (filteredItems, searchQuery) {
  var $noData = $("#noDataState");

  if (!filteredItems || filteredItems.length === 0) {
    var hasSearch = searchQuery && searchQuery.trim().length > 0;

    // Update messaging
    $noData
      .find(".no-data-title")
      .text(hasSearch ? "No results found 🔍" : "Nothing here… yet!");

    $noData
      .find(".no-data-sub")
      .text(
        hasSearch
          ? "We couldn’t find anything matching your search."
          : "Looks like there are no submissions to display right now.",
      );

    $noData
      .find(".no-data-hint")
      .text(
        hasSearch
          ? "Try a different keyword or reset your search 👀"
          : "Check back later or be the first to submit 🚀",
      );

    $noData.removeClass("hidden");
  } else {
    $noData.addClass("hidden");
  }
};

MainApplication.handleDateRangeValidation = function () {
  const fromInput = $("#dateFrom");
  const toInput = $("#dateTo");

  const fromDate = fromInput.val();
  const toDate = toInput.val();

  // If From date is selected → restrict To date
  if (fromDate) {
    toInput.attr("min", fromDate);

    // If To date exists and is now invalid (earlier than From), clear it
    if (toDate && toDate < fromDate) {
      toInput.val("");
    }
  }

  // If To date is selected → restrict From date
  if (toDate) {
    fromInput.attr("max", toDate);

    // If From date exists and is now invalid (later than To), clear it
    if (fromDate && fromDate > toDate) {
      fromInput.val("");
    }
  }
};

MainApplication.getGreeting = function () {
  const hour = $spcontext.serverDate().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
};
whenLayoutLoaded();
