// PDF Juggler Landing Page - Softablitz 2025
// Team: JholaChhapDevs - Shubham Gupta, Pawan Kumar, Sanyam Goel

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabName) {
        tabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        const activeTab = document.querySelector('[data-tab="' + tabName + '"]');
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        const activeContent = document.getElementById(tabName + 'Tab');
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });

    const downloadButtons = document.querySelectorAll('.download-btn');
    
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const platform = btn.classList.contains('windows') ? 'Windows' :
                           btn.classList.contains('macos') ? 'macOS' : 'Linux';
            
            alert('Thank you for your interest in PDF Juggler!\n\nThe ' + platform + ' download will be available soon.\n\nFor now, please check back later or contact the team for early access.');
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .team-card, .download-btn').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add glow effect class and track cursor
    const cards = document.querySelectorAll('.feature-card, .team-card, .download-btn, .tech-item, .feature-item');
    
    cards.forEach(card => {
        card.classList.add('glow-effect');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--y', `${e.clientY - rect.top}px`);
        });
    });

    console.log('%c PDF Juggler ', 'background: #CC9900; color: #330000; font-size: 20px; font-weight: bold; padding: 10px;');
    console.log('%c Created by JholaChhapDevs for Softablitz 2025 ', 'background: #330000; color: #FFCC99; font-size: 14px; padding: 5px;');
    console.log('%c Team: Shubham Gupta (Leader), Pawan Kumar, Sanyam Goel ', 'color: #CC9900; font-size: 12px;');
    console.log('%c MCA 2nd Year ', 'color: #FFCC99; font-size: 12px;');

    // ---- Dynamic Changelog ----
    loadChangelog().catch(err => console.error('Changelog load failed:', err));
});

// Utilities for changelog
function stripJsonComments(text) {
    // Remove lines starting with // (like the filepath line in logs.json)
    return text
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
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
    // Example: "Sat Oct 11 09:54:50 2025 +0530"
    const parts = (dateStr || '').split(' ');
    if (parts.length >= 5) {
        const month = monthNameFromAbbrev(parts[1]);
        const day = parts[2];
        const year = parts[4];
        return `${month} ${day}, ${year}`;
    }
    // Fallback to original
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
    const msg = (message || '').trim();
    const lower = msg.toLowerCase();

    if (lower.startsWith('feat') || lower.startsWith('feature')) return { cls: 'feature', label: 'Feature' };
    if (lower.startsWith('fix')) return { cls: 'fix', label: 'Fix' };
    if (lower.startsWith('enhance') || lower.startsWith('improve') || lower.startsWith('refactor')) return { cls: 'enhance', label: 'Enhance' };
    if (lower.startsWith('merge') || lower.includes('pull request')) return { cls: 'merge', label: 'Merge' };
    if (lower.includes('ai')) return { cls: 'ai', label: 'AI' };
    if (lower.includes('core')) return { cls: 'core', label: 'Core' };
    if (lower.includes('init')) return { cls: 'start', label: 'Init' };
    return { cls: 'core', label: 'Update' };
}

function chooseMarkerType(commits) {
    // Priority-based marker selection for the day
    const has = (cls) => commits.some(c => getBadgeInfo(c.message).cls === cls || c.message.toLowerCase().includes(cls));
    if (has('start')) return 'start';
    if (has('ai')) return 'ai';
    if (has('feature')) return 'feature';
    if (has('fix')) return 'core';
    if (has('merge')) return 'feature';
    if (has('core')) return 'core';
    return 'core';
}

async function loadChangelog() {
    const timelineEl = document.getElementById('timeline');
    const commitsEl = document.getElementById('commitCount');
    const prsEl = document.getElementById('prCount');
    if (!timelineEl) return;

    // Show a lightweight loading state
    timelineEl.innerHTML = '<div class="timeline-item"><div class="timeline-content"><div class="timeline-date">Loading…</div><div class="timeline-commits"><div class="commit-item"><span class="commit-msg">Fetching project history…</span></div></div></div></div>';

    const resp = await fetch('logs.json', { cache: 'no-store' });
    const raw = await resp.text();
    const clean = stripJsonComments(raw);
    const logs = JSON.parse(clean);

    // Stats
    const totalCommits = Array.isArray(logs) ? logs.length : 0;
    const prCount = logs.filter(c => (c.message || '').toLowerCase().includes('pull request')).length;

    if (commitsEl) commitsEl.textContent = String(totalCommits);
    if (prsEl) prsEl.textContent = String(prCount);

    // Group by date label
    const groups = new Map();
    for (const entry of logs) {
        const label = parseDateLabel(entry.date);
        const sortKey = parseDateForSort(entry.date);
        if (!groups.has(label)) {
            groups.set(label, { sortKey, commits: [] });
        }
        groups.get(label).commits.push(entry);
    }

    // Sort groups by date desc, and sort commits within each group by original date desc
    const grouped = Array.from(groups.entries())
        .sort((a, b) => b[1].sortKey - a[1].sortKey)
        .map(([label, data]) => {
            data.commits.sort((a, b) => parseDateForSort(a.date) - parseDateForSort(b.date)); // optional ordering within day
            return { label, ...data };
        });

    // Render timeline
    const parts = [];
    for (let i = 0; i < grouped.length; i++) {
        const { label, commits } = grouped[i];
        const marker = i === grouped.length - 1 ? 'start' : chooseMarkerType(commits);

        const commitItems = commits.map(c => {
            const badge = getBadgeInfo(c.message);
            const author = (c.author || '').trim();
            const authorDisplay = author && !author.includes(' ') ? `@${author}` : author || '';
            return `
                <div class="commit-item">
                    <span class="commit-badge ${badge.cls}">${badge.label}</span>
                    <span class="commit-msg">${escapeHtml(c.message || '')}</span>
                    <span class="commit-author">${escapeHtml(authorDisplay)}</span>
                </div>
            `;
        }).join('');

        parts.push(`
            <div class="timeline-item">
                <div class="timeline-marker ${marker}"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${escapeHtml(label)}</div>
                    <div class="timeline-commits">
                        ${commitItems}
                    </div>
                </div>
            </div>
        `);
    }

    timelineEl.innerHTML = parts.join('') || `
        <div class="timeline-item">
            <div class="timeline-content">
                <div class="timeline-date">No history</div>
                <div class="timeline-commits">
                    <div class="commit-item"><span class="commit-msg">No commits found in logs.json.</span></div>
                </div>
            </div>
        </div>
    `;
}

// Simple HTML escaper to avoid accidental HTML injection from commit messages
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
