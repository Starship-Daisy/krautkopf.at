document.addEventListener('DOMContentLoaded', function() {
    const wrapper = document.getElementById('calendar-wrapper');
    const grid = document.getElementById('calendar-grid');
    if (!grid || !wrapper) return;

    const icalUrl = wrapper.getAttribute('data-ical-url');

    // 1. INTELLIGENTER ICAL-PARSER (Übersetzt Google-Chinesisch in saubere Termine)
    function parseICS(data) {
        const events = {};
        const lines = data.split(/\r?\n/);
        let currentEvent = null;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Zeilen-Umbüche von Google reparieren
            while (i + 1 < lines.length && (lines[i+1].startsWith(' ') || lines[i+1].startsWith('\t'))) {
                line += lines[i+1].substring(1);
                i++;
            }

            if (line.startsWith('BEGIN:VEVENT')) {
                currentEvent = {};
            } else if (line.startsWith('END:VEVENT')) {
                if (currentEvent && currentEvent.start) {
                    if (!events[currentEvent.start]) events[currentEvent.start] = [];
                    events[currentEvent.start].push({
                        title: currentEvent.summary || 'Werkstatt-Termin',
                        desc: currentEvent.description || 'Keine weiteren Details vorhanden.'
                    });
                }
                currentEvent = null;
            } else if (currentEvent) {
                if (line.startsWith('DTSTART')) {
                    const parts = line.split(':');
                    const val = parts[1];
                    if (val) {
                        // Formatiert YYYYMMDDTHHMMSSZ oder YYYYMMDD zu YYYY-MM-DD
                        const y = val.substring(0, 4);
                        const m = val.substring(4, 6);
                        const d = val.substring(6, 8);
                        currentEvent.start = `${y}-${m}-${d}`;
                    }
                } else if (line.startsWith('SUMMARY:')) {
                    currentEvent.summary = line.substring(8).replace(/\\,/g, ',');
                } else if (line.startsWith('DESCRIPTION:')) {
                    currentEvent.description = line.substring(12).replace(/\\n/g, '<br>').replace(/\\,/g, ',');
                }
            }
        }
        return events;
    }

    // 2. DAS GRID ZEICHNEN
    function renderCalendar(parsedEvents) {
        grid.innerHTML = ''; // Reset

        // Wochentage-Header erzeugen
        const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        weekdays.forEach(day => {
            const label = document.createElement('div');
            label.className = 'weekday-label';
            label.innerText = day;
            grid.appendChild(label);
        });

        // Festes Setup für Mai 2026 (Startet am Freitag = 4 leere Boxen)
        const startingSpaces = 4; 
        const daysInMonth = 31;
        const todayDay = 27; // 27. Mai 2026 Markierung

        // Leere Boxen auffüllen
        for (let i = 0; i < startingSpaces; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }

        // Tage generieren
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            if (day === todayDay) cell.classList.add('is-today');
            
            const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
            
            const numSpan = document.createElement('span');
            numSpan.className = 'day-number';
            numSpan.innerText = day;
            cell.appendChild(numSpan);

            // Google-Termine für diesen Tag injizieren
            if (parsedEvents[dateStr]) {
                parsedEvents[dateStr].forEach(evt => {
                    const evtDiv = document.createElement('div');
                    evtDiv.className = 'event-item';
                    evtDiv.innerText = evt.title;
                    
                    // Klick aufs Notizblock-Modal
                    evtDiv.addEventListener('click', function(e) {
                        e.stopPropagation();
                        document.getElementById('modalTitle').innerText = evt.title;
                        document.getElementById('modalBody').innerHTML = evt.desc;
                        document.getElementById('calendarModal').style.display = 'block';
                    });
                    
                    cell.appendChild(evtDiv);
                });
            }
            grid.appendChild(cell);
        }
    }

    // 3. LIVE-DATEN VON GOOGLE LADEN
    if (icalUrl && iCalUrl !== 'HIER_DEINE_GOOGLE_MUTTER_PROVATE_ICAL_URL_EINTRAGEN.ics') {
        fetch(icalUrl)
            .then(response => {
                if (!response.ok) throw new Error('Netzwerk-Fehler beim Laden des Google Kalenders');
                return response.text();
            })
            .then(data => {
                const parsedEvents = parseICS(data);
                renderCalendar(parsedEvents);
            })
            .catch(err => {
                console.error(err);
                // Fallback: Leeren Kalender zeichnen, falls Google blockiert
                renderCalendar({});
            });
    } else {
        // Fallback falls noch keine URL eingetragen wurde
        renderCalendar({});
    }

    // Modal-Schließmechanismus
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('calendarModal').style.display = 'none';
    });
    window.addEventListener('click', function(e) {
        if (e.target == document.getElementById('calendarModal')) {
            document.getElementById('calendarModal').style.display = 'none';
        }
    });
});