import Phaser from "phaser";
import { TileCoord } from "../types/TilemapTypes";

// Simple singleton event bus for React ↔ Phaser communication
class GlobalEventBus extends Phaser.Events.EventEmitter {}

export const eventBus = new GlobalEventBus();

// Event names used across React and Phaser
export const EventNames = {
  TileSelected: "ui:tile:selected",
  TileHovered: "ui:tile:hovered",
  TileCleared: "ui:tile:cleared"
} as const;

export type TilemapEventPayload = {
  tile: TileCoord;
  worldX: number;
  worldY: number;
  layer?: string;
};
