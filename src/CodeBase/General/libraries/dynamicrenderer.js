/* ============================================================
   Dynamic Mortgage Form
   - Category -> Type cascade
   - Type -> Field-set render engine
   - jQuery version, matches the existing form-section /
     form-row / form-group / speed-bind template pattern
   ============================================================ */

/* ---------- 1. Application Type (category) options ---------- */

const APPLICATION_TYPES = [
    { value: "MORTGAGE", text: "Mortgage Type" },
    { value: "P4L", text: "P4L (Protection for Life)" },
    { value: "GI", text: "General Insurance" },
];

/* ---------- 2. Types available under each category ---------- */

const TYPES_BY_CATEGORY = {
    MORTGAGE: [
        { value: "RES_PURCHASE", text: "Residential Purchase" },
        { value: "RES_REMORTGAGE", text: "Residential Remortgage" },
        { value: "BTL_PURCHASE", text: "Buy-to-Let Purchase" },
        { value: "BTL_REMORTGAGE", text: "Buy-to-Let Remortgage" },
        { value: "PROD_TRANSFER", text: "Product Transfer" },
        { value: "SHARED_OWNERSHIP", text: "Shared Ownership" },
        { value: "BRIDGING", text: "Bridging" },
        { value: "SECOND_CHARGE", text: "Second Charge" },
        { value: "RIGHT_TO_BUY", text: "Right to Buy" },
    ],
    P4L: [
        { value: "PROTECTION_ONLY", text: "Protection Only" },
        { value: "LIFE_INSURANCE", text: "Life Insurance" },
        { value: "CIC", text: "Critical Illness Cover" },
        { value: "INCOME_PROTECTION", text: "Income Protection" },
    ],
    GI: [
        { value: "GENERAL_INSURANCE", text: "General Insurance" },
    ],
};

/* Maps each category to the DOM ids from the template */
const CATEGORY_GROUP_MAP = {
    MORTGAGE: { groupId: "mortgage_type_group", selectId: "mortgage_type" },
    P4L: { groupId: "p4l_type_group", selectId: "p4l_type" },
    GI: { groupId: "gi_type_group", selectId: "gi_type" },
};

/* ---------- 3. Field definitions per type ---------- */
/* type: "Text" | "MultilineText" | "Number" | "Currency" | "Date"
       | "Choice" | "MultiChoice" | "YesNo"
   conditionalOn / conditionalValue: field only shows when the
   referenced field's value matches                              */

const FIELD_CONFIG = {
    RES_PURCHASE: {
        title: "Residential Purchase Details",
        fields: [
            { key: "PropertyAddress", label: "Property Address", type: "Text", required: true },
            { key: "PropertyType", label: "Property Type", type: "Choice", required: true, options: ["Detached", "Semi-Detached", "Terraced", "Flat", "Bungalow", "New Build"] },
            { key: "PurchasePrice", label: "Purchase Price", type: "Currency", required: true },
            { key: "DepositAmount", label: "Deposit Amount", type: "Currency", required: true },
            { key: "DepositSource", label: "Deposit Source", type: "Choice", required: true, options: ["Savings", "Gift", "Sale of Property", "Inheritance", "Other"] },
            { key: "LoanAmountRequired", label: "Loan Amount Required", type: "Currency", required: true },
            { key: "MortgageTermYears", label: "Mortgage Term (Years)", type: "Number", required: true },
            { key: "RepaymentType", label: "Repayment Type", type: "Choice", required: true, options: ["Repayment", "Interest-Only", "Part & Part"] },
            { key: "FirstTimeBuyer", label: "First Time Buyer", type: "YesNo", required: true },
            { key: "GovernmentSchemeUsed", label: "Government Scheme Used", type: "Choice", required: false, options: ["None", "Help to Buy", "First Homes", "Deposit Unlock"] },
            { key: "EmploymentStatus", label: "Employment Status", type: "Choice", required: true, options: ["Employed", "Self-Employed", "Contractor", "Retired"] },
            { key: "GrossAnnualIncome", label: "Gross Annual Income", type: "Currency", required: true },
            { key: "SolicitorConveyancer", label: "Solicitor / Conveyancer", type: "Text", required: false },
            { key: "TargetExchangeDate", label: "Target Exchange Date", type: "Date", required: false },
            { key: "TargetCompletionDate", label: "Target Completion Date", type: "Date", required: false },
        ],
    },

    RES_REMORTGAGE: {
        title: "Residential Remortgage Details",
        fields: [
            { key: "CurrentPropertyAddress", label: "Current Property Address", type: "Text", required: true },
            { key: "CurrentLender", label: "Current Lender", type: "Text", required: true },
            { key: "CurrentMortgageBalance", label: "Current Mortgage Balance", type: "Currency", required: true },
            { key: "CurrentInterestRate", label: "Current Interest Rate (%)", type: "Number", required: true },
            { key: "CurrentMortgageType", label: "Current Mortgage Type", type: "Choice", required: true, options: ["Fixed", "Tracker", "Variable", "Discount"] },
            { key: "CurrentDealEndDate", label: "Current Deal End Date", type: "Date", required: true },
            { key: "EstimatedPropertyValue", label: "Estimated Property Value", type: "Currency", required: true },
            { key: "ReasonForRemortgage", label: "Reason for Remortgage", type: "Choice", required: true, options: ["Better Rate", "Capital Raising", "Debt Consolidation", "Home Improvements", "Other"] },
            { key: "AdditionalBorrowingRequired", label: "Additional Borrowing Required", type: "YesNo", required: true },
            { key: "AdditionalBorrowingAmount", label: "Additional Borrowing Amount", type: "Currency", required: false, conditionalOn: "AdditionalBorrowingRequired", conditionalValue: "Yes" },
            { key: "PurposeOfAdditionalBorrowing", label: "Purpose of Additional Borrowing", type: "Text", required: false, conditionalOn: "AdditionalBorrowingRequired", conditionalValue: "Yes" },
            { key: "NewLoanAmount", label: "New Loan Amount", type: "Currency", required: true },
            { key: "NewMortgageTermYears", label: "New Mortgage Term (Years)", type: "Number", required: true },
            { key: "RepaymentType", label: "Repayment Type", type: "Choice", required: true, options: ["Repayment", "Interest-Only", "Part & Part"] },
            { key: "EarlyRepaymentChargeApplies", label: "Early Repayment Charge Applies", type: "YesNo", required: true },
            { key: "ERCAmount", label: "ERC Amount", type: "Currency", required: false, conditionalOn: "EarlyRepaymentChargeApplies", conditionalValue: "Yes" },
        ],
    },

    BTL_PURCHASE: {
        title: "Buy-to-Let Purchase Details",
        fields: [
            { key: "PropertyAddress", label: "Property Address", type: "Text", required: true },
            { key: "PropertyType", label: "Property Type", type: "Choice", required: true, options: ["Detached", "Semi-Detached", "Terraced", "Flat", "Bungalow", "HMO"] },
            { key: "PurchasePrice", label: "Purchase Price", type: "Currency", required: true },
            { key: "DepositAmount", label: "Deposit Amount", type: "Currency", required: true },
            { key: "LoanAmountRequired", label: "Loan Amount Required", type: "Currency", required: true },
            { key: "ExpectedMonthlyRentalIncome", label: "Expected Monthly Rental Income", type: "Currency", required: true },
            { key: "LandlordExperience", label: "Landlord Experience", type: "Choice", required: true, options: ["First-Time Landlord", "Experienced (<4 properties)", "Portfolio Landlord (4+)"] },
            { key: "NumberOfExistingBTLProperties", label: "Number of Existing BTL Properties", type: "Number", required: true },
            { key: "OwnershipStructure", label: "Ownership Structure", type: "Choice", required: true, options: ["Personal Name", "Limited Company/SPV"] },
            { key: "SPVCompanyName", label: "SPV Company Name", type: "Text", required: false, conditionalOn: "OwnershipStructure", conditionalValue: "Limited Company/SPV" },
            { key: "IntendedTenancyType", label: "Intended Tenancy Type", type: "Choice", required: true, options: ["AST", "HMO", "Holiday Let", "Student Let"] },
            { key: "MortgageTermYears", label: "Mortgage Term (Years)", type: "Number", required: true },
            { key: "RepaymentType", label: "Repayment Type", type: "Choice", required: true, options: ["Interest-Only", "Repayment"] },
        ],
    },

    BTL_REMORTGAGE: {
        title: "Buy-to-Let Remortgage Details",
        fields: [
            { key: "PropertyAddress", label: "Property Address", type: "Text", required: true },
            { key: "CurrentLender", label: "Current Lender", type: "Text", required: true },
            { key: "CurrentMortgageBalance", label: "Current Mortgage Balance", type: "Currency", required: true },
            { key: "CurrentInterestRate", label: "Current Interest Rate (%)", type: "Number", required: true },
            { key: "CurrentMonthlyRentalIncome", label: "Current Monthly Rental Income", type: "Currency", required: true },
            { key: "EstimatedPropertyValue", label: "Estimated Property Value", type: "Currency", required: true },
            { key: "OwnershipStructure", label: "Ownership Structure", type: "Choice", required: true, options: ["Personal Name", "Limited Company/SPV"] },
            { key: "ReasonForRemortgage", label: "Reason for Remortgage", type: "Choice", required: true, options: ["Better Rate", "Capital Raising", "Debt Consolidation", "Other"] },
            { key: "CapitalRaisingRequired", label: "Capital Raising Required", type: "YesNo", required: true },
            { key: "CapitalRaisingAmount", label: "Capital Raising Amount", type: "Currency", required: false, conditionalOn: "CapitalRaisingRequired", conditionalValue: "Yes" },
            { key: "NewLoanAmount", label: "New Loan Amount", type: "Currency", required: true },
            { key: "NewMortgageTermYears", label: "New Mortgage Term (Years)", type: "Number", required: true },
            { key: "RepaymentType", label: "Repayment Type", type: "Choice", required: true, options: ["Interest-Only", "Repayment"] },
        ],
    },

    PROD_TRANSFER: {
        title: "Product Transfer Details",
        fields: [
            { key: "CurrentLender", label: "Current Lender", type: "Text", required: true },
            { key: "CurrentDealEndDate", label: "Current Deal End Date", type: "Date", required: true },
            { key: "CurrentBalance", label: "Current Balance", type: "Currency", required: true },
            { key: "CurrentRate", label: "Current Rate (%)", type: "Number", required: true },
            { key: "NewProductSelected", label: "New Product Selected", type: "Text", required: true },
            { key: "NewRate", label: "New Rate (%)", type: "Number", required: true },
            { key: "TermRemainingYears", label: "Term Remaining (Years)", type: "Number", required: true },
            { key: "FeesAddedToLoan", label: "Fees Added to Loan", type: "YesNo", required: true },
            { key: "AdditionalBorrowingRequested", label: "Additional Borrowing Requested", type: "YesNo", required: true },
        ],
    },

    SHARED_OWNERSHIP: {
        title: "Shared Ownership Details",
        fields: [
            { key: "PropertyAddress", label: "Property Address", type: "Text", required: true },
            { key: "HousingAssociationProvider", label: "Housing Association / Provider", type: "Text", required: true },
            { key: "SharePercentage", label: "Share Being Purchased (%)", type: "Number", required: true },
            { key: "FullMarketValue", label: "Full Market Value", type: "Currency", required: true },
            { key: "SharePurchasePrice", label: "Share Purchase Price", type: "Currency", required: true },
            { key: "MonthlyRentOnUnownedShare", label: "Monthly Rent on Unowned Share", type: "Currency", required: true },
            { key: "ServiceCharge", label: "Service Charge", type: "Currency", required: false },
            { key: "DepositAmount", label: "Deposit Amount", type: "Currency", required: true },
            { key: "LoanAmountRequired", label: "Loan Amount Required", type: "Currency", required: true },
            { key: "StaircasingIntended", label: "Staircasing Intended", type: "YesNo", required: false },
            { key: "MortgageTermYears", label: "Mortgage Term (Years)", type: "Number", required: true },
            { key: "RepaymentType", label: "Repayment Type", type: "Choice", required: true, options: ["Repayment", "Interest-Only", "Part & Part"] },
        ],
    },

    BRIDGING: {
        title: "Bridging Loan Details",
        fields: [
            { key: "SecurityPropertyAddress", label: "Security Property Address", type: "Text", required: true },
            { key: "PurposeOfLoan", label: "Purpose of Loan", type: "Choice", required: true, options: ["Purchase Before Sale", "Auction Purchase", "Renovation/Refurb", "Development Exit", "Other"] },
            { key: "LoanAmountRequired", label: "Loan Amount Required", type: "Currency", required: true },
            { key: "GrossOrNetLoan", label: "Gross or Net Loan", type: "Choice", required: true, options: ["Gross", "Net"] },
            { key: "PropertyValue", label: "Property Value", type: "Currency", required: true },
            { key: "ChargePosition", label: "Charge Position", type: "Choice", required: true, options: ["First Charge", "Second Charge"] },
            { key: "ExistingMortgageBalance", label: "Existing Mortgage Balance", type: "Currency", required: false },
            { key: "ExitStrategy", label: "Exit Strategy", type: "Choice", required: true, options: ["Sale of Property", "Remortgage", "Sale of Other Asset"] },
            { key: "LoanTermMonths", label: "Loan Term Required (Months)", type: "Number", required: true },
            { key: "EstimatedWorksCost", label: "Estimated Works Cost", type: "Currency", required: false, conditionalOn: "PurposeOfLoan", conditionalValue: "Renovation/Refurb" },
        ],
    },

    SECOND_CHARGE: {
        title: "Second Charge Details",
        fields: [
            { key: "PropertyAddress", label: "Property Address", type: "Text", required: true },
            { key: "ExistingFirstChargeLender", label: "Existing First Charge Lender", type: "Text", required: true },
            { key: "ExistingFirstChargeBalance", label: "Existing First Charge Balance", type: "Currency", required: true },
            { key: "PropertyValue", label: "Property Value", type: "Currency", required: true },
            { key: "LoanAmountRequired", label: "Loan Amount Required", type: "Currency", required: true },
            { key: "PurposeOfLoan", label: "Purpose of Loan", type: "Choice", required: true, options: ["Debt Consolidation", "Home Improvement", "Business Purposes", "Other"] },
            { key: "LoanTermYears", label: "Loan Term (Years)", type: "Number", required: true },
            { key: "RepaymentType", label: "Repayment Type", type: "Choice", required: true, options: ["Repayment", "Interest-Only"] },
            { key: "FirstChargeLenderConsentObtained", label: "First Charge Lender Consent Obtained", type: "YesNo", required: true },
        ],
    },

    RIGHT_TO_BUY: {
        title: "Right to Buy Details",
        fields: [
            { key: "CouncilHousingAssociationName", label: "Council / Housing Association Name", type: "Text", required: true },
            { key: "PropertyAddress", label: "Property Address", type: "Text", required: true },
            { key: "LengthOfTenancyYears", label: "Length of Tenancy (Years)", type: "Number", required: true },
            { key: "MarketValue", label: "Market Value", type: "Currency", required: true },
            { key: "RightToBuyDiscountAmount", label: "Right to Buy Discount Amount", type: "Currency", required: true },
            { key: "DiscountedPurchasePrice", label: "Discounted Purchase Price", type: "Currency", required: true },
            { key: "LoanAmountRequired", label: "Loan Amount Required", type: "Currency", required: true },
            { key: "DiscountClawbackPeriodApplies", label: "Discount Clawback Period Applies", type: "YesNo", required: true },
            { key: "MortgageTermYears", label: "Mortgage Term (Years)", type: "Number", required: true },
            { key: "RepaymentType", label: "Repayment Type", type: "Choice", required: true, options: ["Repayment", "Interest-Only"] },
        ],
    },

    PROTECTION_ONLY: {
        title: "Protection Enquiry Details",
        fields: [
            { key: "ReasonForReview", label: "Reason for Review", type: "Choice", required: true, options: ["New Mortgage", "Family Protection", "Business Protection", "Existing Policy Review"] },
            { key: "ExistingPoliciesInPlace", label: "Existing Policies in Place", type: "YesNo", required: true },
            { key: "ExistingProviders", label: "Existing Provider(s)", type: "Text", required: false, conditionalOn: "ExistingPoliciesInPlace", conditionalValue: "Yes" },
            { key: "CoverTypesOfInterest", label: "Cover Types of Interest", type: "MultiChoice", required: true, options: ["Life Insurance", "Critical Illness", "Income Protection", "Family Income Benefit"] },
            { key: "PreferredMonthlyBudget", label: "Preferred Monthly Budget", type: "Currency", required: false },
        ],
    },

    LIFE_INSURANCE: {
        title: "Life Insurance Details",
        fields: [
            { key: "PolicyType", label: "Policy Type", type: "Choice", required: true, options: ["Level Term", "Decreasing Term", "Whole of Life", "Family Income Benefit"] },
            { key: "SumAssured", label: "Sum Assured", type: "Currency", required: true },
            { key: "TermRequiredYears", label: "Term Required (Years)", type: "Number", required: false },
            { key: "CoverBasis", label: "Cover Basis", type: "Choice", required: true, options: ["Single Life", "Joint Life First Death", "Joint Life Second Death"] },
            { key: "WrittenInTrust", label: "Written in Trust", type: "YesNo", required: true },
            { key: "SmokerStatus", label: "Smoker Status", type: "Choice", required: true, options: ["Non-Smoker", "Smoker", "Ex-Smoker"] },
            { key: "HealthDisclosures", label: "Health Disclosures", type: "MultilineText", required: false },
            { key: "LinkedToMortgageCase", label: "Linked to a Mortgage Case", type: "YesNo", required: false },
            { key: "LinkedCaseReference", label: "Linked Case Reference", type: "Text", required: false, conditionalOn: "LinkedToMortgageCase", conditionalValue: "Yes" },
            { key: "Beneficiaries", label: "Beneficiaries", type: "Text", required: false },
        ],
    },

    CIC: {
        title: "Critical Illness Cover Details",
        fields: [
            { key: "PolicyType", label: "Policy Type", type: "Choice", required: true, options: ["Standalone CIC", "Combined Life + CIC"] },
            { key: "SumAssured", label: "Sum Assured", type: "Currency", required: true },
            { key: "TermRequiredYears", label: "Term Required (Years)", type: "Number", required: true },
            { key: "CoverLevel", label: "Cover Level", type: "Choice", required: true, options: ["Standard", "Comprehensive", "Enhanced"] },
            { key: "Occupation", label: "Occupation", type: "Text", required: true },
            { key: "SmokerStatus", label: "Smoker Status", type: "Choice", required: true, options: ["Non-Smoker", "Smoker", "Ex-Smoker"] },
            { key: "HealthDisclosures", label: "Health Disclosures", type: "MultilineText", required: false },
            { key: "FamilyMedicalHistory", label: "Family Medical History", type: "MultilineText", required: false },
            { key: "LinkedToMortgageCase", label: "Linked to a Mortgage Case", type: "YesNo", required: false },
        ],
    },

    INCOME_PROTECTION: {
        title: "Income Protection Details",
        fields: [
            { key: "MonthlyBenefitRequired", label: "Monthly Benefit Required", type: "Currency", required: true },
            { key: "DeferredPeriod", label: "Deferred Period", type: "Choice", required: true, options: ["4 Weeks", "8 Weeks", "13 Weeks", "26 Weeks", "52 Weeks"] },
            { key: "BenefitPaymentTerm", label: "Benefit Payment Term", type: "Choice", required: true, options: ["To Retirement Age", "2 Year Limited", "5 Year Limited"] },
            { key: "OccupationClass", label: "Occupation Class", type: "Choice", required: true, options: ["Class 1", "Class 2", "Class 3", "Class 4"] },
            { key: "EmploymentStatus", label: "Employment Status", type: "Choice", required: true, options: ["Employed", "Self-Employed"] },
            { key: "ExistingSickPayProvision", label: "Existing Sick Pay Provision", type: "Text", required: false },
            { key: "SmokerStatus", label: "Smoker Status", type: "Choice", required: true, options: ["Non-Smoker", "Smoker", "Ex-Smoker"] },
            { key: "HealthDisclosures", label: "Health Disclosures", type: "MultilineText", required: false },
        ],
    },

    GENERAL_INSURANCE: {
        title: "General Insurance Details",
        fields: [
            { key: "InsuranceType", label: "Insurance Type", type: "Choice", required: true, options: ["Buildings", "Contents", "Buildings & Contents", "Landlord Insurance"] },
            { key: "PropertyAddress", label: "Property Address", type: "Text", required: true },
            { key: "BuildingsSumInsured", label: "Buildings Sum Insured / Rebuild Value", type: "Currency", required: false },
            { key: "ContentsSumInsured", label: "Contents Sum Insured", type: "Currency", required: false },
            { key: "PropertyType", label: "Property Type", type: "Choice", required: true, options: ["Detached", "Semi-Detached", "Terraced", "Flat", "Bungalow"] },
            { key: "NumberOfBedrooms", label: "Number of Bedrooms", type: "Number", required: true },
            { key: "PropertyOwnershipStatus", label: "Property Ownership Status", type: "Choice", required: true, options: ["Owner Occupied", "Let Property", "Unoccupied"] },
            { key: "SecurityFeatures", label: "Security Features", type: "MultiChoice", required: false, options: ["Alarm", "CCTV", "Multi-Point Locks", "Neighbourhood Watch"] },
            { key: "ClaimsInLast5Years", label: "Claims in Last 5 Years", type: "YesNo", required: true },
            { key: "ClaimsDetails", label: "Claims Details", type: "MultilineText", required: false, conditionalOn: "ClaimsInLast5Years", conditionalValue: "Yes" },
            { key: "CurrentInsurer", label: "Current Insurer", type: "Text", required: false },
            { key: "RenewalDate", label: "Renewal Date", type: "Date", required: false },
        ],
    },
};

/* ============================================================
   4. Render engine
   ============================================================ */

function renderInput(field) {
    const req = field.required ? "required" : "";

    switch (field.type) {
        case "Text":
            return `<input type="text" id="${field.key}" speed-bind="${field.key}" ${req} />`;

        case "Number":
            return `<input type="number" id="${field.key}" speed-bind="${field.key}" ${req} />`;

        case "Currency":
            return `<input type="number" step="0.01" id="${field.key}" speed-bind="${field.key}" ${req} />`;

        case "Date":
            return `<input type="date" id="${field.key}" speed-bind="${field.key}" ${req} />`;

        case "MultilineText":
            return `<textarea id="${field.key}" speed-bind="${field.key}" ${req}></textarea>`;

        case "YesNo":
            return `
                <select id="${field.key}" speed-bind="${field.key}" ${req}>
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>`;

        case "Choice":
            return `
                <select id="${field.key}" speed-bind="${field.key}" ${req}>
                    <option value="">Select...</option>
                    ${field.options.map((o) => `<option value="${o}">${o}</option>`).join("")}
                </select>`;

        case "MultiChoice":
            return `
                <select id="${field.key}" speed-bind="${field.key}" multiple ${req}>
                    ${field.options.map((o) => `<option value="${o}">${o}</option>`).join("")}
                </select>`;

        default:
            return `<input type="text" id="${field.key}" speed-bind="${field.key}" />`;
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

    populateSelect($selectEl, types, "-- Select Type --");
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

    populateSelect($appTypeSelect, APPLICATION_TYPES, "-- Select Application Type --");
    $appTypeSelect.off("change", onApplicationTypeChange).on("change", onApplicationTypeChange);
}

window.DynamicMortgageForm = {
    APPLICATION_TYPES,
    TYPES_BY_CATEGORY,
    FIELD_CONFIG,
    initDynamicMortgageForm
};

window.initDynamicMortgageForm = initDynamicMortgageForm;
