const UI = {
    pageHistory: [],
    currentPage: 'page-login',
    currentDeptFilter: 'ALL',
    currentAuditFilter: 'ALL',

    // Định dạng tiền VNĐ
    formatVND(num) {
        if (!num || isNaN(num)) return "0 VNĐ";
        return new Intl.NumberFormat('vi-VN').format(num) + " VNĐ";
    },

    // Định dạng ngày DD/MM/YYYY
    formatDate(dateVal) {
        if (!dateVal) return "---";
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return dateVal;
        return d.toLocaleDateString('vi-VN');
    },

    // Tính toán Khấu hao tài sản
    calculateDepreciation(startDateStr, priceVal, yearsVal) {
        const price = Number(priceVal) || 0;
        const years = Number(yearsVal) || 0;

        if (!startDateStr || price <= 0 || years <= 0) {
            return {
                monthlyDep: 0,
                totalDep: 0,
                remainingValue: price,
                percentDep: 0,
                startDateStr: startDateStr || '---',
                endDateStr: '---',
                isExpired: false
            };
        }

        const start = new Date(startDateStr);
        if (isNaN(start.getTime())) {
            return {
                monthlyDep: 0,
                totalDep: 0,
                remainingValue: price,
                percentDep: 0,
                startDateStr: startDateStr,
                endDateStr: '---',
                isExpired: false
            };
        }

        const end = new Date(start);
        end.setFullYear(end.getFullYear() + years);

        const now = new Date();
        const totalMonths = years * 12;
        const monthlyDep = Math.round(price / totalMonths);

        let elapsedMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        if (now.getDate() < start.getDate()) elapsedMonths--;
        if (elapsedMonths < 0) elapsedMonths = 0;

        let totalDep = elapsedMonths * monthlyDep;
        if (totalDep > price) totalDep = price;

        const remainingValue = Math.max(0, price - totalDep);
        const percentDep = Math.min(100, Math.round((totalDep / price) * 100));
        const isExpired = now >= end || remainingValue === 0;

        return {
            monthlyDep,
            totalDep,
            remainingValue,
            percentDep,
            startDateStr: this.formatDate(start),
            endDateStr: this.formatDate(end),
            isExpired
        };
    },

    // Kiểm tra tính trạng bảo dưỡng
    checkMaintenanceDue(nextDateStr) {
        if (!nextDateStr) return { isDue: false, isOverdue: false, days: 999, text: 'Chưa lên lịch' };

        const nextDate = new Date(nextDateStr);
        if (isNaN(nextDate.getTime())) return { isDue: false, isOverdue: false, days: 999, text: nextDateStr };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextDate.setHours(0, 0, 0, 0);

        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { isDue: true, isOverdue: true, days: Math.abs(diffDays), text: `Quá hạn ${Math.abs(diffDays)} ngày` };
        } else if (diffDays <= 7) {
            return { isDue: true, isOverdue: false, days: diffDays, text: diffDays === 0 ? 'Hôm nay đến hạn' : `Còn ${diffDays} ngày` };
        } else {
            return { isDue: false, isOverdue: false, days: diffDays, text: `Còn ${diffDays} ngày` };
        }
    },

    // Chuyển Trang / Tab
    showPage(pageId, pushHistory = true) {
        if (pushHistory && this.currentPage && this.currentPage !== pageId) {
            this.pageHistory.push(this.currentPage);
        }
        this.currentPage = pageId;

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        const pageEl = document.getElementById(pageId);
        if (pageEl) pageEl.classList.add('active');

        const headerTitle = document.getElementById('headerTitle');
        const btnBack = document.getElementById('btnBack');

        // Navigation Highlight & Header text
        if (pageId === 'page-dashboard') {
            document.querySelectorAll('.nav-item')[0]?.classList.add('active');
            headerTitle.innerHTML = '<i class="fa-solid fa-chart-pie me-2"></i>Tổng Quan';
            btnBack.classList.add('d-none');
        } else if (pageId === 'page-machines') {
            document.querySelectorAll('.nav-item')[1]?.classList.add('active');
            headerTitle.innerHTML = '<i class="fa-solid fa-gears me-2"></i>Danh Sách Thiết Bị';
            btnBack.classList.add('d-none');
        } else if (pageId === 'page-materials') {
            document.querySelectorAll('.nav-item')[2]?.classList.add('active');
            headerTitle.innerHTML = '<i class="fa-solid fa-boxes-stacked me-2"></i>Quản Lý Vật Tư';
            btnBack.classList.add('d-none');
        } else if (pageId === 'page-audit') {
            document.querySelectorAll('.nav-item')[3]?.classList.add('active');
            headerTitle.innerHTML = '<i class="fa-solid fa-clipboard-check me-2"></i>Kiểm Kê Số Hóa';
            btnBack.classList.add('d-none');
        } else if (pageId === 'page-alerts') {
            document.querySelectorAll('.nav-item')[4]?.classList.add('active');
            headerTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>Cảnh Báo Hệ Thống';
            btnBack.classList.remove('d-none');
        } else if (pageId === 'page-detail') {
            headerTitle.innerHTML = 'Chi Tiết Thiết Bị';
            btnBack.classList.remove('d-none');
        } else if (pageId === 'page-add-edit') {
            btnBack.classList.remove('d-none');
        } else if (pageId === 'page-login') {
            headerTitle.innerHTML = '<i class="fa-solid fa-industry me-2"></i>Quản Lý Nhà Máy';
            btnBack.classList.add('d-none');
        }

        window.scrollTo(0, 0);
    },

    showPreviousPage() {
        if (this.pageHistory.length > 0) {
            const prev = this.pageHistory.pop();
            this.showPage(prev, false);
        } else {
            this.showPage('page-dashboard', false);
        }
    },

    // Render Dashboard
    renderDashboard(machines, materials) {
        const totalMachines = machines.length;
        const activeMachines = machines.filter(m => m.status === 'Hoạt động').length;
        const issueMachines = machines.filter(m => m.status === 'Cần bảo trì' || m.status === 'Hư hỏng').length;
        const totalMaterials = materials.length;

        let grandTotalPrice = 0;
        let grandMonthlyDep = 0;
        let maintDueCount = 0;
        let depExpiredCount = 0;

        const urgentAlerts = [];

        machines.forEach(m => {
            const dep = this.calculateDepreciation(m.startDate, m.price, m.depreciationYears);
            grandTotalPrice += Number(m.price) || 0;
            grandMonthlyDep += dep.monthlyDep;

            if (dep.isExpired) {
                depExpiredCount++;
                urgentAlerts.push({
                    type: 'dep',
                    title: `Tài sản ${m.name} (${m.id})`,
                    desc: `Đã hết thời gian khấu hao (${dep.endDateStr}).`
                });
            }

            const maint = this.checkMaintenanceDue(m.nextMaintenanceDate);
            if (maint.isDue) {
                maintDueCount++;
                urgentAlerts.push({
                    type: 'maint',
                    title: `Bảo dưỡng ${m.name} (${m.id})`,
                    desc: maint.isOverdue ? `Quá hạn bảo dưỡng ${maint.days} ngày!` : `Đến hạn bảo dưỡng trong ${maint.days} ngày.`
                });
            }
        });

        const lowStockMaterials = materials.filter(mat => Number(mat.quantity) <= Number(mat.minThreshold));
        lowStockMaterials.forEach(mat => {
            urgentAlerts.push({
                type: 'stock',
                title: `Vật tư ${mat.name} (${mat.id})`,
                desc: `Sắp hết hàng! Tồn kho hiện tại: ${mat.quantity} ${mat.unit} (Ngưỡng min: ${mat.minThreshold}).`
            });
        });

        document.getElementById("statTotalMachines").innerText = totalMachines;
        document.getElementById("statActiveMachines").innerText = activeMachines;
        document.getElementById("statIssueMachines").innerText = issueMachines;
        document.getElementById("statTotalMaterials").innerText = totalMaterials;
        document.getElementById("statTotalValue").innerText = this.formatVND(grandTotalPrice);
        document.getElementById("statMonthlyDepreciation").innerText = this.formatVND(grandMonthlyDep);

        // Header Alert Badge
        const totalAlertsCount = urgentAlerts.length;
        const badgeHeader = document.getElementById("badgeAlertCount");
        if (totalAlertsCount > 0) {
            badgeHeader.innerText = totalAlertsCount;
            badgeHeader.classList.remove("d-none");
        } else {
            badgeHeader.classList.add("d-none");
        }

        // Render Quick Alerts list on dashboard
        const alertListContainer = document.getElementById("dashboardAlertList");
        if (urgentAlerts.length === 0) {
            alertListContainer.innerHTML = `<div class="text-success x-small py-1"><i class="fa-solid fa-circle-check me-1"></i> Tất cả thiết bị và vật tư đang ở trạng thái an toàn.</div>`;
        } else {
            alertListContainer.innerHTML = urgentAlerts.slice(0, 3).map(al => `
                <div class="d-flex align-items-start gap-2 p-2 mb-2 rounded-3 ${al.type === 'maint' ? 'bg-warning bg-opacity-10 text-dark border-start border-3 border-warning' : (al.type === 'dep' ? 'bg-danger bg-opacity-10 text-dark border-start border-3 border-danger' : 'bg-info bg-opacity-10 text-dark border-start border-3 border-info')}">
                    <i class="fa-solid ${al.type === 'maint' ? 'fa-wrench text-warning' : (al.type === 'dep' ? 'fa-calculator text-danger' : 'fa-box-open text-info')} mt-1"></i>
                    <div class="flex-grow-1">
                        <div class="fw-bold x-small">${al.title}</div>
                        <div class="x-small text-secondary">${al.desc}</div>
                    </div>
                </div>
            `).join('');
        }
    },

    // Render danh sách thiết bị
    renderMachineList(machines, keyword = "", selectedDept = "ALL") {
        const container = document.getElementById("machineList");
        const deptContainer = document.getElementById("deptFilterContainer");

        // Dynamically build department filter list
        const depts = Array.from(new Set(machines.map(m => m.department).filter(Boolean)));
        deptContainer.innerHTML = `
            <button class="btn btn-sm ${selectedDept === 'ALL' ? 'btn-primary active' : 'btn-outline-secondary'} filter-dept-btn" onclick="App.filterDepartment('ALL')">Tất cả</button>
        ` + depts.map(d => `
            <button class="btn btn-sm ${selectedDept === d ? 'btn-primary active' : 'btn-outline-secondary'} filter-dept-btn" onclick="App.filterDepartment('${d}')">${d}</button>
        `).join('');

        // Filter machines
        const filtered = machines.filter(m => {
            const matchKeyword = (m.name || "").toLowerCase().includes(keyword.toLowerCase()) ||
                (m.id || "").toLowerCase().includes(keyword.toLowerCase()) ||
                (m.department || "").toLowerCase().includes(keyword.toLowerCase()) ||
                (m.location || "").toLowerCase().includes(keyword.toLowerCase());

            const matchDept = selectedDept === 'ALL' || m.department === selectedDept;

            return matchKeyword && matchDept;
        });

        container.innerHTML = "";

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fa-solid fa-box-open fa-2x mb-2 opacity-50"></i>
                    <br><span class="small">Không tìm thấy thiết bị nào</span>
                </div>
            `;
            return;
        }

        filtered.forEach(m => {
            const statusClass = m.status === 'Hoạt động' ? 'bg-success' : (m.status === 'Hư hỏng' ? 'bg-danger' : 'bg-warning text-dark');
            const imgHtml = m.imageUrl ? `<img src="${m.imageUrl}" class="rounded-3 me-3" style="width: 55px; height: 55px; object-fit: cover;">` : `<div class="bg-light rounded-3 me-3 d-flex align-items-center justify-content-center" style="width: 55px; height: 55px;"><i class="fa-solid fa-gears text-muted fa-lg"></i></div>`;
            
            const dep = this.calculateDepreciation(m.startDate, m.price, m.depreciationYears);
            const maint = this.checkMaintenanceDue(m.nextMaintenanceDate);

            let maintBadge = '';
            if (maint.isDue) {
                maintBadge = maint.isOverdue ? `<span class="badge bg-danger ms-1">Bảo dưỡng quá hạn</span>` : `<span class="badge bg-warning text-dark ms-1">Đến hạn bảo dưỡng</span>`;
            }

            container.innerHTML += `
                <div class="card card-machine p-3 mb-2 shadow-sm" onclick="App.openDetail('${m.id}')">
                    <div class="d-flex align-items-center">
                        ${imgHtml}
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <h6 class="fw-bold m-0 text-dark">${m.name}</h6>
                                <div>
                                    <span class="badge ${statusClass}">${m.status}</span>
                                    ${maintBadge}
                                </div>
                            </div>
                            <div class="text-muted x-small mb-1">
                                <span class="fw-bold text-primary">Mã: ${m.id}</span> | <i class="fa-solid fa-building me-1 ms-1"></i>${m.department || 'Chưa gán PB'}
                            </div>
                            <div class="d-flex justify-content-between align-items-center x-small text-secondary">
                                <span><i class="fa-solid fa-user me-1"></i>QL: ${m.manager || 'Chưa rõ'}</span>
                                <span class="fw-semibold text-success">Còn lại: ${this.formatVND(dep.remainingValue)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    },

    // Render Chi tiết thiết bị
    renderMachineDetail(machine, logs = [], transfers = []) {
        document.getElementById("detailName").innerText = machine.name || '---';
        document.getElementById("detailCode").innerText = machine.id || '---';
        document.getElementById("detailDept").innerText = machine.department || 'Chưa khai báo';
        document.getElementById("detailLocation").innerText = machine.location || 'Chưa khai báo';
        document.getElementById("detailManager").innerText = machine.manager || 'Chưa khai báo';
        document.getElementById("detailDesc").innerText = machine.desc || 'Không có mô tả kỹ thuật.';

        const statusEl = document.getElementById("detailStatus");
        statusEl.innerText = machine.status || 'Chưa rõ';
        statusEl.className = `badge ${machine.status === 'Hoạt động' ? 'bg-success' : (machine.status === 'Hư hỏng' ? 'bg-danger' : 'bg-warning text-dark')}`;

        if (machine.imageUrl) {
            document.getElementById("detailImage").src = machine.imageUrl;
            document.getElementById("detailImageContainer").classList.remove("d-none");
        } else {
            document.getElementById("detailImageContainer").classList.add("d-none");
        }

        // Financial & Depreciation Math
        const dep = this.calculateDepreciation(machine.startDate, machine.price, machine.depreciationYears);
        document.getElementById("detailPrice").innerText = this.formatVND(machine.price);
        document.getElementById("detailMonthlyDep").innerText = this.formatVND(dep.monthlyDep);
        document.getElementById("detailStartDate").innerText = dep.startDateStr;
        document.getElementById("detailDepEndDate").innerText = dep.endDateStr;
        document.getElementById("detailRemainingValue").innerText = this.formatVND(dep.remainingValue);
        document.getElementById("detailDepPercent").innerText = `${dep.percentDep}%`;
        document.getElementById("detailDepProgressBar").style.width = `${dep.percentDep}%`;

        const depBadge = document.getElementById("detailDepBadge");
        if (dep.isExpired) {
            depBadge.innerText = "Đã hết khấu hao";
            depBadge.className = "badge bg-danger";
        } else {
            depBadge.innerText = `Khấu hao ${dep.percentDep}%`;
            depBadge.className = "badge bg-primary";
        }

        // Maintenance due check
        const maint = this.checkMaintenanceDue(machine.nextMaintenanceDate);
        const maintEl = document.getElementById("detailNextMaint");
        if (machine.nextMaintenanceDate) {
            maintEl.innerText = `${this.formatDate(machine.nextMaintenanceDate)} (${maint.text})`;
            maintEl.className = maint.isOverdue ? 'fw-bold text-danger' : (maint.isDue ? 'fw-bold text-warning' : 'fw-bold text-dark');
        } else {
            maintEl.innerText = 'Chưa lên lịch';
            maintEl.className = 'text-muted';
        }

        // QR Code url
        const qrContainer = document.getElementById("qrcode");
        qrContainer.innerHTML = "";
        const qrUrl = `${window.location.origin}${window.location.pathname}?id=${machine.id}`;
        document.getElementById("qrUrlText").innerText = qrUrl;
        new QRCode(qrContainer, { text: qrUrl, width: 160, height: 160 });

        // Render sub-lists
        this.renderLogs(logs);
        this.renderTransfers(transfers);
    },

    // Render Logs list
    renderLogs(logs) {
        const container = document.getElementById("logsContainer");
        container.innerHTML = "";

        if (logs.length === 0) {
            container.innerHTML = `<p class="text-muted x-small text-center py-3">Chưa có nhật ký nào được ghi nhận.</p>`;
            return;
        }

        logs.forEach(log => {
            const dateStr = log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'Vừa xong';
            const imgHtml = log.imageUrl ? `<img src="${log.imageUrl}" class="img-preview mb-2 shadow-sm" onclick="window.open('${log.imageUrl}')">` : '';

            container.innerHTML += `
                <div class="timeline-item">
                    <div class="fw-bold text-dark small">${log.title}</div>
                    <div class="text-muted x-small mb-1"><i class="fa-regular fa-clock me-1"></i>${dateStr} - Ghi bởi: <strong>${log.user}</strong></div>
                    ${imgHtml}
                    <div class="x-small text-secondary bg-light p-2 rounded-3 border">${log.content}</div>
                </div>
            `;
        });
    },

    // Render Transfers history list
    renderTransfers(transfers) {
        const container = document.getElementById("transfersContainer");
        container.innerHTML = "";

        if (transfers.length === 0) {
            container.innerHTML = `<p class="text-muted x-small text-center py-3">Chưa có lịch sử luân chuyển nào.</p>`;
            return;
        }

        transfers.forEach(t => {
            const dateStr = t.date ? this.formatDate(t.date) : (t.createdAt ? new Date(t.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa xong');

            container.innerHTML += `
                <div class="transfer-item">
                    <div class="fw-bold text-dark small">Chuyển đến: ${t.toDepartment} (${t.toLocation})</div>
                    <div class="text-muted x-small mb-1">
                        <i class="fa-regular fa-calendar-check me-1"></i>Ngày: <strong>${dateStr}</strong> 
                        ${t.toManager ? ` | Người tiếp nhận: <strong>${t.toManager}</strong>` : ''}
                    </div>
                    ${t.reason ? `<div class="x-small text-secondary bg-light p-2 rounded-3 border">Lý do: ${t.reason}</div>` : ''}
                </div>
            `;
        });
    },

    // Render Danh sách vật tư
    renderMaterialList(materials, keyword = "") {
        const container = document.getElementById("materialList");
        container.innerHTML = "";

        const filtered = materials.filter(m =>
            (m.name || "").toLowerCase().includes(keyword.toLowerCase()) ||
            (m.id || "").toLowerCase().includes(keyword.toLowerCase()) ||
            (m.location || "").toLowerCase().includes(keyword.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center text-muted py-5"><i class="fa-solid fa-box-open fa-2x mb-2 opacity-50"></i><br><span class="small">Không có vật tư nào</span></div>`;
            return;
        }

        filtered.forEach(m => {
            const isLow = Number(m.quantity) <= Number(m.minThreshold);
            const stockBadge = isLow ? `<span class="badge bg-danger">Sắp hết (${m.quantity} ${m.unit})</span>` : `<span class="badge bg-success">Tồn kho: ${m.quantity} ${m.unit}</span>`;

            container.innerHTML += `
                <div class="card p-3 mb-2 border-0 shadow-sm rounded-3">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div>
                            <h6 class="fw-bold m-0 text-dark">${m.name}</h6>
                            <span class="text-muted x-small">Mã: <strong class="text-primary">${m.id}</strong> | Kệ: ${m.location || 'Chưa xếp'}</span>
                        </div>
                        ${stockBadge}
                    </div>
                    <div class="d-flex justify-content-between align-items-center x-small text-secondary mt-1">
                        <span>Đơn giá: <strong>${this.formatVND(m.price)}</strong></span>
                        <span>Ngưỡng tối thiểu: ${m.minThreshold} ${m.unit}</span>
                    </div>
                    <div class="d-flex gap-2 mt-2 pt-2 border-top">
                        <button class="btn btn-sm btn-outline-success w-50 py-1" onclick="App.openStockModal('${m.id}', '${m.name}', ${m.quantity}, 'import')">
                            <i class="fa-solid fa-arrow-down-to-line me-1"></i> Nhập kho
                        </button>
                        <button class="btn btn-sm btn-outline-danger w-50 py-1" onclick="App.openStockModal('${m.id}', '${m.name}', ${m.quantity}, 'export')">
                            <i class="fa-solid fa-arrow-up-from-line me-1"></i> Xuất kho
                        </button>
                    </div>
                </div>
            `;
        });
    },

    // Render danh sách đợt kiểm kê
    renderAuditList(audits) {
        const container = document.getElementById("auditList");
        container.innerHTML = "";

        if (audits.length === 0) {
            container.innerHTML = `<div class="text-center text-muted py-5"><i class="fa-solid fa-clipboard-list fa-2x mb-2 opacity-50"></i><br><span class="small">Chưa có đợt kiểm kê nào được tạo.</span></div>`;
            return;
        }

        audits.forEach(a => {
            const isCompleted = a.status === "Hoàn thành";
            const dateStr = a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Mới tạo';

            const itemsMap = a.items || {};
            const totalChecked = Object.keys(itemsMap).length;

            container.innerHTML += `
                <div class="card p-3 mb-2 border-0 shadow-sm rounded-3">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div>
                            <h6 class="fw-bold m-0 text-dark">${a.title}</h6>
                            <div class="text-muted x-small">Phạm vi: <strong>${a.department}</strong> | Tạo: ${dateStr}</div>
                        </div>
                        <span class="badge ${isCompleted ? 'bg-secondary' : 'bg-success'}">${a.status}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center x-small text-secondary mt-2 pt-2 border-top">
                        <span>Đã kiểm kê: <strong class="text-dark">${totalChecked} thiết bị</strong></span>
                        <button class="btn btn-sm ${isCompleted ? 'btn-outline-secondary' : 'btn-success'} py-1 px-3 fw-bold" onclick="App.openActiveAudit('${a.id}')">
                            <i class="fa-solid ${isCompleted ? 'fa-eye' : 'fa-clipboard-check'} me-1"></i> ${isCompleted ? 'Xem kết quả' : 'Vào kiểm kê'}
                        </button>
                    </div>
                </div>
            `;
        });
    },

    // Render Màn hình Thực hiện Kiểm kê Số
    renderActiveAuditExecution(audit, machines) {
        document.getElementById("auditMainView").classList.add("d-none");
        document.getElementById("auditActiveView").classList.remove("d-none");

        document.getElementById("activeAuditTitle").innerText = audit.title;
        document.getElementById("activeAuditDept").innerText = `Phạm vi: ${audit.department} | Người tạo: ${audit.createdBy}`;
        
        const isCompleted = audit.status === "Hoàn thành";
        document.getElementById("activeAuditStatus").innerText = audit.status;
        document.getElementById("activeAuditStatus").className = `badge ${isCompleted ? 'bg-secondary text-white' : 'bg-white text-primary'} x-small mb-1`;

        // Filter target machines based on audit department
        const targetMachines = audit.department === "ALL" || audit.department === "Tất cả phòng ban" ?
            machines : machines.filter(m => m.department === audit.department);

        const totalTarget = targetMachines.length;
        const itemsMap = audit.items || {};

        let checkedCount = 0;
        targetMachines.forEach(m => {
            if (itemsMap[m.id] && itemsMap[m.id].status) checkedCount++;
        });

        const percent = totalTarget > 0 ? Math.round((checkedCount / totalTarget) * 100) : 0;
        document.getElementById("activeAuditProgressText").innerText = `${checkedCount}/${totalTarget} thiết bị`;
        document.getElementById("activeAuditPercent").innerText = `${percent}%`;
        document.getElementById("activeAuditProgressBar").style.width = `${percent}%`;

        // Render Checklist of target machines
        const container = document.getElementById("auditItemsList");
        container.innerHTML = "";

        if (targetMachines.length === 0) {
            container.innerHTML = `<div class="text-center text-muted py-4 small">Không có thiết bị nào thuộc phạm vi kiểm kê này.</div>`;
            return;
        }

        targetMachines.forEach(m => {
            const itemData = itemsMap[m.id] || {};
            const currentStatus = itemData.status || null;

            // Apply item filter if user selected
            if (this.currentAuditFilter === 'UNCHECKED' && currentStatus) return;
            if (this.currentAuditFilter !== 'ALL' && this.currentAuditFilter !== 'UNCHECKED' && currentStatus !== this.currentAuditFilter) return;

            let borderClass = '';
            if (currentStatus === 'Khớp') borderClass = 'checked-ok';
            else if (currentStatus === 'Lệch vị trí') borderClass = 'checked-relocated';
            else if (currentStatus === 'Thất thoát') borderClass = 'checked-missing';
            else if (currentStatus === 'Hư hỏng') borderClass = 'checked-damaged';

            container.innerHTML += `
                <div class="audit-item-card ${borderClass}">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div>
                            <h6 class="fw-bold m-0 text-dark">${m.name}</h6>
                            <span class="text-muted x-small">Mã: <strong class="text-primary">${m.id}</strong> | Vị trí: ${m.location || 'Chưa rõ'}</span>
                        </div>
                        <span class="badge bg-light text-dark border">${m.department}</span>
                    </div>

                    <!-- 1-Click Action status buttons -->
                    <div class="d-flex gap-1 mt-2">
                        <button class="btn btn-sm ${currentStatus === 'Khớp' ? 'btn-success' : 'btn-outline-success'} audit-btn flex-grow-1" 
                            ${isCompleted ? 'disabled' : ''} onclick="App.setAuditStatus('${audit.id}', '${m.id}', 'Khớp')">
                            🟢 Khớp
                        </button>
                        <button class="btn btn-sm ${currentStatus === 'Lệch vị trí' ? 'btn-warning' : 'btn-outline-warning'} audit-btn flex-grow-1" 
                            ${isCompleted ? 'disabled' : ''} onclick="App.setAuditStatus('${audit.id}', '${m.id}', 'Lệch vị trí')">
                            🟡 Lệch
                        </button>
                        <button class="btn btn-sm ${currentStatus === 'Thất thoát' ? 'btn-danger' : 'btn-outline-danger'} audit-btn flex-grow-1" 
                            ${isCompleted ? 'disabled' : ''} onclick="App.setAuditStatus('${audit.id}', '${m.id}', 'Thất thoát')">
                            🔴 Thiếu
                        </button>
                        <button class="btn btn-sm ${currentStatus === 'Hư hỏng' ? 'btn-orange' : 'btn-outline-orange'} audit-btn flex-grow-1" 
                            ${isCompleted ? 'disabled' : ''} onclick="App.setAuditStatus('${audit.id}', '${m.id}', 'Hư hỏng')">
                            🟠 Hỏng
                        </button>
                    </div>
                    ${itemData.checkedAt ? `<div class="x-small text-muted text-end mt-1"><i class="fa-regular fa-clock me-1"></i>Đã kiểm lúc ${new Date(itemData.checkedAt).toLocaleTimeString('vi-VN')}</div>` : ''}
                </div>
            `;
        });
    },

    closeActiveAuditView() {
        document.getElementById("auditActiveView").classList.add("d-none");
        document.getElementById("auditMainView").classList.remove("d-none");
    },

    // Render Trang Cảnh Báo
    renderAlertsPage(machines, materials) {
        const maintListContainer = document.getElementById("alertMaintList");
        const depListContainer = document.getElementById("alertDepList");
        const stockListContainer = document.getElementById("alertStockList");

        let maintCount = 0;
        let depCount = 0;
        let stockCount = 0;

        maintListContainer.innerHTML = "";
        depListContainer.innerHTML = "";
        stockListContainer.innerHTML = "";

        // 1. Maintenance Alerts
        machines.forEach(m => {
            const maint = this.checkMaintenanceDue(m.nextMaintenanceDate);
            if (maint.isDue) {
                maintCount++;
                maintListContainer.innerHTML += `
                    <div class="card p-3 mb-2 border-0 shadow-sm rounded-3 border-start border-4 ${maint.isOverdue ? 'border-danger' : 'border-warning'}" onclick="App.openDetail('${m.id}')" style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="fw-bold m-0 text-dark">${m.name}</h6>
                            <span class="badge ${maint.isOverdue ? 'bg-danger' : 'bg-warning text-dark'}">${maint.text}</span>
                        </div>
                        <div class="text-muted x-small mb-1">Mã: <strong>${m.id}</strong> | Phòng ban: ${m.department || '---'}</div>
                        <div class="x-small text-secondary">Ngày bảo dưỡng kế tiếp: <strong>${this.formatDate(m.nextMaintenanceDate)}</strong> | Chu kỳ: ${m.maintenanceCycle || 90} ngày</div>
                    </div>
                `;
            }
        });

        if (maintCount === 0) {
            maintListContainer.innerHTML = `<div class="text-center text-muted py-4 small"><i class="fa-solid fa-circle-check text-success fa-2x mb-2"></i><br>Không có thiết bị nào đến hạn bảo dưỡng.</div>`;
        }

        // 2. Depreciation End Alerts
        machines.forEach(m => {
            const dep = this.calculateDepreciation(m.startDate, m.price, m.depreciationYears);
            if (dep.isExpired) {
                depCount++;
                depListContainer.innerHTML += `
                    <div class="card p-3 mb-2 border-0 shadow-sm rounded-3 border-start border-4 border-danger" onclick="App.openDetail('${m.id}')" style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="fw-bold m-0 text-dark">${m.name}</h6>
                            <span class="badge bg-danger">Hết khấu hao</span>
                        </div>
                        <div class="text-muted x-small mb-1">Mã: <strong>${m.id}</strong> | Nguyên giá: ${this.formatVND(m.price)}</div>
                        <div class="x-small text-secondary">Ngày sử dụng: ${dep.startDateStr} | Hết hạn: <strong>${dep.endDateStr}</strong></div>
                    </div>
                `;
            }
        });

        if (depCount === 0) {
            depListContainer.innerHTML = `<div class="text-center text-muted py-4 small"><i class="fa-solid fa-circle-check text-success fa-2x mb-2"></i><br>Không có thiết bị nào hết khấu hao.</div>`;
        }

        // 3. Low Stock Materials Alerts
        materials.forEach(mat => {
            if (Number(mat.quantity) <= Number(mat.minThreshold)) {
                stockCount++;
                stockListContainer.innerHTML += `
                    <div class="card p-3 mb-2 border-0 shadow-sm rounded-3 border-start border-4 border-info">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="fw-bold m-0 text-dark">${mat.name}</h6>
                            <span class="badge bg-danger">Tồn: ${mat.quantity} ${mat.unit}</span>
                        </div>
                        <div class="text-muted x-small">Mã vật tư: <strong>${mat.id}</strong> | Kệ lưu kho: ${mat.location || '---'}</div>
                        <div class="x-small text-danger mt-1">⚠️ Cần nhập thêm (Ngưỡng tối thiểu: ${mat.minThreshold} ${mat.unit})</div>
                    </div>
                `;
            }
        });

        if (stockCount === 0) {
            stockListContainer.innerHTML = `<div class="text-center text-muted py-4 small"><i class="fa-solid fa-circle-check text-success fa-2x mb-2"></i><br>Tất cả vật tư đều đủ số lượng tồn kho.</div>`;
        }

        document.getElementById("badgeAlertMaintCount").innerText = maintCount;
        document.getElementById("badgeAlertDepCount").innerText = depCount;
        document.getElementById("badgeAlertStockCount").innerText = stockCount;
    }
};