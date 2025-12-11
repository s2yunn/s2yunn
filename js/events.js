// ========== Event Handlers ==========

// Login Form
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const user = Auth.login(username, password);
      
      if (user) {
        db.saveUser(user);
        db.currentUser = user;
        
        // Show main app, hide login
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('mainApp').style.display = 'flex';
        
        renderMembersTable();
        renderEmailPage();
        renderStatisticsPage();
        
        // Load last viewed page or default to membersPage
        const lastPage = db.loadCurrentPage();
        switchPage(lastPage);
        
        showAlert(`ยินดีต้อนรับ ${username}!`, 'success');
      } else {
        showAlert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
      }
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
        db.clearUser();
        db.currentUser = null;
        
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('mainApp').style.display = 'none';
        
        document.getElementById('loginForm').reset();
        
        showAlert('ออกจากระบบสำเร็จ', 'success');
      }
    });
  }

  // Navigation Links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.dataset.page;
      switchPage(page);
      db.saveCurrentPage(page);  // Save current page
    });
  });

  // Add Member Button
  const addMemberBtn = document.getElementById('addMemberBtn');
  if (addMemberBtn) {
    addMemberBtn.addEventListener('click', addNewMember);
  }

  // Member Form Submit
  const memberForm = document.getElementById('memberForm');
  if (memberForm) {
    memberForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = FormValidator.getFormData(this);
      const validation = FormValidator.validateMemberForm(formData);
      
      if (!validation.isValid) {
        // Show validation errors as popup modal instead of alerts
        showValidationErrorModal(validation.errors);
        return;
      }
      
      // Convert date inputs to YYYY-MM-DD format
      const memberData = {
        id: this.dataset.memberId || null,
        recordDate: formData.recordDate,
        studentStatus: formData.studentStatus,
        educationLevel: formData.educationLevel,
        major: formData.major,
        titlePrefix: formData.titlePrefix,
        thaiName: formData.thaiName,
        thaiNickname: formData.thaiNickname,
        englishName: formData.englishName,
        englishNickname: formData.englishNickname,
        dateOfBirth: formData.dateOfBirth,
        countryCode: formData.countryCode,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        completionDate: formData.completionDate,
        university: formData.university,
        status: db.calculateStatus(formData.completionDate),
        memberStatus: db.calculateMemberStatus(db.calculateStatus(formData.completionDate)),
        certificateLink: formData.certificateLink,
        fundingType: formData.fundingType,
        scholarship: formData.scholarship,
        region: formData.region
      };
      
      // Auto-calculate status fields
      memberData.status = db.calculateStatus(memberData.completionDate);
      memberData.memberStatus = db.calculateMemberStatus(memberData.status);
      
      const savedMember = db.addMember(memberData);
      
      renderMembersTable();
      renderEmailPage();
      renderStatisticsPage();
      renderUpdatePage();
      
      closeMemberModal();
      
      const message = this.dataset.memberId ? 'อัปเดตข้อมูลสมาชิกสำเร็จ' : 'เพิ่มสมาชิกใหม่สำเร็จ';
      showAlert(message, 'success');
    });
  }

  // Close Modal on outside click
  const modal = document.getElementById('memberModal');
  if (modal) {
    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeMemberModal();
      }
    });
  }

  // Handle studentStatus change to show/hide educationLevel field and major field
  const studentStatusSelect = document.getElementById('studentStatus');
  const educationLevelGroup = document.getElementById('educationLevelGroup');
  const educationLevelSelect = document.getElementById('educationLevel');
  const majorGroup = document.getElementById('majorGroup');
  const majorInput = document.getElementById('major');
  
  if (studentStatusSelect && educationLevelGroup && educationLevelSelect && majorGroup && majorInput) {
    studentStatusSelect.addEventListener('change', function() {
      const selectedValue = this.value;
      
      // Show both fields only when degree option is selected
      if (selectedValue === 'degree') {
        educationLevelGroup.style.display = '';
        educationLevelSelect.setAttribute('required', 'required');
        majorGroup.style.display = '';
        majorInput.setAttribute('required', 'required');
      } else {
        educationLevelGroup.style.display = 'none';
        educationLevelSelect.removeAttribute('required');
        educationLevelSelect.value = '';
        majorGroup.style.display = 'none';
        majorInput.removeAttribute('required');
        majorInput.value = '';
      }
    });
  }

  // Handle educationChannel change to toggle scholarship field requirement
  const educationChannelSelect = document.getElementById('educationChannel');
  const scholarshipInput = document.getElementById('scholarship');
  
  if (educationChannelSelect && scholarshipInput) {
    educationChannelSelect.addEventListener('change', function() {
      const selectedValue = this.value;
      
      // ทุนการศึกษา = enabled & required with placeholder, ทุนส่วนตัว & ไม่ระบุ = disabled without placeholder
      if (selectedValue === 'ทุนการศึกษา') {
        scholarshipInput.removeAttribute('disabled');
        scholarshipInput.setAttribute('required', 'required');
        scholarshipInput.setAttribute('placeholder', 'เช่น Global Korea Scholarship');
        scholarshipInput.style.backgroundColor = '';
        scholarshipInput.style.cursor = 'text';
      } else if (selectedValue === 'ทุนส่วนตัว' || selectedValue === 'ไม่ระบุ') {
        scholarshipInput.setAttribute('disabled', 'disabled');
        scholarshipInput.removeAttribute('required');
        scholarshipInput.setAttribute('placeholder', '');
        scholarshipInput.value = '';
        scholarshipInput.style.backgroundColor = '#f0f0f0';
        scholarshipInput.style.cursor = 'not-allowed';
      }
    });
  }
});

// Demo Data Button (Optional - for testing)
function loadDemoData() {
  const demoMembers = [
    {
      recordDate: '2025-01-15',
      studentStatus: 'degree',
      educationLevel: 'ปริญญาโท',
      major: 'Computer Science',
      titlePrefix: 'นาย',
      thaiName: 'สมชาย ใจดี',
      thaiNickname: 'ชาย',
      englishName: 'Somchai Jaidee',
      englishNickname: 'Chai',
      dateOfBirth: '2000-05-10',
      phone: '010-1234-5678',
      email: 'somchai@example.com',
      address: 'Seoul, Korea',
      completionDate: '2026-02-28',
      university: 'Seoul National University',
      scholarship: 'Samsung Scholarship',
      region: '서울특별시 (โซล)'
    },
    {
      recordDate: '2025-01-20',
      studentStatus: 'language',
      educationLevel: 'ปริญญาตรี',
      major: 'Korean Language',
      titlePrefix: 'นางสาว',
      thaiName: 'สมหญิง สวยใจ',
      thaiNickname: 'หญิง',
      englishName: 'Somying Suwayjai',
      englishNickname: 'Ying',
      dateOfBirth: '1999-08-20',
      phone: '010-9876-5432',
      email: 'somying@example.com',
      address: 'Busan, Korea',
      completionDate: '2024-12-31',
      university: 'Pusan National University',
      scholarship: 'Government Scholarship',
      region: '부산광역시 (ปูซาน)'
    },
    {
      recordDate: '2025-02-01',
      studentStatus: 'degree',
      educationLevel: 'ปริญญาโท',
      major: 'Business Administration',
      titlePrefix: 'นาย',
      thaiName: 'ประเทศ เจริงสัตย์',
      thaiNickname: 'เทศ',
      englishName: 'Pratheep Jerengsart',
      englishNickname: 'Therd',
      dateOfBirth: '2001-03-15',
      phone: '010-5555-6666',
      email: 'pratheep@example.com',
      address: 'Incheon, Korea',
      completionDate: '2025-06-30',
      university: 'Hankuk University of Foreign Studies',
      scholarship: '',
      region: '인천광역시 (อินชอน)'
    }
  ];

  demoMembers.forEach(memberData => {
    memberData.status = db.calculateStatus(memberData.completionDate);
    memberData.memberStatus = db.calculateMemberStatus(memberData.status);
    db.addMember(memberData);
  });

  renderMembersTable();
  renderEmailPage();
  renderStatisticsPage();
  
  showAlert('โหลดข้อมูลตัวอย่างสำเร็จ', 'success');
}

// Add Demo Data Button to UI (Optional)
document.addEventListener('DOMContentLoaded', function() {
  const mainApp = document.getElementById('mainApp');
  if (mainApp && db.currentUser) {
    // Check if already has demo button
    if (!document.getElementById('demoBtnContainer')) {
      const demoContainer = document.createElement('div');
      demoContainer.id = 'demoBtnContainer';
      demoContainer.style.display = 'none'; // Hidden by default
      demoContainer.innerHTML = '<button class="btn btn-outline" onclick="loadDemoData()" style="position: fixed; bottom: 20px; right: 20px; z-index: 100;">📊 โหลดข้อมูลตัวอย่าง</button>';
      document.body.appendChild(demoContainer);
    }
  }
});

// Email Tab Switching
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('email-tab') || e.target.closest('.email-tab')) {
    const tab = e.target.classList.contains('email-tab') ? e.target : e.target.closest('.email-tab');
    const category = tab.getAttribute('data-category');
    
    // Remove active class from all tabs
    document.querySelectorAll('.email-tab').forEach(t => t.classList.remove('active'));
    
    // Add active class to clicked tab
    tab.classList.add('active');
    
    // Hide all email categories
    document.querySelectorAll('.email-category').forEach(cat => cat.classList.remove('active'));
    
    // Show selected category
    if (category === 'all') {
      document.getElementById('allEmailSection').classList.add('active');
    } else if (category === 'ordinary') {
      document.getElementById('ordinaryEmailSection').classList.add('active');
    } else if (category === 'associate') {
      document.getElementById('associateEmailSection').classList.add('active');
    }
  }
});

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
  // ESC to close modal
  if (e.key === 'Escape') {
    closeMemberModal();
  }
  
  // Ctrl/Cmd + K to focus search (future enhancement)
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
  }
});

// Handle studentStatus change to toggle educationLevel and major requirements
document.addEventListener('DOMContentLoaded', function() {
  const studentStatusSelect = document.getElementById('studentStatus');
  const educationLevelSelect = document.getElementById('educationLevel');
  const majorInput = document.getElementById('major');
  const degreeFields = document.getElementById('degreeFields');
  
  if (studentStatusSelect && educationLevelSelect && majorInput && degreeFields) {
    function updateFieldRequirements() {
      const isDegreeStudent = studentStatusSelect.value === 'degree';
      
      // Show/hide degree fields
      if (isDegreeStudent) {
        degreeFields.style.display = 'block';
        educationLevelSelect.setAttribute('required', 'required');
        majorInput.setAttribute('required', 'required');
      } else {
        degreeFields.style.display = 'none';
        educationLevelSelect.removeAttribute('required');
        majorInput.removeAttribute('required');
        // Clear values when not required
        if (studentStatusSelect.value === 'language') {
          educationLevelSelect.value = '';
          majorInput.value = '';
        }
      }
    }
    
    // Initial check
    updateFieldRequirements();
    
    // Listen for changes
    studentStatusSelect.addEventListener('change', updateFieldRequirements);
  }
  
  // Handle country code change to update phone placeholder and pattern
  const countryCodeSelect = document.getElementById('countryCode');
  const phoneInput = document.getElementById('phone');
  
  if (countryCodeSelect && phoneInput) {
    function updatePhonePattern() {
      const countryCode = countryCodeSelect.value;
      
      if (countryCode === '+82') {
        phoneInput.placeholder = '000-0000-0000';
        phoneInput.pattern = '[0-9]{3}-[0-9]{4}-[0-9]{4}';
        phoneInput.title = 'เช่น 010-1234-5678 (รูปแบบ 000-0000-0000)';
      } else if (countryCode === '+66') {
        phoneInput.placeholder = '000-000-0000';
        phoneInput.pattern = '[0-9]{3}-[0-9]{3}-[0-9]{4}';
        phoneInput.title = 'เช่น 081-234-5678 (รูปแบบ 000-000-0000)';
      }
    }
    
    function formatPhoneNumber(value, countryCode) {
      // Remove all non-digit characters
      const digits = value.replace(/\D/g, '');
      
      if (countryCode === '+82') {
        // Format: 000-0000-0000
        if (digits.length <= 3) {
          return digits;
        } else if (digits.length <= 7) {
          return digits.slice(0, 3) + '-' + digits.slice(3);
        } else {
          return digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7, 11);
        }
      } else if (countryCode === '+66') {
        // Format: 000-000-0000
        if (digits.length <= 3) {
          return digits;
        } else if (digits.length <= 6) {
          return digits.slice(0, 3) + '-' + digits.slice(3);
        } else {
          return digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
        }
      }
      
      return digits;
    }
    
    // Auto-format phone number as user types
    phoneInput.addEventListener('input', function(e) {
      const cursorPosition = this.selectionStart;
      const oldValue = this.value;
      const oldLength = oldValue.length;
      
      const countryCode = countryCodeSelect.value;
      const formatted = formatPhoneNumber(this.value, countryCode);
      
      this.value = formatted;
      
      // Adjust cursor position after formatting
      const newLength = formatted.length;
      const diff = newLength - oldLength;
      
      // Keep cursor in the right position
      if (diff > 0 && cursorPosition === oldLength) {
        this.selectionStart = this.selectionEnd = newLength;
      } else if (diff > 0) {
        this.selectionStart = this.selectionEnd = cursorPosition + diff;
      } else {
        this.selectionStart = this.selectionEnd = cursorPosition;
      }
    });
    
    // Initial check
    updatePhonePattern();
    
    // Listen for changes
    countryCodeSelect.addEventListener('change', function() {
      updatePhonePattern();
      // Reformat phone number when country code changes
      if (phoneInput.value) {
        const formatted = formatPhoneNumber(phoneInput.value, countryCodeSelect.value);
        phoneInput.value = formatted;
      }
    });
  }

  // Handle funding type change to show/hide scholarship field
  const fundingTypeSelect = document.getElementById('fundingType');
  const scholarshipField = document.getElementById('scholarshipField');
  const scholarshipInput = document.getElementById('scholarship');
  
  if (fundingTypeSelect && scholarshipField && scholarshipInput) {
    function updateScholarshipField() {
      const isScholarship = fundingTypeSelect.value === 'ทุนการศึกษา';
      
      if (isScholarship) {
        scholarshipField.style.display = 'block';
        scholarshipInput.setAttribute('required', 'required');
      } else {
        scholarshipField.style.display = 'none';
        scholarshipInput.removeAttribute('required');
        // Clear value when not required
        if (fundingTypeSelect.value === 'ทุนส่วนตัว') {
          scholarshipInput.value = '';
        }
      }
    }
    
    // Initial check
    updateScholarshipField();
    
    // Listen for changes
    fundingTypeSelect.addEventListener('change', updateScholarshipField);
  }
});
