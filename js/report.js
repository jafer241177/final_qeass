// ===============================
// 1) التحقق من هوية المعلم
// ===============================

const TEACHER_ID = "9999999999";

const sessionDataRaw = sessionStorage.getItem("currentSession");

if (!sessionDataRaw) {
    alert("غير مصرح لك بالدخول");
    window.location.href = "index.html";
}

const sessionData = JSON.parse(sessionDataRaw);

if (sessionData.id !== TEACHER_ID) {
    alert("هذه الصفحة خاصة بالمعلم فقط");
    window.location.href = "index.html";
}

// عرض اسم المعلم
document.getElementById("teacherInfo").innerHTML =
    `<p><b>المعلم:</b> ${sessionData.name}</p>`;


// ===============================
// 2) المتغيرات الأساسية
// ===============================

let allResults = [];
let allMaterials = new Set();
let allStudents = new Set();
let allAttempts = new Set();
let allSkills = new Set();


// ===============================
// 3) تحميل النتائج من localStorage
// ===============================

for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key.includes("_attempt_")) {
        try {
            const r = JSON.parse(localStorage.getItem(key));
            allResults.push(r);

            allMaterials.add(r.material);
            allStudents.add(r.name);
            allAttempts.add(r.attempt);

            // تجميع المهارات
            Object.keys(r.skills).forEach(skill => allSkills.add(skill));

        } catch {}
    }
}


// ===============================
// 4) تعبئة الفلاتر بعد تحميل النتائج
// ===============================

// تعبئة قائمة المواد
const matSelect = document.getElementById("filterMaterial");
Array.from(allMaterials).forEach(m => {
    matSelect.innerHTML += `<option value="${m}">${m}</option>`;
});

// تعبئة قائمة الطلاب
const stuSelect = document.getElementById("filterStudent");
Array.from(allStudents).forEach(s => {
    stuSelect.innerHTML += `<option value="${s}">${s}</option>`;
});

// تعبئة قائمة المحاولات
const attSelect = document.getElementById("filterAttempt");
Array.from(allAttempts).forEach(a => {
    attSelect.innerHTML += `<option value="${a}">المحاولة ${a}</option>`;
});


// ===============================
// 5) دالة عرض التقرير حسب الفلاتر
// ===============================

function applyFilters() {
    const mat = document.getElementById("filterMaterial").value;
    const stu = document.getElementById("filterStudent").value;
    const att = document.getElementById("filterAttempt").value;

    let filtered = allResults;

    if (mat) filtered = filtered.filter(r => r.material === mat);
    if (stu) filtered = filtered.filter(r => r.name === stu);
    if (att) filtered = filtered.filter(r => r.attempt == att);

    renderTable(filtered);
}


// ===============================
// 6) دالة بناء جدول التقرير
// ===============================

function renderTable(results) {

    if (results.length === 0) {
        document.getElementById("reportArea").innerHTML =
            "<p>لا توجد نتائج مطابقة للبحث</p>";
        return;
    }

    let html = `
    <table>
    <tr>
        <th>رقم الهوية</th>
        <th>الاسم</th>
        <th>المادة</th>
        <th>المحاولة</th>
        <th>الدرجة</th>
        <th>النسبة</th>
        <th>التاريخ</th>
    `;

    // إضافة أعمدة المهارات
    Array.from(allSkills).forEach(skill => {
        html += `<th>${skill}</th>`;
    });

    html += `</tr>`;

    results.forEach(r => {
        html += `
        <tr>
            <td>${r.id}</td>
            <td>${r.name}</td>
            <td>${r.material}</td>
            <td>${r.attempt}</td>
            <td>${r.score} / ${r.total}</td>
            <td>${r.percent}%</td>
            <td>${new Date(r.date).toLocaleString("ar-SA")}</td>
        `;

        Array.from(allSkills).forEach(skill => {
            html += `<td>${r.skills[skill]?.percent ?? "-"}%</td>`;
        });

        html += `</tr>`;
    });

    html += `</table>`;

    document.getElementById("reportArea").innerHTML = html;
}


// ===============================
// 7) دوال لوحة التحكم
// ===============================

function goToReports() {
    window.location.href = "report.html";
}

function goToJson() {
    window.location.href = "json.html";
}

function goHome() {
    window.location.href = "index.html";
}


// ===============================
// 8) عرض كل النتائج عند فتح الصفحة
// ===============================

renderTable(allResults);
