/* ==========================================================================
   AIET Stationery Hub — Student OTP (Gmail / Phone) & Shopkeeper Secret Auth
   ========================================================================== */
window.AIET = window.AIET || {};

AIET.auth = (function () {
  let loginMethod = "gmail"; // 'gmail' | 'phone'
  let pendingOtp = null;
  let pendingContact = null;
  let pendingStudent = null;
  let countdownHandle = null;

  function generateOtp() {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return String(100000 + (arr[0] % 900000));
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function switchAuthRole(role) {
    const tabStudent = document.getElementById("tab-student-login");
    const tabShop = document.getElementById("tab-shopkeeper-login");
    const slider = document.getElementById("role-tab-slider");
    const panelStudent = document.getElementById("panel-student-login");
    const panelShop = document.getElementById("panel-shopkeeper-login");

    if (role === "shopkeeper") {
      tabStudent.classList.remove("active");
      tabShop.classList.add("active");
      slider.classList.add("right");
      panelStudent.classList.add("hidden");
      panelShop.classList.remove("hidden");
    } else {
      tabShop.classList.remove("active");
      tabStudent.classList.add("active");
      slider.classList.remove("right");
      panelShop.classList.add("hidden");
      panelStudent.classList.remove("hidden");
    }
  }

  function setStudentMethod(method) {
    loginMethod = method;
    const btnGmail = document.getElementById("btn-method-gmail");
    const btnPhone = document.getElementById("btn-method-phone");
    const groupGmail = document.getElementById("group-gmail-input");
    const groupPhone = document.getElementById("group-phone-input");

    if (method === "gmail") {
      btnGmail.classList.add("active");
      btnPhone.classList.remove("active");
      groupGmail.classList.remove("hidden");
      groupPhone.classList.add("hidden");
    } else {
      btnPhone.classList.add("active");
      btnGmail.classList.remove("active");
      groupPhone.classList.remove("hidden");
      groupGmail.classList.add("hidden");
    }
    AIET.sound.play("pop");
  }

  function startOtpTimer() {
    clearInterval(countdownHandle);
    let secs = 45;
    const timerText = document.getElementById("otp-countdown-text");
    const resendBtn = document.getElementById("btn-resend-otp");
    resendBtn.classList.add("hidden");
    timerText.classList.remove("hidden");
    timerText.innerHTML = `Resend OTP in <strong>${secs}s</strong>`;

    countdownHandle = setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(countdownHandle);
        timerText.classList.add("hidden");
        resendBtn.classList.remove("hidden");
      } else {
        timerText.innerHTML = `Resend OTP in <strong>${secs}s</strong>`;
      }
    }, 1000);
  }

  function showDemoOtpBanner(code, channelLabel) {
    const banner = document.getElementById("otp-inbox-banner");
    document.getElementById("otp-inbox-code").textContent = code;
    document.getElementById("otp-inbox-channel").textContent = channelLabel;
    banner.classList.remove("hidden");
  }

  function hideDemoOtpBanner() {
    document.getElementById("otp-inbox-banner").classList.add("hidden");
  }

  function clearOtpInputs() {
    document.querySelectorAll("#otp-boxes .otp-digit").forEach((inp) => {
      inp.value = "";
      inp.classList.remove("filled");
    });
  }

  function fillOtpInputs(code) {
    const boxes = document.querySelectorAll("#otp-boxes .otp-digit");
    code.split("").forEach((ch, idx) => {
      if (boxes[idx]) {
        boxes[idx].value = ch;
        boxes[idx].classList.add("filled");
      }
    });
    if (boxes[5]) boxes[5].focus();
  }

  function issueOtp() {
    pendingOtp = generateOtp();
    const channelLabel =
      loginMethod === "gmail"
        ? `via Gmail (${pendingContact})`
        : `via SMS (${pendingContact})`;

    document.getElementById("otp-target-label").textContent = pendingContact;
    document.getElementById("form-student-request-otp").classList.add("hidden");
    document.getElementById("form-student-verify-otp").classList.remove("hidden");

    clearOtpInputs();
    const firstBox = document.querySelector("#otp-boxes .otp-digit");
    if (firstBox) firstBox.focus();

    startOtpTimer();
    showDemoOtpBanner(pendingOtp, channelLabel);
    AIET.sound.play("pop");
    AIET.toast(`OTP sent to ${pendingContact}`, "success");
  }

  function bindOtpBoxes() {
    const boxes = Array.from(document.querySelectorAll("#otp-boxes .otp-digit"));
    boxes.forEach((box, idx) => {
      box.addEventListener("input", (e) => {
        const val = e.target.value.replace(/\D/g, "");
        e.target.value = val ? val[0] : "";
        e.target.classList.toggle("filled", Boolean(e.target.value));
        if (e.target.value && idx < boxes.length - 1) {
          boxes[idx + 1].focus();
        }
      });

      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && idx > 0) {
          boxes[idx - 1].focus();
        }
      });

      box.addEventListener("paste", (e) => {
        const pasted = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);
        if (pasted.length) {
          e.preventDefault();
          fillOtpInputs(pasted);
        }
      });
    });
  }

  function init(onLoginSuccess) {
    bindOtpBoxes();

    document.getElementById("tab-student-login").addEventListener("click", () => {
      switchAuthRole("student");
    });
    document.getElementById("tab-shopkeeper-login").addEventListener("click", () => {
      switchAuthRole("shopkeeper");
    });

    document.querySelectorAll(".quick-link-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = card.getAttribute("data-auth-tab");
        switchAuthRole(tab);
        document.querySelector(".auth-card").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    document.getElementById("btn-method-gmail").addEventListener("click", () => setStudentMethod("gmail"));
    document.getElementById("btn-method-phone").addEventListener("click", () => setStudentMethod("phone"));

    document.getElementById("form-student-request-otp").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("student-name").value.trim();
      const usn = document.getElementById("student-usn").value.trim().toUpperCase();
      if (!name) {
        AIET.toast("Please enter your student name.", "error");
        return;
      }

      if (loginMethod === "gmail") {
        const gmail = document.getElementById("student-gmail").value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(gmail)) {
          AIET.toast("Please enter a valid Gmail address (e.g. name@gmail.com).", "error");
          AIET.sound.play("error");
          return;
        }
        pendingContact = gmail;
      } else {
        const phone = document.getElementById("student-phone").value.replace(/\D/g, "");
        if (phone.length !== 10) {
          AIET.toast("Please enter a valid 10-digit mobile number.", "error");
          AIET.sound.play("error");
          return;
        }
        pendingContact = `+91 ${phone}`;
      }

      pendingStudent = { name, usn, contact: pendingContact, method: loginMethod };
      issueOtp();
    });

    document.getElementById("btn-change-contact").addEventListener("click", () => {
      clearInterval(countdownHandle);
      hideDemoOtpBanner();
      document.getElementById("form-student-verify-otp").classList.add("hidden");
      document.getElementById("form-student-request-otp").classList.remove("hidden");
    });

    document.getElementById("btn-resend-otp").addEventListener("click", () => {
      issueOtp();
    });

    document.getElementById("btn-autofill-otp").addEventListener("click", () => {
      if (pendingOtp) {
        fillOtpInputs(pendingOtp);
        AIET.sound.play("pop");
      }
    });

    document.getElementById("btn-close-otp-banner").addEventListener("click", hideDemoOtpBanner);

    document.getElementById("form-student-verify-otp").addEventListener("submit", (e) => {
      e.preventDefault();
      const boxes = Array.from(document.querySelectorAll("#otp-boxes .otp-digit"));
      const entered = boxes.map((b) => b.value).join("");
      const otpContainer = document.getElementById("otp-boxes");

      if (entered.length < 6 || entered !== pendingOtp) {
        otpContainer.classList.remove("shake");
        void otpContainer.offsetWidth;
        otpContainer.classList.add("shake");
        AIET.sound.play("error");
        AIET.toast("Invalid OTP. Check the 6-digit verification code.", "error");
        return;
      }

      clearInterval(countdownHandle);
      hideDemoOtpBanner();
      AIET.sound.play("success");

      const session = {
        role: "customer",
        name: pendingStudent.name,
        usn: pendingStudent.usn,
        contact: pendingStudent.contact,
        verifiedAt: new Date().toISOString()
      };
      AIET.store.setSession(session);
      AIET.toast(`Welcome, ${session.name}! OTP verified.`, "success");
      onLoginSuccess("customer");
    });

    // Shopkeeper Secret Code Login
    document.getElementById("btn-toggle-secret").addEventListener("click", () => {
      const inp = document.getElementById("shopkeeper-secret");
      inp.type = inp.type === "password" ? "text" : "password";
    });

    document.getElementById("demo-code-copy").addEventListener("click", () => {
      const code = AIET.store.getSettings().shopSecretCode;
      document.getElementById("shopkeeper-secret").value = code;
      AIET.toast("Demo secret code filled.", "info");
    });

    document.getElementById("form-shopkeeper-login").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("shopkeeper-name").value.trim() || "AIET Store Manager";
      const secret = document.getElementById("shopkeeper-secret").value.trim();
      const expected = AIET.store.getSettings().shopSecretCode;

      if (secret !== expected) {
        const inputEl = document.getElementById("shopkeeper-secret");
        inputEl.classList.remove("shake");
        void inputEl.offsetWidth;
        inputEl.classList.add("shake");
        AIET.sound.play("error");
        AIET.toast("Incorrect Shopkeeper Secret Code.", "error");
        return;
      }

      AIET.sound.play("success");
      AIET.store.setSession({
        role: "shopkeeper",
        name,
        contact: "Campus Store Admin",
        verifiedAt: new Date().toISOString()
      });
      AIET.toast("Shopkeeper Portal unlocked!", "success");
      onLoginSuccess("shopkeeper");
    });
  }

  return {
    init,
    switchAuthRole
  };
})();
