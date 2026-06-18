// 1. Cache-Buster und Pfade definieren
const cacheBuster = "?v=" + new Date().getTime();
const pfadMitRepo = "/krautkopf.at/portfolio-system/py-data/portfolio_history.json" + cacheBuster;
const pfadOhneRepo = "/portfolio-system/py-data/portfolio_history.json" + cacheBuster;

// 2. Funktion zur Datenverarbeitung und Chart-Generierung
function verarbeiteDaten(data) {
  if (!data || data.length === 0) {
    document.getElementById("output").innerText = "Keine historischen Daten vorhanden.";
    return;
  }

  document.getElementById("output").innerText = "Musterdepot-Daten erfolgreich geladen.";

  const labels = data.map(entry => entry.date);
  const allKeys = Object.keys(data[0]);
  const assetNames = allKeys.filter(key => key !== 'date' && key !== 'Total');

  const colors = ['#36a2eb', '#ff6384', '#ffcd56', '#4bc0c0', '#9966ff'];

  const datasets = assetNames.map((name, index) => {
    return {
      label: name,
      data: data.map(entry => entry[name] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      borderWidth: 3,
      fill: false,
      tension: 0.15
    };
  });

  new Chart(document.getElementById("historyChart"), {
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
          title: { 
            display: true, 
            text: 'Wert in Euro (€)', 
            font: { weight: 'bold' } 
          } 
        },
        x: { 
          title: { 
            display: true, 
            text: 'Datum', 
            font: { weight: 'bold' } 
          } 
        }
      }
    }
  });
}

// 3. Die Oder-Logik für den fehlerfreien Abruf
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
        if (!res.ok) throw new Error("Beide Pfade haben eine 404 geworfen.");
        return res.json();
      })
      .then(data => {
        console.log("Erfolg mit Pfad 2!");
        verarbeiteDaten(data);
      })
      .catch(finalErr => {
        console.error(finalErr);
        document.getElementById("output").innerText = "Fehler: Daten im gesamten System nicht auffindbar.";
      });
  });