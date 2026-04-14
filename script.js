// 默认奖品配置
const defaultPrizes = [
    { text: '一等奖 🎁', color: '#FF6B6B', emoji: '🎁' },
    { text: '二等奖 🎉', color: '#4ECDC4', emoji: '🎉' },
    { text: '三等奖 🎊', color: '#45B7D1', emoji: '🎊' },
    { text: '幸运奖 🍀', color: '#96CEB4', emoji: '🍀' },
    { text: '再接再厉 💪', color: '#FFEAA7', emoji: '💪' },
    { text: '谢谢参与 🙏', color: '#DDA0DD', emoji: '🙏' },
    { text: '再来一次 🔄', color: '#98D8C8', emoji: '🔄' },
    { text: '神秘大奖 🎭', color: '#F7DC6F', emoji: '🎭' }
];

// 状态管理
let prizes = JSON.parse(localStorage.getItem('wheelPrizes')) || [...defaultPrizes];
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
        sector.style.background = `conic-gradient(from 0deg, ${prize.color} 0deg, ${adjustColor(prize.color, -20)} ${sectorAngle}deg)`;

        // 创建扇区背景
        const sectorBg = document.createElement('div');
        sectorBg.style.position = 'absolute';
        sectorBg.style.width = '100%';
        sectorBg.style.height = '100%';
        sectorBg.style.background = prize.color;
        sectorBg.style.transform = `rotate(${sectorAngle}deg)`;
        sectorBg.style.transformOrigin = 'right bottom';
        sectorBg.style.clipPath = `polygon(100% 0, 100% 100%, ${100 * Math.tan(sectorAngle * Math.PI / 360)}% 100%)`;

        // 添加文字
        const text = document.createElement('div');
        text.className = 'sector-text';
        text.textContent = prize.text;
        text.style.transform = `rotate(${sectorAngle / 2}deg)`;

        sector.appendChild(text);
        wheelInner.appendChild(sector);
    });
}

// 调整颜色亮度
function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x00FF) + amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// 渲染奖品列表
function renderPrizeList() {
    prizeList.innerHTML = '';
    prizes.forEach((prize, index) => {
        const item = document.createElement('div');
        item.className = 'prize-item';
        item.innerHTML = `
            <div class="prize-color" style="background: ${prize.color}"></div>
            <input type="text" class="prize-input" value="${prize.text}" data-index="${index}">
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
            emoji: '🎁'
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

// 抽奖逻辑
function spin() {
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;

    // 随机选择奖品
    const winningIndex = Math.floor(Math.random() * prizes.length);
    const sectorAngle = 360 / prizes.length;

    // 计算目标角度（指针指向顶部，需要调整）
    const targetRotation = 360 - (winningIndex * sectorAngle + sectorAngle / 2);

    // 添加多圈旋转（至少5圈，最多10圈）
    const spins = 5 + Math.floor(Math.random() * 5);
    const finalRotation = currentRotation + spins * 360 + targetRotation - (currentRotation % 360);

    // 应用旋转
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

    // 3秒后清除彩带
    setTimeout(() => {
        confettiContainer.innerHTML = '';
    }, 5000);
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);