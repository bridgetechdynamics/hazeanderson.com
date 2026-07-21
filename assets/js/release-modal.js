(function () {
  const schedule = [
    {
      id: 'aurora-born',
      title: 'Aurora Born',
      description: 'New long-form album bridging analog bass rituals with cinematic late-night motorik.',
      image: 'assets/images/kumite.jpg',
      releaseDate: '2026-07-20T20:00:00-05:00',
      previewStart: '2026-07-01T00:00:00-05:00',
      takeDown: '2026-07-21T00:00:00-05:00',
      listeningParty: 'https://www.youtube.com/watch?v=6n1LkR4afNI?si=kyWfF_Kt1AviRlpP',
      albumLink: 'https://hazeanderson.bandcamp.com/album/aurora-born'
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

  const updateLinks = (isLive) => {
    if (!party) return;
    if (isLive) {
      party.href = release.albumLink;
      party.textContent = 'Stream the album';
    } else {
      party.href = release.listeningParty;
      party.textContent = 'Release party';
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    if (now >= takeDownDate) {
      modal.classList.remove('active');
      clearInterval(interval);
      return;
    }
    const diff = releaseDate - now;
    const isLive = diff <= 0;
    updateLinks(isLive);
    if (isLive) {
      days.textContent = '0';
      hours.textContent = '0';
      mins.textContent = '0';
      secs.textContent = '0';
      kicker.textContent = 'Release is live';
      return;
    }
    kicker.textContent = 'New album drop';
    const daysCount = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hoursCount = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutesCount = Math.floor((diff / (1000 * 60)) % 60);
    const secondsCount = Math.floor((diff / 1000) % 60);
    days.textContent = daysCount;
    hours.textContent = hoursCount;
    mins.textContent = minutesCount;
    secs.textContent = secondsCount;
  };

  const interval = window.setInterval(updateCountdown, 1000);
  art.src = release.image;
  art.alt = `${release.title} cover`;
  title.textContent = release.title;
  copy.textContent = release.description;

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
