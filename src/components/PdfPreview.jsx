export function PdfPreview({ pdfUrl }) {
  return (
    <div className="pdf-preview">
      {pdfUrl ? (
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
