import mongoose from 'mongoose';
import Lead from './models/Lead.js';

async function checkAllLeads() {
  try {
    await mongoose.connect('mongodb://localhost:27017/web-scuti');
    
    console.log('=== TODOS LOS LEADS ===');
    const leads = await Lead.find({}).select('nombre email telefono usuarioRegistrado createdBy estado').sort({ createdAt: -1 });
    
    leads.forEach((lead, index) => {
      console.log(`${index + 1}. ID: ${lead._id}`);
      console.log(`   Nombre: ${lead.nombre}`);
      console.log(`   Email: ${lead.email || 'Sin email'}`);
      console.log(`   Teléfono: ${lead.telefono || 'Sin teléfono'}`);
      console.log(`   Estado: ${lead.estado}`);
      console.log(`   Creado por: ${lead.createdBy || 'Sin información'}`);
      console.log(`   Usuario Vinculado: ${lead.usuarioRegistrado?.userId ? 
        `✅ ${lead.usuarioRegistrado.email}` : '❌ No vinculado'}`);
      console.log('   ---');
    });
    
    console.log('\n=== LEADS VINCULADOS ===');
    const linkedLeads = leads.filter(lead => lead.usuarioRegistrado?.userId);
    if (linkedLeads.length === 0) {
      console.log('⚠️  NO HAY LEADS VINCULADOS A USUARIOS');
    } else {
      linkedLeads.forEach(lead => {
        console.log(`✅ ${lead.nombre} -> ${lead.usuarioRegistrado.email}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllLeads();