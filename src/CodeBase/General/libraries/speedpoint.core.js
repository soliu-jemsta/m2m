var Speed = Speed || {};

/**
 * This is the SpeedPoint Function declaration.
 * This initiates a speedpoint object and ensures the context of the object is set based on the parameters passed for the speed object.
 * This is used internally by the speedpoint object to intiate sharepoint async request based on the context
 * @param {String} [cxt="Current Context URL"] the ctx param can contain the url of the site you want to target, if this parameter is ommited
 * then the current page site url is used by default.
 * @param {bool} [bolval=false] setting this to true while passing a url in the first parameter indicates that an APPcontext is created, if no 
 * boolean value is passed the default value is false, which means a normal site context is created
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * @example
 * // returns a normal context related to the site passed in the ctx parameter
 * // absoulte urls can be used also
 * var speedCtx = new Speed("http://captsource.com");
 * @example
 * // returns an app context related to the site passed in the ctx parameter (the host URL).This is used to create a context used for cross domain 
 * // request from an App to the SharePoint on Premise site. Here the host url is passed (the URl where your List for cross domain request resides)
 * var speedAppCtx = new Speed("http://captsource.com",true);
 */
function Speed(cxt, bolval) {
    this.errors = [];
    this.stylePlace = false;
    this.dynamicVariable = 'speed';
    this.latency = 100;
    this.url = cxt;
    this.optional = (typeof bolval === 'undefined') ? false : bolval;
    this.errorHandler = this.onQueryFailed;
    this.latencyHandler = null;
    this.tempCallbacks = {};
    this.htmlDictionary = {};
    this.peopleDictionary = {
        count: 0,
        total: 0,
        picker: {}
    };
    this.filesDictionary = {};
    this.currencySettings = {};
    this.thresholdListSettings = {};
    this.appliedEvents = {
        normal: [],
        numeric: {
            identifiers: [],
            callbacks: {}
        },
        attachments: [],
    };
    this.folderGroups = {};
    this.asyncDictionary = {
        totalcalls: 0,
        expectedcalls: 0,
        callbackwhendependenciesLoaded: false,
        alldependenciesLoadedDef: null
    };

    if (typeof window.speedGlobal === 'undefined') {
        window.speedGlobal = [];
    }

    if (typeof window.speedServerOffset === 'undefined') {
        window.speedServerOffset = null;
    }

    if (typeof window.speedRequestDigest === 'undefined') {
        window.speedRequestDigest = null;
    }

    this.libraryDictionary = {};
    this.usersInEnvironmentById = {};
    this.usersInEnvironmentByIdArary = [];
    this.dynamicTableSettings = {};
    /**
     * Properties for the table to be created
     */
    this.DataForTable = {
        tabledata: [],
        tablegroupName: "",
        noOfPages: 0,
        currentPage: 1,
        pagesize: 30,
        paginateSize: 5,
        currentPos: 1,
        lastPageItem: 0,
        lastSPItemID: 0,
        activeClass: 1,
        tablecontentId: "",
        includeSN: true,
        modifyTR: false,
        context: null,
        lazyLoadInitiated: false,
        tdClick: {},
        serverDeliverySettings: {},
        customPaginate: false,
        spDeliveryCaml: [],
        customBlock: "",
        paginationbId: "noOfPages",
        paginationuId: "noOfPagesUp",
        onpageBeforeclick: null,
        onpageAfterclick: null,
        sortToggle: null,
        sortingEnabled: true,
        controls: [],
        //this is responsible for paginating the table
        paginateLinks: function (srt, end, settings) {
            $("#" + settings.paginationbId).empty();
            $("#" + settings.paginationuId).empty();
            if (end > settings.noOfPages) {
                end = settings.noOfPages;
            }
            $("#" + settings.paginationbId).append("<li> <a class='" + settings.tablecontentId + "-moveback'><<</a> </li>");
            $("#" + settings.paginationuId).append("<li> <a class='" + settings.tablecontentId + "-moveback'><<</a> </li>");
            for (srt; srt <= end; srt++) {

                if (srt == settings.activeClass) {
                    $("#" + settings.paginationbId).append("<li class=\"lin" + srt + " active\"> <a class='" + settings.tablecontentId + "'>" + srt + "</a> </li>");
                    $("#" + settings.paginationuId).append("<li class=\"lin" + srt + " active\"> <a class='" + settings.tablecontentId + "'>" + srt + "</a> </li>");
                } else {
                    $("#" + settings.paginationbId).append("<li class=\"lin" + srt + "\"> <a class='" + settings.tablecontentId + "'>" + srt + "</a> </li>");
                    $("#" + settings.paginationuId).append("<li class=\"lin" + srt + "\"> <a class='" + settings.tablecontentId + "'>" + srt + "</a> </li>");
                }
            }
            $("#" + settings.paginationbId).append("<li> <a class='" + settings.tablecontentId + "-movefront'>>></a> </li>");
            $("#" + settings.paginationuId).append("<li> <a class='" + settings.tablecontentId + "-movefront'>>></a> </li>");
            $("." + settings.tablecontentId).click(function () {
                settings.nextItems($(this).text(), settings);
            });

            $("." + settings.tablecontentId + "-moveback").click(function () {
                settings.moveLinks("back", settings);
            });

            $("." + settings.tablecontentId + "-movefront").click(function () {
                settings.moveLinks("front", settings);
            });
        },
        //this is responsible for showing the next items the table
        nextItems: function (id, settings) {
            if (settings.tabledata.length != 0) {
                //perform actions before the items get arrange clicks
                try {
                    settings.onpageBeforeclick();
                } catch (e) { }

                $(".lin" + settings.activeClass).removeClass('active');
                $(".lin" + id).addClass('active');
                settings.activeClass = id;
                $('#' + settings.tablecontentId).empty();
                var old = id - 1;
                var total = settings.tabledata.length;
                var previousItem = old * settings.pagesize;
                var nextPageItem = id * settings.pagesize;
                if (nextPageItem > total) {
                    nextPageItem = total;
                }
                var str = "";
                var tableControls = (settings.controls.length !== 0) ? settings.controls : settings.context.getControls(true, settings.tablegroupName);
                for (previousItem; previousItem < nextPageItem; previousItem++) {
                    if (!settings.customPaginate) {
                        if (settings.modifyTR) {
                            str += settings.context.DataForTable.trExpression(previousItem);
                        } else {
                            str += "<tr>";
                        }
                        if (settings.includeSN) {
                            str += "<td>" + (previousItem + 1) + "</td>";
                        }
                        for (var y = 0; y < tableControls.length; y++) {
                            var propName = tableControls[y];
                            var groupName = $("[speed-table-data='" + propName + "']").attr("speed-table-group");
                            groupName = (typeof groupName !== "undefined") ? groupName : "SP-NOTApplicable";
                            var useTD = $("[speed-table-data='" + propName + "']").attr("speed-table-includetd");
                            useTD = (typeof useTD !== "undefined") ? (useTD === "true") : true;
                            if (settings.propertiesHandler.hasOwnProperty(groupName)) {
                                if (useTD) {
                                    str += "<td>" + settings.propertiesHandler[groupName](settings.tabledata[previousItem], previousItem, propName, this) + "</td>";
                                } else
                                    str += settings.propertiesHandler[propName](settings.tabledata[previousItem], previousItem, propName, this);
                            }
                            else if (settings.propertiesHandler.hasOwnProperty(propName)) {
                                if (useTD) {
                                    str += "<td>" + settings.propertiesHandler[propName](settings.tabledata[previousItem], previousItem, propName, this) + "</td>";
                                } else
                                    str += settings.propertiesHandler[propName](settings.tabledata[previousItem], previousItem, propName, this);
                            } else
                                str += "<td>" + settings.tabledata[previousItem][propName] + "</td>";
                        }
                        str += "</tr>";
                    } else {
                        var innerElement = "";
                        if (typeof settings.customBlock === "string") {
                            innerElement = settings.customBlock;
                        }
                        else {
                            if (typeof settings.tabledata[previousItem]["BLOCK"] !== "undefined") {
                                innerElement = settings.customBlock[settings.tabledata[previousItem]["BLOCK"]];
                            }
                        }

                        for (var propName in settings.tabledata[previousItem]) {
                            try {
                                var stringToFind = "{{" + propName + "}}";
                                var regex = new RegExp(stringToFind, "g");
                                if (settings.propertiesHandler.hasOwnProperty(propName)) {
                                    var value = settings.propertiesHandler[propName](settings.tabledata[previousItem], previousItem)
                                    innerElement = innerElement.replace(regex, value);
                                }
                                else {
                                    innerElement = innerElement.replace(regex, settings.tabledata[previousItem][propName]);
                                }

                            } catch (e) { }
                        }
                        str += innerElement;
                    }
                }
                $('#' + settings.tablecontentId).append(str);

                //perform actions after the items get arrange clicks
                try {
                    settings.onpageAfterclick();
                } catch (e) { }
            }
        },
        //this is responsible for moving to the new set of links
        moveLinks: function (id, settings) {
            if (id == "front") {
                settings.currentPos = settings.currentPos + settings.paginateSize;
                settings.noOfPages = Math.ceil(settings.tabledata.length / settings.pagesize);
                var startPos = settings.currentPos;
                var endPos = startPos + settings.paginateSize - 1;
                if (endPos >= settings.noOfPages) {
                    endPos = settings.noOfPages;
                }
                settings.paginateLinks(startPos, endPos, settings);
                $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-moveback").show();
                $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-moveback").show();
                if (endPos >= settings.noOfPages) {
                    $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-movefront").hide();
                    $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-movefront").hide();
                }

                if (settings.lazyLoadInitiated && endPos >= settings.noOfPages) {
                    $("#" + settings.paginationbId).append("<li class='spgetitems'> <a class='" + settings.tablecontentId + "-getpages'>>></a> </li>");
                    $("#" + settings.paginationuId).append("<li class='spgetitems'> <a class='" + settings.tablecontentId + "-getpages'>>></a> </li>");

                    $("." + settings.tablecontentId + "-getpages").click(function () {
                        settings.context.serverDeliverItems(settings.serverDeliverySettings);
                    });
                }
            } else if (id == "same") {
                var startPos = settings.currentPos;
                var endPos = startPos + settings.paginateSize - 1;
                settings.noOfPages = Math.ceil(settings.tabledata.length / settings.pagesize);
                if (endPos >= settings.noOfPages) {
                    endPos = settings.noOfPages;
                }
                settings.paginateLinks(startPos, endPos, settings);
                $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-moveback").show();
                $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-moveback").show();
                if (endPos >= settings.noOfPages) {
                    $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-movefront").hide();
                    $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-movefront").hide();
                }

                if (settings.lazyLoadInitiated && endPos >= settings.noOfPages) {
                    $("#" + settings.paginationbId).append("<li class='spgetitems'> <a class='" + settings.tablecontentId + "-getpages'>>></a> </li>");
                    $("#" + settings.paginationuId).append("<li class='spgetitems'> <a class='" + settings.tablecontentId + "-getpages'>>></a> </li>");

                    $("." + settings.tablecontentId + "-getpages").click(function () {
                        settings.context.serverDeliverItems(settings.serverDeliverySettings);
                    });
                }
            } else {
                settings.currentPos = settings.currentPos - settings.paginateSize;
                var startPos = settings.currentPos;
                var endPos = startPos + settings.paginateSize - 1;
                settings.noOfPages = Math.ceil(settings.tabledata.length / settings.pagesize);
                if (startPos <= 1) {
                    startPos = 1;
                    currentPos = 1;
                }
                settings.paginateLinks(startPos, endPos, settings);
                $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-movefront").show();
                $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-movefront").show();
                if (startPos <= 1) {
                    $("#" + settings.paginationbId + " li a." + settings.tablecontentId + "-moveback").hide();
                    $("#" + settings.paginationuId + " li a." + settings.tablecontentId + "-moveback").hide();
                }

            }
        },
        propertiesHandler: {}
    }

    /* ============================== Validation Section ============================*/
    //Extendable validation logic properties. This is where custom validation logic can be introduced to speedpoint

    this.validationProperties = {
        "number": {
            type: "number",
            extend: {},
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (value.trim() == "") {
                    return false;
                } else if (isNaN(value)) {
                    return false;
                } else
                    return true;
            }
        },
        "tel": {
            type: "tel",
            extend: {},
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (value.trim() == "") {
                    return false;
                } else if (isNaN(value)) {
                    return false;
                } else
                    return true;
            }
        },
        "radio": {
            type: "radio",
            extend: {

            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (typeof value === "undefined" || value === "") {
                    return false;
                } else
                    return true;
            }
        },
        "date": {
            type: "date",
            extend: {

            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (typeof value === "undefined" || value === "") {
                    return false;
                } else
                    return true;
            }
        },
        "datetime-local": {
            type: "datetime-local",
            extend: {

            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (typeof value === "undefined" || value === "") {
                    return false;
                } else
                    return true;
            }
        },
        "checkbox": {
            type: "checkbox",
            extend: {
                multivalue: function (value, id) {
                    var elementProperties = document.getElementById(id);
                    var attributeValue = elementProperties.getAttribute("speed-bind-validate");

                    var elements = document.querySelectorAll("[speed-bind-validate='" + attributeValue + "']");

                    var selectedValues = [];

                    for (var i = 0; i < elements.length; i++) {

                        if (elements[i].type === "checkbox" && elements[i].checked) {

                            // Use value attribute (recommended)
                            selectedValues.push(elements[i].value);

                            // If you prefer label text instead:
                            // selectedValues.push($("label[for='" + elements[i].id + "']").text());
                        }
                    }

                    return selectedValues;
                }
            },

            validate: function (value, extension, id) {

                if (extension !== "") {

                    try {
                        var result = this.extend[extension](value, id);

                        // Special handling for multivalue
                        if (extension === "multivalue") {
                            return Array.isArray(result) && result.length > 0;
                        }

                        return result;

                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }

                } else {
                    return value;
                }
            }
        },
        "file": {
            type: "file",
            extend: {
                File: function (value) {
                    //var rg1 = /^[^\\/:\*\?"<>\|\,]+$/; // forbidden characters \ / : * ? " < > |
                    var rg1 = /[!@#$%^&*'()+{}\[\]:;<>,?~\\/]/
                    var rg2 = /^\./; // cannot start with dot (.)
                    var rg3 = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
                    var rg4 = /^(?!.*\.\.).*$/; //can not have two consequitve dots
                    return (!rg1.test(value) && !rg2.test(value) && !rg3.test(value) && rg4.test(value));
                }
            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1114", this.type, id, extension);
                    }
                } else {
                    return this.extend["File"](value);
                }
            }
        },
        "email": {
            type: "email",
            extend: {
                Email: function (value) {
                    var patt = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                    if (!patt.test(value)) {
                        return false;
                    } else
                        return true;
                }
            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else {
                    return this.extend["Email"](value);
                }
            }
        },
        "text": {
            type: "text",
            extend: {
                IP: function (value) {
                    var patt = new RegExp(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
                    if (!patt.test(value)) {
                        return false;
                    } else
                        return true;
                },
                Email: function (value) {
                    var patt = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                    if (!patt.test(value)) {
                        return false;
                    } else
                        return true;
                },
                URL: function (value) {
                    var patt = new RegExp(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i);
                    if (!patt.test(value)) {
                        return false;
                    } else
                        return true;
                },
                File: function (value) {
                    //var rg1 = /^[^\\/:\*\?"<>\|\,]+$/; // forbidden characters \ / : * ? " < > |
                    var rg1 = /[!@#$%^&*'()+{}\[\]:;<>,?~\\/]/
                    var rg2 = /^\./; // cannot start with dot (.)
                    var rg3 = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
                    var rg4 = /^(?!.*\.\.).*$/; //can not have two consequitve dots
                    return (!rg1.test(value) && !rg2.test(value) && !rg3.test(value) && rg4.test(value));
                },
                Folder: function (value) {
                    var rg1 = /[!@#$%^&*'()+{}\[\]:;<>,.?~\\/]/
                    var rg3 = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
                    return (!rg1.test(value) && !rg3.test(value));
                }
            },
            validate: function (value, extension, id) {
                if (extension !== "") {
                    try {
                        return this.extend[extension](value, id);
                    } catch (e) {
                        $spcontext.debugHandler("1111", this.type, id, extension);
                    }
                } else if (value.trim() === "") {
                    return false;
                } else
                    return true;
            }
        }
    }
}

/* ============================== Set Up Section ============================*/
//App context has been introduced in sharepoint async calls to support Cross Domain CRUD requests
Speed.prototype.initiate = function () {
    //ensures the context loaded properly if a default page on the rootsite is used
    var context = null;
    if (typeof this.url === "undefined") {
        context = new SP.ClientContext.get_current();
    } else {
        if (typeof this.url !== "undefined" && this.optional) {
            var subcontext = new SP.ClientContext.get_current();
            //context is now appcontext
            context = new SP.AppContextSite(subcontext, this.url);
        } else {
            context = new SP.ClientContext(this.url);
        }
    }

    if (typeof this.url === "undefined") {
        var currentContextUrl = context.get_url();
        if (currentContextUrl.toLowerCase().includes("https")) {
            var currentSite = window.location.href;
            if (currentSite.toLowerCase().includes("sites") || currentSite.toLowerCase().includes("teams")) {
                var baseurlArr = currentSite.split("/");
                if (baseurlArr.length > 4) {
                    var siteContextUrl = `/${baseurlArr[3]}/${baseurlArr[4]}`;
                    for (var i = 5; i < baseurlArr.length; i++) {
                        if (baseurlArr[i].toLowerCase() !== "sitepages" && baseurlArr[i].toLowerCase() !== "pages") {
                            siteContextUrl += `/${baseurlArr[i]}`;
                        }
                        else {
                            break;
                        }
                    }
                    context = new SP.ClientContext(siteContextUrl);
                }
                else {
                    context = new SP.ClientContext("/");
                }
            }
            else {
                context = new SP.ClientContext("/");
            }
        }
    }

    return context;
};

/**
 * The loadDependency function dynamically adds the dependency scripts required to make sharepoint JSOM calls. This is similar to jquerys document .ready 
 * but in this case sharepoint dependencies are loaded
 * @param {callBack} callBack  the callback function when all the file have successfully been added to the DOM
 * @param {object} properties an object that specifies the type of additional scripts to be included to the DOM
 * @param {string} [scriptbase = "root site url"] the url of the site the script will be called from. by default the root site url is used
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //this code loads only SP.js and its dependencies ..so no need to reference this at the page level
 * //note that the properties parameter is null in this case
 * speedCtx.loadSPDependencies(function(){
 *     console.log("finished Loading files");
 * },null);
 * 
 *  @example
 * #returns a normal context related to the current site#
 * var speedCtx = new Speed();
 * #this code loads only SP.js,SP.RequestExecutor.js,SP.UserProfiles.js,clientpeoplepicker.js and its dependencies .. so no need to reference this at the page level
 * note that the properties parameter is contains an object with the keys of the scripts we want set to true in this case#
 * speedCtx.loadSPDependencies(function(){
 *     console.log("finished Loading files");
 * },{requestExecutor: true, clientPeoplePicker: true, userProfile: true});
 */

Speed.prototype.loadSPDependencies = function (callBack, properties, scriptbase) {
    var speedContext = this;
    properties = (typeof properties !== "undefined") ? properties : {};
    scriptbase = (typeof scriptbase == "undefined" || scriptbase == null) ? "/_layouts/15/" : (scriptbase + "/_layouts/15/");
    if (typeof properties !== "undefined" &&
        (!this.checkScriptDuplicates("SP.RequestExecutor.js") || !this.checkScriptDuplicates("clientpeoplepicker.js"))) {
        //Load scripts without SP.js dependency
        if (!this.checkScriptDuplicates("SP.RequestExecutor.js") && typeof properties.requestExecutor !== "undefined" &&
            properties.requestExecutor) {
            $.getScript(scriptbase + "SP.RequestExecutor.js");
        }

        if (typeof properties.clientPeoplePicker !== "undefined" && properties.clientPeoplePicker) {
            //load all client peoplepicker js dependencies 
            $.getScript(scriptbase + "clienttemplates.js",
                $.getScript(scriptbase + "clientforms.js",
                    $.getScript(scriptbase + "autofill.js",
                        $.getScript(scriptbase + "clientpeoplepicker.js", function () {
                            setTimeout(function () {
                                workflowScripts(speedContext);
                            }, 1000);
                        })
                    )
                )
            );
        } else {
            setTimeout(function () {
                workflowScripts(speedContext);
            }, 1000);
        }
    } else {
        workflowScripts(speedContext);
    }

    function workflowScripts(speedContext) {
        if (typeof SP !== "undefined") {
            //executeOrDelayUntilScriptLoaded ensures script runs when dependencies are loaded
            SP.SOD.executeOrDelayUntilScriptLoaded(function () {
                //Load scripts with SP.js dependency
                var methodSet = '';
                if (properties.userProfile !== "undefined") {
                    if (properties.userProfile) {
                        RegisterSodDep('callBack', "SP.UserProfiles.js");
                        $.getScript(scriptbase + "SP.UserProfiles.js");
                        methodSet = 'SP.UserProfiles.js';
                    }
                }

                if (properties.search !== "undefined") {
                    if (properties.search) {
                        RegisterSodDep('callBack', "SP.Search.js");
                        $.getScript(scriptbase + "SP.Search.js");
                        methodSet = 'SP.Search.js';
                    }
                }

                if (methodSet !== "") {
                    SP.SOD.executeOrDelayUntilScriptLoaded(function () {
                        speedContext.checkConnectionLatency(callBack);
                    }, methodSet);
                } else if (typeof properties.userProfile === "undefined" && typeof properties.search === "undefined") {
                    speedContext.checkConnectionLatency(callBack);
                }
            }, "sp.js");
            //executeFunc ensures sp.js is loaded
            SP.SOD.executeFunc("sp.js", 'SP.ClientContext', null);

            //the two loading functions are set in this order to ensure sp.js is loaded first (executeFunc)
            //then when loaded the function set is loaded in the executeOrDelayUntilScriptLoaded runs
        }
        else {
            //workbenchmode
            $.getScript((scriptbase + "init.js"), function () {
                $.getScript((scriptbase + "MicrosoftAjax.js"), function () {
                    $.getScript((scriptbase + "SP.Runtime.js"), function () {
                        $.getScript((scriptbase + "SP.js"), function () {
                            var totalCallBack = 0;
                            var expectedcallBack = 2;
                            if (properties.userProfile !== "undefined") {
                                if (properties.userProfile) {
                                    $.getScript((scriptbase + "SP.UserProfiles.js"), function () {
                                        checkCallBack();
                                    });
                                }
                                else {
                                    checkCallBack();
                                }
                            }
                            else {
                                checkCallBack();
                            }
                            if (properties.search !== "undefined") {
                                if (properties.search) {
                                    $.getScript(scriptbase + "SP.Search.js", function () {
                                        checkCallBack();
                                    });
                                }
                                else {
                                    checkCallBack();
                                }
                            }
                            else {
                                checkCallBack();
                            }

                            function checkCallBack() {
                                totalCallBack++;
                                if (totalCallBack == expectedcallBack) {
                                    getServerDate().then((serverOffSet) => {
                                        window.speedServerOffset = serverOffSet;
                                        speedContext.checkConnectionLatency(callBack);
                                    }).catch((error) => {
                                        console.error("Error:", error);
                                    });

                                    getRequestDigest().then((requestDigest) => {
                                        window.speedRequestDigest = requestDigest;
                                    }).catch((error) => {
                                        console.error("Error:", error);
                                    });
                                }
                            }


                        }).fail(function () {
                            console.log("Fail to load sp.js library")
                        })
                    })
                });
            });

            async function getServerDate() {
                let dynRoot = window.location.href.split("/");
                let dynamicUrl = dynRoot[0] + "//" + dynRoot[2];
                dynamicUrl = dynamicUrl + speedContext.initiate().get_url();
                try {
                    const response = await fetch(`${dynamicUrl}/_api/web/RegionalSettings/TimeZone`, {
                        headers: {
                            "Accept": "application/json;odata=verbose"
                        }
                    });

                    const data = await response.json();
                    const offsetMinutes = data.d.Information.Bias;

                    const localDate = new Date();
                    const serverDate = new Date(localDate.getTime() + offsetMinutes);

                    console.log("Server Date:", serverDate.toISOString());
                    return offsetMinutes;
                } catch (error) {
                    console.error("Error fetching server date:", error);
                }
            }

            async function getRequestDigest() {
                let dynRoot = window.location.href.split("/");
                let dynamicUrl = dynRoot[0] + "//" + dynRoot[2];
                dynamicUrl = dynamicUrl + speedContext.initiate().get_url();
                const response = await fetch(`${dynamicUrl}/_api/contextinfo`, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json;odata=verbose"
                    }
                });

                const data = await response.json();
                const REQUESTDISGEST = data.d.GetContextWebInformation.FormDigestValue;
                return REQUESTDISGEST;
            }
        }
    }
}

Speed.prototype.asyncManager = function () {
    this.asyncDictionary.totalcalls++;

    if (this.asyncDictionary.callbackwhendependenciesLoaded && typeof this.asyncDictionary.alldependenciesLoadedDef === "function") {
        if (this.asyncDictionary.totalcalls == this.asyncDictionary.expectedcalls) {
            this.asyncDictionary.alldependenciesLoadedDef();
        }
    }
}

/* ============================== Caml Builder Section ============================*/
/**
 * The Caml Builder creates a caml query string which is used to retrieve items  with list/library getItem
 * Passing an array with only settings object set as the parameter returns all items in a list 
 * specified with respect to the settings passed (The Settings object is the first parameter).
 * @param {array} [cal=[]] the array of objects to be used 
 * @returns {String} a caml query string used in conjunction with the getItem method 
 */
Speed.prototype.camlBuilder = function (cal) {
    var count = 0;
    var noOfFields = [];
    var noOfUsed = 0;
    var andCount = 0;
    var Arr = [];
    if (typeof cal !== 'undefined' && cal.length > 1) {
        var usedtottal = cal.length - 1;
        for (var i = 1; i <= usedtottal; i++) {
            if (cal[i].operator == "IsNotNull" || cal[i].operator == "IsNull") {
                noOfFields.push(cal[i].operator);
            } else {
                noOfFields.push(cal[i].val);
            }

            if (cal[i].operator == "IsNotNull" || cal[i].operator == "IsNull") {
                noOfUsed++;
                Arr.push(cal[i]);
            } else if (cal[i].val != '') {
                noOfUsed++;
                Arr.push(cal[i]);
            }
        }
        var total = Arr.length - 1;
        if (typeof cal[0].evaluator == 'undefined') cal[0].evaluator = 'And';
        var queryString = (typeof cal[0].viewScope == 'undefined') ? '<View><Query>' : '<View Scope=\'' + cal[0].viewScope + '\'><Query>';

        if (typeof cal[0].groupBy !== 'undefined') {
            queryString += `<GroupBy><FieldRef Name="${cal[0].groupBy}" /></GroupBy>`
        }

        if (this.CheckNoofUsedFields(noOfFields, 'one')) {
            queryString += '<Where>';
            for (var i = 0; i <= total; i++) {
                if (!this.CheckNoofUsedFields(noOfFields, 'onlyone') && (count == 0 || total - i >= 1)) {
                    if (typeof Arr[i].evaluator != 'undefined') {
                        queryString += '<' + Arr[i].evaluator + '>';
                    } else
                        queryString += '<' + cal[0].evaluator + '>';
                    andCount++;
                }
                if (typeof Arr[i].support != 'undefined')
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\'/><Value Type=\'" + Arr[i].type + "\' " + Arr[i].support.title + "=\'" + Arr[i].support.value + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                else if (typeof Arr[i].lookup != 'undefined')
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\' " + Arr[i].lookup.title + "=\'" + Arr[i].lookup.value + "\' /><Value Type=\'" + Arr[i].type + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                else if (Arr[i].operator === "IsNull" || Arr[i].operator === "IsNotNull") {
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\'/></" + Arr[i].operator + ">";
                } else
                    queryString += "<" + Arr[i].operator + "><FieldRef Name=\'" + Arr[i].field + "\'/><Value Type=\'" + Arr[i].type + "\'>" + Arr[i].val + "</Value></" + Arr[i].operator + ">";
                count++;
            }
            for (var x = (andCount - 1); x >= 0; x--) {
                if (typeof Arr[x].evaluator != 'undefined')
                    queryString += '</' + Arr[x].evaluator + '>';
                else
                    queryString += '</' + cal[0].evaluator + '>';
            }
            queryString += '</Where>';
        }
        if (typeof cal[0].ascending != 'undefined' && typeof cal[0].orderby != 'undefined')
            queryString += '<OrderBy><FieldRef Name=\'' + cal[0].orderby + '\' Ascending="' + cal[0].ascending + '" /></OrderBy>';
        queryString += '</Query>';

        if (typeof cal[0].rowlimit != 'undefined')
            queryString += '<RowLimit>' + cal[0].rowlimit + '</RowLimit>';
        queryString += '</View>';
    } else {
        var queryString = '<View><Query>';
        if (typeof cal != 'undefined') {
            queryString = (typeof cal[0].viewScope == 'undefined') ? '<View><Query>' : '<View Scope=\'' + cal[0].viewScope + '\'><Query>';
            if (typeof cal[0].groupBy !== 'undefined') {
                queryString += `<GroupBy><FieldRef Name="${cal[0].groupBy}" /></GroupBy>`
            }
            if (typeof cal[0].ascending != 'undefined' && typeof cal[0].orderby != 'undefined')
                queryString += '<OrderBy><FieldRef Name=\'' + cal[0].orderby + '\' Ascending="' + cal[0].ascending + '" /></OrderBy>';
        }
        queryString += '</Query>';
        if (typeof cal != 'undefined') {
            if (typeof cal[0].rowlimit != 'undefined')
                queryString += '<RowLimit>' + cal[0].rowlimit + '</RowLimit>';
        }
        queryString += '</View>';
    }
    return queryString;
};

//-----------------required function for caml builder -------------------
Speed.prototype.CheckNoofUsedFields = function (Arr, val) {
    if (val == 'one') {
        var oneE = false;
        for (var x = 0; x < Arr.length; x++) {
            if (this.checkNull(Arr[x]) != '')
                oneE = true;
        }
        return oneE;
    }
    if (val == 'onlyone') {
        var count = 0;
        var oneE = false;
        for (var y = 0; y <= Arr.length - 1; y++) {
            if (this.checkNull(Arr[y]) != '')
                count++;
        }
        if (count == 1) {
            oneE = true;
        }
        return oneE;
    }
};

Speed.prototype.formQueryArrayGenerator = function (listObjects, bindClass) {
    speedPointContext = this;
    var useBindClass = (typeof bindClass === 'string') ? true : false;
    var returnObject = [];
    if (typeof listObjects !== "undefined" && listObjects != null) {
        returnObject = listObjects;
    }
    //decides if u want to bind static fields to objects
    //set this option to false if the static fields already contains the same values with the object

    var element = document.querySelectorAll("[speed-bind-query]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var propertyAttributes = {};
        propertyAttributes.field = (element[i].getAttribute("speed-query-columnname") === null) ? element[i].getAttribute("speed-bind-query") : element[i].getAttribute("speed-query-columnname");
        if (element[i].getAttribute("speed-evaluator") !== null) {
            propertyAttributes.evaluator = element[i].getAttribute("speed-evaluator");
        }

        propertyAttributes.operator = (element[i].getAttribute("speed-operator") === null) ? "Eq" : element[i].getAttribute("speed-operator");
        propertyAttributes.type = (element[i].getAttribute("speed-type") === null) ? "Text" : element[i].getAttribute("speed-type");
        propertyAttributes.val = "";

        var omitControl = (element[i].getAttribute("speed-as-static") === null) ? false : (element[i].getAttribute("speed-as-static").toLowerCase() === "true");
        if (useBindClass) {
            var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
            }
        }
        if (!omitControl && element[i].getAttribute("speed-operator") !== null) {
            if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "textarea") {
                if (element[i].type == "checkbox") {
                    propertyAttributes.val = element[i].checked;
                } else if (element[i].type == "radio") {
                    var name = (element[i].getAttribute("name") === null) ? "" : element[i].getAttribute("name");
                    propertyAttributes.val = $("input[name='" + name + "']:checked").val();
                } else {
                    var usetext = (element[i].getAttribute("speed-select-text-value") === null) ? false : (element[i].getAttribute("speed-select-text-value").toLowerCase() === "true");
                    if (usetext) {
                        var id = element[i].id;
                        propertyAttributes.val = $("#" + id + " option:selected").text();
                    } else {
                        propertyAttributes.val = element[i].value;
                    }
                }
            } else {
                propertyAttributes.val = element[i].innerText;
            }
            returnObject.push(propertyAttributes);
        }
    }

    var element = document.querySelectorAll("[speed-bind-people-query]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var propertyAttributes = {}
        propertyAttributes.field = (element[i].getAttribute("speed-query-columnname") === null) ? element[i].getAttribute("speed-bind-people-query") : element[i].getAttribute("speed-query-columnname");
        if (element[i].getAttribute("speed-evaluator") !== null) {
            propertyAttributes.evaluator = element[i].getAttribute("speed-evaluator");
        }

        propertyAttributes.operator = (element[i].getAttribute("speed-operator") === null) ? "Eq" : element[i].getAttribute("speed-operator");
        propertyAttributes.type = (element[i].getAttribute("speed-type") === null) ? "User" : element[i].getAttribute("speed-type");
        propertyAttributes.val = "";
        propertyAttributes.lookup = {
            title: "LookupId",
            value: "TRUE"
        };
        var omitControl = (element[i].getAttribute("speed-as-static") === null) ? false : (element[i].getAttribute("speed-as-static").toLowerCase() === "true");
        if (useBindClass) {
            var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
            }
        }
        if (!omitControl && element[i].getAttribute("speed-operator") !== null) {
            var value = $spcontext.checkNull(element[i].getAttribute("speed-userid"));
            propertyAttributes.val = value;
            returnObject.push(propertyAttributes);

        }
    }
    return returnObject;
}

Speed.prototype.validationReturn = function (id, msg, addErrors, callback) {
    var optid = (typeof id === 'undefined') ? '' : id;
    var emptyField = {};
    emptyField.id = id;
    emptyField.msg = msg;

    if (addErrors) {
        this.errors.push(emptyField);
    }

    if (typeof callback === "function") {
        callback(id, msg);
    }

    if (optid != '') {
        $("#" + optid).addClass("speedhtmlerr");
    }
}

//------------validate a field -----------------
/**
 * The validateField function is used for validating a field or custom value
 * @param {object} elementObj the validation object to be passed
 */
Speed.prototype.validateField = function (elementObj) {
    if (typeof elementObj.id === "undefined")
        elementObj.id = "";
    if (typeof elementObj.staticValue === "undefined")
        elementObj.staticValue = null;
    if (typeof elementObj.msg === "undefined")
        elementObj.msg = "";
    if (typeof elementObj.extension === "undefined")
        elementObj.extension = "";
    if (typeof elementObj.elementType === "undefined")
        elementObj.elementType = "";
    if (typeof elementObj.useElementProperties === "undefined")
        elementObj.useElementProperties = true;
    if (typeof elementObj.styleElement === "undefined")
        elementObj.styleElement = true;
    if (typeof elementObj.addErrors === "undefined")
        elementObj.addErrors = true;
    if (typeof elementObj.removeHtmlErrors === "undefined")
        elementObj.removeHtmlErrors = false;

    var valueToValidate = "";
    var elementType = "text";
    var elementVisible = true;
    if (elementObj.useElementProperties) {

        if (elementObj.id !== null) {
            var elementProperties = document.getElementById(elementObj.id);
            if (elementProperties.tagName.toLowerCase() === "textarea" || elementProperties.tagName.toLowerCase() === "select") { } else
                elementType = elementProperties.type.toLowerCase();

            try {
                if (elementProperties.type === "checkbox")
                    valueToValidate = elementProperties.checked;
                else if (elementProperties.type === "radio") {
                    valueToValidate = $("input[name='" + elementProperties.name + "']:checked").val();
                    valueToValidate = (typeof valueToValidate === "undefined") ? "" : valueToValidate;
                } else
                    valueToValidate = elementProperties.value.trim();

                valueToValidate = this.checkNull(valueToValidate);
            } catch (e) { }
            elementVisible = (elementProperties.style.display.toLowerCase() === "none") ? false : true;
        } else {
            $spcontext.debugHandler("1112", "", "", "");
        }


    } else {
        valueToValidate = this.checkNull(elementObj.staticValue);
        elementType = elementObj.elementType;
    }

    //===============================================================
    var passValidation = this.validationProperties[elementType].validate(valueToValidate, elementObj.extension, elementObj.id);
    if (!passValidation && elementVisible)
        this.validationReturn(elementObj.id, elementObj.msg, elementObj.addErrors, elementObj.triggerCallback);
    else if (passValidation && elementObj.removeHtmlErrors) {
        $("#" + elementObj.id).siblings(".temp-speedmsg").remove();
        $("#" + elementObj.id).removeClass("speedhtmlerr");
        if (elementObj.elementType === "radio") {
            var radioname = document.getElementById(elementObj.id).name;
            $("input[name='" + radioname + "']").removeClass("speedhtmlerr");
        }
    }
    if (elementObj.styleElement && !this.stylePlace) this.styleValidatedClass();
};

/**
 * The clearErrors function empties the speed error array variable
 */
Speed.prototype.clearValidation = function () {
    this.errors = [];
    $(":input,div,table,tr").removeClass("speedhtmlerr");
}

/**
 * The styleErrors function places your custom or speepoint default styles in the header of your html document
 * @param {string} [mystyle= "<style></style>"] the style string to be passed
 */
Speed.prototype.styleValidatedClass = function (mystyle) {
    var styleDefinition = "<style>" +
        ".speedhtmlerr {border-style : solid !important;border-color:red !important;border-width:1px !important} " +
        "p.temp-speedmsg {color:red !important; font-weight:bold; margin:0; padding: 0;}" +
        "input[type=checkbox].speedhtmlerr, input[type=radio].speedhtmlerr{outline: 2px solid red;}" +
        "table.speedhtmlerr thead tr th {border-top: 2px solid red !important;border-bottom: 2px solid red !important; }" +
        "table.speedhtmlerr thead tr th:first-child { border-left: 2px solid red!important; }" +
        "table.speedhtmlerr thead tr th:last-child { border-right: 2px solid red!important; }" +
        "</style>";
    if (!this.stylePlace) {
        if (typeof mystyle === 'undefined')
            $("head").append(styleDefinition);
        else {
            $("head").append(mystyle);
        }
        this.stylePlace = true;
    }
}

/**
 * The checkPassedValidation function returns true if the speed errors array is empty and false if it isnt
 * @returns {bool} indicates if objects are present in the speed errors array
 */
//------------check if the validation was succesful -------------
Speed.prototype.checkPassedValidation = function () {
    if (this.errors.length == 0) {
        return true;
    } else
        return false;
};

/**
 * The bind function obtains all speed-bind & speed-bind-validate html attributes and obtains the value and validate the input tag
 * and returns them as an object that can be passed to the createItems or updateItems 
 * @param {object} [listObjects={}] this parameter allows the bind method to use an already existing object instead of a new object returned by default
 * @param {bool} [staticBind= true] this parameter includes or neglect values from html attributes with the speed-bind attribute.default value is true
 * @returns {object} this object return contains key-value properties
 */
//========================== SpeedPoint Binding Section =======================
Speed.prototype.bind = function (listObjects, bindClass, bindGroup) {
    speedPointContext = this;
    this.clearValidation();
    var useBindClass = (typeof bindClass === 'string') ? true : false;

    var useBindGroup = (typeof bindGroup === 'undefined') ? false : bindGroup;
    //var bindStaticFields = (typeof staticBind === 'undefined') ? true : staticBind;
    var returnObject = {}
    if (typeof listObjects !== "undefined" && listObjects != null) {
        returnObject = listObjects;
    }

    var bindGroupData = {};
    //decides if u want to bind static fields to objects
    //set this option to false if the static fields already contains the same values with the object

    var element = document.querySelectorAll("[speed-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-bind");
        var omitControl = (element[i].getAttribute("speed-as-static") === null) ? false : (element[i].getAttribute("speed-as-static").toLowerCase() === "true");
        if (useBindClass) {
            var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
            }
        }
        if (!omitControl) {
            if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "textarea") {
                if (element[i].type == "checkbox") {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    if (multivalue) {
                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify([]);
                        }
                        var propertyValues = JSON.parse(returnObject[property]);

                        var checkvalue = {
                            label: (jsonlabel) ? JSON.parse(element[i].getAttribute("sptype-label")) : element[i].getAttribute("sptype-label"),
                            value: element[i].checked
                        }
                        propertyValues.push(checkvalue);
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[property] = element[i].checked;
                    }
                } else if (element[i].type == "radio") {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var name = (element[i].getAttribute("name") === null) ? "" : element[i].getAttribute("name");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (element[i].getAttribute("sptype-overide-validation") === null) ? false : (element[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify({});
                        }

                        var propertyValues = JSON.parse(returnObject[property]);
                        returnObject[property] = $("input[name='" + name + "']:checked").val();

                        var setProperty = element[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[property];
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[property] = $("input[name='" + name + "']:checked").val();
                    }
                } else {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    if (multivalue) {
                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify({});
                        }
                        var propertyValues = JSON.parse(returnObject[property]);

                        var currencyUsed = element[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            returnObject[property] = element[i].value;
                        } else {
                            var rawValue = (element[i].getAttribute("speed-currency-numeric") === null) ? false : (element[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[property] = speedPointContext.stripCurrencyToNumber(element[i].value, currencyUsed, rawValue)
                        }

                        /*var checkvalue = {
                            label: (jsonlabel) ? JSON.parse(element[i].getAttribute("sptype-label")) : element[i].getAttribute("sptype-label"),
                            value: returnObject[property]
                        }*/
                        var setProperty = element[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[property];
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        var currencyUsed = element[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            var usetext = (element[i].getAttribute("speed-select-text-value") === null) ? false : (element[i].getAttribute("speed-select-text-value").toLowerCase() === "true");
                            if (usetext) {
                                var id = element[i].id;
                                returnObject[property] = $("#" + id + " option:selected").text();
                            } else {
                                returnObject[property] = element[i].value;
                            }

                        } else {
                            var rawValue = (element[i].getAttribute("speed-currency-numeric") === null) ? false : (element[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[property] = speedPointContext.stripCurrencyToNumber(element[i].value, currencyUsed, rawValue)
                        }
                    }

                }
            } else {
                var currencyUsed = element[i].getAttribute("speed-bind-currency");
                if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                    returnObject[property] = element[i].innerText;
                } else {
                    var rawValue = (element[i].getAttribute("speed-currency-numeric") === null) ? false : (element[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                    returnObject[property] = speedPointContext.stripCurrencyToNumber(element[i].innerText, currencyUsed, rawValue)
                }
            }

            if (useBindGroup) {
                var controlGroup = (element[i].getAttribute("speed-bind-group") === null) ? "" : element[i].getAttribute("speed-bind-group").toLowerCase();
                if (typeof bindGroupData[controlGroup] === "undefined") {
                    bindGroupData[controlGroup] = {};
                }
                bindGroupData[controlGroup][property] = returnObject[property];
            }
        }
    }

    //Speed bind and validate html
    var elementValidate = document.querySelectorAll("[speed-bind-validate]");
    for (var i = 0; i <= (elementValidate.length - 1); i++) {
        var property = elementValidate[i].getAttribute("speed-bind-validate");
        var msg = elementValidate[i].getAttribute("speed-validate-msg");
        var onValidation = (elementValidate[i].getAttribute("speed-validate-mode") === null) ? true : (elementValidate[i].getAttribute("speed-validate-mode") === "true");
        var inputtype = elementValidate[i].getAttribute("speed-validate-type");
        var inputid = elementValidate[i].getAttribute("id");
        if (inputid == "" || inputid == null) {
            inputid = speedPointContext.uniqueIdGenerator();
            elementValidate[i].setAttribute("id", inputid);
        }
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
        var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
        var omitControl = (elementValidate[i].getAttribute("speed-as-static") === null) ? false : (elementValidate[i].getAttribute("speed-as-static").toLowerCase() === "true");
        if (useBindClass) {
            var controlClass = (elementValidate[i].getAttribute("speed-bind-class") === null) ? "" : elementValidate[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
                onValidation = false;
            }
        }
        if (elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "select" || elementValidate[i].tagName.toLowerCase() == "textarea") {
            if (!omitControl) {
                if (elementValidate[i].type == "checkbox") {
                    var multivalue = (elementValidate[i].getAttribute("sptype") === null) ? false : (elementValidate[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (elementValidate[i].getAttribute("spjsonlabel") === null) ? false : (elementValidate[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (elementValidate[i].getAttribute("sptype-overide-validation") === null) ? true : (elementValidate[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify([]);
                        }
                        var propertyValues = JSON.parse(returnObject[property]);

                        var checkvalue = {
                            label: (jsonlabel) ? JSON.parse(elementValidate[i].getAttribute("sptype-label")) : elementValidate[i].getAttribute("sptype-label"),
                            value: elementValidate[i].checked
                        }
                        propertyValues.push(checkvalue);
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[property] = elementValidate[i].checked;
                    }
                } else if (elementValidate[i].type == "radio") {
                    var multivalue = (elementValidate[i].getAttribute("sptype") === null) ? false : (elementValidate[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var name = (elementValidate[i].getAttribute("name") === null) ? "" : elementValidate[i].getAttribute("name");
                    var jsonlabel = (elementValidate[i].getAttribute("spjsonlabel") === null) ? false : (elementValidate[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (elementValidate[i].getAttribute("sptype-overide-validation") === null) ? false : (elementValidate[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify({});
                        }

                        var propertyValues = JSON.parse(returnObject[property]);
                        returnObject[property] = $("input[name='" + name + "']:checked").val();

                        var setProperty = elementValidate[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[property];
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[property] = $("input[name='" + name + "']:checked").val();
                    }
                } else {
                    var multivalue = (elementValidate[i].getAttribute("sptype") === null) ? false : (elementValidate[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (elementValidate[i].getAttribute("spjsonlabel") === null) ? false : (elementValidate[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (elementValidate[i].getAttribute("sptype-overide-validation") === null) ? false : (elementValidate[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[property] === "undefined") {
                            returnObject[property] = JSON.stringify({});
                        }
                        var propertyValues = JSON.parse(returnObject[property]);

                        var currencyUsed = elementValidate[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            returnObject[property] = elementValidate[i].value;
                        } else {
                            var rawValue = (elementValidate[i].getAttribute("speed-currency-numeric") === null) ? false : (elementValidate[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[property] = speedPointContext.stripCurrencyToNumber(elementValidate[i].value, currencyUsed, rawValue)
                        }

                        var setProperty = elementValidate[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[property];
                        returnObject[property] = JSON.stringify(propertyValues);
                    } else {
                        var currencyUsed = elementValidate[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            var usetext = (elementValidate[i].getAttribute("speed-select-text-value") === null) ? false : (elementValidate[i].getAttribute("speed-select-text-value").toLowerCase() === "true");
                            if (usetext) {
                                var id = elementValidate[i].id;
                                returnObject[property] = $("#" + id + " option:selected").text();
                            } else {
                                returnObject[property] = elementValidate[i].value;
                            }
                        } else {
                            var rawValue = (elementValidate[i].getAttribute("speed-currency-numeric") === null) ? false : (elementValidate[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[property] = speedPointContext.stripCurrencyToNumber(elementValidate[i].value, currencyUsed, rawValue)
                        }
                    }

                }

                if (useBindGroup) {
                    var controlGroup = (elementValidate[i].getAttribute("speed-bind-group") === null) ? "" : elementValidate[i].getAttribute("speed-bind-group").toLowerCase();
                    if (typeof bindGroupData[controlGroup] === "undefined") {
                        bindGroupData[controlGroup] = {};
                    }
                    bindGroupData[controlGroup][property] = returnObject[property];
                }
            }
            if (onValidation) {
                this.validateField({
                    id: inputid,
                    msg: validationMessage,
                    extension: validationtype
                });
            }
        } else {
            returnObject[property] = elementValidate[i].innerText.trim();
            if (onValidation) {
                this.validateField({
                    id: inputid,
                    staticValue: returnObject[property],
                    msg: validationMessage,
                    elementType: "text",
                    useElementProperties: false
                });
            }
        }
    }

    //bind people picker
    var elementPeople = document.querySelectorAll("[speed-bind-people]");
    for (var i = 0; i <= (elementPeople.length - 1); i++) {
        var property = elementPeople[i].getAttribute("speed-bind-people");
        var msg = elementPeople[i].getAttribute("speed-validate-msg");

        var useJson = (elementPeople[i].getAttribute("speed-JSON") !== null) ? (elementPeople[i].getAttribute("speed-JSON").toLowerCase() === "true") : false;

        var validate = (elementPeople[i].getAttribute("speed-validate-mode") !== null) ? (elementPeople[i].getAttribute("speed-validate-mode").toLowerCase() === "true") : false;
        var omitControl = (elementPeople[i].getAttribute("speed-as-static") === null) ? false : (elementPeople[i].getAttribute("speed-as-static").toLowerCase() === "true");
        var inputid = elementPeople[i].getAttribute("id");
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
        var validationtype = "text";
        var pickerID = inputid + '_TopSpan';
        if (useBindClass) {
            var controlClass = (elementPeople[i].getAttribute("speed-bind-class") === null) ? "" : elementPeople[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
                validate = false;
            }
        }

        if (SPClientPeoplePicker !== null) {
            var peopleDict = SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID];

            var userObject = this.getUsersFromPicker(peopleDict);
            if (userObject !== null) {
                if (userObject.length !== 0) {
                    if (useJson) {
                        if (!omitControl) {
                            returnObject[property] = JSON.stringify(userObject);
                        }
                    } else {
                        if (userObject.length == 1) {
                            if (!omitControl) {
                                returnObject[property] = SP.FieldUserValue.fromUser(userObject[0].Key);
                            }
                        } else {
                            if (peopleDict.AllowMultipleUsers) {
                                var tempArray = [];
                                for (var a = 0; a <= (userObject.length - 1); a++) {
                                    tempArray.push(SP.FieldUserValue.fromUser(userObject[a].Key));
                                }
                                if (!omitControl)
                                    returnObject[property] = tempArray;
                            } else {
                                if (!omitControl) {
                                    returnObject[property] = null;
                                }
                                if (validate)
                                    this.validateField({
                                        id: pickerID,
                                        staticValue: "",
                                        msg: validationMessage,
                                        elementType: "text",
                                        useElementProperties: false
                                    });
                            }
                        }
                    }
                } else {
                    if (!omitControl) {
                        returnObject[property] = null;
                    }
                    if (validate)
                        this.validateField({
                            id: pickerID,
                            staticValue: "",
                            msg: validationMessage,
                            elementType: "text",
                            useElementProperties: false
                        });
                }

                if (!omitControl) {
                    if (useBindGroup) {
                        var controlGroup = (elementPeople[i].getAttribute("speed-bind-group") === null) ? "" : elementPeople[i].getAttribute("speed-bind-group").toLowerCase();
                        if (typeof bindGroupData[controlGroup] === "undefined") {
                            bindGroupData[controlGroup] = {};
                        }
                        bindGroupData[controlGroup][property] = returnObject[property];
                    }
                }
            }

        }
    }

    //Speed bind and table to array
    var elementValidate = document.querySelectorAll("[speed-bind-table]");
    for (var i = 0; i <= (elementValidate.length - 1); i++) {
        var property = elementValidate[i].getAttribute("speed-bind-table");
        var strignify = (elementValidate[i].getAttribute("speed-JSON") !== null) ? (elementValidate[i].getAttribute("speed-JSON").toLowerCase() === "true") : true;
        var inputid = elementValidate[i].getAttribute("id");

        var omitControl = (elementValidate[i].getAttribute("speed-as-static") === null) ? false : (elementValidate[i].getAttribute("speed-as-static").toLowerCase() === "true");
        if (useBindClass) {
            var controlClass = (elementValidate[i].getAttribute("speed-bind-class") === null) ? "" : elementValidate[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
            }
        }
        var validate = (elementValidate[i].getAttribute("speed-validate-mode") === null) ? true : (elementValidate[i].getAttribute("speed-validate-mode").toLowerCase() === "true");
        var msg = elementValidate[i].getAttribute("speed-validate-msg");
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please enter a data" : msg;
        var fieldVisible = (elementValidate[i].style.display.toLowerCase() === "none") ? false : true;

        var objproperties = [];
        $("#" + inputid + " > thead > tr > th").each(function () {
            if (this.getAttribute("speed-array-prop") !== null) {
                objproperties.push(this.getAttribute("speed-array-prop"));
            }
            else if (this.getAttribute("speed-array-func") !== null) {
                objproperties.push(this.getAttribute("speed-array-func"));
            }
        });

        var arrayValue = [];
        if (!omitControl) {
            $("#" + inputid + " > tbody > tr").each(function () {
                var rowId = this.id;
                var objCount = 0;
                var objValue = {};
                $("#" + rowId + " td").each(function (a) {
                    var inputTag = $(this).children()[0];
                    var hasInclude = $(inputTag).hasClass("speed-table-include");
                    if (hasInclude) {
                        if (inputTag.tagName.toLowerCase() == "input" || inputTag.tagName.toLowerCase() == "select" || inputTag.tagName.toLowerCase() == "textarea") {
                            if (inputTag.type == "checkbox") {
                                objValue[objproperties[objCount]] = inputTag.checked;
                            } else if (inputTag.type == "file") {
                                var attrValue = "";
                                if (inputTag.getAttribute("speed-file-bind") !== null)
                                    attrValue = inputTag.getAttribute("speed-file-bind");

                                if (inputTag.getAttribute("speed-file-validate") !== null)
                                    attrValue = inputTag.getAttribute("speed-file-validate");
                                objValue[objproperties[objCount]] = attrValue
                            } else {
                                //objValue[objproperties[objCount]] = inputTag.value;
                                var currencyUsed = inputTag.getAttribute("speed-bind-currency");
                                if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                    var usetext = (inputTag.getAttribute("speed-select-text-value") === null) ? false : (inputTag.getAttribute("speed-select-text-value").toLowerCase() === "true");
                                    if (usetext) {
                                        var id = inputTag.id;
                                        objValue[objproperties[objCount]] = $("#" + id + " option:selected").text();
                                    } else {
                                        objValue[objproperties[objCount]] = inputTag.value;
                                    }
                                } else {
                                    var rawValue = (inputTag.getAttribute("speed-currency-numeric") === null) ? false : (inputTag.getAttribute("speed-currency-numeric").toLowerCase() === "true");
                                    objValue[objproperties[objCount]] = speedPointContext.stripCurrencyToNumber(inputTag.value, currencyUsed, rawValue);
                                }
                            }
                        } else if (inputTag.tagName.toLowerCase() == "div" || inputTag.tagName.toLowerCase() == "ul") {
                            isMulti = (inputTag.getAttribute("speed-MultiCheck-bind") === null) ? false : true;
                            if (isMulti) {
                                var elementId = inputTag.getAttribute("id");
                                var multiData = {};
                                var oneChecked = false;
                                $("#" + elementId + " input").each(function () {
                                    var mulitlabel = this.getAttribute("sptype-label");
                                    var mulitvale = this.checked;
                                    multiData[mulitlabel] = mulitvale;
                                    if (mulitvale) {
                                        oneChecked = true;
                                    }
                                });
                                objValue[objproperties[objCount]] = multiData;

                                if (validate && !oneChecked) {
                                    speedPointContext.validateField({
                                        id: elementId,
                                        staticValue: "",
                                        msg: validationMessage,
                                        elementType: "text",
                                        useElementProperties: false
                                    });
                                }
                            } else {
                                inputTag.getAttribute("speed-file-bind");
                                objValue[objproperties[objCount]] = inputTag.innerText;
                            }
                        } else {
                            inputTag.getAttribute("speed-file-bind");
                            var currencyUsed = inputTag.getAttribute("speed-bind-currency");
                            if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                objValue[objproperties[objCount]] = inputTag.innerText;
                            } else {
                                var rawValue = (inputTag.getAttribute("speed-currency-numeric") === null) ? false : (inputTag.getAttribute("speed-currency-numeric").toLowerCase() === "true");
                                objValue[objproperties[objCount]] = speedPointContext.stripCurrencyToNumber(inputTag.innerText, currencyUsed, rawValue)
                            }

                        }
                        objCount++;
                    }
                });
                arrayValue.push(objValue);
            });
        }

        if (validate && fieldVisible && arrayValue.length === 0 && !omitControl) {
            this.validateField({
                id: inputid,
                staticValue: "",
                msg: validationMessage,
                elementType: "text",
                useElementProperties: false
            });
        }

        if (!omitControl) {
            if (strignify) {
                returnObject[property] = JSON.stringify(arrayValue);
            } else {
                returnObject[property] = arrayValue;
            }

            if (useBindGroup) {
                var controlGroup = (elementValidate[i].getAttribute("speed-bind-group") === null) ? "" : elementValidate[i].getAttribute("speed-bind-group").toLowerCase();
                if (typeof bindGroupData[controlGroup] === "undefined") {
                    bindGroupData[controlGroup] = {};
                }
                bindGroupData[controlGroup][property] = returnObject[property];
            }
        }
    }

    var elementMulti = document.querySelectorAll("[speed-MultiCheck-bind]");
    for (var i = 0; i <= (elementMulti.length - 1); i++) {
        var property = elementMulti[i].getAttribute("speed-MultiCheck-bind");
        var strignify = (elementMulti[i].getAttribute("speed-JSON") !== null) ? (elementMulti[i].getAttribute("speed-JSON").toLowerCase() === "true") : false;
        var inputid = elementMulti[i].getAttribute("id");

        var omitControl = (elementMulti[i].getAttribute("speed-as-static") === null) ? false : (elementMulti[i].getAttribute("speed-as-static").toLowerCase() === "true");
        if (useBindClass) {
            var controlClass = (elementMulti[i].getAttribute("speed-bind-class") === null) ? "" : elementMulti[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
            }
        }
        var validate = (elementMulti[i].getAttribute("speed-validate-mode") === null) ? true : (elementMulti[i].getAttribute("speed-validate-mode").toLowerCase() === "true");
        var msg = elementMulti[i].getAttribute("speed-validate-msg");
        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please enter a data" : msg;
        var fieldVisible = (elementMulti[i].style.display.toLowerCase() === "none") ? false : true;
        var multiData = {};
        var oneChecked = false;
        $("#" + inputid + " input").each(function () {
            var mulitlabel = this.getAttribute("sptype-label");
            var mulitvale = this.checked;
            multiData[mulitlabel] = mulitvale;
            if (mulitvale) {
                oneChecked = true;
            }
        });

        if (!omitControl) {
            returnObject[property] = (strignify) ? JSON.stringify(multiData) : multiData;
            if (useBindGroup) {
                var controlGroup = (elementValidate[i].getAttribute("speed-bind-group") === null) ? "" : elementValidate[i].getAttribute("speed-bind-group").toLowerCase();
                if (typeof bindGroupData[controlGroup] === "undefined") {
                    bindGroupData[controlGroup] = {};
                }
                bindGroupData[controlGroup][property] = returnObject[property];
            }
        }


        if (validate && !oneChecked) {
            speedPointContext.validateField({
                id: inputid,
                staticValue: "",
                msg: validationMessage,
                elementType: "text",
                useElementProperties: false
            });
        }
    }

    var element = document.querySelectorAll("[speed-file-validate]");

    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-file-validate");
        var inputid = element[i].id;
        var msg = element[i].getAttribute("speed-validate-msg");
        var onValidation = (element[i].getAttribute("speed-validate-mode") === null) ? true : (element[i].getAttribute("speed-validate-mode") === "true");
        var validationMessage = (msg == null || msg == "" || typeof msg == "undefined") ? "Please select a file" : msg;
        var fieldNotVisible = (element[i].style.display.toLowerCase() === "none");
        var omitControl = (element[i].getAttribute("speed-as-static") === null) ? false : (element[i].getAttribute("speed-as-static").toLowerCase() === "true");
        if (useBindClass) {
            var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
            }
        }
        if (typeof this.filesDictionary[property] === "undefined" && !fieldNotVisible && onValidation && !omitControl) {
            this.validateField({
                id: inputid,
                staticValue: "",
                msg: validationMessage,
                elementType: "text",
                useElementProperties: false
            });
        } else if (typeof this.filesDictionary[property] !== "undefined") {
            if (this.filesDictionary[property].files.length === 0 && !fieldNotVisible && onValidation && !omitControl) {
                this.validateField({
                    id: inputid,
                    staticValue: "",
                    msg: validationMessage,
                    elementType: "text",
                    useElementProperties: false
                });
            }
        }
    }

    return (useBindGroup) ? bindGroupData : returnObject;
}

Speed.prototype.getFileMetaData = function (listObjects, bindClass) {

    var useBindClass = (typeof bindClass === 'string') ? true : false;
    var returnObject = {};
    if (typeof listObjects !== "undefined" && listObjects != null) {
        returnObject = listObjects;
    }
    var element = document.querySelectorAll("[speed-file-meta]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var docProperty = element[i].getAttribute("speed-file-meta");
        var omitControl = (element[i].getAttribute("speed-file-meta-omit") === null) ? false : (element[i].getAttribute("speed-file-meta-omit").toLowerCase() === "true");
        var property = element[i].getAttribute("speed-file-meta-property");
        if (useBindClass) {
            var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                omitControl = true;
            }
        }

        if (typeof returnObject[docProperty] === "undefined") {
            returnObject[docProperty] = {};
        }
        if (!omitControl && property !== null) {
            if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "textarea") {
                if (element[i].type == "checkbox") {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    if (multivalue) {
                        if (typeof returnObject[docProperty][property] === "undefined") {
                            returnObject[docProperty][property] = JSON.stringify([]);
                        }
                        var propertyValues = JSON.parse(returnObject[docProperty][property]);

                        var checkvalue = {
                            label: (jsonlabel) ? JSON.parse(element[i].getAttribute("sptype-label")) : element[i].getAttribute("sptype-label"),
                            value: element[i].checked
                        }
                        propertyValues.push(checkvalue);
                        returnObject[docProperty][property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[docProperty][property] = element[i].checked;
                    }
                } else if (element[i].type == "radio") {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var name = (element[i].getAttribute("name") === null) ? "" : element[i].getAttribute("name");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    var overidevalidation = (element[i].getAttribute("sptype-overide-validation") === null) ? false : (element[i].getAttribute("sptype-overide-validation").toLowerCase() === "true");
                    if (multivalue) {
                        if (overidevalidation) {
                            validationtype = "multivalue";
                        }

                        if (typeof returnObject[docProperty][property] === "undefined") {
                            returnObject[docProperty][property] = JSON.stringify({});
                        }

                        var propertyValues = JSON.parse(returnObject[docProperty][property]);
                        returnObject[docProperty][property] = $("input[name='" + name + "']:checked").val();

                        var setProperty = element[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[docProperty][property];
                        returnObject[docProperty][property] = JSON.stringify(propertyValues);
                    } else {
                        returnObject[docProperty][property] = $("input[name='" + name + "']:checked").val();
                    }
                } else {
                    var multivalue = (element[i].getAttribute("sptype") === null) ? false : (element[i].getAttribute("sptype").toLowerCase() === "multivalue");
                    var jsonlabel = (element[i].getAttribute("spjsonlabel") === null) ? false : (element[i].getAttribute("spjsonlabel").toLowerCase() === "true");
                    if (multivalue) {
                        if (typeof returnObject[docProperty][property] === "undefined") {
                            returnObject[docProperty][property] = JSON.stringify({});
                        }
                        var propertyValues = JSON.parse(returnObject[docProperty][property]);

                        var currencyUsed = element[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            var value = element[i].value;
                            var dateFormat = element[i].getAttribute("speed-file-meta-date");
                            var format = element[i].getAttribute("speed-file-meta-format");
                            if (dateFormat !== null && value !== "") {
                                value = $spcontext.stringnifyDate({ value: value, format: format, reconstruct: dateFormat });
                            }
                            returnObject[docProperty][property] = value;
                        } else {
                            var rawValue = (element[i].getAttribute("speed-currency-numeric") === null) ? false : (element[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[docProperty][property] = speedPointContext.stripCurrencyToNumber(element[i].value, currencyUsed, rawValue)
                        }

                        /*var checkvalue = {
                            label: (jsonlabel) ? JSON.parse(element[i].getAttribute("sptype-label")) : element[i].getAttribute("sptype-label"),
                            value: returnObject[docProperty][property]
                        }*/
                        var setProperty = element[i].getAttribute("sptype-label");
                        propertyValues[setProperty] = returnObject[docProperty][property];
                        returnObject[docProperty][property] = JSON.stringify(propertyValues);
                    } else {
                        var currencyUsed = element[i].getAttribute("speed-bind-currency");
                        if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                            var usetext = (element[i].getAttribute("speed-select-text-value") === null) ? false : (element[i].getAttribute("speed-select-text-value").toLowerCase() === "true");
                            if (usetext) {
                                var id = element[i].id;
                                returnObject[docProperty][property] = $("#" + id + " option:selected").text();
                            } else {
                                var value = element[i].value;
                                var dateFormat = element[i].getAttribute("speed-file-meta-date");
                                var format = element[i].getAttribute("speed-file-meta-format");
                                if (dateFormat !== null && value !== "") {
                                    value = $spcontext.stringnifyDate({ value: value, format: format, reconstruct: dateFormat });
                                }
                                returnObject[docProperty][property] = value;
                            }

                        } else {
                            var rawValue = (element[i].getAttribute("speed-currency-numeric") === null) ? false : (element[i].getAttribute("speed-currency-numeric").toLowerCase() === "true");
                            returnObject[docProperty][property] = speedPointContext.stripCurrencyToNumber(element[i].value, currencyUsed, rawValue)
                        }
                    }
                }
            } else {
                returnObject[docProperty][property] = element[i].innerText;
            }
        }
    }

    return returnObject;
}

/**
 * The getAttachmentControls function gets all speed-bind & speed-bind-validate html attributes names
 * @returns {Array} the Array return contains all controls names
 */
Speed.prototype.getAttachmentControls = function (useGroup) {
    var groupMode = (typeof useGroup !== "undefined") ? false : useGroup;
    var returnArr = (groupMode) ? {} : [];

    var element = document.querySelectorAll("[speed-file-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var elementProp = {};
        elementProp.property = element[i].getAttribute("speed-file-bind");
        elementProp.id = element[i].id;
        elementProp.type = (element[i].getAttribute("type") === null) ? "" : element[i].getAttribute("type").toLowerCase();
        var groupName = (element[i].getAttribute("speed-file-group") === null) ? "" : element[i].getAttribute("speed-file-group");
        var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
        if (includeControl && element[i].tagName.toLowerCase() == "input") {
            if (groupMode) {
                if (typeof returnArr[groupName] === "undefined") {
                    returnArr[groupName] = [];
                }
                returnArr[groupName].push(elementProp);
            }
            else {
                returnArr.push(elementProp);
            }
        }
    }

    var element = document.querySelectorAll("[speed-file-validate]");

    for (var i = 0; i <= (element.length - 1); i++) {
        var elementProp = {};
        elementProp.property = element[i].getAttribute("speed-file-validate");
        elementProp.id = element[i].id;
        elementProp.type = (element[i].getAttribute("type") === null) ? "" : element[i].getAttribute("type").toLowerCase();
        var groupName = (element[i].getAttribute("speed-file-group") === null) ? "" : element[i].getAttribute("speed-file-group");
        var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
        if (includeControl && element[i].tagName.toLowerCase() == "input") {
            if (groupMode) {
                if (typeof returnArr[groupName] === "undefined") {
                    returnArr[groupName] = [];
                }
                returnArr[groupName].push(elementProp);
            }
            else {
                returnArr.push(elementProp);
            }
        }
    }

    return returnArr;
};

/**
 * The getControls function gets all speed-bind & speed-bind-validate html attributes names
 * @returns {Array} the Array return contains all controls names
 */
Speed.prototype.getControls = function (onlyTables, tableGroupId, bindClass) {
    var speedContext = this;
    var onlyTables = (typeof onlyTables === "undefined") ? false : onlyTables;
    var useBindClass = (typeof bindClass === 'string') ? true : false;
    var returnArr = [];

    if (!onlyTables) {
        //decides if u want to bind static fields to objects
        //set this option to false if the static fields already contains the same values with the object
        var element = document.querySelectorAll("[speed-bind]");
        var includeProperties = (typeof tableGroupId !== "undefined" && typeof tableGroupId === "boolean") ? tableGroupId : false;

        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-bind");
            var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (useBindClass) {
                var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    includeControl = false;
                }
            }
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.columnName = property;
                        if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "select" || element[i].tagName.toLowerCase() == "label") {
                            var elementtype = element[i].getAttribute("[sptype]");
                            try {
                                elementtype = elementtype.toLowerCase();
                            } catch (e) {
                                elementtype = "";
                            }
                            if (elementtype == "date") {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"DateTime\" />";
                                SPElementProperties.fieldType = SP.FieldDateTime;
                            } else if (elementtype == "multivalue") {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                                SPElementProperties.fieldType = SP.FieldMultiLineText;
                            } else {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Text\" />";
                                SPElementProperties.fieldType = SP.FieldText;
                            }
                        } else if (element[i].tagName.toLowerCase() == "textarea") {
                            SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                            SPElementProperties.fieldType = SP.FieldMultiLineText;
                        }

                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;

                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }

        //Speed bind and validate html
        var elementValidate = document.querySelectorAll("[speed-bind-validate]");
        for (var i = 0; i <= (elementValidate.length - 1); i++) {
            var property = elementValidate[i].getAttribute("speed-bind-validate");
            var includeControl = (elementValidate[i].getAttribute("speed-include-control") === null) ? true : (elementValidate[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (useBindClass) {
                var controlClass = (elementValidate[i].getAttribute("speed-bind-class") === null) ? "" : elementValidate[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    includeControl = false;
                }
            }
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.columnName = property;
                        if (elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "select" || elementValidate[i].tagName.toLowerCase() == "label") {
                            var elementtype = elementValidate[i].getAttribute("sptype");
                            try {
                                elementtype = elementtype.toLowerCase();
                            } catch (e) { }
                            if (elementtype == "date") {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"DateTime\" />";
                                SPElementProperties.fieldType = SP.FieldDateTime;

                            } else if (elementtype == "multivalue") {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                                SPElementProperties.fieldType = SP.FieldMultiLineText;
                            } else {
                                SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Text\" />";
                                SPElementProperties.fieldType = SP.FieldText;
                            }
                        } else if (elementValidate[i].tagName.toLowerCase() == "textarea") {
                            SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                            SPElementProperties.fieldType = SP.FieldMultiLineText;
                        }

                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;

                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }

        //Speed bind and people html
        var elementPeople = document.querySelectorAll("[speed-bind-people]");
        for (var i = 0; i <= (elementPeople.length - 1); i++) {
            var property = elementPeople[i].getAttribute("speed-bind-people");
            var includeControl = (elementPeople[i].getAttribute("speed-include-control") === null) ? true : (elementPeople[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (useBindClass) {
                var controlClass = (elementPeople[i].getAttribute("speed-bind-class") === null) ? "" : elementPeople[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    includeControl = false;
                }
            }
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.columnName = property;
                        SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"UserMulti\" UserSelectionMode=\"PeopleAndGroups\" Mult=\"TRUE\" />";
                        SPElementProperties.fieldType = SP.FieldUser;
                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;

                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }

        //Speed bind table assests
        var element = document.querySelectorAll("[speed-bind-table]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-bind-table");
            var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (useBindClass) {
                var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    includeControl = false;
                }
            }
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.ColumnName = property;
                        SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                        SPElementProperties.fieldType = SP.FieldMultiLineText;
                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;
                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }

        var element = document.querySelectorAll("[speed-MultiCheck-bind]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-MultiCheck-bind");
            var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
            if (useBindClass) {
                var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    includeControl = false;
                }
            }
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0) {
                    if (!includeProperties) {
                        returnArr.push(property);
                    } else {
                        var SPElementProperties = {};
                        SPElementProperties.columnName = property;
                        SPElementProperties.columnField = "<Field DisplayName=\"" + property + "\" Type=\"Note\" RichText=\"FALSE\" />";
                        SPElementProperties.fieldType = SP.FieldMultiLineText;
                        SPElementProperties.fieldOptions = SP.AddFieldOptions.defaultValue;
                        SPElementProperties.addToDefault = true;

                        returnArr.push(SPElementProperties);
                    }
                }
            }
        }
    }

    if (onlyTables) {
        var element = document.querySelectorAll("[speed-table-data]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var property = element[i].getAttribute("speed-table-data");
            //table group is used to split the Table controls if multiple tables are used
            var tablegroup = element[i].getAttribute("speed-table-group");
            //var includeControl = (element[i].getAttribute("speed-include-control") === null) ? true : (element[i].getAttribute("speed-include-control").toLowerCase() === "true");
            var includeControl = (typeof tableGroupId === "undefined" || tableGroupId === "") ? true : (tablegroup === tableGroupId);
            if (useBindClass) {
                var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    includeControl = false;
                }
            }
            if (includeControl && property !== "") {
                if ($.inArray(property, returnArr) < 0)
                    returnArr.push(property);

                //attach event listener on Table Click
                var elementEventData = speedContext.DataForTable.tdClick[property];
                if (typeof elementEventData === "undefined") {
                    speedContext.DataForTable.tdClick[property] = false;
                    element[i].addEventListener("click", function (evt) {
                        var mainProperty = evt.srcElement.getAttribute("speed-table-data");
                        speedContext.DataForTable.tdClick[mainProperty] = (speedContext.DataForTable.tdClick[mainProperty]) ? false : true;
                        if (speedContext.DataForTable.sortingEnabled) {
                            speedContext.DataForTable.tabledata.sort(function (a, b) {
                                //triggers when sorting is activated on table headers
                                if (typeof speedContext.DataForTable.sortToggle === "function") {
                                    speedContext.DataForTable.sortToggle();
                                }

                                if (speedContext.DataForTable.tdClick[mainProperty]) {
                                    if (a[mainProperty] < b[mainProperty]) {
                                        return -1;
                                    }
                                    if (a[mainProperty] > b[mainProperty]) {
                                        return 1;
                                    }
                                    return 0;
                                } else {
                                    if (a[mainProperty] > b[mainProperty]) {
                                        return -1;
                                    }
                                    if (a[mainProperty] < b[mainProperty]) {
                                        return 1;
                                    }
                                    return 0;
                                }
                            });

                            speedContext.manualTable(speedContext.DataForTable.tabledata);
                        }
                    });
                }
            }
        }
    }
    return returnArr;
}

Speed.prototype.assignAttributes = function (specialCase) {
    specialCase = (typeof specialCase == "undefined") ? {} : specialCase;
    var element = document.querySelectorAll("[speed-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-bind");
        if (typeof specialCase[property] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase[property].id !== "undefined") ?
                    specialCase[property].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase[property]) {
                element[i][prop] = specialCase[property][prop]
            }

        } else if (typeof specialCase["ALL"] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase["ALL"].id !== "undefined") ?
                    specialCase["ALL"].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase["ALL"]) {
                element[i][prop] = specialCase["ALL"][prop]
            }
        } else {
            if (element[i].id == "") {
                element[i].id = this.uniqueIdGenerator();
            }
        }
    }

    var element = document.querySelectorAll("[speed-bind-validate]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-bind-validate");
        if (typeof specialCase[property] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase[property].id !== "undefined") ?
                    specialCase[property].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase[property]) {
                element[i][prop] = specialCase[property][prop]
            }
        } else if (typeof specialCase["ALL"] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase["ALL"].id !== "undefined") ?
                    specialCase["ALL"].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase["ALL"]) {
                element[i][prop] = specialCase["ALL"][prop]
            }
        } else {
            if (element[i].id == "") {
                element[i].id = this.uniqueIdGenerator();
            }
        }
    }

    var element = document.querySelectorAll("[speed-bind-people]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-bind-people");
        if (typeof specialCase[property] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase[property].id !== "undefined") ?
                    specialCase[property].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase[property]) {
                element[i][prop] = specialCase[property][prop]
            }
        } else if (typeof specialCase["ALL"] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase["ALL"].id !== "undefined") ?
                    specialCase["ALL"].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase["ALL"]) {
                element[i][prop] = specialCase["ALL"][prop]
            }
        } else {
            if (element[i].id == "") {
                element[i].id = this.uniqueIdGenerator();
            }
        }
    }

    var element = document.querySelectorAll("[speed-bind-table]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-bind-table");
        if (typeof specialCase[property] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase[property].id !== "undefined") ?
                    specialCase[property].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase[property]) {
                element[i][prop] = specialCase[property][prop]
            }
        } else if (typeof specialCase["ALL"] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase["ALL"].id !== "undefined") ?
                    specialCase["ALL"].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase["ALL"]) {
                element[i][prop] = specialCase["ALL"][prop]
            }
        } else {
            if (element[i].id == "") {
                element[i].id = this.uniqueIdGenerator();
            }
        }
    }

    var element = document.querySelectorAll("[speed-MultiCheck-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-MultiCheck-bind");
        if (typeof specialCase[property] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase[property].id !== "undefined") ?
                    specialCase[property].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase[property]) {
                element[i][prop] = specialCase[property][prop]
            }
        } else if (typeof specialCase["ALL"] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase["ALL"].id !== "undefined") ?
                    specialCase["ALL"].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase["ALL"]) {
                element[i][prop] = specialCase["ALL"][prop]
            }
        } else {
            if (element[i].id == "") {
                element[i].id = this.uniqueIdGenerator();
            }
        }
    }

    var element = document.querySelectorAll("[speed-file-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-file-bind");
        if (typeof specialCase[property] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase[property].id !== "undefined") ?
                    specialCase[property].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase[property]) {
                element[i][prop] = specialCase[property][prop]
            }
        } else if (typeof specialCase["ALL"] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase["ALL"].id !== "undefined") ?
                    specialCase["ALL"].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase["ALL"]) {
                element[i][prop] = specialCase["ALL"][prop]
            }
        } else {
            if (element[i].id == "") {
                element[i].id = this.uniqueIdGenerator();
            }
        }
    }

    var element = document.querySelectorAll("[speed-file-validate]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var property = element[i].getAttribute("speed-file-validate");
        if (typeof specialCase[property] !== "undefined") {
            if (element[i].id == "") {
                element[i].id = (typeof specialCase[property].id !== "undefined") ?
                    specialCase[property].id : this.uniqueIdGenerator();
            }
            for (var prop in specialCase[property]) {
                element[i][prop] = specialCase[property][prop]
            }
        } else {
            if (element[i].id == "") {
                element[i].id = this.uniqueIdGenerator();
            }
        }
    }
}

/**
 * The htmlBind function sets all speed-bind & speed-bind-validate html attributes with respect to the object passed key with their values
 * @param {object} listObjects this parameter provides the value for the attriutes
 */
Speed.prototype.htmlBind = function (listObjects, bindExtensions, bindClass) {
    var speedContext = this;
    bindExtensions = (typeof bindExtensions == "undefined") ? {} : bindExtensions;
    var useBindClass = (typeof bindClass == "undefined") ? false : bindClass;
    function defaultExecutor(columnPassedValue) {
        columnPassedValue = (typeof columnPassedValue == "undefined") ? "" : columnPassedValue;
        return speedContext.replaceSpecialkeysinString(columnPassedValue);
    }

    for (var key in listObjects) {
        if (listObjects.hasOwnProperty(key)) {
            var element = document.querySelectorAll("[speed-bind='" + key + "']");
            if (element.length > 0) {
                for (var i = 0; i <= (element.length - 1); i++) {
                    var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                    if (useBindClass) {
                        var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                        if (controlClass != bindClass.toLowerCase()) {
                            useAutoBinding = false;
                        }
                    }
                    if (useAutoBinding) {
                        if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                            if (element[i].type === "radio") {
                                if (listObjects[key] !== "")
                                    $("input:radio[name='" + element[i].name + "'][value='" + listObjects[key] + "']").prop('checked', true);
                            } else if (element[i].type !== "checkbox") {
                                var currencyUsed = element[i].getAttribute("speed-bind-currency");
                                if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                    element[i].value = listObjects[key];
                                } else {
                                    element[i].value = currencyUsed + speedContext.numberWithCommas(listObjects[key]);
                                }
                            } else {
                                if (typeof listObjects[key] === "string") {
                                    if (listObjects[key] !== "")
                                        element[i].checked = (listObjects[key].toLowerCase() === "true");
                                } else {
                                    element[i].checked = listObjects[key];
                                }
                            }
                        } else if (element[i].tagName.toLowerCase() == "select") {
                            $("#" + element[i].id).val(listObjects[key]);
                        } else {
                            var currencyUsed = element[i].getAttribute("speed-bind-currency");
                            if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                element[i].innerHTML = $spcontext.replaceSpecialkeysinString(listObjects[key]);
                            } else {
                                element[i].innerHTML = currencyUsed + speedContext.numberWithCommas(listObjects[key]);
                            }
                        }

                    }
                }
            }

            //bind validated fields
            element = document.querySelectorAll("[speed-bind-validate='" + key + "']");
            if (element.length > 0) {
                for (var i = 0; i <= (element.length - 1); i++) {
                    var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                    if (useBindClass) {
                        var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                        if (controlClass != bindClass.toLowerCase()) {
                            useAutoBinding = false;
                        }
                    }
                    if (useAutoBinding) {
                        if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                            if (element[i].type === "radio") {
                                if (listObjects[key] !== "")
                                    $("input:radio[name='" + element[i].name + "'][value='" + listObjects[key] + "']").prop('checked', true);
                            } else if (element[i].type !== "checkbox") {
                                var currencyUsed = element[i].getAttribute("speed-bind-currency");
                                if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                    element[i].value = listObjects[key];
                                } else {
                                    element[i].value = currencyUsed + speedContext.numberWithCommas(listObjects[key]);
                                }
                            } else {
                                if (typeof listObjects[key] === "string") {
                                    if (listObjects[key] !== "")
                                        element[i].checked = (listObjects[key].toLowerCase() === "true");
                                } else {
                                    element[i].checked = listObjects[key];
                                }
                            }
                        } else if (element[i].tagName.toLowerCase() == "select") {
                            $("#" + element[i].id).val(listObjects[key]);
                        } else {
                            var currencyUsed = element[i].getAttribute("speed-bind-currency");
                            if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                element[i].innerHTML = $spcontext.replaceSpecialkeysinString(listObjects[key]);
                            } else {
                                element[i].innerHTML = currencyUsed + speedContext.numberWithCommas(listObjects[key]);
                            }
                        }
                    }
                }
            }

            //bind people fields
            element = document.querySelectorAll("[speed-bind-people='" + key + "']");
            if (element.length > 0) {
                for (var i = 0; i <= (element.length - 1); i++) {
                    var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                    var SPbind = (element[i].getAttribute("speed-bind-topicker") !== null) ? (element[i].getAttribute("speed-bind-topicker").toLowerCase() === "true") : false;
                    if (useBindClass) {
                        var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                        if (controlClass != bindClass.toLowerCase()) {
                            useAutoBinding = false;
                        }
                    }
                    if (useAutoBinding) {
                        var pickerID = element[i].id + '_TopSpan';
                        var pickerDefined = typeof SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID] !== "undefined";
                        var hasEmailProperty = false;
                        if ($.type(listObjects[key]) === "object") {
                            hasEmailProperty = (typeof listObjects[key].email !== "undefined");
                        } else if ($.type(listObjects[key]) === "array") {
                            hasEmailProperty = (typeof listObjects[key][0].email !== "undefined");
                        }

                        if (!SPbind || !pickerDefined) {
                            var hasValidate = (element[i].getAttribute("speed-validate-mode") !== null) ? (element[i].getAttribute("speed-validate-mode").toLowerCase() === "true") : false;
                            if (hasValidate) {
                                element[i].setAttribute("speed-validate-mode", false);
                            }

                            var htmlElement = (element[i].getAttribute("speed-people-element") !== null) ? (element[i].getAttribute("speed-people-element").toLowerCase() === "true") : "p";
                            if ($.type(listObjects[key]) === "object") {
                                element[i].innerHTML = "<" + htmlElement + ">" + listObjects[key].value + "</" + htmlElement + ">";
                            } else if ($.type(listObjects[key]) === "array") {
                                var str = "";
                                for (z = 0; z < listObjects[key].length; z++) {
                                    str += "<" + htmlElement + ">" + listObjects[key][z].value + "; </" + htmlElement + ">";
                                }
                                element[i].innerHTML = str;
                            }
                        } else if (hasEmailProperty) {
                            var pickerObject = SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID];
                            if ($.type(listObjects[key]) === "object") {
                                $spcontext.setPeoplePickerValue(pickerObject, listObjects[key].email);
                            } else if ($.type(listObjects[key]) === "array") {
                                for (z = 0; z < listObjects[key].length; z++) {
                                    $spcontext.setPeoplePickerValue(pickerObject, listObjects[key][z].email);
                                }
                            }
                        }
                    }
                }
            }

            //bind Table
            var element = document.querySelectorAll("[speed-bind-table='" + key + "']");
            for (var i = 0; i <= (element.length - 1); i++) {

                var inputid = element[i].getAttribute("id");
                var parse = (element[i].getAttribute("speed-data-type") == "JSON") ? true : false;
                var useSerialNo = (element[i].getAttribute("speed-serialno") !== null) ? (element[i].getAttribute("speed-serialno").toLowerCase() === "true") : false;
                var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                if (useBindClass) {
                    var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                    if (controlClass != bindClass.toLowerCase()) {
                        useAutoBinding = false;
                    }
                }
                if (useAutoBinding) {
                    var columnValue = [];

                    var colproperties = [];
                    $("#" + inputid + " > thead > tr > th").each(function () {
                        if (this.getAttribute("speed-array-prop") !== null && this.getAttribute("speed-array-groupfunc") !== null) {
                            var propName = this.getAttribute("speed-array-prop");
                            var groupPropName = this.getAttribute("speed-array-groupfunc");
                            colproperties.push({
                                title: propName,
                                execute: (typeof bindExtensions[groupPropName] !== "function") ? defaultExecutor : bindExtensions[groupPropName]
                            });
                        }
                        else if (this.getAttribute("speed-array-prop") !== null) {
                            colproperties.push(this.getAttribute("speed-array-prop"));
                        }

                        if (this.getAttribute("speed-array-func") !== null) {
                            var propName = this.getAttribute("speed-array-func");
                            colproperties.push({
                                title: propName,
                                execute: (typeof bindExtensions[propName] !== "function") ? defaultExecutor : bindExtensions[propName]
                            });
                        }
                    });

                    if (parse) {
                        columnValue = speedContext.JSONToObject(listObjects[key]);
                    } else {
                        columnValue = listObjects[key];
                    }

                    for (var x = 0; x <= (columnValue.length - 1); x++) {
                        if(!$.isEmptyObject(columnValue[x])){
                            var str = "<tr id='spbindtr" + key + x + "'>";
                            if (useSerialNo) str += "<td><label class='speed-serialno'>" + (x + 1) + "</label></td>";
                            for (var y = 0; y < colproperties.length; y++) {
                                if (typeof colproperties[y] == "string") {
                                    str += "<td><label class='speed-table-include'>" + $spcontext.replaceSpecialkeysinString(columnValue[x][colproperties[y]]) + "</label></td>";
                                } else {
                                    str += "<td>" + colproperties[y].execute(x, columnValue[x][colproperties[y].title], columnValue[x]) + "</td>";
                                }
                            }
                            str += "</tr>";
                            $("#" + inputid + " > tbody").append(str);
                        }
                    }
                }

            }

            var element = document.querySelectorAll("[speed-MultiCheck-bind='" + key + "']");
            for (var i = 0; i <= (element.length - 1); i++) {
                var checkValues = speedContext.JSONToObject(listObjects[key]);
                var elementProp = {};
                elementProp.property = element[i].getAttribute("speed-MultiCheck-bind");
                elementProp.blockClass = (typeof element[i].getAttribute("speed-MultiCheck-bind-Class") !== null) ?
                    element[i].getAttribute("speed-MultiCheck-bind-Class") : "";
                elementProp.id = element[i].id;
                var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                if (useAutoBinding) {
                    if (element[i].tagName.toLowerCase() === "div" || element[i].tagName.toLowerCase() === "p" || element[i].tagName.toLowerCase() === "ul") {
                        if ($.type(checkValues) === "array") {
                            $(element[i]).empty();
                            for (var x = 0; x < checkValues.length; x++) {
                                for (var key in checkValues[x]) {
                                    var check = "";
                                    if (checkValues[x][key] === "true" || checkValues[x][key]) {
                                        check = "checked";
                                    }
                                    var str = "<label class='speed-multi-check " + elementProp.blockClass + "'><input id='" + $spcontext.uniqueIdGenerator() + "' " +
                                        "type='checkbox' " + check + " sptype-label='" + key + "'>" + key + "</label>";
                                    $(element[i]).append(str);
                                }
                            }
                        } else {
                            $(element[i]).empty();
                            for (var key in checkValues) {
                                var check = "";
                                if (checkValues[key] === "true" || checkValues[key]) {
                                    check = "checked";
                                }
                                var str = "<label class='speed-multi-check " + elementProp.blockClass + "'><input id='" + $spcontext.uniqueIdGenerator() + "' " +
                                    "type='checkbox' " + check + " sptype-label='" + key + "'>" + key + "</label>";
                                $(element[i]).append(str);
                            }
                        }
                    }
                }
            }

            var element = document.querySelectorAll("[speed-file-meta='" + key + "']");
            if (element.length > 0) {
                for (var i = 0; i <= (element.length - 1); i++) {
                    var property = element[i].getAttribute("speed-file-meta-property");
                    var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
                    if (useBindClass) {
                        var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                        if (controlClass != bindClass.toLowerCase()) {
                            useAutoBinding = false;
                        }
                    }
                    if (useAutoBinding && typeof listObjects[key] !== "undefined") {
                        if (typeof listObjects[key][property] !== "undefined") {
                            if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                                if (element[i].type === "radio") {
                                    if (listObjects[key][property] !== "")
                                        $("input:radio[name='" + element[i].name + "'][value='" + listObjects[key][property] + "']").prop('checked', true);
                                } else if (element[i].type !== "checkbox") {
                                    var currencyUsed = element[i].getAttribute("speed-bind-currency");
                                    if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                        element[i].value = listObjects[key][property];
                                    } else {
                                        element[i].value = currencyUsed + speedContext.numberWithCommas(listObjects[key][property]);
                                    }
                                } else {
                                    if (typeof listObjects[key][property] === "string") {
                                        if (listObjects[key][property] !== "")
                                            element[i].checked = (listObjects[key][property].toLowerCase() === "true");
                                    } else {
                                        element[i].checked = listObjects[key][property];
                                    }
                                }
                            } else if (element[i].tagName.toLowerCase() == "select") {
                                $("#" + element[i].id).val(listObjects[key][property]);
                            } else {
                                var currencyUsed = element[i].getAttribute("speed-bind-currency");
                                if (typeof currencyUsed === "undefined" || currencyUsed == null) {
                                    element[i].innerHTML = $spcontext.replaceSpecialkeysinString(listObjects[key][property]);
                                } else {
                                    element[i].innerHTML = currencyUsed + speedContext.numberWithCommas(listObjects[key][property]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

Speed.prototype.dynamicTable = function (key, config) {
    var speedContext = this;
    config = (typeof config == "undefined") ? {} : config;
    var bindExtensions = (typeof config.bindExtensions == "undefined") ? {} : config.bindExtensions;
    config.listConditions = (typeof config.listConditions == "undefined") ? null : config.listConditions;
    config.afterRowAdded = (typeof config.afterRowAdded == "undefined") ? null : config.afterRowAdded;
    config.afterRowRemoved = (typeof config.afterRowAdded == "undefined") ? null : config.afterRowRemoved;

    speedContext.DataForTable.tablecontentId = config.root;
    speedContext.DataForTable.pagesize = config.pagesize;
    speedContext.DataForTable.paginateSize = config.paginateSize;
    speedContext.DataForTable.modifyTR = (typeof config.modifyTR == "undefined") ? true : config.modifyTR;
    speedContext.DataForTable.trExpression = (typeof config.trExpression == "undefined") ? defaultTR : config.trExpression;
    speedContext.DataForTable.propertiesHandler = (typeof config.bindExtensions == "undefined") ? {} : config.bindExtensions;
    speedContext.DataForTable.includeSN = (typeof config.includeSN === "undefined") ? true : config.includeSN;
    //set context is complusory
    speedContext.DataForTable.context = speedContext;

    function defaultExecutor(columnPassedValue) {
        columnPassedValue = (typeof columnPassedValue == "undefined") ? "" : columnPassedValue;
        return speedContext.replaceSpecialkeysinString(columnPassedValue);
    }

    function defaultTR(pos) {
        return "<tr id='" + key + pos + "'>";
    }
    var element = document.querySelectorAll("[speed-bind-table='" + key + "']");
    for (var i = 0; i <= (element.length - 1); i++) {
        var inputid = element[i].getAttribute("id");
        var useSerialNo = (element[i].getAttribute("speed-serialno") !== null) ? (element[i].getAttribute("speed-serialno").toLowerCase() === "true") : false;
        var useAutoBinding = (element[i].getAttribute("speed-bind-auto") !== null) ? (element[i].getAttribute("speed-bind-auto").toLowerCase() === "true") : true;
        var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
        if (element[i].getAttribute("speed-JSON") === null) {
            element[i].setAttribute("speed-JSON", "false");
        }

        var defaultColumnSetup = {};
        var colproperties = [];
        var controls = [];
        $("#" + inputid + " > thead > tr > th").each(function () {
            if (this.getAttribute("speed-array-prop") !== null) {
                var propName = this.getAttribute("speed-array-prop");
                var exclude = (element[i].getAttribute("speed-exclude-result") !== null) ? (element[i].getAttribute("speed-exclude-result").toLowerCase() === "true") : false;
                if (!exclude) {
                    colproperties.push({
                        title: propName,
                        execute: (typeof bindExtensions[propName] !== "function") ? defaultExecutor : bindExtensions[propName]
                    });
                    controls.push(propName);
                    defaultColumnSetup[propName] = "";
                }
            }
        });

        //table controller
        speedContext.dynamicTableSettings[key] = {
            tabledata: [],
            context: speedContext,
            prop: key,
            elementid: inputid,
            autobind: useAutoBinding,
            serialno: useSerialNo,
            bindClass: controlClass,
            funcDef: colproperties,
            extensionDef: bindExtensions,
            defaultCols: defaultColumnSetup,
            controls: controls,
            conditions: config.listConditions,
            beforeRowAdded: config.beforeRowAdded,
            beforeRowRemoved: config.beforeRowRemoved,
            afterRowAdded: config.afterRowAdded,
            afterRowRemoved: config.afterRowRemoved,
            afterRowDisplayed: config.afterRowDisplayed,
            addRow: function (usetabledata) {
                if (typeof this.beforeRowAdded === "function") {
                    this.beforeRowAdded(this, (this.tabledata.length - 1));
                }
                //saves current row
                usetabledata = (typeof usetabledata == "undefined") ? false : usetabledata;
                if (!usetabledata) {
                    var rowData = speedContext.bind({}, this.bindClass);
                    speedContext.clearValidation();
                    this.tabledata = rowData[this.prop];
                }
                //create a new row
                this.tabledata.push(this.defaultCols);
                this.context.manualTable(this.tabledata, {
                    conditions: this.conditions,
                    controls: this.controls
                });
                //rerender row 
                if (typeof this.afterRowAdded === "function") {
                    this.afterRowAdded(this, (this.tabledata.length - 1));
                }
            },
            deleteRow: function (pos, usetabledata) {
                if (typeof this.beforeRowRemoved === "function") {
                    this.beforeRowRemoved(this);
                }
                //saves current row
                usetabledata = (typeof usetabledata == "undefined") ? false : usetabledata;
                if (!usetabledata) {
                    var rowData = speedContext.bind({}, this.bindClass);
                    speedContext.clearValidation();
                    this.tabledata = rowData[this.prop];
                }
                //remove row 
                this.tabledata.splice(pos, 1);
                //rerender row
                this.context.manualTable(this.tabledata, {
                    conditions: this.conditions,
                    controls: this.controls
                });

                if (typeof this.afterRowRemoved === "function") {
                    this.afterRowRemoved(this);
                }
            },
            clearData: function () {
                speedContext.clearValidation();
                this.tabledata = [];
                this.context.manualTable(this.tabledata);
            },
            displayRows: function (data) {
                this.tabledata = (typeof data !== "undefined") ? data : this.tabledata;
                this.context.manualTable(this.tabledata, {
                    conditions: this.conditions,
                    controls: this.controls
                });

                if (typeof this.afterRowDisplayed === "function") {
                    this.afterRowDisplayed(this);
                }
            },
            saveRows: function (display, usetabledata) {
                var displayTable = (typeof display !== "undefined") ? display : false;
                usetabledata = (typeof usetabledata == "undefined") ? false : usetabledata;
                if (!usetabledata) {
                    var rowData = speedContext.bind({}, this.bindClass);
                    speedContext.clearValidation();
                    this.tabledata = rowData[this.prop];
                }
                if (displayTable) {
                    this.context.manualTable(this.tabledata, {
                        conditions: this.conditions,
                        controls: this.controls
                    });
                }
            }
        }

    }

}

/**
 * The resetBind function resets all speed-bind & speed-bind-validate html controls
 */
Speed.prototype.resetBind = function (bindClass) {
    var speedContext = this;
    var useBindClass = (typeof bindClass === 'string') ? true : false;
    var element = document.querySelectorAll("[speed-bind]");
    if (element.length > 0) {
        for (var i = 0; i <= (element.length - 1); i++) {
            var useAutoBinding = (element[i].getAttribute("speed-bind-reset") !== null) ? (element[i].getAttribute("speed-bind-reset").toLowerCase() === "true") : true;
            if (useBindClass) {
                var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    useAutoBinding = false;
                }
            }
            if (useAutoBinding) {
                if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                    if (element[i].type !== "checkbox") {
                        element[i].value = "";
                    } else {
                        element[i].checked = false;
                    }
                } else if (element[i].tagName.toLowerCase() == "select") {
                    $("#" + element[i].id).val("");
                } else
                    element[i].innerHTML = "";
            }
        }
    }

    //bind validated fields
    element = document.querySelectorAll("[speed-bind-validate]");
    if (element.length > 0) {
        for (var i = 0; i <= (element.length - 1); i++) {
            var useAutoBinding = (element[i].getAttribute("speed-bind-reset") !== null) ? (element[i].getAttribute("speed-bind-reset").toLowerCase() === "true") : true;
            if (useBindClass) {
                var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    useAutoBinding = false;
                }
            }

            if (useAutoBinding) {
                if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                    if (element[i].type !== "checkbox") {
                        element[i].value = "";
                    } else {
                        element[i].checked = false;
                    }
                } else if (element[i].tagName.toLowerCase() == "select") {
                    $("#" + element[i].id).val("");
                } else
                    element[i].innerHTML = "";
            }
        }
    }

    //bind people fields
    element = document.querySelectorAll("[speed-bind-people]");
    if (element.length > 0) {
        for (var i = 0; i <= (element.length - 1); i++) {
            var useAutoBinding = (element[i].getAttribute("speed-bind-reset") !== null) ? (element[i].getAttribute("speed-bind-reset").toLowerCase() === "true") : true;
            //var SPbind = (element[i].getAttribute("speed-bind-topicker") !== null) ? (element[i].getAttribute("speed-bind-topicker").toLowerCase() === "true") : false;
            if (useBindClass) {
                var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
                if (controlClass != bindClass.toLowerCase()) {
                    useAutoBinding = false;
                }
            }
            if (useAutoBinding) {
                var pickerID = element[i].id + '_TopSpan';
                var pickerDefined = typeof SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID] !== "undefined";

                if (!pickerDefined) {
                    element[i].innerHTML = "";
                } else {
                    var pickerObject = SPClientPeoplePicker.SPClientPeoplePickerDict[pickerID];
                    $spcontext.clearPicker(pickerObject);
                }
            }
        }
    }

    var element = document.querySelectorAll("[speed-file-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var elementProp = {};
        elementProp.property = element[i].getAttribute("speed-file-bind");
        elementProp.name = (typeof element[i].getAttribute("speed-file-name") === null) ? elementProp.property : element[i].getAttribute("speed-file-name");
        elementProp.id = element[i].id;
        var useAutoBinding = (element[i].getAttribute("speed-bind-reset") !== null) ? (element[i].getAttribute("speed-bind-reset").toLowerCase() === "true") : true;
        if (useBindClass) {
            var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                useAutoBinding = false;
            }
        }
        if (useAutoBinding) {
            if (element[i].tagName.toLowerCase() === "div" || element[i].tagName.toLowerCase() === "p") {
                $(element[i]).empty();
            } else if (element[i].tagName.toLowerCase() === "input" && element[i].type.toLowerCase() === "file") {
                speedContext.clearFileInput(elementProp.id);
            }
        }
    }

    var element = document.querySelectorAll("[speed-file-validate]");
    for (var i = 0; i <= (element.length - 1); i++) {
        var elementProp = {};
        elementProp.property = element[i].getAttribute("speed-file-validate");
        elementProp.name = (typeof element[i].getAttribute("speed-file-name") === null) ? elementProp.property : element[i].getAttribute("speed-file-name");
        elementProp.id = element[i].id;
        var useAutoBinding = (element[i].getAttribute("speed-bind-reset") !== null) ? (element[i].getAttribute("speed-bind-reset").toLowerCase() === "true") : true;
        if (useBindClass) {
            var controlClass = (element[i].getAttribute("speed-bind-class") === null) ? "" : element[i].getAttribute("speed-bind-class").toLowerCase();
            if (controlClass != bindClass.toLowerCase()) {
                useAutoBinding = false;
            }
        }
        if (useAutoBinding) {
            if (element[i].tagName.toLowerCase() === "input" && element[i].type.toLowerCase() === "file") {
                speedContext.clearFileInput(elementProp.id);
            }
        }
    }
}

Speed.prototype.attachmentLinkBind = function (attachments) {
    if (!$.isEmptyObject(attachments)) {
        var element = document.querySelectorAll("[speed-file-bind]");
        for (var i = 0; i <= (element.length - 1); i++) {
            var elementProp = {};
            elementProp.property = element[i].getAttribute("speed-file-bind");
            elementProp.propertyname = (typeof element[i].getAttribute("speed-property-asname") === null) ? false : element[i].getAttribute("speed-property-asname");
            elementProp.name = (typeof element[i].getAttribute("speed-file-name") === null) ? elementProp.property : element[i].getAttribute("speed-file-name");
            elementProp.clearlabel = (typeof element[i].getAttribute("speed-clear-label") === null) ? true : (element[i].getAttribute("speed-clear-label") === "true");
            elementProp.id = element[i].id;
            elementProp.viewOnly = element[i].hasAttribute("data-view-only"); // 👈 Read the attribute

            if (element[i].tagName.toLowerCase() === "div" || element[i].tagName.toLowerCase() === "p") {
                if ($.type(attachments) === "object") {
                    var attachmentLinks = attachments[elementProp.property];

                    if (typeof attachmentLinks !== "undefined") {
                        if (elementProp.clearlabel) {
                            $(element[i]).empty();
                        }

                        if (typeof attachmentLinks.files !== "undefined") {
                            attachmentLinks = attachmentLinks.files;
                        }

                        for (var x = 0; x < attachmentLinks.length; x++) {

                            // Only build the delete button if NOT viewOnly
                            var deleteBtn = elementProp.viewOnly ? "" :
                                "<a href='#' " +
                                "class='attachment-inline-delete' " +
                                "data-element='" + elementProp.property + "' " +
                                "data-index='" + x + "' " +
                                "data-fileid='" + elementProp.id + "' " +
                                "style='color:red; cursor:pointer; padding-left:5px'>x</a>";

                            if (Object.hasOwn(attachmentLinks[x], 'dataURI')) {
                                $(element[i]).append(
                                    "<p id='" + elementProp.property + "display" + x + "' " +
                                    "class='speed-attachment' style='color:#002c4d'>" +
                                    attachmentLinks[x].dataName +
                                    "<span>" + deleteBtn + "</span></p>"
                                );
                            } else {
                                var displayName = elementProp.name;
                                if (!elementProp.propertyname) {
                                    var splitedLinks = attachmentLinks[x].split("/");
                                    var pos = splitedLinks.length - 1;
                                    displayName = splitedLinks[pos];
                                }

                                $(element[i]).append(
                                    "<p id='" + elementProp.property + "display" + x + "' " +
                                    "class='speed-attachment' style='color:#002c4d'>" +
                                    "<a data-interception='off' target='_blank' href='" + attachmentLinks[x] + "'>" +
                                    displayName +
                                    "</a>" +
                                    "<span>" + deleteBtn + "</span></p>"
                                );
                            }
                        }
                    }
                }
            }
        }
    }
};

//Directly bind list to html select
Speed.prototype.bindListDirectives = function (properties, onFailed, appContext) {
    var spContext = this;
    properties = (typeof properties === "undefined") ? {} : properties;
    var element = document.querySelectorAll("[speed-list-repeat]");

    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    //Array
    var excemptList = (typeof properties["Except"] === 'undefined') ? [] : properties["Except"];
    //string
    var customquery = (typeof properties["SPQuery"] === 'undefined') ? this.camlBuilder() : properties["SPQuery"];
    //boolean
    var setEmptyOption = (typeof properties["EmptyOption"] === 'undefined') ? false : properties["EmptyOption"];

    var columnsGlobal = (typeof properties["Columns"] === 'undefined') ? [] : properties["Columns"];

    var defaultoption = (typeof properties["NoOption"] === 'undefined') ? "" : properties["NoOption"];

    if (element.length > 0) {
        for (var i = 0; i <= (element.length - 1); i++) {
            var columns = columnsGlobal;
            var listName = element[i].getAttribute("speed-list-repeat");
            var MessageValidation = element[i].getAttribute("speed-validate-msg");
            var noDefaultOption = (element[i].getAttribute("speed-no-default") === null) ? false : element[i].getAttribute("speed-no-default").toLowerCase() === "true";
            if (noDefaultOption) {
                setEmptyOption = true;
            }
            else {
                setEmptyOption = (typeof properties["EmptyOption"] === 'undefined') ? false : properties["EmptyOption"];
            }

            if (!spContext.htmlDictionary.hasOwnProperty(listName)) {

                var fullString = "";
                if (element[i].tagName.toLowerCase() === "select" || element[i].tagName.toLowerCase() === "div") {
                    var elementNodeText = element[i].innerHTML.trim();
                    columns = columns.concat(elementNodeText.stringExtractor());
                    fullString = elementNodeText;
                    if (typeof properties[listName] !== "undefined") {
                        if ((typeof properties[listName].onchange !== "undefined")) {
                            element[i].onchange = function (event) {
                                var eventList = document.getElementById(this.id).getAttribute("speed-list-repeat");
                                properties[eventList].onchange(event);
                            }
                        }
                    }
                }

                if (element[i].id == "") {
                    element[i].setAttribute("id", spContext.uniqueIdGenerator());
                }

                spContext.htmlDictionary[listName] = {
                    id: element[i].id,
                    tag: element[i].tagName.toLowerCase(),
                    columnList: columns,
                    text: fullString,
                    autoLoad: true,
                    customFunction: null,
                    run: false,
                    data: [],
                    otherElements: [],
                    callbackTrigger: null,
                    properties: properties
                }

                if (typeof properties[listName] !== "undefined") {
                    spContext.htmlDictionary[listName].autoLoad = (typeof properties[listName].autoLoad == "undefined") ? true : properties[listName].autoLoad;
                    spContext.htmlDictionary[listName].customFunction = (typeof properties[listName].customAfterLoadFunction == "undefined") ? null : properties[listName].customAfterLoadFunction;
                    customquery = (typeof properties[listName].query == "undefined") ? customquery : properties[listName].query;
                    columns = (typeof properties[listName].columns == "undefined") ? columns : columns.concat(properties[listName].columns);
                    spContext.htmlDictionary[listName].setEmptyOption = setEmptyOption;
                }

                var controlsDefinition = {
                    merge: false,
                    data: columns
                }

                //excempt list
                if ($.inArray(listName, excemptList) < 0 && !spContext.htmlDictionary[listName].run) {

                    $("#" + element[i].id).empty();
                    if (typeof properties[listName] !== "undefined") {
                        if (typeof properties[listName].customBeforeLoadFunction != "undefined" && typeof properties[listName].customBeforeLoadFunction == "function") {
                            properties[listName].customBeforeLoadFunction();
                        }
                    }

                    if (!setEmptyOption) {
                        if (defaultoption !== "") {
                            $("#" + element[i].id).append(defaultoption);
                        } else if (MessageValidation == "" || typeof MessageValidation === "undefined" || MessageValidation == null) {
                            $("#" + element[i].id).append("<option value=''>Please select a value</option>");
                        } else {
                            $("#" + element[i].id).append("<option value=''>" + MessageValidation + "</option>");
                        }
                    }

                    spContext.getListToItems(listName, customquery, controlsDefinition, false, null, function (listElements, listNameFromQuery) {
                        spContext.htmlDictionary[listNameFromQuery].data = listElements;
                        if (spContext.htmlDictionary[listNameFromQuery].autoLoad) {

                            for (var z = 0; z < listElements.length; z++) {
                                var valueToAppend = spContext.htmlDictionary[listNameFromQuery].text;
                                for (var propName in listElements[z]) {
                                    var stringToFind = "{{" + propName + "}}";
                                    if (valueToAppend.indexOf(stringToFind) >= 0) {
                                        var regex = new RegExp(stringToFind, "g");
                                        valueToAppend = valueToAppend.replace(regex, listElements[z][propName]);
                                    }
                                }
                                if (spContext.htmlDictionary[listNameFromQuery].tag === "select" || spContext.htmlDictionary[listNameFromQuery].tag === "div") {
                                    $("#" + spContext.htmlDictionary[listNameFromQuery].id).append(valueToAppend);
                                }
                            }
                        }
                        if (typeof spContext.htmlDictionary[listNameFromQuery].customFunction !== "undefined") {
                            if (typeof spContext.htmlDictionary[listNameFromQuery].customFunction !== "undefined" &&
                                spContext.htmlDictionary[listNameFromQuery].customFunction != null &&
                                typeof spContext.htmlDictionary[listNameFromQuery].customFunction === "function") {
                                spContext.htmlDictionary[listNameFromQuery].customFunction(listElements, spContext.htmlDictionary[listName].id);
                            }
                        }
                        spContext.htmlDictionary[listNameFromQuery].run = true;
                        if (typeof spContext.htmlDictionary[listNameFromQuery].callbackTrigger == "function") {
                            spContext.htmlDictionary[listNameFromQuery].callbackTrigger(listNameFromQuery);
                        }

                    }, onFailedCall, appContext);
                }
            } else {
                var fullString = "";
                if (element[i].tagName.toLowerCase() === "select" || element[i].tagName.toLowerCase() === "div") {
                    var elementNodeText = element[i].innerHTML.trim();
                    fullString = elementNodeText;
                    if (typeof properties[listName] !== "undefined") {
                        if ((typeof properties[listName].onchange !== "undefined")) {
                            element[i].onchange = function (event) {
                                var eventList = document.getElementById(this.id).getAttribute("speed-list-repeat");
                                properties[eventList].onchange(event);
                            }
                        }
                    }
                }

                if (typeof properties[listName] !== "undefined") {
                    properties[listName].autoLoad = (typeof properties[listName].autoLoad == "undefined") ? true : properties[listName].autoLoad;
                    properties[listName].customFunction = (typeof properties[listName].customAfterLoadFunction == "undefined") ? null : properties[listName].customAfterLoadFunction;
                    customquery = (typeof properties[listName].query == "undefined") ? customquery : properties[listName].query;
                    defaultoption = (typeof properties[listName].defaultoption == "undefined") ? defaultoption : properties[listName].defaultoption;
                    properties[listName].element = element[i];
                }

                var elementExist = false;
                for (var y = 0; y < spContext.htmlDictionary[listName].otherElements.length; y++) {
                    if (spContext.htmlDictionary[listName].otherElements[y].id === element[i].id) {
                        elementExist = true;
                    }
                }

                if (!elementExist) {
                    spContext.htmlDictionary[listName].otherElements.push({
                        id: element[i].id,
                        fullString: fullString,
                        properties: properties
                    });
                }

                spContext.htmlDictionary[listName].callbackTrigger = function (listNameForAsync) {
                    setTimeout(function () {
                        elementNeedingData = spContext.htmlDictionary[listNameForAsync].otherElements;
                        var properties = spContext.htmlDictionary[listNameForAsync].properties;
                        var setEmptyOption = (typeof properties["EmptyOption"] === 'undefined') ? false : properties["EmptyOption"];

                        for (var z = 0; z < elementNeedingData.length; z++) {
                            // Start working
                            var fullString = elementNeedingData[z].fullString;
                            var MessageValidation = document.getElementById(elementNeedingData[z].id).getAttribute("speed-validate-msg");
                            var tagName = document.getElementById(elementNeedingData[z].id).tagName.toLowerCase();
                            if (spContext.htmlDictionary[listNameForAsync].run) {
                                $("#" + elementNeedingData[z].id).empty();

                                if (typeof properties[listNameForAsync] !== "undefined") {
                                    if (typeof properties[listNameForAsync].customBeforeLoadFunction != "undefined" && typeof properties[refList].customBeforeLoadFunction == "function") {
                                        properties[listNameForAsync].customBeforeLoadFunction();
                                    }

                                    if (typeof properties[listNameForAsync].setEmptyOption != "undefined") {
                                        setEmptyOption = properties[listNameForAsync].setEmptyOption;
                                    }
                                }

                                if (!setEmptyOption) {
                                    if (MessageValidation == "" || typeof MessageValidation === "undefined" || MessageValidation == null) {
                                        $("#" + elementNeedingData[z].id).append("<option value=''>Please select a value</option>");
                                    } else {
                                        $("#" + elementNeedingData[z].id).append("<option value=''>" + MessageValidation + "</option>");
                                    }
                                }

                                var listElements = spContext.htmlDictionary[listNameForAsync].data;
                                if (spContext.htmlDictionary[listNameForAsync].autoLoad) {
                                    for (var k = 0; k < listElements.length; k++) {
                                        var valueToAppend = fullString;
                                        for (var propName in listElements[k]) {
                                            var stringToFind = "{{" + propName + "}}";
                                            if (valueToAppend.indexOf(stringToFind) >= 0) {
                                                var regex = new RegExp(stringToFind, "g");
                                                valueToAppend = valueToAppend.replace(regex, listElements[k][propName]);
                                            }
                                        }

                                        if (tagName === "select" || tagName === "div") {
                                            $("#" + elementNeedingData[z].id).append(valueToAppend);
                                        }
                                    }
                                }
                                if (typeof elementNeedingData[z].properties !== "undefined") {
                                    if (typeof elementNeedingData[z].properties[listNameForAsync].customFunction !== "undefined") {
                                        if (typeof elementNeedingData[z].properties[listNameForAsync].customFunction !== "undefined" && elementNeedingData[z].properties[listNameForAsync].customFunction != null &&
                                            typeof elementNeedingData[z].properties[listNameForAsync].customFunction === "function") {
                                            elementNeedingData[z].properties[listNameForAsync].customFunction(listElements, elementNeedingData[z].id);
                                        }
                                    }
                                }

                            }
                        }
                    }, 1000);
                }

                spContext.htmlDictionary[listName].callbackTrigger(listName);
            }
        }
    }
}

/**
 * The applyValidationEvents function activates the event handlers for the html elements with the speed-bind-validate attribute
 */
Speed.prototype.applyValidationEvents = function () {
    var speedPointContext = this;
    //Speed bind only no validation
    var element = document.querySelectorAll("[speed-bind]");
    for (var i = 0; i <= (element.length - 1); i++) {
        if ($.inArray(element[i].id, speedPointContext.appliedEvents.normal) < 0) {
            var eventOn = (element[i].getAttribute("speed-event-switch") === null) ? true : (element[i].getAttribute("speed-event-switch") === "true");
            if (eventOn) {
                if (element[i].tagName.toLowerCase() == "input" || element[i].tagName.toLowerCase() == "textarea") {
                    if (element[i].type.toLowerCase() !== "checkbox" && element[i].type.toLowerCase() !== "radio") {
                        speedPointContext.appliedEvents.normal.push(element[i].id);
                        element[i].addEventListener("keyup", function () {
                            var functionName = this.getAttribute("speed-event-function");
                            if (functionName !== null && functionName !== "" && functionName !== "undefined") {
                                var parameters = this.getAttribute("speed-event-parameters");
                                window[functionName](this, parameters);
                            }
                        });
                    } else {
                        speedPointContext.appliedEvents.normal.push(element[i].id);
                        element[i].addEventListener("change", function () {
                            var functionName = this.getAttribute("speed-event-function");
                            if (functionName !== null && functionName !== "" && functionName !== "undefined") {
                                var parameters = this.getAttribute("speed-event-parameters");
                                window[functionName](this, parameters);
                            }
                        });
                    }
                }
            }
        }
    }
    //Speed bind and validate html
    var elementValidate = document.querySelectorAll("[speed-bind-validate]");
    for (var i = 0; i <= (elementValidate.length - 1); i++) {
        //var elementEventData = jQuery._data(elementValidate[i], "events");
        //elementEventData = (typeof elementEventData === "undefined") ? {} : elementEventData;
        if ($.inArray(elementValidate[i].id, speedPointContext.appliedEvents.normal) < 0) {
            var eventOn = (elementValidate[i].getAttribute("speed-event-switch") === null) ? true : (elementValidate[i].getAttribute("speed-event-switch") === "true");
            if (eventOn) {
                if (elementValidate[i].tagName.toLowerCase() == "input" || elementValidate[i].tagName.toLowerCase() == "textarea") {
                    if (elementValidate[i].type.toLowerCase() !== "checkbox" && elementValidate[i].type.toLowerCase() !== "radio") {
                        speedPointContext.appliedEvents.normal.push(elementValidate[i].id);
                        elementValidate[i].addEventListener("keyup", function () {
                            var msg = this.getAttribute("speed-validate-msg");
                            var inputtype = this.getAttribute("speed-validate-type");
                            var onValidation = (this.getAttribute("speed-validate-mode") === null) ? true : (this.getAttribute("speed-validate-mode") === "true");
                            var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
                            var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                            var functionName = this.getAttribute("speed-event-function");
                            if (onValidation) {
                                speedPointContext.validateField({
                                    id: this.id,
                                    msg: validationMessage,
                                    extension: validationtype,
                                    addErrors: false,
                                    styleElement: true,
                                    removeHtmlErrors: true,
                                    triggerCallback: function (id, msg) {
                                        $("#" + id).siblings(".temp-speedmsg").remove();
                                        $("<p class='temp-speedmsg'>" + msg + "</p>").insertBefore("#" + id);
                                    }
                                });
                            }

                            if (functionName !== null && functionName !== "" && functionName !== "undefined") {
                                var parameters = this.getAttribute("speed-event-parameters");
                                window[functionName](this, parameters);
                            }
                        });

                    } else if (elementValidate[i].type.toLowerCase() === "checkbox") {
                        speedPointContext.appliedEvents.normal.push(elementValidate[i].id);
                        elementValidate[i].addEventListener("change", function () {
                            var msg = this.getAttribute("speed-validate-msg");
                            var inputtype = this.getAttribute("speed-validate-type");
                            var onValidation = (this.getAttribute("speed-validate-mode") === null) ? true : (this.getAttribute("speed-validate-mode") === "true");
                            var multivalue = (this.getAttribute("data-sptype") === null) ? false : (this.getAttribute("data-sptype").toLowerCase() === "multivalue");
                            var overideValidation = (this.getAttribute("data-sptype-overide-validation") === null) ? true : (this.getAttribute("data-sptype-overide-validation") === "true");
                            if (overideValidation && multivalue) {
                                inputtype = "multivalue";
                            }
                            var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please select a value" : msg;
                            var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                            var functionName = this.getAttribute("speed-event-function");
                            if (onValidation) {
                                speedPointContext.validateField({
                                    id: this.id,
                                    msg: validationMessage,
                                    extension: validationtype,
                                    addErrors: false,
                                    styleElement: true,
                                    removeHtmlErrors: true,
                                });
                            }

                            if (functionName !== null && functionName !== "" && functionName !== "undefined") {
                                var parameters = this.getAttribute("speed-event-parameters");
                                window[functionName](this, parameters);
                            }
                        });
                    } else if (elementValidate[i].type.toLowerCase() === "radio") {
                        speedPointContext.appliedEvents.normal.push(elementValidate[i].id);
                        elementValidate[i].addEventListener("change", function () {
                            var msg = this.getAttribute("speed-validate-msg");
                            var inputtype = this.getAttribute("speed-validate-type");
                            var onValidation = (this.getAttribute("speed-validate-mode") === null) ? true : (this.getAttribute("speed-validate-mode") === "true");
                            var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please select a value" : msg;
                            var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                            var functionName = this.getAttribute("speed-event-function");
                            if (onValidation) {
                                speedPointContext.validateField({
                                    id: this.id,
                                    msg: validationMessage,
                                    extension: validationtype,
                                    addErrors: false,
                                    styleElement: true,
                                    removeHtmlErrors: true,
                                });
                            }

                            if (functionName !== null && functionName !== "" && functionName !== "undefined") {
                                var parameters = this.getAttribute("speed-event-parameters");
                                window[functionName](this, parameters);
                            }
                        });
                    }

                } else if (elementValidate[i].tagName.toLowerCase() == "select") {
                    speedPointContext.appliedEvents.normal.push(elementValidate[i].id);
                    elementValidate[i].addEventListener("change", function () {
                        var msg = this.getAttribute("speed-validate-msg");
                        var inputtype = this.getAttribute("speed-validate-type");
                        var onValidation = (this.getAttribute("speed-validate-mode") === null) ? true : (this.getAttribute("speed-validate-mode") === "true");
                        var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please select a value" : msg;
                        var validationtype = (inputtype == null || inputtype == "" || inputtype == "undefined") ? "" : inputtype;
                        var functionName = this.getAttribute("speed-event-function");
                        if (onValidation) {
                            speedPointContext.validateField({
                                id: this.id,
                                msg: validationMessage,
                                extension: validationtype,
                                addErrors: false,
                                styleElement: true,
                                removeHtmlErrors: true,
                                triggerCallback: function (id, msg) {
                                    $("#" + id).siblings(".temp-speedmsg").remove();
                                    $("<p class='temp-speedmsg'>" + msg + "</p>").insertBefore("#" + id);
                                }
                            });
                        }

                        if (functionName !== null && functionName !== "" && functionName !== "undefined") {
                            var parameters = this.getAttribute("speed-event-parameters");
                            window[functionName](this, parameters);
                        }
                    });
                }
            }
        }
    }

    //speed people validate 
    var elementPeopleValidate = document.querySelectorAll("[speed-bind-people]");
    for (var i = 0; i <= (elementPeopleValidate.length - 1); i++) {
        var eventOn = (elementPeopleValidate[i].getAttribute("speed-event-switch") === null) ? true : (elementPeopleValidate[i].getAttribute("speed-event-switch") === "true");
        var onValidation = (elementPeopleValidate[i].getAttribute("speed-validate-mode") === null) ? false : (elementPeopleValidate[i].getAttribute("speed-validate-mode") === "true");
        if (eventOn && onValidation) {
            var elementId = elementPeopleValidate[i].id;
            var elementNode = document.getElementById(elementId);
            var msg = elementNode.getAttribute("speed-validate-msg");
            var validationMessage = (msg == null || msg == "" || msg == "undefined") ? "Please fill in a value" : msg;
            var pickerID = elementId + '_TopSpan';
            var pickerHashLookupError = elementId + "_Error";

            var elementDictionary = SPClientPeoplePicker.SPClientPeoplePickerDict[(pickerID)];
            speedPointContext.tempCallbacks[pickerHashLookupError] = validationMessage;

            if (elementDictionary.OnValueChangedClientScript === null) {
                elementDictionary.OnValueChangedClientScript = function (elementDivId, userInfo) {
                    var parentId = elementDivId.slice(0, elementDivId.indexOf("_TopSpan"));
                    var HashLookupError = parentId + "_Error";
                    if (userInfo.length === 0) {
                        speedPointContext.validateField({
                            id: elementDivId,
                            staticValue: "",
                            msg: validationMessage,
                            elementType: "text",
                            useElementProperties: false
                        });
                        $("#" + parentId).siblings(".temp-speedmsg").remove();
                        $("<p class='temp-speedmsg'>" + speedPointContext.tempCallbacks[HashLookupError] + "</p>").insertBefore("#" + parentId);
                    } else {
                        $("#" + parentId).siblings(".temp-speedmsg").remove();
                        $("#" + elementDivId).removeClass("speedhtmlerr");
                    }

                    if (typeof speedPointContext.tempCallbacks[elementDivId] !== "undefined") {
                        speedPointContext.tempCallbacks[elementDivId](elementDivId, userInfo);
                    }
                }
            }
        }
    }
}

//========================= Numeric Implementation Section ======================
/**
 * The numericEvents function activates the event handlers for the html elements with the speed-bind-currency attribute
 */
Speed.prototype.numericEvents = function (extendProperties) {
    var extension = (typeof extendProperties == "undefined") ? {} : extendProperties;
    var speedPointContext = this;
    var elementCurrency = document.querySelectorAll("[speed-bind-currency]");
    for (var i = 0; i <= (elementCurrency.length - 1); i++) {
        //var elementEventData = jQuery._data(elementCurrency[i], "events");
        if ($.inArray(elementCurrency[i].id, speedPointContext.appliedEvents.numeric.identifiers) < 0) {

            if (elementCurrency[i].tagName.toLowerCase() == "input" && elementCurrency[i].type.toLowerCase() === "text") {
                speedPointContext.appliedEvents.numeric.identifiers.push(elementCurrency[i].id);
                speedPointContext.appliedEvents.numeric.callbacks[elementCurrency[i].id] = extension;
                elementCurrency[i].addEventListener("keydown", function (evt) {
                    //console.log(evt);
                    var id = this.id;
                    var extension = speedPointContext.appliedEvents.numeric.callbacks[id];
                    var property = (this.getAttribute("speed-bind") === null) ?
                        this.getAttribute("speed-bind-validate") : this.getAttribute("speed-bind");
                    if (!isNaN(evt.key) && evt.key !== " ") {
                        var valueHolder = "";
                        var newpos = evt.target.selectionStart + 1;
                        //condition to check if the positioning of the input will be behind of at a position
                        if (evt.target.selectionStart === this.value.length) {
                            valueHolder = this.value + evt.key;
                            newpos++;
                        } else {
                            valueHolder = this.value.substr(0, evt.target.selectionStart) + evt.key + this.value.substr(evt.target.selectionStart);
                        }

                        var currency = this.getAttribute("speed-bind-currency");
                        var numberValue = speedPointContext.stripCurrencyToNumber(valueHolder, currency);
                        var passState = true;

                        //number condition not to allow more than 2decimal point symbols
                        if (numberValue.toString().indexOf(".") > 0) {
                            var tempStr = numberValue.toString().split(".");
                            var decimalPt = tempStr[1];
                            if (decimalPt.length > 2) {
                                passState = false;
                                evt.preventDefault();
                            }
                        }

                        if (passState) {
                            var tempValue = speedPointContext.numberWithCommas(numberValue);
                            this.value = currency + tempValue;
                            if (typeof extension[property] == "function") {
                                extension[property](numberValue, currency, this);
                            }
                        }
                        evt.preventDefault();
                        evt.target.selectionStart = newpos;
                        evt.target.selectionEnd = evt.target.selectionStart;
                    } else if (speedPointContext.allowedKeys(evt)) {
                        if (evt.key.toLowerCase() === "backspace") {
                            var newpos = evt.target.selectionStart - 1;
                            var valueHolder = this.value.slice(0, newpos) + this.value.slice(newpos + 1);
                            var currency = this.getAttribute("speed-bind-currency");
                            var numberValue = speedPointContext.stripCurrencyToNumber(valueHolder, currency);
                            var tempValue = speedPointContext.numberWithCommas(numberValue);
                            if (tempValue === "")
                                this.value = tempValue;
                            else {
                                this.value = currency + tempValue;
                            }

                            evt.preventDefault();
                            evt.target.selectionStart = newpos;
                            evt.target.selectionEnd = evt.target.selectionStart;
                            if (typeof extension[property] == "function") {
                                extension[property](numberValue, currency, this);
                            }

                        } else if (evt.key == ".") {
                            if (this.value.toString().indexOf(evt.key) > 0) {
                                evt.preventDefault();
                            } else if (evt.target.selectionStart !== this.value.length) {
                                evt.preventDefault();
                            }
                        }
                    } else {
                        evt.preventDefault();
                    }
                });
            }
        }
    }
}
/**
 * The allowedKeys function check the keys allowed for the numeric handler
 */
Speed.prototype.allowedKeys = function (evt) {
    if (evt.key.toLowerCase() === "backspace") {
        return true;
    }

    if (evt.key === ".") {
        return true;
    }

    if (evt.key.toLowerCase() === "arrowleft") {
        return true;
    }

    if (evt.key.toLowerCase() === "arrowright") {
        return true;
    }
}

Speed.prototype.resetEvents = function () {
    this.appliedEvents = {
        normal: [],
        numeric: [],
        attachments: []
    };
}

/**
 * The stripCurrencyToNumber function check the keys allowed for the numeric handler
 */
Speed.prototype.stripCurrencyToNumber = function (value, currency, stringval) {
    var currencyfull = (typeof stringval === "undefined") ? false : stringval;
    var numberValue = value.replace(currency, "");
    numberValue = numberValue.replace(/,/g, "");
    if (currencyfull) numberValue = value;
    return numberValue;
}

/**
 * The numberWithCommas function returns numbers with comma seperation
 * @param {Int} numberToConvert the parameter supplies the number to add the commas to
 * @returns {String} the result output.
 */
Speed.prototype.numberWithCommas = function (numberToConvert) {
    return numberToConvert.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

Speed.prototype.numberToWords = function (numberToConvert) {
    // System for American Numbering 
    var th_val = ['', 'thousand', 'million', 'billion', 'trillion'];
    // System for uncomment this line for Number of English 
    // var th_val = ['','thousand','million', 'milliard','billion'];

    var dg_val = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    var tn_val = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    var tw_val = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function toWordsconver(s) {
        s = s.toString();
        s = s.replace(/[\, ]/g, '');
        if (s != parseFloat(s))
            return 'not a number ';
        var x_val = s.indexOf('.');
        if (x_val == -1)
            x_val = s.length;
        if (x_val > 15)
            return 'too big';
        var n_val = s.split('');
        var str_val = '';
        var sk_val = 0;
        for (var i = 0; i < x_val; i++) {
            if ((x_val - i) % 3 == 2) {
                if (n_val[i] == '1') {
                    str_val += tn_val[Number(n_val[i + 1])] + ' ';
                    i++;
                    sk_val = 1;
                } else if (n_val[i] != 0) {
                    str_val += tw_val[n_val[i] - 2] + ' ';
                    sk_val = 1;
                }
            } else if (n_val[i] != 0) {
                str_val += dg_val[n_val[i]] + ' ';
                if ((x_val - i) % 3 == 0)
                    str_val += 'hundred ';
                sk_val = 1;
            }
            if ((x_val - i) % 3 == 1) {
                if (sk_val)
                    str_val += th_val[(x_val - i - 1) / 3] + ' ';
                sk_val = 0;
            }
        }
        if (x_val != s.length) {
            var y_val = s.length;
            str_val += 'point ';
            for (var i = x_val + 1; i < y_val; i++)
                str_val += dg_val[n_val[i]] + ' ';
        }
        return str_val.replace(/\s+/g, ' ');
    }
    return toWordsconver(numberToConvert);
}

/* ============================== List Section ============================*/

//Latency Test
Speed.prototype.checkConnectionLatency = function (onSuccess, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    const start = performance.now();
    var context = this.initiate();
    var oWebsite = context.get_web();
    context.load(oWebsite);

    context.executeQueryAsync(
        function () {
            const end = performance.now();
            const latency = Math.round(end - start);
            if (latency < 1000) {
                speedContext.latency = 1000;
            }
            else {
                speedContext.latency = latency;
            }

            if (latency > 2000) {
                if (typeof speedContext.latencyHandler === "function") {
                    speedContext.latencyHandler();
                }
            }

            if (typeof onSuccess === "function") {
                onSuccess();
            }
            //console.log('SharePoint Latency:', latency + ' ms');
        },
        function (sender, args) {
            onFailedCall(sender, args, {
                name: "Latency Test",
                context: speedContext,
                err_description: "Latency test, for speed check",
                resource: ""
            });
        }
    );
}

/**
 * The createList function creates a list in the context used
 * @param {object} listProperties this parameter contains all the properties required for the creation of a sharepoint list
 * @param {callback} onSuccess this parameter is the call back function thats called when the list has successfully been created
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the list fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createList = function (listProperties, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    listProperties.users = (typeof listProperties.users === 'undefined') ? [] : listProperties.users;
    listProperties.group = (typeof listProperties.group === 'undefined') ? [] : listProperties.group;

    var context = this.initiate();
    var oWebsite = context.get_web();
    var listCreationInfo = new SP.ListCreationInformation();
    listCreationInfo.set_title(listProperties.title);
    listCreationInfo.set_description(listProperties.description);
    listCreationInfo.set_templateType(listProperties.templateType);
    window.speedGlobal.push(oWebsite.get_lists().add(listCreationInfo));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }

    window.speedGlobal[total].breakRoleInheritance(false, true);
    var allGroups = oWebsite.get_siteGroups();
    context.load(allGroups);
    context.executeQueryAsync(function () {
        var count = allGroups.get_count();
        for (var x = 0; x < listProperties.group.length; x++) {
            for (var i = 0; i <= (parseInt(count) - 1); i++) {
                var grp = allGroups.getItemAtIndex(i);
                if (grp.get_loginName() == listProperties.group[x].name) {
                    var role = SP.RoleDefinitionBindingCollection.newObject(context);
                    role.add(oWebsite.get_roleDefinitions().getByType(listProperties.group[x].role));
                    window.speedGlobal[total].get_roleAssignments().add(grp, role);
                    break;
                }
            }
        }

        for (var x = 0; x < listProperties.users.length; x++) {
            var userobj = oWebsite.ensureUser(listProperties.users[x].login);
            var role = SP.RoleDefinitionBindingCollection.newObject(context);
            role.add(oWebsite.get_roleDefinitions().getByType(listProperties.users[x].role));
            window.speedGlobal[total].get_roleAssignments().add(userobj, role);
        }
        context.load(window.speedGlobal[total]);
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess(listProperties.title, window.speedGlobal[total]);
            }, speedContext.latency);
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "createList",
                context: speedContext,
                err_description: "error creating list",
                resource: listProperties.title
            });
        });
    },
        function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "Get All Groups",
                context: speedContext,
                err_description: "error getting all groups within create list command",
                resource: listProperties.title
            });
        });
}

Speed.prototype.deleteList = function (resourceName, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    var oWebsite = context.get_web();
    var resource = oWebsite.get_lists().getByTitle(resourceName);
    resource.deleteObject();
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess();
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "deleteList",
            context: speedContext,
            err_description: "error deleting resource",
            resource: resourceName
        });
    });
}

Speed.prototype.updateList = function (resourceProperties, callback, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;

    resourceProperties.users = (typeof resourceProperties.users === 'undefined') ? [] : resourceProperties.users;
    resourceProperties.group = (typeof resourceProperties.group === 'undefined') ? [] : resourceProperties.group;
    resourceProperties.clearExistingRoles = (typeof resourceProperties.clearExistingRoles === 'undefined') ? true : resourceProperties.clearExistingRoles;

    var clientContext = this.initiate();
    var oWebsite = clientContext.get_web();
    var requestList = clientContext.get_web().get_lists().getByTitle(resourceProperties.title);
    if (typeof appContext !== 'undefined') {
        clientContext = appContext.initiate();
    }

    window.speedGlobal.push(requestList);
    var total = window.speedGlobal.length;
    total--;
    if (typeof resourceProperties.newtitle !== "undefined") {
        window.speedGlobal[total].set_title(resourceProperties.newtitle);
    }

    if (typeof resourceProperties.description !== "undefined") {
        window.speedGlobal[total].set_description(resourceProperties.description);
    }

    if (resourceProperties.users.length > 0 || resourceProperties.group.length > 0) {
        window.speedGlobal[total].breakRoleInheritance(false, true);

        var allGroups = oWebsite.get_siteGroups();
        clientContext.load(window.speedGlobal[total], 'RoleAssignments');
        clientContext.load(allGroups);
        clientContext.executeQueryAsync(function () {

            if (resourceProperties.clearExistingRoles) {
                while (window.speedGlobal[total].get_roleAssignments().get_count() > 0) {
                    window.speedGlobal[total].get_roleAssignments().itemAt(0).deleteObject();
                }
            }

            var count = allGroups.get_count();
            for (var x = 0; x < resourceProperties.group.length; x++) {
                for (var i = 0; i <= (parseInt(count) - 1); i++) {
                    var grp = allGroups.getItemAtIndex(i);
                    if (grp.get_loginName() == resourceProperties.group[x].name) {
                        var role = SP.RoleDefinitionBindingCollection.newObject(clientContext);
                        role.add(oWebsite.get_roleDefinitions().getByType(resourceProperties.group[x].role));
                        window.speedGlobal[total].get_roleAssignments().add(grp, role);
                        break;
                    }
                }
            }

            for (var x = 0; x < resourceProperties.users.length; x++) {
                var userobj = oWebsite.ensureUser(resourceProperties.users[x].login);
                var role = SP.RoleDefinitionBindingCollection.newObject(clientContext);
                role.add(oWebsite.get_roleDefinitions().getByType(resourceProperties.users[x].role));
                window.speedGlobal[total].get_roleAssignments().add(userobj, role);
            }
            //clientContext.load(window.speedGlobal[total]);
            window.speedGlobal[total].update();
            clientContext.executeQueryAsync(function () {
                setTimeout(function () {
                    callback(window.speedGlobal[total], resourceProperties.title);
                }, speedContext.latency);
            }, function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "updateList",
                    context: speedContext,
                    err_description: "error creating list",
                    resource: resourceProperties.title
                });
            });
        },
            function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "Get All Groups",
                    context: speedContext,
                    err_description: "error getting all groups within update list command",
                    resource: resourceProperties.title
                });
            });
    }
    else {
        // Update the library
        window.speedGlobal[total].update();
        clientContext.executeQueryAsync(function () {
            setTimeout(function () {
                callback(window.speedGlobal[total], resourceProperties.title);
            }, speedContext.latency);
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "updateList",
                context: speedContext,
                err_description: "",
                resource: resourceProperties.title
            });
        });
    }

}

Speed.prototype.getAllListInSite = function (callback, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = typeof onFailed === "undefined" ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var allList = clientContext.get_web().get_lists();
    if (typeof appContext !== "undefined") {
        clientContext = appContext.initiate();
    }
    window.speedGlobal.push(allList);
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total], `Include(RootFolder, Title, Id,BaseType, BaseTemplate, Hidden)`);
    clientContext.executeQueryAsync(
        function () {
            setTimeout(function () {
                callback(window.speedGlobal[total]);
            }, 1000);
        },
        function (sender, args) {
            onFailedCall(sender, args, {
                name: "getAllListInSite",
                context: speedContext,
                err_description: "",
                resource: "",
            });
        }
    );
};

Speed.prototype.SPListDetails = function (listname, callback, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var requestList = clientContext.get_web().get_lists().getByTitle(listname);
    if (typeof appContext !== 'undefined') {
        clientContext = appContext.initiate();
    }
    window.speedGlobal.push(requestList);
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(window.speedGlobal[total], listname);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "SPListDetails",
            context: speedContext,
            err_description: "",
            resource: listname
        });
    });
}

Speed.prototype.getListPermissions = function (listName, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var genericList = context.get_web().get_lists().getByTitle(listName);
    // Get the role assignments for the document library
    var roleAssignments = genericList.get_roleAssignments();

    // Load the role assignments and retrieve the permissions
    context.load(roleAssignments, 'Include(Member, RoleDefinitionBindings)');
    context.executeQueryAsync(function () {
        // Success callback
        // Iterate through the role assignments
        var usersPermssions = {};
        var enumerator = roleAssignments.getEnumerator();
        while (enumerator.moveNext()) {
            var roleAssignment = enumerator.get_current();
            var member = roleAssignment.get_member();
            var bindings = roleAssignment.get_roleDefinitionBindings();
            var login = member.get_loginName();
            // Log the member (user or group) and their permissions
            usersPermssions[login] = [];

            for (var i = 0; i < bindings.get_count(); i++) {
                var roleDefinition = bindings.itemAt(i);
                usersPermssions[login].push(roleDefinition.get_name());
            }
        }

        setTimeout(function () {
            onSuccess(usersPermssions);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getListPermissions",
            context: speedContext,
            err_description: "getting list permission for current user",
            resource: listName
        });
    });
}

//----------------------create fields for a list --------------------------
/**
 * The createColumnInList function creates columns for a specified list in the context used
 * @param {array} arr this parameter contains an array of column property objects used for the creation of the column in a specified list
 * @param {String} listName this parameter specifices the list which the columns are to be created
 * @param {callback} onSuccess this parameter is the call back function thats called when the column has successfully been created
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the list fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createColumnInList = function (arr, listName, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var genericList = context.get_web().get_lists().getByTitle(listName);
    $.each(arr, function (i, itemProperties) {
        window.speedGlobal.push(genericList.get_fields().addFieldAsXml(itemProperties.columnField, itemProperties.addToDefault, itemProperties.fieldOptions));
        var total = window.speedGlobal.length;
        total--;
        var field = context.castTo(window.speedGlobal[total], itemProperties.fieldType);
        if (typeof itemProperties.properties != "undefined") {
            itemProperties.properties(field);
        }
        field.update();
    });
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(genericList);
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(listName);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "createColumnInList",
            context: speedContext,
            err_description: "",
            resource: listName
        });
    });
}

Speed.prototype.getColumnsInList = function (listProperties, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var listName = (typeof listProperties === "string") ? listProperties : listProperties.title;
    var useContentType = (typeof listProperties.useContentType === "undefined") ? false : listProperties.useContentType;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var genericList = context.get_web().get_lists().getByTitle(listName);
    var listFields;
    if (useContentType) {
        listFields = genericList.get_contentTypes()
    }
    else {
        listFields = genericList.get_fields()
    }
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    window.speedGlobal.push(listFields);
    var total = window.speedGlobal.length;
    total--;

    context.load(window.speedGlobal[total]);
    context.executeQueryAsync(function () {
        if (useContentType) {
            setTimeout(function () {
                var contentTypeContext = null;
                var oEnumerator = window.speedGlobal[total].getEnumerator();
                while (oEnumerator.moveNext()) {
                    var oField = oEnumerator.get_current();
                    var title = oField.get_name();
                    if (title.toLowerCase() === listProperties.contentType.toLowerCase()) {
                        contentTypeContext = oField;
                        break;
                    }
                }

                if (contentTypeContext === null) {
                    onFailedCall({
                        name: "getColumnsInList",
                        context: speedContext,
                        err_description: `content type ${listProperties.contentType} not found`,
                        resource: listName
                    });
                }
                else {
                    var fieldLinks = contentTypeContext.get_fieldLinks();
                    context.load(fieldLinks);
                    context.executeQueryAsync(function () {
                        setTimeout(function () {
                            onSuccess(fieldLinks, listProperties);
                        }, speedContext.latency);
                    },
                        function (sender, args) {
                            speedContext.checkConnectionLatency();
                            onFailedCall(sender, args, {
                                name: "getColumnsInList",
                                context: speedContext,
                                err_description: "",
                                resource: listName
                            });
                        });
                }
            }, speedContext.latency);
        }
        else {
            setTimeout(function () {
                onSuccess(window.speedGlobal[total], listProperties);
            }, speedContext.latency);
        }

    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getColumnsInList",
            context: speedContext,
            err_description: "",
            resource: listName
        });
    });
}

Speed.prototype.getContentTypeColumnsInSite = function (contentType, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var siteContentTypes = context.get_web().get_contentTypes();
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    window.speedGlobal.push(siteContentTypes);
    var total = window.speedGlobal.length;
    total--;

    context.load(window.speedGlobal[total]);
    context.executeQueryAsync(function () {
        var targetCT = null;
        var oEnumerator = window.speedGlobal[total].getEnumerator();
        while (oEnumerator.moveNext()) {
            var ct = oEnumerator.get_current();
            if (ct.get_name().toLowerCase() === contentType.toLowerCase()) {          // or ct.get_id().toString()
                targetCT = ct;
                break;
            }
        }

        var fieldLinks = targetCT.get_fieldLinks();
        context.load(fieldLinks);
        context.executeQueryAsync(function () {
            setTimeout(function () {
                var contentTypeFields = {};
                var oEnumerator = fieldLinks.getEnumerator();
                while (oEnumerator.moveNext()) {
                    var oField = oEnumerator.get_current();
                    var title = oField.get_name();
                    contentTypeFields[title] = {
                        column: title,
                        required: oField.get_required(),
                        hidden: oField.get_hidden(),
                    };
                }
                onSuccess(contentTypeFields, contentType);
            }, speedContext.latency);
        },
            function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "getContentTypesInSite",
                    context: speedContext,
                    err_description: "",
                    resource: contentType
                });
            });

    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getContentTypesInSite",
            context: speedContext,
            err_description: "",
            resource: contentType
        });
    });
}

/**
 * The updateItems function updates rows for a specified list in the context used
 * @param {array} arr this parameter contains an array of key-values property objects used for the updating of the row in a specified list by the Id
 * this means Id must be part of the key-value properties to be Passed. key values must match the Columns in the list
 * @param {String} listName this parameter specifices the list which the rows are to be updated
 * @param {callback} onSuccess this parameter is the call back function thats called when the row has successfully been updated
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the row fails to update, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.updateItems = function (arr, listName, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    if (typeof arr != 'undefined') {
        if (arr.length != 0) {
            var context = this.initiate();
            var updateList = context.get_web().get_lists().getByTitle(listName);
            if (typeof appContext !== 'undefined') {
                context = appContext.initiate();
            }
            //context.load(passwordList);
            speedContext.updateItemsTracker(0, arr, updateList, context, listName, onSuccess, onFailedCall);
        }
        else {
            onSuccess();
        }
    }
};

Speed.prototype.updateItemsTracker = function (pos, arr, list, context, listName, onSuccess, onFailedCall) {
    var speedContext = this;
    var itemProperties = arr[pos];
    var item = list.getItemById(itemProperties.ID);
    context.load(item);
    context.executeQueryAsync(function () {
        for (var propName in itemProperties) {
            if (propName.toLowerCase() !== "id") {
                item.set_item(propName, itemProperties[propName]);
            }
        }
        item.update();
        context.executeQueryAsync(function () {
            var newNumber = pos + 1;
            if (newNumber <= (arr.length - 1)) {
                speedContext.updateItemsTracker(newNumber, arr, list, context, listName, onSuccess, onFailedCall);
            }
            else {
                onSuccess();
            }
            //speedContext.updateItemsTracker
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "updateItems",
                context: context,
                err_description: `item with Id ${itemProperties.ID} encountered an error`,
                resource: listName
            });
        });
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "updateItems",
            context: context,
            err_description: `item with Id ${itemProperties.ID} encountered an error`,
            resource: listName
        });
    });
}

/**
 * The createItems function creates rows for a specified list in the context used
 * @param {array} arr this parameter contains an array of key-values property objects used for the creation of the row in a specified list. key values must
 *  match the Columns in the list
 * @param {String} listName this parameter specifices the list which the rows are to be created
 * @param {callback} onSuccess this parameter is the call back function thats called when the row has successfully been created. ListItem information 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the row fails to create, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createItems = function (arr, listProperties, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    //taking account of list creation update using objects
    //check latency to ensure connection is ok before creating items
    speedContext.checkConnectionLatency(function () {
        if (typeof listProperties === "string") {
            var newObj = {};
            newObj.listName = listProperties;
            listProperties = newObj;
        }

        if (typeof arr != 'undefined') {
            if (arr.length != 0) {
                var listitemArr = [];
                var context = speedContext.initiate();
                speedContext.SPGroupDetailsForFolderPermissions({ count: 0, context: context, groups: listProperties.groups }, function () {
                    var reqList = context.get_web().get_lists().getByTitle(listProperties.listName);
                    if (typeof appContext !== 'undefined') {
                        context = appContext.initiate();
                    }
                    $.each(arr, function (i, itemProperties) {
                        var itemCreateInfo = new SP.ListItemCreationInformation();
                        if (typeof listProperties.folderUrl === "string") {
                            itemCreateInfo.set_folderUrl(listProperties.folderUrl);
                        }
                        var listItem = reqList.addItem(itemCreateInfo);
                        for (var propName in itemProperties) {
                            if (propName.toLowerCase() != "id") {
                                listItem.set_item(propName, itemProperties[propName]);
                            }
                        }
                        listItem.update();
                        context.load(listItem);
                        listitemArr.push(listItem);
                    });
                    context.executeQueryAsync(function () {
                        /**/
                        if (listProperties.breakRoleInheritance) {
                            for (var y = 0; y < listitemArr.length; y++) {
                                listitemArr[y].breakRoleInheritance(false, false);
                                var oWebsite = context.get_web();
                                for (var x = 0; x < listProperties.users.length; x++) {
                                    var userobj = oWebsite.ensureUser(listProperties.users[x].login);
                                    var role = SP.RoleDefinitionBindingCollection.newObject(context);
                                    role.add(oWebsite.get_roleDefinitions().getByType(listProperties.users[x].role));
                                    listitemArr[y].get_roleAssignments().add(userobj, role);
                                }

                                //group object already created and set in properties array to make the call faster
                                for (var x = 0; x < listProperties.groups.length; x++) {
                                    var role = SP.RoleDefinitionBindingCollection.newObject(context);
                                    role.add(oWebsite.get_roleDefinitions().getByType(listProperties.groups[x].role));
                                    listitemArr[y].get_roleAssignments().add(speedContext.folderGroups[listProperties.groups[x].name], role);
                                }
                                context.load(listitemArr[y]);
                            }

                            context.executeQueryAsync(function () {
                                setTimeout(function () {
                                    onSuccess(listitemArr);
                                }, speedContext.latency);
                            }, function (sender, args) {
                                speedContext.checkConnectionLatency();
                                onFailedCall(sender, args, {
                                    name: "createItems",
                                    context: speedContext,
                                    err_description: "failed to create roles for items created",
                                    resource: listProperties.listName
                                });
                            });
                        }
                        else {
                            setTimeout(function () {
                                onSuccess(listitemArr);
                            }, speedContext.latency);
                        }

                    }, function (sender, args) {
                        speedContext.checkConnectionLatency();
                        onFailedCall(sender, args, {
                            name: "createItems",
                            context: speedContext,
                            err_description: "",
                            resource: listProperties.listName
                        });
                    });
                })
            }
        }
    });

};
/**
 * The createItems function creates rows for a specified list in the context used
 * @param {String} listname this parameter specifices the list which the row is to be deleted
 * @param {Int} id this parameter specifices the id of the row which is to be deleted
 * @param {callback} onSuccess this parameter is the call back function thats called when the row has successfully been deleted
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the row fails to deleted, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.deleteItem = function (listname, id, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var oList = context.get_web().get_lists().getByTitle(listname);
    window.speedGlobal.push(oList.getItemById(id));
    var total = window.speedGlobal.length;
    total--;
    window.speedGlobal[total].deleteObject();
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(listname);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "deleteItem",
            context: speedContext,
            err_description: "",
            resource: listname
        });
    });
};

Speed.prototype.deleteMultipleItems = function (listname, items, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    speedContext.tempCallbacks[listname] = {
        total: items.length,
        completed: 0
    }
    for (var i = 0; i < items.length; i++) {
        speedContext.deleteItem(listname, items[i].ID, function (listNameReturned) {
            speedContext.tempCallbacks[listNameReturned].completed++;
            if (speedContext.tempCallbacks[listNameReturned].total === speedContext.tempCallbacks[listNameReturned].completed) {
                onSuccess();
            }
        }, onFailedCall, appContext);
    }
};

/**
 * The getItem function retrieve rows for a specified list in the context used
 * @param {String} listName this parameter specifices the list which the rows are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {callback(enumerator)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved, SP.Item object is returned as
 * an argument to the callback function
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getItem = function (listName, caml, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var query = (typeof caml === '' || caml == null) ? this.camlBuilder() : caml;
    var getListBy = (typeof listName === "string") ? "Title" : listName.getBy;
    if (typeof listName === "object") {
        listName = listName.checker;
    }

    var context = this.initiate();
    var oList;
    if (getListBy === "Title") {
        oList = context.get_web().get_lists().getByTitle(listName);
    }
    else {
        oList = context.get_web().get_lists().getById(listName);
    }
    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml(query);
    window.speedGlobal.push(oList.getItems(camlQuery));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(window.speedGlobal[total]);
    window.speedGlobal[total].ListName = listName;
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(window.speedGlobal[total], window.speedGlobal[total].ListName);
            speedContext.asyncManager(window.speedGlobal[total].ListName);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getItem",
            context: speedContext,
            err_description: "",
            resource: listName
        });
    });
}

//* ====================== Helper Functions ========================*//
/**
 * Exports a List to an Object. Only one list item object is returned based on the query
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {callback(Object)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved
 * object is List Column  as key ,and data of the column is the data in the list
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getListToControl = function (listName, caml, controls, onSuccess, onFailed, appContext) {
    var speedContext = this;
    //speedContext.asyncDictionary.expectedcalls++;
    var controlArray = this.getControls();
    var controlsData = [];
    if ($.type(controls) === "object") {
        controlsData = controls.data;
        if (!controls.merge) {
            controlArray = [];
        }
    } else {
        controlsData = controls;
    }
    var controlsToUse = ($.isArray(controlsData)) ? $.merge(controlArray, controlsData) : controlArray;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var oList = context.get_web().get_lists().getByTitle(listName);
    var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml(caml);
    window.speedGlobal.push(oList.getItems(camlQuery));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    var emailChecker = [];
    var peopleColumns = [];
    var objectToReturn = {};
    context.load(window.speedGlobal[total]);
    context.executeQueryAsync(function () {
        var items = window.speedGlobal[total].getItemAtIndex(0);

        if (typeof items !== "undefined") {
            for (var i = 0; i <= (controlsToUse.length - 1); i++) {
                var SPFieldType;
                var nopropinJSEngine = false;
                try {
                    SPFieldType = items.get_item(controlsToUse[i]).__proto__.constructor.__typeName.toLowerCase();
                } catch (ex) {
                    try {
                        nopropinJSEngine = true;
                        SPFieldType = $.type(items.get_item(controlsToUse[i]));
                    } catch (ex) {
                        SPFieldType = "string";
                    }
                }
                if (controlsToUse[i] === "SPItem") {
                    objectToReturn.SPItem = items;
                } else if (SPFieldType.toLowerCase() === "sp.fielduservalue" || SPFieldType.toLowerCase() === "sp.fieldlookupvalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                    var objProp = {};
                    objProp.id = speedContext.checkNull(items.get_item(controlsToUse[i]).get_lookupId());
                    objProp.value = speedContext.checkNull(items.get_item(controlsToUse[i]).get_lookupValue());
                    if (SPFieldType.toLowerCase() === "sp.fielduservalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                        try {
                            objProp.email = items.get_item(controlsToUse[i]).get_email();
                        } catch (e) {
                            objProp.email = "";
                        };

                        if (objProp.email == null && $.inArray(objProp.id, speedContext.usersInEnvironmentByIdArary) < 0) {
                            var userCtx = context.get_web().get_siteUsers().getById(objProp.id);
                            speedContext.usersInEnvironmentByIdArary.push(objProp.id);
                            emailChecker.push(userCtx);
                            peopleColumns.push(controlsToUse[i]);
                        }
                    }
                    objectToReturn[controlsToUse[i]] = objProp;
                } else if (SPFieldType.toLowerCase() === "array") {
                    var multiUser = items.get_item(controlsToUse[i]);
                    var arrayToSave = [];
                    var isUserColumn = false;
                    for (var j = 0; j <= (multiUser.length - 1); j++) {
                        var objectOfUsers = {};
                        objectOfUsers.id = multiUser[j].get_lookupId();
                        objectOfUsers.value = multiUser[j].get_lookupValue();
                        try {
                            objectOfUsers.email = multiUser[j].get_email();
                        } catch (e) {
                            objectOfUsers.email = "";
                        };

                        if (objectOfUsers.email === null && $.inArray(objectOfUsers.id, speedContext.usersInEnvironmentByIdArary) < 0) {
                            isUserColumn = true;
                            var userCtx = context.get_web().get_siteUsers().getById(objectOfUsers.id);
                            speedContext.usersInEnvironmentByIdArary.push(objectOfUsers.id);
                            emailChecker.push(userCtx);
                        }
                        arrayToSave.push(objectOfUsers);
                    }

                    if (isUserColumn) {
                        peopleColumns.push(controlsToUse[i]);
                    }
                    objectToReturn[controlsToUse[i]] = arrayToSave;
                }
                else if (SPFieldType.toLowerCase() === "sp.fieldurlvalue") {
                    objectToReturn[controlsToUse[i]] = speedContext.checkNull(items.get_item(controlsToUse[i]).get_url());
                }
                else {
                    try {
                        items.get_item(controlsToUse[i])
                    }
                    catch (e) {
                        throw `${controlsToUse[i]} doesnt exist in this list (${listName})`;
                    }
                    objectToReturn[controlsToUse[i]] = speedContext.checkNull(items.get_item(controlsToUse[i]));
                }
            }
        }

        if (emailChecker.length === 0) {
            onSuccess(objectToReturn);
            speedContext.asyncManager(listName);
        }
        else {
            getUserInformation(0, function () {
                onSuccess(objectToReturn);
                speedContext.asyncManager(listName);
            });
        }

    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getListToControl",
            context: speedContext,
            err_description: "",
            resource: listName
        });
    });

    function getUserInformation(pos, callback) {
        context.load(emailChecker[pos]);
        context.executeQueryAsync(function () {
            var email = emailChecker[pos].get_email();
            var id = emailChecker[pos].get_id();
            speedContext.usersInEnvironmentById[id] = email;
            if (pos < (emailChecker.length - 1)) {
                pos++;
                getUserInformation(pos, callback);
            }
            else {
                for (var y = 0; y < peopleColumns.length; y++) {
                    if (Array.isArray(objectToReturn[peopleColumns[y]])) {
                        var userdetail = objectToReturn[peopleColumns[y]];
                        for (var z = 0; z < userdetail.length; z++) {
                            if (typeof speedContext.usersInEnvironmentById[userdetail[z].id] !== "undefined") {
                                objectToReturn[peopleColumns[y]][z].email = speedContext.usersInEnvironmentById[userdetail[z]];
                            }
                        }
                    }
                    else {
                        if (typeof speedContext.usersInEnvironmentById[objectToReturn[peopleColumns[y]].id] !== "undefined") {
                            objectToReturn[peopleColumns[y]].email = speedContext.usersInEnvironmentById[objectToReturn[peopleColumns[y]].id];
                        }
                    }
                }
                callback();
            }
        },
            function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "getListToControl(Email Checker)",
                    context: speedContext,
                    err_description: "",
                    resource: listName
                });
            });
    }
}

/**
 * Exports a List to an Array. All list items is returned based on the query
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {function} conditions this parameter includes special conditions for each object properties, condition must return an object 
 * @param {callback} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getListToItems = function (listName, caml, controls, tableonly, conditions, onSuccess, onFailed, appContext) {
    var SpeedContext = this;
    var context = SpeedContext.initiate();
    var emailChecker = [];
    var peopleColumns = [];
    var listItems = [];
    var tableId = typeof controls.tableid !== "" ? controls.tableid : "";
    var controlArray = [];
    var pageControls = typeof controls.useTableControls === "undefined" ? true : controls.useTableControls;
    if (pageControls) {
        controlArray = this.getControls(tableonly, tableId);
    }
    var mergeControls = typeof controls.merge === "undefined" ? true : controls.merge;
    if (mergeControls) {
        var controlsToUse = $.isArray(controls.data) ? $.merge(controlArray, controls.data) : controlArray;
    } else {
        var controlsToUse = controls.data;
    }

    var requestCount = {
        expected: 2,
        requested: 0,
    };

    var ignoreThreshold = typeof controls.ignoreThreshold == "undefined" ? true : controls.ignoreThreshold;

    var thresholdCount = typeof controls.threshold == "undefined" ? 5000 : controls.threshold;
    var feedback = typeof controls.feedback == "undefined" ? null : controls.feedback;
    var onFailedCall = typeof onFailed === "undefined" || onFailed == null ? this.errorHandler : onFailed;
    if (ignoreThreshold) {
        getItemsInList();
    } else {
        SpeedContext.SPListDetails(listName, function (_spListMeta) {
            var count = _spListMeta.get_itemCount();
            requestCount.itemCount = count;
            if (count < thresholdCount) {
                getItemsInList();
            } else {
                listDependenciesForLargeItems();
            }
        });

        var lastItemQuery = [
            { rowlimit: 1, orderby: "ID", ascending: "FALSE", viewScope: "RecursiveAll" }
        ];
        SpeedContext.getItem(listName, SpeedContext.camlBuilder(lastItemQuery), function (itemProperties) {
            var listEnumerator = itemProperties.getEnumerator();
            while (listEnumerator.moveNext()) {
                requestCount.lastItemID = listEnumerator.get_current().get_item("ID");
            }
            listDependenciesForLargeItems();
        });
    }

    function getItemsInList() {
        //the main array is used so that if the list items is greater than the threshold
        //the caml object can be modified
        if (Array.isArray(caml)) {
            caml = SpeedContext.camlBuilder(caml);
        }
        SpeedContext.getItem(
            listName,
            caml,
            function (itemProperties) {
                var listEnumerator = itemProperties.getEnumerator();
                while (listEnumerator.moveNext()) {
                    var objectToReturn = {};
                    for (var i = 0; i <= controlsToUse.length - 1; i++) {
                        var SPFieldType;
                        var nopropinJSEngine = false;
                        try {
                            SPFieldType = listEnumerator.get_current().get_item(controlsToUse[i]).__proto__.constructor.__typeName.toLowerCase();
                        } catch (ex) {
                            try {
                                nopropinJSEngine = true;
                                SPFieldType = $.type(listEnumerator.get_current().get_item(controlsToUse[i]));
                            } catch (ex) {
                                SPFieldType = "string";
                            }
                        }
                        if (SPFieldType.toLowerCase() === "sp.fielduservalue" || SPFieldType.toLowerCase() === "sp.fieldlookupvalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                            var objProp = {};
                            objProp.id = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_lookupId());
                            objProp.value = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_lookupValue());
                            if (SPFieldType.toLowerCase() === "sp.fielduservalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                                try {
                                    objProp.email = listEnumerator.get_current().get_item(controlsToUse[i]).get_email();
                                } catch (e) {
                                    objProp.email = "";
                                }

                                if (objProp.email == null && $.inArray(objProp.id, SpeedContext.usersInEnvironmentByIdArary) < 0) {
                                    var userCtx = context.get_web().get_siteUsers().getById(objProp.id);
                                    SpeedContext.usersInEnvironmentByIdArary.push(objProp.id);
                                    emailChecker.push(userCtx);
                                    peopleColumns.push(controlsToUse[i]);
                                }
                            }

                            if (typeof conditions === "object" && conditions !== null) {
                                if (typeof conditions[controlsToUse[i]] !== "undefined") {
                                    objProp = conditions[controlsToUse[i]](objProp);
                                }
                            }
                            objectToReturn[controlsToUse[i]] = objProp;
                        } else if (SPFieldType.toLowerCase() === "array") {
                            var multiUser = listEnumerator.get_current().get_item(controlsToUse[i]);
                            var arrayToSave = [];
                            var isUserColumn = false;
                            for (var j = 0; j <= multiUser.length - 1; j++) {
                                var objectOfUsers = {};
                                objectOfUsers.id = multiUser[j].get_lookupId();
                                objectOfUsers.value = multiUser[j].get_lookupValue();
                                try {
                                    objectOfUsers.email = multiUser[j].get_email();
                                } catch (e) {
                                    objectOfUsers.email = "";
                                }

                                if (objectOfUsers.email === null && $.inArray(objectOfUsers.id, SpeedContext.usersInEnvironmentByIdArary) < 0) {
                                    isUserColumn = true;
                                    var userCtx = context.get_web().get_siteUsers().getById(objectOfUsers.id);
                                    SpeedContext.usersInEnvironmentByIdArary.push(objectOfUsers.id);
                                    emailChecker.push(userCtx);
                                }
                                arrayToSave.push(objectOfUsers);
                            }

                            if (typeof conditions === "object" && conditions !== null) {
                                if (typeof conditions[controlsToUse[i]] !== "undefined") {
                                    arrayToSave = conditions[controlsToUse[i]](arrayToSave);
                                }
                            }

                            if (isUserColumn) {
                                peopleColumns.push(controlsToUse[i]);
                            }
                            objectToReturn[controlsToUse[i]] = arrayToSave;
                        } else if (SPFieldType.toLowerCase() === "sp.fieldurlvalue") {
                            var columnValue = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_url());
                            if (typeof conditions === "object" && conditions !== null) {
                                if (typeof conditions[controlsToUse[i]] !== "undefined") {
                                    columnValue = conditions[controlsToUse[i]](columnValue);
                                }
                            }
                            objectToReturn[controlsToUse[i]] = columnValue;
                        } else {
                            try {
                                listEnumerator.get_current().get_item(controlsToUse[i]);
                            } catch (e) {
                                throw `${controlsToUse[i]} doesnt exist in this list (${listName})`;
                            }
                            var columnValue = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]));
                            if (typeof conditions === "object" && conditions !== null) {
                                if (typeof conditions[controlsToUse[i]] !== "undefined") {
                                    columnValue = conditions[controlsToUse[i]](columnValue);
                                }
                            }
                            objectToReturn[controlsToUse[i]] = columnValue;
                        }
                    }

                    if (conditions !== null && typeof conditions === "function") {
                        objectToReturn = conditions(objectToReturn);
                    }

                    //includes non empty objects
                    if (!$.isEmptyObject(objectToReturn)) {
                        listItems.push(objectToReturn);
                    }
                }

                if (emailChecker.length === 0) {
                    onSuccess(listItems, itemProperties.ListName);
                }
                else {
                    getUserInformationArray(0, function () {
                        onSuccess(listItems, itemProperties.ListName);
                    });
                }

            },
            onFailedCall,
            appContext
        );
    }

    function listDependenciesForLargeItems() {
        requestCount.requested++;
        if (requestCount.requested === requestCount.expected) {
            var data = {
                controlsToUse: controlsToUse,
                threshold: thresholdCount,
                itemsInList: requestCount.itemCount,
                lastItemID: requestCount.lastItemID,
                conditions: conditions,
                feedback: feedback,
            };
            SpeedContext.getItemsMaxThreshold(listName, caml, data, onSuccess, onFailed, appContext);
        }
    }

    function getUserInformationArray(pos, callback) {
        context.load(emailChecker[pos]);
        context.executeQueryAsync(function () {
            var email = emailChecker[pos].get_email();
            var id = emailChecker[pos].get_id();
            SpeedContext.usersInEnvironmentById[id] = email;
            if (pos < (emailChecker.length - 1)) {
                pos++;
                getUserInformationArray(pos, callback);
            }
            else {
                for (var x = 0; x < listItems.length; x++) {
                    for (var y = 0; y < peopleColumns.length; y++) {
                        if (Array.isArray(listItems[x][peopleColumns[y]])) {
                            var userdetail = listItems[x][peopleColumns[y]];
                            for (var z = 0; z < userdetail.length; z++) {
                                if (typeof SpeedContext.usersInEnvironmentById[userdetail[z].id] !== "undefined") {
                                    listItems[x][peopleColumns[y]][z].email = SpeedContext.usersInEnvironmentById[userdetail[z]];
                                }
                            }
                        }
                        else {
                            if (typeof SpeedContext.usersInEnvironmentById[listItems[x][peopleColumns[y]].id] !== "undefined") {
                                listItems[x][peopleColumns[y]].email = SpeedContext.usersInEnvironmentById[listItems[x][peopleColumns[y]].id];
                            }
                        }
                    }
                }

                callback();
            }
        },
            function (sender, args) {
                SpeedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "getListToItem(Email Checker)",
                    context: SpeedContext,
                    err_description: "",
                    resource: listName
                });
            });
    }
};

/*
Used to retreive data from list that has passed the threshold capacity
*/
Speed.prototype.getItemsMaxThreshold = function (listName, caml, listSearchData, onSuccess, onFailed, appContext) {
    var SpeedContext = this;
    var emailChecker = [];
    var peopleColumns = [];
    var context = SpeedContext.initiate();
    var listItems = [];
    var numberOfIterations = Math.ceil(listSearchData.lastItemID / listSearchData.threshold);
    var conditions = listSearchData.conditions;
    SpeedContext.thresholdListSettings[listName] = {
        //start : 1,
        iterationCalls: 0,
        expectedCalls: numberOfIterations,
        items: [],
        ascending: false,
        orderby: "ID",
    };

    var controlsToUse = listSearchData.controlsToUse;
    makeListCalls(1, numberOfIterations);

    function makeListCalls(pos, iterations) {
        var idVal = pos == 1 ? listSearchData.lastItemID : listSearchData.lastItemID - listSearchData.threshold * (pos - 1);
        var item = {
            operator: "Leq",
            field: "ID",
            type: "Number",
            val: idVal,
        };
        var camlModified = SpeedContext.deferenceObject(caml);
        camlModified[0].rowlimit = listSearchData.threshold;
        camlModified.splice(1, 0, item);
        camlModified[0].orderby = "ID";
        camlModified[0].ascending = "FALSE";
        SpeedContext.thresholdListSettings[listName].ascending = "FALSE";
        SpeedContext.thresholdListSettings[listName].orderby = camlModified[0].orderby;
        SpeedContext.thresholdListSettings[listName].feedback = listSearchData.feedback;

        SpeedContext.getItem(
            listName,
            SpeedContext.camlBuilder(camlModified),
            function (itemProperties) {

                var listEnumerator = itemProperties.getEnumerator();
                while (listEnumerator.moveNext()) {
                    var objectToReturn = {};
                    for (var i = 0; i <= controlsToUse.length - 1; i++) {
                        var SPFieldType;
                        var nopropinJSEngine = false;
                        try {
                            SPFieldType = listEnumerator.get_current().get_item(controlsToUse[i]).__proto__.constructor.__typeName.toLowerCase();
                        } catch (ex) {
                            try {
                                nopropinJSEngine = true;
                                SPFieldType = $.type(listEnumerator.get_current().get_item(controlsToUse[i]));
                            } catch (ex) {
                                SPFieldType = "string";
                            }
                        }
                        if (SPFieldType.toLowerCase() === "sp.fielduservalue" || SPFieldType.toLowerCase() === "sp.fieldlookupvalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                            var objProp = {};
                            objProp.id = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_lookupId());
                            objProp.value = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_lookupValue());
                            if (SPFieldType.toLowerCase() === "sp.fielduservalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                                try {
                                    objProp.email = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]).get_email());
                                } catch (e) {
                                    objProp.email = "";
                                }

                                if (objProp.email == null && $.inArray(objProp.id, SpeedContext.usersInEnvironmentByIdArary) < 0) {
                                    var userCtx = context.get_web().get_siteUsers().getById(objProp.id);
                                    SpeedContext.usersInEnvironmentByIdArary.push(objProp.id);
                                    emailChecker.push(userCtx);
                                    peopleColumns.push(controlsToUse[i]);
                                }
                            }

                            if (typeof conditions === "object" && conditions !== null) {
                                if (typeof conditions[controlsToUse[i]] !== "undefined") {
                                    objProp = conditions[controlsToUse[i]](objProp);
                                }
                            }
                            objectToReturn[controlsToUse[i]] = objProp;
                        } else if (SPFieldType.toLowerCase() === "array") {
                            var multiUser = listEnumerator.get_current().get_item(controlsToUse[i]);
                            var arrayToSave = [];
                            var isUserColumn = false;
                            for (var j = 0; j <= multiUser.length - 1; j++) {
                                var objectOfUsers = {};
                                objectOfUsers.id = multiUser[j].get_lookupId();
                                objectOfUsers.value = multiUser[j].get_lookupValue();
                                try {
                                    objectOfUsers.email = multiUser[j].get_email();
                                } catch (e) {
                                    objectOfUsers.email = "";
                                }

                                if (objectOfUsers.email === null && $.inArray(objectOfUsers.id, SpeedContext.usersInEnvironmentByIdArary) < 0) {
                                    isUserColumn = true;
                                    var userCtx = context.get_web().get_siteUsers().getById(objectOfUsers.id);
                                    SpeedContext.usersInEnvironmentByIdArary.push(objectOfUsers.id);
                                    emailChecker.push(userCtx);
                                }
                                arrayToSave.push(objectOfUsers);
                            }

                            if (typeof conditions === "object" && conditions !== null) {
                                if (typeof conditions[controlsToUse[i]] !== "undefined") {
                                    arrayToSave = conditions[controlsToUse[i]](arrayToSave);
                                }
                            }

                            if (isUserColumn) {
                                peopleColumns.push(controlsToUse[i]);
                            }
                            objectToReturn[controlsToUse[i]] = arrayToSave;
                        } else {
                            try {
                                listEnumerator.get_current().get_item(controlsToUse[i]);
                            } catch (e) {
                                throw `${controlsToUse[i]} doesnt exist in this list (${listName})`;
                            }
                            var columnValue = SpeedContext.checkNull(listEnumerator.get_current().get_item(controlsToUse[i]));
                            if (typeof conditions === "object" && conditions !== null) {
                                if (typeof conditions[controlsToUse[i]] !== "undefined") {
                                    columnValue = conditions[controlsToUse[i]](columnValue);
                                }
                            }
                            objectToReturn[controlsToUse[i]] = columnValue;
                        }
                    }

                    if (conditions !== null && typeof conditions === "function") {
                        objectToReturn = conditions(objectToReturn);
                    }

                    //includes non empty objects
                    if (!$.isEmptyObject(objectToReturn)) {
                        listItems.push(objectToReturn);
                    }
                }

                if (pos <= iterations) {
                    pos++;
                    makeListCalls(pos, iterations);
                }

                checkThresholdCount(listName, listItems, onSuccess);
            },
            onFailed,
            appContext
        );
    }

    function checkThresholdCount(list, items, callback) {
        SpeedContext.thresholdListSettings[list].items = SpeedContext.thresholdListSettings[list].items.concat(items);
        SpeedContext.thresholdListSettings[list].iterationCalls++;
        if (SpeedContext.thresholdListSettings[list].expectedCalls == SpeedContext.thresholdListSettings[list].iterationCalls) {
            var itemsToSend = getUniqueListBy(SpeedContext.thresholdListSettings[list].items, "ID");
            if (SpeedContext.thresholdListSettings[list].ascending) {
                itemsToSend.sort((a, b) => (b[SpeedContext.thresholdListSettings[list].orderby] < a[SpeedContext.thresholdListSettings[list].orderby] ? 1 : -1));
            } else {
                itemsToSend.sort((a, b) => (a[SpeedContext.thresholdListSettings[list].orderby] < b[SpeedContext.thresholdListSettings[list].orderby] ? 1 : -1));
            }

            if (emailChecker.length === 0) {
                callback(itemsToSend);
            }
            else {
                getUserInformationArray(0, function () {
                    callback(itemsToSend);
                });
            }
        } else if (SpeedContext.thresholdListSettings[listName].feedback !== null) {
            //feedback to the user
            var itemsToSend = getUniqueListBy(SpeedContext.thresholdListSettings[list].items, "ID");
            if (SpeedContext.thresholdListSettings[list].ascending) {
                itemsToSend.sort((a, b) => (b[SpeedContext.thresholdListSettings[list].orderby] < a[SpeedContext.thresholdListSettings[list].orderby] ? 1 : -1));
            } else {
                itemsToSend.sort((a, b) => (a[SpeedContext.thresholdListSettings[list].orderby] < b[SpeedContext.thresholdListSettings[list].orderby] ? 1 : -1));
            }
            SpeedContext.thresholdListSettings[listName].feedback(itemsToSend);
        }
    }

    function getUniqueListBy(arr, key) {
        return [...new Map(arr.map((item) => [item[key], item])).values()];
    }

    function getUserInformationArray(pos, callback) {
        context.load(emailChecker[pos]);
        context.executeQueryAsync(function () {
            var email = emailChecker[pos].get_email();
            var id = emailChecker[pos].get_id();
            SpeedContext.usersInEnvironmentById[id] = email;
            if (pos < (emailChecker.length - 1)) {
                pos++;
                getUserInformationArray(pos, callback);
            }
            else {
                for (var x = 0; x < listItems.length; x++) {
                    for (var y = 0; y < peopleColumns.length; y++) {
                        if (Array.isArray(listItems[x][peopleColumns[y]])) {
                            var userdetail = listItems[x][peopleColumns[y]];
                            for (var z = 0; z < userdetail.length; z++) {
                                if (typeof SpeedContext.usersInEnvironmentById[userdetail[z].id] !== "undefined") {
                                    listItems[x][peopleColumns[y]][z].email = SpeedContext.usersInEnvironmentById[userdetail[z]];
                                }
                            }
                        }
                        else {
                            if (typeof SpeedContext.usersInEnvironmentById[listItems[x][peopleColumns[y]].id] !== "undefined") {
                                listItems[x][peopleColumns[y]].email = SpeedContext.usersInEnvironmentById[listItems[x][peopleColumns[y]].id];
                            }
                        }
                    }
                }

                callback();
            }
        },
            function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "getListToItems(Email Checker)",
                    context: speedContext,
                    err_description: "",
                    resource: listName
                });
            });
    }
};

/**
 * Exports a List to an Array. All list items is returned based on the query
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {array} extraFields this parameter includes extra columns to be included into obtain columns on the form. 
 * @param {callback} onSuccess this parameter is the call back function thats called when the list and the columns have been created succssfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.formAppInitialization = function (listInfo, extraFields, callback, onFailed, appContext) {
    var spContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var extraFields = (typeof extraFields === "undefined") ? [] : extraFields;
    var listProperties = {};
    if (typeof listInfo === "string") {
        listProperties.title = listInfo;
        listProperties.templateType = SP.ListTemplateType.genericList;
        listProperties.description = "";
    }
    else {
        listProperties = listInfo;
    }

    listProperties.ignoreError = (typeof listProperties.ignoreError === "undefined") ? true : listProperties.ignoreError;

    var arr = [];
    var columnsMeta = extraFields;
    if (typeof listInfo.includeformfield === 'undefined') {
        arr = spContext.getControls(false, true);
    }
    else {
        if (listInfo.includeformfield) {
            arr = spContext.getControls(false, true);
        }
    }

    if (columnsMeta.length !== 0) {
        arr = arr.concat(columnsMeta);
    }
    spContext.createList(listProperties, function (listName, listDetails) {
        if (typeof listProperties.listFeedback === 'function') {
            listProperties.listFeedback(listDetails);
        }
        //when list is created
        spContext.createColumnInList(arr, listProperties.title, callback, onFailedCall, appContext);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        //if list already exist
        if (listProperties.ignoreError) {
            spContext.createColumnInList(arr, listProperties.title, callback, onFailedCall, appContext);
        }
        else {
            onFailedCall(sender, args, {
                name: "createList",
                context: spContext,
                err_description: "error creating list",
                resource: listProperties.title
            });
        }
    }, appContext);
}

/* ============================== General Section ============================*/
/**
 * The getParameterByName function gets the value of parameters in a query string url
 * @param {String} name parameter name
 * @param {String} url url to check for value
 * @returns {String} the parameter value.
 */
Speed.prototype.getParameterByName = function (name, url) {
    if (!url) url = window.location.href;
    url = url.toLowerCase(); // This is just to avoid case sensitiveness
    name = name.replace(/[\[\]]/g, "\\$&").toLowerCase(); // This is just to avoid case sensitiveness for query parameter name
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * This method checks if a sript already exist in the page, if the script exist true is return else false is returned
 * @param {string} scriptToCheck any part of the script source you want to validate against
 * @return {bool} if the script exist true is returned 
 */
Speed.prototype.checkScriptDuplicates = function (scriptToCheck) {
    var scriptExist = false;
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src) {
            if (scripts[i].src.toLowerCase().indexOf(scriptToCheck.toLowerCase()) >= 0) {
                scriptExist = true;
                break;
            }
        }
    }
    return scriptExist;
}

/**
 * The uniqueIdGenerator function generates a unique id 
 * @returns {String} the result output.
 */
Speed.prototype.uniqueIdGenerator = function () {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now();
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

/**
 * The serverDate function gets the current sharepoint server date time
 * @returns {Date} the result output.
 */
Speed.prototype.serverDate = function (dateObj) {
    var dateToReturn;
    if (window.speedServerOffset !== null) {
        if (dateObj !== null && typeof dateObj !== "undefined") {
            dateToReturn = new Date(dateObj);
        }
        else {
            const serverDate = new Date(new Date().getTime() + window.speedServerOffset);
            dateToReturn = serverDate;
        }
    }
    else {
        if (dateObj !== null && typeof dateObj !== "undefined") {
            dateToReturn = new Date(dateObj);
        }
        else {
            dateToReturn = new Date(new Date().getTime() + _spPageContextInfo.clientServerTimeDelta);
        }
    }
    return dateToReturn;
}

//--------------------------------stringnify date------------------
/**
 * The stringnifyDate function converts a date object to string
 * @param {Object} [obj = {value: this.serverDate}] parameter supplies a settings object for converting to string. by default the server date is used
 * @returns {String} the result output.
 */
Speed.prototype.stringnifyDate = function (obj) {
    var monthDef = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function returnStrMonth(Month) {
        var num = Number(Month) - 1;
        return monthDef[num];
    }
    if (typeof obj == "undefined") obj = {};
    var reconstructDate = (typeof obj.reconstruct === 'undefined') ? false : true;
    if (typeof obj.value === 'undefined' || obj.value == "") {
        var str = this.serverDate();
    } else {
        if (reconstructDate) {
            var format = obj.format;
            var getDelimiter = format.slice(2, 3);
            var dateObj = obj.value.split(getDelimiter);
            var formatObj = obj.format.split(getDelimiter);
            var positions = {}
            for (var i = 0; i < formatObj.length; i++) {
                positions[formatObj[i]] = i;
            }
            //change format to used format mm dd yy
            obj.value = dateObj[positions["mm"]] + getDelimiter + dateObj[positions["dd"]] + getDelimiter + dateObj[positions["yy"]];
        }
        var str = new Date(obj.value);
    }

    if (reconstructDate) {
        obj.format = obj.reconstruct;
    }

    if (typeof obj.includeTime == "undefined") var incTime = false;
    else
        var incTime = obj.includeTime;

    if (typeof obj.monthAsString == "undefined") var monthStr = false;
    else
        var monthStr = obj.monthAsString;

    if (typeof obj.timeSpace == "undefined") obj.timeSpace = true;

    if (typeof obj.dateDefinitions == "undefined") obj.dateDefinitions = false;

    obj.asId = (typeof obj.asId === 'undefined') ? false : obj.asId;

    var year = str.getFullYear();
    var month = str.getMonth() + 1;
    var day = str.getDate();
    var hour = str.getHours();
    var minute = str.getMinutes();
    var second = str.getSeconds();
    if (month.toString().length == 1) {
        month = '0' + month;
    }
    if (day.toString().length == 1) {
        day = '0' + day;
    }
    if (hour.toString().length == 1) {
        var hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        var minute = '0' + minute;
    }
    if (second.toString().length == 1) {
        var second = '0' + second;
    }
    var inval = false;
    if (typeof obj.format != 'undefined') {
        var format = obj.format;
        var dayused = false;
        var monthUsed = false;
        var yearUsed = false;
        var getDelimiter = format.slice(2, 3);
        var firstField = format.slice(0, 2);
        var secondField = format.slice(3, 5);
        var thirdField = format.slice(6, 8);
        //var test = firstField + " : " + secondField + " : " + thirdField + " : " + getDelimiter;
        var finalStr = "";
        if (getDelimiter == "-" || getDelimiter == "/") {
            if (firstField.toLowerCase() == 'dd') {
                finalStr += day;
                dayused = true;
            } else if (firstField.toLowerCase() == 'mm') {
                if (monthStr)
                    finalStr += returnStrMonth(month);
                else
                    finalStr += month;
                monthUsed = true
            } else if (firstField.toLowerCase() == 'yy') {
                finalStr += year;
                yearUsed = true;
            }

            finalStr += getDelimiter;

            if (secondField.toLowerCase() == 'dd' && !dayused) {
                finalStr += day;
                dayused = true;
            } else if (secondField.toLowerCase() == 'mm' && !monthUsed) {
                if (monthStr)
                    finalStr += returnStrMonth(month);
                else
                    finalStr += month;
                monthUsed = true
            } else if (secondField.toLowerCase() == 'yy' && !yearUsed) {
                finalStr += year;
                yearUsed = true;
            }

            finalStr += getDelimiter;

            if (thirdField.toLowerCase() == 'dd' && !dayused) {
                finalStr += day;
                dayused = true;
            } else if (thirdField.toLowerCase() == 'mm' && !monthUsed) {
                if (monthStr)
                    finalStr += returnStrMonth(month);
                else
                    finalStr += month;
                monthUsed = true
            } else if (thirdField.toLowerCase() == 'yy' && !yearUsed) {
                finalStr += year;
                yearUsed = true;
            } else {
                finalStr = "Invalid Format";
                inval = true;
            }
        } else {
            var finalStr = "Invalid Format";
            inval = true;
        }
    } else {
        if (monthStr)
            month = returnStrMonth(month);
        var finalStr = day + '/' + month + '/' + year;
    }

    if (incTime && !inval) {
        if (obj.timeSpace)
            finalStr += '  ' + hour + ':' + minute + ':' + second;
        else
            finalStr += '_' + hour + '-' + minute + '-' + second;
    }

    if (obj.asId && !inval) {
        finalStr = finalStr.replace(/\//g, "");
        finalStr = finalStr.replace(/_/g, "");
        finalStr = finalStr.replace(/:/g, "");
        finalStr = finalStr.replace(/-/g, "");
        finalStr = finalStr.replace(/\s/g, "");
    }

    if (obj.dateDefinitions) {
        finalStr = {
            day: day,
            month: (monthStr) ? returnStrMonth((str.getMonth() + 1)) : month,
            year: year
        };

        if (incTime) {
            finalStr.hour = hour;
            finalStr.minute = minute;
            finalStr.second = second;
        }
    }
    return finalStr;
};

/**
 * The checkNull function checks if a value is null. it returns the value if its not null and and empty string when it is
 * This is used to avoid unexpected result when retrieving values columns that are empty
 * @param {String} val parameter supplies a value to check for null
 * @returns {String} the result output.
 */
Speed.prototype.checkNull = function (val, defaultVal) {
    if (typeof val == "string")
        return val.toString(); //.replace(/(?:\r\n|\r|\n)/g, '<br />');
    else if (val != null) {
        return val;
    } else
        return (typeof defaultVal === "undefined") ? "" : defaultVal;
};

/**
 * The removeHtml function removes html for a string of elements.
 * this method is used for presenting only text values from rich text box columns in sharepoint lists
 * @param {String} val parameter supplies a string
 * @returns {String} the result output.
 */
Speed.prototype.removeHtml = function (val) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = val;
    return tmp.textContent || tmp.innerText || "";
}

/**
 * The redirect function redirects to the specified page
 * @param {String} url the parameter supplies the url to redirect to
 * @param {bool} [opt= true] the parameter sets if the previous url is available in the history or not after redirecting
 */
Speed.prototype.redirect = function (url, opt) {
    var opt = (typeof opt === 'undefined') ? true : opt;
    if (opt)
        window.location = url;
    else
        location.replace(url);
};

/**
 * The xmlToJson function converts xml to json object
 * @param {String} xml the parameter supplies the xml for conversion
 * @returns {json} the json string.
 */
Speed.prototype.xmlToJson = function (xml) {
    // Create the return object
    var obj = {};
    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }
    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = this.xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(this.xmlToJson(item));
            }
        }
    }
    return obj;
}
//------------------------------
/**
 * The clearFileInput function clears file input selection for input of type='file' for all browsers
 * @param {string} elementId the parameter supplies the element ID
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * //the selection for input of id fileid is cleared
 * speedCtx.clearFileInput("fileid");
 */
Speed.prototype.clearFileInput = function (elementid, clearFromDictionary) {
    clearFromDictionary = (typeof clearFromDictionary == "undefined") ? false : clearFromDictionary
    elementNode = document.getElementById(elementid);
    try {
        elementNode.value = null;
    } catch (ex) { }
    if (elementNode.value) {
        elementNode.parentNode.replaceChild(elementNode.cloneNode(true), elementNode);
    }

    if (clearFromDictionary) {
        var elementBindProperty = (elementNode.getAttribute("speed-file-bind") === null) ?
            elementNode.getAttribute("speed-file-validate") : elementNode.getAttribute("speed-file-bind");
        try {
            $spcontext.filesDictionary[elementBindProperty].files = [];
        }
        catch (e) { }
    }
}

/**
 * The differenceBtwDates function get the difference between days hours mins 
 * @param {Date} first date to  make difference from
 * @param {Date} second date to  make difference from
 * @param {String} format for the difference
 * @returns {Int} the difference
 */
Speed.prototype.differenceBtwDates = function (date1, date2, dateFormat) {
    var formatToUse = (typeof dateFormat === "undefined") ? "hour" : dateFormat;
    date1 = (typeof date1 === "undefined" || date1 == "") ? this.serverDate() : date1;
    date2 = (typeof date2 === "undefined" || date2 == "") ? this.serverDate() : date2;
    //var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    var timeDiff = date2.getTime() - date1.getTime();
    var divisor = 1000;
    if (formatToUse === "minutes") {
        divisor *= 60;
    }
    if (formatToUse === "hour") {
        divisor *= (60 * 60);
    }
    if (formatToUse === "day") {
        divisor *= (60 * 60 * 24);
    }

    var diffDays = Math.fround(timeDiff / divisor);

    return diffDays;
}

Speed.prototype.differenceBtwDatesExcludingWeekends = function (date1, date2) {
    var count = 0;
    var curDate = new Date(date1);
    while (Math.floor(this.differenceBtwDates(curDate, date2, 'day')) > 0) {
        var dayOfWeek = curDate.getDay();
        var isWeekend = (dayOfWeek === 6) || (dayOfWeek === 0);
        if (!isWeekend) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};

/**
 * The differenceBtwDates function get the difference between days hours mins 
 * @param {Date} dateT date to add
 * @returns {Date} the new date
 */
Speed.prototype.addDaysToDate = function (dateT, addedTime, format) {
    var dat = new Date(dateT);
    var formatToUse = (typeof format === "undefined") ? "days" : format;
    if (formatToUse === "days")
        dat.setDate(dat.getDate() + addedTime);
    else if (formatToUse === "hours")
        dat = this.serverDate((dat.getTime() + addedTime * 60 * 60000));
    else if (formatToUse === "mins")
        dat = this.serverDate((dat.getTime() + addedTime * 60000));
    return dat;
}

/**
 * GLOBAL METHOD
 * String Object Extension to return a  name which excludes the other name properties  attached with sharepoint
 * @returns String  name of the user, excludes the other name properties  attached with sharepoint
 */
String.prototype.SPNameFromTitle = function () {
    var valueToReturn;
    try {
        valueToReturn = this.toString().split("[")[0];
    } catch (e) {
        valueToReturn = this.toString();
    }
    return valueToReturn;
}
/**
 * GLOBAL METHOD
 * String Object Extension to return a login name which excludes the domain name
 * @returns String login name of the user, excludes the domain name
 */
String.prototype.SPLoginFromFullLogin = function (fullpath) {
    fullpath = (typeof fullpath === "undefined") ? true : fullpath;
    var returnSplit = "";
    if (fullpath) {
        try {
            returnSplit = this.toString().split("\\")[1];
        } catch (e) {
            returnSplit = this.toString();
        }

        if (typeof returnSplit == "undefined") {
            returnSplit = this.toString().split("|")[2];
        }
    } else {
        try {
            returnSplit = this.toString().split("|")[1];
        } catch (e) {
            returnSplit = this.toString();
        }
    }

    return returnSplit;
}
/**
 * GLOBAL METHOD
 * String Object Extension to return a domain name which excludes the login name
 * @returns String Domain name of the organization, excludes the login name
 */
String.prototype.SPDomainFromFullLogin = function () {
    var returnSplit = "";
    try {
        returnSplit = this.toString().split("\\")[0];
    } catch (e) {
        returnSplit = this.toString();
    }
    return returnSplit;
}

/**
 * GLOBAL METHOD
 * String Object Extension to return a domain and login name which excludes the authentication type
 * @returns String Domain and login name of the organization, excludes the authentication type
 */
String.prototype.SPDomainLoginFromFullLogin = function (firsthalf) {
    firsthalf = (typeof firsthalf === "undefined") ? true : firsthalf;
    var returnSplit = "";
    try {
        returnSplit = (firsthalf) ? this.toString().split("|")[0] : this.toString().split("|")[1];
    } catch (e) {
        returnSplit = this.toString();
    }
    return returnSplit;
}

String.prototype.camelSentence = function () {
    var reg = /\b([a-zÃ-Ãº]{3,})/g;
    return this.toString().replace(reg, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

/**
 * The JSONToObject function returns a valid object. this is used to ensure a string is of a proper object type before
 * using JSON.parse on the string.
 * @param {String} val this parameter is the value you want to validate
 * @param {String} [stringType = "Array"] this parameter indicated the object type you are expecting Array or object. 
 * Array is the default if nothing is passed to this parameter.
 * @returns {object} the result output.
 */
Speed.prototype.JSONToObject = function (val, stringType) {
    var returnObj;
    var typeToUse = (typeof stringType == "undefined") ? "array" : stringType;
    if (val == null || val === "") {
        if (typeToUse.toLowerCase() == "array")
            val = "[]";
        else
            val = "{}";
    }

    try {
        returnObj = JSON.parse(val);
    } catch (e) {
        if (typeToUse.toLowerCase() == "array")
            returnObj = [];
        else
            returnObj = {};
    }
    return returnObj;
}

/**
 * The deferenceObject function returns an object that isnt link to another reference object
 * @param {object} referenceObject this parameter is the object to detach the reference to other objects
 * @returns {object} the result output.
 */
Speed.prototype.deferenceObject = function (referenceObject) {
    var value = null;
    try {
        value = structuredClone(referenceObject);
    }
    catch (e) {
        value = JSON.parse(JSON.stringify(referenceObject));
    }
    return value;
}

/**
 * The replaceSpecialkeysinString function returns the string passed while replacing the enter key with break
 * @param {any} stringVal this parameter is the object to detach the reference to other objects
 * @returns {string} the result output.
 */
Speed.prototype.replaceSpecialkeysinString = function (stringVal) {
    if (Object.prototype.toString.call(stringVal) === "[object Date]") {
        return this.stringnifyDate({
            value: stringVal,
            format: "dd/mm/yy"
        });
    }
    else if (typeof stringVal == "number") {
        return stringVal;
    }
    else {
        return stringVal.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }

}

Speed.prototype.truncateByWords = function (text, wordLimit) {
    const words = text.trim().split(/\s+/); // splits by any whitespace
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
};

/**
 * The dataUriFormImageSrc function returns the dataUri of an file from its file path
 * @param {array} url this parameter is the url of the file on the server or solution
 * @param {callback(datauri)} onSuccess this parameter is the call back function thats called when the file is successfully retrieved
 * the datauri is returned as an argument in the success callback 
 * @param {callback(sender)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the file fails to be retrieved
 */
Speed.prototype.dataUriFormFileSrc = function (prop, callBack, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    //get file extension
    if (typeof prop !== "undefined") {
        var url = (typeof prop == "string") ? prop : prop.url;
        var withMetaData = (typeof prop.metaData == "undefined") ? false : prop.metaData;
        var fileNameSplit = url.split(".");
        var fileExt = fileNameSplit.pop();
        var xmlHTTP = new XMLHttpRequest();
        xmlHTTP.open('GET', url, true);
        xmlHTTP.responseType = 'arraybuffer';
        xmlHTTP.onload = function (e) {
            if (this.status === 200) {
                var arr = new Uint8Array(this.response);
                var raw = String.fromCharCode.apply(null, arr);
                var b64 = btoa(raw);
                if (withMetaData) {
                    if (fileExt.toLowerCase() == 'png')
                        var dataURL = "data:image/png;base64," + b64;
                    else if (fileExt.toLowerCase() == 'jpg' || fileExt.toLowerCase() == 'jpeg')
                        var dataURL = "data:image/jpeg;base64," + b64;
                    else
                        var dataURL = "data:image/jpeg;base64," + b64;
                } else {
                    var dataURL = b64;
                }
                callBack(dataURL, prop);
            } else {
                var speedError = {};
                speedError.errorObject = this;
                if (this.responseType === "text" || this.responseType === "")
                    speedError.msg = "status : " + this.status + " , " + this.responseText;
                else
                    speedError.msg = "status : " + this.status;
                onFailedCall(speedError);
            }
        };
        xmlHTTP.send();
    } else {
        var speedError = {
            msg: "no url was passed"
        };
        onFailedCall(speedError);
    }
}

Speed.prototype.getFileDataURIViaRest = function (url, onSuccess, onFailed) {
    var siteUrl = this.initiate().get_url();
    // File server-relative URL
    var fileServerRelativeUrl = url;

    // Construct the file endpoint URL
    var fileEndpointUrl = siteUrl + "/_api/web/GetFileByServerRelativeUrl('" + fileServerRelativeUrl + "')/$value";
    var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.open('GET', fileEndpointUrl, true);
    xmlHTTP.responseType = 'arraybuffer';
    xmlHTTP.onload = function (e) {
        if (this.status === 200) {
            onSuccess(this.response);
        } else {
            var speedError = {};
            speedError.errorObject = this;
            if (this.responseType === "text" || this.responseType === "")
                speedError.msg = "status : " + this.status + " , " + this.responseText;
            else
                speedError.msg = "status : " + this.status;
            onFailedCall(speedError);
        }
    };
    xmlHTTP.send();
}

/** 
 * stringExtractor is used to get the value in between the curly braces
 */
String.prototype.stringExtractor = function () {
    var startCount = 0;
    var noOfObtained = 0;
    var textStartCount = 0;
    var textEndCount = 0;
    var valuesInArray = [];
    var stringToExtract = this.toString();
    for (var x = 0; x < stringToExtract.length; x++) {
        if (stringToExtract[x] === "{" && noOfObtained == 0) {
            startCount = x;
            noOfObtained++;
        } else if (stringToExtract[x] === "{" && noOfObtained == 1 && (startCount + 1) == x) {
            textStartCount = x + 1;
            startCount = 0;
            noOfObtained = 0;
        }

        if (stringToExtract[x] === "}" && noOfObtained == 0) {
            startCount = x;
            noOfObtained++;
        } else if (stringToExtract[x] === "}" && noOfObtained === 1 && (startCount + 1) === x) {
            textEndCount = x - 1;
            var value = stringToExtract.substring(textStartCount, textEndCount);
            textStartCount = 0;
            textEndCount = 0;
            startCount = 0;
            noOfObtained = 0;
            valuesInArray.push(value);
        }
    }
    return valuesInArray;
}

/*============================= Email Section =========================*/
/**
 * The sendSPEmail function sends email to to users sync with sharepoint userprfile (within the organisation)
 * @param {String} from the from address
 * @param {Array} to an array of email address the mail will be sent to 
 * @param {String} body the content of the email
 * @param {Array} [cc= []] the copy mails , an array of strings, these mail address will be in copy
 * @param {String} subject the subject of the mail
 * @param {callBack} callBack this parameter is the call back function thats called when the function is successful or failed
 * @param {String} [relative = "Currentpage url is used"] this parameter changes the location of the SP utility API
 */
Speed.prototype.sendSPEmail = function (mailProperties, callBack, relative) {
    //Get the relative url of the site
    var urlToUSe = (typeof relative === 'undefined') ? true : relative;
    var ccAddress = (typeof mailProperties.cc === "undefined") ? [] : mailProperties.cc;
    var bccAddress = (typeof mailProperties.bcc === "undefined") ? [] : mailProperties.bcc;
    var urlTemplate;
    if (urlToUSe) {
        urlTemplate = this.initiate().get_url();
        urlTemplate = (urlTemplate === "/") ? "" : urlTemplate;
        urlTemplate = urlTemplate + "/_api/SP.Utilities.Utility.SendEmail";
    } else {
        urlTemplate = "/_api/SP.Utilities.Utility.SendEmail";
    }

    var requestDigest = $("#__REQUESTDIGEST").val();
    if (typeof requestDigest === "undefined") {
        requestDigest = window.speedRequestDigest;
    }

    $.ajax({
        contentType: 'application/json',
        url: urlTemplate,
        type: "POST",
        data: JSON.stringify({
            'properties': {
                '__metadata': {
                    'type': 'SP.Utilities.EmailProperties'
                },
                'From': mailProperties.from,
                'To': {
                    'results': mailProperties.to
                },
                'CC': {
                    'results': ccAddress
                },
                'BCC': {
                    'results': bccAddress
                },
                'Body': mailProperties.body,
                'Subject': mailProperties.subject
            }
        }),

        headers: {
            "Accept": "application/json;odata=verbose",
            "content-type": "application/json;odata=verbose",
            "X-RequestDigest": requestDigest
        },
        success: function (data) {
            setTimeout(function () {
                callBack("success", data);
            }, 1500)
        },
        error: function (err) {
            setTimeout(function () {
                callBack("error", err);
            }, 1500)
        }
    });
}

/* ========================== SEARCH ==========================*/
/**
 * The search function retrieve all keywords pass in the share point platform
 * @param {String} keyword this parameter specifices key to search on
 * @param {object} properties this parameter settings for the search
 * @param {callback(enumerator)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved, SP.Item object is returned as
 * an argument to the callback function
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.search = function (keyword, properties, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var properties = (properties == null) ? {} : properties;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();

    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }

    var keywordQuery = new Microsoft.SharePoint.Client.Search.Query.KeywordQuery(context);
    keywordQuery.set_queryText(keyword);
    //keywordQuery.set_rowLimit(10);
    if (typeof properties.sourceid !== "undefined") {
        if (properties.sourceid !== "") {
            keywordQuery.set_sourceId(properties.sourceid);
        }
    }
    var searchExecutor = new Microsoft.SharePoint.Client.Search.Query.SearchExecutor(context);

    var total = window.speedGlobal.length;
    total--;
    window.speedGlobal[total] = searchExecutor.executeQuery(keywordQuery);
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(window.speedGlobal[total]);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "search",
            context: speedContext,
            err_description: "",
            resource: keyword
        });
    });
}

/* ============================== People Picker Section ============================*/
/**
 * The initializePeoplePicker function initializes a people picker
 * @import SP.clientpeoplepicker.js is required
 * @param {String} peoplePickerElementId this parameter specifices the div to be transform to a people picker
 * @param {String} properties this parameter specifices the properties of the people picker
 * @param {callback(SP.ClientPeopleDictionary)} setUpCall this parameter is the call back function thats called once the peoplepicker has been intialized,
 * it returns a SP.ClientPeopleDictionary as an argument
 * object to set eventhandler or retrieve values
 */
Speed.prototype.initializePeoplePicker = function (peoplePickerElementId, properties, setUpCall) {
    var princpalAccount = 'User,DL,SecGroup,SPGroup';
    var width;
    var multipleValues;
    var resolvePrincipalSource;
    var searchPrincipalSource;
    var maxSuggestions;
    var groupId;
    if (typeof properties === 'undefined') {
        resolvePrincipalSource = 15;
        searchPrincipalSource = 15;
        multipleValues = false;
        maxSuggestions = 50;
        width = "280px";
        groupId = "";
    } else {
        width = (typeof properties.width === 'undefined') ? '280px' : properties.width;
        resolvePrincipalSource = (typeof properties.resolvePrincipalSource === 'undefined') ? 15 : properties.resolvePrincipalSource;
        searchPrincipalSource = (typeof properties.searchPrincipalSource === 'undefined') ? 15 : properties.searchPrincipalSource;
        multipleValues = (typeof properties.multipleValues === 'undefined') ? false : properties.multipleValues;
        maxSuggestions = (typeof properties.maxSuggestions === 'undefined') ? 50 : properties.maxSuggestions;
        groupId = (typeof properties.spGroupId === 'undefined') ? "" : properties.spGroupId;
        princpalAccount = (typeof properties.princpalAccount === 'undefined') ? princpalAccount : properties.princpalAccount;
    }
    var schema = {};
    schema['PrincipalAccountType'] = princpalAccount;
    schema['SearchPrincipalSource'] = searchPrincipalSource;
    schema['ResolvePrincipalSource'] = resolvePrincipalSource;
    schema['AllowMultipleValues'] = multipleValues;
    schema['MaximumEntitySuggestions'] = maxSuggestions;
    schema['Width'] = width;

    if (groupId !== "") {
        schema['SharePointGroupID'] = groupId;
    }
    // Render and initialize the picker.
    // Pass the ID of the DOM element that contains the picker, an array of initial
    // PickerEntity objects to set the picker value, and a schema that defines
    // picker properties.
    SPClientPeoplePicker_InitStandaloneControlWrapper(peoplePickerElementId, null, schema);
    if (typeof setUpCall !== "undefined") {
        setTimeout(function () {
            var createdUserObject = this.SPClientPeoplePicker.SPClientPeoplePickerDict[(peoplePickerElementId + '_TopSpan')];
            setUpCall(createdUserObject, peoplePickerElementId);
        }, this.latency);
    }
};

/**
 * The getUsersFromPicker function gets users from a people picker synchronously
 * @import SP.clientpeoplepicker.js is required
 * @param {object} properties this parameter provides the people picker dictionary object to retrieve the users from
 * @param {callback({object})} callback this parameter is the call back function thats called when all the people pickers are created, the People dictionary object
 * is passed back as an argument
 */
Speed.prototype.createMultiplePeoplePicker = function (properties, callback) {
    var speedContext = this;
    var peoplepickerProperties = (typeof properties === "undefined") ? {} : properties;
    var elementPeople = document.querySelectorAll("[speed-bind-people]");
    speedContext.peopleDictionary.count = 0;
    speedContext.peopleDictionary.total = elementPeople.length;
    for (var i = 0; i <= (elementPeople.length - 1); i++) {
        var property = elementPeople[i].getAttribute("speed-bind-people");
        var elementId = elementPeople[i].id;

        var pickerProperties = (typeof peoplepickerProperties["All"] === "undefined") ? {} : peoplepickerProperties["All"];
        pickerProperties = (typeof peoplepickerProperties[property] === "undefined") ? pickerProperties : peoplepickerProperties[property];

        speedContext.initializePeoplePicker(elementId, pickerProperties, function (peoplepickerDictionary, elementId) {
            speedContext.peopleDictionary.count++;
            var elementProperty = document.getElementById(elementId).getAttribute("speed-bind-people");
            speedContext.peopleDictionary.picker[elementProperty] = peoplepickerDictionary;
            if (speedContext.peopleDictionary.count === speedContext.peopleDictionary.total && typeof callback === "function") {
                callback(speedContext.peopleDictionary.picker);
            }
        });
    }
}

/**
 * The getUsersFromPicker function gets users from a people picker synchronously
 * @import SP.clientpeoplepicker.js is required
 * @param {SP.ClientPeopleDictionary} peoplePickerControl this parameter provides the people picker dictionary object to retrieve the users from
 * @returns {Array} returns an array of SP.User objects
 */
Speed.prototype.getUsersFromPicker = function (peoplePickerControl) {
    //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
    var people = peoplePickerControl;
    var userManager = null;
    try {
        userManager = people.GetAllUserInfo();
    } catch (e) { }
    return userManager;
}

/**
 * The getUsersFromPicker function gets users from a people picker Asynchronously
 * @import SP.clientpeoplepicker.js is required
 * @param {SP.ClientPeopleDictionary} peoplePickerControl this parameter provides the people picker dictionary object to retrieve the users from
 * @param {callback([SP.Users])} onSuccess this parameter is the call back function thats called when the users details where retrieved successfully
 * and array of users is returned as an argument in the callback
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getUsersFromPickerAsync = function (peoplePickerControl, onSuccess, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
    var userDetails = [];
    var ctx = this.initiate();
    var people = peoplePickerControl;
    var userManager = people.GetAllUserInfo();
    if (!jQuery.isEmptyObject(userManager)) {
        // Get the first user's ID by using the login name.
        for (var x = 0; x <= (userManager.length - 1); x++) {
            window.speedGlobal.push(ctx.get_web().ensureUser(userManager[x].Key));
            var total = window.speedGlobal.length;
            total--;
            ctx.load(window.speedGlobal[total]);
            userDetails.push(window.speedGlobal[total]);
        }

        ctx.executeQueryAsync(
            setTimeout(function () {
                onSuccess(userDetails);
            }, 1500),
            function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "getUsersFromPickerAsync",
                    context: speedContext,
                    err_description: "",
                    resource: peoplePickerControl
                });
            });
    } else onSuccess(null);
}

/**
 * The setPeoplePickerValue function sets a user value for a people picker
 * @import SP.clientpeoplepicker.js is required
 * @param {SP.ClientPeopleDictionary} peoplePickerObj this parameter provides the people picker dictionary object which the user will be set
 * @param {String} userLogin this parameter provides the login of the user that will be set
 */
Speed.prototype.setPeoplePickerValue = function (peoplePickerObj, userLogin) {
    var peoplePicker = peoplePickerObj;
    var usrObj = {
        'Key': userLogin
    };
    peoplePicker.AddUnresolvedUser(usrObj, true);
}

/**
 * The clearPicker function clears the value of a people picker
 * @import SP.clientpeoplepicker.js is required
 * @param {SP.ClientPeopleDictionary} people this parameter provides the people picker dictionary object which is to be cleared
 */
Speed.prototype.clearPicker = function (people, pos) {
    //var people = this.SPClientPeoplePicker.SPClientPeoplePickerDict['relievee_TopSpan'];
    var userManager = people.GetAllUserInfo();
    if (!jQuery.isEmptyObject(userManager)) {
        if (typeof pos === "undefined") {
            userManager.forEach(function (index) {
                people.DeleteProcessedUser(userManager[index]);
            });
        } else {
            people.DeleteProcessedUser(userManager[userManager[pos]]);
        }
    }
}

//==================================================================================================
/* ============================== User Section Section ============================*/

/**
 * The currentUserDetailsSync function gets current logged in user details synchronously
 * @returns {Object} returns an object with the following properties: id,fullLogin,login,isAdmin,email,title
 */
Speed.prototype.currentUserDetailsSync = function () {
    var CurrentInlineUserProperties = {};
    CurrentInlineUserProperties.id = _spPageContextInfo.userId;
    CurrentInlineUserProperties.fullLogin = _spPageContextInfo.userLoginName;
    CurrentInlineUserProperties.isAdmin = _spPageContextInfo.isSiteAdmin;
    try {
        //this block will work for o365
        CurrentInlineUserProperties.login = _spPageContextInfo.userLoginName;
        CurrentInlineUserProperties.email = _spPageContextInfo.userEmail;
        CurrentInlineUserProperties.title = _spPageContextInfo.userDisplayName;
    } catch (e) {
        //this block will parse is its onPremise
        CurrentInlineUserProperties.login = _spPageContextInfo.userLoginName.SPLoginFromFullLogin();
        CurrentInlineUserProperties.email = null;
        CurrentInlineUserProperties.title = null;
    }

    return CurrentInlineUserProperties;
};

/**
 * The currentUserDetails (Async) function gets current logged in user details Asynchronously
 * @param {callBack(SP.User)} callback this parameter is the call back function when the function is successful. a SP.User object is passed as an argument to this callback
 * this argument can be used to retrieve details of the current user
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */

Speed.prototype.currentUserDetails = function (callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var speedContextMaster = this.initiate();
    var speedUserMaster = speedContextMaster.get_web().get_currentUser();
    speedContextMaster.load(speedUserMaster);
    speedContextMaster.executeQueryAsync(function () {
        if (typeof callback !== 'undefined') {
            callback(speedUserMaster);
        }
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "currentUserDetails",
            context: speedContext,
            err_description: "",
            resource: ""
        });
    });
};

/**
 * The getUserById function gets a user by its ID
 * @param {int} usId the user ID
 * @param {callBack(SP.User)} callback this parameter is the call back function when the function is successful , the callback contains an SP.User object as an argumnet
 * which contains the properties of the user
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getUserById = function (usId, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var ctxt = this.initiate();
    var ccbUser = ctxt.get_web().getUserById(usId);
    //runtime method
    ccbUser.retrieve();
    ctxt.load(ccbUser);
    ctxt.executeQueryAsync(function () {
        //set interval is used because userProperties might not be available is server resources is down
        var intervalCount = 0
        window.speedGlobal.push(intervalCount);
        var total = window.speedGlobal.length;
        total--;

        var intervalRef = setInterval(function () {
            try {
                var userId = ccbUser.get_id();
                clearInterval(intervalRef);
                callback(ccbUser);
            } catch (e) {
                window.speedGlobal[total] = parseInt(window.speedGlobal[total]) + 1;
                if (window.speedGlobal[total] == 10) {
                    clearInterval(intervalRef);
                    throw "User properties is not available check server resources";
                }
            }

        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getUserById",
            context: speedContext,
            err_description: "",
            resource: usId
        });
    });
}

/**
 * The getUserById function gets a user by its login
 * @param {string} loginName the user login name
 * @param {callBack(SP.User)} onSuccess this parameter is the call back function when the function is successful, the callback contains an SP.User object as an argumnet
 * which contains the properties of the user
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getUserByLoginName = function (loginName, onSuccess, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var context = this.initiate();
    var userObject = context.get_web().ensureUser(loginName);
    //runtime method 
    userObject.retrieve();
    context.load(userObject);
    context.executeQueryAsync(function () {
        //set interval is used because userProperties might not be available is server resources is down
        var intervalCount = 0
        window.speedGlobal.push(intervalCount);
        var total = window.speedGlobal.length;
        total--;
        var intervalRef = setInterval(function () {
            try {
                var userId = userObject.get_id();
                clearInterval(intervalRef);
                onSuccess(userObject);
            } catch (e) {
                window.speedGlobal[total] = parseInt(window.speedGlobal[total]) + 1;
                if (window.speedGlobal[total] == 10) {
                    clearInterval(intervalRef);
                    throw "User properties is not available check server resources";
                }
            }
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getUserByLoginName",
            context: speedContext,
            err_description: "",
            resource: loginName
        });
    });
}

Speed.prototype.getMultipleUsersByLoginName = function (users, callback) {
    var speedContext = this;
    var usersReturnObject = {
        pass: [],
        fail: [],
        passEmails: [],
        failEmails: []
    };
    var callbacksCheck = 0;
    if (users.length == 0) {
        callback(users);
    }

    for (var x = 0; x < users.length; x++) {
        speedContext.getUserByLoginName(users[x], function (user) {
            usersReturnObject.pass.push({
                login: user.get_email(),
                title: user.get_title(),
                passed: true
            });
            usersReturnObject.passEmails.push(user.get_email());
            confirmAllResultsReturned();
        }, function (sender, args, req) {
            usersReturnObject.fail.push({
                login: req.resource,
                passed: false
            });
            usersReturnObject.failEmails.push(req.resource);
            confirmAllResultsReturned();
        })
    }

    function confirmAllResultsReturned() {
        callbacksCheck++;
        if (users.length == callbacksCheck) {
            callback(usersReturnObject);
        }
    }
}

/**
 * The getCurrentUserProperties function gets the current user UserProfile Properties
 * @import SP.UserProfiles.js is required
 * @param {callback(SP.UserProfileProperties)} callback this parameter is the call back function when the function is successful, 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getCurrentUserProperties = function (callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
    var userProfileProperties = peopleManager.getMyProperties();
    clientContext.load(userProfileProperties);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(userProfileProperties);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getCurrentUserProperties",
            context: speedContext,
            err_description: "",
            resource: loginName
        });
    });
};

/**
 * The getSpecificUserProperties function gets a user UserProfile Properties by login name
 * @param {String} acctname the login of the user which you want to obtain its properties
 * @param {array} profilePropertyNames an array of strings containing the properties you want to retrieve
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful, it returns and array of values
 * in respect to the properties retrieved.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.getSpecificUserProperties = function (acctname, profilePropertyNames, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var userProfileProperties = [];
    var clientContext = this.initiate();
    //Get Instance of People Manager Class
    var peopleManager = new SP.UserProfiles.PeopleManager(clientContext);
    //Properties to fetch from the User Profile
    //var profilePropertyNames = ["AccountName","WorkEmail"];
    //Domain\Username of the user (If you are on SharePoint Online) 
    //var targetUser = "i:0#.f|membership|teyttetyt@yoursite.onmicrosoft.com";    
    //If you are on On-Premise:
    var targetUser = acctname; //domain\\username
    //Create new instance of UserProfilePropertiesForUser
    var userProfilePropertiesForUser = new SP.UserProfiles.UserProfilePropertiesForUser(clientContext, targetUser, profilePropertyNames);
    userProfileProperties = peopleManager.getUserProfilePropertiesFor(userProfilePropertiesForUser);
    clientContext.load(userProfilePropertiesForUser);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(userProfileProperties);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getSpecificUserProperties",
            context: speedContext,
            err_description: "",
            resource: acctname
        });
    });
}

/**
 * The createSPGroup function creates a sharepoint group
 * @param {String} title the name of the group you want to create
 * @param {object} properties the group properties object
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.createSPGroup = function (title, properties, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var assignDefinition = (typeof properties.assigndefinition !== 'undefined') ? properties.assigndefinition : false;
    var roleDefinition = (typeof properties.roledefinition !== 'undefined') ? properties.roledefinition : null;

    var allowMemberEdit = (typeof properties.allowMembersEdit !== 'undefined') ? properties.allowMembersEdit : false;
    var everyoneView = (typeof properties.everyone !== 'undefined') ? properties.everyone : false;

    var description = (typeof properties.description !== 'undefined') ? properties.description : "";

    var callbackFunction = (typeof properties === 'function') ? properties : callback;
    if (typeof properties === 'function' && typeof callback === 'function') {
        onFailedCall = callback;
    }
    //Load new Site
    var currentCTX = this.initiate();
    var currentWEB = currentCTX.get_web();

    //Get all groups in site
    var groupCollection = currentWEB.get_siteGroups();

    // Create Group information for Group
    var membersGRP = new SP.GroupCreationInformation();
    membersGRP.set_title(title);
    membersGRP.set_description(description);
    //add group
    var oMembersGRP = currentWEB.get_siteGroups().add(membersGRP);

    if (assignDefinition) {
        //Get Role Definition by name (http://msdn.microsoft.com/en-us/library/jj246687.aspx)
        //return SP.RoleDefinition object
        var rdContribute = currentWEB.get_roleDefinitions().getByType(roleDefinition);

        // Create a new RoleDefinitionBindingCollection.
        var collContribute = SP.RoleDefinitionBindingCollection.newObject(currentCTX);

        // Add the role to the collection.
        collContribute.add(rdContribute);

        // Get the RoleAssignmentCollection for the target web.
        var assignments = currentWEB.get_roleAssignments();

        // assign the group to the new RoleDefinitionBindingCollection.
        var roleAssignmentContribute = assignments.add(oMembersGRP, collContribute);
    }
    oMembersGRP.set_allowMembersEditMembership(allowMemberEdit);
    oMembersGRP.set_onlyAllowMembersViewMembership(everyoneView);
    oMembersGRP.update();
    currentCTX.load(oMembersGRP);
    //Execute Query
    currentCTX.executeQueryAsync(function () {
        setTimeout(function () {
            callbackFunction(oMembersGRP);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "createSPGroup",
            context: speedContext,
            err_description: "",
            resource: title
        });
    });
}

Speed.prototype.deleteSPGroup = function (title, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    oGroup = collGroup.getByName(title);

    clientContext.load(collGroup);
    clientContext.load(oGroup);
    // Execute the query to the server.
    clientContext.executeQueryAsync(function () {
        collGroup.removeByLoginName(oGroup.get_loginName());

        clientContext.executeQueryAsync(callback, function (sender, args) {
            clientContext.executeQueryAsync(callback, function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "deleteSPGroup",
                    context: speedContext,
                    err_description: "",
                    resource: title
                });
            });
        })

    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "deleteSPGroup",
            context: speedContext,
            err_description: "",
            resource: title
        });
    });
}


Speed.prototype.addUserToSPGroup = function (logins, group, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    var oGroup = collGroup.getByName(group);
    var oUserCollection = oGroup.get_users();

    for (var i = 0; i < logins.length; i++) {
        // Get user using Logon name
        var oUser = clientContext.get_web().ensureUser(logins[i]);
        // Remove user from the group
        oUserCollection.addUser(oUser);
    }
    // Execute the query to the server.
    clientContext.executeQueryAsync(callback, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "addUserToSPGroup",
            context: speedContext,
            err_description: "",
            resource: group
        });
    });
}

Speed.prototype.removeUserFromSPGroup = function (logins, group, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    var oGroup = collGroup.getByName(group);

    for (var i = 0; i < logins.length; i++) {
        // Get user using Logon name
        var oUser = clientContext.get_web().ensureUser(logins[i]);

        // Remove user from the group
        oGroup.get_users().remove(oUser);
    }

    // Execute the query to the server.
    clientContext.executeQueryAsync(callback, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "removeUserFromSPGroup",
            context: speedContext,
            err_description: "",
            resource: group
        });
    });
}
//-----------reterieve all users in a group 2013+ ----------
/**
 * The retrieveAllUsersInGroup function gets all users in a sharepoint group
 * @param {String} group the group which users will be retrieved from
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful,an array of object with properties title,id,email,login. 
 * the enumeration of the userCollection object has taken care of.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * the argument userArray in the callback contains the following properties:  title,id,email,login
 * speedCtx.retrieveAllUsersInGroup("HR Admin",function(userArray){
 *      //here we are just getting the jobtitle and department of the retrieved user
 *      for(var x = 0; x <= (userArray.length - 1); x++){
 *          var username = userArray[x].title;
 *      }
 * });
 */
Speed.prototype.retrieveAllUsersInGroup = function (group, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var users = [];
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    var oGroup = collGroup.getByName(group);
    window.speedGlobal.push(oGroup.get_users());
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        var userEnumerator = window.speedGlobal[total].getEnumerator();
        while (userEnumerator.moveNext()) {
            var prop = {};
            var oUser = userEnumerator.get_current();
            prop.title = oUser.get_title();
            prop.id = oUser.get_id();
            prop.email = oUser.get_email();
            prop.login = oUser.get_loginName();
            users.push(prop);
        }
        callback(users);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "retrieveAllUsersInGroup",
            context: speedContext,
            err_description: "",
            resource: group
        });
    });
}

/**
 * The retrieveAllUsersInSite function gets all users in a the sharepoint site collection
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful,an array of object with properties title,id,email,login. 
 * the enumeration of the userCollection object has taken care of.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.retrieveAllUsersInSite = function (callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collUsers = clientContext.get_web().get_siteUsers();
    window.speedGlobal.push(collUsers);
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        var users = [];
        var userEnumerator = window.speedGlobal[total].getEnumerator();
        while (userEnumerator.moveNext()) {
            var prop = {};
            var oUser = userEnumerator.get_current();
            prop.title = oUser.get_title();
            prop.id = oUser.get_id();
            prop.email = oUser.get_email();
            prop.login = oUser.get_loginName();
            users.push(prop);
        }

        callback(users);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "retrieveAllUsersInSite",
            context: speedContext,
            err_description: "",
            resource: ""
        });
    });
}


/**
 * The SPGroupDetails function gets information about a sharepoint group
 * @param {String} group the group to obtain details from
 * @param {callback(enumerator)} callback this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.SPGroupDetails = function (group, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    var oGroup = collGroup.getByName(group);
    window.speedGlobal.push(oGroup);
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(window.speedGlobal[total]);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "SPGroupDetails",
            context: speedContext,
            err_description: "",
            resource: group
        });
    });
}

Speed.prototype.SPGroupDetailsForFolderPermissions = function (groupsInformation, callback, onFailed) {
    if (typeof groupsInformation.groups !== "undefined") {
        var speedContext = this;
        var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
        var clientContext = groupsInformation.context;
        var collGroup = groupsInformation.context.get_web().get_siteGroups();
        var oGroup = collGroup.getByName(groupsInformation.groups[groupsInformation.count].name);
        window.speedGlobal.push(oGroup);
        var total = window.speedGlobal.length;
        total--;
        clientContext.load(window.speedGlobal[total]);
        clientContext.executeQueryAsync(function () {
            setTimeout(function () {
                //callback(window.speedGlobal[total]);
                var groupName = window.speedGlobal[total].get_loginName();
                speedContext.folderGroups[groupName] = window.speedGlobal[total];
                if (groupsInformation.count === (groupsInformation.groups.length - 1)) {
                    callback();
                }
                else {
                    groupsInformation.count++;
                    speedContext.SPGroupDetailsForFolderPermissions(groupsInformation, callback, onFailed)
                }

            }, speedContext.latency);
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "SPGroupDetails",
                context: speedContext,
                err_description: "",
                resource: groupsInformation.groups[groupsInformation.count].name
            });
        });
    }
    else {
        callback();
    }

}

//-----------reterieve all users in a group 2013----------
/**
 * The allUsersInGroup function gets all users in a sharepoint group
 * @param {String} group the group which users will be retrieved from
 * @param {callback(enumerator)} callback this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.allUsersInGroup = function (group, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var clientContext = this.initiate();
    var collGroup = clientContext.get_web().get_siteGroups();
    var oGroup = collGroup.getByName(group);
    window.speedGlobal.push(oGroup.get_users());
    var total = window.speedGlobal.length;
    total--;
    clientContext.load(window.speedGlobal[total]);
    clientContext.executeQueryAsync(function () {
        setTimeout(function () {
            callback(window.speedGlobal[total]);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "allUsersInGroup",
            context: speedContext,
            err_description: "",
            resource: group
        });
    });
}

/**
 * The allUsersInGroup2010 function gets all users in a sharepoint group. this function works for sharepoint 2010 but its not an optimized option.
 * @param {String} group the group which users will be retrieved from
 * @param {function} callback this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @returns {array} an array of enumeration of the userCollection object.
 */
Speed.prototype.allUsersInGroup2010 = function (groupName, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var users = [];
    var context = this.initiate();
    var currentWeb = context.get_web();
    var allGroups = currentWeb.get_siteGroups();
    context.load(allGroups);
    context.executeQueryAsync(
        function () {
            var count = allGroups.get_count();
            for (var i = 0; i <= (parseInt(count) - 1); i++) {
                var grp = allGroups.getItemAtIndex(i);
                //provide your group name
                if (grp.get_loginName() == groupName) {
                    window.speedGlobal.push(grp.get_users());
                    var total = window.speedGlobal.length;
                    total--;
                    //load users of the group
                    context.load(window.speedGlobal[total]);
                    context.executeQueryAsync(function () {
                        callback(window.speedGlobal[total]);
                    }, function (sender, args) {
                        speedContext.checkConnectionLatency();
                        onFailedCall(sender, args, {
                            name: "allUsersInGroup2010",
                            context: speedContext,
                            err_description: "error getting users",
                            resource: groupName
                        });
                    });
                }
            }
        },
        function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "allUsersInGroup2010",
                context: speedContext,
                err_description: "error loading webcontext",
                resource: groupName
            });
        });
}

/**
 * The retrieveMultipleGroupUsers function gets all users in different sharepoint group.
 * @param {String} groupCollection the groups which users will be retrieved from. the groups are (;) seperated
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful
 * an array of object with properties title,id,email,login. the enumeration of the userCollection object has taken care of.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.retrieveMultipleGroupUsers = function (groupCollection, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var users = [];
    var globalContextCount = [];
    if (typeof groupCollection !== 'undefined') {
        var groupFound = 0;
        var groupsAvail = false;
        var groupNames = (typeof groupCollection === "string") ? groupCollection.split(";") : groupCollection;
        for (var i = 0; i <= (groupNames.length - 1); i++) {
            groupsAvail = true;
            var clientContext = this.initiate();
            var collGroup = clientContext.get_web().get_siteGroups();
            var oGroup = collGroup.getByName(groupNames[i]);
            window.speedGlobal.push(oGroup.get_users());
            var total = window.speedGlobal.length;
            total--;
            globalContextCount.push(total);
            clientContext.load(window.speedGlobal[total]);
            clientContext.executeQueryAsync(function () {
                setTimeout(function () {
                    var totalToUse = globalContextCount[groupFound];
                    groupFound++;
                    var userEnumerator = window.speedGlobal[totalToUse].getEnumerator();
                    while (userEnumerator.moveNext()) {
                        var prop = {};
                        var oUser = userEnumerator.get_current();
                        prop.title = oUser.get_title();
                        prop.id = oUser.get_id();
                        prop.email = oUser.get_email();
                        prop.login = oUser.get_loginName();
                        var userExist = false
                        for (var y = 0; y <= (users.length - 1); y++) {
                            if (users[y].logon.toLowerCase() == prop.logon.toLowerCase()) {
                                userExist = true;
                                break;
                            }
                        }
                        if (!userExist) {
                            users.push(prop);
                        }
                    }
                    if (groupFound == groupNames.length)
                        callback(users);
                }, 1500);
            }, function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "retrieveMultipleGroupUsers",
                    context: speedContext,
                    err_description: "",
                    resource: groupNames
                });
            });
        }
        //callback called if no group was foud
        if (groupFound == 0 && !groupsAvail) {
            callback(users);
        }
    } else {
        throw "group collection is undefined";
    }
}

/**
 * The isUserMemberOfGroup function checks if a user belongs to a set of groups (";") seperated. it also returns all users in different sharepoint group. 
 * @param {String} groupCollection the groups which users will be retrieved from. the groups are (;) seperated
 * @param {object} userDetails this object contains properties that will be used for check only one of the following properties are needed
 * (id,email,login ) for the check while the returnCollection property (type bool) indicates if the users should be returned as the second argument, if false an empty object is returned
 * @param {callback(boolean,Object)} callback this parameter is the call back function when the function is successful.The following arguments are returned
 * Boolean value ,true means user belongs to the group collection, false means user doesnt belong to the group collection 
 * an object contains array of users in each group in the group collection, the Array contains properties title,id,email,login. the enumeration of the userCollection object has taken care of.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * isUser is a boolean
 * the argument userArray in the callback contains the following properties:  title,id,email,login
 * speedCtx.isUserMemberOfGroup("HR Admin;Legal",{id : 24 , returnCollection : true},function(isUser,userArray){
 *      for(var x = 0; x <= (userArray["HR Admin].length - 1); x++){
 *          var username = userArray["HR Admin][x].title;
 *      }
 * });
 */
Speed.prototype.isUserMemberOfGroup = function (groupCollection, userDetails, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var returnUsers = (typeof userDetails.returnCollection === "undefined") ? true : userDetails.returnCollection;
    var emailCollection = (typeof userDetails.groupEmails === "undefined") ? false : userDetails.groupEmails;
    var boolVal = false;
    var globalContextCount = [];
    var usersArray = {};
    if (typeof groupCollection !== 'undefined') {
        var groupFound = 0;
        var groupsAvail = false;
        var groupNames = (typeof groupCollection === "string") ? groupCollection.split(";") : groupCollection;
        var clientContext = this.initiate();
        var collGroup = clientContext.get_web().get_siteGroups();
        for (var i = 0; i <= (groupNames.length - 1); i++) {
            if (boolVal) {
                break;
            }
            usersArray[groupNames[i]] = {};
            usersArray[groupNames[i]].belongs = false;
            usersArray[groupNames[i]].users = [];
            usersArray[groupNames[i]].emails = [];
            groupsAvail = true;
            var oGroup = collGroup.getByName(groupNames[i]);
            window.speedGlobal.push(oGroup.get_users());
            var total = window.speedGlobal.length;
            total--;
            globalContextCount.push(total);
            clientContext.load(window.speedGlobal[total]);
            clientContext.executeQueryAsync(function () {
                //========================
                setTimeout(function () {
                    var total = window.speedGlobal.length;
                    total--;
                    var totalToUse = globalContextCount[groupFound];

                    var userEnumerator = window.speedGlobal[totalToUse].getEnumerator();
                    while (userEnumerator.moveNext()) {
                        var prop = {};
                        var oUser = userEnumerator.get_current();
                        prop.title = oUser.get_title();
                        prop.id = oUser.get_id();
                        prop.email = oUser.get_email();
                        prop.loginFull = oUser.get_loginName();
                        prop.login = prop.loginFull.SPLoginFromFullLogin();
                        if (typeof userDetails.login !== "undefined") {
                            if (prop.login.toLowerCase() === userDetails.login.toLowerCase()) {
                                boolVal = true;
                                usersArray[groupNames[groupFound]].belongs = true;
                                if (!returnUsers)
                                    break;
                            }
                        } else if (typeof userDetails.loginFull !== "undefined") {
                            if (prop.loginFull.toLowerCase() === userDetails.loginFull.toLowerCase()) {
                                boolVal = true;
                                usersArray[groupNames[groupFound]].belongs = true;
                                if (!returnUsers)
                                    break;
                            }
                        } else if (typeof userDetails.id !== "undefined") {
                            if (prop.id === userDetails.id) {
                                boolVal = true;
                                usersArray[groupNames[groupFound]].belongs = true;
                                if (!returnUsers)
                                    break;
                            }
                        } else if (typeof userDetails.email !== "undefined") {
                            if (prop.email.toLowerCase() === userDetails.email.toLowerCase()) {
                                boolVal = true;
                                usersArray[groupNames[groupFound]].belongs = true;
                                if (!returnUsers)
                                    break;
                            }
                        }

                        if (returnUsers) {
                            usersArray[groupNames[groupFound]].users.push(prop);
                            if (emailCollection) {
                                if (prop.email !== "" && $.inArray(prop.email, usersArray[groupNames[groupFound]].emails) < 0)
                                    usersArray[groupNames[groupFound]].emails.push(prop.email);
                            }
                        } else {
                            usersArray = {};
                        }
                    }
                    groupFound++;
                    if (groupFound == groupNames.length || (boolVal && !returnUsers))
                        callback(boolVal, usersArray);
                }, speedContext.latency);
            }, function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "isUserMemberOfGroup",
                    context: speedContext,
                    err_description: "",
                    resource: groupCollection
                });
            });
        }
        //callback called if no group was foud
        if (groupFound == 0 && !groupsAvail) {
            callback(boolVal, usersArray);
        }
    } else {
        console.log("group collection is undefined");
    }
}

/**
 * The isCurrentUserMemberOfGroup function checks if the current user belongs to a set of groups (";") seperated. 
 * @param {String} groupCollection the groups which users will be retrieved from. the groups are (;) seperated
 * @param {callback(boolean)} callback this parameter is the call back function when the function is successful.
 * Boolean value ,true means user belongs to the group collection, false means user doesn't belong to the group collection 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.isCurrentUserMemberOfGroup = function (groupCollection, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    if (typeof groupCollection !== 'undefined') {
        var groupNames = (typeof groupCollection === "string") ? groupCollection.split(";") : groupCollection;
        var hashGroups = {};
        for (var i = 0; i <= (groupNames.length - 1); i++) {
            if (groupNames[i] !== "") {
                hashGroups[groupNames[i]] = i;
            }
        }

        var clientContext = this.initiate();
        var currentUser = clientContext.get_web().get_currentUser();
        clientContext.load(currentUser);

        var userGroups = currentUser.get_groups();
        clientContext.load(userGroups);
        clientContext.executeQueryAsync(function () {
            var isMember = false;
            var groupName = "";
            var groupsEnumerator = userGroups.getEnumerator();
            while (groupsEnumerator.moveNext()) {
                var group = groupsEnumerator.get_current();
                groupName = group.get_title();
                var hasValue = hashGroups[groupName];
                if (typeof hasValue !== "undefined") {
                    isMember = true;
                    break;
                }
            }

            if (!isMember) {
                groupName = groupCollection;
            }
            callback(isMember, groupName);
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "isCurrentUserMemberOfGroup",
                context: speedContext,
                err_description: "",
                resource: groupCollection
            });
        });
    } else {
        throw "group collection is undefined";
    }
}

/**
 * The allUserMembershipGroups function checks all groups the current user belongs to . 
 * @param {callback(Array)} callback this parameter is the call back function when the function is successful.
 * an Array of strings is Returned 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.allUserMembershipGroups = function (callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;

    var clientContext = this.initiate();
    var currentUser = clientContext.get_web().get_currentUser();
    clientContext.load(currentUser);

    var userGroups = currentUser.get_groups();
    clientContext.load(userGroups);
    clientContext.executeQueryAsync(function () {
        var userMemberGroups = [];
        var groupsEnumerator = userGroups.getEnumerator();
        while (groupsEnumerator.moveNext()) {
            var group = groupsEnumerator.get_current();
            groupName = group.get_title();
            userMemberGroups.push(groupName);
        }

        callback(userMemberGroups);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "allUserMembershipGroups",
            context: speedContext,
            err_description: "",
            resource: ""
        });
    });
}

/**
 * The matchNameWithUserGroup function confirms if a user belong to a group by returning the Name of the Group in an array. 
 * @param {Array} groupCollection the groups which users will be retrieved from.
 * @param {boolean} allCollection only match one group.
 * @param {callback(array)} callback this parameter is the call back function when the function is successful.
 * Boolean value ,true means user belongs to the group collection, false means user doesn't belong to the group collection 
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 */
Speed.prototype.matchNameWithUserGroup = function (groupCollection, allCollection, callback, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    if (typeof groupCollection !== 'undefined') {
        var returnGroups = [];
        var clientContext = this.initiate();
        var currentUser = clientContext.get_web().get_currentUser();
        clientContext.load(currentUser);

        var userGroups = currentUser.get_groups();
        clientContext.load(userGroups);
        clientContext.executeQueryAsync(function () {
            var groupsEnumerator = userGroups.getEnumerator();
            while (groupsEnumerator.moveNext()) {
                var group = groupsEnumerator.get_current();
                var groupName = group.get_title();
                for (var i = 0; i < groupCollection.length; i++) {
                    if (groupCollection[i].toLowerCase() === groupName.toLowerCase()) {
                        returnGroups.push(groupCollection[i]);
                        break;
                    }
                }
                if (!allCollection && returnGroups.length === 1) {
                    break;
                }
            }
            callback(returnGroups);
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "matchNameWithUserGroup",
                context: speedContext,
                err_description: "",
                resource: groupCollection
            });
        });
    } else {
        throw "group collection is undefined";
    }
}

/* ============================== Document Library Section ============================*/
/**
 * The convertDataURIToBinary function converts DataURI to Base64 byte
 * @param {string} dataURI this parameter provides datauri string
 * @returns {Array} returns an array of type base 64
 */
Speed.prototype.convertDataURIToBinary = function (dataURI) {
    var BASE64_MARKER = ';base64,';
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

/**
 * The convertArrayBufferToBinary function converts Uint8Array to byte string
 * @param {ArrayBuffer} data this parameter provides datauri string
 * @returns {string} the byte string used for chunk uploading
 */
Speed.prototype.convertArrayBufferToBinary = function (data, isUint8) {
    isUint8 = (typeof isUint8 === "undefined") ? false : isUint8;
    var fileData = '';
    var byteArray = null;
    if (isUint8) {
        byteArray = data;
    }
    else {
        byteArray = new Uint8Array(data);
    }

    for (var i = 0; i < byteArray.byteLength; i++) {
        fileData += String.fromCharCode(byteArray[i]);
    }
    return fileData;
}

/**
 * The getItem function retrieve rows for a specified list in the context used
 * @param {String} listName this parameter specifices the list which the rows are to be retrieved
 * @param {String} albumLink this parameter specifices the folder url in the context where the documents are to be obtained 
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {callback(enumerator)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved, SP.Item object is returned as
 * an argument to the callback function
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getDocumentsInFolder = function (libraryInformation, albumLink, caml, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var context = speedContext.initiate();
    var emailChecker = [];
    var peopleColumns = [];
    var items = [];
    var onFailedCall = typeof onFailed === "undefined" || onFailed == null ? this.errorHandler : onFailed;
    libraryInformation = typeof libraryInformation == "string" ? { listName: libraryInformation } : libraryInformation;
    libraryInformation.columns = typeof libraryInformation.columns == "undefined" ? [] : libraryInformation.columns;
    var columns = ["Title", "FileLeafRef", "ContentType", "File"];
    for (var i = 0; i < libraryInformation.columns.length; i++) {
        if ($.inArray(libraryInformation.columns[i], columns) < 0) {
            columns.push(libraryInformation.columns[i]);
        }
    }

    var conditions = libraryInformation.conditions;
    //columns = columns.toString();

    speedContext.libraryDictionary[libraryInformation.listName] = {
        expected: 2,
        requested: 0,
    };

    var ignoreThreshold = typeof libraryInformation.ignoreThreshold == "undefined" ? true : libraryInformation.ignoreThreshold;
    var thresholdCount = typeof libraryInformation.threshold == "undefined" ? 5000 : libraryInformation.threshold;
    var feedback = typeof libraryInformation.feedback == "undefined" ? null : libraryInformation.feedback;
    if (ignoreThreshold) {
        getItemsinLibrary();
    } else {
        speedContext.SPListDetails(libraryInformation.listName, function (_spListMeta) {
            var count = _spListMeta.get_itemCount();
            var title = _spListMeta.get_title();
            speedContext.libraryDictionary[title].itemCount = count;
            if (count === 0) {
                onSuccess([]);
            }
            else if (count < thresholdCount) {
                getItemsinLibrary();
            } else {
                libraryDependenciesForLargeItems(title);
            }
        });

        var lastItemQuery = [
            { rowlimit: 1, orderby: "ID", ascending: "FALSE", viewScope: "RecursiveAll" },
            { operator: "Eq", field: "FSObjType", type: "Number", val: "0" }
        ];
        speedContext.getItem(libraryInformation.listName, speedContext.camlBuilder(lastItemQuery), function (itemProperties, listname) {
            var listEnumerator = itemProperties.getEnumerator();
            while (listEnumerator.moveNext()) {
                speedContext.libraryDictionary[listname].lastItemID = listEnumerator.get_current().get_item("ID");
            }

            libraryDependenciesForLargeItems(listname);
        });
    }

    function libraryDependenciesForLargeItems(listname) {
        speedContext.libraryDictionary[listname].requested++;
        if (speedContext.libraryDictionary[listname].requested === speedContext.libraryDictionary[listname].expected) {
            var data = {
                albumLink: albumLink,
                columns: libraryInformation.columns,
                mergeColumns: columns,
                threshold: thresholdCount,
                itemsInList: speedContext.libraryDictionary[listname].itemCount,
                lastItemID: speedContext.libraryDictionary[listname].lastItemID,
                feedback: feedback,
            };
            speedContext.getItemsInLibraryMaxThreshold(libraryInformation.listName, caml, data, onSuccess, onFailed, appContext);
        }
    }

    function getItemsinLibrary() {
        var camlQuery = null;
        if (typeof caml === "" || caml == null) {
            camlQuery = SP.CamlQuery.createAllItemsQuery();
        } else {
            if (Array.isArray(caml)) {
                camlModified = speedContext.deferenceObject(caml);
                camlModified = speedContext.camlBuilder(camlModified);
            }
            else {
                camlModified = caml;
            }
            camlQuery = new SP.CamlQuery();
            camlQuery.set_viewXml(camlModified);
        }
        camlQuery.set_folderServerRelativeUrl(albumLink);
        var context = speedContext.initiate();
        var oList = context.get_web().get_lists().getByTitle(libraryInformation.listName);

        window.speedGlobal.push(oList.getItems(camlQuery));
        var total = window.speedGlobal.length;
        total--;
        if (typeof appContext !== "undefined") {
            context = appContext.initiate();
        }
        context.load(window.speedGlobal[total], `Include(${columns.toString()})`);
        //window.speedGlobal[total].ListName = listName;
        context.executeQueryAsync(
            function () {
                setTimeout(function () {
                    var ListEnumerator = window.speedGlobal[total].getEnumerator();
                    while (ListEnumerator.moveNext()) {
                        var documentItem = {};
                        var currentItem = ListEnumerator.get_current();
                        var _contentType = currentItem.get_contentType();
                        documentItem.ItemType = _contentType.get_name();
                        documentItem.FileName = currentItem.get_item("FileLeafRef");
                        if (documentItem.ItemType !== "Folder") {
                            var File = currentItem.get_file();
                            if (File != null) {
                                documentItem.FileUrl = File.get_serverRelativeUrl();
                                documentItem.FileSize = File.get_length();
                            }
                        }
                        documentItem.ID = currentItem.get_item("ID");
                        documentItem.Title = currentItem.get_item("Title");
                        for (var i = 0; i <= libraryInformation.columns.length - 1; i++) {
                            var SPFieldType;
                            var nopropinJSEngine = false;
                            try {
                                SPFieldType = ListEnumerator.get_current().get_item(libraryInformation.columns[i]).__proto__.constructor.__typeName.toLowerCase();
                            } catch (ex) {
                                try {
                                    nopropinJSEngine = true;
                                    SPFieldType = $.type(ListEnumerator.get_current().get_item(libraryInformation.columns[i]));
                                } catch (ex) {
                                    SPFieldType = "string";
                                }
                            }
                            if (
                                SPFieldType.toLowerCase() === "sp.fielduservalue" ||
                                SPFieldType.toLowerCase() === "sp.fieldlookupvalue" ||
                                (nopropinJSEngine && SPFieldType.toLowerCase() === "object")
                            ) {
                                var objProp = {};
                                objProp.id = speedContext.checkNull(ListEnumerator.get_current().get_item(libraryInformation.columns[i]).get_lookupId());
                                objProp.value = speedContext.checkNull(ListEnumerator.get_current().get_item(libraryInformation.columns[i]).get_lookupValue());
                                if (SPFieldType.toLowerCase() === "sp.fielduservalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                                    try {
                                        objProp.email = ListEnumerator.get_current().get_item(libraryInformation.columns[i]).get_email();
                                    } catch (e) {
                                        objProp.email = "";
                                    }

                                    if (objProp.email == null && $.inArray(objProp.id, speedContext.usersInEnvironmentByIdArary) < 0) {
                                        var userCtx = context.get_web().get_siteUsers().getById(objProp.id);
                                        speedContext.usersInEnvironmentByIdArary.push(objProp.id);
                                        emailChecker.push(userCtx);
                                        peopleColumns.push(libraryInformation.columns[i]);
                                    }
                                }

                                if (typeof conditions === "object" && conditions !== null) {
                                    if (typeof conditions[libraryInformation.columns[i]] !== "undefined") {
                                        objProp = conditions[libraryInformation.columns[i]](objProp);
                                    }
                                }
                                documentItem[libraryInformation.columns[i]] = objProp;
                            } else if (SPFieldType.toLowerCase() === "array") {
                                var multiUser = ListEnumerator.get_current().get_item(libraryInformation.columns[i]);
                                var arrayToSave = [];
                                var isUserColumn = false;
                                for (var j = 0; j <= multiUser.length - 1; j++) {
                                    var objectOfUsers = {};
                                    objectOfUsers.id = multiUser[j].get_lookupId();
                                    objectOfUsers.value = multiUser[j].get_lookupValue();
                                    try {
                                        objectOfUsers.email = multiUser[j].get_email();
                                    } catch (e) {
                                        objectOfUsers.email = "";
                                    }

                                    if (objectOfUsers.email === null && $.inArray(objectOfUsers.id, speedContext.usersInEnvironmentByIdArary) < 0) {
                                        isUserColumn = true;
                                        var userCtx = context.get_web().get_siteUsers().getById(objectOfUsers.id);
                                        speedContext.usersInEnvironmentByIdArary.push(objectOfUsers.id);
                                        emailChecker.push(userCtx);
                                    }
                                    arrayToSave.push(objectOfUsers);
                                }

                                if (typeof conditions === "object" && conditions !== null) {
                                    if (typeof conditions[libraryInformation.columns[i]] !== "undefined") {
                                        arrayToSave = conditions[libraryInformation.columns[i]](arrayToSave);
                                    }
                                }

                                if (isUserColumn) {
                                    peopleColumns.push(libraryInformation.columns[i]);
                                }
                                documentItem[libraryInformation.columns[i]] = arrayToSave;
                            } else {
                                try {
                                    ListEnumerator.get_current().get_item(libraryInformation.columns[i]);
                                } catch (e) {
                                    throw `${libraryInformation.columns[i]} doesnt exist in this list (${libraryInformation.listName})`;
                                }
                                var columnValue = speedContext.checkNull(ListEnumerator.get_current().get_item(libraryInformation.columns[i]));
                                if (typeof conditions === "object" && conditions !== null) {
                                    if (typeof conditions[libraryInformation.columns[i]] !== "undefined") {
                                        columnValue = conditions[libraryInformation.columns[i]](columnValue);
                                    }
                                }
                                documentItem[libraryInformation.columns[i]] = columnValue;
                            }
                        }

                        if (conditions !== null && typeof conditions === "function") {
                            documentItem = conditions(documentItem);
                        }

                        //includes non empty objects
                        if (!$.isEmptyObject(documentItem)) {
                            items.push(documentItem);
                        }
                    }

                    if (emailChecker.length === 0) {
                        onSuccess(items);
                    }
                    else {
                        getUserInformationArray(0, function () {
                            onSuccess(items);
                        });
                    }

                }, 1000);
            },
            function (sender, args) {
                onFailedCall(sender, args, {
                    name: "getDocumentsInFolder",
                    context: speedContext,
                    err_description: "",
                    resource: albumLink,
                });
            }
        );
    }

    function getUserInformationArray(pos, callback) {
        context.load(emailChecker[pos]);
        context.executeQueryAsync(function () {
            var email = emailChecker[pos].get_email();
            var id = emailChecker[pos].get_id();
            speedContext.usersInEnvironmentById[id] = email;
            if (pos < (emailChecker.length - 1)) {
                pos++;
                getUserInformationArray(pos, callback);
            }
            else {
                for (var x = 0; x < listItems.length; x++) {
                    for (var y = 0; y < peopleColumns.length; y++) {
                        if (Array.isArray(listItems[x][peopleColumns[y]])) {
                            var userdetail = listItems[x][peopleColumns[y]];
                            for (var z = 0; z < userdetail.length; z++) {
                                if (typeof speedContext.usersInEnvironmentById[userdetail[z].id] !== "undefined") {
                                    listItems[x][peopleColumns[y]][z].email = speedContext.usersInEnvironmentById[userdetail[z]];
                                }
                            }
                        }
                        else {
                            if (typeof speedContext.usersInEnvironmentById[listItems[x][peopleColumns[y]].id] !== "undefined") {
                                listItems[x][peopleColumns[y]].email = speedContext.usersInEnvironmentById[listItems[x][peopleColumns[y]].id];
                            }
                        }
                    }
                }

                callback();
            }
        },
            function (sender, args) {
                SpeedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "getListToItem(Email Checker)",
                    context: SpeedContext,
                    err_description: "",
                    resource: listName
                });
            });
    }
};

Speed.prototype.getItemsInLibraryMaxThreshold = function (listName, caml, listSearchData, onSuccess, onFailed, appContext) {
    var SpeedContext = this;
    var emailChecker = [];
    var peopleColumns = [];
    var context = SpeedContext.initiate();
    var numberOfIterations = Math.ceil(listSearchData.lastItemID / listSearchData.threshold);
    var conditions = listSearchData.conditions;
    var albumLink = listSearchData.albumLink;
    SpeedContext.thresholdListSettings[listName] = {
        //start : 1,
        iterationCalls: 0,
        expectedCalls: numberOfIterations,
        items: [],
        ascending: false,
        orderby: "ID",
    };

    var columns = listSearchData.columns;
    var mergeColumns = listSearchData.mergeColumns;

    makeLibraryCalls(1, numberOfIterations, listName);

    function makeLibraryCalls(pos, iterations, listname) {
        var idVal = pos == 1 ? listSearchData.lastItemID : listSearchData.lastItemID - listSearchData.threshold * (pos - 1);
        var item = {
            operator: "Leq",
            field: "ID",
            type: "Number",
            val: idVal,
        };
        var camlModified = SpeedContext.deferenceObject(caml);
        camlModified[0].rowlimit = listSearchData.threshold;
        camlModified.splice(1, 0, item);
        camlModified[0].orderby = "ID";
        camlModified[0].ascending = "FALSE";
        SpeedContext.thresholdListSettings[listName].ascending = "FALSE";
        SpeedContext.thresholdListSettings[listName].orderby = camlModified[0].orderby;
        SpeedContext.thresholdListSettings[listName].feedback = listSearchData.feedback;

        camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml(SpeedContext.camlBuilder(camlModified));
        camlQuery.set_folderServerRelativeUrl(albumLink);
        var context = SpeedContext.initiate();
        var oList = context.get_web().get_lists().getByTitle(listName);

        window.speedGlobal.push(oList.getItems(camlQuery));
        var total = window.speedGlobal.length;
        total--;
        if (typeof appContext !== "undefined") {
            context = appContext.initiate();
        }
        context.load(window.speedGlobal[total], `Include(${mergeColumns.toString()})`);
        //window.speedGlobal[total].ListName = listName;
        context.executeQueryAsync(
            function () {
                setTimeout(function () {
                    var items = [];
                    var ListEnumerator = window.speedGlobal[total].getEnumerator();
                    while (ListEnumerator.moveNext()) {
                        var documentItem = {};
                        var currentItem = ListEnumerator.get_current();
                        var _contentType = currentItem.get_contentType();
                        documentItem.ItemType = _contentType.get_name();
                        if (documentItem.ItemType !== "Folder") {
                            var File = currentItem.get_file();
                            if (File != null) {
                                documentItem.FileName = currentItem.get_item("FileLeafRef");
                                documentItem.FileUrl = File.get_serverRelativeUrl();
                                documentItem.FileSize = File.get_length();
                            }
                        }
                        documentItem.ID = currentItem.get_item("ID");
                        documentItem.Title = currentItem.get_item("Title");

                        for (var i = 0; i <= columns.length - 1; i++) {
                            var SPFieldType;
                            var nopropinJSEngine = false;
                            try {
                                SPFieldType = ListEnumerator.get_current().get_item(columns[i]).__proto__.constructor.__typeName.toLowerCase();
                            } catch (ex) {
                                try {
                                    nopropinJSEngine = true;
                                    SPFieldType = $.type(ListEnumerator.get_current().get_item(columns[i]));
                                } catch (ex) {
                                    SPFieldType = "string";
                                }
                            }
                            if (
                                SPFieldType.toLowerCase() === "sp.fielduservalue" ||
                                SPFieldType.toLowerCase() === "sp.fieldlookupvalue" ||
                                (nopropinJSEngine && SPFieldType.toLowerCase() === "object")
                            ) {
                                var objProp = {};
                                objProp.id = SpeedContext.checkNull(ListEnumerator.get_current().get_item(columns[i]).get_lookupId());
                                objProp.value = SpeedContext.checkNull(ListEnumerator.get_current().get_item(columns[i]).get_lookupValue());
                                if (SPFieldType.toLowerCase() === "sp.fielduservalue" || (nopropinJSEngine && SPFieldType.toLowerCase() === "object")) {
                                    try {
                                        objProp.email = ListEnumerator.get_current().get_item(columns[i]).get_email();
                                    } catch (e) {
                                        objProp.email = "";
                                    }

                                    if (objProp.email == null && $.inArray(objProp.id, SpeedContext.usersInEnvironmentByIdArary) < 0) {
                                        var userCtx = context.get_web().get_siteUsers().getById(objProp.id);
                                        SpeedContext.usersInEnvironmentByIdArary.push(objProp.id);
                                        emailChecker.push(userCtx);
                                        peopleColumns.push(columns[i]);
                                    }
                                }

                                if (typeof conditions === "object" && conditions !== null) {
                                    if (typeof conditions[columns[i]] !== "undefined") {
                                        objProp = conditions[columns[i]](objProp);
                                    }
                                }
                                documentItem[columns[i]] = objProp;
                            } else if (SPFieldType.toLowerCase() === "array") {
                                var multiUser = ListEnumerator.get_current().get_item(columns[i]);
                                var arrayToSave = [];
                                var isUserColumn = false;
                                for (var j = 0; j <= multiUser.length - 1; j++) {
                                    var objectOfUsers = {};
                                    objectOfUsers.id = multiUser[j].get_lookupId();
                                    objectOfUsers.value = multiUser[j].get_lookupValue();
                                    try {
                                        objectOfUsers.email = multiUser[j].get_email();
                                    } catch (e) {
                                        objectOfUsers.email = "";
                                    }

                                    if (objectOfUsers.email === null && $.inArray(objectOfUsers.id, SpeedContext.usersInEnvironmentByIdArary) < 0) {
                                        isUserColumn = true;
                                        var userCtx = context.get_web().get_siteUsers().getById(objectOfUsers.id);
                                        SpeedContext.usersInEnvironmentByIdArary.push(objectOfUsers.id);
                                        emailChecker.push(userCtx);
                                    }
                                    arrayToSave.push(objectOfUsers);
                                }

                                if (typeof conditions === "object" && conditions !== null) {
                                    if (typeof conditions[columns[i]] !== "undefined") {
                                        arrayToSave = conditions[columns[i]](arrayToSave);
                                    }
                                }

                                if (isUserColumn) {
                                    peopleColumns.push(columns[i]);
                                }
                                documentItem[columns[i]] = arrayToSave;
                            } else {
                                try {
                                    ListEnumerator.get_current().get_item(columns[i]);
                                } catch (e) {
                                    throw `${columns[i]} doesnt exist in this list (${listName})`;
                                }
                                var columnValue = SpeedContext.checkNull(ListEnumerator.get_current().get_item(columns[i]));
                                if (typeof conditions === "object" && conditions !== null) {
                                    if (typeof conditions[columns[i]] !== "undefined") {
                                        columnValue = conditions[columns[i]](columnValue);
                                    }
                                }
                                documentItem[columns[i]] = columnValue;
                            }
                        }

                        if (conditions !== null && typeof conditions === "function") {
                            documentItem = conditions(documentItem);
                        }

                        //includes non empty objects
                        if (!$.isEmptyObject(documentItem)) {
                            items.push(documentItem);
                        }
                    }
                    if (pos <= iterations) {
                        pos++;
                        makeLibraryCalls(pos, iterations, listname);
                    }
                    checkThresholdCount(listName, items, onSuccess);
                }, 1000);
            },
            function (sender, args) {
                onFailed(sender, args, {
                    name: "getDocumentsInFolder",
                    context: SpeedContext,
                    err_description: "",
                    resource: albumLink,
                });
            }
        );
    }

    function checkThresholdCount(list, items, callback) {
        SpeedContext.thresholdListSettings[list].items = SpeedContext.thresholdListSettings[list].items.concat(items);
        SpeedContext.thresholdListSettings[list].iterationCalls++;
        if (SpeedContext.thresholdListSettings[list].expectedCalls == SpeedContext.thresholdListSettings[list].iterationCalls) {
            var itemsToSend = getUniqueListBy(SpeedContext.thresholdListSettings[list].items, "ID");
            if (SpeedContext.thresholdListSettings[list].ascending) {
                itemsToSend.sort((a, b) => (b[SpeedContext.thresholdListSettings[list].orderby] < a[SpeedContext.thresholdListSettings[list].orderby] ? 1 : -1));
            } else {
                itemsToSend.sort((a, b) => (a[SpeedContext.thresholdListSettings[list].orderby] < b[SpeedContext.thresholdListSettings[list].orderby] ? 1 : -1));
            }

            if (emailChecker.length === 0) {
                callback(itemsToSend);
            }
            else {
                getUserInformationArray(0, function () {
                    callback(itemsToSend);
                });
            }
        } else if (SpeedContext.thresholdListSettings[listName].feedback !== null) {
            //feedback to the user
            var itemsToSend = getUniqueListBy(SpeedContext.thresholdListSettings[list].items, "ID");
            if (SpeedContext.thresholdListSettings[list].ascending) {
                itemsToSend.sort((a, b) => (b[SpeedContext.thresholdListSettings[list].orderby] < a[SpeedContext.thresholdListSettings[list].orderby] ? 1 : -1));
            } else {
                itemsToSend.sort((a, b) => (a[SpeedContext.thresholdListSettings[list].orderby] < b[SpeedContext.thresholdListSettings[list].orderby] ? 1 : -1));
            }
            SpeedContext.thresholdListSettings[listName].feedback(itemsToSend);
        }
    }

    function getUniqueListBy(arr, key) {
        return [...new Map(arr.map((item) => [item[key], item])).values()];
    }

    function getUserInformationArray(pos, callback) {
        context.load(emailChecker[pos]);
        context.executeQueryAsync(function () {
            var email = emailChecker[pos].get_email();
            var id = emailChecker[pos].get_id();
            SpeedContext.usersInEnvironmentById[id] = email;
            if (pos < (emailChecker.length - 1)) {
                pos++;
                getUserInformationArray(pos, callback);
            }
            else {
                for (var x = 0; x < listItems.length; x++) {
                    for (var y = 0; y < peopleColumns.length; y++) {
                        if (Array.isArray(listItems[x][peopleColumns[y]])) {
                            var userdetail = listItems[x][peopleColumns[y]];
                            for (var z = 0; z < userdetail.length; z++) {
                                if (typeof SpeedContext.usersInEnvironmentById[userdetail[z].id] !== "undefined") {
                                    listItems[x][peopleColumns[y]][z].email = SpeedContext.usersInEnvironmentById[userdetail[z]];
                                }
                            }
                        }
                        else {
                            if (typeof SpeedContext.usersInEnvironmentById[listItems[x][peopleColumns[y]].id] !== "undefined") {
                                listItems[x][peopleColumns[y]].email = SpeedContext.usersInEnvironmentById[listItems[x][peopleColumns[y]].id];
                            }
                        }
                    }
                }

                callback();
            }
        },
            function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "getListToItems(Email Checker)",
                    context: speedContext,
                    err_description: "",
                    resource: listName
                });
            });
    }
};

/* @example
* // returns a normal context related to the current site
* var speedCtx = new Speed();
* isUser is a boolean
* the argument userArray in the callback contains the following properties:  title,id,email,login
* speedCtx.getFileByUrl("http://<domain>/file",function(file){
*      var listItem = file.get_listItemAllFields();
       var comments = listItem.get_fieldValues()._Comments;
* });*/
Speed.prototype.getFileByUrl = function (url, onSuccess, onFailed) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var file = context.get_web().getFileByServerRelativeUrl(url);
    context.load(file, 'ListItemAllFields');
    context.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(file);
        }, speedContext.latency);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getFileByUrl",
            context: speedContext,
            err_description: "",
            resource: url
        });
    });
}

Speed.prototype.getItemWithMetaFromFolder = function (libraryProperties, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var listName = (typeof libraryProperties.listName === 'undefined') ? "" : libraryProperties.listName;
    if (listName !== "") {
        var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
        var query = (typeof libraryProperties.caml === 'undefined') ? this.camlBuilder() : libraryProperties.caml;
        var extraProp = (typeof libraryProperties.extraProp === 'undefined') ? "" : libraryProperties.extraProp;
        var context = this.initiate();
        var oList = context.get_web().get_lists().getByTitle(listName);

        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml(query);
        window.speedGlobal.push(oList.getItems(camlQuery));
        var total = window.speedGlobal.length;
        total--;
        if (typeof appContext !== 'undefined') {
            context = appContext.initiate();
        }
        if (extraProp !== "") {
            context.load(window.speedGlobal[total], extraProp);
        } else {
            context.load(window.speedGlobal[total]);
        }
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess(window.speedGlobal[total]);
            }, speedContext.latency);
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "getItemWithMetaFromFolder",
                context: speedContext,
                err_description: "",
                resource: listName
            });
        });
    } else {
        console.log("please set the listName property to the library you are targeting...")
    }
}

//------------------create a folder in document Libary---------
/**
 * The createFolder function creates a folder in a document library
 * @param {String} foldername the name of the folder that should be created
 * @param {String} library the title of the library which the folder will be created
 * @param {callback(folderCollection)} onSuccess this parameter is the call back function when the function is successful, a SP.FolderCollection object is returned
 * as an argument.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createFolder = function (foldername, libraryProperties, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    //taking account of list creation update using objects
    if (typeof libraryProperties === "string") {
        var newObj = {};
        newObj.libraryName = libraryProperties;
        libraryProperties = newObj;
        libraryProperties.breakRoleInheritance = false;
    }
    var context = this.initiate();

    speedContext.SPGroupDetailsForFolderPermissions({ count: 0, context: context, groups: libraryProperties.groups }, function () {
        var docLib = context.get_web().get_lists().getByTitle(libraryProperties.libraryName);
        var itemCreateInfo = new SP.ListItemCreationInformation();
        itemCreateInfo.set_underlyingObjectType(SP.FileSystemObjectType.folder);
        itemCreateInfo.set_leafName(foldername);

        window.speedGlobal.push(docLib.addItem(itemCreateInfo));
        var total = window.speedGlobal.length;
        total--;

        if (typeof libraryProperties.metadata !== "undefined") {
            for (var propName in libraryProperties.metadata) {
                if (propName.toLowerCase() != "id") {
                    window.speedGlobal[total].set_item(propName, libraryProperties.metadata[propName]);
                }
            }
        }

        window.speedGlobal[total].update();
        if (typeof appContext !== 'undefined') {
            context = appContext.initiate();
        }
        context.load(window.speedGlobal[total]);
        context.executeQueryAsync(function () {
            if (libraryProperties.breakRoleInheritance) {
                window.speedGlobal[total].breakRoleInheritance(false, false);
                var oWebsite = context.get_web();
                for (var x = 0; x < libraryProperties.users.length; x++) {
                    var userobj = oWebsite.ensureUser(libraryProperties.users[x].login);
                    var role = SP.RoleDefinitionBindingCollection.newObject(context);
                    role.add(oWebsite.get_roleDefinitions().getByType(libraryProperties.users[x].role));
                    window.speedGlobal[total].get_roleAssignments().add(userobj, role);
                }

                //group object already created and set in properties array to make the call faster
                for (var x = 0; x < libraryProperties.groups.length; x++) {
                    var role = SP.RoleDefinitionBindingCollection.newObject(context);
                    role.add(oWebsite.get_roleDefinitions().getByType(libraryProperties.groups[x].role));
                    window.speedGlobal[total].get_roleAssignments().add(speedContext.folderGroups[libraryProperties.groups[x].name], role);
                }

                context.load(window.speedGlobal[total]);
                context.executeQueryAsync(function () {
                    setTimeout(function () {
                        onSuccess(window.speedGlobal[total], foldername, libraryProperties.libraryName);
                    }, speedContext.latency);
                }, function (sender, args) {
                    speedContext.checkConnectionLatency();
                    onFailedCall(sender, args, {
                        name: "createFolder",
                        context: speedContext,
                        err_description: "failed to create roles for folder created",
                        resource: foldername
                    });
                });
            }
            else {
                setTimeout(function () {
                    onSuccess(window.speedGlobal[total], foldername, libraryProperties.libraryName);
                }, speedContext.latency);
            }

        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "createFolder",
                context: speedContext,
                err_description: "",
                resource: foldername
            });
        });
    })

}
/**
 * The createSubFolder function creates a folder and subfolders in a document library
 * @param {Array} foldernames an array of folder names. the order determines the order of the creation of subfolders
 * @param {String} library the title of the library which the folder will be created
 * @param {callback(number)} feedBack this parameter is the call back function to determine the upload rate based on percentage
 * @param {callback(folderCollection)} onSuccess this parameter is the call back function when the function is successful, a SP.FolderCollection object is returned
 * as an argument.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SP.context} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.createSubFolder = function (foldernames, libraryDetails, metadata, feedBack, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var libraryProperties = {};
    if (typeof libraryDetails === "string") {
        libraryProperties.libraryName = libraryDetails;
        libraryProperties.libraryInternalName = libraryDetails;
    }
    else {
        libraryProperties = libraryDetails;
    }

    var docLib = context.get_web().get_lists().getByTitle(libraryProperties.libraryName);
    var rootFolder = docLib.get_rootFolder();
    var folderUrl = speedContext.initiate().get_url();
    folderUrl += "/" + libraryProperties.libraryInternalName;
    checkFolderExists(rootFolder, folderUrl, foldernames, 0, metadata, libraryProperties)

    function checkFolderExists(folderContext, urloffolder, folderNames, count, metadata, libraryProperties) {
        speedContext.getFileFolderExists(urloffolder, 'folder', function () {
            urloffolder += "/" + folderNames[count];

            window.speedGlobal.push(folderContext.get_folders().add(folderNames[count]));
            var total = window.speedGlobal.length;
            total--;
            if (typeof appContext !== 'undefined') {
                context = appContext.initiate();
            }
            context.load(window.speedGlobal[total]);
            context.executeQueryAsync(function () {
                var folder = folderNames[count];
                if (typeof metadata[folder] !== "undefined") {
                    var itemCollection = window.speedGlobal[total].get_listItemAllFields();
                    for (var propName in metadata[folder]) {
                        if (propName.toLowerCase() != "id") {
                            itemCollection.set_item(propName, metadata[folder][propName]);
                        }
                    }
                    itemCollection.update();
                    context.load(itemCollection);
                    context.executeQueryAsync(function () {
                        var folder = folderNames[count];
                        if (typeof libraryProperties[folder] !== "undefined") {
                            if (libraryProperties[folder].breakRoleInheritance) {
                                var listItemInformation = window.speedGlobal[total].get_listItemAllFields();
                                listItemInformation.breakRoleInheritance(false, false);
                                var oWebsite = context.get_web();
                                //group object already created and set in properties array to make the call faster
                                for (var x = 0; x < libraryProperties[folder].groups.length; x++) {
                                    var role = SP.RoleDefinitionBindingCollection.newObject(context);
                                    role.add(oWebsite.get_roleDefinitions().getByType(libraryProperties[folder].groups[x].role));
                                    listItemInformation.get_roleAssignments().add(libraryProperties[folder].groups[x].group, role);
                                }

                                for (var x = 0; x < libraryProperties[folder].users.length; x++) {
                                    var userobj = oWebsite.ensureUser(libraryProperties[folder].users[x].login);
                                    var role = SP.RoleDefinitionBindingCollection.newObject(context);
                                    role.add(oWebsite.get_roleDefinitions().getByType(libraryProperties[folder].users[x].role));
                                    listItemInformation.get_roleAssignments().add(userobj, role);
                                }

                                context.load(listItemInformation);
                                context.executeQueryAsync(function () {
                                    setTimeout(function () {
                                        if (count < (folderNames.length - 1)) {
                                            var totalFolder = folderNames.length;
                                            var newNumber = parseInt(count) + 1;
                                            var completed = (newNumber / totalFolder) * 100;
                                            feedBack(parseInt(completed));
                                            count++;
                                            checkFolderExists(window.speedGlobal[total], urloffolder, folderNames, count, metadata, libraryProperties);
                                        } else {
                                            feedBack(100);
                                            onSuccess(urloffolder);
                                        }
                                    }, speedContext.latency);
                                }, function (sender, args) {
                                    speedContext.checkConnectionLatency();
                                    onFailedCall(sender, args, {
                                        name: "createSubFolder",
                                        context: speedContext,
                                        err_description: "failed to create roles for folder created",
                                        resource: folder
                                    });
                                });
                            }
                            else {
                                setTimeout(function () {
                                    if (count < (folderNames.length - 1)) {
                                        var totalFolder = folderNames.length;
                                        var newNumber = parseInt(count) + 1;
                                        var completed = (newNumber / totalFolder) * 100;
                                        feedBack(parseInt(completed));
                                        count++;
                                        checkFolderExists(window.speedGlobal[total], urloffolder, folderNames, count, metadata);
                                    } else {
                                        feedBack(100);
                                        onSuccess(urloffolder);
                                    }
                                }, speedContext.latency);
                            }
                        }
                    }, function (sender, args) {
                        speedContext.checkConnectionLatency();
                        onFailedCall(sender, args, {
                            name: "createSubFolder",
                            context: speedContext,
                            err_description: "error setting metadata of folder",
                            resource: urloffolder
                        });
                    });
                } else {
                    var folder = folderNames[count];
                    if (typeof libraryProperties[folder] !== "undefined") {
                        if (libraryProperties[folder].breakRoleInheritance) {
                            var listItemInformation = window.speedGlobal[total].get_listItemAllFields();
                            listItemInformation.breakRoleInheritance(false, false);
                            var oWebsite = context.get_web();
                            //group object already created and set in properties array to make the call faster
                            for (var x = 0; x < libraryProperties[folder].groups.length; x++) {
                                var role = SP.RoleDefinitionBindingCollection.newObject(context);
                                role.add(oWebsite.get_roleDefinitions().getByType(libraryProperties[folder].groups[x].role));
                                listItemInformation.get_roleAssignments().add(libraryProperties[folder].groups[x].group, role);
                            }

                            for (var x = 0; x < libraryProperties[folder].users.length; x++) {
                                var userobj = oWebsite.ensureUser(libraryProperties[folder].users[x].login);
                                var role = SP.RoleDefinitionBindingCollection.newObject(context);
                                role.add(oWebsite.get_roleDefinitions().getByType(libraryProperties[folder].users[x].role));
                                listItemInformation.get_roleAssignments().add(userobj, role);
                            }

                            context.load(listItemInformation);
                            context.executeQueryAsync(function () {
                                setTimeout(function () {
                                    if (count < (folderNames.length - 1)) {
                                        var totalFolder = folderNames.length;
                                        var newNumber = parseInt(count) + 1;
                                        var completed = (newNumber / totalFolder) * 100;
                                        feedBack(parseInt(completed));
                                        count++;
                                        checkFolderExists(window.speedGlobal[total], urloffolder, folderNames, count, metadata, libraryProperties);
                                    } else {
                                        feedBack(100);
                                        onSuccess(urloffolder);
                                    }
                                }, speedContext.latency);
                            }, function (sender, args) {
                                speedContext.checkConnectionLatency();
                                onFailedCall(sender, args, {
                                    name: "createSubFolder",
                                    context: speedContext,
                                    err_description: "failed to create roles for folder created",
                                    resource: folder
                                });
                            });
                        }
                        else {
                            setTimeout(function () {
                                if (count < (folderNames.length - 1)) {
                                    var totalFolder = folderNames.length;
                                    var newNumber = parseInt(count) + 1;
                                    var completed = (newNumber / totalFolder) * 100;
                                    feedBack(parseInt(completed));
                                    count++;
                                    checkFolderExists(window.speedGlobal[total], urloffolder, folderNames, count, metadata);
                                } else {
                                    feedBack(100);
                                    onSuccess(urloffolder);
                                }
                            }, speedContext.latency);
                        }
                    }
                    else {
                        setTimeout(function () {
                            if (count < (folderNames.length - 1)) {
                                var totalFolder = folderNames.length;
                                var newNumber = parseInt(count) + 1;
                                var completed = (newNumber / totalFolder) * 100;
                                feedBack(parseInt(completed));
                                count++;
                                checkFolderExists(window.speedGlobal[total], urloffolder, folderNames, count, metadata, libraryProperties);
                            } else {
                                feedBack(100);
                                onSuccess(urloffolder);
                            }
                        }, speedContext.latency);
                    }
                }
            }, function (sender, args) {
                speedContext.checkConnectionLatency();
                onFailedCall(sender, args, {
                    name: "createSubFolder",
                    context: speedContext,
                    err_description: "error adding sub folders",
                    resource: urloffolder
                });
            });
        }, function (sender, args) {
            urloffolder += "/" + folderNames[count];
            if (count < (folderNames.length - 1)) {
                var totalFolder = folderNames.length;
                var newNumber = parseInt(count) + 1;
                var completed = (newNumber / totalFolder) * 100;
                feedBack(parseInt(completed));
                count++;
                checkFolderExists(folderContext, urloffolder, folderNames, count, metadata);
            } else {
                feedBack(100);
                onSuccess(urloffolder);
            }
        });
    }
}

Speed.prototype.createMultiLevelSubFolder = function (folderNames, library, metadata, feedBack, onSuccess, onFailed, appContext) {
    //folderNames is a multilevel array
    var folderStructures = [];
    var folderStructuresCount = folderNames.length;
    var folderCompletedCount = 0;
    for (var x = 0; x < folderNames.length; x++) {
        this.createSubFolder(folderNames[x], library, metadata, feedBack, function (urlofFolder) {
            var prop = urlofFolder.split("/").pop();
            var details = {
                url: urlofFolder,
                prop: prop
            }
            folderStructures.push(details);
            folderCompletedCount++;
            if (folderStructuresCount == folderCompletedCount) {
                onSuccess(folderStructures);
            }
        }, onFailed, appContext);
    }
}

/**
 * The deleteFolderOrFile function deletes folder from Libary
 * @param {String} folderDocUrl the url of the folder or file that needs to be deleted
 * @param {callback} onSuccess this parameter is the call back function when the function is successful
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.deleteFolderOrFile = function (properties, onSuccess, onFailed, appContext) {
    properties.fileType = (typeof properties.fileType) ? "file" : properties.fileType;
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined') ? this.errorHandler : onFailed;
    var context = this.initiate();
    var oWebsite = context.get_web();
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(oWebsite);
    context.executeQueryAsync(function () {
        if (properties.fileType === "folder") {
            window.speedGlobal.push(oWebsite.getFolderByServerRelativeUrl(properties.url));
        }
        else {
            window.speedGlobal.push(oWebsite.getFileByServerRelativeUrl(properties.url));
        }

        var total = window.speedGlobal.length;
        total--;
        window.speedGlobal[total].deleteObject();
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess();
            }, speedContext.latency)
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "deleteFolderOrFile",
                context: speedContext,
                err_description: "error deleting folder or file",
                resource: folderDocUrl
            });
        });
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "deleteFolderOrFile",
            context: speedContext,
            err_description: "error loading web context",
            resource: folderDocUrl
        });
    });
}
//------------------------upload file to documnet library---------------------
/**
 * The uploadFile function upload a file to a folder in a Libary or directly to a library itself
 * @param {String} nameOfFile the name of the file to be uploaded
 * @param {String} dataOfFile the dataURI of the file
 * @param {Object} fileProperties contains properties folder where the file will be uploaded and meta data for the file
 * @param {callback(SP.File)} onSuccess this parameter is the call back function when the upload is successful. The SP.File object is returned as an argument
 * when the upload is successful.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.uploadFile = function (nameOfFile, dataOfFile, fileProperties, onSuccess, onFailed, appContext) {
    var folder = "";
    var dataFormat = "";
    if (typeof fileProperties === "string") {
        folder = fileProperties;
        fileProperties = {};
    }
    else if (typeof fileProperties === "object") {
        folder = fileProperties.folder;

        if (typeof fileProperties.dataFormat !== "undefined") {
            dataFormat = fileProperties.dataFormat;
        }
    }

    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var ctx2 = this.initiate();
    var fileNameSplit = nameOfFile.split(".");
    var filetype = fileNameSplit.pop();

    if (dataOfFile !== null) {
        //if file is already a binary dont convert again
        //if file is a text dont convert
        if (filetype.toLowerCase() === "txt" || dataFormat === "binary") {
            var data = dataOfFile;
        }
        else {
            var data = this.convertDataURIToBinary(dataOfFile);
        }
    }

    var attachmentFolder = ctx2.get_web().getFolderByServerRelativeUrl(folder);
    var fileCreateInfo = new SP.FileCreationInformation();
    fileCreateInfo.set_url(nameOfFile);
    fileCreateInfo.set_overwrite(true);
    fileCreateInfo.set_content(new SP.Base64EncodedByteArray());

    if (dataOfFile !== null) {
        for (var i = 0; i < data.length; ++i) {
            if (filetype.toLowerCase() === "txt" || dataFormat === "binary")
                fileCreateInfo.get_content().append(data.charCodeAt(i));
            else
                fileCreateInfo.get_content().append(data[i]);

        }
    }

    window.speedGlobal.push(attachmentFolder.get_files().add(fileCreateInfo));
    var total = window.speedGlobal.length;
    total--;

    if (typeof fileProperties.metadata !== "undefined") {
        for (var propName in fileProperties.metadata) {
            if (propName.toLowerCase() != "id") {
                window.speedGlobal[total].get_listItemAllFields().set_item(propName, fileProperties.metadata[propName]);
            }
        }
        window.speedGlobal[total].get_listItemAllFields().update();
    }
    if (typeof appContext !== 'undefined') {
        ctx2 = appContext.initiate();
    }
    ctx2.load(window.speedGlobal[total]);
    ctx2.executeQueryAsync(function () {
        setTimeout(function () {
            onSuccess(window.speedGlobal[total]);
        }, speedContext.latency)
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "uploadFile",
            context: speedContext,
            err_description: "",
            resource: nameOfFile
        });
    });
}

/**
 * The uploadLargeFile function upload a larger file (> 1.8mb) to a folder in a Libary or directly to a library itself.This is basically used to overcome the restrictions 
 * of file upload on o365 server.
 * @param {String} fileName the name of the file to be uploaded
 * @param {Object} fileProperties contains properties folder where the file will be uploaded and meta data for the file
 * @param {Speed.filesDictionary} uploadedFile the file data and its properties. 
 * @param {callback(SP.File)} onSuccess this parameter is the call back function when the upload is successful. The SP.File object is returned as an argument
 * when the upload is successful.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {string} webAbsoluteUrl the absolute url of where the folder in which the file will be uploaded to resides.by default the current site url is used
 */
Speed.prototype.uploadLargeFile = function (fileName, fileProperties, uploadedFile, onSuccess, onFailed, webAbsoluteUrl, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    //upload dummy file
    this.uploadFile(fileName, "", fileProperties, function (filedetails) {
        speedContext.prepareChunkFile(uploadedFile, filedetails, 0, onSuccess, onFailedCall, webAbsoluteUrl);
    }, onFailedCall, appContext);
}

//=========================upload multiple files ===============================
/**
 * The uploadMultipleFiles function upload files to a folder in a Libary or directly to a library itself
 * @param {String} fileArr an array of file objects with properties dataName & dataURI
 * @param {Array} fileProperties contains properties folder where the file will be uploaded and meta data for the file
 * @param {String} fileCount the index of the file object to start in the array
 * @param {callback(percentCompleted,SP.File)} feedBack the feedback function is called after each file has been uploaded successfully. It returns to arguments, the 
 * first argument show the percentage of files that have been uploaded successfully, while the second argument contains the SP.FIle object of the currently uploaded file.
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SPContext} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.uploadMultipleFiles = function (fileArr, fileProperties, fileCount, feedBack, onSuccess, onFailed, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var speedContext = this;
    speedContext.uploadFile(fileArr[fileCount].dataName, fileArr[fileCount].dataURI, fileProperties[fileCount], function (fileDetails) {
        var totalFiles = fileArr.length;
        var newNumber = parseInt(fileCount) + 1;
        var completed = (newNumber / totalFiles) * 100;
        feedBack(parseInt(completed), fileDetails);
        if (completed == 100) {
            onSuccess();
        } else {
            speedContext.uploadMultipleFiles(fileArr, fileProperties, newNumber, feedBack, onSuccess, onFailed, appContext);
        }
    }, onFailedCall, appContext);
}

/**
 * The uploadMultipleLargeFile function uploads large files to a folder in a Libary or directly to a library itself. The Method is optimized as it uses the 
 * uploadLargeFile method only if the file is greater than 1.8MB
 * @param {String} fileArr an array of file objects with properties dataName & dataURI
 * @param {String} folderUrl the folder url where the files will be uploaded to
 * @param {String} fileCount the index of the file object to start in the array
 * @param {callback(percentCompleted,SP.File)} feedBack the feedback function is called after each file has been uploaded successfully. It returns to arguments, the 
 * first argument show the percentage of files that have been uploaded successfully, while the second argument contains the SP.FIle object of the currently uploaded file.
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {string} webAbsoluteUrl the absolute url of where the folder in which the file will be uploaded to resides.by default the current site url is used
 */
Speed.prototype.uploadMultipleLargeFile = function (fileArr, fileProperties, fileCount, feedBack, onSuccess, onFailed, webAbsoluteUrl, appContext) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var speedContext = this;
    if (fileArr[fileCount].dataType.toLowerCase() === "arraybuffer") {
        speedContext.uploadLargeFile(fileArr[fileCount].dataName, fileProperties[fileCount], fileArr[fileCount], function (fileDetails) {
            var totalFiles = fileArr.length;
            var newNumber = parseInt(fileCount) + 1;
            var completed = (newNumber / totalFiles) * 100;
            feedBack(parseInt(completed), fileDetails, fileProperties[fileCount], fileCount);
            if (completed == 100) {
                onSuccess();
            } else {
                speedContext.uploadMultipleLargeFile(fileArr, fileProperties, newNumber, feedBack, onSuccess, onFailed, webAbsoluteUrl, appContext);
            }
        }, onFailedCall, webAbsoluteUrl);
    } else {
        speedContext.uploadFile(fileArr[fileCount].dataName, fileArr[fileCount].dataURI, fileProperties[fileCount], function (fileDetails) {
            var totalFiles = fileArr.length;
            var newNumber = parseInt(fileCount) + 1;
            var completed = (newNumber / totalFiles) * 100;
            feedBack(parseInt(completed), fileDetails, fileProperties[fileCount], fileCount);
            if (completed == 100) {
                onSuccess();
            } else {
                speedContext.uploadMultipleLargeFile(fileArr, fileProperties, newNumber, feedBack, onSuccess, onFailed, webAbsoluteUrl, appContext);
            }
        }, onFailedCall, appContext);
    }
}

/**
 * The uploadFileChunk function uploads part of a large file to a folder in a Libary or directly to a library itself.
 * @param {String} id the GUID of the upload session
 * @param {String} fileUrl the file url on sharepoint
 * @param {object} chunk settings for the upload method to be called
 * @param {Bytes} data parts of the data to be uploaded on the current session 
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {string} webAbsoluteUrl the absolute url of where the folder in which the file will be uploaded to resides.by default the current site url is used
 */
Speed.prototype.uploadFileChunk = function (id, fileUrl, chunk, data, onSuccess, onFailed, webAbsoluteUrl) {
    let dynRoot = window.location.href.split("/");
    let dynamicUrl = dynRoot[0] + "//" + dynRoot[2];
    var dynamicWebAbsoluteUrl = dynamicUrl + this.initiate().get_url();
    var siteContextToUse = (typeof webAbsoluteUrl !== "string") ? dynamicWebAbsoluteUrl : webAbsoluteUrl
    var offset = chunk.offset === 0 ? '' : ',fileOffset=' + chunk.offset;
    //parameterising the components of this endpoint avoids the max url length problem in SP (Querystring parameters are not included in this length)  
    var endpoint = siteContextToUse + "/_api/web/getfilebyserverrelativeurl('" + fileUrl + "')/" + chunk.method + "(uploadId=guid'" + id + "'" + offset + ")";

    var requestDigest = $("#__REQUESTDIGEST").val();
    if (typeof requestDigest === "undefined") {
        requestDigest = window.speedRequestDigest;
    }

    var headers = {
        "Accept": "application/json; odata=verbose",
        "X-RequestDigest": requestDigest
    };

    $.ajax({
        url: endpoint,
        async: true,
        method: "POST",
        headers: headers,
        data: data,
        binaryStringRequestBody: true,
        processData: false,
        success: function () {
            onSuccess();
        },
        error: function (responseText) {
            var error = {
                err_description: responseText,
                resource: fileUrl,
                name: "UploadFileChunk"
            }

            onFailed(null, null, JSON.stringify(error));
        }
    });
}

/**
 * The uploadFileChunk function uploads part of a large file to a folder in a Libary or directly to a library itself.
 * @param {Speed.filesDictionary} fileProperties the details of the file in the file dictionary object
 * @param {SP.File} filedetails the uploaded file properties
 * @param {String} index the file position in the file dictionary array 
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {string} webAbsoluteUrl the absolute url of where the folder in which the file will be uploaded to resides.by default the current site url is used
 */
Speed.prototype.prepareChunkFile = function (fileProperties, filedetails, index, onSuccess, onFailed, webAbsoluteUrl) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var arrayBuffer = fileProperties.chunks[index].method === 'finishupload' ? fileProperties.dataURI.slice(fileProperties.chunks[index].offset) :
        fileProperties.dataURI.slice(fileProperties.chunks[index].offset, fileProperties.chunks[index].offset + fileProperties.chunks[index].length);

    var chunkData = arrayBuffer;

    var fileUrl = filedetails.get_serverRelativeUrl();
    speedContext.uploadFileChunk(fileProperties.GUID, fileUrl, fileProperties.chunks[index], chunkData, function () {
        index += 1;
        if (index < fileProperties.chunks.length)
            speedContext.prepareChunkFile(fileProperties, filedetails, index, onSuccess, onFailed, webAbsoluteUrl);
        else {
            onSuccess(filedetails);
        }
    }, onFailedCall, webAbsoluteUrl);
}


/**
 * Grab All Attcahments
 */
Speed.prototype.grabAllAttachments = function (returnDuplicateFiles, allowDuplicateFiles, addtionalMeta) {
    var duplicateCopiesonly = (typeof returnDuplicateFiles === "undefined") ? false : returnDuplicateFiles;
    var allowDuplicates = (typeof allowDuplicateFiles === "undefined") ? false : allowDuplicateFiles;
    var returnArray = [];
    var files = this.filesDictionary;
    for (var x in files) {
        for (var y = 0; y < files[x].files.length; y++) {
            if (typeof files[x].files[y] === 'object') {
                var metadata = this.getFileMetaData()[x];
                if (typeof metadata !== "undefined") {
                    mergedMetaData = { ...metadata, ...addtionalMeta };
                    files[x].files[y].metadata = mergedMetaData;
                }

                if (duplicateCopiesonly) {
                    if (files[x].files[y].duplicate) {
                        returnArray.push(files[x].files[y]);
                    }
                }
                else {
                    if (!files[x].files[y].duplicate || allowDuplicates) {
                        returnArray.push(files[x].files[y]);
                    }
                    else {
                        if (typeof this.filesDictionary[files[x].files[y].duplicateProp] === "undefined") {
                            this.filesDictionary[x].files[y].duplicate = false;
                            this.filesDictionary[x].files[y].duplicateRef = [];
                            delete this.filesDictionary[x].files[y].duplicateProp;
                            delete this.duplicatePosition;
                            returnArray.push(files[x].files[y]);
                        }
                    }
                }
            }
        }
    }
    return returnArray;
}

Speed.prototype.grabAllAttachmentsLinks = function () {
    var returnProperty = {};
    var files = this.filesDictionary;
    for (var Attribute in files) {
        for (var y = 0; y < files[Attribute].files.length; y++) {
            if (typeof files[Attribute].files[y] === 'string') {
                if (typeof returnProperty[Attribute] === "undefined") {
                    returnProperty[Attribute] = [];
                }
                returnProperty[Attribute].push(files[Attribute].files[y]);
            }
        }
    }
    return returnProperty;
}

Speed.prototype.getAttachmentsCatgorizedByLibrary = function (returnDuplicateFiles, allowDuplicateFiles) {
    var duplicateCopiesonly = (typeof returnDuplicateFiles === "undefined") ? false : returnDuplicateFiles;
    var allowDuplicates = (typeof allowDuplicateFiles === "undefined") ? false : allowDuplicateFiles;
    var returnProperty = {};
    var files = this.filesDictionary;
    for (var x in files) {
        for (var y = 0; y < files[x].files.length; y++) {
            if (typeof files[x].files[y] === 'object') {
                var library = files[x].files[y].library;
                if (typeof returnProperty[library] == "undefined") returnProperty[library] = [];
                if (duplicateCopiesonly) {
                    if (files[x].files[y].duplicate) {
                        returnProperty[library].push(files[x].files[y]);
                    }
                } else {
                    if (!files[x].files[y].duplicate || allowDuplicates) {
                        returnProperty[library].push(files[x].files[y]);
                    } else {
                        if (typeof this.filesDictionary[files[x].files[y].duplicateProp] === "undefined") {
                            this.filesDictionary[x].files[y].duplicate = false;
                            this.filesDictionary[x].files[y].duplicateRef = [];
                            delete this.filesDictionary[x].files[y].duplicateProp;
                            delete this.duplicatePosition;
                            returnProperty[library].push(files[x].files[y]);
                        }
                    }
                }
            }
        }
    }
    return returnProperty;
}

/**
 * The uploadFile function upload a file to a folder in a Libary or directly to a library itself
 * @param {String} sourceUrl the url of the source library where the files to be moved resides
 * @param {String} destinationUrl the url of the destination library where the files will be moved to
 * @param {callback} onSuccess this parameter is the call back function when the upload is successful. The SP.File object is returned as an argument
 * when the upload is successful.
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.moveFilesToFolder = function (sourceUrl, destinationUrl, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var web = context.get_web();

    window.speedGlobal.push(web.getFolderByServerRelativeUrl(sourceUrl));
    var total = window.speedGlobal.length;
    total--;
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(window.speedGlobal[total], 'Files');
    context.executeQueryAsync(function () {
        var files = window.speedGlobal[total].get_files();
        var e = files.getEnumerator();
        while (e.moveNext()) {
            var file = e.get_current();
            var destLibUrl = destinationUrl + "/" + file.get_name();
            file.moveTo(destLibUrl, SP.MoveOperations.overwrite);
        }
        context.executeQueryAsync(function () {
            setTimeout(function () {
                onSuccess();
            }, speedContext.latency)
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "moveFilesToFolder",
                context: speedContext,
                err_description: "error moving files to destination url",
                resource: destinationUrl
            });
        });
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "moveFilesToFolder",
            context: speedContext,
            err_description: "error getting source url context",
            resource: sourceUrl
        });
    });
}

/**
 * The addAttachmentToItem function uploads a files to the attachment folder of a list item
 * @param {String} itemID the ID of the Item the file will be uploaded to
 * @param {String} listName the name of the list the item belongs to
 * @param {String} fileArr an array of file objects with properties dataName & dataURI
 * @param {callback(percentCompleted,SP.File)} feedBack the feedback function is called after each file has been uploaded successfully. It returns to arguments, the 
 * first argument show the percentage of files that have been uploaded successfully, while the second argument contains the SP.FIle object of the currently uploaded file.
 * @param {callback} onSuccess this parameter is the call back function when all the files have been uploaded successfully
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SPContext} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 * 
 * @example
 * // returns a normal context related to the current site
 * var speedCtx = new Speed();
 * 
 * speedCtx.addAttachmentToItem("1","Documents",[{dataName: "testdoc.doc", dataURI: 'data64string' ],function(uploadStatus,fileDetails){
 *      console.log(uploadStatus + "%");
 * },function(){
 *      console.log("All files uploaded successfully");
 * });
 */
Speed.prototype.addAttachmentToItem = function (itemID, listName, fileArr, feedback, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var context = this.initiate();
    var web = context.get_web();
    var list = web.get_lists().getByTitle(listName);
    if (typeof appContext !== 'undefined') {
        context = appContext.initiate();
    }
    context.load(list, 'RootFolder');
    var item = list.getItemById(itemID);
    context.load(item);
    context.executeQueryAsync(function () {
        if (!item.get_fieldValues()['Attachments']) {
            var attachmentRootFolderUrl = String.format('{0}/Attachments', list.get_rootFolder().get_serverRelativeUrl());
            var attachmentsRootFolder = context.get_web().getFolderByServerRelativeUrl(attachmentRootFolderUrl);
            //var attachmentsFolder = attachmentsRootFolder.get_folders().add(itemID);
            var attachmentsFolder = attachmentsRootFolder.get_folders().add('_' + itemID);
            attachmentsFolder.moveTo(attachmentRootFolderUrl + '/' + itemID);
        } else {
            //
            var attachmentRootFolderUrl = String.format('{0}/Attachments/{1}', list.get_rootFolder().get_serverRelativeUrl(), itemID);
            var attachmentsFolder = context.get_web().getFolderByServerRelativeUrl(attachmentRootFolderUrl);
        }
        context.load(attachmentsFolder);
        context.executeQueryAsync(function () {
            var folderUrl = attachmentsFolder.get_serverRelativeUrl();
            var fileCount = 0;
            speedContext.uploadMultipleFiles(fileArr, folderUrl, fileCount, feedback, onSuccess, onFailed, appContext);
        }, function (sender, args) {
            speedContext.checkConnectionLatency();
            onFailedCall(sender, args, {
                name: "addAttachmentToItem",
                context: speedContext,
                err_description: "",
                resource: listName
            });
        });
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "addAttachmentToItem",
            context: speedContext,
            err_description: "",
            resource: listName
        });
    });
};

//=============================read data from text file ========================
/**
 * The readFile function reads content of a file
 * @param {String} fileurl the url of the file you want to read the contents
 * @param {callback(data)} onSuccess this parameter is the call back function when the file is successfully read, the data of the file is returned as an argument
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SPContext} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.readFile = function (fileurl, onSuccess, onFailed) {
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var spContext = this;
    spContext.ajax(fileurl, "GET", onSuccess, onFailedCall);
}

Speed.prototype.ajax = function (url, verb, success, onfailed) {
    // Creating Our XMLHttpRequest object 
    var xhr = new XMLHttpRequest();
    // Making our connection  
    xhr.open(verb, url, true);
    // function execute after request is successful 
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //console.log(this.responseText);
            success(this.responseText);
        }
        else if (this.status !== 200) {
            if (typeof onfailed !== "undefined") {
                onfailed(this.responseText, null, true);
            }
        }
    }
    // Sending our request 
    xhr.send();
}

/* basically used for files you want to upload directly into a list without attachment validations*/
Speed.prototype.uploadDirectFile = function (file, libraryUrl, onSuccess, onFailed) {
    speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    const reader = new FileReader();
    reader.onload = (function (theFile) {
        return function (e) {
            var fileObject = {};
            //callback(e.target.result); // This is the base64 data URI
            if (typeof e.target.result !== "string") {
                fileObject.dataURI = e.target.result;
                fileObject.filename = speedContext.uniqueIdGenerator();
                var offset = 0;
                var total = theFile.size;
                var length = 1000000 > total ? total : 1000000;
                var chunks = [];

                while (offset < total) {
                    if (offset + length > total)
                        length = total - offset;
                    chunks.push({
                        offset: offset,
                        length: length,
                        method: speedContext.getChunkUploadMethod(offset, length, total)
                    });
                    offset += length;
                }
                if (chunks.length > 0) {
                    fileObject.GUID = speedContext.uniqueIdGenerator();
                    fileObject.dataType = "ArrayBuffer";
                    fileObject.chunks = chunks;
                }

                speedContext.uploadLargeFile(fileObject.filename, libraryUrl, fileObject, function (fileDetails) {
                    onSuccess(fileDetails);
                }, onFailedCall);
            }
            else {
                speedContext.uploadFile(speedContext.uniqueIdGenerator(), e.target.result, libraryUrl, function (fileDetails) {
                    onSuccess(fileDetails);
                }, onFailedCall);
            }
        }
    })(file);

    //if file size is greater than 1.8MB and on o365 Platform
    if (file.size > 1487436.8) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsDataURL(file);
    }
};

/**
 * The readFile function reads content of a file
 * @param {String} elementId the id of the element to apply the event handler on
 * @param {String} properties the settings for the file to be uploaded
 * @param {callback(data)} onSuccess this parameter is the call back function when the a file is selected
 * @param {callback(error)} onFailed this parameter is the call back function thats called when the function fails
 */
Speed.prototype.applyAttachmentEvent = function (properties, onSuccess, onFailed) {
    var speedContext = this;

    var attachments = this.getAttachmentControls();
    for (var z = 0; z < attachments.length; z++) {
        var elementId = attachments[z].id;
        var tagName = attachments[z].type;

        if (tagName === "file" && $.inArray(elementId, speedContext.appliedEvents.attachments) < 0) {
            speedContext.appliedEvents.attachments.push(elementId);
            document.getElementById(elementId).addEventListener('change', function (evt) {
                var elementId = this.id;
                var fileCount = 0;
                var maxFileSize = (typeof properties.maxSize !== "undefined") ? properties.maxSize : 5100;
                var acceptedFiles = ["png", "jpeg", "jpg", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv"];
                var overrideDefaultFiles = (typeof properties.overrideDefaultFiles === "undefined") ? false : properties.overrideDefaultFiles;
                if (overrideDefaultFiles) {
                    var elementBindProperty = (document.getElementById(elementId).getAttribute("speed-file-bind") === null) ?
                        document.getElementById(elementId).getAttribute("speed-file-validate") : document.getElementById(elementId).getAttribute("speed-file-bind");

                    acceptedFiles = properties.fileExtensions;
                    if (typeof properties.fileExtensions !== "undefined") {
                        if (typeof properties.fileExtensions[elementBindProperty] !== "undefined" && typeof properties.fileExtensions[elementBindProperty] !== null) {
                            acceptedFiles = properties.fileExtensions[elementBindProperty];
                        }
                    }
                } else {
                    var extensions = properties.fileExtensions;
                    var elementBindProperty = (document.getElementById(elementId).getAttribute("speed-file-bind") === null) ?
                        document.getElementById(elementId).getAttribute("speed-file-validate") : document.getElementById(elementId).getAttribute("speed-file-bind");
                    if (typeof properties.fileExtensions !== "undefined") {
                        if (typeof properties.fileExtensions[elementBindProperty] !== "undefined" && typeof properties.fileExtensions[elementBindProperty] !== null) {
                            extensions = properties.fileExtensions[elementBindProperty];
                        }
                    }
                    acceptedFiles = (typeof properties.fileExtensions === "undefined") ? acceptedFiles : (acceptedFiles.concat(extensions));
                }

                //element file type
                try {
                    acceptedFiles = (document.getElementById(elementId).getAttribute("speed-file-type") === null) ?
                        acceptedFiles : document.getElementById(elementId).getAttribute("speed-file-type").split(",");
                } catch (e) {

                }

                var useDynamicName = (typeof properties.dynamicNaming === "undefined") ? true : properties.dynamicNaming;
                useDynamicName = (typeof properties.dynamicNameFunc === "function") ? true : useDynamicName;

                var avoidDuplicateUploads = (typeof properties.avoidDuplicate === "undefined") ? false : properties.avoidDuplicate;

                var userToConfirmDuplicates = (typeof properties.userConfirmDuplicates === "undefined") ? true : properties.userConfirmDuplicates;

                var userConfirmMsg = (typeof properties.userConfirmMsg === "undefined") ?
                    "Duplicate file selected, please confirm this is the same file {{FileName}} with a previously uploaded file to avoid duplicate uploads" : properties.userConfirmMsg;

                var confirmDuplicateFunc = (typeof properties.confirmFunc !== "undefined") ? properties.confirmFunc : confirm;

                var appendFiles = (typeof properties.appendFiles === "undefined") ? false : properties.appendFiles;

                var useCancelToClear = (typeof properties.cancelClear === "undefined") ? true : properties.cancelClear;

                var useFileName = (typeof properties.fileNameasName === "undefined") ? false : properties.fileNameasName;

                var eachFileProperties = (typeof properties.fileProperties !== "undefined") ? properties.fileProperties : {};

                var extensionToOveride = (typeof properties.overideFileExtension !== "undefined") ? properties.overideFileExtension : "";

                //used to group files by document libraries
                var documentLibrary = (document.getElementById(elementId).getAttribute("speed-file-library") === null) ?
                    "Documents" : document.getElementById(elementId).getAttribute("speed-file-library");

                appendFiles = (document.getElementById(elementId).getAttribute("speed-file-append") === null) ?
                    appendFiles : (document.getElementById(elementId).getAttribute("speed-file-append") === "true");

                properties.o365 = (typeof properties.o365 !== "undefined") ? properties.o365 : false;
                //when event is clicked 
                if (window.File && window.FileReader && window.FileList && window.Blob) {
                    // Great success! All the File APIs are supported.

                    var files = evt.target.files; // FileList object
                    var filesId = evt.target.id;
                    var totalFilesPerClick = files.length;

                    //remove speederror class
                    $("#" + filesId).removeClass("speedhtmlerr");
                    // Loop through the FileList 
                    for (var i = 0, f; f = files[i]; i++) {
                        var reader = new FileReader();
                        reader.onload = (function (theFile) {
                            return function (e) {
                                // Render thumbnail.
                                var fileSize = theFile.size / 1000;
                                var fileType = theFile.type;
                                var fileNameSplit = theFile.name.split(".");
                                var fileExt = fileNameSplit.pop();
                                if ($.inArray(fileExt.toLowerCase(), acceptedFiles) >= 0) {
                                    if (fileSize < maxFileSize) {
                                        fileCount++;
                                        fileExt = (extensionToOveride === "") ? fileExt : extensionToOveride;
                                        var elementBindProperty = (document.getElementById(filesId).getAttribute("speed-file-bind") === null) ?
                                            document.getElementById(filesId).getAttribute("speed-file-validate") : document.getElementById(filesId).getAttribute("speed-file-bind");
                                        //data name default used to give a default name to the files
                                        var defaultName = (typeof properties.dataNameDefault === "undefined") ? elementBindProperty : properties.dataNameDefault;
                                        defaultName = (typeof eachFileProperties[elementBindProperty] === "undefined") ? defaultName : eachFileProperties[elementBindProperty].name;

                                        var filePosition = 0;
                                        if (appendFiles && typeof speedContext.filesDictionary[elementBindProperty] !== "undefined") {
                                            filePosition = speedContext.filesDictionary[elementBindProperty].files.length
                                            fileCount = filePosition + 1;
                                        }

                                        var fileObject = {};
                                        fileObject.duplicate = false;
                                        fileObject.duplicateRef = [];
                                        fileObject.dataURI = e.target.result;
                                        fileObject.position = filePosition;
                                        fileObject.filename = theFile.name;
                                        fileObject.property = elementBindProperty;

                                        if (useDynamicName) {
                                            fileObject.dataName = (typeof properties.dynamicNameFunc === "function") ?
                                                properties.dynamicNameFunc(fileExt, fileObject, defaultName) : (defaultName + "-" + fileCount + "-" + speedContext.stringnifyDate({
                                                    includeTime: true,
                                                    timeSpace: false,
                                                    format: "dd-mm-yy"
                                                }) + "." + fileExt);
                                        } else {
                                            fileObject.dataName = (defaultName + "." + fileExt);
                                        }


                                        var fileName_Duplicate_In_Same_NameSpace = false;

                                        //===============Duplication section============
                                        if (typeof speedContext.filesDictionary[elementBindProperty] !== "undefined") {
                                            var filesInNameSpace = speedContext.filesDictionary[elementBindProperty].files;
                                            for (var b = 0; b < filesInNameSpace.length; b++) {
                                                var fileNameToCompare = "";
                                                if (typeof filesInNameSpace[b] === "string") {
                                                    var splitedLinks = filesInNameSpace[b].split("/");
                                                    var pos = splitedLinks.length - 1;
                                                    fileNameToCompare = splitedLinks[pos];
                                                } else {
                                                    fileNameToCompare = filesInNameSpace[b].filename;
                                                }
                                                var useNameToCompare = (typeof properties.useOrginalFileNameToCompare == "undefined") ? true : properties.useOrginalFileNameToCompare;
                                                var nameToCompare = (useNameToCompare) ? fileObject.filename : fileObject.dataName;
                                                if (nameToCompare === fileNameToCompare) {
                                                    fileName_Duplicate_In_Same_NameSpace = true;
                                                    break;
                                                }
                                            }
                                        }

                                        if (avoidDuplicateUploads && !fileName_Duplicate_In_Same_NameSpace) {
                                            var fileNamesForUpload = speedContext.grabAllAttachments();
                                            for (var a = 0; a < fileNamesForUpload.length; a++) {
                                                if (fileObject.filename === fileNamesForUpload[a].filename) {

                                                    //Ensures the same file isnt uploaded with the same Property Space
                                                    if (elementBindProperty !== fileNamesForUpload[a].property) {
                                                        if (userToConfirmDuplicates) {
                                                            userConfirmMsg = userConfirmMsg.replace(/{{FileName}}/g, fileNamesForUpload[a].filename);
                                                            if (confirmDuplicateFunc(userConfirmMsg)) {
                                                                fileObject.duplicate = true;
                                                                fileObject.duplicateProp = fileNamesForUpload[a].property;
                                                                fileObject.duplicatePosition = fileNamesForUpload[a].position;
                                                                speedContext.filesDictionary[fileObject.duplicateProp][fileNamesForUpload[a].position].duplicateRef.push(elementBindProperty);
                                                            }
                                                        } else {
                                                            fileObject.duplicate = true;
                                                            fileObject.duplicateProp = fileNamesForUpload[a].property;
                                                            fileObject.duplicatePosition = fileNamesForUpload[a].position;
                                                            speedContext.filesDictionary[fileObject.duplicateProp][fileNamesForUpload[a].position].duplicateRef.push(elementBindProperty);
                                                        }
                                                    } else {
                                                        fileName_Duplicate_In_Same_NameSpace = true;
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        //============== End of Duplication section ============
                                        var fileNameIsValid = true;

                                        if (useFileName) {
                                            var validationResult = speedContext.validationProperties.file.validate(fileObject.filename, "File", filesId);
                                            if (!validationResult) {
                                                fileNameIsValid = false;
                                            } else {
                                                if (useDynamicName) {
                                                    var nameDetails = fileObject.filename.split(".");
                                                    fileObject.dataName = (typeof properties.dynamicNameFunc === "function") ?
                                                        properties.dynamicNameFunc(fileExt, fileObject, nameDetails[0]) : (nameDetails[0] + "-" + fileCount + "-" + speedContext.stringnifyDate({
                                                            includeTime: true,
                                                            timeSpace: false,
                                                            format: "dd-mm-yy"
                                                        }) + "." + fileExt);
                                                }
                                                else {
                                                    fileObject.dataName = fileObject.filename;
                                                }
                                            }
                                        }

                                        fileObject.extension = fileExt.toLowerCase();
                                        fileObject.id = filesId;
                                        fileObject.dataType = "string";
                                        fileObject.library = documentLibrary;
                                        if (typeof e.target.result !== "string") {
                                            var offset = 0;
                                            var total = theFile.size;
                                            var length = 1000000 > total ? total : 1000000;
                                            var chunks = [];

                                            while (offset < total) {
                                                if (offset + length > total)
                                                    length = total - offset;
                                                chunks.push({
                                                    offset: offset,
                                                    length: length,
                                                    method: speedContext.getChunkUploadMethod(offset, length, total)
                                                });
                                                offset += length;
                                            }
                                            if (chunks.length > 0) {
                                                fileObject.GUID = speedContext.uniqueIdGenerator();
                                                fileObject.dataType = "ArrayBuffer";
                                                fileObject.chunks = chunks;
                                            }
                                        }

                                        if (fileCount === 1 && !appendFiles && typeof speedContext.filesDictionary[elementBindProperty] === "undefined") {
                                            speedContext.filesDictionary[elementBindProperty] = { files: [], folder: "" };
                                        } else if (typeof speedContext.filesDictionary[elementBindProperty] === "undefined" || !appendFiles) {
                                            speedContext.filesDictionary[elementBindProperty] = { files: [], folder: "" };
                                        }

                                        if (totalFilesPerClick === i && fileNameIsValid && !fileName_Duplicate_In_Same_NameSpace) {
                                            speedContext.filesDictionary[elementBindProperty].files.push(fileObject);
                                            onSuccess(elementBindProperty, speedContext.filesDictionary[elementBindProperty], filesId);
                                        }

                                        if (fileName_Duplicate_In_Same_NameSpace) {
                                            var errorProp = {
                                                msg: "Your attachment (" + fileObject.filename + "), already exist for this attachment block",
                                                type: "invalidfile",
                                                elementid: filesId
                                            };
                                            onFailed(errorProp);
                                            speedContext.clearFileInput(filesId);
                                        }

                                        if (!fileNameIsValid) {
                                            var errorProp = {
                                                msg: "your attachment has an invalid file name(" + fileObject.filename + ")",
                                                type: "invalidfile",
                                                elementid: filesId
                                            };
                                            onFailed(errorProp);
                                            speedContext.clearFileInput(filesId);
                                        }
                                    } else {
                                        var errorProp = {
                                            msg: "your item is greater than " + maxFileSize + " and will not be included",
                                            type: "size",
                                            elementid: filesId
                                        };
                                        onFailed(errorProp);
                                        speedContext.clearFileInput(filesId);
                                    }
                                } else {
                                    var errorProp = {
                                        msg: "One of your items file and will not be included because the format isnt accepted",
                                        type: "format",
                                        elementid: filesId
                                    };
                                    onFailed(errorProp);
                                    speedContext.clearFileInput(filesId);
                                }
                            };
                        })(f);
                        //if file size is greater than 1.8MB and on o365 Platform
                        if (files[i].size > 1487436.8 && properties.o365) {
                            reader.readAsArrayBuffer(f);
                        } else {
                            reader.readAsDataURL(f);
                        }
                    }

                    if (files.length === 0 && useCancelToClear) {
                        var elementBindProperty = (document.getElementById(filesId).getAttribute("speed-file-bind") === null) ?
                            document.getElementById(filesId).getAttribute("speed-file-validate") : document.getElementById(filesId).getAttribute("speed-file-bind");
                        speedContext.filesDictionary[elementBindProperty] = [];
                        onSuccess(elementBindProperty, speedContext.filesDictionary[elementBindProperty]);
                    }
                } else {
                    onFailed('The File APIs are not fully supported in this browser.');
                }
            }, false);
        }
    }

}

Speed.prototype.getChunkUploadMethod = function (offset, length, total) {
    if (offset + length + 1 > total) {
        return 'finishupload';
    } else if (offset === 0) {
        return 'startupload';
    } else if (offset < total) {
        return 'continueupload';
    }
    return null;
}

//------------------------check if file exist in documnet library---------------------
/**
 * The getFileExists function checks if a file exist on sharepoint
 * @param {String} fileurl the url of the file to check
 * @param {callback(state)} onSuccess this parameter is the call back function when the call was successful, a boolean value is returned as an argument.
 * true if the file exist and false if the file doesn't
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {SPContext} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getFileFolderExists = function (fileFolderUrl, fileorfolder, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var ctx = this.initiate();
    if (fileorfolder.toLowerCase() === "file") {
        var file = ctx.get_web().getFileByServerRelativeUrl(fileFolderUrl);
    } else {
        var file = ctx.get_web().getFolderByServerRelativeUrl(fileFolderUrl);
    }

    if (typeof appContext !== 'undefined') {
        ctx = appContext.initiate();
    }
    ctx.load(file);
    ctx.executeQueryAsync(function () {
        onSuccess(true);
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "getFileFolderExists",
            context: speedContext,
            err_description: "",
            resource: fileFolderUrl
        });
    });
}

/**
 * The logWriter function upload or updates a text file in a Libary, this is used for keeping logs
 * @param {string} logName the name of the log file
 * @param {string} logContent the content of the log file
 * @param {string} library the library where the log file will be saved
 * @param {String} libraryUrl the library url where the files will be uploaded to 
 * @param {int} logLimit the log file size limit before another log is created
 * @param {callback} callback this parameter is the call back function when the logis successfully written to the document library
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default
 * onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = {}] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.logWriter = function (logName, logContent, library, logLimit, callback, onFailed, appContext) {
    var speedContext = this;
    var onFailedCall = (typeof onFailed === 'undefined' || onFailed == null) ? this.errorHandler : onFailed;
    var query = [{
        orderby: "ID",
        rowlimit: 1,
        ascending: "FALSE"
    }];
    speedContext.getItem(library, speedContext.camlBuilder(query), function (speedlog) {
        var logsCount = 0;
        var listEnumerator = speedlog.getEnumerator();
        var itemDetails = {};
        while (listEnumerator.moveNext()) {
            logsCount++;
            itemDetails.name = listEnumerator.get_current().get_item('FileLeafRef');
            itemDetails.url = listEnumerator.get_current().get_item('FileRef');
            itemDetails.size = listEnumerator.get_current().get_item('File_x0020_Size');
        }
        var libraryUrl = speedlog.get_context().get_url();
        libraryUrl = (libraryUrl.endsWith("/")) ? libraryUrl.slice(0, -1) : libraryUrl;
        libraryUrl += "/" + library;
        if (logsCount == 0 || itemDetails.size > logLimit) {
            //this logs of file if no log text file is present or if the log is greater than limit passed
            var fileName = `${logName}-` + speedContext.stringnifyDate({
                includeTime: true,
                timeSpace: false,
                format: "dd-mm-yy"
            }) + ".txt";
            speedContext.uploadFile(fileName, logContent, libraryUrl, callback, onFailed, appContext);
        } else {
            speedContext.readFile(itemDetails.url, function (data) {
                data += logContent;
                speedContext.uploadFile(itemDetails.name, data, libraryUrl, callback, onFailed, appContext);
            }, function (err) {
                setTimeout(function () {
                    onFailedCall(err);
                }, speedContext.latency);
            })
        }
    }, function (sender, args) {
        speedContext.checkConnectionLatency();
        onFailedCall(sender, args, {
            name: "logWriter",
            context: speedContext,
            err_description: "couldnt log data to log file",
            resource: library
        });
    });
}

/* ============================== Debugging Section  ============================*/
/**
 * The onQueryFailed function is the async function for all sharepoint related methods when those methods fail,
 * this method can be overridden when calling sharepoint methods by passing the name of your custom function in the onFailed parameter
 * @param {object} sender 
 * @param {object} args this object contains information about the error
 */
Speed.prototype.onQueryFailed = function (sender, args) {
    try {
        console.log('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
    } catch (e) {
        console.log('Request failed. ' + sender.msg);
    }
}

Speed.prototype.debugHandler = function (code, type, id, extension) {
    var errorDefinitions = {
        "1111": function () {
            var errorMsg = "validation failed, there is no custom extended function '" + extension + "' created for this element with " +
                " ID '" + id + "' of type: '" + type + "'  to handle this validation..";
            return errorMsg;
        },
        "1112": function () {
            var errorMsg = "validation failed, there is no id for this element";
            return errorMsg;
        },
        "1113": function () {
            var errorMsg = "validation failed, the extension '" + extension + "' for this element " +
                " ID '" + id + "' of type: '" + type + "'  is invalid as multivalue extension only works for checkbox(s)";
            return errorMsg;
        },
        "1114": function () {
            var errorMsg = "validation failed, invalid file name for the attached document";
            return errorMsg;
        }
    }
    var msg = errorDefinitions[code]();
    console.log(msg);
}

/* ============================== Table Section ============================*/
/**
 * Exports a List to an Table. Creates the TBody content of a list based on the query
 * @param {String} listName this parameter specifices the list which the data are to be retrieved
 * @param {String} caml this parameter specifices the caml query to be used for the list
 * @param {Array} controls this parameter specifices the Extra Column data to be added, Array of Strings
 * @param {Function} conditions this parameter includes special conditions for each object properties, condition must return an object. look up getListToItems to see
 *  definition of this parameter
 * @param {callback(itemsData)} onSuccess this parameter is the call back function thats called when the rows has successfully been retrieved.the items reterived 
 *  is passed as an argument of type Array
 * @param {callback(sender,args)} [onFailed = this.onQueryFailed()] this parameter is the call back function thats called when the function fails, by default onQueryFailed is called when all sharepoint async calls fail
 * @param {object} [appContext = Object] instance of the speedpoint app context created, used for o365 Cross Domain Request
 */
Speed.prototype.getListToTable = function (listName, caml, controls, conditions, onSuccess, onFailed, appContext) {
    var speedContext = this;
    var resetDataTable = (typeof controls.resetTable === "undefined") ? true : controls.resetTable;
    if (resetDataTable) {
        speedContext.DataForTable.tabledata = [];
    }
    speedContext.DataForTable.lastPageItem = speedContext.DataForTable.currentPage * speedContext.DataForTable.pagesize;
    speedContext.getListToItems(listName, caml, controls, true, conditions, function (requestItems) {
        //gets only table controls
        var tableId = (typeof controls.tableid !== "") ? controls.tableid : "";
        var tableControls = speedContext.getControls(true, tableId);
        speedContext.DataForTable.tabledata = speedContext.DataForTable.tabledata.concat(requestItems);
        var Arr = speedContext.DataForTable.tabledata;
        if (Arr.length != 0) {
            $('#' + speedContext.DataForTable.tablecontentId).empty();
            $("#" + speedContext.DataForTable.paginationbId).show();
            $("#" + speedContext.DataForTable.paginationuId).show();
            speedContext.DataForTable.activeClass = 1;
            var total = Arr.length;
            speedContext.DataForTable.noOfPages = Math.ceil(Arr.length / speedContext.DataForTable.pagesize);
            if (total < speedContext.DataForTable.lastPageItem) {
                speedContext.DataForTable.lastPageItem = total;
            }
            var str = "";
            for (x = 0; x < speedContext.DataForTable.lastPageItem; x++) {
                if (speedContext.DataForTable.modifyTR) {
                    str += speedContext.DataForTable.trExpression(x);
                } else {
                    str += "<tr>";
                }
                if (speedContext.DataForTable.includeSN) {
                    str += "<td>" + (x + 1) + "</td>";
                }

                for (var y = 0; y < tableControls.length; y++) {
                    var propName = tableControls[y];
                    var groupName = $("[speed-table-data='" + propName + "']").attr("speed-table-group");
                    groupName = (typeof groupName !== "undefined") ? groupName : "SP-NOTApplicable";

                    var useTD = $("[speed-table-data='" + propName + "']").attr("speed-table-includetd");
                    useTD = (typeof useTD !== "undefined") ? (useTD === "true") : true;

                    if (Arr[x][propName] !== "undefined") {
                        if (speedContext.DataForTable.propertiesHandler.hasOwnProperty(groupName)) {
                            if (useTD) {
                                str += "<td>" + speedContext.DataForTable.propertiesHandler[groupName](Arr[x], x, propName, this) + "</td>";
                            } else {
                                str += speedContext.DataForTable.propertiesHandler[groupName](Arr[x], x, propName, this);
                            }
                        }
                        else if (speedContext.DataForTable.propertiesHandler.hasOwnProperty(propName)) {
                            if (useTD) {
                                str += "<td>" + speedContext.DataForTable.propertiesHandler[propName](Arr[x], x, propName, this) + "</td>";
                            } else {
                                str += speedContext.DataForTable.propertiesHandler[propName](Arr[x], x, propName, this);
                            }
                        } else
                            str += "<td>" + Arr[x][propName] + "</td>";
                    } else {
                        str += "<td></td>";
                    }
                }
                str += "</tr>";
            }
            $('#' + speedContext.DataForTable.tablecontentId).append(str);
            speedContext.DataForTable.paginateLinks(1, speedContext.DataForTable.paginateSize, speedContext.DataForTable);
            $("#" + speedContext.DataForTable.paginationbId + " li a." + speedContext.DataForTable.tablecontentId + "-moveback").hide();
            $("#" + speedContext.DataForTable.paginationuId + " li a." + speedContext.DataForTable.tablecontentId + "-moveback").hide();
            if (speedContext.DataForTable.noOfPages <= speedContext.DataForTable.paginateSize) {
                $("#" + speedContext.DataForTable.paginationbId + " li a." + speedContext.DataForTable.tablecontentId + "-movefront").hide();
                $("#" + speedContext.DataForTable.paginationuId + " li a." + speedContext.DataForTable.tablecontentId + "-movefront").hide();
            }
        } else {
            $('#' + speedContext.DataForTable.tablecontentId).empty();
            $("#" + speedContext.DataForTable.paginationbId).hide();
            $("#" + speedContext.DataForTable.paginationuId).hide();
        }
        onSuccess(speedContext.DataForTable.tabledata);
    }, onFailed, appContext);
}

/**
 * Exports a Array to a Table. Creates the TBody content of the array passed
 * @param {String} tableData this parameter specifices the data to create the table
 */
Speed.prototype.manualTable = function (tableData, settings) {
    settings = (typeof settings === "undefined") ? {} : settings;
    settings.conditions = (typeof settings.conditions === "undefined") ? {} : settings.conditions;
    this.DataForTable.lastPageItem = this.DataForTable.currentPage * this.DataForTable.pagesize;
    var tableControls = (typeof settings.controls === "undefined") ? this.getControls(true, "") : settings.controls;
    this.DataForTable.controls = tableControls;
    this.DataForTable.tabledata = tableData;
    if (this.DataForTable.tabledata.length != 0) {
        $('#' + this.DataForTable.tablecontentId).empty();
        $("#" + this.DataForTable.paginationbId).show();
        $("#" + this.DataForTable.paginationuId).show();
        //this.DataForTable.activeClass = 1;
        var total = this.DataForTable.tabledata.length;
        this.DataForTable.noOfPages = Math.ceil(total / this.DataForTable.pagesize);
        if (total < this.DataForTable.lastPageItem) {
            this.DataForTable.lastPageItem = total;
        }
        var str = "";
        if (typeof settings.condition === "function") {
            for (var i = 0; i < this.DataForTable.tabledata.length; i++) {
                this.DataForTable.tabledata[i] = settings.conditions(this.DataForTable.tabledata[i], i);
            }
        }

        for (x = 0; x < this.DataForTable.lastPageItem; x++) {
            if (this.DataForTable.modifyTR) {
                str += this.DataForTable.trExpression(x);
            } else {
                str += "<tr>";
            }
            if (this.DataForTable.includeSN) {
                str += "<td>" + (x + 1) + "</td>";
            }

            for (var y = 0; y < tableControls.length; y++) {
                var propName = tableControls[y];
                var groupName = $("[speed-table-data='" + propName + "']").attr("speed-table-group");
                groupName = (typeof groupName !== "undefined") ? groupName : "SP-NOTApplicable";

                var useTD = $("[speed-table-data='" + propName + "']").attr("speed-table-includetd");
                useTD = (typeof useTD !== "undefined") ? (useTD === "true") : true;

                if (this.DataForTable.tabledata[x][propName] !== "undefined") {
                    if (this.DataForTable.propertiesHandler.hasOwnProperty(groupName)) {
                        if (useTD) {
                            str += "<td>" + this.DataForTable.propertiesHandler[groupName](this.DataForTable.tabledata[x], x, propName, this) + "</td>";
                        } else {
                            str += this.DataForTable.propertiesHandler[groupName](this.DataForTable.tabledata[x], x, propName, this);
                        }
                    }
                    else if (this.DataForTable.propertiesHandler.hasOwnProperty(propName)) {
                        if (useTD) {
                            str += "<td>" + this.DataForTable.propertiesHandler[propName](this.DataForTable.tabledata[x], x, propName, this) + "</td>";
                        } else {
                            str += this.DataForTable.propertiesHandler[propName](this.DataForTable.tabledata[x], x, propName, this);
                        }
                    } else
                        str += "<td>" + this.DataForTable.tabledata[x][propName] + "</td>";
                } else {
                    str += "<td></td>";
                }
            }
            str += "</tr>";
        }
        $('#' + this.DataForTable.tablecontentId).append(str);
        this.DataForTable.paginateLinks(this.DataForTable.currentPos, this.DataForTable.paginateSize, this.DataForTable);
        $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-moveback").hide();
        $("#" + this.DataForTable.paginationuId + " li a." + this.DataForTable.tablecontentId + "-moveback").hide();
        if (this.DataForTable.noOfPages <= this.DataForTable.paginateSize) {
            $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-movefront").hide();
            $("#" + this.DataForTable.paginationuId + " li a." + this.DataForTable.tablecontentId + "-movefront").hide();
        }

        if (this.DataForTable.lazyLoadInitiated && this.DataForTable.noOfPages <= this.DataForTable.paginateSize) {
            $("#" + this.DataForTable.paginationbId).append("<li class='spgetitems'> <a class='" + this.DataForTable.tablecontentId + "-getpages'>>></a> </li>");
            $("#" + this.DataForTable.paginationuId).append("<li class='spgetitems'> <a class='" + this.DataForTable.tablecontentId + "-getpages'>>></a> </li>");

            $("." + this.DataForTable.tablecontentId + "-getpages").click(function () {
                this.DataForTable.context.serverDeliverItems(this.DataForTable.serverDeliverySettings);
            });
        }
    } else {
        $('#' + this.DataForTable.tablecontentId).empty();
        $("#" + this.DataForTable.paginationbId).hide();
        $("#" + this.DataForTable.paginationuId).hide();
    }
}

Speed.prototype.serverDeliverItems = function (settings) {
    var speedContext = this;
    settings.conditions = (typeof settings.conditions === "undefined") ? null : settings.conditions;
    settings.contenttype = (typeof settings.contenttype === "undefined") ? "table" : settings.contenttype;
    speedContext.DataForTable.context = speedContext;
    speedContext.DataForTable.serverDeliverySettings = settings;
    speedContext.DataForTable.lazyLoadInitiated = false;

    settings.caml[0].rowlimit = (typeof settings.caml[0].rowlimit !== "undefined") ? settings.caml[0].rowlimit : settings.rowlimit;
    settings.caml[0].orderby = "ID";
    settings.caml[0].ascending = (typeof settings.caml[0].ascending !== "undefined") ? settings.caml[0].ascending : "FALSE";
    var newCaml = [];
    if (speedContext.DataForTable.tabledata.length !== 0) {
        var pos = speedContext.DataForTable.tabledata.length - 1;
        speedContext.DataForTable.lastSPItemID = speedContext.DataForTable.tabledata[pos].ID;

        var camlquery = speedContext.deferenceObject(settings.caml);
        var settingsObject = speedContext.deferenceObject(camlquery[0]);

        camlquery[0] = {
            operator: (settingsObject.ascending === "FALSE") ? "Lt" : "Gt",
            type: 'Number',
            field: settingsObject.orderby,
            val: speedContext.DataForTable.lastSPItemID
        }

        //insert new query object into caml object
        camlquery.unshift(settingsObject);
        newCaml = camlquery;
    } else {
        newCaml = settings.caml;
    }


    var query = speedContext.camlBuilder(newCaml);

    if (typeof settings.beforeLoadingItems === "function") {
        settings.beforeLoadingItems();
    }

    speedContext.getListToItems(settings.listName, query, settings.controls, true, settings.conditions, function (requestItems) {
        if (requestItems.length !== 0) {
            if (requestItems.length == settings.rowlimit) {
                speedContext.DataForTable.lazyLoadInitiated = true;
            }

            speedContext.DataForTable.tabledata = speedContext.DataForTable.tabledata.concat(requestItems);
            if (speedContext.DataForTable.serverDeliverySettings.methodCall == "table")
                speedContext.manualTable(speedContext.DataForTable.tabledata, speedContext.DataForTable.serverDeliverySettings.methodSetting);
            else
                speedContext.customElementPagination(speedContext.DataForTable.tabledata, speedContext.DataForTable.serverDeliverySettings.methodSetting);
            speedContext.DataForTable.nextItems(speedContext.DataForTable.activeClass, speedContext.DataForTable);
            speedContext.DataForTable.moveLinks("same", speedContext.DataForTable);
        } else {
            $("#" + speedContext.DataForTable.paginationuId + " li.spgetitems").remove();
            $("#" + speedContext.DataForTable.paginationbId + " li.spgetitems").remove();
        }

        if (typeof settings.afterLoadingItems === "function") {
            settings.afterLoadingItems();
        }
    });


}

/**
 * Exports a Array to a Custom Element Pagination.
 * @param {String} tableData this parameter specifices the data to create the table
 */
Speed.prototype.customElementPagination = function (tableData, blockElement) {
    this.DataForTable.lastPageItem = this.DataForTable.currentPage * this.DataForTable.pagesize;
    this.DataForTable.tabledata = tableData;
    this.DataForTable.customPaginate = true;
    this.DataForTable.customBlock = blockElement;
    var Arr = this.DataForTable.tabledata;
    if (Arr.length != 0) {
        $('#' + this.DataForTable.tablecontentId).empty();
        $("#" + this.DataForTable.paginationbId).show();
        $("#" + this.DataForTable.paginationuId).show();
        //this.DataForTable.activeClass = 1;
        var total = Arr.length;
        this.DataForTable.noOfPages = Math.ceil(Arr.length / this.DataForTable.pagesize);
        if (total < this.DataForTable.lastPageItem) {
            this.DataForTable.lastPageItem = total;
        }
        var str = "";
        for (x = 0; x < this.DataForTable.lastPageItem; x++) {
            var innerElement = "";
            if (typeof blockElement === "string") {
                innerElement = blockElement;
            }
            else {
                if (typeof Arr[x]["BLOCK"] !== "undefined") {
                    innerElement = blockElement[Arr[x]["BLOCK"]];
                }
            }
            if (typeof Arr[x]["CUSTOMDEF"] !== "undefined") {
                for (var propName in Arr[x]["CUSTOMDEF"]) {
                    try {
                        var stringToFind = "{{CUSTOMDEF_" + propName + "}}";
                        var regex = new RegExp(stringToFind, "g");
                        innerElement = innerElement.replace(regex, Arr[x]["CUSTOMDEF"][propName]);
                    } catch (e) { }
                }
            }

            var elementPos = "{{DATAPOSITION}}";
            var regex = new RegExp(elementPos, "g");
            innerElement = innerElement.replace(regex, x);

            for (var propName in Arr[x]) {
                try {
                    var stringToFind = "{{" + propName + "}}";
                    var regex = new RegExp(stringToFind, "g");
                    if (this.DataForTable.propertiesHandler.hasOwnProperty(propName)) {
                        var value = this.DataForTable.propertiesHandler[propName](Arr[x], x, propName, this);
                        innerElement = innerElement.replace(regex, value);
                    }
                    else {
                        innerElement = innerElement.replace(regex, Arr[x][propName]);
                    }

                } catch (e) { }
            }
            str += innerElement;
        }
        $('#' + this.DataForTable.tablecontentId).append(str);
        this.DataForTable.paginateLinks(this.DataForTable.currentPos, this.DataForTable.paginateSize, this.DataForTable);
        $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-moveback").hide();
        $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-moveback").hide();
        if (this.DataForTable.noOfPages <= this.DataForTable.paginateSize) {
            $("#" + this.DataForTable.paginationbId + " li a." + this.DataForTable.tablecontentId + "-movefront").hide();
            $("#" + this.DataForTable.paginationuId + " li a." + this.DataForTable.tablecontentId + "-movefront").hide();
        }

        if (this.DataForTable.lazyLoadInitiated && this.DataForTable.noOfPages <= this.DataForTable.paginateSize) {
            $("#" + this.DataForTable.paginationbId).append("<li class='spgetitems'> <a class='" + this.DataForTable.tablecontentId + "-getpages'>>></a> </li>");
            $("#" + this.DataForTable.paginationuId).append("<li class='spgetitems'> <a class='" + this.DataForTable.tablecontentId + "-getpages'>>></a> </li>");

            $("." + this.DataForTable.tablecontentId + "-getpages").click(function () {
                this.DataForTable.context.serverDeliverItems(this.DataForTable.serverDeliverySettings);
            });
        }
    } else {
        $('#' + this.DataForTable.tablecontentId).empty();
        $("#" + this.DataForTable.paginationbId).hide();
        $("#" + this.DataForTable.paginationuId).hide();
    }
}

/**
 * IE SHIMS (10 && 11)
 * Fix for file upload for large chunk files on Internet explorer 10 and 11
 */
if (!ArrayBuffer.prototype.slice) {
    //Returns a new ArrayBuffer whose contents are a copy of this ArrayBuffer's
    //bytes from `begin`, inclusive, up to `end`, exclusive
    ArrayBuffer.prototype.slice = function (begin, end) {
        //If `begin` is unspecified, Chrome assumes 0, so we do the same
        if (begin === void 0) {
            begin = 0;
        }

        //If `end` is unspecified, the new ArrayBuffer contains all
        //bytes from `begin` to the end of this ArrayBuffer.
        if (end === void 0) {
            end = this.byteLength;
        }

        //Chrome converts the values to integers via flooring
        begin = Math.floor(begin);
        end = Math.floor(end);

        //If either `begin` or `end` is negative, it refers to an
        //index from the end of the array, as opposed to from the beginning.
        if (begin < 0) {
            begin += this.byteLength;
        }
        if (end < 0) {
            end += this.byteLength;
        }

        //The range specified by the `begin` and `end` values is clamped to the 
        //valid index range for the current array.
        begin = Math.min(Math.max(0, begin), this.byteLength);
        end = Math.min(Math.max(0, end), this.byteLength);

        //If the computed length of the new ArrayBuffer would be negative, it 
        //is clamped to zero.
        if (end - begin <= 0) {
            return new ArrayBuffer(0);
        }

        var result = new ArrayBuffer(end - begin);
        var resultBytes = new Uint8Array(result);
        var sourceBytes = new Uint8Array(this, begin, end - begin);

        resultBytes.set(sourceBytes);

        return result;
    };
}

if (FileReader.prototype.readAsBinaryString === undefined) {

    FileReader.prototype.readAsBinaryString = function (fileData) {
        var binary = "";
        var pt = this;
        var reader = new FileReader();
        reader.onload = function (e) {
            var bytes = new Uint8Array(reader.result);
            var length = bytes.byteLength;
            for (var i = 0; i < length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            //pt.result  - readonly so assign content to another property
            pt.content = binary;
            pt.onload();
        }
        reader.readAsArrayBuffer(fileData);
    }

}

var $spcontext = new Speed();

//grabAllAttachmentsLinks added