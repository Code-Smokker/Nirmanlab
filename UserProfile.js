
// --- 1. Data Model & Initialization ---
const DefaultUser = {
    fullName: "New User",
    bio: "I am ready to make an impact.",
    location: "Global",
    profileImage: "https://ui-avatars.com/api/?name=New+User&background=0f766e&color=fff",
    totalDonated: 0,
    impactScore: 0,
    campaigns: []
};

// Global User Object
let impactSeedUser = null;

// --- 7. Logout Logic ---
window.logout = function () {
    console.log("Logging out...");
    localStorage.removeItem('impactSeedUser');
    localStorage.removeItem('impactSeed_user');
    localStorage.removeItem('impactSeed_fullProfile');
    window.location.href = 'index.html';
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth (Simple Guard)
    const storedUser = localStorage.getItem('impactSeedUser');
    const authSession = localStorage.getItem('impactSeed_user');

    // Strict Auth: If no session AND no stored profile, redirect.
    if (!authSession && !storedUser) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Load Data
    if (storedUser) {
        impactSeedUser = JSON.parse(storedUser);
    } else {
        // Initialize New User
        impactSeedUser = DefaultUser;
        // If we have a session name, use it
        if (authSession) {
            try {
                const session = JSON.parse(authSession);
                if (session.name) impactSeedUser.fullName = session.name;
            } catch (e) {
                console.error("Error parsing session", e);
            }
        }
        updateProfile(impactSeedUser);
    }

    // 3. Check for New Campaign from 'Start Campaign' Flow
    const tempCampaign = JSON.parse(localStorage.getItem('impactSeed_campaign'));
    if (tempCampaign) {
        const alreadyExists = impactSeedUser.campaigns.some(c => c.title === tempCampaign.title);
        if (!alreadyExists) {
            impactSeedUser.campaigns.unshift({
                title: tempCampaign.title,
                image: tempCampaign.image,
                category: tempCampaign.category,
                goal: parseFloat(tempCampaign.goal),
                raised: 0,
                daysLeft: 30,
                status: "published"
            });
            // Update Stats locally
            impactSeedUser.impactScore += 10;
            updateProfile(impactSeedUser);
        }
        // Optional: Clear after merging
        // localStorage.removeItem('impactSeed_campaign');
    }

    // 4. Render UI
    renderProfile();
    renderCampaigns();
    setupTabs();
});


// --- 2. Dynamic DOM Injection ---
function renderProfile() {
    if (!impactSeedUser) return;

    // Map Fields
    setText('userName', impactSeedUser.fullName);
    setText('userBio', impactSeedUser.bio);
    setText('userLocation', impactSeedUser.location);

    // Map Stats
    setText('statDonated', `$${(impactSeedUser.totalDonated || 0).toLocaleString()}`);
    setText('statImpact', impactSeedUser.impactScore || 0);
    setText('statCount', impactSeedUser.campaigns ? impactSeedUser.campaigns.length : 0);

    // Map Images
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        if (impactSeedUser.profileImage && impactSeedUser.profileImage.length > 5) {
            avatarEl.src = impactSeedUser.profileImage;
        } else {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(impactSeedUser.fullName)}&background=0f766e&color=fff`;
        }
    }

    const navAv = document.getElementById('navAvatar');
    if (navAv && avatarEl) {
        navAv.innerHTML = `<img src="${avatarEl.src}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    }
}

// Helper to safely set text
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}


// --- 3. Campaign Mapping ---
function renderCampaigns() {
    const container = document.getElementById('campaignContainer');
    if (!container) return;

    container.innerHTML = ''; // Clear

    // Empty State
    if (!impactSeedUser.campaigns || impactSeedUser.campaigns.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; border: 2px dashed #cbd5e1; border-radius: 20px; background: #f8fafc;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🌱</div>
                <h3 style="color: var(--text-main); font-weight: 700; margin-bottom: 10px;">Start Your First Campaign</h3>
                <p style="color: var(--text-muted); margin-bottom: 30px; max-width: 400px; margin-left: auto; margin-right: auto;">
                    You haven't launched any projects yet. Turn your ideas into reality today.
                </p>
                <a href="StartCampaign.html" class="edit-btn" style="background: var(--primary); text-decoration: none; display: inline-block;">
                    Launch Project
                </a>
            </div>
        `;
        return;
    }

    // Dynamic Injection Loop
    const campaignHTML = impactSeedUser.campaigns.map(campaign => {
        const percent = campaign.goal > 0 ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : 0;

        return `
            <a href="Campanigdetails.html" class="campaign-card">
                <div class="image-placeholder" style="height: 200px; position: relative;">
                    <img src="${campaign.image}" style="width: 100%; height: 100%; object-fit: cover;" alt="${campaign.title}">
                    <span class="tag" style="position: absolute; top: 1rem; left: 1rem; background: rgba(255,255,255,0.95); padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">
                        ${campaign.category}
                    </span>
                </div>
                <div class="campaign-content" style="padding: 1.5rem;">
                    <h4 style="font-weight: 700; margin-bottom: 0.5rem; color: var(--text-main); font-size: 1.1rem;">${campaign.title}</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
                        Goal: $${campaign.goal.toLocaleString()}
                    </p>
                    
                    <div class="progress" style="height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; margin-bottom: 1rem;">
                        <div class="progress-fill" style="width: ${percent}%; background: var(--primary); height: 100%;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b; font-weight: 600;">
                        <span>${percent}% Funded</span>
                        <span>${campaign.daysLeft} Days Left</span>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    container.innerHTML = campaignHTML;
}


// --- 4. Persistence ---
function updateProfile(newData) {
    // Merge new data into existing user object
    impactSeedUser = { ...impactSeedUser, ...newData };
    localStorage.setItem('impactSeedUser', JSON.stringify(impactSeedUser));
    renderProfile(); // Update UI immediately
}


// --- 5. Edit Modal Logic ---
window.toggleEditModal = function () {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    } else {
        modal.style.display = 'flex';
        // Force reflow
        void modal.offsetWidth;
        modal.classList.add('active');

        // Pre-fill inputs
        if (document.getElementById('editName')) document.getElementById('editName').value = impactSeedUser.fullName || "";
        if (document.getElementById('editBio')) document.getElementById('editBio').value = impactSeedUser.bio || "";
        if (document.getElementById('editLocation')) document.getElementById('editLocation').value = impactSeedUser.location || "";
        // Reset file input is tricky, usually we just leave it empty
    }
}

window.saveProfileChanges = function () {
    const newName = document.getElementById('editName').value;
    const newBio = document.getElementById('editBio').value;
    const newLocation = document.getElementById('editLocation').value;
    const fileInput = document.getElementById('editAvatarFile');

    // Helper to finalize save
    const commitSave = (avatarData) => {
        updateProfile({
            fullName: newName,
            bio: newBio,
            location: newLocation,
            profileImage: avatarData || impactSeedUser.profileImage // Keep existing if null passed
        });
        toggleEditModal();
    };

    // Check if new file selected
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
            // Success - save with new image data
            commitSave(e.target.result);
        };

        reader.onerror = function () {
            alert("Failed to read file");
        };

        reader.readAsDataURL(fileInput.files[0]);
    } else {
        // No new file - save other changes
        commitSave(null);
    }
}


// --- 6. Tab Logic ---
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contentTitle = document.querySelector('#tabContent h2');
    const container = document.getElementById('campaignContainer');

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const type = tab.getAttribute('data-tab');

            if (type === 'campaigns') {
                if (contentTitle) contentTitle.textContent = "Your Active Campaigns";
                if (container) container.style.display = "grid";
                renderCampaigns();
            } else if (type === 'overview') {
                if (contentTitle) contentTitle.textContent = "Overview";
                renderCampaigns();
            } else if (type === 'settings') {
                toggleEditModal();
                setTimeout(() => {
                    const overviewTab = document.querySelector('.tab[data-tab="overview"]');
                    if (overviewTab) overviewTab.click();
                }, 300);
            }
        });
    });
}
