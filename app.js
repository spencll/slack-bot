import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import http from "http";
import ngrok from "@ngrok/ngrok";
import { exec } from "child_process";
import findPatient from "./automation.js";
import NodeCache from "node-cache";
import * as browserManager from "./browserManager.js";
const app = express();

const killNgrokSessions = () => {
  exec("ngrok kill", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error killing ngrok sessions: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));

// Open browser on start -> use route t 

export function getPage() {
  if (!page) throw new Error("Browser not initialized yet");
  return page;
}

(async () => {

  await browserManager.init();



app.get("/", (req, res) => {
  const {patientId = "", trialNumber = "", status = "", message = ""} = req.query;
  const color = status === "error" ? "red" : "green";
  res.send(`
   <html>
    <head>
        <title>Contact Lens Finalizer</title>
        <style>
            /* Making set colors for the gradient theme */
            :root {
                --background: #0b1220;
                --card: rgba(255,255,255,0.06);
                --card-border: rgba(255,255,255,0.12);
                --text: rgba(255,255,255,0.92);
                --muted: rgba(255,255,255,0.68);
                --field: rgba(255,255,255,0.07);
                --field-border: rgba(255,255,255,0.14);
                --accent: #7c3aed;
                --accent-2: #22c55e;
                --danger: #ef4444;
                --shadow: 0 18px 50px rgba(0,0,0,0.35);
                --radius: 16px;
            }

            * {
                box-sizing: border-box;
            }
            h2 {
                text-align: center;
            }
            body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                padding: 28px 16px;
                color: var(--text);
                font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
                Helvetica, Arial, "Apple Car Emoji", "Segoe UI Emoji";
                /* The actual gradient look for the background */
                background: 
                    radial-gradient(900px 500px at 20% 20%, rgba(124,58,237,0.25), transparent 55%),
                    radial-gradient(900px 500px at 80% 10%, rgba(34,197,94,0.18), transparent 55%),
                    radial-gradient(900px 500px at 50% 90%, rgba(59,130,246,0.18), transparent 55%),
                    var(--background);
            }

            .wrap {
                width: 100%;
                max-width: 560px;
            }

            .card {
                background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
                border: 1px solid var(--card-border);
                border-radius: var(--radius);
                box-shadow: var(--shadow);
                padding: 22px;
                backdrop-filter: blur(10px)
            }

            h2 {
                margin: 0 0 6px;
                font-size: 1.25rem;
                letter-spacing: 0.2px;
            }

            .sub {
                margin: 0 0 18px;
                color: var(--muted);
                font-size: 0.95rem;
                line-height: 1.35;
            }

            form {
                display: grid;
                gap: 14px;
                margin: 0;
            }

            .field {
                display: grid;
                gap: 8px;
            }

            label {
                font-size: 0.92rem;
                color: var(--muted);
            }

            /* Style for the text boxes */

            input[type="text"], select {
                width: 100%;
                padding: 12px 12px;
                border-radius: 12px;
                border: 1px solid var(--field-border);
                background: var(--field);
                color: var(--text);
                outline: none;
                transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
            }

            input[type="text"]::placeholder {
                color: rgba(255,255,255,0.45);
            }

            input[type="text"]:focus, select:focus {
                border-color: rgba(124,58,237,0.7);
                box-shadow: 0 0 0 4px rgba(124,58,237,0.18);
            }

            /* Making the drop down look nicer */
            select {
                appearance: none;
                background-image:
                    linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.65) 50%),
                    linear-gradient(135deg, rgba(255,255,255,0.65) 50%, transparent 50%);
                background-position: 
                    calc(100% - 18px) calc(50% - 2px),
                    calc(100% - 12px) calc(50% - 2px);
                background-size: 6px 6px, 6px 6px;
                background-repeat: no-repeat;
                padding-right: 40px;
            }

            select option {
              background-color: #1e1e1e;   /* dark dropdown items */
              color: #ffffff;
          }


            .actions {
                display: flex;
                gap: 12px;
                align-items: center;
                margin-top: 4px;
            }

            /* Button styles for the effects */

            button[type="submit"] {
                width: 100%;
                border: 0;
                cursor: pointer;
                border-radius: 12px;
                padding: 12px 14px;
                font-weight: 650;
                letter-spacing: 0.2px;
                color: white;
                background: linear-gradient(135deg, var(--accent), #4f46e5);
                box-shadow: 0 10px 24px rgba(124,58,237,0.25);
                transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
            }

            button[type="submit"]:hover {
                transform: translateY(-1px);
                box-shadow: 0 14px 30px rgba(124,58,237,0.32);
                filter: brightness(1.04);
            }

            button[type="submit"]:active {
                transform: translateY(0px);
                box-shadow: 0 10px 22px rgba(124,58,237,0.22);
            }

            /* For the message */
            .message {
                margin-top: 16px;
                padding: 12px 12px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.14);
                background: rgba(255,255,255,0.06);
                color: var(--text);
                line-height: 1.35;
            }

            /* If techs make the screen smaller for a two window set up */
            @media (max-width: 420px) {
                .card {
                    padding: 18px;
                }
            }

        </style>
        <script src="https://cdn.jsdelivr.net/npm/tsparticles-confetti@2.9.3/tsparticles.confetti.bundle.min.js"></script>
    </head>
    <body>
        <audio id="success-audio" src="/0417.wav"></audio>
        <div class="wrap">
            <div class="card">
                <h2>Contact Lens Finalizer</h2>
                <form action="/submit" method="POST">
                    <div class="field">
                        <label>Patient ID:</label>
                        <input type="text" name="patientId" value="${patientId}" required />
                    </div>
                    <div class="field">
                        <label>Trial:</label>
                        <select name="trialNumber" required>
                            <option value="1" ${trialNumber === "1" ? "selected" : ""}>Latest</option>
                            <option value="2" ${trialNumber === "2" ? "selected" : ""}>2nd</option>
                            <option value="3" ${trialNumber === "3" ? "selected" : ""}>3rd</option>
                            <option value="4" ${trialNumber === "4" ? "selected" : ""}>4th</option>
                            <option value="5" ${trialNumber === "5" ? "selected" : ""}>5th</option>
                            <option value="6" ${trialNumber === "6" ? "selected" : ""}>6th</option>
                        </select>
                    </div>
                    <div class="actions">
                        <button type="submit">Submit</button>
                    </div>
                </form>
                ${message ? `<div class="message">${message}</div>
                 <audio autoplay src="/0417.wav"></audio>
                ` : ""}
            </div>
        </div>
              <script>
              if ("${status}" === "success") {
           document.getElementById("success-audio").play();
          confetti({
            particleCount: 200,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
</script>
      </body>
    </html>
  `);
});

app.post("/submit", async (req, res) => {
  let {patientId, trialNumber} = req.body;
  patientId = patientId.trim().replace(/#/g, "");
  //check cache
  // const key = JSON.stringify({ patientId, trialNumber });
  // let message = "Already finalized"
  // if (cache.get(key)) return res.redirect(`/?patientId=${patientId}&message=${encodeURIComponent(message)}`);
  // cache.set(key, true);
  
  res.send(`
    <html>
  <body style="margin:0; background-color: rgba(0, 0, 0, 1); color: #ffffff;">
 <div style="
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
">

 <img src="/p5.gif" width="160" height="160" style="display:block;" />

  <p style="
    font-size: 16px;
    margin: 6px 0 0;
    opacity: 0.85;
    letter-spacing: 0.5px;
    text-align: center;
    white-space: nowrap;
  ">
    Finalizing contact lens prescription...
  </p>

</div>
  <script>
    window.location = "/submit/run?patientId=${encodeURIComponent(patientId)}&trialNumber=${encodeURIComponent(
    trialNumber
  )}";
  </script>
</body>
    </html>
  `);
});

  app.get("/submit/run", async (req, res) => {
    const {patientId, trialNumber} = req.query;
    const response = await findPatient(patientId, trialNumber);
    const status = typeof response === "number" ? "success" : "error";
    const message = status === "success" ? `✅, finalized in ${response} seconds.` : response;
    res.redirect(
      `/?patientId=${patientId}&trialNumber=${trialNumber}&status=${status}&message=${encodeURIComponent(message)}`
    );
  });

const PORT = process.env.PORT || 8081;
http.createServer(app).listen(PORT, () => {
  console.log(`Node.js web server running on port ${PORT}...`);
});

// Get your endpoint online
if (process.env.USE_NGROK === "true") {
  ngrok
    .connect({
      addr: PORT,
      authtoken: process.env.NGROK_AUTHTOKEN,
      domain: process.env.NGROK_DOMAIN,
    })
    .then((listener) => {
      console.log(`Ingress established at: ${listener.url()}`);
    });
}
})();



