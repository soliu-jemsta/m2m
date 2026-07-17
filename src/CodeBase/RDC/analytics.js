loadAnalyticsComponent = function () {
    if (MainApplication.cachedState.mode) {
        whenAnalyticsDependenciesLoaded();
    } else {
        MainApplication.cachedState.pageStateCall = loadAnalyticsComponent;
    }
};

MainApplication.AnalyticsComponent = {
    charts: { npsTrend: null, csatDist: null, csatByDiv: null, volumePie: null },
    activeYear: new Date().getFullYear(),
    activePeriod: "ytd",
    activeDivision: null
};

/* ─── Boot ────────────────────────────────────────────────────────────── */
whenAnalyticsDependenciesLoaded = function () {
    // Populate Year Selector with Current & Previous Year only
    const currentYear = new Date().getFullYear();
    const yearSelect = $(".dash-ctrl select:first");
    yearSelect.empty()
        .append(`<option value="${currentYear}">${currentYear}</option>`)
        .append(`<option value="${currentYear - 1}">${currentYear - 1}</option>`);

    // Live Filters — both selects trigger handlePeriodChange
    $(".dash-ctrl select").on("change", function () {
        MainApplication.AnalyticsComponent.handlePeriodChange();
    });

    // Expose tab switcher globally so React onClick handlers in Analytics.tsx can call it.
    // Analytics.tsx calls: (window as any).switchDashTab?.(tab)
    window.switchDashTab = function (tab) {
        $(".dash-tab").removeClass("active");
        // Match by data-tab attribute (set in TSX) or text content
        const $btn = $(`.dash-tab[data-tab="${tab}"]`);
        ($btn.length ? $btn : $(`.dash-tab:contains("${tab}")`)).addClass("active");

        MainApplication.AnalyticsComponent.activeDivision =
            (tab === "overall" || tab === "Overall") ? null : tab;

        MainApplication.AnalyticsComponent.retrieveSurveys();
    };

    // Fallback jQuery click delegation (handles both React-rendered and plain HTML tabs)
    $(document).on("click", ".dash-tab", function () {
        $(".dash-tab").removeClass("active");
        $(this).addClass("active");

        const tab = $(this).data("tab") || $(this).text().trim();
        MainApplication.AnalyticsComponent.activeDivision =
            (tab === "overall" || tab === "Overall") ? null : tab;

        MainApplication.AnalyticsComponent.retrieveSurveys();
    });

    setTimeout(() => {
        $("#analyticsloader").hide();
        $("#page-analytics").removeClass("hidden").show();
        globalDefinitions.closeLoader?.();
        MainApplication.AnalyticsComponent.retrieveSurveys();
    }, 300);
};

/* ─── Data Retrieval ──────────────────────────────────────────────────── */
MainApplication.AnalyticsComponent.retrieveSurveys = function () {
    const query = this.buildSurveyQuery();

    $spcontext.getListToItems(
        "CustomerSurveyList",
        query,
        {
            merge: true,
            data: [
                "ID", "Title", "CustomerName", "ProjectTitle", "ServiceLine", "Division",
                "CSAT", "NPS", "CSATCategory", "NPSCategory", "Created", "CrewName",
                "JobNumber", "Approval_Status", "Year"
            ]
        },
        true,
        null,
        (tableData) => {
            MainApplication.AnalyticsComponent.processAndRender(tableData);
        }
    );
};

MainApplication.AnalyticsComponent.buildSurveyQuery = function () {
    const query = [{ ascending: "FALSE", orderby: "Created" }];
    const year = this.activeYear;

    if (year) {
        query.push({ val: year,   type: "Text", field: "Year", operator: "Eq" });
    }

    return $spcontext.camlBuilder($spcontext.formQueryArrayGenerator(query));
};

/* ─── Handle Period Change ───────────────────────────────────────────── */
MainApplication.AnalyticsComponent.handlePeriodChange = function () {
    const selects = $(".dash-ctrl select");
    this.activeYear   = parseInt(selects.eq(0).val()) || new Date().getFullYear();
    this.activePeriod = selects.eq(1).val();
    this.retrieveSurveys();
};

/* ─── Period Filter Helper ───────────────────────────────────────────── */
MainApplication.AnalyticsComponent.applyPeriodFilter = function (data) {
    const period = this.activePeriod;
    if (!period || period === "ytd") return data;

    const qMap = { q1: [0, 2], q2: [3, 5], q3: [6, 8], q4: [9, 11] };
    const range = qMap[period];
    if (!range) return data;

    return data.filter(item => {
        const m = new Date(item.Created).getMonth();
        return m >= range[0] && m <= range[1];
    });
};

/* ─── Main Processing ─────────────────────────────────────────────────── */
MainApplication.AnalyticsComponent.processAndRender = function (data) {
    // Apply period filter (Q1–Q4 / YTD) — this is separate from the SharePoint year query
    const periodFiltered = this.applyPeriodFilter(data);

    // Division filter for most charts
    let filtered = periodFiltered;
    if (this.activeDivision) {
        filtered = periodFiltered.filter(item =>
            (item.Division || "").trim() === this.activeDivision
        );
    }

    this.updateKPIs(filtered);
    this.renderNPSTrend(filtered);
    this.renderCSATDistribution(filtered);
    this.renderNPSSegments(filtered);
    // Division comparison chart always receives full period data so both lines are visible
    this.renderCSATByDivision(periodFiltered);
    this.renderVolumeByDivision(filtered);
    this.renderRecentFeedback(filtered);
};

/* ─── KPIs ───────────────────────────────────────────────────────────── */
// MainApplication.AnalyticsComponent.updateKPIs = function (filtered) {
//     const total = filtered.length || 1;

//     // NPS Score using promoter/detractor formula
//     const promoters  = filtered.filter(i => (parseFloat(i.NPS) || 0) >= 9).length;
//     const detractors = filtered.filter(i => (parseFloat(i.NPS) || 0) <= 6).length;
//     const npsScore   = Math.round(((promoters - detractors) / total) * 100);
//     $("#ov-nps").text((npsScore >= 0 ? "+" : "") + npsScore);

//     // CSAT Average
//     const avgCSAT = filtered.length
//         ? (filtered.reduce((sum, i) => sum + (parseFloat(i.CSAT) || 0), 0) / total).toFixed(1)
//         : "0.0";
//     $("#ov-csat").text(avgCSAT);

//     // Satisfaction Rate (CSAT 8–10)
//     const satisfied = filtered.filter(i => (parseFloat(i.CSAT) || 0) >= 8).length;
//     $("#ov-sat").text(Math.round((satisfied / total) * 100) + "%");

//     // Total Responses
//     $("#ov-resp").text(filtered.length);

//     // Period label — reflects actual active period, not hardcoded "YTD"
//     const periodLabel = (this.activePeriod && this.activePeriod !== "ytd")
//         ? `${this.activePeriod.toUpperCase()} ${this.activeYear}`
//         : `YTD ${this.activeYear}`;
//     $("#ov-lbl").text(periodLabel);
//     $("#ov-meta").text(
//         `${filtered.length} responses · Updated ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
//     );
// };

MainApplication.AnalyticsComponent.updateKPIs = function (filtered) {
    const total = filtered.length || 1;

    // NPS Score using promoter/detractor formula
    const promoters  = filtered.filter(i => (i.NPSCategory === "Promoter")).length;
    const passives   = filtered.filter(i => (i.NPSCategory === "Passive")).length;
    const detractors = filtered.filter(i => (i.NPSCategory === "Detractor")).length;
    const npsScore   = Math.round((((promoters + passives) - detractors) / total) * 100);
    $("#ov-nps").text((npsScore >= 0 ? "+" : "") + npsScore);

    // CSAT Average
    const avgCSAT = filtered.length
        ? (filtered.reduce((sum, i) => sum + (parseFloat(i.CSAT) || 0), 0) / total).toFixed(1)
        : "0.0";
    $("#ov-csat").text(avgCSAT);

    // Satisfaction Rate (CSAT 8–10)
    const satisfied = filtered.filter(i => (parseFloat(i.CSAT) || 0) >= 8).length;
    $("#ov-sat").text(Math.round((satisfied / total) * 100) + "%");

    // Total Responses
    $("#ov-resp").text(filtered.length);

    // Period label — reflects actual active period, not hardcoded "YTD"
    const periodLabel = (this.activePeriod && this.activePeriod !== "ytd")
        ? `${this.activePeriod.toUpperCase()} ${this.activeYear}`
        : `YTD ${this.activeYear}`;
    $("#ov-lbl").text(periodLabel);
    $("#ov-meta").text(
        `${filtered.length} responses · Updated ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
    );
};

/* ─── NPS Monthly Trend ───────────────────────────────────────────────── */
MainApplication.AnalyticsComponent.renderNPSTrend = function (data) {
    const allMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    // Determine the latest month present in the data — don't hardcode Jan–Jul
    let maxMonth = 0;
    data.forEach(item => {
        const d = new Date(item.Created);
        if (!isNaN(d)) maxMonth = Math.max(maxMonth, d.getMonth());
    });

    const months = allMonths.slice(0, maxMonth + 1);

    // Per-month NPS using proper promoter/detractor formula (not a raw single value)
    const monthlyNPS = months.map((_, m) => {
        const items = data.filter(i => {
            const d = new Date(i.Created);
            return !isNaN(d) && d.getMonth() === m;
        });
        if (!items.length) return null;
        const p = items.filter(i => (parseFloat(i.NPS) || 0) >= 9).length;
        const d = items.filter(i => (parseFloat(i.NPS) || 0) <= 6).length;
        return Math.round(((p - d) / items.length) * 100);
    });

    const targetLine = months.map(() => 40);

    const canvas = document.getElementById("chart-ov-nps");
    if (!canvas) return;

    if (this.charts.npsTrend) {
        this.charts.npsTrend.data.labels = months;
        this.charts.npsTrend.data.datasets[0].data = monthlyNPS;
        this.charts.npsTrend.data.datasets[1].data = targetLine;
        this.charts.npsTrend.update();
        return;
    }

    this.charts.npsTrend = new Chart(canvas, {
        type: "line",
        data: {
            labels: months,
            datasets: [
                {
                    label: "NPS Score",
                    data: monthlyNPS,
                    borderColor: "#F5A623",
                    backgroundColor: "rgba(245,166,35,0.08)",
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: "#fff",
                    pointBorderColor: "#F5A623",
                    pointBorderWidth: 2,
                    fill: true,
                    spanGaps: true
                },
                {
                    label: "Target (+40)",
                    data: targetLine,
                    borderColor: "#9ca3af",
                    borderDash: [5, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    min: -100, max: 100,
                    ticks: { stepSize: 20, font: { size: 10 }, color: "#9ca3af" },
                    grid: { color: "#f3f4f6" },
                    border: { display: false }
                },
                x: {
                    ticks: { font: { size: 10 }, color: "#9ca3af" },
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
};

/* ─── CSAT Distribution ───────────────────────────────────────────────── */
MainApplication.AnalyticsComponent.renderCSATDistribution = function (data) {
    const bins = Array(10).fill(0);
    data.forEach(i => {
        const score = Math.floor(parseFloat(i.CSAT) || 0);
        if (score >= 1 && score <= 10) bins[score - 1]++;
    });

    const canvas = document.getElementById("chart-ov-dist");
    if (!canvas) return;

    if (this.charts.csatDist) {
        this.charts.csatDist.data.datasets[0].data = bins;
        this.charts.csatDist.update();
        return;
    }

    this.charts.csatDist = new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["1","2","3","4","5","6","7","8","9","10"],
            datasets: [{
                data: bins,
                backgroundColor: [
                    "#ef4444","#f87171","#fb923c","#fbbf24","#fde047",
                    "#bef575","#86efac","#4ade80","#22c55e","#16a34a"
                ],
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 10 }, color: "#9ca3af" },
                    grid: { color: "#f3f4f6" },
                    border: { display: false }
                },
                x: {
                    ticks: { font: { size: 10 }, color: "#9ca3af" },
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
};

/* ─── NPS Segments ────────────────────────────────────────────────────── */
MainApplication.AnalyticsComponent.renderNPSSegments = function (data) {
    const total = data.length || 1;
    const promoters = data.filter(i => (parseFloat(i.NPS) || 0) >= 8).length;
    const passives = data.filter(i => { const v = parseFloat(i.NPS) || 0; return v >= 5 && v <= 7; }).length;
    const detractors = data.filter(i => (parseFloat(i.NPS) || 0) <= 4).length;

    const pPct = Math.round((promoters  / total) * 100);
    const dPct = Math.round((detractors / total) * 100);
    const nPct = 100 - pPct - dPct;

    $("#ov-fp").text(pPct + "%");
    $("#ov-fd").text(dPct + "%");
    $("#ov-fs").text((pPct - dPct >= 0 ? "+" : "") + (pPct - dPct));

    $("#ov-sp").css("width", pPct + "%").text(pPct > 10 ? `Promoters ${pPct}%`  : "");
    $("#ov-sn").css("width", nPct + "%").text(nPct > 10 ? `Passives ${nPct}%`   : "");
    $("#ov-sd").css("width", dPct + "%").text(dPct > 10 ? `Detractors ${dPct}%` : "");

    $("#ov-pn").text(promoters);
    $("#ov-nn").text(passives);
    $("#ov-dn").text(detractors);
};

/* ─── CSAT by Division Monthly ───────────────────────────────────────── */
MainApplication.AnalyticsComponent.renderCSATByDivision = function (data) {
    // data = period-filtered, NOT division-filtered — both lines must always be visible
    const allMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    let maxMonth = 0;
    data.forEach(item => {
        const d = new Date(item.Created);
        if (!isNaN(d)) maxMonth = Math.max(maxMonth, d.getMonth());
    });

    const months = allMonths.slice(0, maxMonth + 1);

    const buildLine = (divName) => months.map((_, m) => {
        const items = data.filter(i => {
            const d = new Date(i.Created);
            return !isNaN(d) && d.getMonth() === m && (i.Division || "").trim() === divName;
        });
        if (!items.length) return null;
        return parseFloat(
            (items.reduce((s, i) => s + (parseFloat(i.CSAT) || 0), 0) / items.length).toFixed(1)
        );
    });

    const amData = buildLine("Advanced Manufacturing");
    const aiData = buildLine("Asset Integrity");

    const canvas = document.getElementById("chart-ov-div");
    if (!canvas) return;

    if (this.charts.csatByDiv) {
        this.charts.csatByDiv.data.labels = months;
        this.charts.csatByDiv.data.datasets[0].data = amData;
        this.charts.csatByDiv.data.datasets[1].data = aiData;
        this.charts.csatByDiv.update();
        return;
    }

    this.charts.csatByDiv = new Chart(canvas, {
        type: "line",
        data: {
            labels: months,
            datasets: [
                {
                    label: "Adv. Manufacturing",
                    data: amData,
                    borderColor: "#F5A623",
                    backgroundColor: "rgba(245,166,35,0.06)",
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: "#fff",
                    pointBorderColor: "#F5A623",
                    pointBorderWidth: 2,
                    fill: true,
                    spanGaps: true
                },
                {
                    label: "Asset Integrity",
                    data: aiData,
                    borderColor: "#14b8a6",
                    backgroundColor: "rgba(20,184,166,0.06)",
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: "#fff",
                    pointBorderColor: "#14b8a6",
                    pointBorderWidth: 2,
                    fill: true,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    min: 0, max: 10,
                    ticks: { stepSize: 2, font: { size: 10 }, color: "#9ca3af" },
                    grid: { color: "#f3f4f6" },
                    border: { display: false }
                },
                x: {
                    ticks: { font: { size: 10 }, color: "#9ca3af" },
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
};

/* ─── Volume by Division ──────────────────────────────────────────────── */
MainApplication.AnalyticsComponent.renderVolumeByDivision = function (data) {
    const grouped = {};
    data.forEach(item => {
        const div = (item.Division || "Other").trim();
        grouped[div] = (grouped[div] || 0) + 1;
    });

    const canvas = document.getElementById("chart-ov-pie");
    if (!canvas) return;

    if (this.charts.volumePie) this.charts.volumePie.destroy();

    this.charts.volumePie = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: Object.keys(grouped),
            datasets: [{
                data: Object.values(grouped),
                backgroundColor: ["#F5A623", "#14b8a6", "#2563EB"],
                borderWidth: 2,
                borderColor: "#fff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: { size: 11 },
                        color: "#6b7280",
                        padding: 12,
                        boxWidth: 12,
                        usePointStyle: true
                    }
                }
            }
        }
    });
};

/* ─── Recent Feedback ─────────────────────────────────────────────────── */
MainApplication.AnalyticsComponent.renderRecentFeedback = function (data) {
    const container = $(".comment-list");
    container.empty();

    const recent = [...data]
        .sort((a, b) => new Date(b.Created) - new Date(a.Created))
        .slice(0, 3);

    if (!recent.length) {
        container.append(`<div style="padding:20px;text-align:center;color:var(--txt4);font-size:12px">No feedback for this period.</div>`);
        return;
    }

    recent.forEach(item => {
        const score = parseFloat(item.CSAT) || parseFloat(item.NPS) || 7;
        const bubbleClass = score >= 9 ? "sc-g" : score >= 7 ? "sc-a" : "sc-r";

        container.append(`
            <div class="comment-item">
                <div class="comment-top">
                    <div class="sc-bub ${bubbleClass}">${Math.round(score)}</div>
                    <div class="c-meta">
                        <strong>${item.CustomerName || "Customer"}</strong> · 
                        ${item.Division || ""} · ${item.CrewName || ""}
                    </div>
                    <span style="font-size:10.5px;color:var(--txt4);font-family:var(--mono);margin-left:auto">
                        ${new Date(item.Created).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                </div>
                <div class="c-text">"${item.Title || "No comment provided."}"</div>
                <div class="c-theme">${item.ServiceLine || "Service"}</div>
            </div>
        `);
    });
};

/* ─── Resize Charts ───────────────────────────────────────────────────── */
MainApplication.AnalyticsComponent.resizeAllCharts = function () {
    Object.values(this.charts).forEach(c => c?.resize());
};