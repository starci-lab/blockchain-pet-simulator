# 🎮 Game Asset Loading Guide

## Tổng quan

File `src/game/load/asset.ts` chứa các functions để load assets cho game, bao gồm pets, backgrounds, food, effects và UI elements.

## 🐕 Pet Assets

### Chog (Chó)

```typescript
import { loadChogAssets } from "@/game/load/asset";

// Load Chog assets
loadChogAssets(scene);
```

**Available animations:**

- `dog-sleep` - Chó ngủ
- `dog-play` - Chó chơi
- `dog-chew` - Chó nhai
- `dog-walk` - Chó đi bộ

### KeoneDog (Chó tím-xanh)

```typescript
import { loadKeoneDogAssets } from "@/game/load/asset";

// Load KeoneDog assets
loadKeoneDogAssets(scene);
```

**Available animations:**

- `keonedog-idle` - KeoneDog nghỉ ngơi
- `keonedog-sleep` - KeoneDog ngủ
- `keonedog-play` - KeoneDog chơi
- `keonedog-chew` - KeoneDog nhai
- `keonedog-walk` - KeoneDog đi bộ

### Ghost (Ma)

```typescript
import { loadGhostAssets } from "@/game/load/asset";

// Load Ghost assets
loadGhostAssets(scene);
```

**Available animations:**

- `ghost-idle` - Ghost nghỉ ngơi
- `ghost-sleep` - Ghost ngủ
- `ghost-play` - Ghost chơi
- `ghost-chew` - Ghost nhai
- _Note: Ghost không có walk animation_

### Load All Pet Assets

```typescript
import { loadAllPetAssets } from "@/game/load/asset";

// Load tất cả pet assets
loadAllPetAssets(scene);
```

## 🎨 Other Assets

### Backgrounds

```typescript
import { loadBackgroundAssets } from "@/game/load/asset";

loadBackgroundAssets(scene);
// Loads: game-background, forest-bg
```

### Food

```typescript
import { loadFoodAssets } from "@/game/load/asset";

loadFoodAssets(scene);
// Loads: hamburger
```

### Toys

```typescript
import { loadToyAssets } from "@/game/load/asset";

loadToyAssets(scene);
// Loads: ball
```

### Cleaning Tools

```typescript
import { loadCleaningAssets } from "@/game/load/asset";

loadCleaningAssets(scene);
// Loads: broom
```

### Effects

```typescript
import { loadEffectAssets } from "@/game/load/asset";

loadEffectAssets(scene);
// Loads: heart, coin
```

### UI Elements

```typescript
import { loadUiAssets } from "@/game/load/asset";

loadUiAssets(scene);
// Loads: setting, shop, home
```

## 🚀 Cách sử dụng trong Game Scene

```typescript
import Phaser from "phaser";
import {
  loadAllPetAssets,
  loadBackgroundAssets,
  loadFoodAssets,
  loadEffectAssets,
  loadUiAssets
} from "@/game/load/asset";

export class GameScene extends Phaser.Scene {
  preload() {
    // Load tất cả assets cần thiết
    loadAllPetAssets(this);
    loadBackgroundAssets(this);
    loadFoodAssets(this);
    loadEffectAssets(this);
    loadUiAssets(this);
  }

  create() {
    // Tạo pet với animation
    const pet = this.add.sprite(400, 300, "keonedog-idle");

    // Tạo animation từ atlas
    this.anims.create({
      key: "keonedog-idle-anim",
      frames: this.anims.generateFrameNames("keonedog-idle"),
      repeat: -1
    });

    // Play animation
    pet.play("keonedog-idle-anim");
  }
}
```

## 📁 Asset Structure

```
src/assets/images/
├── Chog/                    # Chog assets (legacy structure)
│   ├── chog_idle.png
│   ├── chog_idle.json
│   ├── chog_walk.png
│   ├── chog_walk_animated.json
│   ├── chog_sleep.png
│   ├── chog_sleep.json
│   ├── chog_chew.png
│   ├── chog_chew.json
│   ├── chog_idleplay.png
│   └── chog_idleplay.json
│
├── KeoneDog/                # KeoneDog assets (legacy structure)
│   ├── keonedog_idle.png
│   ├── keonedog_idle.json
│   ├── keonedog_walk.png
│   ├── keonedog_walk.json
│   ├── keonedog_sleep.png
│   ├── keonedog_sleep.json
│   ├── keonedog_chew.png
│   ├── keonedog_chew.json
│   ├── keonedog_idleplay.png
│   └── keonedog_idleplay.json
│
├── pets/
│   └── Ghost/               # Ghost assets (new structure)
│       ├── ghost_idle.png
│       ├── ghost_idle.json
│       ├── ghost_sleep.png
│       ├── ghost_sleep.json
│       ├── ghost_chew.png
│       ├── ghost_chew.json
│       ├── ghost_idleplay.png
│       └── ghost_idleplay.json
│
├── food/
├── ball/
├── broom/
├── backgrounds/
├── effects/
└── game-ui/
```

## 🔄 Migration Notes

- **Chog**: Vẫn sử dụng cấu trúc cũ (`src/assets/images/Chog/`)
- **KeoneDog**: Vẫn sử dụng cấu trúc cũ (`src/assets/images/KeoneDog/`)
- **Ghost**: Đã sử dụng cấu trúc mới (`src/assets/images/pets/Ghost/`)

Sau khi migration hoàn tất, tất cả pets sẽ được chuyển vào `src/assets/images/pets/` và imports sẽ được cập nhật.

## 🎯 Animation Keys

Khi sử dụng animations trong game, sử dụng các keys sau:

### Chog

- `dog-sleep`
- `dog-play`
- `dog-chew`
- `dog-walk`

### KeoneDog

- `keonedog-idle`
- `keonedog-sleep`
- `keonedog-play`
- `keonedog-chew`
- `keonedog-walk`

### Ghost

- `ghost-idle`
- `ghost-sleep`
- `ghost-play`
- `ghost-chew`

## 🛠️ Troubleshooting

### Asset không load được

1. Kiểm tra đường dẫn import có đúng không
2. Verify file tồn tại trong thư mục
3. Check naming convention

### Animation không hoạt động

1. Đảm bảo có cả file .png và .json
2. Kiểm tra animation key có đúng không
3. Verify atlas được load trước khi tạo animation

### Performance Issues

1. Chỉ load assets cần thiết
2. Sử dụng `loadAllPetAssets()` để load tất cả pets cùng lúc
3. Cache animations khi có thể
