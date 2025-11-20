// PDF Juggler - Tailwind Version
// Team: JholaChhapDevs

const UPDATE_ENDPOINT = 'https://kanha321.github.io/pages/pdf-juggler/update.json';
let releaseMetadata = null;
let releaseMetadataPromise = null;

// Initialize glow effect on all cards
function setGlowPosition(card, event) {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
}

function initializeGlowEffect() {
    const glowCards = document.querySelectorAll('.card-glow');
    glowCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const isHoveringNestedCard = e.target.closest('.card-glow') !== card;
            if (!isHoveringNestedCard) {
                setGlowPosition(card, e);
            }
        });

        card.addEventListener('mouseleave', (e) => {
            setGlowPosition(card, e);
        });
    });
}

// Tab switching
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active', 'bg-gold-600');
            tab.classList.remove('bg-dark-700');
        } else {
            tab.classList.remove('active', 'bg-gold-600');
            tab.classList.add('bg-dark-700');
        }
    });
    
    contents.forEach(content => {
        content.classList.toggle('hidden', content.id !== `${tabName}Tab`);
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
    
    // Re-initialize glow effects after tab switch for dynamically loaded content
    if (window.matchMedia('(pointer: fine)').matches) {
        setTimeout(initializeGlowEffect, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Only enable glow effect for non-touch devices
    if (window.matchMedia('(pointer: fine)').matches) {
        initializeGlowEffect();
    }

    setupChangelogModal();
    initializeDownloads().catch(err => console.error('Download metadata failed:', err));
    // Load changelog
    loadChangelog().catch(err => console.error('Changelog failed:', err));

    console.log('%c PDF Juggler ', 'background: #CC9900; color: #330000; font-size: 20px; font-weight: bold; padding: 10px;');
    console.log('%c JholaChhapDevs - Softablitz 2025 ', 'background: #330000; color: #FFCC99; font-size: 14px; padding: 5px;');
});

// Changelog utilities
function stripJsonComments(text) {
    return text.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
}

function monthNameFromAbbrev(abbrev) {
    const map = {
        Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
        May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
        Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December'
    };
    return map[abbrev] || abbrev;
}

function parseDateLabel(dateStr) {
    const parts = (dateStr || '').split(' ');
    if (parts.length >= 5) {
        const month = monthNameFromAbbrev(parts[1]);
        const day = parts[2];
        const year = parts[4];
        return `${month} ${day}, ${year}`;
    }
    return dateStr;
}

function parseDateForSort(dateStr) {
    const parts = (dateStr || '').split(' ');
    if (parts.length >= 5) {
        const monthAbbrev = parts[1];
        const day = parseInt(parts[2], 10) || 1;
        const year = parseInt(parts[4], 10) || 1970;
        const monthIndex = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(monthAbbrev);
        return new Date(year, Math.max(0, monthIndex), day).getTime();
    }
    return 0;
}

function getBadgeInfo(message) {
    const lower = (message || '').toLowerCase();
    if (lower.startsWith('feat') || lower.startsWith('feature')) return { cls: 'feature', label: 'Feature', color: 'bg-emerald-600', textColor: 'text-emerald-300', borderColor: 'border-emerald-500' };
    if (lower.startsWith('fix')) return { cls: 'fix', label: 'Fix', color: 'bg-orange-600', textColor: 'text-orange-300', borderColor: 'border-orange-500' };
    if (lower.startsWith('enhance') || lower.startsWith('improve') || lower.startsWith('refactor')) return { cls: 'enhance', label: 'Enhance', color: 'bg-blue-600', textColor: 'text-blue-300', borderColor: 'border-blue-500' };
    if (lower.startsWith('merge') || lower.includes('pull request')) return { cls: 'merge', label: 'Merge', color: 'bg-purple-600', textColor: 'text-purple-300', borderColor: 'border-purple-500' };
    if (lower.includes('ai')) return { cls: 'ai', label: 'AI', color: 'bg-pink-600', textColor: 'text-pink-300', borderColor: 'border-pink-500' };
    if (lower.includes('init')) return { cls: 'start', label: 'Init', color: 'bg-red-600', textColor: 'text-red-300', borderColor: 'border-red-500' };
    return { cls: 'core', label: 'Update', color: 'bg-cyan-600', textColor: 'text-cyan-300', borderColor: 'border-cyan-500' };
}

function getMarkerColor(commits) {
    const has = (cls) => commits.some(c => getBadgeInfo(c.message).cls === cls || c.message.toLowerCase().includes(cls));
    if (has('start')) return 'bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_15px_rgba(255,87,34,0.5)]';
    if (has('ai')) return 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-[0_0_15px_rgba(156,39,176,0.5)]';
    if (has('feature')) return 'bg-gradient-to-br from-green-500 to-green-700 shadow-[0_0_15px_rgba(76,175,80,0.5)]';
    return 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_15px_rgba(33,150,243,0.5)]';
}

async function loadChangelog() {
    const timelineEl = document.getElementById('timeline');
    const commitsEl = document.getElementById('commitCount');
    const prsEl = document.getElementById('prCount');
    if (!timelineEl) return;

    timelineEl.innerHTML = '<div class="text-center text-yellow py-8">Loading timeline...</div>';

    const resp = await fetch('assets/logs.json', { cache: 'no-store' });
    const raw = await resp.text();
    const clean = stripJsonComments(raw);
    const logs = JSON.parse(clean);

    const totalCommits = Array.isArray(logs) ? logs.length : 0;
    const prCount = logs.filter(c => (c.message || '').toLowerCase().includes('pull request')).length;

    if (commitsEl) commitsEl.textContent = String(totalCommits);
    if (prsEl) prsEl.textContent = String(prCount);

    // Group by date
    const groups = new Map();
    for (const entry of logs) {
        const label = parseDateLabel(entry.date);
        const sortKey = parseDateForSort(entry.date);
        if (!groups.has(label)) {
            groups.set(label, { sortKey, commits: [] });
        }
        groups.get(label).commits.push(entry);
    }

    const grouped = Array.from(groups.entries())
        .sort((a, b) => b[1].sortKey - a[1].sortKey)
        .map(([label, data]) => {
            data.commits.sort((a, b) => parseDateForSort(a.date) - parseDateForSort(b.date));
            return { label, ...data };
        });

    // Render timeline
    const timelineHTML = grouped.map(({ label, commits }, idx) => {
        const commitItems = commits.map(c => {
            const badge = getBadgeInfo(c.message);
            const author = (c.author || '').trim();
            const hash = (c.hash || '').substring(0, 7);
            const authorDisplay = author && !author.includes(' ') ? author : author || 'Unknown';
            
            return `
                <div class="group bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-maroon-600 rounded-xl p-4 sm:p-5 hover:border-gold-500 hover:shadow-[0_0_20px_rgba(204,153,0,0.3)] transition-[border-color,box-shadow] duration-200 ease-out">
                    <!-- Badge and Message -->
                    <div class="flex flex-col sm:flex-row gap-3 mb-4">
                        <span class="text-[10px] uppercase font-bold px-3 py-1.5 rounded-md ${badge.color}/30 border-2 ${badge.borderColor} ${badge.textColor} whitespace-nowrap self-start">${badge.label}</span>
                        <span class="text-sm sm:text-base text-cream font-medium flex-1">${escapeHtml(c.message)}</span>
                    </div>
                    
                    <!-- Author and Hash -->
                    <div class="flex flex-wrap gap-4 text-xs text-yellow/80">
                        <span class="flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            ${escapeHtml(authorDisplay)}
                        </span>
                        <span class="flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                            ${escapeHtml(hash)}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="mb-8 sm:mb-10">
                <!-- Date Header -->
                <div class="flex items-center gap-4 mb-4 sm:mb-6">
                    <div class="text-lg sm:text-xl font-bold text-gold-500 bg-gradient-to-r from-gold-500/20 to-transparent px-4 py-2 rounded-lg border-l-4 border-gold-500">
                        ${escapeHtml(label)}
                    </div>
                    <div class="flex-1 h-0.5 bg-gradient-to-r from-maroon-600 to-transparent"></div>
                </div>
                
                <!-- Commit Cards -->
                <div class="space-y-3 sm:space-y-4">
                    ${commitItems}
                </div>
            </div>
        `;
    }).join('');

    // Set timeline content
    timelineEl.innerHTML = timelineHTML || '<div class="text-center text-yellow py-8 text-sm sm:text-base">No commits found</div>';
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function initializeDownloads() {
    const versionLabel = document.getElementById('downloadVersionLabel');
    const changelogText = document.getElementById('downloadChangelogText');
    const fallbackMessage = document.getElementById('downloadFallbackMessage');
    const platformButtons = document.querySelectorAll('[data-platform-download]');

    try {
        const releaseInfo = await getReleaseMetadata();

        if (versionLabel && releaseInfo.latestVersionName) {
            versionLabel.textContent = `v${releaseInfo.latestVersionName}`;
            if (releaseInfo.latestVersionCode != null) {
                versionLabel.dataset.versionCode = releaseInfo.latestVersionCode;
            }
        }

        if (changelogText && releaseInfo.changelog) {
            changelogText.textContent = `Changelog: ${releaseInfo.changelog}`;
        }

        if (fallbackMessage) {
            fallbackMessage.textContent = releaseInfo.mandatory ? 'Mandatory update. Please install the latest build below.' : 'Latest builds are ready below.';
        }

        if (releaseInfo.platforms && platformButtons.length) {
            Object.entries(releaseInfo.platforms).forEach(([platform, info]) => {
                const button = document.querySelector(`[data-platform-download="${platform}"]`);
                if (!button) {
                    return;
                }

                if (info.downloadUrl) {
                    button.href = info.downloadUrl;
                }

                const checksumLabel = document.querySelector(`[data-checksum-label="${platform}"]`);
                if (checksumLabel) {
                    const checksumText = info.checksum ? `Checksum: ${info.checksum}` : 'Checksum: pending';
                    checksumLabel.textContent = checksumText;
                    checksumLabel.title = checksumText;
                }
            });
        }
    } catch (error) {
        console.error('Failed to sync download info:', error);
        if (fallbackMessage) {
            fallbackMessage.textContent = 'Unable to reach update server. Using fallback installers.';
        }
    }
}

function markdownToHtml(markdown) {
    if (!markdown) return '';
    if (window.marked && typeof window.marked.parse === 'function') {
        return window.marked.parse(markdown);
    }
    return escapeHtml(markdown)
        .replace(/\n{2,}/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

function setupChangelogModal() {
    const modal = document.getElementById('changelogModal');
    const openBtn = document.getElementById('openChangelogModal');
    const closeBtn = document.getElementById('closeChangelogModal');
    const overlay = modal ? modal.querySelector('[data-modal-dismiss="changelog"]') : null;

    if (!modal || !openBtn) return;

    openBtn.addEventListener('click', openChangelogModal);
    closeBtn?.addEventListener('click', closeChangelogModal);
    overlay?.addEventListener('click', closeChangelogModal);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeChangelogModal();
        }
    });
}

function openChangelogModal() {
    const modal = document.getElementById('changelogModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    populateChangelogModal();
}

function closeChangelogModal() {
    const modal = document.getElementById('changelogModal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

async function populateChangelogModal() {
    const versionLabel = document.getElementById('changelogModalVersion');
    const statusLabel = document.getElementById('changelogModalStatus');
    const body = document.getElementById('changelogModalBody');

    if (body) {
        body.innerHTML = '<p class="text-center text-yellow">Loading changelog…</p>';
    }
    if (statusLabel) {
        statusLabel.textContent = 'Pulling notes from the latest release feed…';
    }

    try {
        const releaseInfo = await getReleaseMetadata();

        if (versionLabel && releaseInfo.latestVersionName) {
            versionLabel.textContent = `v${releaseInfo.latestVersionName}`;
        }

        if (statusLabel) {
            statusLabel.textContent = releaseInfo.mandatory ? 'This update is marked as mandatory.' : 'This update is optional.';
        }

        if (!releaseInfo.changelog) {
            if (body) {
                body.innerHTML = '<p class="text-center text-yellow">No changelog provided for this build.</p>';
            }
            return;
        }

        const rendered = markdownToHtml(releaseInfo.changelog);
        if (body) {
            body.innerHTML = rendered;
        }
    } catch (error) {
        console.error('Unable to load changelog modal:', error);
        if (statusLabel) {
            statusLabel.textContent = 'Failed to reach update service.';
        }
        if (body) {
            body.innerHTML = '<p class="text-center text-red-300">Unable to load changelog right now. Please try again later.</p>';
        }
    }
}

async function getReleaseMetadata(forceRefresh = false) {
    if (releaseMetadata && !forceRefresh) {
        return releaseMetadata;
    }

    if (releaseMetadataPromise && !forceRefresh) {
        return releaseMetadataPromise;
    }

    releaseMetadataPromise = (async () => {
        const response = await fetch(UPDATE_ENDPOINT, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Update endpoint responded with ${response.status}`);
        }
        const data = await response.json();
        releaseMetadata = data;
        return data;
    })();

    try {
        const data = await releaseMetadataPromise;
        releaseMetadataPromise = null;
        return data;
    } catch (error) {
        releaseMetadataPromise = null;
        throw error;
    }
}
