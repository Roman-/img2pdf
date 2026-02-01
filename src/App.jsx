import { useState, useRef, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { ControlsPanel } from './components/ControlsPanel';
import { PdfPreview } from './components/PdfPreview';
import { generatePdf } from './utils/pdfGenerator';
import './App.css';

/**
 * Find the longest common prefix of an array of strings
 */
function findCommonPrefix(strings) {
  if (!strings.length) return '';
  if (strings.length === 1) return strings[0];

  const first = strings[0];
  let prefixLength = 0;

  for (let i = 0; i < first.length; i++) {
    const char = first[i];
    if (strings.every(s => s[i] === char)) {
      prefixLength = i + 1;
    } else {
      break;
    }
  }

  return first.slice(0, prefixLength);
}

/**
 * Generate a PDF filename from image names
 */
function generatePdfFilename(images) {
  if (!images.length) return 'document.pdf';

  const baseNames = images.map(img => {
    const name = img.name || '';
    return name.replace(/\.png$/i, '');
  });

  const prefix = findCommonPrefix(baseNames);
  const cleanedPrefix = prefix.replace(/[-_.\s\d]+$/, '').trim();

  if (cleanedPrefix.length >= 3) {
    return `${cleanedPrefix}.pdf`;
  }

  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  return `images-${dateStr}.pdf`;
}

function App() {
  // Image state
  const [images, setImages] = useState([]);

  // Layout state
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(1);
  const [orientation, setOrientation] = useState('portrait');

  // Grid line state
  const [gridEnabled, setGridEnabled] = useState('solid');
  const [gridColor, setGridColor] = useState('#c4c4c4');
  const [gridThickness, setGridThickness] = useState(0.5);

  // Image order state
  const [imageOrder, setImageOrder] = useState('same');

  // PDF state
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const prevPdfUrlRef = useRef(null);
  const generateTimeoutRef = useRef(null);

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

    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
    }

    if (loadedImages.length >= 2 && loadedImages.length < 40) {
      setIsGenerating(true);
      generateTimeoutRef.current = setTimeout(() => {
        const url = createPdfUrl(loadedImages, { rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder });
        setPdfUrl(url);
        setIsGenerating(false);
      }, 100);
    } else {
      if (prevPdfUrlRef.current) {
        URL.revokeObjectURL(prevPdfUrlRef.current);
        prevPdfUrlRef.current = null;
      }
      setPdfUrl(null);
      setIsGenerating(false);
    }
  }, [createPdfUrl, rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder]);

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const newErrors = [];

      if (fileRejections.length > 0) {
        const invalidFiles = fileRejections.map((r) => r.file.name).join(', ');
        newErrors.push(`Invalid files (only PNG allowed): ${invalidFiles}`);
      }

      const pngFiles = acceptedFiles.filter(
        (f) => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png')
      );

      if (pngFiles.length < 2) {
        newErrors.push('Please drop a batch (2+ files) at once.');
        setErrors(newErrors);
        return;
      }

      setErrors(newErrors);

      const loadPromises = pngFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
              resolve({
                dataUrl,
                wPx: img.naturalWidth,
                hPx: img.naturalHeight,
                name: file.name,
              });
            };
            img.onerror = () => resolve(null);
            img.src = dataUrl;
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(loadPromises).then((results) => {
        const validImages = results.filter((r) => r !== null);

        if (validImages.length > 1) {
          const firstW = validImages[0].wPx;
          const firstH = validImages[0].hPx;
          const hasDifferentSizes = validImages.some(
            (img) => img.wPx !== firstW || img.hPx !== firstH
          );
          if (hasDifferentSizes) {
            setErrors((prev) => [...prev, 'Warning: Images have different dimensions.']);
          }
        }

        handleImagesLoaded(validImages);
      });
    },
    [handleImagesLoaded]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'] },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const handleGenerate = useCallback(() => {
    if (images.length < 2) {
      setErrors(['Please load at least 2 images first.']);
      return;
    }
    const url = createPdfUrl(images, { rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder });
    setPdfUrl(url);
  }, [images, createPdfUrl, rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder]);

  const canGenerate = images.length >= 2;

  const pdfFilename = useMemo(() => generatePdfFilename(images), [images]);

  return (
    <div {...getRootProps()} className={`app ${isDragActive ? 'app-drag-active' : ''}`}>
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <div className="drag-icon">📁</div>
            <p>Drop PNG files here</p>
          </div>
        </div>
      )}

      <header className="app-header">
        <h1>PNG to PDF Grid Converter</h1>
        <p className="header-hint">
          {images.length > 0 ? (
            <>{images.length} images loaded — drop more to replace, or <button type="button" className="link-button" onClick={open}>click here</button> to select</>
          ) : (
            <>Drop a batch of PNG files anywhere on the page, or <button type="button" className="link-button" onClick={open}>click here</button> to select them from your computer.</>
          )}
        </p>
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
            pdfUrl={pdfUrl}
            pdfFilename={pdfFilename}
          />
        </div>
        <div className="right-panel">
          <PdfPreview pdfUrl={pdfUrl} isGenerating={isGenerating} />
        </div>
      </main>
    </div>
  );
}

export default App;
