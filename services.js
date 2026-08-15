const MachineService = {
    // Tải ảnh lên Firebase Storage (AJAX)
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
        });
    },

    // Thêm máy mới
    async addMachine(code, machineData) {
        await db.collection("machines").doc(code).set({
            ...machineData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    // Lấy chi tiết 1 máy
    async getMachine(id) {
        const doc = await db.collection("machines").doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    // Cập nhật máy
    async updateMachine(id, data) {
        await db.collection("machines").doc(id).update(data);
    },

    // Lắng nghe danh sách Nhật ký của 1 máy
    subscribeLogs(machineId, callback) {
        return db.collection("machines").doc(machineId).collection("logs")
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(logs);
            });
    },

    // Thêm Nhật ký kèm Upload Ảnh (AJAX)
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
    }
};