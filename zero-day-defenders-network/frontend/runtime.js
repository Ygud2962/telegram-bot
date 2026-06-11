(function () {
  const tg = window.Telegram?.WebApp;
  const apiBase = window.ZDNET_CONFIG?.apiBase || localStorage.getItem("ZDNET_API_BASE") || "http://localhost:8090";

  function setupTelegram() {
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#050607");
    tg.setBackgroundColor?.("#050607");
  }

  function createHaptics() {
    return {
      light() {
        tg?.HapticFeedback?.impactOccurred?.("light");
      },
      ok() {
        tg?.HapticFeedback?.notificationOccurred?.("success");
      },
      warn() {
        tg?.HapticFeedback?.notificationOccurred?.("warning");
      },
      error() {
        tg?.HapticFeedback?.notificationOccurred?.("error");
      },
    };
  }

  window.ZDNETRuntime = {
    tg,
    apiBase,
    setupTelegram,
    createHaptics,
  };
}());
