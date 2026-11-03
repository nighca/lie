// Role fan approved by the user's sketch. No file or rendering side effects on import.
const roles = [
  {
    "id": "coral-bob",
    "state": "default",
    "tier": "center",
    "x": 588.6234817813765,
    "y": 235,
    "width": 102.75303643724696,
    "height": 180
  },
  {
    "id": "coral-bob",
    "state": "listening",
    "tier": "inner",
    "x": 321.4360418342719,
    "y": 285,
    "width": 87.12791633145615,
    "height": 150
  },
  {
    "id": "coral-bob",
    "state": "waiting",
    "tier": "inner",
    "x": 447.19709208400644,
    "y": 370,
    "width": 75.60581583198707,
    "height": 150
  },
  {
    "id": "coral-bob",
    "state": "speaking",
    "tier": "inner",
    "x": 590.125303152789,
    "y": 422.5,
    "width": 99.74939369442198,
    "height": 135
  },
  {
    "id": "coral-bob",
    "state": "accused-correctly",
    "tier": "inner",
    "x": 748.625,
    "y": 370,
    "width": 92.75,
    "height": 150
  },
  {
    "id": "coral-bob",
    "state": "accused-wrongly",
    "tier": "inner",
    "x": 861.2947543713572,
    "y": 285,
    "width": 107.4104912572856,
    "height": 150
  },
  {
    "id": "sunny-moustache",
    "state": "speaking",
    "tier": "outer",
    "x": 93.45779220779221,
    "y": 365,
    "width": 83.08441558441558,
    "height": 120
  },
  {
    "id": "blue-glasses",
    "state": "listening",
    "tier": "outer",
    "x": 233.11793214862683,
    "y": 475,
    "width": 73.76413570274636,
    "height": 120
  },
  {
    "id": "silver-bun",
    "state": "accused-wrongly",
    "tier": "outer",
    "x": 403.8449111470113,
    "y": 550,
    "width": 72.31017770597738,
    "height": 120
  },
  {
    "id": "salt-pepper-beard",
    "state": "waiting",
    "tier": "outer",
    "x": 610.0831980519481,
    "y": 562.5,
    "width": 59.833603896103895,
    "height": 115
  },
  {
    "id": "plum-crop",
    "state": "accused-correctly",
    "tier": "outer",
    "x": 803.8064516129032,
    "y": 550,
    "width": 72.38709677419355,
    "height": 120
  },
  {
    "id": "mint-puffs",
    "state": "speaking",
    "tier": "outer",
    "x": 975.2606255012029,
    "y": 475,
    "width": 69.47874899759422,
    "height": 120
  },
  {
    "id": "ochre-freckles",
    "state": "default",
    "tier": "outer",
    "x": 1109.473049074819,
    "y": 365,
    "width": 71.05390185036202,
    "height": 120
  }
];

export async function drawRoleFan(s, { img, portrait }) {
  for (const role of roles) {
    const file = await portrait(role.id, role.state);
    await img(s, file, role.x, role.y, role.width, role.height);
  }
  return roles.map((role) => ({ ...role }));
}
