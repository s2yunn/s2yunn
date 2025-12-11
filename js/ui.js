// ========== UI Management ==========

// Show Validation Error Modal
function showValidationErrorModal(errors) {
  // Create a temporary modal for displaying errors
  const errorModal = document.createElement('div');
  errorModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  `;
  
  const errorContent = document.createElement('div');
  errorContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    max-width: 500px;
    width: 90%;
    border-top: 4px solid #A51D2C;
  `;
  
  let errorHTML = '<h2 style="color: #202020; font-size: 24px; margin-bottom: 20px;">⚠️ ข้อผิดพลาด</h2>';
  errorHTML += '<ul style="list-style-position: inside; color: #202020; font-size: 16px; line-height: 1.8;">';
  errors.forEach(error => {
    errorHTML += `<li style="margin-bottom: 10px;">• ${error}</li>`;
  });
  errorHTML += '</ul>';
  errorHTML += `
    <button onclick="this.closest('div').parentElement.remove()" style="
      margin-top: 20px;
      padding: 12px 30px;
      background-color: #2C3985;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
    ">ปิด</button>
  `;
  
  errorContent.innerHTML = errorHTML;
  errorModal.appendChild(errorContent);
  document.body.appendChild(errorModal);
  
  // Close on background click
  errorModal.addEventListener('click', function(e) {
    if (e.target === errorModal) {
      errorModal.remove();
    }
  });
}

// Render Members Table
function renderMembersTable() {
  const members = db.getAllMembers();
  
  // Sort members by recordDate (oldest first = lowest number)
  const sortedMembers = [...members].sort((a, b) => {
    const dateA = new Date(a.recordDate || '9999-12-31');
    const dateB = new Date(b.recordDate || '9999-12-31');
    return dateA - dateB;
  });
  
  const tbody = document.getElementById('membersTableBody');
  tbody.innerHTML = '';

  if (sortedMembers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">ยังไม่มีข้อมูลสมาชิก</td></tr>';
  } else {
    sortedMembers.forEach((member, index) => {
      const row = document.createElement('tr');
      row.style.cursor = 'pointer';
      row.onclick = function(e) {
        // ไม่ให้คลิกแถวเมื่อกดปุ่ม
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          return;
        }
        viewMemberDetail(member.id);
      };
      row.innerHTML = `
        <td><strong>${index + 1}</strong></td>
        <td>
          <div class="name-col">${member.titlePrefix} ${member.thaiName}</div>
          <div class="name-sub">${member.englishName}</div>
        </td>
        <td>${member.educationLevel || '-'}</td>
        <td>${member.email || '-'}</td>
        <td>${member.status || 'ไม่ทราบข้อมูล'}</td>
        <td>${member.memberStatus || '-'}</td>
        <td>
          <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); editMember('${member.id}')">แก้ไข</button>
          <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); deleteMemberConfirm('${member.id}')">ลบ</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  document.getElementById('memberCount').textContent = members.length;
}

// Render Update Page - Members who graduated in current year
function renderUpdatePage() {
  const members = db.getAllMembers();
  const currentYear = new Date().getFullYear();
  
  // Filter members who graduated in current year
  const membersToUpdate = members.filter(member => {
    if (!member.completionDate) return false;
    
    // Don't show if already confirmed
    if (member.statusConfirmed) {
      return false;
    }
    
    const completionDate = new Date(member.completionDate);
    const completionYear = completionDate.getFullYear();
    const calculatedStatus = db.calculateStatus(member.completionDate);
    
    // Check if graduated in current year
    const graduatedThisYear = (
      calculatedStatus === 'สำเร็จการศึกษา' && 
      completionYear === currentYear
    );
    
    // Mark members who graduated this year (if not already marked)
    if (graduatedThisYear && !member.statusChangedYear) {
      member.statusChangedYear = currentYear;
      db.addMember(member); // Save the year marker
    }
    
    // Show if has statusChangedYear marker for current year
    return member.statusChangedYear === currentYear;
  });

  // Sort by recordDate
  const sortedMembers = [...membersToUpdate].sort((a, b) => {
    const dateA = new Date(a.recordDate || '9999-12-31');
    const dateB = new Date(b.recordDate || '9999-12-31');
    return dateA - dateB;
  });

  const tbody = document.getElementById('updateTableBody');
  tbody.innerHTML = '';

  if (sortedMembers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">ไม่มีสมาชิกที่ต้องอัปเดตข้อมูล</td></tr>';
  } else {
    sortedMembers.forEach((member, index) => {
      const row = document.createElement('tr');
      const educationLevel = member.studentStatus === 'language' ? 'นักเรียนภาษา' : (member.educationLevel || '-');
      const phone = member.countryCode ? `(${member.countryCode}) ${member.phone}` : member.phone;
      
      // Display current status
      const currentStatus = member.status || 'ไม่ทราบข้อมูล';
      const calculatedStatus = db.calculateStatus(member.completionDate);
      const currentMemberStatus = member.memberStatus || 'ไม่ระบุ';
      const calculatedMemberStatus = db.calculateMemberStatus(calculatedStatus);
      
      // Check if status needs update
      const statusNeedsUpdate = currentStatus !== calculatedStatus;
      
      row.innerHTML = `
        <td><strong>${index + 1}</strong></td>
        <td>
          <div class="name-col">${member.titlePrefix} ${member.thaiName}</div>
          <div class="name-sub">${member.englishName}</div>
        </td>
        <td>${educationLevel}</td>
        <td>${member.email || '-'}</td>
        <td>${phone || '-'}</td>
        <td>
          ${statusNeedsUpdate ? `
            <span style="color: #A51D2C; font-weight: 600;">${currentStatus}</span>
            <span style="margin: 0 5px;">→</span>
            <span style="color: #2C3985; font-weight: 600;">${calculatedStatus}</span>
          ` : `
            <span style="color: #2C3985; font-weight: 600;">${currentStatus}</span>
          `}
        </td>
        <td>
          ${statusNeedsUpdate ? `
            <span style="color: #A51D2C; font-weight: 600;">${currentMemberStatus}</span>
            <span style="margin: 0 5px;">→</span>
            <span style="color: #2C3985; font-weight: 600;">${calculatedMemberStatus}</span>
          ` : `
            <span style="color: #2C3985; font-weight: 600;">${currentMemberStatus}</span>
          `}
        </td>
        <td>
          <button class="btn btn-small btn-secondary" onclick="editMember('${member.id}')">แก้ไข</button>
          <button class="btn btn-small btn-success" onclick="confirmStatusUpdate('${member.id}')">ยืนยัน</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  document.getElementById('updateCount').textContent = sortedMembers.length;
}

// Confirm Status Update
function confirmStatusUpdate(memberId) {
  const member = db.getMember(memberId);
  if (!member) return;

  if (confirm(`ยืนยันการอัปเดตข้อมูลของ ${member.titlePrefix} ${member.thaiName}?`)) {
    // Recalculate status (in case it needs update)
    member.status = db.calculateStatus(member.completionDate);
    member.memberStatus = db.calculateMemberStatus(member.status);
    
    // Mark as confirmed and remove the status change marker
    member.statusConfirmed = true;
    delete member.statusChangedYear;
    
    // Save to database
    db.addMember(member);
    
    // Refresh all pages
    renderUpdatePage();
    renderMembersTable();
    renderEmailPage();
    renderStatisticsPage();
    
    alert('ยืนยันข้อมูลเรียบร้อยแล้ว');
  }
}


// View Member Detail
function viewMemberDetail(memberId) {
  const member = db.getMember(memberId);
  if (!member) return;

  const detailView = document.getElementById('memberDetailView');
  const formView = document.getElementById('memberFormView');
  
  detailView.style.display = 'block';
  formView.style.display = 'none';
  document.getElementById('modalTitle').textContent = 'รายละเอียดสมาชิก';

  const detailHTML = `
    <div class="detail-row">
      <div class="detail-label">ชื่อ-นามสกุล (ภาษาไทย):</div>
      <div class="detail-value">${member.titlePrefix} ${member.thaiName}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">ชื่อเล่น (ภาษาไทย):</div>
      <div class="detail-value ${!member.thaiNickname ? 'empty' : ''}">${member.thaiNickname || '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">ชื่อ-นามสกุล (อังกฤษ):</div>
      <div class="detail-value">${member.englishName}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">ชื่อเล่น (ภาษาอังกฤษ):</div>
      <div class="detail-value ${!member.englishNickname ? 'empty' : ''}">${member.englishNickname || '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">วัน/เดือน/ปีเกิด:</div>
      <div class="detail-value">${formatDate(member.dateOfBirth)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">อีเมล:</div>
      <div class="detail-value"><a href="mailto:${member.email}">${member.email}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-label">โทรศัพท์:</div>
      <div class="detail-value">(${member.countryCode || '+82'}) ${member.phone}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">ที่อยู่ปัจจุบัน:</div>
      <div class="detail-value ${!member.address ? 'empty' : ''}">${member.address || '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">สถานภาพปัจจุบัน:</div>
      <div class="detail-value">${member.studentStatus === 'degree' ? 'เป็น/เคยเป็นนักเรียนระดับชั้นปริญญา' : 'เป็น/เคยเป็นนักเรียนภาษา'}</div>
    </div>
    ${member.studentStatus === 'degree' ? `
    <div class="detail-row">
      <div class="detail-label">ระดับการศึกษา:</div>
      <div class="detail-value">${member.educationLevel || '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">สาขาวิชา:</div>
      <div class="detail-value">${member.major || '-'}</div>
    </div>
    ` : ''}
    <div class="detail-row">
      <div class="detail-label">มหาวิทยาลัย:</div>
      <div class="detail-value">${member.university}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">ภูมิภาค:</div>
      <div class="detail-value">${member.region}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">วันที่สำเร็จการศึกษา:</div>
      <div class="detail-value">${formatDate(member.completionDate)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">สถานะการศึกษา:</div>
      <div class="detail-value">${member.status}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">สถานะสมาชิก:</div>
      <div class="detail-value">${member.memberStatus}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">ช่องทางการศึกษาต่อที่เกาหลี:</div>
      <div class="detail-value">${member.fundingType || '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">ทุนการศึกษา:</div>
      <div class="detail-value ${!member.scholarship ? 'empty' : ''}">${member.scholarship || '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">เอกสารรับรอง:</div>
      <div class="detail-value">
        ${member.certificateLink ? `<a href="${member.certificateLink}" target="_blank">ดูเอกสาร</a>` : '-'}
      </div>
    </div>
    <div style="margin-top: 30px; text-align: center;">
      <button class="btn btn-outline" onclick="closeMemberModal()">ปิด</button>
    </div>
  `;

  detailView.innerHTML = detailHTML;
  openMemberModal();
}

// Edit Member
function editMember(memberId) {
  const member = db.getMember(memberId);
  const formView = document.getElementById('memberFormView');
  const detailView = document.getElementById('memberDetailView');
  
  detailView.style.display = 'none';
  formView.style.display = 'block';
  document.getElementById('modalTitle').textContent = 'แก้ไขข้อมูลสมาชิก';

  if (member) {
    // Populate form with member data
    document.getElementById('recordDate').value = member.recordDate || '';
    document.getElementById('studentStatus').value = member.studentStatus || '';
    document.getElementById('educationLevel').value = member.educationLevel || '';
    document.getElementById('major').value = member.major || '';
    document.getElementById('titlePrefix').value = member.titlePrefix || '';
    document.getElementById('dateOfBirth').value = member.dateOfBirth || '';
    document.getElementById('thaiName').value = member.thaiName || '';
    document.getElementById('thaiNickname').value = member.thaiNickname || '';
    document.getElementById('englishName').value = member.englishName || '';
    document.getElementById('englishNickname').value = member.englishNickname || '';
    document.getElementById('countryCode').value = member.countryCode || '+82';
    document.getElementById('phone').value = member.phone || '';
    document.getElementById('email').value = member.email || '';
    document.getElementById('address').value = member.address || '';
    document.getElementById('completionDate').value = member.completionDate || '';
    document.getElementById('university').value = member.university || '';
    document.getElementById('certificateLink').value = member.certificateLink || '';
    document.getElementById('fundingType').value = member.fundingType || '';
    document.getElementById('scholarship').value = member.scholarship || '';
    document.getElementById('region').value = member.region || '';
    document.getElementById('status').value = member.status || '';
    document.getElementById('memberStatus').value = member.memberStatus || '';

    // Trigger country code change event to update phone pattern
    const countryCodeSelect = document.getElementById('countryCode');
    if (countryCodeSelect) {
      const event = new Event('change');
      countryCodeSelect.dispatchEvent(event);
    }

    // Trigger student status change event to show/hide degree fields
    const studentStatusSelect = document.getElementById('studentStatus');
    if (studentStatusSelect) {
      const statusEvent = new Event('change');
      studentStatusSelect.dispatchEvent(statusEvent);
    }

    // Trigger funding type change event to show/hide scholarship field
    const fundingTypeSelect = document.getElementById('fundingType');
    if (fundingTypeSelect) {
      const fundingEvent = new Event('change');
      fundingTypeSelect.dispatchEvent(fundingEvent);
    }

    // Store member ID in form for update
    document.getElementById('memberForm').dataset.memberId = memberId;
  } else {
    // Clear form for new member
    document.getElementById('memberForm').reset();
    document.getElementById('memberForm').dataset.memberId = '';
  }

  openMemberModal();
}

// Add New Member
function addNewMember() {
  document.getElementById('memberForm').reset();
  document.getElementById('memberForm').dataset.memberId = '';
  document.getElementById('modalTitle').textContent = 'เพิ่มข้อมูลสมาชิก';
  
  const formView = document.getElementById('memberFormView');
  const detailView = document.getElementById('memberDetailView');
  
  detailView.style.display = 'none';
  formView.style.display = 'block';
  
  openMemberModal();
}

// Delete Member Confirm
function deleteMemberConfirm(memberId) {
  if (confirm('คุณแน่ใจหรือว่าต้องการลบสมาชิกคนนี้?')) {
    db.deleteMember(memberId);
    renderMembersTable();
    renderEmailPage();
    showAlert('ลบข้อมูลสมาชิกสำเร็จ', 'success');
  }
}

// Render Email Page
function renderEmailPage() {
  const allEmails = db.getAllEmails();
  const ordinaryEmails = db.getOrdinaryEmails();
  const associateEmails = db.getAssociateEmails();

  // Render All Emails
  const allList = document.getElementById('allEmailList');
  allList.innerHTML = '';
  
  if (allEmails.length === 0) {
    allList.innerHTML = '<p style="text-align: center; color: #808080; padding: 20px;">ไม่มีสมาชิก</p>';
  } else {
    allEmails.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.className = 'email-item';
      emailDiv.innerHTML = `
        <span>${email}</span>
        <button class="copy-btn" onclick="copyToClipboard('${email}', this)">คัดลอก</button>
      `;
      allList.appendChild(emailDiv);
    });
  }

  document.getElementById('allCount').textContent = allEmails.length;

  // Render Ordinary Emails
  const ordinaryList = document.getElementById('ordinaryEmailList');
  ordinaryList.innerHTML = '';
  
  if (ordinaryEmails.length === 0) {
    ordinaryList.innerHTML = '<p style="text-align: center; color: #808080; padding: 20px;">ไม่มีสมาชิกสามัญ</p>';
  } else {
    ordinaryEmails.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.className = 'email-item ordinary';
      emailDiv.innerHTML = `
        <span>${email}</span>
        <button class="copy-btn" onclick="copyToClipboard('${email}', this)">คัดลอก</button>
      `;
      ordinaryList.appendChild(emailDiv);
    });
  }

  document.getElementById('ordinaryCount').textContent = ordinaryEmails.length;

  // Render Associate Emails
  const associateList = document.getElementById('associateEmailList');
  associateList.innerHTML = '';
  
  if (associateEmails.length === 0) {
    associateList.innerHTML = '<p style="text-align: center; color: #808080; padding: 20px;">ไม่มีสมาชิกวิสามัญ</p>';
  } else {
    associateEmails.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.className = 'email-item associate';
      emailDiv.innerHTML = `
        <span>${email}</span>
        <button class="copy-btn" onclick="copyToClipboard('${email}', this)">คัดลอก</button>
      `;
      associateList.appendChild(emailDiv);
    });
  }

  document.getElementById('associateCount').textContent = associateEmails.length;
}

// Render Statistics Page
function renderStatisticsPage() {
  const stats = db.getStatistics();

  // Total Members
  document.getElementById('totalMembersStats').textContent = stats.totalMembers;

  // Education Level
  renderStatChart('educationStats', stats.educationLevel, stats.totalMembers);

  // Status
  renderStatChart('statusStats', stats.status, stats.totalMembers);

  // Member Status
  renderStatChart('memberStatusStats', stats.memberStatus, stats.totalMembers);

  // Funding Types
  renderStatChart('fundingTypeStats', stats.fundingTypes, stats.totalMembers);

  // Scholarships (only show those with scholarships)
  const scholarshipData = {};
  Object.entries(stats.scholarships).forEach(([key, value]) => {
    if (key && key !== 'ไม่ระบุ') {
      scholarshipData[key] = value;
    }
  });

  if (Object.keys(scholarshipData).length > 0) {
    renderStatChart('scholarshipStats', scholarshipData, stats.totalMembers);
  } else {
    document.getElementById('scholarshipStats').innerHTML = '<p style="color: #808080; text-align: center;">ไม่มีข้อมูลทุน</p>';
  }

  // Universities
  const uniData = {};
  Object.entries(stats.universities).forEach(([key, value]) => {
    if (key && key !== 'ไม่ระบุ') {
      uniData[key] = value;
    }
  });
  
  renderStatChart('universityStats', uniData, stats.totalMembers);

  // Regions
  const regionData = {};
  Object.entries(stats.regions).forEach(([key, value]) => {
    if (key && key !== 'ไม่ระบุ') {
      regionData[key] = value;
    }
  });
  
  renderStatChart('regionStats', regionData, stats.totalMembers);
}

// Render Statistics Chart
function renderStatChart(elementId, data, total) {
  const element = document.getElementById(elementId);
  element.innerHTML = '';

  const items = Object.entries(data).sort((a, b) => b[1] - a[1]);

  items.forEach(([label, value]) => {
    if (label && label !== 'ไม่ระบุ') {
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      const html = `
        <div class="stat-item">
          <div class="stat-item-label">${label}</div>
          <div class="stat-item-value">${percentage}%</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
      `;
      element.innerHTML += html;
    }
  });

  if (items.length === 0) {
    element.innerHTML = '<p style="color: #808080; text-align: center;">ไม่มีข้อมูล</p>';
  }
}

// Modal Functions
function openMemberModal() {
  document.getElementById('memberModal').classList.add('show');
}

function closeMemberModal() {
  document.getElementById('memberModal').classList.remove('show');
}

// Update Status when Completion Date changes
function updateStatus() {
  const completionDate = document.getElementById('completionDate').value;
  const status = db.calculateStatus(completionDate);
  const memberStatus = db.calculateMemberStatus(status);
  
  document.getElementById('status').value = status;
  document.getElementById('memberStatus').value = memberStatus;
}

// Initialize Page on Load
function initializePage() {
  if (!db.currentUser) {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('mainApp').style.display = 'none';
  } else {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('mainApp').style.display = 'flex';
    
    // Only render if not already rendered
    renderMembersTable();
    renderEmailPage();
    renderStatisticsPage();
    renderUpdatePage();
    
    // Load the last viewed page
    const lastPage = db.loadCurrentPage();
    switchPage(lastPage);
  }
}

// Close Modal on Outside Click - DISABLED
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('memberModal');
  // Removed: Click outside to close modal functionality
  // Users must use the close button or cancel button to exit

  // Add event listeners for completion date changes
  const completionDateInput = document.getElementById('completionDate');
  if (completionDateInput) {
    completionDateInput.addEventListener('change', updateStatus);
  }

  initializePage();
});
