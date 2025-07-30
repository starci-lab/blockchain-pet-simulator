import { PetManager, type PetData } from "@/game/managers/PetManager";

export class PetDetailsModal {
  private petManager: PetManager;
  private isVisible: boolean = false;
  private currentPet: PetData | null = null;

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
      width: 450px;
      height: auto;
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

  constructor(petManager: PetManager) {
    this.petManager = petManager;
  }

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
    statBars.forEach((bar) => petDetailsSection.appendChild(bar));
    mainContent.appendChild(petDetailsSection);

    return mainContent;
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

    console.log(`✅ Modal content updated for Pet ${petData.id}`);
  }

  update() {
    if (this.isVisible) {
      // Check if active pet has changed
      const activePet = this.petManager.getActivePet();

      if (activePet && activePet.id !== this.currentPet?.id) {
        console.log(
          `🔄 Active pet changed from ${this.currentPet?.id} to ${activePet.id}, updating modal`
        );

        // Update current pet reference
        this.currentPet = activePet;

        // Update the modal content with new pet data
        this.updateModalContent(activePet);
      }

      // Always update stats display for real-time updates
      if (this.currentPet) {
        this.updateStatsDisplay();
      }
    }
  }

  destroy() {
    this.hide();
  }
}
