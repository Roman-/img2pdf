import { useState, useRef, useCallback } from 'react';
import { DropzoneArea } from './components/DropzoneArea';
import { ControlsPanel } from './components/ControlsPanel';
import { PdfPreview } from './components/PdfPreview';
import { generatePdf } from './utils/pdfGenerator';
import './App.css';

function App() {
  // Image state
  const [images, setImages] = useState([]);

  // Layout state
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(1);
  const [orientation, setOrientation] = useState('portrait');

  // Grid line state
  const [gridEnabled, setGridEnabled] = useState(false);
  const [gridColor, setGridColor] = useState('#000000');
  const [gridThickness, setGridThickness] = useState(0.5);

  // PDF state
  const [pdfUrl, setPdfUrl] = useState(null);
  const prevPdfUrlRef = useRef(null);

  // Error state
  const [errors, setErrors] = useState([]);

  const handleImagesLoaded = useCallback((loadedImages) => {
    setImages(loadedImages);
    // Clear previous PDF when new images are loaded
    if (prevPdfUrlRef.current) {
      URL.revokeObjectURL(prevPdfUrlRef.current);
      prevPdfUrlRef.current = null;
    }
    setPdfUrl(null);
  }, []);

  const handleGenerate = useCallback(() => {
    if (images.length < 2) {
      setErrors(['Please load at least 2 images first.']);
      return;
    }

    // Revoke previous URL to prevent memory leak
    if (prevPdfUrlRef.current) {
      URL.revokeObjectURL(prevPdfUrlRef.current);
    }

    const blob = generatePdf({
      images,
      rows,
      cols,
      orientation,
      gridEnabled,
      gridColor,
      gridThickness,
    });

    const url = URL.createObjectURL(blob);
    prevPdfUrlRef.current = url;
    setPdfUrl(url);
  }, [images, rows, cols, orientation, gridEnabled, gridColor, gridThickness]);

  const canGenerate = images.length >= 2;

  return (
    <div className="app">
      <header className="app-header">
        <h1>PNG to PDF Grid Converter</h1>
      </header>

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, idx) => (
            <div
              key={idx}
              className={`error-message ${error.startsWith('Warning') ? 'warning' : ''}`}
            >
              {error}
            </div>
          ))}
        </div>
      )}

      <main className="app-main">
        <div className="left-panel">
          <DropzoneArea
            onImagesLoaded={handleImagesLoaded}
            imageCount={images.length}
            setErrors={setErrors}
          />
          <ControlsPanel
            rows={rows}
            setRows={setRows}
            cols={cols}
            setCols={setCols}
            orientation={orientation}
            setOrientation={setOrientation}
            gridEnabled={gridEnabled}
            setGridEnabled={setGridEnabled}
            gridColor={gridColor}
            setGridColor={setGridColor}
            gridThickness={gridThickness}
            setGridThickness={setGridThickness}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
          />
        </div>
        <div className="right-panel">
          <PdfPreview pdfUrl={pdfUrl} />
        </div>
      </main>
    </div>
  );
}

export default App;
