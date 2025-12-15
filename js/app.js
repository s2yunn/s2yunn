// ========== Data Management ==========
class MemberDB {
  constructor() {
    this.members = this.loadFromStorage();
    this.currentUser = this.loadUser();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('members_data');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading data:', e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('members_data', JSON.stringify(this.members));
      return true;
    } catch (e) {
      console.error('Error saving data:', e);
      return false;
    }
  }

  loadUser() {
    try {
      const user = localStorage.getItem('current_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  }

  saveUser(user) {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  clearUser() {
    localStorage.removeItem('current_user');
  }

  // Save current page
  saveCurrentPage(pageName) {
    localStorage.setItem('current_page', pageName);
  }

  // Load current page
  loadCurrentPage() {
    try {
      return localStorage.getItem('current_page') || 'membersPage';
    } catch (e) {
      return 'membersPage';
    }
  }

  clearUser() {
    localStorage.removeItem('current_user');
  }

  // Helper: ดึงปีจาก completion date
  getGraduationYear(completionDateStr) {
    if (!completionDateStr) return null;
    const match = String(completionDateStr).match(/^(\d{4})[.\-\/]/);
    if (!match) return null;
    const year = Number(match[1]);
    return Number.isFinite(year) ? year : null;
  }

  // Helper: ตรวจสอบและ set flag needsGraduationConfirm
  updateGraduationConfirmFlag(memberData, existingMember = null) {
    const CURRENT_YEAR = new Date().getFullYear();
    
    // Auto-calculate status first
    memberData.status = this.calculateStatus(memberData.completionDate);
    memberData.memberStatus = this.calculateMemberStatus(memberData.status);
    
    // ถ้าไม่ใช่ "สำเร็จการศึกษา" → ไม่ต้องติด flag
    if (memberData.status !== 'สำเร็จการศึกษา') {
      return memberData;
    }
    
    // ดึงปีจาก completion date
    const graduationYear = this.getGraduationYear(memberData.completionDate);
    if (!graduationYear) return memberData;
    
    // Preserve existing flag if already set
    if (existingMember && existingMember.needsGraduationConfirm === true) {
      memberData.needsGraduationConfirm = true;
      if (existingMember.graduationConfirmedAt) {
        memberData.graduationConfirmedAt = existingMember.graduationConfirmedAt;
      }
      return memberData;
    }
    
    // กรณีใหม่: เพิ่งสำเร็จในปีปัจจุบัน และยังไม่เคยถูก mark มาก่อน
    if (graduationYear === CURRENT_YEAR && memberData.needsGraduationConfirm !== true) {
      memberData.needsGraduationConfirm = true;
    }
    
    return memberData;
  }

  // Add or Update Member
  addMember(memberData) {
    let existingMember = null;
    
    if (memberData.id) {
      const index = this.members.findIndex(m => m.id === memberData.id);
      if (index > -1) {
        existingMember = this.members[index];
        // Preserve statusChangedYear if it exists, unless explicitly removed
        if (existingMember.statusChangedYear && !memberData.hasOwnProperty('statusChangedYear')) {
          // Check if completion date changed
          if (existingMember.completionDate !== memberData.completionDate) {
            // Completion date was modified, remove the marker
            delete memberData.statusChangedYear;
          } else {
            // Keep the marker if date unchanged
            memberData.statusChangedYear = existingMember.statusChangedYear;
          }
        }
        // Preserve uploadedAt when editing
        if (existingMember.uploadedAt && !memberData.uploadedAt) {
          memberData.uploadedAt = existingMember.uploadedAt;
        }
        this.members[index] = memberData;
      } else {
        this.members.push(memberData);
      }
    } else {
      // Generate unique ID using timestamp + random number to prevent duplicates during batch import
      memberData.id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
      // Add uploadedAt timestamp (เวลาที่รายชื่อถูกเพิ่มเข้าระบบ)
      memberData.uploadedAt = new Date().toISOString();
      this.members.push(memberData);
    }
    
    // Update graduation confirmation flag
    this.updateGraduationConfirmFlag(memberData, existingMember);

    this.saveToStorage();
    return memberData;
  }

  // Calculate Status based on completion date
  calculateStatus(completionDate) {
    if (!completionDate) return 'ไม่ทราบข้อมูล';
    
    const today = new Date();
    const completionDateObj = new Date(completionDate);
    
    if (completionDateObj > today) {
      return 'กำลังศึกษา';
    } else {
      return 'สำเร็จการศึกษา';
    }
  }

  // Calculate Member Status based on Status
  calculateMemberStatus(status) {
    if (status === 'กำลังศึกษา') {
      return 'สมาชิกสามัญ';
    } else if (status === 'สำเร็จการศึกษา') {
      return 'สมาชิกวิสามัญ';
    }
    return 'ไม่ทราบข้อมูล';
  }

  getMember(id) {
    return this.members.find(m => m.id === id);
  }

  // Helper functions for update reasons
  calculateUpdateReasons(member, allMembers) {
    const reasons = [];

    // 1) รายชื่อซ้ำ
    if (this.isDuplicateMember(member, allMembers)) {
      reasons.push('รายชื่อซ้ำ');
    }

    // 2) สถานะเปลี่ยนเนื่องจากสำเร็จการศึกษา
    if (this.isStatusChangedByGraduation(member)) {
      reasons.push('สถานะเปลี่ยนเนื่องจากสำเร็จการศึกษา');
    }

    // 3) ข้อมูลไม่ครบถ้วน
    const missing = this.findMissingFields(member);
    if (missing.length > 0) {
      reasons.push(`ข้อมูลไม่ครบถ้วน (${missing.join(', ')})`);
    }

    return reasons;
  }

  isDuplicateMember(member, allMembers) {
    // Check by email (if email exists)
    if (member.email && member.email.trim()) {
      const sameEmail = allMembers.filter(m => 
        m.email && m.email.trim() === member.email.trim()
      );
      if (sameEmail.length > 1) return true;
    }

    // Check by Thai name + birthdate (if email is empty)
    if (!member.email || !member.email.trim()) {
      if (member.thaiName && member.dateOfBirth) {
        const sameNameAndBirth = allMembers.filter(m =>
          (!m.email || !m.email.trim()) &&
          m.thaiName === member.thaiName &&
          m.dateOfBirth === member.dateOfBirth
        );
        if (sameNameAndBirth.length > 1) return true;
      }
    }

    return false;
  }

  isStatusChangedByGraduation(member) {
    // ใช้ flag needsGraduationConfirm แทนการเช็ก realtime
    // flag นี้จะถูก set เมื่อสมาชิกสำเร็จการศึกษาในปีปัจจุบัน
    // และจะยังคงอยู่จนกว่าจะกดปุ่ม "ยืนยัน"
    return member.needsGraduationConfirm === true;
  }

  findMissingFields(member) {
    const REQUIRED_FIELDS = [
      { key: 'thaiName', label: 'ชื่อ-นามสกุล (ภาษาไทย)' },
      { key: 'englishName', label: 'ชื่อ-นามสกุล (ภาษาอังกฤษ)' },
      { key: 'email', label: 'อีเมล' },
      { key: 'phone', label: 'โทรศัพท์' },
      { key: 'address', label: 'ที่อยู่ปัจจุบัน' },
      { key: 'dateOfBirth', label: 'วันเกิด' },
      { key: 'educationLevel', label: 'ระดับการศึกษา' },
      { key: 'scholarship', label: 'ชื่อทุนการศึกษา' },
      { key: 'university', label: 'มหาวิทยาลัย' },
      { key: 'region', label: 'ภูมิภาค' }
    ];

    const missing = [];
    
    // เงื่อนไขพิเศษ
    const isLanguageStudent = member.studentStatus === 'language' || 
                               member.studentStatus === 'เป็น/เคยเป็นนักเรียนภาษา';
    const isSelfFunded = member.fundingType === 'ทุนส่วนตัว';
    const noFundingType = !member.fundingType || String(member.fundingType).trim() === '';

    for (const { key, label } of REQUIRED_FIELDS) {
      // 1) นักเรียนภาษา → ไม่เช็ก "ระดับการศึกษา"
      if (key === 'educationLevel' && isLanguageStudent) {
        continue;
      }

      // 2) ทุนส่วนตัว หรือ ไม่ระบุช่องทางการศึกษา → ไม่เช็ก "ชื่อทุนการศึกษา"
      if (key === 'scholarship' && (isSelfFunded || noFundingType)) {
        continue;
      }

      // 3) ภูมิภาค → ไม่บังคับทุกกรณี
      if (key === 'region') {
        continue;
      }

      const value = member[key];
      if (value === null || value === undefined || String(value).trim() === '') {
        missing.push(label);
      }
    }

    return missing;
  }

  getDuplicateGroup(member, allMembers) {
    // Return all members in the same duplicate group
    if (member.email && member.email.trim()) {
      return allMembers.filter(m => 
        m.email && m.email.trim() === member.email.trim()
      );
    }

    if (member.thaiName && member.dateOfBirth) {
      return allMembers.filter(m =>
        (!m.email || !m.email.trim()) &&
        m.thaiName === member.thaiName &&
        m.dateOfBirth === member.dateOfBirth
      );
    }

    return [member];
  }

  getMember(id) {
    return this.members.find(m => m.id === id);
  }

  getAllMembers() {
    return this.members;
  }

  deleteMember(id) {
    this.members = this.members.filter(m => m.id !== id);
    this.saveToStorage();
  }

  getAllEmails() {
    return this.members
      .filter(m => m.email)
      .map(m => m.email);
  }

  getOrdinaryEmails() {
    return this.members
      .filter(m => m.memberStatus === 'สมาชิกสามัญ' && m.email)
      .map(m => m.email);
  }

  getAssociateEmails() {
    return this.members
      .filter(m => m.memberStatus === 'สมาชิกวิสามัญ' && m.email)
      .map(m => m.email);
  }

  getStatistics() {
    const stats = {
      totalMembers: this.members.length,
      educationLevel: {},
      status: {},
      memberStatus: {},
      fundingTypes: {},
      scholarships: {},
      universities: {},
      regions: {}
    };

    this.members.forEach(member => {
      // Education Level
      let edu;
      if (member.studentStatus === 'language') {
        edu = 'นักเรียนภาษา';
      } else {
        edu = member.educationLevel || 'ไม่ระบุ';
      }
      stats.educationLevel[edu] = (stats.educationLevel[edu] || 0) + 1;

      // Status
      const status = member.status || 'ไม่ทราบข้อมูล';
      stats.status[status] = (stats.status[status] || 0) + 1;

      // Member Status
      const memStatus = member.memberStatus || 'ไม่ระบุ';
      stats.memberStatus[memStatus] = (stats.memberStatus[memStatus] || 0) + 1;

      // Funding Types
      const fundingType = member.fundingType || 'ไม่ระบุ';
      stats.fundingTypes[fundingType] = (stats.fundingTypes[fundingType] || 0) + 1;

      // Scholarships
      if (member.scholarship) {
        stats.scholarships[member.scholarship] = (stats.scholarships[member.scholarship] || 0) + 1;
      }

      // Universities
      const uni = member.university || 'ไม่ระบุ';
      stats.universities[uni] = (stats.universities[uni] || 0) + 1;

      // Regions
      const region = member.region || 'ไม่ระบุ';
      stats.regions[region] = (stats.regions[region] || 0) + 1;
    });

    return stats;
  }
}

// ========== Authentication ==========
class Auth {
  // Demo credentials - in production, use backend
  static DEMO_USER = {
    username: 'admin',
    password: 'admin123'
  };

  static login(username, password) {
    if (username === this.DEMO_USER.username && password === this.DEMO_USER.password) {
      return {
        username: username,
        loginTime: new Date().toISOString()
      };
    }
    return null;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone) {
    const phoneRegex = /^\d{9,15}$/;
    return phoneRegex.test(phone);
  }

  static validateDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }
}

// ========== Form Validation & Handling ==========
class FormValidator {
  static validateMemberForm(formData) {
    const errors = [];

    // Validate Required Fields
    if (!formData.recordDate) errors.push('กรุณากำหนดวันที่ลงข้อมูล');
    if (!formData.studentStatus) errors.push('กรุณาเลือกสถานภาพนักเรียน');
    
    // Only validate educationLevel and major if studentStatus is 'degree'
    if (formData.studentStatus === 'degree') {
      if (!formData.educationLevel) errors.push('กรุณาเลือกระดับที่ศึกษา');
      if (!formData.major) errors.push('กรุณากรอกสาขาวิชาที่ศึกษา');
    }
    
    if (!formData.titlePrefix) errors.push('กรุณาเลือกคำนำหน้าชื่อ');
    if (!formData.thaiName) errors.push('กรุณากรอกชื่อจริง-นามสกุลภาษาไทย');
    if (!formData.englishName) errors.push('กรุณากรอกชื่อจริง-นามสกุลภาษาอังกฤษ');
    if (!formData.dateOfBirth) errors.push('กรุณากรอกวันเกิด');
    if (!formData.phone) errors.push('กรุณากรอกหมายเลขโทรศัพท์');
    if (!formData.email) errors.push('กรุณากรอกอีเมล');
    if (!formData.completionDate) errors.push('กรุณากรอกวันที่สำเร็จการศึกษา');
    if (!formData.university) errors.push('กรุณากรอกมหาวิทยาลัยที่ศึกษา');
    if (!formData.fundingType) errors.push('กรุณาเลือกช่องทางการศึกษาต่อที่เกาหลี');
    if (!formData.region) errors.push('กรุณาเลือกภูมิภาค');
    if (!formData.certificateLink) errors.push('กรุณากรอกลิงก์เอกสารรับรอง');

    // Validate Date Format
    if (formData.recordDate && !Auth.validateDate(formData.recordDate)) {
      errors.push('วันที่ลงข้อมูล ต้องเป็นรูปแบบ YYYY-MM-DD');
    }
    if (formData.dateOfBirth && !Auth.validateDate(formData.dateOfBirth)) {
      errors.push('วันเกิด ต้องเป็นรูปแบบ YYYY-MM-DD');
    }
    if (formData.completionDate && !Auth.validateDate(formData.completionDate)) {
      errors.push('วันที่สำเร็จการศึกษา ต้องเป็นรูปแบบ YYYY-MM-DD');
    }

    // Validate Email
    if (formData.email && !Auth.validateEmail(formData.email)) {
      errors.push('อีเมล ไม่ถูกต้อง');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  static getFormData(form) {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  }
}

// ========== Utility Functions ==========
function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return '-';
  
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear(); // ค.ศ.
  
  return `${day} ${month} ${year}`;
}

// ฟอร์แมตวัน-เวลาที่อัปโหลด (ไทม์โซนเกาหลี Asia/Seoul)
function formatUploadDateKST(raw) {
  if (!raw) return '';

  // แปลง input ให้เป็น Date ก่อน
  const date = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(date.getTime())) return '';

  try {
    // ใช้ปฏิทิน gregory (ปี ค.ศ.) + locale ไทย + timeZone เกาหลี
    const formatter = new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
      timeZone: 'Asia/Seoul',   // ไทม์โซนเกาหลี
      day: 'numeric',           // 1, 2, 3 ...
      month: 'long',            // ธันวาคม
      year: 'numeric',          // 2024
      hour: '2-digit',          // 00–23
      minute: '2-digit',        // 00–59
      hourCycle: 'h23',         // บังคับ 24 ชม.
    });

    // ใช้ formatToParts เพื่อตัดคำพวก "น." / "," ออก
    const parts = formatter.formatToParts(date);
    const day    = parts.find(p => p.type === 'day')?.value ?? '';
    const month  = parts.find(p => p.type === 'month')?.value ?? '';
    const year   = parts.find(p => p.type === 'year')?.value ?? '';
    const hour   = parts.find(p => p.type === 'hour')?.value ?? '';
    const minute = parts.find(p => p.type === 'minute')?.value ?? '';

    if (!day || !month || !year || !hour || !minute) return '';

    return `${day} ${month} ${year} ${hour}:${minute}`; // เช่น "1 ธันวาคม 2024 18:42"
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  const container = document.querySelector('.main-content');
  container.insertBefore(alertDiv, container.firstChild);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Toast Notification System - Floating, non-blocking, top-center
function showToast(message, type = 'success') {
  // สร้าง toast container ถ้ายังไม่มี
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  // ลบ toast เก่าทั้งหมดออกก่อน (เพื่อไม่ให้ซ้อนกัน)
  while (toastContainer.firstChild) {
    toastContainer.firstChild.remove();
  }

  // สร้าง toast element
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
  `;

  // เพิ่มไอคอนตามประเภท
  let icon = '✓';
  let iconColor = '#4CAF50';
  if (type === 'error') {
    icon = '✕';
    iconColor = '#f44336';
  } else if (type === 'info') {
    icon = 'ℹ';
    iconColor = '#2196F3';
  } else if (type === 'warning') {
    icon = '⚠';
    iconColor = '#FF9800';
  }

  toast.innerHTML = `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${iconColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      flex-shrink: 0;
    ">${icon}</div>
    <div style="flex: 1; font-size: 15px;">${message}</div>
    <button onclick="this.parentElement.remove()" style="
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    " title="ปิด">×</button>
  `;

  toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Auto close after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
      // ลบ container ถ้าไม่มี toast เหลืออยู่
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    }, 300);
  }, 3000);
}

function copyToClipboard(text, element) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = element.textContent;
    element.textContent = 'คัดลอกแล้ว';
    element.classList.add('copied');
    
    setTimeout(() => {
      element.textContent = originalText;
      element.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    showToast('ไม่สามารถคัดลอกได้', 'error');
  });
}

function copyAllEmails(category) {
  let emails = [];
  
  if (category === 'all') {
    emails = db.getAllEmails();
  } else if (category === 'ordinary') {
    emails = db.getOrdinaryEmails();
  } else if (category === 'associate') {
    emails = db.getAssociateEmails();
  }
  
  if (emails.length === 0) {
    showToast('ไม่มีอีเมลให้คัดลอก', 'warning');
    return;
  }
  
  const emailText = emails.join(', ');
  
  navigator.clipboard.writeText(emailText).then(() => {
    showToast(`คัดลอกอีเมลทั้งหมด ${emails.length} รายการแล้ว`, 'success');
  }).catch(err => {
    showToast('ไม่สามารถคัดลอกได้', 'error');
  });
}

function switchPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show selected page
  const selectedPage = document.getElementById(pageName);
  if (selectedPage) {
    selectedPage.classList.add('active');
  }

  // Update active nav
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`[data-page="${pageName}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

// Export for use
const db = new MemberDB();
