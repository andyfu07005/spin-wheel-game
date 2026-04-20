// 默认奖品配置
const defaultPrizes = [
    { text: '一等奖 🎁', color: '#FF6B6B', emoji: '🎁', weight: 5 },
    { text: '二等奖 🎉', color: '#4ECDC4', emoji: '🎉', weight: 8 },
    { text: '三等奖 🎊', color: '#45B7D1', emoji: '🎊', weight: 12 },
    { text: '幸运奖 🍀', color: '#96CEB4', emoji: '🍀', weight: 15 },
    { text: '再接再厉 💪', color: '#FFEAA7', emoji: '💪', weight: 20 },
    { text: '谢谢参与 🙏', color: '#DDA0DD', emoji: '🙏', weight: 25 },
    { text: '再来一次 🔄', color: '#98D8C8', emoji: '🔄', weight: 30 },
    { text: '神秘大奖 🎭', color: '#F7DC6F', emoji: '🎭', weight: 10 }
];

// 扇形路径生成函数（简单的三角形扇形）
function getSectorPath(angle, gap = 2) {
    // 创建一个简单的三角形扇形
    // 扇形从中心点(0,0)到外边缘的两个点
    // 使用50%作为半径，确保扇形在元素内
    // 考虑间隔gap
    
    const r = 50; // 半径百分比
    const startAngle = gap / 2;
    const endAngle = angle - gap / 2;
    
    const startRad = startAngle * Math.PI / 180;
    const endRad = endAngle * Math.PI / 180;
    
    const x1 = 50 + r * Math.cos(startRad);
    const y1 = 50 - r * Math.sin(startRad);
    const x2 = 50 + r * Math.cos(endRad);
    const y2 = 50 - r * Math.sin(endRad);
    
    // 多边形：中心点(50%, 50%) -> 起点 -> 终点 -> 回到中心
    return `polygon(50% 50%, ${x1}% ${y1}%, ${x2}% ${y2}%)`;
}

// 状态管理
let prizes = JSON.parse(localStorage.getItem('wheelPrizes')) || [...defaultPrizes];
// 确保所有奖品都有weight字段（向后兼容）
prizes = prizes.map(prize => ({
    ...prize,
    weight: prize.weight || 10  // 默认权重为10
}));
let history = JSON.parse(localStorage.getItem('wheelHistory')) || [];
let isSpinning = false;
let currentRotation = 0;

// DOM 元素
const wheelInner = document.getElementById('wheelInner');
const spinBtn = document.getElementById('spinBtn');
const resultModal = document.getElementById('resultModal');
const closeBtn = document.getElementById('closeBtn');
const resultPrize = document.getElementById('resultPrize');
const resultEmoji = document.getElementById('resultEmoji');
const resultTitle = document.getElementById('resultTitle');
const prizeList = document.getElementById('prizeList');
const addPrizeBtn = document.getElementById('addPrizeBtn');
const resetBtn = document.getElementById('resetBtn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const confettiContainer = document.getElementById('confettiContainer');

// 初始化
function init() {
    renderWheel();
    renderPrizeList();
    renderHistory();
    bindEvents();
}

// 渲染转盘
function renderWheel() {
    wheelInner.innerHTML = '';
    const sectorAngle = 360 / prizes.length;

    prizes.forEach((prize, index) => {
        const sector = document.createElement('div');
        sector.className = 'sector';
        sector.style.transform = `rotate(${index * sectorAngle}deg)`;
        sector.style.background = prize.color;
        const path = getSectorPath(sectorAngle, 2); // 2度间隔，使扇形更明显
        sector.style.clipPath = path;

        // 添加文字
        const text = document.createElement('div');
        text.className = 'sector-text';
        text.textContent = prize.text;
        text.style.transform = `rotate(${sectorAngle / 2}deg)`;

        sector.appendChild(text);
        wheelInner.appendChild(sector);
    });
}



// 渲染奖品列表
function renderPrizeList() {
    prizeList.innerHTML = '';
    // 计算总权重
    const totalWeight = prizes.reduce((sum, prize) => sum + (prize.weight || 10), 0);
    
    prizes.forEach((prize, index) => {
        const probability = totalWeight > 0 ? ((prize.weight || 10) / totalWeight * 100).toFixed(1) : '0.0';
        const item = document.createElement('div');
        item.className = 'prize-item';
        item.innerHTML = `
            <div class="prize-color" style="background: ${prize.color}"></div>
            <input type="text" class="prize-input" value="${prize.text}" data-index="${index}">
            <div class="weight-controls">
                <input type="number" class="weight-input" min="1" max="100" value="${prize.weight || 10}" data-index="${index}" title="权重 (越高越容易中奖)">
                <span class="probability-display">${probability}%</span>
            </div>
            ${prizes.length > 2 ? `<button class="delete-btn" data-index="${index}">删除</button>` : ''}
        `;
        prizeList.appendChild(item);
    });

    // 绑定输入事件
    document.querySelectorAll('.prize-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            prizes[index].text = e.target.value;
            savePrizes();
            renderWheel();
        });
    });

    // 绑定权重输入事件
    document.querySelectorAll('.weight-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            prizes[index].weight = parseInt(e.target.value) || 10;
            savePrizes();
            renderPrizeList(); // 重新渲染以更新概率
        });
    });

    // 绑定删除事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            prizes.splice(index, 1);
            savePrizes();
            renderWheel();
            renderPrizeList();
        });
    });
}

// 渲染历史记录
function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<li class="empty">暂无记录</li>';
        return;
    }

    history.slice().reverse().forEach(record => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="history-prize">${record.prize}</span>
            <span class="history-time">${record.time}</span>
        `;
        historyList.appendChild(li);
    });
}

// 保存奖品到本地存储
function savePrizes() {
    localStorage.setItem('wheelPrizes', JSON.stringify(prizes));
}

// 保存历史记录
function saveHistory() {
    localStorage.setItem('wheelHistory', JSON.stringify(history));
}

// 绑定事件
function bindEvents() {
    // 开始抽奖
    spinBtn.addEventListener('click', spin);

    // 关闭结果弹窗
    closeBtn.addEventListener('click', () => {
        resultModal.classList.remove('show');
    });

    // 点击弹窗外部关闭
    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) {
            resultModal.classList.remove('show');
        }
    });

    // 添加奖品
    addPrizeBtn.addEventListener('click', () => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const randomColor = colors[prizes.length % colors.length];
        prizes.push({
            text: `奖品 ${prizes.length + 1}`,
            color: randomColor,
            emoji: '🎁',
            weight: 10
        });
        savePrizes();
        renderWheel();
        renderPrizeList();
    });

    // 重置默认
    resetBtn.addEventListener('click', () => {
        if (confirm('确定要重置为默认奖品吗？')) {
            prizes = [...defaultPrizes];
            savePrizes();
            renderWheel();
            renderPrizeList();
        }
    });

    // 清空历史
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有抽奖记录吗？')) {
            history = [];
            saveHistory();
            renderHistory();
        }
    });
}

// 加权随机选择函数
function weightedRandomSelection(items) {
    // 计算总权重
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 10), 0);
    // 生成随机数
    let random = Math.random() * totalWeight;
    // 找到对应的奖品
    for (let i = 0; i < items.length; i++) {
        random -= items[i].weight || 10;
        if (random <= 0) {
            return i;
        }
    }
    // 如果由于浮点数精度问题没有返回，返回最后一个
    return items.length - 1;
}

// 抽奖逻辑
function spin() {
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;

    // 根据权重随机选择奖品
    const winningIndex = weightedRandomSelection(prizes);
    const sectorAngle = 360 / prizes.length;

    // 计算目标角度（指针指向顶部，需要调整）
    const targetRotation = 360 - (winningIndex * sectorAngle + sectorAngle / 2);

    // 添加多圈旋转（至少5圈，最多10圈）
    const spins = 5 + Math.floor(Math.random() * 5);
    const finalRotation = currentRotation + spins * 360 + targetRotation - (currentRotation % 360);

    // 应用旋转（确保有过渡动画）
    wheelInner.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
    wheelInner.style.transform = `rotate(${finalRotation}deg)`;
    currentRotation = finalRotation;

    // 播放音效（如果浏览器支持）
    playSpinSound();

    // 动画结束后显示结果
    setTimeout(() => {
        showResult(prizes[winningIndex]);
        addToHistory(prizes[winningIndex]);
        createConfetti();
        isSpinning = false;
        spinBtn.disabled = false;
    }, 4000);
}

// 显示结果
function showResult(prize) {
    resultPrize.textContent = prize.text;
    resultEmoji.textContent = prize.emoji || '🎉';

    // 根据奖品设置不同的标题
    if (prize.text.includes('谢谢') || prize.text.includes('再接再厉')) {
        resultTitle.textContent = '别灰心！';
        resultTitle.style.color = '#747d8c';
    } else {
        resultTitle.textContent = '恭喜中奖！';
        resultTitle.style.color = '#ff4757';
    }

    resultModal.classList.add('show');
}

// 添加到历史记录
function addToHistory(prize) {
    const now = new Date();
    const timeString = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    history.push({
        prize: prize.text,
        time: timeString
    });

    // 限制历史记录数量
    if (history.length > 50) {
        history.shift();
    }

    saveHistory();
    renderHistory();
}

// 播放旋转音效
function playSpinSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        // 静默失败
    }
}

// 创建彩带效果
function createConfetti() {
    confettiContainer.innerHTML = '';
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFD700'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';

        // 随机形状
        const shape = Math.random();
        if (shape < 0.33) {
            confetti.style.borderRadius = '50%';
        } else if (shape < 0.66) {
            confetti.style.width = '15px';
            confetti.style.height = '5px';
        }

        confettiContainer.appendChild(confetti);
    }

}

// 路灯照明效果
function initStreetlight() {
    const streetlightSwitch = document.getElementById('streetlightSwitch');
    const streetlightInput = document.getElementById('streetlightInput');
    const streetlightPanel = document.querySelector('.streetlight-panel');
    
    if (!streetlightSwitch || !streetlightInput || !streetlightPanel) {
        console.warn('路灯元素未找到，跳过初始化');
        return;
    }
    
    // 更新路灯状态
    function updateStreetlight() {
        if (streetlightSwitch.checked) {
            streetlightPanel.classList.add('streetlight-on');
            streetlightInput.focus();
            console.log('路灯已打开');
        } else {
            streetlightPanel.classList.remove('streetlight-on');
            console.log('路灯已关闭');
        }
    }
    
    // 初始状态
    updateStreetlight();
    
    // 监听开关变化
    streetlightSwitch.addEventListener('change', updateStreetlight);
    
    // 输入框获得焦点时自动打开路灯
    streetlightInput.addEventListener('focus', () => {
        if (!streetlightSwitch.checked) {
            streetlightSwitch.checked = true;
            updateStreetlight();
        }
    });
    
    // 输入事件
    streetlightInput.addEventListener('input', (e) => {
        console.log('输入内容:', e.target.value);
        // 可以根据输入内容添加动态效果
    });
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    init();
    initStreetlight();
});