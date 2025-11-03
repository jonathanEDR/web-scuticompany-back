// Test rápido de email con Resend
import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('🧪 Probando envío de email...');
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'TU_EMAIL_AQUI@gmail.com', // Cambia por tu email personal
      subject: '🎉 Test desde Web Scuti Backend',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1>🚀 Scuti Company</h1>
          </div>
          <div style="padding: 30px;">
            <h2>¡Email Test Exitoso!</h2>
            <p>Si ves este email, tu configuración de Resend está funcionando perfectamente.</p>
            <p><strong>API Key:</strong> ${process.env.RESEND_API_KEY.substring(0, 10)}...</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>✅ Sistema de mensajería listo para usar</strong></p>
            </div>
          </div>
        </div>
      `,
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 ID del email:', result.id);
    console.log('🎯 Revisa tu bandeja de entrada');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('not verified')) {
      console.log('💡 Solución: Ve a Resend → Settings → Verified Emails');
      console.log('   Agrega y verifica: admin@scuti.com');
    }
  }
}

testEmail();