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

  // Add or Update Member
  addMember(memberData) {
    if (memberData.id) {
      const index = this.members.findIndex(m => m.id === memberData.id);
      if (index > -1) {
        // Preserve statusChangedYear if it exists, unless explicitly removed
        const existingMember = this.members[index];
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
        this.members[index] = memberData;
      } else {
        this.members.push(memberData);
      }
    } else {
      memberData.id = Date.now().toString();
      this.members.push(memberData);
    }
    
    // Auto-calculate status
    memberData.status = this.calculateStatus(memberData.completionDate);
    memberData.memberStatus = this.calculateMemberStatus(memberData.status);

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
  const options = { year: 'numeric', month: 'long', day: 'numeric', locale: 'th-TH' };
  return date.toLocaleDateString('th-TH', options);
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
    showAlert('ไม่สามารถคัดลอกได้', 'error');
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
    showAlert('ไม่มีอีเมลให้คัดลอก', 'warning');
    return;
  }
  
  const emailText = emails.join(', ');
  
  navigator.clipboard.writeText(emailText).then(() => {
    showAlert(`คัดลอกอีเมลทั้งหมด ${emails.length} รายการแล้ว`, 'success');
  }).catch(err => {
    showAlert('ไม่สามารถคัดลอกได้', 'error');
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
