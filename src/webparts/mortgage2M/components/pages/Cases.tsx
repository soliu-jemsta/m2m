import * as React from "react";
import { Link } from "react-router-dom";
// import { NewLoader } from "../../../../Global/NewLoader";
// import ClientButton from "../../../../Global/ClientButton";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";

require("cases");

interface ColumnDef {
  label: string;
  bind?: string;
}

// Column sets per category — this is the whole reason for the tabs: each
// category's cases carry a different "headline" field, so each gets its
// own table instead of forcing one shared set of columns on everyone.
const MORTGAGE_COLUMNS: ColumnDef[] = [
  { label: "S/N" },
  { label: "Reference", bind: "CaseID" },
  { label: "Client(s)", bind: "Client" },
  { label: "Adviser", bind: "Adviser" },
  { label: "Type", bind: "ApplicationType" },
  { label: "Status", bind: "Status" },
  { label: "Action", bind: "Modified" },
];

const P4L_COLUMNS: ColumnDef[] = [
  { label: "S/N" },
  { label: "Reference", bind: "CaseID" },
  { label: "Client(s)", bind: "Client" },
  { label: "Adviser", bind: "Adviser" },
  { label: "Type", bind: "ApplicationType" },
  { label: "Status", bind: "Status" },
  { label: "Action", bind: "Modified" },
];

const GI_COLUMNS: ColumnDef[] = [
  { label: "S/N" },
  { label: "Reference", bind: "CaseID" },
  { label: "Client(s)", bind: "Client" },
  { label: "Adviser", bind: "Adviser" },
  { label: "Type", bind: "ApplicationType" },
  { label: "Status", bind: "Status" },
  { label: "Action", bind: "Modified" },
];

export default class Cases extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="" id="view-cases">
          <div className="section-hdr" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16 }}>All Cases</h2>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div className="filter-tabs">
                <div className="ft ft-category active" data-category="MORTGAGE">
                  Mortgages
                </div>
                <div className="ft ft-category" data-category="P4L">
                  P4L
                </div>
                <div className="ft ft-category" data-category="GI">
                  General Insurance
                </div>
              </div>
              <Link to="/new-case" className="btn btn-primary btn-sm">
                ＋ New Case
              </Link>
            </div>
          </div>

          {this.renderCategorySection(
            "MORTGAGE",
            "speed-data-table-mortgage",
            "pagination-mortgage",
            "status-filters-mortgage",
            true,
            MORTGAGE_COLUMNS
          )}
          {this.renderCategorySection(
            "P4L",
            "speed-data-table-p4l",
            "pagination-p4l",
            "status-filters-p4l",
            false,
            P4L_COLUMNS
          )}
          {this.renderCategorySection(
            "GI",
            "speed-data-table-gi",
            "pagination-gi",
            "status-filters-gi",
            false,
            GI_COLUMNS
          )}
        </div>
      </>
    );
  }

  // visible controls only the initial inline style — cases.js takes over
  // show/hide via jQuery once it wires up the category tabs on mount, the
  // same way it already drives everything else on this page.
  private renderCategorySection(
    category: string,
    tableBodyId: string,
    paginationId: string,
    filterRowId: string,
    visible: boolean,
    columns: ColumnDef[]
  ): React.ReactElement {
    return (
      <div
        key={category}
        data-category-section={category}
        style={{ display: visible ? "block" : "none" }}
      >
        <div
          className="filter-tabs"
          id={filterRowId}
          data-status-row={category}
          style={{ marginBottom: 12 }}
        >
          <div className="ft ft-status active" data-filter="all">
            All
          </div>
          <div className="ft ft-status" data-filter="pending">
            Pending
          </div>
          <div className="ft ft-status" data-filter="completed">
            Closed
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.label} speed-table-data={col.bind}>
                      {col.label}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody id={tableBodyId} />
            </table>
          </div>
        </div>

        <div className="norequest" data-category={category} style={{ display: "none" }}>
          No cases found.
        </div>

        <div id={paginationId} className="pagination" />
      </div>
    );
  }

  public componentDidMount(): void {
    window.loadCasesComponent();
  }
}