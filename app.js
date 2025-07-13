document.addEventListener('DOMContentLoaded', () => {
  /* ---------------- Constants & Data ---------------- */
  const weights = {
    ideation: { none: 0, low: 8, medium: 18, high: 25 },
    research: { none: 0, low: 12, medium: 20, high: 25 },
    textCreation: { none: 0, low: 15, medium: 25, high: 40 },
    visualCreation: { none: 0, low: 15, medium: 20, high: 30 }
  };

  const colorThresholds = [
    { min: 0, max: 20, label: "Minimal AI Usage", color: "#2ecc71", emoji: "🟢" },
    { min: 21, max: 45, label: "Moderate AI Usage", color: "#f1c40f", emoji: "🟡" },
    { min: 46, max: 70, label: "Significant AI Usage", color: "#e67e22", emoji: "🟠" },
    { min: 71, max: 100, label: "High AI Usage", color: "#e74c3c", emoji: "🔴" }
  ];

  const presetExamples = [
    {
      name: "Jane Doe",
      url: "https://blog.example.com/post-123",
      ideation: "low",        // 8
      research: "medium",     // 20
      textCreation: "low",    // 15
      visualCreation: "none", // 0
      expectedScore: 43       // Total: 43% (Moderate AI Usage)
    },
    {
      name: "Alex Smith",
      url: "https://portfolio.test/illustration",
      ideation: "high",       // 25
      research: "low",        // 12
      textCreation: "medium", // 25
      visualCreation: "high", // 30
      expectedScore: 92       // Total: 92% (High AI Usage)
    },
    {
      name: "News Editor",
      url: "https://news.corp/article/ai-future",
      ideation: "medium",     // 18
      research: "high",       // 25
      textCreation: "high",   // 40
      visualCreation: "none", // 0
      expectedScore: 83       // Total: 83% (High AI Usage)
    }
  ];

  /* ---------------- DOM Elements ---------------- */
  const creatorNameInput = document.getElementById('creatorName');
  const contentURLInput = document.getElementById('contentURL');
  const badgePreview = document.getElementById('badgePreview');
  const copyBtn = document.getElementById('copyBtn');
  const jsonBtn = document.getElementById('jsonBtn');
  const pdfBtn = document.getElementById('pdfBtn');

  /* ---------------- Utility Functions ---------------- */
  function getCurrentValues() {
    const creatorName = creatorNameInput.value.trim();
    const contentURL = contentURLInput.value.trim();

    const levels = {
      ideation: getCheckedValue('ideation') || 'none',
      research: getCheckedValue('research') || 'none',
      textCreation: getCheckedValue('textCreation') || 'none',
      visualCreation: getCheckedValue('visualCreation') || 'none'
    };

    return { creatorName, contentURL, levels };
  }

  function getCheckedValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : null;
  }

  function calculateScore(levels) {
    let total = 0;
    total += weights.ideation[levels.ideation] || 0;
    total += weights.research[levels.research] || 0;
    total += weights.textCreation[levels.textCreation] || 0;
    total += weights.visualCreation[levels.visualCreation] || 0;
    return Math.round(total);
  }

  function getColorLabel(score) {
    return colorThresholds.find(threshold => score >= threshold.min && score <= threshold.max) || colorThresholds[0];
  }

  function isValidURL(value) {
    if (!value) return false;
    try {
      new URL(value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ---------------- Badge Update Function ---------------- */
  function updateBadge() {
    const { creatorName, contentURL, levels } = getCurrentValues();
    const score = calculateScore(levels);
    const { label, color, emoji } = getColorLabel(score);

    const safeCreatorName = creatorName ? escapeHtml(creatorName) : '';
    const safeContentURL = contentURL ? escapeHtml(contentURL) : '';

    const badgeHTML = `
      <h4>AI Transparency Disclosure</h4>
      <p><strong>Creator:</strong> ${safeCreatorName || '<em>—</em>'}</p>
      <p><strong>URL:</strong> ${safeContentURL ? `<a href="${contentURL}" target="_blank" rel="noopener noreferrer">${safeContentURL}</a>` : '<em>—</em>'}</p>
      <p class="score">${emoji} ${score}% – ${label}</p>
    `;

    badgePreview.innerHTML = badgeHTML;
    badgePreview.style.borderLeftColor = color;
    badgePreview.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

    // Enable/disable export buttons
    const canExport = creatorName.length > 0 && isValidURL(contentURL);
    copyBtn.disabled = !canExport;
    jsonBtn.disabled = !canExport;
    pdfBtn.disabled = !canExport;

    updateProgress();
  }

  /* ---------------- Tooltip System ---------------- */
  function showTooltip(stage) {
    hideAllTooltips();
    const tooltip = document.getElementById(`tooltip-${stage}`);
    if (tooltip) {
      tooltip.classList.remove('hidden');
      
      // Focus management for accessibility
      const closeButton = tooltip.querySelector('.tooltip-close');
      if (closeButton) {
        setTimeout(() => closeButton.focus(), 100);
      }
    }
  }

  function hideAllTooltips() {
    const tooltips = document.querySelectorAll('.tooltip-content');
    tooltips.forEach(tooltip => tooltip.classList.add('hidden'));
  }

  /* ---------------- Example Loading ---------------- */
  function loadExample(index) {
    const example = presetExamples[index];
    if (!example) return;

    // Update form inputs
    creatorNameInput.value = example.name;
    contentURLInput.value = example.url;

    // Clear all radio buttons first
    const allRadios = document.querySelectorAll('input[type="radio"]');
    allRadios.forEach(radio => radio.checked = false);

    // Set new radio selections
    setRadioValue('ideation', example.ideation);
    setRadioValue('research', example.research);
    setRadioValue('textCreation', example.textCreation);
    setRadioValue('visualCreation', example.visualCreation);

    // Force badge update
    setTimeout(() => {
      updateBadge();
    }, 50);
  }

  function setRadioValue(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
    }
  }

  /* ---------------- Export Functions ---------------- */
  function handleCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const { creatorName, contentURL, levels } = getCurrentValues();
    const score = calculateScore(levels);
    const { label, color, emoji } = getColorLabel(score);
    
    const snippet = `<div class="ai-transparency-badge" style="border-left: 6px solid ${color}; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-family: system-ui, -apple-system, sans-serif; max-width: 400px;" data-score="${score}">
  <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #333;">AI Transparency Disclosure</h3>
  <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;"><strong>Creator:</strong> ${escapeHtml(creatorName)}</p>
  <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;"><strong>URL:</strong> <a href="${contentURL}" target="_blank" rel="noopener noreferrer" style="color: #2180d8; text-decoration: none;">${escapeHtml(contentURL)}</a></p>
  <p style="margin: 0; font-size: 18px; font-weight: 700; color: #333;" class="score">${emoji} ${score}% – ${label}</p>
</div>`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(snippet).then(() => {
        showCopyFeedback();
      }).catch(() => {
        fallbackCopy(snippet);
      });
    } else {
      fallbackCopy(snippet);
    }
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showCopyFeedback();
    } catch (err) {
      console.error('Copy failed:', err);
    } finally {
      document.body.removeChild(textArea);
    }
  }

  function showCopyFeedback() {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.style.background = 'var(--color-success)';
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '';
    }, 2000);
  }

  function handleJsonDownload(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const { creatorName, contentURL, levels } = getCurrentValues();
    const score = calculateScore(levels);
    const { label, color, emoji } = getColorLabel(score);

    const data = {
      creatorName,
      contentURL,
      levels,
      score,
      label,
      color,
      emoji,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-transparency-${Date.now()}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  function handlePdfDownload(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof html2pdf === 'undefined') {
      alert('PDF library not loaded. Please refresh the page and try again.');
      return;
    }
    
    const element = badgePreview.cloneNode(true);
    element.style.cssText = `
      padding: 40px;
      font-family: system-ui, -apple-system, sans-serif;
      background: white;
      border-radius: 12px;
      box-shadow: none;
      border: 2px solid ${badgePreview.style.borderLeftColor};
      max-width: 500px;
      margin: 20px auto;
    `;
    
    const opt = {
      margin: 20,
      filename: `ai-transparency-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(opt).save();
  }

  /* ---------------- Progress Tracking ---------------- */
  function updateProgress() {
    const { creatorName, contentURL, levels } = getCurrentValues();
    const completed = [
      creatorName.length > 0,
      isValidURL(contentURL),
      Object.values(levels).some(level => level !== 'none')
    ].filter(Boolean).length;
    
    const progress = Math.round((completed / 3) * 100);
    
    if (progress === 100) {
      document.title = 'AI Transparency Disclosure Tool - Ready to Export';
    } else {
      document.title = `AI Transparency Disclosure Tool - ${progress}% Complete`;
    }
  }

  /* ---------------- Event Listeners Setup ---------------- */
  function setupEventListeners() {
    // Real-time input listeners
    creatorNameInput.addEventListener('input', updateBadge);
    creatorNameInput.addEventListener('keyup', updateBadge);
    creatorNameInput.addEventListener('paste', () => setTimeout(updateBadge, 10));
    
    contentURLInput.addEventListener('input', updateBadge);
    contentURLInput.addEventListener('keyup', updateBadge);
    contentURLInput.addEventListener('paste', () => setTimeout(updateBadge, 10));
    
    // Radio button listeners
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', updateBadge);
      radio.addEventListener('click', updateBadge);
    });

    // Example buttons - wait for DOM to be ready
    setTimeout(() => {
      const exampleButtons = document.querySelectorAll('[data-example]');
      exampleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const index = parseInt(e.target.dataset.example);
          loadExample(index);
        });
      });
    }, 100);

    // Tooltip system - wait for DOM to be ready
    setTimeout(() => {
      const tooltipTriggers = document.querySelectorAll('.tooltip-trigger');
      tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const stage = trigger.dataset.stage;
          showTooltip(stage);
        });
      });

      const tooltipCloseButtons = document.querySelectorAll('.tooltip-close');
      tooltipCloseButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          hideAllTooltips();
        });
      });
    }, 100);

    // Global tooltip handlers
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.tooltip-content') && !e.target.closest('.tooltip-trigger')) {
        hideAllTooltips();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideAllTooltips();
      }
    });

    // Export buttons
    copyBtn.addEventListener('click', handleCopy);
    jsonBtn.addEventListener('click', handleJsonDownload);
    pdfBtn.addEventListener('click', handlePdfDownload);
  }

  /* ---------------- Initialization ---------------- */
  function initialize() {
    setupEventListeners();
    
    // Load first example
    loadExample(0);
    
    // Initial badge update
    setTimeout(() => {
      updateBadge();
    }, 200);
    
    console.log('AI Transparency Disclosure Tool initialized');
  }

  // Start the application
  initialize();
});