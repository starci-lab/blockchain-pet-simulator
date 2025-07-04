import { useUserStore } from '@/store/userStore'

const UI_FONT = 'monospace'
const TOKEN_BG_COLOR = 0xf5e6b3
const TOKEN_BORDER_COLOR = 0xc2a14d
const TOKEN_TEXT_COLOR = '#a86c00'
const SHOP_WIDTH = 70
const SHOP_HEIGHT = 28

export class TokenUI {
  private scene: Phaser.Scene
  private tokenText!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  create() {
    const tokenX = this.scene.cameras.main.width - 30
    const tokenY = 18

    const bg = this.scene.add.rectangle(
      tokenX,
      tokenY,
      SHOP_WIDTH,
      SHOP_HEIGHT,
      TOKEN_BG_COLOR,
      0.98
    )
    bg.setStrokeStyle(2, TOKEN_BORDER_COLOR).setOrigin(1, 0)

    this.tokenText = this.scene.add
      .text(tokenX - 8, tokenY + 2, '', {
        fontSize: '16px',
        color: TOKEN_TEXT_COLOR,
        fontStyle: 'bold',
        fontFamily: UI_FONT,
        padding: { x: 4, y: 2 }
      })
      .setOrigin(1, 0)

    this.update()
  }

  update() {
    const nomToken = useUserStore.getState().nomToken
    this.tokenText.setText(`🪙 ${nomToken}`)
  }
}
