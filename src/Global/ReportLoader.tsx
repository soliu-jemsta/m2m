import * as React from "react";

const ReportLoader = () => {
  return (
    <div className="page" id="reportloader">

      {/* KPI Cards */}
      <div className="stats-row">
        {[1,2,3,4].map(i => (
          <div className="stat-card" key={i}>
            <div className="stat-top">
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-icon" />
            </div>
            <div className="skeleton skeleton-stat-num" />
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card">

        {/* Header */}
        <div className="card-header">
          <div className="skeleton skeleton-title" />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {[1,2,3,4,5,6,7].map(i => (
                  <th key={i}>
                    <div className="skeleton skeleton-th" />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {[1,2,3,4,5].map(row => (
                <tr key={row}>
                  {[1,2,3,4,5,6,7].map(col => (
                    <td key={col}>
                      <div className="skeleton skeleton-td" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: "12px 16px" }}>
          <div className="skeleton skeleton-pagination" />
        </div>

      </div>

    </div>
  );
};

export default ReportLoader;