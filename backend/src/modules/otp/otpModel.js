import { supabase } from '../../config/db.js';

class OtpModel {
  /**
   * Create a new OTP record
   * @param {Object} otpData - { email, otpCode, payload, expiresAt }
   * @returns {Promise<Object|null>}
   */
  async create(otpData) {
    try {
      const { data, error } = await supabase
        .from('otp_verifications')
        .insert({
          email: otpData.email,
          otp_code: otpData.otpCode,
          payload: otpData.payload || {},
          expires_at: otpData.expiresAt
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data || null;
    } catch (err) {
      console.error('Error creating OTP:', err.message);
      throw err;
    }
  }

  /**
   * Find valid OTP by email and code
   * @param {string} email
   * @param {string} otpCode
   * @returns {Promise<Object|null>}
   */
  async findValidOtp(email, otpCode) {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otpCode)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (err) {
      console.error('Error finding OTP:', err.message);
      throw err;
    }
  }

  /**
   * Delete OTP record (after successful verification)
   * @param {string} otpId - UUID of OTP record
   * @returns {Promise<boolean>}
   */
  async delete(otpId) {
    try {
      const { error } = await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpId);

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      console.error('Error deleting OTP:', err.message);
      throw err;
    }
  }

  /**
   * Delete all OTPs for an email (xóa các OTP cũ trước khi tạo OTP mới)
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async invalidateAllForEmail(email) {
    try {
      const { error } = await supabase
        .from('otp_verifications')
        .delete()
        .eq('email', email);

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      console.error('Error invalidating OTPs:', err.message);
      throw err;
    }
  }
}

export default new OtpModel();

