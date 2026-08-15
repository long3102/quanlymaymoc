const UI = {
    // Chuyển Tab / Trở về
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        document.getElementById(pageId).classList.add('active');

        const headerTitle = document.getElementById('headerTitle');
        const btnBack = document.getElementById('btnBack');

        if (pageId === 'page-home') {
            document.querySelectorAll('.nav-item')[0].classList.add('active');
            headerTitle.innerHTML = '<i class="fa-solid fa-bolt me-2"></i>Thiết Bị';
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

    // Render Danh Sách Máy Tông Đen - Cam
    renderMachineList(machines) {
        const container = document.getElementById('machineList');
        if (!machines || machines.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary py-5">Chưa có thiết bị nào.</div>';
            return;
        }

        container.innerHTML = machines.map(m => {
            let statusBadge = 'bg-success';
            if (m.status === 'Cần bảo trì') statusBadge = 'bg-warning text-dark';
            if (m.status === 'Hư hỏng') statusBadge = 'bg-danger';

            return `
                <div class="ios-card d-flex align-items-center justify-content-between" onclick="App.openDetail('${m.id}')" style="cursor: pointer;">
                    <div class="d-flex align-items-center gap-3">
                        <div style="width: 50px; height: 50px; background: #2c2c2e; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${m.imageUrl ? `<img src="${m.imageUrl}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-gears text-secondary fs-4"></i>`}
                        </div>
                        <div>
                            <h6 class="fw-bold m-0 text-light">${m.name}</h6>
                            <small class="text-secondary">${m.code} • ${m.location || 'Chưa định vị'}</small>
                        </div>
                    </div>
                    <span class="badge ${statusBadge}">${m.status}</span>
                </div>
            `;
        }).join('');
    },

    // Render Danh Sách Nhật Ký
    renderLogs(logs) {
        const container = document.getElementById('logsContainer');
        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="text-secondary small text-center py-3">Chưa có nhật ký ghi nhận.</div>';
            return;
        }

        container.innerHTML = logs.map(l => `
            <div class="ios-card mb-2" style="background: #2c2c2e;">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="text-light small">${l.title}</strong>
                    <small class="text-secondary" style="font-size: 0.75rem;">${new Date(l.createdAt?.toDate()).toLocaleDateString('vi-VN')}</small>
                </div>
                <p class="text-secondary small m-0">${l.content}</p>
                <div class="text-end text-secondary mt-1" style="font-size: 0.7rem;">Ghi bởi: ${l.user}</div>
            </div>
        `).join('');
    }
};