import * as React from "react";

const AnalyticsLoader = () => {
  return (
    <div className="page" id="analyticsloader">

      {/* Header */}
      <div className="flex-between mb18">
        <div>
          <div className="skeleton skeleton-title-lg" />
          <div className="skeleton skeleton-subtitle" />
        </div>
        <div className="flex gap8">
          <div className="skeleton skeleton-tab" />
          <div className="skeleton skeleton-tab" />
          <div className="skeleton skeleton-tab" />
          <div className="skeleton skeleton-btn-sm" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-row">
        {[1,2,3,4].map(i => (
          <div className="stat-card" key={i}>
            <div className="stat-top">
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-icon" />
            </div>
            <div className="skeleton skeleton-stat-num" />
            <div className="skeleton skeleton-sub" />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="two-col mb14">

        {/* Monthly Chart */}
        <div className="card">
          <div className="card-header">
            <div className="skeleton skeleton-title" />
          </div>
          <div className="card-body">
            <div className="skeleton skeleton-chart" />
          </div>
        </div>

        {/* Donut + legend */}
        <div className="card">
          <div className="card-header">
            <div className="skeleton skeleton-title" />
          </div>
          <div className="card-body">

            <div className="donut-wrap">
              <div className="skeleton skeleton-donut" />

              <div className="donut-legend">
                {[1,2,3,4].map(i => (
                  <div className="legend-item" key={i}>
                    <div className="skeleton skeleton-dot" />
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-line tiny" />
                  </div>
                ))}
              </div>
            </div>

            <div className="divider" />

            {/* Progress bars */}
            {[1,2,3].map(i => (
              <div className="prog-row" key={i}>
                <div className="prog-label">
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton skeleton-line tiny" />
                </div>
                <div className="skeleton skeleton-progress" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom charts */}
      <div className="two-col mb14">
        {[1,2].map(i => (
          <div className="card" key={i}>
            <div className="card-header">
              <div className="skeleton skeleton-title" />
            </div>
            <div className="card-body">
              <div className="skeleton skeleton-chart" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AnalyticsLoader;