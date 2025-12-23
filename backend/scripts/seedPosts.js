import { supabase } from '../src/config/db.js';

/**
 * Script to seed 20 Lost posts and 20 Found posts
 * Run with: node backend/scripts/seedPosts.js
 */

// Sample data for Lost posts
const lostPosts = [
  {
    title: "Mất ví da màu nâu",
    description: "Ví da màu nâu có chứa CMND, thẻ ATM và một số tiền mặt. Mất vào chiều ngày 20/12 tại khu vực thư viện.",
    category: "Ví/Túi xách",
    location: "Tòa A - Phòng 101 - Thư viện trường",
    type: "lost"
  },
  {
    title: "Thất lạc điện thoại iPhone 13 Pro",
    description: "iPhone 13 Pro màu xanh dương, có ốp lưng trong suốt. Mất tại căng tin tầng 2 vào buổi trưa.",
    category: "Điện thoại",
    location: "Tòa B - Căng tin tầng 2",
    type: "lost"
  },
  {
    title: "Mất chìa khóa xe máy",
    description: "Móc chìa khóa có gắn móc khóa hình gấu trúc. Chìa khóa xe SH màu đen. Mất ở bãi đỗ xe.",
    category: "Chìa khóa",
    location: "Bãi đỗ xe khu A",
    type: "lost"
  },
  {
    title: "Thất lạc laptop Dell XPS 15",
    description: "Laptop Dell XPS 15 màu bạc, có dán sticker hình mèo ở nắp lưng. Để quên tại phòng học C203.",
    category: "Laptop/Máy tính",
    location: "Tòa C - Phòng 203",
    type: "lost"
  },
  {
    title: "Mất thẻ sinh viên",
    description: "Thẻ sinh viên khoa Công nghệ thông tin, tên Nguyễn Văn A, MSSV: 20210001. Mất vào sáng thứ 2.",
    category: "Giấy tờ/Thẻ",
    location: "Tòa D - Hành lang tầng 3",
    type: "lost"
  },
  {
    title: "Thất lạc tai nghe AirPods Pro",
    description: "Tai nghe AirPods Pro trong hộp sạc màu trắng. Mất tại phòng gym.",
    category: "Tai nghe/Phụ kiện",
    location: "Phòng gym - Tầng 1",
    type: "lost"
  },
  {
    title: "Mất áo khoác hoodie màu đen",
    description: "Áo hoodie đen size L, có logo trường ở ngực trái. Để quên ở ghế đá sân trường.",
    category: "Quần áo/Phụ kiện",
    location: "Sân trường - Khu vực ghế đá",
    type: "lost"
  },
  {
    title: "Thất lạc sạc dự phòng 20000mAh",
    description: "Sạc dự phòng Xiaomi màu đen 20000mAh, có vết xước nhỏ ở góc. Mất tại lớp học.",
    category: "Sạc/Cáp",
    location: "Tòa E - Phòng 105",
    type: "lost"
  },
  {
    title: "Mất kính mát Ray-Ban",
    description: "Kính mát Ray-Ban gọng đen, trong hộp da nâu. Để quên ở quầy cafe.",
    category: "Kính/Phụ kiện",
    location: "Quán cafe Highlands - Tầng 1",
    type: "lost"
  },
  {
    title: "Thất lạc đồng hồ Apple Watch Series 7",
    description: "Apple Watch Series 7 màu đen, dây cao su đen. Mất khi tập thể dục.",
    category: "Đồng hồ",
    location: "Sân bóng rổ",
    type: "lost"
  },
  {
    title: "Mất balo màu xám",
    description: "Balo Targus màu xám, bên trong có laptop và sách giáo trình. Mất ở thư viện.",
    category: "Balo/Túi xách",
    location: "Tòa A - Thư viện tầng 3",
    type: "lost"
  },
  {
    title: "Thất lạc ô dù tự động",
    description: "Ô dù tự động màu xanh navy, cán cầm màu đen. Để quên ở phòng họp.",
    category: "Đồ dùng cá nhân",
    location: "Tòa B - Phòng họp 201",
    type: "lost"
  },
  {
    title: "Mất sổ tay ghi chú",
    description: "Sổ tay Moleskine màu đen, có ghi chú quan trọng về dự án. Mất tại quán cafe.",
    category: "Sách/Tài liệu",
    location: "The Coffee House - Gần cổng chính",
    type: "lost"
  },
  {
    title: "Thất lạc chuột không dây Logitech",
    description: "Chuột Logitech MX Master 3 màu đen. Để quên ở phòng lab.",
    category: "Phụ kiện máy tính",
    location: "Tòa C - Phòng Lab 304",
    type: "lost"
  },
  {
    title: "Mất bình nước thể thao",
    description: "Bình nước Lock&Lock màu hồng 500ml, có dán tên. Mất ở sân tennis.",
    category: "Đồ dùng cá nhân",
    location: "Sân tennis",
    type: "lost"
  },
  {
    title: "Thất lạc giày thể thao Nike",
    description: "Giày Nike Air Force 1 màu trắng size 42. Để trong tủ đồ phòng gym nhưng không thấy.",
    category: "Giày dép",
    location: "Phòng gym - Khu tủ đồ",
    type: "lost"
  },
  {
    title: "Mất USB 64GB",
    description: "USB Kingston 64GB màu đen, có chứa dữ liệu đồ án quan trọng. Mất ở phòng máy tính.",
    category: "USB/Ổ cứng",
    location: "Tòa D - Phòng máy 402",
    type: "lost"
  },
  {
    title: "Thất lạc vòng tay bạc",
    description: "Vòng tay bạc có khắc tên, quà kỷ niệm quan trọng. Mất khi rửa tay ở toilet.",
    category: "Trang sức",
    location: "Tòa A - Toilet tầng 2",
    type: "lost"
  },
  {
    title: "Mất túi đựng mỹ phẩm",
    description: "Túi vải canvas màu be đựng mỹ phẩm cá nhân. Để quên ở phòng thay đồ.",
    category: "Túi/Ví",
    location: "Phòng thay đồ nữ - Tầng 2",
    type: "lost"
  },
  {
    title: "Thất lạc sách giáo trình Toán cao cấp",
    description: "Sách Toán cao cấp tập 2, có ghi chú bằng bút đỏ. Mất ở lớp học.",
    category: "Sách/Tài liệu",
    location: "Tòa E - Phòng 201",
    type: "lost"
  }
];

// Sample data for Found posts
const foundPosts = [
  {
    title: "Nhặt được ví da màu đen",
    description: "Nhặt được ví da màu đen có chứa thẻ ATM và CMND tên Trần Thị B. Nhặt được ở căng tin.",
    category: "Ví/Túi xách",
    location: "Tòa B - Căng tin tầng 1",
    type: "found"
  },
  {
    title: "Tìm thấy điện thoại Samsung Galaxy S22",
    description: "Điện thoại Samsung màu tím, có ốp lưng hình hoa. Tìm thấy ở ghế đá sân trường.",
    category: "Điện thoại",
    location: "Sân trường - Khu ghế đá",
    type: "found"
  },
  {
    title: "Nhặt được chìa khóa xe",
    description: "Móc chìa khóa có móc khóa hình cún, chìa khóa xe Vision. Nhặt ở bãi xe.",
    category: "Chìa khóa",
    location: "Bãi đỗ xe khu B",
    type: "found"
  },
  {
    title: "Tìm thấy laptop Asus",
    description: "Laptop Asus màu đen trong túi xách. Tìm thấy ở phòng học.",
    category: "Laptop/Máy tính",
    location: "Tòa C - Phòng 105",
    type: "found"
  },
  {
    title: "Nhặt được thẻ sinh viên",
    description: "Thẻ sinh viên khoa Kinh tế, tên Lê Văn C. Nhặt được ở hành lang.",
    category: "Giấy tờ/Thẻ",
    location: "Tòa A - Hành lang tầng 1",
    type: "found"
  },
  {
    title: "Tìm thấy tai nghe Sony",
    description: "Tai nghe Sony chụp tai màu đen. Tìm thấy ở thư viện.",
    category: "Tai nghe/Phụ kiện",
    location: "Tòa A - Thư viện tầng 2",
    type: "found"
  },
  {
    title: "Nhặt được áo khoác bomber",
    description: "Áo khoác bomber màu xanh rêu size M. Nhặt ở phòng gym.",
    category: "Quần áo/Phụ kiện",
    location: "Phòng gym - Tầng 1",
    type: "found"
  },
  {
    title: "Tìm thấy sạc laptop HP",
    description: "Sạc laptop HP 65W, dây còn mới. Tìm thấy ở phòng học.",
    category: "Sạc/Cáp",
    location: "Tòa D - Phòng 301",
    type: "found"
  },
  {
    title: "Nhặt được kính cận",
    description: "Kính cận gọng tròn màu vàng gold, trong hộp cứng. Nhặt ở quán cafe.",
    category: "Kính/Phụ kiện",
    location: "Starbucks - Tầng 1",
    type: "found"
  },
  {
    title: "Tìm thấy đồng hồ Casio",
    description: "Đồng hồ Casio G-Shock màu đen. Tìm thấy ở sân bóng đá.",
    category: "Đồng hồ",
    location: "Sân bóng đá",
    type: "found"
  },
  {
    title: "Nhặt được balo Adidas",
    description: "Balo Adidas màu đen có logo trắng. Nhặt ở ghế chờ xe bus.",
    category: "Balo/Túi xách",
    location: "Trạm xe bus - Cổng chính",
    type: "found"
  },
  {
    title: "Tìm thấy ô dù gấp",
    description: "Ô dù gấp gọn màu đen có họa tiết chấm bi trắng. Tìm thấy ở phòng họp.",
    category: "Đồ dùng cá nhân",
    location: "Tòa E - Phòng họp 102",
    type: "found"
  },
  {
    title: "Nhặt được sổ tay Starbucks",
    description: "Sổ tay Starbucks planner 2024 màu xanh. Nhặt ở bàn học thư viện.",
    category: "Sách/Tài liệu",
    location: "Tòa A - Thư viện tầng 1",
    type: "found"
  },
  {
    title: "Tìm thấy chuột gaming Razer",
    description: "Chuột gaming Razer DeathAdder có đèn LED. Tìm thấy ở phòng lab.",
    category: "Phụ kiện máy tính",
    location: "Tòa C - Phòng Lab 201",
    type: "found"
  },
  {
    title: "Nhặt được bình nước Tupperware",
    description: "Bình nước Tupperware màu xanh dương 1L. Nhặt ở sân cầu lông.",
    category: "Đồ dùng cá nhân",
    location: "Sân cầu lông",
    type: "found"
  },
  {
    title: "Tìm thấy dép Adidas",
    description: "Dép Adidas Adilette màu đen trắng size 40. Tìm thấy ở phòng tắm.",
    category: "Giày dép",
    location: "Phòng tắm nam - Tầng 1",
    type: "found"
  },
  {
    title: "Nhặt được USB SanDisk 32GB",
    description: "USB SanDisk 32GB màu đỏ đen. Nhặt ở bàn máy tính phòng lab.",
    category: "USB/Ổ cứng",
    location: "Tòa D - Phòng Lab 305",
    type: "found"
  },
  {
    title: "Tìm thấy dây chuyền bạc",
    description: "Dây chuyền bạc có mặt hình trái tim. Tìm thấy ở lavabo.",
    category: "Trang sức",
    location: "Tòa B - Toilet nữ tầng 3",
    type: "found"
  },
  {
    title: "Nhặt được túi tote canvas",
    description: "Túi tote canvas màu trắng có in chữ 'Save the Earth'. Nhặt ở quán ăn.",
    category: "Túi/Ví",
    location: "Quán cơm - Gần cổng sau",
    type: "found"
  },
  {
    title: "Tìm thấy giáo trình Lập trình C++",
    description: "Sách giáo trình Lập trình C++ có ghi tên ở trang đầu. Tìm thấy ở lớp học.",
    category: "Sách/Tài liệu",
    location: "Tòa E - Phòng 305",
    type: "found"
  }
];

async function getOrCreateTestAccount() {
  try {
    // Try to find existing test account
    const { data: existingAccount, error: findError } = await supabase
      .from('Account')
      .select('account_id')
      .eq('email', 'test.seed@example.com')
      .single();

    if (existingAccount) {
      console.log('✅ Using existing test account:', existingAccount.account_id);
      return existingAccount.account_id;
    }

    // Create new test account if not exists
    const { data: newAccount, error: createError } = await supabase
      .from('Account')
      .insert({
        email: 'test.seed@example.com',
        user_name: 'Test Seed User',
        password_hash: 'dummy_hash', // Not used for actual login
        phone_number: '0123456789',
        role: 'User',
        status: 'Active',
        created_at: new Date().toISOString()
      })
      .select('account_id')
      .single();

    if (createError) {
      console.error('❌ Error creating test account:', createError);
      throw createError;
    }

    console.log('✅ Created new test account:', newAccount.account_id);
    return newAccount.account_id;
  } catch (error) {
    console.error('❌ Error in getOrCreateTestAccount:', error);
    throw error;
  }
}

async function findOrCreateLocation(locationString) {
  if (!locationString) return null;

  const parts = locationString.split(' - ');
  let building = null, room = null, address = null;

  parts.forEach(part => {
    if (part.startsWith('Tòa ')) building = part.replace('Tòa ', '').trim();
    else if (part.startsWith('Phòng ')) room = part.replace('Phòng ', '').trim();
    else address = part.trim();
  });

  // Try to find existing location
  let query = supabase.from('Location').select('location_id');

  if (building) query = query.eq('building', building);
  else query = query.is('building', null);

  if (room) query = query.eq('room', room);
  else query = query.is('room', null);

  if (address) query = query.eq('address', address);
  else query = query.is('address', null);

  const { data: existing } = await query.limit(1).maybeSingle();

  if (existing) {
    return existing.location_id;
  }

  // Create new location
  const { data: newLoc, error } = await supabase
    .from('Location')
    .insert({
      building: building || null,
      room: room || null,
      address: address || null
    })
    .select('location_id')
    .single();

  if (error) {
    console.error('❌ Error creating location:', error);
    return null;
  }

  return newLoc?.location_id;
}

async function findOrCreateCategory(categoryName, type) {
  const { data: existing } = await supabase
    .from('Category')
    .select('category_id')
    .eq('name', categoryName)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.category_id;

  const { data: newCat } = await supabase
    .from('Category')
    .insert({ name: categoryName, type: type })
    .select('category_id')
    .single();

  return newCat?.category_id;
}

async function createPost(postData, accountId) {
  try {
    const locationId = await findOrCreateLocation(postData.location);
    const categoryId = await findOrCreateCategory(postData.category, postData.type);

    const tableName = postData.type === 'found' ? 'Found_Post' : 'Lost_Post';
    
    const insertData = {
      account_id: accountId,
      post_title: postData.title,
      description: postData.description,
      item_name: postData.description,
      location_id: locationId,
      category_id: categoryId,
      status: 'Approved', // Auto-approve for seed data
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: post, error } = await supabase
      .from(tableName)
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating ${postData.type} post:`, error);
      return null;
    }

    const postId = postData.type === 'found' ? post.found_post_id : post.lost_post_id;
    console.log(`✅ Created ${postData.type} post: ${postData.title} (ID: ${postId})`);
    return post;
  } catch (error) {
    console.error('❌ Error in createPost:', error);
    return null;
  }
}

async function seedPosts() {
  console.log('🌱 Starting to seed posts...\n');

  try {
    // Get or create test account
    const accountId = await getOrCreateTestAccount();

    console.log('\n📝 Creating Lost posts...');
    let lostCount = 0;
    for (const postData of lostPosts) {
      const result = await createPost(postData, accountId);
      if (result) lostCount++;
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📝 Creating Found posts...');
    let foundCount = 0;
    for (const postData of foundPosts) {
      const result = await createPost(postData, accountId);
      if (result) foundCount++;
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Lost posts created: ${lostCount}/${lostPosts.length}`);
    console.log(`   - Found posts created: ${foundCount}/${foundPosts.length}`);
    console.log(`   - Total: ${lostCount + foundCount}/${lostPosts.length + foundPosts.length}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedPosts()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
