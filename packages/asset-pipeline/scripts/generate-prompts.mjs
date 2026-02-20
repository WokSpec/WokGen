import path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  ensureDir,
  exists,
  mulberry32,
  parseArgs,
  pickWeighted,
  readJson,
  writeJson,
  writeJsonl
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const catalog = await readJson('catalog.json');
const spec = await readJson('spec.json');

if (!Array.isArray(catalog.items) || catalog.items.length === 0) {
  throw new Error('catalog.json must include a non-empty `items` array');
}

const mode = String(args.mode ?? 'rotate');
if (!['rotate', 'random'].includes(mode)) {
  throw new Error('--mode must be rotate or random');
}

const count = Number(args.count ?? catalog.defaultBatchSize ?? 8);
if (!Number.isFinite(count) || count <= 0) {
  throw new Error('--count must be a positive number');
}

const seedBase = Number(args.seedBase ?? 1337);
const resetRotation = Boolean(args.resetRotation);
const categoryFilter = buildCategoryFilter(args, catalog.categories);
const filteredItems = catalog.items.filter((item) => categoryFilter.length === 0 || categoryFilter.includes(item.category));

if (!filteredItems.length) {
  throw new Error(`No items match category filter: ${categoryFilter.join(', ')}`);
}
if (count > filteredItems.length) {
  throw new Error(`--count (${count}) cannot exceed filtered catalog size (${filteredItems.length})`);
}

const statePath = path.resolve('.cache/prompt-rotation.json');
await ensureDir(path.dirname(statePath));
const state = (await exists(statePath)) && !resetRotation
  ? await readJson(statePath)
  : { filters: {}, run: 0 };

const filterKey = categoryFilter.length ? categoryFilter.slice().sort().join('|') : 'ALL';
const filterState = state.filters?.[filterKey] ?? { order: [], cursor: 0, epoch: 0 };
const rarities = Array.isArray(spec.rarities) && spec.rarities.length ? spec.rarities : [{ id: 'common', weight: 1 }];

const records = [];
if (mode === 'rotate') {
  rotateSelect(records, filteredItems, filterState, count, seedBase, rarities);
} else {
  randomSelect(records, filteredItems, count, seedBase + Number(state.run ?? 0), rarities);
}

state.filters = state.filters ?? {};
state.filters[filterKey] = filterState;
state.run = Number(state.run ?? 0) + 1;

await writeJson(statePath, state);
await fs.mkdir(path.resolve('prompts'), { recursive: true });
await writeJsonl(path.resolve('prompts/prompts.jsonl'), records);

const label = categoryFilter.length ? ` [${categoryFilter.join(', ')}]` : '';
console.log(`Wrote ${records.length} strict prompt records to prompts/prompts.jsonl${label} (${mode}, rotation ${filterState.cursor}/${filterState.order.length}, epoch ${filterState.epoch})`);

function rotateSelect(out, items, fState, targetCount, baseSeed, rarityList) {
  if (!Array.isArray(fState.order) || fState.order.length !== items.length) {
    fState.order = makeOrder(items, baseSeed + Number(fState.epoch ?? 0));
    fState.cursor = 0;
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const rand = mulberry32(baseSeed + Number(fState.epoch ?? 0) + Number(fState.cursor ?? 0));

  while (out.length < targetCount) {
    if (fState.cursor >= fState.order.length) {
      fState.epoch = Number(fState.epoch ?? 0) + 1;
      fState.order = makeOrder(items, baseSeed + Number(fState.epoch));
      fState.cursor = 0;
    }

    const id = fState.order[fState.cursor];
    fState.cursor += 1;
    const item = byId.get(id);
    if (!item) continue;

    const rarity = pickWeighted(rarityList, 'weight', rand).id;
    out.push(buildRecord(item, out.length, rarity));
  }
}

function randomSelect(out, items, targetCount, seed, rarityList) {
  const rand = mulberry32(seed);
  const pool = [...items];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  for (let i = 0; i < targetCount; i += 1) {
    const item = pool[i];
    const rarity = pickWeighted(rarityList, 'weight', rand).id;
    out.push(buildRecord(item, i, rarity));
  }
}

function buildRecord(item, index, rarity) {
  const descriptor = descriptorFor(item);
  const rarityCue = rarityDescriptor(rarity);
  const styleCue = styleDescriptorForCategory(item.category);
  const poseCue = poseDescriptorForCategory(item.category);
  const variantCue = variantDescriptor(item.id, item.category, item.icon_key);
  const backgroundCue = 'transparent background, no scene, no floor, no character, no text';
  const id = item.id;
  const stableSeed = seedFromId(id, seedBase + Number(state.run ?? 0) * 10000 + index);
  return {
    id,
    category: item.category,
    rarity,
    item: item.name,
    asset_type: item.icon_key,
    descriptor,
    strict_rules: [
      'single object icon',
      'centered silhouette',
      'transparent background',
      'clean readable shape at 32x32'
    ],
    prompt: [
      'high quality game inventory icon illustration',
      `${item.name}, ${descriptor}`,
      styleCue,
      poseCue,
      variantCue,
      rarityCue,
      'orthographic or near-orthographic single-object composition',
      'high shape clarity, clean readable silhouette, crisp edge grouping',
      'top-left key light with subtle shadow',
      backgroundCue
    ].join(', '),
    negative_prompt: [
      'photoreal, 3d render, painterly, blurry, muddy',
      'multiple objects, hands, person, creature unless item is an animal',
      'text, letters, logos, watermark, signature',
      'busy background, scene, landscape, room background',
      'micro detail noise, dithering noise, compression artifacts'
    ].join(', '),
    seed: stableSeed
  };
}

function makeOrder(items, seed) {
  const ids = items.map((x) => x.id);
  const rand = mulberry32(seed);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = ids[i];
    ids[i] = ids[j];
    ids[j] = tmp;
  }
  return ids;
}

function buildCategoryFilter(cliArgs, knownCategories) {
  const single = cliArgs.category ? [String(cliArgs.category)] : [];
  const multi = cliArgs.categories
    ? String(cliArgs.categories)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    : [];

  const merged = Array.from(new Set([...single, ...multi]));
  for (const c of merged) {
    if (!knownCategories.includes(c)) {
      throw new Error(`Unknown category: ${c}`);
    }
  }
  return merged;
}

function seedFromId(id, base) {
  let h = 2166136261 >>> 0;
  const s = String(id);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Number(base) + (h >>> 0)) >>> 0;
}

function descriptorFor(item) {
  const key = String(item.icon_key || '');
  const name = String(item.name || key).toLowerCase();
  const byKey = {
    sword: 'single straight steel blade, clear crossguard, wrapped grip, pommel',
    axe: 'single broad axe head on short haft',
    bow: 'curved bow frame with taut string',
    spear: 'long shaft with pointed spear tip',
    dagger: 'short blade with guard and compact handle',
    shield: 'front-facing shield plate with strong border',
    helmet: 'front-facing helmet shell and eye opening',
    armor: 'single chest armor plate, front view',
    potion_red: 'glass potion vial with cork, red liquid fill',
    potion_blue: 'glass potion vial with cork, blue liquid fill',
    table: 'simple wooden table silhouette, four-leg perspective',
    chair: 'chair with visible backrest and seat',
    sofa: 'two-seat sofa with armrests and cushion blocks',
    bed: 'single bed with pillow and blanket top',
    tv: 'flat screen television with stand',
    console: 'video game console body with visible controls',
    monitor: 'computer monitor rectangle with stand',
    laptop: 'open laptop with visible screen and keyboard base',
    phone: 'smartphone slab with screen and bezel',
    camera: 'camera body with circular lens center',
    guitar: 'acoustic guitar body and neck',
    piano: 'upright keyboard front with key row',
    violin: 'violin body with neck and scroll',
    fork: 'fork head with visible tines and handle',
    spoon: 'spoon bowl and handle',
    knife: 'kitchen knife blade and handle',
    chopsticks: 'pair of parallel chopsticks',
    bowl: 'round bowl top rim with depth',
    cup: 'cup with visible handle',
    pot: 'cooking pot with lid',
    pan: 'frying pan with handle',
    kettle: 'kettle body with spout and top handle',
    fridge: 'refrigerator with top/bottom door split',
    stove: 'stove top with burner marks',
    sink: 'kitchen sink basin with faucet',
    microwave: 'microwave with door and side controls',
    washer: 'front-load washing machine with round window',
    toilet: 'toilet side profile with tank and bowl',
    shower: 'shower fixture with shower head',
    chess_king: 'chess king piece with cross crown',
    chess_queen: 'chess queen piece with crown top',
    chess_rook: 'chess rook piece with castle top',
    chess_bishop: 'chess bishop piece with diagonal notch',
    chess_knight: 'chess knight piece with horse head',
    chess_pawn: 'chess pawn piece with round top',
    food_burger: 'burger with bun, patty, and filling layers',
    food_pizza: 'single pizza slice with crust and toppings',
    food_noodles: 'noodle bowl with visible noodle strands',
    food_sushi: 'single sushi roll cross section',
    food_steak: 'steak cut with fat cap detail',
    animal_cat: 'cat head icon with ears and whisker hints',
    animal_dog: 'dog head icon with floppy ears',
    animal_bird: 'bird side profile with beak and wing',
    vehicle_car: 'compact car side silhouette with two wheels',
    vehicle_truck: 'truck cabin and cargo body silhouette',
    vehicle_bus: 'bus side silhouette with window band',
    vehicle_bike: 'bicycle frame with two clear wheels',
    vehicle_plane: 'airplane top/side icon with wings and tail',
    vehicle_ship: 'boat hull with cabin or mast detail'
  };
  if (byKey[key]) return byKey[key];
  if (key.startsWith('food_')) {
    return `${humanizeKey(key.slice(5))} food item, appetizing shape clusters, clear edible silhouette`;
  }
  if (key.startsWith('animal_')) {
    return `${humanizeKey(key.slice(7))} animal icon, recognizable head and body profile`;
  }
  if (key.startsWith('plant_')) {
    return `${humanizeKey(key.slice(6))} plant icon, stem and leaf structure readable`;
  }
  if (key.startsWith('vehicle_')) {
    return `${humanizeKey(key.slice(8))} vehicle icon, chassis and motion parts clearly readable`;
  }
  if (key.startsWith('science_')) {
    return `${humanizeKey(key.slice(8))} science equipment icon with technical silhouette`;
  }
  if (key.startsWith('space_')) {
    return `${humanizeKey(key.slice(6))} space object icon with clear outline`;
  }
  if (key.startsWith('sports_')) {
    return `${humanizeKey(key.slice(7))} sports gear icon with clear functional parts`;
  }
  if (key.startsWith('medical_')) {
    return `${humanizeKey(key.slice(8))} medical item icon, sterile simple silhouette`;
  }
  if (key.startsWith('construction_')) {
    return `${humanizeKey(key.slice(13))} construction tool icon with readable grip and head`;
  }
  if (key.startsWith('room_')) {
    return `${humanizeKey(key.slice(5))} room symbol, compact isometric room marker icon`;
  }
  if (name.includes('fish')) return 'single fish side silhouette with fin and tail';
  if (name.includes('room')) return 'single room icon, compact layout cue';
  if (name.includes('seed')) return 'single seed icon with crisp oval silhouette';
  if (name.includes('badge') || name.includes('token')) return 'single emblem medallion icon';
  if (name.includes('sword')) return 'single blade icon, guard, grip, and pommel visible';
  if (name.includes('chair') || name.includes('sofa') || name.includes('table')) return 'single furniture icon with stable base and readable form';
  return `${name} object icon, single centered subject, readable silhouette with concrete physical details`;
}

function rarityDescriptor(rarity) {
  const id = String(rarity || 'common');
  if (id === 'legendary') return 'legendary quality trim, rare shine accent, premium craftsmanship';
  if (id === 'epic') return 'epic quality trim, ornate accent, rich contrast';
  if (id === 'rare') return 'rare quality trim, one accent detail';
  if (id === 'uncommon') return 'uncommon quality trim, minor accent detail';
  return 'common quality trim, practical simple design';
}

function styleDescriptorForCategory(category) {
  const c = String(category);
  if (c.startsWith('items/weapons')) return 'weapon icon style, silhouette-first, sharp readable geometry';
  if (c.startsWith('items/armor')) return 'armor icon style, plated forms and distinct guard contours';
  if (c.startsWith('items/consumables')) return 'consumable icon style, compact vessel and payload readability';
  if (c.startsWith('items/materials')) return 'resource icon style, raw material texture clusters';
  if (c.startsWith('world/food')) return 'appetizing color blocks, simplified edible shapes';
  if (c.startsWith('world/medical')) return 'clean sanitary color palette and medical symbol clarity';
  if (c.startsWith('world/science')) return 'technical icon style with precise shape language';
  if (c.startsWith('world/space')) return 'space-themed icon style with strong silhouette';
  if (c.startsWith('world/vehicles')) return 'vehicle icon style with wheel and body readability';
  if (c.startsWith('world/furniture') || c.startsWith('world/appliances')) return 'household icon style, practical proportions';
  if (c.startsWith('world/electronics')) return 'consumer electronics icon style, clear screen/body separation';
  if (c.startsWith('world/instruments')) return 'instrument icon style, body and play-surface readability';
  if (c.startsWith('world/utensils')) return 'kitchen tool icon style, handle and working-end clarity';
  if (c.startsWith('world/chess')) return 'chess-piece icon style, piece identity readable at tiny scale';
  if (c.startsWith('world/animals')) return 'animal icon style, recognizable species silhouette';
  if (c.startsWith('world/plants')) return 'botanical icon style, leaf and stem readability';
  if (c.startsWith('game/')) return 'game economy icon style, high readability at tiny size';
  return 'clean stylized pixel icon style';
}

function poseDescriptorForCategory(category) {
  const c = String(category);
  if (c.startsWith('world/vehicles')) return 'side view or slight isometric view, avoid perspective distortion';
  if (c.startsWith('world/animals')) return 'single head or side portrait view, centered and symmetric';
  if (c.startsWith('world/chess')) return 'front-facing piece view, pedestal centered';
  if (c.startsWith('world/food')) return '3/4 top view for dish readability, centered';
  return 'front-facing or side-facing icon view, centered';
}

function humanizeKey(raw) {
  return String(raw).replace(/_/g, ' ');
}

function variantDescriptor(id, category, key) {
  const seed = seedFromId(`${id}|${category}|${key}`, 17);
  const options = [
    'bold contour edges with medium interior detail',
    'clean contour edges with one focal accent detail',
    'slightly chunkier silhouette with reduced micro-noise',
    'balanced shape proportions with strong negative space',
    'high-contrast material separation between parts'
  ];
  return options[seed % options.length];
}
