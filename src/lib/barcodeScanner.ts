import { Html5Qrcode } from "html5-qrcode";

export const requestNativeCameraPermission = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera API not supported in this browser");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
  });

  stream.getTracks().forEach((track) => track.stop());
};

export const getPreferredCameraId = async () => {
  const cameras = await Html5Qrcode.getCameras();
  if (!cameras?.length) {
    throw new Error("No camera found");
  }

  return (
    cameras.find((camera) => /back|rear|environment/i.test(camera.label))?.id ??
    cameras[0].id
  );
};
