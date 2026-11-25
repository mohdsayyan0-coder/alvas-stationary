/* ==========================================================================
   AIET Stationery Hub — Main Application Controller & Particle Engine
   ========================================================================== */
(function () {
  let activeCategory = "All";
  let customerSearch = "";
  let shopSearch = "";
  let activeShopTab = "inventory";

  // ------------------------------------------------------------------------
  // 1. Ambient Animated Particle Canvas
  // ------------------------------------------------------------------------
  function initParticleBackground() {
    const canvas = document.getElementById("bg-particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const nodes = Array.from({ length: 34 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      hue: Math.random() > 0.3 ? "#2563EB" : "#F59E0B"
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
        if (a.y < 0 || a.y > canvas.height) a.vy *= -1;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = a.hue;
        ctx.globalAlpha = 0.28;
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "#1D3566";
            ctx.globalAlpha = (1 - dist / 140) * 0.1;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ------------------------------------------------------------------------
  // 2. Navigation & Portal Routing (Customer Link vs Shopkeeper Link)
  // ------------------------------------------------------------------------
  function updateHeaderSession() {
    const session = AIET.store.getSession();
    const pill = document.getElementById("user-session-pill");
    const cartBtn = document.getElementById("btn-header-cart");

    if (!session) {
      pill.classList.add("hidden");
      cartBtn.classList.add("hidden");
      return;
    }

    pill.classList.remove("hidden");
    document.getElementById("user-avatar-initials").textContent = (session.name || "A")[0].toUpperCase();
    document.getElementById("user-display-name").textContent = session.name;
    document.getElementById("user-display-role").textContent =
      session.role === "shopkeeper" ? "Shopkeeper Admin" : "OTP Verified Student";

    if (session.role === "customer") {
      cartBtn.classList.remove("hidden");
    } else {
      cartBtn.classList.add("hidden");
    }
  }

  function setActivePortalNav(portal) {
    document.querySelectorAll(".portal-link").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("data-portal") === portal);
    });
  }

  function showView(viewId) {
    ["view-auth", "view-customer", "view-shopkeeper"].forEach((id) => {
      const el = document.getElementById(id);
      if (id === viewId) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });
  }

  function navigateToPortal(portal) {
    const session = AIET.store.getSession();
    setActivePortalNav(portal);

    if (portal === "customer") {
      window.location.hash = "customer";
      if (session && session.role === "customer") {
        showView("view-customer");
        renderCustomerView();
      } else {
        showView("view-auth");
        AIET.auth.switchAuthRole("student");
        if (session && session.role !== "customer") {
          AIET.toast("Please sign in with Student Gmail/Phone + OTP to open Customer Portal.", "info");
        }
      }
    } else if (portal === "shopkeeper") {
      window.location.hash = "shopkeeper";
      if (session && session.role === "shopkeeper") {
        showView("view-shopkeeper");
        renderShopkeeperView();
      } else {
        showView("view-auth");
        AIET.auth.switchAuthRole("shopkeeper");
        if (session && session.role !== "shopkeeper") {
          AIET.toast("Enter the Shopkeeper Secret Code to unlock Shopkeeper Portal.", "info");
        }
      }
    } else {
      showView("view-auth");
    }
    updateHeaderSession();
  }

  // ------------------------------------------------------------------------
  // 3. Customer Storefront & Cart Rendering
  // ------------------------------------------------------------------------
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCustomerView() {
    const items = AIET.store.getItems();
    const orders = AIET.store.getOrders();
    const session = AIET.store.getSession();

    const availableCount = items.filter((i) => i.stock > 0).length;
    const myOrdersCount = session
      ? orders.filter((o) => o.customerContact === session.contact || o.customerName === session.name).length
      : 0;

    document.getElementById("cust-stat-items").textContent = availableCount;
    document.getElementById("cust-stat-orders").textContent = myOrdersCount;

    const query = customerSearch.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const catOk = activeCategory === "All" || item.category === activeCategory;
      const searchOk =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return catOk && searchOk;
    });

    const grid = document.getElementById("customer-product-grid");
    const empty = document.getElementById("customer-empty-state");

    if (!filtered.length) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
      grid.innerHTML = filtered
        .map((item, idx) => {
          const out = item.stock <= 0;
          const low = item.stock > 0 && item.stock <= 15;
          const stockClass = out ? "out" : low ? "low" : "in";
          const stockText = out ? "Out of Stock" : `${item.stock} available`;
          const delay = Math.min(idx * 45, 360);

          return `
            <article class="product-card" style="animation-delay:${delay}ms" data-item-id="${escapeHtml(item.id)}">
              <div class="product-visual theme-${escapeHtml(item.theme || "blue")}">
                ${item.badge ? `<span class="product-tag">${escapeHtml(item.badge)}</span>` : ""}
                <span class="stock-pill ${stockClass}">${stockText}</span>
                ${AIET.renderProductSVG(item.theme)}
              </div>
              <div class="product-body">
                <span class="product-cat">${escapeHtml(item.category)}</span>
                <h3 class="product-title">${escapeHtml(item.name)}</h3>
                <p class="product-desc">${escapeHtml(item.desc)}</p>
                <div class="product-price-row">
                  <span class="product-price">&#8377;${Number(item.price).toFixed(2).replace(/\.00$/, "")}</span>
                  <span class="product-unit">per ${escapeHtml(item.unit)}</span>
                </div>
                <div class="qty-control-row">
                  <span class="qty-label">Quantity</span>
                  <div class="qty-stepper">
                    <button type="button" class="qty-btn btn-qty-dec" ${out ? "disabled" : ""} aria-label="Decrease quantity">&minus;</button>
                    <input type="number" class="qty-input" min="1" max="${Math.max(1, item.stock)}" value="1" ${out ? "disabled" : ""} aria-label="Quantity for ${escapeHtml(item.name)}" />
                    <button type="button" class="qty-btn btn-qty-inc" ${out ? "disabled" : ""} aria-label="Increase quantity">+</button>
                  </div>
                </div>
                <div class="product-actions">
                  <button type="button" class="btn-card-cart btn-add-cart" ${out ? "disabled" : ""}>Add to Cart</button>
                  <button type="button" class="btn-card-order btn-order-now" ${out ? "disabled" : ""}>Order Now</button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
    }

    renderCartDrawer();
  }

  function renderCartDrawer() {
    const { lines, total, count } = AIET.store.getCartDetails();
    const badge = document.getElementById("header-cart-count");
    badge.textContent = count;

    document.getElementById("cart-drawer-subtitle").textContent = `${count} item${count === 1 ? "" : "s"} selected`;
    document.getElementById("cart-subtotal").textContent = `₹${total.toFixed(2)}`;
    document.getElementById("cart-total").textContent = `₹${total.toFixed(2)}`;

    const listEl = document.getElementById("cart-items-list");
    const emptyEl = document.getElementById("cart-empty-view");
    const footerEl = document.getElementById("cart-footer");

    if (!lines.length) {
      listEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      footerEl.classList.add("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    footerEl.classList.remove("hidden");
    listEl.innerHTML = lines
      .map(
        (line) => `
      <div class="cart-item" data-cart-id="${escapeHtml(line.id)}">
        <div class="cart-item-info">
          <strong>${escapeHtml(line.name)}</strong>
          <span>&#8377;${line.price} / ${escapeHtml(line.unit)} &bull; Subtotal: <b>&#8377;${line.lineTotal.toFixed(2)}</b></span>
        </div>
        <div class="qty-stepper">
          <button type="button" class="qty-btn cart-dec">&minus;</button>
          <input type="number" class="qty-input cart-qty-input" min="1" max="${line.stock}" value="${line.qty}" />
          <button type="button" class="qty-btn cart-inc">+</button>
        </div>
        <button type="button" class="btn-xs danger cart-remove" title="Remove">&times;</button>
      </div>
    `
      )
      .join("");
  }

  function bumpCartBadge() {
    const badge = document.getElementById("header-cart-count");
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }

  function openCartDrawer() {
    document.getElementById("cart-backdrop").classList.remove("hidden");
    document.getElementById("cart-drawer").classList.add("open");
    AIET.sound.play("pop");
  }

  function closeCartDrawer() {
    document.getElementById("cart-backdrop").classList.add("hidden");
    document.getElementById("cart-drawer").classList.remove("open");
  }

  function openStudentOrdersModal() {
    const session = AIET.store.getSession();
    const orders = AIET.store.getOrders();
    const mine = session
      ? orders.filter((o) => o.customerContact === session.contact || o.customerName === session.name)
      : orders;

    const listEl = document.getElementById("student-orders-list");
    if (!mine.length) {
      listEl.innerHTML = `<div class="empty-state"><p>You haven't placed any stationery orders yet.</p></div>`;
    } else {
      listEl.innerHTML = mine
        .map((o) => {
          const statusCls =
            o.status === "Picked Up" ? "done" : o.status === "Ready for Pickup" ? "ready" : "paid";
          return `
            <div class="order-history-card">
              <div class="order-history-top">
                <div>
                  <strong>Token #${escapeHtml(o.token)}</strong>
                  <span style="color:#64748b;font-size:0.78rem;margin-left:0.5rem;">${new Date(
                    o.createdAt
                  ).toLocaleString()}</span>
                </div>
                <span class="status-badge ${statusCls}">${escapeHtml(o.status)}</span>
              </div>
              <div style="font-size:0.84rem;color:#334155;">
                ${o.lines.map((l) => `${escapeHtml(l.name)} &times; ${l.qty}`).join(" &bull; ")}
              </div>
              <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:#475569;">
                <span>Paid via <b>${escapeHtml(o.paymentMethod)}</b> (${escapeHtml(o.utr)})</span>
                <strong style="color:#0b1630;">&#8377;${Number(o.total).toFixed(2)}</strong>
              </div>
            </div>
          `;
        })
        .join("");
    }
    document.getElementById("orders-modal").classList.remove("hidden");
  }

  // ------------------------------------------------------------------------
  // 4. Shopkeeper Inventory & Orders Rendering
  // ------------------------------------------------------------------------
  function renderShopkeeperView() {
    const items = AIET.store.getItems();
    const orders = AIET.store.getOrders();
    const settings = AIET.store.getSettings();

    const totalStock = items.reduce((s, i) => s + Number(i.stock), 0);
    const lowStock = items.filter((i) => Number(i.stock) <= 15).length;
    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const pendingOrders = orders.filter((o) => o.status !== "Picked Up").length;

    document.getElementById("kpi-total-items").textContent = items.length;
    document.getElementById("kpi-total-stock").textContent = totalStock;
    document.getElementById("kpi-low-stock").textContent = lowStock;
    document.getElementById("kpi-revenue").textContent = `₹${revenue.toFixed(0)}`;
    document.getElementById("badge-pending-orders").textContent = pendingOrders;

    // Settings inputs
    document.getElementById("setting-upi-id").value = settings.merchantUpi;
    document.getElementById("setting-secret-code").value = settings.shopSecretCode;

    // Inventory table
    const q = shopSearch.trim().toLowerCase();
    const filtered = items.filter(
      (i) => !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );

    const invTbody = document.getElementById("shop-inventory-tbody");
    invTbody.innerHTML = filtered
      .map((item) => {
        const stock = Number(item.stock);
        const statusCls = stock <= 0 ? "out" : stock <= 15 ? "low" : "ok";
        const statusLbl = stock <= 0 ? "Out of Stock" : stock <= 15 ? "Low Stock" : "In Stock";
        return `
          <tr data-shop-item="${escapeHtml(item.id)}">
            <td>
              <strong>${escapeHtml(item.name)}</strong>
              <div style="font-size:0.75rem;color:#64748b;">per ${escapeHtml(item.unit)}</div>
            </td>
            <td>${escapeHtml(item.category)}</td>
            <td><strong>&#8377;${item.price}</strong></td>
            <td>
              <input type="number" class="inline-stock-input" min="0" value="${stock}" aria-label="Stock for ${escapeHtml(item.name)}" />
            </td>
            <td>
              <div class="quick-restock-btns">
                <button type="button" class="btn-xs btn-restock" data-delta="10">+10</button>
                <button type="button" class="btn-xs btn-restock" data-delta="50">+50</button>
              </div>
            </td>
            <td><span class="status-badge ${statusCls}">${statusLbl}</span></td>
            <td>
              <div class="quick-restock-btns">
                <button type="button" class="btn-xs btn-edit-item">Edit</button>
                <button type="button" class="btn-xs danger btn-delete-item">Delete</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    // Orders table
    const ordTbody = document.getElementById("shop-orders-tbody");
    const ordEmpty = document.getElementById("shop-orders-empty");
    if (!orders.length) {
      ordTbody.innerHTML = "";
      ordEmpty.classList.remove("hidden");
    } else {
      ordEmpty.classList.add("hidden");
      ordTbody.innerHTML = orders
        .map((o) => {
          const statusCls =
            o.status === "Picked Up" ? "done" : o.status === "Ready for Pickup" ? "ready" : "paid";
          return `
            <tr data-order-id="${escapeHtml(o.id)}">
              <td>
                <strong>#${escapeHtml(o.token)}</strong>
                <div style="font-size:0.72rem;color:#64748b;">${escapeHtml(o.utr)}</div>
              </td>
              <td>
                <strong>${escapeHtml(o.customerName)}</strong>
                <div style="font-size:0.74rem;color:#64748b;">${escapeHtml(o.customerContact)}</div>
              </td>
              <td style="font-size:0.8rem;">
                ${o.lines.map((l) => `${escapeHtml(l.name)} &times; <b>${l.qty}</b>`).join("<br/>")}
              </td>
              <td>${escapeHtml(o.paymentMethod)}</td>
              <td><strong>&#8377;${Number(o.total).toFixed(2)}</strong></td>
              <td><span class="status-badge ${statusCls}">${escapeHtml(o.status)}</span></td>
              <td>
                <select class="order-status-select" style="padding:0.35rem;border-radius:8px;border:1px solid #cbd5e1;font-size:0.78rem;">
                  <option value="Paid & Confirmed" ${o.status === "Paid & Confirmed" ? "selected" : ""}>Paid & Confirmed</option>
                  <option value="Pending Payment" ${o.status === "Pending Payment" ? "selected" : ""}>Pending Payment</option>
                  <option value="Packing" ${o.status === "Packing" ? "selected" : ""}>Packing</option>
                  <option value="Ready for Pickup" ${o.status === "Ready for Pickup" ? "selected" : ""}>Ready for Pickup</option>
                  <option value="Picked Up" ${o.status === "Picked Up" ? "selected" : ""}>Picked Up</option>
                </select>
              </td>
            </tr>
          `;
        })
        .join("");
    }
  }

  function openItemModal(item = null) {
    document.getElementById("item-modal-title").textContent = item
      ? "Edit Stationery Item"
      : "Add New Stationery Item";
    document.getElementById("item-edit-id").value = item ? item.id : "";
    document.getElementById("item-name").value = item ? item.name : "";
    document.getElementById("item-category").value = item ? item.category : "Exam & Record Books";
    document.getElementById("item-unit").value = item ? item.unit : "Book";
    document.getElementById("item-price").value = item ? item.price : "";
    document.getElementById("item-stock").value = item ? item.stock : "";
    document.getElementById("item-theme").value = item ? item.theme : "blue";
    document.getElementById("item-badge").value = item ? item.badge || "" : "";
    document.getElementById("item-desc").value = item ? item.desc || "" : "";
    document.getElementById("item-modal").classList.remove("hidden");
  }

  function closeItemModal() {
    document.getElementById("item-modal").classList.add("hidden");
  }

  // ------------------------------------------------------------------------
  // 5. Event Wiring & Initialization
  // ------------------------------------------------------------------------
  function bindEvents() {
    // Portal links (Header + Footer)
    document.querySelectorAll("[data-portal]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToPortal(link.getAttribute("data-portal"));
      });
    });

    document.getElementById("brand-home-link").addEventListener("click", (e) => {
      e.preventDefault();
      const session = AIET.store.getSession();
      if (session) {
        navigateToPortal(session.role);
      } else {
        showView("view-auth");
      }
    });

    // Sound toggle
    document.getElementById("btn-sound-toggle").addEventListener("click", () => {
      AIET.sound.enabled = !AIET.sound.enabled;
      document.getElementById("icon-sound-on").classList.toggle("hidden", !AIET.sound.enabled);
      document.getElementById("icon-sound-off").classList.toggle("hidden", AIET.sound.enabled);
      AIET.toast(AIET.sound.enabled ? "UI sounds enabled" : "UI sounds muted", "info");
    });

    // Logout
    document.getElementById("btn-logout").addEventListener("click", () => {
      AIET.store.setSession(null);
      closeCartDrawer();
      updateHeaderSession();
      showView("view-auth");
      AIET.toast("Signed out successfully.", "info");
    });

    // Customer search & categories
    document.getElementById("customer-search").addEventListener("input", (e) => {
      customerSearch = e.target.value;
      renderCustomerView();
    });

    document.getElementById("customer-category-pills").addEventListener("click", (e) => {
      const btn = e.target.closest(".cat-pill");
      if (!btn) return;
      activeCategory = btn.getAttribute("data-category");
      document.querySelectorAll(".cat-pill").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      renderCustomerView();
      AIET.sound.play("pop");
    });

    // Product Grid Actions (Any Quantity Stepper, Direct Typing, Add to Cart, Order Now)
    const grid = document.getElementById("customer-product-grid");
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".product-card");
      if (!card) return;
      const itemId = card.getAttribute("data-item-id");
      const item = AIET.store.getItemById(itemId);
      if (!item) return;

      const qtyInput = card.querySelector(".qty-input");
      let currentQty = Math.max(1, Math.floor(Number(qtyInput.value) || 1));

      if (e.target.closest(".btn-qty-dec")) {
        qtyInput.value = Math.max(1, currentQty - 1);
        AIET.sound.play("pop");
      } else if (e.target.closest(".btn-qty-inc")) {
        if (currentQty < item.stock) {
          qtyInput.value = currentQty + 1;
          AIET.sound.play("pop");
        } else {
          AIET.toast(`Only ${item.stock} ${item.unit}(s) available.`, "error");
        }
      } else if (e.target.closest(".btn-add-cart")) {
        if (currentQty > item.stock) {
          AIET.toast(`Only ${item.stock} ${item.unit}(s) available in stock.`, "error");
          qtyInput.value = item.stock;
          return;
        }
        const res = AIET.store.addToCart(itemId, currentQty);
        if (!res.ok) {
          AIET.sound.play("error");
          AIET.toast(res.error, "error");
          return;
        }
        AIET.sound.play("pop");
        bumpCartBadge();
        renderCartDrawer();
        AIET.toast(`Added ${currentQty} × ${item.name} to cart.`, "success");
      } else if (e.target.closest(".btn-order-now")) {
        if (currentQty > item.stock) {
          AIET.toast(`Only ${item.stock} ${item.unit}(s) available in stock.`, "error");
          qtyInput.value = item.stock;
          return;
        }
        AIET.payments.open({
          lines: [{ ...item, qty: currentQty }],
          source: "direct",
          onComplete: () => renderCustomerView()
        });
      }
    });

    grid.addEventListener("change", (e) => {
      if (!e.target.classList.contains("qty-input")) return;
      const card = e.target.closest(".product-card");
      const item = AIET.store.getItemById(card.getAttribute("data-item-id"));
      let val = Math.max(1, Math.floor(Number(e.target.value) || 1));
      if (item && val > item.stock) {
        val = item.stock;
        AIET.toast(`Adjusted to maximum available stock (${item.stock}).`, "info");
      }
      e.target.value = val;
    });

    // Cart Drawer Controls
    document.getElementById("btn-header-cart").addEventListener("click", openCartDrawer);
    document.getElementById("btn-close-cart").addEventListener("click", closeCartDrawer);
    document.getElementById("cart-backdrop").addEventListener("click", closeCartDrawer);

    const cartList = document.getElementById("cart-items-list");
    cartList.addEventListener("click", (e) => {
      const row = e.target.closest(".cart-item");
      if (!row) return;
      const id = row.getAttribute("data-cart-id");
      const inp = row.querySelector(".cart-qty-input");
      const cur = Number(inp.value) || 1;

      if (e.target.closest(".cart-dec")) {
        AIET.store.setCartQty(id, cur - 1);
        renderCartDrawer();
      } else if (e.target.closest(".cart-inc")) {
        const res = AIET.store.setCartQty(id, cur + 1);
        if (!res.ok) AIET.toast(res.error, "error");
        renderCartDrawer();
      } else if (e.target.closest(".cart-remove")) {
        AIET.store.removeFromCart(id);
        renderCartDrawer();
      }
    });

    cartList.addEventListener("change", (e) => {
      if (!e.target.classList.contains("cart-qty-input")) return;
      const row = e.target.closest(".cart-item");
      const id = row.getAttribute("data-cart-id");
      const res = AIET.store.setCartQty(id, e.target.value);
      if (!res.ok) AIET.toast(res.error, "error");
      renderCartDrawer();
    });

    document.getElementById("btn-proceed-checkout").addEventListener("click", () => {
      const { lines } = AIET.store.getCartDetails();
      if (!lines.length) return;
      closeCartDrawer();
      AIET.payments.open({
        lines,
        source: "cart",
        onComplete: () => renderCustomerView()
      });
    });

    // Student Order History Modal
    document.getElementById("btn-view-my-orders").addEventListener("click", openStudentOrdersModal);
    document.getElementById("btn-close-orders-modal").addEventListener("click", () => {
      document.getElementById("orders-modal").classList.add("hidden");
    });

    // Shopkeeper Sub-tabs
    document.querySelectorAll(".shop-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        activeShopTab = tab.getAttribute("data-shop-tab");
        document.querySelectorAll(".shop-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        ["inventory", "orders", "settings"].forEach((name) => {
          document
            .getElementById(`shop-panel-${name}`)
            .classList.toggle("hidden", name !== activeShopTab);
        });
      });
    });

    document.getElementById("shop-search-inventory").addEventListener("input", (e) => {
      shopSearch = e.target.value;
      renderShopkeeperView();
    });

    // Shopkeeper Add / Edit Item
    document.getElementById("btn-open-add-item").addEventListener("click", () => openItemModal(null));
    document.getElementById("btn-close-item-modal").addEventListener("click", closeItemModal);
    document.getElementById("btn-cancel-item-modal").addEventListener("click", closeItemModal);

    document.getElementById("form-item-crud").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("item-edit-id").value || undefined;
      const itemData = {
        id,
        name: document.getElementById("item-name").value.trim(),
        category: document.getElementById("item-category").value,
        unit: document.getElementById("item-unit").value.trim() || "Unit",
        price: Number(document.getElementById("item-price").value),
        stock: Math.max(0, Math.floor(Number(document.getElementById("item-stock").value))),
        theme: document.getElementById("item-theme").value,
        badge: document.getElementById("item-badge").value.trim(),
        desc: document.getElementById("item-desc").value.trim()
      };
      AIET.store.upsertItem(itemData);
      closeItemModal();
      AIET.sound.play("success");
      AIET.toast(id ? "Stationery item updated!" : "New stationery item added to store!", "success");
      renderShopkeeperView();
    });

    // Shopkeeper Inventory Row Actions
    const invTbody = document.getElementById("shop-inventory-tbody");
    invTbody.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      if (!row) return;
      const id = row.getAttribute("data-shop-item");

      const restockBtn = e.target.closest(".btn-restock");
      if (restockBtn) {
        const delta = Number(restockBtn.getAttribute("data-delta"));
        AIET.store.adjustStock(id, delta);
        AIET.sound.play("pop");
        AIET.toast(`Stock increased by +${delta}.`, "success");
        return;
      }

      if (e.target.closest(".btn-edit-item")) {
        openItemModal(AIET.store.getItemById(id));
        return;
      }

      if (e.target.closest(".btn-delete-item")) {
        AIET.store.deleteItem(id);
        AIET.toast("Item removed from catalog.", "info");
      }
    });

    invTbody.addEventListener("change", (e) => {
      if (!e.target.classList.contains("inline-stock-input")) return;
      const row = e.target.closest("tr");
      const id = row.getAttribute("data-shop-item");
      AIET.store.updateStock(id, e.target.value);
      AIET.toast("Available quantity updated.", "success");
    });

    // Shopkeeper Order Status Changes
    document.getElementById("shop-orders-tbody").addEventListener("change", (e) => {
      if (!e.target.classList.contains("order-status-select")) return;
      const row = e.target.closest("tr");
      const orderId = row.getAttribute("data-order-id");
      AIET.store.updateOrderStatus(orderId, e.target.value);
      AIET.sound.play("pop");
      AIET.toast(`Order updated to "${e.target.value}".`, "success");
    });

    // Shopkeeper Settings
    document.getElementById("form-shop-settings").addEventListener("submit", (e) => {
      e.preventDefault();
      AIET.store.saveSettings({
        merchantUpi: document.getElementById("setting-upi-id").value.trim(),
        shopSecretCode: document.getElementById("setting-secret-code").value.trim()
      });
      AIET.sound.play("success");
      AIET.toast("Store settings saved.", "success");
    });

    document.getElementById("btn-reset-demo").addEventListener("click", () => {
      AIET.store.resetDemo();
      AIET.toast("Demo catalog and orders restored.", "info");
    });
  }

  // ------------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initParticleBackground();
    AIET.payments.init();
    AIET.auth.init((role) => navigateToPortal(role));
    bindEvents();

    // Live cross-tab sync subscription
    AIET.store.subscribe(() => {
      const session = AIET.store.getSession();
      updateHeaderSession();
      if (session && session.role === "customer") renderCustomerView();
      if (session && session.role === "shopkeeper") renderShopkeeperView();
    });

    // Initial Route Resolution
    const hash = window.location.hash.replace("#", "");
    const session = AIET.store.getSession();

    if (hash === "shopkeeper") {
      navigateToPortal("shopkeeper");
    } else if (hash === "customer") {
      navigateToPortal("customer");
    } else if (session) {
      navigateToPortal(session.role);
    } else {
      showView("view-auth");
      updateHeaderSession();
    }

    window.addEventListener("hashchange", () => {
      const h = window.location.hash.replace("#", "");
      if (h === "customer" || h === "shopkeeper") {
        navigateToPortal(h);
      }
    });
  });
})();
