const CONFIG = {
    INITIAL_BALANCE: 0,
    STORAGE_KEY: 'onyx_bank_data',
    MAX_TRANSACTIONS: 50,
};

let state = {
    balance: CONFIG.INITIAL_BALANCE,
    transactions: [],
};

const elements = {
    cardBalance: document.getElementById('cardBalance'),
    transactionsList: document.getElementById('transactionsList'),
    depositBtn: document.getElementById('depositBtn'),
    transferBtn: document.getElementById('transferBtn'),
    resetBtn: document.getElementById('resetBtn'),
    seeAllBtn: document.getElementById('seeAllBtn'),
    cardNumber: document.getElementById('cardNumber'),
    cardExpiry: document.getElementById('cardExpiry'),
    depositModal: document.getElementById('depositModal'),
    depositModalClose: document.getElementById('depositModalClose'),
    depositAmount: document.getElementById('depositAmount'),
    depositConfirm: document.getElementById('depositConfirm'),
    transferModal: document.getElementById('transferModal'),
    transferModalClose: document.getElementById('transferModalClose'),
    transferRecipient: document.getElementById('transferRecipient'),
    transferAmount: document.getElementById('transferAmount'),
    transferNote: document.getElementById('transferNote'),
    transferConfirm: document.getElementById('transferConfirm'),
};

function formatCurrency(amount) {
    return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatFullDate(timestamp) {
    return formatDate(timestamp) + ' в ' + formatTime(timestamp);
}

function loadState() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            state.balance = parsed.balance ?? CONFIG.INITIAL_BALANCE;
            state.transactions = parsed.transactions ?? [];
            return true;
        }
    } catch (e) {}
    return false;
}

function saveState() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
            balance: state.balance,
            transactions: state.transactions,
        }));
    } catch (e) {}
}

function addTransaction(type, amount, title, description = '') {
    const tx = {
        id: Date.now() + Math.random().toString(36).substr(2, 6),
        type,
        amount: Math.round(amount * 100) / 100,
        title,
        description,
        timestamp: Date.now(),
    };
    state.transactions.unshift(tx);
    if (state.transactions.length > CONFIG.MAX_TRANSACTIONS) state.transactions.pop();
    saveState();
    renderTransactions();
}

function updateBalance(newBalance) {
    state.balance = Math.round(newBalance * 100) / 100;
    saveState();
    renderBalance();
}

function renderBalance() {
    const formatted = formatCurrency(state.balance);
    if (elements.cardBalance.textContent !== formatted) {
        elements.cardBalance.textContent = formatted;
        elements.cardBalance.classList.remove('pop');
        void elements.cardBalance.offsetWidth;
        elements.cardBalance.classList.add('pop');
    }
}

function renderTransactions() {
    const list = elements.transactionsList;
    if (state.transactions.length === 0) {
        list.innerHTML = `<div class="empty-transactions">Нет операций</div>`;
        return;
    }
    let html = '';
    const show = state.transactions.slice(0, 5);
    show.forEach(tx => {
        let iconSvg, amountClass, sign, amountText;
        const amount = formatCurrency(tx.amount);
        const date = formatFullDate(tx.timestamp);

        if (tx.type === 'deposit') {
            iconSvg = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
            amountClass = 'positive';
            sign = '+';
            amountText = amount;
        } else if (tx.type === 'transfer') {
            iconSvg = `<svg viewBox="0 0 24 24"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>`;
            amountClass = 'transfer';
            sign = '−';
            amountText = amount;
        } else {
            iconSvg = '';
            amountClass = '';
            sign = '';
            amountText = '';
        }

        html += `
            <li class="transaction-item">
                <div class="transaction-left">
                    <div class="transaction-icon ${tx.type}">${iconSvg}</div>
                    <div class="transaction-info">
                        <span class="transaction-title">${tx.title}</span>
                        ${tx.description ? `<span class="transaction-desc">${tx.description}</span>` : ''}
                        <span class="transaction-date">${date}</span>
                    </div>
                </div>
                <span class="transaction-amount ${amountClass}">${sign}${amountText}</span>
            </li>
        `;
    });
    list.innerHTML = html;
}

function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }

// ===== ЗВУК (короткий сигнал) =====
function playTransferSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        // если звук не поддерживается — тихо
    }
}

// ===== АНИМАЦИЯ ПЕРЕВОДА НА ВЕСЬ ЭКРАН =====
function showFullscreenTransfer(recipient, amount) {
    // Убираем предыдущую анимацию, если есть
    const old = document.querySelector('.transfer-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.className = 'transfer-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: transferIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="font-size: 80px; color: #4caf50; margin-bottom: 20px;">✓</div>
        <div style="font-size: 28px; font-weight: 700; color: #d4af37; margin-bottom: 8px;">Перевод отправлен</div>
        <div style="font-size: 22px; color: #ccc; margin-bottom: 4px;">${recipient}</div>
        <div style="font-size: 32px; font-weight: 600; color: #fff;">${formatCurrency(amount)}</div>
        <div style="margin-top: 40px; font-size: 14px; color: #888;">Onyx Bank</div>
    `;

    // Добавляем ключевые кадры анимации прямо в стиль
    const style = document.createElement('style');
    style.textContent = `
        @keyframes transferIn {
            0% { opacity: 0; transform: scale(0.85); }
            100% { opacity: 1; transform: scale(1); }
        }
        @keyframes transferOut {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.9); }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    // Звук
    playTransferSound();

    // Автоматическое исчезновение через 2.5 секунды
    setTimeout(() => {
        overlay.style.animation = 'transferOut 0.4s ease forwards';
        setTimeout(() => {
            overlay.remove();
            style.remove();
        }, 400);
    }, 2500);
}

// ===== ПОПОЛНЕНИЕ =====
function handleDeposit() {
    const amount = parseFloat(elements.depositAmount.value);
    if (!amount || amount <= 0) { alert('Введите сумму'); return; }
    updateBalance(state.balance + amount);
    addTransaction('deposit', amount, 'Пополнение', 'Внесение наличных');
    elements.depositAmount.value = '';
    closeModal(elements.depositModal);
}

// ===== ПЕРЕВОД =====
function handleTransfer() {
    const recipient = elements.transferRecipient.value.trim();
    const amount = parseFloat(elements.transferAmount.value);
    const note = elements.transferNote.value.trim();
    if (!recipient) { alert('Укажите получателя'); return; }
    if (!amount || amount <= 0) { alert('Введите сумму'); return; }
    if (amount > state.balance) { alert('Недостаточно средств'); return; }
    updateBalance(state.balance - amount);
    addTransaction('transfer', amount, 'Перевод → ' + recipient, note || 'Без комментария');
    showFullscreenTransfer(recipient, amount);
    elements.transferRecipient.value = '';
    elements.transferAmount.value = '';
    elements.transferNote.value = '';
    closeModal(elements.transferModal);
}

// ===== СБРОС =====
function handleReset() {
    if (confirm('Сбросить баланс и историю?')) {
        state.balance = CONFIG.INITIAL_BALANCE;
        state.transactions = [];
        saveState();
        renderBalance();
        renderTransactions();
    }
}

// ===== ВСЕ ОПЕРАЦИИ =====
function handleSeeAll() {
    if (state.transactions.length === 0) { alert('Нет операций'); return; }
    let msg = '📋 ВСЕ ОПЕРАЦИИ\n' + '═'.repeat(35) + '\n\n';
    state.transactions.forEach((tx, i) => {
        let sign;
        if (tx.type === 'deposit') sign = '+';
        else if (tx.type === 'transfer') sign = '−';
        else sign = '';
        msg += `${i+1}. ${tx.title}\n`;
        if (tx.description) msg += `   ${tx.description}\n`;
        msg += `   ${formatFullDate(tx.timestamp)}  ${sign}${formatCurrency(tx.amount)}\n\n`;
    });
    msg += '═'.repeat(35) + '\n';
    msg += `💰 Баланс: ${formatCurrency(state.balance)}`;
    alert(msg);
}

// ===== ГЕНЕРАЦИЯ КАРТЫ =====
function generateCardNumber() {
    const full = String(Math.floor(Math.random() * 1e16)).padStart(16, '0');
    const last4 = full.slice(-4);
    return '.... ' + last4;
}
function generateExpiry() {
    const now = new Date();
    const year = now.getFullYear() + 4 + Math.floor(Math.random() * 4);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return `${month}/${String(year).slice(2)}`;
}

function init() {
    if (!loadState()) {
        state.balance = CONFIG.INITIAL_BALANCE;
        state.transactions = [];
        saveState();
    }
    elements.cardNumber.textContent = generateCardNumber();
    elements.cardExpiry.textContent = generateExpiry();
    renderBalance();
    renderTransactions();

    elements.depositBtn.addEventListener('click', () => openModal(elements.depositModal));
    elements.depositModalClose.addEventListener('click', () => closeModal(elements.depositModal));
    elements.depositConfirm.addEventListener('click', handleDeposit);
    elements.depositModal.addEventListener('click', (e) => {
        if (e.target === elements.depositModal) closeModal(elements.depositModal);
    });

    elements.transferBtn.addEventListener('click', () => openModal(elements.transferModal));
    elements.transferModalClose.addEventListener('click', () => closeModal(elements.transferModal));
    elements.transferConfirm.addEventListener('click', handleTransfer);
    elements.transferModal.addEventListener('click', (e) => {
        if (e.target === elements.transferModal) closeModal(elements.transferModal);
    });

    elements.resetBtn.addEventListener('click', handleReset);
    elements.seeAllBtn.addEventListener('click', handleSeeAll);
}

document.addEventListener('DOMContentLoaded', init);