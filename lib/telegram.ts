import { Settings } from '../types';

export function formatNewOrderMessage(data: any) {
  return `🛒 <b>NEW ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━
Order: <code>${data.orderNumber}</code>
Customer: ${data.customerName}
Items: ${data.items.length} product(s)
Total: $${data.totalPrice.toFixed(2)}
━━━━━━━━━━━━━━━━━━
⏳ Waiting for your approval`;
}

export function formatLowStockMessage(data: any) {
  return `⚠️ <b>LOW STOCK ALERT</b>
━━━━━━━━━━━━━━━━━━
Product: <b>${data.title}</b>
Current Stock: <code>${data.stock}</code>
Threshold: ${data.lowStockThreshold}
━━━━━━━━━━━━━━━━━━
Action needed: Refill stock`;
}

export function formatShippedMessage(data: any) {
  return `📦 <b>ORDER SHIPPED!</b>
━━━━━━━━━━━━━━━━━━
Order: <code>${data.orderNumber}</code>
Customer: ${data.customerName}
Carrier: ${data.carrier}
Tracking: <code>${data.trackingNumber}</code>
━━━━━━━━━━━━━━━━━━
Customer notified ✓`;
}

export async function sendTelegramNotification(
  type: 'new_order' | 'low_stock' | 'shipped' | 'daily_summary',
  data: any,
  settings: Settings
) {
  if (!settings.telegramBotToken || !settings.telegramChatId) {
    console.debug('Telegram not configured, skipping notification');
    return false;
  }
  
  let message = '';
  
  switch (type) {
    case 'new_order':
      message = formatNewOrderMessage(data);
      break;
    case 'low_stock':
      message = formatLowStockMessage(data);
      break;
    case 'shipped':
      message = formatShippedMessage(data);
      break;
    // Daily summary simplified for demo
    case 'daily_summary':
      message = `📊 <b>DAILY SUMMARY</b>\nRevenue: $${data.revenue}\nOrders: ${data.orders}`;
      break;
  }
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Telegram notification failed:', error);
    return false;
  }
}