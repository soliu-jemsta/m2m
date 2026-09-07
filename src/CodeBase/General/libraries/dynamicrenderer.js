/* ============================================================
   Dynamic Mortgage Form
   - Category -> Type cascade
   - Type -> Field-set render engine
   - jQuery version, matches the existing form-section /
     form-row / form-group / speed-bind template pattern
   ============================================================ */

/* ---------- 1. Application Type (category) options ---------- */

const APPLICATION_TYPES = [
    { value: "MORTGAGE", text: "Mortgage" },
    { value: "P4L", text: "P4L (Protection for Life)" },
    { value: "GI", text: "General Insurance" },
];

/* ---------- 2. Types available under each category ---------- */

const TYPES_BY_CATEGORY = {
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
        { value: "Protection Only", text: "Protection Only" },
        { value: "Life Insurance", text: "Life Insurance" },
        { value: "Critical Illness Cover", text: "Critical Illness Cover" },
        { value: "Income Protection", text: "Income Protection" },
    ],
    GI: [
        { value: "General Insurance", text: "General Insurance" },
    ],
};

/* Maps each category to the DOM ids from the template */
const CATEGORY_GROUP_MAP = {
    MORTGAGE: { groupId: "mortgage_type_group", selectId: "mortgage_type" },
    P4L: { groupId: "p4l_type_group", selectId: "p4l_type" },
    GI: { groupId: "gi_type_group", selectId: "gi_type" },
};


const MORTGAGE_FIELD_POOL = {
    SecurityAddress: { key: "SecurityAddress", label: "Property / Security Address", type: "Text" },
    PropertyValue: { key: "PropertyValue", label: "Property Value", type: "Currency" },
    LoanAmount: { key: "LoanAmount", label: "Loan Amount", type: "Currency" },
    CapitalRaising: { key: "CapitalRaising", label: "Capital Raising", type: "YesNo" },
    RepaymentType: { key: "RepaymentType", label: "Repayment Type", type: "Choice", options: ["Repayment", "Interest-Only", "Part & Part"] },
    InterestRate: { key: "InterestRate", label: "Interest Rate (%)", type: "Number" },
    FixedPeriod: { key: "FixedPeriod", label: "Fixed Period (Years)", type: "Number" },
    MonthlyPayment: { key: "MonthlyPayment", label: "Monthly Payment", type: "Currency" },
    FeesAddedToLoan: { key: "FeesAddedToLoan", label: "Fees Added to Loan", type: "Currency" },
    NewLender: { key: "NewLender", label: "New Lender", type: "Choice", options: [] /* TODO: lender list */ },
    MortgageAccountNumber: { key: "MortgageAccountNumber", label: "Mortgage Account Number", type: "Text" },
    Adviser: { key: "Adviser", label: "Adviser", type: "Choice", options: [] /* TODO: adviser list */ },
    SubmissionRoute: { key: "SubmissionRoute", label: "Submission Route", type: "Choice", options: [] /* TODO */ },
    PropertyInfo: { key: "PropertyInfo", label: "Property Info", type: "MultilineText" },
    DetailsOfRecommendedProduct: { key: "DetailsOfRecommendedProduct", label: "Details of Recommended Product", type: "MultilineText" },
    LeadDate: { key: "LeadDate", label: "Lead Date", type: "Date" },
    NextActionDate: { key: "NextActionDate", label: "Next Action Date", type: "Date" },
    NextCaseAction: { key: "NextCaseAction", label: "Next Case Action", type: "Text" },
    Notes: { key: "Notes", label: "Notes", type: "MultilineText" },
};

const P4L_FIELD_POOL = {
    PolicyType: { key: "PolicyType", label: "Policy Type", type: "Choice", options: [] /* TODO */ },
    SumAssured: { key: "SumAssured", label: "Sum Assured / Monthly Benefit", type: "Currency" },
    Term_Years: { key: "Term_Years", label: "Term (Years)", type: "Number" },
    PolicyProvider: { key: "PolicyProvider", label: "Policy Provider", type: "Choice", options: [] /* TODO */ },
    OnRiskDate: { key: "OnRiskDate", label: "On Risk Date", type: "Date" },
    Status: { key: "Status", label: "Status", type: "Choice", options: [] /* TODO */ },
    CommissionAmount: { key: "CommissionAmount", label: "Commission Amount", type: "Currency" },
    CommissionType: { key: "CommissionType", label: "Commission Type", type: "Choice", options: [] /* TODO */ },
    CommissionPeriod: { key: "CommissionPeriod", label: "Commission Period", type: "Number" },
    PolicyPremium: { key: "PolicyPremium", label: "Policy Premium", type: "Currency" },
    NextActionDate: { key: "NextActionDate", label: "Next Action Date", type: "Date" },
    NextActionDescription: { key: "NextActionDescription", label: "Next Action Description", type: "Text" },
    Comments: { key: "Comments", label: "Comments", type: "MultilineText" },
};

const GI_FIELD_POOL = {
    PolicyType: { key: "PolicyType", label: "Policy Type", type: "Choice", options: ["Home-Building and Contents", "Home-Building Only", "Home-Content Only", "Landlord-Building Only", "Landlord-Building and Content" ] /* TODO: Buildings, Contents, Landlord... */ },
    SecurityAddress: { key: "SecurityAddress", label: "Property Address", type: "Text" },
    Insurer: { key: "Insurer", label: "Insurer", type: "Choice", options: ["Aviva", "Ageas", "Alianz", "Arkel", "Axa" ] /* TODO */ },
    PolicyNumber: { key: "PolicyNumber", label: "Policy Number", type: "Text" },
    PolicyRefTheSource: { key: "PolicyRefTheSource", label: "Policy Ref (Source System)", type: "Text" },
    SourcingSystem: { key: "SourcingSystem", label: "Sourcing System", type: "Choice", options: ["LV", "PaymentShield", "The Source", "UInsure"] /* TODO */ },
    OnRiskDate: { key: "OnRiskDate", label: "On Risk Date", type: "Date" },
    CurrentPremiumAnnual: { key: "CurrentPremiumAnnual", label: "Current Premium (Annual)", type: "Currency" },
    CurrentPremiumMonthly: { key: "CurrentPremiumMonthly", label: "Current Premium (Monthly)", type: "Currency" },
    PaymentMethod: { key: "PaymentMethod", label: "Payment Method", type: "Choice", options: ["Monthly", "Annually"] /* TODO */ },
    Status: { key: "Status", label: "Status", type: "Choice", options: ["Quote", "Live", "Cancelled", "Lapsed/Expired"] /* TODO */ },
    SLStatus: { key: "SLStatus", label: "SL Status", type: "Choice", options: ["N/A", "Incomplete", "Drafted", "Sent"] /* TODO */ },
    RenewalPremiumAnnual: { key: "RenewalPremiumAnnual", label: "Renewal Premium (Annual)", type: "Currency" },
    BrokersCommission: { key: "BrokersCommission", label: "Broker's Commission", type: "Currency" },
    Comments: { key: "Comments", label: "Comments", type: "MultilineText" },
};

/* Picks fields from a pool by key, in the order given, applying
   any per-field overrides (required / conditionalOn / conditionalValue). */
function pick(pool, specs) {
    return specs.map(([key, overrides = {}]) => ({
        ...pool[key],
        required: false,
        ...overrides,
    }));
}

/* ---------- 3b. Field definitions per type ---------- */
/* type: "Text" | "MultilineText" | "Number" | "Currency" | "Date"
       | "Choice" | "MultiChoice" | "YesNo"
   conditionalOn / conditionalValue: field only shows when the
   referenced field's value matches                              */

const FIELD_CONFIG = {
    "Residential Purchase": {
        title: "Residential Purchase Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["PropertyValue", { required: true }],
            ["LoanAmount", { required: true }],
            ["RepaymentType", { required: true }],
            ["InterestRate"], ["FixedPeriod"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["Adviser"], ["SubmissionRoute"], ["PropertyInfo"], ["DetailsOfRecommendedProduct"],
            ["LeadDate"], ["NextActionDate"], ["NextCaseAction"], ["Notes"],
        ]),
    },

    "Residential Remortgage": {
        title: "Residential Remortgage Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["PropertyValue", { required: true }],
            ["LoanAmount", { required: true }],
            ["CapitalRaising", { required: true }],
            ["RepaymentType", { required: true }],
            ["InterestRate"], ["FixedPeriod"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["NewLender"], ["Adviser"], ["SubmissionRoute"], ["PropertyInfo"],
            ["DetailsOfRecommendedProduct"], ["LeadDate"], ["NextActionDate"], ["NextCaseAction"], ["Notes"],
        ]),
    },

    "Buy-to-Let Purchase": {
        title: "Buy-to-Let Purchase Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["PropertyValue", { required: true }],
            ["LoanAmount", { required: true }],
            ["RepaymentType", { required: true }],
            ["InterestRate"], ["FixedPeriod"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["Adviser"], ["SubmissionRoute"], ["PropertyInfo"], ["DetailsOfRecommendedProduct"],
            ["LeadDate"], ["NextActionDate"], ["NextCaseAction"], ["Notes"],
        ]),
    },

    "Buy-to-Let Remortgage": {
        title: "Buy-to-Let Remortgage Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["PropertyValue", { required: true }],
            ["LoanAmount", { required: true }],
            ["CapitalRaising", { required: true }],
            ["RepaymentType", { required: true }],
            ["InterestRate"], ["FixedPeriod"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["NewLender"], ["Adviser"], ["SubmissionRoute"], ["PropertyInfo"],
            ["DetailsOfRecommendedProduct"], ["LeadDate"], ["NextActionDate"], ["NextCaseAction"], ["Notes"],
        ]),
    },

    "Product Transfer": {
        title: "Product Transfer Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["MortgageAccountNumber", { required: true }],
            ["LoanAmount", { required: true }],
            ["NewLender", { required: true }],
            ["RepaymentType", { required: true }],
            ["InterestRate"], ["FixedPeriod"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["DetailsOfRecommendedProduct"], ["Adviser"], ["LeadDate"], ["NextActionDate"], ["Notes"],
        ]),
    },

    "Shared Ownership": {
        title: "Shared Ownership Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["PropertyValue", { required: true }],
            ["LoanAmount", { required: true }],
            ["RepaymentType", { required: true }],
            ["InterestRate"], ["FixedPeriod"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["Adviser"], ["SubmissionRoute"], ["PropertyInfo"], ["DetailsOfRecommendedProduct"],
            ["LeadDate"], ["NextActionDate"], ["NextCaseAction"], ["Notes"],
        ]),
    },

    "Bridging": {
        title: "Bridging Loan Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["PropertyValue", { required: true }],
            ["LoanAmount", { required: true }],
            ["RepaymentType"],
            ["InterestRate"], ["FixedPeriod"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["PropertyInfo"], ["DetailsOfRecommendedProduct"], ["Adviser"],
            ["LeadDate"], ["NextActionDate"], ["NextCaseAction"], ["Notes"],
        ]),
    },

    "Second Charge": {
        title: "Second Charge Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["PropertyValue", { required: true }],
            ["LoanAmount", { required: true }],
            ["RepaymentType", { required: true }],
            ["InterestRate"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["DetailsOfRecommendedProduct"], ["Adviser"], ["LeadDate"], ["NextActionDate"], ["Notes"],
        ]),
    },

    "Right to Buy": {
        title: "Right to Buy Details",
        fields: pick(MORTGAGE_FIELD_POOL, [
            ["SecurityAddress", { required: true }],
            ["PropertyValue", { required: true }],
            ["LoanAmount", { required: true }],
            ["RepaymentType", { required: true }],
            ["InterestRate"], ["FixedPeriod"], ["MonthlyPayment"], ["FeesAddedToLoan"],
            ["DetailsOfRecommendedProduct"], ["Adviser"], ["LeadDate"], ["NextActionDate"], ["Notes"],
        ]),
    },

    "Protection Only": {
        title: "Protection Enquiry Details",
        fields: pick(P4L_FIELD_POOL, [
            ["PolicyType", { required: true }],
            ["SumAssured", { required: true }],
            ["Term_Years"], ["PolicyProvider"], ["OnRiskDate"],
            ["NextActionDate"], ["NextActionDescription"], ["Comments"],
        ]),
    },

    "Life Insurance": {
        title: "Life Insurance Details",
        fields: pick(P4L_FIELD_POOL, [
            ["PolicyType", { required: true }],
            ["SumAssured", { required: true }],
            ["Term_Years"], ["PolicyProvider"], ["OnRiskDate"],
            ["CommissionAmount"], ["CommissionType"], ["CommissionPeriod"], ["PolicyPremium"],
            ["NextActionDate"], ["NextActionDescription"], ["Comments"],
        ]),
    },

    "Critical Illness Cover": {
        title: "Critical Illness Cover Details",
        fields: pick(P4L_FIELD_POOL, [
            ["PolicyType", { required: true }],
            ["SumAssured", { required: true }],
            ["Term_Years", { required: true }],
            ["PolicyProvider"], ["OnRiskDate"],
            ["CommissionAmount"], ["CommissionType"], ["CommissionPeriod"], ["PolicyPremium"],
            ["NextActionDate"], ["NextActionDescription"], ["Comments"],
        ]),
    },

    "Income Protection": {
        title: "Income Protection Details",
        fields: pick(P4L_FIELD_POOL, [
            ["SumAssured", { required: true }],
            ["PolicyType", { required: true }],
            ["Term_Years"], ["PolicyProvider"], ["OnRiskDate"],
            ["CommissionAmount"], ["CommissionType"], ["CommissionPeriod"], ["PolicyPremium"],
            ["NextActionDate"], ["NextActionDescription"], ["Comments"],
        ]),
    },

    "General Insurance": {
        title: "General Insurance Details",
        fields: pick(GI_FIELD_POOL, [
            ["PolicyType", { required: true }],
            ["SecurityAddress", { required: true }],
            ["Insurer"], ["PolicyNumber"], ["PolicyRefTheSource"], ["SourcingSystem"],
            ["OnRiskDate"], ["CurrentPremiumAnnual"], ["CurrentPremiumMonthly"], ["PaymentMethod"],
            ["Status"], ["SLStatus"], ["RenewalPremiumAnnual"], ["BrokersCommission"], ["Comments"],
        ]),
    },
};

/* ============================================================
   4. Render engine
   ============================================================ */

function renderInput(field) {
    const req = field.required ? "speed-bind-validate" : "speed-bind";

    switch (field.type) {
        case "Text":
            return `<input type="text" placeholder="Enter text" id="${field.key}" ${req}="${field.key}"  />`;

        case "Number":
            return `<input type="number" placeholder="Enter nunber" id="${field.key}" ${req}="${field.key}"  />`;

        case "Currency":
            return `<input type="number" placeholder="Enter Amount" step="0.01" id="${field.key}" ${req}="${field.key}"  />`;

        case "Date":
            return `<input type="date" id="${field.key}" ${req}="${field.key}"  />`;

        case "MultilineText":
            return `<textarea placeholder="Enter text here" id="${field.key}" ${req}="${field.key}" ></textarea>`;

        case "YesNo":
            return `
                <select id="${field.key}" ${req}="${field.key}" >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>`;

        case "Choice":
            return `
                <select id="${field.key}" ${req}="${field.key}" >
                    <option value="">Select...</option>
                    ${field.options.map((o) => `<option value="${o}">${o}</option>`).join("")}
                </select>`;

        case "MultiChoice":
            return `
                <div class="multi-choice-group">
                    ${field.options
                        .map(
                            (o) => `
                                <input
                                    sptype="multivalue"
                                    sptype-label="${o}"
                                    type="checkbox"
                                    value="${o}"
                                    ${req}="${field.key}"
                                    name="${field.key}"
                                />
                                <span>${o}</span>
                        `
                        )
                        .join("")}
                </div>`;

        default:
            return `<input type="text" id="${field.key}" ${req}="${field.key}" />`;
    }
}

function renderFieldGroup(field) {
    const isConditional = !!field.conditionalOn;
    const conditionalAttrs = isConditional
        ? `data-conditional-field="${field.conditionalOn}" data-conditional-value="${field.conditionalValue}"`
        : "";
    const hiddenClass = isConditional ? "hidden" : "";

    return `
        <div class="form-group ${hiddenClass}" id="${field.key}_group" ${conditionalAttrs}>
            <label>${field.label}${field.required ? " *" : ""}</label>
            ${renderInput(field)}
        </div>`;
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

function renderFormSection(typeConfig) {
    const rows = chunk(typeConfig.fields, 2)
        .map((pair) => `<div class="form-row">${pair.map(renderFieldGroup).join("")}</div>`)
        .join("");

    return `
        <div class="form-section" id="dynamic-type-section">
            <div class="form-section-title">${typeConfig.title}</div>
            ${rows}
        </div>`;
}

/* ============================================================
   5. Wiring — Application Type -> Type -> Fields
   ============================================================ */

function populateSelect(selectEl, options, placeholder) {
    selectEl.empty();
    selectEl.append($('<option>').val("").text(placeholder));
    options.forEach((o) => {
        selectEl.append($('<option>').val(o.value).text(o.text));
    });
}

function clearDynamicFields() {
    $("#dynamic-fields-container").empty();
}

function bindConditionalFields(scope) {
    const conditionalGroups = $(scope).find("[data-conditional-field]");

    conditionalGroups.each((_, group) => {
        const $group = $(group);
        const controllingKey = $group.data("conditionalField");
        let $controllingEl = $(scope).find(`[speed-bind="${controllingKey}"]`);

        if (!$controllingEl.length) {
            $controllingEl = $(`[speed-bind="${controllingKey}"]`);
        }

        if (!$controllingEl.length) return;

        const evaluate = () => {
            const match = $controllingEl.val() === $group.data("conditionalValue");
            $group.toggleClass("hidden", !match);
        };

        $controllingEl.off("change", evaluate).on("change", evaluate);
        evaluate();
    });
}

function renderDynamicFields(typeCode) {
    const $container = $("#dynamic-fields-container");
    if (!$container.length) return;

    clearDynamicFields();

    const typeConfig = FIELD_CONFIG[typeCode];
    if (!typeConfig) return;

    $container.append(renderFormSection(typeConfig));
    bindConditionalFields($container);
}

function onTypeChange() {
    renderDynamicFields($(this).val());
}

function onApplicationTypeChange() {
    const category = $(this).val();

    // Hide every type group, then clear whatever fields were showing
    Object.values(CATEGORY_GROUP_MAP).forEach(({ groupId }) => {
        $(`#${groupId}`).addClass("hidden");
    });
    clearDynamicFields();

    if (!category) return;

    const group = CATEGORY_GROUP_MAP[category];
    const $groupEl = $(`#${group.groupId}`);
    const $selectEl = $(`#${group.selectId}`);
    const types = TYPES_BY_CATEGORY[category];

    populateSelect($selectEl, types, "Select Type");
    $groupEl.removeClass("hidden");

    $selectEl.off("change", onTypeChange).on("change", onTypeChange);

    // General Insurance only has one type today — auto-select and render
    if (types.length === 1) {
        $selectEl.val(types[0].value);
        renderDynamicFields(types[0].value);
    }
}

/* ---------- Public entry point ---------- */

function initDynamicMortgageForm() {
    const $appTypeSelect = $("#application_type");
    if (!$appTypeSelect.length) return;

    populateSelect($appTypeSelect, APPLICATION_TYPES, "Select Application Type");
    $appTypeSelect.off("change", onApplicationTypeChange).on("change", onApplicationTypeChange);
}

window.DynamicMortgageForm = {
    APPLICATION_TYPES,
    TYPES_BY_CATEGORY,
    FIELD_CONFIG,
    initDynamicMortgageForm
};

window.initDynamicMortgageForm = initDynamicMortgageForm;