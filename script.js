// ==========================================================================
// 🤖 INTEGRACIÓN CON BOTPRESS WEBCHAT (CHEF LUIGI IA)
// ==========================================================================
// Botpress se inicializa automáticamente a través de los scripts inyectados:
// - https://cdn.botpress.cloud/webchat/v5.0/inject.js
// - https://files.bpcontent.cloud/2026/11/18/20/20261118203943-EDTF5RXS.js
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // ESTADO DEL CARRITO
  // ==========================================
  let cart = [];

  const cartBadge = document.getElementById('cartBadge');
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartTotalPrice = document.getElementById('cartTotalPrice');
  const cartDrawerCount = document.getElementById('cartDrawerCount');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // ==========================================
  // MENÚ MÓVIL (HAMBURGUESA)
  // ==========================================
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // ==========================================
  // FILTRADO DE PIZZAS POPULARES
  // ==========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const pizzaCards = document.querySelectorAll('.pizza-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      pizzaCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // ==========================================
  // NOTIFICACIÓN TOAST
  // ==========================================
  let toastTimeout;
  window.showToast = function(message) {
    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  };

  // ==========================================
  // CARRITO: APERTURA Y CIERRE
  // ==========================================
  function openCart() {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // ==========================================
  // CARRITO: AÑADIR PRODUCTOS
  // ==========================================
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

  addToCartButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price'));

      addItemToCart(id, name, price);
      showToast(`¡${name} añadida a tu orden!`);
    });
  });

  function addItemToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({ id, name, price, qty: 1 });
    }

    updateCartUI();
  }

  function updateQuantity(id, change) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      cart[itemIndex].qty += change;
      if (cart[itemIndex].qty <= 0) {
        cart.splice(itemIndex, 1);
      }
    }
    updateCartUI();
  }

  function updateCartUI() {
    const totalUnits = cart.reduce((acc, item) => acc + item.qty, 0);
    cartBadge.textContent = totalUnits;
    cartDrawerCount.textContent = totalUnits;

    cartBadge.style.transform = 'scale(1.3)';
    setTimeout(() => {
      cartBadge.style.transform = 'scale(1)';
    }, 200);

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart-message">
          <p>Tu carrito está vacío 🍕</p>
          <small>Elige tus pizzas y ofertas favoritas para comenzar.</small>
        </div>
      `;
      cartTotalPrice.textContent = '$0.00';
      return;
    }

    let itemsHTML = '';
    let total = 0;

    cart.forEach(item => {
      const itemSubtotal = item.price * item.qty;
      total += itemSubtotal;

      itemsHTML += `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <span class="cart-item-price">$${item.price.toFixed(2)} c/u &bull; <strong>$${itemSubtotal.toFixed(2)}</strong></span>
          </div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="window.changeCartQty('${item.id}', -1)" aria-label="Disminuir">&minus;</button>
            <span><strong>${item.qty}</strong></span>
            <button class="qty-btn" onclick="window.changeCartQty('${item.id}', 1)" aria-label="Aumentar">&plus;</button>
          </div>
        </div>
      `;
    });

    cartItemsContainer.innerHTML = itemsHTML;
    cartTotalPrice.textContent = `$${total.toFixed(2)}`;
  }

  window.changeCartQty = function(id, change) {
    updateQuantity(id, change);
  };

  // Botón de Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Por favor añade al menos una pizza a tu pedido antes de continuar.');
        return;
      }
      alert('¡Grazie mille! En breve un repartidor de Bella Napoli estará en camino a tu domicilio.');
      cart = [];
      updateCartUI();
      closeCart();
    });
  }

  // ==========================================
  // CHATBOT INTEGRADO CHEF LUIGI (BOTPRESS AI)
  // ==========================================
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const aiChips = document.querySelectorAll('.ai-chip');

  function getCurrentTimeString() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function appendMessage(sender, text, isHtml = false) {
    if (!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    const avatarChar = sender === 'user' ? '👤' : '🍕';
    const contentHTML = isHtml ? text : `<p>${escapeHTML(text)}</p>`;

    bubble.innerHTML = `
      <div class="bubble-avatar">${avatarChar}</div>
      <div class="bubble-content">
        ${contentHTML}
        <span class="bubble-time">${getCurrentTimeString()}</span>
      </div>
    `;

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  let typingBubble = null;
  function showTypingIndicator() {
    if (typingBubble || !chatMessages) return;
    typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble ai typing';
    typingBubble.innerHTML = `
      <div class="bubble-avatar">👨‍🍳</div>
      <div class="bubble-content">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(typingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    if (typingBubble) {
      typingBubble.remove();
      typingBubble = null;
    }
  }

  // Escuchar mensajes entrantes desde Botpress
  let botpressListenerAttached = false;
  function setupBotpressListener() {
    if (botpressListenerAttached) return;
    if (window.botpress && typeof window.botpress.on === 'function') {
      window.botpress.on('message', (payload) => {
        removeTypingIndicator();
        let messageText = '';
        if (typeof payload === 'string') {
          messageText = payload;
        } else if (payload && payload.text) {
          messageText = payload.text;
        } else if (payload && payload.payload && payload.payload.text) {
          messageText = payload.payload.text;
        }
        if (messageText) {
          appendMessage('ai', messageText);
        }
      });
      botpressListenerAttached = true;
    }
  }

  // Intentar enlazar el listener de Botpress
  setupBotpressListener();
  window.addEventListener('load', setupBotpressListener);

  // Enviar mensaje al bot
  function handleSendMessage(messageText) {
    if (!messageText || !messageText.trim()) return;
    const cleanText = messageText.trim();

    // 1. Mostrar mensaje del usuario
    appendMessage('user', cleanText);
    if (chatInput) chatInput.value = '';

    // 2. Indicador de escritura
    showTypingIndicator();

    // 3. Comunicarse con Botpress
    let sentToBotpress = false;

    if (window.botpress) {
      setupBotpressListener();
      if (typeof window.botpress.sendMessage === 'function') {
        window.botpress.sendMessage(cleanText);
        sentToBotpress = true;
      } else if (typeof window.botpress.sendPayload === 'function') {
        window.botpress.sendPayload({ type: 'text', text: cleanText });
        sentToBotpress = true;
      }
    } else if (window.botpressWebChat && typeof window.botpressWebChat.sendMessage === 'function') {
      window.botpressWebChat.sendMessage(cleanText);
      sentToBotpress = true;
    }

    // 4. Fallback inteligente en caso de espera o si Botpress se encuentra offline
    setTimeout(() => {
      if (typingBubble) {
        removeTypingIndicator();
        generateSommelierResponse(cleanText);
      }
    }, 2800);
  }

  function generateSommelierResponse(query) {
    const q = query.toLowerCase();
    let reply = '';

    if (q.includes('pareja') || q.includes('romántic') || q.includes('cena')) {
      reply = 'Para una velada especial en pareja te recomiendo nuestra <strong>Prosciutto di Parma & Rúcula</strong> ($18.90) con aceite de trufa blanca, o la <strong>Quattro Formaggi D.O.P.</strong> con gorgonzola dulce. ¡Combinan perfecto con un buen vino tinto!';
    } else if (q.includes('vege') || q.includes('carne') || q.includes('sin carne')) {
      reply = '¡Excelente elección saludable! Nuestra favorita es la <strong>Ortolana Rústica</strong> ($14.50), con berenjena asada, calabacín grillado y pimientos caramelizados, o la tradicional <strong>Margherita</strong> con tomates San Marzano y mozzarella fior di latte.';
    } else if (q.includes('pedida') || q.includes('más vendida') || q.includes('popular') || q.includes('favorita')) {
      reply = 'Nuestra estrella indiscutible es la <strong>Pepperoni Suprema</strong> ($15.90) con doble pepperoni curado y orégano silvestre, seguida muy de cerca por la clásica <strong>Margherita Tradizionale</strong> ($13.50). ¡Nunca fallan!';
    } else if (q.includes('fiesta') || q.includes('amigos') || q.includes('combo') || q.includes('grupo') || q.includes('8')) {
      reply = '¡Para compartir entre amigos la opción ganadora es el <strong>Combo Familiar 2x1</strong> ($24.90) o 2 <strong>Packs Amigos & Pizza</strong> ($22.50 c/u) que incluyen palitos de ajo crocantes y refresco grande.';
    } else {
      reply = '¡Con gusto! En Bella Napoli preparamos todas nuestras pizzas al horno de leña con masa madre de 48 horas. Puedes pedir directamente la <strong>Margherita Tradizionale</strong>, la <strong>BBQ Smokey Bacon</strong> o consultar nuestro menú en la sección superior.';
    }

    appendMessage('ai', reply, true);
  }

  // Manejador del formulario de chat
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (chatInput) {
        handleSendMessage(chatInput.value);
      }
    });
  }

  // Manejador de las sugerencias (chips)
  aiChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        handleSendMessage(prompt);
      }
    });
  });

  // Botón para reiniciar conversación
  if (clearChatBtn && chatMessages) {
    clearChatBtn.addEventListener('click', () => {
      chatMessages.innerHTML = `
        <div class="chat-bubble ai">
          <div class="bubble-avatar">🍕</div>
          <div class="bubble-content">
            <p><strong>¡Ciao! Benvenuto a Bella Napoli.</strong></p>
            <p>Soy <strong>Chef Luigi</strong>, tu asistente gastronómico personal. Dime qué ingredientes se te antojan, cuántas personas van a comer o qué ocasión celebras, y te recomendaré la opción perfecta.</p>
            <span class="bubble-time">${getCurrentTimeString()}</span>
          </div>
        </div>
      `;
      removeTypingIndicator();
    });
  }

  // ==========================================
  // NEWSLETTER FORM
  // ==========================================
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      if (input.value) {
        showToast('¡Grazie! Revisa tu correo con el cupón del 15% de descuento.');
        input.value = '';
      }
    });
  }

  // ==========================================
  // SCROLL ACTIVO EN LA NAVEGACIÓN
  // ==========================================
  const sections = document.querySelectorAll('section[id], header[id]');

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 130;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
});
