var GlobalDefinitionsManager = GlobalDefinitionsManager || {};
/**
 * CONSTRUCTOR METHOD
 * global definitions constructor
 */
function GlobalDefinitionsManager() {
  this.stageDefinitions = {
    completed: "Completed",
    pending: "Pending",
    decline: "Declined",
    approve: "Approved",
    save: "Save For Later",
    correction: "MoreInfo",
    modified: "Returned For Approval",
    parrallelflow: "parallel",
    normalflow: "normal",
    sequencialflow: "sequencial",
    administrator: "Administrator",
    auditors : "Auditors",
    supervisor : "Supervisor",
    concurrent : "Concurrent Reviewer",
  };
  this.configureWindowEvent = false;
}

GlobalDefinitionsManager.prototype.checkIfCustomMasterPageUsed = function () {
  //check if master page is loaded
  if (
    typeof setNavigation === "undefined" &&
    typeof createAbsoluteUrl === "undefined"
  ) {
    CurrentUserProperties = {};
    $spcontext.loadSPDependencies(
      function () {
        $spcontext.currentUserDetails(function (val) {
          CurrentUserProperties.userObject = val;
          CurrentUserProperties.title = val.get_title().SPNameFromTitle();
          CurrentUserProperties.email = val.get_email();
          CurrentUserProperties.id = val.get_id();
          CurrentUserProperties.loginFull = val.get_loginName();
          CurrentUserProperties.login =
            CurrentUserProperties.loginFull.SPLoginFromFullLogin();
          $(function () {
            whenMasterLoaded();
          });
        });
      },
      {
        clientPeoplePicker: true,
        userProfile: true,
      }
    );
  }
};

GlobalDefinitionsManager.prototype.scrollTop = function(){
  $("#s4-workspace").animate({
    scrollTop: $("#response-message").offset().top,
});
}

GlobalDefinitionsManager.prototype.HandlerError = function (errormsg, inpage) {
  var optbool = typeof inpage === "undefined" ? false : inpage;
  var message = errormsg;

  if (optbool) {
    // Only read SP errors when they exist; otherwise fall back to errormsg
    if ($spcontext.errors && $spcontext.errors.length > 0 && $spcontext.errors[0] && $spcontext.errors[0].msg) {
      message = $spcontext.errors[0].msg;
    } else if (!message) {
      message = "An unexpected error occurred.";
    }
  }

  MainApplication.notyf.error(message || "An unexpected error occurred.");
};

GlobalDefinitionsManager.prototype.latencyHandler = function(){
  MainApplication.notyf.open({
    type: 'black',
    message: 'poor network detected, performance will be affected'
  });
}

GlobalDefinitionsManager.prototype.HandlerPopError = function (properties) {
  var errorMsg = "";
  if ($spcontext.errors.length > 0) {
    errorMsg = $spcontext.errors[0].msg;
  }
  properties.scrollToError = (typeof properties.scrollToError === "undefined") ? true : properties.scrollToError;
  properties.classMode = (typeof properties.classMode === "undefined") ? false : properties.classMode;
  properties.blockId = (typeof properties.blockId === "undefined") ? "response-message-pop" : properties.blockId;
  properties.block = (!properties.classMode) ? ("#" + properties.blockId) : ("." + properties.blockId);
  properties.errormsg = (typeof properties.errormsg === "undefined") ? errorMsg : properties.errormsg;
  $(properties.block).empty();
  $(properties.block).show();

  $(properties.block).text(properties.errormsg);
  if (properties.scrollToError) {
    $("#s4-workspace").animate({
      scrollTop: $(properties.block).offset().top,
    });
  }

  setTimeout(function () {
    $(properties.block).hide();
  }, 5000);
};

GlobalDefinitionsManager.prototype.HandlerSuccess = function (msg) {
  MainApplication.notyf.success(msg);
};

/**
 * GLOBAL METHOD
 * handles errors generate from sharepoint async methods or from user code and save them to the logs.
 */
GlobalDefinitionsManager.prototype.errorHandler = function (
  sender,
  args,
  spcustomerr
) {
  var errortype = "Sync Method Failed";
  var errorMsgs = "";
  var code403 = false;
  if (
    typeof sender !== "undefined" &&
    sender !== null &&
    typeof sender == "string"
  ) {
    errorMsgs += sender + ". ";
  }

  if (typeof args !== "undefined" && args !== null) {
    errorMsgs += args.get_message() + ".";
    errortype = "Sharepoint Async Service";

    if (errorMsgs.includes(`'403'`)) {
      code403 = true;
      MainApplication.notyf.error("So, sorry, it seems your session has expired, please refresh the page and try again.");
    }
  }

  if (typeof spcustomerr !== "undefined" && spcustomerr !== null) {
    try {
      errorMsgs +=
        " {funcall : " +
        spcustomerr.name +
        ", err_spdec: " +
        spcustomerr.err_description +
        " ,resource : " +
        spcustomerr.resource +
        "} ";
    } catch (e) { }
  }

  var errorID =
    globalDefinitions.stageDefinitions.workflowcode +
    $spcontext.stringnifyDate({
      format: "dd-mm-yy",
      includeTime: true,
      timeSpace: false,
    });

    if(!code403){
      globalDefinitions.HandlerError(
        "An Error Occured...Please Contact Admin with the Error ID:  " + errorID
      );
    }
  

  var logContent =
    "Workflow : " +
    globalDefinitions.stageDefinitions.workflow +
    " Workflow, Error ID: " +
    errorID +
    ", Error Type: SharePoint Async Service, Error Message: " +
    errorMsgs +
    ",Date: " +
    $spcontext.stringnifyDate({
      includeTime: true,
    }) +
    ", User : " +
    CurrentUserProperties.title +
    " \r\n";
  $spcontext.logWriter(
    "SPeedPointErrorLogs",
    logContent,
    "Logs",
    16000000,
    function () {
      try {
        console.log("Successful logging");
      } catch (e) { }
      globalDefinitions.closeLoader();
    },
    function (sender, args) {
      console.log(
        "Request failed. " + args.get_message() + "\n" + args.get_stackTrace()
      );
    }
  );
};

GlobalDefinitionsManager.prototype.codeErrorHandler = function (message) {
  var errorID =
    globalDefinitions.stageDefinitions.workflowcode +
    "Request-" +
    $spcontext.stringnifyDate({
      format: "dd-mm-yy",
      includeTime: true,
      timeSpace: false,
    });
  var logContent =
    "Workflow : " +
    globalDefinitions.stageDefinitions.workflow +
    " Workflow, Error ID: " +
    errorID +
    ", Error Type: SharePoint Sync Service, Error Message: " +
    message +
    ",Date: " +
    $spcontext.stringnifyDate({
      includeTime: true,
    }) +
    ", User : " +
    CurrentUserProperties.email +
    " \r\n";
  $spcontext.logWriter(
    "SPeedPointErrorLogs",
    logContent,
    "Logs",
    160000000,
    function () {
      try {
        console.log("Successful logging");
      } catch (e) { }
      globalDefinitions.closeLoader();
    },
    function (sender, args) {
      console.log(
        "Request failed. " + args.get_message() + "\n" + args.get_stackTrace()
      );
    }
  );
};

/**
 * GLOBAL METHOD
 * shows a modal pop of a particlar beneficiary details when view details is clicked
 * @param {Array} Arr the transaction history array
 */
GlobalDefinitionsManager.prototype.displayHistory = function (Arr, tableid) {
  tableid = typeof tableid !== "undefined" ? tableid : "logs";
  var str = "";
  for (d in Arr) {
    str +=
      `<tr><td><a onclick="MainApplication.viewEmployeeProfile('${Arr[d].email}')">${Arr[d].name}</a></td><td>${Arr[d].stage}</td><td>${Arr[d].action}</td>
        <td>${$spcontext.replaceSpecialkeysinString(Arr[d].comment)}</td><td>${Arr[d].actiontime}</td></tr>`;
  }
  $("#" + tableid).append(str);
};

GlobalDefinitionsManager.prototype.downloadData = function(excelname, data){
  //console.log(csvContent);
  if (navigator.msSaveOrOpenBlob){
      var blobContent = data;
      // Works for Internet Explorer and Microsoft Edge
      var blob = new Blob( [blobContent], {type: "text/csv"} );
      navigator.msSaveOrOpenBlob(blob, excelname);
  }
  else{
      var encodedString;
      var downloadLink
      try{
          encodedString = btoa(data);
          downloadLink =  `data:text/csv;base64,${encodedString}`;
      }
      catch(e){
          var csvContent = "data:text/csv;charset=utf-8,";
          csvContent += data;
          var blob = new Blob([data]);
          if(blob.size > 2000000){
              globalDefinitions.HandlerError("Please use the filter to reduce the data size, as the size of the data exceeds 2MB");
          }
          downloadLink = encodeURI(csvContent);
      }
      
      var link = document.createElement("a");
      link.setAttribute("href", downloadLink);
      link.setAttribute("download", excelname);
      link.click();
  }
}

GlobalDefinitionsManager.prototype.validateCSVContent = function(data){
  if(typeof data == "string"){
      //data = data.replace(/,/g, "~");
      data = data.replace(/\n/g, "");
      data = data.replace(/\r/g, "");
      data = data.replace(/\r\n/g, "");
      data = globalDefinitions.encloseStringWithCommaCheck(data);
  }
  return data;
}

GlobalDefinitionsManager.prototype.encloseStringWithCommaCheck = function(value) {
  if (value.includes(',')) {
    return '"' + value + '"';
  }
  return value;
}

/**
 * GLOBAL METHOD
 * Sort worklist response
 */
GlobalDefinitionsManager.prototype.sortResponse = function () {
  var url = window.location.href;
  var responseId = $spcontext.getParameterByName("res", url);
  if (responseId == "1") {
    $("#response-message").text("You have successfully created your request");
    $("#response-message").show();
  } else if (responseId == "2") {
    $("#response-message").text(
      "You have successfully taken action on this request"
    );
    $("#response-message").show();
  } else if (responseId == "3") {
    $("#response-message").text("Your request have been saved successfully");
    $("#response-message").show();
  } else {
    $("#response-message").hide();
  }
};

GlobalDefinitionsManager.prototype.createMetaDataFolder = function (spcontext,folderName,resourceDetails,formData,callback) {
  var foldersupdated = 0;
  var siteUrl = spcontext.initiate().get_url();
  var folderListUrl = siteUrl + "/Lists/" + resourceDetails.libraryName + "/" + folderName;
  spcontext.getFileFolderExists(folderListUrl,
    "folder",
    //onsucess
    function (exist) {
      confirmFoldersCreated(formData, folderListUrl);
    },
    //onfailed
    function (sender, args) {
      spcontext.createFolder(folderName,resourceDetails,
        function () {
          confirmFoldersCreated(formData, folderListUrl);
        }
      );
    }
  );

  //closure function only accessible in this function
  function confirmFoldersCreated(formdata, folderurl) {
    foldersupdated++;
    if (foldersupdated == 1 && typeof callback === "function") {
      callback(formdata, folderurl);
    }
  }
};

GlobalDefinitionsManager.prototype.pageError = function (text, elementId) {
  elementId = typeof elementId === "undefined" ? "form-content" : elementId;
  text =
    typeof text === "undefined"
      ? "you are unauthorized to access this resource.."
      : text;
  $("#" + elementId).empty();
  $("#" + elementId).append(
    "<div style='text-align: center; color: red;font-weight: bold; padding : 100px 10px;'>" + text + "</div>"
  );
  $("#" + elementId).show();
  globalDefinitions.closeLoader();
};

GlobalDefinitionsManager.prototype.AuditLogManager_SaveLog = function (userInformation){
  var data = {};
  data.Title = CurrentUserProperties.title;
  data.Email = CurrentUserProperties.email;
  data.IPAddress = MainApplication.cachedState.ipaddress;
  data.Action = (typeof userInformation.Action === "undefined") ? "" : userInformation.Action;
  data.Message = (typeof userInformation.Message === "undefined") ? "" : userInformation.Message;
  data.Created = $spcontext.stringnifyDate({ includeTime : true });

  var logContent = JSON.stringify(data) + "\r\n";
  $spcontext.logWriter(
    "AuditLog",
    logContent,
    "AuditLogs",
    5342880,
    function () {
      try {
        console.log("Audit Successfully logged");
      } catch (e) { }
      //globalDefinitions.closeLoader();
    },
    function (sender, args) {
      console.log(
        "Request failed. " + args.get_message() + "\n" + args.get_stackTrace()
      );
    }
  );
}

GlobalDefinitionsManager.prototype.uploadAttachment = function (
  context,
  Attachments,
  folderName,
  libraryProperties,
  callback
) {
  if (Attachments.length !== 0) {
    if (AppRequest.FolderUrl == "") {
      // globalDefinitions.changeLoaderText("Creating Folder for Attachment...");
      var folderName =
        folderName +
        "_" +
        context.stringnifyDate({
          includeTime: true,
          timeSpace: false,
          format: "dd-mm-yy",
        });

      var library = (typeof libraryProperties === "string") ? libraryProperties : libraryProperties.libraryName;
      //configProperties is obtained from the master page
      var siteContext = context.initiate().get_url();
      var folderUrl = siteContext + "/" + library + "/";
      AppRequest.AttachmentLoader = {};
      AppRequest.AttachmentLoader.count = 0;
      context.createFolder(folderName, libraryProperties, function () {
        folderUrl += folderName;
        AppRequest.AttachmentLoader.Attachmentfolder = folderUrl;
        var fileProperties = [];
        for (var i = 0; i < Attachments.length; i++) {
          fileProperties.push({ folder : folderUrl })
        }
        context.uploadMultipleLargeFile(
          Attachments,
          fileProperties,
          0,
          function (percentage, filedetails) {
            //var fileName = filedetails.get_name();
            var fileUrl = filedetails.get_serverRelativeUrl();
            var fileNameComponents =
              Attachments[AppRequest.AttachmentLoader.count];
            var fileAttributeProperty = fileNameComponents.property;
            //fileNameComponents = fileName.split("-")[0];
            AppRequest.AttachmentLoader.count++;
            if (typeof AppRequest.FileUrls[fileAttributeProperty] === "undefined" || fileAttributeProperty == "DocumentToRevision") {
              AppRequest.FileUrls[fileAttributeProperty] = [];
            }
            AppRequest.FileUrls[fileAttributeProperty].push(fileUrl);

            if (fileNameComponents.duplicateRef.length !== 0) {
              for (var i = 0; i < fileNameComponents.duplicateRef.length; i++) {
                if (typeof AppRequest.FileUrls[fileNameComponents.duplicateRef[i]] === "undefined") {
                  AppRequest.FileUrls[fileNameComponents.duplicateRef[i]] = [];
                }

                AppRequest.FileUrls[fileNameComponents.duplicateRef[i]].push(fileUrl);
              }
            }

            // globalDefinitions.changeLoaderText(
            //   "Saving Files: " + percentage + "%"
            // );
          },
          function () {
            AppRequest.AttachmentLoader.Attachmentlinks = JSON.stringify(AppRequest.FileUrls);
            callback();
          },
          globalDefinitions.errorHandler,
          siteContext
        );
      });
    } else {
      var siteContext = context.initiate().get_url();
      AppRequest.AttachmentLoader = {};
      AppRequest.AttachmentLoader.count = 0;
      var fileProperties = [];
        for (var i = 0; i < Attachments.length; i++) {
          fileProperties.push({ folder : AppRequest.FolderUrl })
        }
      context.uploadMultipleLargeFile(
        Attachments,
        fileProperties,
        0,
        function (percentage, filedetails) {
          var fileUrl = filedetails.get_serverRelativeUrl();
          var fileNameComponents =
            Attachments[AppRequest.AttachmentLoader.count];
          var fileAttributeProperty = fileNameComponents.property;
          //fileNameComponents = fileName.split("-")[0];
          AppRequest.AttachmentLoader.count++;

          if (
            typeof AppRequest.FileUrls[fileAttributeProperty] === "undefined"
          ) {
            AppRequest.FileUrls[fileAttributeProperty] = [];
          }

          AppRequest.FileUrls[fileAttributeProperty].push(fileUrl);

          if (fileNameComponents.duplicateRef.length !== 0) {
            for (var i = 0; i < fileNameComponents.duplicateRef.length; i++) {
              if (
                typeof AppRequest.FileUrls[
                fileNameComponents.duplicateRef[i]
                ] === "undefined"
              ) {
                AppRequest.FileUrls[fileNameComponents.duplicateRef[i]] = [];
              }

              AppRequest.FileUrls[fileNameComponents.duplicateRef[i]].push(
                fileUrl
              );
            }
          }

          // globalDefinitions.changeLoaderText(
          //   "Saving Files: " + percentage + "%"
          // );
        },
        function () {
          AppRequest.AttachmentLoader.Attachmentlinks = JSON.stringify(
            AppRequest.FileUrls
          );
          callback();
        },
        globalDefinitions.errorHandler,
        siteContext
      );
    }
  } else {
    callback();
  }
};

GlobalDefinitionsManager.prototype.sendSPMail = function (
  to,
  body,
  cc,
  subject,
  from,
  callback
) {
  var mailProperties = {
    to: to,
    body: body,
    cc: cc,
    subject: subject,
    from: from,
  };
  $spcontext.sendSPEmail(mailProperties, function (status, data) {
    callback();
  });
};

/* ---------------------------------------------------
    Animation Section
----------------------------------------------------- */
GlobalDefinitionsManager.prototype.callLoader = function (msg) {
  //$("#erploader").show();
  $("#erploader").modal("show");
};

GlobalDefinitionsManager.prototype.closeLoader = function () {
  //$("#erploader").hide();
  $("#erploader").modal("hide");
  // $("#loadertext").text("");
};

GlobalDefinitionsManager.prototype.changeLoaderText = function (msg) {
  $("#loadertext").text(msg);
};

GlobalDefinitionsManager.prototype.showCriticalErrorModal = function (msg) {
  $("#criticalerrortext").text(msg);
  $("#criticalModal").modal("show");
};

GlobalDefinitionsManager.prototype.closeCriticalErrorModal = function (msg) {
  $("#criticalModal").modal("show");
};

GlobalDefinitionsManager.prototype.showSuccessModal = function (msg) {
  var msg = (typeof msg === "undefined")? "Your action was successful" : msg;
  $("#successmodaltext").text(msg);
  $("#successModal").modal("show");
};

GlobalDefinitionsManager.prototype.startAttachmentProgress = function (msg) {
  $("#attachmentprogress").show();
  $("#attachmentprogress").text(msg);
};

GlobalDefinitionsManager.prototype.endAttachmentProgress = function () {
  $("#attachmentprogress").hide();
  $("#attachmentprogress").empty();
};

GlobalDefinitionsManager.prototype.onActionClicked = function (optionalmsg) {
  $("button").attr("disabled", true);
};

GlobalDefinitionsManager.prototype.onActionFailed = function (optionalmsg) {
  $("button").attr("disabled", false);
  $("#confirmModal").modal("hide");
};

GlobalDefinitionsManager.prototype.onActionCompleted = function (optionalmsg) {
  $("button").attr("disabled", false);
  $("#confirmModal").modal("hide");
};

GlobalDefinitionsManager.prototype.idleStateCheck = function () {
  globalDefinitions.IDLE_TIMEOUT = parseInt(configPropertiesRoot.IDLETIMEOUT.setting); //seconds
  localStorage.setItem["IDLESECONDCOUNTER"] = 0;

  document.onclick = function () {
    localStorage.setItem["IDLESECONDCOUNTER"] = 0;
  };

  document.onmousemove = function () {
    localStorage.setItem["IDLESECONDCOUNTER"] = 0;
  };

  document.onkeypress = function () {
    localStorage.setItem["IDLESECONDCOUNTER"] = 0;
  };

  window.setInterval(CheckIdleTime, 1000);

  function CheckIdleTime() {
    localStorage.setItem["IDLESECONDCOUNTER"]++;
    if (localStorage.setItem["IDLESECONDCOUNTER"] >= globalDefinitions.IDLE_TIMEOUT) {
        $spcontext.redirect(configPropertiesRoot.SIGNOUTURL.setting,true)
    }
  }
}