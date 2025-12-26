// js/student.js

let data = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let total = 0;

let timer;
let timeLeft = 60;

let studentId = "";
let studentName = "";
let selectedMaterial = "";

// لتجميع درجات المهارات
let skillStats = {}; 
// الشكل المتوقع:
// skillStats = {
//   "تناظر لفظي": { correct: 0, total: 0 },
//   "الخطأ السياقي": { correct: 0, total: 0 },
//   ...
// }

// 1) استرجاع بيانات الجلسة من index
const sessionDataRaw = sessionStorage.getItem("currentSession");
if (!sessionDataRaw) {
    alert("لا توجد جلسة نشطة، الرجاء الدخول من الصفحة الرئيسية.");
    window.location.href = "index.html";
} else {
    const sessionData = JSON.parse(sessionDataRaw);
    studentId = sessionData.id;
    studentName = sessionData.name;
    selectedMaterial = sessionData.material;

    document.getElementById("studentInfo").innerHTML = `
        <p><b>الطالب:</b> ${studentName} (${studentId})</p>
        <p><b>المادة:</b> ${selectedMaterial}</p>
    `;
}

// 2) تحميل الأسئلة
fetch("data/questions.json")
  .then(res => res.json())
  .then(json => {
      data = json;
      const selected = data.find(m => m.name === selectedMaterial);

      if (!selected) {
          alert("لم يتم العثور على أسئلة لهذه المادة");
          window.location.href = "index.html";
          return;
      }

      currentQuestions = selected.questions;
      total = currentQuestions.length;

      // تهيئة skillStats من ملف الأسئلة
      currentQuestions.forEach(q => {
          if (!skillStats[q.skill]) {
              skillStats[q.skill] = { correct: 0, total: 0 };
          }
          skillStats[q.skill].total++;
      });

      loadQuestion();
  })
  .catch(err => {
      console.error("خطأ في تحميل questions.json", err);
      alert("خطأ في تحميل الأسئلة");
  });

// 3) تحميل سؤال
function loadQuestion() {
    const q = currentQuestions[currentIndex];

    if (!q) {
        clearInterval(timer);
        saveResult();
        showFinalResult();
        return;
    }

    timeLeft = 60;
    clearInterval(timer);

    document.getElementById("quizArea").innerHTML = `
        <h3>${q.q}</h3>

        <div style="font-size:20px; margin:10px; color:#d00;">
            الوقت المتبقي: <span id="timer">${timeLeft}</span> ثانية
        </div>

        <div class="option" onclick="checkAnswer(0, this)">${q.a}</div>
        <div class="option" onclick="checkAnswer(1, this)">${q.b}</div>
        <div class="option" onclick="checkAnswer(2, this)">${q.c}</div>
        <div class="option" onclick="checkAnswer(3, this)">${q.d}</div>
    `;

    timer = setInterval(() => {
        timeLeft--;
        const tEl = document.getElementById("timer");
        if (tEl) tEl.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timer);
            // سؤال منتهي بدون إجابة → فقط ننتقل للتالي
            currentIndex++;
            loadQuestion();
        }
    }, 1000);
}

// 4) التحقق من الإجابة (بدون إظهار الإجابة الصحيحة)
window.checkAnswer = function(choice, element) {
    clearInterval(timer);

    const q = currentQuestions[currentIndex];
    const correct = q.correct;

    // تحديث المهارة
    if (choice === correct) {
        element.classList.add("correct");
        score++;
        if (skillStats[q.skill]) {
            skillStats[q.skill].correct++;
        }
    } else {
        element.classList.add("wrong");
    }

    // منع تغيير الاختيار بعد النقر
    const options = document.querySelectorAll(".option");
    options.forEach(opt => opt.onclick = null);

    setTimeout(() => {
        currentIndex++;
        loadQuestion();
    }, 600);
};

// 5) حفظ النتيجة في localStorage مع attemptNumber
function saveResult() {
    // تحديد رقم المحاولة لهذه المادة
    const attemptsKey = `${studentId}_${selectedMaterial}_attempts`;
    let attemptsCount = Number(localStorage.getItem(attemptsKey) || "0");
    attemptsCount++;
    localStorage.setItem(attemptsKey, attemptsCount.toString());

    // حساب نسبة كل مهارة
    let skillsResult = {};
    const skillNames = Object.keys(skillStats);
    skillNames.forEach(skillName => {
        const st = skillStats[skillName];
        const percent = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
        skillsResult[skillName] = {
            correct: st.correct,
            total: st.total,
            percent: percent
        };
    });

    const result = {
        id: studentId,
        name: studentName,
        material: selectedMaterial,
        score: score,
        total: total,
        percent: total > 0 ? Math.round((score / total) * 100) : 0,
        attempt: attemptsCount,
        skills: skillsResult,
        date: new Date().toISOString()
    };

    const resultKey = `${studentId}_${selectedMaterial}_attempt_${attemptsCount}`;
    localStorage.setItem(resultKey, JSON.stringify(result));
}

// 6) عرض النتيجة النهائية + زر إعادة الاختبار
function showFinalResult() {
    let skillHtml = "";
    const skillNames = Object.keys(skillStats);

    skillNames.forEach(skillName => {
        const st = skillStats[skillName];
        const percent = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
        skillHtml += `
            <p><b>${skillName}:</b> ${st.correct} من ${st.total} (${percent}%)</p>
        `;
    });

    document.getElementById("quizArea").innerHTML = `
        <h3>انتهى الاختبار</h3>
        <p>الطالب: <b>${studentName}</b></p>
        <p>درجتك: ${score} من ${total}</p>
        <p>النسبة العامة: ${total > 0 ? Math.round((score / total) * 100) : 0}%</p>
        <hr />
        <h4>درجات المهارات:</h4>
        ${skillHtml}
    `;

    const retryBtn = document.getElementById("retryBtn");
    retryBtn.style.display = "inline-block";
    retryBtn.onclick = () => {
        // إعادة ضبط كل شيء ثم إعادة الاختبار
        currentIndex = 0;
        score = 0;
        // إعادة تهيئة المهارات
        Object.keys(skillStats).forEach(skillName => {
            skillStats[skillName].correct = 0;
            // total يبقى كما هو
        });
        retryBtn.style.display = "none";
        loadQuestion();
    };
}
