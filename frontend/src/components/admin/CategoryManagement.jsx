import React, { useState, useEffect } from "react";
import httpClient from "../../services/httpClient";
import "./CategoryManagement.css";
import {
    Search as SearchIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Folder as FolderIcon,
    Close as CloseIcon,
} from "@mui/icons-material";

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [showDialog, setShowDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState("add"); // 'add' or 'edit'
    const [currentCategory, setCurrentCategory] = useState({ name: "", type: "Lost" });

    // Load categories
    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await httpClient.get("/categories", {}, {}, { preferAdmin: true });

            if (response.success && response.data) {
                setCategories(response.data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    // Handle add category
    const handleAddCategory = () => {
        setDialogMode("add");
        setCurrentCategory({ name: "", type: "Lost" });
        setShowDialog(true);
    };

    // Handle edit category
    const handleEditCategory = (category) => {
        setDialogMode("edit");
        setCurrentCategory(category);
        setShowDialog(true);
    };

    // Handle delete category
    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa chuyên mục này?")) {
            return;
        }

        try {
            const response = await httpClient.delete(
                `/categories/${categoryId}`,
                {},
                {},
                { preferAdmin: true }
            );

            if (response.success) {
                alert("✅ Đã xóa chuyên mục!");
                loadCategories();
            } else {
                alert("❌ Không thể xóa chuyên mục: " + (response.error || "Lỗi"));
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("❌ Lỗi: " + error.message);
        }
    };

    // Handle save (add or edit)
    const handleSave = async () => {
        if (!currentCategory.name.trim()) {
            alert("Vui lòng nhập tên chuyên mục!");
            return;
        }

        try {
            let response;
            if (dialogMode === "add") {
                response = await httpClient.post(
                    "/categories",
                    { name: currentCategory.name, type: currentCategory.type },
                    {},
                    { preferAdmin: true }
                );
            } else {
                response = await httpClient.put(
                    `/categories/${currentCategory.id}`,
                    { name: currentCategory.name, type: currentCategory.type },
                    {},
                    { preferAdmin: true }
                );
            }

            if (response.success) {
                alert(`✅ ${dialogMode === "add" ? "Đã thêm" : "Đã cập nhật"} chuyên mục!`);
                setShowDialog(false);
                loadCategories();
            } else {
                alert(`❌ Lỗi: ${response.error || response.message}`);
            }
        } catch (error) {
            console.error("Error saving category:", error);
            alert("❌ Lỗi: " + error.message);
        }
    };

    // Filter categories
    const filteredCategories = categories.filter((cat) => {
        const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || cat.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="category-management">
            <div className="page-header">
                <h2>Quản lý chuyên mục</h2>
                <button className="add-btn" onClick={handleAddCategory}>
                    <AddIcon /> Thêm chuyên mục
                </button>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-filter">
                    <div className="search-input-container">
                        <input
                            type="text"
                            placeholder="Tìm kiếm chuyên mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <button className="search-btn">
                            <SearchIcon />
                        </button>
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="type-filter"
                    >
                        <option value="all">Tất cả loại</option>
                        <option value="Lost">Đồ mất</option>
                        <option value="Found">Đồ tìm thấy</option>
                    </select>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <p>Đang tải danh sách chuyên mục...</p>
                </div>
            )}

            {/* Categories Table */}
            {!loading && (
                <div className="table-container">
                    <table className="categories-table">
                        <thead>
                            <tr>
                                <th>Tên chuyên mục</th>
                                <th>Loại</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((category) => (
                                <tr key={category.id}>
                                    <td>
                                        <div className="category-info">
                                            <FolderIcon className="category-icon" />
                                            <span>{category.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${category.type === "Lost" ? "type-lost" : "type-found"}`}>
                                            {category.type === "Lost" ? "Đồ mất" : "Đồ tìm thấy"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn edit"
                                                onClick={() => handleEditCategory(category)}
                                            >
                                                <EditIcon /> Sửa
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteCategory(category.id)}
                                            >
                                                <DeleteIcon /> Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && filteredCategories.length === 0 && (
                <div className="no-results">
                    <p>⚠️ Không tìm thấy chuyên mục nào.</p>
                </div>
            )}

            {/* Add/Edit Dialog */}
            {showDialog && (
                <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
                    <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-header">
                            <h3>{dialogMode === "add" ? "Thêm chuyên mục mới" : "Sửa chuyên mục"}</h3>
                            <button className="close-btn" onClick={() => setShowDialog(false)}>
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="dialog-body">
                            <div className="form-group">
                                <label>Tên chuyên mục *</label>
                                <input
                                    type="text"
                                    value={currentCategory.name}
                                    onChange={(e) =>
                                        setCurrentCategory({ ...currentCategory, name: e.target.value })
                                    }
                                    placeholder="Nhập tên chuyên mục..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Loại *</label>
                                <select
                                    value={currentCategory.type}
                                    onChange={(e) =>
                                        setCurrentCategory({ ...currentCategory, type: e.target.value })
                                    }
                                >
                                    <option value="Lost">Đồ mất</option>
                                    <option value="Found">Đồ tìm thấy</option>
                                </select>
                            </div>
                        </div>
                        <div className="dialog-footer">
                            <button className="btn-cancel" onClick={() => setShowDialog(false)}>
                                Hủy
                            </button>
                            <button className="btn-save" onClick={handleSave}>
                                {dialogMode === "add" ? "Thêm" : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;
