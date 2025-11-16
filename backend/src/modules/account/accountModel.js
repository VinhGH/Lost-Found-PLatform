import { supabase } from '../../config/db.js';

class AccountModel {
  async getByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('Account')
        .select('account_id, email, password, role, user_name, avatar, phone_number')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || null;
    } catch (err) {
      console.error('Error getting account by email:', err.message);
      throw err;
    }
  }

  async create(userData) {
    try {
      const { data, error } = await supabase
        .from('Account')
        .insert({
          email: userData.email,
          password: userData.password,
          user_name: userData.user_name || 'Anonymous',
          phone_number: userData.phone_number || null,
          role: 'Student'
        })
        .select('account_id, email, role')
        .single();
      
      if (error) {
        throw error;
      }
      
      return data || null;
    } catch (err) {
      console.error('Error creating account:', err.message);
      throw err;
    }
  }

  async getById(accountId) {
    try {
      const { data, error } = await supabase
        .from('Account')
        .select('account_id, email, user_name, phone_number, avatar, role, created_at')
        .eq('account_id', accountId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || null;
    } catch (err) {
      console.error('Error getting account by ID:', err.message);
      throw err;
    }
  }

  async update(accountId, updateData) {
    try {
      console.log('🔄 Supabase UPDATE:', { accountId, updateData });
      
      const { data, error } = await supabase
        .from('Account')
        .update(updateData)
        .eq('account_id', accountId)
        .select('account_id, email, user_name, phone_number, avatar, role, created_at')
        .single();
      
      if (error) {
        console.error('❌ Supabase UPDATE ERROR:', error);
        throw error;
      }
      
      console.log('✅ Supabase UPDATE SUCCESS:', data);
      return data || null;
    } catch (err) {
      console.error('Error updating account:', err.message);
      throw err;
    }
  }
}

export default new AccountModel();
