'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [frames, setFrames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(3);
  const [fps, setFps] = useState(30);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateFrames = async () => {
    setIsGenerating(true);
    setFrames([]);
    setVideoUrl('');

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalFrames = duration * fps;
    const newFrames: string[] = [];

    for (let i = 0; i < totalFrames; i++) {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1920, 1080);

      // Calculate animation progress
      const progress = i / totalFrames;

      // Animated gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
      const hue1 = (progress * 360) % 360;
      const hue2 = ((progress * 360) + 180) % 360;
      gradient.addColorStop(0, `hsl(${hue1}, 70%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue2}, 70%, 30%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1920, 1080);

      // Animated circles
      for (let j = 0; j < 5; j++) {
        const angle = (progress * Math.PI * 2 * 3) + (j * Math.PI * 2 / 5);
        const x = 960 + Math.cos(angle) * 400;
        const y = 540 + Math.sin(angle) * 300;
        const radius = 50 + Math.sin(progress * Math.PI * 4 + j) * 30;

        ctx.fillStyle = `hsla(${(hue1 + j * 60) % 360}, 80%, 60%, 0.5)`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Text overlay
      if (text) {
        const fontSize = 120 + Math.sin(progress * Math.PI * 2) * 20;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, 960, 540);

        ctx.shadowColor = 'transparent';
      }

      // Capture frame
      newFrames.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    setFrames(newFrames);
    setIsGenerating(false);
  };

  const createVideo = async () => {
    if (frames.length === 0) return;

    setIsGenerating(true);

    try {
      // Client-side video generation using MediaRecorder API
      const canvas = canvasRef.current;
      if (!canvas) return;

      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setIsGenerating(false);
      };

      mediaRecorder.start();

      // Replay frames on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let frameIndex = 0;
      const frameInterval = 1000 / fps;

      const playFrame = () => {
        if (frameIndex < frames.length) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            frameIndex++;
            setTimeout(playFrame, frameInterval);
          };
          img.src = frames[frameIndex];
        } else {
          mediaRecorder.stop();
        }
      };

      playFrame();
    } catch (error) {
      console.error('Error creating video:', error);
      alert('Error creating video: ' + error);
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    await generateFrames();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Video Generator
        </h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Text Overlay</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text..."
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Math.min(10, Number(e.target.value))))}
                min="1"
                max="10"
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">FPS</label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value={15}>15</option>
                <option value={24}>24</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100"
            >
              {isGenerating ? 'Generating...' : 'Generate Frames'}
            </button>

            {frames.length > 0 && (
              <button
                onClick={createVideo}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100"
              >
                Create Video
              </button>
            )}
          </div>
        </div>

        {frames.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Preview</h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto">
              {frames.map((frame, i) => (
                <img
                  key={i}
                  src={frame}
                  alt={`Frame ${i}`}
                  className="w-full h-auto rounded border border-gray-600"
                />
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Generated {frames.length} frames ({duration}s @ {fps} FPS)
            </p>
          </div>
        )}

        {videoUrl && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Generated Video</h2>
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg mb-4"
            />
            <a
              href={videoUrl}
              download="generated-video.webm"
              className="inline-block bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Download Video
            </a>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="hidden"
        />
      </div>
    </div>
  );
}
