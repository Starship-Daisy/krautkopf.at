document.addEventListener('DOMContentLoaded', function () {
 
    const wrapper = document.getElementById('calendar-wrapper');
    const grid    = document.getElementById('calendar-grid');
 
    if (!grid || !wrapper) {
        console.error('calendar-init.js: #calendar-wrapper oder #calendar-grid nicht gefunden.');
        return;
    }
 
    const icalUrl = wrapper.getAttribute('data-ical-url');
    console.log('calendar-init.js: Versuche iCal-Datei zu laden von:', icalUrl);
 
    // =========================================================
    // 1. ICAL-PARSER (Mit Diagnose-Protokoll & robustem Matching)
    // =========================================================
    function parseICS(data) {
        const events = {};
        const lines  = data.split(/\r?\n/);
        let currentEvent = null;
        let totalVEVENTS = 0;
        let validEventsCount = 0;
 
        console.log('calendar-init.js: iCal-Datei erfolgreich gelesen. Zeilenanzahl:', lines.length);
 
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
 
            // Zeilenfortsetzungen laut iCal-Spec reparieren
            while (i + 1 < lines.length &&
                   (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
                line += lines[i + 1].substring(1);
                i++;
            }
 
            const cleanLine = line.trim();
 
            if (cleanLine.startsWith('BEGIN:VEVENT')) {
                currentEvent = {};
                totalVEVENTS++;
            } else if (cleanLine.startsWith('END:VEVENT')) {
                if (currentEvent && currentEvent.start) {
                    if (!events[currentEvent.start]) events[currentEvent.start] = [];
                    events[currentEvent.start].push({
                        title: currentEvent.summary     || 'Werkstatt-Termin',
                        desc:  currentEvent.description || 'Keine weiteren Details vorhanden.'
                    });
                    validEventsCount++;
                }
                currentEvent = null;
            } else if (currentEvent) {
 
                if (cleanLine.startsWith('DTSTART')) {
                    // Extrahiert den reinen Wert nach dem letzten Doppelpunkt
                    const val = cleanLine.split(':').pop();
                    if (val && val.length >= 8) {
                        const y = val.substring(0, 4);
                        const m = val.substring(4, 6);
                        const d = val.substring(6, 8);
                        currentEvent.start = `${y}-${m}-${d}`;
                    }
 
                } else if (cleanLine.startsWith('SUMMARY')) {
                    const colonIdx = cleanLine.indexOf(':');
                    if (colonIdx !== -1) {
                        currentEvent.summary = cleanLine.substring(colonIdx + 1).replace(/\\,/g, ',');
                    }
 
                } else if (cleanLine.startsWith('DESCRIPTION')) {
                    const colonIdx = cleanLine.indexOf(':');
                    if (colonIdx !== -1) {
                        const raw = cleanLine.substring(colonIdx + 1).replace(/\\,/g, ',');
                        const escaped = raw
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;');
                        currentEvent.description = escaped.replace(/\\n/g, '<br>');
                    }
                }
            }
        }
        
        console.log(`calendar-init.js: Parser-Statistik: Block-Einträge gefunden: ${totalVEVENTS} | Erfolgreich datierte Termine: ${validEventsCount}`);
        return events;
    }
 
    // =========================================================
    // 2. KALENDER ZEICHNEN
    // =========================================================
    function renderCalendar(parsedEvents) {
        grid.innerHTML = '';
 
        const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        weekdays.forEach(function (day) {
            const label = document.createElement('div');
            label.className = 'weekday-label';
            label.textContent = day;
            grid.appendChild(label);
        });
 
        const now          = new Date();
        const year         = now.getFullYear();
        const month        = now.getMonth(); 
 
        const daysInMonth  = new Date(year, month + 1, 0).getDate();
        const todayDay     = now.getDate();
 
        const firstWeekday = new Date(year, month, 1).getDay();
        const startingSpaces = (firstWeekday === 0) ? 6 : firstWeekday - 1;
 
        for (let i = 0; i < startingSpaces; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }
 
        let renderedEventsOnSheet = 0;
 
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            if (day === todayDay) cell.classList.add('is-today');
 
            const mm      = String(month + 1).padStart(2, '0');
            const dd      = String(day).padStart(2, '0');
            const dateStr = `${year}-${mm}-${dd}`;
 
            const numSpan = document.createElement('span');
            numSpan.className   = 'day-number';
            numSpan.textContent = day;
            cell.appendChild(numSpan);
 
            if (parsedEvents[dateStr]) {
                parsedEvents[dateStr].forEach(function (evt) {
                    const evtDiv = document.createElement('div');
                    evtDiv.className   = 'event-item';
                    evtDiv.textContent = evt.title;
 
                    evtDiv.addEventListener('click', function (e) {
                        e.stopPropagation();
                        openModal(evt.title, evt.desc);
                    });
 
                    cell.appendChild(evtDiv);
                    renderedEventsOnSheet++;
                });
            }
 
            grid.appendChild(cell);
        }
        
        console.log(`calendar-init.js: Sichtbare Termine auf dem Kalenderblatt für diesen Monat: ${renderedEventsOnSheet}`);
    }
 
    // =========================================================
    // 3. MODAL-STEUERUNG
    // =========================================================
    const modal      = document.getElementById('calendarModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody  = document.getElementById('modalBody');
    const closeBtn   = document.querySelector('.close-modal');
 
    function openModal(title, descHtml) {
        if (!modal) return;
        modalTitle.textContent = title;
        modalBody.innerHTML    = descHtml;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
        closeBtn && closeBtn.focus();
    }
 
    function closeModal() {
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
    }
 
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
 
    // =========================================================
    // 4. DATEN LADEN
    // =========================================================
    if (icalUrl && !icalUrl.includes('HIER_DEINE')) {
        fetch(icalUrl)
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP-Fehler ' + response.status);
                return response.text();
            })
            .then(function (data) {
                renderCalendar(parseICS(data));
            })
            .catch(function (err) {
                console.error('calendar-init.js: AJAX-Ladefehler:', err);
                renderCalendar({});
            });
    } else {
        console.warn('calendar-init.js: Keine valide iCal-URL im data-Attribut angegeben.');
        renderCalendar({});
    }
});