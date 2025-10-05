import { Analytics } from '@vercel/analytics/react';
import ColorPicker from './components/ColorPicker';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <ColorPicker
        onChange={(color) => console.log('Selected color:', color)}
      />
      <Analytics />
    </div>
  );
}

export default App;
