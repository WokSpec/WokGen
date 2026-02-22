# WokGen Pixel — Weapon Icon Example

This workflow generates a complete set of weapon icons for an RPG inventory.

## Studio Setup

1. Go to [wokgen.wokspec.org/pixel/studio](https://wokgen.wokspec.org/pixel/studio)
2. Select preset: **RPG Icon** (under Items tab)
3. Select category: **Weapon**
4. Set size: **64×64** (good for inventory icons)
5. Background: **Transparent**
6. Era: **Modern** (for crisp detail) or **SNES** for retro feel

## Example Prompts

### Iron Sword
```
iron longsword, straight blade, crossguard, simple medieval weapon
```

### Fire Staff
```
wooden staff with glowing red fire orb at tip, magical weapon
```

### Poison Dagger
```
curved dagger with green glowing edge, assassin blade, serrated
```

### Ice Bow
```
elven longbow made of ice crystal, frosted string, translucent
```

### Dark Axe
```
battle axe with black metal blade, spiked back edge, runic engravings
```

## Batch Generation

Use batch count 4 for each weapon to get 4 variants:
- Slot 0: canonical design
- Slot 1: alternate angle
- Slot 2: battle-worn version
- Slot 3: glowing/enchanted version

Select the best from each batch and build your complete weapon set.

## Export Tips

- Download as PNG (transparent background included)
- Name pattern: `wokgen-weapon_icon-{name}-{seed}.png`
- For game engines: Unity and Godot handle transparent PNGs natively

## Negative Prompt Additions

If you see backgrounds appearing, add to negative prompt:
```
background scene, environmental context, character holding weapon
```
