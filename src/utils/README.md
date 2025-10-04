# Asset Path Management System

Hệ thống quản lý đường dẫn asset được thiết kế để xử lý việc generate và normalize asset paths một cách nhất quán giữa frontend và backend.

## Vấn đề được giải quyết

- **Hard-coded paths**: Loại bỏ việc hard-code đường dẫn asset trong code
- **Backend/Frontend mismatch**: Xử lý sự khác biệt giữa path structure của backend và frontend
- **Inconsistent naming**: Chuẩn hóa naming convention cho assets
- **Fallback handling**: Xử lý trường hợp asset không tồn tại

## Cấu trúc Files

```
src/utils/
├── assetPath.ts          # Core asset path utilities
├── assetMigration.ts     # Migration và normalization utilities
└── assetPathExamples.ts  # Examples và documentation
```

## Core Functions

### `generateAssetPath(config)`

Generate asset path dựa trên category và item properties.

```typescript
const path = generateAssetPath({
  category: "pets",
  itemName: "Chog",
  variant: "idle",
  extension: "png"
});
// Result: "assets/images/pets/Chog/Chog_idle.png"
```

### `parseBackendImageUrl(imageUrl)`

Parse backend image URL và convert sang frontend-compatible path.

```typescript
const frontendPath = parseBackendImageUrl(
  "/assets/images/KeoneDog/keonedog_idle.png"
);
// Result: "assets/images/pets/Keonedog/Keonedog_idle.png"
```

### `getShopItemAssetPath(category, item)`

Main function để resolve asset path cho shop items với fallback logic.

```typescript
const path = getShopItemAssetPath("pets", {
  image_url: "/assets/images/KeoneDog/keonedog_idle.png",
  species: "KeoneDog"
});
```

## Asset Structure

### Pets

```
assets/images/pets/
├── Chog/
│   ├── Chog_idle.png
│   ├── Chog_walk.png
│   ├── Chog_sleep.png
│   └── Chog_eat.png
├── Keonedog/
│   ├── Keonedog_idle.png
│   └── Keonedog_walk.png
└── Ghost/
    └── Ghost_idle.png
```

### Other Categories

```
assets/images/
├── food/           # Food items
├── ball/           # Toy items
├── broom/          # Cleaning items
├── backgrounds/    # Background themes
└── effects/        # UI effects và fallbacks
```

## Usage trong Components

### ReactShopModal

```typescript
import { getShopItemAssetPath } from "@/utils/assetPath";

const getItemImageSrc = (category: string, item: ShopItem): string => {
  return getShopItemAssetPath(category, item);
};
```

### Pet Components

```typescript
import { generateAssetPath, PET_VARIANTS } from "@/utils/assetPath";

const getPetImageSrc = (species: string, variant: string) => {
  return generateAssetPath({
    category: "pets",
    itemName: species,
    variant: variant || PET_VARIANTS.IDLE
  });
};
```

## Backend Integration

### API Response Format

Backend nên trả về `image_url` với format:

```json
{
  "name": "KeoneDog",
  "image_url": "/assets/images/KeoneDog/keonedog_idle.png",
  "species": "KeoneDog"
}
```

### Normalization

Sử dụng `normalizePetAssetData()` để normalize backend data:

```typescript
const normalizedData = normalizePetAssetData(backendResponse);
```

## Migration từ Legacy System

### Legacy Path Mapping

```typescript
const LEGACY_PATH_MAPPING = {
  Chog: "pets/Chog",
  KeoneDog: "pets/Keonedog",
  Ghost: "pets/Ghost"
};
```

### Migration Process

1. Identify legacy paths trong codebase
2. Use `migrateLegacyPath()` để convert
3. Update asset folder structure
4. Test với new path generation

## Constants và Enums

### ASSET_PATHS

```typescript
export const ASSET_PATHS = {
  BASE: "assets/images/",
  FOOD: "assets/images/food/",
  PETS: "assets/images/pets/"
  // ...
};
```

### PET_VARIANTS

```typescript
export const PET_VARIANTS = {
  IDLE: "idle",
  WALK: "walk",
  SLEEP: "sleep",
  EAT: "eat",
  CHEW: "chew",
  IDLEPLAY: "idleplay"
};
```

## Best Practices

1. **Always use utility functions** thay vì hard-code paths
2. **Handle fallbacks** cho missing assets
3. **Normalize backend data** trước khi sử dụng
4. **Use constants** cho consistency
5. **Test với different scenarios** (missing assets, invalid URLs, etc.)

## Testing

Run examples để test functionality:

```typescript
import "./utils/assetPathExamples";
```

## Future Enhancements

- [ ] Asset validation và existence checking
- [ ] Dynamic asset loading với lazy loading
- [ ] CDN integration support
- [ ] Asset optimization và compression
- [ ] Asset caching strategies
