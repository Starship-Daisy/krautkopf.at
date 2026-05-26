document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  
  // Elemente für das Popup holen
  var modal = document.getElementById('calendarModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var closeBtn = document.getElementsByClassName('close-modal')[0];

  var calendar = new FullCalendar.Calendar(calendarEl, {
    locale: 'de',
    firstDay: 1,
    initialView: window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth', 
    
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: window.innerWidth < 768 ? '' : 'dayGridMonth,listMonth'
    },
    
    events: {
      url: '/js/werkstatt.txt', 
      format: 'ics'
    },

    // Wenn man auf einen Termin klickt, öffnet sich das schicke Popup
    eventClick: function(info) {
      modalTitle.innerText = info.event.title;
      
      // Die Beschreibung auslesen (falls leer, Standardtext anzeigen)
      var description = info.event.extendedProps.description || 'Keine weitere Beschreibung vorhanden.';
      
      // Da Google oft HTML (wie Links oder Fettgedrucktes) mitliefert, fügen wir es als HTML ein
      modalBody.innerHTML = description;
      
      // Popup sichtbar machen
      modal.style.display = 'block';
      
      info.jsEvent.preventDefault(); // Verhindert Google-Weiterleitung
    }
  });

  calendar.render();

  // Popup schließen, wenn man auf das "X" klickt
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  }

  // Popup schließen, wenn man irgendwo außerhalb des Fensters hinklickt
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  }
});