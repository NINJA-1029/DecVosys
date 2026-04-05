import fs from 'fs';
import https from 'https';
import path from 'path';

const modelsUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const modelsToDownload = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

const destDir = path.join(process.cwd(), '../frontend/public/models');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

modelsToDownload.forEach(file => {
  const destPath = path.join(destDir, file);
  const fileUrl = modelsUrl + file;
  
  https.get(fileUrl, function(response) {
    const fileStream = fs.createWriteStream(destPath);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded ${file}`);
    });
  }).on('error', function(err) {
    console.error(`Error downloading ${file}:`, err.message);
  });
});
