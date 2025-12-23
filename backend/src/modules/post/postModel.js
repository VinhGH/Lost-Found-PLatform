import { supabase } from "../../config/db.js";

class PostModel {
  /**
   * Helper: Get images for a lost post
   * @private
   */
  async _getLostPostImages(lostPostId) {
    try {
      const { data, error } = await supabase
        .from("Lost_Post_Images")
        .select(
          `
          lost_img_id,
          Lost_Images!inner(link_picture)
        `
        )
        .eq("lost_post_id", lostPostId);

      if (error || !data) return [];

      return data.map((item) => item.Lost_Images.link_picture);
    } catch (err) {
      console.error("Error getting lost post images:", err);
      return [];
    }
  }

  /**
   * Helper: Get images for a found post
   * @private
   */
  async _getFoundPostImages(foundPostId) {
    try {
      const { data, error } = await supabase
        .from("Found_Post_Images")
        .select(
          `
          found_img_id,
          Found_Images!inner(link_picture)
        `
        )
        .eq("found_post_id", foundPostId);

      if (error || !data) return [];

      return data.map((item) => item.Found_Images.link_picture);
    } catch (err) {
      console.error("Error getting found post images:", err);
      return [];
    }
  }

  /**
   * Helper: Format a single post
   * @private
   */
  async _formatPost(post, type, account, location, images) {
    const postId = type === "lost" ? post.lost_post_id : post.found_post_id;

    // ✅ Xác định thời gian hiển thị:
    // - Nếu status = 'Approved' và có approved_at: dùng approved_at
    // - Nếu status = 'Approved' nhưng không có approved_at: dùng updated_at (fallback)
    // - Nếu status = 'Pending': dùng created_at
    const status = this._mapStatus(post.status);

    // ✅ Helper function để parse UTC timestamp đúng cách
    // 🔥 Helper parse timestamp chuẩn UTC
    const parseUTC = (ts) => {
      if (!ts) return null;
      const s = String(ts);
      const normalized = s.endsWith("Z") ? s : s + "Z";
      return new Date(normalized).getTime();
    };

    // 🔍 DEBUG: Log location data
    console.log(`🔍 DEBUG _formatPost for post ${postId}:`, {
      location,
      formattedLocation: location ? this._formatLocation(location) : "",
    });

    return {
      id: postId,
      type,
      accountId: account?.account_id || post.account_id || null,
      title: post.post_title || "",
      description: post.description || post.item_name || "",
      category: post.category_name || "Khác",
      location: location ? this._formatLocation(location) : "",
      author: account?.user_name || account?.email || "",
      contact: account?.phone_number || "",
      image: images.length > 0 ? images[0] : null,
      images,
      views: post.views || 0, // ✅ Add views field
      createdAt: parseUTC(post.created_at),
      updatedAt: parseUTC(post.updated_at),
      approvedAt: parseUTC(post.approved_at),
      displayTime:
        status === "active" || status === "approved"
          ? parseUTC(post.approved_at) ||
          parseUTC(post.updated_at) ||
          parseUTC(post.created_at)
          : parseUTC(post.created_at),
      status: status,
    };
  }

  /**
   * Helper: Map status
   * @private
   */
  _mapStatus(dbStatus) {
    const statusMap = {
      Pending: "pending",
      Approved: "active",
      Rejected: "rejected",
      Resolved: "resolved",
    };
    return (
      statusMap[dbStatus] || (dbStatus ? dbStatus.toLowerCase() : "pending")
    );
  }

  /**
   * Helper: Format location
   * @private
   */
  _formatLocation(location) {
    const parts = [];
    if (location.building) parts.push(`Tòa ${location.building}`);
    if (location.room) parts.push(`Phòng ${location.room}`);
    if (location.address) parts.push(location.address);
    return parts.join(" - ");
  }

  /**
   * Get all posts (both lost and found)
   * @param {Object} filters - { status, search, type, page, limit, isAdmin }
   * @param {boolean} filters.isAdmin - If true, return all posts (including Pending)
   */
  async getAllPosts(filters = {}) {
    try {
      const {
        category,
        location,
        status,
        search,
        type,
        page = 1,
        limit = 10,
        sortBy = "created_at",
        sortOrder = "desc",
        isAdmin = false, // NEW: Admin flag
      } = filters;

      const allPosts = [];

      // Query Lost_Post if type is 'lost' or not specified
      if (!type || type === "lost") {
        let lostQuery = supabase
          .from("Lost_Post")
          .select(
            `
            *,
            Account!inner(account_id, user_name, email, phone_number),
            Location(location_id, address, building, room),
            Category(category_id, name)
          `
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false }); // ✅ Thêm order để đảm bảo thứ tự

        // 🔹 NEW: If not admin, only show Approved posts
        if (!isAdmin && !status) {
          lostQuery = lostQuery.eq("status", "Approved");
        } else if (status) {
          // Map status từ lowercase sang PascalCase cho DB
          const statusMap = {
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
            resolved: "Resolved",
            active: "Approved", // 'active' cũng map thành 'Approved'
          };
          const dbStatus = statusMap[status.toLowerCase()] || status;
          lostQuery = lostQuery.eq("status", dbStatus);
        }
        if (search)
          lostQuery = lostQuery.or(
            `post_title.ilike.%${search}%,item_name.ilike.%${search}%,description.ilike.%${search}%`
          );

        const { data: lostPosts, error: lostError } = await lostQuery;

        // ✅ Log để debug
        console.log("📋 Lost_Post query result:", {
          status,
          isAdmin,
          lostPostsCount: lostPosts?.length || 0,
          error: lostError?.message || null,
        });

        if (lostError) {
          console.error("❌ Error querying Lost_Post:", lostError);
        }

        if (lostPosts) {
          console.log(
            "📋 Lost posts details:",
            lostPosts.map((p) => ({
              id: p.lost_post_id,
              title: p.post_title,
              status: p.status,
              created_at: p.created_at,
              updated_at: p.updated_at,
              approved_at: p.approved_at, // ✅ Log approved_at để debug
            }))
          );

          for (const post of lostPosts) {
            const images = await this._getLostPostImages(post.lost_post_id);
            const formatted = await this._formatPost(
              { ...post, category_name: post.Category?.name },
              "lost",
              post.Account,
              post.Location,
              images
            );
            console.log(`📋 Formatted lost post ${formatted.id}:`, {
              status: formatted.status,
              createdAt: formatted.createdAt,
              updatedAt: formatted.updatedAt,
              approvedAt: formatted.approvedAt,
              displayTime: formatted.displayTime,
            });
            allPosts.push(formatted);
          }
        }
      }

      // Query Found_Post if type is 'found' or not specified
      if (!type || type === "found") {
        let foundQuery = supabase
          .from("Found_Post")
          .select(
            `
            *,
            Account!inner(account_id, user_name, email, phone_number),
            Location(location_id, address, building, room),
            Category(category_id, name)
          `
          )
          .is("deleted_at", null)
          .order("created_at", { ascending: false }); // ✅ Thêm order để đảm bảo thứ tự

        // 🔹 NEW: If not admin, only show Approved posts
        if (!isAdmin && !status) {
          foundQuery = foundQuery.eq("status", "Approved");
        } else if (status) {
          // Map status từ lowercase sang PascalCase cho DB
          const statusMap = {
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
            resolved: "Resolved",
            active: "Approved", // 'active' cũng map thành 'Approved'
          };
          const dbStatus = statusMap[status.toLowerCase()] || status;
          foundQuery = foundQuery.eq("status", dbStatus);
        }
        if (search)
          foundQuery = foundQuery.or(
            `post_title.ilike.%${search}%,item_name.ilike.%${search}%,description.ilike.%${search}%`
          );

        const { data: foundPosts, error: foundError } = await foundQuery;

        // ✅ Log để debug
        console.log("📋 Found_Post query result:", {
          status,
          isAdmin,
          foundPostsCount: foundPosts?.length || 0,
          error: foundError?.message || null,
        });

        if (foundError) {
          console.error("❌ Error querying Found_Post:", foundError);
        }

        if (foundPosts) {
          console.log(
            "📋 Found posts details:",
            foundPosts.map((p) => ({
              id: p.found_post_id,
              title: p.post_title,
              status: p.status,
              created_at: p.created_at,
              updated_at: p.updated_at,
              approved_at: p.approved_at, // ✅ Log approved_at để debug
            }))
          );

          for (const post of foundPosts) {
            const images = await this._getFoundPostImages(post.found_post_id);
            const formatted = await this._formatPost(
              { ...post, category_name: post.Category?.name },
              "found",
              post.Account,
              post.Location,
              images
            );
            console.log(`📋 Formatted found post ${formatted.id}:`, {
              status: formatted.status,
              createdAt: formatted.createdAt,
              updatedAt: formatted.updatedAt,
              approvedAt: formatted.approvedAt,
              displayTime: formatted.displayTime,
            });
            allPosts.push(formatted);
          }
        }
      }

      // Apply filters
      let filtered = allPosts;
      if (category) {
        filtered = filtered.filter(
          (p) =>
            p.category &&
            p.category.toLowerCase().includes(category.toLowerCase())
        );
      }
      if (location) {
        filtered = filtered.filter(
          (p) =>
            p.location &&
            p.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      // Sort
      filtered.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });

      // Paginate
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      // ✅ Log để debug
      console.log("📋 getAllPosts - Filters:", {
        status,
        type,
        isAdmin,
        page,
        limit,
        total: filtered.length,
        paginated: paginated.length,
        lostCount: filtered.filter((p) => p.type === "lost").length,
        foundCount: filtered.filter((p) => p.type === "found").length,
      });

      return {
        success: true,
        data: paginated,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit),
        },
        error: null,
      };
    } catch (err) {
      console.error("Error getting all posts:", err.message);
      return {
        success: false,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Get post by ID and type
   */
  async getPostById(postId, type) {
    try {
      const tableName = type === "found" ? "Found_Post" : "Lost_Post";
      const idColumn = type === "found" ? "found_post_id" : "lost_post_id";

      const { data, error } = await supabase
        .from(tableName)
        .select(
          `
          *,
          Account(account_id, user_name, email, phone_number),
          Location(location_id, address, building, room),
          Category(category_id, name)
        `
        )
        .eq(idColumn, postId)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        return { success: true, data: null, error: null };
      }

      const images =
        type === "found"
          ? await this._getFoundPostImages(postId)
          : await this._getLostPostImages(postId);

      const formatted = await this._formatPost(
        { ...data, category_name: data.Category?.name },
        type,
        data.Account,
        data.Location,
        images
      );

      return {
        success: true,
        data: formatted,
        error: null,
      };
    } catch (err) {
      console.error("Error getting post by ID:", err.message);
      return {
        success: false,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Create new post
   */
  async createPost(postData) {
    try {
      console.log(`🔍 createPost called with postData:`, JSON.stringify(postData, null, 2));

      const {
        account_id,
        type,
        title,
        description,
        category,
        location,
        images = [],
      } = postData;

      console.log(`📍 Extracted location from postData: "${location}"`);

      // Find or create location
      let locationId = null;
      if (location) {
        locationId = await this._findOrCreateLocation(location);
      } else {
        console.warn(`⚠️ No location provided in postData`);
      }

      // Find or create category
      let categoryId = null;
      if (category) {
        categoryId = await this._findOrCreateCategory(category, type);
      }

      const tableName = type === "found" ? "Found_Post" : "Lost_Post";
      const insertData = {
        account_id,
        post_title: title,
        description: description,
        item_name: description,
        location_id: locationId,
        category_id: categoryId,
        status: "Pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(`💾 Inserting post with location_id: ${locationId}`);

      const { data: post, error } = await supabase
        .from(tableName)
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Handle images
      if (images && images.length > 0) {
        await this._saveImages(post, type, images);
      }

      return await this.getPostById(
        type === "found" ? post.found_post_id : post.lost_post_id,
        type
      );
    } catch (err) {
      console.error("Error creating post:", err.message);
      return {
        success: false,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Helper: Find or create location
   * @private
   */
  async _findOrCreateLocation(locationString) {
    console.log(`🔍 _findOrCreateLocation called with: "${locationString}"`);

    // Parse location string
    const parts = locationString.split(" - ");
    let building = null,
      room = null,
      address = null;

    parts.forEach((part) => {
      if (part.startsWith("Tòa ")) building = part.replace("Tòa ", "").trim();
      else if (part.startsWith("Phòng "))
        room = part.replace("Phòng ", "").trim();
      else address = part.trim();
    });

    console.log(`📍 Parsed location:`, { building, room, address });

    // Try to find existing location with exact match (including null values)
    let query = supabase.from("Location").select("location_id");

    // Match building
    if (building) {
      query = query.eq("building", building);
    } else {
      query = query.is("building", null);
    }

    // Match room
    if (room) {
      query = query.eq("room", room);
    } else {
      query = query.is("room", null);
    }

    // Match address
    if (address) {
      query = query.eq("address", address);
    } else {
      query = query.is("address", null);
    }

    // Use maybeSingle() instead of single() to avoid error when no match
    const { data: existing, error: findError } = await query.limit(1).maybeSingle();

    if (findError) {
      console.error("❌ Error finding location:", findError);
    }

    if (existing) {
      console.log(`✅ Found existing location_id: ${existing.location_id}`);
      return existing.location_id;
    }

    // Create new location with actual null values (not "N/A")
    console.log(`➕ Creating new location:`, { building, room, address });

    const { data: newLoc, error: insertError } = await supabase
      .from("Location")
      .insert([{
        building: building || null,
        room: room || null,
        address: address || null
      }])
      .select("location_id")
      .single();

    if (insertError) {
      console.error("❌ Error creating location:", insertError);
      return null;
    }

    console.log(`✅ Created new location_id: ${newLoc?.location_id}`);
    return newLoc?.location_id;
  }

  /**
   * Helper: Find or create category
   * @private
   */
  async _findOrCreateCategory(categoryName, type) {
    const { data: existing } = await supabase
      .from("Category")
      .select("category_id")
      .eq("name", categoryName)
      .limit(1)
      .single();

    if (existing) return existing.category_id;

    const { data: newCat } = await supabase
      .from("Category")
      .insert([{ name: categoryName, type: type }])
      .select("category_id")
      .single();

    return newCat?.category_id;
  }

  /**
   * Helper: Save images (upload to Supabase Storage)
   * @private
   */
  async _saveImages(post, type, images) {
    const { uploadPostImage } = await import("../../utils/imageUpload.js");
    const imageTable = type === "found" ? "Found_Images" : "Lost_Images";
    const junctionTable =
      type === "found" ? "Found_Post_Images" : "Lost_Post_Images";
    const postIdColumn = type === "found" ? "found_post_id" : "lost_post_id";
    const imgIdColumn = type === "found" ? "found_img_id" : "lost_img_id";
    const postId = type === "found" ? post.found_post_id : post.lost_post_id;

    console.log(
      `📸 Uploading ${images.length} images for ${type} post ${postId}...`
    );

    for (const imageBase64 of images) {
      // Upload image to Supabase Storage
      const uploadResult = await uploadPostImage(imageBase64, postId, type);

      if (!uploadResult.success) {
        console.error("❌ Failed to upload image:", uploadResult.error);
        continue; // Skip this image
      }

      console.log("✅ Image uploaded:", uploadResult.url);

      // Save image URL to database
      const { data: imgRecord } = await supabase
        .from(imageTable)
        .insert([
          {
            link_picture: uploadResult.url,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (imgRecord) {
        // Link image to post
        await supabase.from(junctionTable).insert([
          {
            [postIdColumn]: postId,
            [imgIdColumn]: imgRecord[imgIdColumn],
          },
        ]);

        console.log(
          `✅ Image ${imgRecord[imgIdColumn]} linked to post ${postId}`
        );
      }
    }
  }

  /**
   * Update post
   */
  async updatePost(postId, type, updateData) {
    try {
      const tableName = type === "found" ? "Found_Post" : "Lost_Post";
      const idColumn = type === "found" ? "found_post_id" : "lost_post_id";

      const updates = { updated_at: new Date().toISOString() };

      if (updateData.title) updates.post_title = updateData.title;
      if (updateData.description) {
        updates.description = updateData.description;
        updates.item_name = updateData.description;
      }
      if (updateData.status) {
        const statusMap = {
          pending: "Pending",
          active: "Approved",
          approved: "Approved",
          rejected: "Rejected",
          resolved: "Resolved",
        };
        const newStatus =
          statusMap[updateData.status.toLowerCase()] || "Pending";
        updates.status = newStatus;

        // ✅ Khi approve post, lưu thời gian approve vào approved_at
        if (newStatus === "Approved") {
          updates.approved_at = new Date().toISOString();
        }
      }
      if (updateData.location) {
        updates.location_id = await this._findOrCreateLocation(
          updateData.location
        );
      }
      if (updateData.category) {
        updates.category_id = await this._findOrCreateCategory(
          updateData.category,
          type
        );
      }

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idColumn, postId);

      if (error) throw error;

      // ✅ Handle images update if provided
      if (updateData.images !== undefined && Array.isArray(updateData.images)) {
        console.log(`📸 Updating images for ${type} post ${postId}...`);

        // Delete old images
        const junctionTable = type === "found" ? "Found_Post_Images" : "Lost_Post_Images";
        const imageTable = type === "found" ? "Found_Images" : "Lost_Images";
        const postIdColumn = type === "found" ? "found_post_id" : "lost_post_id";
        const imgIdColumn = type === "found" ? "found_img_id" : "lost_img_id";

        // Get old image IDs
        const { data: oldJunctions } = await supabase
          .from(junctionTable)
          .select(imgIdColumn)
          .eq(postIdColumn, postId);

        if (oldJunctions && oldJunctions.length > 0) {
          const oldImgIds = oldJunctions.map(j => j[imgIdColumn]);

          // Delete junction records
          await supabase
            .from(junctionTable)
            .delete()
            .eq(postIdColumn, postId);

          // Delete image records
          await supabase
            .from(imageTable)
            .delete()
            .in(imgIdColumn, oldImgIds);

          console.log(`✅ Deleted ${oldImgIds.length} old images`);
        }

        // Save new images if any
        if (updateData.images.length > 0) {
          const postObj = { [idColumn]: postId };
          await this._saveImages(postObj, type, updateData.images);
          console.log(`✅ Saved ${updateData.images.length} new images`);
        }
      }

      return await this.getPostById(postId, type);
    } catch (err) {
      console.error("Error updating post:", err.message);
      return {
        success: false,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Delete post (soft delete)
   */
  async deletePost(postId, type) {
    try {
      const tableName = type === "found" ? "Found_Post" : "Lost_Post";
      const idColumn = type === "found" ? "found_post_id" : "lost_post_id";

      // ✅ Delete all matches related to this post BEFORE soft-deleting
      const matchIdColumn = type === "found" ? "found_post_id" : "lost_post_id";

      console.log(`🗑️ Deleting matches for ${type} post ${postId}...`);

      const { data: matchesToDelete, error: matchQueryError } = await supabase
        .from('Match_Post')
        .select('match_id')
        .eq(matchIdColumn, postId);

      if (matchQueryError) {
        console.error('❌ Error finding matches to delete:', matchQueryError);
      } else if (matchesToDelete && matchesToDelete.length > 0) {
        const matchIds = matchesToDelete.map(m => m.match_id);

        const { error: matchDeleteError } = await supabase
          .from('Match_Post')
          .delete()
          .in('match_id', matchIds);

        if (matchDeleteError) {
          console.error('❌ Error deleting matches:', matchDeleteError);
        } else {
          console.log(`✅ Deleted ${matchIds.length} matches for post ${postId}`);
        }
      } else {
        console.log(`ℹ️ No matches found for post ${postId}`);
      }

      // Soft delete the post
      const { error } = await supabase
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq(idColumn, postId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      console.error("Error deleting post:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Increment view count for a post
   */
  async incrementViews(postId, type) {
    try {
      const tableName = type === "found" ? "Found_Post" : "Lost_Post";
      const idColumn = type === "found" ? "found_post_id" : "lost_post_id";

      // First, get current views
      const { data: currentPost, error: fetchError } = await supabase
        .from(tableName)
        .select('views')
        .eq(idColumn, postId)
        .single();

      if (fetchError) throw fetchError;

      const currentViews = currentPost?.views || 0;
      const newViews = currentViews + 1;

      // Update with new views count
      const { data, error } = await supabase
        .from(tableName)
        .update({ views: newViews })
        .eq(idColumn, postId)
        .select('views')
        .single();

      if (error) throw error;

      console.log(`✅ View count incremented for ${type} post ${postId}: ${data?.views || 'N/A'}`);

      return {
        success: true,
        views: data?.views || 0,
        error: null
      };
    } catch (err) {
      console.error("Error incrementing views:", err.message);
      return { success: false, views: 0, error: err.message };
    }
  }

  /**
   * Get posts by account ID
   */
  async getPostsByAccountId(accountId) {
    try {
      const posts = [];

      // Get lost posts
      const { data: lostPosts } = await supabase
        .from("Lost_Post")
        .select(
          `
          *,
          Account(account_id, user_name, email, phone_number),
          Location(location_id, address, building, room),
          Category(category_id, name)
        `
        )
        .eq("account_id", accountId)
        .is("deleted_at", null);

      if (lostPosts) {
        for (const post of lostPosts) {
          const images = await this._getLostPostImages(post.lost_post_id);
          const formatted = await this._formatPost(
            { ...post, category_name: post.Category?.name },
            "lost",
            post.Account,
            post.Location,
            images
          );
          posts.push(formatted);
        }
      }

      // Get found posts
      const { data: foundPosts } = await supabase
        .from("Found_Post")
        .select(
          `
          *,
          Account(account_id, user_name, email, phone_number),
          Location(location_id, address, building, room),
          Category(category_id, name)
        `
        )
        .eq("account_id", accountId)
        .is("deleted_at", null);

      if (foundPosts) {
        for (const post of foundPosts) {
          const images = await this._getFoundPostImages(post.found_post_id);
          const formatted = await this._formatPost(
            { ...post, category_name: post.Category?.name },
            "found",
            post.Account,
            post.Location,
            images
          );
          posts.push(formatted);
        }
      }

      // Sort by created_at desc
      posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      return {
        success: true,
        data: posts,
        error: null,
      };
    } catch (err) {
      console.error("Error getting posts by account ID:", err.message);
      return {
        success: false,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Get posts by type
   */
  async getPostsByType(postType, options = {}) {
    return this.getAllPosts({ ...options, type: postType });
  }

  /**
   * Check if user owns the post
   */
  async isPostOwner(postId, type, accountId) {
    try {
      const tableName = type === "found" ? "Found_Post" : "Lost_Post";
      const idColumn = type === "found" ? "found_post_id" : "lost_post_id";

      const { data, error } = await supabase
        .from(tableName)
        .select("account_id")
        .eq(idColumn, postId)
        .single();

      if (error || !data) return false;
      return data.account_id === accountId;
    } catch (err) {
      console.error("Error checking post ownership:", err.message);
      return false;
    }
  }

  /**
   * Get post types
   */
  async getPostTypes() {
    return {
      success: true,
      data: ["lost", "found"],
      error: null,
    };
  }
}

export default new PostModel();
