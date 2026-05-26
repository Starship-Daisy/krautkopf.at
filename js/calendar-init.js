document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');

  var calendar = new FullCalendar.Calendar(calendarEl, {
    // Deutsche Spracheinstellungen
    locale: 'de',
    firstDay: 1, // Die Woche startet am Montag
    
    // Intelligente Ansicht je nach Bildschirmgröße
    // Am Handy eine kompakte Liste untereinander, am Desktop das große Monatsraster!
    initialView: window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth', 
    
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: window.innerWidth < 768 ? '' : 'dayGridMonth,listMonth' // Schaltet am Desktop zwischen Raster und Liste um
    },
    
    // Hier wird deine lokale, DSGVO-sichere Kalenderdatei geladen
    events: {
      url: '/js/werkstatt.ics', 
      format: 'ics'
    },

    // Ein dezentes Infofeld, wenn man auf einen Termin klickt
    eventClick: function(info) {
      alert('Termin: ' + info.event.title + '\nBeschreibung: ' + (info.event.extendedProps.description || 'Keine weitere Beschreibung.'));
      info.jsEvent.preventDefault(); // Verhindert, dass der Browser versucht, zu Google weiterzuleiten
    }
  });

  calendar.render();
});