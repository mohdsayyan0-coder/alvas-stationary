/* ==========================================================================
   AIET Stationery Hub — Persistent Store & Cross-Tab Live Sync
   ========================================================================== */
window.AIET = window.AIET || {};

AIET.store = (function () {
  const KEYS = {
    ITEMS: "aiet_stationery_items_v1",
    ORDERS: "aiet_stationery_orders_v1",
    SETTINGS: "aiet_stationery_settings_v1",
    CART: "aiet_stationery_cart_v1",
    SESSION: "aiet_stationery_session_v1"
  };

  let channel = null;
  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("aiet_stationery_sync");
    }
  } catch (_) {}

  const listeners = new Set();

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value, broadcast = true) {
    localStorage.setItem(key, JSON.stringify(value));
    if (broadcast && channel) {
      try {
        channel.postMessage({ type: "sync", key });
      } catch (_) {}
    }
    notify();
  }

  function notify() {
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (_) {}
    });
  }

  function ensureSeeded() {
    if (!localStorage.getItem(KEYS.ITEMS)) {
      writeJSON(KEYS.ITEMS, AIET.SEED_ITEMS, false);
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      writeJSON(KEYS.SETTINGS, AIET.DEFAULT_SETTINGS, false);
    }
    if (!localStorage.getItem(KEYS.ORDERS)) {
      writeJSON(KEYS.ORDERS, [], false);
    }
    if (!localStorage.getItem(KEYS.CART)) {
      writeJSON(KEYS.CART, [], false);
    }
  }

  ensureSeeded();

  if (channel) {
    channel.onmessage = () => notify();
  }
  window.addEventListener("storage", (e) => {
    if (Object.values(KEYS).includes(e.key)) {
      notify();
    }
  });

  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    getSettings() {
      return readJSON(KEYS.SETTINGS, { ...AIET.DEFAULT_SETTINGS });
    },

    saveSettings(patch) {
      const next = { ...this.getSettings(), ...patch };
      writeJSON(KEYS.SETTINGS, next);
      return next;
    },

    getItems() {
      return readJSON(KEYS.ITEMS, []);
    },

    getItemById(id) {
      return this.getItems().find((it) => it.id === id) || null;
    },

    upsertItem(itemData) {
      const items = this.getItems();
      const idx = items.findIndex((i) => i.id === itemData.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...itemData };
      } else {
        items.unshift({
          ...itemData,
          id: itemData.id || `item-${Date.now()}`
        });
      }
      writeJSON(KEYS.ITEMS, items);
    },

    updateStock(id, newStock) {
      const safeStock = Math.max(0, Math.floor(Number(newStock) || 0));
      const items = this.getItems().map((it) =>
        it.id === id ? { ...it, stock: safeStock } : it
      );
      writeJSON(KEYS.ITEMS, items);
    },

    adjustStock(id, delta) {
      const items = this.getItems().map((it) => {
        if (it.id !== id) return it;
        return { ...it, stock: Math.max(0, Number(it.stock) + delta) };
      });
      writeJSON(KEYS.ITEMS, items);
    },

    deleteItem(id) {
      const items = this.getItems().filter((it) => it.id !== id);
      writeJSON(KEYS.ITEMS, items);
    },

    getCart() {
      return readJSON(KEYS.CART, []);
    },

    addToCart(itemId, qty) {
      const item = this.getItemById(itemId);
      if (!item) return { ok: false, error: "Item not found." };
      if (item.stock <= 0) return { ok: false, error: "Item is currently out of stock." };

      const desired = Math.max(1, Math.floor(Number(qty) || 1));
      const cart = this.getCart();
      const existing = cart.find((c) => c.itemId === itemId);
      const currentQty = existing ? existing.qty : 0;
      const nextQty = currentQty + desired;

      if (nextQty > item.stock) {
        return {
          ok: false,
          error: `Only ${item.stock} ${item.unit}(s) available in stock (you already have ${currentQty} in cart).`
        };
      }

      if (existing) {
        existing.qty = nextQty;
      } else {
        cart.push({ itemId, qty: desired });
      }
      writeJSON(KEYS.CART, cart);
      return { ok: true, qty: nextQty };
    },

    setCartQty(itemId, qty) {
      const item = this.getItemById(itemId);
      if (!item) return { ok: false, error: "Item unavailable." };
      const parsed = Math.floor(Number(qty) || 0);
      if (parsed <= 0) {
        this.removeFromCart(itemId);
        return { ok: true };
      }
      if (parsed > item.stock) {
        return { ok: false, error: `Maximum available stock is ${item.stock}.` };
      }
      const cart = this.getCart().map((c) =>
        c.itemId === itemId ? { ...c, qty: parsed } : c
      );
      writeJSON(KEYS.CART, cart);
      return { ok: true };
    },

    removeFromCart(itemId) {
      const cart = this.getCart().filter((c) => c.itemId !== itemId);
      writeJSON(KEYS.CART, cart);
    },

    clearCart() {
      writeJSON(KEYS.CART, []);
    },

    getCartDetails() {
      const items = this.getItems();
      const cart = this.getCart();
      const lines = [];
      let total = 0;
      let count = 0;

      for (const entry of cart) {
        const item = items.find((i) => i.id === entry.itemId);
        if (!item || item.stock <= 0) continue;
        const clampedQty = Math.min(entry.qty, item.stock);
        const lineTotal = clampedQty * Number(item.price);
        lines.push({
          ...item,
          qty: clampedQty,
          lineTotal
        });
        total += lineTotal;
        count += clampedQty;
      }
      return { lines, total, count };
    },

    getOrders() {
      return readJSON(KEYS.ORDERS, []);
    },

    placeOrder({ lines, paymentMethod, paymentMeta, customer }) {
      const items = this.getItems();
      // Verify stock before committing
      for (const line of lines) {
        const inv = items.find((i) => i.id === line.id);
        if (!inv || inv.stock < line.qty) {
          return {
            ok: false,
            error: `Insufficient stock for ${line.name}. Available: ${inv ? inv.stock : 0}.`
          };
        }
      }

      // Deduct stock
      const updatedItems = items.map((inv) => {
        const hit = lines.find((l) => l.id === inv.id);
        return hit ? { ...inv, stock: inv.stock - hit.qty } : inv;
      });
      writeJSON(KEYS.ITEMS, updatedItems);

      const total = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
      const tokenNumber = `AIET-${Math.floor(100 + Math.random() * 900)}`;
      const utr =
        paymentMethod === "Campus Counter Cash"
          ? `CASH-${Date.now().toString().slice(-6)}`
          : `UTR${Math.floor(100000000000 + Math.random() * 899999999999)}`;

      const order = {
        id: `ORD-${Date.now()}`,
        token: tokenNumber,
        utr,
        customerName: customer.name || "AIET Student",
        customerContact: customer.contact || "",
        customerUsn: customer.usn || "",
        lines: lines.map((l) => ({
          id: l.id,
          name: l.name,
          unit: l.unit,
          price: l.price,
          qty: l.qty,
          lineTotal: l.qty * l.price
        })),
        total,
        paymentMethod,
        paymentMeta: paymentMeta || "",
        status: paymentMethod === "Campus Counter Cash" ? "Pending Payment" : "Paid & Confirmed",
        createdAt: new Date().toISOString()
      };

      const orders = this.getOrders();
      orders.unshift(order);
      writeJSON(KEYS.ORDERS, orders);
      return { ok: true, order };
    },

    updateOrderStatus(orderId, status) {
      const orders = this.getOrders().map((o) =>
        o.id === orderId ? { ...o, status } : o
      );
      writeJSON(KEYS.ORDERS, orders);
    },

    getSession() {
      try {
        const raw = sessionStorage.getItem(KEYS.SESSION);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    },

    setSession(session) {
      if (!session) {
        sessionStorage.removeItem(KEYS.SESSION);
        notify();
        return;
      }
      sessionStorage.setItem(KEYS.SESSION, JSON.stringify(session));
      notify();
    },

    resetDemo() {
      writeJSON(KEYS.ITEMS, AIET.SEED_ITEMS);
      writeJSON(KEYS.ORDERS, []);
      writeJSON(KEYS.CART, []);
      writeJSON(KEYS.SETTINGS, AIET.DEFAULT_SETTINGS);
    }
  };
})();
