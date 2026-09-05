const App = {
    currentUser: null,
    currentMachineId: null,
    currentAuditId: null,

    machinesCache: [],
    materialsCache: [],
    auditsCache: [],

    unsubscribeMachines: null,
    unsubscribeMaterials: null,
    unsubscribeAudits: null,
    unsubscribeLogs: null,
    unsubscribeTransfers: null,

    init() {
        // 1. Kiểm tra session đăng nhập
        const savedUser = localStorage.getItem("factory_user");
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateUserUI(true);
            } catch (e) {
                this.currentUser = null;
            }
        }

        // 2. Lắng nghe dữ liệu Firestore Realtime
        this.subscribeAllData();

        // 3. Đăng ký các sự kiện Form & Input
        this.bindEvents();

        // 4. Kiểm tra URL xem có quét mã QR (chứa ?id=MÃ_MÁY)
        const urlParams = new URLSearchParams(window.location.search);
        const machineId = urlParams.get('id');

        if (machineId) {
            this.openDetail(machineId);
        } else if (this.currentUser) {
            UI.showPage('page-dashboard');
        } else {
            UI.showPage('page-login');
        }
    },

    updateUserUI(isLoggedIn) {
        const userInfoHeader = document.getElementById("userInfoHeader");
        const guestBanner = document.getElementById("guestBanner");
        const lblUserPhone = document.getElementById("lblUserPhone");

        if (isLoggedIn && this.currentUser) {
            userInfoHeader.classList.remove("d-none");
            guestBanner.classList.add("d-none");
            lblUserPhone.innerText = this.currentUser.phone;
        } else {
            userInfoHeader.classList.add("d-none");
            guestBanner.classList.remove("d-none");
        }
    },

    login(phone, pass) {
        if (phone === "0932891763" && pass === "123123") {
            this.currentUser = { phone: "0932891763", role: "admin", name: "Quản Lý Nhà Máy" };
            localStorage.setItem("factory_user", JSON.stringify(this.currentUser));
            this.updateUserUI(true);
            UI.showPage('page-dashboard');
            return true;
        } else {
            alert("❌ Số điện thoại hoặc mật khẩu không chính xác!\n(Gợi ý: SĐT: 0932891763 | Pass: 123123)");
            return false;
        }
    },

    logout() {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            localStorage.removeItem("factory_user");
            this.currentUser = null;
            this.updateUserUI(false);
            UI.showPage('page-login');
        }
    },

    subscribeAllData() {
        // 1. Machines
        if (this.unsubscribeMachines) this.unsubscribeMachines();
        this.unsubscribeMachines = MachineService.subscribeMachines(machines => {
            this.machinesCache = machines;
            this.refreshActiveViews();
        });

        // 2. Materials
        if (this.unsubscribeMaterials) this.unsubscribeMaterials();
        this.unsubscribeMaterials = MaterialService.subscribeMaterials(materials => {
            this.materialsCache = materials;
            this.refreshActiveViews();
        });

        // 3. Audits
        if (this.unsubscribeAudits) this.unsubscribeAudits();
        this.unsubscribeAudits = AuditService.subscribeAudits(audits => {
            this.auditsCache = audits;
            this.refreshActiveViews();
        });
    },

    refreshActiveViews() {
        UI.renderDashboard(this.machinesCache, this.materialsCache);
        UI.renderMachineList(this.machinesCache, document.getElementById("searchInput").value, UI.currentDeptFilter);
        UI.renderMaterialList(this.materialsCache, document.getElementById("searchMaterialInput").value);
        UI.renderAuditList(this.auditsCache);
        UI.renderAlertsPage(this.machinesCache, this.materialsCache);

        if (this.currentAuditId) {
            const currentAudit = this.auditsCache.find(a => a.id === this.currentAuditId);
            if (currentAudit) {
                UI.renderActiveAuditExecution(currentAudit, this.machinesCache);
            }
        }
    },

    filterDepartment(dept) {
        UI.currentDeptFilter = dept;
        UI.renderMachineList(this.machinesCache, document.getElementById("searchInput").value, dept);
    },

    bindEvents() {
        // Form Đăng nhập
        document.getElementById("loginForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const phone = document.getElementById("loginPhone").value.trim();
            const pass = document.getElementById("loginPass").value.trim();
            this.login(phone, pass);
        });

        // Tìm kiếm Thiết bị
        document.getElementById("searchInput").addEventListener("keyup", (e) => {
            UI.renderMachineList(this.machinesCache, e.target.value, UI.currentDeptFilter);
        });

        // Tìm kiếm Vật tư
        document.getElementById("searchMaterialInput").addEventListener("keyup", (e) => {
            UI.renderMaterialList(this.materialsCache, e.target.value);
        });

        // Form Thêm / Sửa Thiết Bị
        document.getElementById("machineForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!this.checkAuthGuard()) return;

            const btn = document.getElementById("btnSaveMachine");
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;

            try {
                const isEdit = document.getElementById("formIsEdit").value === "true";
                const code = document.getElementById("formMachineCode").value.trim();
                const imageFile = document.getElementById("formMachineImage").files[0];

                let imageUrl = "";
                if (imageFile) {
                    imageUrl = await MachineService.uploadImage(imageFile, "machines");
                }

                const machineData = {
                    name: document.getElementById("formMachineName").value.trim(),
                    status: document.getElementById("formMachineStatus").value,
                    department: document.getElementById("formMachineDept").value.trim(),
                    location: document.getElementById("formMachineLocation").value.trim(),
                    manager: document.getElementById("formMachineManager").value.trim(),
                    startDate: document.getElementById("formMachineStartDate").value,
                    price: Number(document.getElementById("formMachinePrice").value) || 0,
                    depreciationYears: Number(document.getElementById("formMachineDepYears").value) || 5,
                    maintenanceCycle: Number(document.getElementById("formMachineMaintCycle").value) || 90,
                    nextMaintenanceDate: document.getElementById("formMachineNextMaint").value,
                    desc: document.getElementById("formMachineDesc").value.trim()
                };

                if (imageUrl) {
                    machineData.imageUrl = imageUrl;
                }

                if (isEdit) {
                    await MachineService.updateMachine(code, machineData);
                    alert("✅ Cập nhật thông tin thiết bị thành công!");
                } else {
                    await MachineService.addMachine(code, machineData);
                    alert("✅ Thêm thiết bị mới thành công!");
                }

                e.target.reset();
                if (isEdit) {
                    this.openDetail(code);
                } else {
                    UI.showPage('page-machines');
                }
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Thiết Bị`;
            }
        });

        // Form Luân chuyển tài sản
        document.getElementById("transferForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!this.checkAuthGuard()) return;

            try {
                await MachineService.addTransfer(this.currentMachineId, {
                    toDepartment: document.getElementById("transferToDept").value.trim(),
                    toLocation: document.getElementById("transferToLocation").value.trim(),
                    toManager: document.getElementById("transferToManager").value.trim(),
                    date: document.getElementById("transferDate").value,
                    reason: document.getElementById("transferReason").value.trim(),
                    user: this.currentUser ? this.currentUser.phone : "Quản lý"
                });

                alert("✅ Khai báo luân chuyển tài sản thành công!");
                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
                this.openDetail(this.currentMachineId);
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            }
        });

        // Form Ghi Nhật Ký
        document.getElementById("addLogForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!this.checkAuthGuard()) return;

            const btn = e.target.querySelector("button[type='submit']");
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;

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
                btn.innerHTML = `Lưu Nhật Ký`;
            }
        });

        // Form Thêm Vật Tư Mới
        document.getElementById("materialForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!this.checkAuthGuard()) return;

            try {
                const code = document.getElementById("matCode").value.trim();
                await MaterialService.addMaterial(code, {
                    name: document.getElementById("matName").value.trim(),
                    unit: document.getElementById("matUnit").value.trim(),
                    location: document.getElementById("matLocation").value.trim(),
                    quantity: Number(document.getElementById("matQty").value) || 0,
                    minThreshold: Number(document.getElementById("matMin").value) || 3,
                    price: Number(document.getElementById("matPrice").value) || 0
                });

                alert("✅ Thêm vật tư mới thành công!");
                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('materialModal')).hide();
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            }
        });

        // Form Nhập / Xuất kho
        document.getElementById("stockForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!this.checkAuthGuard()) return;

            try {
                const matId = document.getElementById("stockMatId").value;
                const type = document.getElementById("stockType").value;
                const qty = Number(document.getElementById("stockQty").value);
                const user = document.getElementById("stockUser").value.trim();
                const note = document.getElementById("stockNote").value.trim();

                await MaterialService.updateStock(matId, qty, type, user, note);
                alert(`✅ ${type === 'import' ? 'Nhập kho' : 'Xuất kho'} thành công!`);
                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('stockModal')).hide();
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            }
        });

        // Form Tạo đợt Kiểm kê
        document.getElementById("createAuditForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!this.checkAuthGuard()) return;

            try {
                const title = document.getElementById("auditTitle").value.trim();
                const dept = document.getElementById("auditDepartment").value;
                const createdBy = document.getElementById("auditCreatedBy").value.trim();

                const auditId = await AuditService.createAudit(title, dept, createdBy);
                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById('createAuditModal')).hide();
                this.openActiveAudit(auditId);
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            }
        });

        // Filter trạng thái vật tư trong màn hình Kiểm kê
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("audit-item-filter")) {
                document.querySelectorAll(".audit-item-filter").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                UI.currentAuditFilter = e.target.getAttribute("data-filter");
                
                const currentAudit = this.auditsCache.find(a => a.id === this.currentAuditId);
                if (currentAudit) {
                    UI.renderActiveAuditExecution(currentAudit, this.machinesCache);
                }
            }
        });
    },

    checkAuthGuard() {
        if (!this.currentUser) {
            alert("⚠️ Bạn cần đăng nhập để thực hiện thao tác này!");
            UI.showPage('page-login');
            return false;
        }
        return true;
    },

    openAddMachineForm() {
        if (!this.checkAuthGuard()) return;

        document.getElementById("formIsEdit").value = "false";
        document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-plus-circle me-1"></i> Thêm Thiết Bị Mới`;
        document.getElementById("formMachineCode").readOnly = false;
        document.getElementById("machineForm").reset();

        // Default date picker to today
        const todayStr = new Date().toISOString().split('T')[0];
        document.getElementById("formMachineStartDate").value = todayStr;

        // Default next maintenance date to today + 90 days
        const next90 = new Date();
        next90.setDate(next90.getDate() + 90);
        document.getElementById("formMachineNextMaint").value = next90.toISOString().split('T')[0];

        UI.showPage('page-add-edit');
    },

    openEditMachineForm() {
        if (!this.checkAuthGuard()) return;

        const machine = this.machinesCache.find(m => m.id === this.currentMachineId);
        if (!machine) return;

        document.getElementById("formIsEdit").value = "true";
        document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-pen-to-square me-1"></i> Chỉnh Sửa Thiết Bị: ${machine.name}`;
        
        const codeInput = document.getElementById("formMachineCode");
        codeInput.value = machine.id;
        codeInput.readOnly = true;

        document.getElementById("formMachineName").value = machine.name || '';
        document.getElementById("formMachineStatus").value = machine.status || 'Hoạt động';
        document.getElementById("formMachineDept").value = machine.department || '';
        document.getElementById("formMachineLocation").value = machine.location || '';
        document.getElementById("formMachineManager").value = machine.manager || '';
        document.getElementById("formMachineStartDate").value = machine.startDate || '';
        document.getElementById("formMachinePrice").value = machine.price || '';
        document.getElementById("formMachineDepYears").value = machine.depreciationYears || 5;
        document.getElementById("formMachineMaintCycle").value = machine.maintenanceCycle || 90;
        document.getElementById("formMachineNextMaint").value = machine.nextMaintenanceDate || '';
        document.getElementById("formMachineDesc").value = machine.desc || '';

        UI.showPage('page-add-edit');
    },

    async openDetail(id) {
        this.currentMachineId = id;
        UI.showPage('page-detail');

        let machine = this.machinesCache.find(m => m.id === id);
        if (!machine) {
            machine = await MachineService.getMachine(id);
        }
        if (!machine) {
            alert("❌ Không tìm thấy thiết bị này!");
            UI.showPage('page-machines');
            return;
        }

        // Lắng nghe Logs realtime
        if (this.unsubscribeLogs) this.unsubscribeLogs();
        this.unsubscribeLogs = MachineService.subscribeLogs(id, logs => {
            UI.renderMachineDetail(machine, logs, []);
        });

        // Lắng nghe Transfers realtime
        if (this.unsubscribeTransfers) this.unsubscribeTransfers();
        this.unsubscribeTransfers = MachineService.subscribeTransfers(id, transfers => {
            UI.renderMachineDetail(machine, [], transfers);
        });

        // Render initial view
        UI.renderMachineDetail(machine, [], []);
    },

    openStockModal(matId, matName, currentQty, type) {
        if (!this.checkAuthGuard()) return;

        document.getElementById("stockMatId").value = matId;
        document.getElementById("stockType").value = type;
        document.getElementById("stockMatName").innerText = matName;
        document.getElementById("stockCurrentQty").innerText = currentQty;

        const header = document.getElementById("stockModalHeader");
        const title = document.getElementById("stockModalTitle");
        const btn = document.getElementById("btnStockSubmit");

        if (type === 'import') {
            header.className = "modal-header bg-success text-white";
            title.innerHTML = `<i class="fa-solid fa-arrow-down-to-line me-1"></i> Nhập Kho Vật Tư`;
            btn.className = "btn btn-success w-100 py-2 fw-bold";
            btn.innerText = "Xác Nhận Nhập Kho";
        } else {
            header.className = "modal-header bg-danger text-white";
            title.innerHTML = `<i class="fa-solid fa-arrow-up-from-line me-1"></i> Xuất Kho Vật Tư`;
            btn.className = "btn btn-danger w-100 py-2 fw-bold";
            btn.innerText = "Xác Nhận Xuất Kho";
        }

        document.getElementById("stockForm").reset();
        document.getElementById("stockMatId").value = matId;
        document.getElementById("stockType").value = type;

        new bootstrap.Modal(document.getElementById('stockModal')).show();
    },

    openActiveAudit(auditId) {
        this.currentAuditId = auditId;
        const audit = this.auditsCache.find(a => a.id === auditId);
        if (audit) {
            UI.renderActiveAuditExecution(audit, this.machinesCache);
        }
    },

    async setAuditStatus(auditId, machineId, status) {
        if (!this.checkAuthGuard()) return;
        try {
            await AuditService.updateAuditItem(auditId, machineId, status);
        } catch (err) {
            alert("❌ Lỗi khi cập nhật kiểm kê: " + err.message);
        }
    },

    async completeCurrentAudit() {
        if (!this.checkAuthGuard()) return;
        if (!this.currentAuditId) return;

        if (confirm("Bạn có chắc chắn muốn hoàn thành đợt kiểm kê này? Dữ liệu kiểm kê sẽ được ghi nhận và khóa lại.")) {
            try {
                await AuditService.completeAudit(this.currentAuditId);
                alert("🎉 Đã hoàn thành đợt kiểm kê!");
                UI.closeActiveAuditView();
                this.currentAuditId = null;
            } catch (err) {
                alert("❌ Lỗi: " + err.message);
            }
        }
    }
};

// Khởi chạy App khi DOM sẵn sàng
window.addEventListener("DOMContentLoaded", () => App.init());