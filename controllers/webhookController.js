import { Webhook } from 'svix';
import User from '../models/User.js';

/**
 * @desc    Webhook de Clerk para sincronizar usuarios
 * @route   POST /api/webhooks/clerk
 * @access  Public (pero verificado con firma de Clerk)
 */
export const clerkWebhook = async (req, res) => {
  try {
    // Obtener headers necesarios para verificación
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Webhook secret not configured'
      });
    }

    // Obtener headers de la petición
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    // Verificar que tenemos todos los headers
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Svix headers'
      });
    }

    // Obtener el body raw (ya viene como string desde el middleware)
    const payload = req.rawBody || JSON.stringify(req.body);

    // Crear instancia de Webhook de Svix
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Verificar la firma del webhook
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({
        success: false,
        message: 'Webhook verification failed'
      });
    }

    // El webhook está verificado, procesar el evento
    const { id, ...attributes } = evt.data;
    const eventType = evt.type;

    // Manejar diferentes tipos de eventos
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(id, attributes);
        break;

      case 'user.updated':
        await handleUserUpdated(id, attributes);
        break;

      case 'user.deleted':
        await handleUserDeleted(id);
        break;

      default:
        // Evento no soportado, ignorar silenciosamente
        break;
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Manejar creación de usuario
 */
async function handleUserCreated(clerkId, attributes) {
  try {
    const userData = {
      clerkId,
      email: attributes.email_addresses?.[0]?.email_address || '',
      firstName: attributes.first_name || '',
      lastName: attributes.last_name || '',
      username: attributes.username || '',
      profileImage: attributes.image_url || '',
      emailVerified: attributes.email_addresses?.[0]?.verification?.status === 'verified',
      clerkCreatedAt: new Date(attributes.created_at),
      clerkUpdatedAt: new Date(attributes.updated_at)
    };

    const user = await User.create(userData);
    return user;
  } catch (error) {
    console.error('Error creating user:', error.message);
    throw error;
  }
}

/**
 * Manejar actualización de usuario
 */
async function handleUserUpdated(clerkId, attributes) {
  try {
    const updateData = {
      email: attributes.email_addresses?.[0]?.email_address || '',
      firstName: attributes.first_name || '',
      lastName: attributes.last_name || '',
      username: attributes.username || '',
      profileImage: attributes.image_url || '',
      emailVerified: attributes.email_addresses?.[0]?.verification?.status === 'verified',
      clerkUpdatedAt: new Date(attributes.updated_at)
    };

    const user = await User.findOneAndUpdate(
      { clerkId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      await handleUserCreated(clerkId, attributes);
    }

    return user;
  } catch (error) {
    console.error('Error updating user:', error.message);
    throw error;
  }
}

/**
 * Manejar eliminación de usuario
 */
async function handleUserDeleted(clerkId) {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId },
      { isActive: false },
      { new: true }
    );

    return user;
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw error;
  }
}
