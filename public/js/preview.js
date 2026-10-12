document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('inspectionDraft');
  if (!saved) {
    window.location.href = 'collector.html';
    return;
  }
  const data = JSON.parse(saved);
  
  document.getElementById('prevDate').innerText = data.dateOfInspection;
  document.getElementById('prevQuarter').innerText = data.quarter;
  document.getElementById('prevType').innerText = data.inspectionType === 'Other' ? data.customInspectionType : data.inspectionType;
  document.getElementById('prevIssues').innerText = data.identifiedIssues;
  document.getElementById('prevLocation').innerText = data.location;
  document.getElementById('prevStakeholders').innerText = data.stakeholders.join(', ');
  document.getElementById('prevRecommendations').innerText = data.recommendations;
  
  document.getElementById('prevSupervisor').innerText = data.supervisorName || data.supervisorId || 'Not provided';
  document.getElementById('prevCoords').innerText = data.coordinatesData ? `${data.coordinatesData.latitude}, ${data.coordinatesData.longitude}` : 'Not captured';

  // NEW: Render Image Evidence on Preview Page
  const prevImagesContainer = document.getElementById('prevImages');
  if (prevImagesContainer) {
    if (data.images && data.images.length > 0) {
      prevImagesContainer.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
        ${data.images.map(img => `
          <div>
            <img src="${img.url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
            <p style="font-size: 0.85rem; margin-top: 0.5rem; color: #64748b;">${img.caption || 'No caption'}</p>
          </div>
        `).join('')}
      </div>`;
    } else {
      prevImagesContainer.innerHTML = '<p style="color: #64748b; font-style: italic;">No images attached.</p>';
    }
  }

  const confirmCheckbox = document.getElementById('confirmCheckbox');
  if (confirmCheckbox) {
    confirmCheckbox.addEventListener('change', (e) => {
      document.getElementById('submitBtn').disabled = !e.target.checked;
    });
  }
});

function editStep(step) {
  window.location.href = `collector.html?step=${step}`;
}

async function submitInspection() {
  const saved = localStorage.getItem('inspectionDraft');
  if (!saved) return;
  const data = JSON.parse(saved);

  const payload = {
    ...data,
    coordinates: data.coordinatesData 
    // data.images is already included here automatically!
  };
  
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.innerText = 'Submitting...';
  submitBtn.disabled = true;

  try {
    const res = await apiRequest('/inspections', 'POST', payload);
    localStorage.removeItem('inspectionDraft');
    window.location.href = `success.html?ref=${res.data.referenceNumber}`;
  } catch (err) {
    alert('Submission failed: ' + err.message);
    submitBtn.innerText = 'Submit Inspection';
    submitBtn.disabled = false;
  }
}