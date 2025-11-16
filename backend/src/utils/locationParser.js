/**
 * Location Parser Utility
 * Parse location string and handle Location records
 */

import { supabase } from '../config/db.js';

/**
 * Parse location string to building, room, address
 * Format: "Tòa A - Phòng 101 - Địa chỉ"
 * @param {string} locationString - Location string from frontend
 * @returns {Object} { building, room, address }
 */
export function parseLocationString(locationString) {
  if (!locationString || typeof locationString !== 'string') {
    return { building: null, room: null, address: null };
  }
  
  const parts = locationString.split(' - ').map(part => part.trim());
  
  let building = null;
  let room = null;
  let address = null;
  
  parts.forEach(part => {
    if (part.startsWith('Tòa ')) {
      building = part.replace('Tòa ', '').trim();
    } else if (part.startsWith('Phòng ')) {
      room = part.replace('Phòng ', '').trim();
    } else if (part) {
      address = part.trim();
    }
  });
  
  return { building, room, address };
}

/**
 * Find or create Location record
 * @param {string} locationString - Location string from frontend
 * @returns {Promise<number|null>} Location ID
 */
export async function findOrCreateLocation(locationString) {
  try {
    if (!locationString) return null;
    
    const { building, room, address } = parseLocationString(locationString);
    
    // If no valid parts, return null
    if (!building && !room && !address) return null;
    
    // Try to find existing location
    let query = supabase
      .from('Location')
      .select('Location_id');
    
    if (building) query = query.eq('Building', building);
    else query = query.is('Building', null);
    
    if (room) query = query.eq('Room', room);
    else query = query.is('Room', null);
    
    if (address) query = query.eq('Address', address);
    else query = query.is('Address', null);
    
    const { data: existing } = await query.limit(1).single();
    
    if (existing) {
      return existing.Location_id;
    }
    
    // Create new location
    const { data: newLocation, error } = await supabase
      .from('Location')
      .insert([{
        Building: building,
        Room: room,
        Address: address || 'N/A' // Address is NOT NULL in schema
      }])
      .select('Location_id')
      .single();
    
    if (error) {
      console.error('Error creating location:', error);
      return null;
    }
    
    return newLocation.Location_id;
  } catch (err) {
    console.error('Error in findOrCreateLocation:', err);
    return null;
  }
}

/**
 * Get location by ID
 * @param {number} locationId
 * @returns {Promise<Object|null>}
 */
export async function getLocationById(locationId) {
  try {
    if (!locationId) return null;
    
    const { data, error } = await supabase
      .from('Location')
      .select('*')
      .eq('Location_id', locationId)
      .single();
    
    if (error) {
      console.error('Error getting location:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error in getLocationById:', err);
    return null;
  }
}

/**
 * Format location object to string
 * @param {Object} location - Location object from DB
 * @returns {string}
 */
export function formatLocationToString(location) {
  if (!location) return '';
  
  const parts = [];
  
  if (location.Building) {
    parts.push(`Tòa ${location.Building}`);
  }
  
  if (location.Room) {
    parts.push(`Phòng ${location.Room}`);
  }
  
  if (location.Address && location.Address !== 'N/A') {
    parts.push(location.Address);
  }
  
  return parts.join(' - ');
}

