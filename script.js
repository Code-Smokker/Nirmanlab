document.addEventListener('DOMContentLoaded', () => {
    // 1. AUTH CHECK (Priority Execution)
    checkGlobalAuth();

    // 2. Initialize UI Components
    initScrollReveal();
    initFilters();
    initAnimations();
    initHeaderScroll();
    initSmoothScroll();

    // 3. Page Specific Logic
    initCampaignForm();
    initCampaignDetails();
    initCampaignCards(); // Handle clicks on grid cards
    initShowMore(); // Handle pagination
    initShareButton(); // Activation share button
    initProgressBars();
    initDonationLogic();
    initUserCampaignLoading(); // Load User Campaign on Explore
});

// --- DYNAMIC CAMPAIGN SELECTION ---
function initCampaignCards() {
    const cards = document.querySelectorAll('.campaign-card');
    cards.forEach(card => {
        card.addEventListener('click', function (e) {
            // 1. Scrape Title & Category
            const title = card.querySelector('h4').textContent;
            const category = card.querySelector('.tag') ? card.querySelector('.tag').textContent : 'General';

            // 2. Scrape Image (Robust Regex)
            let image = 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5b1e?auto=format&fit=crop&q=80&w=1000';
            const imgDiv = card.querySelector('.image-placeholder');
            const imgTag = card.querySelector('img');

            if (imgDiv) {
                const bgStyle = window.getComputedStyle(imgDiv).backgroundImage;
                const urlMatch = bgStyle.match(/url\(["']?([^"']*)["']?\)/);
                if (urlMatch && urlMatch[1]) {
                    image = urlMatch[1];
                }
            } else if (imgTag) {
                image = imgTag.src;
            }

            // 3. Scrape Meta Data (Backers, Days Left, Progress)
            let backers = 0;
            let daysLeft = 30;
            let progressPercent = 0;

            const metaSpans = card.querySelectorAll('.campaign-meta span');
            metaSpans.forEach(span => {
                const text = span.textContent;
                if (text.includes('backers')) backers = parseInt(text.replace(/,/g, '')) || 0;
                if (text.includes('days left')) daysLeft = parseInt(text) || 30;
            });

            const progressFill = card.querySelector('.progress-fill');
            if (progressFill) {
                progressPercent = parseInt(progressFill.style.width) || 0;
            }

            // Estimate Goal/Raised based on progress for mock data consistency
            const estimatedGoal = 10000;
            const estimatedRaised = Math.round((estimatedGoal * progressPercent) / 100);

            const campaignData = {
                title: title,
                category: category,
                image: image,
                goal: estimatedGoal,
                raised: estimatedRaised,
                backers: backers,
                daysLeft: daysLeft,
                description: card.querySelector('p').textContent
            };

            localStorage.setItem('impactSeed_currentCampaign', JSON.stringify(campaignData));
        });
    });
}

function initShowMore() {
    const hiddenCards = document.querySelectorAll('.campaign-card.hidden');
    const showMoreBtn = document.getElementById('showMoreBtn');

    if (showMoreBtn && hiddenCards.length > 0) {
        showMoreBtn.addEventListener('click', () => {
            hiddenCards.forEach(card => {
                card.classList.remove('hidden');
                card.style.display = 'block'; // Ensure display is reset
                card.classList.add('fade-in-up'); // Add animation
            });
            showMoreBtn.style.display = 'none';
        });
    }
}

function initShareButton() {
    const shareBtn = document.querySelector('.share-action'); // Assuming class mapping needed in HTML or use ID
    if (!shareBtn) return;

    shareBtn.addEventListener('click', () => {
        const originalText = shareBtn.innerHTML;
        navigator.clipboard.writeText(window.location.href).then(() => {
            shareBtn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
            setTimeout(() => shareBtn.innerHTML = originalText, 2000);
        });
    });
}

// function initShowMore above ends at 96, initShareButton ends at 110.
// initUserCampaignLoading() call is misplaced or just stray text resulted from bad merge.
// I will just remove these lines as `initUserCampaignLoading` is not called here, 
// and the extra brace `}` is a syntax error.
// The function definition exists below.
// I need to add the CALL to the top DOMContentLoaded block instead.

function initUserCampaignLoading() {
    // Only run if we have a campaign grid
    const grid = document.querySelector('.campaigns-grid');
    if (!grid) return;

    // Check for user created campaign
    const userCampaign = JSON.parse(localStorage.getItem('impactSeed_campaign'));
    if (userCampaign) {
        // Create HTML (simplified matches existing card structure)
        const percent = userCampaign.goal > 0 ? Math.min(100, Math.round((userCampaign.raised / userCampaign.goal) * 100)) : 0;

        const cardHTML = `
            <a href="Campanigdetails.html" class="campaign-card fade-in-up" onclick="selectUserCampaign(event)">
                <div class="image-placeholder" style="position:relative; overflow:hidden;">
                     <img src="${userCampaign.image}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">
                     <span class="tag" style="position:absolute; top:1rem; left:1rem; z-index:2;">${userCampaign.category.toUpperCase()}</span>
                </div>
                <div class="campaign-content">
                    <h4>${userCampaign.title}</h4>
                    <p style="overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                        ${userCampaign.description || "A user generated campaign to make the world better."}
                    </p>
                    <div class="progress">
                        <div class="progress-fill" style="width:${percent}%"></div>
                    </div>
                    <div class="campaign-meta">
                        <span>${userCampaign.daysLeft} days left</span>
                        <span>${(userCampaign.backers || 0).toLocaleString()} backers</span>
                    </div>
                </div>
            </a>
        `;

        // Prepend to grid
        // We create a temp div to hold it, then insert
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML.trim();
        const newCard = tempDiv.firstChild;

        // Mark as user created for identification
        newCard.dataset.userCreated = "true";
        newCard.addEventListener('click', () => {
            // Ensure this exact data is set as "Current" when clicked
            localStorage.setItem('impactSeed_currentCampaign', JSON.stringify(userCampaign));
        });

        grid.prepend(newCard);
    }
}

function initScrollReveal() {
    if (typeof ScrollReveal !== 'undefined') {
        ScrollReveal().reveal('.fade-in-up', { delay: 200, distance: '20px', origin: 'bottom', interval: 100 });
    }
}

function initFilters() {
    // Index & Explore Page Filters
    const filters = document.querySelectorAll('.chip');
    if (filters.length > 0) {
        const cards = document.querySelectorAll('.campaign-card');

        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                // 1. Update Active State
                document.querySelector('.chip.active')?.classList.remove('active');
                btn.classList.add('active');

                // 2. Filter Logic
                const filterValue = btn.textContent.trim().toUpperCase();

                cards.forEach(card => {
                    const tagEl = card.querySelector('.tag');
                    if (!tagEl) return;

                    // Text matching: Handle special cases if needed (e.g. Eco vs Environment)
                    // For now, straight text match
                    const cardCategory = tagEl.textContent.trim().toUpperCase();

                    // Logic: Show if 'ALL' or exact match
                    // Bonus: fuzzy match 'ECO' to 'ENVIRONMENT' if desired, but let's stick to direct first.
                    // Actually, let's allow "ECO" to match "ENVIRONMENT" for better UX on Index page
                    const isMatch = (filterValue === 'ALL') ||
                        (cardCategory === filterValue) ||
                        (filterValue === 'ECO' && cardCategory === 'ENVIRONMENT') ||
                        (filterValue === 'ENVIRONMENT' && cardCategory === 'ECO');

                    if (isMatch) {
                        card.style.display = 'block';
                        card.classList.remove('hidden'); // Reveal if hidden by pagination
                        // Re-trigger animation if needed
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Update "Show More" button visibility if on Explore page?
                // If we filtered, "Show More" is irrelevant as we just showed all matches.
                const showMoreBtn = document.getElementById('showMoreBtn');
                if (showMoreBtn) showMoreBtn.style.display = 'none';
            });
        });
    }

    // Start Campaign Category Buttons (Form Selection)
    const catBtns = document.querySelectorAll('.cat-btn');
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.cat-btn.active')?.classList.remove('active');
            btn.classList.add('active');

            // Update Preview
            const previewCat = document.getElementById('previewCategory');
            if (previewCat) previewCat.textContent = btn.getAttribute('data-cat').toUpperCase();
        });
    });
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initProgressBars() {
    const bars = document.querySelectorAll('.progress-fill, .progress-bar');
    bars.forEach(bar => {
        // Simple animation on load
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => bar.style.width = width, 500);
    });
}

function initCampaignForm() {
    const campaignForm = document.getElementById('campaignForm');
    if (!campaignForm) return;

    // ... (Existing input definitions) ...
    const titleInput = document.getElementById('inputTitle');
    const goalInput = document.getElementById('inputGoal');
    const imageInput = document.getElementById('inputImage');
    const previewTitle = document.getElementById('previewTitle');
    const previewGoal = document.getElementById('previewGoal');
    const previewImageContainer = document.querySelector('.preview-image');

    if (titleInput && previewTitle) {
        titleInput.addEventListener('input', (e) => previewTitle.textContent = e.target.value || "Your Campaign Title");
    }
    // ... (Rest of existing listeners) ...
    if (goalInput && previewGoal) {
        goalInput.addEventListener('input', (e) => previewGoal.textContent = e.target.value ? parseFloat(e.target.value).toLocaleString() : "...");
    }
    if (imageInput) {
        imageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imgUrl = e.target.result;
                    previewImageContainer.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;">`;
                    localStorage.setItem('tempCampaignImage', imgUrl);
                }
                reader.readAsDataURL(file);
            }
        });
    }

    campaignForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
        btn.disabled = true;

        const campaignData = {
            title: titleInput.value || "Untitled Campaign",
            goal: goalInput.value || "0",
            category: document.querySelector('.cat-btn.active')?.dataset.cat || "General",
            image: localStorage.getItem('tempCampaignImage') || 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5b1e?auto=format&fit=crop&q=80&w=1000',
            timestamp: new Date().toISOString(),
            raised: 0,
            backers: 0,
            daysLeft: 30
        };
        // Save as both the "user's created campaign" AND the "currently selected one"
        localStorage.setItem('impactSeed_campaign', JSON.stringify(campaignData));
        localStorage.setItem('impactSeed_currentCampaign', JSON.stringify(campaignData));

        setTimeout(() => window.location.href = 'Verification.html', 1000);
    });
}

function initCampaignDetails() {
    // Read from the "Selected/Current" key, fallback to "Created" key if missing
    let savedCampaign = JSON.parse(localStorage.getItem('impactSeed_currentCampaign'));

    // Fallback: If no card clicked yet, maybe show the user's last created one? 
    // Or default to a placeholder.
    if (!savedCampaign) {
        savedCampaign = JSON.parse(localStorage.getItem('impactSeed_campaign'));
    }

    if (!savedCampaign) return;

    const detailTitle = document.querySelector('h1.h2.fw-bold.mb-3');
    const mainImg = document.querySelector('.main-campaign-img');
    const currentAmountEl = document.querySelector('h3.fw-bold.text-primary.mb-0');
    const detailBadge = document.querySelector('.badge.bg-white.text-success');
    const progressBadge = document.querySelector('.badge.bg-primary.bg-opacity-10');
    const progressBar = document.querySelector('.progress-bar');
    const goalTextEl = document.querySelector('p.text-muted.small strong');
    const descEl = document.querySelector('p.text-secondary.fs-5');
    const daysLeftEl = document.querySelector('.col-6.border-end.text-end h6') || document.querySelectorAll('.col-6 h6')[1];

    if (detailTitle) detailTitle.textContent = savedCampaign.title;
    if (mainImg) mainImg.src = savedCampaign.image;
    if (detailBadge) detailBadge.textContent = savedCampaign.category.toUpperCase();
    if (descEl && savedCampaign.description) descEl.textContent = savedCampaign.description;

    // Stats Calculation
    const goal = parseFloat(savedCampaign.goal) || 10000;
    const raised = parseFloat(savedCampaign.raised) || 0;
    const percent = Math.min(100, Math.round((raised / goal) * 100));

    // Backers & Days Update
    const backersCount = parseInt(savedCampaign.backers) || 0;
    const backersEl = document.querySelector('.col-6.border-end h6');
    if (backersEl) backersEl.textContent = backersCount.toLocaleString();

    if (daysLeftEl && savedCampaign.daysLeft) {
        daysLeftEl.textContent = savedCampaign.daysLeft + " Days";
    }

    // Update UI
    if (currentAmountEl) currentAmountEl.textContent = `$${raised.toLocaleString()}`;
    if (goalTextEl) goalTextEl.textContent = `$${goal.toLocaleString()}`;

    if (progressBadge) progressBadge.textContent = `${percent}% Goal`;
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent);
    }
}
// --- DONATION & CURRENCY LOGIC ---
function initDonationLogic() {
    const currencySelector = document.getElementById('currencySelector');
    const currencySymbol = document.getElementById('currencySymbol');
    const donationAmount = document.getElementById('donationAmount');
    const donateBtn = document.getElementById('donateBtn');
    const donateBtnText = document.getElementById('donateBtnText');

    if (!currencySelector || !donateBtn) return;

    // 1. Auto-Detect User's Locale/Country for Currency
    // Try to guess based on browser standard
    // Note: This is client-side guessing. In production, we'd use IP geo-location.
    try {
        const userLocale = navigator.language || navigator.languages[0];
        const formatter = new Intl.NumberFormat(userLocale, { style: 'currency', currency: 'USD' });
        // This gives us the locale, we need to map locale to currency roughly for this demo
        // For simple demo, let's just use the Selector's default or try to match:

        // Simple manual map for demo purposes based on common locales
        if (userLocale.includes('IN')) currencySelector.value = "INR";
        else if (userLocale.includes('GB')) currencySelector.value = "GBP";
        else if (userLocale.includes('JP')) currencySelector.value = "JPY";
        else if (userLocale.includes('DE') || userLocale.includes('FR') || userLocale.includes('ES') || userLocale.includes('IT')) currencySelector.value = "EUR";
        else currencySelector.value = "USD"; // Default
    } catch (e) {
        console.log("Locale detection failed, using USD");
    }

    // 2. Function to Update UI
    const updateUI = () => {
        const selectedOption = currencySelector.options[currencySelector.selectedIndex];
        const symbol = selectedOption.getAttribute('data-symbol');
        const amount = donationAmount.value || 0;

        // Update Symbol Label
        currencySymbol.textContent = symbol;

        // Update Button Text
        donateBtnText.textContent = `Donate ${symbol}${amount}`;
    };

    // 3. Event Listeners
    currencySelector.addEventListener('change', updateUI);

    // 4. Update on Input
    if (donationAmount) {
        donationAmount.addEventListener('input', updateUI);
    }

    // 5. Initial Run
    updateUI();

    // 6. Handle Donate Click
    donateBtn.addEventListener('click', () => {
        const amount = parseFloat(donationAmount.value) || 0;
        const currency = currencySelector.value;

        // 1. Save Transaction for Success Page
        localStorage.setItem('lastDonation', JSON.stringify({
            amount: amount,
            currency: currency,
            symbol: currencySymbol.textContent,
            timestamp: new Date().toISOString()
        }));

        // 2. Update Campaign Progress in Storage
        try {
            const currentCampaign = JSON.parse(localStorage.getItem('impactSeed_campaign'));
            if (currentCampaign) {
                const currentRaised = parseFloat(currentCampaign.raised) || 0;
                // For demo simplicity, we add amount directly regardless of currency
                // In production, we would convert to base currency here
                currentCampaign.raised = currentRaised + amount;

                // Update Backer Count (Fake increment)
                const currentBackers = parseInt(currentCampaign.backers) || 1240;
                currentCampaign.backers = currentBackers + 1;

                localStorage.setItem('impactSeed_campaign', JSON.stringify(currentCampaign));
            }
        } catch (e) { console.error("Error updating campaign progress", e); }

        // Redirect
        window.location.href = 'DonetionSuccesfull.html';
    });
}

// --- GLOBAL AUTH CHECK ---
// --- GLOBAL AUTH CHECK ---
function checkGlobalAuth() {
    const loginBtn = document.getElementById('globalLoginBtn');
    if (!loginBtn) return;

    const session = localStorage.getItem('impactSeed_user');
    let isLoggedIn = false;

    if (session) {
        try {
            const sessionObj = JSON.parse(session);
            if (sessionObj.isLoggedIn) {
                isLoggedIn = true;
            }
        } catch (e) {
            console.error("Invalid session data", e);
            localStorage.removeItem('impactSeed_user');
        }
    }

    if (isLoggedIn) {
        // User is logged in - Show Profile Icon
        loginBtn.innerHTML = '<i class="bi bi-person-circle"></i>';
        loginBtn.href = 'UserProfile.html';
        loginBtn.classList.add('nav-icon-btn'); // Use the new icon class
        loginBtn.classList.remove('login-btn'); // Remove text button style if needed, or keep for shape
        // Actually, let's switch classes completely for better control
        loginBtn.className = 'nav-icon-btn';
        loginBtn.setAttribute('aria-label', 'My Profile');
    } else {
        // Default: Guest - Show Login Text
        loginBtn.textContent = 'Login';
        loginBtn.href = 'login.html';
        loginBtn.className = 'login-btn'; // Revert to pill button
    }
}