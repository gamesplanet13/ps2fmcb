(function () {
  "use strict";

  const KIND = window.GPZ_PROJECT_KIND || "products";
  const money = value => String(Math.round(Number(value) || 0));
  const text = value => String(value == null ? "" : value).trim();
  const compact = value => text(value).replace(/\s+/g, " ");

  function storedSummary() {
    try { return JSON.parse(localStorage.getItem("gp_order_summary") || "{}"); }
    catch (_) { return {}; }
  }

  function currentOrder() {
    try {
      if (typeof gpzCurrentOrder !== "undefined" && gpzCurrentOrder) return gpzCurrentOrder;
    } catch (_) {}
    return window.gpzCurrentOrder || {};
  }

  function normalizeItems(order) {
    const summary = storedSummary();
    const source = (order.items && order.items.length ? order.items : summary.items) || [];
    const storedItems = summary.items || [];
    return source.map((raw, index) => {
      const stored = storedItems[index] || storedItems.find(item => compact(item.name || item.product) === compact(raw.name || raw.product)) || {};
      const quantity = Math.max(1, Number(raw.quantity || raw.qty) || 1);
      const unitPrice = Number(raw.unitPrice ?? raw.price) || 0;
      const variant = compact(raw.variant || stored.variant || raw.option || stored.option || raw.storage || stored.storage || "");
      const size = compact(raw.size || stored.size || raw.dimensions || stored.dimensions || raw.dimension || "");
      const unitWeight = Number(raw.unitWeight ?? raw.weight) || 0;
      return {
        index: index + 1,
        name: compact(raw.name || raw.product || raw.title || `Product ${index + 1}`),
        variant,
        quantity,
        unitPrice,
        lineTotal: Number(raw.lineTotal) || unitPrice * quantity,
        unitWeight,
        lineWeight: Number(raw.lineWeight) || unitWeight * quantity,
        size
      };
    });
  }

  function shortProductName(item) {
    let name = item.name;
    if (KIND === "fmcb") {
      if (/memory card|fmcb|funtuna/i.test(name)) return /funtuna/i.test(name) ? "FunTuna Memory Card" : "FMCB Memory Card";
      if (/usb|pen drive|pendrive/i.test(name)) return "USB for PS2";
      if (/controller|gamepad/i.test(name)) return name.replace(/\s*[—-].*$/, "");
    }
    return name.replace(/\s*[—-]\s*(?:PS2 Slim|PS2 Fat|64GB|128GB|256GB|PD\s*[23]\.0).*$/i, "");
  }

  function buildProductLine(items) {
    if (KIND === "arcade") return "Arcade Accessories";
    return items.map(item => `${shortProductName(item)} x${item.quantity}`).join(" + ") || "Selected Products";
  }

  function buildVariantLine(items, order) {
    const variants = items.map(item => item.variant).filter(Boolean);
    const fallback = compact(order.variant || storedSummary().variant || "");
    return [...new Set(variants.length ? variants : (fallback ? [fallback] : []))].join(" + ");
  }

  function valueOf(id) {
    const node = document.getElementById(id);
    return node ? compact(node.value) : "";
  }

  function orderDetails(order) {
    const c = order.customer || {};
    const d = order.delivery || {};
    return {
      id: text(order.orderId || valueOf("orderId")),
      name: text(c.name || valueOf("name")),
      mobile: text(c.mobile || valueOf("mobile")),
      altMobile: text(c.altMobile || valueOf("altMobile")),
      email: text(c.email || valueOf("email")),
      address: text(c.address || valueOf("address")),
      landmark: text(c.landmark || valueOf("landmark")),
      pincode: text(d.pincode || valueOf("pincode")),
      state: text(d.state || valueOf("state")),
      district: text(d.district || valueOf("district")),
      postOffice: text(d.postOffice || valueOf("postOffice"))
    };
  }

  window.buildWhatsAppTemplate = function () {
    const order = currentOrder();
    const items = normalizeItems(order);
    const info = orderDetails(order);
    const payment = order.payment || {};
    const totals = order.totals || {};
    const shipping = order.shipping || {};
    const prepaid = (payment.type || valueOf("paymentMethod") || "prepaid") !== "cod";
    const productsTotal = Number(totals.productTotal ?? totals.productsTotal) || items.reduce((s, i) => s + i.lineTotal, 0);
    const courier = Number(totals.courierCharge ?? totals.courierCharges) || 0;
    const gst = Number(totals.gstAmount) || 0;
    const vas = Number(totals.vasAmount) || 0;
    const finalAmount = Number(totals.grandTotal ?? totals.finalAmount) || productsTotal + courier + gst + vas;
    const paid = prepaid ? finalAmount : (Number(payment.advancePaid) || 0);
    const rest = Math.max(0, finalAmount - paid);
    const weight = Number(totals.totalWeight) || items.reduce((s, i) => s + i.lineWeight, 0);
    const box = compact(totals.boxSize || [totals.boxL, totals.boxW, totals.boxH].filter(Boolean).join(" x "));
    const title = prepaid ? "🟢 Prepaid Order on WhatsApp" : "🔴 COD Order on WhatsApp";
    const productLine = buildProductLine(items);
    const variantLine = buildVariantLine(items, order);
    const lines = [
      title, "",
      `Order ID: ${info.id}`,
      `Name: ${info.name}`,
      `Mobile: ${info.mobile}`,
      `Alt Mobile: ${info.altMobile}`,
      `Email: ${info.email}`,
      `Address: ${info.address}`,
      `Landmark: ${info.landmark}`,
      `Pincode: ${info.pincode}`,
      `State: ${info.state}`,
      `District/City: ${info.district}`,
      `Post office: ${info.postOffice}`, "",
      `Product: ${productLine}`
    ];
    if (variantLine) lines.push(`Variant: ${variantLine}`);
    lines.push(
      `Base Price: ${money(productsTotal)}`,
      `Courier Company: ${compact(shipping.courierName || shipping.courier || valueOf("courier"))}`,
      `Courier Charges: ${money(courier)}`
    );
    if (gst > 0) lines.push(`GST Included: ${money(gst)}`);
    if (vas > 0) lines.push(`VAS: ${money(vas)}`);
    lines.push(`Amount Paid: ${money(paid)}`);
    if (!prepaid) lines.push(`Rest on Delivery: ${money(rest)}`);
    lines.push(
      "",
      `📏 Distance: ${compact(shipping.distanceText || shipping.distance || "")}`,
      `⏳ ${prepaid ? "Prepaid" : "COD"} Order ETA: ${compact(shipping.eta || "")}`,
      `📅 Estimated Delivery: ${compact(shipping.estimatedDelivery || shipping.deliveryDate || "")}`,
      "", "🧾 ORDER DETAILS", ""
    );
    items.forEach((item, index) => {
      if (index) lines.push("────────────────────", "");
      lines.push(`${index + 1}. ${item.name}`);
      if (item.variant) lines.push(`Variant: ${item.variant}`);
      lines.push(`Quantity: ${item.quantity}`);
      lines.push(`Price Each: ${money(item.unitPrice)}`);
      lines.push(`Product Total: ${money(item.lineTotal)}`);
      if (item.lineWeight) lines.push(`Weight: ${item.lineWeight} g`);
      if (item.size) lines.push(`Size: ${item.size}`);
      lines.push("");
    });
    lines.push(
      "────────────────────",
      `Selected Products Total: ${money(productsTotal)}`,
      `Total Weight: ${weight} g`
    );
    if (totals.packagingWeight) lines.push(`Packaging Weight: ${totals.packagingWeight} g`);
    if (box) lines.push(`Box Size: ${box}${/cm/i.test(box) ? "" : " cm"}`);
    if (totals.chargeableWeight) lines.push(`Chargeable Weight: ${totals.chargeableWeight} kg`);
    lines.push(`Total Courier Charges: ${money(courier)}`);
    if (gst > 0) lines.push(`GST Included: ${money(gst)}`);
    if (vas > 0) lines.push(`VAS: ${money(vas)}`);
    lines.push(`Final Total: ${money(finalAmount)}`, `Amount Paid: ${money(paid)}`);
    if (!prepaid) lines.push(`Rest on Delivery: ${money(rest)}`);
    return lines.join("\n");
  };

  if (kind !== "arcade") {
    const addon = document.getElementById("addonSelect");
    if (addon) {
      const panel = addon.closest(".card, .section, .panel") || addon.parentElement;
      if (panel) panel.style.display = "none";
    }
  }
})();
