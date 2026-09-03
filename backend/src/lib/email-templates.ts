import type { OrderDoc } from '../models/Order.js'

function buildItemsList(order: OrderDoc): string {
  let itemsHtml = ''

  for (const item of order.items) {
    const addonsPrice = item.selectedAddons.reduce((sum, addon) => sum + addon.price * addon.qty, 0)
    const unitPrice = item.priceAtOrder + addonsPrice
    const itemTotal = unitPrice * item.qty

    itemsHtml += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: bold; color: #1f2937;">${item.name}</div>
          ${item.selectedAddons.length > 0 ? `
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              + ${item.selectedAddons.map(a => a.name).join(', ')}
            </div>
          ` : ''}
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">الكمية: ${item.qty}</div>
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151;">
          ${itemTotal.toLocaleString('ar-EG')} ج.م
        </td>
      </tr>
    `
  }

  return itemsHtml
}

export function orderConfirmationEmail(order: OrderDoc): { subject: string; html: string } {
  const subject = `تأكيد استلام الطلب رقم ${order.orderNumber} - الحسين للاب توب`

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تأكيد استلام الطلب</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px; border-bottom: 2px solid #0FC7C1;">
          <h1 style="color: #0FC7C1; margin: 0; font-size: 24px;">الحسين للاب توب</h1>
        </div>

        <!-- Content -->
        <div style="padding: 20px;">
          <h2 style="color: #1f2937; margin-top: 0;">تم استلام طلبك بنجاح!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            مرحباً <strong>${order.customerName}</strong>،
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            نشكرك على تسوقك معنا. تم استلام طلبك رقم <strong>${order.orderNumber}</strong> وهو الآن قيد المراجعة والتحقق من الدفع.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            تاريخ الطلب: ${new Date(order.createdAt).toLocaleDateString('ar-EG')}
          </p>

          <!-- Order Details -->
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">تفاصيل الطلب</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: right; color: #374151;">المنتج</th>
                  <th style="padding: 12px; text-align: center; color: #374151;">السعر</th>
                </tr>
              </thead>
              <tbody>
                ${buildItemsList(order)}
              </tbody>
            </table>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">تكلفة الشحن:</span>
                <span style="color: #374151; font-weight: bold;">${order.shippingCost.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #0FC7C1;">
                <span>الإجمالي:</span>
                <span>${order.total.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          </div>

          <!-- Delivery Info -->
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">معلومات التوصيل</h3>
            <p style="color: #4b5563; margin: 8px 0;">
              <strong>طريقة الاستلام:</strong> ${order.deliveryMethod === 'shipping' ? 'شحن للمنزل' : 'استلام من المتجر'}
            </p>
            ${order.deliveryMethod === 'shipping' ? `
              <p style="color: #4b5563; margin: 8px 0;">
                <strong>العنوان:</strong> ${order.address}
              </p>
              <p style="color: #4b5563; margin: 8px 0;">
                <strong>المحافظة:</strong> ${order.governorate}
              </p>
            ` : `
              <p style="color: #4b5563; margin: 8px 0;">
                <strong>العنوان:</strong> استلام من المتجر - القاهرة، مصر
              </p>
            `}
          </div>

          <!-- Payment Info -->
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">معلومات الدفع</h3>
            <p style="color: #4b5563; margin: 8px 0;">
              <strong>طريقة الدفع:</strong> ${order.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'إنستا باي'}
            </p>
            <p style="color: #4b5563; margin: 8px 0;">
              <strong>حالة الدفع:</strong> قيد المراجعة
            </p>
            <p style="color: #f59e0b; margin: 8px 0; font-size: 14px;">
              ⚠️ سيتم التواصل معك عبر واتساب أو الهاتف لتأكيد التحويل وموعد التوصيل.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>شكراً لتسوقك معنا!</p>
          <p>الحسين للاب توب</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}

export function orderReceiptEmail(order: OrderDoc): { subject: string; html: string } {
  const subject = `إيصال الطلب رقم ${order.orderNumber} - الحسين للاب توب`

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إيصال الطلب</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px; border-bottom: 2px solid #0FC7C1;">
          <h1 style="color: #0FC7C1; margin: 0; font-size: 24px;">الحسين للاب توب</h1>
        </div>

        <!-- Content -->
        <div style="padding: 20px;">
          <h2 style="color: #1f2937; margin-top: 0;">تم إكمال طلبك بنجاح!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            مرحباً <strong>${order.customerName}</strong>،
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            تم إكمال طلبك رقم <strong>${order.orderNumber}</strong> بنجاح. هذا إيصال بطلبك.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            تاريخ الإكمال: ${new Date(order.updatedAt).toLocaleDateString('ar-EG')}
          </p>

          <!-- Order Details -->
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">تفاصيل الطلب</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: right; color: #374151;">المنتج</th>
                  <th style="padding: 12px; text-align: center; color: #374151;">السعر</th>
                </tr>
              </thead>
              <tbody>
                ${buildItemsList(order)}
              </tbody>
            </table>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">تكلفة الشحن:</span>
                <span style="color: #374151; font-weight: bold;">${order.shippingCost.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #0FC7C1;">
                <span>الإجمالي المدفوع:</span>
                <span>${order.total.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          </div>

          <!-- Delivery Info -->
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">معلومات التوصيل</h3>
            <p style="color: #4b5563; margin: 8px 0;">
              <strong>طريقة الاستلام:</strong> ${order.deliveryMethod === 'shipping' ? 'شحن للمنزل' : 'استلام من المتجر'}
            </p>
            ${order.deliveryMethod === 'shipping' ? `
              <p style="color: #4b5563; margin: 8px 0;">
                <strong>العنوان:</strong> ${order.address}
              </p>
              <p style="color: #4b5563; margin: 8px 0;">
                <strong>المحافظة:</strong> ${order.governorate}
              </p>
            ` : `
              <p style="color: #4b5563; margin: 8px 0;">
                <strong>العنوان:</strong> استلام من المتجر - القاهرة، مصر
              </p>
            `}
          </div>

          <!-- Payment Info -->
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">معلومات الدفع</h3>
            <p style="color: #4b5563; margin: 8px 0;">
              <strong>طريقة الدفع:</strong> ${order.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'إنستا باي'}
            </p>
            <p style="color: #059669; margin: 8px 0; font-weight: bold;">
              ✅ تم تأكيد الدفع
            </p>
          </div>

          <!-- Thank You -->
          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 8px;">
            <p style="color: #059669; font-size: 18px; font-weight: bold; margin: 0;">شكراً لتسوقك معنا!</p>
            <p style="color: #4b5563; margin: 8px 0;">نتمنى لك تجربة رائعة مع منتجاتنا</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>الحسين للاب توب</p>
          <p>للاستفسار، تواصل معنا عبر واتساب أو الهاتف</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}
