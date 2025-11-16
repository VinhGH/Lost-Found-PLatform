import { supabase } from '../../config/db.js';
import { formatLocationToString } from '../../utils/locationParser.js';

/**
 * Location Model
 */
class LocationModel {
  /**
   * Get all locations
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>}
   */
  async getAllLocations(filters = {}) {
    try {
      let query = supabase
        .from('Location')
        .select('*')
        .order('location_id', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Format locations to include formatted string
      const formattedLocations = (data || []).map(location => ({
        id: location.location_id,
        building: location.building,
        room: location.room,
        address: location.address,
        formatted: formatLocationToString(location)
      }));

      return {
        success: true,
        data: formattedLocations,
        error: null
      };
    } catch (err) {
      console.error('Error getting locations:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get location by ID
   * @param {number} locationId
   * @returns {Promise<Object>}
   */
  async getLocationById(locationId) {
    try {
      const { data, error } = await supabase
        .from('Location')
        .select('*')
        .eq('location_id', locationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return {
          success: true,
          data: null,
          error: null
        };
      }

      const formatted = {
        id: data.location_id,
        building: data.building,
        room: data.room,
        address: data.address,
        formatted: formatLocationToString(data)
      };

      return {
        success: true,
        data: formatted,
        error: null
      };
    } catch (err) {
      console.error('Error getting location by ID:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Create new location
   * @param {Object} locationData - { building, room, address }
   * @returns {Promise<Object>}
   */
  async createLocation(locationData) {
    try {
      const { building, room, address } = locationData;

      // Validate required field
      if (!address) {
        return {
          success: false,
          data: null,
          error: 'Address is required'
        };
      }

      const { data, error } = await supabase
        .from('Location')
        .insert([{
          building: building || null,
          room: room || null,
          address: address
        }])
        .select()
        .single();

      if (error) throw error;

      const formatted = {
        id: data.location_id,
        building: data.building,
        room: data.room,
        address: data.address,
        formatted: formatLocationToString(data)
      };

      return {
        success: true,
        data: formatted,
        error: null
      };
    } catch (err) {
      console.error('Error creating location:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Update location
   * @param {number} locationId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateLocation(locationId, updateData) {
    try {
      const updates = {};

      if (updateData.building !== undefined) updates.building = updateData.building;
      if (updateData.room !== undefined) updates.room = updateData.room;
      if (updateData.address !== undefined) updates.address = updateData.address;

      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          data: null,
          error: 'No fields to update'
        };
      }

      const { data, error } = await supabase
        .from('Location')
        .update(updates)
        .eq('location_id', locationId)
        .select()
        .single();

      if (error) throw error;

      const formatted = {
        id: data.location_id,
        building: data.building,
        room: data.room,
        address: data.address,
        formatted: formatLocationToString(data)
      };

      return {
        success: true,
        data: formatted,
        error: null
      };
    } catch (err) {
      console.error('Error updating location:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Delete location
   * @param {number} locationId
   * @returns {Promise<Object>}
   */
  async deleteLocation(locationId) {
    try {
      const { error } = await supabase
        .from('Location')
        .delete()
        .eq('location_id', locationId);

      if (error) throw error;

      return {
        success: true,
        error: null
      };
    } catch (err) {
      console.error('Error deleting location:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

export default new LocationModel();

