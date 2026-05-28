document.addEventListener('DOMContentLoaded', function () {
 
    const wrapper = document.getElementById('calendar-wrapper');
    const grid    = document.getElementById('calendar-grid');
    
    // 🆕 Navigations-Elemente greifen
    const prevBtn    = document.getElementById('calendar-prev');
    const nextBtn    = document.getElementById('calendar-next');
    const monthTitle = document.getElementById('calendar-month-title');
 
    if (!grid || !wrapper) return;
 
    const icalUrl = wrapper.getAttribute('data-ical-url');
    
    // 🆕 STATUS-VARIABLEN
    let viewedDate   = new Date(); // Das aktuell betrachtete Datum (steuerbar)
    let globalEvents = {};         // Hier zwischenspeichern wir die iCal-Daten

    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
 
    // =========================================================
    // 1. ICAL-PARSER (Bleibt identisch robust)
    // =========================================================
    function parseICS(data) {
        const events = {};
        const lines  = data.split(/\r?\n/);
        let currentEvent = null;
 
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
                line += lines[i + 1].substring(1);
                i++;
            }
            const cleanLine = line.trim();
 
            if (cleanLine.startsWith('BEGIN:VEVENT')) {
                currentEvent = {};
            } else if (cleanLine.startsWith('END:VEVENT')) {
                if (currentEvent && currentEvent.start) {
                    if (!events[currentEvent.start]) events[currentEvent.start] = [];
                    events[currentEvent.start].push({
                        title: currentEvent.summary     || 'Werkstatt-Termin',
                        desc:  currentEvent.description || 'Keine weiteren Details vorhanden.'
                    });
                }
                currentEvent = null;
            } else if (currentEvent) {
                if (cleanLine.startsWith('DTSTART')) {
                    const val = cleanLine.split(':').pop();
                    if (val && val.length >= 8) {
                        currentEvent.start = `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`;
                    }
                } else if (cleanLine.startsWith('SUMMARY')) {
                    const colonIdx = cleanLine.indexOf(':');
                    if (colonIdx !== -1) currentEvent.summary = cleanLine.substring(colonIdx + 1).replace(/\\,/g, ',');
                } else if (cleanLine.startsWith('DESCRIPTION')) {
                    const colonIdx = cleanLine.indexOf(':');
                    if (colonIdx !== -1) {
                        const raw = cleanLine.substring(colonIdx + 1).replace(/\\,/g, ',');
                        currentEvent.description = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\\n/g, '<br>');
                    }
                }
            }
        }
        return events;
    }
 
    // =========================================================
    // 2. KALENDER ZEICHNEN (Jetzt dynamisch basierend auf viewedDate)
    // =========================================================
    function renderCalendar() {
        grid.innerHTML = '';
 
        // Überschrift updaten (z.B. "Mai 2026")
        if (monthTitle) {
            monthTitle.textContent = `${monthNames[viewedDate.getMonth()]} ${viewedDate.getFullYear()}`;
        }
 
        // Wochentage-Header
        const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        weekdays.forEach(function (day) {
            const label = document.createElement('div');
            label.className = 'weekday-label';
            label.textContent = day;
            grid.appendChild(label);
        });
 
        // Zeit-Berechnungen basierend auf viewedDate
        const year         = viewedDate.getFullYear();
        const month        = viewedDate.getMonth(); 
        const now          = new Date(); // Bleibt für die Erkennung von "Heute"
 
        const daysInMonth  = new Date(year, month + 1, 0).getDate();
        const firstWeekday = new Date(year, month, 1).getDay();
        const startingSpaces = (firstWeekday === 0) ? 6 : firstWeekday - 1;
 
        // Leere Tage vorn auffüllen
        for (let i = 0; i < startingSpaces; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }
 
        // Tage des Monats generieren
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            
            // "Heute"-Klasse nur vergeben, wenn Monat & Jahr auch real heute sind
            if (day === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
                cell.classList.add('is-today');
            }
 
            const mm      = String(month + 1).padStart(2, '0');
            const dd      = String(day).padStart(2, '0');
            const dateStr = `${year}-${mm}-${dd}`;
 
            const numSpan = document.createElement('span');
            numSpan.className   = 'day-number';
            numSpan.textContent = day;
            cell.appendChild(numSpan);
 
            if (globalEvents[dateStr]) {
                globalEvents[dateStr].forEach(function (evt) {
                    const evtDiv = document.createElement('div');
                    evtDiv.className   = 'event-item';
                    evtDiv.textContent = evt.title;
                    evtDiv.addEventListener('click', function (e) {
                        e.stopPropagation();
                        openModal(evt.title, evt.desc);
                    });
                    cell.appendChild(evtDiv);
                });
            }
            grid.appendChild(cell);
        }
    }
 
    // =========================================================
    // 3. 🆕 EVENT LISTENER FÜR DIE BUTTONS
    // =========================================================
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            viewedDate.setMonth(viewedDate.getMonth() - 1);
            renderCalendar();
        });
    }
 
    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            viewedDate.setMonth(viewedDate.getMonth() + 1);
            renderCalendar();
        });
    }
 
    // =========================================================
    // 4. MODAL-STEUERUNG (Unverändert)
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
    // 5. INITIALER LADEVORGANG
    // =========================================================
    if (icalUrl && !icalUrl.includes('HIER_DEINE')) {
        fetch(icalUrl)
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(function (data) {
                globalEvents = parseICS(data); // Daten global speichern
                renderCalendar();             // Kalender rendern
            })
            .catch(function (err) {
                console.error('Kalender konnte nicht geladen werden:', err);
                renderCalendar();
            });
    } else {
        renderCalendar();
    }
});