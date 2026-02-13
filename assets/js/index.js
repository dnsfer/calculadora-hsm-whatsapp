// ========== ELEMENTOS DO DOM ==========
const contactsInput = document.getElementById('contacts');
const pricePerMessageInput = document.getElementById('pricePerMessage');
const exchangeRateInput = document.getElementById('exchangeRate');
const taxaFalhaInput = document.getElementById('taxaFalha');
const discountInput = document.getElementById('discount');
const calculateBtn = document.getElementById('calculate');
const updateRateBtn = document.getElementById('updateRate');

// Elementos de Resultado
const totalMessagesSpan = document.getElementById('totalMessages');
const messagesDeliveredSpan = document.getElementById('messagesDelivered');
const messagesFailedSpan = document.getElementById('messagesFailed');
const costUSDSpan = document.getElementById('costUSD');
const costBRLSpan = document.getElementById('costBRL');
const economyBRLSpan = document.getElementById('economyBRL');
const discountSection = document.getElementById('discountSection');
const discountValueSpan = document.getElementById('discountValue');
const finalSection = document.getElementById('finalSection');
const finalCostSpan = document.getElementById('finalCost');
const breakdownList = document.getElementById('breakdown');

// ========== FUNÇÕES DE FORMATAÇÃO ==========
function formatUSD(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    }).format(value);
}

function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
}

// ========== BUSCAR COTAÇÃO DO DÓLAR ==========
async function fetchExchangeRate() {
    const originalHTML = updateRateBtn.innerHTML;
    updateRateBtn.innerHTML = '<i class="fas fa-sync-alt loading"></i> Buscando...';
    updateRateBtn.disabled = true;

    try {
        const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        const data = await response.json();
        
        if (data.USDBRL) {
            const rate = parseFloat(data.USDBRL.bid);
            exchangeRateInput.value = rate.toFixed(2);
            showNotification('✅ Cotação atualizada com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao buscar cotação:', error);
        showNotification('❌ Erro ao buscar cotação. Tente novamente.', 'error');
    } finally {
        updateRateBtn.innerHTML = originalHTML;
        updateRateBtn.disabled = false;
    }
}

// ========== SISTEMA DE NOTIFICAÇÕES ==========
function showNotification(message, type) {
    // Remove notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#00d084' : '#ff4444'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== FUNÇÃO PRINCIPAL DE CÁLCULO ==========
function calculateCost() {
    // Pega os valores dos inputs
    const contacts = parseInt(contactsInput.value) || 0;
    const pricePerMessage = parseFloat(pricePerMessageInput.value) || 0;
    const exchangeRate = parseFloat(exchangeRateInput.value) || 0;
    const taxaFalha = parseFloat(taxaFalhaInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;

    // ===== VALIDAÇÕES =====
    if (contacts <= 0) {
        showNotification('⚠️ Insira uma quantidade válida de contatos', 'error');
        contactsInput.focus();
        return;
    }

    if (pricePerMessage <= 0) {
        showNotification('⚠️ Insira um preço válido por mensagem', 'error');
        pricePerMessageInput.focus();
        return;
    }

    if (exchangeRate <= 0) {
        showNotification('⚠️ Insira uma cotação válida do dólar', 'error');
        exchangeRateInput.focus();
        return;
    }

    // ===== CÁLCULOS COM TAXA DE FALHA =====
    const taxaEntrega = 100 - taxaFalha;
    const messagesDelivered = Math.round(contacts * (taxaEntrega / 100));
    const messagesFailed = contacts - messagesDelivered;

    // Custo real (apenas das mensagens entregues)
    const costUSD = messagesDelivered * pricePerMessage;
    const costBRL = costUSD * exchangeRate;
    
    // Economia (mensagens que não foram enviadas/cobradas)
    const economyUSD = messagesFailed * pricePerMessage;
    const economyBRL = economyUSD * exchangeRate;

    // Desconto (se houver)
    let discountAmount = 0;
    let finalCost = costBRL;

    if (discount > 0) {
        discountAmount = (costBRL * discount) / 100;
        finalCost = costBRL - discountAmount;
    }

    // ===== ATUALIZA RESULTADOS NA TELA =====
    totalMessagesSpan.textContent = formatNumber(contacts);
    
    if (messagesDeliveredSpan) {
        messagesDeliveredSpan.textContent = `${formatNumber(messagesDelivered)} (${taxaEntrega.toFixed(1)}%)`;
    }
    
    if (messagesFailedSpan) {
        messagesFailedSpan.textContent = `${formatNumber(messagesFailed)} (${taxaFalha}%)`;
    }
    
    costUSDSpan.textContent = formatUSD(costUSD);
    costBRLSpan.textContent = formatBRL(costBRL);
    
    if (economyBRLSpan) {
        economyBRLSpan.textContent = formatBRL(economyBRL);
    }

    // Mostra/esconde seções de desconto
    if (discount > 0 && discountSection && finalSection) {
        discountSection.style.display = 'flex';
        finalSection.style.display = 'flex';
        discountValueSpan.textContent = `- ${formatBRL(discountAmount)} (${discount}%)`;
        finalCostSpan.textContent = formatBRL(finalCost);
    } else if (discountSection && finalSection) {
        discountSection.style.display = 'none';
        finalSection.style.display = 'none';
    }

    // Atualiza detalhamento
    updateBreakdown(contacts, messagesDelivered, messagesFailed, pricePerMessage, exchangeRate, costUSD, costBRL, economyBRL, discount, finalCost);

    // Feedback de sucesso
    showNotification('✅ Cálculo realizado com sucesso!', 'success');
    
    // Anima resultados
    animateResults();
}

// ========== ATUALIZAR DETALHAMENTO ==========
function updateBreakdown(contacts, delivered, failed, pricePerMsg, rate, costUSD, costBRL, economy, discount, finalCost) {
    if (!breakdownList) return;

    const taxaEntrega = ((delivered / contacts) * 100).toFixed(1);
    const taxaFalha = ((failed / contacts) * 100).toFixed(1);

    breakdownList.innerHTML = `
        <li>📊 <strong>${formatNumber(contacts)}</strong> contatos na lista</li>
        <li>✅ <strong>${formatNumber(delivered)}</strong> mensagens entregues (${taxaEntrega}%)</li>
        <li>❌ <strong>${formatNumber(failed)}</strong> falhas/bloqueios (${taxaFalha}%)</li>
        <li>💵 Preço unitário: <strong>${formatUSD(pricePerMsg)}</strong></li>
        <li>💱 Cotação atual: <strong>R$ ${rate.toFixed(2)}</strong></li>
        <li>💰 Custo total: <strong>${formatUSD(costUSD)}</strong> = <strong>${formatBRL(costBRL)}</strong></li>
        <li>🎉 Economia com falhas: <strong>${formatBRL(economy)}</strong></li>
        ${discount > 0 ? `<li>🏷️ Desconto: <strong>${discount}%</strong> = ${formatBRL((costBRL * discount) / 100)}</li>` : ''}
        ${discount > 0 ? `<li>✨ Valor final: <strong>${formatBRL(finalCost)}</strong></li>` : ''}
    `;
}

// ========== ANIMAR RESULTADOS (VIA CLASSES CSS) ==========
function animateResults() {
    const resultItems = document.querySelectorAll('.result-item');
    
    if (resultItems.length === 0) return;
    
    // Remove a classe de animação
    resultItems.forEach(item => {
        item.classList.remove('animate');
    });
    
    // Força o reflow do navegador (truque para reiniciar animação)
    void document.body.offsetHeight;
    
    // Reaplica a classe de animação
    resultItems.forEach(item => {
        item.classList.add('animate');
    });
}

// ========== EVENT LISTENERS ==========
if (calculateBtn) {
    calculateBtn.addEventListener('click', calculateCost);
}

if (updateRateBtn) {
    updateRateBtn.addEventListener('click', fetchExchangeRate);
}

// Calcula ao pressionar Enter em qualquer input
const inputs = [contactsInput, pricePerMessageInput, exchangeRateInput, taxaFalhaInput, discountInput];

inputs.forEach(input => {
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculateCost();
            }
        });
    }
});

// ===== VALIDAÇÃO EM TEMPO REAL =====
if (contactsInput) {
    contactsInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
    });
}

if (pricePerMessageInput) {
    pricePerMessageInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
    });
}

if (exchangeRateInput) {
    exchangeRateInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
    });
}

if (taxaFalhaInput) {
    taxaFalhaInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
        if (this.value > 100) this.value = 100;
    });
}

if (discountInput) {
    discountInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
        if (this.value > 100) this.value = 100;
    });
}

// ========== ATALHOS DE TECLADO ==========
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter para calcular
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        calculateCost();
    }
    
    // Ctrl/Cmd + U para atualizar cotação
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        fetchExchangeRate();
    }
});

// ========== INICIALIZAÇÃO ==========
window.addEventListener('load', () => {
    console.log('🚀 Calculadora HSM WhatsApp - Progradior.Dev');
    console.log('✅ Sistema carregado com sucesso!');
    console.log('');
    console.log('💡 Atalhos de teclado:');
    console.log('   • Ctrl + Enter → Calcular');
    console.log('   • Ctrl + U → Atualizar cotação');
    console.log('   • Enter (em qualquer campo) → Calcular');
    
    // Busca cotação automaticamente ao carregar
    if (updateRateBtn) {
        fetchExchangeRate();
    }
    
    // Calcula com valores padrão após 1 segundo
    setTimeout(() => {
        if (calculateBtn) {
            calculateCost();
        }
    }, 1000);
});
