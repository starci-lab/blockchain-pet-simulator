import { Pet } from '../entities/Pet'

export class ActivitySystem {
  private randomStopTimer: number = 0
  private nextRandomStopTime: number = 0
  private pet: Pet

  constructor(pet: Pet) {
    this.pet = pet
    this.setNextRandomStopTime()
  }

  update() {
    if (!this.pet.isUserControlled && this.pet.currentActivity === 'walk') {
      this.handleRandomStop()
    }
  }

  private handleRandomStop() {
    this.randomStopTimer += 1 / 60

    if (this.randomStopTimer >= this.nextRandomStopTime) {
      console.log('Random stop triggered!')
      this.randomActivity()
      this.setNextRandomStopTime()
      this.randomStopTimer = 0
    }
  }

  private setNextRandomStopTime() {
    this.nextRandomStopTime = Phaser.Math.Between(15, 25)
    console.log('Next random stop in:', this.nextRandomStopTime, 'seconds')
  }

  private getRandomWeightedActivity(pool: { name: string; weight: number }[]) {
    const total = pool.reduce((sum, a) => sum + a.weight, 0)
    const rand = Math.random() * total
    let acc = 0

    for (const act of pool) {
      acc += act.weight
      if (rand < acc) {
        return act.name
      }
    }

    // fallback
    return pool[0].name
  }

  private randomActivity() {
    const activityPool = [
      { name: 'idleplay', weight: 85 },
      { name: 'sleep', weight: 15 }
    ]

    const newActivity = this.getRandomWeightedActivity(activityPool)
    this.pet.setActivity(newActivity)
    this.pet.setActivity(newActivity)

    this.pet.sprite.once('animationcomplete', () => {
      if (
        !this.pet.isUserControlled &&
        this.pet.currentActivity === newActivity
      ) {
        console.log('Animation completed, returning to walk...')
        this.pet.setActivity('walk')
      }
    })
  }
}
