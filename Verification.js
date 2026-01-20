document.addEventListener('DOMContentLoaded', () => {

    // --- dropzone handling ---
    const dropzone = document.getElementById('idDropzone');
    const fileInput = document.getElementById('idFile');
    const fileNameDisplay = document.getElementById('fileName');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropzone.classList.add('active');
    }

    function unhighlight(e) {
        dropzone.classList.remove('active');
    }

    dropzone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            // Simple validation
            const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                alert("Invalid file type. Please upload JPG, PNG, or PDF.");
                return;
            }
            // Update UI
            fileNameDisplay.innerHTML = `<i class="bi bi-file-earmark-check text-success"></i> ${file.name}`;
            dropzone.style.borderColor = 'var(--success)';
            document.getElementById('checkIconID').classList.add('verified'); // Update preview
        }
    }


    // --- Final Submission Logic ---
    window.finalizeCampaign = function () { // Expose to global scope for button onclick
        if (checkVerificationDocs()) {
            // Simulate processing
            const btn = document.querySelector('.btn-primary');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
            btn.disabled = true;

            setTimeout(() => {
                window.location.href = 'success.html';
            }, 1500);
        }
    }

    function checkVerificationDocs() {
        // 1. Check ID
        if (fileInput.files.length === 0) {
            alert("Please upload your Government ID.");
            return false;
        }

        // 2. Validate Socials (Regex)
        const linkedin = document.getElementById('linkedinUrl').value;
        const twitter = document.getElementById('twitterUrl').value;

        // Simple regex for demo (contains domain)
        const linkedinRegex = /linkedin\.com/;
        // const twitterRegex = /twitter\.com|x\.com/; 

        if (linkedin && !linkedinRegex.test(linkedin)) {
            alert("Please enter a valid LinkedIn URL.");
            return false;
        }

        // 3. Liveness Check
        const liveness = document.getElementById('livenessCheck');
        if (!liveness.checked) {
            alert("You must agree to the Liveness Check declaration.");
            return false;
        }

        return true;
    }

    // --- Input Listeners for Live Preview ---
    document.getElementById('linkedinUrl').addEventListener('input', (e) => {
        const item = document.getElementById('checkIconSocial');
        if (e.target.value.length > 5) item.classList.add('verified');
        else item.classList.remove('verified');
    });

});
