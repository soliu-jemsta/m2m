import * as React from "react";

export const FilterBox = () => {
    return (
        <div className="filter-container">

            {/* ── TOP ROW ── */}
            <div className="filter-top">

                <div className="search-input">
                    🔍
                    <input id="reportsearchfield" placeholder="Search ideas, submitter, division…" />
                </div>
                <select
                    id="division"
                    speed-bind-query="Division"
                    speed-operator="Eq"
                    className="division-select"
                />
            </div>

            {/* DATE RANGE */}
            <div className="date-range">
                <input type="date" id="dateFrom" />
                {/* <span className="date-sep">—</span> */}
                <input type="date" id="dateTo" />
            </div>

            {/* ── FILTER GROUPS ── */}
            <div className="filter-groups">

                {/* Approval Status */}
                <div className="filter-group">
                    <div className="filter-label">Approval Status</div>
                    <div className="filter-row">
                        <div className="filter-pill active">All</div>
                        <div className="filter-pill" speed-bind-query="Approval_Status" speed-operator="Eq" id="Pending">Pending</div>
                        <div className="filter-pill" speed-bind-query="Approval_Status" speed-operator="Eq" id="Completed">Approved</div>
                        <div className="filter-pill" speed-bind-query="Approval_Status" speed-operator="Eq" id="Declined">Declined</div>
                    </div>
                </div>

                {/* Implementation Status */}
                <div className="filter-group">
                    <div className="filter-label">Implementation Status</div>
                    <div className="filter-row">
                        <div className="filter-pillz active">All</div>
                        <div className="filter-pillz" speed-bind-query="ImplementationStatus" speed-operator="Eq" id="Not Started">Not Started</div>
                        <div className="filter-pillz" speed-bind-query="ImplementationStatus" speed-operator="Eq" id="In Progress">In Progress</div>
                        <div className="filter-pillz" speed-bind-query="ImplementationStatus" speed-operator="Eq" id="Completed">Completed</div>
                    </div>
                </div>

            </div>
            <button className="btn btn-ghost btn-sm" id="exportbtn" style={{ marginTop: "14px" }}>⬇ Export</button>
        </div>
    );
};