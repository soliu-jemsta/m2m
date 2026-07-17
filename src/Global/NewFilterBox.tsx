import * as React from "react";

// import '../Assets/css/style.css';

export const NewFilterBox = () => {
    return (
        <>
            <div className="search-filter-container sort-box hidden">
                <div className="new-search-filter-grid">
                    {/* <div className="filter-row"> */}
                        <div className="filter-item">
                            <label className="filter-label" htmlFor="employeeName">Initiator Name</label>
                            <input type="text" id="employeeName" placeholder="Initiator Name" className="filter-input employee-name-input" speed-bind-query="EmployeeName" speed-operator="Contains" />
                        </div>
                        <div className="filter-item">
                            <label className="filter-label" htmlFor="nextApprover">Division/Unit</label>
                            <select id="division" className="filter-select status-dropdown" speed-bind-query="Division" speed-operator="Eq">
                            </select>
                        </div>
                    {/* </div> */}
                    {/* <div className="filter-row"> */}
                        <div className="filter-item">
                            <label className="filter-label" htmlFor="requeststrDate">Request Start Date</label>
                            <input type="date" id="requeststrDate" className="date-input start-date-input" />
                        </div>
                        <div className="filter-item">
                            <label className="filter-label" htmlFor="requestendDate">Request End Date</label>
                            <input type="date" id="requestendDate" className="date-input end-date-input" />
                        </div>
                    {/* </div> */}
                    {/* <div className="filter-row"> */}
                        <div className="filter-item">
                            <label className="filter-label" htmlFor="statusSelect">Please select a status</label>
                            <select id="statusSelect" className="filter-select status-dropdown" speed-bind-query="ImplementationStatus" speed-operator="Eq">
                                <option value="">Please select a status</option>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    {/* </div> */}
                </div>
                {/* <button id="searchbtn" className="search-button">Search</button> */}
            </div>
        </>
    );
};