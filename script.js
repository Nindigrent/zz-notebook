// 应用状态
const appState = {
    currentUser: 'girl', // 当前用户
    currentView: 'today', // 当前视图
    records: [], // 所有记录
    currentImage: null // 当前上传的图片
};

// DOM元素
const userOptions = document.querySelectorAll('.user-option');
const toggleButtons = document.querySelectorAll('.toggle-btn');
const viewButtons = document.querySelectorAll('.view-btn');
const saveButton = document.getElementById('save-record');
const imageInput = document.getElementById('record-image');
const imagePreview = document.getElementById('image-preview');
const recordsList = document.getElementById('records-list');
const generateReportButton = document.getElementById('generate-report');
const reportModal = document.getElementById('report-modal');
const closeReportButton = document.getElementById('close-report');
const reportContent = document.getElementById('report-content');
const clearDataButton = document.getElementById('clear-data');
const notification = document.getElementById('notification');
const girlCountElement = document.getElementById('girl-count');
const boyCountElement = document.getElementById('boy-count');

// 初始化应用
function initApp() {
    updateDateDisplay();
    loadFromLocalStorage();
    setupEventListeners();
    renderRecords();
    updateStats();
}

// 更新日期显示
function updateDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('zh-CN', options);
}

// 从本地存储加载数据
function loadFromLocalStorage() {
    const savedRecords = localStorage.getItem('coupleRecords');
    
    if (savedRecords) {
        appState.records = JSON.parse(savedRecords);
    }
}

// 保存到本地存储
function saveToLocalStorage() {
    localStorage.setItem('coupleRecords', JSON.stringify(appState.records));
}

// 设置事件监听器
function setupEventListeners() {
    // 用户选择
    userOptions.forEach(option => {
        option.addEventListener('click', function() {
            userOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            appState.currentUser = this.getAttribute('data-user');
        });
    });
    
    // 视图切换
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderRecords();
        });
    });
    
    // 时间视图切换
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            appState.currentView = this.getAttribute('data-view');
            renderRecords();
        });
    });
    
    // 保存记录
    saveButton.addEventListener('click', saveRecord);
    
    // 图片上传
    imageInput.addEventListener('change', handleImageUpload);
    
    // 生成报告
    generateReportButton.addEventListener('click', generateReport);
    
    //分享报告
    document.getElementById('share-report').addEventListener('click', shareReport);

    // 关闭报告
    closeReportButton.addEventListener('click', () => {
        reportModal.style.display = 'none';
    });
    
    // 清除数据
    clearDataButton.addEventListener('click', clearData);
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === reportModal) {
            reportModal.style.display = 'none';
        }
    });
}

// 处理图片上传
function handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            appState.currentImage = e.target.result;
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="预览">`;
            imagePreview.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    }
}

// 保存记录
function saveRecord() {
    const timeSelect = document.getElementById('record-time');
    const textArea = document.getElementById('record-text');
    
    const time = timeSelect.value;
    const text = textArea.value.trim();
    const image = appState.currentImage;
    
    if (!text && !image) {
        showNotification('请输入内容或上传图片！', 'error');
        return;
    }
    
    const now = new Date();
    const record = {
        id: Date.now(),
        user: appState.currentUser,
        time: time,
        text: text,
        image: image,
        date: now.toISOString(),
        timestamp: now.getTime()
   };
    
    appState.records.unshift(record);
    saveToLocalStorage();
    renderRecords();
    updateStats();
    
    // 重置表单
    textArea.value = '';
    imageInput.value = '';
    imagePreview.style.display = 'none';
    imagePreview.innerHTML = '';
    appState.currentImage = null;
    
    showNotification('记录已保存！');
}

// 渲染记录
function renderRecords() {
    const currentView = document.querySelector('.toggle-btn.active').id;
    const today = new Date().toDateString();
    
    let filteredRecords = appState.records;
    
    // 根据视图过滤记录
    if (currentView === 'toggle-girl') {
        filteredRecords = filteredRecords.filter(record => record.user === 'girl');
    } else if (currentView === 'toggle-boy') {
        filteredRecords = filteredRecords.filter(record => record.user === 'boy');
    }
    
    // 根据时间过滤记录
    if (appState.currentView === 'today') {
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.date).toDateString();
            return recordDate === today;
        });
    }
    
    // 如果没有记录，显示空状态
    if (filteredRecords.length === 0) {
        recordsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <p>还没有任何记录</p>
                <p>开始记录你们的日常吧！</p>
            </div>
        `;
        return;
    }
    
    // 生成记录HTML
    let recordsHTML = '';
    
    filteredRecords.forEach(record => {
        const date = new Date(record.date);
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        const timeLabels = {
            morning: '早晨',
            noon: '中午',
            afternoon: '下午',
            evening: '晚上',
            night: '深夜'
        };
        
        const userLabels = {
            girl: { name: '我', icon: 'fas fa-female' },
            boy: { name: '他', icon: 'fas fa-male' }
        };
        
        recordsHTML += `
            <div class="record-item ${record.user}">
                <div class="record-header">
                    <div class="record-user ${record.user}">
                        <i class="${userLabels[record.user].icon}"></i>
                        <span>${userLabels[record.user].name}</span>
                    </div>
                    <div class="record-time">${dateStr} ${timeStr} · ${timeLabels[record.time]}</div>
                </div>
                <div class="record-content">${record.text}</div>
                ${record.image ? `
                    <div class="record-image">
                        <img src="${record.image}" alt="记录图片">
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    recordsList.innerHTML = recordsHTML;
}

// 更新统计信息
function updateStats() {
    const girlCount = appState.records.filter(record => record.user === 'girl').length;
    const boyCount = appState.records.filter(record => record.user === 'boy').length;
    
    girlCountElement.textContent = girlCount;
    boyCountElement.textContent = boyCount;
}

// 生成报告
function generateReport() {
    const today = new Date().toDateString();
    const todayRecords = appState.records.filter(record => {
        const recordDate = new Date(record.date).toDateString();
        return recordDate === today;
    });
    
    const girlRecords = todayRecords.filter(record => record.user === 'girl');
    const boyRecords = todayRecords.filter(record => record.user === 'boy');
    
    const timeLabels = {
        morning: '早晨',
        noon: '中午',
        afternoon: '下午',
        evening: '晚上',
        night: '深夜'
    };
    
    let reportHTML = `
        <div class="report-summary">
            <div class="report-date">${document.getElementById('current-date').textContent}</div>
            <div class="report-stats">
                <div class="report-stat girl">
                    <div class="stat-number girl">${girlRecords.length}</div>
                    <div class="stat-label">我的记录</div>
                </div>
                <div class="report-stat boy">
                    <div class="stat-number boy">${boyRecords.length}</div>
                    <div class="stat-label">他的记录</div>
                </div>
            </div>
        </div>
    `;
    
    if (todayRecords.length > 0) {
        reportHTML += `<div class="report-records">`;
        
        todayRecords.forEach(record => {
            const date = new Date(record.date);
            const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            
            const userLabels = {
                girl: { name: '我', icon: 'fas fa-female' },
                boy: { name: '他', icon: 'fas fa-male' }
            };
            
            reportHTML += `
                <div class="report-record ${record.user}">
                    <div class="record-header">
                        <div class="record-user ${record.user}">
                            <i class="${userLabels[record.user].icon}"></i>
                            <span>${userLabels[record.user].name}</span>
                        </div>
                        <div class="record-time">${timeStr} · ${timeLabels[record.time]}</div>
                    </div>
                    <div class="record-content">${record.text}</div>
                    ${record.image ? `
                        <div class="record-image">
                            <img src="${record.image}" alt="记录图片">
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        reportHTML += `</div>`;
    } else {
        reportHTML += `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <p>今天还没有任何记录</p>
                <p>快去记录你们的日常吧！</p>
            </div>
        `;
    }
    
    reportContent.innerHTML = reportHTML;
    reportModal.style.display = 'flex';
}

// 清除数据
function clearData() {
    if (confirm('确定要清除所有记录吗？此操作不可撤销！')) {
        appState.records = [];
        saveToLocalStorage();
        renderRecords();
        updateStats();
        showNotification('所有记录已清除！');
    }
}

// 显示通知
function showNotification(message, type = 'success') {
    const notificationContent = notification.querySelector('.notification-content');
    notificationContent.textContent = message;
    
    // 根据类型设置颜色
    if (type === 'error') {
        notification.style.backgroundColor = '#ff3b30';
    } else {
        notification.style.backgroundColor = '#4cd964';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);


function shareReport() {
    // 简单的复制文本功能
    const today = new Date().toLocaleDateString('zh-CN');
    const girlCount = appState.records.filter(record => 
        record.user === 'girl' && 
        new Date(record.date).toDateString() === new Date().toDateString()
    ).length;
    const boyCount = appState.records.filter(record => 
        record.user === 'boy' && 
        new Date(record.date).toDateString() === new Date().toDateString()
    ).length;
    
    const shareText = `📝 情侣日常报告 ${today}\n我的记录: ${girlCount}条\n他的记录: ${boyCount}条\n\n记录我们的每一天 💕`;
    
    // 复制到剪贴板
    navigator.clipboard.writeText(shareText).then(() => {
        showNotification('报告已复制到剪贴板，可以分享给朋友了！');
    }).catch(() => {
        // 如果复制失败，显示文本让用户手动复制
        prompt('请手动复制以下文本进行分享：', shareText);
    });
}