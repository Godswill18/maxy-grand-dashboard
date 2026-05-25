interface ReceiptOrder {
  _id: string;
  orderType: string;
  roomNumber?: string;
  tableNumber?: string;
  customerName?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  specialInstructions?: string;
}

function formatReceiptDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + '  ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getOrderLocation(order: ReceiptOrder): string {
  switch (order.orderType) {
    case 'room service': return `Room ${order.roomNumber}`;
    case 'table service': return `Table ${order.tableNumber}`;
    case 'pickup': return `Pickup: ${order.customerName}`;
    default: return order.orderType;
  }
}

function pad(str: string, width: number, right = false): string {
  const s = String(str);
  if (s.length >= width) return s;
  const padding = ' '.repeat(width - s.length);
  return right ? padding + s : s + padding;
}

export function printReceipt(order: ReceiptOrder, waiterName?: string): void {
  const win = window.open('', '_blank', 'width=420,height=720,scrollbars=yes');
  if (!win) {
    console.warn('Pop-up blocked — allow pop-ups for receipt printing');
    return;
  }

  const orderNum = order._id.slice(-8).toUpperCase();
  const dateStr = formatReceiptDate(order.createdAt);
  const location = getOrderLocation(order);
  const colWidth = 32;

  const itemRows = order.items.map(item => {
    const label = `${item.quantity}x ${item.name}`;
    const amount = `₦${(item.price * item.quantity).toLocaleString()}`;
    const truncated = label.length > colWidth - amount.length - 1
      ? label.slice(0, colWidth - amount.length - 4) + '...'
      : label;
    return `<div class="row"><span>${truncated}</span><span>${amount}</span></div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - Order #${orderNum}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      width: 80mm;
      margin: 0 auto;
      padding: 10px 8px;
      background: #fff;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .hotel-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
    .subtitle { font-size: 11px; letter-spacing: 2px; margin-top: 2px; }
    .divider-solid { border-top: 2px solid #000; margin: 6px 0; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .row span:last-child { white-space: nowrap; margin-left: 4px; }
    .label { color: #555; font-size: 11px; }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: bold;
      margin: 4px 0;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-top: 3px;
    }
    .paid { color: #166534; font-weight: bold; }
    .unpaid { color: #991b1b; font-weight: bold; }
    .footer { font-size: 11px; margin-top: 4px; }
    .instructions { font-size: 11px; font-style: italic; margin-top: 2px; word-break: break-word; }
    @media print {
      body { width: 80mm; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="hotel-name">MAXY GRAND HOTEL</div>
    <div class="subtitle">ORDER RECEIPT</div>
  </div>
  <div class="divider-solid"></div>

  <div class="row"><span class="label">Order #:</span><span class="bold">${orderNum}</span></div>
  <div class="row"><span class="label">Date:</span><span>${dateStr}</span></div>
  <div class="row"><span class="label">Location:</span><span>${location}</span></div>
  ${waiterName ? `<div class="row"><span class="label">Served by:</span><span>${waiterName}</span></div>` : ''}

  <div class="divider"></div>

  ${itemRows}

  <div class="divider"></div>

  <div class="total-row">
    <span>TOTAL</span>
    <span>&#x20A6;${order.totalAmount.toLocaleString()}</span>
  </div>
  <div class="payment-row">
    <span class="label">Payment:</span>
    <span class="${order.paymentStatus === 'paid' ? 'paid' : 'unpaid'}">
      ${order.paymentStatus.toUpperCase()}
    </span>
  </div>

  ${order.specialInstructions ? `
  <div class="divider"></div>
  <div class="label">Note:</div>
  <div class="instructions">${order.specialInstructions}</div>
  ` : ''}

  <div class="divider-solid"></div>
  <div class="center footer">
    <div>Thank you for dining with us!</div>
    <div style="margin-top:4px;color:#555;">Maxy Grand Hotel &mdash; Your comfort is our priority</div>
  </div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Small delay to ensure content renders before print dialog opens
  setTimeout(() => {
    win.focus();
    win.print();
    win.close();
  }, 300);
}
