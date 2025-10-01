export interface TilemapInputConfig {
  rows: number;
  cols: number;
  tileWidth: number;
  tileHeight: number;
  offsetX?: number;
  offsetY?: number;
  drawGrid?: boolean;
}

export interface TileCoord {
  row: number;
  col: number;
}

export interface TilemapLayer {
  name: string;
  visible: boolean;
  opacity: number;
  data: number[][];
}

export interface TilemapData {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: TilemapLayer[];
}
