// ============================================
// Script de verificación MongoDB
// ============================================

import mongoose from 'mongoose';
import Lead from './models/Lead.js';
import LeadMessage from './models/LeadMessage.js';
import MessageTemplate from './models/MessageTemplate.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

async function verificarMongoDB() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conexión exitosa a MongoDB');

        // Verificar leads
        const leads = await Lead.countDocuments();
        console.log(`📊 Leads en DB: ${leads}`);

        // Verificar mensajes
        const messages = await LeadMessage.countDocuments();
        console.log(`💬 Mensajes en DB: ${messages}`);

        // Verificar plantillas
        const templates = await MessageTemplate.countDocuments();
        console.log(`📄 Plantillas en DB: ${templates}`);

        // Mostrar algunos datos de muestra
        if (leads > 0) {
            const sampleLead = await Lead.findOne().select('nombre correo estado');
            console.log(`🎯 Lead ejemplo: ${sampleLead.nombre} (${sampleLead.estado})`);
        }

        if (messages > 0) {
            const sampleMessage = await LeadMessage.findOne().select('tipo autor.nombre contenido');
            console.log(`💌 Mensaje ejemplo: ${sampleMessage.tipo} de ${sampleMessage.autor.nombre}`);
        }

        if (templates > 0) {
            const sampleTemplate = await MessageTemplate.findOne().select('titulo tipo');
            console.log(`📋 Plantilla ejemplo: ${sampleTemplate.titulo} (${sampleTemplate.tipo})`);
        }

        console.log('\n🎉 Verificación completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar verificación
verificarMongoDB();