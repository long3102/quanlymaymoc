const MachineService = {
    // Upload ảnh lên Firebase Storage
    async uploadImage(file, path) {
        if (!file) return null;
        const storageRef = storage.ref(`${path}/${Date.now()}_${file.name}`);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    },

    // Lắng nghe danh sách máy realtime
    subscribeMachines(callback) {
        return db.collection("machines").orderBy("createdAt", "desc").onSnapshot(snapshot => {
            const machines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(machines);
        }, err => {
            console.error("Lỗi lấy danh sách thiết bị:", err);
            callback([]);
        });
    },

    // Thêm máy mới
    async addMachine(code, machineData) {
        await db.collection("machines").doc(code).set({
            ...machineData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    // Lấy chi tiết 1 máy
    async getMachine(id) {
        const doc = await db.collection("machines").doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    // Cập nhật máy
    async updateMachine(id, data) {
        await db.collection("machines").doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    // Xóa máy
    async deleteMachine(id) {
        await db.collection("machines").doc(id).delete();
    },

    // Lắng nghe sub-collection Nhật ký vận hành
    subscribeLogs(machineId, callback) {
        return db.collection("machines").doc(machineId).collection("logs")
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(logs);
            }, err => {
                console.error("Lỗi lấy nhật ký:", err);
                callback([]);
            });
    },

    // Thêm nhật ký kèm ảnh
    async addLog(machineId, logData, imageFile) {
        let imageUrl = "";
        if (imageFile) {
            imageUrl = await this.uploadImage(imageFile, `logs/${machineId}`);
        }

        await db.collection("machines").doc(machineId).collection("logs").add({
            ...logData,
            imageUrl: imageUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    // Lắng nghe sub-collection Luân chuyển tài sản
    subscribeTransfers(machineId, callback) {
        return db.collection("machines").doc(machineId).collection("transfers")
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                const transfers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(transfers);
            }, err => {
                console.error("Lỗi lấy lịch sử luân chuyển:", err);
                callback([]);
            });
    },

    // Thêm lượt Luân chuyển tài sản & Cập nhật vị trí/phòng ban mới của máy
    async addTransfer(machineId, transferData) {
        await db.collection("machines").doc(machineId).collection("transfers").add({
            ...transferData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Cập nhật thông tin hiện tại trên máy
        await db.collection("machines").doc(machineId).update({
            department: transferData.toDepartment,
            location: transferData.toLocation,
            manager: transferData.toManager || transferData.manager,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
};

const MaterialService = {
    // Lắng nghe danh sách vật tư/phụ tùng
    subscribeMaterials(callback) {
        return db.collection("materials").orderBy("createdAt", "desc").onSnapshot(snapshot => {
            const materials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(materials);
        }, err => {
            console.error("Lỗi lấy danh sách vật tư:", err);
            callback([]);
        });
    },

    // Thêm vật tư mới
    async addMaterial(code, data) {
        await db.collection("materials").doc(code).set({
            ...data,
            quantity: Number(data.quantity) || 0,
            minThreshold: Number(data.minThreshold) || 5,
            price: Number(data.price) || 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    // Thay đổi số lượng Nhập/Xuất kho
    async updateStock(id, changeQty, type, user, note) {
        const docRef = db.collection("materials").doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("Vật tư không tồn tại!");

        const currentQty = Number(doc.data().quantity) || 0;
        const qtyNum = Number(changeQty);
        if (isNaN(qtyNum) || qtyNum <= 0) throw new Error("Số lượng không hợp lệ!");

        const newQty = type === 'import' ? currentQty + qtyNum : currentQty - qtyNum;
        if (newQty < 0) throw new Error("Số lượng xuất kho vượt quá số lượng tồn hiện tại!");

        await docRef.update({
            quantity: newQty,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Ghi nhật ký lịch sử nhập xuất
        await docRef.collection("history").add({
            type,
            changeQty: qtyNum,
            previousQty: currentQty,
            newQty,
            user,
            note: note || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
};

const AuditService = {
    // Lắng nghe danh sách các đợt kiểm kê
    subscribeAudits(callback) {
        return db.collection("audits").orderBy("createdAt", "desc").onSnapshot(snapshot => {
            const audits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(audits);
        }, err => {
            console.error("Lỗi lấy danh sách đợt kiểm kê:", err);
            callback([]);
        });
    },

    // Tạo đợt kiểm kê mới
    async createAudit(title, department, createdBy) {
        const auditRef = db.collection("audits").doc();
        await auditRef.set({
            title,
            department: department || "Tất cả phòng ban",
            createdBy: createdBy || "Quản lý",
            status: "Đang kiểm kê",
            items: {},
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return auditRef.id;
    },

    // Cập nhật trạng thái từng máy trong đợt kiểm kê
    async updateAuditItem(auditId, machineId, status, note = "") {
        const auditRef = db.collection("audits").doc(auditId);
        const updateData = {};
        updateData[`items.${machineId}`] = {
            status,
            note,
            checkedAt: new Date().toISOString()
        };
        await auditRef.update(updateData);
    },

    // Hoàn thành đợt kiểm kê
    async completeAudit(auditId) {
        await db.collection("audits").doc(auditId).update({
            status: "Hoàn thành",
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
};