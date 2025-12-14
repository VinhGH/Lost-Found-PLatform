import locationModel from './locationModel.js';

/**
 * GET /api/locations
 * Get all locations
 */
export const getAllLocations = async (req, res, next) => {
  try {
    const result = await locationModel.getAllLocations();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve locations',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Locations retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/locations/:id
 * Get location by ID
 */
export const getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Location ID is required'
      });
    }

    const result = await locationModel.getLocationById(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve location',
        error: result.error
      });
    }

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/locations
 * Create new location
 */
export const createLocation = async (req, res, next) => {
  try {
    const { building, room, address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const result = await locationModel.createLocation({ building, room, address });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create location',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/locations/:id
 * Update location
 */
export const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { building, room, address } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Location ID is required'
      });
    }

    const updateData = {};
    if (building !== undefined) updateData.building = building;
    if (room !== undefined) updateData.room = room;
    if (address !== undefined) updateData.address = address;

    const result = await locationModel.updateLocation(id, updateData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update location',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/locations/:id
 * Delete location
 */
export const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Location ID is required'
      });
    }

    const result = await locationModel.deleteLocation(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete location',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

