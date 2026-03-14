# Hướng dẫn áp dụng Modern Enterprise UI cho tất cả các trang

## Bảng màu chuẩn (Object T)

```javascript
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  borderStrong: "#B3B9C4",
  textPrimary: "#172B4D",
  textSecondary: "#44546F",
  textMuted: "#626F86",
  brand: "#0C66E4",
  brandHover: "#0055CC",
  brandLight: "#E9F2FF",
  green: "#1F845A",
  greenBg: "#DCFFF1",
  amber: "#A54800",
  amberBg: "#FFF7D6",
  purple: "#5E4DB2",
  purpleBg: "#F3F0FF",
  red: "#DE350B",
  redBg: "#FFEBE6",
};
```

## Quy tắc styling

### 1. Container chính
```javascript
<div style={{
  minHeight: "100vh",
  background: T.bg,
  fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
  color: T.textPrimary
}}>
```

### 2. Card/Panel
```javascript
<div style={{
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: "6px",
  padding: "32px",
  boxShadow: "0 1px 3px rgba(9,30,66,.08)"
}}>
```

### 3. KPI Card với hover
```javascript
const [hoveredKpi, setHoveredKpi] = useState(null);

<div
  onMouseEnter={() => setHoveredKpi(idx)}
  onMouseLeave={() => setHoveredKpi(null)}
  style={{
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: "6px",
    padding: "20px",
    borderTop: `3px solid ${color}`,
    boxShadow: hoveredKpi === idx ? "0 4px 12px rgba(9,30,66,.12)" : "none",
    transition: "all .2s"
  }}
>
```

### 4. Typography

**Page Title:**
```javascript
<h1 style={{
  fontSize: "24px",
  fontWeight: 800,
  color: T.textPrimary,
  letterSpacing: "-0.02em",
  marginBottom: "4px"
}}>
```

**Section Label:**
```javascript
<p style={{
  fontSize: "11px",
  fontWeight: 700,
  color: T.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "4px"
}}>
```

**Body Text:**
```javascript
<p style={{
  fontSize: "13px",
  color: T.textMuted
}}>
```

### 5. Buttons

**Primary Button:**
```javascript
<button
  onClick={handleClick}
  onMouseEnter={(e) => e.currentTarget.style.background = T.brandHover}
  onMouseLeave={(e) => e.currentTarget.style.background = T.brand}
  style={{
    height: "32px",
    padding: "0 16px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#FFFFFF",
    background: T.brand,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s"
  }}
>
  Button Text
</button>
```

**Secondary Button:**
```javascript
<button
  style={{
    height: "32px",
    padding: "0 16px",
    fontSize: "12px",
    fontWeight: 600,
    color: T.textPrimary,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s"
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceHover}
  onMouseLeave={(e) => e.currentTarget.style.background = T.surface}
>
```

### 6. Status Badges
```javascript
const STATUS_STYLES = {
  PENDING: { bg: T.amberBg, text: T.amber, dot: "#FF8B00" },
  IN_PROGRESS: { bg: T.brandLight, text: T.brand, dot: T.brand },
  APPROVED: { bg: T.greenBg, text: T.green, dot: T.green },
  REJECTED: { bg: T.redBg, text: T.red, dot: T.red },
};

<span style={{
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 10px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  background: statusStyle.bg,
  color: statusStyle.text
}}>
  <span style={{
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: statusStyle.dot
  }} />
  {status}
</span>
```

### 7. Progress Bar
```javascript
<div style={{
  height: "6px",
  background: T.border,
  borderRadius: "99px",
  overflow: "hidden"
}}>
  <div style={{
    height: "100%",
    width: `${progress}%`,
    background: T.brand,
    borderRadius: "99px",
    transition: "width .5s ease"
  }} />
</div>
```

### 8. Table Header
```javascript
<div style={{
  display: "grid",
  gridTemplateColumns: "80px 1fr 180px 120px",
  padding: "12px 24px",
  borderBottom: `1px solid ${T.border}`,
  background: "#FAFBFC",
  gap: "12px"
}}>
  <p style={{
    fontSize: "10px",
    fontWeight: 700,
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  }}>
    COLUMN
  </p>
</div>
```

### 9. Table Row với hover
```javascript
const [hoveredRow, setHoveredRow] = useState(null);

<div
  onMouseEnter={() => setHoveredRow(idx)}
  onMouseLeave={() => setHoveredRow(null)}
  onClick={handleClick}
  style={{
    display: "grid",
    gridTemplateColumns: "80px 1fr 180px 120px",
    alignItems: "center",
    padding: "16px 24px",
    background: hoveredRow === idx ? T.brandLight : (idx % 2 === 0 ? T.surface : "#FAFBFC"),
    borderBottom: `1px solid ${T.border}`,
    cursor: "pointer",
    transition: "all .15s",
    gap: "12px"
  }}
>
```

### 10. Search Input
```javascript
<input
  type="text"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    width: "100%",
    padding: "8px 12px",
    paddingLeft: "40px",
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: "6px",
    fontSize: "13px",
    color: T.textPrimary,
    fontFamily: "inherit",
    outline: "none",
    transition: "all .15s"
  }}
  onFocus={(e) => {
    e.currentTarget.style.borderColor = T.brand;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${T.brand}20`;
  }}
  onBlur={(e) => {
    e.currentTarget.style.borderColor = T.border;
    e.currentTarget.style.boxShadow = "none";
  }}
  placeholder="Tìm kiếm..."
/>
```

### 11. Tabs
```javascript
<div style={{
  display: "inline-flex",
  padding: "4px",
  background: T.surfaceHover,
  borderRadius: "6px",
  border: `1px solid ${T.border}`,
  gap: "4px"
}}>
  {TABS.map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "6px 12px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        background: activeTab === tab ? T.surface : "transparent",
        color: activeTab === tab ? T.brand : T.textMuted,
        border: activeTab === tab ? `1px solid ${T.brand}20` : "1px solid transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all .15s",
        boxShadow: activeTab === tab ? "0 1px 3px rgba(9,30,66,.08)" : "none"
      }}
    >
      {tab}
    </button>
  ))}
</div>
```

## Checklist áp dụng cho mỗi trang

- [ ] Thêm bảng màu T vào đầu file
- [ ] Thêm useState cho hover states
- [ ] Chuyển tất cả className sang style={{}}
- [ ] Áp dụng font: 'IBM Plex Sans'
- [ ] Border-radius: 4px cho buttons, 6px cho cards
- [ ] Box-shadow khi hover: "0 4px 12px rgba(9,30,66,.12)"
- [ ] Transitions: "all .15s"
- [ ] Typography: uppercase labels với letterSpacing
- [ ] Giữ nguyên 100% logic và event handlers

## Các trang đã hoàn thành

✅ Manager Dashboard
✅ Annotator Dashboard
✅ Reviewer Dashboard
✅ Admin Dashboard

## Các trang cần áp dụng

⏳ Annotator TaskList
⏳ Reviewer Queue
⏳ Admin Users
⏳ Admin ActivityLogs
⏳ Manager Projects
⏳ Manager other pages
⏳ Các trang Modern/*
