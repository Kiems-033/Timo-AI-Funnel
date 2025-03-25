const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const botConfig = require('../config/botConfig');

async function findOrCreateUser(userId) {
  try {
    // Check if the user already exists
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('user_id, message_count, is_subscribed')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!userData) {
      // If user doesn't exist, create a new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ user_id: userId, message_count: 0, is_subscribed: false })
        .single();

      if (insertError) throw insertError;

      return newUser;
    }

    return userData;
  } catch (error) {
    logger.error(`Error finding or creating user: ${error.message}`);
    throw error;
  }
}

async function incrementMessageCount(userId) {
  try {
    // Ensure the user exists or create a new user
    const user = await findOrCreateUser(userId);

    const newCount = user.message_count + 1;

    // Update the message count
    const { error: updateError } = await supabase
      .from('users')
      .update({ message_count: newCount })
      .eq('user_id', userId);

    if (updateError) throw updateError;
    return newCount;
  } catch (error) {
    logger.error(`Error incrementing message count: ${error.message}`);
    throw error;
  }
}

async function checkSubscription(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_subscribed')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data.is_subscribed;
  } catch (error) {
    logger.error(`Error checking subscription: ${error.message}`);
    throw error;
  }
}

async function updateSubscription(userId, isSubscribed) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_subscribed: isSubscribed })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    logger.error(`Error updating subscription: ${error.message}`);
    throw error;
  }
}

async function getConversationContext(userId) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(botConfig.ai.contextMessageLimit || 10);

    if (error) throw error;
    return data.reverse();
  } catch (error) {
    logger.error(`Error getting conversation context: ${error.message}`);
    throw error;
  }
}

async function saveMessage(userId, userMessage, aiResponse) {
  try {
    const { error } = await supabase
      .from('messages')
      .insert([
        { user_id: userId, role: 'user', content: userMessage },
        { user_id: userId, role: 'assistant', content: aiResponse }
      ]);

    if (error) throw error;
  } catch (error) {
    logger.error(`Error saving messages: ${error.message}`);
    throw error;
  }
}


module.exports = { 
  findOrCreateUser,
  incrementMessageCount, 
  checkSubscription, 
  updateSubscription, 
  getConversationContext, 
  saveMessage
};