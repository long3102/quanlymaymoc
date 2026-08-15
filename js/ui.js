const UI = {
    // Chuyển Tab/Trang
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        document.getElementById(pageId).classList.add('active');

        const headerTitle = document.getElementById('headerTitle');
        const btnBack = document.getElementById('btnBack');

        if (pageId === 'page-home') {
            document.querySelectorAll('.nav-item')[0].classList.add('active');
            headerTitle.innerHTML = '<i class="fa-solid fa-industry me-2"></i>Quản Lý Thiết Bị';
            btnBack.classList.add('d-none');
        } else if (pageId === 'page-add') {
            document.querySelectorAll('.nav-item')[1].classList.add('active');
            headerTitle.innerHTML = 'Thêm Thiết Bị Mới';
            btnBack.classList.add('d-none');
        } else if (pageId === 'page-detail') {
            headerTitle.innerHTML = 'Chi Tiết Thiết Bị';
            btnBack.classList.remove('d-none');
        }
    },

    // Render danh sách máy
    renderMachineList(machines, keyword = "") {
        const container = document.getElementById("machineList");
        container.innerHTML = "";

        const filtered = machines.filter(m =>
            m.name.toLowerCase().includes(keyword.toLowerCase()) ||
            m.id.toLowerCase().includes(keyword.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center text-muted py-5"><i class="fa-solid fa-box-open fa-2x mb-2"></i><br>Không tìm thấy máy nào</div>`;
            return;
        }

        filtered.forEach(m => {
            const statusClass = m.status === 'Hoạt động' ? 'bg-success' : (m.status === 'Hư hỏng' ? 'bg-danger' : 'bg-warning text-dark');
            const imgHtml = m.imageUrl ? `<img src="${m.imageUrl}" class="rounded-3 me-3" style="width: 50px; height: 50px; object-fit: cover;">` : `<div class="bg-light rounded-3 me-3 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;"><i class="fa-solid fa-gears text-muted"></i></div>`;

            container.innerHTML += `
                <div class="card card-machine p-3 mb-2 shadow-sm" onclick="App.openDetail('${m.id}')">
                    <div class="d-flex align-items-center">
                        ${imgHtml}
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <h6 class="fw-bold m-0 text-dark">${m.name}</h6>
                                <span class="badge ${statusClass}">${m.status}</span>
                            </div>
                            <div class="text-muted small">Mã: <strong>${m.id}</strong> | Vị trí: ${m.location || 'Chưa rõ'}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    },

    // Render danh sách nhật ký
    renderLogs(logs) {
        const container = document.getElementById("logsContainer");
        container.innerHTML = "";

        if (logs.length === 0) {
            container.innerHTML = `<p class="text-muted small text-center py-3">Chưa có nhật ký nào được ghi nhận.</p>`;
            return;
        }

        logs.forEach(log => {
            const dateStr = log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'Vừa xong';
            const imgHtml = log.imageUrl ? `<img src="${log.imageUrl}" class="img-preview mb-2 shadow-sm" onclick="window.open('${log.imageUrl}')">` : '';

            container.innerHTML += `
                <div class="timeline-item">
                    <div class="fw-bold text-dark">${log.title}</div>
                    <div class="text-muted small mb-2"><i class="fa-regular fa-clock me-1"></i>${dateStr} - Người ghi: <strong>${log.user}</strong></div>
                    ${imgHtml}
                    <div class="small text-secondary bg-light p-2 rounded-3">${log.content}</div>
                </div>
            `;
        });
    }
};