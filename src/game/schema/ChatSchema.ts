import { Schema, type, MapSchema } from '@colyseus/schema'

// export class Player extends Schema {
//   @type('string') sessionId: string = ''
//   @type('string') name: string = ''
//   @type('number') joinedAt: number = 0
//   @type('boolean') isOnline: boolean = true
// }

// export class ChatRoomState extends Schema {
//   @type({ map: Player }) players: MapSchema<Player> = new MapSchema<Player>()
//   @type('number') maxPlayers: number = 50
//   @type('number') createdAt: number = 0
//   @type('string') roomName: string = 'Chat Room'
//   @type('boolean') isActive: boolean = true
// }
export class Player extends Schema {
  @type('string')
  sessionId: string = ''
  @type('string')
  name: string = ''
  @type('boolean')
  isOnline: boolean = true

  constructor() {
    super()
  }
}

export class GameRoomState extends Schema {
  @type({ map: Player })
  players: MapSchema<Player> = new MapSchema<Player>()
  @type('string')
  roomName: string = 'Game Room'
  @type('boolean')
  isActive: boolean = true
  @type('number')
  playerCount: number = 0

  constructor() {
    super()
  }
}
