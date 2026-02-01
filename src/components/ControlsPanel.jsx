function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ControlsPanel({
  rows,
  setRows,
  cols,
  setCols,
  orientation,
  setOrientation,
  gridEnabled,
  setGridEnabled,
  gridColor,
  setGridColor,
  gridThickness,
  setGridThickness,
  imageOrder,
  setImageOrder,
  onGenerate,
  canGenerate,
  pdfUrl,
  pdfFilename,
  imageCount,
  pageCount,
  pdfSize,
  isGenerating,
  cellSize,
  hasConfigErrors,
}) {
  const handleDownload = () => {
    if (!pdfUrl || isGenerating) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfFilename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine if inputs should be disabled (during generation)
  const inputsDisabled = isGenerating;

  // Helper to safely set integer values
  const handleRowsChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setRows(Math.max(1, Math.round(value)));
  };

  const handleColsChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setCols(Math.max(1, Math.round(value)));
  };

  return (
    <div className="controls-panel">
      <div className="control-group">
        <div className="control-row">
          <label htmlFor="rows">Rows</label>
          <input
            type="number"
            id="rows"
            min="1"
            max="100"
            value={rows}
            onChange={handleRowsChange}
            disabled={inputsDisabled}
          />
        </div>
        <div className="control-row">
          <label htmlFor="cols">Columns</label>
          <input
            type="number"
            id="cols"
            min="1"
            max="100"
            value={cols}
            onChange={handleColsChange}
            disabled={inputsDisabled}
          />
        </div>
        <div className="control-row">
          <label htmlFor="imageOrder">Image Order</label>
          <select
            id="imageOrder"
            value={imageOrder}
            onChange={(e) => setImageOrder(e.target.value)}
            disabled={inputsDisabled}
          >
            <option value="same">Same order</option>
            <option value="reverse">Reverse order</option>
            <option value="random">Random order</option>
          </select>
        </div>
      </div>

      <div className="control-group">
        <div className="orientation-toggle">
          <button
            className={`orientation-btn ${orientation === 'portrait' ? 'active' : ''}`}
            onClick={() => setOrientation('portrait')}
            disabled={inputsDisabled}
          >
            Portrait
          </button>
          <button
            className={`orientation-btn ${orientation === 'landscape' ? 'active' : ''}`}
            onClick={() => setOrientation('landscape')}
            disabled={inputsDisabled}
          >
            Landscape
          </button>
        </div>
      </div>

      <div className="control-group">
        <select
          id="gridEnabled"
          value={gridEnabled}
          onChange={(e) => setGridEnabled(e.target.value)}
          className="separator-select"
          disabled={inputsDisabled}
        >
          <option value="none">No separators</option>
          <option value="solid">Solid line separator</option>
          <option value="dashed">Dashed line separator</option>
        </select>
        {gridEnabled !== 'none' && (
          <>
            <div className="control-row">
              <label htmlFor="gridColor">Color</label>
              <input
                type="color"
                id="gridColor"
                value={gridColor}
                onChange={(e) => setGridColor(e.target.value)}
                disabled={inputsDisabled}
              />
              <span className="color-value">{gridColor}</span>
            </div>
            <div className="control-row">
              <label htmlFor="gridThickness">Thickness (mm)</label>
              <input
                type="number"
                id="gridThickness"
                min="0.1"
                max="5"
                step="0.1"
                value={gridThickness}
                onChange={(e) =>
                  setGridThickness(Math.max(0.1, parseFloat(e.target.value) || 0.5))
                }
                disabled={inputsDisabled}
              />
            </div>
          </>
        )}
      </div>

      {imageCount > 0 && (
        <div className="pdf-summary">
          <div className="summary-row">
            <span>{imageCount} images</span>
            <span className="separator">→</span>
            <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
            {pdfSize && (
              <>
                <span className="separator">•</span>
                <span>{formatFileSize(pdfSize)}</span>
              </>
            )}
          </div>
          {cellSize && (
            <div className="cell-size-info">
              Cell size: {cellSize.w.toFixed(1)} × {cellSize.h.toFixed(1)} mm
            </div>
          )}
        </div>
      )}

      <div className="button-row">
        <button
          className={`generate-btn ${isGenerating ? 'generating' : ''}`}
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          {isGenerating ? 'Generating...' : 'Generate PDF'}
        </button>
        <button
          className="download-btn"
          onClick={handleDownload}
          disabled={!pdfUrl || isGenerating}
          title={pdfFilename || 'Download PDF'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>

      {hasConfigErrors && (
        <div className="config-error-hint">
          Please fix the configuration errors above before generating.
        </div>
      )}
    </div>
  );
}
