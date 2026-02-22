# WokGen Pixel — Tileset Workflow

This workflow creates a complete outdoor tileset for a top-down RPG.

## The 5-tile minimum set

Every top-down RPG needs these 5 tiles at minimum:
1. Grass (base ground)
2. Stone path (walkable road)
3. Water (impassable)
4. Tree/forest (obstacle)
5. Dirt (interior/transition)

## Studio Setup

1. Go to [wokgen.wokspec.org/pixel/studio](https://wokgen.wokspec.org/pixel/studio)
2. Select preset: **Tileset** (under Environment tab)
3. Select category: **Tile**
4. Set size: **32×32** or **16×16** (standard tile sizes)
5. Background: **Scene** (tileset needs full texture, not transparent)

## Example Prompts

### Grass Tile
```
lush green grass, top-down, seamless texture, even ground coverage
```

### Stone Path
```
grey cobblestone path, worn stones, top-down, seamless, medieval town
```

### Water Tile
```
blue water surface, light ripples, top-down, seamless, shallow pond
```

### Dense Forest Tile
```
dark green tree canopy, dense foliage, top-down, seamless, forest floor
```

### Dirt Path
```
brown dirt ground, light texture, top-down, seamless, outdoor path
```

## Critical Settings

- Always use **Tileset** preset — it forces seamless token injection
- Never use transparent background for tiles — they need full texture
- Keep size consistent across your entire set (all 32×32 or all 16×16)

## Consistency Tips

Use the same seed base across your tile set to maintain palette consistency.
If grass is seed 42, use seed 43 for stone, 44 for water, etc.

## Validation

After generating, check by:
1. Placing tiles edge-to-edge in any image editor
2. Looking for visible seams or color mismatch at borders
3. Regenerating any tile that doesn't blend with its neighbors
