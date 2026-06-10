function initRingModulator() {
  const ringPanel = document.querySelector('.ring-panel');
  if (!ringPanel) return;

  const masterVolumeInput = document.getElementById('ring-master-volume');
  const masterVolumeDisplay = document.getElementById('ring-master-volume-value');
  const startButton = document.getElementById('ring-start');

  const lfoRateSlider = document.getElementById('ring-lfo-rate');
  const lfoRangeSlider = document.getElementById('ring-lfo-range');
  const lfoFrequencySlider = document.getElementById('ring-lfo-frequency');
  const lfoRateDisplay = document.getElementById('ring-lfo-rate-value');
  const lfoRangeDisplay = document.getElementById('ring-lfo-range-value');
  const lfoFrequencyDisplay = document.getElementById('ring-lfo-frequency-value');

  if (
    !masterVolumeInput ||
    !masterVolumeDisplay ||
    !startButton ||
    !lfoRateSlider ||
    !lfoRangeSlider ||
    !lfoFrequencySlider ||
    !lfoRateDisplay ||
    !lfoRangeDisplay ||
    !lfoFrequencyDisplay
  ) {
    return;
  }

  const vcoDescriptors = [
    { prefix: 'ring-vco1', target: 'carrier' },
    { prefix: 'ring-vco2', target: 'modulator' },
  ];

  const vcos = vcoDescriptors.map((descriptor) => {
    const pitchSlider = document.getElementById(`${descriptor.prefix}-pitch`);
    const pitchValue = document.getElementById(`${descriptor.prefix}-pitch-value`);
    const volumeSlider = document.getElementById(`${descriptor.prefix}-volume`);
    const volumeValue = document.getElementById(`${descriptor.prefix}-volume-value`);
    const waveButtonsContainer = document.querySelector(`.wave-buttons[data-wave-group="${descriptor.prefix}"]`);

    if (!pitchSlider || !pitchValue || !volumeSlider || !volumeValue || !waveButtonsContainer) {
      return null;
    }

    const waveButtons = Array.from(waveButtonsContainer.querySelectorAll('button'));

    return {
      prefix: descriptor.prefix,
      target: descriptor.target,
      pitchSlider,
      pitchValue,
      volumeSlider,
      volumeValue,
      waveButtons,
      gainNode: null,
      oscillator: null,
      playing: false,
    };
  });

  if (vcos.some((entry) => entry === null)) return;

  let audioCtx;
  let masterGain;
  let carrierGain;
  let modulationGain;
  let ringGain;
  let lfoOsc;
  let lfoRangeDirect;
  let lfoRangeInverted;
  let lfoStarted = false;
  let isPlaying = false;

  const getActiveWave = (state) => {
    const active = state.waveButtons.find((btn) => btn.classList.contains('active'));
    return (active && active.dataset.wave) || 'sine';
  };

  const getLfoFrequency = () => {
    const rateBpm = Number(lfoRateSlider.value);
    const frequencyOffset = Number(lfoFrequencySlider.value);
    return rateBpm / 60 + frequencyOffset;
  };

  const ensureAudio = () => {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = Number(masterVolumeInput.value) / 100;
    masterGain.connect(audioCtx.destination);

    ringGain = audioCtx.createGain();
    ringGain.gain.value = 0;
    ringGain.connect(masterGain);

    carrierGain = audioCtx.createGain();
    carrierGain.connect(ringGain);
    modulationGain = audioCtx.createGain();
    modulationGain.gain.value = 1;
    modulationGain.connect(ringGain.gain);

    vcos.forEach((state) => {
      const synthGain = audioCtx.createGain();
      synthGain.gain.value = Number(state.volumeSlider.value);
      state.gainNode = synthGain;
      if (state.target === 'carrier') {
        synthGain.connect(carrierGain);
      } else {
        synthGain.connect(modulationGain);
      }
    });

    lfoOsc = audioCtx.createOscillator();
    lfoRangeDirect = audioCtx.createGain();
    lfoRangeInverted = audioCtx.createGain();

    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = getLfoFrequency();
    lfoRangeDirect.gain.value = Number(lfoRangeSlider.value);
    lfoRangeInverted.gain.value = -Number(lfoRangeSlider.value);

    lfoOsc.connect(lfoRangeDirect);
    lfoOsc.connect(lfoRangeInverted);
  };

  const startLfos = () => {
    if (!audioCtx || lfoStarted) return;
    lfoOsc.start();
    lfoStarted = true;
  };

  const stopOscillator = (state) => {
    if (state.oscillator) {
      try {
        state.oscillator.stop();
      } catch (error) {
        // ignore if already stopped
      }
      state.oscillator.disconnect();
      state.oscillator = null;
    }
  };

  const recreateOscillator = (state) => {
    if (!audioCtx || !state.gainNode) return;
    stopOscillator(state);

    const oscillator = audioCtx.createOscillator();
    oscillator.type = getActiveWave(state);
    oscillator.frequency.setValueAtTime(Number(state.pitchSlider.value), audioCtx.currentTime);
    oscillator.connect(state.gainNode);
    oscillator.start();
    state.oscillator = oscillator;

    if (state.target === 'carrier' && lfoRangeDirect) {
      lfoRangeDirect.disconnect();
      lfoRangeDirect.connect(oscillator.frequency);
    }
    if (state.target === 'modulator' && lfoRangeInverted) {
      lfoRangeInverted.disconnect();
      lfoRangeInverted.connect(oscillator.frequency);
    }
  };

  const updateWaveButtons = (state, button) => {
    state.waveButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    if (state.oscillator) {
      state.oscillator.type = button.dataset.wave;
    }
  };

  const updatePitch = (state) => {
    const freq = Number(state.pitchSlider.value);
    state.pitchValue.textContent = `${Math.round(freq)} Hz`;
    if (state.oscillator && audioCtx) {
      state.oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
    }
  };

  const updateVolume = (state) => {
    const value = Number(state.volumeSlider.value);
    state.volumeValue.textContent = `${Math.round(value * 100)}%`;
    if (state.gainNode && audioCtx) {
      state.gainNode.gain.setTargetAtTime(value, audioCtx.currentTime, 0.02);
    }
  };

  const updateLfoParams = () => {
    const freq = getLfoFrequency();
    lfoRateDisplay.textContent = `${Math.round(Number(lfoRateSlider.value))} BPM`;
    lfoFrequencyDisplay.textContent = `${freq.toFixed(1)} Hz`;
    const range = Number(lfoRangeSlider.value);
    lfoRangeDisplay.textContent = `${range} Hz`;
    if (lfoOsc && audioCtx) {
      lfoOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
      if (lfoRangeDirect) {
        lfoRangeDirect.gain.setTargetAtTime(range, audioCtx.currentTime, 0.05);
      }
      if (lfoRangeInverted) {
        lfoRangeInverted.gain.setTargetAtTime(-range, audioCtx.currentTime, 0.05);
      }
    }
  };

  const updateMasterVolume = () => {
    const value = Number(masterVolumeInput.value);
    masterVolumeDisplay.textContent = `${value}%`;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(value / 100, audioCtx.currentTime, 0.05);
    }
  };

  const setPlaying = async (shouldPlay) => {
    if (shouldPlay) {
      ensureAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      startLfos();
      vcos.forEach((state) => {
        recreateOscillator(state);
        updatePitch(state);
        updateVolume(state);
      });
      updateLfoParams();
      startButton.textContent = 'Stop Ring Modulator';
    } else {
      vcos.forEach((state) => stopOscillator(state));
      startButton.textContent = 'Start Ring Modulator';
    }
    isPlaying = shouldPlay;
  };

  startButton.addEventListener('click', async () => {
    const targetState = !isPlaying;
    await setPlaying(targetState);
  });

  vcos.forEach((state) => {
    state.pitchSlider.addEventListener('input', () => updatePitch(state));
    state.volumeSlider.addEventListener('input', () => updateVolume(state));
    state.waveButtons.forEach((button) => {
      button.addEventListener('click', () => updateWaveButtons(state, button));
    });
  });

  lfoRateSlider.addEventListener('input', updateLfoParams);
  lfoRangeSlider.addEventListener('input', updateLfoParams);
  lfoFrequencySlider.addEventListener('input', updateLfoParams);
  masterVolumeInput.addEventListener('input', updateMasterVolume);

  updateLfoParams();
  updateMasterVolume();
}

window.initRingModulator = initRingModulator;
