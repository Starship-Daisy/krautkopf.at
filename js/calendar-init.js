document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('calendar-grid');
    const monthTitle = document.getElementById('current-month');
    if (!grid || !monthTitle) return;

    // 1. Deine Termine (Hier kannst du beliebig erweitern!)
    const events = {
        "2026-05-02": [{ title: "Werkstatt-Termin", desc: "Krautkopf-Atelier um 14:00 Uhr" }],
        "2026-05-08": [{ title: "Team Fokus Meeting", desc: "Strategie-Besprechung für das neue Web-Layout." }],
        "2026-05-15": [{ title: "Werkstatt-Termin", desc: "Ganztägiges Arbeiten in der Haupt-Werkstatt." }],
        "2026-05-22": [{ title: "Team Fokus Meeting", desc: "Review der wöchentlichen Ziele." }]
    };

    // Wochentage-Header generieren
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    weekdays.forEach(day => {
        const label = document.createElement('div');
        label.className = 'weekday-label';
        label.innerText = day;
        grid.appendChild(label);
    });

    // Festes Datum: Mai 2026 (Startet am Freitag = 4 leere Boxen)
    const startingSpaces = 4; 
    const daysInMonth = 31;
    const todayDay = 27; // Für die .is-today Markierung im Mai 2026

    // Leere Boxen auffüllen
    for (let i = 0; i < startingSpaces; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
    }

    // Tage zeichnen
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (day === todayDay) cell.classList.add('is-today');
        
        const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
        
        const numSpan = document.createElement('span');
        numSpan.className = 'day-number';
        numSpan.innerText = day;
        cell.appendChild(numSpan);

        if (events[dateStr]) {
            events[dateStr].forEach(evt => {
                const evtDiv = document.createElement('div');
                evtDiv.className = 'event-item';
                evtDiv.innerText = evt.title;
                
                // Klick-Event für dein kariertes Modal
                evtDiv.addEventListener('click', function(e) {
                    e.stopPropagation();
                    document.getElementById('modalTitle').innerText = evt.title;
                    document.getElementById('modalBody').innerHTML = `<p>${evt.desc}</p>`;
                    document.getElementById('calendarModal').style.display = 'block';
                });
                
                cell.appendChild(evtDiv);
            });
        }
        grid.appendChild(cell);
    }

    // Modal schlagen
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('calendarModal').style.display = 'none';
    });
    window.addEventListener('click', function(e) {
        if (e.target == document.getElementById('calendarModal')) {
            document.getElementById('calendarModal').style.display = 'none';
        }
    });
});