const cacheBuster = "?v=" + new Date().getTime();
const pfadMitRepo = "/krautkopf.at/portfolio-system/py-data/portfolio_history.json" + cacheBuster;
const pfadOhneRepo = "/portfolio-system/py-data/portfolio_history.json" + cacheBuster;

// Dein fixes Startkapital für die G&V-Berechnung
const STARTKAPITAL = 5000.0;

function verarbeiteDaten(data) {
  if (!data || data.length === 0) {
    document.getElementById("output").innerText = "Keine historischen Daten vorhanden.";
    return;
  }

  // --- GEWINN- UND VERLUST-BERECHNUNG ---
  const aktuellerStand = data[data.length - 1];
  const aktuellerGesamtwert = aktuellerStand.Total;
  const guvEuro = aktuellerGesamtwert - STARTKAPITAL;
  const guvProzent = (guvEuro / STARTKAPITAL) * 100;

  const vorzeichen = guvEuro >= 0 ? "+" : "";
  
  document.getElementById("output").innerHTML = `
    <strong>Musterdepot-Status:</strong> <br>
    Aktueller Gesamtwert: ${aktuellerGesamtwert.toLocaleString('de-DE')} € <br>
    Gesamtrendite (G&V): <span style="color: ${guvEuro >= 0 ? 'green' : 'red'}; font-weight: bold;">
      ${vorzeichen}${guvEuro.toLocaleString('de-DE')} € (${vorzeichen}${guvProzent.toFixed(2)}%)
    </span>
  `;

  // --- CHART-LOGIK ---
  const labels = data.map(entry => entry.date);
  const allKeys = Object.keys(data[0]);
  
  // Filtere 'date', 'Total' und 'Cash' (Egal ob Groß- oder Kleinschreibung)
  const assetNames = allKeys.filter(key => {
    const k = key.toLowerCase();
    return k !== 'date' && k !== 'total' && k !== 'cash';
  });

  const colors = ['#36a2eb', '#ff6384', '#ffcd56', '#4bc0c0'];
  const datasets = assetNames.map((name, index) => {
    return {
      label: name,
      data: data.map(entry => entry[name] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      borderWidth: 2,
      fill: false,
      tension: 0.15
    };
  });

  // Extra dicke Linie für den Gesamtwert hinzufügen
  /*datasets.push({
    label: 'GESAMTWERT (Total)',
    data: data.map(entry => entry.Total),
    borderColor: '#2ecc71',
    backgroundColor: '#2ecc71',
    borderWidth: 4,
    fill: false,
    tension: 0.1
  });*/

  // SPERRE GEGEN GEISTER-LINIEN: Falls bereits ein Chart existiert, zerstören wir ihn!
  if (window.myPortfolioChart instanceof Chart) {
    window.myPortfolioChart.destroy();
  }

  // Chart neu erstellen und in der globalen Variable speichern
  window.myPortfolioChart = new Chart(document.getElementById("historyChart"), {
    type: "line",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { 
        y: { 
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: false, 
          ticks: {
            callback: function(value) {
              return value.toLocaleString('de-DE') + ' €';
            }
          },
          title: { display: true, text: 'Wert in Euro (€)', font: { weight: 'bold' } } 
        },
        x: { title: { display: true, text: 'Datum', font: { weight: 'bold' } } }
      }
    }
  });
}

// Oder-Logik für den Abruf
console.log("Versuche Pfad 1 (mit Repo)...");
fetch(pfadMitRepo)
  .then(res => {
    if (!res.ok) throw new Error("Pfad 1 fehlgeschlagen");
    return res.json();
  })
  .then(data => {
    console.log("Erfolg mit Pfad 1!");
    verarbeiteDaten(data);
  })
  .catch(err => {
    console.warn("Pfad 1 ging nicht. Starte Fallback (Pfad 2)...");
    fetch(pfadOhneRepo)
      .then(res => {
        if (!res.ok) throw new Error("Beide Pfade fehlgeschlagen.");
        return res.json();
      })
      .then(data => {
        console.log("Erfolg mit Pfad 2!");
        verarbeiteDaten(data);
      })
      .catch(finalErr => {
        console.error(finalErr);
        document.getElementById("output").innerText = "Fehler beim Laden der Daten.";
      });
  });