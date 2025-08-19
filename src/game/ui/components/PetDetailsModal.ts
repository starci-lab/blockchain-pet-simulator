import { type PetData } from "@/game/managers/PetManager";

export class PetDetailsModal {
  private isVisible: boolean = false;
  private currentPet: PetData | null = null;
  
  // Store creation time for each pet to prevent random changes
  private petCreationTimes: Map<string, number> = new Map();
  
  // Store base total earned for each pet (should come from server)
  private petTotalEarned: Map<string, number> = new Map();

  // Modal styling constants
  private static readonly MODAL_STYLES = {
    modal: `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(145deg, #F4A460, #E6944A);
      border: 3px solid #D2691E;
      border-radius: 20px;
      padding: 15px;
      color: #4A4A4A;
      width: 480px;
      height: auto;
      max-height: 600px;
      overflow-y: auto;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: Arial, sans-serif;
      animation: modalSlideIn 0.3s ease-out;
    `,
    section: `
      background: rgba(255, 255, 255, 0.3);
      border: 2px solid #D2691E;
      border-radius: 10px;
      padding: 15px;
      max-width: 400px;
      margin: 0 auto;
    `,
    petInfo: `
      margin-bottom: 15px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    `,
    economicInfo: `
      margin-bottom: 15px;
      padding: 10px;
      background: rgba(255, 215, 0, 0.2);
      border: 2px solid #FFD700;
      border-radius: 8px;
    `,
    closeButton: `
      position: absolute;
      top: 10px;
      right: 15px;
      background: rgba(139, 69, 19, 0.3);
      border: 1px solid #8B4513;
      color: #4A4A4A;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
  };

  create() {
    // Modal is created dynamically when needed
  }

  show(petData: PetData) {
    if (this.isVisible) return;

    this.currentPet = petData;
    this.isVisible = true;

    // Create modal window
    const modalWindow = document.createElement("div");
    modalWindow.id = "pet-details-modal";
    modalWindow.style.cssText = PetDetailsModal.MODAL_STYLES.modal;

    // Add CSS animation if not exists
    this.addModalAnimation();

    // Create main content
    const mainContent = this.createMainContent(petData);
    const closeButton = this.createCloseButton();

    modalWindow.appendChild(mainContent);
    modalWindow.appendChild(closeButton);
    document.body.appendChild(modalWindow);

    // Close on outside click
    modalWindow.addEventListener("click", (event) => {
      if (event.target === modalWindow) this.hide();
    });
  }

  // Show modal for specific pet (used for right-click)
  showForPet(petData: PetData) {
    // If modal is already visible, just update it with new pet data
    if (this.isVisible) {
      this.currentPet = petData;
      this.updateModalContent(petData);
    } else {
      // Show modal for first time with this specific pet
      this.show(petData);
    }
  }

  private addModalAnimation() {
    if (!document.getElementById("modal-styles")) {
      const style = document.createElement("style");
      style.id = "modal-styles";
      style.textContent = `
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  private createMainContent(petData: PetData): HTMLElement {
    const mainContent = document.createElement("div");

    const petDetailsSection = document.createElement("div");
    petDetailsSection.style.cssText = PetDetailsModal.MODAL_STYLES.section;

    // Header
    const detailsLabel = document.createElement("h3");
    detailsLabel.textContent = "Pet Details";
    detailsLabel.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #8B4513;
      text-align: center;
    `;

    // Pet info
    const petInfo = document.createElement("div");
    petInfo.style.cssText = PetDetailsModal.MODAL_STYLES.petInfo;

    const petID = document.createElement("p");
    petID.textContent = `Pet ID: ${petData.id}`;
    petID.style.cssText = `
      font-size: 14px;
      margin: 5px 0;
      color: #4A4A4A;
      font-weight: bold;
    `;
    petInfo.appendChild(petID);

    // Economic info section
    const economicInfo = this.createEconomicInfo(petData);

    // Stats bars
    const stats = [
      {
        label: "🍖 Hunger",
        value: petData.feedingSystem.hungerLevel,
        color: "#FF6B6B",
        className: "hunger",
      },
      {
        label: "🧼 Cleanliness",
        value: petData.cleanlinessSystem.cleanlinessLevel,
        color: "#4ECDC4",
        className: "cleanliness",
      },
      {
        label: "😊 Happiness",
        value: petData.happinessSystem.happinessLevel,
        color: "#FFE066",
        className: "happiness",
      },
    ];

    const statBars = stats.map((stat) =>
      this.createStatBar(stat.label, stat.value, stat.color, stat.className)
    );

    // Assemble
    petDetailsSection.appendChild(detailsLabel);
    petDetailsSection.appendChild(petInfo);
    petDetailsSection.appendChild(economicInfo);
    statBars.forEach((bar) => petDetailsSection.appendChild(bar));
    mainContent.appendChild(petDetailsSection);

    return mainContent;
  }

  private createEconomicInfo(petData: PetData): HTMLElement {
    const economicContainer = document.createElement("div");
    economicContainer.style.cssText = PetDetailsModal.MODAL_STYLES.economicInfo;

    // Economic section header
    const economicLabel = document.createElement("h4");
    economicLabel.textContent = "💰 Economic Stats";
    economicLabel.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #B8860B;
      text-align: center;
      font-weight: bold;
    `;

    // Calculate economic stats (simulated for now)
    const tokensPerCycle = this.calculateTokensPerCycle(petData);
    const totalTokensEarned = this.calculateTotalTokensEarned(petData);
    const timeInNature = this.calculateTimeInNature(petData);

    // Create economic info items
    const economicItems = [
      {
        icon: "💎",
        label: "Income per Cycle",
        value: `${tokensPerCycle.toFixed(2)} NOM`,
        id: "income-per-cycle",
      },
      {
        icon: "💰",
        label: "Total Earned",
        value: `${totalTokensEarned.toFixed(2)} NOM`,
        id: "total-earned",
      },
      {
        icon: "⏰",
        label: "Time in Nature",
        value: timeInNature,
        id: "time-nature",
      },
    ];

    economicContainer.appendChild(economicLabel);

    economicItems.forEach((item) => {
      const itemElement = this.createEconomicItem(
        item.icon,
        item.label,
        item.value,
        item.id
      );
      economicContainer.appendChild(itemElement);
    });

    return economicContainer;
  }

  private createEconomicItem(
    icon: string,
    label: string,
    value: string,
    id: string
  ): HTMLElement {
    const itemContainer = document.createElement("div");
    itemContainer.className = `economic-item-${id}`;
    itemContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 5px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    `;

    const labelSpan = document.createElement("span");
    labelSpan.textContent = `${icon} ${label}:`;
    labelSpan.style.cssText = `
      font-size: 14px;
      color: #4A4A4A;
      font-weight: bold;
    `;

    const valueSpan = document.createElement("span");
    valueSpan.className = `economic-value-${id}`;
    valueSpan.textContent = value;
    valueSpan.style.cssText = `
      font-size: 14px;
      color: #B8860B;
      font-weight: bold;
    `;

    itemContainer.appendChild(labelSpan);
    itemContainer.appendChild(valueSpan);

    return itemContainer;
  }

  private calculateTokensPerCycle(petData: PetData): number {
    // Base income calculation based on pet stats
    const hungerMultiplier = petData.feedingSystem.hungerLevel / 100;
    const cleanlinessMultiplier =
      petData.cleanlinessSystem.cleanlinessLevel / 100;
    const happinessMultiplier = petData.happinessSystem.happinessLevel / 100;

    // Average multiplier from all stats
    const avgMultiplier =
      (hungerMultiplier + cleanlinessMultiplier + happinessMultiplier) / 3;

    // Base income per cycle (can be configured)
    const baseIncome = 0.5;

    return baseIncome * avgMultiplier;
  }

  private calculateTotalTokensEarned(petData: PetData): number {
    // Initialize base earned amount if not exists
    if (!this.petTotalEarned.has(petData.id)) {
      // This would typically come from server data
      // For now, simulate an initial earned amount
      const baseEarned = Math.random() * 50 + 10; // Random between 10-60 NOM
      this.petTotalEarned.set(petData.id, baseEarned);
    }
    
    const baseEarned = this.petTotalEarned.get(petData.id)!;
    
    // Calculate additional earnings based on time since creation
    const creationTime = this.petCreationTimes.get(petData.id);
    if (creationTime) {
      const currentTime = Date.now();
      const timeAliveInHours = (currentTime - creationTime) / (1000 * 60 * 60);
      
      // Calculate average income per hour based on current stats
      const currentTokensPerCycle = this.calculateTokensPerCycle(petData);
      const cyclesPerHour = 6; // Assume 6 cycles per hour (10 minutes per cycle)
      const incomePerHour = currentTokensPerCycle * cyclesPerHour;
      
      // Add time-based earnings to base
      const timeBasedEarnings = timeAliveInHours * incomePerHour * 0.1; // Reduced multiplier to make it more realistic
      
      return baseEarned + timeBasedEarnings;
    }
    
    return baseEarned;
  }

  private calculateTimeInNature(petData: PetData): string {
    // Get or create creation time for this pet
    if (!this.petCreationTimes.has(petData.id)) {
      // This would typically come from server data (creation time, active time)
      // For now, simulate some time but store it persistently per pet
      const currentTime = Date.now();
      const estimatedCreationTime = currentTime - (Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time up to 7 days ago
      this.petCreationTimes.set(petData.id, estimatedCreationTime);
    }
    
    const currentTime = Date.now();
    const creationTime = this.petCreationTimes.get(petData.id)!;
    const diffInMs = currentTime - creationTime;
    
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  private createStatBar(
    label: string,
    value: number,
    color: string,
    className: string
  ): HTMLElement {
    const statContainer = document.createElement("div");
    statContainer.style.marginBottom = "8px";

    const statLabel = document.createElement("div");
    statLabel.className = `${className}-label`;
    statLabel.textContent = `${label}: ${Math.round(value)}%`;
    statLabel.style.cssText = `
      font-size: 14px;
      margin-bottom: 5px;
      color: #4A4A4A;
      font-weight: bold;
    `;

    const statBarBg = document.createElement("div");
    statBarBg.style.cssText = `
      width: 100%;
      height: 12px;
      background: rgba(139, 69, 19, 0.3);
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #D2691E;
    `;

    const statBarFill = document.createElement("div");
    statBarFill.className = `${className}-bar-fill`;
    statBarFill.style.cssText = `
      width: ${value}%;
      height: 100%;
      background: ${color};
      border-radius: 5px;
      transition: width 0.3s ease;
    `;

    statBarBg.appendChild(statBarFill);
    statContainer.appendChild(statLabel);
    statContainer.appendChild(statBarBg);

    return statContainer;
  }

  private createCloseButton(): HTMLElement {
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = PetDetailsModal.MODAL_STYLES.closeButton;
    closeButton.onclick = () => this.hide();
    return closeButton;
  }

  hide() {
    const modal = document.getElementById("pet-details-modal");
    if (modal) {
      modal.remove();
    }

    this.isVisible = false;
    this.currentPet = null;
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }

  private updateStatsDisplay() {
    if (!this.isVisible || !this.currentPet) return;

    const stats = [
      {
        type: "hunger",
        value: this.currentPet.feedingSystem.hungerLevel,
        label: "🍖 Hunger",
      },
      {
        type: "cleanliness",
        value: this.currentPet.cleanlinessSystem.cleanlinessLevel,
        label: "🧼 Cleanliness",
      },
      {
        type: "happiness",
        value: this.currentPet.happinessSystem.happinessLevel,
        label: "😊 Happiness",
      },
    ];

    stats.forEach((stat) => {
      const fill = document.querySelector(
        `#pet-details-modal .${stat.type}-bar-fill`
      ) as HTMLElement;
      const label = document.querySelector(
        `#pet-details-modal .${stat.type}-label`
      ) as HTMLElement;

      if (fill && label) {
        fill.style.width = `${stat.value}%`;
        label.textContent = `${stat.label}: ${Math.round(stat.value)}%`;
      }
    });

    // Update economic info in real-time
    this.updateEconomicInfo(this.currentPet);
  }

  private updateEconomicInfo(petData: PetData) {
    // Calculate updated economic stats
    const tokensPerCycle = this.calculateTokensPerCycle(petData);
    const totalTokensEarned = this.calculateTotalTokensEarned(petData);
    const timeInNature = this.calculateTimeInNature(petData);

    // Update income per cycle
    const incomeElement = document.querySelector(
      "#pet-details-modal .economic-value-income-per-cycle"
    ) as HTMLElement;
    if (incomeElement) {
      incomeElement.textContent = `${tokensPerCycle.toFixed(2)} NOM`;
    }

    // Update total earned
    const totalElement = document.querySelector(
      "#pet-details-modal .economic-value-total-earned"
    ) as HTMLElement;
    if (totalElement) {
      totalElement.textContent = `${totalTokensEarned.toFixed(2)} NOM`;
    }

    // Update time in nature
    const timeElement = document.querySelector(
      "#pet-details-modal .economic-value-time-nature"
    ) as HTMLElement;
    if (timeElement) {
      timeElement.textContent = timeInNature;
    }
  }

  private updateModalContent(petData: PetData) {
    // Update Pet ID in the modal
    const petIdElement = document.querySelector(
      "#pet-details-modal p"
    ) as HTMLElement;
    if (petIdElement) {
      petIdElement.textContent = `Pet ID: ${petData.id}`;
    }

    // Update all stat bars with new pet data
    const stats = [
      {
        type: "hunger",
        value: petData.feedingSystem.hungerLevel,
        label: "🍖 Hunger",
      },
      {
        type: "cleanliness",
        value: petData.cleanlinessSystem.cleanlinessLevel,
        label: "🧼 Cleanliness",
      },
      {
        type: "happiness",
        value: petData.happinessSystem.happinessLevel,
        label: "😊 Happiness",
      },
    ];

    stats.forEach((stat) => {
      const fill = document.querySelector(
        `#pet-details-modal .${stat.type}-bar-fill`
      ) as HTMLElement;
      const label = document.querySelector(
        `#pet-details-modal .${stat.type}-label`
      ) as HTMLElement;

      if (fill && label) {
        fill.style.width = `${stat.value}%`;
        label.textContent = `${stat.label}: ${Math.round(stat.value)}%`;
      }
    });

    // Update economic info
    this.updateEconomicInfo(petData);

    console.log(`✅ Modal content updated for Pet ${petData.id}`);
  }

  update() {
    if (this.isVisible && this.currentPet) {
      // Always update stats display for real-time updates
      this.updateStatsDisplay();
    }
  }

  destroy() {
    this.hide();
  }
}
