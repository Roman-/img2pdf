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
}) {
  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfFilename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="controls-panel">
      <div className="control-group">
        <h3>Layout</h3>
        <div className="control-row">
          <label htmlFor="rows">Rows</label>
          <input
            type="number"
            id="rows"
            min="1"
            value={rows}
            onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className="control-row">
          <label htmlFor="cols">Columns</label>
          <input
            type="number"
            id="cols"
            min="1"
            value={cols}
            onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className="control-row">
          <label htmlFor="imageOrder">Image Order</label>
          <select
            id="imageOrder"
            value={imageOrder}
            onChange={(e) => setImageOrder(e.target.value)}
          >
            <option value="same">Same order</option>
            <option value="reverse">Reverse order</option>
            <option value="random">Random order</option>
          </select>
        </div>
      </div>

      <div className="control-group">
        <h3>Orientation</h3>
        <div className="orientation-toggle">
          <button
            className={`orientation-btn ${orientation === 'portrait' ? 'active' : ''}`}
            onClick={() => setOrientation('portrait')}
          >
            Portrait
          </button>
          <button
            className={`orientation-btn ${orientation === 'landscape' ? 'active' : ''}`}
            onClick={() => setOrientation('landscape')}
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
              />
            </div>
          </>
        )}
      </div>

      <div className="button-row">
        <button
          className="generate-btn"
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          Generate PDF
        </button>
        <button
          className="download-btn"
          onClick={handleDownload}
          disabled={!pdfUrl}
          title={pdfFilename || 'Download PDF'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
