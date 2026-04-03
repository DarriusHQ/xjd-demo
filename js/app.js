(function () {
  'use strict';

  /* ====== State Management ====== */
  let cart = {
    items: [],
    total: 0
  };
  const DINERS = 1; // 默认1人用餐

  /* ====== Chat State (declared early, used across P2 and P3) ====== */
  let chatStarted = false;
  let chatPhase = 0;

  /* ====== Page Navigation ====== */
  const pages = document.querySelectorAll('.page');

  function showPage(id) {
    pages.forEach(p => {
      if (p.id === id) {
        p.classList.add('active');
        p.classList.remove('slide-out');
        p.classList.add('slide-in');
        setTimeout(() => p.classList.remove('slide-in'), 320);
      } else if (p.classList.contains('active')) {
        p.classList.remove('active');
      }
    });
  }

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) showPage(target);
    });
  });

  document.getElementById('btn-back-home')?.addEventListener('click', () => {
    showPage('page-order');
  });

  /* ====== P1 → P2: Open Agent ====== */
  document.getElementById('btn-open-agent').addEventListener('click', () => {
    showPage('page-welcome');
  });

  /* ====== P2: Promo Tab Switch ====== */
  document.querySelectorAll('.promo-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.promo-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.promo-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panelId = tab.dataset.panel;
      if (panelId) document.getElementById(panelId)?.classList.add('active');
    });
  });

  /* ====== P2 → P3: Quick Buttons ====== */
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chatStarted = false; chatPhase = 0;
      showPage('page-chat');
      setTimeout(startChatDemo, 400);
    });
  });

  /* ====== P2 promo card add → P3 ====== */
  document.querySelectorAll('.promo-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chatStarted = false; chatPhase = 0;
      showPage('page-chat');
      setTimeout(startChatDemo, 400);
    });
  });

  const chatContainer = document.getElementById('chat-messages');

  /* ====== P2 → P3: Welcome Input 路由 ====== */
  const welcomeInput = document.getElementById('welcome-input');

  function handleWelcomeSubmit() {
    if (!welcomeInput || !welcomeInput.value.trim()) return;
    const text = welcomeInput.value.trim();
    welcomeInput.value = '';
    // 每次从P2进入P3都重置状态
    chatStarted = false;
    chatPhase = 0;
    showPage('page-chat');
    if (/优惠券|我的优惠券|有哪些可用的优惠券/.test(text)) {
      setTimeout(() => {
        chatStarted = true;
        chatPhase = 99;
        chatContainer.innerHTML = '';
        startCouponScene(text);
      }, 400);
    } else {
      setTimeout(startChatDemo, 400);
    }
  }

  if (welcomeInput) {
    welcomeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleWelcomeSubmit(); }
    });
  }
  document.getElementById('welcome-send-btn')?.addEventListener('click', handleWelcomeSubmit);

  /* ====== P3: Chat Demo Sequence ====== */

  function startChatDemo() {
    if (chatStarted) return;
    chatStarted = true;
    chatPhase = 0;
    chatContainer.innerHTML = '';

    const phase1 = [
      { type: 'user', text: '来份水饺', delay: 300 },
      { type: 'agent-search', delay: 800 },
      { type: 'agent', text: '请问您需要什么馅的？可以告诉我更多信息以帮您找到更合适的餐品哦～🤗', delay: 1200 },
    ];

    let accumulated = 0;
    phase1.forEach((item, i) => {
      accumulated += item.delay;
      setTimeout(() => {
        renderMessage(item);
        if (i === phase1.length - 1) chatPhase = 1;
      }, accumulated);
    });
  }

  function startCouponScene(userText) {
    renderMessage({ type: 'user', text: userText });
    const steps = [
      { type: 'agent-search', delay: 600 },
      { type: 'agent', text: '你好，小喜帮你找到一张可用的折扣券，现在下单虾三鲜水饺即享95折优惠，有效期到2026.04.02，请尽快使用哦～', delay: 1200 },
      { type: 'coupon-card', delay: 600 },
    ];
    let accumulated = 0;
    steps.forEach(item => {
      accumulated += item.delay;
      setTimeout(() => renderMessage(item), accumulated);
    });
  }

  function startChatPhase2(userText) {
    chatPhase = 2;
    renderMessage({ type: 'user', text: userText });

    const phase2 = [
      { type: 'agent', text: '没问题～为您推荐虾三鲜水饺和喜三鲜水饺🎉～\n根据您过往的点餐习惯，还给您推荐了一些搭配，您可以按需加购哦～', delay: 600 },
      { type: 'recommend-card', delay: 1200 },
    ];

    let accumulated = 0;
    phase2.forEach(item => {
      accumulated += item.delay;
      setTimeout(() => renderMessage(item), accumulated);
    });
  }

  /* ====== Nutrition Tip Logic ====== */
  function getNutritionTip() {
    if (cart.items.length === 0) return '';

    const mainFoods = cart.items.filter(i => i.name.includes('水饺'));
    const totalMainQty = mainFoods.reduce((a, i) => a + i.qty, 0);

    // Build description parts
    const parts = [];
    const seenTypes = {};
    cart.items.forEach(item => {
      let typeName;
      if (item.name.includes('水饺')) {
        typeName = '水饺';
      } else if (item.name.includes('布丁') || item.name.includes('豆花')) {
        typeName = '甜品';
      } else {
        typeName = item.name.replace(/[()（）大份小份]/g, '');
      }
      if (!seenTypes[typeName]) {
        seenTypes[typeName] = 0;
      }
      seenTypes[typeName] += item.qty;
    });

    for (const [name, qty] of Object.entries(seenTypes)) {
      parts.push(`${qty}份 ${name}`);
    }

    if (totalMainQty <= DINERS) {
      return parts.join(' + ') + '，营养齐全刚刚好';
    } else {
      return parts.join(' + ') + `（${DINERS}人用餐，主食偏多哦）`;
    }
  }

  /* ====== Cart modification helpers ====== */
  function addToCart(id, name, price, img) {
    const existing = cart.items.find(i => i.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.items.push({ id, name, price, img, qty: 1 });
    }
    updateCartDisplay();
  }

  function removeFromCart(id) {
    const existing = cart.items.find(i => i.id === id);
    if (existing) {
      existing.qty--;
      if (existing.qty <= 0) {
        cart.items = cart.items.filter(i => i.id !== id);
      }
    }
    updateCartDisplay();
  }

  function getCartQty(id) {
    const item = cart.items.find(i => i.id === id);
    return item ? item.qty : 0;
  }

  /* ====== Render Messages ====== */
  function renderMessage(item) {
    const el = document.createElement('div');
    el.className = 'card-container';

    switch (item.type) {
      case 'user':
        el.classList.add('user-msg');
        el.innerHTML = `<div class="msg-user">${item.text}</div>`;
        break;

      case 'agent':
        el.innerHTML = `
          <div class="msg-agent">
            <img src="images/smalllogo.png" alt="" class="avatar" onerror="this.classList.add('avatar-fallback')">
            <div class="msg-agent-content">${item.text.replace(/\n/g, '<br>')}</div>
          </div>
        `;
        break;

      case 'agent-search':
        el.innerHTML = `
          <div class="msg-agent">
            <img src="images/smalllogo.png" alt="" class="avatar" onerror="this.classList.add('avatar-fallback')">
            <div class="search-status">
              <div class="status-row"><span class="status-icon check">✓</span> 已为您全站检索</div>
              <div class="status-row" style="padding-left:22px;font-size:12px;color:#999">已为您检索全部200个餐品</div>
              <div class="status-row" style="padding-left:22px;font-size:12px;color:#999">已为您检索全部4张优惠券</div>
              <div class="status-row"><span class="status-icon check">✓</span> 已理解您的需求</div>
              <div class="status-row" style="padding-left:22px;font-size:12px;color:#999">【喜家德深圳南山软件园点】堂食</div>
            </div>
          </div>
        `;
        break;

      case 'coupon-card':
        el.innerHTML = `
          <div class="coupon-card" id="coupon-card-el">
            <img src="images/banner.png" alt="虾三鲜水饺95折券" class="coupon-banner-img">
            <div class="coupon-card-body">
              <div class="coupon-title">虾三鲜水饺95折券</div>
              <div class="coupon-desc">有效期：2026.03.27–2026.04.02</div>
              <div class="coupon-desc">使用规则</div>
              <button class="coupon-use-btn" id="btn-use-coupon">立即使用</button>
            </div>
          </div>
        `;
        break;

      case 'recommend-card':
        el.innerHTML = `
          <div class="card-folded hidden" id="fold-recommend">
            <div class="folded-text"><span class="status-icon check">✓</span> 已确认加购餐品，点击可修改</div>
            <span class="folded-arrow">∨</span>
          </div>
          <div class="card-content-wrapper" id="content-recommend">
            <div class="store-card">
              <div class="store-card-header">
                <div class="store-logo-sm"><img src="images/smalllogo.png" alt=""></div>
                <div>
                  <div class="store-card-name">喜家德深圳南山软件园店 ›</div>
                  <div class="store-card-sub">堂食 | 南山区南山软件园产业基地5栋e座</div>
                </div>
              </div>

              <!-- 营养提示 -->
              <div class="nutrition-tip hidden" id="nutrition-tip">
                <span class="nutrition-icon">🍽</span>
                <span class="nutrition-text" id="nutrition-text"></span>
              </div>

              <div class="recommend-item">
                <img src="images/shrimp-dumpling.png" alt="虾三鲜水饺" class="rec-img" onerror="this.classList.add('placeholder')">
                <div class="rec-info">
                  <div class="rec-name">虾三鲜水饺.</div>
                  <div class="rec-desc">好食材：虾仁、韭菜、鸡蛋</div>
                  <div class="rec-specs">
                    <div class="rec-spec" data-id="1a" data-name="虾三鲜水饺(大份)" data-price="30" data-img="images/shrimp-dumpling.png">
                      <span class="spec-label">大份15只(份)</span>
                      <span class="spec-right">
                        <span class="rec-spec-price">¥30</span>
                        <span class="spec-qty-wrap" data-id="1a">
                          <span class="qty-ctrl hidden"><span class="spec-minus">−</span><span class="spec-num">0</span></span>
                          <span class="spec-plus">＋</span>
                        </span>
                      </span>
                    </div>
                  </div>
                  <div class="rec-specs">
                    <div class="rec-spec" data-id="1b" data-name="虾三鲜水饺(小份)" data-price="20" data-img="images/shrimp-dumpling.png">
                      <span class="spec-label">小份10只(份)</span>
                      <span class="spec-right">
                        <span class="rec-spec-price">¥20</span>
                        <span class="spec-qty-wrap" data-id="1b">
                          <span class="qty-ctrl hidden"><span class="spec-minus">−</span><span class="spec-num">0</span></span>
                          <span class="spec-plus">＋</span>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="recommend-item">
                <img src="images/xi-dumpling.png" alt="喜三鲜水饺" class="rec-img" onerror="this.classList.add('placeholder')">
                <div class="rec-info">
                  <div class="rec-name">喜三鲜水饺.</div>
                  <div class="rec-desc">好食材：虾仁、鱼籽、猪前腿肉</div>
                  <div class="rec-specs">
                    <div class="rec-spec" data-id="2a" data-name="喜三鲜水饺(大份)" data-price="31" data-img="images/xi-dumpling.png">
                      <span class="spec-label">大份15只(份)</span>
                      <span class="spec-right">
                        <span class="rec-spec-price">¥31</span>
                        <span class="spec-qty-wrap" data-id="2a">
                          <span class="qty-ctrl hidden"><span class="spec-minus">−</span><span class="spec-num">0</span></span>
                          <span class="spec-plus">＋</span>
                        </span>
                      </span>
                    </div>
                  </div>
                  <div class="rec-specs">
                    <div class="rec-spec" data-id="2b" data-name="喜三鲜水饺(小份)" data-price="21" data-img="images/xi-dumpling.png">
                      <span class="spec-label">小份10只(份)</span>
                      <span class="spec-right">
                        <span class="rec-spec-price">¥21</span>
                        <span class="spec-qty-wrap" data-id="2b">
                          <span class="qty-ctrl hidden"><span class="spec-minus">−</span><span class="spec-num">0</span></span>
                          <span class="spec-plus">＋</span>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="guess-like">
                <div class="guess-label">猜你喜欢</div>
                <div class="guess-item" data-id="3" data-name="焦糖豆花布丁" data-price="8" data-img="images/pudding.png">
                  <img src="images/pudding.png" alt="焦糖豆花布丁" class="guess-img" onerror="this.classList.add('placeholder')">
                  <div class="guess-info">
                    <div class="guess-name">焦糖豆花布丁</div>
                    <div class="guess-desc">好食材：豆花粉、黑糖糖浆</div>
                  </div>
                  <span class="spec-qty-wrap" data-id="3">
                    <span class="qty-ctrl hidden"><span class="spec-minus">−</span><span class="spec-num">0</span></span>
                    <span class="spec-plus guess-plus">＋</span>
                  </span>
                </div>
              </div>

              <!-- 优惠和备注 -->
              <div class="card-order-section">
                <div class="order-row">
                  <span class="order-row-label">优惠</span>
                  <div class="order-row-content">
                    <span class="coupon-icon">🎫</span> 优惠券 <span class="order-row-arrow">暂无可用优惠券 ›</span>
                  </div>
                </div>
                <div class="order-row">
                  <span class="order-row-label">备注</span>
                  <div class="order-row-content">
                    <span class="order-row-arrow">口味、偏好等要求 ›</span>
                  </div>
                </div>
              </div>

              <div class="checkout-bar">
                <div class="checkout-bar-left">¥ <span id="cart-total-price">0</span></div>
                <div class="checkout-bar-btn disabled" id="btn-go-checkout">下单并支付</div>
              </div>
            </div>
          </div>
        `;
        break;

      case 'coupon-order-card':
        el.innerHTML = `
          <div class="co-card" id="coupon-order-card-el">
            <!-- 店铺头 -->
            <div class="co-store-bar">
              <span class="co-store-icon">📍</span>
              <div class="co-store-info">
                <div class="co-store-name">喜家德深圳南山软件园店 <span class="co-store-arrow">›</span></div>
                <div class="co-store-sub">堂食 | 南山区南山软件园产业基地5栋e座</div>
              </div>
            </div>
            <!-- 营养提示 pill -->
            <div class="co-nutrition-wrap">
              <div class="nutrition-tip co-nutrition-tip" id="co-nutrition-tip" style="display:none;">
                <span class="nutrition-icon">🍽</span>
                <span class="nutrition-text" id="co-nutrition-text"></span>
              </div>
            </div>
            <!-- 优惠 banner -->
            <div class="co-promo-bar">
              <span class="co-promo-tag">🎫 使用后优惠不可叠加，请注意查看</span>
            </div>
            <!-- 商品列表 -->
            <div class="co-item-list">
              <!-- 虾三鲜水饺 -->
              <div class="co-item">
                <img src="images/shrimp-dumpling.png" alt="虾三鲜水饺" class="co-item-img" onerror="this.classList.add('placeholder')">
                <div class="co-item-info">
                  <div class="co-item-name">虾三鲜水饺。</div>
                  <div class="co-item-desc">好食材：虾仁、韭菜、鸡蛋</div>
                  <div class="co-spec-row" data-id="1a" data-name="虾三鲜水饺(大份)" data-price="30" data-img="images/shrimp-dumpling.png">
                    <span class="co-spec-label">大份15只(份)</span>
                    <span class="co-spec-price">¥30</span>
                    <span class="spec-qty-wrap" data-id="1a">
                      <span class="qty-ctrl"><span class="spec-minus">−</span><span class="spec-num">1</span></span>
                      <span class="spec-plus co-plus">＋</span>
                    </span>
                  </div>
                  <div class="co-spec-row" data-id="1b" data-name="虾三鲜水饺(小份)" data-price="20" data-img="images/shrimp-dumpling.png">
                    <span class="co-spec-label">小份10只(份)</span>
                    <span class="co-spec-price">¥20</span>
                    <span class="spec-qty-wrap" data-id="1b">
                      <span class="qty-ctrl hidden"><span class="spec-minus">−</span><span class="spec-num">0</span></span>
                      <span class="spec-plus co-plus">＋</span>
                    </span>
                  </div>
                </div>
              </div>
              <!-- 焦糖豆花布丁 -->
              <div class="co-item">
                <img src="images/pudding.png" alt="焦糖豆花布丁" class="co-item-img" onerror="this.classList.add('placeholder')">
                <div class="co-item-info">
                  <div class="co-item-name">焦糖豆花布丁</div>
                  <div class="co-item-desc">好食材：豆花粉、黑糖糖浆</div>
                  <div class="co-spec-row" data-id="3" data-name="焦糖豆花布丁" data-price="8" data-img="images/pudding.png">
                    <span class="co-spec-label">份</span>
                    <span class="co-spec-price">¥8</span>
                    <span class="spec-qty-wrap" data-id="3">
                      <span class="qty-ctrl hidden"><span class="spec-minus">−</span><span class="spec-num">0</span></span>
                      <span class="spec-plus co-plus">＋</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 优惠区 -->
            <div class="co-footer-section">
              <div class="co-coupon-row">
                <span class="co-coupon-label">优惠</span>
                <span class="co-coupon-val">🎫 虾三鲜水饺95折券 <span class="co-coupon-arrow">›</span></span>
              </div>
            </div>
            <!-- 结算栏 -->
            <div class="co-checkout-bar">
              <div class="co-total">¥ <span id="co-total-price">${cart.total.toFixed(2)}</span></div>
              <div class="co-checkout-btn" id="btn-co-checkout">下单并支付</div>
            </div>
          </div>
        `;
        break;

      case 'success-card':
        el.innerHTML = `
          <div class="msg-agent">
            <img src="images/smalllogo.png" alt="" class="avatar" onerror="this.classList.add('avatar-fallback')">
            <div class="success-agent-text">您的餐品正在制作中，可以先去收银台右侧盛一碗免费的紫菜虾皮汤～还有其他免费的小菜和小料欢迎品尝～</div>
          </div>
          <div class="success-detail-card" style="margin-top:12px">
            <div class="detail-title">餐品详情</div>
            ${renderSuccessItems()}
            <div class="order-divider"></div>
            <div class="detail-total-row">
              <span>共计${cart.items.reduce((acc, i) => acc + i.qty, 0)}道菜，实际金额</span>
              <span class="final-price">¥ ${cart.total.toFixed(2)}</span>
            </div>
            <div class="detail-action">
              <button class="detail-btn" id="btn-view-order-detail">查看详情</button>
            </div>
          </div>
        `;
        break;
    }

    chatContainer.appendChild(el);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    // 卡片挂载后立即刷新营养提示和控件状态
    if (item.type === 'coupon-order-card' || item.type === 'recommend-card') {
      updateCartDisplay();
    }
    attachCardEvents(el);
  }

  function renderSuccessItems() {
    return cart.items.map(item => `
      <div class="detail-product-row">
        <img src="${item.img}" alt="" class="detail-img" onerror="this.classList.add('placeholder')">
        <div class="detail-product-info">
          <div class="detail-product-name"><span class="discount-badge">折</span> ${item.name}</div>
          <div class="detail-spec">份 <span class="vip-badge-sm">会员价</span></div>
          <div class="detail-qty">x${item.qty}</div>
        </div>
        <div class="detail-prices">
          <span class="price-real">¥ ${(item.price * item.qty).toFixed(2)}</span>
        </div>
      </div>
    `).join('');
  }

  function attachCardEvents(container) {
    // 「立即使用」优惠券
    container.querySelector('#btn-use-coupon')?.addEventListener('click', () => {
      // 隐藏优惠券卡片
      const couponEl = document.getElementById('coupon-card-el');
      if (couponEl) couponEl.closest('.card-container').remove();

      // AI 回复
      renderMessage({ type: 'agent', text: '已经为你加购了虾三鲜水饺～目前的餐品份量相对比较精简。如果您担心稍后等待时间较长，可以考虑再搭配一份特色主食或小食。' });

      // 自动加入购物车：虾三鲜水饺大份
      addToCart('1a', '虾三鲜水饺(大份)', 30, 'images/shrimp-dumpling.png');

      // 生成优惠券专用加购卡片
      setTimeout(() => renderMessage({ type: 'coupon-order-card' }), 800);
    });

    // Plus buttons (add to cart)
    container.querySelectorAll('.spec-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrap = btn.closest('.spec-qty-wrap');
        if (!wrap) return;
        const id = wrap.dataset.id;
        const specEl = btn.closest('[data-name]');
        if (!specEl) return;
        const name = specEl.dataset.name;
        const price = parseFloat(specEl.dataset.price);
        const img = specEl.dataset.img;
        addToCart(id, name, price, img);
      });
    });

    // Minus buttons (remove from cart)
    container.querySelectorAll('.spec-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrap = btn.closest('.spec-qty-wrap');
        if (!wrap) return;
        const id = wrap.dataset.id;
        removeFromCart(id);
      });
    });

    // coupon-order-card 「下单并支付」
    container.querySelector('#btn-co-checkout')?.addEventListener('click', () => {
      if (cart.items.length === 0) return;
      const cardEl = document.getElementById('coupon-order-card-el');
      if (cardEl) cardEl.style.pointerEvents = 'none';
      setTimeout(() => {
        renderMessage({ type: 'agent', text: '订单生成成功，待付款' });
        setTimeout(() => {
          document.getElementById('payment-modal').classList.remove('hidden');
        }, 800);
      }, 300);
    });

    // "下单并支付" — fold recommend, show AI reply, then payment
    container.querySelector('#btn-go-checkout')?.addEventListener('click', () => {
      if (cart.items.length === 0) return;

      // Fold recommend card
      const fold = document.getElementById('fold-recommend');
      const content = document.getElementById('content-recommend');
      fold.classList.remove('hidden');
      content.classList.add('collapsed');

      // Render AI message
      setTimeout(() => {
        renderMessage({ type: 'agent', text: '订单生成成功，待付款' });
        // Auto open payment
        setTimeout(() => {
          document.getElementById('payment-modal').classList.remove('hidden');
        }, 800);
      }, 300);
    });

    // Fold/Unfold recommend
    container.querySelector('#fold-recommend')?.addEventListener('click', () => {
      const fold = document.getElementById('fold-recommend');
      const content = document.getElementById('content-recommend');
      fold.classList.toggle('is-active');
      content.classList.toggle('collapsed');
    });

    // View Detail
    container.querySelector('#btn-view-order-detail')?.addEventListener('click', () => {
      prepareOrderDetail();
      showPage('page-order-detail');
    });
  }

  function updateCartDisplay() {
    cart.total = cart.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const totalEl = document.getElementById('cart-total-price');
    const btn = document.getElementById('btn-go-checkout');

    if (totalEl) totalEl.textContent = cart.total.toFixed(2);
    // 同步更新 coupon-order-card 的总价和营养提示
    const coTotalEl = document.getElementById('co-total-price');
    if (coTotalEl) coTotalEl.textContent = cart.total.toFixed(2);
    const coTipEl = document.getElementById('co-nutrition-tip');
    const coTipText = document.getElementById('co-nutrition-text');
    if (coTipEl && coTipText) {
      const tip = getNutritionTip();
      if (tip) {
        coTipText.textContent = tip;
        coTipEl.style.display = 'inline-flex';
      } else {
        coTipEl.style.display = 'none';
      }
    }
    if (btn) {
      if (cart.total > 0) {
        btn.classList.remove('disabled');
      } else {
        btn.classList.add('disabled');
      }
    }

    // Update nutrition tip
    const tipEl = document.getElementById('nutrition-tip');
    const tipText = document.getElementById('nutrition-text');
    if (tipEl && tipText) {
      const tip = getNutritionTip();
      if (tip) {
        tipText.textContent = tip;
        tipEl.classList.remove('hidden');
      } else {
        tipEl.classList.add('hidden');
      }
    }

    // Update all qty controls
    document.querySelectorAll('.spec-qty-wrap').forEach(wrap => {
      const id = wrap.dataset.id;
      const qty = getCartQty(id);
      const ctrl = wrap.querySelector('.qty-ctrl');
      const numEl = wrap.querySelector('.spec-num');
      if (qty > 0) {
        ctrl.classList.remove('hidden');
        numEl.textContent = qty;
      } else {
        ctrl.classList.add('hidden');
      }
    });
  }

  function prepareOrderDetail() {
    const container = document.getElementById('order-detail-items');
    container.innerHTML = cart.items.map(item => `
      <div class="detail-product-row">
        <img src="${item.img}" alt="" class="detail-img" onerror="this.classList.add('placeholder')">
        <div class="detail-product-info">
          <div class="detail-product-name">
            <span class="discount-badge">折</span> ${item.name}
          </div>
          <div class="detail-spec">份 <span class="vip-badge-sm">会员价</span></div>
          <div class="detail-qty">x${item.qty}</div>
        </div>
        <div class="detail-prices">
          <span class="price-real">¥ ${(item.price * item.qty).toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    document.getElementById('order-detail-count-text').textContent = `共计${cart.items.reduce((acc, i) => acc + i.qty, 0)}道菜，实际金额`;
    document.getElementById('order-detail-final-price').textContent = `¥ ${cart.total.toFixed(2)}`;
  }

  /* ====== P1 cart bar 「下单并支付」→ P3 Chat ====== */
  document.querySelector('.cart-checkout-btn')?.addEventListener('click', () => {
    showPage('page-chat');
    setTimeout(startChatDemo, 400);
  });

  /* ====== P4 → P5: Settle → Payment (for P4 direct flow) ====== */
  document.getElementById('btn-settle')?.addEventListener('click', () => {
    document.getElementById('payment-modal').classList.remove('hidden');
  });

  /* ====== Payment Keypad Logic ====== */
  let keyPressCount = 0;
  document.querySelectorAll('.keypad-grid .key').forEach(key => {
    key.addEventListener('click', () => {
      if (key.classList.contains('del')) return;
      keyPressCount++;
      const dots = document.querySelectorAll('.keypad-input .dot');
      if (keyPressCount <= 6) {
        dots.forEach((d, i) => {
          if (i < keyPressCount) {
            d.className = 'dot';
            d.textContent = '●';
          }
        });
      }
      if (keyPressCount === 6) {
        setTimeout(() => {
          document.getElementById('payment-modal').classList.add('hidden');

          if (cart.items.length > 0) {
            renderMessage({ type: 'success-card' });
          } else {
            showPage('page-success');
          }

          keyPressCount = 0;
          document.querySelectorAll('.keypad-input .dot').forEach((d) => {
            d.className = 'dot empty';
            d.textContent = '○';
          });
        }, 500);
      }
    });
  });

  document.getElementById('btn-close-payment').addEventListener('click', () => {
    document.getElementById('payment-modal').classList.add('hidden');
  });

  /* ====== Chat Input ====== */
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && chatInput.value.trim()) {
        const text = chatInput.value.trim();
        chatInput.value = '';

        if (chatPhase === 1) {
          startChatPhase2(text);
        } else if (/优惠券|我的优惠券|有哪些可用的优惠券/.test(text)) {
          startCouponScene(text);
        } else {
          renderMessage({ type: 'user', text: text });
          setTimeout(() => {
            renderMessage({ type: 'agent', text: '好的，小喜为您查找中…请稍等～' });
          }, 600);
        }
      }
    });
  }

})();
