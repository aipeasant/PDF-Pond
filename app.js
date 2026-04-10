document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('pdf-upload');
    const loadingSection = document.getElementById('loading');
    const resultsSection = document.getElementById('results');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const emailAddress = document.getElementById('email-address');

    const { PDFDocument, degrees } = PDFLib;

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show loading state
        loadingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        try {
            const arrayBuffer = await file.arrayBuffer();
            
            // Load the PDF
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            // Rotate first two pages (if they exist)
            const pagesToRotate = Math.min(2, pages.length);
            for (let i = 0; i < pagesToRotate; i++) {
                const page = pages[i];
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + 90));
            }

            // Save the modified PDF
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Update download link
            downloadBtn.href = url;
            downloadBtn.download = `rotated_${file.name}`;

            // Show results
            loadingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');

        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('An error occurred while processing the PDF. Please ensure it is a valid PDF file.');
            loadingSection.classList.add('hidden');
        }
    });

    // Copy Email functionality
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
});
