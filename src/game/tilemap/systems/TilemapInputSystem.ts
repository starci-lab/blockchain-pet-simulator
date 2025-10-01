import Phaser from "phaser";
import { eventBus, EventNames } from "../events/TilemapEvents";
import type { TilemapEventPayload } from "../events/TilemapEvents";
import type { TilemapInputConfig, TileCoord } from "../types/TilemapTypes";

export class TilemapInputSystem {
  private scene: Phaser.Scene;
  private map: Phaser.Tilemaps.Tilemap;
  private graphics?: Phaser.GameObjects.Graphics;
  private config: TilemapInputConfig;
  private pointerMoveHandler: (pointer: Phaser.Input.Pointer) => void;
  private pointerDownHandler: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene, config: TilemapInputConfig) {
    this.scene = scene;
    this.config = config;

    this.map = this.scene.make.tilemap({
      tileWidth: config.tileWidth,
      tileHeight: config.tileHeight,
      width: config.cols,
      height: config.rows
    });

    if (config.drawGrid) {
      this.graphics = this.scene.add.graphics();
      this.graphics.setDepth(9999);
      this.drawGrid();
    }

    this.pointerMoveHandler = (pointer) => this.onPointerMove(pointer);
    this.pointerDownHandler = (pointer) => this.onPointerDown(pointer);

    this.scene.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      this.pointerMoveHandler
    );
    this.scene.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      this.pointerDownHandler
    );
  }

  private drawGrid() {
    if (!this.graphics) return;
    const {
      cols,
      rows,
      tileWidth,
      tileHeight,
      offsetX = 0,
      offsetY = 0
    } = this.config;
    const width = cols * tileWidth;
    const height = rows * tileHeight;

    this.graphics.clear();
    this.graphics.lineStyle(1, 0xffffff, 0.2);

    for (let c = 0; c <= cols; c += 1) {
      const x = offsetX + c * tileWidth + 0.5;
      this.graphics.lineBetween(x, offsetY, x, offsetY + height);
    }
    for (let r = 0; r <= rows; r += 1) {
      const y = offsetY + r * tileHeight + 0.5;
      this.graphics.lineBetween(offsetX, y, offsetX + width, y);
    }
  }

  private getTileAtPointer(pointer: Phaser.Input.Pointer): TileCoord | null {
    const worldX = pointer.worldX - (this.config.offsetX || 0);
    const worldY = pointer.worldY - (this.config.offsetY || 0);
    const tileXY = this.map.worldToTileXY(worldX, worldY, true);

    if (!tileXY) {
      return null;
    }

    const inBounds =
      tileXY.x >= 0 &&
      tileXY.y >= 0 &&
      tileXY.x < this.config.cols &&
      tileXY.y < this.config.rows;
    return inBounds ? { row: tileXY.y, col: tileXY.x } : null;
  }

  private createEventPayload(
    tile: TileCoord,
    pointer: Phaser.Input.Pointer
  ): TilemapEventPayload {
    return {
      tile,
      worldX: pointer.worldX,
      worldY: pointer.worldY
    };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    const tile = this.getTileAtPointer(pointer);
    if (tile) {
      const payload = this.createEventPayload(tile, pointer);
      eventBus.emit(EventNames.TileHovered, payload);
    } else {
      eventBus.emit(EventNames.TileCleared);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    const tile = this.getTileAtPointer(pointer);
    if (tile) {
      const payload = this.createEventPayload(tile, pointer);
      eventBus.emit(EventNames.TileSelected, payload);
    }
  }

  destroy() {
    this.scene.input.off(
      Phaser.Input.Events.POINTER_MOVE,
      this.pointerMoveHandler
    );
    this.scene.input.off(
      Phaser.Input.Events.POINTER_DOWN,
      this.pointerDownHandler
    );
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = undefined;
    }
  }
}
