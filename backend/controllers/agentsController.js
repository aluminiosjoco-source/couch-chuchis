const { generateWorkoutPlan } = require('../agents/workoutAgent');
const { generateMealPlan } = require('../agents/nutritionAgent');
const { generateEngagementMessage } = require('../agents/engagementAgent');
const { generateSocialPost } = require('../agents/socialAgent');

/**
 * POST /api/agents/workout
 * Genera un plan de entrenamiento usando el workoutAgent (Ollama).
 */
exports.generateWorkout = async (req, res) => {
  try {
    const clientState = req.body;
    const plan = await generateWorkoutPlan(clientState);
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ error: 'Error generando rutina: ' + error.message });
  }
};

/**
 * POST /api/agents/nutrition
 * Genera un plan de alimentación usando el nutritionAgent (Ollama).
 */
exports.generateNutrition = async (req, res) => {
  try {
    const nutritionProfile = req.body;
    const mealPlan = await generateMealPlan(nutritionProfile);
    res.json({ success: true, meal_plan: mealPlan });
  } catch (error) {
    res.status(500).json({ error: 'Error generando plan nutricional: ' + error.message });
  }
};

/**
 * POST /api/agents/engagement
 * Genera un mensaje de engagement personalizado para retención de cliente.
 */
exports.generateEngagement = async (req, res) => {
  try {
    const context = req.body;
    const message = await generateEngagementMessage(context);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: 'Error generando mensaje de engagement: ' + error.message });
  }
};

/**
 * POST /api/agents/social
 * Genera un post para redes sociales sobre un milestone del cliente.
 */
exports.generateSocial = async (req, res) => {
  try {
    const milestoneData = req.body;
    const post = await generateSocialPost(milestoneData);
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ error: 'Error generando post social: ' + error.message });
  }
};
