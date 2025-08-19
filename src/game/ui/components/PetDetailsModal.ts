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
      width: 20%;
      max-width: 350px;
      min-height: 150px;
      background: linear-gradient(180deg, #1D1D1D 0%, #141414 100%);
      border-radius: 21px;
      border: 0.84px solid transparent;
      background-clip: padding-box;
      box-shadow: 0px 0px 1.43px 0px rgba(0, 0, 0, 0.25), inset 0px 1.26px 1.26px 0px rgba(154, 154, 154, 0.45);
      display: block;
      flex-direction: column;
      padding: 12px;
      z-index: 100;
      color: #B3B3B3;
      font-family: 'Plus Jakarta Sans', sans-serif;
      animation: modalSlideIn 0.3s ease-out;
    `,
    header: `
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin-bottom: 8px;
      position: relative;
    `,
    title: `
      font-size: 12px;
      font-weight: 700;
      color: #B3B3B3;
      line-height: 1.26;
      text-align: center;
      margin: 0;
    `,
    closeButton: `
      background: #323232;
      border: none;
      color: #E95151;
      font-size: 8px;
      cursor: pointer;
      width: 12px;
      aspect-ratio: 1;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: inset 0px 0.84px 0.42px 0px rgba(199, 199, 199, 0.19);
      position: absolute;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
    `,
    contentWrapper: `
      background: #101010;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.5);
      box-shadow: inset 0px 2.52px 3.35px 0px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      flex: 1;
      padding: 12px;
    `,
    section: `
      margin-bottom: 12px;
    `,
    petInfo: `
      background: rgba(60, 60, 60, 0.26);
      border: 1.25px solid rgba(0, 0, 0, 0.37);
      border-radius: 18.73px;
      padding: 8px;
      margin-bottom: 12px;
      box-shadow: inset 0px 4.46px 5.95px 0px rgba(0, 0, 0, 0.3);
    `,
    economicInfo: `
      background: rgba(60, 60, 60, 0.26);
      border: 1.25px solid rgba(0, 0, 0, 0.37);
      border-radius: 18.73px;
      padding: 8px;
      margin-bottom: 12px;
      box-shadow: inset 0px 4.46px 5.95px 0px rgba(0, 0, 0, 0.3);
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

    // Create main content (includes header with close button)
    const mainContent = this.createMainContent(petData);

    modalWindow.appendChild(mainContent);
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
            transform: translate(-50%, -50%) scale(0.9);
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

    // Header
    const header = document.createElement("div");
    header.style.cssText = PetDetailsModal.MODAL_STYLES.header;

    const title = document.createElement("h3");
    title.textContent = "Pet Details";
    title.style.cssText = PetDetailsModal.MODAL_STYLES.title;

    const closeButton = this.createCloseButton();

    header.appendChild(title);
    header.appendChild(closeButton);

    // Content wrapper
    const contentWrapper = document.createElement("div");
    contentWrapper.style.cssText = PetDetailsModal.MODAL_STYLES.contentWrapper;

    // Pet info section
    const petInfo = document.createElement("div");
    petInfo.style.cssText = PetDetailsModal.MODAL_STYLES.petInfo;

    const petID = document.createElement("p");
    petID.textContent = `Pet ID: ${petData.id}`;
    petID.style.cssText = `
      font-size: 12px;
      margin: 0;
      color: #B3B3B3;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      text-align: center;
    `;
    petInfo.appendChild(petID);

    // Economic info section
    const economicInfo = this.createEconomicInfo(petData);

    // Stats section
    const statsSection = document.createElement("div");
    statsSection.style.cssText = PetDetailsModal.MODAL_STYLES.section;

    const stats = [
      {
        label: "Hunger",
        value: petData.feedingSystem.hungerLevel,
        color: "#8B5CF6", // Purple for hunger
        className: "hunger",
      },
      {
        label: "Cleanliness",
        value: petData.cleanlinessSystem.cleanlinessLevel,
        color: "#06B6D4", // Cyan for cleanliness
        className: "cleanliness",
      },
      {
        label: "Happiness",
        value: petData.happinessSystem.happinessLevel,
        color: "#F59E0B", // Amber for happiness
        className: "happiness",
      },
    ];

    const statBars = stats.map((stat) =>
      this.createStatBar(stat.label, stat.value, stat.color, stat.className)
    );

    statBars.forEach((bar) => statsSection.appendChild(bar));

    // Assemble content
    contentWrapper.appendChild(petInfo);
    contentWrapper.appendChild(economicInfo);
    contentWrapper.appendChild(statsSection);

    mainContent.appendChild(header);
    mainContent.appendChild(contentWrapper);

    return mainContent;
  }

  private createEconomicInfo(petData: PetData): HTMLElement {
    const economicContainer = document.createElement("div");
    economicContainer.style.cssText = PetDetailsModal.MODAL_STYLES.economicInfo;

    // Economic section header
    const economicLabel = document.createElement("h4");
    economicLabel.textContent = "Economic Stats";
    economicLabel.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #B3B3B3;
      text-align: center;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;

    // Calculate economic stats
    const tokensPerCycle = this.calculateTokensPerCycle(petData);
    const totalTokensEarned = this.calculateTotalTokensEarned(petData);
    const timeInNature = this.calculateTimeInNature(petData);

    // Create economic info items
    const economicItems = [
      {
        label: "Income per Cycle",
        value: `${tokensPerCycle.toFixed(2)} NOM`,
        id: "income-per-cycle",
      },
      {
        label: "Total Earned",
        value: `${totalTokensEarned.toFixed(2)} NOM`,
        id: "total-earned",
      },
      {
        label: "Time in Nature",
        value: timeInNature,
        id: "time-nature",
      },
    ];

    economicContainer.appendChild(economicLabel);

    economicItems.forEach((item) => {
      const itemElement = this.createEconomicItem(
        item.label,
        item.value,
        item.id
      );
      economicContainer.appendChild(itemElement);
    });

    return economicContainer;
  }

  private createEconomicItem(
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
      padding: 8px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    `;

    const labelSpan = document.createElement("span");
    labelSpan.textContent = `${label}:`;
    labelSpan.style.cssText = `
      font-size: 12px;
      color: #B3B3B3;
      font-weight: 500;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;

    const valueSpan = document.createElement("span");
    valueSpan.className = `economic-value-${id}`;
    valueSpan.textContent = value;
    valueSpan.style.cssText = `
      font-size: 12px;
      color: #FFFFFF;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
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
      const estimatedCreationTime =
        currentTime - Math.random() * 7 * 24 * 60 * 60 * 1000; // Random time up to 7 days ago
      this.petCreationTimes.set(petData.id, estimatedCreationTime);
    }

    const currentTime = Date.now();
    const creationTime = this.petCreationTimes.get(petData.id)!;
    const diffInMs = currentTime - creationTime;

    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
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
    statContainer.style.cssText = `
      margin-bottom: 12px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    `;

    const statLabel = document.createElement("div");
    statLabel.className = `${className}-label`;
    statLabel.textContent = `${label}: ${Math.round(value)}%`;
    statLabel.style.cssText = `
      font-size: 12px;
      margin-bottom: 6px;
      color: #B3B3B3;
      font-weight: 500;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;

    const statBarBg = document.createElement("div");
    statBarBg.style.cssText = `
      width: 100%;
      height: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      overflow: hidden;
    `;

    const statBarFill = document.createElement("div");
    statBarFill.className = `${className}-bar-fill`;
    statBarFill.style.cssText = `
      width: ${value}%;
      height: 100%;
      background: ${color};
      border-radius: 4px;
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
        label: "Hunger",
      },
      {
        type: "cleanliness",
        value: this.currentPet.cleanlinessSystem.cleanlinessLevel,
        label: "Cleanliness",
      },
      {
        type: "happiness",
        value: this.currentPet.happinessSystem.happinessLevel,
        label: "Happiness",
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
    // Update Pet ID in the modal (first p element in pet info)
    const petIdElements = document.querySelectorAll("#pet-details-modal p");
    if (petIdElements.length > 0) {
      (petIdElements[0] as HTMLElement).textContent = `Pet ID: ${petData.id}`;
    }

    // Update all stat bars with new pet data
    const stats = [
      {
        type: "hunger",
        value: petData.feedingSystem.hungerLevel,
        label: "Hunger",
      },
      {
        type: "cleanliness",
        value: petData.cleanlinessSystem.cleanlinessLevel,
        label: "Cleanliness",
      },
      {
        type: "happiness",
        value: petData.happinessSystem.happinessLevel,
        label: "Happiness",
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
