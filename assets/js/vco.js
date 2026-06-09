(function () {
  const vcoDescriptors = [
    { prefix: 'vco1' },
    { prefix: 'vco2' },
  ];

  const crossModSlider = document.getElementById('cross-mod');
  const crossModValue = document.getElementById('cross-mod-value');
  if (!crossModSlider || !crossModValue) return;

  const syncToggle = document.getElementById('vco2-sync-toggle');

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
      toggleButton,
      gainNode: null,
      oscillator: null,
      lfo: null,
      lfoGain: null,
      playing: false,
      lfoStarted: false,
    };
  });

  if (vcos.some((entry) => entry === null)) return;

  const CROSS_MOD_MAX = 220;
  let audioCtx;
  let crossGain;
  let syncTimer = null;

  const ensureAudio = () => {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    crossGain = audioCtx.createGain();

    vcos.forEach((state) => {
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(audioCtx.destination);

      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();

      lfo.type = 'sine';
      lfo.frequency.value = Number(state.lfoRateSlider.value);
      lfoGain.gain.value = state.lfoToggle.checked ? Number(state.lfoDepthSlider.value) : 0;

      lfo.connect(lfoGain);

      state.gainNode = gainNode;
      state.lfo = lfo;
      state.lfoGain = lfoGain;
    });
  };

  const getActiveWave = (state) => {
    const active = state.waveButtons.find((btn) => btn.classList.contains('active'));
    return (active && active.dataset.wave) || 'sine';
  };

  const setupCrossModRouting = () => {
    if (!crossGain || !audioCtx) return;
    crossGain.disconnect();
    if (vcos[1].oscillator) {
      vcos[1].oscillator.connect(crossGain);
    }
    if (vcos[0].oscillator) {
      crossGain.connect(vcos[0].oscillator.frequency);
    }
  };

  const recreateOscillator = (state) => {
    if (!audioCtx || !state.gainNode) return;
    if (state.oscillator) {
      try {
        state.oscillator.stop();
      } catch (error) {
        // ignored
      }
      state.oscillator.disconnect();
    }

    const oscillator = audioCtx.createOscillator();
    oscillator.type = getActiveWave(state);
    oscillator.frequency.setValueAtTime(Number(state.pitchSlider.value), audioCtx.currentTime);

    oscillator.connect(state.gainNode);
    state.lfoGain.disconnect();
    state.lfoGain.connect(oscillator.frequency);

    state.oscillator = oscillator;
    oscillator.start();

    setupCrossModRouting();
  };

  const startLfo = (state) => {
    if (!state.lfoStarted) {
      state.lfo.start();
      state.lfoStarted = true;
    }
  };

  const updatePitch = (state) => {
    const freq = Number(state.pitchSlider.value);
    state.pitchValue.textContent = `${Math.round(freq)} Hz`;
    if (state.oscillator && audioCtx) {
      state.oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
    }
    if (state.prefix === 'vco1') {
      scheduleSync();
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
    if (state.prefix === 'vco1') {
      scheduleSync();
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

  const updateCrossMod = () => {
    const amount = Number(crossModSlider.value);
    crossModValue.textContent = `${Math.round(amount * 100)}%`;
    if (crossGain && audioCtx) {
      crossGain.gain.setTargetAtTime(amount * CROSS_MOD_MAX, audioCtx.currentTime, 0.05);
    }
  };

  const clearSync = () => {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
  };

  const resetVco2Cycle = () => {
    if (!syncToggle?.checked || !vcos[0].playing || !vcos[1].playing) {
      return;
    }
    recreateOscillator(vcos[1]);
    setPlaying(vcos[1], true);
  };

  const scheduleSync = () => {
    clearSync();
    if (
      !syncToggle?.checked ||
      !vcos[0].playing ||
      !vcos[1].playing ||
      !vcos[0].oscillator ||
      !audioCtx
    ) {
      return;
    }

    const freq = Math.max(Number(vcos[0].pitchSlider.value), 0.1);
    const period = 1 / freq;
    syncTimer = setTimeout(() => {
      resetVco2Cycle();
      scheduleSync();
    }, period * 1000);
  };

  const setPlaying = (state, shouldPlay) => {
    state.playing = shouldPlay;
    if (shouldPlay) {
      ensureAudio();
      startLfo(state);
      recreateOscillator(state);
    }
    updateVolume(state);
    if (state.toggleButton) {
      state.toggleButton.textContent = shouldPlay
        ? `Stop ${state.prefix.toUpperCase()}`
        : `Start ${state.prefix.toUpperCase()}`;
    }
    if (shouldPlay) {
      scheduleSync();
    } else {
      clearSync();
    }
  };

  crossModSlider.addEventListener('input', updateCrossMod);

  vcos.forEach((state) => {
    state.pitchSlider.addEventListener('input', () => updatePitch(state));
    state.volumeSlider.addEventListener('input', () => updateVolume(state));
    state.lfoRateSlider.addEventListener('input', () => updateLfoRate(state));
    state.lfoDepthSlider.addEventListener('input', () => updateLfoDepth(state));
    state.lfoToggle.addEventListener('change', () => updateLfoToggle(state));

    state.waveButtons.forEach((button) => {
      button.addEventListener('click', () => {
        state.waveButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        if (state.oscillator) {
          state.oscillator.type = button.dataset.wave;
        }
      });
    });

    state.toggleButton.addEventListener('click', async () => {
      ensureAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      setPlaying(state, !state.playing);
    });
  });

  syncToggle?.addEventListener('change', () => {
    scheduleSync();
  });

  updateCrossMod();
  vcos.forEach((state) => {
    updatePitch(state);
    updateVolume(state);
    updateLfoRate(state);
    updateLfoDepth(state);
  });
})();
