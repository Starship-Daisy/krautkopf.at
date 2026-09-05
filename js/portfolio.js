const cacheBuster = "?v=" + new Date().getTime();

// --- PFADE FÜR BEIDE JSONs ---
const pfade = {
  etf: [
    "/krautkopf.at/portfolio-system/py-data/portfolio_history.json" + cacheBuster,
    "/portfolio-system/py-data/portfolio_history.json" + cacheBuster
  ],
  depot: [
    "/krautkopf.at/portfolio-system/py-data/history.json" + cacheBuster,
    "/portfolio-system/py-data/history.json" + cacheBuster
  ]
};

const STARTKAPITAL_ETF   = 5000.0;
const STARTKAPITAL_DEPOT = 5000.0; // <-- anpassen falls nötig

// Farben für die Linien
const FARBEN_ETF   = ['#36a2eb', '#ff6384', '#ffcd56', '#4bc0c0', '#f4a460', '#c0c0c0'];
const FARBEN_DEPOT = ['#9b59b6', '#e67e22', '#f4a460', '#c0c0c0', '#2ecc71'];
// Farb-Bedeutung Depot: A=lila, B=orange, C/D=Rohstofffarben (gold/silber), E=grün

// --- HILFSFUNKTION: JSON mit Fallback laden ---
function ladeJSON(pfadListe, index = 0) {
  return fetch(pfadListe[index])
    .then(res => {
      if (!res.ok) throw new Error("Pfad fehlgeschlagen: " + pfadListe[index]);
      return res.json();
    })
    .catch(err => {
      if (index + 1 < pfadListe.length) {
        console.warn(err.message + " → versuche Fallback...");
        return ladeJSON(pfadListe, index + 1);
      }
      throw err;
    });
}

// --- CHART-BUILDER ---
function erstelleChart(canvasId, data, farben, titelText) {
  const labels = data.map(e => e.date);
  const allKeys = Object.keys(data[0]);

  const assetNames = allKeys.filter(key => {
    const k = key.toLowerCase();
    return k !== 'date' && k !== 'total' && k !== 'cash';
  });

  const datasets = assetNames.map((name, i) => ({
    label: name,
    data: data.map(e => e[name] || 0),
    borderColor: farben[i % farben.length],
    backgroundColor: farben[i % farben.length],
    borderWidth: 2,
    fill: false,
    tension: 0.15
  }));

  const canvasEl = document.getElementById(canvasId);
  if (!canvasEl) return;

  // Alten Chart zerstören falls vorhanden
  const chartKey = "__chart_" + canvasId;
  if (window[chartKey] instanceof Chart) {
    window[chartKey].destroy();
  }

  window[chartKey] = new Chart(canvasEl, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: titelText, font: { size: 16, weight: 'bold' } }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { callback: v => v.toLocaleString('de-DE') + ' €' },
          title: { display: true, text: 'Wert in Euro (€)', font: { weight: 'bold' } }
        },
        x: { title: { display: true, text: 'Datum', font: { weight: 'bold' } } }
      }
    }
  });
}

// --- G&V ANZEIGE ---
function zeigeGuV(elementId, data, startkapital) {
  const letzter = data[data.length - 1];
  const gesamtwert = letzter.Total || Object.entries(letzter)
    .filter(([k]) => k !== 'date')
    .reduce((s, [, v]) => s + (typeof v === 'number' ? v : 0), 0);

  const guv = gesamtwert - startkapital;
  const guvProzent = (guv / startkapital) * 100;
  const vz = guv >= 0 ? "+" : "";
  const farbe = guv >= 0 ? "green" : "red";

  const el = document.getElementById(elementId);
  if (el) el.innerHTML = `
    Aktueller Gesamtwert: <strong>${gesamtwert.toLocaleString('de-DE')} €</strong> &nbsp;|&nbsp;
    G&V: <span style="color:${farbe}; font-weight:bold;">
      ${vz}${guv.toLocaleString('de-DE', {maximumFractionDigits:2})} € 
      (${vz}${guvProzent.toFixed(2)}%)
    </span>
  `;
}

// --- LADEN & RENDERN ---
// Chart 1: ETF-Musterdepot
ladeJSON(pfade.etf)
  .then(data => {
    zeigeGuV("output-etf", data, STARTKAPITAL_ETF);
    erstelleChart("historyChart", data, FARBEN_ETF, "ETF-Musterdepot");
  })
  .catch(err => {
    console.error("ETF-Daten konnten nicht geladen werden:", err);
    const el = document.getElementById("output-etf");
    if (el) el.innerText = "Fehler beim Laden der ETF-Daten.";
  });

// Chart 2: Depot A/B/C/D
ladeJSON(pfade.depot)
  .then(data => {
    zeigeGuV("output-depot", data, STARTKAPITAL_DEPOT);
    erstelleChart("depotChart", data, FARBEN_DEPOT, "Depot-Übersicht (A / B / C / D)");
  })
  .catch(err => {
    console.error("Depot-Daten konnten nicht geladen werden:", err);
    const el = document.getElementById("output-depot");
    if (el) el.innerText = "Fehler beim Laden der Depot-Daten.";
  });
