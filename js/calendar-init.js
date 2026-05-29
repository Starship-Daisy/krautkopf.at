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
    let currentStatusEl = null; 

    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    function showStatus(message, isError = false) {
        if (currentStatusEl && currentStatusEl.parentNode) {
            currentStatusEl.parentNode.removeChild(currentStatusEl);
        }
        
        currentStatusEl = document.createElement('div');
        currentStatusEl.style.gridColumn = "1 / -1";
        currentStatusEl.style.padding = "12px";
        currentStatusEl.style.margin = "0 0 15px 0";
        currentStatusEl.style.fontFamily = "sans-serif";
        currentStatusEl.style.fontSize = "0.9rem";
        currentStatusEl.style.borderRadius = "4px";
        currentStatusEl.style.backgroundColor = isError ? "#f8d7da" : "#e2e3e5";
        currentStatusEl.style.color = isError ? "#721c24" : "#383d41";
        currentStatusEl.style.border = isError ? "1px solid #f5c6cb" : "1px solid #d6d8db";
        currentStatusEl.textContent = message;
        
        grid.insertBefore(currentStatusEl, grid.firstChild);
    }
 
    // =========================================================
    // 1. ICAL-PARSER (Mit Uhrzeit-Extraktion & HTML-Fix)
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
                        desc:  currentEvent.description || 'Keine weiteren Details vorhanden.',
                        time:  currentEvent.time        || '' // Uhrzeit mitspeichern
                    });
                    counter++;
                }
                currentEvent = null;
            } else if (currentEvent) {
                if (cleanLine.startsWith('DTSTART')) {
                    const val = cleanLine.split(':').pop();
                    if (val && val.length >= 8) {
                        currentEvent.start = `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`;
                        
                        // Uhrzeit auslesen, falls vorhanden (sucht nach dem 'T' im Zeitstempel)
                        const tIdx = val.indexOf('T');
                        if (tIdx !== -1 && val.length >= tIdx + 5) {
                            currentEvent.time = `${val.substring(tIdx + 1, tIdx + 3)}:${val.substring(tIdx + 3, tIdx + 5)}`;
                        } else {
                            currentEvent.time = ''; // Ganztägig
                        }
                    }
                } else if (cleanLine.startsWith('SUMMARY')) {
                    const colonIdx = cleanLine.indexOf(':');
                    if (colonIdx !== -1) currentEvent.summary = cleanLine.substring(colonIdx + 1).replace(/\\,/g, ',');
                } else if (cleanLine.startsWith('DESCRIPTION')) {
                    const colonIdx = cleanLine.indexOf(':');
                    if (colonIdx !== -1) {
                        let raw = cleanLine.substring(colonIdx + 1);
                        // FIX: HTML-Codes NICHT mehr escapen, sondern Formatierung erlauben!
                        raw = raw.replace(/\\,/g, ',')
                                 .replace(/\\;/g, ';')
                                 .replace(/\\n/g, '<br>')
                                 .replace(/\\/g, '');
                        currentEvent.description = raw;
                    }
                }
            }
        }
        
        if (counter === 0) {
            showStatus("Hinweis: Die Kalenderdatei enthält 0 Termine.", false);
        } else {
            if (currentStatusEl && currentStatusEl.parentNode) {
                currentStatusEl.parentNode.removeChild(currentStatusEl);
            }
        }
        
        return events;
    }
 
    // =========================================================
    // 2. KALENDER ZEICHNEN
    // =========================================================
    function renderCalendar() {
        const labels = grid.querySelectorAll('.weekday-label, .calendar-day');
        labels.forEach(el => el.parentNode.removeChild(el));
 
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
                    
                    // Hier strukturieren wir den Inhalt der Zelle: Uhrzeit + Headline
                    let timeBadge = evt.time ? `<span class="event-time">${evt.time}</span>` : '';
                    let titleText = `<span class="event-title">${evt.title}</span>`;
                    
                    evtDiv.innerHTML = timeBadge + titleText;
                    
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
        modalBody.innerHTML    = descHtml; // Rendert jetzt echtes HTML sauber aus
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
        showStatus("Verbinde mit Kalenderdatei...", false);
        
        fetch(icalUrl)
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(function (data) {
                globalEvents = parseICS(data); 
                renderCalendar();             
            })
            .catch(function (err) {
                showStatus(`Fehler beim Laden: ${err.message}`, true);
                renderCalendar();
            });
    } else {
        showStatus("Fehler: Keine gültige iCal-URL hinterlegt.", true);
        renderCalendar();
    }
});