/**
 * IPHONE KEYBOARD SOUND SYNTHESIZER
 * Erzeugt den typischen iOS "Tick"-Laut beim Tippen.
 */

// 1. Audio-Kontext initialisieren (Das "Tonstudio" im Browser)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Funktion zum Erzeugen des Klicks
 * @param {boolean} isSpecial - Wenn true, wird ein tieferer Ton für Leertaste/Löschen abgespielt.
 */
function playIPhoneClick(isSpecial = false) {
    // Audio-Kontext aktivieren (notwendig wegen Browser-Sicherheitsrichtlinien)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // iPhone-Tastaturen nutzen sehr reine Sinus-Wellen (sine)
    osc.type = 'sine';
    
    // Frequenzen: Normale Tasten sind hell (~1600Hz), Sondertasten tiefer (~800Hz)
    const freq = isSpecial ? 800 : 1600;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Die Lautstärke-Hüllkurve: Extrem kurz (15ms), damit es "trocken" klingt
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.015);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.02);
}

// 2. Event-Listener an die Eingabefelder binden
window.addEventListener('DOMContentLoaded', () => {
    // Sucht das Formular über die ID oder die Klasse
    const typewriterForm = document.getElementById('typewriter-form') || document.querySelector('.contact-form');
    
    if (typewriterForm) {
        const inputs = typewriterForm.querySelectorAll('input, textarea');

        inputs.forEach(el => {
            el.addEventListener('keydown', (e) => {
                // Prüfen, ob es eine "Sondertaste" (Leertaste, Enter, Backspace) ist
                const isSpecial = e.key === 'Backspace' || e.key === 'Enter' || e.key === ' ';
                
                // Sound nur bei echten Zeichen oder Löschen/Enter abspielen
                if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
                    playIPhoneClick(isSpecial);
                }
            });
        });
    }
});