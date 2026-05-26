document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  
  if (!calendarEl) return;

  var modal = document.getElementById('calendarModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var closeBtn = document.getElementsByClassName('close-modal')[0];

  function getCorrectView() {
    return window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth';
  }

  var calendar = new FullCalendar.Calendar(calendarEl, {
    locale: 'de',
    firstDay: 1,
    initialView: getCorrectView(),
    
    dayMaxEvents: false, // Zeige alle Termine voll an
    height: 'auto',      // DER ENTSCHEIDENDE FIX: Zwingt die Zeilen, dynamisch mitzuwachsen!
    
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: window.innerWidth < 768 ? '' : 'dayGridMonth,listMonth'
    },
    
    events: {
      url: '/js/werkstatt.txt', 
      format: 'ics'
    },

    eventClick: function(info) {
      if (modal && modalTitle && modalBody) {
        modalTitle.innerText = info.event.title;
        var description = info.event.extendedProps.description || 'Keine weitere Beschreibung vorhanden.';
        modalBody.innerHTML = description;
        modal.style.display = 'block';
      }
      info.jsEvent.preventDefault();
    }
  });

  calendar.render();

  window.addEventListener('resize', function() {
    var correctView = getCorrectView();
    if (calendar.view.type !== correctView) {
      calendar.changeView(correctView);
      
      if (window.innerWidth < 768) {
        calendar.setOption('headerToolbar', { left: 'prev,next today', center: 'title', right: '' });
      } else {
        calendar.setOption('headerToolbar', { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' });
      }
    }
  });

  if (closeBtn) {
    closeBtn.onclick = function() { modal.style.display = 'none'; }
  }
  window.onclick = function(event) {
    if (event.target == modal) { modal.style.display = 'none'; }
  }
});