﻿var WorkflowManagerEngine = WorkflowManagerEngine || {};

/** 
Reusable workflow engine , only have to set the Array of objects for the routing groups 
and the send email && template replacement 
*/
function WorkflowManagerEngine(currentUserInformation) {
    //==============most important object in the route engine ==================
    /*======================================
    This property is meant to be set at the begining
    of the workflow engine initialization.

    This is the starting point of the workflow routing.
    =========================================*/
    currentUserInformation = (typeof currentUserInformation === "undefined") ? {} : currentUserInformation;
    this.routingGroups = [];

    this.CurrentUserProperties = currentUserInformation;

    this.SecurityStatus = {
        none: "Your are not authorized to access this resource..",
        after: "You can not currently take action on this request because its not at your stage..",
        before: "You have already taken an action on this request..",
        empty: "Request doesnt exist .."
    }

    /**
     * @param {object} ActorObject contains the stage with the property name of the stage to update, any other property included will
     * be updated
     */
    this.updateStageByName = function (ActorObject) {
        var updateCount = 0;
        var routeGroups = this.routingGroups;
        if (typeof ActorObject.name !== "undefined" && typeof ActorObject.condition !== "undefined" &&
            typeof ActorObject.authenticationType !== "undefined" && typeof ActorObject.authenticationValue !== "undefined" &&
            typeof ActorObject.emails !== "undefined") {

            for (var x = 0; x <= (routeGroups.length - 1); x++) {
                for (var y = 0; y <= (routeGroups[x].possibleRoutes.length - 1); y++) {
                    if (routeGroups[x].possibleRoutes[y].name == ActorObject.name) {
                        routeGroups[x].possibleRoutes[y] = ActorObject;
                        updateCount++;
                    }
                }
            }
            if (updateCount == 0) return "No stage Found";
            else return "update successful";
        } else if (typeof ActorObject.name !== "undefined" && (typeof ActorObject.authenticationValue !== "undefined" ||
            typeof ActorObject.emails !== "undefined" || typeof ActorObject.condition !== "undefined" || typeof ActorObject.users !== "undefined")) {
            for (var x = 0; x <= (routeGroups.length - 1); x++) {
                for (var y = 0; y <= (routeGroups[x].possibleRoutes.length - 1); y++) {
                    if (routeGroups[x].possibleRoutes[y].name == ActorObject.name) {
                        if (typeof ActorObject.username !== "undefined")
                            routeGroups[x].possibleRoutes[y].username = ActorObject.username;
                        if (typeof ActorObject.authenticationValue !== "undefined")
                            routeGroups[x].possibleRoutes[y].authenticationValue = ActorObject.authenticationValue;
                        if (typeof ActorObject.emails !== "undefined")
                            routeGroups[x].possibleRoutes[y].emails = ActorObject.emails;
                        if (typeof ActorObject.doa !== "undefined")
                            routeGroups[x].possibleRoutes[y].doa = ActorObject.doa;
                        if (typeof ActorObject.condition !== "undefined")
                            routeGroups[x].possibleRoutes[y].condition = ActorObject.condition;
                        if (typeof ActorObject.users !== "undefined")
                            routeGroups[x].possibleRoutes[y].users = ActorObject.users;
                        if (typeof ActorObject.flow !== "undefined")
                            routeGroups[x].possibleRoutes[y].flow = ActorObject.flow;
                        updateCount++;
                    }
                }
            }
            if (updateCount == 0) return "No stage Found";
            else return "update successful";
        } else {
            return "invalid object";
        }
    }

    /**
     * 
     * @param {string} oldName the old name of the stage
     * @param {string} newName the new name of the stage
     */
    this.updateStageName = function (oldName, newName) {
        var updateCount = 0;
        var routeGroups = this.routingGroups;
        for (var x = 0; x <= (routeGroups.length - 1); x++) {
            for (var y = 0; y <= (routeGroups[x].possibleRoutes.length - 1); y++) {
                if (routeGroups[x].possibleRoutes[y].name == oldName) {
                    routeGroups[x].possibleRoutes[y].name = newName;
                    updateCount++;
                }
            }
        }
        if (updateCount == 0) return "No stage Found";
        else return "update successful";
    }

    /**
     * @param {string} ActorObject the properties of the stage you want to update the users info
     */
    this.updateUsersInNotNormalFlow = function (ActorObject) {
        var approversUpdate = [];
        var updateCount = 0;
        var routeGroups = this.routingGroups;
        if (typeof ActorObject.stage !== "undefined") {
            for (var x = 0; x <= (routeGroups.length - 1); x++) {
                for (var y = 0; y <= (routeGroups[x].possibleRoutes.length - 1); y++) {
                    if (routeGroups[x].possibleRoutes[y].name == ActorObject.stage && routeGroups[x].possibleRoutes[y].flow !== this.stages.normal) {
                        var usersToUpdate = routeGroups[x].possibleRoutes[y].users;
                        for (var z = 0; z <= (usersToUpdate.length - 1); z++) {
                            if (usersToUpdate[z].login.toLowerCase() == ActorObject.login.toLowerCase() && usersToUpdate[z].status.toLowerCase() !== this.stages.approve.toLowerCase() && usersToUpdate[z].status.toLowerCase() !== this.stages.reject.toLowerCase()) {
                                //Status Type String
                                if (typeof ActorObject.status !== "undefined") {
                                    routeGroups[x].possibleRoutes[y].users[z].status = ActorObject.status;
                                    routeGroups[x].possibleRoutes[y].users[z].workliststatus = (ActorObject.login + "|" + ActorObject.status);
                                }
                                //Name Type String
                                if (typeof ActorObject.name !== "undefined")
                                    routeGroups[x].possibleRoutes[y].users[z].name = ActorObject.name;
                                //Email Type Array
                                if (typeof ActorObject.email !== "undefined")
                                    routeGroups[x].possibleRoutes[y].users[z].email = ActorObject.email;
                                //for parallel approval security
                                if (typeof ActorObject.ismember !== "undefined")
                                    routeGroups[x].possibleRoutes[y].users[z].ismember = ActorObject.ismember;

                                approversUpdate = routeGroups[x].possibleRoutes[y].users;
                                updateCount++;
                                break;
                            }
                        }
                    }
                }
            }
            if (updateCount == 0) return [];
            else return approversUpdate;
        } else {
            return [];
        }
    }

    /**
     * @param {string} groupName the name of the stage you want to retrieve with its properties
     */
    this.getStagebyName = function (groupName, username) {
        var userLogin = (typeof username === "undefined") ? "" : username;
        var groupToReturn = {};
        var routeGroups = this.routingGroups;
        if (typeof groupName !== "undefined") {
            for (var x = 0; x <= (routeGroups.length - 1); x++) {
                for (var y = 0; y <= (routeGroups[x].possibleRoutes.length - 1); y++) {
                    if (routeGroups[x].possibleRoutes[y].name == groupName) {
                        if (routeGroups[x].possibleRoutes[y].flow === this.stages.normal) {
                            groupToReturn = routeGroups[x].possibleRoutes[y];
                        }
                        //Note that sequencial is only available for Users and not groups 
                        else if (routeGroups[x].possibleRoutes[y].flow === this.stages.sequencial) {
                            groupToReturn = routeGroups[x].possibleRoutes[y];
                            for (var z = 0; z <= (groupToReturn.users.length - 1); z++) {
                                if (groupToReturn.users[z].status.toLowerCase() === this.stages.pending.toLowerCase() || groupToReturn.users[z].status.toLowerCase() === this.stages.more.toLowerCase()) {
                                    groupToReturn.emails = [];
                                    groupToReturn.emails.push(groupToReturn.users[z].email[0]);
                                    groupToReturn.authenticationValue = groupToReturn.users[z].login;
                                    groupToReturn.username = groupToReturn.users[z].name;
                                    break;
                                }
                            }

                        } else if (routeGroups[x].possibleRoutes[y].flow === this.stages.parallel) {
                            groupToReturn = routeGroups[x].possibleRoutes[y];
                            groupToReturn.emails = [];
                            for (var z = 0; z <= (groupToReturn.users.length - 1); z++) {
                                if (groupToReturn.authenticationType === this.stages.user) {
                                    groupToReturn.emails.push(groupToReturn.users[z].email[0]);
                                    if (!groupToReturn.authenticationValue) {
                                        if (groupToReturn.users[z].login.toLowerCase() === userLogin.toLowerCase()) {
                                            groupToReturn.authenticationValue = true;
                                        } else {
                                            groupToReturn.authenticationValue = false;
                                        }
                                    }
                                } else {
                                    groupToReturn.emails = groupToReturn.emails.concat(groupToReturn.users[z].email);
                                    if (!groupToReturn.authenticationValue) {
                                        groupToReturn.authenticationValue = groupToReturn.users[z].ismember;
                                    }
                                }

                            }
                        }
                    }
                }
            }
        }
        return groupToReturn;
    }

    /**
     * @param {string} groupName the name of the stage you want to retrieve with its properties
     */
    this.getAllStagesWithName = function (groupName) {
        var stagesToReturn = [];
        var routeGroups = this.routingGroups;
        if (typeof groupName !== "undefined") {
            for (var x = 0; x <= (routeGroups.length - 1); x++) {
                for (var y = 0; y <= (routeGroups[x].possibleRoutes.length - 1); y++) {
                    if (routeGroups[x].possibleRoutes[y].name == groupName) {
                        var groupToReturn = {};
                        groupToReturn.code = routeGroups[x].code;
                        groupToReturn.initiationCode = routeGroups[x].initiationCode;
                        groupToReturn.codeBeforeUpdate = groupToReturn.code;
                        if (typeof routeGroups[x].codeBeforeUpdate !== "undefined") {
                            groupToReturn.codeBeforeUpdate = routeGroups[x].codeBeforeUpdate;
                        }
                        stagesToReturn.push(groupToReturn);
                    }
                }
            }
        }
        return stagesToReturn;
    }

    this.getAllStageInformationByCode = function (stageCode) {
        var stagesToReturn = {};
        var routeGroups = this.routingGroups;
        if (typeof stageCode !== "undefined") {
            for (var x = 0; x <= (routeGroups.length - 1); x++) {
                if (routeGroups[x].code == stageCode) {
                    stagesToReturn = routeGroups[x];
                }
            }
        }

        return stagesToReturn;
    }

    /*
        Gets all the groups defined in the route
        for sharepoint flow only
    */
    this.getAllGroupsInWorkflow = function () {
        var groups = [];
        var routeGroups = this.routingGroups;
        for (var x = 0; x <= (routeGroups.length - 1); x++) {
            for (var y = 0; y <= (routeGroups[x].possibleRoutes.length - 1); y++) {
                if (routeGroups[x].possibleRoutes[y].authenticationType == this.stages.group) {
                    var groupExist = false;
                    for (var z = 0; z < groups.length; z++) {
                        if (groups[z].toLowerCase() === routeGroups[x].possibleRoutes[y].name.toLowerCase()) {
                            groupExist = true;
                            break;
                        }
                    }

                    if (!groupExist) {
                        groups.push(routeGroups[x].possibleRoutes[y].name);
                    }
                }
            }
        }
        return groups;
    }

    this.getAllUsersInWorkflow = function () {
        var groups = [];
        var routeGroups = this.routingGroups;
        for (var x = 0; x <= (routeGroups.length - 1); x++) {
            for (var y = 0; y <= (routeGroups[x].possibleRoutes.length - 1); y++) {
                if (routeGroups[x].possibleRoutes[y].authenticationType == this.stages.user) {
                    var groupExist = false;
                    for (var z = 0; z < groups.length; z++) {
                        if (groups[z].name.toLowerCase() === routeGroups[x].possibleRoutes[y].name.toLowerCase()) {
                            groupExist = true;
                            break;
                        }
                    }

                    if (!groupExist) {
                        var groupProp = {
                            name: routeGroups[x].possibleRoutes[y].name,
                            column: routeGroups[x].possibleRoutes[y].column
                        }
                        groups.push(groupProp);
                    }
                }
            }
        }
        return groups;
    }

    this.setupTaskForGroups = function (queryArr) {
        var groupsDetails = this.stages.groupTaskDetails;
        for (var group in groupsDetails) {
            if (groupsDetails[group].belongs) {
                queryArr.push({
                    evaluator: "Or",
                    operator: 'Eq',
                    field: 'PendingUserLogin',
                    type: 'Text',
                    val: group
                });
            }
        }

        return queryArr;
    }

    /*=================================
    Predefined property used in the engine
    ===================================*/
    this.stages = {
        completed: "Completed",
        pending: "Pending",
        approve: "Approved",
        reject: "Declined",
        more: "MoreInfo",
        save: "Save For Later",
        modified: "Returned For Approval",
        current: "",
        previous: "",
        currentStageCode: "",
        pendingUserLogin: "",
        pendingUserEmail: "",
        currentUserName: "",
        previousUserName: "",
        emailAction: "",
        userGroupForNonNormalState: "",
        normal: "normal",
        sequencial: "sequencial",
        parallel: "parallel",
        group: "Group",
        user: "User",
        securityModeTask: "Task",
        securityModeView: "View",
        initiatorCode: "AA0",
        groupTaskDetails: {},
    }

    /*=================================
    THE WORKFLOW ROUTING ENGINE
    ===================================*/
    this.routeEngine = function (baseObject) {
        var routingGroups = baseObject.routingGroups;
        var properties = {};
        /*======================================
        This section is used to set the next approver properties 
        of a sequencial or parallel or normal workflow route if the current stage 
        flow type is normal or at the request stage AA0. 
        =========================================*/

        properties.setCurrentUserAsInitiator = function () {
            var authorRoute = this.currentActor(baseObject.stages.initiatorCode);
            baseObject.updateStageByName({
                name: authorRoute.name,
                username: baseObject.CurrentUserProperties.title,
                emails: [baseObject.CurrentUserProperties.email],
                authenticationValue: baseObject.CurrentUserProperties.login
            });
        }

        //============= get the next actor details ================
        properties.nextActor = function (initiationCode) {
            var selectedRoute = null;
            for (var x = 0; x <= (routingGroups.length - 1); x++) {
                if (routingGroups[x].initiationCode == initiationCode) {
                    var possibleRoutes = routingGroups[x].possibleRoutes;
                    for (var y = 0; y <= (possibleRoutes.length - 1); y++) {
                        if (possibleRoutes[y].condition) {
                            if (possibleRoutes[y].flow === baseObject.stages.normal) {
                                selectedRoute = possibleRoutes[y];
                                baseObject.stages.current = possibleRoutes[y].name;
                                baseObject.stages.currentStageCode = routingGroups[x].code;
                                baseObject.stages.currentUserName = possibleRoutes[y].username;
                                if (possibleRoutes[y].authenticationType == baseObject.stages.group) {
                                    baseObject.stages.pendingUserLogin = possibleRoutes[y].name;
                                    baseObject.stages.pendingUserEmail = possibleRoutes[y].name;
                                } else {
                                    baseObject.stages.pendingUserLogin = possibleRoutes[y].authenticationValue;
                                    baseObject.stages.pendingUserEmail = possibleRoutes[y].emails[0];
                                }
                                break;
                            } else if (possibleRoutes[y].flow === baseObject.stages.sequencial) {
                                for (var z = 0; z <= (possibleRoutes[y].users.length - 1); z++) {
                                    if (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase()) {
                                        selectedRoute = possibleRoutes[y];
                                        baseObject.stages.current = possibleRoutes[y].name;
                                        baseObject.stages.currentStageCode = routingGroups[x].code;
                                        //name of the person not name of the stage, the parent stage name is still the same stage name used
                                        baseObject.stages.currentUserName = possibleRoutes[y].users[z].name;
                                        if (possibleRoutes[y].authenticationType == baseObject.stages.group) {
                                            baseObject.stages.pendingUserLogin = possibleRoutes[y].users[z].name;
                                            baseObject.stages.pendingUserEmail = possibleRoutes[y].users[z].name;
                                        } else {
                                            //username is login name and not name of the person
                                            baseObject.stages.pendingUserLogin = possibleRoutes[y].users[z].login;
                                            baseObject.stages.pendingUserEmail = possibleRoutes[y].users[z].email[0];
                                        }
                                        break;
                                    }
                                }
                            } else if (possibleRoutes[y].flow === baseObject.stages.parallel) {
                                for (var z = 0; z <= (possibleRoutes[y].users.length - 1); z++) {
                                    if (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase()) {
                                        selectedRoute = possibleRoutes[y];
                                        baseObject.stages.current = possibleRoutes[y].name;
                                        baseObject.stages.currentStageCode = routingGroups[x].code;
                                        //name of the person not name of the stage, the parent stage name is still the same stage name used
                                        baseObject.stages.currentUserName = possibleRoutes[y].name;
                                        baseObject.stages.pendingUserLogin = possibleRoutes[y].name;
                                        baseObject.stages.pendingUserEmail = possibleRoutes[y].name;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (selectedRoute != null)
                        break;
                }
            }
            if (selectedRoute === null) {
                selectedRoute = {
                    name: baseObject.stages.completed,
                    condition: null,
                    username: "",
                    authenticationType: null,
                    authenticationValue: null,
                    actionType: ""
                }
                baseObject.stages.current = baseObject.stages.completed;
                baseObject.stages.currentStageCode = baseObject.stages.completed;
                baseObject.stages.pendingUserLogin = baseObject.stages.completed;
                baseObject.stages.currentUserName = baseObject.stages.completed;
                baseObject.stages.pendingUserEmail = baseObject.stages.completed;
                baseObject.stages.currentUserName = baseObject.stages.completed;
            }
            return selectedRoute;
        },

            /*======================================
            This section is used to set the next approver properties 
            of a sequencial or parallel workflow route if the current stage 
            flow type is sequencial or parallel. 
            =========================================*/
            //if request is a sequencial flow then route
            properties.nextActorNotNormal = function (initiationCode, stage, currApproverAction, authtype, update) {
                //whether to update based on first approver for sequencial or parallel
                var update = (typeof update === "undefined") ? false : update;
                var authenticationModeLogin = "";
                if (authtype === baseObject.stages.user) {
                    authenticationModeLogin = baseObject.CurrentUserProperties.login;
                } else if (authtype === baseObject.stages.group) {
                    authenticationModeLogin = baseObject.stages.userGroupForNonNormalState;
                }

                if (!update) {
                    baseObject.updateUsersInNotNormalFlow({
                        status: currApproverAction,
                        login: authenticationModeLogin,
                        stage: stage
                    });
                }

                var selectedRoute = null;
                for (var x = 0; x <= (routingGroups.length - 1); x++) {
                    if (routingGroups[x].code == initiationCode) {
                        var possibleRoutes = routingGroups[x].possibleRoutes;
                        for (var y = 0; y <= (possibleRoutes.length - 1); y++) {
                            if (possibleRoutes[y].condition) {
                                if (possibleRoutes[y].flow === baseObject.stages.sequencial) {
                                    for (var z = 0; z <= (possibleRoutes[y].users.length - 1); z++) {
                                        if (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase()) {
                                            selectedRoute = {}
                                            selectedRoute = possibleRoutes[y];
                                            baseObject.stages.current = possibleRoutes[y].name;
                                            baseObject.stages.currentStageCode = initiationCode;
                                            //name of the person not name of the stage, the parent stage name is still the same stage name used
                                            baseObject.stages.currentUserName = possibleRoutes[y].users[z].name;
                                            if (possibleRoutes[y].authenticationType == baseObject.stages.group) {
                                                baseObject.stages.pendingUserLogin = possibleRoutes[y].users[z].name;
                                                baseObject.stages.pendingUserEmail = possibleRoutes[y].users[z].name;
                                            } else {
                                                //username is login name and not name of the person
                                                baseObject.stages.pendingUserLogin = possibleRoutes[y].users[z].login;
                                                baseObject.stages.pendingUserEmail = possibleRoutes[y].users[z].email[0];
                                            }
                                            break;
                                        }
                                    }
                                    if (selectedRoute != null)
                                        break;
                                } else if (possibleRoutes[y].flow === baseObject.stages.parallel) {
                                    for (var z = 0; z <= (possibleRoutes[y].users.length - 1); z++) {
                                        if (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase()) {
                                            selectedRoute = {}
                                            selectedRoute = possibleRoutes[y];
                                            baseObject.stages.current = possibleRoutes[y].name;
                                            baseObject.stages.currentStageCode = initiationCode;
                                            //name of the person not name of the stage, the parent stage name is still the same stage name used
                                            baseObject.stages.currentUserName = possibleRoutes[y].name;
                                            baseObject.stages.pendingUserLogin = possibleRoutes[y].name;
                                            baseObject.stages.pendingUserEmail = possibleRoutes[y].name;
                                            break;
                                        }
                                    }
                                    if (selectedRoute != null)
                                        break;
                                }
                            }
                        }
                    }
                }

                if (selectedRoute === null) {
                    this.nextActor(initiationCode);
                }
            },

            /*======================================
            This section gets the current actor object 
            based on route definition and code passed 
            =========================================*/
            properties.currentActor = function (presentCode) {
                var selectedRoute = null;
                for (var x = 0; x <= (routingGroups.length - 1); x++) {
                    if (routingGroups[x].code == presentCode) {
                        var possibleRoutes = routingGroups[x].possibleRoutes;
                        for (var y = 0; y <= (possibleRoutes.length - 1); y++) {
                            if (possibleRoutes[y].condition) {
                                if (possibleRoutes[y].flow === baseObject.stages.normal) {
                                    selectedRoute = possibleRoutes[y];
                                } else if (possibleRoutes[y].flow === baseObject.stages.sequencial) {
                                    selectedRoute = {}
                                    for (var z = 0; z <= (possibleRoutes[y].users.length - 1); z++) {
                                        if (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase()) {
                                            selectedRoute.name = possibleRoutes[y].name;
                                            selectedRoute.username = possibleRoutes[y].users[z].name;
                                            selectedRoute.authenticationValue = possibleRoutes[y].users[z].login;
                                            selectedRoute.emails = possibleRoutes[y].users[z].email;
                                            selectedRoute.authenticationType = possibleRoutes[y].authenticationType;
                                            selectedRoute.users = possibleRoutes[y].users;
                                            selectedRoute.flow = possibleRoutes[y].flow;
                                            selectedRoute.doa = possibleRoutes[y].doa;
                                            selectedRoute.code = routingGroups[x].code;
                                            selectedRoute.initiationCode = routingGroups[x].initiationCode;
                                            break;
                                        }
                                    }
                                } else if (possibleRoutes[y].flow === baseObject.stages.parallel) {
                                    selectedRoute = {
                                        emails: []
                                    }
                                    for (var z = 0; z <= (possibleRoutes[y].users.length - 1); z++) {
                                        if (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase()) {
                                            selectedRoute.name = possibleRoutes[y].name;
                                            selectedRoute.username = possibleRoutes[y].name;
                                            selectedRoute.authenticationValue = possibleRoutes[y].name;
                                            var email = possibleRoutes[y].users[z].email[0];
                                            selectedRoute.emails.push(email);
                                            selectedRoute.authenticationType = baseObject.stages.group;
                                            selectedRoute.users = possibleRoutes[y].users;
                                            selectedRoute.flow = possibleRoutes[y].flow;
                                            selectedRoute.doa = possibleRoutes[y].doa;
                                            selectedRoute.code = routingGroups[x].code;
                                            selectedRoute.initiationCode = routingGroups[x].initiationCode;
                                        }
                                    }
                                }
                                break;
                            }
                        }
                        if (selectedRoute != null)
                            break;
                    }
                }
                if (selectedRoute === null)
                    selectedRoute = {};

                return selectedRoute;
            },

            /*======================================
            This section gets the previous stage of the
            routing process 
            =========================================*/
            properties.previousActor = function (presentCode) {
                var prevPosition = null;
                for (var x = 0; x <= (routingGroups.length - 1); x++) {
                    if (routingGroups[x].code == presentCode) {
                        prevPosition = x - 1;
                        break;
                    }
                }
                if (prevPosition === null)
                    prevPosition = {};
                else {
                    var possibleRoutes = routingGroups[prevPosition];
                }

                return possibleRoutes;
            },

            /*======================================
            This section is handles the Routing based on 
            certain algorithms and columns used 
            =========================================*/
            //this method would work if using christians routing logic
            //updateNotNormal is used if the first approver is a sequencial so that it doesnt update the users and select the first user
            properties.runRouting = function (updateObject, currentStageCode, Action, updateNotNormal) {
                currentStageCode = (typeof currentStageCode === "undefined") ? baseObject.stages.initiatorCode : currentStageCode;
                var presentApproverDetails = this.currentActor(currentStageCode);
                var initiatorDetails = this.currentActor(baseObject.stages.initiatorCode);

                if (currentStageCode !== baseObject.stages.initiatorCode) {
                    currentStageCode = this.getCurrentRouteCodeifRouteUpdate(presentApproverDetails.name, currentStageCode, presentApproverDetails);
                } else {
                    updateObject.InitiatorLogin = initiatorDetails.authenticationValue;
                    updateObject.InitiatorEmailAddress = initiatorDetails.emails[0];
                }

                Action = (typeof Action === "undefined") ? baseObject.stages.approve : Action;
                if (presentApproverDetails.flow === baseObject.stages.normal || currentStageCode === baseObject.stages.initiatorCode) {
                    this.nextActor(currentStageCode);
                } else {
                    this.nextActorNotNormal(currentStageCode, presentApproverDetails.name, Action, presentApproverDetails.authenticationType, updateNotNormal);
                }

                baseObject.stages.previousUserName = (typeof presentApproverDetails.username !== "undefined") ? presentApproverDetails.username : "";

                if (Action == baseObject.stages.modified) {

                    if (presentApproverDetails.authenticationType == baseObject.stages.user) {
                        updateObject.PendingUserLogin = presentApproverDetails.authenticationValue;
                        updateObject.PendingUserEmail = presentApproverDetails.emails[0];
                    } else {
                        updateObject.PendingUserLogin = presentApproverDetails.name;
                        updateObject.PendingUserEmail = presentApproverDetails.name;
                    }

                    updateObject.ReturnForCorrection = "No";
                    baseObject.stages.currentUserName = presentApproverDetails.username;
                    baseObject.stages.emailAction = presentApproverDetails.name;
                    baseObject.stages.current = presentApproverDetails.name;
                } else if (Action == baseObject.stages.approve) {
                    updateObject.Current_Approver = baseObject.stages.current;
                    updateObject.Current_Approver_Code = baseObject.stages.currentStageCode;
                    updateObject.PendingUserLogin = baseObject.stages.pendingUserLogin;
                    updateObject.PendingUserEmail = baseObject.stages.pendingUserEmail;
                    updateObject.Approval_Status = baseObject.stages.pending;
                    baseObject.stages.emailAction = updateObject.Current_Approver;
                    if (baseObject.stages.current === baseObject.stages.completed) {
                        updateObject.Approval_Status = baseObject.stages.completed;
                        baseObject.stages.emailAction = baseObject.stages.completed;
                    }
                    updateObject.ReturnForCorrection = "No";
                } else if (Action == baseObject.stages.reject) {
                    updateObject.Approval_Status = baseObject.stages.reject;
                    baseObject.stages.emailAction = baseObject.stages.reject;
                    updateObject.ReturnForCorrection = "No";
                } else if (Action == baseObject.stages.more) {
                    updateObject.PendingUserLogin = initiatorDetails.authenticationValue;
                    updateObject.PendingUserEmail = initiatorDetails.emails[0];
                    updateObject.ReturnForCorrection = "Yes";
                    baseObject.stages.emailAction = baseObject.stages.more;
                } else if (Action == baseObject.stages.save) {
                    updateObject.Current_Approver = baseObject.stages.save;
                    updateObject.Current_Approver_Code = baseObject.stages.initiatorCode;
                    updateObject.PendingUserLogin = initiatorDetails.authenticationValue;
                    updateObject.PendingUserEmail = initiatorDetails.emails[0];
                    updateObject.Approval_Status = baseObject.stages.pending;
                }

                return updateObject;
            },

            /*======================================
            This section gets the present code of a route
            if the routing groups have been updated and the list data isnt updated 
            =========================================*/
            properties.getCurrentRouteCodeifRouteUpdate = function (currentApprover, currentApproverCode, presentApproverDetails) {
                presentApproverDetails = (typeof presentApproverDetails !== "undefined") ? presentApproverDetails : this.currentActor(currentApproverCode);
                var mainCode = currentApproverCode;
                if (presentApproverDetails.name !== currentApprover) {
                    var stagesWithName = baseObject.getAllStagesWithName(currentApprover);
                    for (var i = 0; i < stagesWithName.length; i++) {
                        if (Array.isArray(stagesWithName[i].codeBeforeUpdate)) {
                            var setValue = false;
                            for (var j = 0; j < stagesWithName[i].codeBeforeUpdate.length; j++) {
                                if (stagesWithName[i].codeBeforeUpdate[j] === currentApproverCode) {
                                    mainCode = stagesWithName[i].code;
                                    setValue = true;
                                    break;
                                }
                            }

                            if (setValue) {
                                break;
                            }
                        } else {
                            if (stagesWithName[i].codeBeforeUpdate === currentApproverCode) {
                                mainCode = stagesWithName[i].code;
                                break;
                            }
                        }
                    }
                }
                return mainCode;
            },

            /*======================================
            This section is handles the Transaction history
            set up, returns a JSON string of properties that are to
            be saved to the list Column Transaction_History
            =========================================*/
            properties.requestHistoryHandler = function (customListProperties, History, historyProperties) {
                var transProperty = {};
                transProperty.name = (typeof historyProperties.name == "undefined") ? baseObject.CurrentUserProperties.title : historyProperties.name;
                transProperty.email = (typeof historyProperties.email == "undefined") ? baseObject.CurrentUserProperties.email : historyProperties.email;
                try {
                    transProperty.actiontime = (typeof historyProperties.actiontime == "undefined") ? $spcontext.stringnifyDate({
                        includeTime: true
                    }) : historyProperties.actiontime;
                } catch (e) {
                    transProperty.actiontime = (typeof historyProperties.actiontime == "undefined") ? "" : historyProperties.actiontime;
                }
                transProperty.stage = (typeof historyProperties.stage == "undefined") ? "Initiator" : historyProperties.stage;
                transProperty.action = (typeof historyProperties.action == "undefined") ? "Sent For Approval" : historyProperties.action;
                transProperty.comment = (typeof historyProperties.comment == "undefined") ? "" : historyProperties.comment;
                transProperty.signature = (typeof historyProperties.signature == "undefined") ? "" : historyProperties.signature;
                transProperty.login = (typeof historyProperties.login == "undefined") ? baseObject.CurrentUserProperties.login : historyProperties.login;
                History.push(transProperty);
                customListProperties.Transaction_History = JSON.stringify(History);
                return customListProperties;
            },

            /*======================================
            This section sets up the users and their properties 
            in the group stated in the workflow routing object
            =========================================*/
            //Update a variable with all the workflow groups
            properties.updateWorkflowGroups = function (propKey, workflowgroups, callback, isSPFlow, usersInGroupsManual) {
                isSPFlow = (typeof isSPFlow === "undefined") ? true : isSPFlow;
                var groupCollections = "";
                for (var z = 0; z < workflowgroups.length; z++) {
                    if (z == (workflowgroups.length - 1)) groupCollections += workflowgroups[z];
                    else groupCollections += workflowgroups[z] + ";";
                }

                var keyProp = {
                    returnCollection: true,
                    groupEmails: true
                };

                //CurrentUserProperties is referenced at master page level
                keyProp[propKey] = baseObject.CurrentUserProperties[propKey];

                if (isSPFlow && groupCollections !== "") {
                    $spcontext.isUserMemberOfGroup(groupCollections, keyProp,
                        function (isInGroups, usersInGroups) {
                            for (var y = 0; y < workflowgroups.length; y++) {
                                customWorkflowEngine.updateStageByName({
                                    name: workflowgroups[y],
                                    username: workflowgroups[y],
                                    emails: usersInGroups[workflowgroups[y]].emails,
                                    authenticationValue: usersInGroups[workflowgroups[y]].belongs
                                });
                            }
                            if (typeof callback !== "undefined" && typeof callback === "function")
                                callback(usersInGroups);
                        }
                    );
                } else {
                    for (var y = 0; y < workflowgroups.length; y++) {
                        customWorkflowEngine.updateStageByName({
                            name: workflowgroups[y],
                            username: workflowgroups[y],
                            emails: usersInGroupsManual[workflowgroups[y]].emails,
                            authenticationValue: usersInGroupsManual[workflowgroups[y]].belongs
                        });
                    }
                    if (typeof callback !== "undefined" && typeof callback === "function")
                        callback(usersInGroupsManual);
                }
            },

            /*======================================
            This section sets up the users and their properties 
            in the group and also Users type stated in the workflow routing object
            =========================================*/
            properties.updateRoutesinFlow = function (UsersSPObject, callback, loginFetch, isSPFlow, usersInGroupsManual,groupCheck) {
                groupCheck = (typeof groupCheck === "undefined") ? true : groupCheck;
                var groups = baseObject.getAllGroupsInWorkflow();
                var propKey = (baseObject.CurrentUserProperties.login === baseObject.CurrentUserProperties.email) ?
                    "email" : "login";

                var users = baseObject.getAllUsersInWorkflow();
                for (var i = 0; i < users.length; i++) {
                    var mappedUser = (typeof users[i].column !== "undefined") ? users[i].column : users[i].name;
                    var customUser = UsersSPObject[mappedUser];

                    if (typeof customUser !== "undefined") {

                        if (Array.isArray(customUser)) {
                            if (typeof loginFetch == "function") {
                                customUser[0][propKey] = loginFetch()[users[i].name];
                            }

                            baseObject.updateStageByName({
                                name: users[i].name,
                                username: customUser[0].value,
                                authenticationValue: customUser[0][propKey],
                                emails: [customUser[0].email]
                            });
                        } else if (customUser == "") {
                            baseObject.updateStageByName({
                                name: users[i].name,
                                authenticationValue: "NA",
                            });
                        } else {
                            if (typeof loginFetch == "function") {
                                customUser[propKey] = loginFetch()[users[i].name];
                            }

                            baseObject.updateStageByName({
                                name: users[i].name,
                                username: customUser.value,
                                authenticationValue: customUser[propKey],
                                emails: [customUser.email]
                            });
                        }
                    }
                }

                if (groups.length > 0 && groupCheck) {
                    this.updateWorkflowGroups(propKey, groups, callback, isSPFlow, usersInGroupsManual);
                }
                else {
                    callback();
                }
            },

            /*======================================
            This section sets up the group information for my task
            =========================================*/
            properties.setupTaskForGroups = function (propKey, callback) {
                var groups = baseObject.getAllGroupsInWorkflow();
                var settings = {};
                settings[propKey] = CurrentUserProperties[propKey]
                settings.groupEmails = true;
                $spcontext.isUserMemberOfGroup(groups, settings, function (isMember, actorDetails) {
                    baseObject.stages.groupTaskDetails = actorDetails;
                    callback();
                });
            }

        /*======================================
        This section is handles Page security based on 
        the Current User Login
        =========================================*/
        //============== security implementation ======================
        properties.PageSecurity = function (pageMode, currentStage, approvalStatus, callback, extender) {
            if (pageMode === baseObject.stages.securityModeTask) {
                if (this.security(currentStage, approvalStatus)) {
                    callback();
                } else {
                    var status = (typeof currentStage == "undefined" || typeof approvalStatus == "undefined") ?
                        "empty" : this.failedSecurityError(currentStage);
                    callback(baseObject.SecurityStatus[status]);
                }
            } else {
                if (this.viewSecurity(extender)) {
                    callback();
                } else {
                    var status = (typeof currentStage == "undefined" || typeof approvalStatus == "undefined") ?
                        baseObject.SecurityStatus.empty : baseObject.SecurityStatus.none;
                    callback(status);
                }
            }
        },

            properties.security = function (currentStage, approvalStatus) {
                var AuthorizedAccess = false;

                if (typeof currentStage == "undefined" || typeof approvalStatus == "undefined") {
                    return AuthorizedAccess;
                }

                if (approvalStatus === baseObject.stages.pending) {
                    var stageObject = baseObject.getStagebyName(currentStage, baseObject.CurrentUserProperties.login);
                    if (stageObject.flow === baseObject.stages.normal) {
                        if (stageObject.authenticationType == baseObject.stages.group && stageObject.authenticationValue) {
                            AuthorizedAccess = true;
                        } else if (stageObject.authenticationType == baseObject.stages.user && baseObject.CurrentUserProperties.login == stageObject.authenticationValue) {
                            AuthorizedAccess = true;
                        }
                    } else if (stageObject.flow === baseObject.stages.sequencial) {
                        if (stageObject.authenticationType == baseObject.stages.group && stageObject.authenticationValue) {
                            AuthorizedAccess = true;
                        } else {
                            for (var z = 0; z < stageObject.users.length; z++) {
                                if (stageObject.authenticationType == baseObject.stages.user && baseObject.CurrentUserProperties.login == stageObject.authenticationValue &&
                                    (stageObject.users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || stageObject.users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase())) {
                                    AuthorizedAccess = true;
                                    break;
                                }
                            }
                        }
                    } else if (stageObject.flow === baseObject.stages.parallel) {
                        for (var z = 0; z < stageObject.users.length; z++) {
                            if (stageObject.authenticationType == baseObject.stages.group) {
                                if (stageObject.users[z].ismember && (stageObject.users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || stageObject.users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase())) {
                                    AuthorizedAccess = true;
                                    break;
                                }
                            } else {
                                if (stageObject.users[z].login.toLowerCase() == baseObject.CurrentUserProperties.login && (stageObject.users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || stageObject.users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase())) {
                                    AuthorizedAccess = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                return AuthorizedAccess;
            },

            //determines the kind of message that user will get  
            //if they are not the current approval for a request
            properties.failedSecurityError = function (currentStage) {
                var checkStateWithCurrent = "none";
                for (var x = 0; x <= (routingGroups.length - 1); x++) {
                    var possibleRoutes = routingGroups[x].possibleRoutes;
                    for (var y = 0; y <= (possibleRoutes.length - 1); y++) {
                        if (possibleRoutes[y].condition) {
                            if (possibleRoutes[y].flow === baseObject.stages.normal) {
                                //Check if user is valid and if its before or after the current position
                                if (possibleRoutes[y].authenticationValue === baseObject.CurrentUserProperties.login && possibleRoutes[y].authenticationType === baseObject.stages.user) {
                                    checkStateWithCurrent = (routingGroups[x].code > currentStage) ? "after" : "before";
                                } else if (possibleRoutes[y].authenticationValue && possibleRoutes[y].authenticationType === baseObject.stages.group) {
                                    checkStateWithCurrent = (routingGroups[x].code > currentStage) ? "after" : "before";
                                }
                            } else if (possibleRoutes[y].flow === baseObject.stages.sequencial) {
                                for (var z = 0; z <= (possibleRoutes[y].users.length - 1); z++) {
                                    if (possibleRoutes[y].users[z].login === baseObject.CurrentUserProperties.login) {
                                        checkStateWithCurrent = (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase()) ? "after" : "before";
                                    }
                                }
                            } else if (possibleRoutes[y].flow === baseObject.stages.parallel) {
                                for (var z = 0; z <= (possibleRoutes[y].users.length - 1); z++) {
                                    if (possibleRoutes[y].users[z].login === baseObject.CurrentUserProperties.login) {
                                        checkStateWithCurrent = (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase()) ? "after" : "before";
                                    }
                                }
                            }
                        }
                    }
                }

                return checkStateWithCurrent;
            },

            //will have to work on this
            properties.viewSecurity = function (customSetting) {
                var AuthorizedAccess = false;
                var initiatorDetails = this.currentActor(baseObject.stages.initiatorCode);
                if (baseObject.CurrentUserProperties.login.toLowerCase() == initiatorDetails.authenticationValue.toLowerCase()) {
                    return true;
                }

                if (typeof customSetting !== "undefined") {
                    if (typeof customSetting.users !== "undefined") {
                        if (Array.isArray(customSetting.users)) {
                            var isAmong = false;
                            for (var i = 0; i < customSetting.users.length; i++) {
                                if (customSetting.users[i].toLowerCase() === baseObject.CurrentUserProperties.login.toLowerCase()) {
                                    isAmong = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (typeof customSetting.groups !== "undefined") {
                        for (var key in customSetting.groups) {
                            if (customSetting.groups[key]) {
                                isAmong = true;
                                break;
                            }
                        }
                    }

                    if (isAmong) {
                        return isAmong;
                    }

                }


                for (var x = 0; x <= (routingGroups.length - 1); x++) {
                    var possibleRoutes = routingGroups[x].possibleRoutes;
                    for (var y = 0; y <= (possibleRoutes.length - 1); y++) {
                        if (possibleRoutes[y].flow === baseObject.stages.normal) {
                            if (possibleRoutes[y].authenticationType == baseObject.stages.group && possibleRoutes[y].authenticationValue) {
                                AuthorizedAccess = true;
                                break;
                            } else if (possibleRoutes[y].authenticationType == baseObject.stages.user && baseObject.CurrentUserProperties.login.toLowerCase() == possibleRoutes[y].authenticationValue.toLowerCase()) {
                                AuthorizedAccess = true;
                                break;
                            }

                        } else if (possibleRoutes[y].flow === baseObject.stages.sequencial) {
                            for (var z = 0; z < possibleRoutes[y].users.length; z++) {
                                if (possibleRoutes[y].authenticationType == baseObject.stages.user && baseObject.CurrentUserProperties.login == possibleRoutes[y].authenticationValue &&
                                    (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase())) {
                                    AuthorizedAccess = true;
                                    break;
                                }
                            }

                            if (AuthorizedAccess) break;
                        } else if (possibleRoutes[y].flow === baseObject.stages.parallel) {
                            for (var z = 0; z < possibleRoutes[y].users.length; z++) {
                                if (possibleRoutes[y].authenticationValue && (possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.pending.toLowerCase() || possibleRoutes[y].users[z].status.toLowerCase() === baseObject.stages.more.toLowerCase())) {
                                    AuthorizedAccess = true;
                                    break;
                                }
                            }

                            if (AuthorizedAccess) break;
                        }
                    }

                }
                return AuthorizedAccess;
            },

            /*======================================
            This section is handles the message body 
            Column values replacement on the message body
            =========================================*/
            //handles message content replace replacement
            properties.templateReplacement = function (templateStage, requestProperties, template) {
                /**===========Main Replacement Engine ==============*/
                var messagebody = template[templateStage];
                for (var propName in requestProperties) {
                    try {
                        var stringToFind = "{{" + propName + "}}";
                        var regex = new RegExp(stringToFind, "g");
                        messagebody = messagebody.replace(regex, requestProperties[propName]);
                    } catch (e) { }
                }

                messagebody = messagebody.replace(/{{currentapprover}}/g, baseObject.stages.currentUserName);
                messagebody = messagebody.replace(/{{previousapprover}}/g, baseObject.stages.previousUserName);
                messagebody = messagebody.replace(/{{newline}}/g, "<br><br>");
                try {
                    messagebody = messagebody.replace(/{{Author}}/g, requestProperties.Author.value);
                } catch (e) { }
                /**===========Main Replacement Engine ==============*/
                return messagebody;
            },

            properties.extendRouteEngine = {}


        return properties;
    }

    /*=================================
    LIST COLUMN INSTALLATION

    columns required for the workflow engine
    ===================================*/
    this.AppInstallation = function (SpContext, listName, callback) {
        var arr = [{
            columnField: "<Field DisplayName=\"Current_Approver\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"Current_Approver_Code\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"Approval_Status\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"PendingUserLogin\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"PendingUserEmail\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"ReturnForCorrection\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"Transaction_History\" Type=\"Note\" RichText=\"FALSE\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldMultiLineText,
            addToDefault: true,
        },
        {
            columnField: "<Field DisplayName=\"InitiatorLogin\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"InitiatorEmailAddress\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"WorkflowRequestID\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"Attachment_Folder\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"AttachmentURL\" Type=\"Note\" RichText=\"FALSE\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldMultiLineText,
            addToDefault: true,
        },
        {
            columnField: "<Field DisplayName=\"Year\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"LastTimeItemModifiedByWorklow\" Type=\"DateTime\"  />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldDateTime,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"RequestCreated\" Type=\"DateTime\"  />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldDateTime,
            addToDefault: true
        },
        {
            columnField: "<Field DisplayName=\"SLA_COUNT_UPDATED\" Type=\"Text\" />",
            fieldOptions: SP.AddFieldOptions.defaultValue,
            fieldType: SP.FieldText,
            addToDefault: true
        },
        ];

        SpContext.formAppInitialization(listName, arr, callback);

    }
    //================================================
}