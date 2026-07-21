(function () {
  const schedule = [
    {
      id: 'aurora-born',
      title: 'Aurora Born',
      description: 'New long-form album bridging analog bass rituals with cinematic late-night motorik.',
      image: 'assets/images/kumite.jpg',
      releaseDate: '2026-08-05T20:00:00-05:00',
      previewStart: '2026-07-21T00:00:00-05:00',
      listeningParty: 'https://www.youtube.com/watch?v=6n1LkR4afNI?si=kyWfF_Kt1AviRlpP'
    }
  ];

  const modal = document.getElementById('release-modal');
  if (!modal) return;
  const art = document.getElementById('release-modal-art');
  const title = document.getElementById('release-modal-title');
  const copy = document.getElementById('release-modal-copy');
  const days = document.getElementById('release-count-days');
  const hours = document.getElementById('release-count-hours');
  const mins = document.getElementById('release-count-minutes');
  const secs = document.getElementById('release-count-seconds');
  const party = document.getElementById('release-modal-party');
  const kicker = document.getElementById('release-modal-kicker');
  const close = modal.querySelector('.release-modal-close');
  const backdrop = modal.querySelector('.release-modal-backdrop');

  const now = new Date();
  const release = schedule.find((item) => {
    const start = new Date(item.previewStart);
    const end = new Date(item.releaseDate);
    return start <= now && now < end;
  });
  if (!release) return;

  const releaseDate = new Date(release.releaseDate);
  const updateCountdown = () => {
    const diff = releaseDate - new Date();
    if (diff <= 0) {
      modal.classList.remove('active');
      clearInterval(interval);
      return;
    }
    const d = Math.floor(diff / 1000 / 60 / 60 / 24);
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    days.textContent = d;
    hours.textContent = h;
    mins.textContent = m;
    secs.textContent = s;
  };

  const interval = window.setInterval(updateCountdown, 1000);
  art.src = release.image;
  art.alt = `${release.title} cover`;
  title.textContent = release.title;
  copy.textContent = release.description;
  party.href = release.listeningParty;
  party.textContent = 'Join listening party';
  kicker.textContent = 'New album drop';

  const show = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    updateCountdown();
  };

  const hide = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    clearInterval(interval);
  };

  close.addEventListener('click', hide);
  backdrop.addEventListener('click', hide);
  show();
})();
