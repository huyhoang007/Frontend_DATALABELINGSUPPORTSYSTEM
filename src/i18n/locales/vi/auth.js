const auth = {
  login: {
    title: "Đăng nhập",
    subtitle: "Hệ thống gán nhãn dữ liệu nội bộ",
    newAccount: "Chưa có tài khoản?",
    switchToRegister: "Đăng ký",
    authenticating: "ĐANG XÁC THỰC...",
    submit: "ĐĂNG NHẬP",
    success: "Chào mừng trở lại, {{username}}!",
    failed: "Đăng nhập thất bại",
    required: "Vui lòng nhập đầy đủ thông tin",
    fields: {
      username: { label: "Tên đăng nhập", placeholder: "username" },
      password: { label: "Mật khẩu", placeholder: "••••••••" },
    },
  },
  register: {
    title: "Tạo tài khoản mới",
    submit: "TẠO TÀI KHOẢN",
    creating: "ĐANG TẠO TÀI KHOẢN...",
    switchToLogin: "Đăng nhập",
    hasAccount: "Đã có tài khoản?",
    noAccount: "Chưa có tài khoản?",
    success: "Đăng ký thành công! Tài khoản đang chờ phê duyệt.",
    successPending:
      "Đăng ký thành công! Vui lòng chờ quản trị viên duyệt tài khoản.",
    failed: "Đăng ký thất bại",
    fields: {
      username: { label: "Tên đăng nhập", placeholder: "username" },
      fullName: { label: "Họ và tên", placeholder: "Nguyễn Văn A" },
      email: { label: "Email", placeholder: "email@example.com" },
      password: { label: "Mật khẩu", placeholder: "••••••••" },
      confirmPassword: {
        label: "Xác nhận mật khẩu",
        placeholder: "••••••••",
      },
    },
    validation: {
      usernameRequired: "Tên đăng nhập là bắt buộc",
      usernameMin: "Tên đăng nhập phải có ít nhất 3 ký tự",
      fullNameRequired: "Họ tên là bắt buộc",
      emailRequired: "Email là bắt buộc",
      emailInvalid: "Email không hợp lệ",
      passwordRequired: "Mật khẩu là bắt buộc",
      passwordMin: "Mật khẩu phải có ít nhất 6 ký tự",
      passwordMismatch: "Mật khẩu không khớp",
      shortRequired: "Bắt buộc",
      shortMin3: "Tối thiểu 3 ký tự",
      shortMin6: "Tối thiểu 6 ký tự",
    },
    backendErrors: {
      emailExists: "Email đã tồn tại trong hệ thống",
      usernameExists: "Tên đăng nhập đã tồn tại",
      roleNotFound: "Không tìm thấy role",
      generic: "Đăng ký thất bại. Vui lòng thử lại.",
    },
  },
  marketing: {
    eyebrow: "Nền tảng gán nhãn dữ liệu",
    titleLine1: "Gán nhãn",
    titleLine2: "dữ liệu",
    titleAccent: "chính xác hơn",
    description:
      "Quản lý, phân công và theo dõi tiến độ gán nhãn dữ liệu ngay trên một nền tảng. Được tin dùng bởi các nhóm ở mọi quy mô, cho dữ liệu ở mọi quy mô.",
    restricted: "Truy cập hạn chế",
    internalOnly: "Chỉ nội bộ",
  },
};

export default auth;
