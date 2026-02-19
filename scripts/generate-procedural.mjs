import path from 'node:path';
import { createHash } from 'node:crypto';
import { ensureDir, parseArgs, readJsonl, relFromCwd, runCommand } from './lib.mjs';

const C = {
  none: '#00000000', outline: '#1A1C2C', metal: '#94B0C2', metalDark: '#566C86',
  wood: '#8F563B', woodDark: '#663931', leather: '#D9A066', cloth: '#EEC39A',
  red: '#B13E53', blue: '#3B5DC9', gold: '#FBF236', goldDark: '#FFCD75',
  green: '#6ABE30', greenLight: '#99E550', cyan: '#73EFF7', sky: '#41A6F6',
  dark: '#333C57', white: '#F4F4F4'
};

const templates = {
  generic: () => ['-fill', C.metal, '-draw', 'rectangle 9,9 23,23'],
  sword: () => ['-fill',C.metal,'-draw','polygon 16,4 19,11 17,22 15,22 13,11','-fill',C.wood,'-draw','rectangle 11,22 21,24','-fill',C.woodDark,'-draw','rectangle 14,24 18,28'],
  axe: () => ['-fill',C.wood,'-draw','rectangle 15,8 17,28','-fill',C.metal,'-draw','polygon 17,11 27,13 27,19 17,21'],
  bow: () => ['-fill',C.wood,'-draw','polygon 12,6 14,6 20,16 14,26 12,26 18,16','-stroke',C.white,'-strokewidth','1','-fill','none','-draw','line 18,7 18,25'],
  spear: () => ['-fill',C.wood,'-draw','rectangle 15,8 17,28','-fill',C.metal,'-draw','polygon 16,3 20,8 12,8'],
  dagger: () => ['-fill',C.metal,'-draw','polygon 16,6 19,12 16,21 13,12','-fill',C.woodDark,'-draw','rectangle 14,21 18,26','-fill',C.wood,'-draw','rectangle 13,20 19,22'],
  mace: () => ['-fill',C.wood,'-draw','rectangle 15,11 17,28','-fill',C.metalDark,'-draw','circle 16,9 16,4','-fill',C.metal,'-draw','point 13,7','-fill',C.metal,'-draw','point 19,7'],
  crossbow: () => ['-fill',C.wood,'-draw','rectangle 10,14 22,17','-fill',C.metal,'-draw','rectangle 15,10 17,24','-stroke',C.white,'-strokewidth','1','-fill','none','-draw','line 8,10 24,10'],
  war_hammer: () => ['-fill',C.wood,'-draw','rectangle 15,8 17,28','-fill',C.metalDark,'-draw','rectangle 10,9 22,14','-fill',C.metal,'-draw','rectangle 11,10 21,13'],
  staff: () => ['-fill',C.wood,'-draw','rectangle 15,6 17,28','-fill',C.sky,'-draw','circle 16,5 16,2','-fill',C.cyan,'-draw','point 14,4'],
  wand: () => ['-fill',C.woodDark,'-draw','rectangle 15,10 17,27','-fill',C.gold,'-draw','polygon 16,4 18,8 22,8 19,11 20,15 16,13 12,15 13,11 10,8 14,8'],
  shield: () => ['-fill',C.wood,'-draw','polygon 8,7 24,7 26,12 16,28 6,12','-fill',C.leather,'-draw','polygon 11,10 21,10 22,13 16,23 10,13'],
  helmet: () => ['-fill',C.metal,'-draw','polygon 9,13 12,8 20,8 23,13 23,20 9,20','-fill',C.metalDark,'-draw','rectangle 12,14 20,18'],
  armor: () => ['-fill',C.wood,'-draw','polygon 10,8 22,8 24,12 22,24 10,24 8,12','-fill',C.leather,'-draw','rectangle 13,12 19,21'],
  boots: () => ['-fill',C.wood,'-draw','rectangle 9,12 15,24','-fill',C.wood,'-draw','rectangle 17,12 23,24','-fill',C.woodDark,'-draw','rectangle 8,24 16,27','-fill',C.woodDark,'-draw','rectangle 16,24 24,27'],
  potion_red: () => ['-fill',C.cloth,'-draw','rectangle 13,4 19,8','-fill',C.metal,'-draw','polygon 10,9 22,9 20,25 12,25','-fill',C.red,'-draw','rectangle 12,15 20,24'],
  potion_blue: () => ['-fill',C.cloth,'-draw','rectangle 13,4 19,8','-fill',C.metal,'-draw','polygon 10,9 22,9 20,25 12,25','-fill',C.blue,'-draw','rectangle 12,15 20,24'],
  bomb: () => ['-fill',C.dark,'-draw','circle 15,18 15,10','-fill',C.metalDark,'-draw','rectangle 14,8 18,11','-stroke',C.goldDark,'-strokewidth','1','-fill','none','-draw','line 18,8 23,4'],
  scroll: () => ['-fill',C.cloth,'-draw','rectangle 9,9 23,23','-fill',C.wood,'-draw','rectangle 7,11 9,21','-fill',C.wood,'-draw','rectangle 23,11 25,21','-fill',C.woodDark,'-draw','rectangle 12,13 20,14','-fill',C.woodDark,'-draw','rectangle 12,17 19,18'],
  key: () => ['-fill',C.gold,'-draw','circle 11,11 11,7','-fill',C.none,'-draw','circle 11,11 11,9','-fill',C.goldDark,'-draw','rectangle 11,10 24,13','-fill',C.goldDark,'-draw','rectangle 20,13 22,16'],
  coin: () => ['-fill',C.gold,'-draw','circle 16,16 16,7','-fill',C.goldDark,'-draw','circle 16,16 16,10'],
  gem: () => ['-fill',C.sky,'-draw','polygon 16,5 25,12 22,24 10,24 7,12','-fill',C.cyan,'-draw','polygon 16,8 21,13 19,21 13,21 11,13'],
  ore: () => ['-fill',C.metalDark,'-draw','polygon 9,12 16,8 24,12 23,21 15,25 8,20','-fill',C.metal,'-draw','point 14,13','-fill',C.metal,'-draw','point 18,17'],
  log: () => ['-fill',C.wood,'-draw','rectangle 7,12 25,20','-fill',C.woodDark,'-draw','circle 8,16 8,13','-fill',C.woodDark,'-draw','circle 24,16 24,13'],
  herb: () => ['-fill',C.green,'-draw','polygon 16,8 21,16 16,24 11,16','-fill',C.greenLight,'-draw','polygon 13,12 16,16 13,20 10,16','-fill',C.greenLight,'-draw','polygon 19,12 22,16 19,20 16,16'],
  whistle: () => ['-fill',C.metal,'-draw','rectangle 10,13 22,19','-fill',C.metalDark,'-draw','circle 20,16 20,14','-stroke',C.white,'-strokewidth','1','-fill','none','-draw','line 9,16 5,12'],
  badge: () => ['-fill',C.goldDark,'-draw','polygon 16,5 20,11 27,12 22,17 23,25 16,21 9,25 10,17 5,12 12,11','-fill',C.gold,'-draw','circle 16,16 16,13'],
  fish: () => ['-fill',C.sky,'-draw','ellipse 8,11 22,21 0,360','-fill',C.sky,'-draw','polygon 22,16 27,12 27,20','-fill',C.white,'-draw','point 12,14'],
  bucket: () => ['-fill',C.metalDark,'-draw','rectangle 9,10 23,24','-fill',C.metal,'-draw','rectangle 10,11 22,23','-stroke',C.metal,'-strokewidth','1','-fill','none','-draw','arc 9,5 23,13 200,340'],
  tank: () => ['-fill',C.none,'-stroke',C.cyan,'-strokewidth','1','-draw','rectangle 7,8 25,24','-fill',C.sky,'-draw','rectangle 8,18 24,23','-fill',C.green,'-draw','rectangle 9,22 13,23'],
  paw: () => ['-fill',C.woodDark,'-draw','circle 16,18 16,13','-fill',C.woodDark,'-draw','circle 11,13 11,10','-fill',C.woodDark,'-draw','circle 15,11 15,8','-fill',C.woodDark,'-draw','circle 19,11 19,8','-fill',C.woodDark,'-draw','circle 22,13 22,10'],
  collar: () => ['-fill',C.red,'-draw','ellipse 8,12 24,24 0,360','-fill',C.none,'-draw','ellipse 11,15 21,21 0,360','-fill',C.gold,'-draw','circle 16,24 16,22'],
  bone: () => ['-fill',C.cloth,'-draw','rectangle 11,13 21,19','-fill',C.cloth,'-draw','circle 10,14 10,11','-fill',C.cloth,'-draw','circle 10,18 10,15','-fill',C.cloth,'-draw','circle 22,14 22,11','-fill',C.cloth,'-draw','circle 22,18 22,15'],
  seed: () => ['-fill',C.wood,'-draw','ellipse 11,12 21,20 0,360','-fill',C.woodDark,'-draw','line 14,13 18,18'],
  sprout: () => ['-fill',C.wood,'-draw','rectangle 12,19 20,24','-fill',C.green,'-draw','polygon 16,10 20,16 16,19 12,16','-fill',C.greenLight,'-draw','polygon 13,13 16,16 13,18 10,16'],
  shield_lock: () => ['-fill',C.metalDark,'-draw','polygon 9,8 23,8 24,12 16,25 8,12','-fill',C.gold,'-draw','rectangle 13,14 19,19','-stroke',C.goldDark,'-strokewidth','1','-fill','none','-draw','arc 13,10 19,16 200,340'],
  sword_cross: () => ['-fill',C.metal,'-draw','polygon 10,8 13,11 22,20 19,23','-fill',C.metal,'-draw','polygon 22,8 19,11 10,20 13,23','-fill',C.wood,'-draw','rectangle 9,20 13,22','-fill',C.wood,'-draw','rectangle 19,20 23,22'],
  star_pass: () => ['-fill',C.goldDark,'-draw','rectangle 8,10 24,22','-fill',C.gold,'-draw','polygon 16,12 18,16 23,16 19,19 21,23 16,20 11,23 13,19 9,16 14,16'],
  ticket: () => ['-fill',C.red,'-draw','rectangle 8,11 24,21','-fill',C.none,'-draw','circle 8,16 8,14','-fill',C.none,'-draw','circle 24,16 24,14','-fill',C.white,'-draw','rectangle 12,14 20,18'],
  crate: () => ['-fill',C.wood,'-draw','rectangle 8,9 24,24','-fill',C.woodDark,'-draw','line 8,9 24,24','-fill',C.woodDark,'-draw','line 24,9 8,24'],
  trophy: () => ['-fill',C.gold,'-draw','ellipse 10,7 22,17 0,360','-fill',C.gold,'-draw','rectangle 14,17 18,22','-fill',C.woodDark,'-draw','rectangle 12,22 20,25'],
  hourglass: () => ['-fill',C.metalDark,'-draw','rectangle 11,7 21,9','-fill',C.metalDark,'-draw','rectangle 11,23 21,25','-fill',C.cloth,'-draw','polygon 12,9 20,9 16,16','-fill',C.cloth,'-draw','polygon 16,16 20,23 12,23'],
  chair: () => ['-fill',C.wood,'-draw','rectangle 10,10 22,13','-fill',C.wood,'-draw','rectangle 11,13 13,24','-fill',C.wood,'-draw','rectangle 19,13 21,24','-fill',C.woodDark,'-draw','rectangle 10,18 22,20'],
  table: () => ['-fill',C.wood,'-draw','rectangle 7,10 25,14','-fill',C.wood,'-draw','rectangle 9,14 11,24','-fill',C.wood,'-draw','rectangle 21,14 23,24'],
  sofa: () => ['-fill',C.red,'-draw','rectangle 8,13 24,21','-fill',C.red,'-draw','rectangle 8,10 11,21','-fill',C.red,'-draw','rectangle 21,10 24,21','-fill',C.dark,'-draw','rectangle 10,21 22,24'],
  bed: () => ['-fill',C.woodDark,'-draw','rectangle 7,10 25,12','-fill',C.blue,'-draw','rectangle 8,12 24,22','-fill',C.white,'-draw','rectangle 9,13 14,17'],
  lamp: () => ['-fill',C.metalDark,'-draw','rectangle 15,12 17,26','-fill',C.goldDark,'-draw','polygon 11,8 21,8 19,12 13,12','-fill',C.gold,'-draw','rectangle 13,12 19,13'],
  bookshelf: () => ['-fill',C.woodDark,'-draw','rectangle 8,8 24,24','-fill',C.wood,'-draw','rectangle 9,11 23,12','-fill',C.wood,'-draw','rectangle 9,16 23,17','-fill',C.wood,'-draw','rectangle 9,21 23,22'],
  cabinet: () => ['-fill',C.wood,'-draw','rectangle 8,9 24,24','-fill',C.woodDark,'-draw','rectangle 15,9 16,24','-fill',C.gold,'-draw','point 13,16','-fill',C.gold,'-draw','point 18,16'],
  plant: () => ['-fill',C.wood,'-draw','rectangle 12,20 20,25','-fill',C.green,'-draw','polygon 16,8 20,16 16,20 12,16','-fill',C.greenLight,'-draw','polygon 13,12 16,16 13,19 10,16','-fill',C.greenLight,'-draw','polygon 19,12 22,16 19,19 16,16'],
  room_kitchen: () => roomTemplate(C.goldDark), room_bedroom: () => roomTemplate(C.blue), room_bathroom: () => roomTemplate(C.cyan), room_living: () => roomTemplate(C.red), room_game: () => roomTemplate(C.green), room_music: () => roomTemplate(C.sky),
  tv: () => ['-fill',C.dark,'-draw','rectangle 7,9 25,21','-fill',C.sky,'-draw','rectangle 9,11 23,19','-fill',C.metalDark,'-draw','rectangle 14,21 18,24'],
  console: () => ['-fill',C.dark,'-draw','rectangle 8,13 24,20','-fill',C.metalDark,'-draw','circle 12,16 12,14','-fill',C.metalDark,'-draw','circle 20,16 20,14'],
  monitor: () => ['-fill',C.dark,'-draw','rectangle 8,8 24,19','-fill',C.sky,'-draw','rectangle 10,10 22,17','-fill',C.metalDark,'-draw','rectangle 14,19 18,24'],
  laptop: () => ['-fill',C.dark,'-draw','rectangle 9,8 23,15','-fill',C.sky,'-draw','rectangle 10,9 22,14','-fill',C.metalDark,'-draw','polygon 7,16 25,16 22,23 10,23'],
  phone: () => ['-fill',C.dark,'-draw','rectangle 11,6 21,26','-fill',C.sky,'-draw','rectangle 12,8 20,22','-fill',C.metalDark,'-draw','point 16,24'],
  camera: () => ['-fill',C.dark,'-draw','rectangle 8,11 24,21','-fill',C.metalDark,'-draw','rectangle 12,9 17,11','-fill',C.sky,'-draw','circle 16,16 16,12'],
  headphones: () => ['-stroke',C.dark,'-strokewidth','2','-fill','none','-draw','arc 9,6 23,20 200,340','-fill',C.dark,'-draw','rectangle 9,15 12,22','-fill',C.dark,'-draw','rectangle 20,15 23,22'],
  speaker: () => ['-fill',C.dark,'-draw','rectangle 10,8 22,24','-fill',C.metalDark,'-draw','circle 16,13 16,11','-fill',C.metalDark,'-draw','circle 16,20 16,16'],
  guitar: () => ['-fill',C.wood,'-draw','circle 14,18 14,13','-fill',C.wood,'-draw','circle 18,20 18,16','-fill',C.woodDark,'-draw','rectangle 18,8 20,20'],
  piano: () => ['-fill',C.dark,'-draw','rectangle 7,10 25,22','-fill',C.white,'-draw','rectangle 8,12 24,17','-fill',C.outline,'-draw','rectangle 9,12 10,17','-fill',C.outline,'-draw','rectangle 12,12 13,17','-fill',C.outline,'-draw','rectangle 15,12 16,17'],
  drum: () => ['-fill',C.red,'-draw','ellipse 8,11 24,15 0,360','-fill',C.red,'-draw','rectangle 8,15 24,23','-fill',C.goldDark,'-draw','ellipse 8,22 24,26 0,360'],
  violin: () => ['-fill',C.wood,'-draw','circle 14,14 14,10','-fill',C.wood,'-draw','circle 18,19 18,15','-fill',C.woodDark,'-draw','rectangle 16,6 17,22'],
  flute: () => ['-fill',C.metal,'-draw','rectangle 7,15 25,17','-fill',C.metalDark,'-draw','point 11,16','-fill',C.metalDark,'-draw','point 15,16','-fill',C.metalDark,'-draw','point 19,16'],
  trumpet: () => ['-fill',C.goldDark,'-draw','rectangle 8,14 19,17','-fill',C.gold,'-draw','polygon 19,13 26,11 26,20 19,18'],
  microphone: () => ['-fill',C.metal,'-draw','circle 16,10 16,6','-fill',C.metalDark,'-draw','rectangle 15,10 17,22','-fill',C.dark,'-draw','rectangle 13,22 19,24'],
  fork: () => ['-fill',C.metal,'-draw','rectangle 15,8 17,26','-fill',C.metal,'-draw','rectangle 13,6 14,10','-fill',C.metal,'-draw','rectangle 16,6 17,10','-fill',C.metal,'-draw','rectangle 19,6 20,10'],
  knife: () => ['-fill',C.metal,'-draw','polygon 16,4 20,12 16,26 13,26 13,12','-fill',C.wood,'-draw','rectangle 14,26 18,28'],
  spoon: () => ['-fill',C.metal,'-draw','ellipse 12,6 20,13 0,360','-fill',C.metal,'-draw','rectangle 15,13 17,27'],
  chopsticks: () => ['-fill',C.wood,'-draw','polygon 11,7 13,7 21,26 19,26','-fill',C.wood,'-draw','polygon 15,7 17,7 25,26 23,26'],
  plate: () => ['-fill',C.white,'-draw','circle 16,16 16,7','-fill',C.cloth,'-draw','circle 16,16 16,11'],
  bowl: () => ['-fill',C.cloth,'-draw','ellipse 8,14 24,24 0,360','-fill',C.white,'-draw','ellipse 9,14 23,19 0,360'],
  cup: () => ['-fill',C.white,'-draw','rectangle 10,10 20,22','-stroke',C.metalDark,'-strokewidth','1','-fill','none','-draw','arc 19,12 25,20 270,90'],
  kettle: () => ['-fill',C.metalDark,'-draw','ellipse 9,11 23,24 0,360','-stroke',C.metal,'-strokewidth','1','-fill','none','-draw','arc 10,8 22,16 200,340'],
  pan: () => ['-fill',C.dark,'-draw','ellipse 7,11 21,23 0,360','-fill',C.metalDark,'-draw','rectangle 21,15 27,17'],
  pot: () => ['-fill',C.dark,'-draw','rectangle 9,11 23,23','-fill',C.metalDark,'-draw','rectangle 11,9 21,11'],
  spatula: () => ['-fill',C.metal,'-draw','rectangle 12,7 20,13','-fill',C.wood,'-draw','rectangle 15,13 17,27'],
  food_apple: () => ['-fill',C.red,'-draw','circle 16,16 16,9','-fill',C.green,'-draw','polygon 16,7 20,10 16,12 12,10','-fill',C.wood,'-draw','rectangle 15,5 16,8'],
  food_banana: () => ['-fill',C.gold,'-draw','polygon 9,14 20,10 24,15 15,22 10,20','-fill',C.goldDark,'-draw','line 10,18 20,14'],
  food_bread: () => ['-fill',C.leather,'-draw','ellipse 8,10 24,24 0,360','-fill',C.wood,'-draw','line 12,14 20,14'],
  food_cheese: () => ['-fill',C.gold,'-draw','polygon 8,21 22,12 22,24','-fill',C.goldDark,'-draw','circle 14,18 14,17','-fill',C.goldDark,'-draw','circle 18,20 18,19'],
  food_steak: () => ['-fill',C.red,'-draw','ellipse 8,11 24,23 0,360','-fill',C.cloth,'-draw','ellipse 14,14 20,20 0,360'],
  food_fish: () => ['-fill',C.sky,'-draw','ellipse 8,12 22,22 0,360','-fill',C.sky,'-draw','polygon 22,17 27,13 27,21','-fill',C.white,'-draw','point 12,15'],
  food_burger: () => ['-fill',C.goldDark,'-draw','ellipse 8,8 24,14 0,360','-fill',C.green,'-draw','rectangle 9,14 23,15','-fill',C.red,'-draw','rectangle 9,15 23,17','-fill',C.wood,'-draw','rectangle 9,17 23,19','-fill',C.goldDark,'-draw','ellipse 8,19 24,24 0,360'],
  food_pizza: () => ['-fill',C.gold,'-draw','polygon 8,22 24,10 22,24','-fill',C.red,'-draw','line 10,20 22,12','-fill',C.red,'-draw','line 12,22 23,14','-fill',C.wood,'-draw','circle 18,18 18,17'],
  food_noodles: () => ['-fill',C.cloth,'-draw','ellipse 8,14 24,24 0,360','-fill',C.gold,'-draw','line 10,18 22,18','-fill',C.gold,'-draw','line 10,20 22,20'],
  food_sushi: () => ['-fill',C.white,'-draw','rectangle 9,12 23,22','-fill',C.green,'-draw','rectangle 10,13 22,15','-fill',C.red,'-draw','rectangle 12,16 20,19'],
  food_cake: () => ['-fill',C.cloth,'-draw','polygon 8,22 24,13 24,24','-fill',C.red,'-draw','line 10,21 23,14','-fill',C.white,'-draw','point 19,17'],
  food_cookie: () => ['-fill',C.leather,'-draw','circle 16,16 16,10','-fill',C.woodDark,'-draw','point 13,14','-fill',C.woodDark,'-draw','point 18,16','-fill',C.woodDark,'-draw','point 16,19'],
  food_egg: () => ['-fill',C.white,'-draw','ellipse 10,9 22,24 0,360','-fill',C.gold,'-draw','circle 16,17 16,14'],
  food_carrot: () => ['-fill',C.goldDark,'-draw','polygon 16,8 21,20 11,20','-fill',C.green,'-draw','polygon 16,5 20,9 16,10 12,9'],
  food_chili: () => ['-fill',C.red,'-draw','polygon 10,12 21,10 23,17 15,24 10,20','-fill',C.green,'-draw','polygon 19,9 23,8 22,11'],
  food_mushroom: () => ['-fill',C.red,'-draw','ellipse 9,8 23,16 0,360','-fill',C.cloth,'-draw','rectangle 13,16 19,24','-fill',C.white,'-draw','point 13,12','-fill',C.white,'-draw','point 19,12'],
  fridge: () => ['-fill',C.white,'-draw','rectangle 9,6 23,26','-fill',C.metalDark,'-draw','rectangle 9,16 23,17','-fill',C.metalDark,'-draw','point 21,12','-fill',C.metalDark,'-draw','point 21,21'],
  stove: () => ['-fill',C.dark,'-draw','rectangle 8,9 24,24','-fill',C.red,'-draw','circle 12,14 12,12','-fill',C.red,'-draw','circle 20,14 20,12','-fill',C.metalDark,'-draw','rectangle 10,20 22,22'],
  sink: () => ['-fill',C.metal,'-draw','rectangle 8,12 24,22','-fill',C.metalDark,'-draw','rectangle 11,14 21,20','-fill',C.metalDark,'-draw','rectangle 15,8 17,12'],
  toaster: () => ['-fill',C.metal,'-draw','rectangle 9,12 23,22','-fill',C.wood,'-draw','rectangle 12,8 20,12','-fill',C.metalDark,'-draw','point 22,16'],
  microwave: () => ['-fill',C.dark,'-draw','rectangle 7,10 25,22','-fill',C.sky,'-draw','rectangle 9,12 20,20','-fill',C.metalDark,'-draw','circle 23,14 23,13','-fill',C.metalDark,'-draw','circle 23,18 23,17'],
  washer: () => ['-fill',C.white,'-draw','rectangle 8,8 24,24','-fill',C.sky,'-draw','circle 16,16 16,11','-fill',C.metalDark,'-draw','point 11,10','-fill',C.metalDark,'-draw','point 14,10'],
  toilet: () => ['-fill',C.white,'-draw','rectangle 10,8 20,14','-fill',C.white,'-draw','ellipse 9,14 23,24 0,360','-fill',C.cloth,'-draw','ellipse 12,16 20,22 0,360'],
  shower: () => ['-fill',C.metalDark,'-draw','rectangle 9,8 11,24','-fill',C.metal,'-draw','arc 10,7 20,17 180,280','-fill',C.cyan,'-draw','point 16,15','-fill',C.cyan,'-draw','point 18,17','-fill',C.cyan,'-draw','point 20,19'],
  animal_cat: () => ['-fill',C.woodDark,'-draw','ellipse 10,11 22,23 0,360','-fill',C.woodDark,'-draw','polygon 12,10 10,6 14,8','-fill',C.woodDark,'-draw','polygon 20,10 22,6 18,8','-fill',C.white,'-draw','point 14,16','-fill',C.white,'-draw','point 18,16'],
  animal_dog: () => ['-fill',C.wood,'-draw','ellipse 9,11 23,23 0,360','-fill',C.woodDark,'-draw','rectangle 8,10 10,16','-fill',C.woodDark,'-draw','rectangle 22,10 24,16','-fill',C.white,'-draw','point 16,17'],
  animal_bird: () => ['-fill',C.sky,'-draw','ellipse 9,11 21,21 0,360','-fill',C.sky,'-draw','polygon 20,16 25,13 25,19','-fill',C.gold,'-draw','polygon 8,16 11,15 11,17'],
  animal_rabbit: () => ['-fill',C.cloth,'-draw','ellipse 10,13 22,24 0,360','-fill',C.cloth,'-draw','rectangle 12,5 14,13','-fill',C.cloth,'-draw','rectangle 18,5 20,13'],
  animal_horse: () => ['-fill',C.wood,'-draw','polygon 9,20 22,20 21,11 16,8 11,10','-fill',C.woodDark,'-draw','rectangle 12,20 14,25','-fill',C.woodDark,'-draw','rectangle 18,20 20,25'],
  animal_cow: () => ['-fill',C.white,'-draw','rectangle 9,11 23,21','-fill',C.dark,'-draw','rectangle 11,13 14,16','-fill',C.dark,'-draw','rectangle 18,16 21,19','-fill',C.wood,'-draw','rectangle 9,10 11,12','-fill',C.wood,'-draw','rectangle 21,10 23,12'],
  animal_butterfly: () => ['-fill',C.red,'-draw','ellipse 7,11 14,20 0,360','-fill',C.blue,'-draw','ellipse 18,11 25,20 0,360','-fill',C.metalDark,'-draw','rectangle 15,10 17,22'],
  animal_turtle: () => ['-fill',C.green,'-draw','ellipse 8,11 24,23 0,360','-fill',C.greenLight,'-draw','rectangle 10,14 22,20','-fill',C.wood,'-draw','circle 25,17 25,15'],
  plant_tree: () => ['-fill',C.woodDark,'-draw','rectangle 14,15 18,27','-fill',C.green,'-draw','ellipse 8,5 24,18 0,360'],
  plant_flower: () => ['-fill',C.green,'-draw','rectangle 15,13 17,27','-fill',C.red,'-draw','circle 16,10 16,7','-fill',C.red,'-draw','circle 13,12 13,9','-fill',C.red,'-draw','circle 19,12 19,9','-fill',C.gold,'-draw','circle 16,11 16,10'],
  plant_cactus: () => ['-fill',C.green,'-draw','rectangle 13,8 19,25','-fill',C.green,'-draw','rectangle 10,13 13,19','-fill',C.green,'-draw','rectangle 19,13 22,19'],
  plant_bamboo: () => ['-fill',C.green,'-draw','rectangle 11,7 13,26','-fill',C.green,'-draw','rectangle 15,5 17,26','-fill',C.green,'-draw','rectangle 19,8 21,26'],
  plant_leaf: () => ['-fill',C.green,'-draw','polygon 16,7 24,16 16,25 8,16','-fill',C.greenLight,'-draw','line 16,8 16,24'],
  plant_fruit: () => ['-fill',C.wood,'-draw','rectangle 10,18 22,24','-fill',C.red,'-draw','circle 13,16 13,14','-fill',C.gold,'-draw','circle 17,16 17,14','-fill',C.green,'-draw','circle 21,16 21,14'],
  vehicle_car: () => ['-fill',C.red,'-draw','rectangle 8,14 24,21','-fill',C.red,'-draw','polygon 11,14 14,10 20,10 23,14','-fill',C.dark,'-draw','circle 12,21 12,19','-fill',C.dark,'-draw','circle 20,21 20,19'],
  vehicle_truck: () => ['-fill',C.blue,'-draw','rectangle 6,13 19,21','-fill',C.sky,'-draw','rectangle 19,15 25,21','-fill',C.dark,'-draw','circle 11,21 11,19','-fill',C.dark,'-draw','circle 21,21 21,19'],
  vehicle_bus: () => ['-fill',C.goldDark,'-draw','rectangle 6,12 26,21','-fill',C.sky,'-draw','rectangle 8,13 24,17','-fill',C.dark,'-draw','circle 10,21 10,19','-fill',C.dark,'-draw','circle 22,21 22,19'],
  vehicle_bike: () => ['-stroke',C.dark,'-strokewidth','2','-fill','none','-draw','circle 9,22 9,18','-draw','circle 23,22 23,18','-draw','line 9,20 16,14','-draw','line 16,14 23,20'],
  vehicle_train: () => ['-fill',C.metalDark,'-draw','rectangle 7,10 25,22','-fill',C.sky,'-draw','rectangle 9,12 23,16','-fill',C.dark,'-draw','circle 11,22 11,20','-fill',C.dark,'-draw','circle 21,22 21,20'],
  vehicle_plane: () => ['-fill',C.metal,'-draw','polygon 6,16 20,13 26,16 20,19','-fill',C.metalDark,'-draw','polygon 13,16 17,8 19,8 17,16'],
  vehicle_ship: () => ['-fill',C.woodDark,'-draw','polygon 7,18 25,18 21,24 11,24','-fill',C.metal,'-draw','rectangle 15,10 17,18','-fill',C.white,'-draw','polygon 17,10 23,13 17,16'],
  science_flask: () => ['-fill',C.cyan,'-draw','polygon 11,8 21,8 19,24 13,24','-fill',C.white,'-draw','line 12,12 18,12'],
  science_atom: () => ['-stroke',C.sky,'-strokewidth','1','-fill','none','-draw','ellipse 8,12 24,20 0,360','-draw','ellipse 12,8 20,24 0,360','-fill',C.sky,'-draw','circle 16,16 16,14'],
  science_microscope: () => ['-fill',C.metalDark,'-draw','rectangle 10,20 22,23','-fill',C.metal,'-draw','polygon 13,20 18,10 21,12 16,22','-fill',C.dark,'-draw','rectangle 17,8 20,11'],
  science_dna: () => ['-stroke',C.sky,'-strokewidth','1','-fill','none','-draw','line 12,7 20,25','-draw','line 20,7 12,25','-draw','line 13,11 19,11','-draw','line 14,15 18,15','-draw','line 13,19 19,19'],
  science_telescope: () => ['-fill',C.metal,'-draw','polygon 9,14 21,10 23,13 11,17','-fill',C.woodDark,'-draw','rectangle 14,17 16,24','-fill',C.woodDark,'-draw','rectangle 18,16 20,24'],
  science_tube: () => ['-fill',C.cyan,'-draw','rectangle 13,7 19,24','-fill',C.white,'-draw','line 14,10 18,10'],
  science_chip: () => ['-fill',C.green,'-draw','rectangle 10,10 22,22','-fill',C.dark,'-draw','rectangle 13,13 19,19','-fill',C.green,'-draw','rectangle 8,12 10,13','-fill',C.green,'-draw','rectangle 22,12 24,13'],
  space_planet: () => ['-fill',C.sky,'-draw','circle 16,16 16,8','-stroke',C.cyan,'-strokewidth','1','-fill','none','-draw','ellipse 7,14 25,20 0,360'],
  space_rocket: () => ['-fill',C.white,'-draw','polygon 16,5 21,14 18,24 14,24 11,14','-fill',C.red,'-draw','polygon 11,14 8,18 11,19','-fill',C.red,'-draw','polygon 21,14 24,18 21,19','-fill',C.sky,'-draw','circle 16,14 16,12'],
  space_satellite: () => ['-fill',C.metal,'-draw','rectangle 13,13 19,19','-fill',C.sky,'-draw','rectangle 7,14 13,18','-fill',C.sky,'-draw','rectangle 19,14 25,18','-fill',C.metalDark,'-draw','rectangle 15,10 17,13'],
  space_asteroid: () => ['-fill',C.metalDark,'-draw','polygon 9,11 18,8 24,14 22,22 13,24 8,18'],
  space_moon: () => ['-fill',C.cloth,'-draw','circle 16,16 16,8','-fill',C.none,'-draw','circle 19,14 19,9'],
  space_star: () => ['-fill',C.gold,'-draw','polygon 16,5 18,11 24,11 19,15 21,22 16,18 11,22 13,15 8,11 14,11'],
  space_ufo: () => ['-fill',C.metal,'-draw','ellipse 8,14 24,20 0,360','-fill',C.sky,'-draw','ellipse 12,10 20,16 0,360'],
  space_helmet: () => ['-fill',C.white,'-draw','circle 16,15 16,7','-fill',C.sky,'-draw','circle 16,15 16,10','-fill',C.metalDark,'-draw','rectangle 12,22 20,24'],
  sports_ball: () => ['-fill',C.goldDark,'-draw','circle 16,16 16,8','-fill',C.dark,'-draw','line 16,8 16,24','-fill',C.dark,'-draw','line 8,16 24,16'],
  sports_trophy: () => ['-fill',C.gold,'-draw','ellipse 10,7 22,17 0,360','-fill',C.gold,'-draw','rectangle 14,17 18,22','-fill',C.woodDark,'-draw','rectangle 12,22 20,25'],
  sports_bat: () => ['-fill',C.wood,'-draw','polygon 16,6 20,10 18,25 14,25 12,10'],
  sports_racket: () => ['-stroke',C.metalDark,'-strokewidth','1','-fill','none','-draw','ellipse 10,7 22,19 0,360','-fill',C.wood,'-draw','rectangle 15,19 17,27'],
  sports_glove: () => ['-fill',C.red,'-draw','rectangle 10,12 22,22','-fill',C.red,'-draw','rectangle 10,9 12,12','-fill',C.red,'-draw','rectangle 13,8 15,12','-fill',C.red,'-draw','rectangle 16,8 18,12'],
  sports_shoe: () => ['-fill',C.blue,'-draw','polygon 8,18 22,18 24,22 10,24 7,22','-fill',C.white,'-draw','line 11,19 17,19'],
  medical_cross: () => ['-fill',C.red,'-draw','rectangle 13,8 19,24','-fill',C.red,'-draw','rectangle 8,13 24,19'],
  medical_pill: () => ['-fill',C.red,'-draw','ellipse 9,11 23,21 0,360','-fill',C.white,'-draw','polygon 16,11 23,16 16,21'],
  medical_syringe: () => ['-fill',C.metal,'-draw','rectangle 8,14 20,17','-fill',C.cyan,'-draw','rectangle 12,15 16,16','-fill',C.metalDark,'-draw','polygon 20,15 26,14 26,17'],
  medical_stethoscope: () => ['-stroke',C.dark,'-strokewidth','1','-fill','none','-draw','arc 9,8 23,22 200,340','-fill',C.dark,'-draw','circle 16,22 16,20'],
  medical_bandage: () => ['-fill',C.cloth,'-draw','polygon 9,12 20,9 23,20 12,23','-fill',C.wood,'-draw','point 14,14','-fill',C.wood,'-draw','point 18,17'],
  medical_thermometer: () => ['-fill',C.metal,'-draw','rectangle 15,7 17,21','-fill',C.red,'-draw','rectangle 15,15 17,21','-fill',C.red,'-draw','circle 16,23 16,20'],
  medical_bed: () => ['-fill',C.metalDark,'-draw','rectangle 7,14 25,20','-fill',C.white,'-draw','rectangle 8,15 20,19','-fill',C.cloth,'-draw','rectangle 8,12 12,15'],
  medical_monitor: () => ['-fill',C.dark,'-draw','rectangle 8,10 24,21','-stroke',C.greenLight,'-strokewidth','1','-fill','none','-draw','line 10,16 13,16','-draw','line 13,16 15,13','-draw','line 15,13 17,19','-draw','line 17,19 22,19'],
  construction_hammer: () => ['-fill',C.wood,'-draw','rectangle 15,10 17,27','-fill',C.metalDark,'-draw','rectangle 10,8 22,12'],
  construction_wrench: () => ['-fill',C.metal,'-draw','polygon 10,20 16,14 21,19 15,25','-fill',C.metalDark,'-draw','circle 21,11 21,8'],
  construction_screwdriver: () => ['-fill',C.metal,'-draw','rectangle 15,8 17,21','-fill',C.red,'-draw','rectangle 13,21 19,27'],
  construction_brick: () => ['-fill',C.red,'-draw','rectangle 8,11 24,23','-fill',C.woodDark,'-draw','line 8,17 24,17','-fill',C.woodDark,'-draw','line 16,11 16,17'],
  construction_cone: () => ['-fill',C.goldDark,'-draw','polygon 16,6 23,22 9,22','-fill',C.white,'-draw','rectangle 11,14 21,16'],
  construction_toolbox: () => ['-fill',C.red,'-draw','rectangle 8,13 24,23','-fill',C.dark,'-draw','rectangle 13,10 19,13','-fill',C.gold,'-draw','point 16,18'],
  construction_helmet: () => ['-fill',C.gold,'-draw','ellipse 9,10 23,20 0,360','-fill',C.goldDark,'-draw','rectangle 8,18 24,21'],
  construction_blueprint: () => ['-fill',C.sky,'-draw','rectangle 9,9 23,23','-fill',C.white,'-draw','line 11,13 21,13','-fill',C.white,'-draw','line 11,17 19,17','-fill',C.white,'-draw','line 11,21 17,21'],
  chess_king: () => chessBase('king'), chess_queen: () => chessBase('queen'), chess_rook: () => chessBase('rook'), chess_bishop: () => chessBase('bishop'), chess_knight: () => chessBase('knight'), chess_pawn: () => chessBase('pawn')
};

const args = parseArgs(process.argv.slice(2));
const promptsPath = path.resolve(String(args.prompts ?? 'prompts/prompts.jsonl'));
const outDir = path.resolve(String(args.outDir ?? 'assets/raw'));
const masterSize = Number(args.masterSize ?? 128);
const quality = String(args.quality ?? 'hq');
const scale = Math.max(1, Math.round(masterSize / 32));

const jobs = await readJsonl(promptsPath);
if (!jobs.length) {
  console.log('No prompt jobs found. Run npm run prompts first.');
  process.exit(0);
}
if (!Number.isFinite(masterSize) || masterSize < 32) {
  throw new Error('--masterSize must be >= 32');
}
if (!['hq', 'fast'].includes(quality)) {
  throw new Error('--quality must be hq or fast');
}

await ensureDir(outDir);
await ensureDir(path.resolve('.cache/gen'));

let count = 0;
for (const job of jobs) {
  const key = String(job.asset_type || '').toLowerCase();
  const base = scaleTemplate(templateFor(key), scale);
  const sig = scaleTemplate(signatureOverlay(job.id, job.rarity || 'common'), scale);
  const flair = scaleTemplate(variantFlair(job.id, key, job.category || '', job.rarity || 'common'), scale);
  const draw = [...base, ...sig, ...flair];

  const file = path.join(outDir, `${job.id}.png`);
  const tmpBase = path.resolve(`.cache/gen/${job.id}.base.png`);
  const tmpStyled = path.resolve(`.cache/gen/${job.id}.styled.png`);
  const tmpShadow = path.resolve(`.cache/gen/${job.id}.shadow.png`);
  const tmpOutline = path.resolve(`.cache/gen/${job.id}.outline.png`);

  await runCommand('convert', ['-size', `${masterSize}x${masterSize}`, 'xc:none', '+antialias', ...draw, 'PNG32:' + tmpBase]);
  await applyStylePreset(tmpBase, tmpStyled, stylePreset(job.id, key, job.category || '', job.rarity || 'common'));

  if (quality === 'hq') {
    await runCommand('convert', [
      '-size', `${masterSize}x${masterSize}`, 'xc:none',
      '(',
      tmpStyled,
      '-alpha', 'extract',
      '-threshold', '0',
      '-fill', C.outline,
      '-colorize', '100',
      '-evaluate', 'multiply', '0.35',
      ')',
      '-geometry', `+${Math.max(1, scale)}+${Math.max(1, scale)}`,
      '-compose', 'over',
      '-composite',
      'PNG32:' + tmpShadow
    ]);

    await runCommand('convert', [
      tmpStyled,
      '(',
      '+clone',
      '-alpha', 'extract',
      '-morphology', 'EdgeOut', `Diamond:${Math.max(1, Math.floor(scale / 2))}`,
      '-threshold', '0',
      '-fill', C.outline,
      '-colorize', '100',
      ')',
      '-compose', 'DstOver',
      '-composite',
      'PNG32:' + tmpOutline
    ]);

    await runCommand('convert', [
      tmpShadow,
      tmpOutline,
      '-compose', 'over',
      '-composite',
      'PNG32:' + file
    ]);
  } else {
    await runCommand('convert', [tmpStyled, 'PNG32:' + file]);
  }

  count += 1;
  console.log(`Procedural raw ${relFromCwd(file)}`);
}

console.log(`Done. Procedural-generated ${count} strict icons (quality=${quality}, masterSize=${masterSize}).`);

function templateFor(key) {
  const fn = templates[key] || templates.generic;
  return fn();
}

function roomTemplate(accent) {
  return ['-fill', C.none, '-stroke', C.metalDark, '-strokewidth', '1', '-draw', 'rectangle 6,6 26,26', '-fill', accent, '-draw', 'rectangle 7,20 25,25', '-fill', C.metalDark, '-draw', 'rectangle 15,6 16,26', '-fill', C.metalDark, '-draw', 'rectangle 6,15 26,16'];
}

function chessBase(kind) {
  if (kind === 'king') return ['-fill',C.white,'-draw','rectangle 12,11 20,24','-fill',C.white,'-draw','rectangle 14,7 18,11','-fill',C.goldDark,'-draw','rectangle 15,4 17,8','-fill',C.goldDark,'-draw','rectangle 13,5 19,6'];
  if (kind === 'queen') return ['-fill',C.white,'-draw','rectangle 12,12 20,24','-fill',C.white,'-draw','polygon 11,12 16,6 21,12','-fill',C.goldDark,'-draw','point 13,8','-fill',C.goldDark,'-draw','point 19,8'];
  if (kind === 'rook') return ['-fill',C.white,'-draw','rectangle 11,10 21,24','-fill',C.white,'-draw','rectangle 11,7 13,10','-fill',C.white,'-draw','rectangle 15,7 17,10','-fill',C.white,'-draw','rectangle 19,7 21,10'];
  if (kind === 'bishop') return ['-fill',C.white,'-draw','rectangle 13,12 19,24','-fill',C.white,'-draw','ellipse 11,6 21,16 0,360','-fill',C.goldDark,'-draw','line 14,8 18,12'];
  if (kind === 'knight') return ['-fill',C.white,'-draw','polygon 11,23 21,23 20,11 15,8 11,11','-fill',C.goldDark,'-draw','point 17,12'];
  return ['-fill',C.white,'-draw','rectangle 13,14 19,24','-fill',C.white,'-draw','circle 16,11 16,8'];
}

function signatureOverlay(id, rarity) {
  const digest = createHash('sha256').update(String(id)).digest('hex');
  const n = parseInt(digest.slice(0, 8), 16);
  const x = 22 + (n % 4);
  const y = 22 + ((n >> 3) % 4);
  const colorByRarity = { common: C.metalDark, uncommon: C.green, rare: C.sky, epic: C.red, legendary: C.gold };
  const c = colorByRarity[String(rarity || 'common')] || C.metalDark;
  return ['-fill', c, '-draw', `point ${x},${y}`, '-fill', c, '-draw', `point ${x - 1},${y}`, '-fill', c, '-draw', `point ${x},${y - 1}`];
}

function variantFlair(id, key, category, rarity) {
  const digest = createHash('sha256').update(`${id}|${key}|${category}`).digest('hex');
  const n = parseInt(digest.slice(0, 8), 16);
  const accent = accentColorFor(category, rarity);
  const mode = n % 5;
  if (mode === 0) {
    return ['-fill', accent, '-draw', 'rectangle 6,6 8,8', '-fill', accent, '-draw', 'rectangle 24,24 26,26'];
  }
  if (mode === 1) {
    return ['-fill', accent, '-draw', 'rectangle 23,6 26,7', '-fill', accent, '-draw', 'rectangle 6,24 9,25'];
  }
  if (mode === 2) {
    return ['-stroke', accent, '-strokewidth', '1', '-fill', 'none', '-draw', 'arc 5,5 27,27 26,64'];
  }
  if (mode === 3) {
    return ['-fill', accent, '-draw', 'point 6,6', '-fill', accent, '-draw', 'point 26,6', '-fill', accent, '-draw', 'point 6,26', '-fill', accent, '-draw', 'point 26,26'];
  }
  return ['-fill', accent, '-draw', 'polygon 24,5 27,8 24,11', '-fill', accent, '-draw', 'polygon 8,21 11,24 8,27'];
}

function accentColorFor(category, rarity) {
  const byCategory = [
    ['items/', C.goldDark],
    ['game/', C.green],
    ['world/food', C.red],
    ['world/space', C.sky],
    ['world/science', C.cyan],
    ['world/medical', C.red],
    ['world/construction', C.gold]
  ];
  for (const [prefix, c] of byCategory) {
    if (String(category).startsWith(prefix)) {
      return rarityTint(c, rarity);
    }
  }
  return rarityTint(C.metalDark, rarity);
}

function rarityTint(base, rarity) {
  const id = String(rarity || 'common');
  if (id === 'legendary') return C.gold;
  if (id === 'epic') return C.red;
  if (id === 'rare') return C.sky;
  if (id === 'uncommon') return C.green;
  return base;
}

function stylePreset(id, key, category, rarity) {
  const digest = createHash('sha256').update(`${id}|${key}|${category}|${rarity}`).digest('hex');
  const n = parseInt(digest.slice(0, 8), 16);
  const mode = n % 4;
  if (mode === 0) return { brightness: 103, saturation: 118, hue: 100 };
  if (mode === 1) return { brightness: 97, saturation: 112, hue: 98 };
  if (mode === 2) return { brightness: 106, saturation: 124, hue: 102 };
  return { brightness: 100, saturation: 100, hue: 100 };
}

async function applyStylePreset(input, output, preset) {
  await runCommand('convert', [
    input,
    '-modulate', `${preset.brightness},${preset.saturation},${preset.hue}`,
    'PNG32:' + output
  ]);
}

function scaleTemplate(tokens, factor) {
  if (factor === 1) return tokens;
  const out = [...tokens];
  for (let i = 0; i < out.length; i += 1) {
    if (out[i] === '-draw' && typeof out[i + 1] === 'string') {
      out[i + 1] = scalePrimitive(out[i + 1], factor);
      i += 1;
      continue;
    }
    if (out[i] === '-strokewidth' && out[i + 1] != null) {
      const n = Number(out[i + 1]);
      if (Number.isFinite(n)) {
        out[i + 1] = String(Math.max(1, Math.round(n * factor)));
      }
      i += 1;
    }
  }
  return out;
}

function scalePrimitive(s, factor) {
  return s.replace(/-?\\d+(?:\\.\\d+)?/g, (m) => {
    const n = Number(m);
    if (!Number.isFinite(n)) return m;
    return String(Math.round(n * factor));
  });
}
