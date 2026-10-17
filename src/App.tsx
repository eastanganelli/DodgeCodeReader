/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Settings, 
  Maximize2, 
  Info,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Types
interface DetectionPoint {
  frame: number;
  time: number;
  brightness: number;
  state: 'on' | 'off';
}

interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Code {
  digit1: number;
  digit2: number;
}

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [brightnessData, setBrightnessData] = useState<DetectionPoint[]>([]);
  const [threshold, setThreshold] = useState(128);
  const [isAutoThreshold, setIsAutoThreshold] = useState(true);
  const [toggleCount, setToggleCount] = useState(0);
  const [codes, setCodes] = useState<Code[]>([]);
  const [currentDigitCount, setCurrentDigitCount] = useState(0);
  const [currentCodeDigits, setCurrentCodeDigits] = useState<number[]>([]);
  const [roi, setRoi] = useState<ROI>({ x: 0, y: 0, width: 100, height: 100 });
  const [analysisStartTime, setAnalysisStartTime] = useState(0);
  const [analysisEndTime, setAnalysisEndTime] = useState(0);
  const [isSelectingROI, setIsSelectingROI] = useState(false);
  const [roiStart, setRoiStart] = useState<{ x: number, y: number } | null>(null);
  const [opencvLoaded, setOpencvLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastPulseEndTimeRef = useRef<number>(0);
  const lastStateRef = useRef<'on' | 'off'>('off');
  const currentDigitCountRef = useRef<number>(0);
  const currentCodeDigitsRef = useRef<number[]>([]);
  const codesRef = useRef<Code[]>([]);
  const brightnessWindowRef = useRef<number[]>([]);
  const isAutoThresholdRef = useRef(isAutoThreshold);
  const analysisStartTimeRef = useRef(analysisStartTime);
  const analysisEndTimeRef = useRef(analysisEndTime);

  // Load OpenCV.js
  useEffect(() => {
    // Check if cv is already loaded globally
    // @ts-ignore
    if (typeof cv !== 'undefined' && cv.Mat) {
      setOpencvLoaded(true);
      return;
    }

    // Check if script is already in the document
    const scriptId = 'opencv-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://docs.opencv.org/4.x/opencv.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const checkCv = setInterval(() => {
      // @ts-ignore
      if (typeof cv !== 'undefined' && cv.Mat) {
        setOpencvLoaded(true);
        clearInterval(checkCv);
      }
    }, 500);

    return () => {
      clearInterval(checkCv);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setBrightnessData([]);
      setToggleCount(0);
      setCodes([]);
      setCurrentDigitCount(0);
      setCurrentCodeDigits([]);
      setProgress(0);
      setThreshold(128);
      thresholdRef.current = 128;
      brightnessWindowRef.current = [];
      setRoi({ x: 0, y: 0, width: 0, height: 0 });
      setAnalysisStartTime(0);
      setAnalysisEndTime(0);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setAnalysisEndTime(videoRef.current.duration);
    }
  };

  const isProcessingRef = useRef(false);

  const startProcessing = async () => {
    if (!videoRef.current || !opencvLoaded || isProcessing) return;
    
    const video = videoRef.current;
    
    // Ensure video metadata is loaded and duration is valid
    if (video.readyState < 1 || isNaN(video.duration) || video.duration === 0) {
      alert("Video is still loading or invalid. Please wait a moment.");
      return;
    }
    
    // Ensure ROI is valid
    if (roi.width <= 0 || roi.height <= 0) {
      alert("Please select a detection zone by clicking and dragging on the video.");
      return;
    }
    
    setIsProcessing(true);
    isProcessingRef.current = true;
    setBrightnessData([]);
    setToggleCount(0);
    setCodes([]);
    setCurrentDigitCount(0);
    setCurrentCodeDigits([]);
    setProgress(0);
    setThreshold(128);
    thresholdRef.current = 128;
    brightnessWindowRef.current = [];
    
    lastPulseEndTimeRef.current = 0;
    lastStateRef.current = 'off';
    currentDigitCountRef.current = 0;
    currentCodeDigitsRef.current = [];
    codesRef.current = [];
    
    if (Math.abs(video.currentTime - analysisStartTime) < 0.01) {
      processNextFrame();
    } else {
      video.currentTime = analysisStartTime;
      video.pause();
      
      // Wait for seek to complete before starting
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        processNextFrame();
      };
      video.addEventListener('seeked', onSeeked);
    }
  };

  const roiRef = useRef(roi);
  const thresholdRef = useRef(threshold);

  useEffect(() => {
    roiRef.current = roi;
  }, [roi]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    isAutoThresholdRef.current = isAutoThreshold;
  }, [isAutoThreshold]);

  useEffect(() => {
    analysisStartTimeRef.current = analysisStartTime;
  }, [analysisStartTime]);

  useEffect(() => {
    analysisEndTimeRef.current = analysisEndTime;
  }, [analysisEndTime]);

  const finalizeCode = useCallback(() => {
    if (currentCodeDigitsRef.current.length > 0) {
      const newCode: Code = {
        digit1: currentCodeDigitsRef.current[0],
        digit2: currentCodeDigitsRef.current.length > 1 ? currentCodeDigitsRef.current[1] : 0
      };
      codesRef.current = [...codesRef.current, newCode];
      setCodes([...codesRef.current]);
      currentCodeDigitsRef.current = [];
      setCurrentCodeDigits([]);
    }
  }, []);

  const finalizeDigit = useCallback(() => {
    if (currentDigitCountRef.current > 0) {
      currentCodeDigitsRef.current = [...currentCodeDigitsRef.current, currentDigitCountRef.current];
      setCurrentCodeDigits([...currentCodeDigitsRef.current]);
      currentDigitCountRef.current = 0;
      setCurrentDigitCount(0);

      // If we have 2 digits, finalize the code automatically
      if (currentCodeDigitsRef.current.length >= 2) {
        finalizeCode();
      }
    }
  }, [finalizeCode]);

  const processNextFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isProcessingRef.current) {
      console.log("Processing stopped or refs missing", { 
        video: !!videoRef.current, 
        canvas: !!canvasRef.current, 
        isProcessing: isProcessingRef.current 
      });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    // Draw frame to hidden canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Use OpenCV to process the ROI
    try {
      // @ts-ignore
      const src = cv.imread(canvas);
      
      // Calculate scaling factors from overlay canvas display size to video resolution
      const scaleX = canvas.width / (overlayCanvasRef.current?.width || 1);
      const scaleY = canvas.height / (overlayCanvasRef.current?.height || 1);

      // @ts-ignore
      const rect = new cv.Rect(
        Math.max(0, Math.floor(roiRef.current.x * scaleX)),
        Math.max(0, Math.floor(roiRef.current.y * scaleY)),
        Math.floor(roiRef.current.width * scaleX),
        Math.floor(roiRef.current.height * scaleY)
      );
      
      // Ensure rect is within bounds
      rect.x = Math.min(rect.x, src.cols - 1);
      rect.y = Math.min(rect.y, src.rows - 1);
      rect.width = Math.min(rect.width, src.cols - rect.x);
      rect.height = Math.min(rect.height, src.rows - rect.y);

      if (rect.width > 0 && rect.height > 0) {
        const roiMat = src.roi(rect);
        // @ts-ignore
        const mean = cv.mean(roiMat);
        // mean[0], mean[1], mean[2] are R, G, B
        const brightness = (mean[0] + mean[1] + mean[2]) / 3;
        
        // Auto Threshold Logic
        if (isAutoThresholdRef.current) {
          brightnessWindowRef.current.push(brightness);
          if (brightnessWindowRef.current.length > 150) { // ~5 seconds at 30fps
            brightnessWindowRef.current.shift();
          }
          
          if (brightnessWindowRef.current.length > 20) {
            const min = Math.min(...brightnessWindowRef.current);
            const max = Math.max(...brightnessWindowRef.current);
            const range = max - min;
            
            // Only update if there's a significant signal (range > 10)
            if (range > 10) {
              const targetThreshold = min + (range * 0.5); // Midpoint
              
              // If this is the first time we detect a signal, jump to it immediately
              // Otherwise, apply damping to smooth the threshold movement
              if (brightnessWindowRef.current.length < 30) {
                thresholdRef.current = targetThreshold;
                setThreshold(Math.round(targetThreshold));
              } else {
                const alpha = 0.1; // Smoothing factor
                const newThreshold = (thresholdRef.current * (1 - alpha)) + (targetThreshold * alpha);
                
                // Only update React state if change is significant to avoid excessive re-renders
                if (Math.abs(newThreshold - thresholdRef.current) > 1) {
                  setThreshold(Math.round(newThreshold));
                }
                thresholdRef.current = newThreshold;
              }
            }
          }
        }
        
        const state = brightness > thresholdRef.current ? 'on' : 'off';
        
        // Pulse Detection Logic (Triggered on State Transitions)
        if (lastStateRef.current === 'off' && state === 'on') {
          // Pulse START: Decide what the previous gap meant
          setToggleCount(c => c + 1);
          
          const gapTime = lastPulseEndTimeRef.current > 0 ? video.currentTime - lastPulseEndTimeRef.current : 0;
          
          if (lastPulseEndTimeRef.current > 0) {
            console.log(`Pulse detected. Gap since last pulse: ${gapTime.toFixed(3)}s`);
          }
          
          if (lastPulseEndTimeRef.current === 0) {
            // First pulse of the session
            currentDigitCountRef.current = 1;
          } else if (gapTime < 1.1) {
            // Same digit (< 1.1s gap)
            currentDigitCountRef.current += 1;
          } else if (gapTime < 2.0) {
            // New digit in same code (approx 1.1s - 2.0s gap)
            finalizeDigit();
            currentDigitCountRef.current = 1;
          } else {
            // New code (> 2.0s gap)
            finalizeDigit();
            finalizeCode();
            currentDigitCountRef.current = 1;
          }
          
          setCurrentDigitCount(currentDigitCountRef.current);
        } else if (lastStateRef.current === 'on' && state === 'off') {
          // Pulse END: Record the timestamp to measure the next gap
          lastPulseEndTimeRef.current = video.currentTime;
        }

        lastStateRef.current = state;
        
        setBrightnessData(prev => [...prev, {
          frame: prev.length,
          time: video.currentTime,
          brightness,
          state
        }]);

        roiMat.delete();
      } else {
        console.warn("ROI is empty or out of bounds", rect);
      }
      
      src.delete();
    } catch (err) {
      console.error("CV Error during processing:", err);
    }

    // Progress
    const duration = analysisEndTimeRef.current - analysisStartTimeRef.current;
    const currentProgress = duration > 0 ? ((video.currentTime - analysisStartTimeRef.current) / duration) * 100 : 0;
    setProgress(Math.min(100, Math.max(0, currentProgress)));

    // Seek to next frame (approx 30fps)
    if (video.currentTime < analysisEndTimeRef.current && isProcessingRef.current) {
      const nextTime = Math.min(analysisEndTimeRef.current, video.currentTime + 0.033);
      
      if (nextTime === video.currentTime) {
        console.log("Video stuck at", video.currentTime);
        setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      video.currentTime = nextTime;
      
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        requestRef.current = requestAnimationFrame(processNextFrame);
      };
      video.addEventListener('seeked', onSeeked);
    } else {
      console.log("Processing complete", { time: video.currentTime, duration: video.duration });
      
      // Finalize remaining
      finalizeDigit();
      finalizeCode();

      setIsProcessing(false);
      isProcessingRef.current = false;
      setIsPlaying(false);
    }
  }, [finalizeDigit, finalizeCode]);

  const stopProcessing = () => {
    setIsProcessing(false);
    isProcessingRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  // ROI Selection logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!overlayCanvasRef.current) return;
    
    // Ensure canvas resolution matches its display size
    overlayCanvasRef.current.width = overlayCanvasRef.current.clientWidth;
    overlayCanvasRef.current.height = overlayCanvasRef.current.clientHeight;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsSelectingROI(true);
    setRoiStart({ x, y });
    setRoi({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelectingROI || !roiStart || !overlayCanvasRef.current) return;
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRoi({
      x: Math.min(x, roiStart.x),
      y: Math.min(y, roiStart.y),
      width: Math.abs(x - roiStart.x),
      height: Math.abs(y - roiStart.y)
    });
  };

  const handleMouseUp = () => {
    setIsSelectingROI(false);
    setRoiStart(null);
  };

  // Draw ROI overlay
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ROI box
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
    
    // Draw handle
    ctx.fillStyle = '#00ff9d';
    ctx.fillRect(roi.x - 4, roi.y - 4, 8, 8);
    ctx.fillRect(roi.x + roi.width - 4, roi.y + roi.height - 4, 8, 8);

    // Label
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = '#00ff9d';
    ctx.fillText('DETECTION ZONE', roi.x, roi.y - 5);
  }, [roi]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2">
            <Activity className="text-[#00ff9d]" />
            LUMEN<span className="text-[#00ff9d]">TRACE</span>
          </h1>
          <p className="text-sm text-zinc-500 mono uppercase tracking-widest mt-1">
            Optical Pulse Analysis System v1.0.4
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {!opencvLoaded ? (
            <div className="flex items-center gap-2 text-amber-500 text-xs mono animate-pulse">
              <RotateCcw className="w-3 h-3 animate-spin" />
              INITIALIZING COMPUTER VISION CORE...
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#00ff9d] text-xs mono">
              <CheckCircle2 className="w-3 h-3" />
              CV CORE READY
            </div>
          )}
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video & Controls */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="hardware-card overflow-hidden relative group">
            <div className="p-2 border-bottom border-[#333] flex justify-between items-center bg-[#1a1a1a]">
              <div className="flex items-center gap-2 px-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] mono text-zinc-400 uppercase">Live Feed / Buffer</span>
              </div>
              <div className="flex items-center gap-3">
                <Maximize2 className="w-3 h-3 text-zinc-500 cursor-pointer hover:text-white" />
                <Settings className="w-3 h-3 text-zinc-500 cursor-pointer hover:text-white" />
              </div>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              {videoUrl ? (
                <>
                  <video 
                    ref={videoRef}
                    src={videoUrl}
                    className="max-w-full max-h-full"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      handleLoadedMetadata();
                      if (overlayCanvasRef.current) {
                        overlayCanvasRef.current.width = overlayCanvasRef.current.clientWidth;
                        overlayCanvasRef.current.height = overlayCanvasRef.current.clientHeight;
                      }
                    }}
                  />
                  <canvas 
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 text-zinc-600">
                  <Upload className="w-12 h-12 opacity-20" />
                  <p className="mono text-xs uppercase tracking-widest">No Signal Detected</p>
                  <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs mono cursor-pointer transition-colors border border-zinc-700">
                    LOAD VIDEO FILE
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
                  <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#00ff9d]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mono text-[10px] text-[#00ff9d] animate-pulse">
                    ANALYZING OPTICAL DATA... {Math.round(progress)}%
                  </p>
                  <button 
                    onClick={stopProcessing}
                    className="px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/50 text-[10px] mono hover:bg-red-500/30 transition-colors"
                  >
                    ABORT PROCESS
                  </button>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="p-4 bg-[#1a1a1a] border-t border-[#333] flex items-center gap-4">
              <button 
                onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
                disabled={!videoUrl || isProcessing}
                className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <div className="flex-1">
                <div className="flex justify-between text-[10px] mono text-zinc-500 mb-1">
                  <span>00:00:00</span>
                  <span>{videoRef.current?.duration ? new Date(videoRef.current.duration * 1000).toISOString().substr(11, 8) : '--:--:--'}</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={videoRef.current?.duration || 100} 
                  step={0.01}
                  value={videoRef.current?.currentTime || 0}
                  onChange={(e) => {
                    if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value);
                  }}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button 
                onClick={startProcessing}
                disabled={!videoUrl || isProcessing || !opencvLoaded}
                className="px-4 py-2 bg-[#00ff9d] text-black font-bold text-xs mono hover:bg-[#00cc7d] disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Activity className="w-3 h-3" />
                RUN ANALYSIS
              </button>
            </div>
          </section>

          {/* Data Visualization */}
          <section className="hardware-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs mono uppercase tracking-widest text-zinc-400">Luminance Profile</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00ff9d]" />
                  <span className="text-[10px] mono text-zinc-500">BRIGHTNESS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500" />
                  <span className="text-[10px] mono text-zinc-500">THRESHOLD</span>
                </div>
              </div>
            </div>
            
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={brightnessData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#555" 
                    fontSize={10} 
                    tickFormatter={(val) => val.toFixed(1) + 's'}
                    hide={brightnessData.length === 0}
                    type="number"
                    domain={['auto', 'auto']}
                  />
                  <YAxis stroke="#555" fontSize={10} domain={[0, 255]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '10px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#00ff9d' }}
                  />
                  <ReferenceLine y={threshold} stroke="red" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="brightness" 
                    stroke="#00ff9d" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              {brightnessData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-[10px] mono text-zinc-700 uppercase tracking-widest">Waiting for data stream...</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Stats & Config */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Counter Display */}
          <section className="hardware-card p-6 flex flex-col gap-4">
            <h2 className="text-xs mono uppercase tracking-widest text-zinc-400">Pulse Counter</h2>
            <div className="lcd-display p-6 rounded flex flex-col items-center justify-center gap-2">
              <span className="text-5xl font-black mono tracking-tighter">
                {toggleCount.toString().padStart(3, '0')}
              </span>
              <span className="text-[9px] mono uppercase tracking-widest opacity-70">Total Toggles</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] mono uppercase text-zinc-500">Detected Codes (2-Digit Pairs)</h3>
              <div className="bg-black/50 p-4 rounded border border-zinc-800 min-h-[80px] flex flex-wrap gap-3 items-center">
                {codes.map((code, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 bg-[#00ff9d]/5 border border-[#00ff9d]/20 p-2 rounded"
                  >
                    <span className="px-2 py-1 bg-[#00ff9d]/10 text-[#00ff9d] rounded mono font-bold text-xl">
                      {code.digit1}
                    </span>
                    <span className="text-zinc-600 font-bold">-</span>
                    <span className="px-2 py-1 bg-[#00ff9d]/10 text-[#00ff9d] rounded mono font-bold text-xl">
                      {code.digit2}
                    </span>
                  </motion.div>
                ))}
                
                {/* Current incomplete code */}
                {currentCodeDigits.length > 0 && (
                  <div className="flex items-center gap-1 bg-amber-500/5 border border-amber-500/20 p-2 rounded animate-pulse">
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded mono font-bold text-xl">
                      {currentCodeDigits[0]}
                    </span>
                    <span className="text-zinc-600 font-bold">-</span>
                    <span className="px-2 py-1 bg-zinc-800 text-zinc-600 rounded mono font-bold text-xl">
                      {currentDigitCount > 0 ? currentDigitCount : '?'}
                    </span>
                  </div>
                )}

                {/* Current single digit being counted */}
                {currentCodeDigits.length === 0 && currentDigitCount > 0 && (
                  <div className="flex items-center gap-1 bg-amber-500/5 border border-amber-500/20 p-2 rounded animate-pulse">
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded mono font-bold text-xl">
                      {currentDigitCount}
                    </span>
                  </div>
                )}

                {codes.length === 0 && currentCodeDigits.length === 0 && currentDigitCount === 0 && (
                  <span className="text-[10px] mono text-zinc-700 uppercase">No codes detected</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-zinc-900 p-3 border border-zinc-800 rounded">
                <p className="text-[9px] mono text-zinc-500 uppercase">Avg Pulse Rate</p>
                <p className="text-lg mono">
                  {brightnessData.length > 0 ? (toggleCount / (brightnessData[brightnessData.length-1].time || 1)).toFixed(2) : '0.00'}
                  <span className="text-[10px] ml-1">Hz</span>
                </p>
              </div>
              <div className="bg-zinc-900 p-3 border border-zinc-800 rounded">
                <p className="text-[9px] mono text-zinc-500 uppercase">Peak Brightness</p>
                <p className="text-lg mono">
                  {brightnessData.length > 0 ? Math.max(...brightnessData.map(d => d.brightness)).toFixed(0) : '0'}
                  <span className="text-[10px] ml-1">LUX</span>
                </p>
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section className="hardware-card p-6 flex flex-col gap-6">
            <h2 className="text-xs mono uppercase tracking-widest text-zinc-400">Calibration</h2>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] mono text-zinc-400">
                    <Activity className="w-3 h-3" />
                    ANALYSIS RANGE
                  </div>
                  <div className="text-[10px] mono text-emerald-400">
                    {analysisStartTime.toFixed(1)}s — {analysisEndTime.toFixed(1)}s
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] mono text-zinc-600">
                      <span>START TIME</span>
                      <span>{analysisStartTime.toFixed(1)}s</span>
                    </div>
                    <input 
                      type="range" 
                      min={0} 
                      max={videoRef.current?.duration || 0} 
                      step={0.1}
                      value={analysisStartTime}
                      disabled={isProcessing}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setAnalysisStartTime(val);
                        if (val > analysisEndTime) setAnalysisEndTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] mono text-zinc-600">
                      <span>END TIME</span>
                      <span>{analysisEndTime.toFixed(1)}s</span>
                    </div>
                    <input 
                      type="range" 
                      min={0} 
                      max={videoRef.current?.duration || 0} 
                      step={0.1}
                      value={analysisEndTime}
                      disabled={isProcessing}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setAnalysisEndTime(val);
                        if (val < analysisStartTime) setAnalysisStartTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-zinc-500" />
                    <label className="text-[10px] mono uppercase text-zinc-500">Sensitivity Threshold</label>
                    <div className="flex items-center gap-1.5 ml-4">
                      <span className="text-[9px] text-zinc-600 mono">AUTO</span>
                      <button
                        onClick={() => setIsAutoThreshold(!isAutoThreshold)}
                        className={`w-7 h-3.5 rounded-full transition-colors relative border ${isAutoThreshold ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-zinc-800 border-zinc-700'}`}
                      >
                        <div className={`absolute top-0.5 w-2 h-2 rounded-full transition-all ${isAutoThreshold ? 'right-0.5 bg-emerald-400' : 'left-0.5 bg-zinc-500'}`} />
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] mono text-[#00ff9d]">{Math.round(threshold)}</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={255} 
                  value={threshold}
                  disabled={isAutoThreshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00ff9d] ${isAutoThreshold ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <p className="text-[9px] text-zinc-600 leading-relaxed italic">
                  {isAutoThreshold 
                    ? "Auto-detecting optimal threshold based on current luminance range."
                    : "Adjust to filter out background noise. Values above this mark are counted as \"ON\"."
                  }
                </p>
              </div>

              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] mono text-zinc-400">
                    <Info className="w-3 h-3" />
                    PROTOCOL SPECS
                  </div>
                  <ul className="text-[9px] text-zinc-500 space-y-2 list-disc ml-4">
                    <li><span className="text-zinc-300">Intra-Digit:</span> Gap &lt; 1.1s (Same digit).</li>
                    <li><span className="text-zinc-300">Inter-Digit:</span> Gap 1.1s - 2.0s (Next digit).</li>
                    <li><span className="text-zinc-300">Inter-Code:</span> Gap &gt; 2.0s (New code).</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] mono text-zinc-400">
                    <Info className="w-3 h-3" />
                    INSTRUCTIONS
                  </div>
                  <ol className="text-[10px] text-zinc-500 space-y-2 list-decimal ml-4">
                    <li>Upload a video of the light source.</li>
                    <li>Select the detection zone (green box).</li>
                    <li>Enable "AUTO" sensitivity for automatic detection.</li>
                    <li>Click "RUN ANALYSIS" to process.</li>
                  </ol>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setBrightnessData([]);
                setToggleCount(0);
                setCodes([]);
                setCurrentDigitCount(0);
                setCurrentCodeDigits([]);
                setProgress(0);
                setThreshold(128);
                thresholdRef.current = 128;
                brightnessWindowRef.current = [];
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="w-full py-3 border border-zinc-700 text-zinc-400 text-[10px] mono uppercase hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset System Memory
            </button>
          </section>

          {/* Status Panel */}
          <section className="hardware-card p-4 bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-[#00ff9d]'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] mono uppercase tracking-tighter">
                  System Status: {isProcessing ? 'PROCESSING' : 'IDLE'}
                </span>
                <span className="text-[8px] mono text-zinc-600">
                  {videoFile ? `FILE: ${videoFile.name}` : 'NO SOURCE LOADED'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <footer className="mt-auto pt-8 border-t border-[#333] flex justify-between items-center opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
        <div className="text-[9px] mono text-zinc-500">
          SECURE OPTICAL ANALYSIS PROTOCOL // ENCRYPTED DATA STREAM
        </div>
        <div className="flex gap-4">
          <div className="text-[9px] mono text-zinc-500">LATENCY: 12ms</div>
          <div className="text-[9px] mono text-zinc-500">BUFFER: 1024KB</div>
        </div>
      </footer>
    </div>
  );
}
