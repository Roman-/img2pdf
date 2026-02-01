import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ControlsPanel } from './components/ControlsPanel';
import { PdfPreview } from './components/PdfPreview';
import { generatePdf, PdfGenerationError } from './utils/pdfGenerator';
import {
  validateFile,
  validateImageDimensions,
  validateFileCount,
  validateGridConfig,
} from './utils/validation';
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
    return name.replace(/\.(png|jpe?g|gif|webp|bmp|svg|tiff?|avif|heic)$/i, '');
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

/**
 * Truncate filename for display
 */
function truncateFilename(name, maxLength = 40) {
  if (name.length <= maxLength) return name;
  const ext = name.lastIndexOf('.');
  if (ext > 0 && name.length - ext < 10) {
    const extPart = name.slice(ext);
    const basePart = name.slice(0, maxLength - extPart.length - 3);
    return basePart + '...' + extPart;
  }
  return name.slice(0, maxLength - 3) + '...';
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
  const [pdfSize, setPdfSize] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const prevPdfUrlRef = useRef(null);
  const generateTimeoutRef = useRef(null);
  const isGeneratingRef = useRef(false);

  // Loading state
  const [loadingProgress, setLoadingProgress] = useState(null);

  // Error/warning state
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  // Grid validation
  const gridValidation = useMemo(() => {
    return validateGridConfig(rows, cols, images.length, orientation);
  }, [rows, cols, images.length, orientation]);

  // Prevent drops outside the drop zone from opening files in browser
  useEffect(() => {
    const preventDrop = (e) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDrop);
    window.addEventListener('drop', preventDrop);
    return () => {
      window.removeEventListener('dragover', preventDrop);
      window.removeEventListener('drop', preventDrop);
    };
  }, []);

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
    // Prevent concurrent generation
    if (isGeneratingRef.current) {
      return null;
    }
    isGeneratingRef.current = true;

    // Clean up previous URL
    if (prevPdfUrlRef.current) {
      URL.revokeObjectURL(prevPdfUrlRef.current);
      prevPdfUrlRef.current = null;
    }

    const orderedImages = orderImages(imagesToUse, settings.imageOrder);

    try {
      const result = generatePdf({
        images: orderedImages,
        ...settings,
      });

      let url;
      try {
        url = URL.createObjectURL(result.blob);
      } catch {
        throw new PdfGenerationError(
          'Failed to create PDF preview. Try generating again.',
          'blob'
        );
      }

      prevPdfUrlRef.current = url;
      setPdfSize(result.blob.size);
      isGeneratingRef.current = false;
      return url;
    } catch (error) {
      isGeneratingRef.current = false;

      if (error instanceof PdfGenerationError) {
        setErrors(prev => [...prev, error.message]);
      } else {
        setErrors(prev => [...prev, `PDF generation failed: ${error.message || 'Unknown error'}`]);
      }
      return null;
    }
  }, [orderImages]);

  const handleImagesLoaded = useCallback((loadedImages, loadWarnings = []) => {
    setImages(loadedImages);
    setWarnings(loadWarnings);

    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current);
    }

    if (loadedImages.length >= 2 && loadedImages.length < 40) {
      setIsGenerating(true);
      generateTimeoutRef.current = setTimeout(() => {
        const url = createPdfUrl(loadedImages, { rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder });
        setPdfUrl(url);
        setIsGenerating(false);
      }, 300); // Increased debounce for stability
    } else {
      if (prevPdfUrlRef.current) {
        URL.revokeObjectURL(prevPdfUrlRef.current);
        prevPdfUrlRef.current = null;
      }
      setPdfUrl(null);
      setPdfSize(null);
      setIsGenerating(false);
    }
  }, [createPdfUrl, rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder]);

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const newErrors = [];
      const newWarnings = [];

      // Handle rejected files
      if (fileRejections.length > 0) {
        const invalidFiles = fileRejections.map((r) => truncateFilename(r.file.name)).join(', ');
        newErrors.push(`Invalid files (only images allowed): ${invalidFiles}`);
      }

      // Filter to image files
      const imageFiles = acceptedFiles.filter(
        (f) => f.type.startsWith('image/')
      );

      // Check total file count
      const countValidation = validateFileCount(imageFiles.length);
      if (!countValidation.valid) {
        newErrors.push(countValidation.error);
        setErrors(newErrors);
        setLoadingProgress(null);
        return;
      }

      // Check minimum batch size
      if (imageFiles.length < 2) {
        newErrors.push('Please drop a batch (2+ files) at once.');
        setErrors(newErrors);
        setLoadingProgress(null);
        return;
      }

      // Validate each file before loading
      let totalSize = 0;
      const validatedFiles = [];
      const skippedFiles = [];

      for (const file of imageFiles) {
        const validation = validateFile(file, totalSize);

        if (!validation.valid) {
          skippedFiles.push({ name: file.name, reason: validation.error });
        } else {
          validatedFiles.push(file);
          totalSize += file.size;

          if (validation.warnings && validation.warnings.length > 0) {
            newWarnings.push(...validation.warnings);
          }
        }
      }

      // Report skipped files
      if (skippedFiles.length > 0) {
        const skippedList = skippedFiles.slice(0, 5).map(f =>
          `${truncateFilename(f.name)}: ${f.reason}`
        );
        if (skippedFiles.length > 5) {
          skippedList.push(`... and ${skippedFiles.length - 5} more`);
        }
        newErrors.push(`Skipped ${skippedFiles.length} file(s):\n${skippedList.join('\n')}`);
      }

      // Check if we still have enough files
      if (validatedFiles.length < 2) {
        newErrors.push('Not enough valid images. Please provide at least 2 valid image files.');
        setErrors(newErrors);
        setLoadingProgress(null);
        return;
      }

      setErrors(newErrors);
      setLoadingProgress({ loaded: 0, total: validatedFiles.length });

      let loadedCount = 0;
      const loadPromises = validatedFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
              loadedCount++;
              setLoadingProgress({ loaded: loadedCount, total: validatedFiles.length });

              // Validate dimensions
              const dimValidation = validateImageDimensions(
                img.naturalWidth,
                img.naturalHeight,
                file.name
              );

              if (!dimValidation.valid) {
                newWarnings.push(dimValidation.error);
                resolve(null);
                return;
              }

              if (dimValidation.warnings && dimValidation.warnings.length > 0) {
                newWarnings.push(...dimValidation.warnings);
              }

              resolve({
                dataUrl,
                wPx: img.naturalWidth,
                hPx: img.naturalHeight,
                name: file.name,
                size: file.size,
              });
            };
            img.onerror = () => {
              loadedCount++;
              setLoadingProgress({ loaded: loadedCount, total: validatedFiles.length });
              newWarnings.push(`Failed to load "${truncateFilename(file.name)}" (file may be corrupted)`);
              resolve(null);
            };
            img.src = dataUrl;
          };
          reader.onerror = () => {
            loadedCount++;
            setLoadingProgress({ loaded: loadedCount, total: validatedFiles.length });
            newWarnings.push(`Failed to read "${truncateFilename(file.name)}"`);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(loadPromises).then((results) => {
        setLoadingProgress(null);
        const validImages = results.filter((r) => r !== null);

        // Check how many images failed
        const failedCount = results.length - validImages.length;
        if (failedCount > 0 && validImages.length > 0) {
          newWarnings.push(`${failedCount} image(s) could not be loaded`);
        }

        // Check if we still have enough
        if (validImages.length < 2) {
          setErrors(prev => [...prev, 'Not enough images loaded successfully. Need at least 2.']);
          return;
        }

        // Check for dimension mismatches
        if (validImages.length > 1) {
          const firstW = validImages[0].wPx;
          const firstH = validImages[0].hPx;
          const hasDifferentSizes = validImages.some(
            (img) => img.wPx !== firstW || img.hPx !== firstH
          );
          if (hasDifferentSizes) {
            newWarnings.push('Warning: Images have different dimensions. They will be scaled to fit.');
          }
        }

        handleImagesLoaded(validImages, newWarnings);
      });
    },
    [handleImagesLoaded]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const handleGenerate = useCallback(() => {
    if (images.length < 2) {
      setErrors(['Please load at least 2 images first.']);
      return;
    }

    // Check for grid configuration errors
    if (gridValidation.errors.length > 0) {
      setErrors(gridValidation.errors);
      return;
    }

    // Clear previous errors and generate
    setErrors([]);
    setIsGenerating(true);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const url = createPdfUrl(images, { rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder });
      setPdfUrl(url);
      setIsGenerating(false);
    }, 50);
  }, [images, createPdfUrl, rows, cols, orientation, gridEnabled, gridColor, gridThickness, imageOrder, gridValidation.errors]);

  const canGenerate = images.length >= 2 && !isGenerating && gridValidation.errors.length === 0;

  const pdfFilename = useMemo(() => generatePdfFilename(images), [images]);

  const pageCount = useMemo(() => {
    if (images.length === 0) return 0;
    return Math.ceil(images.length / (rows * cols));
  }, [images.length, rows, cols]);

  // Combine grid warnings with other warnings
  const allWarnings = useMemo(() => {
    return [...warnings, ...gridValidation.warnings];
  }, [warnings, gridValidation.warnings]);

  return (
    <div {...getRootProps()} className={`app ${isDragActive ? 'app-drag-active' : ''}`}>
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <div className="drag-icon">📁</div>
            <p>Drop images here</p>
          </div>
        </div>
      )}

      <header className="app-header">
        <h1>Images to PDF Grid Converter</h1>
        <p className="header-hint">
          {images.length > 0 ? (
            <>{images.length} images loaded — drop more to replace, or <button type="button" className="link-button" onClick={open}>click here</button> to select</>
          ) : (
            <>Drop a batch of images anywhere on the page, or <button type="button" className="link-button" onClick={open}>click here</button> to select them from your computer.</>
          )}
        </p>
        {loadingProgress && (
          <div className="loading-progress">
            Loading images: {loadingProgress.loaded} / {loadingProgress.total}
          </div>
        )}
      </header>

      {(errors.length > 0 || allWarnings.length > 0) && (
        <div className="messages">
          {errors.map((error, idx) => (
            <div key={`error-${idx}`} className="error-message">
              {error}
            </div>
          ))}
          {allWarnings.map((warning, idx) => (
            <div key={`warning-${idx}`} className="warning-message">
              {warning}
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
            imageCount={images.length}
            pageCount={pageCount}
            pdfSize={pdfSize}
            isGenerating={isGenerating}
            cellSize={gridValidation.cellW && gridValidation.cellH ? {
              w: gridValidation.cellW,
              h: gridValidation.cellH
            } : null}
            hasConfigErrors={gridValidation.errors.length > 0}
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
