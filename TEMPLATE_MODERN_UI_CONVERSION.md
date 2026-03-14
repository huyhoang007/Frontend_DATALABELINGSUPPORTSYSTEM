# Template chuyển đổi sang Modern Enterprise UI

## Bước 1: Thêm imports và bảng màu

```javascript
import { useState } from 'react'; // Thêm nếu chưa có

// Bảng màu Modern Enterprise UI - Thêm vào đầu file
const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
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

## Bước 2: Thêm hover states

```javascript
const [hoveredRow, setHoveredRow] = useState(null);
const [hoveredKpi, setHoveredKpi] = useState(null);
const [hoveredButton, setHoveredButton] = useState(null);
```

## Bước 3: Chuyển đổi các pattern phổ biến

### Pattern 1: Container chính
**TỪ:**
```jsx
<div className="min-h-screen bg-background p-8">
```

**SANG:**
```jsx
<div style={{
  minHeight: "100vh",
  background: T.bg,
  padding: "32px 40px",
  fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
}}>
```

### Pattern 2: Card
**TỪ:**
```jsx
<Card className="p-6 bg-card border-border">
```

**SANG:**
```jsx
<div style={{
  padding: "24px",
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: "6px",
  boxShadow: "0 1px 3px rgba(9,30,66,.08)"
}}>
```

### Pattern 3: Button Primary
**TỪ:**
```jsx
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

**SANG:**
```jsx
<button
  onClick={handleClick}
  onMouseEnter={(e) => e.currentTarget.style.background = T.brandHover}
  onMouseLeave={(e) => e.currentTarget.style.background = T.brand}
  style={{
    padding: "8px 16px",
    fontSize: "13px",
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
  Click me
</button>
```

### Pattern 4: Table với hover
**TỪ:**
```jsx
<table className="w-full">
  <thead>
    <tr className="bg-muted">
      <th className="px-4 py-2">Column</th>
    </tr>
  </thead>
  <tbody>
    {data.map((item, idx) => (
      <tr key={idx} className="hover:bg-muted cursor-pointer">
        <td className="px-4 py-2">{item.name}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**SANG:**
```jsx
{/* Header */}
<div style={{
  display: "grid",
  gridTemplateColumns: "1fr 150px 100px",
  padding: "12px 24px",
  background: "#FAFBFC",
  borderBottom: `1px solid ${T.border}`,
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

{/* Rows */}
{data.map((item, idx) => (
  <div
    key={idx}
    onMouseEnter={() => setHoveredRow(idx)}
    onMouseLeave={() => setHoveredRow(null)}
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 150px 100px",
      padding: "16px 24px",
      background: hoveredRow === idx ? T.brandLight : (idx % 2 === 0 ? T.surface : "#FAFBFC"),
      borderBottom: `1px solid ${T.border}`,
      cursor: "pointer",
      transition: "all .15s",
      gap: "12px"
    }}
  >
    <span style={{ fontSize: "13px", fontWeight: 600, color: T.textPrimary }}>
      {item.name}
    </span>
  </div>
))}
```

### Pattern 5: Status Badge
**TỪ:**
```jsx
<span className={`px-2 py-1 rounded text-xs ${
  status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
}`}>
  {status}
</span>
```

**SANG:**
```jsx
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
  background: status === 'active' ? T.greenBg : T.redBg,
  color: status === 'active' ? T.green : T.red
}}>
  <span style={{
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: status === 'active' ? T.green : T.red
  }} />
  {status}
</span>
```

### Pattern 6: Modal
**TỪ:**
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Title</h2>
      <p>Content</p>
    </div>
  </div>
)}
```

**SANG:**
```jsx
{showModal && (
  <div style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  }}>
    <div style={{
      background: T.surface,
      padding: "32px",
      borderRadius: "6px",
      maxWidth: "500px",
      width: "90%",
      boxShadow: "0 8px 24px rgba(9,30,66,.25)"
    }}>
      <h2 style={{
        fontSize: "20px",
        fontWeight: 700,
        color: T.textPrimary,
        marginBottom: "16px"
      }}>
        Title
      </h2>
      <p style={{ fontSize: "13px", color: T.textMuted }}>
        Content
      </p>
    </div>
  </div>
)}
```

## Bước 4: Checklist cho mỗi trang

1. [ ] Copy bảng màu T vào đầu file
2. [ ] Thêm useState cho hover states
3. [ ] Tìm tất cả `className=` và chuyển sang `style={{}}`
4. [ ] Áp dụng font: 'IBM Plex Sans'
5. [ ] Border-radius: 4px (buttons), 6px (cards)
6. [ ] Thêm hover effects với onMouseEnter/onMouseLeave
7. [ ] Box-shadow khi hover
8. [ ] Transitions: "all .15s"
9. [ ] Typography: uppercase labels
10. [ ] Test lại tất cả chức năng

## Ví dụ hoàn chỉnh: Simple Page

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const T = {
  bg: "#F7F8F9",
  surface: "#FFFFFF",
  surfaceHover: "#F1F2F4",
  border: "#DCDFE4",
  textPrimary: "#172B4D",
  textMuted: "#626F86",
  brand: "#0C66E4",
  brandHover: "#0055CC",
  brandLight: "#E9F2FF",
};

export default function MyPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data logic...
    setLoading(false);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      padding: "32px 40px",
      fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{
          fontSize: "11px",
          fontWeight: 700,
          color: T.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "4px"
        }}>
          Section Label
        </p>
        <h1 style={{
          fontSize: "24px",
          fontWeight: 800,
          color: T.textPrimary,
          letterSpacing: "-0.02em"
        }}>
          Page Title
        </h1>
      </div>

      {/* Content Card */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(9,30,66,.08)"
      }}>
        {/* Table Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 150px 100px",
          padding: "12px 24px",
          background: "#FAFBFC",
          borderBottom: `1px solid ${T.border}`,
          gap: "12px"
        }}>
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            color: T.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em"
          }}>
            NAME
          </p>
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            color: T.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em"
          }}>
            STATUS
          </p>
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            color: T.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            textAlign: "right"
          }}>
            ACTION
          </p>
        </div>

        {/* Table Rows */}
        {data.map((item, idx) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredRow(idx)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 150px 100px",
              padding: "16px 24px",
              background: hoveredRow === idx ? T.brandLight : (idx % 2 === 0 ? T.surface : "#FAFBFC"),
              borderBottom: `1px solid ${T.border}`,
              cursor: "pointer",
              transition: "all .15s",
              gap: "12px"
            }}
          >
            <span style={{
              fontSize: "13px",
              fontWeight: 600,
              color: T.textPrimary
            }}>
              {item.name}
            </span>
            <span>Status</span>
            <div style={{ textAlign: "right" }}>
              <button style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: T.brand,
                background: "transparent",
                border: `1px solid ${T.border}`,
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all .15s"
              }}>
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Lưu ý quan trọng

1. **KHÔNG thay đổi logic**: Chỉ thay đổi styling
2. **Giữ nguyên event handlers**: onClick, onChange, etc.
3. **Giữ nguyên state management**: useState, useEffect
4. **Giữ nguyên API calls**: Không sửa fetch logic
5. **Test kỹ sau khi chuyển đổi**: Đảm bảo mọi chức năng vẫn hoạt động

## Các trang đã hoàn thành

✅ Manager Dashboard
✅ Annotator Dashboard
✅ Reviewer Dashboard
✅ Admin Dashboard

Áp dụng template này cho các trang còn lại!
