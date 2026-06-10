function initDrumMachine() {
  const TOTAL_COLUMNS = 16;
  const TOTAL_TRACKS = 6;
  const QUARTER_COLUMNS = [0, 4, 8, 12];
  const COL_LABELS = ['Bass Drum', 'Snare Drum', 'Closed Hi-Hat', 'Open Hi-Hat', 'Low Tom', 'High Tom'];

  const grid = document.getElementById('drum-grid');
  if (!grid) return;

  const tempoInput = document.getElementById('drum-tempo');
  const tempoDisplay = document.getElementById('drum-tempo-value');
  const startButton = document.getElementById('drum-start');
  if (!tempoInput || !tempoDisplay || !startButton) return;
  grid.innerHTML = '';
  tempoDisplay.textContent = tempoInput.value;

  const columnCells = Array.from({ length: TOTAL_COLUMNS }, () => []);
  const pattern = Array(TOTAL_COLUMNS).fill(null);

  const trackLabels = document.querySelector('.drum-track-labels');
  if (trackLabels) {
    trackLabels.innerHTML = '';
    COL_LABELS.forEach((labelText) => {
      const label = document.createElement('span');
      label.textContent = labelText;
      trackLabels.appendChild(label);
    });
  }

  for (let trackIndex = 0; trackIndex < TOTAL_TRACKS; trackIndex += 1) {
    for (let columnIndex = 0; columnIndex < TOTAL_COLUMNS; columnIndex += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'drum-cell';
      cell.dataset.column = columnIndex;
      cell.dataset.track = trackIndex;
      if (QUARTER_COLUMNS.includes(columnIndex)) {
        cell.classList.add('quarter-cell');
      }
      grid.appendChild(cell);
      columnCells[columnIndex].push(cell);
    }
  }

  grid.addEventListener('click', (event) => {
    const cell = event.target.closest('.drum-cell');
    if (!cell) return;
    const column = Number(cell.dataset.column);
    const track = Number(cell.dataset.track);
    const existingIndex = pattern[column];
    if (existingIndex === track) {
      cell.classList.remove('selected');
      pattern[column] = null;
      return;
    }
    columnCells[column].forEach((colCell) => colCell.classList.remove('selected'));
    cell.classList.add('selected');
    pattern[column] = track;
  });

  let audioCtx;
  let noiseBuffer;
  let isPlaying = false;
  let currentStep = 0;
  let playTimeout;

  tempoInput.addEventListener('input', () => {
    tempoDisplay.textContent = tempoInput.value;
  });

  startButton.addEventListener('click', () => {
    if (isPlaying) {
      stopSequence();
      return;
    }
    startSequence();
  });

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function getStepDuration() {
    const bpm = Number(tempoInput.value) || 140;
    return (60 / bpm / 4) * 1000;
  }

  function highlightColumn(step) {
    columnCells.forEach((cells, index) => {
      const isActive = index === step;
      cells.forEach((cell) => {
        cell.classList.toggle('playing-column', isActive);
      });
    });
  }

  function startSequence() {
    ensureAudio();
    isPlaying = true;
    startButton.textContent = 'Stop';
    runStep();
  }

  function stopSequence() {
    isPlaying = false;
    startButton.textContent = 'Start';
    if (playTimeout) {
      clearTimeout(playTimeout);
      playTimeout = null;
    }
    highlightColumn(null);
    currentStep = 0;
  }

  function runStep() {
    if (!isPlaying) return;
    const trackIndex = pattern[currentStep];
    if (typeof trackIndex === 'number') {
      triggerInstrument(trackIndex);
    }
    highlightColumn(currentStep);
    currentStep = (currentStep + 1) % TOTAL_COLUMNS;
    playTimeout = setTimeout(runStep, getStepDuration());
  }

  function triggerInstrument(index) {
    ensureAudio();
    const instrument = drumInstruments[index];
    if (instrument) {
      instrument();
    }
  }

  function playKick() {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  function playSnare() {
    const now = audioCtx.currentTime;
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseFilter.Q.value = 1.6;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + 0.3);

    const bodyOsc = audioCtx.createOscillator();
    const bodyGain = audioCtx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(200, now);
    bodyGain.gain.setValueAtTime(0.6, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    bodyOsc.connect(bodyGain).connect(audioCtx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.4);
  }

  function playHat(duration, freq) {
    const now = audioCtx.currentTime;
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(freq, now);
    const hatGain = audioCtx.createGain();
    hatGain.gain.setValueAtTime(0.8, now);
    hatGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    noiseSource.connect(filter).connect(hatGain).connect(audioCtx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  function playTom(freq) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + 0.25);
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  const drumInstruments = [
    playKick,
    playSnare,
    () => playHat(0.08, 6000),
    () => playHat(0.3, 4500),
    () => playTom(140),
    () => playTom(220),
  ];
}

window.initDrumMachine = initDrumMachine;
