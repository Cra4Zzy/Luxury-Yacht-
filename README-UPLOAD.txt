AURELIA YACHTS — Maritime Sonar Sound Edition

Basis:
- Diese Version wurde aus deiner neu hochgeladenen aurelia-yachts-showcase(1).zip gebaut.

Änderungen:
- Echte Sound-Dateien eingebaut.
- Sound startet nur nach Klick auf "Enter with sound" oder später über den Sound-Toggle.
- Maritimer Sonar-Startscreen ohne fetten Container.
- Startscreen mit Yacht-Hintergrund, Sonar-Ringen, Sweep, Blips, Koordinaten und ruhiger Premium-Typografie.
- Header bleibt nahe an der früheren/klassischeren Version.
- Scroll-Video-Logik bleibt erhalten.

Sound-Zuordnung:
- ocean-bg.mp3 = Hintergrund-Meeresrauschen.
- from-vision-score.mp3 = erste Scroll-Animation "From Vision".
- to-open-sea-score.mp3 = zweite Scroll-Animation "To Open Sea".
- sonar-intro.mp3 = Sonar-Eingangsanimation.

Upload:
- Lade den INHALT des Ordners "aurelia-yachts-showcase" hoch.
- index.html muss direkt im Root liegen.
- assets/css, assets/js, assets/img, assets/video und assets/audio vollständig hochladen.

Lizenz:
Bitte sicherstellen, dass die verwendeten Epidemic-Sound-Dateien für Website, Werbung und Kundenprojekte korrekt lizenziert sind.

Test:
- Nach Upload Cache löschen oder im Inkognito-Fenster testen.


Header-Fix:
- Header wurde auf stabilen Flex-Aufbau umgestellt.
- Breite: calc(100vw - 48px), max-width 1240px.
- Logo links, Navigation sauber zentriert, CTA rechts.
- Mobile: Navigation wird ausgeblendet, Header bleibt sauber.


Clean Header Update:
- Kein Pill-Header mehr.
- Freier, transparenter Hero-Header über die volle Breite.
- Logo links, Navigation mittig, CTA rechts – wie im Referenzscreen.


Enquire Button Fix:
- CTA im Header wurde flacher, schmaler und sauber zentriert.
- Kein klobiges Oval mehr.


Header 1:1 Reference Update:
- Header-HTML aus der hochgeladenen Referenzversion übernommen.
- Alte Pill-/Clean-/Button-Overrides entfernt.
- Header-CSS auf Referenzlogik zurückgesetzt:
  top gradient, flex space-between, Logo links, Navigation, CTA rechts.


Final Header Full-Width Fix:
- Alte begrenzte Header-Breite wurde final überschrieben.
- Header nutzt jetzt left: 0; right: 0; width: auto; max-width: none.
- Damit läuft der Header wieder über die volle Viewport-Breite wie in der Referenz.
