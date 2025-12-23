# AI Matching Service - Tài liệu Kiến thức Chi tiết

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Các Khái niệm Cốt lõi](#các-khái-niệm-cốt-lõi)
3. [Constants và Configuration](#constants-và-configuration)
4. [Text Normalization](#text-normalization)
5. [Embedding và Similarity](#embedding-và-similarity)
6. [Weighted Text Creation](#weighted-text-creation)
7. [Matching Algorithms](#matching-algorithms)
8. [Keyword Boosting](#keyword-boosting)
9. [Image Similarity Integration](#image-similarity-integration)
10. [Các Methods Chi tiết](#các-methods-chi-tiết)

---

## Tổng quan

### Định nghĩa
**AI Matching Service** là một service tự động tìm kiếm và gợi ý các bài đăng có độ tương đồng cao trong hệ thống Lost-and-Found. Service này sử dụng **Transformers.js** để tính toán độ tương đồng ngữ nghĩa (semantic similarity) giữa các bài đăng Lost và Found.

### Mục đích
- Tự động match các bài đăng "Mất đồ" với "Nhặt được đồ"
- Giảm thời gian tìm kiếm thủ công
- Tăng độ chính xác trong việc tìm đồ thất lạc

### Ví dụ
```
Bài đăng Lost: "Mất điện thoại iPhone 14 màu đen ở tầng 3"
Bài đăng Found: "Nhặt được điện thoại iPhone màu đen ở tầng 3"
→ AI Matching Service sẽ tính similarity và gợi ý match!
```

---

## Các Khái niệm Cốt lõi

### 1. Transformers.js

#### Định nghĩa
**Transformers.js** là thư viện JavaScript chạy các mô hình AI transformer trực tiếp trên trình duyệt hoặc Node.js mà không cần server Python.

#### Đặc điểm
- Chạy **client-side** hoặc **server-side**
- Hỗ trợ **quantized models** (nhẹ hơn, nhanh hơn)
- Tự động download và cache models

#### Ví dụ
```javascript
import { pipeline } from '@xenova/transformers';

// Tạo pipeline cho feature extraction
const extractor = await pipeline('feature-extraction', MODEL_NAME, {
  quantized: true // Sử dụng model đã được nén
});
```

---

### 2. Embedding (Vector hóa văn bản)

#### Định nghĩa
**Embedding** là quá trình chuyển đổi text thành một vector số (mảng các số) để máy tính có thể hiểu và so sánh được. Mỗi vector đại diện cho ý nghĩa ngữ nghĩa của text.

#### Đặc điểm
- Text giống nhau → Vectors gần nhau
- Text khác nhau → Vectors xa nhau
- Vector có chiều dài cố định (768-dim cho model multilingual)

#### Ví dụ
```javascript
// Input text
const text = "Mất điện thoại iPhone";

// Output embedding (vector 768 chiều)
const embedding = [0.123, -0.456, 0.789, ..., 0.234];
// Mỗi số đại diện cho một đặc trưng ngữ nghĩa
```

#### Mean Pooling
**Mean Pooling** là kỹ thuật tính trung bình các token embeddings để tạo ra một vector duy nhất cho toàn bộ câu.

**Ví dụ:**
```
Câu: "Mất điện thoại"
Token embeddings: [vec1, vec2, vec3]
Mean pooling: (vec1 + vec2 + vec3) / 3 = final_vector
```

---

### 3. Cosine Similarity (Độ tương đồng Cosine)

#### Định nghĩa
**Cosine Similarity** là độ đo tính độ tương đồng giữa 2 vectors dựa trên góc giữa chúng. Giá trị từ **0 đến 1**:
- **1.0** = Hoàn toàn giống nhau
- **0.5** = Tương đồng trung bình
- **0.0** = Hoàn toàn khác nhau

#### Công thức
```
cosine_similarity = (A · B) / (||A|| × ||B||)

Trong đó:
- A · B = Dot product (tích vô hướng)
- ||A|| = Norm (độ dài) của vector A
- ||B|| = Norm (độ dài) của vector B
```

#### Ví dụ
```javascript
// Vector 1: [1, 2, 3]
// Vector 2: [1, 2, 3]
// Cosine similarity = 1.0 (hoàn toàn giống nhau)

// Vector 1: [1, 0, 0]
// Vector 2: [0, 1, 0]
// Cosine similarity = 0.0 (vuông góc, không liên quan)
```

#### Code Implementation
```javascript
cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];  // Tích vô hướng
    norm1 += vec1[i] * vec1[i];       // Bình phương norm1
    norm2 += vec2[i] * vec2[i];       // Bình phương norm2
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
```

---

### 4. Semantic Understanding (Hiểu ngữ nghĩa)

#### Định nghĩa
**Semantic Understanding** là khả năng hiểu ý nghĩa của text, không chỉ dựa vào từ khóa mà còn hiểu ngữ cảnh và mối quan hệ giữa các từ.

#### Ví dụ
```
Text 1: "Mất điện thoại"
Text 2: "Thất lạc smartphone"
→ Semantic model hiểu rằng "điện thoại" = "smartphone"
→ Similarity cao mặc dù từ khóa khác nhau!
```

---

## Constants và Configuration

### 1. MODEL_NAME

#### Định nghĩa
Tên của AI model được sử dụng để tạo embeddings. Model được chọn là **paraphrase-multilingual-mpnet-base-v2**.

#### Giá trị
```javascript
const MODEL_NAME = "Xenova/paraphrase-multilingual-mpnet-base-v2";
```

#### Đặc điểm
- **768 dimensions**: Vector embedding có 768 chiều
- **Multilingual**: Hỗ trợ nhiều ngôn ngữ, bao gồm tiếng Việt
- **Paraphrase model**: Được train để hiểu các cách diễn đạt khác nhau của cùng một ý nghĩa

#### Các Model Options
```javascript
// Option 1: English only (384-dim, nhẹ hơn)
"Xenova/all-mpnet-base-v2"

// Option 2: Multilingual (768-dim, hỗ trợ tiếng Việt) ✅ ĐANG DÙNG
"Xenova/paraphrase-multilingual-mpnet-base-v2"

// Option 3: Very large multilingual (nặng hơn)
"Xenova/multilingual-e5-large"
```

#### Ví dụ
```javascript
// Model tự động download và cache lần đầu tiên
await pipeline('feature-extraction', MODEL_NAME, {
  quantized: true // Sử dụng phiên bản đã nén (nhẹ hơn ~420MB)
});
```

---

### 2. SIMILARITY_THRESHOLD

#### Định nghĩa
**Threshold** là ngưỡng tối thiểu để quyết định 2 bài đăng có match hay không. Nếu similarity >= threshold → Match!

#### Giá trị
```javascript
const SIMILARITY_THRESHOLD = 0.50; // 50%
```

#### Ý nghĩa
- **50%**: Nếu độ tương đồng >= 50% → Gợi ý match
- **Cao hơn** (60-70%): Ít false positives nhưng có thể bỏ sót matches đúng
- **Thấp hơn** (30-40%): Nhiều matches nhưng nhiều false positives

#### Ví dụ
```javascript
// Case 1: Match
similarity = 0.85 (85%)
0.85 >= 0.50 → ✅ MATCH!

// Case 2: No match
similarity = 0.35 (35%)
0.35 < 0.50 → ❌ NO MATCH
```

---

### 3. THIRTY_DAYS_MS

#### Định nghĩa
Thời gian tối đa (30 ngày) để một bài đăng được xem xét cho matching. Bài đăng cũ hơn 30 ngày sẽ bị bỏ qua.

#### Giá trị
```javascript
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // milliseconds
```

#### Tính toán
```
30 ngày × 24 giờ × 60 phút × 60 giây × 1000 milliseconds
= 2,592,000,000 ms
```

#### Ví dụ
```javascript
const now = Date.now(); // 1703000000000
const postTime = new Date('2024-12-01').getTime(); // 1701388800000
const age = now - postTime; // 1611200000 ms = ~18.6 ngày

if (age <= THIRTY_DAYS_MS) {
  // ✅ Bài đăng trong vòng 30 ngày → Xét matching
} else {
  // ❌ Bài đăng quá cũ → Bỏ qua
}
```

---

### 4. TEXT_WEIGHT và IMAGE_WEIGHT

#### Định nghĩa
**Weights** để kết hợp similarity của text và image thành một score cuối cùng.

#### Giá trị
```javascript
const TEXT_WEIGHT = 0.6;  // 60% weight cho text
const IMAGE_WEIGHT = 0.4; // 40% weight cho image
```

#### Công thức
```javascript
finalSimilarity = (textSimilarity × 0.6) + (imageSimilarity × 0.4)
```

#### Ví dụ
```javascript
// Case 1: Có cả text và image
textSimilarity = 0.70 (70%)
imageSimilarity = 0.80 (80%)
finalSimilarity = (0.70 × 0.6) + (0.80 × 0.4)
                = 0.42 + 0.32
                = 0.74 (74%)

// Case 2: Chỉ có text
textSimilarity = 0.75 (75%)
finalSimilarity = 0.75 (75%) // Dùng trực tiếp text similarity
```

---

### 5. Text Component Weights

#### Định nghĩa
Các weights để cân bằng tầm quan trọng của các thành phần text trong một bài đăng.

#### Giá trị
```javascript
const TITLE_WEIGHT = 0.50;        // 50% - Quan trọng nhất
const DESCRIPTION_WEIGHT = 0.30;  // 30% - Bổ sung chi tiết
const ITEM_NAME_WEIGHT = 0.15;    // 15% - Tên đồ vật
const LOCATION_WEIGHT = 0.025;    // 2.5% - Địa điểm
const CATEGORY_WEIGHT = 0.025;    // 2.5% - Danh mục
```

#### Lý do
- **Title (50%)**: Người dùng thường mô tả chính xác nhất ở title
- **Description (30%)**: Bổ sung thông tin chi tiết
- **Item_name (15%)**: Quan trọng để phân biệt loại đồ vật
- **Location (2.5%)**: Ít quan trọng vì có thể khác địa điểm
- **Category (2.5%)**: Ít quan trọng nhất

#### Ví dụ
```javascript
// Post có:
// Title: "Mất điện thoại iPhone"
// Description: "iPhone 14 màu đen"
// Item_name: "Điện thoại"
// Location: "Tầng 3"
// Category: "Điện tử"

// Khi tạo text để so sánh:
// Title sẽ được lặp lại nhiều nhất (50% weight)
// Description lặp lại ít hơn (30% weight)
// Item_name, Location, Category lặp lại ít nhất
```

---

### 6. MIN_TEXT_SIMILARITY

#### Định nghĩa
Ngưỡng tối thiểu cho text similarity, ngay cả khi combined score (text + image) cao. Mục đích tránh false positives từ image-only matches.

#### Giá trị
```javascript
const MIN_TEXT_SIMILARITY = 0.38; // 38%
```

#### Ví dụ
```javascript
// Case 1: Text similarity quá thấp
textSimilarity = 0.30 (30%)
imageSimilarity = 0.90 (90%)
finalSimilarity = (0.30 × 0.6) + (0.90 × 0.4) = 0.54 (54%)

// Nhưng textSimilarity < MIN_TEXT_SIMILARITY (38%)
// → ❌ KHÔNG MATCH (tránh false positive)

// Case 2: Text similarity đủ
textSimilarity = 0.40 (40%) >= 0.38 ✅
imageSimilarity = 0.90 (90%)
finalSimilarity = 0.54 (54%)
// → ✅ MATCH
```

---

### 7. STOP_WORDS

#### Định nghĩa
**Stop words** là các từ phổ biến trong tiếng Việt không có ý nghĩa trong việc matching (như "cái", "chiếc", "màu", v.v.).

#### Giá trị
```javascript
const STOP_WORDS = new Set([
  'chiec', 'cai', 'mon', 'thu', 'con', 'qua', 'mieng',
  'mau', 'loai', 'kieu', 'dang', 'nay', 'kia', 'do',
  'duoc', 'dang', 'vua', 'moi', 'tang', 'phong', 'toa',
  'ben', 'canh', 'tren', 'duoi', 'trong', 'ngoai',
  'cung', 'nhung', 'voi', 'cho', 'hay', 'hoac', 'thi'
]);
```

#### Mục đích
- Loại bỏ các từ không có ý nghĩa
- Tập trung vào keywords quan trọng
- Giảm noise trong keyword extraction

#### Ví dụ
```javascript
// Text: "Mất chiếc điện thoại màu đen"
// Keywords sau khi filter stop words:
// ["dien", "thoai", "den"]
// (đã loại bỏ "chiec", "mau")
```

---

### 8. TERM_MAPPING

#### Định nghĩa
**Term Mapping** là dictionary để chuẩn hóa các abbreviations (viết tắt) và typos (lỗi chính tả) thành từ đầy đủ.

#### Giá trị
```javascript
const TERM_MAPPING = {
  'dth': 'dien thoai',           // Abbreviation
  'dt': 'dien thoai',            // Abbreviation
  'tsv': 'the sinh vien',        // Abbreviation
  'sv': 'sinh vien',             // Abbreviation
  'cntt': 'cong nghe thong tin', // Abbreviation
  'iphone': 'dien thoai iphone', // Brand name expansion
  'samsumg': 'samsung',           // Typo fix
  'samsum': 'samsung',            // Typo fix
  'oppo': 'dien thoai oppo',     // Brand name expansion
  'vivo': 'dien thoai vivo',     // Brand name expansion
  'xiaomi': 'dien thoai xiaomi'  // Brand name expansion
};
```

#### Mục đích
- Xử lý abbreviations: "dth" → "điện thoại"
- Sửa typos: "samsumg" → "samsung"
- Chuẩn hóa brand names: "iphone" → "điện thoại iphone"

#### Ví dụ
```javascript
// Input: "Mất dth samsumg"
// Sau khi apply TERM_MAPPING:
// "Mất dien thoai samsung"
```

---

## Text Normalization

### Định nghĩa
**Text Normalization** là quá trình chuẩn hóa text để:
1. Giữ nguyên dấu tiếng Việt (quan trọng!)
2. Xử lý abbreviations và typos
3. Loại bỏ special characters không cần thiết
4. Chuẩn hóa spaces

### Quy trình 3 bước

#### Bước 1: Lowercase + Unicode Normalization
```javascript
let normalized = text
  .toLowerCase()           // Chuyển thành chữ thường
  .normalize('NFC');       // Giữ nguyên dấu tiếng Việt
```

**Ví dụ:**
```javascript
Input: "Mất Điện Thoại"
Output: "mất điện thoại"
```

#### Bước 2: Giữ Vietnamese Characters
```javascript
normalized = normalized
  .replace(/[^a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ0-9\s\-]/g, ' ')
  .replace(/\s+/g, ' ')  // Chuẩn hóa spaces
  .trim();
```

**Regex giải thích:**
- `[^...]`: Match tất cả characters KHÔNG trong danh sách
- `a-z`: Chữ cái thường
- `áàảãạ...`: Tất cả chữ cái tiếng Việt có dấu
- `đ`: Chữ đặc biệt của tiếng Việt
- `0-9`: Số
- `\s`: Spaces
- `\-`: Dash

**Ví dụ:**
```javascript
Input: "Mất ví đá!!!"
Output: "mất ví đá"
// Giữ nguyên dấu "á" (quan trọng!)
```

#### Bước 3: Apply Term Mapping
```javascript
Object.keys(TERM_MAPPING).forEach(abbr => {
  const regex = new RegExp(`\\b${abbr}\\b`, 'g');
  normalized = normalized.replace(regex, TERM_MAPPING[abbr]);
});
```

**Ví dụ:**
```javascript
Input: "Mất dth samsumg"
// Step 1: "mất dth samsumg"
// Step 2: "mất dth samsumg" (giữ nguyên)
// Step 3: "mất dien thoai samsung" (apply mapping)
```

### Ví dụ đầy đủ
```javascript
// Input
const text = "Mất Điện Thoại iPhone-14!!!";

// Step 1: Lowercase + NFC
"mất điện thoại iphone-14!!!"

// Step 2: Remove special chars (giữ dấu tiếng Việt)
"mất điện thoại iphone-14"

// Step 3: Apply term mapping
"mất điện thoại dien thoai iphone-14"

// Final output
"mất điện thoại dien thoai iphone-14"
```

---

## Embedding và Similarity

### 1. embedding() Method

#### Định nghĩa
Tạo embedding vector từ text input sử dụng AI model.

#### Code
```javascript
async embedding(text) {
  if (!this.isInitialized) {
    await this.initializeModel();
  }

  const output = await this.extractor(text, { 
    pooling: 'mean',    // Mean pooling
    normalize: true     // Normalize vector
  });
  
  return Array.from(output.data);
}
```

#### Parameters
- **text**: String cần tạo embedding
- **pooling**: 'mean' - Tính trung bình các token embeddings
- **normalize**: true - Chuẩn hóa vector về độ dài 1

#### Ví dụ
```javascript
const text = "Mất điện thoại iPhone";
const embedding = await aiMatchingService.embedding(text);
// Output: [0.123, -0.456, 0.789, ..., 0.234] (768 numbers)
```

---

### 2. cosineSimilarity() Method

#### Định nghĩa
Tính cosine similarity giữa 2 vectors.

#### Code
```javascript
cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
```

#### Ví dụ
```javascript
const vec1 = [1, 2, 3];
const vec2 = [1, 2, 3];
const similarity = cosineSimilarity(vec1, vec2);
// Output: 1.0 (hoàn toàn giống nhau)

const vec3 = [1, 0, 0];
const vec4 = [0, 1, 0];
const similarity2 = cosineSimilarity(vec3, vec4);
// Output: 0.0 (vuông góc, không liên quan)
```

---

### 3. calculateTextSimilarity() Method

#### Định nghĩa
Tính độ tương đồng giữa 2 đoạn text bằng cách:
1. Tạo embeddings cho cả 2 text
2. Tính cosine similarity giữa 2 embeddings

#### Code
```javascript
async calculateTextSimilarity(text1, text2) {
  try {
    const emb1 = await this.embedding(text1);
    const emb2 = await this.embedding(text2);
    const similarity = this.cosineSimilarity(emb1, emb2);
    return similarity;
  } catch (error) {
    console.error("❌ Lỗi khi tính similarity:", error);
    return 0;
  }
}
```

#### Ví dụ
```javascript
const text1 = "Mất điện thoại iPhone";
const text2 = "Nhặt được điện thoại iPhone";
const similarity = await aiMatchingService.calculateTextSimilarity(text1, text2);
// Output: 0.92 (92% similarity - rất giống nhau!)
```

---

## Weighted Text Creation

### Định nghĩa
**Weighted Text Creation** là quá trình tạo một text tổng hợp từ các thành phần của post với số lần lặp lại khác nhau dựa trên weights.

### Adaptive Repetitions

#### Logic
- Nếu có **description dài** → Giảm repetitions của title
- Nếu **title ngắn** → Tăng repetitions của description
- Mục đích: Cân bằng độ dài text giữa các posts

#### Code Logic
```javascript
// Calculate content lengths
const titleLen = (post.Post_Title || '').length;
const descLen = (post.Description || '').length;

// Adjust repetitions
const hasDescription = descLen > 20;
const titleRepetitions = hasDescription ? 
  Math.ceil(TITLE_WEIGHT * 8) :   // Có description → ít hơn
  Math.ceil(TITLE_WEIGHT * 12);   // Không có → nhiều hơn

const descRepetitions = titleLen < 20 ?
  Math.ceil(DESCRIPTION_WEIGHT * 12) : // Title ngắn → nhiều hơn
  Math.ceil(DESCRIPTION_WEIGHT * 10);  // Title đủ → bình thường
```

### Ví dụ

#### Post Input
```javascript
const post = {
  Post_Title: "Mất ví",
  Item_name: "Ví",
  Description: "Nhặt được ví da màu nâu có thẻ sinh viên",
  Location_name: "Tầng 3",
  Category_name: "Phụ kiện"
};
```

#### Text Output
```javascript
// Title: "mất ví" (lặp lại 6 lần vì không có description dài)
// Item: "ví" (lặp lại 1-2 lần)
// Description: "nhặt được ví da màu nâu..." (lặp lại 3-4 lần)
// Location: "tầng 3" (lặp lại 0-1 lần)
// Category: "phụ kiện" (lặp lại 0-1 lần)

// Final text:
"mất ví mất ví mất ví mất ví mất ví mất ví ví ví nhặt được ví da màu nâu... nhặt được ví da màu nâu... tầng 3 phụ kiện"
```

### Lý do Weighted Repetition
- **Title được lặp nhiều nhất** → Nhấn mạnh thông tin quan trọng nhất
- **Description lặp vừa phải** → Bổ sung chi tiết
- **Location/Category ít lặp** → Ít quan trọng trong matching

---

## Matching Algorithms

### 1. findMatchingPosts()

#### Định nghĩa
Tìm tất cả các cặp posts có độ tương đồng cao trong một danh sách posts.

#### Quy trình
1. **Filter posts trong 30 ngày**
2. **Lọc chỉ posts approved**
3. **So sánh từng cặp** (Lost vs Found)
4. **Tính similarity** (text + image)
5. **Filter theo thresholds**
6. **Return matches**

#### Code Flow
```javascript
async findMatchingPosts(posts) {
  // Step 1: Filter 30 days
  const recentPosts = posts.filter(post => {
    const age = Date.now() - new Date(post.Created_at).getTime();
    return age <= THIRTY_DAYS_MS;
  });

  // Step 2: Compare pairs
  for (let i = 0; i < recentPosts.length; i++) {
    for (let j = i + 1; j < recentPosts.length; j++) {
      const post1 = recentPosts[i];
      const post2 = recentPosts[j];

      // Step 3: Check conditions
      if (post1.Status !== 'approved') continue;
      if (post2.Status !== 'approved') continue;
      if (post1.Post_type === post2.Post_type) continue; // Must be Lost vs Found
      if (post1.Account_id === post2.Account_id) continue; // Not same user

      // Step 4: Calculate similarity
      const text1 = this.createPostText(post1);
      const text2 = this.createPostText(post2);
      const textSimilarity = await this.calculateTextSimilarity(text1, text2);

      // Step 5: Image similarity (if available)
      let imageSimilarity = 0;
      if (hasImages1 && hasImages2) {
        imageSimilarity = await clipImageService.analyzeImageSimilarity(post1, post2);
      }

      // Step 6: Combine scores
      const finalSimilarity = hasImages1 && hasImages2 ?
        (textSimilarity * TEXT_WEIGHT) + (imageSimilarity * IMAGE_WEIGHT) :
        textSimilarity;

      // Step 7: Check thresholds
      if (textSimilarity < MIN_TEXT_SIMILARITY) continue;
      if (finalSimilarity > SIMILARITY_THRESHOLD) {
        matches.push({ post1, post2, similarity: finalSimilarity });
      }
    }
  }

  return matches;
}
```

#### Ví dụ
```javascript
const posts = [
  { Post_Title: "Mất điện thoại", Post_type: "lost", Status: "approved", ... },
  { Post_Title: "Nhặt điện thoại", Post_type: "found", Status: "approved", ... },
  { Post_Title: "Mất ví", Post_type: "lost", Status: "approved", ... }
];

const matches = await aiMatchingService.findMatchingPosts(posts);
// Output: [
//   {
//     post1: { Post_Title: "Mất điện thoại", ... },
//     post2: { Post_Title: "Nhặt điện thoại", ... },
//     similarity: 0.85
//   }
// ]
```

---

### 2. scanSinglePost()

#### Định nghĩa
Quét một bài đăng mới với danh sách bài đăng đối nghịch (Lost vs Found). Được gọi khi admin approve một bài đăng mới.

#### Khác biệt với findMatchingPosts()
- **Event-driven**: Chạy khi có bài đăng mới
- **Hiệu quả hơn**: Chỉ so sánh 1 post với N posts (thay vì N×N)
- **Có keyword boosting**: Boost similarity nếu có keywords chung

#### Quy trình
1. Tạo text cho post mới
2. So sánh với từng post đối nghịch
3. **Extract keywords** từ titles
4. **Boost similarity** nếu có keywords chung
5. Tính image similarity (nếu có)
6. Combine scores và filter

#### Ví dụ
```javascript
const newPost = {
  Post_Title: "Mất điện thoại iPhone",
  Post_type: "lost",
  Status: "approved",
  ...
};

const existingPosts = [
  { Post_Title: "Nhặt điện thoại", Post_type: "found", ... },
  { Post_Title: "Nhặt ví", Post_type: "found", ... }
];

const matches = await aiMatchingService.scanSinglePost(newPost, existingPosts);
// Output: [
//   {
//     post1: newPost,
//     post2: { Post_Title: "Nhặt điện thoại", ... },
//     similarity: 0.92 // Boosted từ 0.75 lên 0.92 vì có keywords chung
//   }
// ]
```

---

## Keyword Boosting

### Định nghĩa
**Keyword Boosting** là kỹ thuật tăng similarity score khi 2 posts có keywords quan trọng chung trong title.

### Quy trình

#### Bước 1: Extract Keywords
```javascript
const extractKeywords = (text) => {
  const normalized = this.normalizeText(text);
  return normalized.split(' ')
    .filter(word => word.length > 3 && !STOP_WORDS.has(word))
    .map(word => word.toLowerCase().trim());
};
```

**Ví dụ:**
```javascript
// Input: "Mất điện thoại iPhone màu đen"
// Normalized: "mất điện thoại iphone màu đen"
// Filtered: ["dien", "thoai", "iphone", "den"]
// (đã loại bỏ "mất" vì < 3 chars, "màu" vì là stop word)
```

#### Bước 2: Find Common Keywords
```javascript
const keywords1 = extractKeywords(post1.Post_Title);
const keywords2 = extractKeywords(post2.Post_Title);
const commonKeywords = keywords1.filter(k => keywords2.includes(k));
```

**Ví dụ:**
```javascript
// Post 1: "Mất điện thoại iPhone"
// Keywords1: ["dien", "thoai", "iphone"]

// Post 2: "Nhặt điện thoại Samsung"
// Keywords2: ["dien", "thoai", "samsung"]

// Common keywords: ["dien", "thoai"] (2 keywords)
```

#### Bước 3: Boost Similarity
```javascript
if (commonKeywords.length >= 2) {
  // Strong keyword match - boost significantly
  textSimilarity = Math.max(textSimilarity, 0.85);
} else if (commonKeywords.length === 1) {
  // Moderate keyword match - boost moderately
  textSimilarity = Math.max(textSimilarity, 0.70);
}
```

**Ví dụ:**
```javascript
// Case 1: 2+ common keywords
rawSimilarity = 0.65 (65%)
commonKeywords = ["dien", "thoai"] (2 keywords)
→ Boosted to 0.85 (85%)

// Case 2: 1 common keyword
rawSimilarity = 0.60 (60%)
commonKeywords = ["iphone"] (1 keyword)
→ Boosted to 0.70 (70%)

// Case 3: 0 common keywords
rawSimilarity = 0.55 (55%)
commonKeywords = [] (0 keywords)
→ No boost, keep 0.55
```

### Lý do Keyword Boosting
- **Tăng precision**: Posts có keywords chung thường là match đúng
- **Giảm false negatives**: Không bỏ sót matches đúng nhưng similarity thấp
- **Tăng confidence**: Keywords chung là dấu hiệu mạnh của match

---

## Image Similarity Integration

### Định nghĩa
Kết hợp similarity của text và image để tăng độ chính xác matching.

### Quy trình

#### Bước 1: Check Images
```javascript
const hasImages1 = post1.Image_urls && post1.Image_urls.length > 0;
const hasImages2 = post2.Image_urls && post2.Image_urls.length > 0;
```

#### Bước 2: Calculate Image Similarity (nếu có)
```javascript
if (hasImages1 && hasImages2) {
  imageSimilarity = await clipImageService.analyzeImageSimilarity(post1, post2);
}
```

#### Bước 3: Combine Scores
```javascript
if (hasImages1 && hasImages2) {
  // Weighted average
  finalSimilarity = (textSimilarity * TEXT_WEIGHT) + (imageSimilarity * IMAGE_WEIGHT);
} else {
  // Text only
  finalSimilarity = textSimilarity;
}
```

### Ví dụ
```javascript
// Case 1: Có cả text và image
textSimilarity = 0.70 (70%)
imageSimilarity = 0.85 (85%)
finalSimilarity = (0.70 × 0.6) + (0.85 × 0.4)
                = 0.42 + 0.34
                = 0.76 (76%)

// Case 2: Chỉ có text
textSimilarity = 0.75 (75%)
finalSimilarity = 0.75 (75%)
```

---

## Các Methods Chi tiết

### 1. initializeModel()

#### Định nghĩa
Khởi tạo AI model với singleton pattern và promise caching để tránh load nhiều lần.

#### Code
```javascript
async initializeModel() {
  // Nếu đang khởi tạo, chờ promise hiện tại
  if (this.initPromise) {
    return this.initPromise;
  }

  // Nếu đã khởi tạo rồi, return luôn
  if (this.isInitialized) {
    return;
  }

  // Tạo promise mới để khởi tạo
  this.initPromise = (async () => {
    try {
      this.extractor = await pipeline('feature-extraction', MODEL_NAME, {
        quantized: true,
      });
      this.isInitialized = true;
    } catch (error) {
      // Fallback to smaller model
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });
      this.isInitialized = true;
    }
  })();

  return this.initPromise;
}
```

#### Singleton Pattern
- **initPromise**: Đảm bảo chỉ 1 promise khởi tạo tại một thời điểm
- **isInitialized**: Flag để skip nếu đã khởi tạo

#### Ví dụ
```javascript
// Lần đầu tiên
await aiMatchingService.initializeModel();
// → Download và load model (~420MB)

// Lần thứ 2
await aiMatchingService.initializeModel();
// → Return ngay lập tức (đã initialized)
```

---

### 2. normalizeText()

#### Định nghĩa
Chuẩn hóa text: giữ dấu tiếng Việt, xử lý abbreviations, loại bỏ special chars.

#### Code
```javascript
normalizeText(text) {
  if (!text) return '';
  
  // Step 1: Lowercase + NFC
  let normalized = text.toLowerCase().normalize('NFC');
  
  // Step 2: Keep Vietnamese chars
  normalized = normalized
    .replace(/[^a-záàảãạ...đ0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Step 3: Apply term mapping
  Object.keys(TERM_MAPPING).forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    normalized = normalized.replace(regex, TERM_MAPPING[abbr]);
  });
  
  return normalized;
}
```

#### Ví dụ
```javascript
// Input
normalizeText("Mất dth samsumg!!!");

// Step 1: "mất dth samsumg!!!"
// Step 2: "mất dth samsumg"
// Step 3: "mất dien thoai samsung"

// Output
"mất dien thoai samsung"
```

---

### 3. createPostText()

#### Định nghĩa
Tạo text tổng hợp từ post với weighted repetitions.

#### Code
```javascript
createPostText(post) {
  const parts = [];
  
  // Title (adaptive repetitions)
  if (post.Post_Title) {
    const normalizedTitle = this.normalizeText(post.Post_Title);
    const titleRepetitions = hasDescription ? 
      Math.ceil(TITLE_WEIGHT * 8) : 
      Math.ceil(TITLE_WEIGHT * 12);
    for (let i = 0; i < titleRepetitions; i++) {
      parts.push(normalizedTitle);
    }
  }
  
  // Item name
  if (post.Item_name) {
    const normalizedItem = this.normalizeText(post.Item_name);
    const itemRepetitions = Math.ceil(ITEM_NAME_WEIGHT * 10);
    for (let i = 0; i < itemRepetitions; i++) {
      parts.push(normalizedItem);
    }
  }
  
  // Description (adaptive repetitions)
  if (post.Description) {
    const normalizedDesc = this.normalizeText(post.Description);
    const descRepetitions = titleLen < 20 ?
      Math.ceil(DESCRIPTION_WEIGHT * 12) :
      Math.ceil(DESCRIPTION_WEIGHT * 10);
    for (let i = 0; i < descRepetitions; i++) {
      parts.push(normalizedDesc);
    }
  }
  
  // Location và Category
  // ...
  
  return parts.join(' ');
}
```

#### Ví dụ
```javascript
const post = {
  Post_Title: "Mất ví",
  Item_name: "Ví",
  Description: "",
  Location_name: "Tầng 3",
  Category_name: "Phụ kiện"
};

const text = aiMatchingService.createPostText(post);
// Output: "mất ví mất ví mất ví mất ví mất ví mất ví ví ví tầng 3 phụ kiện"
```

---

### 4. getSimilarityThreshold()

#### Định nghĩa
Lấy similarity threshold hiện tại.

#### Code
```javascript
getSimilarityThreshold() {
  return SIMILARITY_THRESHOLD;
}
```

#### Ví dụ
```javascript
const threshold = aiMatchingService.getSimilarityThreshold();
// Output: 0.50 (50%)
```

---

### 5. isModelReady()

#### Định nghĩa
Kiểm tra xem model đã được khởi tạo chưa.

#### Code
```javascript
isModelReady() {
  return this.isInitialized;
}
```

#### Ví dụ
```javascript
if (aiMatchingService.isModelReady()) {
  console.log("Model đã sẵn sàng!");
} else {
  console.log("Đang khởi tạo model...");
}
```

---

## Tổng kết

### Workflow Tổng thể

```
1. Initialize Model
   ↓
2. User tạo bài đăng (Lost/Found)
   ↓
3. Admin approve bài đăng
   ↓
4. scanSinglePost() được gọi
   ↓
5. normalizeText() - Chuẩn hóa text
   ↓
6. createPostText() - Tạo weighted text
   ↓
7. embedding() - Tạo embedding vectors
   ↓
8. calculateTextSimilarity() - Tính cosine similarity
   ↓
9. extractKeywords() - Extract keywords từ titles
   ↓
10. Keyword boosting (nếu có keywords chung)
    ↓
11. Image similarity (nếu có ảnh)
    ↓
12. Combine scores (text + image)
    ↓
13. Filter theo thresholds
    ↓
14. Return matches
```

### Key Takeaways

1. **Semantic Understanding**: Model hiểu ý nghĩa, không chỉ từ khóa
2. **Vietnamese Support**: Giữ nguyên dấu tiếng Việt là quan trọng
3. **Weighted Components**: Title quan trọng nhất (50%), Description (30%)
4. **Keyword Boosting**: Tăng similarity khi có keywords chung
5. **Multi-modal**: Kết hợp text + image để tăng độ chính xác
6. **Thresholds**: Cân bằng giữa precision và recall

---

## Tài liệu tham khảo

- [Transformers.js Documentation](https://github.com/xenova/transformers.js)
- [Xenova Models](https://huggingface.co/Xenova)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Semantic Similarity](https://en.wikipedia.org/wiki/Semantic_similarity)

---

**Ngày tạo:** 2024-12-23  
**Phiên bản:** 1.0  
**Tác giả:** AI Matching Service Documentation

