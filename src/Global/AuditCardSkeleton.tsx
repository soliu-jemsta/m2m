import * as React from "react";

const AuditCardSkeleton = () => {
  return (
    <>
      {/* Inline CSS */}
      <style>{`
        .skeleton-section {
          display: block;
          width: 100%;
          animation: fadeIn 0.3s ease-in;
        }

        .skeleton-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .skeleton-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
        }

        @media (min-width: 1280px) {
          .skeleton-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .skeleton-card {
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          text-align: center;
          background-color: #fff;
        }

        .skeleton-line {
          height: 14px;
          margin: 10px auto;
          border-radius: 4px;
          background: linear-gradient(
            90deg,
            #e5e7eb 25%,
            #f3f4f6 37%,
            #e5e7eb 63%
          );
          background-size: 400% 100%;
          animation: shimmer 1.4s ease infinite;
        }

        .skeleton-line.short {
          width: 40px;
          height: 18px;
        }

        .skeleton-line.medium {
          width: 100px;
        }

        @keyframes shimmer {
          0% {
            background-position: -400px 0;
          }
          100% {
            background-position: 400px 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      {/* Skeleton Loader Markup */}
      <section className="skeleton-section">
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line short"></div>
              <div className="skeleton-line medium"></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default AuditCardSkeleton;
