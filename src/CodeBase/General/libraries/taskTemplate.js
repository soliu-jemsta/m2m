/**
 * Stage → Task Templates
 * ----------------------
 * Drop this into your SPFx solution (e.g. src/CodeBase/General/libraries/taskTemplates.js)
 * or seed the TaskTemplates SharePoint list from this data.
 *
 * TriggerStage = the CurrentStage value that causes these tasks to be created.
 * AssignToRole  = resolved at runtime against the case item (Adviser, CaseManager, etc.)
 */

var CASE_STAGES = [
  "Lead",
  "Fact Find",
  "DIP",
  "Document Collection",
  "Document Review",
  "Application Submitted",
  "Valuation",
  "Underwriting",
  "Additional Requirements",
  "Offer Issued",
  "Protection Review",
  "Exchange",
  "Completion",
  "Case Closed"
];

/**
 * Default templates. ApplicationTypes: null = all modules.
 * You can later load these from the TaskTemplates list instead.
 */
var TASK_TEMPLATES = [
  // ── Lead ──────────────────────────────────────────────
  {
    TemplateKey: "LEAD_ASSIGN",
    TriggerStage: "Lead",
    TaskTitle: "Review new lead and assign / start Fact Find — {CaseID}",
    AssignToRole: "Adviser",
    Priority: "High",
    DueInDays: 1,
    ApplicationTypes: null,
    SortOrder: 10
  },

  // ── Fact Find ─────────────────────────────────────────
  {
    TemplateKey: "FACTFIND_COMPLETE",
    TriggerStage: "Fact Find",
    TaskTitle: "Complete Fact Find for {Client}",
    AssignToRole: "Adviser",
    Priority: "High",
    DueInDays: 3,
    ApplicationTypes: null,
    SortOrder: 10
  },

  // ── DIP ───────────────────────────────────────────────
  {
    TemplateKey: "DIP_OBTAIN",
    TriggerStage: "DIP",
    TaskTitle: "Obtain Decision in Principle / Quote — {CaseID}",
    AssignToRole: "Adviser",
    Priority: "High",
    DueInDays: 2,
    ApplicationTypes: ["MORTGAGE", "P4L"],
    SortOrder: 10
  },

  // ── Document Collection ───────────────────────────────
  {
    TemplateKey: "DOCS_REQUEST",
    TriggerStage: "Document Collection",
    TaskTitle: "Request supporting documents from {Client}",
    AssignToRole: "CaseManager",
    Priority: "High",
    DueInDays: 1,
    ApplicationTypes: null,
    SortOrder: 10
  },
  {
    TemplateKey: "DOCS_CHASE",
    TriggerStage: "Document Collection",
    TaskTitle: "Chase client for outstanding documents — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "Medium",
    DueInDays: 5,
    ApplicationTypes: null,
    SortOrder: 20
  },

  // ── Document Review ───────────────────────────────────
  {
    TemplateKey: "DOCS_REVIEW",
    TriggerStage: "Document Review",
    TaskTitle: "Review uploaded documents — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "High",
    DueInDays: 1,
    ApplicationTypes: null,
    SortOrder: 10
  },

  // ── Application Submitted ─────────────────────────────
  {
    TemplateKey: "APP_SUBMIT",
    TriggerStage: "Application Submitted",
    TaskTitle: "Confirm application submitted to lender/provider — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "Medium",
    DueInDays: 1,
    ApplicationTypes: null,
    SortOrder: 10
  },
  {
    TemplateKey: "LENDER_CHASE",
    TriggerStage: "Application Submitted",
    TaskTitle: "Chase lender/provider for update — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "Medium",
    DueInDays: 5,
    ApplicationTypes: ["MORTGAGE"],
    SortOrder: 20
  },

  // ── Valuation ─────────────────────────────────────────
  {
    TemplateKey: "VALUATION_TRACK",
    TriggerStage: "Valuation",
    TaskTitle: "Track valuation instruction and result — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "Medium",
    DueInDays: 5,
    ApplicationTypes: ["MORTGAGE"],
    SortOrder: 10
  },

  // ── Underwriting ──────────────────────────────────────
  {
    TemplateKey: "UW_MONITOR",
    TriggerStage: "Underwriting",
    TaskTitle: "Monitor underwriting decision — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "Medium",
    DueInDays: 7,
    ApplicationTypes: ["MORTGAGE"],
    SortOrder: 10
  },

  // ── Additional Requirements ───────────────────────────
  {
    TemplateKey: "ADD_REQS",
    TriggerStage: "Additional Requirements",
    TaskTitle: "Action additional requirements from lender — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "High",
    DueInDays: 2,
    ApplicationTypes: ["MORTGAGE"],
    SortOrder: 10
  },

  // ── Offer Issued ──────────────────────────────────────
  {
    TemplateKey: "OFFER_NOTIFY",
    TriggerStage: "Offer Issued",
    TaskTitle: "Notify client of mortgage/protection offer — {CaseID}",
    AssignToRole: "Adviser",
    Priority: "High",
    DueInDays: 1,
    ApplicationTypes: null,
    SortOrder: 10
  },
  {
    TemplateKey: "PROTECTION_REVIEW",
    TriggerStage: "Offer Issued",
    TaskTitle: "Conduct Protection Review for {Client}",
    AssignToRole: "ProtectionAdviser",
    Priority: "High",
    DueInDays: 3,
    ApplicationTypes: ["MORTGAGE"],
    SortOrder: 20
  },

  // ── Protection Review ─────────────────────────────────
  {
    TemplateKey: "PROTECTION_COMPLETE",
    TriggerStage: "Protection Review",
    TaskTitle: "Complete protection advice and recommendations — {CaseID}",
    AssignToRole: "ProtectionAdviser",
    Priority: "High",
    DueInDays: 5,
    ApplicationTypes: ["MORTGAGE", "P4L"],
    SortOrder: 10
  },

  // ── Exchange ──────────────────────────────────────────
  {
    TemplateKey: "EXCHANGE_CONFIRM",
    TriggerStage: "Exchange",
    TaskTitle: "Confirm exchange of contracts — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "High",
    DueInDays: 1,
    ApplicationTypes: ["MORTGAGE"],
    SortOrder: 10
  },

  // ── Completion ────────────────────────────────────────
  {
    TemplateKey: "COMPLETION_CONFIRM",
    TriggerStage: "Completion",
    TaskTitle: "Confirm completion and close file — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "High",
    DueInDays: 1,
    ApplicationTypes: null,
    SortOrder: 10
  },
  {
    TemplateKey: "ANNUAL_REVIEW",
    TriggerStage: "Completion",
    TaskTitle: "Schedule Annual Review for {Client} (11 months)",
    AssignToRole: "Adviser",
    Priority: "Low",
    DueInDays: 335, // ~11 months
    ApplicationTypes: ["MORTGAGE", "P4L"],
    SortOrder: 20
  },

  // ── Case Closed ───────────────────────────────────────
  {
    TemplateKey: "CLOSE_ARCHIVE",
    TriggerStage: "Case Closed",
    TaskTitle: "Archive case file and final checklist — {CaseID}",
    AssignToRole: "CaseManager",
    Priority: "Low",
    DueInDays: 3,
    ApplicationTypes: null,
    SortOrder: 10
  }
];

/**
 * Resolve which templates fire for a given stage + application type
 */
function getTemplatesForStage(stage, applicationType) {
  return TASK_TEMPLATES
    .filter(function (t) {
      if (t.TriggerStage !== stage) return false;
      if (!t.ApplicationTypes || t.ApplicationTypes.length === 0) return true;
      return t.ApplicationTypes.indexOf(applicationType) !== -1;
    })
    .sort(function (a, b) {
      return (a.SortOrder || 0) - (b.SortOrder || 0);
    });
}

/**
 * Replace tokens in task title
 */
function applyTaskTokens(title, context) {
  return title
    .replace(/\{Client\}/g, context.Client || "Client")
    .replace(/\{CaseID\}/g, context.CaseID || "")
    .replace(/\{Adviser\}/g, context.Adviser || "")
    .replace(/\{Stage\}/g, context.Stage || "");
}

/**
 * Resolve AssignToRole → person field value from case item
 * context should contain: Adviser, CaseManager, ProtectionAdviser, Initiator (as SP user objects or login names)
 */
function resolveAssignee(role, context) {
  switch (role) {
    case "Adviser":
      return context.Adviser || context.Initiator;
    case "CaseManager":
      return context.CaseManager || context.Adviser || context.Initiator;
    case "ProtectionAdviser":
      return context.ProtectionAdviser || context.Adviser;
    case "Compliance":
      return context.Compliance || null;
    case "Initiator":
      return context.Initiator;
    default:
      return context.Adviser || context.Initiator;
  }
}

// Export for both browser global and potential module use
if (typeof window !== "undefined") {
  window.CASE_STAGES = CASE_STAGES;
  window.TASK_TEMPLATES = TASK_TEMPLATES;
  window.getTemplatesForStage = getTemplatesForStage;
  window.applyTaskTokens = applyTaskTokens;
  window.resolveAssignee = resolveAssignee;
}
