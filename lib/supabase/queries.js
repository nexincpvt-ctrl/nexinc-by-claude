/**
 * Data Access Helpers for NexInc
 * 
 * These helper functions provide clean methods for reading and writing data
 * to Supabase tables (profiles, chat_sessions, messages). They handle error logging
 * and return parsed data.
 */

/**
 * Fetch a user's profile details.
 * 
 * @param {object} supabase - The active Supabase client instance.
 * @param {string} userId - The unique ID of the user.
 * @returns {Promise<object>} The user's profile data.
 */
export async function getProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error.message);
    throw error;
  }
  return data;
}

/**
 * Update a user's subscription plan. (Used later during payment integration).
 * 
 * @param {object} supabase - The active Supabase client instance.
 * @param {string} userId - The unique ID of the user.
 * @param {string} plan - The new plan name ('free' or 'ultimate').
 * @returns {Promise<object>} The updated profile row.
 */
export async function updateProfilePlan(supabase, userId, plan) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user plan:", error.message);
    throw error;
  }
  return data;
}

/**
 * Create a new chat session for a user in a specific section.
 * 
 * @param {object} supabase - The active Supabase client instance.
 * @param {string} userId - The unique ID of the user.
 * @param {string} section - The category ('chat', 'code', 'learning', or 'research').
 * @returns {Promise<object>} The newly created chat session row.
 */
export async function createChatSession(supabase, userId, section) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      section: section,
      title: "New chat", // Default title
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat session:", error.message);
    throw error;
  }
  return data;
}

/**
 * Retrieve all chat sessions for a user, optionally filtered by section.
 * Ordered by latest updated_at first.
 * 
 * @param {object} supabase - The active Supabase client instance.
 * @param {string} userId - The unique ID of the user.
 * @param {string} [section] - Optional filter for the section category.
 * @returns {Promise<Array>} List of chat sessions.
 */
export async function getChatSessions(supabase, userId, section) {
  let query = supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  // Apply filter if section is provided
  if (section) {
    query = query.eq("section", section);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching chat sessions:", error.message);
    throw error;
  }
  return data;
}

/**
 * Rename the title of a specific chat session.
 * 
 * @param {object} supabase - The active Supabase client instance.
 * @param {string} sessionId - The unique ID of the chat session.
 * @param {string} newTitle - The new title text.
 * @returns {Promise<object>} The updated chat session row.
 */
export async function renameChatSession(supabase, sessionId, newTitle) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .update({
      title: newTitle,
      updated_at: new Date().toISOString(), // Bump the updated_at timestamp
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Error renaming chat session:", error.message);
    throw error;
  }
  return data;
}

/**
 * Delete a chat session. Dependent messages will cascade delete automatically
 * based on foreign key configuration.
 * 
 * @param {object} supabase - The active Supabase client instance.
 * @param {string} sessionId - The unique ID of the session to delete.
 * @returns {Promise<boolean>} True if deletion succeeded.
 */
export async function deleteChatSession(supabase, sessionId) {
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("Error deleting chat session:", error.message);
    throw error;
  }
  return true;
}

/**
 * Fetch all messages for a specific chat session, ordered oldest first
 * to construct conversation history.
 * 
 * @param {object} supabase - The active Supabase client instance.
 * @param {string} sessionId - The unique ID of the session.
 * @returns {Promise<Array>} List of messages.
 */
export async function getMessages(supabase, sessionId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error.message);
    throw error;
  }
  return data;
}

/**
 * Insert a message row into a session. Automatically bumps the parent
 * session's `updated_at` column to keep it at the top of lists.
 * 
 * @param {object} supabase - The active Supabase client instance.
 * @param {object} params - Message fields.
 * @param {string} params.sessionId - The ID of the session.
 * @param {string} params.userId - The ID of the user sending/receiving the message.
 * @param {string} params.role - Either 'user' or 'assistant'.
 * @param {string} params.content - The text body of the message.
 * @param {string} [params.modelUsed] - Optional model identifier (e.g. 'gemini-pro').
 * @returns {Promise<object>} The newly inserted message row.
 */
export async function addMessage(supabase, { sessionId, userId, role, content, modelUsed }) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      user_id: userId,
      role: role,
      content: content,
      model_used: modelUsed,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding message:", error.message);
    throw error;
  }

  // Touch the chat session's updated_at timestamp so that it rises to the top of session lists
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return data;
}
