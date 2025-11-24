import React, { useEffect, useMemo, useState } from "react";
import "./FilterPanel.css";
import userApi from "../../services/realApi"; // ✅ REAL API
import { FilterList as FilterIcon, RestartAlt as ResetIcon } from "@mui/icons-material";

const dateOptions = [
  { value: "any", label: "Bất kỳ" },
  { value: "1d", label: "Trong 24 giờ" },
  { value: "3d", label: "Trong 3 ngày" },
  { value: "7d", label: "Trong 7 ngày" },
  { value: "30d", label: "Trong 30 ngày" },
];

const FilterPanel = ({ open, onClose, onApply, initial = {} }) => {
  const buildingOptions = ["A","B","C","D","E","F","G","NULL"];
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    building: initial.building || "",
    category: initial.category || "",
    date: initial.date || "any",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const catRes = await userApi.getCategories();
      if (mounted) {
        setCategories(catRes?.data || []);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setForm({
      building: initial.building || "",
      category: initial.category || "",
      date: initial.date || "any",
    });
  }, [initial]);

  const apply = () => {
    onApply?.(form);
    onClose?.();
  };

  const reset = () => {
    const cleared = { building: "", category: "", date: "any" };
    setForm(cleared);
    onApply?.(cleared);
  };

  return (
    <div className={`filter-panel ${open ? "open" : ""}`}>
      <div className="filter-panel-header">
        <div className="filter-panel-title">
          <FilterIcon style={{ fontSize: 20, marginRight: 6 }} />
          Bộ lọc
        </div>
        <button className="filter-reset" onClick={reset}>
          <ResetIcon style={{ fontSize: 16, marginRight: 6 }} />
          Xóa lọc
        </button>
      </div>

      <div className="filter-grid">
        <div className="filter-field">
          <label>Tòa</label>
          <select value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })}>
            <option value="">Tất cả</option>
            {buildingOptions.map((x) => (
              <option key={x} value={x}>Tòa {x}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Danh mục</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Tất cả</option>
            {categories.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label>Ngày đăng</label>
          <select value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}>
            {dateOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      </div>

      <div className="filter-actions">
        <button className="btn-apply" onClick={apply}>Áp dụng</button>
      </div>
    </div>
  );
};

export default FilterPanel;


