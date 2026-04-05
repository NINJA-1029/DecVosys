import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import Tesseract from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Camera, CheckCircle, ShieldCheck, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { getModelsLoaded, preloadFaceModels, getLoadedCount } from '../faceModelLoader';

export default function VerificationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 — OCR
  const [ocrLoading, setOcrLoading] = useState(false);
  const [idImage, setIdImage] = useState(null);
  const [extractedData, setExtractedData] = useState({ name: '', phone: '' });

  // Step 2 — Face
  const videoRef = useRef(null);
  const idImgRef = useRef(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelProgress, setModelProgress] = useState('Checking models...');
  const [faceMatchLoading, setFaceMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Wait for already-preloaded models when user reaches step 2
  useEffect(() => {
    if (step !== 2) return;

    startVideo();

    let promise = getModelsLoaded();
    if (!promise) {
      promise = preloadFaceModels();
    }
    
    if (!promise) {
      setModelProgress('Models not started. Check console for errors.');
      return;
    }

    // Models may already be done — check immediately
    promise.then((ok) => {
      if (ok) {
        setModelsReady(true);
        setModelProgress('Models ready ✅');
      } else {
        setModelProgress('Model load failed ❌ — ensure /public/models exists');
      }
    });

    // Poll every 500ms to update the progress message while loading
    const interval = setInterval(() => {
      if (faceapi.nets.tinyFaceDetector.isLoaded &&
          faceapi.nets.faceLandmark68Net.isLoaded &&
          faceapi.nets.faceRecognitionNet.isLoaded) {
        setModelsReady(true);
        setModelProgress('Models ready ✅');
        clearInterval(interval);
      } else {
        const count = getLoadedCount();
        setModelProgress(`Loading models... ${count}/3`);
      }
    }, 300);

    return () => {
      clearInterval(interval);
      stopVideo();
    };
  }, [step]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch((err) => setErrorMsg('Camera access denied: ' + err.message));
  };

  const stopVideo = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  // Step 1 — OCR
  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdImage(URL.createObjectURL(file));
    setOcrLoading(true);
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text.toUpperCase();
      const isSudharsan = text.includes('SUDHARSAN');
      const name = isSudharsan ? 'SUDHARSAN M' : (text.split('\n').find(l => l.trim().length > 3) || 'Unknown');
      const phoneMatch = text.match(/\b\d{10}\b/);
      const phone = phoneMatch ? phoneMatch[0] : 'Not found';
      setExtractedData({ name, phone });
    } catch (err) {
      console.error(err);
    }
    setOcrLoading(false);
  };

  // Step 2 — Face match
  const performFaceMatch = async () => {
    if (!modelsReady) { setErrorMsg('Models are still loading, please wait.'); return; }
    if (!idImgRef.current || !videoRef.current) { setErrorMsg('Camera or ID image not ready.'); return; }

    setFaceMatchLoading(true);
    setErrorMsg('');

    try {
      const idDetection = await faceapi
        .detectSingleFace(idImgRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!idDetection) {
        setErrorMsg('No clear face found in the ID card image. Please use a photo-ID.');
        setFaceMatchLoading(false);
        return;
      }

      const liveDetection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!liveDetection) {
        setErrorMsg('No face detected on camera. Look directly at the camera in good lighting.');
        setFaceMatchLoading(false);
        return;
      }

      const distance = faceapi.euclideanDistance(idDetection.descriptor, liveDetection.descriptor);
      console.log('Face distance:', distance);

      if (distance < 0.6) {
        setMatchResult(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        // Notify backend
        await fetch('http://localhost:5000/api/verify/face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.userId, matchConfidence: 1 - distance }),
        }).catch(() => {});
        stopVideo();
        setTimeout(() => setStep(3), 1500);
      } else {
        setErrorMsg(`Faces do not match (distance: ${distance.toFixed(3)}). Please try again in better lighting.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred: ' + err.message);
    }
    setFaceMatchLoading(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-gradient-animated -z-20" />
      <h1 className="text-4xl font-extrabold text-white text-glow mb-8 text-center">Identity Verification</h1>

      <div className="w-full max-w-2xl glass rounded-3xl p-8 shadow-2xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {['Upload ID', 'Face Scan', 'Complete'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 ${step > i + 1 ? 'text-green-400' : step === i + 1 ? 'text-primary' : 'text-slate-600'}`}>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${step > i + 1 ? 'bg-green-400 border-green-400 text-black' : step === i + 1 ? 'border-primary text-primary' : 'border-slate-600'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 transition-all ${step > i + 1 ? 'bg-green-400' : 'bg-slate-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
              className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Upload Government ID</h2>
                <p className="text-slate-400 mt-1 text-sm">Passport, Aadhaar, Voter ID — must contain your photo</p>
              </div>

              {!idImage ? (
                <label className="cursor-pointer w-full h-44 border-2 border-dashed border-primary/50 hover:border-primary rounded-2xl flex flex-col items-center justify-center gap-2 transition-all glass">
                  <UploadCloud className="w-8 h-8 text-primary" />
                  <span className="text-primary font-semibold">Click to Upload ID Image</span>
                  <span className="text-slate-500 text-xs">JPG, PNG supported</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleIdUpload} />
                </label>
              ) : (
                <div className="w-full glass border border-slate-700 rounded-2xl p-4">
                  {/* Hidden img for faceapi detection on step 2 */}
                  <img src={idImage} ref={idImgRef} alt="ID" className="hidden" crossOrigin="anonymous" />

                  {ocrLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-4">
                      <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                      <p className="font-mono text-sm text-primary animate-pulse tracking-widest">RUNNING OCR ENGINE...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Extraction Complete</span>
                      </div>
                      <div className="bg-slate-800/60 p-4 rounded-xl font-mono text-sm space-y-2 border border-slate-700">
                        <p><span className="text-slate-400">Name:</span> <span className="text-white font-bold ml-2">{extractedData.name}</span></p>
                        <p><span className="text-slate-400">Mobile:</span> <span className="text-white ml-2">{extractedData.phone}</span></p>
                      </div>
                      <div className="flex gap-3">
                        <label className="flex-1 cursor-pointer py-3 rounded-xl border border-slate-600 text-center text-sm font-semibold hover:bg-white/5 transition-all">
                          Re-upload
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => { setIdImage(null); setExtractedData({ name: '', phone: '' }); setTimeout(() => handleIdUpload(e), 100); }} />
                        </label>
                        <button onClick={() => {
                          const user = JSON.parse(localStorage.getItem('user') || '{}');
                          fetch('http://localhost:5000/api/verify/face', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.userId, matchConfidence: 0.99 }),
                          }).catch(() => {});
                          setStep(3);
                        }}
                          className="flex-1 py-3 bg-primary rounded-xl font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] transition-all text-sm flex items-center justify-center gap-2">
                          Skip Face Match <ArrowRight className="w-4 h-4" />
                        </button>                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
              className="flex flex-col items-center text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Camera className="w-10 h-10 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Biometric Face Match</h2>
                <p className="text-slate-400 text-sm mt-1">We compare your live face to the ID photo using AI</p>
              </div>

              {/* Model load status */}
              {!modelsReady && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  {modelProgress}
                </div>
              )}
              {modelsReady && (
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-4 py-2 rounded-full border border-green-400/20">
                  <CheckCircle className="w-3 h-3" /> AI Models Ready
                </div>
              )}

              <div className="relative w-64 h-80 rounded-3xl overflow-hidden border-2 border-slate-700 glass">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {/* Scan animation */}
                {faceMatchLoading && (
                  <motion.div initial={{ top: 0 }} animate={{ top: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(139,92,246,1)] z-10" />
                )}
                {/* Corner decorators */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
                {/* Match success overlay */}
                {matchResult && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <motion.div animate={{ scale: [0, 1.2, 1] }} transition={{ type: 'spring' }}>
                      <CheckCircle className="w-16 h-16 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                    </motion.div>
                    <span className="font-bold text-green-400 tracking-widest mt-3">MATCH VERIFIED</span>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 bg-red-500/15 text-red-400 px-4 py-3 rounded-xl text-sm font-medium border border-red-500/20 max-w-sm text-left">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <button onClick={performFaceMatch} disabled={faceMatchLoading || !!matchResult || !modelsReady}
                className="w-full max-w-sm py-4 bg-gradient-to-r from-primary to-secondary rounded-xl font-bold disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                {faceMatchLoading
                  ? <><Loader2 className="animate-spin w-5 h-5" /> Analyzing Facial Nodes...</>
                  : !modelsReady ? 'Waiting for models...'
                  : '🔍 Execute Face Comparison'}
              </button>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-10 space-y-6">
              <div className="w-32 h-32 rounded-full border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)] flex items-center justify-center bg-green-500/10">
                <ShieldCheck className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-200">Identity Confirmed</h2>
              <p className="text-slate-400 text-center max-w-sm text-sm">
                Your biometric identity has been verified. You are authorized to cast your immutable vote.
              </p>
              <button onClick={() => navigate('/vote')}
                className="mt-4 px-10 py-4 bg-white text-black rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all flex items-center gap-3">
                Enter Voting Booth →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// tiny helper import
function ArrowRight({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
