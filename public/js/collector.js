let currentStep = 1;
let stakeholders = [];
let uploadedFiles = []; // Now stores { url: 'base64_string', caption: '' }
let coordinatesData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSupervisors();
  restoreDraft();
  showStep(currentStep);

  const form = document.getElementById('inspectionForm');
  if (form) form.addEventListener('submit', (e) => e.preventDefault());
  
  const dateInput = document.getElementById('inspectionDate') || document.getElementById('dateOfInspection');
  if (dateInput) dateInput.addEventListener('change', autoCalculateQuarter);
  
  const typeInput = document.getElementById('inspectionType');
  if (typeInput) typeInput.addEventListener('change', toggleCustomType);
});

function showStep(step) {
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.step-indicator').forEach(el => el.classList.remove('active'));
  
  const stepEl = document.getElementById(`step-${step}`);
  const indicatorEl = document.getElementById(`indicator-${step}`);
  
  if (stepEl) stepEl.classList.add('active');
  if (indicatorEl) indicatorEl.classList.add('active');
  
  currentStep = step;
  saveDraft();
}

function nextStep() {
  if (!validateCurrentStep()) return;
  if (currentStep < 4) {
    currentStep++;
    showStep(currentStep);
  } else if (currentStep === 4) {
    preparePreview();
    window.location.href = 'preview.html';
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

function autoCalculateQuarter(e) {
  const date = new Date(e.target.value);
  const month = date.getMonth() + 1;
  let quarter = 'Q4';
  if (month >= 1 && month <= 3) quarter = 'Q1';
  else if (month >= 4 && month <= 6) quarter = 'Q2';
  else if (month >= 7 && month <= 9) quarter = 'Q3';
  
  const quarterInput = document.getElementById('quarter');
  if (quarterInput) quarterInput.value = quarter;
}

function toggleCustomType(e) {
  const customField = document.getElementById('customTypeGroup');
  if (customField) {
    customField.style.display = e.target.value === 'Other' ? 'block' : 'none';
  }
}

function toggleCustomStakeholder() {
  const select = document.getElementById('stakeholderSelect');
  const customGroup = document.getElementById('customStakeholderGroup');
  if (select && customGroup) {
    customGroup.style.display = select.value === 'Other' ? 'block' : 'none';
  }
}

function addStakeholder() {
  const select = document.getElementById('stakeholderSelect');
  const customInput = document.getElementById('stakeholderInput');
  let val = '';

  if (select && select.value === 'Other') {
    val = customInput.value.trim();
  } else if (select && select.value !== '') {
    val = select.value;
  } else if (customInput) {
    // Fallback if dropdown isn't used
    val = customInput.value.trim();
  }

  if (val && !stakeholders.includes(val)) {
    stakeholders.push(val);
    if (select) select.value = '';
    if (customInput) customInput.value = '';
    const customGroup = document.getElementById('customStakeholderGroup');
    if (customGroup) customGroup.style.display = 'none';
    renderStakeholders();
    saveDraft();
  }
}

function removeStakeholder(index) {
  stakeholders.splice(index, 1);
  renderStakeholders();
  saveDraft();
}

function renderStakeholders() {
  const container = document.getElementById('stakeholderContainer');
  if (!container) return;
  
  container.innerHTML = stakeholders.map((s, idx) => `
    <div class="chip">${s} <span onclick="removeStakeholder(${idx})">&times;</span></div>
  `).join('');
}

function getCurrentLocation() {
  const btn = document.getElementById('locationBtn');
  const status = document.getElementById('locationStatus');
  
  if (!navigator.geolocation) {
    if (status) status.innerText = 'Geolocation is not supported by your browser';
    return;
  }
  
  if (btn) btn.innerText = 'Locating...';
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      coordinatesData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: new Date().toISOString()
      };
      
      const latInput = document.getElementById('latitude');
      const lngInput = document.getElementById('longitude');
      
      if (latInput) latInput.value = coordinatesData.latitude;
      if (lngInput) lngInput.value = coordinatesData.longitude;
      if (status) status.innerText = `Location captured successfully (Accuracy: ${Math.round(coordinatesData.accuracy)}m)`;
      if (btn) btn.innerText = 'Get Current Location';
      saveDraft();
    },
    (error) => {
      if (status) status.innerText = 'Unable to retrieve location. Please enter manually.';
      if (btn) btn.innerText = 'Get Current Location';
    },
    { enableHighAccuracy: true }
  );
}

// NEW: Processes images through a Canvas to compress them into Base64 strings
function handleImageSelection(e) {
  const files = Array.from(e.target.files);
  if (uploadedFiles.length + files.length > 10) {
    alert('Maximum 10 images allowed.');
    return;
  }
  
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image to a max width of 800px to easily fit in localStorage
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to Base64 JPEG (70% quality)
        const base64Url = canvas.toDataURL('image/jpeg', 0.7);
        
        uploadedFiles.push({ url: base64Url, caption: '' });
        renderImagePreviews();
        saveDraft();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  const grid = document.getElementById('imagePreviewGrid');
  if (!grid) return;
  
  grid.innerHTML = uploadedFiles.map((item, idx) => `
    <div class="image-preview-card">
      <img src="${item.url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;" />
      <input type="text" placeholder="Image caption..." value="${item.caption}" onchange="updateCaption(${idx}, this.value)" />
      <button type="button" class="secondary" style="margin-top:0.5rem; font-size:0.8rem; padding:0.2rem;" onclick="removeImage(${idx})">Remove</button>
    </div>
  `).join('');
}

function updateCaption(idx, val) {
  uploadedFiles[idx].caption = val;
  saveDraft();
}

function removeImage(idx) {
  uploadedFiles.splice(idx, 1);
  renderImagePreviews();
  saveDraft();
}

async function loadSupervisors() {
  try {
    const res = await apiRequest('/supervisors');
    const select = document.getElementById('supervisorId');
    if (select && res && res.data) {
      select.innerHTML = '<option value="">Select Supervisor</option>' + res.data.map(sup => `
        <option value="${sup._id}" data-name="${sup.name}">${sup.name} (${sup.unit})</option>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load supervisors');
  }
}

function validateCurrentStep() {
  if (currentStep === 1) {
    const dateInput = document.getElementById('inspectionDate') || document.getElementById('dateOfInspection');
    const typeInput = document.getElementById('inspectionType');
    
    if (!dateInput?.value || !typeInput?.value) {
      alert('Please select a Date of Inspection and Inspection Type to proceed.');
      return false;
    }
  } else if (currentStep === 2) {
    const issues = document.getElementById('identifiedIssues')?.value.trim();
    const location = document.getElementById('location')?.value.trim();
    if (!issues || !location || stakeholders.length === 0) {
      alert('Please fill in issues, location, and at least one stakeholder.');
      return false;
    }
  } else if (currentStep === 3) {
    const recommendations = document.getElementById('recommendations')?.value.trim();
    const supSelect = document.getElementById('supervisorId');
    if (!recommendations || !supSelect?.value) {
      alert('Please enter recommendations and select a supervisor.');
      return false;
    }
  }
  return true;
}

function saveDraft() {
  try {
    const supervisorSelect = document.getElementById('supervisorId');
    let supervisorName = '';
    if (supervisorSelect && supervisorSelect.selectedIndex > 0) {
      supervisorName = supervisorSelect.options[supervisorSelect.selectedIndex].text.split(' (')[0];
    }
    const dateInput = document.getElementById('inspectionDate') || document.getElementById('dateOfInspection');

    const formData = {
      dateOfInspection: dateInput?.value || '',
      quarter: document.getElementById('quarter')?.value || '',
      inspectionType: document.getElementById('inspectionType')?.value || '',
      customInspectionType: document.getElementById('customInspectionType')?.value || '',
      identifiedIssues: document.getElementById('identifiedIssues')?.value || '',
      location: document.getElementById('location')?.value || '',
      stakeholders,
      recommendations: document.getElementById('recommendations')?.value || '',
      supervisorId: supervisorSelect?.value || '',
      supervisorName: supervisorName,
      coordinatesData,
      images: uploadedFiles // NEW: Saves the Base64 images to the draft
    };
    localStorage.setItem('inspectionDraft', JSON.stringify(formData));
  } catch (error) {
    console.error('Error saving draft:', error);
  }
}

function restoreDraft() {
  try {
    const saved = localStorage.getItem('inspectionDraft');
    if (!saved) return;
    const data = JSON.parse(saved);
    
    const dateInput = document.getElementById('inspectionDate') || document.getElementById('dateOfInspection');
    if (data.dateOfInspection && dateInput) dateInput.value = data.dateOfInspection;
    
    if (data.quarter && document.getElementById('quarter')) document.getElementById('quarter').value = data.quarter;
    if (data.inspectionType && document.getElementById('inspectionType')) document.getElementById('inspectionType').value = data.inspectionType;
    if (data.identifiedIssues && document.getElementById('identifiedIssues')) document.getElementById('identifiedIssues').value = data.identifiedIssues;
    if (data.location && document.getElementById('location')) document.getElementById('location').value = data.location;
    if (data.stakeholders) { stakeholders = data.stakeholders; renderStakeholders(); }
    if (data.recommendations && document.getElementById('recommendations')) document.getElementById('recommendations').value = data.recommendations;
    if (data.supervisorId && document.getElementById('supervisorId')) document.getElementById('supervisorId').value = data.supervisorId;
    if (data.coordinatesData) coordinatesData = data.coordinatesData;
    
    // NEW: Restore images
    if (data.images && data.images.length > 0) {
      uploadedFiles = data.images;
      renderImagePreviews();
    }
  } catch (error) {
    console.error('Error restoring draft:', error);
  }
}

function clearDraft() {
  if (confirm('Are you sure you want to clear your draft?')) {
    localStorage.removeItem('inspectionDraft');
    window.location.reload();
  }
}

function preparePreview() {
  saveDraft();
}