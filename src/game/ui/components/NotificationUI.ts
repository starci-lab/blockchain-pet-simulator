const UI_FONT = 'monospace'
const TOAST_WIDTH = 180
const TOAST_DURATION = 2500
const TOAST_BG_COLOR = 0xf5a623

export class NotificationUI {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Public method for external components (like ColyseusClient) to show notifications
  showNotification(message: string, x?: number, y?: number) {
    const toastX = x !== undefined ? x : this.scene.cameras.main.width / 2
    const toastY = y !== undefined ? y : this.scene.cameras.main.height / 2

    const toast = (this.scene as any).rexUI.add
      .dialog({
        x: toastX,
        y: toastY,
        width: TOAST_WIDTH,
        background: (this.scene as any).rexUI.add.roundRectangle(
          0,
          0,
          0,
          0,
          12,
          TOAST_BG_COLOR
        ),
        content: this.scene.add.text(0, 0, message, {
          fontSize: '14px',
          color: '#fff',
          fontFamily: UI_FONT,
          padding: { x: 8, y: 4 },
          wordWrap: { width: TOAST_WIDTH - 30 },
          align: 'center'
        }),
        space: {
          content: 10,
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      })
      .layout()
      .setDepth(1000)
      .popUp(300)

    this.scene.time.delayedCall(TOAST_DURATION, () => {
      toast.destroy()
    })
  }
}
