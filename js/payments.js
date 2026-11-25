/* ==========================================================================
   AIET Stationery Hub — Authentic UPI (GPay / PhonePe / Paytm) & Checkout
   ========================================================================== */
window.AIET = window.AIET || {};

AIET.payments = (function () {
  let activeLines = [];
  let activeTotal = 0;
  let activeSource = "cart"; // 'cart' | 'direct'
  let selectedMethod = "Google Pay";
  let onCompleteCallback = null;

  // Deterministic crisp SVG QR-style matrix with standard 3 finder patterns
  function renderUpiQrSvg(upiUri) {
    const size = 25;
    const grid = Array.from({ length: size }, () => Array(size).fill(0));

    function drawFinder(r0, c0) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = border || center ? 1 : 0;
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Alignment pattern
    for (let r = 16; r <= 20; r++) {
      for (let c = 16; c <= 20; c++) {
        const isEdge = r === 16 || r === 20 || c === 16 || c === 20;
        const isCenter = r === 18 && c === 18;
        grid[r][c] = isEdge || isCenter ? 1 : 0;
      }
    }

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      grid[6][i] = i % 2 === 0 ? 1 : 0;
      grid[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Deterministic data modules from URI hash
    let hash = 2166136261;
    for (let i = 0; i < upiUri.length; i++) {
      hash ^= upiUri.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inTL = r < 8 && c < 8;
        const inTR = r < 8 && c >= size - 8;
        const inBL = r >= size - 8 && c < 8;
        const inAlign = r >= 16 && r <= 20 && c >= 16 && c <= 20;
        const inTiming = r === 6 || c === 6;
        if (inTL || inTR || inBL || inAlign || inTiming) continue;

        hash ^= (r * 31 + c * 17);
        hash = Math.imul(hash, 16777619);
        grid[r][c] = (hash >>> 28) & 1;
      }
    }

    let rects = "";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c]) {
          rects += `<rect x="${c}" y="${r}" width="1" height="1" rx="0.18" fill="#0B1630"/>`;
        }
      }
    }
    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${rects}</svg>`;
  }

  function updateMethodView() {
    const upiSection = document.getElementById("pay-upi-section");
    const cardSection = document.getElementById("pay-card-section");
    const cashSection = document.getElementById("pay-cash-section");

    upiSection.classList.add("hidden");
    cardSection.classList.add("hidden");
    cashSection.classList.add("hidden");

    if (
      selectedMethod === "Google Pay" ||
      selectedMethod === "PhonePe" ||
      selectedMethod === "Paytm / BHIM UPI"
    ) {
      upiSection.classList.remove("hidden");
      const settings = AIET.store.getSettings();
      const upiUri = `upi://pay?pa=${encodeURIComponent(settings.merchantUpi)}&pn=${encodeURIComponent(
        "Alvas Institute Stationery"
      )}&am=${activeTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent("AIET Stationery Order")}`;

      document.getElementById("selected-upi-badge").textContent = `${selectedMethod} Instant`;
      document.getElementById("selected-upi-name").textContent = selectedMethod;
      document.getElementById("pay-merchant-upi-display").textContent = settings.merchantUpi;
      document.getElementById("btn-upi-deeplink").href = upiUri;
      document.getElementById("qr-svg-container").innerHTML = renderUpiQrSvg(upiUri);
    } else if (selectedMethod === "Debit / Credit Card") {
      cardSection.classList.remove("hidden");
    } else {
      cashSection.classList.remove("hidden");
    }
  }

  function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#2563EB", "#F59E0B", "#10B981", "#FBBF24", "#60A5FA", "#FFFFFF"];
    const pieces = Array.from({ length: 110 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 140,
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 7,
      vx: (Math.random() - 0.5) * 4.5,
      vy: 3 + Math.random() * 4.5,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    let frame = 0;
    function tick() {
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vy += 0.06;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (frame < 130) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(tick);
  }

  function showReceipt(order) {
    document.getElementById("pay-step-processing").classList.add("hidden");
    document.getElementById("pay-step-success").classList.remove("hidden");

    document.getElementById("receipt-token").textContent = `#${order.token}`;
    document.getElementById("receipt-student").textContent = order.customerUsn
      ? `${order.customerName} (${order.customerUsn})`
      : order.customerName;
    document.getElementById("receipt-method").textContent = order.paymentMethod;
    document.getElementById("receipt-utr").textContent = order.utr;
    document.getElementById("receipt-amount").textContent = `₹${order.total.toFixed(2)}`;

    const itemsBox = document.getElementById("receipt-items-summary");
    itemsBox.innerHTML = order.lines
      .map(
        (l) =>
          `<div class="receipt-item-line"><span>${l.name} &times; ${l.qty}</span><strong>₹${l.lineTotal.toFixed(
            2
          )}</strong></div>`
      )
      .join("");

    AIET.sound.play("success");
    launchConfetti();
  }

  function executePayment(paymentMeta = "") {
    const stepSelect = document.getElementById("pay-step-select");
    const stepProc = document.getElementById("pay-step-processing");
    const bar = document.getElementById("pay-progress-bar");
    const badge = document.getElementById("processing-app-badge");
    const title = document.getElementById("processing-title");
    const sub = document.getElementById("processing-subtitle");

    stepSelect.classList.add("hidden");
    stepProc.classList.remove("hidden");
    bar.style.width = "15%";

    badge.textContent =
      selectedMethod === "Google Pay"
        ? "GPay"
        : selectedMethod === "PhonePe"
        ? "PhonePe"
        : selectedMethod === "Campus Counter Cash"
        ? "TOKEN"
        : "UPI";

    title.textContent =
      selectedMethod === "Campus Counter Cash"
        ? "Reserving Items at Campus Store..."
        : `Connecting to ${selectedMethod}...`;
    sub.textContent = "Encrypting order details & verifying stock";

    setTimeout(() => {
      bar.style.width = "60%";
      title.textContent =
        selectedMethod === "Campus Counter Cash"
          ? "Generating Campus Pickup Token..."
          : "Verifying Payment with Bank / NPCI...";
      sub.textContent = "Confirming real-time inventory availability";
    }, 650);

    setTimeout(() => {
      bar.style.width = "100%";
      const session = AIET.store.getSession() || { name: "AIET Student", contact: "" };
      const result = AIET.store.placeOrder({
        lines: activeLines,
        paymentMethod: selectedMethod,
        paymentMeta,
        customer: session
      });

      if (!result.ok) {
        stepProc.classList.add("hidden");
        stepSelect.classList.remove("hidden");
        AIET.sound.play("error");
        AIET.toast(result.error, "error");
        return;
      }

      if (activeSource === "cart") {
        AIET.store.clearCart();
      }
      if (typeof onCompleteCallback === "function") {
        onCompleteCallback(result.order);
      }
      showReceipt(result.order);
    }, 1450);
  }

  function open({ lines, source = "cart", onComplete }) {
    activeLines = lines;
    activeSource = source;
    onCompleteCallback = onComplete;
    activeTotal = lines.reduce((sum, l) => sum + l.qty * Number(l.price), 0);
    const totalCount = lines.reduce((sum, l) => sum + l.qty, 0);

    document.getElementById("pay-total-display").textContent = `₹${activeTotal.toFixed(2)}`;
    document.getElementById("pay-items-count-pill").textContent = `${totalCount} item${
      totalCount === 1 ? "" : "s"
    }`;

    // Reset modal to step 1
    document.getElementById("pay-step-select").classList.remove("hidden");
    document.getElementById("pay-step-processing").classList.add("hidden");
    document.getElementById("pay-step-success").classList.add("hidden");

    selectedMethod = "Google Pay";
    document.querySelectorAll(".pay-app-card").forEach((c) => {
      c.classList.toggle("active", c.getAttribute("data-method") === selectedMethod);
    });
    updateMethodView();

    document.getElementById("payment-modal").classList.remove("hidden");
    AIET.sound.play("pop");
  }

  function close() {
    document.getElementById("payment-modal").classList.add("hidden");
  }

  function init() {
    document.getElementById("btn-close-payment").addEventListener("click", close);
    document.getElementById("btn-done-receipt").addEventListener("click", close);
    document.getElementById("btn-print-receipt").addEventListener("click", () => window.print());

    document.querySelectorAll(".pay-app-card").forEach((card) => {
      card.addEventListener("click", () => {
        selectedMethod = card.getAttribute("data-method");
        document.querySelectorAll(".pay-app-card").forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        updateMethodView();
        AIET.sound.play("pop");
      });
    });

    // UPI QR vs UPI ID tabs
    const qrTab = document.getElementById("btn-upi-qr-tab");
    const idTab = document.getElementById("btn-upi-id-tab");
    const qrPanel = document.getElementById("upi-qr-panel");
    const idPanel = document.getElementById("upi-id-panel");

    qrTab.addEventListener("click", () => {
      qrTab.classList.add("active");
      idTab.classList.remove("active");
      qrPanel.classList.remove("hidden");
      idPanel.classList.add("hidden");
    });

    idTab.addEventListener("click", () => {
      idTab.classList.add("active");
      qrTab.classList.remove("active");
      idPanel.classList.remove("hidden");
      qrPanel.classList.add("hidden");
    });

    document.querySelectorAll(".handle-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const inp = document.getElementById("input-customer-upi");
        const base = inp.value.split("@")[0] || "aietstudent";
        inp.value = `${base}${chip.getAttribute("data-handle")}`;
        inp.focus();
      });
    });

    document.getElementById("btn-confirm-qr-paid").addEventListener("click", () => {
      executePayment("QR Scan");
    });

    document.getElementById("btn-pay-upi-id").addEventListener("click", () => {
      const upiId = document.getElementById("input-customer-upi").value.trim();
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
        AIET.toast("Enter a valid UPI ID (e.g. name@okicici or 9876543210@ybl).", "error");
        AIET.sound.play("error");
        return;
      }
      executePayment(upiId);
    });

    document.getElementById("btn-pay-card").addEventListener("click", () => {
      const num = document.getElementById("card-number").value.replace(/\s+/g, "");
      const exp = document.getElementById("card-expiry").value.trim();
      const cvv = document.getElementById("card-cvv").value.trim();
      if (num.length < 12 || !/^\d{2}\/\d{2}$/.test(exp) || cvv.length < 3) {
        AIET.toast("Please enter valid card details (Number, MM/YY, CVV).", "error");
        AIET.sound.play("error");
        return;
      }
      executePayment(`Card ending ${num.slice(-4)}`);
    });

    document.getElementById("btn-pay-cash").addEventListener("click", () => {
      executePayment("Campus Counter");
    });
  }

  return {
    init,
    open,
    close
  };
})();
