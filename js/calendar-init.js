document.addEventListener('DOMContentLoaded', function () {
 
    const wrapper = document.getElementById('calendar-wrapper');
    const grid    = document.getElementById('calendar-grid');
    const prevBtn    = document.getElementById('calendar-prev');
    const nextBtn    = document.getElementById('calendar-next');
    const monthTitle = document.getElementById('calendar-month-title');
 
    if (!grid || !wrapper) return;
 
    const icalUrl = wrapper.getAttribute('data-ical-url');
    
    let viewedDate   = new Date(); 
    let globalEvents = {};         

    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    // Hilfsfunktion, um Fehler direkt auf dem Kalenderblatt anzuzeigen
    function showOnScreenStatus(message, isError = false) {
        const statusDiv = document.createElement('div');
        statusDiv.style.gridColumn = "1 / -1";
        statusDiv.style.padding = "15px";
        statusDiv.style.margin = "10px 0";
        statusDiv.style.fontFamily = "sans-serif";
        statusDiv.style.fontSize = "0.9rem";
        statusDiv.style.borderRadius = "4px";
        statusDiv.style.backgroundColor = isError ? "#f8d7da" : "#e2e3e5";
        statusDiv.style.color = isError ? "#721c24" : "#383d41";
        statusDiv.style.border = isError ? "1px solid #f5c6cb" : "1px solid #d6d8db";
        statusDiv.textContent = message;
        grid.appendChild(statusDiv);
    }
 
    // =========================================================
    // 1. ICAL-PARSER
    // =========================================================
    function parseICS(data) {
        const events = {};
        const lines  = data.split(/\r?\n/);
        let currentEvent = null;
        let counter = 0;
 
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
                    counter++;
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
        
        // Wenn die Datei geladen wurde, aber keine VEVENT-Blöcke hat:
        if (counter === 0) {
            setTimeout(() => showOnScreenStatus("Hinweis: Die .ics-Datei wurde geladen, enthält aber überhaupt keine gültigen Termine. Überprüfe, ob der Google-Kalender öffentlich ist.", false), 50);
        } else {
            setTimeout(() => showOnScreenStatus(`Erfolg: Es wurden insgesamt ${counter} Termine aus der Datei eingelesen.`, false), 50);
        }
        
        return events;
    }
 
    // =========================================================
    // 2. KALENDER ZEICHNEN
    // =========================================================
    function renderCalendar() {
        // Event-Einträge behalten, nur das Grid leeren (Labels & Boxen)
        const statusElements = grid.querySelectorAll('div[style*="grid-column"]');
        grid.innerHTML = '';
        
        // Statusmeldungen wieder anhängen, falls vorhanden
        statusElements.forEach(el => grid.appendChild(el));
 
        if (monthTitle) {
            monthTitle.textContent = `${monthNames[viewedDate.getMonth()]} ${viewedDate.getFullYear()}`;
        }
 
        const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        weekdays.forEach(function (day) {
            const label = document.createElement('div');
            label.className = 'weekday-label';
            label.textContent = day;
            grid.appendChild(label);
        });
 
        const year         = viewedDate.getFullYear();
        const month        = viewedDate.getMonth(); 
        const now          = new Date(); 
 
        const daysInMonth  = new Date(year, month + 1, 0).getDate();
        const firstWeekday = new Date(year, month, 1).getDay();
        const startingSpaces = (firstWeekday === 0) ? 6 : firstWeekday - 1;
 
        for (let i = 0; i < startingSpaces; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }
 
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            
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
    // 3. EVENT LISTENER FÜR DIE BUTTONS
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
    // 4. MODAL-STEUERUNG
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
        showOnScreenStatus(`Ladeversuch der Datei von Pfad: "${icalUrl}"...`, false);
        
        fetch(icalUrl)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(`Datei nicht gefunden (HTTP ${response.status}). Überprüfe den data-ical-url Pfad im HTML!`);
                }
                return response.text();
            })
            .then(function (data) {
                globalEvents = parseICS(data); 
                renderCalendar();             
            })
            .catch(function (err) {
                grid.innerHTML = '';
                showOnScreenStatus(`Fehler beim Laden: ${err.message}`, true);
                renderCalendar();
            });
    } else {
        showOnScreenStatus("Fehler: Keine gültige iCal-URL im HTML-Attribut 'data-ical-url' hinterlegt.", true);
        renderCalendar();
    }
});