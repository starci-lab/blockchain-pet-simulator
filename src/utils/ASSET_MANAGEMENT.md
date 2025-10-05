# 🎨 Asset Management System

## Tổng quan

Hệ thống quản lý asset được thiết kế để tổ chức và serve đúng ảnh/sprite của từng pet một cách có hệ thống và dễ bảo trì.

## 📁 Cấu trúc Thư mục Đề xuất

```
src/assets/images/
├── pets/                          # Thư mục chính cho tất cả pets
│   ├── Chog/                      # Pet species đầu tiên
│   │   ├── chog_idle.png         # Sprite idle
│   │   ├── chog_idle.json        # Animation data
│   │   ├── chog_walk.png         # Sprite walk
│   │   ├── chog_walk.json        # Animation data
│   │   ├── chog_sleep.png        # Sprite sleep
│   │   ├── chog_sleep.json       # Animation data
│   │   ├── chog_chew.png         # Sprite chew
│   │   ├── chog_chew.json        # Animation data
│   │   ├── chog_idleplay.png     # Sprite idleplay
│   │   └── chog_idleplay.json    # Animation data
│   │
│   ├── KeoneDog/                 # Pet species thứ hai
│   │   ├── keonedog_idle.png
│   │   ├── keonedog_idle.json
│   │   ├── keonedog_walk.png
│   │   ├── keonedog_walk.json
│   │   ├── keonedog_sleep.png
│   │   ├── keonedog_sleep.json
│   │   ├── keonedog_chew.png
│   │   ├── keonedog_chew.json
│   │   ├── keonedog_idleplay.png
│   │   └── keonedog_idleplay.json
│   │
│   └── Ghost/                    # Pet species thứ ba
│       ├── ghost_idle.png
│       ├── ghost_idle.json
│       ├── ghost_walk.png
│       ├── ghost_walk.json
│       ├── ghost_sleep.png
│       ├── ghost_sleep.json
│       ├── ghost_chew.png
│       ├── ghost_chew.json
│       ├── ghost_idleplay.png
│       └── ghost_idleplay.json
│
├── food/                          # Thức ăn
├── toys/                         # Đồ chơi (moved from ball/)
├── cleaning/                     # Dụng cụ vệ sinh (moved from broom/)
├── backgrounds/                  # Nền
├── effects/                      # Hiệu ứng
└── ui/                          # Giao diện (moved from game-ui/)
```

## 🔧 Cách sử dụng

### 1. Import utilities

```typescript
import {
  getShopItemAssetPath,
  generateAssetPath,
  parseBackendImageUrl,
  ASSET_PATHS,
  PET_VARIANTS
} from "@/utils/assetPath";
```

### 2. Sử dụng trong components

```typescript
// Trong ReactShopModal hoặc component khác
const getItemImageSrc = (category: string, item: ShopItem): string => {
  return getShopItemAssetPath(category, item);
};

// Hoặc generate path trực tiếp
const petIdlePath = generateAssetPath({
  category: "pets",
  itemName: "KeoneDog",
  variant: PET_VARIANTS.IDLE,
  extension: "png"
});
// Result: "assets/images/pets/KeoneDog/keonedog_idle.png"
```

### 3. Parse URL từ backend

```typescript
// Backend URL: "/assets/images/KeoneDog/keonedog_idle.png"
const frontendPath = parseBackendImageUrl(
  "/assets/images/KeoneDog/keonedog_idle.png"
);
// Result: "assets/images/pets/KeoneDog/keonedog_idle.png"
```

## 🚀 Migration từ cấu trúc cũ

### Chạy migration script

```bash
# Chạy migration commands
npm run migrate-assets

# Hoặc chạy thủ công
node -e "require('./src/utils/assetMigrationScript').printMigrationInstructions()"
```

### Migration commands

```bash
# Tạo thư mục mới
mkdir -p src/assets/images/pets/Chog
mkdir -p src/assets/images/pets/KeoneDog
mkdir -p src/assets/images/pets/Ghost
mkdir -p src/assets/images/toys
mkdir -p src/assets/images/cleaning
mkdir -p src/assets/images/ui

# Di chuyển assets
mv src/assets/images/Chog/* src/assets/images/pets/Chog/
mv src/assets/images/ball/* src/assets/images/toys/
mv src/assets/images/broom/* src/assets/images/cleaning/
mv src/assets/images/game-ui/* src/assets/images/ui/

# Xóa thư mục cũ
rmdir src/assets/images/Chog
rmdir src/assets/images/ball
rmdir src/assets/images/broom
rmdir src/assets/images/game-ui
```

## 📋 Backend URL Mapping

| Backend URL                                 | Frontend Path                                   | Pet Species |
| ------------------------------------------- | ----------------------------------------------- | ----------- |
| `/assets/images/KeoneDog/keonedog_idle.png` | `assets/images/pets/KeoneDog/keonedog_idle.png` | KeoneDog    |
| `/assets/images/Chog/chog_idle.png`         | `assets/images/pets/Chog/chog_idle.png`         | Chog        |
| `/assets/images/Ghost/ghost_idle.png`       | `assets/images/pets/Ghost/ghost_idle.png`       | Ghost       |

## 🎯 Pet Variants

Mỗi pet cần có các variants sau:

- `idle` - Trạng thái nghỉ ngơi
- `walk` - Trạng thái đi bộ
- `sleep` - Trạng thái ngủ
- `chew` - Trạng thái nhai
- `idleplay` - Trạng thái chơi nhẹ

## 🔍 Validation

```typescript
import { validateAssetStructure } from "@/utils/assetMigrationScript";

const validation = validateAssetStructure();
if (!validation.isValid) {
  console.log("Issues:", validation.issues);
  console.log("Suggestions:", validation.suggestions);
}
```

## 📊 Asset Inventory

```typescript
import { generateAssetInventory } from "@/utils/assetMigrationScript";

const inventory = generateAssetInventory();
console.log("Pet assets:", inventory.pets);
console.log("Category assets:", inventory.categories);
```

## 🛠️ Troubleshooting

### Lỗi thường gặp

1. **Asset không load được**

   - Kiểm tra đường dẫn có đúng không
   - Verify file tồn tại trong thư mục
   - Check naming convention (lowercase với underscore)

2. **Animation không hoạt động**

   - Đảm bảo có cả file .png và .json
   - Kiểm tra format của animation data

3. **Backend URL không parse được**
   - Sử dụng `parseBackendImageUrl()` để convert
   - Check naming convention của backend

### Debug tips

```typescript
// Debug asset path generation
console.log(
  "Generated path:",
  generateAssetPath({
    category: "pets",
    itemName: "KeoneDog",
    variant: "idle"
  })
);

// Debug backend URL parsing
console.log(
  "Parsed URL:",
  parseBackendImageUrl("/assets/images/KeoneDog/keonedog_idle.png")
);
```

## 📝 Best Practices

1. **Naming Convention**

   - Pet folders: PascalCase (KeoneDog, Chog, Ghost)
   - Sprite files: lowercase với underscore (keonedog_idle.png)
   - Animation files: cùng tên với sprite nhưng .json

2. **File Organization**

   - Mỗi pet có thư mục riêng
   - Các variants được group trong cùng thư mục
   - Categories được tách biệt rõ ràng

3. **Performance**

   - Sử dụng constants để tránh hardcode paths
   - Cache asset paths khi có thể
   - Lazy load assets khi cần thiết

4. **Maintenance**
   - Regular validation của asset structure
   - Document naming conventions
   - Version control cho asset changes
