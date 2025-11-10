import idbHelper from "../../utils/idb-helper.js";

class MapView {
  constructor() {
    this.map = null;
    this.currentLocation = null;
    this.selectedLocation = null;
    this.locationMarker = null;
    this.isSelectingLocation = false;
    this.markers = {};
    this.highlightedMarker = null;
    this.allStories = []; // Store all stories for filtering
    this.currentFilter = "all";
    this.currentSort = "newest";
    this.searchQuery = "";
  }

  getLoadingElement() {
    return document.getElementById("loading");
  }

  getErrorElement() {
    return document.getElementById("error");
  }

  getMapElement() {
    return document.getElementById("map");
  }

  getAddStoryButton() {
    return document.getElementById("add-story-btn");
  }

  getAddStoryModal() {
    return document.getElementById("add-story-modal");
  }

  getAddStoryForm() {
    return document.getElementById("add-story-form");
  }

  getCloseModalButton() {
    return document.getElementById("close-modal");
  }

  getPhotoInput() {
    return document.getElementById("photo-input");
  }

  getPhotoPreview() {
    return document.getElementById("photo-preview");
  }

  getUseLocationCheckbox() {
    return document.getElementById("use-location");
  }

  getSuccessMessage() {
    return document.getElementById("success-message");
  }

  getLocationTypeRadios() {
    return document.getElementsByName("location-type");
  }

  getSelectedLocationInfo() {
    return document.getElementById("selected-location-info");
  }

  getPickLocationBtn() {
    return document.getElementById("pick-location-btn");
  }

  getStoryListSidebar() {
    return document.getElementById("story-list-sidebar-id");
  }

  getStoryDetailModal() {
    return document.getElementById("story-detail-modal");
  }

  getToggleSidebarBtn() {
    return document.getElementById("toggle-sidebar-btn");
  }

  getToggleSidebarBtn2() {
    return document.getElementById("toggle-sidebar-btn-2");
  }

  initializeMap(lat, lon, zoom) {
    const mapElement = this.getMapElement();
    if (!mapElement) {
      console.error("Map element not found");
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.map = L.map("map").setView([lat, lon], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);
  }

  renderMarkers(stories) {
    if (!this.map) {
      console.error("Map is not initialized");
      return;
    }

    Object.values(this.markers).forEach((marker) => {
      this.map.removeLayer(marker);
    });
    this.markers = {};

    const validStories = stories.filter((story) => {
      return (
        story.lat &&
        story.lon &&
        typeof story.lat === "number" &&
        typeof story.lon === "number"
      );
    });

    validStories.forEach((story) => {
      const icon = L.icon({
        iconUrl: story.photoUrl || "/stories-placeholder.png",
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50],
      });
      const marker = L.marker([story.lat, story.lon], {
        icon: icon,
      }).addTo(this.map);

      const popupContent = this.createPopupContent(story);
      marker.bindPopup(popupContent);

      // Store marker reference
      this.markers[story.id] = marker;
    });

    if (validStories.length > 0) {
      const group = L.featureGroup(
        validStories.map((story) => L.marker([story.lat, story.lon]))
      );
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Creates HTML content for a marker popup
   */
  createPopupContent(story) {
    const imageUrl = story.photoUrl || "/stories-placeholder.png";
    const name = story.name || "Unnamed Story";
    const description = story.description || "No description available";
    const createdDate = new Date(story.createdAt).toLocaleString();

    return `
      <div class="popup-content" role="article" aria-label="Story details">
        <img 
          src="${imageUrl}" 
          alt="${this.escapeHtml(name)} - Story photo" 
          onerror="this.src='/stories-placeholder.png'; this.alt='Image not available'"
          loading="lazy"
        >
        <div class="popup-info">
          <h3>${this.escapeHtml(name)}</h3>
          <p>${this.escapeHtml(description)}</p>
          <p><time datetime="${story.createdAt}">${createdDate}</time></p>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showLoading(isLoading) {
    const loadingElement = this.getLoadingElement();
    if (!loadingElement) return;

    if (isLoading) {
      loadingElement.classList.remove("hidden");
      loadingElement.style.display = "block";
    } else {
      loadingElement.classList.add("hidden");
      loadingElement.style.display = "none";
    }
  }

  /**
   * Shows or hides an error message
   */
  showError(message) {
    const errorElement = this.getErrorElement();
    if (!errorElement) return;

    if (message) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    } else {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    }
  }

  /**
   * Initialize Add Story modal and event listeners
   */
  initAddStoryModal(onSubmit) {
    const addStoryBtn = this.getAddStoryButton();
    const modal = this.getAddStoryModal();
    const closeBtn = this.getCloseModalButton();
    const cancelBtn = document.getElementById("cancel-btn");
    const form = this.getAddStoryForm();
    const photoInput = this.getPhotoInput();
    const photoPreview = this.getPhotoPreview();
    const pickLocationBtn = this.getPickLocationBtn();

    // Open modal
    if (addStoryBtn) {
      addStoryBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        this.getCurrentLocation();
        this.resetLocationSelection();
      });
    }

    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closeModal();
        this.stopCamera();
      });
    }

    // Cancel button
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.closeModal();
        this.stopCamera();
      });
    }

    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
          this.stopCamera();
        }
      });
    }

    // Photo method radio buttons
    const photoMethodRadios = document.querySelectorAll(
      'input[name="photo-method"]'
    );
    photoMethodRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.handlePhotoMethodChange(e.target.value);
      });
    });

    // Photo preview
    if (photoInput) {
      photoInput.addEventListener("change", (e) => {
        this.handlePhotoPreview(e);
      });
    }

    // Camera controls
    this.initCameraControls();

    // Location type radio buttons
    const locationRadios = this.getLocationTypeRadios();
    locationRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.handleLocationTypeChange(e.target.value);
      });
    });

    // Pick location button
    if (pickLocationBtn) {
      pickLocationBtn.addEventListener("click", () => {
        this.enableLocationPicking();
      });
    }

    // Form submit
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        onSubmit(e);
      });
    }
  }

  /**
   * Handle photo preview
   */
  handlePhotoPreview(event) {
    const file = event.target.files[0];
    const preview = this.getPhotoPreview();

    if (file) {
      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        alert("File size must be less than 1MB");
        event.target.value = "";
        preview.innerHTML = "";
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("File must be an image");
        event.target.value = "";
        preview.innerHTML = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 8px;">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = "";
    }
  }

  /**
   * Handle photo method change (file vs camera)
   */
  handlePhotoMethodChange(method) {
    const fileInputGroup = document.getElementById("file-input-group");
    const cameraInputGroup = document.getElementById("camera-input-group");
    const photoInput = this.getPhotoInput();
    const preview = this.getPhotoPreview();

    if (method === "file") {
      fileInputGroup.style.display = "block";
      cameraInputGroup.style.display = "none";
      if (photoInput) photoInput.required = true;
      this.stopCamera();
      this.capturedBlob = null;
      preview.innerHTML = "";
    } else if (method === "camera") {
      fileInputGroup.style.display = "none";
      cameraInputGroup.style.display = "block";
      if (photoInput) {
        photoInput.required = false;
        photoInput.value = "";
      }
      preview.innerHTML = "";
      this.capturedBlob = null;
    }
  }

  /**
   * Initialize camera controls
   */
  initCameraControls() {
    const startCameraBtn = document.getElementById("start-camera-btn");
    const capturePhotoBtn = document.getElementById("capture-photo-btn");
    const retakePhotoBtn = document.getElementById("retake-photo-btn");

    if (startCameraBtn) {
      startCameraBtn.addEventListener("click", () => {
        this.startCamera();
      });
    }

    if (capturePhotoBtn) {
      capturePhotoBtn.addEventListener("click", () => {
        this.capturePhoto();
      });
    }

    if (retakePhotoBtn) {
      retakePhotoBtn.addEventListener("click", () => {
        this.retakePhoto();
      });
    }
  }

  /**
   * Start camera stream
   */
  async startCamera() {
    const video = document.getElementById("camera-video");
    const startBtn = document.getElementById("start-camera-btn");
    const captureBtn = document.getElementById("capture-photo-btn");
    const statusText = document.getElementById("camera-status");

    try {
      statusText.textContent = "Requesting camera access...";

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this.cameraStream = stream;
      video.srcObject = stream;
      video.style.display = "block";

      startBtn.style.display = "none";
      captureBtn.style.display = "inline-flex";
      statusText.textContent = "Camera ready. Click capture to take photo.";
    } catch (error) {
      console.error("Camera error:", error);
      statusText.textContent =
        "Failed to access camera. Please check permissions.";
      alert(
        "Could not access camera. Please ensure you have granted camera permissions."
      );
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;

      const video = document.getElementById("camera-video");
      const canvas = document.getElementById("camera-canvas");
      const startBtn = document.getElementById("start-camera-btn");
      const captureBtn = document.getElementById("capture-photo-btn");
      const retakeBtn = document.getElementById("retake-photo-btn");
      const statusText = document.getElementById("camera-status");

      if (video) {
        video.srcObject = null;
        video.style.display = "block";
      }
      if (canvas) canvas.style.display = "none";
      if (startBtn) startBtn.style.display = "inline-flex";
      if (captureBtn) captureBtn.style.display = "none";
      if (retakeBtn) retakeBtn.style.display = "none";
      if (statusText) statusText.textContent = "Click 'Start Camera' to begin";
    }
  }

  /**
   * Capture photo from camera stream
   */
  capturePhoto() {
    const video = document.getElementById("camera-video");
    const canvas = document.getElementById("camera-canvas");
    const captureBtn = document.getElementById("capture-photo-btn");
    const retakeBtn = document.getElementById("retake-photo-btn");
    const preview = this.getPhotoPreview();
    const statusText = document.getElementById("camera-status");

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Check file size (max 1MB)
          if (blob.size > 1024 * 1024) {
            alert(
              "Photo size is too large. Please try again with better lighting or closer subject."
            );
            return;
          }

          this.capturedBlob = blob;

          // Show preview
          const url = URL.createObjectURL(blob);
          preview.innerHTML = `<img src="${url}" alt="Captured Photo" style="max-width: 100%; border-radius: 8px;">`;

          // Hide video, show canvas
          video.style.display = "none";
          canvas.style.display = "block";

          // Update buttons
          captureBtn.style.display = "none";
          retakeBtn.style.display = "inline-flex";

          statusText.textContent =
            "Photo captured! Click retake to try again or submit the form.";

          // Stop camera stream
          if (this.cameraStream) {
            this.cameraStream.getTracks().forEach((track) => track.stop());
            this.cameraStream = null;
          }
        }
      },
      "image/jpeg",
      0.8
    );
  }

  /**
   * Retake photo
   */
  retakePhoto() {
    const canvas = document.getElementById("camera-canvas");
    const retakeBtn = document.getElementById("retake-photo-btn");
    const preview = this.getPhotoPreview();

    canvas.style.display = "none";
    retakeBtn.style.display = "none";
    preview.innerHTML = "";
    this.capturedBlob = null;

    // Restart camera
    this.startCamera();
  }

  /**
   * Get current user location
   */
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          console.log("Current location:", this.currentLocation);
        },
        (error) => {
          console.warn("Could not get location:", error);
          this.currentLocation = null;
        }
      );
    }
  }

  /**
   * Handle location type change (current vs pick)
   */
  handleLocationTypeChange(type) {
    const pickLocationBtn = this.getPickLocationBtn();
    const selectedLocationInfo = this.getSelectedLocationInfo();

    if (type === "none") {
      if (pickLocationBtn) pickLocationBtn.style.display = "none";
      if (selectedLocationInfo) selectedLocationInfo.style.display = "none";
      this.disableLocationPicking();
      this.clearLocationMarker();
    } else if (type === "current") {
      if (pickLocationBtn) pickLocationBtn.style.display = "none";
      if (selectedLocationInfo) selectedLocationInfo.style.display = "none";
      this.disableLocationPicking();
      this.clearLocationMarker();
      this.getCurrentLocation();
    } else if (type === "pick") {
      if (pickLocationBtn) pickLocationBtn.style.display = "block";
      if (selectedLocationInfo) selectedLocationInfo.style.display = "none";
      this.disableLocationPicking();
    }
  }

  /**
   * Enable location picking mode
   */
  enableLocationPicking() {
    if (!this.map) return;

    this.isSelectingLocation = true;
    const modal = this.getAddStoryModal();
    const pickLocationBtn = this.getPickLocationBtn();

    // Change button text
    if (pickLocationBtn) {
      pickLocationBtn.textContent = "Click on the map to select location...";
      pickLocationBtn.classList.add("active");
    }

    // Minimize modal temporarily
    if (modal) {
      modal.style.pointerEvents = "none";
      modal.style.opacity = "0.3";
    }

    // Add map click listener
    this.map.once("click", (e) => {
      this.handleMapClick(e);
    });

    // Change cursor
    this.map.getContainer().style.cursor = "crosshair";
  }

  /**
   * Disable location picking mode
   */
  disableLocationPicking() {
    this.isSelectingLocation = false;
    const modal = this.getAddStoryModal();
    const pickLocationBtn = this.getPickLocationBtn();

    if (pickLocationBtn) {
      pickLocationBtn.textContent = "Pick Location from Map";
      pickLocationBtn.classList.remove("active");
    }

    if (modal) {
      modal.style.pointerEvents = "auto";
      modal.style.opacity = "1";
    }

    if (this.map) {
      this.map.getContainer().style.cursor = "";
    }
  }

  /**
   * Handle map click for location selection
   */
  handleMapClick(e) {
    this.selectedLocation = {
      lat: e.latlng.lat,
      lon: e.latlng.lng,
    };

    // Add or update marker
    this.updateLocationMarker(e.latlng.lat, e.latlng.lng);

    // Update UI
    this.updateSelectedLocationInfo(e.latlng.lat, e.latlng.lng);

    // Restore modal
    this.disableLocationPicking();
  }

  /**
   * Update or create location marker
   */
  updateLocationMarker(lat, lon) {
    if (!this.map) return;

    // Remove old marker
    this.clearLocationMarker();

    // Create new marker
    const icon = L.divIcon({
      className: "custom-location-marker",
      html: `
        <div style="
          width: 30px;
          height: 30px;
          background-color: #e74c3c;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    this.locationMarker = L.marker([lat, lon], { icon: icon }).addTo(this.map);
    this.locationMarker
      .bindPopup("Selected location for new story")
      .openPopup();

    // Center map on marker
    this.map.setView([lat, lon], this.map.getZoom());
  }

  /**
   * Clear location marker
   */
  clearLocationMarker() {
    if (this.locationMarker && this.map) {
      this.map.removeLayer(this.locationMarker);
      this.locationMarker = null;
    }
  }

  /**
   * Update selected location info display
   */
  updateSelectedLocationInfo(lat, lon) {
    const info = this.getSelectedLocationInfo();
    if (!info) return;

    info.innerHTML = `
      <strong>Selected Location:</strong><br>
      Latitude: ${lat.toFixed(6)}<br>
      Longitude: ${lon.toFixed(6)}
    `;
    info.style.display = "block";
  }

  /**
   * Reset location selection
   */
  resetLocationSelection() {
    this.selectedLocation = null;
    this.clearLocationMarker();
    this.disableLocationPicking();

    const selectedLocationInfo = this.getSelectedLocationInfo();
    if (selectedLocationInfo) {
      selectedLocationInfo.style.display = "none";
    }
  }

  /**
   * Close modal and reset form
   */
  closeModal() {
    const modal = this.getAddStoryModal();
    const form = this.getAddStoryForm();
    const preview = this.getPhotoPreview();

    if (modal) {
      modal.style.display = "none";
    }
    if (form) {
      form.reset();
    }
    if (preview) {
      preview.innerHTML = "";
    }

    // Reset camera
    this.stopCamera();
    this.capturedBlob = null;

    // Reset photo method to file
    const fileRadio = document.querySelector(
      'input[name="photo-method"][value="file"]'
    );
    if (fileRadio) fileRadio.checked = true;
    this.handlePhotoMethodChange("file");

    // Reset location selection
    this.resetLocationSelection();
  }

  /**
   * Get form data for new story
   */
  getFormData() {
    const form = this.getAddStoryForm();
    const photoInput = this.getPhotoInput();
    const descriptionInput = document.getElementById("description-input");
    const locationRadios = this.getLocationTypeRadios();
    const photoMethodRadios = document.querySelectorAll(
      'input[name="photo-method"]'
    );

    if (!form || !descriptionInput) {
      throw new Error("Form elements not found");
    }

    const formData = new FormData();
    formData.append("description", descriptionInput.value);

    // Get selected photo method
    let selectedPhotoMethod = "file";
    photoMethodRadios.forEach((radio) => {
      if (radio.checked) {
        selectedPhotoMethod = radio.value;
      }
    });

    // Add photo based on method
    if (selectedPhotoMethod === "file") {
      if (!photoInput || !photoInput.files[0]) {
        throw new Error("Please select a photo");
      }
      formData.append("photo", photoInput.files[0]);
    } else if (selectedPhotoMethod === "camera") {
      if (!this.capturedBlob) {
        throw new Error("Please capture a photo");
      }
      // Create a file from the blob
      const file = new File([this.capturedBlob], "camera-photo.jpg", {
        type: "image/jpeg",
      });
      formData.append("photo", file);
    }

    // Get selected location type
    let selectedLocationType = "none";
    locationRadios.forEach((radio) => {
      if (radio.checked) {
        selectedLocationType = radio.value;
      }
    });

    // Add location based on selected type
    if (selectedLocationType === "current" && this.currentLocation) {
      formData.append("lat", this.currentLocation.lat.toString());
      formData.append("lon", this.currentLocation.lon.toString());
    } else if (selectedLocationType === "pick" && this.selectedLocation) {
      formData.append("lat", this.selectedLocation.lat.toString());
      formData.append("lon", this.selectedLocation.lon.toString());
    }

    return formData;
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const successElement = this.getSuccessMessage();
    if (!successElement) return;

    successElement.textContent = message;
    successElement.style.display = "block";

    setTimeout(() => {
      successElement.style.display = "none";
    }, 3000);
  }

  /**
   * Disable form during submission
   */
  setFormDisabled(disabled) {
    const form = this.getAddStoryForm();
    if (!form) return;

    const inputs = form.querySelectorAll("input, textarea, button");
    inputs.forEach((input) => {
      input.disabled = disabled;
    });
  }

  /**
   * Render story list in sidebar
   */
  renderStoryList(stories) {
    const sidebar = this.getStoryListSidebar();
    if (!sidebar) return;

    // Store all stories for filtering
    this.allStories = stories || [];

    let html =
      '<button id="toggle-sidebar-btn" class="toggle-sidebar-btn" title="Toggle stories sidebar" aria-label="Toggle stories sidebar" aria-expanded="true" aria-controls="story-list-sidebar-id">✕</button>';
    html += '<div class="story-list-content">';
    html += "<h3>Stories</h3>";

    // Search, Filter, and Sort Controls
    html += '<div class="story-controls">';
    html += '  <div class="search-box">';
    html +=
      '    <input type="search" id="story-search" class="story-search-input" placeholder="Search stories...">';
    html += "  </div>";
    html += '  <div class="filter-buttons">';
    html +=
      '    <button class="filter-btn active" data-filter="all">All</button>';
    html +=
      '    <button class="filter-btn" data-filter="with-location">With Location</button>';
    html +=
      '    <button class="filter-btn" data-filter="without-location">No Location</button>';
    html += "  </div>";
    html += '  <div class="sort-box">';
    html += '    <label for="story-sort">Sort: </label>';
    html += '    <select id="story-sort" class="story-sort-select">';
    html += '      <option value="newest">Newest First</option>';
    html += '      <option value="oldest">Oldest First</option>';
    html += '      <option value="name-asc">Name (A-Z)</option>';
    html += '      <option value="name-desc">Name (Z-A)</option>';
    html += "    </select>";
    html += "  </div>";
    html += "</div>";
    html += '<div id="filtered-stories-container">';
    // All stories
    if (stories && stories.length > 0) {
      html += '<section class="story-section" aria-label="All stories">';
      html +=
        '<h4><span class="location-icon" aria-hidden="true">�</span>All Stories</h4>';
      html += '<ul role="list" class="story-list">';
      stories.forEach((story) => {
        html += this.createStoryListItem(story);
      });
      html += "</ul>";
      html += "</section>";
    }

    if (!stories || stories.length === 0) {
      html += '<p class="no-stories" role="status">No stories available</p>';
      html += "</div>"; // Close filtered-stories-container
    }

    html += "</div>";
    sidebar.innerHTML = html;

    // Add click listeners
    this.attachStoryListListeners();
    this.attachStoryControlsListeners();
  }

  /**
   * Create story list item HTML
   */
  createStoryListItem(story) {
    const imageUrl = story.photoUrl || "/stories-placeholder.png";
    const name = story.name || "Unnamed Story";
    const description = story.description || "No description available";
    const truncatedDesc =
      description.length > 80
        ? description.substring(0, 80) + "..."
        : description;
    const createdDate = new Date(story.createdAt).toLocaleDateString();

    return `
      <li>
        <article 
          class="story-list-item" 
          data-story-id="${story.id}" 
          data-has-location="${story.lat || story.lon ? "true" : "false"}"
          role="button"
          tabindex="0"
          aria-label="Story: ${this.escapeHtml(name)}"
        >
          <img 
            src="${imageUrl}" 
            alt="${this.escapeHtml(name)} - Story thumbnail" 
            class="story-thumb"
            loading="lazy"
            onerror="this.src='/stories-placeholder.png'; this.alt='Image not available'"
          />
          <div class="story-item-info">
            <h5>${this.escapeHtml(name)}</h5>
            <p>${this.escapeHtml(truncatedDesc)}</p>
            <small><time datetime="${
              story.createdAt
            }">${createdDate}</time></small>
          </div>
        </article>
      </li>
    `;
  }

  /**
   * Attach click listeners to story list items
   */
  attachStoryListListeners() {
    const storyItems = document.querySelectorAll(".story-list-item");
    storyItems.forEach((item) => {
      // Click event
      item.addEventListener("click", () => {
        const storyId = item.dataset.storyId;
        const hasLocation = item.dataset.hasLocation === "true";
        this.handleStoryItemClick(storyId, hasLocation);
      });

      // Keyboard accessibility
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const storyId = item.dataset.storyId;
          const hasLocation = item.dataset.hasLocation === "true";
          this.handleStoryItemClick(storyId, hasLocation);
        }
      });
    });
  }

  /**
   * Attach listeners for search, filter, and sort controls
   */
  attachStoryControlsListeners() {
    // Search input
    const searchInput = document.getElementById("story-search");
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value.toLowerCase();
          this.updateFilteredStories();
        }, 300); // Debounce 300ms
      });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Update active state
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Update filter and refresh
        this.currentFilter = btn.dataset.filter;
        this.updateFilteredStories();
      });
    });

    // Sort dropdown
    const sortSelect = document.getElementById("story-sort");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.updateFilteredStories();
      });
    }
  }

  /**
   * Update filtered and sorted stories based on current filters
   */
  async updateFilteredStories() {
    try {
      // Determine hasLocation filter
      let hasLocation = null;
      if (this.currentFilter === "with-location") {
        hasLocation = true;
      } else if (this.currentFilter === "without-location") {
        hasLocation = false;
      }

      // Parse sort option
      let sortBy = "createdAt";
      let order = "desc";
      if (this.currentSort === "newest") {
        sortBy = "newest";
        order = "desc";
      } else if (this.currentSort === "oldest") {
        sortBy = "oldest";
        order = "asc";
      } else if (this.currentSort === "name-asc") {
        sortBy = "name";
        order = "asc";
      } else if (this.currentSort === "name-desc") {
        sortBy = "name";
        order = "desc";
      }

      // Query stories with filters
      const filteredStories = await idbHelper.queryStories({
        search: this.searchQuery || null,
        hasLocation,
        sortBy,
        order,
      });
      console.log(sortBy);

      // Re-render the filtered stories
      this.renderFilteredStories(filteredStories);
    } catch (error) {
      console.error("Error filtering stories:", error);
    }
  }

  /**
   * Render only the filtered stories section
   */
  renderFilteredStories(stories) {
    const container = document.getElementById("filtered-stories-container");
    if (!container) return;

    let html = "";

    if (stories && stories.length > 0) {
      html += '<section class="story-section" aria-label="Filtered stories">';
      html += `<h4><span class="location-icon" aria-hidden="true">📖</span>All Stories (${stories.length})</h4>`;
      html += '<ul role="list" class="story-list">';
      stories.forEach((story) => {
        html += this.createStoryListItem(story);
      });
      html += "</ul>";
      html += "</section>";
    } else {
      html +=
        '<p class="no-stories" role="status">No stories match your filters</p>';
    }

    container.innerHTML = html;

    // Re-attach story item listeners
    this.attachStoryListListeners();
  }

  /**
   * Handle story item click
   */
  handleStoryItemClick(storyId, hasLocation) {
    if (hasLocation) {
      // Highlight marker and zoom to it
      this.highlightStoryMarker(storyId);
    } else {
      // Show detail modal
      this.showStoryDetail(storyId);
    }
  }

  /**
   * Highlight a story marker on the map
   */
  highlightStoryMarker(storyId) {
    const marker = this.markers[storyId];
    if (!marker) {
      console.warn(`Marker not found for story ${storyId}`);
      return;
    }

    // Remove previous highlight
    this.removeMarkerHighlight();

    // Get marker position
    const latlng = marker.getLatLng();
    // reset map view
    this.map.setView([0, 0], 2, { animate: true });

    // Zoom to marker
    this.map.setView(latlng, 12, { animate: true });

    // Open popup
    marker.openPopup();

    // Add highlight circle
    this.highlightedMarker = L.circle(latlng, {
      color: "#e74c3c",
      fillColor: "#e74c3c",
      fillOpacity: 0.2,
      radius: 100,
      weight: 3,
    }).addTo(this.map);

    // Pulse effect
    setTimeout(() => {
      if (this.highlightedMarker) {
        this.highlightedMarker.setStyle({ fillOpacity: 0.3 });
      }
    }, 500);
  }

  /**
   * Remove marker highlight
   */
  removeMarkerHighlight() {
    if (this.highlightedMarker && this.map) {
      this.map.removeLayer(this.highlightedMarker);
      this.highlightedMarker = null;
    }
  }

  /**
   * Show story detail modal
   */
  showStoryDetail(storyId) {
    if (this.onShowStoryDetail) {
      this.onShowStoryDetail(storyId);
    }
  }

  /**
   * Display story detail in modal
   */
  displayStoryDetail(story) {
    const modal = this.getStoryDetailModal();
    if (!modal) return;

    const imageUrl = story.photoUrl || "/stories-placeholder.png";
    const name = story.name || "Unnamed Story";
    const description = story.description || "No description available";
    const createdAt = new Date(story.createdAt).toLocaleString();

    const content = modal.querySelector(".modal-content");
    if (content) {
      content.innerHTML = `
        <header class="modal-header">
          <h2 id="story-detail-title">${this.escapeHtml(name)}</h2>
          <button class="close-btn" id="close-detail-modal" aria-label="Close story details">&times;</button>
        </header>
        <article class="story-detail-content" aria-labelledby="story-detail-title">
          <img 
            src="${imageUrl}" 
            alt="${this.escapeHtml(name)} - Full story image" 
            class="story-detail-image"
            loading="lazy"
            onerror="this.src='/stories-placeholder.png'; this.alt='Image not available'"
          />
          <div class="story-detail-info">
            <p class="story-description">${this.escapeHtml(description)}</p>
            <p class="story-meta">
              <strong>Posted:</strong> <time datetime="${
                story.createdAt
              }">${createdAt}</time>
            </p>
          </div>
        </article>
      `;
    }

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");

    // Focus on modal for accessibility
    const closeBtn = document.getElementById("close-detail-modal");
    if (closeBtn) {
      closeBtn.focus();
      closeBtn.addEventListener("click", () => {
        this.closeStoryDetail();
      });
    }

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeStoryDetail();
      }
    });

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        this.closeStoryDetail();
        modal.removeEventListener("keydown", escapeHandler);
      }
    };
    modal.addEventListener("keydown", escapeHandler);
  }

  /**
   * Close story detail modal
   */
  closeStoryDetail() {
    const modal = this.getStoryDetailModal();
    if (modal) {
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
    }
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    const sidebar = this.getStoryListSidebar();
    const toggleBtn = this.getToggleSidebarBtn();
    if (!sidebar || !toggleBtn) return;

    const isCollapsed = sidebar.classList.toggle("collapsed");

    // Update aria-expanded for accessibility
    toggleBtn.setAttribute("aria-expanded", !isCollapsed);

    // Update button title and text
    if (isCollapsed) {
      toggleBtn.innerHTML = "☰";
      toggleBtn.title = "Show Stories";
      toggleBtn.setAttribute("aria-label", "Show stories sidebar");
    } else {
      toggleBtn.innerHTML = "✕";
      toggleBtn.title = "Hide Stories";
      toggleBtn.setAttribute("aria-label", "Hide stories sidebar");
    }
  }

  /**
   * Initialize sidebar toggle
   */
  initSidebarToggle() {
    const toggleBtn = this.getToggleSidebarBtn();
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }
    const toggleBtn2 = this.getToggleSidebarBtn2();
    if (toggleBtn2) {
      toggleBtn2.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }
  }

  /**
   * Cleanup method to destroy map when leaving page
   */
  destroy() {
    this.clearLocationMarker();
    this.removeMarkerHighlight();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = {};
  }
}

export default MapView;
