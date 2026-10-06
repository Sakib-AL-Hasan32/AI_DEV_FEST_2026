// ==============================================================================
// Tender Document Package Builder - Main Application Logic
// ==============================================================================

// --- Application State ---
let currentLang = 'en'; // Active language: 'en' or 'bn'
let tenderData = null;  // Loaded content of requirements.json
let uploadedFiles = []; // Array of { id, name, file, bytes, hash, pageCount, isDuplicate, sizeFormatted }
let matches = {};       // Maps requirement ID to { fileId: string | null, expiryDate: string | null }

// --- Bilingual Translation Dictionary (Task 4.9) ---
const i18n = {
  en: {
    appTitle: "Tender Document Package Builder",
    appSubtitle: "Prepare, validate, and assemble compliance-ready bid packages",
    loadDemo: "Load Demo Data",
    reset: "Reset",
    
    // Stats
    statTotalReq: "Total Requirements",
    statMandatory: "Mandatory Documents",
    statUploaded: "Uploaded Files",
    statMatched: "Matched Documents",
    
    // Section Headers
    tenderDetails: "1. Tender Details",
    descTenderInfo: "Load requirements.json to define tender parameters and checklist order",
    uploads: "2. Upload Document Files",
    descUploads: "Upload candidate PDF documents. Content duplicates are automatically detected",
    checklist: "3. Document Matching & Checklist",
    descRequirements: "Assign uploaded files 1-to-1 and specify expiry dates where required",
    verification: "4. Validation & Package Generation",
    descVerification: "Review blocking issues and assemble the final numbered PDF package",
    
    // Dropzones
    jsonDropTitle: "Drag & drop requirements.json here, or click to browse",
    jsonDropDesc: "Accepts valid JSON file specifying tender info and requirements",
    pdfDropTitle: "Drag & drop PDF files here, or click to browse",
    pdfDropDesc: "Select multiple PDF files (up to 30 files, 50MB total). Non-PDF files are rejected.",
    
    // Tender Metadata
    lblTenderId: "Tender ID",
    lblTitle: "Tender Title",
    lblProcuringEntity: "Procuring Entity",
    lblBidder: "Bidder",
    lblDeadline: "Submission Deadline",
    
    // Toolbar & Actions
    autoMatch: "Auto-Match Files",
    exportCsv: "Export CSV",
    clearAllFiles: "Clear All Files",
    remove: "Remove",
    generate: "Generate & Download Package",
    generating: "Generating PDF Package...",
    
    // Table Headers
    thOrder: "Order",
    thDocName: "Document Name",
    thType: "Type",
    thAssigned: "Assigned File",
    thExpiry: "Expiry Date",
    thStatus: "Status",
    selectFile: "-- Select File --",
    emptyTableMsg: "Please load a valid requirements.json file to view checklist requirements.",
    
    // Types & Badges
    mandatory: "Mandatory",
    optional: "Optional",
    duplicateBadge: "Duplicate File (Excluded)",
    notApplicable: "N/A",
    
    // Status Badges (Section 5)
    status: {
      "OK": "OK",
      "Missing": "Missing",
      "Expiry date needed": "Expiry date needed",
      "Expired": "Expired",
      "Not provided": "Not provided"
    },
    
    // Alert & Messages
    initialMsg: "Load requirements.json to begin checklist validation.",
    initialHeading: "Initial State:",
    blockingHeading: "Cannot generate package. Resolve the following problems:",
    readyHeading: "Ready for Package Assembly!",
    readyMsg: "All checks passed. Package is ready to generate.",
    
    // Notifications & Toasts
    notPdfError: "Rejected: Only PDF files are accepted.",
    corruptPdfError: "Could not read PDF. File may be corrupted or password-protected.",
    autoMatchSuccess: "Auto-matched documents based on file names.",
    autoMatchNoFiles: "Please upload PDF files first before auto-matching."
  },
  
  bn: {
    appTitle: "টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার",
    appSubtitle: "দরপত্র প্যাকেজ প্রস্তুত, যাচাই ও নিয়মমাফিক একত্রিত করুন",
    loadDemo: "ডেমো ডাটা লোড",
    reset: "রিসেট",
    
    // Stats
    statTotalReq: "মোট প্রয়োজনীয় ডকুমেন্ট",
    statMandatory: "আবশ্যক ডকুমেন্ট",
    statUploaded: "আপলোডকৃত ফাইল",
    statMatched: "মেলানো ডকুমেন্ট",
    
    // Section Headers
    tenderDetails: "১. দরপত্রের বিবরণ",
    descTenderInfo: "দরপত্রের শর্তাবলী ও চেকলিস্টের ক্রম নির্ধারণ করতে requirements.json লোড করুন",
    uploads: "২. ডকুমেন্ট ফাইল আপলোড",
    descUploads: "প্রার্থী পিডিএফ ফাইল আপলোড করুন। ডুপ্লিকেট ফাইল স্বয়ংক্রিয়ভাবে সনাক্ত করা হবে",
    checklist: "৩. ডকুমেন্ট মেলানো ও চেকলিস্ট",
    descRequirements: "আপলোড করা ফাইলগুলো ১-অন-১ মিলিয়ে নিন এবং প্রয়োজন অনুসারে মেয়াদের তারিখ দিন",
    verification: "৪. যাচাই ও প্যাকেজ তৈরি",
    descVerification: "সমস্যাগুলো সমাধান করে চূড়ান্ত নম্বরযুক্ত পিডিএফ প্যাকেজ তৈরি করুন",
    
    // Dropzones
    jsonDropTitle: "এখানে requirements.json ফাইলটি টেনে আনুন অথবা ক্লিক করে নির্বাচন করুন",
    jsonDropDesc: "দরপত্রের তথ্য ও চেকলিস্ট সমৃদ্ধ বৈধ JSON ফাইল গ্রহণ করা হয়",
    pdfDropTitle: "এখানে পিডিএফ ফাইলগুলো টেনে আনুন অথবা ক্লিক করে নির্বাচন করুন",
    pdfDropDesc: "একাধিক পিডিএফ ফাইল নির্বাচন করুন (সর্বোচ্চ ৩০টি, ৫০ মেগাবাইট)। পিডিএফ ব্যতীত অন্য ফাইল বাতিল হবে।",
    
    // Tender Metadata
    lblTenderId: "দরপত্র আইডি",
    lblTitle: "দরপত্রের শিরোনাম",
    lblProcuringEntity: "ক্রয়কারী সংস্থা",
    lblBidder: "দরদাতা প্রতিষ্ঠান",
    lblDeadline: "জমার শেষ তারিখ",
    
    // Toolbar & Actions
    autoMatch: "স্বয়ংক্রিয় মেলানো",
    exportCsv: "সিএসভি এক্সপোর্ট",
    clearAllFiles: "সব ফাইল মুছুন",
    remove: "মুছুন",
    generate: "প্যাকেজ তৈরি ও ডাউনলোড করুন",
    generating: "পিডিএফ প্যাকেজ তৈরি হচ্ছে...",
    
    // Table Headers
    thOrder: "ক্রম",
    thDocName: "ডকুমেন্টের নাম",
    thType: "ধরণ",
    thAssigned: "নির্ধারিত ফাইল",
    thExpiry: "মেয়াদের তারিখ",
    thStatus: "অবস্থা",
    selectFile: "-- ফাইল নির্বাচন করুন --",
    emptyTableMsg: "চেকলিস্ট দেখতে অনুগ্রহ করে একটি বৈধ requirements.json ফাইল লোড করুন।",
    
    // Types & Badges
    mandatory: "আবশ্যক",
    optional: "ঐচ্ছিক",
    duplicateBadge: "ডুপ্লিকেট ফাইল (বাতিল)",
    notApplicable: "প্রযোজ্য নয়",
    
    // Status Badges (Section 5)
    status: {
      "OK": "সঠিক",
      "Missing": "অনুপস্থিত",
      "Expiry date needed": "মেয়াদের তারিখ প্রয়োজন",
      "Expired": "মেয়াদোত্তীর্ণ",
      "Not provided": "দেওয়া হয়নি"
    },
    
    // Alert & Messages
    initialMsg: "চেকলিস্ট যাচাই শুরু করতে requirements.json আপলোড করুন।",
    initialHeading: "প্রাথমিক অবস্থা:",
    blockingHeading: "প্যাকেজ তৈরি করা সম্ভব নয়। নিম্নলিখিত সমস্যাগুলি সমাধান করুন:",
    readyHeading: "প্যাকেজ তৈরির জন্য প্রস্তুত!",
    readyMsg: "সব শর্ত সফলভাবে পূরণ হয়েছে। প্যাকেজ প্রস্তুত করা যাবে।",
    
    // Notifications & Toasts
    notPdfError: "বাতিল: শুধুমাত্র পিডিএফ ফাইল গ্রহণ করা হয়।",
    corruptPdfError: "পিডিএফ ফাইলটি পড়া যায়নি। ফাইলটি ক্ষতিগ্রস্ত অথবা পাসওয়ার্ড সংরক্ষিত হতে পারে।",
    autoMatchSuccess: "ফাইলের নামের ভিত্তিতে ডকুমেন্টগুলো স্বয়ংক্রিয়ভাবে মেলানো হয়েছে।",
    autoMatchNoFiles: "স্বয়ংক্রিয় মেলানোর আগে অনুগ্রহ করে পিডিএফ ফাইল আপলোড করুন।"
  }
};

// --- Toast Notification Helper ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg style="width:18px;height:18px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Format File Size Utility ---
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(2) + ' MB';
}

// --- Update Stats KPI Counters ---
function updateStats() {
  const totalReq = tenderData ? tenderData.requirements.length : 0;
  const mandatoryCount = tenderData ? tenderData.requirements.filter(r => r.mandatory).length : 0;
  const uploadedCount = uploadedFiles.length;
  
  const matchedCount = tenderData 
    ? tenderData.requirements.filter(r => matches[r.id] && matches[r.id].fileId).length 
    : 0;

  document.getElementById('statTotalReq').textContent = totalReq;
  document.getElementById('statMandatory').textContent = mandatoryCount;
  document.getElementById('statUploaded').textContent = uploadedCount;
  document.getElementById('statMatched').textContent = `${matchedCount} / ${totalReq}`;
}

// ==============================================================================
// Task 4.1: Load requirements.json
// ==============================================================================
const jsonInput = document.getElementById('jsonInput');
const jsonDropzone = document.getElementById('jsonDropzone');

jsonInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) handleJsonFile(file);
});

// Drag & Drop for JSON
setupDragAndDrop(jsonDropzone, (files) => {
  if (files.length > 0) handleJsonFile(files[0]);
});

async function handleJsonFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.tender || !Array.isArray(data.requirements)) {
      throw new Error("Invalid format: 'tender' or 'requirements' missing.");
    }

    // Sort requirements strictly ascending by order (Task 4.1)
    data.requirements.sort((a, b) => a.order - b.order);
    tenderData = data;

    // Reset matching state
    matches = {};
    tenderData.requirements.forEach(req => {
      matches[req.id] = { fileId: null, expiryDate: '' };
    });

    renderTenderMeta();
    renderChecklist();
    evaluateStatus();
    updateStats();
    showToast(`Loaded ${tenderData.requirements.length} requirements successfully!`, 'success');
  } catch (err) {
    alert("Invalid JSON format! Please check the requirements.json file: " + err.message);
  }
}

function renderTenderMeta() {
  const metaBox = document.getElementById('tenderMeta');
  if (!tenderData) {
    metaBox.classList.add('hidden');
    return;
  }

  metaBox.classList.remove('hidden');
  const t = tenderData.tender;
  const cur = i18n[currentLang];

  metaBox.innerHTML = `
    <div class="meta-item">
      <span class="meta-label">${cur.lblTenderId}</span>
      <span class="meta-val">${escapeHtml(t.tender_id)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">${cur.lblTitle}</span>
      <span class="meta-val">${escapeHtml(t.title)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">${cur.lblProcuringEntity}</span>
      <span class="meta-val">${escapeHtml(t.procuring_entity)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">${cur.lblBidder}</span>
      <span class="meta-val">${escapeHtml(t.bidder)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">${cur.lblDeadline}</span>
      <span class="meta-val meta-deadline">${escapeHtml(t.submission_deadline)}</span>
    </div>
  `;
}

// ==============================================================================
// Task 4.2 & 4.6: Upload PDFs, Count Pages & Detect Duplicates
// ==============================================================================
const pdfInput = document.getElementById('pdfInput');
const pdfDropzone = document.getElementById('pdfDropzone');

pdfInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  await handlePdfUploads(files);
  e.target.value = '';
});

// Drag & Drop for PDFs
setupDragAndDrop(pdfDropzone, async (files) => {
  await handlePdfUploads(files);
});

async function handlePdfUploads(files) {
  let accepted = 0;
  let rejected = 0;

  for (const file of files) {
    // Reject non-PDF files with clear message (Task 4.2)
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      rejected++;
      const msg = `Rejected: "${file.name}" is not a PDF.`;
      showToast(msg, 'error');
      alert(msg);
      continue;
    }

    try {
      const buffer = await file.arrayBuffer();

      // 1. Calculate SHA-256 hash for exact content duplicate detection (Task 4.6)
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 2. Count pages safely with pdf-lib (Task 4.2 & Bonus: safe handling)
      let pageCount = 0;
      try {
        const pdfDoc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        pageCount = pdfDoc.getPageCount();
      } catch (err) {
        showToast(`Could not parse "${file.name}": Corrupted or encrypted PDF.`, 'error');
        alert(`Could not parse "${file.name}". File might be corrupted or password-protected.`);
        continue;
      }

      uploadedFiles.push({
        id: 'file_' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        file: file,
        bytes: buffer,
        hash: hashHex,
        pageCount: pageCount,
        isDuplicate: false,
        sizeFormatted: formatFileSize(file.size)
      });
      accepted++;
    } catch (err) {
      showToast(`Error processing "${file.name}": ${err.message}`, 'error');
    }
  }

  if (accepted > 0) {
    recalculateDuplicates();
    renderFileList();
    renderChecklist();
    evaluateStatus();
    updateStats();
  }
}

// Re-evaluate duplicates whenever files are added or removed (Task 4.6)
function recalculateDuplicates() {
  const hashCounts = {};
  uploadedFiles.forEach(f => {
    hashCounts[f.hash] = (hashCounts[f.hash] || 0) + 1;
  });

  uploadedFiles.forEach(f => {
    const wasDuplicate = f.isDuplicate;
    f.isDuplicate = hashCounts[f.hash] > 1;

    // Rule 4.6: If a file is marked duplicate, do NOT allow matching to any document.
    // If it was previously matched, unbind it immediately.
    if (f.isDuplicate) {
      Object.keys(matches).forEach(reqId => {
        if (matches[reqId].fileId === f.id) {
          matches[reqId].fileId = null;
        }
      });
    }
  });
}

function removeFile(fileId) {
  uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);

  // Clear matches using this file
  Object.keys(matches).forEach(reqId => {
    if (matches[reqId].fileId === fileId) {
      matches[reqId].fileId = null;
    }
  });

  recalculateDuplicates();
  renderFileList();
  renderChecklist();
  evaluateStatus();
  updateStats();
}

function clearAllFiles() {
  if (uploadedFiles.length === 0) return;
  if (!confirm("Remove all uploaded files?")) return;
  uploadedFiles = [];
  Object.keys(matches).forEach(reqId => {
    matches[reqId].fileId = null;
  });
  renderFileList();
  renderChecklist();
  evaluateStatus();
  updateStats();
}

document.getElementById('btnClearAllFiles')?.addEventListener('click', clearAllFiles);

function renderFileList() {
  const container = document.getElementById('fileUploadList');
  const summaryBar = document.getElementById('filesSummaryBar');
  const countLabel = document.getElementById('txtFilesCount');

  if (uploadedFiles.length === 0) {
    container.innerHTML = '';
    summaryBar.classList.add('hidden');
    return;
  }

  summaryBar.classList.remove('hidden');
  const totalPages = uploadedFiles.reduce((sum, f) => sum + f.pageCount, 0);
  countLabel.textContent = currentLang === 'bn' 
    ? `আপলোডকৃত: ${uploadedFiles.length}টি ফাইল (মোট ${totalPages} পৃষ্ঠা)`
    : `Uploaded: ${uploadedFiles.length} files (total ${totalPages} pages)`;

  container.innerHTML = uploadedFiles.map(f => `
    <div class="file-card ${f.isDuplicate ? 'duplicate' : ''}">
      <div class="file-main">
        <div class="file-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="file-details">
          <div class="file-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
          <div class="file-meta">
            <span>📄 ${f.pageCount} ${currentLang === 'bn' ? 'পৃষ্ঠা' : 'pgs'}</span>
            <span>•</span>
            <span>${f.sizeFormatted}</span>
            ${f.isDuplicate ? `<span class="file-badge-duplicate">${i18n[currentLang].duplicateBadge}</span>` : ''}
          </div>
        </div>
      </div>
      <button class="btn-remove" onclick="removeFile('${f.id}')">
        <svg style="width:13px;height:13px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>${i18n[currentLang].remove}</span>
      </button>
    </div>
  `).join('');
}

// ==============================================================================
// Tasks 4.3, 4.4, 4.5: Checklist Table & 1-to-1 File Matching
// ==============================================================================
function renderChecklist() {
  const tbody = document.getElementById('checklistBody');
  if (!tbody) return;

  if (!tenderData || !tenderData.requirements.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 32px; color: var(--text-muted);">
          ${i18n[currentLang].emptyTableMsg}
        </td>
      </tr>
    `;
    return;
  }

  // Collect all assigned file IDs to enforce 1-to-1 matching constraint (Task 4.3)
  const assignedFileIds = new Set(
    Object.values(matches).map(m => m.fileId).filter(Boolean)
  );

  tbody.innerHTML = tenderData.requirements.map(req => {
    // Show title according to active language (Task 4.9)
    const title = currentLang === 'bn' ? (req.title_bn || req.title_en) : req.title_en;
    const subtitle = currentLang === 'bn' && req.title_bn ? req.title_en : '';
    const match = matches[req.id] || { fileId: null, expiryDate: '' };

    // Filter available files: must NOT be duplicates, and either unassigned OR assigned to this doc
    const availableFiles = uploadedFiles.filter(f =>
      !f.isDuplicate && (!assignedFileIds.has(f.id) || match.fileId === f.id)
    );

    const fileOptions = availableFiles.map(f => `
      <option value="${f.id}" ${match.fileId === f.id ? 'selected' : ''}>
        ${escapeHtml(f.name)} (${f.pageCount} ${currentLang === 'bn' ? 'পৃষ্ঠা' : 'pgs'})
      </option>
    `).join('');

    return `
      <tr data-req-id="${req.id}">
        <td>
          <span class="order-pill">${req.order}</span>
        </td>
        <td>
          <div class="doc-title-cell">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="doc-subtitle-en">${escapeHtml(subtitle)}</div>` : ''}
        </td>
        <td>
          <span class="badge-type ${req.mandatory ? 'badge-mandatory' : 'badge-optional'}">
            ${req.mandatory ? i18n[currentLang].mandatory : i18n[currentLang].optional}
          </span>
        </td>
        <td>
          <select class="table-select" onchange="updateMatch('${req.id}', this.value)">
            <option value="">${i18n[currentLang].selectFile}</option>
            ${fileOptions}
          </select>
        </td>
        <td>
          ${req.has_expiry ? `
            <input 
              type="date" 
              class="table-date"
              value="${match.expiryDate || ''}" 
              ${!match.fileId ? 'disabled' : ''} 
              onchange="updateExpiry('${req.id}', this.value)"
              oninput="updateExpiry('${req.id}', this.value)"
            />
          ` : `<span style="color:var(--text-light); font-size:12px;">${i18n[currentLang].notApplicable}</span>`}
        </td>
        <td id="status_${req.id}">-</td>
      </tr>
    `;
  }).join('');
}

// Global match update handler (Task 4.3)
window.updateMatch = function (reqId, fileId) {
  matches[reqId].fileId = fileId || null;
  if (!fileId) {
    matches[reqId].expiryDate = '';
  }
  renderChecklist();
  evaluateStatus();
  updateStats();
};

// Global expiry date handler (Task 4.4)
window.updateExpiry = function (reqId, dateValue) {
  matches[reqId].expiryDate = dateValue;
  evaluateStatus();
  updateStats();
};

// ==============================================================================
// Section 5: Status Calculation Rules
// ==============================================================================
function getDocStatus(req, match, deadline) {
  // Rule 1: No file attached
  if (!match || !match.fileId) {
    return req.mandatory
      ? { text: "Missing", blocking: true, class: "status-missing" }
      : { text: "Not provided", blocking: false, class: "status-not_provided" };
  }

  // Rule 2: Expiry date evaluation
  if (req.has_expiry) {
    if (!match.expiryDate) {
      return { text: "Expiry date needed", blocking: true, class: "status-needed" };
    }
    // "YYYY-MM-DD" string comparison: strictly before deadline means expired
    // If expiryDate is equal to deadline, it is NOT expired (OK)
    if (match.expiryDate < deadline) {
      return { text: "Expired", blocking: true, class: "status-expired" };
    }
  }

  // Rule 3: Valid document
  return { text: "OK", blocking: false, class: "status-ok" };
}

function evaluateStatus() {
  if (!tenderData) {
    const alertBox = document.getElementById('blockingAlert');
    alertBox.className = 'alert-box';
    alertBox.innerHTML = `
      <strong>${i18n[currentLang].initialHeading}</strong>
      <span>${i18n[currentLang].initialMsg}</span>
    `;
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.disabled = true;
    return;
  }

  const deadline = tenderData.tender.submission_deadline;
  let hasBlockingIssues = false;
  const blockingReasons = [];

  tenderData.requirements.forEach(req => {
    const match = matches[req.id];
    const statusResult = getDocStatus(req, match, deadline);

    // Update status badge cell in the table
    const statusCell = document.getElementById(`status_${req.id}`);
    if (statusCell) {
      statusCell.innerHTML = `
        <span class="status-pill ${statusResult.class}">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
          ${i18n[currentLang].status[statusResult.text]}
        </span>
      `;
    }

    if (statusResult.blocking) {
      hasBlockingIssues = true;
      const title = currentLang === 'bn' ? (req.title_bn || req.title_en) : req.title_en;
      blockingReasons.push({
        title,
        statusText: i18n[currentLang].status[statusResult.text]
      });
    }
  });

  const generateBtn = document.getElementById('generateBtn');
  const alertBox = document.getElementById('blockingAlert');
  const pkgSummary = document.getElementById('pkgSummary');

  if (hasBlockingIssues) {
    generateBtn.disabled = true;
    alertBox.className = 'alert-box blocking';
    alertBox.innerHTML = `
      <strong>
        <svg style="width:18px;height:18px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        ${i18n[currentLang].blockingHeading}
      </strong>
      <ul>
        ${blockingReasons.map(r => `<li><strong>${escapeHtml(r.title)}:</strong> ${escapeHtml(r.statusText)}</li>`).join('')}
      </ul>
    `;
    if (pkgSummary) pkgSummary.textContent = '';
  } else {
    generateBtn.disabled = false;
    alertBox.className = 'alert-box ready';
    alertBox.innerHTML = `
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <strong style="display:block;">${i18n[currentLang].readyHeading}</strong>
        <span>${i18n[currentLang].readyMsg}</span>
      </div>
    `;

    // Calculate total pages for preview
    const included = tenderData.requirements
      .map(r => matches[r.id]?.fileId ? uploadedFiles.find(f => f.id === matches[r.id].fileId) : null)
      .filter(Boolean);
    const docPages = included.reduce((sum, f) => sum + f.pageCount, 0);
    const totalPages = 1 + docPages; // 1 cover page + document pages

    if (pkgSummary) {
      pkgSummary.textContent = currentLang === 'bn'
        ? `অন্তর্ভুক্ত ডকুমেন্ট: ${included.length}টি | চূড়ান্ত প্যাকেজের পৃষ্ঠা: ${totalPages}টি (কভার সহ)`
        : `Included Documents: ${included.length} | Package Total: ${totalPages} pages (incl. Cover)`;
    }
  }
}

// ==============================================================================
// Task 4.9: Language Toggle (English / Bangla)
// ==============================================================================
document.getElementById('btnEn').addEventListener('click', () => switchLanguage('en'));
document.getElementById('btnBn').addEventListener('click', () => switchLanguage('bn'));

function switchLanguage(lang) {
  currentLang = lang;
  const dict = i18n[lang];

  // Button active state
  document.getElementById('btnEn').classList.toggle('active', lang === 'en');
  document.getElementById('btnBn').classList.toggle('active', lang === 'bn');

  // Text updates
  document.getElementById('appTitle').textContent = dict.appTitle;
  document.getElementById('appSubtitle').textContent = dict.appSubtitle;
  document.getElementById('txtLoadDemo').textContent = dict.loadDemo;
  document.getElementById('txtReset').textContent = dict.reset;

  // Stats
  document.getElementById('lblStatTotalReq').textContent = dict.statTotalReq;
  document.getElementById('lblStatMandatory').textContent = dict.statMandatory;
  document.getElementById('lblStatUploaded').textContent = dict.statUploaded;
  document.getElementById('lblStatMatched').textContent = dict.statMatched;

  // Section titles
  document.getElementById('headingTenderInfo').textContent = dict.tenderDetails;
  document.getElementById('descTenderInfo').textContent = dict.descTenderInfo;
  document.getElementById('headingUploads').textContent = dict.uploads;
  document.getElementById('descUploads').textContent = dict.descUploads;
  document.getElementById('headingRequirements').textContent = dict.checklist;
  document.getElementById('descRequirements').textContent = dict.descRequirements;
  document.getElementById('headingVerification').textContent = dict.verification;
  document.getElementById('descVerification').textContent = dict.descVerification;

  // Dropzones
  document.getElementById('txtJsonDropTitle').textContent = dict.jsonDropTitle;
  document.getElementById('txtJsonDropDesc').textContent = dict.jsonDropDesc;
  document.getElementById('txtPdfDropTitle').textContent = dict.pdfDropTitle;
  document.getElementById('txtPdfDropDesc').textContent = dict.pdfDropDesc;

  // Toolbar
  document.getElementById('txtAutoMatch').textContent = dict.autoMatch;
  document.getElementById('txtExportCsv').textContent = dict.exportCsv;
  document.getElementById('txtClearAllFiles').textContent = dict.clearAllFiles;
  document.getElementById('txtGenerateBtn').textContent = dict.generate;

  // Table headers
  document.getElementById('thOrder').textContent = dict.thOrder;
  document.getElementById('thDocName').textContent = dict.thDocName;
  document.getElementById('thType').textContent = dict.thType;
  document.getElementById('thAssigned').textContent = dict.thAssigned;
  document.getElementById('thExpiry').textContent = dict.thExpiry;
  document.getElementById('thStatus').textContent = dict.thStatus;

  // Re-render UI components
  renderTenderMeta();
  renderFileList();
  renderChecklist();
  evaluateStatus();
  updateStats();
}

// ==============================================================================
// Bonus Task 7: Auto-Match Files by Name
// ==============================================================================
document.getElementById('btnAutoMatch')?.addEventListener('click', () => {
  if (!tenderData || !tenderData.requirements.length) {
    showToast("Load requirements.json first.", "error");
    return;
  }
  if (!uploadedFiles.length) {
    showToast(i18n[currentLang].autoMatchNoFiles, "error");
    return;
  }

  // Exclude duplicate files
  const validFiles = uploadedFiles.filter(f => !f.isDuplicate);
  const assigned = new Set();
  let matchedCount = 0;

  // Helper to normalize strings for comparison
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  // Try matching each requirement in order
  tenderData.requirements.forEach(req => {
    // Skip if already has valid assigned file
    if (matches[req.id]?.fileId) {
      assigned.add(matches[req.id].fileId);
      return;
    }

    const titleEn = normalize(req.title_en);
    const keywords = titleEn.split(' ').filter(w => w.length > 2);

    // Find best match among unassigned valid files
    for (const f of validFiles) {
      if (assigned.has(f.id)) continue;

      const fileName = normalize(f.name.replace(/\.pdf$/i, ''));
      
      // Direct substring match or keyword intersection
      const isMatch = fileName.includes(titleEn) || 
                      titleEn.includes(fileName) ||
                      keywords.every(kw => fileName.includes(kw));

      if (isMatch) {
        matches[req.id].fileId = f.id;
        assigned.add(f.id);
        matchedCount++;
        break;
      }
    }
  });

  renderChecklist();
  evaluateStatus();
  updateStats();
  showToast(currentLang === 'bn' 
    ? `${matchedCount}টি ডকুমেন্ট স্বয়ংক্রিয়ভাবে মেলানো হয়েছে!` 
    : `Auto-matched ${matchedCount} documents!`, "success");
});

// ==============================================================================
// Bonus Task 7: Export Checklist as CSV
// ==============================================================================
document.getElementById('btnExportCsv')?.addEventListener('click', () => {
  if (!tenderData) {
    showToast("Load requirements.json first.", "error");
    return;
  }

  const rows = [
    ["Order", "Document Name", "Mandatory", "Assigned File", "Pages", "Expiry Date", "Status"]
  ];

  tenderData.requirements.forEach(req => {
    const match = matches[req.id];
    const fileObj = match?.fileId ? uploadedFiles.find(f => f.id === match.fileId) : null;
    const statusResult = getDocStatus(req, match, tenderData.tender.submission_deadline);

    rows.push([
      req.order,
      `"${(req.title_en || '').replace(/"/g, '""')}"`,
      req.mandatory ? "Yes" : "No",
      fileObj ? `"${fileObj.name.replace(/"/g, '""')}"` : "None",
      fileObj ? fileObj.pageCount : 0,
      match?.expiryDate || "N/A",
      statusResult.text
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Checklist_${tenderData.tender.tender_id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Checklist CSV exported!", "success");
});

// ==============================================================================
// Quick Demo Pack Loader
// ==============================================================================
document.getElementById('btnLoadDemo')?.addEventListener('click', async () => {
  const demoRequirements = {
    "tender": {
      "tender_id": "T-2026-0417",
      "title": "Supply of IT Equipment",
      "procuring_entity": "Example Directorate",
      "bidder": "Example Company Ltd.",
      "submission_deadline": "2026-10-20"
    },
    "requirements": [
      { "id": "R01", "order": 1, "title_en": "Trade License", "title_bn": "ট্রেড লাইসেন্স", "mandatory": true, "has_expiry": true },
      { "id": "R02", "order": 2, "title_en": "TIN Certificate", "title_bn": "টিআইএন সার্টিফিকেট", "mandatory": true, "has_expiry": false },
      { "id": "R03", "order": 3, "title_en": "VAT Registration Certificate", "title_bn": "ভ্যাট নিবন্ধন সনদ", "mandatory": true, "has_expiry": false },
      { "id": "R04", "order": 4, "title_en": "Bank Solvency Certificate", "title_bn": "ব্যাংক স্বচ্ছলতা সনদ", "mandatory": true, "has_expiry": true },
      { "id": "R05", "order": 5, "title_en": "Past Experience Certificate", "title_bn": "পূর্ববর্তী অভিজ্ঞতার সনদ", "mandatory": false, "has_expiry": false },
      { "id": "R06", "order": 6, "title_en": "Technical Proposal", "title_bn": "কারিগরি প্রস্তাবনা", "mandatory": true, "has_expiry": false },
      { "id": "R07", "order": 7, "title_en": "Financial Proposal", "title_bn": "আর্থিক প্রস্তাবনা", "mandatory": true, "has_expiry": false }
    ]
  };

  // 1. Load Tender Requirements
  demoRequirements.requirements.sort((a, b) => a.order - b.order);
  tenderData = demoRequirements;
  matches = {};
  tenderData.requirements.forEach(req => {
    matches[req.id] = { fileId: null, expiryDate: '' };
  });

  // 2. Generate Demo PDFs in-memory using pdf-lib
  uploadedFiles = [];
  try {
    const { PDFDocument } = PDFLib;

    const demoDocSpecs = [
      { name: "trade_license.pdf", pages: 1, title: "Trade License" },
      { name: "tin_certificate.pdf", pages: 1, title: "TIN Certificate" },
      { name: "vat_certificate.pdf", pages: 1, title: "VAT Registration Certificate" },
      { name: "bank_solvency.pdf", pages: 2, title: "Bank Solvency Certificate" },
      { name: "experience_cert.pdf", pages: 1, title: "Past Experience Certificate" },
      { name: "technical_proposal.pdf", pages: 3, title: "Technical Proposal" },
      { name: "financial_proposal.pdf", pages: 2, title: "Financial Proposal" },
      { name: "duplicate_trade_license.pdf", pages: 1, title: "Trade License Copy", duplicateOf: 0 }
    ];

    const generatedBuffers = [];

    for (let i = 0; i < demoDocSpecs.length; i++) {
      const spec = demoDocSpecs[i];
      let buffer;

      if (spec.duplicateOf !== undefined) {
        // Exact duplicate bytes to demonstrate Task 4.6
        buffer = generatedBuffers[spec.duplicateOf];
      } else {
        const doc = await PDFDocument.create();
        for (let p = 0; p < spec.pages; p++) {
          const page = doc.addPage([595.28, 841.89]);
          page.drawText(`${spec.title} - Page ${p + 1}`, { x: 50, y: 750, size: 16 });
        }
        const bytes = await doc.save();
        buffer = bytes.buffer;
        generatedBuffers.push(buffer);
      }

      // Compute hash
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      uploadedFiles.push({
        id: 'file_demo_' + i,
        name: spec.name,
        file: new File([buffer], spec.name, { type: "application/pdf" }),
        bytes: buffer,
        hash: hashHex,
        pageCount: spec.pages,
        isDuplicate: false,
        sizeFormatted: formatFileSize(buffer.byteLength)
      });
    }

    recalculateDuplicates();
    renderTenderMeta();
    renderFileList();
    renderChecklist();

    // Auto match non-duplicate files
    document.getElementById('btnAutoMatch')?.click();

    // Set demo valid expiry dates for demonstration (>= 2026-10-20)
    if (matches['R01']) matches['R01'].expiryDate = '2026-12-31';
    if (matches['R04']) matches['R04'].expiryDate = '2026-11-15';

    renderChecklist();
    evaluateStatus();
    updateStats();
    showToast("Demo pack loaded with test PDFs and duplicate detection!", "success");
  } catch (err) {
    showToast("Error loading demo: " + err.message, "error");
  }
});

// Reset Button
document.getElementById('btnReset')?.addEventListener('click', () => {
  if (!confirm("Reset all data and start over?")) return;
  tenderData = null;
  uploadedFiles = [];
  matches = {};
  renderTenderMeta();
  renderFileList();
  renderChecklist();
  evaluateStatus();
  updateStats();
  showToast("Application reset.", "info");
});

// ==============================================================================
// Tasks 4.7, 4.8 & Section 6: Package Assembly & Download
// ==============================================================================
document.getElementById('generateBtn').addEventListener('click', async () => {
  const generateBtn = document.getElementById('generateBtn');
  generateBtn.disabled = true;
  generateBtn.innerHTML = `
    <svg style="animation:spin 1s linear infinite;width:20px;height:20px;" fill="none" viewBox="0 0 24 24">
      <circle style="opacity:0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path style="opacity:0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>${i18n[currentLang].generating}</span>
  `;

  try {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

    const tender = tenderData.tender;

    // Collect included documents in sorted order, skipping unprovided optional docs (Rule 6.2)
    const includedDocs = [];
    for (const req of tenderData.requirements) {
      const match = matches[req.id];
      if (match && match.fileId) {
        const fileObj = uploadedFiles.find(f => f.id === match.fileId);
        if (fileObj) {
          includedDocs.push({ req, fileObj });
        }
      }
    }

    // --- RULE 6.1: Page 1 Cover Page (in English) ---
    const coverPage = mergedPdf.addPage([595.28, 841.89]); // Standard A4 portrait
    let yPos = 780;

    coverPage.drawText("TENDER SUBMISSION PACKAGE", {
      x: 50,
      y: yPos,
      size: 20,
      font: boldFont,
      color: rgb(0.08, 0.15, 0.3)
    });
    yPos -= 36;

    // Header divider line
    coverPage.drawLine({
      start: { x: 50, y: yPos + 10 },
      end: { x: 545, y: yPos + 10 },
      thickness: 1.5,
      color: rgb(0.2, 0.4, 0.8)
    });

    const metadata = [
      ["Tender ID:", tender.tender_id],
      ["Tender Title:", tender.title],
      ["Procuring Entity:", tender.procuring_entity],
      ["Bidder:", tender.bidder],
      ["Submission Deadline:", tender.submission_deadline],
      ["Date Generated:", new Date().toISOString().split('T')[0]]
    ];

    metadata.forEach(([label, value]) => {
      coverPage.drawText(label, { x: 50, y: yPos, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
      coverPage.drawText(String(value), { x: 190, y: yPos, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
      yPos -= 20;
    });

    yPos -= 16;
    coverPage.drawText("List of Included Documents:", {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1)
    });
    yPos -= 22;

    includedDocs.forEach((item, index) => {
      const lineText = `${index + 1}. [Order ${item.req.order}] ${item.req.title_en} (${item.fileObj.name} - ${item.fileObj.pageCount} pgs)`;
      coverPage.drawText(lineText, {
        x: 60,
        y: yPos,
        size: 9.5,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      yPos -= 18;
    });

    // --- RULE 6.2: Append Document Pages in Original Order ---
    for (const item of includedDocs) {
      const srcDoc = await PDFDocument.load(item.fileObj.bytes);
      const pageIndices = srcDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    // --- RULES 6.3 & 6.4: Add Footer (<tender_id> | Page X of Y) to Every Page ---
    const totalPages = mergedPdf.getPageCount();
    const allPages = mergedPdf.getPages();

    for (let i = 0; i < totalPages; i++) {
      const page = allPages[i];
      const { width } = page.getSize();
      const footerText = `${tender.tender_id} | Page ${i + 1} of ${totalPages}`;
      const textSize = 9;
      const textWidth = font.widthOfTextAtSize(footerText, textSize);

      // Centered horizontally, 18pt from bottom margin to not cover content (Rule 6.4)
      page.drawText(footerText, {
        x: (width - textWidth) / 2,
        y: 18,
        size: textSize,
        font: font,
        color: rgb(0.25, 0.25, 0.25)
      });
    }

    // --- RULE 4.8: Trigger Download as <tender_id>_Package.pdf ---
    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const downloadUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${tender.tender_id}_Package.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);

    showToast(`Package generated: ${tender.tender_id}_Package.pdf (${totalPages} pages)`, "success");
  } catch (err) {
    alert("An error occurred while generating the package: " + err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = `
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>${i18n[currentLang].generate}</span>
    `;
    evaluateStatus();
  }
});

// --- Drag and Drop Helper Utility ---
function setupDragAndDrop(dropzoneEl, callback) {
  if (!dropzoneEl) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('dragover');
    }, false);
  });

  dropzoneEl.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files ? Array.from(dt.files) : [];
    if (files.length > 0) {
      callback(files);
    }
  }, false);
}

// --- Escape HTML Helper Utility ---
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Keyframe animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Initialize initial evaluation state
evaluateStatus();
updateStats();