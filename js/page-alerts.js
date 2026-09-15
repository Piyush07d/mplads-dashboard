(function () {
  "use strict";

  const D = window.MPLADS;

  function renderComingSoon({ activePage, icon, iconTone, description }) {
    const main = window.Layout.renderShell(activePage);
    main.innerHTML = `



    <style>
    * {
        box-sizing: border-box;
    }

    /* =========================
       MAIN HEADER
    ========================= */

    .alert-page-header {
        border: 1px solid black;
        border-radius: calc(var(--radius) + 4px);
        margin: 32px 24px 20px;
        min-height: 165px;
        width: calc(100% - 48px);
        padding: 30px 40px;
        box-shadow: 0px 10px 20px -16px oklch(0.1 0.04 259 / 90%);
    }

    .heading1 {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
    }

    .tenure {
        width: fit-content;
        margin-bottom: 10px;
    }

    .heading1 h1 {
        margin: 0;
        line-height: 1.2;
    }

    .header-desc {
        margin-top: 8px;
        line-height: 1.5;
    }


    /* =========================
       RISK SUMMARY CARDS
    ========================= */

    .alert-boxes-sec {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin: 0 24px;
    }

    .alert-box3 {
        text-align: left;
        border: 1px solid black;
        border-radius: calc(var(--radius) + 4px);
        padding: 20px;
        width: 100%;
        min-width: 0;
        box-shadow: 0px 10px 20px -16px oklch(0.1 0.04 259 / 90%);
    }

    .alert-box3 p {
        margin: 0;
    }

    .alert-box3 .metric-figure {
        margin-top: 5px;
    }

    .grn {
        color: #37c517;
    }


    /* =========================
       ALERT TABLE / CONTAINER
    ========================= */

    .alert-table {
        display: flex;
        flex-direction: column;
        gap: 15px;

        margin: 20px 24px 25px;
        padding: 10px;

        width: calc(100% - 48px);

        border: 1px solid black;
        border-radius: calc(var(--radius) + 4px);

        box-shadow: 0px 10px 20px -16px oklch(0.1 0.04 259 / 90%);
    }


    /* =========================
       INDIVIDUAL ALERT
    ========================= */

    .alerts-infos {
        display: flex;
        justify-content: space-between;
        align-items: center;

        gap: 20px;

        border: 1px solid black;
        border-radius: calc(var(--radius) + 4px);

        padding: 10px 20px;

        min-width: 0;
    }


    .info-divs-left {
        min-width: 0;
        flex: 1;
    }

    .info-divs-left h4 {
        font-weight: 800;
        margin: 0 0 5px;
        overflow-wrap: break-word;
    }

    .info-divs-left p {
        font-size: 15px;
        margin: 0;
        line-height: 1.5;
        overflow-wrap: break-word;
    }


    /* =========================
       RISK SCORE
    ========================= */

    .info-divs-right {
        flex-shrink: 0;
        text-align: center;
        min-width: 80px;
    }

    .info-divs-right h4 {
        margin: 0;
    }

    .info-divs-right p {
        margin: 3px 0 0;
    }


    /* =========================
       RISK COLORS
    ========================= */

    .high {
        border: 0.5px solid black;
        border-left: 5px solid red;
    }

    .medium {
        border: 0.5px solid black;
        border-left: 5px solid oklch(0.82 0.15 78);
    }

    .low {
        border: 0.5px solid black;
        border-left: 5px solid #37c517;
    }


    /* =================================================
       TABLET
       768px - 1024px
    ================================================= */

    @media (max-width: 1024px) {

        .alert-page-header {
            margin: 25px 20px 20px;
            width: calc(100% - 40px);
            padding: 25px 30px;
        }

        .alert-boxes-sec {
            margin: 0 20px;
            gap: 12px;
        }

        .alert-table {
            margin-left: 20px;
            margin-right: 20px;
            width: calc(100% - 40px);
        }

        .alert-box3 {
            padding: 18px;
        }
    }


    /* =================================================
       MOBILE
       <= 767px
    ================================================= */

    @media (max-width: 767px) {

        /* Header */

        .alert-page-header {
            margin: 20px 15px 15px;
            width: calc(100% - 30px);
            min-height: auto;
            padding: 20px;
        }

        .heading1 {
            align-items: flex-start;
        }

        .heading1 h1 {
            font-size: clamp(24px, 7vw, 32px);
        }

        .header-desc {
            font-size: 14px;
            line-height: 1.5;
        }


        /* Risk Cards */

        .alert-boxes-sec {
            grid-template-columns: 1fr;
            margin: 0 15px;
            gap: 12px;
        }

        .alert-box3 {
            padding: 16px;
        }


        /* Alert Container */

        .alert-table {
            margin: 15px 15px 20px;
            width: calc(100% - 30px);
            padding: 8px;
            gap: 10px;
        }


        /* Individual Alert */

        .alerts-infos {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;

            padding: 15px;
        }

        .info-divs-left h4 {
            font-size: 15px;
            line-height: 1.4;
        }

        .info-divs-left p {
            font-size: 14px;
            line-height: 1.5;
        }


        /* Risk score moves below content */

        .info-divs-right {
            display: flex;
            align-items: center;
            justify-content: space-between;

            width: 100%;
            min-width: 0;

            padding-top: 8px;
            border-top: 1px solid #ddd;

            text-align: left;
        }

        .info-divs-right h4 {
            font-size: 22px;
        }

        .info-divs-right p {
            margin: 0;
            font-size: 13px;
        }
    }


    /* =================================================
       VERY SMALL PHONES
       <= 400px
    ================================================= */

    @media (max-width: 400px) {

        .alert-page-header {
            padding: 16px;
        }

        .heading1 h1 {
            font-size: 24px;
        }

        .header-desc {
            font-size: 13px;
        }

        .alert-boxes-sec {
            margin: 0 12px;
        }

        .alert-table {
            margin-left: 12px;
            margin-right: 12px;
            width: calc(100% - 24px);
        }

        .alerts-infos {
            padding: 12px;
        }

        .info-divs-left h4 {
            font-size: 14px;
        }

        .info-divs-left p {
            font-size: 13px;
        }
    }
</style>


<main>

    <!-- HEADER -->
    <div class="alert-page-header">

        <div class="heading1">

            <span class="badge badge-signal tenure">
                Tenure 2024–2029
            </span>

            <h1>
                Fraud & Anomaly Alerts
            </h1>

            <p class="header-desc">
                Projects with unusual patterns are surfaced here for auditor investigation.
                (Human Review Required)
            </p>

        </div>

    </div>


    <!-- RISK SUMMARY -->
    <div class="alert-boxes-sec">

        <div class="alert-box3">
            <p class="label-caps">High Risk</p>
            <p class="metric-figure stat-card-value tone-risk-value">3</p>
        </div>

        <div class="alert-box3">
            <p class="label-caps">Medium Risk</p>
            <p class="metric-figure stat-card-value tone-caution-value">3</p>
        </div>

        <div class="alert-box3">
            <p class="label-caps">Low Risk</p>
            <p class="metric-figure stat-card-value grn">2</p>
        </div>

    </div>


    <!-- ALERT LIST -->
    <div class="alert-table">


        <!-- HIGH RISK -->
        <div class="alerts-infos high">

            <div class="info-divs-left">

                <h4>
                    #1002 · High payment before completion
                </h4>

                <p>
                    88% of sanctioned value has been paid while the project is still in progress.
                </p>

            </div>

            <div class="info-divs-right">

                <h4>91</h4>

                <p class="alert-info-risk-score">
                    Risk Score
                </p>

            </div>

        </div>


        <div class="alerts-infos high">

            <div class="info-divs-left">

                <h4>
                    #1011 · Very fast payment pattern
                </h4>

                <p>
                    95% of the sanctioned amount was paid within an unusually short execution window.
                </p>

            </div>

            <div class="info-divs-right">

                <h4>89</h4>

                <p class="alert-info-risk-score">
                    Risk Score
                </p>

            </div>

        </div>


        <!-- MEDIUM RISK -->
        <div class="alerts-infos medium">

            <div class="info-divs-left">

                <h4>
                    #1012 · Low utilisation for active project
                </h4>

                <p>
                    Only 36% of sanctioned value has been paid despite the project being active.
                </p>

            </div>

            <div class="info-divs-right">

                <h4>64</h4>

                <p class="alert-info-risk-score">
                    Risk Score
                </p>

            </div>

        </div>


        <div class="alerts-infos medium">

            <div class="info-divs-left">

                <h4>
                    #1016 · Unusual cost concentration
                </h4>

                <p>
                    Contractor pricing is materially above the peer average for similar road works.
                </p>

            </div>

            <div class="info-divs-right">

                <h4>61</h4>

                <p class="alert-info-risk-score">
                    Risk Score
                </p>

            </div>

        </div>


        <!-- LOW RISK -->
        <div class="alerts-infos low">

            <div class="info-divs-left">

                <h4>
                    #1004 · Minor timing anomaly
                </h4>

                <p>
                    Payment timing differs from the median pattern for similar projects.
                </p>

            </div>

            <div class="info-divs-right">

                <h4>38</h4>

                <p class="alert-info-risk-score">
                    Risk Score
                </p>

            </div>

        </div>


        <div class="alerts-infos low">

            <div class="info-divs-left">

                <h4>
                    #1015 · Delayed completion window
                </h4>

                <p>
                    Project has an extended expected completion period.
                </p>

            </div>

            <div class="info-divs-right">

                <h4>34</h4>

                <p class="alert-info-risk-score">
                    Risk Score
                </p>

            </div>

        </div>

    </div>

</main>

     





    `;
  }

  window.PageComingSoon = { renderComingSoon };
})();
