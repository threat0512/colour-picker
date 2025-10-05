import { useState, useRef, useEffect } from 'react';
import { Pipette } from 'lucide-react';

interface ColorPickerProps {
  onChange?: (color: { hex: string; r: number; g: number; b: number }) => void;
}

export default function ColorPicker({ onChange }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState({ r: 151, g: 81, b: 242 });
  const [gradientPosition, setGradientPosition] = useState({ x: 250, y: 175 });
  const [hue, setHue] = useState(270);
  const [isDraggingGradient, setIsDraggingGradient] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  const gradientRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const recentColors = [
    { r: 255, g: 255, b: 255 },
    { r: 255, g: 192, b: 203 },
    { r: 173, g: 216, b: 230 },
    { r: 255, g: 255, b: 224 },
  ];

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  };

  const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  const updateColorFromGradient = (x: number, y: number) => {
    if (!gradientRef.current) return;

    const rect = gradientRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(x, rect.width));
    const clampedY = Math.max(0, Math.min(y, rect.height));

    const s = clampedX / rect.width;
    const v = 1 - (clampedY / rect.height);

    const color = hsvToRgb(hue, s, v);
    setSelectedColor(color);
    setGradientPosition({ x: clampedX, y: clampedY });

    onChange?.({ hex: rgbToHex(color.r, color.g, color.b), ...color });
  };

  const handleGradientMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingGradient(true);
    const rect = e.currentTarget.getBoundingClientRect();
    updateColorFromGradient(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingHue(true);
    updateHue(e);
  };

  const updateHue = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return;

    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    setHue(newHue);

    const rect2 = gradientRef.current?.getBoundingClientRect();
    if (rect2) {
      const s = gradientPosition.x / rect2.width;
      const v = 1 - (gradientPosition.y / rect2.height);
      const color = hsvToRgb(newHue, s, v);
      setSelectedColor(color);
      onChange?.({ hex: rgbToHex(color.r, color.g, color.b), ...color });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingGradient && gradientRef.current) {
        const rect = gradientRef.current.getBoundingClientRect();
        updateColorFromGradient(e.clientX - rect.left, e.clientY - rect.top);
      }
      if (isDraggingHue) {
        updateHue(e as any);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingGradient(false);
      setIsDraggingHue(false);
    };

    if (isDraggingGradient || isDraggingHue) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingGradient, isDraggingHue, gradientPosition, hue]);

  const handleColorClick = (color: { r: number; g: number; b: number }) => {
    setSelectedColor(color);
    onChange?.({ hex: rgbToHex(color.r, color.g, color.b), ...color });
  };

  return (
    <div className="w-80 bg-white rounded-2xl shadow-2xl p-6">
      {/* Gradient Selector */}
      <div
        ref={gradientRef}
        className="relative w-full h-64 rounded-xl cursor-crosshair mb-4 overflow-hidden"
        style={{
          background: `linear-gradient(to bottom, transparent, black),
                      linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`
        }}
        onMouseDown={handleGradientMouseDown}
      >
        <div
          className="absolute w-5 h-5 border-3 border-white rounded-full shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${gradientPosition.x}px`,
            top: `${gradientPosition.y}px`,
            boxShadow: '0 0 0 1.5px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      </div>

      {/* Hue Slider */}
      <div className="mb-4">
        <div
          ref={hueRef}
          className="relative w-full h-3 rounded-full cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
          onMouseDown={handleHueMouseDown}
        >
          <div
            className="absolute w-5 h-5 bg-white border-3 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 top-1/2"
            style={{
              left: `${(hue / 360) * 100}%`,
              boxShadow: '0 0 0 1.5px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        </div>
      </div>

      {/* Eyedropper and Recent Colors */}
      <div className="flex items-center gap-3 mb-4">
        <button
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}
        >
          <Pipette className="w-5 h-5 text-white" />
        </button>

        <div className="flex gap-2">
          {recentColors.map((color, idx) => (
            <button
              key={idx}
              className="w-9 h-9 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: rgbToHex(color.r, color.g, color.b) }}
              onClick={() => handleColorClick(color)}
            />
          ))}
        </div>
      </div>

      {/* Color Values */}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1">HEX</label>
          <input
            type="text"
            value={rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b)}
            readOnly
            className="w-full px-2 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">R</label>
          <input
            type="text"
            value={Math.round(selectedColor.r)}
            readOnly
            className="w-full px-2 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">G</label>
          <input
            type="text"
            value={Math.round(selectedColor.g)}
            readOnly
            className="w-full px-2 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">B</label>
          <input
            type="text"
            value={Math.round(selectedColor.b)}
            readOnly
            className="w-full px-2 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
    </div>
  );
}
