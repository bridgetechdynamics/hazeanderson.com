# Haze Anderson

This project is a portfolio site for Haze Anderson with interactive synthesis toys, release showcases, and channel highlights.

## Structure
- `index.html`: landing page with hero, feature cards, and the interactive VCO lab plus the release modal.
- `discography.html`, `downloads.html`, `channels.html`, `contact.html`: additional pages covering releases, downloads/tools, live channels, and the contact form.
- `assets/css/style.css`: shared styling for all pages plus the modals and interactive components.
- `assets/js/`: page-specific scripts (`main.js`, `vco.js`, `drum-machine.js`, `ring-modulator.js`, `filter.js`, `release-modal.js`).
  - `filter.js` powers the downloads page’s PRBS-based filter demo, generating a pseudo-random bitstream that feeds a bandpass filter while LFO and envelope controls shape the filtered noise.

## Running locally
Open `index.html` in a browser. No build steps are required; the site is static and the scripts run on page load.

## Release modal
The release modal on the home page is configured via `assets/js/release-modal.js`. The script consumes a `schedule` array of release entries, each containing the artwork, preview window, release date, take-down date, the listening party URL, and the album URL:

```js
{
  id: 'aurora-born',
  title: 'Aurora Born',
  description: 'New album copy…',
  image: 'assets/images/kumite.jpg',
  releaseDate: '2026-08-05T20:00:00-05:00',
  previewStart: '2026-07-21T00:00:00-05:00',
  takeDown: '2026-09-01T00:00:00-05:00',
  listeningParty: 'https://www.youtube.com/watch?v=...',
  albumLink: 'https://hazeanderson.bandcamp.com/album/aurora-born'
}
```

The modal automatically appears when the current date is inside the preview/take-down window (`previewStart ≤ now < takeDown`). It shows a countdown to `releaseDate` (which stays at zero after the drop), presents the artwork/description, and displays one button whose href and label automatically flip from “Release party” to “Stream the album” once `releaseDate` passes. When the take-down date has been reached the modal hides itself and stops counting down.

### Activating the modal
1. Add or edit an entry in the `schedule` array with the future release data (title, artwork path, release datetime, preview window start, and party link).
2. Make sure `previewStart` is before the current time but still before `releaseDate`, so visitors see the modal before the drop.
3. The modal will automatically display on page load once the current time is within that window, thanks to the script’s automation logic.

### Deactivating the modal
- Remove or comment out the entry from the `schedule` array when you no longer want the modal to run, or
- Set the `previewStart` and `releaseDate` for that entry so the current time is outside the `[previewStart, releaseDate)` window.
- When a visitor closes the modal, their browser stores a `release-dismissed_{id}` flag so it stays hidden for that release; you can clear this key from the browser’s `localStorage` if you want to re-show the modal for testing.

Feel free to reuse this modal for future releases by setting up a new schedule entry prior to each launch.

## Filter demo and PRBS
- `downloads.html` now hosts the Filter demo, which is wired through `assets/js/filter.js`.
- Internally `filter.js` keeps a 16-bit LFSR-based PRBS generator (`stepLfsr()`), fills each buffer frame with ±1 bits, and sends that pseudo-random stream through the band-pass filter so you always hear the filtered noise rather than raw oscillators.
- The intensity slider scales the PRBS amplitude, the LFO and glide depth modulate the filter’s center frequency, and the envelope/burst controls gate how the PRBS noise is exposed, giving you a noisy filter voice inspired by classic Atari hardware.
