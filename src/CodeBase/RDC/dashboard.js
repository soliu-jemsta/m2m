loadDashBoardComponent = function () {
  if (MainApplication.cachedState.mode) {
    whenDashboardDependeciesLoaded();
  } else {
    MainApplication.cachedState.pageStateCall = loadDashBoardComponent;
  }
};

var AppRequest;
var customWorkflowEngine;

MainApplication.DashboardComponent.ApplicationDetails = function () {
  this.url = window.location.href;
  this.itemId = null;
  this.mode = null;
  this.requestDetails = {};
  this.Attachments = [];
  this.FileUrls = {};
  this.FolderUrl = "";
  this.AttachmentLoader = {};
  this.messageTemplate = {};
  this.feedback = false;
  this.approverComments = "";
  this.transactionHistory = [];
  this.defaultStage = "AA0";
  this.returned = null;
  this.sectionArr = [];
  this.sections = {};
  this.finalrating = [];
  this.questionSetCounter = 0;
  this.groupProperties = {};
  this.nonConformanceCounter = 1;
  this.staffs = MainApplication.staffList;
  this.depts = MainApplication.Department;
  this.selectedCode = null;
};

whenDashboardDependeciesLoaded = function () {
  console.log("Dashboard Loaded Successfully...");
};

MainApplication.DashboardComponent.showTableData = function (tableData) {
  // MainApplication.updateNoDataState(tableData, $("#reportsearchfield").val());
  // AppRequest.dataForExport = tableData;
  if (tableData.length === 0) {
    $(".staff-table").hide();
    $("#staff-body").empty();
    $("#myrequestpagination").hide();
    $("#empty-state").show();
  } else {
    $(".staff-table").show();
    $(".data-table").show();
    $("#myrequestpagination").show();
    $("#empty-state").hide();
    $spcontext.manualTable(tableData);
  }
  globalDefinitions.closeLoader();
};

MainApplication.DashboardComponent.applyFilters = function () {
  const selectedDept = $("#dept-filter").val();

  let filteredStaff = AppRequest.staffs;

  if (selectedDept) {
    filteredStaff = filteredStaff.filter(
      (staff) => staff.Department && staff.Department.value === selectedDept,
    );
  }

  $("#staff-count").text(filteredStaff.length);

  MainApplication.DashboardComponent.showTableData(filteredStaff);
};

MainApplication.DashboardComponent.renderKPIs = function (staffs) {
  const today = new Date();

  const totalStaff = staffs.length;

  const newThisMonth = staffs.filter((staff) => {
    if (!staff.DOE) return false;

    const doe = new Date(staff.DOE);

    return (
      doe.getMonth() === today.getMonth() &&
      doe.getFullYear() === today.getFullYear()
    );
  }).length;

  const present = staffs.filter((staff) => staff.OnLeave === "No").length;

  const onLeave = staffs.filter((staff) => staff.OnLeave === "Yes").length;

  const activeStaff = staffs.filter(
    (staff) => staff.EmployeeStatus === "Active",
  ).length;

  const attendancePct =
    activeStaff > 0 ? ((present / activeStaff) * 100).toFixed(1) : 0;

  $("#stat-total").text(totalStaff);

  $("#stat-new-hires").text(`${newThisMonth} new this month`);

  $("#stat-present").text(present);

  $("#stat-active").text(activeStaff);

  $("#stat-onleave").text(onLeave);

  $("#stat-departments").text(MainApplication.Department.length);

  $("#attendance-bar").css("width", attendancePct + "%");
};

MainApplication.DashboardComponent.loadBirthdays = function () {
  const today = new Date();

  const birthdays = AppRequest.staffs.filter(
    (staff) =>
      Number(staff.DayOfBirth) === today.getDate() &&
      Number(staff.MonthOfBirth) === today.getMonth() + 1,
  );

  const container = document.getElementById("birthday-container");

  // NO BIRTHDAY TODAY
  if (birthdays.length === 0) {
    const upcomingBirthdays = AppRequest.staffs
      .filter((staff) => staff.DayOfBirth && staff.MonthOfBirth)
      .sort((a, b) => {
        const dateA = new Date(
          today.getFullYear(),
          Number(a.MonthOfBirth) - 1,
          Number(a.DayOfBirth),
        );

        const dateB = new Date(
          today.getFullYear(),
          Number(b.MonthOfBirth) - 1,
          Number(b.DayOfBirth),
        );

        if (dateA < today) {
          dateA.setFullYear(today.getFullYear() + 1);
        }

        if (dateB < today) {
          dateB.setFullYear(today.getFullYear() + 1);
        }

        return dateA - dateB;
      });

    const nextBirthday = upcomingBirthdays[0];

    container.innerHTML = `
            <div class="bday-empty">
                <div class="bday-empty-icon">🗓️</div>

                <p class="bday-empty-text">
                    No birthdays today
                </p>

                <p class="bday-empty-sub">
                    ${
                      nextBirthday
                        ? `Next up: <strong>${nextBirthday.Title}</strong> on ${nextBirthday.DayOfBirth}/${nextBirthday.MonthOfBirth}`
                        : "No birthday information available"
                    }
                </p>
            </div>
        `;

    return;
  }

  // BIRTHDAYS FOUND

  let currentIndex = 0;

  function renderBirthday() {
    const card = container.querySelector(".bday-body");

    if (card) {
      card.classList.add("birthday-out");

      setTimeout(() => {
        updateBirthdayContent();
      }, 250);
    } else {
      updateBirthdayContent();
    }
  }

  function updateBirthdayContent() {
    const staff = birthdays[currentIndex];

    container.innerHTML = `
        <div class="bday-body birthday-in">
            <div class="bday-emoji">🎂</div>

            <p class="bday-name">${staff.Title}</p>

            <p class="bday-meta">
                ${staff.Department?.value || ""}
                Department
            </p>

            <p class="bday-quote">
                "Wishing you a fantastic birthday — may this year be your brightest yet!"
            </p>

            <button class="btn-wish hidden">
                Send Wishes
            </button>
        </div>
    `;
  }

  renderBirthday();

  // ONLY SHOW NAVIGATION IF MORE THAN ONE PERSON
  if (birthdays.length > 1) {
    $("#bday-nav").removeClass("hidden");
    $("#bday-nav").addClass("bday-nav");
    

    $("#bday-next")
      .off()
      .on("click", function () {
        currentIndex++;

        if (currentIndex >= birthdays.length) {
          currentIndex = 0;
        }

        renderBirthday();
      });

    $("#bday-prev")
      .off()
      .on("click", function () {
        currentIndex--;

        if (currentIndex < 0) {
          currentIndex = birthdays.length - 1;
        }

        renderBirthday();
      });

    // Auto rotate every 5 seconds
    setInterval(function () {
      currentIndex++;

      if (currentIndex >= birthdays.length) {
        currentIndex = 0;
      }

      renderBirthday();
    }, 5000);
  }
};

MainApplication.DashboardComponent.loadTransferCodes = function () {
  if (MainApplication.transfercodes.length === 0) {
    const emptyText = `<p>No Codes</p>`;
    document.getElementById("codes-list").innerHTML = emptyText;
  } else {
    const html = MainApplication.transfercodes
  .map((item) => {
    const deleteButton = MainApplication.isAnAdmin
      ? `
        <button
            class="code-del"
            title="Remove"
            data-id="${item.ID}"
            data-bs-toggle="modal"
            data-bs-target="#deleteModal">
            ✕
        </button>
      `
      : "";

    return `
      <div class="code-item">
          <span class="code-name">${item.name}</span>
          <span class="code-num">${item.code}</span>
          ${deleteButton}
      </div>
    `;
  })
  .join("");

    document.getElementById("codes-list").innerHTML = html;
    
  }
};

MainApplication.DashboardComponent.submitCode = function () {
  
  var formData = $spcontext.bind({});

  if ($spcontext.checkPassedValidation()) {
    globalDefinitions.callLoader();
    $("#transferCodeModal").modal("hide");
    $spcontext.createItems([formData], "TransferCodes", function () {
      globalDefinitions.HandlerSuccess(`Code added successfully`);

      globalDefinitions.AuditLogManager_SaveLog({
        Action: `${CurrentUserProperties.title} added a transfer code`,
      });

      globalDefinitions.onActionCompleted();
      $spcontext.resetBind();
      // $spcontext.redirect("#/", false);
      MainApplication.loadTransferCodes(whenDashboardDependeciesLoaded);

      globalDefinitions.closeLoader();
    });
  } else {
    globalDefinitions.HandlerError("", true);
    // globalDefinitions.onActionFailed();
    globalDefinitions.closeLoader();
  }
};

MainApplication.DashboardComponent.deleteCode = function () {
  globalDefinitions.callLoader();
  $("#deleteModal").modal("hide");

  var codeToDelete = Number(AppRequest.selectedCode);
  $spcontext.deleteItem(
    "TransferCodes",
    codeToDelete,
    function () {
      globalDefinitions.HandlerSuccess(`Code deleted successfully`);

      globalDefinitions.AuditLogManager_SaveLog({
        Action: `${CurrentUserProperties.title} deleted a transfer code`,
      });

      globalDefinitions.onActionCompleted();
      // $spcontext.redirect("#/", false);
      MainApplication.loadTransferCodes(whenDashboardDependeciesLoaded);
    },
    function () {
      console.log("Failed to delete item");
    },
  );

  globalDefinitions.closeLoader();
};
