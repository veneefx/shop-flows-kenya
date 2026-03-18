import { Html5Qrcode } from "html5-qrcode";

export const requestNativeCameraPermission = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera API not supported in this browser");
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    stream.getTracks().forEach((track) => track.stop());
  } catch (error: any) {
    if (error.name === "NotAllowedError") {
      throw new Error("Camera permission denied");
    }
    throw error;
  }
};

export const getPreferredCameraId = async () => {
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras?.length) {
      throw new Error("No camera found");
    }

    // Prefer rear/environment camera
    const rearCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label));
    return rearCamera?.id ?? cameras[cameras.length - 1].id;
  } catch (error) {
    throw new Error("Failed to get camera");
  }
};

// Optimized scanner configuration for fast detection
export const getOptimizedScannerConfig = () => {
  return {
    fps: 30, // High FPS for fast detection
    qrbox: { width: 300, height: 150 }, // Larger scan box
    aspectRatio: 1.0,
    disableFlip: false,
  };
};

// Debounce barcode detection to avoid duplicate scans
let lastScannedCode = "";
let lastScannedTime = 0;

export const shouldProcessScan = (code: string): boolean => {
  const now = Date.now();
  if (code === lastScannedCode && now - lastScannedTime < 2000) {
    return false; // Ignore duplicate within 2 seconds
  }
  lastScannedCode = code;
  lastScannedTime = now;
  return true;
};

export const resetScanState = () => {
  lastScannedCode = "";
  lastScannedTime = 0;
};
