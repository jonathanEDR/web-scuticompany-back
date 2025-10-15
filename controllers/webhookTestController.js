import User from '../models/User.js';

/**
 * @desc    Webhook temporal de Clerk (sin verificación Svix para pruebas)
 * @route   POST /api/webhooks/clerk-test
 * @access  Public
 */
export const clerkWebhookTest = async (req, res) => {
  try {
    console.log('🧪 Webhook de prueba recibido');
    console.log('📦 Datos completos:', JSON.stringify(req.body, null, 2));
    
    const eventType = req.body.type;
    const userData = req.body.data;
    
    console.log('🔍 Tipo de evento detectado:', eventType);
    console.log('👤 Datos del usuario:', userData);
    
    console.log(`🔄 Procesando evento: ${eventType}`);
    
    switch (eventType) {
      case 'user.created':
        // Crear nuevo usuario en MongoDB
        console.log('👤 Creando nuevo usuario...');
        
        const newUser = new User({
          clerkId: userData.id,
          email: userData.email_addresses?.[0]?.email_address || '',
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          username: userData.username || userData.email_addresses?.[0]?.email_address?.split('@')[0] || '',
          profileImage: userData.profile_image_url || userData.image_url || ''
        });
        
        await newUser.save();
        console.log('✅ Usuario creado en MongoDB:', newUser.email);
        
        break;
        
      case 'user.updated':
        // Actualizar usuario existente
        console.log('📝 Actualizando usuario...');
        
        const updatedUser = await User.findOneAndUpdate(
          { clerkId: userData.id },
          {
            email: userData.email_addresses?.[0]?.email_address || '',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            username: userData.username || userData.email_addresses?.[0]?.email_address?.split('@')[0] || '',
            profileImage: userData.profile_image_url || userData.image_url || ''
          },
          { new: true }
        );
        
        if (updatedUser) {
          console.log('✅ Usuario actualizado en MongoDB:', updatedUser.email);
        } else {
          console.log('⚠️ Usuario no encontrado para actualizar');
        }
        
        break;
        
      case 'user.deleted':
        // Eliminar usuario
        console.log('🗑️ Eliminando usuario...');
        
        const deletedUser = await User.findOneAndDelete({ clerkId: userData.id });
        
        if (deletedUser) {
          console.log('✅ Usuario eliminado de MongoDB:', deletedUser.email);
        } else {
          console.log('⚠️ Usuario no encontrado para eliminar');
        }
        
        break;
        
      default:
        console.log(`⚠️ Evento no manejado: ${eventType}`);
    }
    
    return res.status(200).json({
      success: true,
      message: `Evento ${eventType} procesado correctamente`,
      event: eventType
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};