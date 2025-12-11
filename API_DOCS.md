# API Documentation - Member Management System

## Database Operations

### MemberDB Class

#### Methods

##### `addMember(memberData)`
เพิ่มหรือแก้ไขข้อมูลสมาชิก

**Parameters:**
```javascript
{
  id: string (optional, auto-generated if null),
  recordDate: string (YYYY-MM-DD),
  studentStatus: string,
  educationLevel: string,
  major: string,
  titlePrefix: string,
  thaiName: string,
  thaiNickname: string (optional),
  englishName: string,
  englishNickname: string (optional),
  dateOfBirth: string (YYYY-MM-DD),
  phone: string,
  email: string,
  address: string (optional),
  completionDate: string (YYYY-MM-DD),
  university: string,
  certificateLink: string (optional),
  scholarship: string (optional),
  region: string
}
```

**Returns:** Updated member object

**Example:**
```javascript
const newMember = db.addMember({
  recordDate: '2025-02-10',
  studentStatus: 'degree',
  educationLevel: 'ปริญญาโท',
  major: 'Computer Science',
  titlePrefix: 'นาย',
  thaiName: 'สมชาย ใจดี',
  englishName: 'Somchai Jaidee',
  dateOfBirth: '2000-05-10',
  phone: '010-1234-5678',
  email: 'somchai@example.com',
  completionDate: '2026-02-28',
  university: 'Seoul National University',
  region: '서울특별시 (โซล)'
});
```

---

##### `getMember(id)`
ดึงข้อมูลสมาชิกจากรหัส

**Parameters:**
- `id` (string): รหัสสมาชิก

**Returns:** Member object or undefined

**Example:**
```javascript
const member = db.getMember('1234567890');
console.log(member.thaiName);
```

---

##### `getAllMembers()`
ดึงข้อมูลสมาชิกทั้งหมด

**Returns:** Array of member objects

**Example:**
```javascript
const members = db.getAllMembers();
console.log(`Total members: ${members.length}`);
```

---

##### `deleteMember(id)`
ลบข้อมูลสมาชิก

**Parameters:**
- `id` (string): รหัสสมาชิก

**Returns:** void

**Example:**
```javascript
db.deleteMember('1234567890');
```

---

##### `calculateStatus(completionDate)`
คำนวณสถานะจากวันที่สำเร็จการศึกษา

**Parameters:**
- `completionDate` (string): YYYY-MM-DD

**Returns:** string ('กำลังศึกษา' or 'สำเร็จการศึกษา')

**Logic:**
```
if (completionDate > today) {
  return 'กำลังศึกษา'
} else {
  return 'สำเร็จการศึกษา'
}
```

---

##### `calculateMemberStatus(status)`
คำนวณสถานะสมาชิกจากสถานะการศึกษา

**Parameters:**
- `status` (string): สถานะ

**Returns:** string ('สมาชิกสามัญ' or 'สมาชิกวิสามัญ')

**Logic:**
```
if (status === 'กำลังศึกษา') {
  return 'สมาชิกสามัญ'
} else if (status === 'สำเร็จการศึกษา') {
  return 'สมาชิกวิสามัญ'
}
```

---

##### `getOrdinaryEmails()`
ดึงอีเมลของสมาชิกสามัญทั้งหมด

**Returns:** Array of email strings

**Example:**
```javascript
const emails = db.getOrdinaryEmails();
console.log(emails.join(', ')); // send to mailing list
```

---

##### `getAssociateEmails()`
ดึงอีเมลของสมาชิกวิสามัญทั้งหมด

**Returns:** Array of email strings

---

##### `getStatistics()`
ดึงสถิติสมาชิก

**Returns:**
```javascript
{
  totalMembers: number,
  educationLevel: {
    'ปริญญาตรี': 5,
    'ปริญญาโท': 3,
    // ...
  },
  status: {
    'กำลังศึกษา': 6,
    'สำเร็จการศึกษา': 2,
    // ...
  },
  memberStatus: {
    'สมาชิกสามัญ': 6,
    'สมาชิกวิสามัญ': 2
  },
  scholarships: {
    'Samsung Scholarship': 2,
    // ...
  },
  universities: {
    'Seoul National University': 2,
    // ...
  },
  regions: {
    '서울특별시 (โซล)': 3,
    // ...
  }
}
```

---

## Authentication API

### Auth Class

#### Methods

##### `login(username, password)`
ตรวจสอบการเข้าสู่ระบบ

**Parameters:**
- `username` (string)
- `password` (string)

**Returns:** User object or null

**Demo Credentials:**
```javascript
{
  username: 'admin',
  password: 'admin123'
}
```

---

##### `validateEmail(email)`
ตรวจสอบรูปแบบอีเมล

**Parameters:**
- `email` (string)

**Returns:** boolean

**Example:**
```javascript
Auth.validateEmail('test@example.com') // true
Auth.validateEmail('invalid') // false
```

---

##### `validatePhone(phone)`
ตรวจสอบรูปแบบโทรศัพท์

**Parameters:**
- `phone` (string)

**Returns:** boolean

**Rules:** 9-15 digits

---

##### `validateDate(dateString)`
ตรวจสอบรูปแบบวันที่

**Parameters:**
- `dateString` (string): YYYY-MM-DD

**Returns:** boolean

---

## Form Validation API

### FormValidator Class

#### Methods

##### `validateMemberForm(formData)`
ตรวจสอบข้อมูลฟอร์มสมาชิก

**Parameters:**
- `formData` (object): ข้อมูลจากฟอร์ม

**Returns:**
```javascript
{
  isValid: boolean,
  errors: [string] // array of error messages
}
```

**Validation Rules:**
- ฟิลด์ที่จำเป็น (required)
- รูปแบบวันที่ (YYYY-MM-DD)
- รูปแบบอีเมล
- ตัวเลขโทรศัพท์ (9-15 digits)

---

##### `getFormData(form)`
แปลงข้อมูล FormData เป็น object

**Parameters:**
- `form` (HTMLFormElement)

**Returns:** Object with form field values

---

## UI Functions

### Page Management

#### `switchPage(pageName)`
เปลี่ยนหน้าที่แสดง

**Parameters:**
- `pageName` (string): 'membersPage', 'emailPage', 'statisticsPage'

**Example:**
```javascript
switchPage('membersPage');
```

---

#### `renderMembersTable()`
แสดงตารางรายชื่อสมาชิก

---

#### `renderEmailPage()`
แสดงหน้าอีเมลแยกตามประเภท

---

#### `renderStatisticsPage()`
แสดงหน้าสถิติทั้งหมด

---

### Modal Management

#### `openMemberModal()`
เปิด modal สำหรับดู/แก้ไขสมาชิก

---

#### `closeMemberModal()`
ปิด modal

---

### Alert Functions

#### `showAlert(message, type)`
แสดงการแจ้งเตือน

**Parameters:**
- `message` (string)
- `type` (string): 'success', 'error', 'warning', 'info'

**Example:**
```javascript
showAlert('Data saved successfully', 'success');
showAlert('Something went wrong', 'error');
```

---

## Utility Functions

#### `formatDate(dateString)`
แปลงวันที่เป็นรูปแบบอ่านได้

**Parameters:**
- `dateString` (string): YYYY-MM-DD

**Returns:** string (Thai format)

**Example:**
```javascript
formatDate('2025-02-10')
// Output: '10 กุมภาพันธ์ 2568'
```

---

#### `copyToClipboard(text, element)`
คัดลอกข้อความไปยัง clipboard

**Parameters:**
- `text` (string)
- `element` (HTMLElement): ปุ่มที่ใช้คัดลอก

---

## Storage API

### LocalStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `members_data` | JSON String | ข้อมูลสมาชิก |
| `current_user` | JSON String | ข้อมูลผู้ใช้ปัจจุบัน |

---

## Event Handlers

### Form Events
- `memberForm` submit - บันทึกข้อมูลสมาชิก
- `completionDate` change - คำนวณสถานะอัตโนมัติ

### Navigation Events
- `.nav-link` click - เปลี่ยนหน้า
- `#addMemberBtn` click - เปิด modal เพิ่มสมาชิก
- `#logoutBtn` click - ออกจากระบบ

### Modal Events
- Close button - ปิด modal
- Outside click - ปิด modal
- ESC key - ปิด modal

---

## Data Flow Diagram

```
User Input (Form)
      ↓
FormValidator.validateMemberForm()
      ↓ (Valid)
MemberDB.addMember()
      ↓
Calculate Status/Member Status
      ↓
Save to localStorage
      ↓
Render UI Functions
      ↓
Display Updated Data
```

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Performance Notes

- **LocalStorage Limit:** ~5-10MB per domain
- **Load Time:** < 100ms (local storage)
- **Render Time:** < 500ms (for 1000 members)

---

## Future Enhancements

- Backend API integration
- Database support (MongoDB, MySQL)
- User roles and permissions
- Data export (CSV, PDF)
- Advanced search and filtering
- Email notifications
- Mobile app
- Multi-language support
