# Haze Anderson

This project is a portfolio site for Haze Anderson with interactive synthesis toys, release showcases, and channel highlights.

## Structure
- `index.html`: landing page with hero, feature cards, and the interactive VCO lab plus the release modal.
- `discography.html`, `downloads.html`, `channels.html`, `contact.html`: additional pages covering releases, downloads/tools, live channels, and the contact form.
- `assets/css/style.css`: shared styling for all pages plus the modals and interactive components.
- `assets/js/`: page-specific scripts (`main.js`, `vco.js`, `drum-machine.js`, `ring-modulator.js`, `astronoise.js`, `release-modal.js`).

## Running locally
Open `index.html` in a browser. No build steps are required; the site is static and the scripts run on page load.

## Release modal
The release modal on the home page is configured via `assets/js/release-modal.js`. The script reads from a `schedule` array that holds objects like this:

```js
{
  id: 'aurora-born',
  title: 'Aurora Born',
  description: 'New album copy…',
  image: 'assets/images/kumite.jpg',
  releaseDate: '2026-08-05T20:00:00-05:00',
  previewStart: '2026-07-21T00:00:00-05:00',
  listeningParty: 'https://www.youtube.com/watch?v=...'
}
```

Only the first release that is flagged as `active` (the default configuration) and whose `previewStart ≤ now < releaseDate` will trigger the modal. When the modal appears it starts a countdown to `releaseDate`, displays the provided artwork and description, and includes the listening-party link you specify.

### Activating the modal
1. Add or edit an entry in the `schedule` array with the future release data (title, artwork path, release datetime, preview window start, and party link).
2. Make sure `previewStart` is before the current time but still before `releaseDate`, so visitors see the modal before the drop.
3. The modal will automatically display on page load once the current time is within that window, thanks to the script’s automation logic.

### Deactivating the modal
- Remove or comment out the entry from the `schedule` array when you no longer want the modal to run, or
- Set the `previewStart` and `releaseDate` for that entry so the current time is outside the `[previewStart, releaseDate)` window.
- When a visitor closes the modal, their browser stores a `release-dismissed_{id}` flag so it stays hidden for that release; you can clear this key from the browser’s `localStorage` if you want to re-show the modal for testing.

Feel free to reuse this modal for future releases by setting up a new schedule entry prior to each launch.
