// Global face-api model loader — uses advanced models
import * as faceapi from 'face-api.js';

let modelsLoadedPromise = null;
let loadedModelsCount = 0;

export function preloadFaceModels() {
  if (modelsLoadedPromise) return modelsLoadedPromise;

  loadedModelsCount = 0;
  
  const loadModel = (net) => net.loadFromUri('/models').then(() => { loadedModelsCount++; });

  modelsLoadedPromise = Promise.all([
    loadModel(faceapi.nets.ssdMobilenetv1),
    loadModel(faceapi.nets.faceLandmark68Net),
    loadModel(faceapi.nets.faceRecognitionNet),
  ]).then(() => {
    console.log('✅ Face models loaded (3/3)');
    return true;
  }).catch((err) => {
    console.error('❌ Face model load error:', err);
    modelsLoadedPromise = null;
    return false;
  });

  return modelsLoadedPromise;
}

export function getModelsLoaded() {
  return modelsLoadedPromise;
}

export function isModelReady() {
  return faceapi.nets.ssdMobilenetv1.isLoaded &&
         faceapi.nets.faceLandmark68Net.isLoaded &&
         faceapi.nets.faceRecognitionNet.isLoaded;
}

export function getLoadedCount() {
  return loadedModelsCount;
}
