/* app.js - TwinStyle Collective (localStorage-based) */
/* Schema:
  ts_users => { email: { name, email, password, cart: [], orders: [] }, ... }
  ts_current => email or null
*/

const APP = (function(){
  const LS_USERS = 'ts_users';
  const LS_CURRENT = 'ts_current';

  // --------------------- AUTH SAFETY ADDED ---------------------
  function requireLogin(){
    const cur = getCurrent();
    const page = location.pathname.split('/').pop();

    // protect all pages except login/register
    if(!cur && page !== 'login.html' && page !== 'register.html'){
      window.location.href = 'login.html';
    }

    // if already login, block login/register pages
    if(cur && (page === 'login.html' || page === 'register.html')){
      window.location.href = 'index.html';
    }
  }
  // ================= AUTH LEVEL 2 =================
function checkAuthAction(){
  const cur = getCurrent();
  if(!cur){
    alert('Sesi tamat. Sila login semula.');
    window.location.href = 'login.html';
    return false;
  }
  const users = readUsers();
  if(!users[cur]){
    setCurrent(null); // paksa logout
    alert('User tidak wujud. Sila login semula.');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Pakai checkAuthAction() di semua tempat sensitif:
function addProductToCart(id, size, color, qty){
  if(!checkAuthAction()) return;
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const cur = getCurrent();
  const item = { id: p.id, title: p.title, price: p.price, size, color, qty, img: p.img };
  addToCart(cur, item);
  updateCartCounts();
  alert('Ditambah ke cart');
}

function placeOrderHandler(){
  if(!checkAuthAction()) return;
  // proceed placeOrder
}
  // --------------------------------------------------------------

  // Sample products (8)
  const PRODUCTS = [
    { id:'p1', title:'Aero Tee', price:89.00, colors:['Black','White','Olive'], sizes:['S','M','L','XL'], img:'images1.png' },
    { id:'p2', title:'Classic Shirt', price:129.00, colors:['Black','Grey','Blue'], sizes:['S','M','L','XL'], img:'images2.jpg' },
    { id:'p3', title:'Urban Hoodie', price:159.00, colors:['Black','Maroon','Navy'], sizes:['M','L','XL'], img:'images3.webp' },
    { id:'p4', title:'Relax Tee', price:79.00, colors:['White','Mustard','Black'], sizes:['S','M','L'], img:'images4.jpg' },
    { id:'p5', title:'Minimal Polo', price:139.00, colors:['Black','White','Green'], sizes:['S','M','L','XL'], img:'images5.webp' },
    { id:'p6', title:'Drop Shoulder Tee', price:99.00, colors:['Black','Grey','Beige'], sizes:['S','M','L','XL'], img:'images6.webp' },
    { id:'p7', title:'Tech Jacket', price:249.00, colors:['Black','Olive','Navy'], sizes:['M','L','XL'], img:'images7.jpg' },
    { id:'p8', title:'Staple Tee', price:69.00, colors:['White','Black','Rust'], sizes:['S','M','L'], img:'images8.webp' }
  ];

  /* ----------- Storage helpers ----------- */
  function readUsers(){ return JSON.parse(localStorage.getItem(LS_USERS) || '{}'); }
  function writeUsers(obj){ localStorage.setItem(LS_USERS, JSON.stringify(obj)); }
  function getCurrent(){ return localStorage.getItem(LS_CURRENT) || null; }
  function setCurrent(email){ if(email) localStorage.setItem(LS_CURRENT, email); else localStorage.removeItem(LS_CURRENT); }

  function ensureUser(email){
    const users = readUsers();
    if(!users[email]) {
      users[email] = { name: '', email, password: '', cart: [], orders: [] };
      writeUsers(users);
    }
  }

  /* ----------- Auth (register/login/logout) ----------- */
  function register(name,email,password){
    const users = readUsers();
    if(users[email]) return { ok:false, msg:'Email sudah wujud.' };
    users[email] = { name, email, password, cart: [], orders: [] };
    writeUsers(users);
    return { ok:true };
  }

  function login(email,password){
    const users = readUsers();
    if(!users[email]) return { ok:false, msg:'Email tidak wujud. Sila register.' };
    if(users[email].password !== password) return { ok:false, msg:'Password salah.' };
    setCurrent(email);
    return { ok:true };
  }

  function logout(){
    setCurrent(null);
  }

  /* ----------- Cart & orders ----------- */
  function addToCart(email, item){
    const users = readUsers();
    ensureUser(email);
    users[email].cart.push(item);
    writeUsers(users);
  }
  function getCart(email){ const users = readUsers(); ensureUser(email); return users[email].cart || []; }
  function setCart(email, cart){ const users = readUsers(); ensureUser(email); users[email].cart = cart; writeUsers(users); }
  function clearCart(email){ setCart(email, []); }

  function placeOrder(email, payment, reqText){
    const users = readUsers();
    ensureUser(email);
    const user = users[email];
    const order = { id: 'ORD' + Date.now(), items: user.cart.slice(), payment, reqText, date: new Date().toISOString() };
    user.orders = user.orders || [];
    user.orders.push(order);
    user.cart = [];
    writeUsers(users);
    return order;
  }

  /* ----------- UI Helpers (render) ----------- */

  function fmt(v){ return 'RM' + v.toFixed(2); }

  function renderHero(){
    const el = document.getElementById('heroSlides');
    if(!el) return;
    const slides = [
      { img: 'logo1.jpg'},
      { img: 'logo2.jpg'},
      { img: 'logo3.jpg'}
    ];
    el.innerHTML = '';
    slides.forEach((s,i)=>{
      const node = document.createElement('div');
      node.className = 'absolute inset-0 bg-cover bg-center transition-opacity duration-700';
      node.style.backgroundImage = `url('${s.img}')`;
      node.style.opacity = i===0? '1':'0';
      el.appendChild(node);
    });

    let idx = 0;
    setInterval(()=>{
      const children = Array.from(el.children);
      children.forEach((c, i)=> c.style.opacity = (i===idx? '1':'0'));
      idx = (idx+1) % children.length;
    }, 3000);
  }

  function renderFeatured(){
    const el = document.getElementById('featSlider');
    if(!el) return;
    const picks = PRODUCTS.slice(0,3);
    el.innerHTML = '';
    picks.forEach(p=>{
      const d = document.createElement('div');
      d.className = 'rounded-md overflow-hidden h-48 relative';
      d.innerHTML = `<img src="${p.img}" alt="${p.title}" class="w-full h-full object-cover">
      <div class="absolute bottom-2 left-2 bg-black/50 p-2 rounded-md">
        <div class="font-semibold">${p.title}</div>
        <div class="text-sm text-gray-200">${fmt(p.price)}</div>
      </div>`;
      el.appendChild(d);
    });
  }

  function renderProductsGrid(){
    const grid = document.getElementById('productsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    PRODUCTS.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'bg-white/5 p-4 rounded-md flex flex-col';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.title}" class="w-full h-44 object-cover rounded-md">
        <h3 class="mt-3 font-semibold">${p.title}</h3>
        <div class="text-twin font-bold mt-1">${fmt(p.price)}</div>
        <div class="mt-3 flex flex-col gap-2">
          <select data-id="${p.id}" class="sel-size p-2 rounded-md bg-black border border-white/10">
            ${p.sizes.map(s=>`<option value="${s}">${s}</option>`).join('')}
          </select>
          <select data-idc="${p.id}" class="sel-color p-2 rounded-md bg-black border border-white/10">
            ${p.colors.map(c=>`<option value="${c}">${c}</option>`).join('')}
          </select>
          <input data-qty="${p.id}" type="number" min="1" value="1" class="p-2 rounded-md bg-black border border-white/10">
          <button data-add="${p.id}" class="mt-2 bg-twin py-2 rounded-md text-black">Add to cart</button>
        </div>
      `;
      grid.appendChild(card);
    });

    document.querySelectorAll('[data-add]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const id = btn.getAttribute('data-add');
        const size = document.querySelector(`[data-id="${id}"]`).value;
        const color = document.querySelector(`[data-idc="${id}"]`).value;
        const qty = parseInt(document.querySelector(`[data-qty="${id}"]`).value || '1', 10);
        addProductToCart(id, size, color, qty);
      });
    });
  }

  function addProductToCart(id, size, color, qty){
    const cur = getCurrent();
    if(!cur){ alert('Sila login dahulu untuk tambah ke cart.'); window.location.href='login.html'; return; }
    const p = PRODUCTS.find(x=>x.id===id);
    if(!p) return;
    const item = { id: p.id, title: p.title, price: p.price, size, color, qty, img: p.img };
    addToCart(cur, item);
    updateCartCounts();
    alert('Ditambah ke cart');
  }

  function updateCartCounts(){
    const cur = getCurrent();
    const c = cur ? getCart(cur).length : 0;
    const els = [document.getElementById('cartCount'), document.getElementById('cartCount2')];
    els.forEach(el=>{ if(el) el.innerText = c; });
  }

  function showCartModal(modalId,itemContainerId,closeBtnId,clearBtnId){
    const modal = document.getElementById(modalId);
    if(!modal) return;
    const itemsEl = document.getElementById(itemContainerId);
    const closeBtn = document.getElementById(closeBtnId);
    const clearBtn = document.getElementById(clearBtnId);

    function render(){
      const cur = getCurrent();
      itemsEl.innerHTML = '';
      if(!cur){ itemsEl.innerHTML = '<div class="text-gray-300">Cart kosong (sila login)</div>'; return; }
      const cart = getCart(cur);
      if(cart.length===0){ itemsEl.innerHTML = '<div class="text-gray-300">Cart kosong</div>'; return; }
      cart.forEach((it, idx)=>{
        const el = document.createElement('div');
        el.className = 'flex items-center gap-3';
        el.innerHTML = `<img src="${it.img}" class="w-16 h-16 object-cover rounded-md">
          <div class="flex-1">
            <div class="font-semibold">${it.title}</div>
            <div class="text-sm text-gray-300">${it.size} · ${it.color}</div>
            <div class="text-sm">${it.qty} x ${fmt(it.price)}</div>
          </div>
          <button data-rem="${idx}" class="px-3 py-1 border rounded-md">Remove</button>`;
        itemsEl.appendChild(el);
      });

      itemsEl.querySelectorAll('[data-rem]').forEach(b=>{
        b.addEventListener('click', ()=> {
          const idx = parseInt(b.getAttribute('data-rem'),10);
          const cur = getCurrent();
          if(!cur) return;
          const cart = getCart(cur);
          cart.splice(idx,1);
          setCart(cur, cart);
          render();
          updateCartCounts();
        });
      });
    }

    render();
    modal.classList.remove('hidden');
    if(closeBtn) closeBtn.onclick = ()=> modal.classList.add('hidden');
    if(clearBtn) clearBtn.onclick = ()=>{
      const cur = getCurrent();
      if(!cur) { alert('Sila login'); return; }
      clearCart(cur); render(); updateCartCounts();
    };
  }

  function renderCheckoutPage(){
    const el = document.getElementById('checkoutItems');
    if(!el) return;
    const cur = getCurrent();
    if(!cur){ el.innerHTML = '<div class="text-gray-300">Sila login untuk checkout</div>'; return; }
    const cart = getCart(cur);
    el.innerHTML = '';
    let total = 0;

    cart.forEach((it, idx)=>{
      total += it.qty * it.price;
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3';
      row.innerHTML = `<img src="${it.img}" class="w-16 h-16 object-cover rounded-md">
        <div class="flex-1">
          <div class="font-semibold">${it.title}</div>
          <div class="text-sm text-gray-300">${it.size} · ${it.color}</div>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" min="1" value="${it.qty}" data-qtyidx="${idx}" class="w-16 p-1 rounded-md bg-gray-400 border border-white/10 text-black">
        </div>`;
      el.appendChild(row);
    });

    el.querySelectorAll('[data-qtyidx]').forEach(inp=>{
      inp.addEventListener('change', ()=>{
        const idx = parseInt(inp.getAttribute('data-qtyidx'),10);
        const v = Math.max(1, parseInt(inp.value||'1',10));
        const cart = getCart(cur);
        cart[idx].qty = v;
        setCart(cur, cart);
        renderCheckoutPage(); updateCartCounts();
      });
    });

    const subtotalEl = document.getElementById('subtotal');
    if(subtotalEl) subtotalEl.innerText = fmt(total);
  }

  function setupPlaceOrder(){
    const btn = document.getElementById('placeOrder');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const cur = getCurrent();
      if(!cur){ alert('Sila login dahulu'); window.location.href='login.html'; return; }
      const payment = document.querySelector('.radio-pay:checked');
      if(!payment){ alert('Sila pilih kaedah pembayaran'); return; }
      const req = document.getElementById('reqText') ? document.getElementById('reqText').value : '';
      const order = placeOrder(cur, payment.value, req);
      document.getElementById('checkoutMsg').innerText = 'Order placed! ID: ' + order.id;
      document.getElementById('checkoutMsg').classList.remove('hidden');
      renderCheckoutPage();
      updateCartCounts();
      setTimeout(()=>{ window.location.href='index.html'; }, 1400);
    });
  }

  function setupRegister(){
    const f = document.getElementById('registerForm');
    if(!f) return;
    f.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const pass = document.getElementById('regPassword').value;
      const res = register(name,email,pass);
      const msg = document.getElementById('regMsg');
      if(!res.ok){ if(msg){ msg.innerText = res.msg; msg.classList.remove('hidden'); } return; }
      ensureUser(email);
      alert('Registration successful. Please login.');
      window.location.href = 'login.html';
    });
  }

  function setupLogin(){
    const f = document.getElementById('loginForm');
    if(!f) return;
    f.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const pass = document.getElementById('loginPassword').value;
      const res = login(email,pass);
      const msg = document.getElementById('loginMsg');
      if(!res.ok){ if(msg){ msg.innerText = res.msg; msg.classList.remove('hidden'); } return; }
      window.location.href = 'index.html';
    });
  }

  function setupContact(){
    const f = document.getElementById('contactFormHome');
    if(!f) return;
    f.addEventListener('submit', (e)=>{
      e.preventDefault();
      alert('Message sent. We will contact you soon.');
      f.reset();
    });
  }

  function init(){

    requireLogin();  // ---------------- AUTH SAFETY APPLY HERE

    renderHero();
    renderFeatured();
    renderProductsGrid();
    updateCartCounts();

    const cb = document.getElementById('cartBtn');
    if(cb) cb.onclick = ()=> showCartModal('cartModal','cartItems','closeCart','clearCart');
    const cb2 = document.getElementById('cartBtn2');
    if(cb2) cb2.onclick = ()=> showCartModal('cartModal2','cartItems2','closeCart2','clearCart2');

    setupRegister();
    setupLogin();
    setupContact();
    setupPlaceOrder();
    renderCheckoutPage();

    const cur = getCurrent();
    if(cur){
      const users = readUsers();
      const name = (users[cur] && users[cur].name) ? users[cur].name : cur;
      document.querySelectorAll('#authBtn, #authBtn2, #mobileAuth').forEach(el=>{
        if(el) {
          el.innerText = 'Hi, ' + (name.split(' ')[0]||name);
          el.href = '#';
          el.onclick = (ev)=>{
            ev.preventDefault();
            if(confirm('Logout?')){
              logout();
              updateCartCounts();
              window.location.href='index.html';
            }
          }
        }
      });
    }

    const ham = document.getElementById('hamburger');
    if(ham){
      ham.onclick = ()=>{
        const m = document.getElementById('mobileNav');
        if(m) m.classList.toggle('hidden');
      };
    }

    renderProductsGrid();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', APP.init);
