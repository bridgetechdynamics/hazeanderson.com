(function () {
  const vcoDescriptors = [
    { prefix: 'vco1', defaults: { pitch: 330, volume: 0.45, lfoRate: 1.2, lfoDepth: 88 } },
    { prefix: 'vco2', defaults: { pitch: 220, volume: 0.3, lfoRate: 0.8, lfoDepth: 60 } },
  ];

  const crossModSlider = document.getElementById('cross-mod');
  const crossModValue = document.getElementById('cross-mod-value');
  if (!crossModSlider || !crossModValue) return;

  const vcos = vcoDescriptors.map((descriptor) => {
    const pitchSlider = document.getElementById(`${descriptor.prefix}-pitch`);
    const pitchValue = document.getElementById(`${descriptor.prefix}-pitch-value`);
    const volumeSlider = document.getElementById(`${descriptor.prefix}-volume`);
    const volumeValue = document.getElementById(`${descriptor.prefix}-volume-value`);
    const lfoRateSlider = document.getElementById(`${descriptor.prefix}-lfo-rate`);
    const lfoRateValue = document.getElementById(`${descriptor.prefix}-lfo-rate-value`);
    const lfoDepthSlider = document.getElementById(`${descriptor.prefix}-lfo-depth`);
    const lfoDepthValue = document.getElementById(`${descriptor.prefix}-lfo-depth-value`);
    const lfoToggle = document.getElementById(`${descriptor.prefix}-lfo-toggle`);
    const waveButtonsContainer = document.querySelector(`.wave-buttons[data-wave-group="${descriptor.prefix}"]`);
    const toggleButton = document.getElementById(`${descriptor.prefix}-toggle`);
    if (
      !pitchSlider ||
      !pitchValue ||
      !volumeSlider ||
      !volumeValue ||
      !lfoRateSlider ||
      !lfoRateValue ||
      !lfoDepthSlider ||
      !lfoDepthValue ||
      !lfoToggle ||
      !waveButtonsContainer ||
      !toggleButton
    ) {
      return null;
    }

    const waveButtons = Array.from(waveButtonsContainer.querySelectorAll('button'));

    return {
      prefix: descriptor.prefix,
      defaults: descriptor.defaults,
      pitchSlider,
      pitchValue,
      volumeSlider,
      volumeValue,
      lfoRateSlider,
      lfoRateValue,
      lfoDepthSlider,
      lfoDepthValue,
      lfoToggle,
      waveButtons,
      oscillator: null,
      gainNode: null,
      lfo: null,
      lfoGain: null,
      toggleButton,
      playing: false,
    };
  });

  if (vcos.some((entry) => entry === null)) return;

  const CROSS_MOD_MAX = 220;
  let audioCtx;
  let crossGain;
  let started = false;

  const ensureAudio = () => {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    crossGain = audioCtx.createGain();

    vcos.forEach((state, index) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = Number(state.pitchSlider.value);
      gainNode.gain.value = 0;

      lfo.type = 'sine';
      lfo.frequency.value = Number(state.lfoRateSlider.value);
      lfoGain.gain.value = state.lfoToggle.checked ? Number(state.lfoDepthSlider.value) : 0;

      oscillator.connect(gainNode).connect(audioCtx.destination);
      lfo.connect(lfoGain).connect(oscillator.frequency);

      state.oscillator = oscillator;
      state.gainNode = gainNode;
      state.lfo = lfo;
      state.lfoGain = lfoGain;

      state.waveButtons.forEach((button) => {
        if (button.classList.contains('active')) {
          oscillator.type = button.dataset.wave;
        }
        button.addEventListener('click', () => {
          state.waveButtons.forEach((btn) => btn.classList.remove('active'));
          button.classList.add('active');
          oscillator.type = button.dataset.wave;
        });
      });

    });

    if (vcos[1] && vcos[0]) {
      const v1 = vcos[0];
      const v2 = vcos[1];
      crossGain.disconnect();
      v2.oscillator.connect(crossGain);
      crossGain.connect(v1.oscillator.frequency);
    }

    updateCrossMod();
  };

  const startOscillators = () => {
    if (started) return;
    vcos.forEach((state) => {
      state.oscillator.start();
      state.lfo.start();
    });
    started = true;
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
      const target = state.playing ? value : 0;
      state.gainNode.gain.setTargetAtTime(target, audioCtx.currentTime, 0.02);
    }
  };

  const updateLfoRate = (state) => {
    const rate = Number(state.lfoRateSlider.value);
    state.lfoRateValue.textContent = `${rate.toFixed(1)} Hz`;
    if (state.lfo && audioCtx) {
      state.lfo.frequency.setTargetAtTime(rate, audioCtx.currentTime, 0.05);
    }
  };

  const updateLfoDepth = (state) => {
    const depth = Number(state.lfoDepthSlider.value);
    state.lfoDepthValue.textContent = `${depth} Hz`;
    if (state.lfoGain && audioCtx) {
      const target = state.lfoToggle.checked ? depth : 0;
      state.lfoGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.05);
    }
  };

  const updateLfoToggle = (state) => {
    if (state.lfoGain && audioCtx) {
      const depth = Number(state.lfoDepthSlider.value);
      const target = state.lfoToggle.checked ? depth : 0;
      state.lfoGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.05);
    }
  };

  function updateCrossMod() {
    const amount = Number(crossModSlider.value);
    crossModValue.textContent = `${Math.round(amount * 100)}%`;
    if (crossGain && audioCtx) {
      crossGain.gain.setTargetAtTime(amount * CROSS_MOD_MAX, audioCtx.currentTime, 0.05);
    }
  };

  crossModSlider.addEventListener('input', updateCrossMod);

  const setPlaying = (state, shouldPlay) => {
    state.playing = shouldPlay;
    updateVolume(state);
    if (state.toggleButton) {
      state.toggleButton.textContent = shouldPlay
        ? `Stop ${state.prefix.toUpperCase()}`
        : `Start ${state.prefix.toUpperCase()}`;
    }
  };

  vcos.forEach((state) => {
    state.pitchSlider.addEventListener('input', () => updatePitch(state));
    state.volumeSlider.addEventListener('input', () => updateVolume(state));
    state.lfoRateSlider.addEventListener('input', () => updateLfoRate(state));
    state.lfoDepthSlider.addEventListener('input', () => updateLfoDepth(state));
    state.lfoToggle.addEventListener('change', () => updateLfoToggle(state));
    state.toggleButton.addEventListener('click', async () => {
      ensureAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      startOscillators();
      setPlaying(state, !state.playing);
    });
  });

  updateCrossMod();
  vcos.forEach((state) => {
    updatePitch(state);
    updateVolume(state);
    updateLfoRate(state);
    updateLfoDepth(state);
    setPlaying(state, false);
  });
})();
