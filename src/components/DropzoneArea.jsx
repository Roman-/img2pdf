import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export function DropzoneArea({ onImagesLoaded, imageCount, setErrors }) {
  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const errors = [];

      // Handle rejected files (non-PNG)
      if (fileRejections.length > 0) {
        const invalidFiles = fileRejections.map((r) => r.file.name).join(', ');
        errors.push(`Invalid files (only PNG allowed): ${invalidFiles}`);
      }

      // Filter to only PNG files
      const pngFiles = acceptedFiles.filter(
        (f) => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png')
      );

      // Check batch requirement (2+ files)
      if (pngFiles.length < 2) {
        errors.push('Please drop a batch (2+ files) at once.');
        setErrors(errors);
        return;
      }

      setErrors(errors);

      // Load images and extract dimensions
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
            img.onerror = () => {
              resolve(null);
            };
            img.src = dataUrl;
          };
          reader.onerror = () => {
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(loadPromises).then((results) => {
        const validImages = results.filter((r) => r !== null);

        // Check for dimension warnings
        if (validImages.length > 1) {
          const firstW = validImages[0].wPx;
          const firstH = validImages[0].hPx;
          const hasDifferentSizes = validImages.some(
            (img) => img.wPx !== firstW || img.hPx !== firstH
          );
          if (hasDifferentSizes) {
            setErrors((prev) => [
              ...prev,
              'Warning: Images have different dimensions.',
            ]);
          }
        }

        onImagesLoaded(validImages);
      });
    },
    [onImagesLoaded, setErrors]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="dropzone-content">
        <div className="dropzone-icon">📁</div>
        {isDragActive ? (
          <p>Drop the PNG files here...</p>
        ) : (
          <>
            <p className="dropzone-instruction">
              Drag & drop a batch of PNGs (2+ files)
            </p>
            <p className="dropzone-hint">or click to select files</p>
          </>
        )}
        {imageCount > 0 && (
          <p className="dropzone-count">{imageCount} images loaded</p>
        )}
      </div>
    </div>
  );
}
