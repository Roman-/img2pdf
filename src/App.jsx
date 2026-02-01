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
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridColor, setGridColor] = useState('#c4c4c4');
  const [gridThickness, setGridThickness] = useState(0.5);

  // Image order state
  const [imageOrder, setImageOrder] = useState('same');

  // PDF state
  const [pdfUrl, setPdfUrl] = useState(null);
  const prevPdfUrlRef = useRef(null);

  // Error state
  const [errors, setErrors] = useState([]);

  const orderImages = useCallback((imagesToOrder, order) => {
    const ordered = [...imagesToOrder];
    switch (order) {
      case 'reverse':
        return ordered.reverse();
      case 'random':
        for (let i = ordered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        }
        return ordered;
      default:
        return ordered;
    }
  }, []);

  const createPdfUrl = useCallback((imagesToUse, settings) => {
    // Revoke previous URL to prevent memory leak
    if (prevPdfUrlRef.current) {
      URL.revokeObjectURL(prevPdfUrlRef.current);
    }

    const orderedImages = orderImages(imagesToUse, settings.imageOrder);

    const blob = generatePdf({
      images: orderedImages,
      ...settings,
    });

    const url = URL.createObjectURL(blob);
    prevPdfUrlRef.current = url;
    return url;
  }, [orderImages]);

  const handleImagesLoaded = useCallback((loadedImages) => {
    setImages(loadedImages);

    // Auto-generate PDF if < 40 images
    if (loadedImages.length >= 2 && loadedImages.length < 40) {
      const url = createPdfUrl(loadedImages, { rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder });
      setPdfUrl(url);
    } else {
      // Clear PDF for invalid counts
      if (prevPdfUrlRef.current) {
        URL.revokeObjectURL(prevPdfUrlRef.current);
        prevPdfUrlRef.current = null;
      }
      setPdfUrl(null);
    }
  }, [createPdfUrl, rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder]);

  const handleGenerate = useCallback(() => {
    if (images.length < 2) {
      setErrors(['Please load at least 2 images first.']);
      return;
    }
    const url = createPdfUrl(images, { rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder });
    setPdfUrl(url);
  }, [images, createPdfUrl, rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder]);

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
            imageOrder={imageOrder}
            setImageOrder={setImageOrder}
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
