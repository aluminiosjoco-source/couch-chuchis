const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Gym = require('../models/Gym');

const PLANES = {
  basico: {
    nombre: 'Básico',
    precio_mensual_mxn: 1499,
    max_entrenadores: 1,
    max_clientes: 20,
    // Agrega aquí tu Price ID de Stripe (modo prueba)
    stripe_price_id: process.env.STRIPE_PRICE_BASICO || 'price_basico_test',
  },
  profesional: {
    nombre: 'Profesional',
    precio_mensual_mxn: 3499,
    max_entrenadores: 5,
    max_clientes: 100,
    stripe_price_id: process.env.STRIPE_PRICE_PROFESIONAL || 'price_profesional_test',
  },
  enterprise: {
    nombre: 'Enterprise',
    precio_mensual_mxn: 7999,
    max_entrenadores: null, // ilimitado
    max_clientes: null,
    stripe_price_id: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_test',
  },
};

// GET /api/stripe/planes
exports.getPlanes = (req, res) => {
  res.json({ planes: PLANES });
};

// POST /api/stripe/checkout  →  Crea una Checkout Session de Stripe
exports.createCheckout = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;

    if (!PLANES[plan]) return res.status(400).json({ error: 'Plan no válido' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Crear o reusar Customer en Stripe
    let customerId = user.subscription?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.nombre,
        metadata: { userId: user._id.toString(), gym_id: user.gym_id || '' },
      });
      customerId = customer.id;
      user.subscription.stripe_customer_id = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PLANES[plan].stripe_price_id, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?checkout=success&plan=${plan}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing?checkout=cancelled`,
      metadata: { userId: user._id.toString(), plan },
    });

    res.json({ checkout_url: session.url, session_id: session.id });
  } catch (error) {
    res.status(500).json({ error: 'Error creando Checkout: ' + error.message });
  }
};

// POST /api/stripe/webhook  →  Maneja eventos de Stripe (pago confirmado, cancelación, etc.)
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook Stripe inválido:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plan } = session.metadata;
        const user = await User.findById(userId);
        if (user) {
          user.subscription.plan = plan;
          user.subscription.status = 'active';
          user.subscription.stripe_subscription_id = session.subscription;
          await user.save();
          // Actualizar límites del Gym si el user es gym_owner
          if (user.rol === 'gym_owner' && user.gym_id) {
            await Gym.findOneAndUpdate({ gym_id: user.gym_id }, {
              'plan.tipo': plan,
              'plan.status': 'active',
              'plan.max_entrenadores': PLANES[plan].max_entrenadores,
              'plan.max_clientes': PLANES[plan].max_clientes,
              'plan.stripe_subscription_id': session.subscription,
            });
          }
          console.log(`✅ Suscripción ${plan} activada para usuario ${userId}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripe_subscription_id': subscription.id },
          { 'subscription.status': 'inactive', 'subscription.plan': null }
        );
        console.log(`❌ Suscripción cancelada: ${subscription.id}`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripe_customer_id': invoice.customer },
          { 'subscription.status': 'past_due' }
        );
        console.log(`⚠️ Pago fallido para customer: ${invoice.customer}`);
        break;
      }
      default:
        console.log(`Evento Stripe ignorado: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/stripe/subscription  →  Estado actual de suscripción del usuario
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ subscription: user.subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
