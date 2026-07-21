(function () {
  function initFilter() {
    if (document.body.dataset.page !== 'downloads') return;

    const baseFreqSlider = document.getElementById('filter-base-frequency');
    const baseFreqValue = document.getElementById('filter-base-frequency-value');
    const resonanceSlider = document.getElementById('filter-resonance');
    const resonanceValue = document.getElementById('filter-resonance-value');
    const intensitySlider = document.getElementById('filter-intensity');
    const intensityValue = document.getElementById('filter-intensity-value');
    const glideDepthSlider = document.getElementById('filter-glide-depth');
    const glideDepthValue = document.getElementById('filter-glide-depth-value');
    const lfoRateSlider = document.getElementById('filter-lfo-rate');
    const lfoRateValue = document.getElementById('filter-lfo-rate-value');
    const shoutRateSlider = document.getElementById('filter-shout-rate');
    const shoutRateValue = document.getElementById('filter-shout-rate-value');
    const startButton = document.getElementById('filter-start');
    const shoutButton = document.getElementById('filter-burst');
    const stateLabel = document.getElementById('filter-state');

    if (
      !baseFreqSlider ||
      !resonanceSlider ||
      !intensitySlider ||
      !glideDepthSlider ||
      !lfoRateSlider ||
      !shoutRateSlider ||
      !startButton ||
      !shoutButton ||
      !stateLabel
    ) {
      return;
    }

    let ctx;
    let noiseNode;
    let noiseGain;
    let filter;
    let envelopeGain;
    let lfo;
    let lfoGain;
    let running = false;
    let lfsrState = 0xACE1;
    let autoShoutId = null;
    let intensityValueCache = Number(intensitySlider.value);

    const updateSliderLabel = (label, value, suffix = '', decimals = 0, suffixSpace = true) => {
      if (!label) return;
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        label.textContent = '—';
        return;
      }
      const formatted = decimals ? numericValue.toFixed(decimals) : Math.round(numericValue);
      if (!suffix) {
        label.textContent = `${formatted}`;
        return;
      }
      label.textContent = suffixSpace ? `${formatted} ${suffix}` : `${formatted}${suffix}`;
    };

    const stepLfsr = () => {
      const taps = ((lfsrState >> 0) ^ (lfsrState >> 2) ^ (lfsrState >> 3) ^ (lfsrState >> 5)) & 1;
      lfsrState = (lfsrState >> 1) | (taps << 15);
      return (lfsrState & 1) ? 1 : -1;
    };

    const ensureAudio = () => {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = Number(baseFreqSlider.value);
      filter.Q.value = Number(resonanceSlider.value);

      noiseGain = ctx.createGain();
      noiseGain.gain.value = intensityValueCache;

      envelopeGain = ctx.createGain();
      envelopeGain.gain.value = 0.0001;

      noiseNode = ctx.createScriptProcessor(512, 0, 1);
      noiseNode.onaudioprocess = (event) => {
        const output = event.outputBuffer.getChannelData(0);
        const gain = intensityValueCache;
        for (let i = 0; i < output.length; i++) {
          output[i] = stepLfsr() * gain;
        }
      };

      lfo = ctx.createOscillator();
      lfo.type = 'triangle';
      lfo.frequency.value = Number(lfoRateSlider.value);
      lfoGain = ctx.createGain();
      lfoGain.gain.value = Number(glideDepthSlider.value) * 800;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      noiseNode.connect(noiseGain);
      noiseGain.connect(filter);
      filter.connect(envelopeGain);
      envelopeGain.connect(ctx.destination);
    };

    const updateLfoRate = () => {
      if (!ctx || !lfo) return;
      lfo.frequency.setTargetAtTime(Number(lfoRateSlider.value), ctx.currentTime, 0.02);
    };

    const updateGlideDepth = () => {
      if (!ctx || !lfoGain) return;
      lfoGain.gain.setTargetAtTime(Number(glideDepthSlider.value) * 800, ctx.currentTime, 0.02);
    };

    const startAutoShout = () => {
      stopAutoShout();
      const rate = Math.max(0.4, Number(shoutRateSlider.value));
      autoShoutId = window.setInterval(triggerShout, 1000 / rate);
    };

    const stopAutoShout = () => {
      if (autoShoutId) {
        window.clearInterval(autoShoutId);
        autoShoutId = null;
      }
    };

    const triggerShout = () => {
      if (!ctx || !envelopeGain || !filter) return;
      const now = ctx.currentTime;
      const baseFreq = Number(baseFreqSlider.value);
      const chaos = Math.random() * 0.5;
      const peak = baseFreq + baseFreq * (0.25 + chaos);

      envelopeGain.gain.cancelScheduledValues(now);
      envelopeGain.gain.setValueAtTime(0.0001, now);
      envelopeGain.gain.linearRampToValueAtTime(1, now + 0.04);
      envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4 + chaos);

      filter.frequency.cancelScheduledValues(now);
      filter.frequency.setTargetAtTime(baseFreq, now, 0.03);
      filter.frequency.setTargetAtTime(peak, now + 0.1, 0.3 + chaos);
      filter.frequency.setTargetAtTime(baseFreq, now + 0.35 + chaos, 1.5);
    };

    const resumeContext = async () => {
      ensureAudio();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
    };

    const updateStateLabel = (text) => {
      stateLabel.textContent = text;
    };

    const setRunning = async (shouldRun) => {
      if (shouldRun === running) return;
      if (shouldRun) {
        startButton.textContent = 'Mute Filter';
        await resumeContext();
        running = true;
        updateStateLabel('Ready to roar');
        startAutoShout();
        triggerShout();
      } else {
        startButton.textContent = 'Awaken Filter';
        running = false;
        updateStateLabel('Dormant');
        stopAutoShout();
        if (envelopeGain) {
          const now = ctx.currentTime;
          envelopeGain.gain.cancelScheduledValues(now);
          envelopeGain.gain.setTargetAtTime(0.0001, now + 0.02);
        }
      }
    };

    startButton.addEventListener('click', () => {
      setRunning(!running);
    });

    shoutButton.addEventListener('click', async () => {
      await resumeContext();
      triggerShout();
    });

    baseFreqSlider.addEventListener('input', () => {
      updateSliderLabel(baseFreqValue, Number(baseFreqSlider.value), 'Hz');
      if (filter && ctx) {
        filter.frequency.cancelScheduledValues(ctx.currentTime);
        filter.frequency.setTargetAtTime(Number(baseFreqSlider.value), ctx.currentTime, 0.05);
      }
    });

    resonanceSlider.addEventListener('input', () => {
      updateSliderLabel(resonanceValue, Number(resonanceSlider.value));
      if (filter && ctx) {
        filter.Q.setTargetAtTime(Number(resonanceSlider.value), ctx.currentTime, 0.02);
      }
    });

    intensitySlider.addEventListener('input', () => {
      const value = Number(intensitySlider.value);
      const percentage = value * 100;
      intensityValueCache = value;
      updateSliderLabel(intensityValue, percentage, '%', 0, false);
      if (noiseGain) {
        noiseGain.gain.setTargetAtTime(value, ctx.currentTime, 0.02);
      }
    });

    glideDepthSlider.addEventListener('input', () => {
      const percentage = Number(glideDepthSlider.value) * 100;
      updateSliderLabel(glideDepthValue, percentage, '%', 0, false);
      updateGlideDepth();
    });

    lfoRateSlider.addEventListener('input', () => {
      updateSliderLabel(lfoRateValue, Number(lfoRateSlider.value), 'Hz', 1);
      updateLfoRate();
    });

    shoutRateSlider.addEventListener('input', () => {
      updateSliderLabel(shoutRateValue, Number(shoutRateSlider.value), '/s', 1);
      if (running) {
        startAutoShout();
      }
    });

    updateSliderLabel(baseFreqValue, Number(baseFreqSlider.value), 'Hz');
    updateSliderLabel(resonanceValue, Number(resonanceSlider.value));
    updateSliderLabel(intensityValue, Number(intensitySlider.value) * 100, '%', 0, false);
    updateSliderLabel(glideDepthValue, Number(glideDepthSlider.value) * 100, '%', 0, false);
    updateSliderLabel(lfoRateValue, Number(lfoRateSlider.value), 'Hz', 1);
    updateSliderLabel(shoutRateValue, Number(shoutRateSlider.value), '/s', 1);
  }

  document.addEventListener('DOMContentLoaded', initFilter);
})();
