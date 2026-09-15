(function () {
  "use strict";

  const D = window.MPLADS;

  function renderComingSoon({ activePage, icon, iconTone, description }) {
    const main = window.Layout.renderShell(activePage);
    main.innerHTML = `



    <style>

      .alert-page-header{
      border: 1px solid black;
      border-radius: calc(var(--radius) + 4px);
      margin: 32px 24px 20px 24px;
      height: 165px;
      width: 96%;
      padding: 30px 40px ;
      box-shadow: 0px 10px 20px -16px oklch(0.1 0.04 259 / 90%);
      }

    .tenure{
    width: fit-content;
    margin-bottom: 10px;
    }

     .heading1{
      display: flex;
     flex-direction: column;
     justify-content: space-around;
     width: 100%;
     }

     .alert-boxes-sec{

     display: flex;
     justify-content: center;
     gap: 15px;
     margin:0px 25px;

     }

     .alert-box3{
     text-align: left;
     align-items: left;
     justify-content: left;


     border: 1px solid black;
     border-radius: calc(var(--radius) + 4px);
     padding: 20px;
     width: 100%;
     box-shadow: 0px 10px 20px -16px oklch(0.1 0.04 259 / 90%);

     }

     .grn{
     color: #d3d603;}
     
    .alert-table{
    display: flex;
    flex-direction: column;
    gap : 15px;
    margin: 20px 24px 25px 24px;
      padding: 10px;
      width: 96%;
      border: 1px solid black;
      border-radius: calc(var(--radius) + 4px);
      box-shadow: 0px 10px 20px -16px oklch(0.1 0.04 259 / 90%);
     }


     .alerts-infos{
      display: flex;
      justify-content: space-between;
      border: 1px solid black;
      border-radius: calc(var(--radius) + 4px);
      padding:10px 20px;
     }

      .high{
      border: 0.5px solid black;
       border-left: 5px solid red;
      }
 
      .medium{
       border: 0.5px solid black;
       border-left: 5px solid oklch(0.82 0.15 78);
      }

      .low{
      border: 0.5px solid black;
      border-left: 5px solid #e1e31d}
      }  



    </style>



      <main>
        <div class="alert-page-header">
            <div class="heading1">
               <span class="badge badge-signal tenure">Tenure 2024–2029</span>
                 <h1>
                     Fraud & Anomaly Alerts
                 </h1>
                     <p class="header-desc">
                        Projects with unusual patterns are surfaced here for auditor investigation. (Human Review Required)
                     </p>
             </div>
        </div>

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

        <div class="alert-table">

            <div class="alerts-infos high">

              <div class="info-divs-left">
                   <h4>
                     #1002 · High payment before completion
                   </h4>
                   <p>88% of sanctioned value has been paid while the project is still in progress.</p>
              </div>
              <div class="info-divs-right">
                   <h4>
                     91
                   </h4>
                   <p class="alert-info-risk-score">Risk Score</p>
              </div
            </div>


        </div>

      </main>




    `;
  }

  window.PageComingSoon = { renderComingSoon };
})();
