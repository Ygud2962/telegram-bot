(function () {
  function createInitialState() {
    return {
  activeTab: "map",
  sync: "mock",
  credits: 12430,
  energy: 8,
  energyMax: 12,
  socLevel: 4,
  rank: 128,
  keys: 2,
  cleanFragments: 0,
  gacha: { rarePity: 0, epicPity: 0, legendaryPity: 0, openCount: 0 },
  shopProducts: [],
  payments: [],
  busyProducts: new Set(),
  busyTools: new Set(),
  content: {
    cardsById: {},
    toolsById: {},
    mapById: {},
  },
  map: [
    { id: "school", name: "Школа", x: 82, y: 72, state: "protected", level: 4 },
    { id: "wifi", name: "Wi-Fi узел", x: 238, y: 72, state: "under_attack", level: 2 },
    { id: "library", name: "Библиотека", x: 145, y: 160, state: "protected", level: 3 },
    { id: "media", name: "Медиа-класс", x: 300, y: 176, state: "infected", level: 1 },
    { id: "soc", name: "SOC HQ", x: 224, y: 238, state: "protected", level: 5 },
  ],
  threats: [
    {
      id: "threat_wifi",
      title: "Пакетный шторм у Wi-Fi",
      objectId: "wifi",
      type: "DDoS noise",
      game: "Packet Rain",
      timer: "03:12:44",
      difficulty: 3,
    },
    {
      id: "threat_media",
      title: "Фишинговая Маска в медиа-классе",
      objectId: "media",
      type: "Phishing",
      game: "Phishing Stream",
      timer: "11:20:08",
      difficulty: 2,
    },
  ],
  cards: [
    { id: "card_001", name: "Фишинговая Маска", rarity: "common", level: 2 },
    { id: "card_002", name: "Пакетный Шум", rarity: "common", level: 1 },
    { id: "card_006", name: "QR-Мираж", rarity: "rare", level: 1 },
    { id: "card_010", name: "Wi-Fi Phantom", rarity: "legendary", level: 1 },
  ],
  tools: [
    { id: "tool_scanner", name: "Pulse Scanner", className: "Scanner", level: 2, equipped: true, slotIndex: 1 },
    { id: "tool_firewall", name: "Glass Firewall", className: "Firewall", level: 1, equipped: true, slotIndex: 2 },
    { id: "tool_crypto", name: "Shift Dial", className: "Crypto", level: 1, equipped: false, slotIndex: null },
  ],
    };
  }

  window.ZDNETMockState = { createInitialState };
}());
