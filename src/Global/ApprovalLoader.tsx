import * as React from "react";

const ApprovalLoader = () => {
  return (
    <div className="page" id="approvalloader">
      <div className="idea-list">

        <div className="idea-card expanded">

          {/* Avatar */}
          <div className="skeleton skeleton-avatar" />

          <div className="idea-body">

            {/* Title */}
            <div className="skeleton skeleton-title-md" />

            {/* Meta */}
            <div className="idea-meta">
              <div className="skeleton skeleton-line short" />
            </div>

            {/* Badges */}
            <div className="idea-badges">
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-badge" />
            </div>

            <div className="idea-badges" style={{ marginTop: 5 }}>
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-badge" />
            </div>

            {/* Idea text */}
            <div className="approve-panel">
              <div className="skeleton skeleton-paragraph" />

              {/* Impact title */}
              <div className="skeleton skeleton-label" />

              {/* Impact grid */}
              <div className="impact-grid">
                {[1, 2, 3, 4, 5].map(i => (
                  <div className="impact-row" key={i}>
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-stars" />
                  </div>
                ))}
              </div>

              {/* Approval fields */}
              <div style={{ marginTop: 12 }}>
                <div className="skeleton skeleton-label" />

                <div className="form-grid">
                  <div className="skeleton skeleton-input" />
                  <div className="skeleton skeleton-input" />
                </div>
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginTop: 16 }}>
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-textarea" />
            </div>

            {/* Decision */}
            <div style={{ marginTop: 12 }}>
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-buttons-wide" />
            </div>

          </div>

          {/* Right status */}
          <div className="skeleton skeleton-side" />

        </div>

      </div>
    </div>
  );
};

export default ApprovalLoader;