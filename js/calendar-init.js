document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  
  var modal = document.getElementById('calendarModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var closeBtn = document.getElementsByClassName('close-modal')[0];

  // Funktion, die je nach Breite die richtige Ansicht zurückgibt
  function getCorrectView() {
    return window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth';
  }

// JETZT NEU: Begrenzt die Termine pro Kästchen und zeigt "+ weitere" an
    dayMaxEvents: 3, 
    
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: window.innerWidth < 768 ? '' : 'dayGridMonth,listMonth'
    },
    
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
      modalTitle.innerText = info.event.title;
      var description = info.event.extendedProps.description || 'Keine weitere Beschreibung vorhanden.';
      modalBody.innerHTML = description;
      modal.style.display = 'block';
      info.jsEvent.preventDefault();
    }
  });

  calendar.render();

  // JETZT NEU: Hört auf Größenänderungen und schaltet die Ansicht LIVE um!
  window.addEventListener('resize', function() {
    var correctView = getCorrectView();
    if (calendar.view.type !== correctView) {
      calendar.changeView(correctView);
      
      // Toolbar-Buttons auf dem Handy sauber anpassen
      if (window.innerWidth < 768) {
        calendar.setOption('headerToolbar', {
          left: 'prev,next today',
          center: 'title',
          right: ''
        });
      } else {
        calendar.setOption('headerToolbar', {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listMonth'
        });
      }
    }
  });

  // Modal-Logik bleibt gleich
  if(closeBtn) {
    closeBtn.onclick = function() { modal.style.display = 'none'; }
  }
  window.onclick = function(event) {
    if (event.target == modal) { modal.style.display = 'none'; }
  }
});