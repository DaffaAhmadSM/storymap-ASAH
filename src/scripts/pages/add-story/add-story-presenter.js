import syncManager from "../../utils/sync-manager.js";

class AddStoryPresenter {
  constructor(model, view, authService, config) {
    this.model = model;
    this.view = view;
    this.authService = authService;
    this.config = config;
    this.map = null;
    this.pickingLocation = false;
    this.locationMarker = null;
  }

  async init() {
    this.setupEventListeners();
    this.initMap();
  }

  setupEventListeners() {
    const form = this.view.getForm();
    if (form) {
      form.addEventListener("submit", this.handleSubmit.bind(this));
    }

    const cancelBtn = document.getElementById("cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        window.location.hash = "#/map";
      });
    }

    const photoInput = this.view.getPhotoInput();
    if (photoInput) {
      photoInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          this.view.updatePhotoPreview(e.target.files[0]);
        }
      });
    }

    const photoMethodRadios = this.view.getPhotoMethodRadios();
    photoMethodRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        this.view.handlePhotoMethodChange();
      });
    });

    const startCameraBtn = this.view.getStartCameraBtn();
    if (startCameraBtn) {
      startCameraBtn.addEventListener("click", () => {
        this.view.startCamera();
      });
    }

    const capturePhotoBtn = this.view.getCapturePhotoBtn();
    if (capturePhotoBtn) {
      capturePhotoBtn.addEventListener("click", () => {
        this.view.capturePhoto();
      });
    }

    const retakePhotoBtn = this.view.getRetakePhotoBtn();
    if (retakePhotoBtn) {
      retakePhotoBtn.addEventListener("click", () => {
        this.view.retakePhoto();
      });
    }

    const locationRadios = this.view.getLocationRadios();
    locationRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        this.handleLocationTypeChange();
      });
    });

    const pickLocationBtn = document.getElementById("pick-location-btn");
    if (pickLocationBtn) {
      pickLocationBtn.addEventListener("click", () => {
        this.enableLocationPicking();
      });
    }
  }

  initMap() {
    const mapElement = document.getElementById("preview-map");
    if (!mapElement) return;

    this.map = L.map("preview-map").setView([-6.2088, 106.8456], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  handleLocationTypeChange() {
    const locationType = this.view.getSelectedLocationType();

    if (locationType === "pick") {
      this.view.showPickLocationButton();
    } else {
      this.view.hidePickLocationButton();
      this.view.clearSelectedLocation();
      this.disableLocationPicking();
    }
  }

  enableLocationPicking() {
    if (!this.map) return;

    this.pickingLocation = true;
    const pickBtn = document.getElementById("pick-location-btn");
    if (pickBtn) {
      pickBtn.textContent = "Click on the map to pick location...";
      pickBtn.disabled = true;
    }

    document.getElementById("preview-map").style.cursor = "crosshair";

    this.map.once("click", (e) => {
      const { lat, lng } = e.latlng;
      this.view.setSelectedLocation(lat, lng);

      if (this.locationMarker) {
        this.map.removeLayer(this.locationMarker);
      }

      this.locationMarker = L.marker([lat, lng]).addTo(this.map);

      this.disableLocationPicking();
    });
  }

  disableLocationPicking() {
    this.pickingLocation = false;
    const pickBtn = document.getElementById("pick-location-btn");
    if (pickBtn) {
      pickBtn.textContent = "Pick Location from Map";
      pickBtn.disabled = false;
    }

    const mapElement = document.getElementById("preview-map");
    if (mapElement) {
      mapElement.style.cursor = "";
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    const formData = this.view.getFormData();

    if (!formData.photo) {
      this.view.showError("Please select or capture a photo");
      return;
    }

    if (!formData.description.trim()) {
      this.view.showError("Please enter a description");
      return;
    }

    const data = new FormData();
    data.append("photo", formData.photo);
    data.append("description", formData.description);

    if (formData.locationType === "current") {
      try {
        const position = await this.getCurrentPosition();
        data.append("lat", position.coords.latitude);
        data.append("lon", position.coords.longitude);
      } catch (error) {
        this.view.showError(
          "Unable to get current location. Please try another method."
        );
        return;
      }
    } else if (formData.locationType === "pick") {
      const selectedLocation = this.view.getSelectedLocation();
      if (!selectedLocation) {
        this.view.showError("Please pick a location from the map");
        return;
      }
      data.append("lat", selectedLocation.lat);
      data.append("lon", selectedLocation.lng);
    }

    try {
      this.view.showLoading(true);
      this.view.disableForm(true);

      const token = this.authService.getToken();

      // Check if online
      if (!navigator.onLine) {
        // Save offline
        const result = await syncManager.saveStoryOffline(data);

        this.view.showLoading(false);
        this.view.showSuccess("Story saved offline! Will sync when online.");

        setTimeout(() => {
          window.location.hash = "#/map";
        }, 2000);
        return;
      }

      // Online - send to API directly
      const result = await this.model.addStory(this.config.apiUrl, data, token);

      this.view.showLoading(false);
      this.view.showSuccess("Story added successfully! Redirecting to map...");

      setTimeout(() => {
        window.location.hash = "#/map";
      }, 2000);
    } catch (error) {
      this.view.showLoading(false);
      this.view.disableForm(false);
      this.view.showError(error.message || "Failed to add story");
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  }

  destroy() {
    this.view.stopCamera();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export default AddStoryPresenter;
