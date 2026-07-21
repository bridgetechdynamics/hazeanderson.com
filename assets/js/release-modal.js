(function () {
  const schedule = [
    {
      id: 'free-energy',
      title: 'Free Energy',
      description: 'Join the listening party for Free Energy on Bandcamp!',
      image: 'assets/images/kumite.jpg',
      releaseDate: '2026-07-20:00:00-05:00',
      previewStart: '2026-07-01T00:00:00-05:00',
      takeDown: '2026-08-21T00:00:00-05:00',
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
    const end = new Date(item.takeDown);
    return start <= now && now < end;
  });
  if (!release) return;

  const releaseDate = new Date(release.releaseDate);
  const takeDownDate = new Date(release.takeDown);
  const previewStartDate = new Date(release.previewStart);
  const updateCountdown = () => {
    const now = new Date();
    if (now >= takeDownDate) {
      modal.classList.remove('active');
      clearInterval(interval);
      return;
    }
    const diff = releaseDate - now;
    if (diff <= 0) {
      days.textContent = '0';
      hours.textContent = '0';
      mins.textContent = '0';
      secs.textContent = '0';
      kicker.textContent = 'Release is live';
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

  const previewActive = now >= previewStartDate;
  const show = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    updateCountdown();
    const now = new Date();
    const isLive = now >= releaseDate;
    party.href = isLive ? release.listeningParty : '#';
    party.classList.toggle('disabled', !isLive);
    party.setAttribute('aria-disabled', String(!isLive));
    party.textContent = isLive ? 'Join listening party' : 'Coming Soon';
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
