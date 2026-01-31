## Project spec — PNG grid-to-PDF (React + jsPDF, in-browser)

### 1) Goal

A React web app that accepts a **single drag-and-drop batch** of same-sized PNG images, arranges them into a **rows × columns grid** per page, draws **optional internal grid lines**, and renders the generated PDF in an **embedded preview** (iframe). All processing is **client-side**.

---

### 2) Tech stack

* **React** (Vite or CRA)
* **jsPDF** for PDF generation (`jspdf`)
* Optional helpers:

  * `react-dropzone` (drag & drop handling)
  * `colord` or native input validation for color (optional)

---

### 3) Core behaviors

#### 3.1 Upload (batch-only)

* User must **drag & drop multiple PNGs at once**.
* The dropzone must clearly communicate: “Drop a batch of PNG files (multiple at once).”
* If the drop event contains **fewer than 2 images**, show an error: “Please drop a batch (2+ files) at once.”
* Only accept `.png`. Reject others with an error listing invalid files.
* Image order in PDF is **the order delivered by the drop event**.

  * No post-upload sorting by name/date.
  * No manual reordering in v1 (unless explicitly added later).

#### 3.2 Pagination

* `imagesPerPage = rows * cols`
* `pageCount = ceil(totalImages / imagesPerPage)`
* Last page: if fewer images remain, leave **empty cells** (no rescaling/reflow).

#### 3.3 Page format / orientation

* Page size fixed to **A4**.
* Orientation toggle:

  * **Portrait** (default)
  * **Landscape**
* Minimal margins and spacing:

  * Fixed small margin (e.g., 5–8 mm) and small internal gap (e.g., 0–2 mm).
  * Keep these as constants (v1) rather than user-configurable.

#### 3.4 Image placement (fit rule)

* Each cell contains one image.
* Images are placed to **fit inside the cell preserving aspect ratio**.
* Do **not upscale** above 100% of the original pixel size (to avoid fake “enhancement”).
* Downscale is allowed if needed to fit the cell.
* Center the image in the cell.

#### 3.5 Grid lines (internal only)

* Toggle: “Draw grid lines”
* If enabled:

  * Draw **internal** lines only (between rows/columns), **no outer border**.
  * Configurable:

    * Line color (hex)
    * Line thickness (in pt or mm)

---

### 4) UI spec (single page)

#### 4.1 Controls panel

* Dropzone (large, centered)

  * Instruction text: “Drag & drop a batch of PNGs (2+ files)”
  * Show counts: “N images loaded”
* Layout controls:

  * Rows (number input, min 1, default 4)
  * Columns (number input, min 1, default 1)
  * Orientation (segmented control: Portrait / Landscape)
* Grid lines controls:

  * Checkbox: Draw internal grid lines
  * If checked:

    * Color input (default `#000000`)
    * Thickness input (default e.g. `0.5`)
* Action:

  * Button: “Generate PDF” (disabled until valid batch loaded)

#### 4.2 Preview panel

* An `<iframe>` showing the generated PDF via `blob:` URL.
* If no PDF generated yet, show an empty state message: “PDF preview will appear here.”

---

### 5) PDF generation details (jsPDF)

#### 5.1 Units and sizing

* Use jsPDF with units in **mm**:

  * `new jsPDF({ unit: 'mm', format: 'a4', orientation })`
* A4 dimensions:

  * Portrait: 210 × 297 mm
  * Landscape: 297 × 210 mm

#### 5.2 Layout math

* Constants:

  * `marginMm` (minimal, e.g., 6)
  * `gapMm` (minimal, e.g., 0–2)
* Compute usable area:

  * `usableW = pageW - 2*marginMm`
  * `usableH = pageH - 2*marginMm`
* Cell size:

  * `cellW = (usableW - (cols-1)*gapMm) / cols`
  * `cellH = (usableH - (rows-1)*gapMm) / rows`
* For each page:

  * For each cell (r, c), compute top-left:

    * `x = marginMm + c*(cellW + gapMm)`
    * `y = marginMm + r*(cellH + gapMm)`

#### 5.3 Images

* Read dropped files as Data URLs (or ArrayBuffer → base64).
* For each image:

  * Determine render size inside cell using its intrinsic pixel ratio:

    * Fit-to-cell preserving aspect, but clamp scale ≤ 1.0 (no upscale).
  * `doc.addImage(dataUrl, 'PNG', imgX, imgY, renderW, renderH)`

#### 5.4 Grid lines

* If enabled, draw internal lines after placing images:

  * Vertical lines between columns: at `x = marginMm + k*(cellW+gapMm) - gapMm/2` (or exactly at boundary if gap=0)
  * Horizontal lines between rows similarly.
* Use:

  * `doc.setDrawColor(r,g,b)` from hex
  * `doc.setLineWidth(thicknessMmOrPt)` (document which unit you use)

#### 5.5 Output and preview

* `const blob = doc.output('blob')`
* `const url = URL.createObjectURL(blob)`
* Set iframe `src={url}`
* On re-generate, revoke old URL: `URL.revokeObjectURL(prevUrl)`

---

### 6) Validation and error handling

* Reject if:

  * No images
  * Less than 2 images in the drop action (batch enforcement)
  * Non-PNG files present
  * `rows*cols < 1` (prevent via input constraints)
* Warn (non-blocking) if images are not same dimensions (optional check):

  * Load first image dimensions; compare subsequent ones; show warning.

---

### 7) State and components (suggested)

* `App`

  * `ControlsPanel`
  * `DropzoneArea`
  * `PdfPreview`
* State:

  * `files: File[]`
  * `images: { dataUrl: string, wPx: number, hPx: number }[]`
  * `rows, cols`
  * `orientation`
  * `gridEnabled, gridColor, gridThickness`
  * `pdfUrl: string | null`
  * `errors: string[]`

---

### 8) Non-goals (v1)

* No backend / no server rendering
* No per-image manual reorder or delete UI (batch replace only)
* No multiple layout presets beyond A4 portrait/landscape
* No advanced typography/headers/footers

---

### 9) Acceptance criteria

* Dropping a batch of PNGs + clicking “Generate PDF” produces:

  * Correct page count: `ceil(N / (rows*cols))`
  * Correct order based on drop batch order
  * Empty cells on last page (no reflow)
  * A4 portrait by default; landscape toggle works
  * Optional internal grid lines with configurable color/thickness
  * PDF is visible in iframe and downloadable via built-in viewer controls
