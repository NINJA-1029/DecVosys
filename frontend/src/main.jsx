import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { preloadFaceModels } from './faceModelLoader'

// 🚀 Start loading face-api models immediately — before anything else renders
preloadFaceModels();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
