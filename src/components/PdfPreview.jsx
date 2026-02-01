export function PdfPreview({ pdfUrl, isGenerating }) {
  return (
    <div className="pdf-preview">
      {isGenerating ? (
        <div className="pdf-placeholder">
          <div className="spinner"></div>
          <p>Generating PDF...</p>
        </div>
      ) : pdfUrl ? (
        <iframe
          src={pdfUrl}
          title="PDF Preview"
          className="pdf-iframe"
        />
      ) : (
        <div className="pdf-placeholder">
          <div className="placeholder-icon">📄</div>
          <p>PDF preview will appear here</p>
        </div>
      )}
    </div>
  );
}
