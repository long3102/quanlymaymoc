// Cấu hình Firebase SDK của bạn
const firebaseConfig = {
    apiKey: "AIzaSyCb4cZcEqH_zy_qncEWc1ZjRM22NEwq4Ds",
    authDomain: "quan-ly-may-d9814.firebaseapp.com",
    projectId: "quan-ly-may-d9814",
    storageBucket: "quan-ly-may-d9814.firebasestorage.app",
    messagingSenderId: "783643255501",
    appId: "1:783643255501:web:2121ecd27193946b83bf84",
    measurementId: "G-YSM4Q8S0X0"
};

// Khởi tạo Firebase & các dịch vụ Database, Storage
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();