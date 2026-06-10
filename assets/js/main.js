document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll('.site-nav a').forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add('active');
    }
  });

  if (page === 'discography' && window.initDrumMachine) {
    window.initDrumMachine();
  }
  if (page === 'channels' && window.initRingModulator) {
    window.initRingModulator();
  }
});
