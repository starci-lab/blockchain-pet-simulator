import { Pet } from '../entities/Pet'

export class MovementSystem {
  private pet: Pet
  private cameraWidth: number

  constructor(pet: Pet, cameraWidth: number) {
    this.pet = pet
    this.cameraWidth = cameraWidth
  }

  update(): {
    reachedTarget: boolean
    targetX?: number
    targetY?: number
  } | void {
    // Ensure pet stays on ground line
    this.pet.enforceGroundLine()

    // Handle chasing food
    if (this.pet.isChasing && this.pet.chaseTarget) {
      return this.handleChasing()
    } else if (!this.pet.isUserControlled) {
      if (this.pet.currentActivity === 'walk') {
        this.handleWalkCycle()
      }
    }

    if (this.pet.isMoving && this.pet.currentActivity === 'walk') {
      this.handleMovement()
    }
  }

  private handleChasing() {
    if (!this.pet.chaseTarget) return

    const targetX = this.pet.chaseTarget.x
    const targetY = this.pet.chaseTarget.y
    const distance = Phaser.Math.Distance.Between(
      this.pet.sprite.x,
      this.pet.sprite.y,
      targetX,
      targetY
    )

    // Nếu đủ gần thì dừng chase
    if (distance < 20) {
      return { reachedTarget: true, targetX, targetY }
    }

    // Di chuyển về phía food - CHỈ THEO TRỤC X để giữ ground line
    const deltaX = targetX - this.pet.sprite.x

    // Chỉ di chuyển theo trục X, giữ nguyên Y (ground line)
    if (Math.abs(deltaX) > 5) {
      // Dead zone để tránh jittering
      this.pet.sprite.x += Math.sign(deltaX) * this.pet.speed * (1 / 60)

      // Flip sprite theo hướng di chuyển
      if (deltaX > 0) {
        this.pet.sprite.setFlipX(false)
        this.pet.direction = 1
      } else {
        this.pet.sprite.setFlipX(true)
        this.pet.direction = -1
      }
    }

    return { reachedTarget: false }
  }

  private handleWalkCycle() {
    const dogWidth = 40 * 2
    if (
      this.pet.sprite.x >= this.cameraWidth - dogWidth / 2 &&
      this.pet.direction === 1 &&
      this.pet.lastEdgeHit !== 'right'
    ) {
      this.pet.direction = -1
      this.pet.sprite.setFlipX(true)
      this.pet.lastEdgeHit = 'right'
    } else if (
      this.pet.sprite.x <= dogWidth / 2 &&
      this.pet.direction === -1 &&
      this.pet.lastEdgeHit !== 'left'
    ) {
      this.pet.direction = 1
      this.pet.sprite.setFlipX(false)
      this.pet.lastEdgeHit = 'left'
    }
  }

  private handleMovement() {
    this.pet.sprite.x += this.pet.direction * this.pet.speed * (1 / 60)
  }
}
