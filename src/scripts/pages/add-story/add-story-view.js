class AddStoryView {
  constructor() {
    this.currentStream = null;
    this.capturedPhotoBlob = null;
  }

  getForm() {
    return document.getElementById("add-story-form");
  }

  getPhotoInput() {
    return document.getElementById("photo-input");
  }

  getDescriptionInput() {
    return document.getElementById("description-input");
  }

  getPhotoPreview() {
    return document.getElementById("photo-preview");
  }

  getLocationRadios() {
    return document.querySelectorAll('input[name="location-type"]');
  }

  getSelectedLocationType() {
    const selected = document.querySelector(
      'input[name="location-type"]:checked'
    );
    return selected ? selected.value : "none";
  }

  getPhotoMethodRadios() {
    return document.querySelectorAll('input[name="photo-method"]');
  }

  getSelectedPhotoMethod() {
    const selected = document.querySelector(
      'input[name="photo-method"]:checked'
    );
    return selected ? selected.value : "file";
  }

  getCameraVideo() {
    return document.getElementById("camera-video");
  }

  getCameraCanvas() {
    return document.getElementById("camera-canvas");
  }

  getStartCameraBtn() {
    return document.getElementById("start-camera-btn");
  }

  getCapturePhotoBtn() {
    return document.getElementById("capture-photo-btn");
  }

  getRetakePhotoBtn() {
    return document.getElementById("retake-photo-btn");
  }

  getCameraStatus() {
    return document.getElementById("camera-status");
  }

  showError(message) {
    const errorDiv = document.getElementById("error");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 5000);
    }
  }

  showSuccess(message) {
    const successDiv = document.getElementById("success-message");
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = "block";
      setTimeout(() => {
        successDiv.style.display = "none";
      }, 3000);
    }
  }

  showLoading(show = true) {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.style.display = show ? "flex" : "none";
    }
  }

  disableForm(disabled = true) {
    const form = this.getForm();
    if (form) {
      const inputs = form.querySelectorAll("input, textarea, button");
      inputs.forEach((input) => {
        input.disabled = disabled;
      });
    }
  }

  resetForm() {
    const form = this.getForm();
    if (form) {
      form.reset();
    }

    const photoPreview = this.getPhotoPreview();
    if (photoPreview) {
      photoPreview.innerHTML = "";
    }

    this.stopCamera();
    this.capturedPhotoBlob = null;

    const fileInputGroup = document.getElementById("file-input-group");
    const cameraInputGroup = document.getElementById("camera-input-group");
    if (fileInputGroup) fileInputGroup.style.display = "block";
    if (cameraInputGroup) cameraInputGroup.style.display = "none";

    this.hidePickLocationButton();
    this.clearSelectedLocation();
  }

  updatePhotoPreview(file) {
    const photoPreview = this.getPhotoPreview();
    if (!photoPreview) return;

    photoPreview.innerHTML = "";

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Preview of uploaded photo";
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        photoPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  }

  handlePhotoMethodChange() {
    const photoMethod = this.getSelectedPhotoMethod();
    const fileInputGroup = document.getElementById("file-input-group");
    const cameraInputGroup = document.getElementById("camera-input-group");

    if (photoMethod === "camera") {
      if (fileInputGroup) fileInputGroup.style.display = "none";
      if (cameraInputGroup) cameraInputGroup.style.display = "block";
    } else {
      if (fileInputGroup) fileInputGroup.style.display = "block";
      if (cameraInputGroup) cameraInputGroup.style.display = "none";
      this.stopCamera();
    }

    const photoPreview = this.getPhotoPreview();
    if (photoPreview) {
      photoPreview.innerHTML = "";
    }
    this.capturedPhotoBlob = null;
  }

  async startCamera() {
    try {
      const video = this.getCameraVideo();
      const startBtn = this.getStartCameraBtn();
      const captureBtn = this.getCapturePhotoBtn();
      const status = this.getCameraStatus();

      if (status) status.textContent = "Starting camera...";

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      this.currentStream = stream;
      if (video) {
        video.srcObject = stream;
        video.style.display = "block";
      }

      const canvas = this.getCameraCanvas();
      if (canvas) canvas.style.display = "none";

      if (startBtn) startBtn.style.display = "none";
      if (captureBtn) captureBtn.style.display = "inline-flex";

      const retakeBtn = this.getRetakePhotoBtn();
      if (retakeBtn) retakeBtn.style.display = "none";

      if (status)
        status.textContent =
          "Camera ready. Click 'Capture Photo' to take a picture.";
    } catch (error) {
      console.error("Error accessing camera:", error);
      const status = this.getCameraStatus();
      if (status) {
        status.textContent =
          "Error: Cannot access camera. Please check permissions.";
      }
      this.showError("Cannot access camera. Please check your permissions.");
    }
  }

  capturePhoto() {
    const video = this.getCameraVideo();
    const canvas = this.getCameraCanvas();
    const captureBtn = this.getCapturePhotoBtn();
    const retakeBtn = this.getRetakePhotoBtn();
    const status = this.getCameraStatus();

    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    video.style.display = "none";
    canvas.style.display = "block";

    if (captureBtn) captureBtn.style.display = "none";
    if (retakeBtn) retakeBtn.style.display = "inline-flex";

    if (status)
      status.textContent =
        "Photo captured! Click 'Retake' to take another photo.";

    canvas.toBlob((blob) => {
      this.capturedPhotoBlob = blob;

      const photoPreview = this.getPhotoPreview();
      if (photoPreview) {
        photoPreview.innerHTML = "";
        const img = document.createElement("img");
        img.src = canvas.toDataURL();
        img.alt = "Captured photo preview";
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        photoPreview.appendChild(img);
      }
    }, "image/jpeg");

    this.stopCamera();
  }

  retakePhoto() {
    const canvas = this.getCameraCanvas();
    if (canvas) canvas.style.display = "none";

    this.capturedPhotoBlob = null;

    const photoPreview = this.getPhotoPreview();
    if (photoPreview) {
      photoPreview.innerHTML = "";
    }

    this.startCamera();
  }

  stopCamera() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }

    const video = this.getCameraVideo();
    if (video) {
      video.srcObject = null;
      video.style.display = "none";
    }

    const startBtn = this.getStartCameraBtn();
    const captureBtn = this.getCapturePhotoBtn();
    const retakeBtn = this.getRetakePhotoBtn();

    if (startBtn) startBtn.style.display = "inline-flex";
    if (captureBtn) captureBtn.style.display = "none";
    if (retakeBtn) retakeBtn.style.display = "none";
  }

  showPickLocationButton() {
    const pickBtn = document.getElementById("pick-location-btn");
    if (pickBtn) {
      pickBtn.style.display = "block";
    }
  }

  hidePickLocationButton() {
    const pickBtn = document.getElementById("pick-location-btn");
    if (pickBtn) {
      pickBtn.style.display = "none";
    }
  }

  setSelectedLocation(lat, lng) {
    const info = document.getElementById("selected-location-info");
    if (info) {
      info.innerHTML = `<strong>Selected Location:</strong> ${lat.toFixed(
        6
      )}, ${lng.toFixed(6)}`;
      info.style.display = "block";
      info.dataset.lat = lat;
      info.dataset.lng = lng;
    }
  }

  getSelectedLocation() {
    const info = document.getElementById("selected-location-info");
    if (info && info.dataset.lat && info.dataset.lng) {
      return {
        lat: parseFloat(info.dataset.lat),
        lng: parseFloat(info.dataset.lng),
      };
    }
    return null;
  }

  clearSelectedLocation() {
    const info = document.getElementById("selected-location-info");
    if (info) {
      info.innerHTML = "";
      info.style.display = "none";
      delete info.dataset.lat;
      delete info.dataset.lng;
    }
  }

  getFormData() {
    const photoMethod = this.getSelectedPhotoMethod();
    let photoFile = null;

    if (photoMethod === "file") {
      const photoInput = this.getPhotoInput();
      if (photoInput && photoInput.files.length > 0) {
        photoFile = photoInput.files[0];
      }
    } else if (photoMethod === "camera") {
      if (this.capturedPhotoBlob) {
        photoFile = new File([this.capturedPhotoBlob], "camera-photo.jpg", {
          type: "image/jpeg",
        });
      }
    }

    const description = this.getDescriptionInput()?.value || "";
    const locationType = this.getSelectedLocationType();

    return {
      photo: photoFile,
      description,
      locationType,
    };
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

export default AddStoryView;
