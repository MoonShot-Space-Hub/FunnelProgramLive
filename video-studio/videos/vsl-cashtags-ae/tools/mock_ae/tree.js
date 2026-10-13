// Property tree of the After Effects scripting DOM, by matchName, for the parts the
// interpreter touches (and their real siblings, so a wrong parent is caught).
//
// A definition is one of:
//   prop(name, pvt, dflt, opts)  leaf property. opts: min, max, integer, checkbox, units, enumMax
//   named(name, [[mn, def], ...], opts)   fixed children, looked up by matchName or index
//   indexed(name, [addable mn, ...], opts)  children created with addProperty(mn)
// Addable items are defined in ADDABLE (matchName -> def). A matchName that is real in AE but
// not modelled here is listed in KNOWN_UNMODELLED so the error says "not modelled" rather than
// "unknown matchName".

export const PVT = {
  NO_VALUE: 6412, ThreeD_SPATIAL: 6413, ThreeD: 6414, TwoD_SPATIAL: 6415, TwoD: 6416, OneD: 6417,
  COLOR: 6418, CUSTOM_VALUE: 6419, MARKER: 6420, LAYER_INDEX: 6421, MASK_INDEX: 6422, SHAPE: 6423,
  TEXT_DOCUMENT: 6424,
};
export const PVT_NAME = Object.fromEntries(Object.entries(PVT).map(([k, v]) => [v, k]));
export const PT = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };

const prop = (name, pvt, dflt, o = {}) => ({ kind: 'prop', name, pvt, dflt, ...o });
const one = (name, dflt, o = {}) => prop(name, PVT.OneD, dflt, o);
const popup = (name, dflt, n) => prop(name, PVT.OneD, dflt, { min: 1, max: n, integer: true });
const checkbox = (name, dflt) => prop(name, PVT.OneD, dflt, { min: 0, max: 1, checkbox: true });
const color = (name, dflt) => prop(name, PVT.COLOR, dflt);
const named = (name, children, o = {}) => ({ kind: 'named', name, children, ...o });
const indexed = (name, addable, o = {}) => ({ kind: 'indexed', name, addable, ...o });

const BLEND = popup('Blend Mode', 1, 40);

export const VECTOR_ADDABLE = [
  'ADBE Vector Group', 'ADBE Vector Shape - Rect', 'ADBE Vector Shape - Ellipse', 'ADBE Vector Shape - Star',
  'ADBE Vector Shape - Group', 'ADBE Vector Graphic - Fill', 'ADBE Vector Graphic - Stroke',
  'ADBE Vector Graphic - G-Fill', 'ADBE Vector Graphic - G-Stroke', 'ADBE Vector Filter - Merge',
  'ADBE Vector Filter - Offset', 'ADBE Vector Filter - PB', 'ADBE Vector Filter - Repeater',
  'ADBE Vector Filter - RC', 'ADBE Vector Filter - Trim', 'ADBE Vector Filter - Twist',
  'ADBE Vector Filter - Wiggler', 'ADBE Vector Filter - Zigzag',
];
export const EFFECT_ADDABLE = ['ADBE Drop Shadow', 'ADBE Gaussian Blur 2', 'ADBE Fill', 'ADBE Slider Control', 'ADBE Tint', 'ADBE Glo2'];
export const TEXT_ANIMATOR_PROPS = [
  'ADBE Text Anchor Point 3D', 'ADBE Text Position 3D', 'ADBE Text Scale 3D', 'ADBE Text Skew', 'ADBE Text Skew Axis',
  'ADBE Text Rotation', 'ADBE Text Opacity', 'ADBE Text Fill Color', 'ADBE Text Stroke Color', 'ADBE Text Fill Hue',
  'ADBE Text Fill Saturation', 'ADBE Text Fill Brightness', 'ADBE Text Fill Opacity', 'ADBE Text Stroke Opacity',
  'ADBE Text Stroke Width', 'ADBE Text Line Spacing', 'ADBE Text Character Offset', 'ADBE Text Tracking Amount',
  'ADBE Text Blur',
];

export const ADDABLE = {
  // ---- shape layer contents
  'ADBE Vector Group': named('Group', [
    ['ADBE Vector Blend Mode', BLEND],
    ['ADBE Vectors Group', indexed('Contents', VECTOR_ADDABLE)],
    ['ADBE Vector Transform Group', named('Transform', [
      ['ADBE Vector Anchor', prop('Anchor Point', PVT.TwoD_SPATIAL, [0, 0])],
      ['ADBE Vector Position', prop('Position', PVT.TwoD_SPATIAL, [0, 0])],
      ['ADBE Vector Scale', prop('Scale', PVT.TwoD, [100, 100])],
      ['ADBE Vector Skew', one('Skew', 0, { min: -85, max: 85 })],
      ['ADBE Vector Skew Axis', one('Skew Axis', 0)],
      ['ADBE Vector Rotation', one('Rotation', 0)],
      ['ADBE Vector Group Opacity', one('Opacity', 100, { min: 0, max: 100 })],
    ])],
  ], { renamable: true }),
  'ADBE Vector Shape - Rect': named('Rectangle Path', [
    ['ADBE Vector Shape Direction', popup('Path Direction', 1, 3)],
    ['ADBE Vector Rect Size', prop('Size', PVT.TwoD, [100, 100], { min: 0 })],
    ['ADBE Vector Rect Position', prop('Position', PVT.TwoD_SPATIAL, [0, 0])],
    ['ADBE Vector Rect Roundness', one('Roundness', 0, { min: 0 })],
  ], { renamable: true, vectorRole: 'shape' }),
  'ADBE Vector Shape - Ellipse': named('Ellipse Path', [
    ['ADBE Vector Shape Direction', popup('Path Direction', 1, 3)],
    ['ADBE Vector Ellipse Size', prop('Size', PVT.TwoD, [100, 100], { min: 0 })],
    ['ADBE Vector Ellipse Position', prop('Position', PVT.TwoD_SPATIAL, [0, 0])],
  ], { renamable: true, vectorRole: 'shape' }),
  'ADBE Vector Shape - Group': named('Path', [
    ['ADBE Vector Shape Direction', popup('Path Direction', 1, 3)],
    ['ADBE Vector Shape', prop('Path', PVT.SHAPE, null)],
  ], { renamable: true, vectorRole: 'shape' }),
  'ADBE Vector Filter - Trim': named('Trim Paths', [
    ['ADBE Vector Trim Start', one('Start', 0, { min: 0, max: 100 })],
    ['ADBE Vector Trim End', one('End', 100, { min: 0, max: 100 })],
    ['ADBE Vector Trim Offset', one('Offset', 0)],
    ['ADBE Vector Trim Type', popup('Trim Multiple Shapes', 1, 2)],
  ], { renamable: true, vectorRole: 'trim' }),
  'ADBE Vector Graphic - Stroke': named('Stroke', [
    ['ADBE Vector Blend Mode', BLEND],
    ['ADBE Vector Composite Order', popup('Composite', 1, 2)],
    ['ADBE Vector Stroke Color', color('Color', [1, 1, 1])],
    ['ADBE Vector Stroke Opacity', one('Opacity', 100, { min: 0, max: 100 })],
    ['ADBE Vector Stroke Width', one('Stroke Width', 2, { min: 0, max: 1000 })],
    ['ADBE Vector Stroke Line Cap', popup('Line Cap', 1, 3)],
    ['ADBE Vector Stroke Line Join', popup('Line Join', 1, 3)],
    ['ADBE Vector Stroke Miter Limit', one('Miter Limit', 4, { min: 1, max: 100 })],
    ['ADBE Vector Stroke Dashes', indexed('Dashes', [])],
  ], { renamable: true, vectorRole: 'stroke' }),
  'ADBE Vector Graphic - Fill': named('Fill', [
    ['ADBE Vector Blend Mode', BLEND],
    ['ADBE Vector Composite Order', popup('Composite', 1, 2)],
    ['ADBE Vector Fill Rule', popup('Fill Rule', 1, 2)],
    ['ADBE Vector Fill Color', color('Color', [1, 0, 0])],
    ['ADBE Vector Fill Opacity', one('Opacity', 100, { min: 0, max: 100 })],
  ], { renamable: true, vectorRole: 'fill' }),

  // ---- effects (params are direct children of the effect, matchName "<effect>-000N")
  'ADBE Drop Shadow': named('Drop Shadow', [
    ['ADBE Drop Shadow-0001', color('Shadow Color', [0, 0, 0])],
    ['ADBE Drop Shadow-0002', one('Opacity', 127.5, { min: 0, max: 255 })],
    ['ADBE Drop Shadow-0003', one('Direction', 135)],
    ['ADBE Drop Shadow-0004', one('Distance', 5, { min: 0, max: 30000 })],
    ['ADBE Drop Shadow-0005', one('Softness', 0, { min: 0, max: 250 })],
    ['ADBE Drop Shadow-0006', checkbox('Shadow Only', 0)],
  ], { renamable: true, effect: true }),
  'ADBE Gaussian Blur 2': named('Gaussian Blur', [
    ['ADBE Gaussian Blur 2-0001', one('Blurriness', 0, { min: 0, max: 3000 })],
    ['ADBE Gaussian Blur 2-0002', popup('Blur Dimensions', 1, 3)],
    ['ADBE Gaussian Blur 2-0003', checkbox('Repeat Edge Pixels', 0)],
  ], { renamable: true, effect: true }),

  // ---- masks
  'ADBE Mask Atom': named('Mask', [
    ['ADBE Mask Shape', prop('Mask Path', PVT.SHAPE, null)],
    ['ADBE Mask Feather', prop('Mask Feather', PVT.TwoD, [0, 0], { min: 0 })],
    ['ADBE Mask Opacity', one('Mask Opacity', 100, { min: 0, max: 100 })],
    ['ADBE Mask Offset', one('Mask Expansion', 0)],
  ], { renamable: true, mask: true }),

  // ---- text animators
  'ADBE Text Animator': named('Animator', [
    ['ADBE Text Selectors', indexed('Selectors', ['ADBE Text Selector', 'ADBE Text Wiggly Selector', 'ADBE Text Expressible Selector'])],
    ['ADBE Text Animator Properties', indexed('Properties', TEXT_ANIMATOR_PROPS)],
  ], { renamable: true }),
  'ADBE Text Selector': named('Range Selector', [
    ['ADBE Text Percent Start', one('Start', 0, { min: 0, max: 100, units: 1 })],
    ['ADBE Text Percent End', one('End', 100, { min: 0, max: 100, units: 1 })],
    ['ADBE Text Percent Offset', one('Offset', 0, { min: -100, max: 100, units: 1 })],
    ['ADBE Text Index Start', one('Start', 0, { min: 0, units: 2 })],
    ['ADBE Text Index End', one('End', 1, { min: 0, units: 2 })],
    ['ADBE Text Index Offset', one('Offset', 0, { units: 2 })],
    ['ADBE Text Range Advanced', named('Advanced', [
      ['ADBE Text Range Units', popup('Units', 1, 2)],
      ['ADBE Text Range Type2', popup('Based On', 1, 4)],
      ['ADBE Text Selector Mode', popup('Mode', 1, 6)],
      ['ADBE Text Selector Max Amount', one('Amount', 100, { min: -100, max: 100 })],
      ['ADBE Text Range Shape', popup('Shape', 1, 6)],
      ['ADBE Text Selector Smoothness', one('Smoothness', 100, { min: 0, max: 100 })],
      ['ADBE Text Levels Max Ease', one('Ease High', 0, { min: -100, max: 100 })],
      ['ADBE Text Levels Min Ease', one('Ease Low', 0, { min: -100, max: 100 })],
      ['ADBE Text Randomize Order', checkbox('Randomize Order', 0)],
      ['ADBE Text Random Seed', one('Random Seed', 0)],
    ])],
  ], { renamable: true }),
  'ADBE Text Fill Color': color('Fill Color', [1, 0, 0]),
  'ADBE Text Stroke Color': color('Stroke Color', [1, 0, 0]),
  'ADBE Text Opacity': one('Opacity', 100, { min: 0, max: 100 }),
  'ADBE Text Tracking Amount': one('Tracking Amount', 0),
};

export const KNOWN_UNMODELLED = new Set([
  ...VECTOR_ADDABLE, ...EFFECT_ADDABLE, ...TEXT_ANIMATOR_PROPS,
  'ADBE Text Wiggly Selector', 'ADBE Text Expressible Selector', 'ADBE Time Remapping', 'ADBE Layer Styles',
  'ADBE Plane Options Group', 'ADBE Extrsn Options Group', 'ADBE Material Options Group', 'ADBE Effect Built In Params',
  'ADBE Orientation', 'ADBE Rotate X', 'ADBE Rotate Y', 'ADBE Position_0', 'ADBE Position_1', 'ADBE Position_2',
  'ADBE Envir Appear in Reflect', 'ADBE Vector Stroke Taper', 'ADBE Vector Stroke Wave', 'ADBE Vector Materials Group',
  'ADBE Text Path Options', 'ADBE Text More Options', 'ADBE Source Options', 'ADBE MTrackers', 'ADBE Data Group',
].filter((mn) => !(mn in ADDABLE)));

const AUDIO_GROUP = named('Audio', [
  ['ADBE Audio Levels', prop('Audio Levels', PVT.TwoD, [0, 0], { min: -192, max: 24 })],
]);

function transformGroup(anchor, position) {
  return named('Transform', [
    ['ADBE Anchor Point', prop('Anchor Point', PVT.ThreeD_SPATIAL, anchor)],
    ['ADBE Position', prop('Position', PVT.ThreeD_SPATIAL, position)],
    ['ADBE Scale', prop('Scale', PVT.ThreeD, [100, 100, 100])],
    ['ADBE Rotate Z', one('Rotation', 0)],
    ['ADBE Opacity', one('Opacity', 100, { min: 0, max: 100 })],
  ]);
}

// Root group of a layer. kind: 'shape' | 'text' | 'av'.
export function layerRootDef(kind, { hasVideo, hasAudio, anchor, position }) {
  const children = [['ADBE Marker', prop('Marker', PVT.MARKER, null)]];
  if (kind === 'text') {
    children.push(['ADBE Text Properties', named('Text', [
      ['ADBE Text Document', prop('Source Text', PVT.TEXT_DOCUMENT, null)],
      ['ADBE Text Path Options', named('Path Options', [])],
      ['ADBE Text More Options', named('More Options', [])],
      ['ADBE Text Animators', indexed('Animators', ['ADBE Text Animator'])],
    ])]);
  }
  if (kind === 'shape') children.push(['ADBE Root Vectors Group', indexed('Contents', VECTOR_ADDABLE)]);
  if (hasVideo) {
    children.push(['ADBE Mask Parade', indexed('Masks', ['ADBE Mask Atom'])]);
    children.push(['ADBE Effect Parade', indexed('Effects', EFFECT_ADDABLE)]);
    children.push(['ADBE Transform Group', transformGroup(anchor, position)]);
  }
  if (hasAudio) children.push(['ADBE Audio Group', AUDIO_GROUP]);
  return named('Layer', children);
}

// Every matchName the mock knows about (for "wrong parent" vs "unknown" messages).
export const ALL_MATCHNAMES = (() => {
  const s = new Set(KNOWN_UNMODELLED);
  const walk = (def) => {
    if (!def || def.kind === 'prop') return;
    if (def.kind === 'named') for (const [mn, d] of def.children) { s.add(mn); walk(d); }
  };
  for (const [mn, d] of Object.entries(ADDABLE)) { s.add(mn); walk(d); }
  walk(layerRootDef('text', { hasVideo: true, hasAudio: true, anchor: [0, 0, 0], position: [0, 0, 0] }));
  walk(layerRootDef('shape', { hasVideo: true, hasAudio: false, anchor: [0, 0, 0], position: [0, 0, 0] }));
  return s;
})();
