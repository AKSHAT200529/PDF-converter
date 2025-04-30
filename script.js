
        // Load jsPDF
        const { jsPDF } = window.jspdf;
        
        // DOM Elements
        const dropArea = document.getElementById('drop-area');
        const fileInput = document.getElementById('file-input');
        const selectButton = document.getElementById('select-button');
        const previewContainer = document.getElementById('preview-container');
        const imagePreview = document.getElementById('image-preview');
        const convertBtn = document.getElementById('convert-btn');
        const downloadBtn = document.getElementById('download-btn');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const statusMessage = document.getElementById('status-message');
        const pageSizeSelect = document.getElementById('page-size');
        const orientationSelect = document.getElementById('orientation');
        const pdfFilenameInput = document.getElementById('pdf-filename');
        
        // Global variables
        let uploadedImage = null;
        let pdfDoc = null;
        let pdfDataUrl = null;
        
        // Event Listeners
        selectButton.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop functionality
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.classList.add('highlight');
        }
        
        function unhighlight() {
            dropArea.classList.remove('highlight');
        }
        
        dropArea.addEventListener('drop', handleDrop, false);
        
        // Convert button
        convertBtn.addEventListener('click', convertToPDF);
        
        // Function to handle file selection
        function handleFileSelect(e) {
            const file = e.target.files[0];
            processFile(file);
        }
        
        // Function to handle dropped files
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            processFile(file);
        }
        
        // Process the selected file
        function processFile(file) {
            if (!file) return;
            
            // Check if the file is an image
            if (!file.type.match('image.*')) {
                showStatusMessage('Please select a valid image file', 'error');
                return;
            }
            
            uploadedImage = file;
            
            // Reset UI
            resetUI();
            
            // Show loading
            showProgress();
            progressBar.style.width = '30%';
            
            // Read and display the image
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
                
                // Set default filename based on original file
                const fileName = file.name.split('.')[0] || 'converted-image';
                pdfFilenameInput.value = fileName;
                
                // Update progress
                progressBar.style.width = '100%';
                setTimeout(() => {
                    hideProgress();
                    showStatusMessage('Image loaded successfully!', 'success');
                }, 500);
            };
            
            reader.onerror = function() {
                hideProgress();
                showStatusMessage('Error reading the file', 'error');
            };
            
            reader.readAsDataURL(file);
        }
        
        // Convert the image to PDF
        function convertToPDF() {
            if (!uploadedImage) {
                showStatusMessage('Please upload an image first', 'error');
                return;
            }
            
            showProgress();
            progressBar.style.width = '50%';
            showStatusMessage('Converting...', 'normal');
            
            setTimeout(() => {
                try {
                    // Get options
                    const pageSize = pageSizeSelect.value;
                    const orientation = orientationSelect.value;
                    const filename = pdfFilenameInput.value || 'converted-image';
                    
                    // Create new PDF document
                    const doc = new jsPDF({
                        orientation: orientation,
                        unit: 'mm',
                        format: pageSize
                    });
                    
                    // Get image dimensions
                    const img = new Image();
                    img.src = imagePreview.src;
                    
                    // Calculate dimensions to fit page while maintaining aspect ratio
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    
                    let finalWidth, finalHeight;
                    
                    if (imgWidth / imgHeight > pageWidth / pageHeight) {
                        // Image is wider relative to its height than the page
                        finalWidth = pageWidth - 20; // 10mm margin on each side
                        finalHeight = (imgHeight / imgWidth) * finalWidth;
                    } else {
                        // Image is taller relative to its width than the page
                        finalHeight = pageHeight - 20; // 10mm margin on top and bottom
                        finalWidth = (imgWidth / imgHeight) * finalHeight;
                    }
                    
                    // Calculate position to center the image
                    const xPos = (pageWidth - finalWidth) / 2;
                    const yPos = (pageHeight - finalHeight) / 2;
                    
                    // Add image to PDF
                    doc.addImage(
                        imagePreview.src,
                        'JPEG',
                        xPos,
                        yPos,
                        finalWidth,
                        finalHeight
                    );
                    
                    // Save PDF
                    pdfDoc = doc;
                    pdfDataUrl = doc.output('dataurlstring');
                    
                    // Enable download button
                    downloadBtn.classList.remove('btn-disabled');
                    downloadBtn.addEventListener('click', downloadPDF);
                    downloadBtn.href = pdfDataUrl;
                    downloadBtn.download = `${filename}.pdf`;
                    
                    // Update progress
                    progressBar.style.width = '100%';
                    setTimeout(() => {
                        hideProgress();
                        showStatusMessage('Conversion complete! Click the Download button to save your PDF.', 'success');
                    }, 500);
                    
                } catch (error) {
                    console.error('Error converting to PDF:', error);
                    hideProgress();
                    showStatusMessage('Error converting to PDF. Please try again.', 'error');
                }
            }, 800); // Small delay for better UX
        }
        
        // Download the generated PDF
        function downloadPDF() {
            if (!pdfDoc) {
                showStatusMessage('Please convert the image first', 'error');
                return;
            }
            
            const filename = pdfFilenameInput.value || 'converted-image';
            pdfDoc.save(`${filename}.pdf`);
        }
        
        // Helper functions
        function showProgress() {
            progressContainer.style.display = 'block';
        }
        
        function hideProgress() {
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 500);
        }
        
        function showStatusMessage(message, type) {
            statusMessage.textContent = message;
            statusMessage.style.display = 'block';
            
            // Reset classes
            statusMessage.classList.remove('status-success', 'status-error');
            
            if (type === 'success') {
                statusMessage.classList.add('status-success');
            } else if (type === 'error') {
                statusMessage.classList.add('status-error');
            }
            
            // Auto hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 5000);
            }
        }
        
        function resetUI() {
            downloadBtn.classList.add('btn-disabled');
            downloadBtn.removeEventListener('click', downloadPDF);
            statusMessage.style.display = 'none';
            pdfDoc = null;
            pdfDataUrl = null;
        }
