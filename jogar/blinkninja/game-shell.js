(function () {
  function getDeviceScale() {
    return Math.max(1, window.devicePixelRatio || 1);
  }

  function updateCanvasResolution(canvas, stage) {
    if (!canvas || !stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const scale = getDeviceScale();
    const width = Math.max(1, Math.round(rect.width * scale));
    const height = Math.max(1, Math.round(rect.height * scale));

    canvas.style.width = `${Math.round(rect.width)}px`;
    canvas.style.height = `${Math.round(rect.height)}px`;

    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
  }

  function watchCanvas(canvas, stage) {
    if (!canvas || !stage) {
      return;
    }

    const sync = function () {
      updateCanvasResolution(canvas, stage);
    };

    sync();

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(sync);
      observer.observe(stage);
    }

    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('orientationchange', sync, { passive: true });
  }

  window.BlinkNinjaShell = {
    prepareCanvas: updateCanvasResolution,
    watchCanvas: watchCanvas
  };
}());