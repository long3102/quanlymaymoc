const App = {
    currentMachineId: null,
    machinesCache: [],
    unsubscribeLogs: null,

    init() {
        // 1. Lắng nghe dữ liệu danh sách máy từ Firestore
        MachineService.subscribeMachines(machines => {
            this.machinesCache = machines;
            UI.renderMachineList(machines, document.getElementById("searchInput").value);
        });

        // 2. Gán sự kiện cho các Form & Input
        this.bindEvents();

        // 3. Kiểm tra tham số URL (Quét mã QR)
        const urlParams = new URLSearchParams(window.location.search);
        const machineId = urlParams.get('id');
        if (machineId) {
            this.openDetail(machineId);
        } else {
            UI.showPage('page-home');
        }
    },

    bindEvents() {
        // Tìm kiếm thiết bị
        document.getElementById("searchInput").addEventListener("keyup", (e) => {
            UI.renderMachineList(this.machinesCache, e.target.value);
        });

        // Form Thêm Máy (Nhập link ảnh trực tiếp)
        document.getElementById("addMachineForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector("button[type='submit']");
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang lưu...`;

            try {
                const code = document.getElementById("addMachineCode").value.trim();
                const imageUrl = document.getElementById("addMachineImage").value.trim(); // Lấy trực tiếp link ảnh

                await MachineService.addMachine(code, {
                    name: document.getElementById("addMachineName").value.trim(),
                    status: document.getElementById("addMachineStatus").value,
                    location: document.getElementById("addMachineLocation").value.trim(),
                    desc: document.getElementById("addMachineDesc").value.trim(),
                    imageUrl: imageUrl || ''
                });

                alert("✅ Thêm máy thành công!");
                e.target.reset();
                UI.showPage('page-home');
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-plus me-1"></i> Khởi Tạo Máy Mới`;
            }
        });

        // Form Thêm Nhật Ký (Dùng link ảnh đính kèm nếu có)
        document.getElementById("addLogForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector("button[type='submit']");
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang lưu...`;

            try {
                const logImageUrl = document.getElementById("logImage").value.trim(); // Lấy link ảnh từ input text

                await MachineService.addLog(this.currentMachineId, {
                    title: document.getElementById("logTitle").value,
                    user: document.getElementById("logUser").value,
                    content: document.getElementById("logContent").value,
                    imageUrl: logImageUrl || ''
                });

                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('addLogModal')).hide();
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `Lưu Nhật Ký`;
            }
        });
    },

    async openDetail(id) {
        this.currentMachineId = id;
        UI.showPage('page-detail');

        const machine = await MachineService.getMachine(id);
        if (!machine) return;

        // Điền dữ liệu vào giao diện Chi Tiết
        document.getElementById("detailName").innerText = machine.name;
        document.getElementById("detailCode").innerText = machine.id;
        document.getElementById("detailLocation").innerText = machine.location || 'Chưa định vị';
        document.getElementById("detailDesc").innerText = machine.desc || 'Không có mô tả';

        const statusEl = document.getElementById("detailStatus");
        statusEl.innerText = machine.status;
        statusEl.className = `badge ${machine.status === 'Hoạt động' ? 'bg-success' : (machine.status === 'Hư hỏng' ? 'bg-danger' : 'bg-warning text-dark')}`;

        if (machine.imageUrl) {
            document.getElementById("detailImage").src = machine.imageUrl;
            document.getElementById("detailImageContainer").classList.remove("d-none");
        } else {
            document.getElementById("detailImageContainer").classList.add("d-none");
        }

        // 1. Lấy thư mục gốc hiện tại (Xóa 'index.html' nếu có trên URL)
        let basePath = window.location.pathname;
        if (basePath.endsWith('index.html')) {
            basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
        } else if (!basePath.endsWith('/')) {
            basePath += '/';
        }

        // 2. Tạo link Mã QR trỏ trực tiếp sang detail.html độc lập
        const qrUrl = `${window.location.origin}${basePath}detail.html?id=${id}`;
        this.currentQrUrl = qrUrl; // Lưu lại để dùng cho nút Chia sẻ Zalo

        // 3. Hiển thị link và render Mã QR
        const qrContainer = document.getElementById("qrcode");
        qrContainer.innerHTML = "";
        document.getElementById("qrUrlText").innerText = qrUrl;
        new QRCode(qrContainer, { text: qrUrl, width: 160, height: 160 });

        // Lắng nghe Sub-collection Logs theo thời gian thực
        if (this.unsubscribeLogs) this.unsubscribeLogs();
        this.unsubscribeLogs = MachineService.subscribeLogs(id, logs => {
            UI.renderLogs(logs);
        });
    }
};

// Khởi chạy App khi trang tải xong
window.addEventListener("DOMContentLoaded", () => App.init());