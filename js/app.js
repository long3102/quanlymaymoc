const App = {
    currentMachineId: null,
    machinesCache: [],
    unsubscribeLogs: null,

    init() {
        // 1. Lắng nghe dữ liệu danh sách máy
        MachineService.subscribeMachines(machines => {
            this.machinesCache = machines;
            UI.renderMachineList(machines, document.getElementById("searchInput").value);
        });

        // 2. Gán sự kiện cho các Form & Input
        this.bindEvents();

        // 3. Tự động kiểm tra URL xem có quét QR không
        const urlParams = new URLSearchParams(window.location.search);
        const machineId = urlParams.get('id');
        if (machineId) {
            this.openDetail(machineId);
        } else {
            UI.showPage('page-home');
        }
    },

    bindEvents() {
        // Tìm kiếm
        document.getElementById("searchInput").addEventListener("keyup", (e) => {
            UI.renderMachineList(this.machinesCache, e.target.value);
        });

        // Form Thêm Máy
        document.getElementById("addMachineForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector("button[type='submit']");
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;

            try {
                const code = document.getElementById("addMachineCode").value.trim();
                const imageFile = document.getElementById("addMachineImage").files[0];

                let imageUrl = "";
                if (imageFile) {
                    imageUrl = await MachineService.uploadImage(imageFile, "machines");
                }

                await MachineService.addMachine(code, {
                    name: document.getElementById("addMachineName").value.trim(),
                    status: document.getElementById("addMachineStatus").value,
                    location: document.getElementById("addMachineLocation").value.trim(),
                    desc: document.getElementById("addMachineDesc").value.trim(),
                    imageUrl: imageUrl
                });

                alert("✅ Thêm máy thành công!");
                e.target.reset();
                UI.showPage('page-home');
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i> Lưu máy mới`;
            }
        });

        // Form Thêm Nhật Ký (kèm ảnh)
        document.getElementById("addLogForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector("button[type='submit']");
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải lên...`;

            try {
                const imageFile = document.getElementById("logImage").files[0];
                await MachineService.addLog(this.currentMachineId, {
                    title: document.getElementById("logTitle").value,
                    user: document.getElementById("logUser").value,
                    content: document.getElementById("logContent").value
                }, imageFile);

                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('addLogModal')).hide();
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `Ghi Nhật Ký`;
            }
        });
    },

    async openDetail(id) {
        this.currentMachineId = id;
        UI.showPage('page-detail');

        const machine = await MachineService.getMachine(id);
        if (!machine) return;

        // Populate dữ liệu
        document.getElementById("detailName").innerText = machine.name;
        document.getElementById("detailCode").innerText = machine.id;
        document.getElementById("detailLocation").innerText = machine.location || 'Chưa rõ';
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

        // Gen QR Code
        const qrContainer = document.getElementById("qrcode");
        qrContainer.innerHTML = "";
        const qrUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
        document.getElementById("qrUrlText").innerText = qrUrl;
        new QRCode(qrContainer, { text: qrUrl, width: 160, height: 160 });

        // Lắng nghe Sub-collection Logs
        if (this.unsubscribeLogs) this.unsubscribeLogs();
        this.unsubscribeLogs = MachineService.subscribeLogs(id, logs => {
            UI.renderLogs(logs);
        });
    }
};

// Khởi chạy App khi trang tải xong
window.addEventListener("DOMContentLoaded", () => App.init());