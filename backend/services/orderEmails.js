// services/orderEmails.js
import Order from "../models/Order.js";
import { sendMail } from "./mailer.js";

export async function sendOrderEmail(orderId, type = "paid") {
  try {
    const order = await Order.findById(orderId).populate("userId", "email name");
    
    if (!order) {
      console.warn("⚠️ Order not found for email:", orderId);
      return;
    }

    const to = order?.userId?.email || order?.email;
    if (!to) {
      console.warn("⚠️ No email on order:", orderId);
      return;
    }

    const name = order?.userId?.name || "عميلنا العزيز";
    const orderTotal = order?.amounts?.grandTotal || 0;
    const currency = order?.currency || "EGP";

  
    const emailTemplates = {
      paid: {
        subject: `✅ تم تأكيد الدفع - طلب #${orderId.toString().slice(-6)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; padding: 20px; direction: rtl; }
              .container { background: white; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .order-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .total { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 شكرًا لطلبك!</h1>
              </div>
              <div class="content">
                <h2>مرحبًا ${name} 👋</h2>
                <p>تم استلام الدفع بنجاح وتأكيد طلبك.</p>
                
                <div class="order-box">
                  <h3>📦 تفاصيل الطلب</h3>
                  <div class="detail-row">
                    <span>رقم الطلب:</span>
                    <strong>#${orderId.toString().slice(-8)}</strong>
                  </div>
                  <div class="detail-row">
                    <span>المبلغ الإجمالي:</span>
                    <strong>${orderTotal} ${currency}</strong>
                  </div>
                  <div class="detail-row">
                    <span>رقم المعاملة:</span>
                    <strong>${order?.payment?.txId || "-"}</strong>
                  </div>
                  <div class="detail-row">
                    <span>الحالة:</span>
                    <strong style="color: #10B981;">✅ مدفوع</strong>
                  </div>
                </div>
                
                <p>سيتم شحن طلبك في أقرب وقت ممكن.</p>
                <p>شكرًا لتسوقك من Bookstore 📚</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Bookstore. جميع الحقوق محفوظة.</p>
              </div>
            </div>
          </body>
          </html>
        `
      },
      
      failed: {
        subject: `❌ فشل الدفع - طلب #${orderId.toString().slice(-6)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; padding: 20px; direction: rtl; }
              .container { background: white; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .alert-box { background: #fee; border: 2px solid #fcc; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ فشل الدفع</h1>
              </div>
              <div class="content">
                <h2>مرحبًا ${name} 👋</h2>
                <div class="alert-box">
                  <p><strong>للأسف، فشلت عملية الدفع لطلبك #${orderId.toString().slice(-8)}</strong></p>
                  <p>المبلغ: <strong>${orderTotal} ${currency}</strong></p>
                </div>
                
                <p>يرجى المحاولة مرة أخرى أو استخدام وسيلة دفع أخرى.</p>
                <p>إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Bookstore. جميع الحقوق محفوظة.</p>
              </div>
            </div>
          </body>
          </html>
        `
      },

      cancelled: {
        subject: `⏱️ انتهت صلاحية الدفع - طلب #${orderId.toString().slice(-6)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f4f4; padding: 20px; direction: rtl; }
              .container { background: white; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏱️ انتهت صلاحية الطلب</h1>
              </div>
              <div class="content">
                <h2>مرحبًا ${name} 👋</h2>
                <p>انتهت صلاحية جلسة الدفع للطلب #${orderId.toString().slice(-8)}</p>
                <p>يمكنك إنشاء طلب جديد للمتابعة.</p>
                <p>تم إلغاء الطلب وإعادة المنتجات للمخزون.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Bookstore. جميع الحقوق محفوظة.</p>
              </div>
            </div>
          </body>
          </html>
        `
      }
    };

    const template = emailTemplates[type];
    if (!template) {
      console.warn(`⚠️ Unknown email type: ${type}`);
      return;
    }

    await sendMail({
      to,
      subject: template.subject,
      html: template.html
    });

    console.log(`✅ ${type} email sent to ${to} for order ${orderId}`);
  } catch (error) {
    console.error(`❌ Error sending ${type} email:`, error.message);
  }
}