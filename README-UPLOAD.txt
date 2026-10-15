AURELIA YACHTS — The Private Atelier Edition

Independent fictional yacht-house concept for Kaiser Webdesign.
Static HTML, CSS and JavaScript; no build step or external CDN required.

Deployment
- Serve index.html from the web root and upload the entire assets/ directory.
- assets/fonts/ includes self-hosted Cormorant Garamond and Manrope fonts.
- Font license texts are included alongside the font files.

Design and interaction
- Editorial typography, a custom Aurelia monogram and a considered navy/ivory palette.
- Preserved From Vision and To Open Sea scroll-film geometry, scene transitions,
  video seeking and sound mixing. The core film controller remains in main.js.
- Atelier interactions are isolated in assets/js/atelier.js.
- Three-model collection with image transitions, concept details and keyboard tabs.
- Material accordion, image carousel with touch swiping and fullscreen image viewer.
- Responsive navigation, native dialogs, focus management and reduced-motion support.
- Contact form previews an enquiry locally. It has no backend, sends nothing and
  does not store personal details. Connect a real destination before client use.

Audio
- Sound starts only after Enter with sound or the sound toggle is selected.
- ocean-bg.mp3: ambient sea sound
- from-vision-score.mp3 / to-open-sea-score.mp3: cinematic section scores
- sonar-intro.mp3: introductory sonar
- Original media files are unchanged. Confirm that the existing audio/image/video
  licenses cover the intended public, advertising and customer use.

Checks
- Open via an HTTP server and check desktop and mobile layouts.
- Test both scroll films from beginning to end, including reverse scrolling.
- Test collection tabs with arrow keys, gallery controls, menu and enquiry preview.
- Try reduced motion and keyboard-only navigation.
