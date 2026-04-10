document.addEventListener('DOMContentLoaded', () => {
    const { PDFDocument, degrees } = PDFLib;

    // ── Tab switching ──────────────────────────
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tool-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`panel-${tab.dataset.tool}`).classList.add('active');
        });
    });

    // ══════════════════════════════════════════
    // ── ROTATE TOOL ──────────────────────────
    // ══════════════════════════════════════════
    const rotateUpload = document.getElementById('rotate-upload');
    const rotateLoading = document.getElementById('rotate-loading');
    const rotateResults = document.getElementById('rotate-results');
    const rotateDownloadBtn = document.getElementById('rotate-download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const emailAddress = document.getElementById('email-address');
    const rotateAnotherBtn = document.getElementById('rotate-another-btn');

    rotateUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        rotateLoading.classList.remove('hidden');
        rotateResults.classList.add('hidden');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            const pagesToRotate = Math.min(2, pages.length);
            for (let i = 0; i < pagesToRotate; i++) {
                const page = pages[i];
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + 90));
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            rotateDownloadBtn.href = url;
            rotateDownloadBtn.download = `rotated_${file.name}`;

            rotateLoading.classList.add('hidden');
            rotateResults.classList.remove('hidden');
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('An error occurred while processing the PDF. Please ensure it is a valid PDF file.');
            rotateLoading.classList.add('hidden');
        }
    });

    // Upload another (rotate)
    rotateAnotherBtn.addEventListener('click', () => {
        rotateResults.classList.add('hidden');
        rotateUpload.value = '';
        rotateUpload.click();
    });

    // Copy Email
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(emailAddress.innerText).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            copyBtn.style.background = '#4ade80';
            copyBtn.style.color = 'white';
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy text.');
        });
    });

    // ══════════════════════════════════════════
    // ── SPLIT TOOL ───────────────────────────
    // ══════════════════════════════════════════
    const splitUpload = document.getElementById('split-upload');
    const splitLoading = document.getElementById('split-loading');
    const splitResults = document.getElementById('split-results');
    const splitDownloadsGrid = document.getElementById('split-downloads');
    const splitPageCount = document.getElementById('split-page-count');
    const splitDownloadAllBtn = document.getElementById('split-download-all-btn');
    const splitAnotherBtn = document.getElementById('split-another-btn');

    // Store generated blobs for "Download All" zip
    let splitBlobs = [];
    let splitOriginalName = '';

    splitUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        splitLoading.classList.remove('hidden');
        splitResults.classList.add('hidden');
        splitDownloadsGrid.innerHTML = '';
        splitBlobs = [];
        splitOriginalName = file.name.replace(/\.pdf$/i, '');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const srcDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = srcDoc.getPageCount();

            for (let i = 0; i < totalPages; i++) {
                const newDoc = await PDFDocument.create();
                const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
                newDoc.addPage(copiedPage);
                const pdfBytes = await newDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const pageNum = i + 1;
                const fileName = `${splitOriginalName}_page_${pageNum}.pdf`;

                splitBlobs.push({ blob, fileName });

                // Create button for each page
                const url = URL.createObjectURL(blob);
                const btn = document.createElement('a');
                btn.href = url;
                btn.download = fileName;
                btn.className = 'split-page-btn';
                btn.innerHTML = `<span class="page-icon">📄</span>Page ${pageNum}`;
                splitDownloadsGrid.appendChild(btn);
            }

            splitPageCount.textContent = totalPages;
            splitLoading.classList.add('hidden');
            splitResults.classList.remove('hidden');
        } catch (error) {
            console.error('Error splitting PDF:', error);
            alert('An error occurred while splitting the PDF. Please ensure it is a valid PDF file.');
            splitLoading.classList.add('hidden');
        }
    });

    // Download All as ZIP
    splitDownloadAllBtn.addEventListener('click', async () => {
        if (splitBlobs.length === 0) return;

        splitDownloadAllBtn.textContent = '⏳ Zipping…';
        splitDownloadAllBtn.disabled = true;

        try {
            const zip = new JSZip();
            for (const { blob, fileName } of splitBlobs) {
                zip.file(fileName, blob);
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${splitOriginalName}_split.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error creating ZIP:', error);
            alert('Error creating ZIP file.');
        }

        splitDownloadAllBtn.textContent = '⬇️ Download All as ZIP';
        splitDownloadAllBtn.disabled = false;
    });

    // Upload another (split)
    splitAnotherBtn.addEventListener('click', () => {
        splitResults.classList.add('hidden');
        splitDownloadsGrid.innerHTML = '';
        splitBlobs = [];
        splitUpload.value = '';
        splitUpload.click();
    });
});
