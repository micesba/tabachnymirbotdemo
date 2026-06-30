const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes?.();
}

const categories = [
  'Все','Сигареты','Табак','Табак для кальяна','Сигариллы','Электронки','Кальяны','Аксессуары','Собственный табак'
];

const demoProducts = [
  {id:'cigs-1',title:'Сигареты оптом',category:'Сигареты',price:'Прайс по запросу',desc:'Популярные позиции для магазинов. Наличие уточняет менеджер.',emoji:'🚬',badge:'Опт'},
  {id:'tob-1',title:'Табак ассортимент',category:'Табак',price:'Прайс по запросу',desc:'Разные бренды и форматы. Подбор под объём закупки.',emoji:'📦',badge:'Прайс'},
  {id:'hookah-1',title:'Табак для кальяна',category:'Табак для кальяна',price:'Уточнить',desc:'В рабочей версии добавим вкусы, фасовки и фото.',emoji:'💨',badge:'Хит'},
  {id:'own-1',title:'Собственный табак',category:'Собственный табак',price:'Уточнить',desc:'Отдельный раздел под собственную линейку и партнёрские условия.',emoji:'🏷️',badge:'Бренд'},
  {id:'cigar-1',title:'Сигариллы',category:'Сигариллы',price:'Уточнить',desc:'Категория для оптового запроса и прайса.',emoji:'🟤',badge:'Категория'},
  {id:'vape-1',title:'Электронные устройства',category:'Электронки',price:'Уточнить',desc:'Вейпы, одноразовые устройства и расходники.',emoji:'⚡',badge:'Наличие'},
  {id:'hookah-2',title:'Кальяны',category:'Кальяны',price:'Уточнить',desc:'Кальяны и комплектующие для торговых точек.',emoji:'🧿',badge:'Опт'},
  {id:'acc-1',title:'Уголь и аксессуары',category:'Аксессуары',price:'Уточнить',desc:'Уголь, чаши, шланги, колбы и сопутствующие товары.',emoji:'🧰',badge:'Склад'},
  {id:'acc-2',title:'Бонги и комплектующие',category:'Аксессуары',price:'Уточнить',desc:'Демо-карточка. Можно заменить на реальные товары.',emoji:'🔧',badge:'Демо'},
  {id:'price',title:'Получить полный прайс',category:'Все',price:'Бесплатно',desc:'Оставьте контакты, менеджер отправит актуальный прайс.',emoji:'📄',badge:'Прайс'}
];

let state = {
  category: 'Все',
  search: '',
  sort: 'default',
  cart: JSON.parse(localStorage.getItem('tm_cart') || '[]')
};

const $ = (s) => document.querySelector(s);
const grid = $('#productGrid');
const chips = $('#categoryChips');
const toast = $('#toast');
const cartPanel = $('#cartPanel');
const checkoutForm = $('#checkoutForm');
const keyboardDone = $('#keyboardDone');
const keyboardHide = $('#keyboardHide');

function isEditable(el = document.activeElement) {
  if (!el) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable;
}

function hideKeyboard() {
  if (isEditable()) document.activeElement.blur();
  document.body.classList.remove('keyboard-open');
  keyboardDone?.classList.remove('show');
  window.scrollTo({ top: window.scrollY, behavior: 'instant' });
}

function showKeyboardDone() {
  if (!isEditable()) return;
  document.body.classList.add('keyboard-open');
  keyboardDone?.classList.add('show');
}

function scrollActiveInputIntoView() {
  const el = document.activeElement;
  if (!isEditable(el)) return;
  setTimeout(() => {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 250);
}

function showToast(text){
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 2200);
}

function saveCart(){
  localStorage.setItem('tm_cart', JSON.stringify(state.cart));
  updateCart();
}

function renderChips(){
  chips.innerHTML = categories.map(c => `<button class="chip ${state.category===c?'active':''}" data-cat="${c}">${c}</button>`).join('');
  chips.querySelectorAll('.chip').forEach(btn => btn.onclick = () => {
    hideKeyboard();
    state.category = btn.dataset.cat;
    renderAll();
  });
}

function filteredProducts(){
  let list = demoProducts.filter(p => state.category === 'Все' || p.category === state.category || p.id === 'price');
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    list = list.filter(p => `${p.title} ${p.category} ${p.desc}`.toLowerCase().includes(q));
  }
  if (state.sort === 'priceAsc') list.sort((a,b)=>(parseInt(a.price)||999999)-(parseInt(b.price)||999999));
  if (state.sort === 'priceDesc') list.sort((a,b)=>(parseInt(b.price)||0)-(parseInt(a.price)||0));
  return list;
}

function renderProducts(){
  const items = filteredProducts();
  grid.innerHTML = items.map(p => `
    <article class="card">
      <div class="thumb">${p.emoji}</div>
      <div class="cardBody">
        <span class="badge">${p.badge}</span>
        <h3>${p.title}</h3>
        <div class="desc">${p.desc}</div>
        <div class="price">${p.price}</div>
        <div class="cardActions">
          <button class="add" data-add="${p.id}">В заявку</button>
          <button class="details" data-detail="${p.id}">Подробнее</button>
        </div>
      </div>
    </article>`).join('');
  grid.querySelectorAll('[data-add]').forEach(btn => btn.onclick = () => {
    hideKeyboard();
    addToCart(btn.dataset.add);
  });
  grid.querySelectorAll('[data-detail]').forEach(btn => btn.onclick = () => {
    hideKeyboard();
    showDetails(btn.dataset.detail);
  });
}

function showDetails(id){
  const p = demoProducts.find(x=>x.id===id);
  showToast(`${p.title}: в полной версии тут будет карточка с фото, ценой, наличием и вариантами.`);
}

function addToCart(id){
  const p = demoProducts.find(x=>x.id===id);
  if(!state.cart.find(x=>x.id===id)) state.cart.push({...p, qty:1});
  else state.cart = state.cart.map(x=>x.id===id ? {...x, qty:x.qty+1} : x);
  saveCart();
  showToast('Добавлено в заявку');
}

function updateCart(){
  $('#cartCount').textContent = state.cart.reduce((s,x)=>s+x.qty,0);
  const items = $('#cartItems');
  $('#cartEmpty').style.display = state.cart.length ? 'none' : 'block';
  items.innerHTML = state.cart.map(item => `
    <div class="cartItem">
      <div><b>${item.title}</b><br><small>${item.category} • ${item.price} • x${item.qty}</small></div>
      <button data-remove="${item.id}">Удалить</button>
    </div>`).join('');
  items.querySelectorAll('[data-remove]').forEach(btn => btn.onclick = () => {
    hideKeyboard();
    state.cart = state.cart.filter(x=>x.id!==btn.dataset.remove);
    saveCart();
  });
}

function renderAll(){
  renderChips();
  renderProducts();
  updateCart();
}

function openCart(prefill=''){
  hideKeyboard();
  cartPanel.classList.add('open');
  cartPanel.setAttribute('aria-hidden','false');
  document.body.classList.add('cart-open');
  if(prefill) document.querySelector('[name="comment"]').value = prefill;
  setTimeout(() => cartPanel.scrollTo({ top: cartPanel.scrollHeight, behavior: 'smooth' }), 120);
}

function closeCart(){
  hideKeyboard();
  cartPanel.classList.remove('open');
  cartPanel.setAttribute('aria-hidden','true');
  document.body.classList.remove('cart-open');
}

function sendLead(type){
  openCart(type);
}

function validateBeforeSend() {
  const fd = new FormData(checkoutForm);
  const name = (fd.get('name') || '').trim();
  const city = (fd.get('city') || '').trim();
  const contact = (fd.get('contact') || '').trim();
  if (!name || !city || !contact) {
    showToast('Заполните имя, город и контакт');
    return false;
  }
  return true;
}

$('#searchInput').oninput = (e)=>{ state.search=e.target.value; renderProducts(); };
$('#searchInput').addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') { e.preventDefault(); hideKeyboard(); renderProducts(); }
});
$('#sortSelect').onchange = (e)=>{ hideKeyboard(); state.sort=e.target.value; renderProducts(); };
$('#openCart').onclick = () => openCart();
$('#closeCart').onclick = closeCart;
keyboardDone?.addEventListener('click', hideKeyboard);
keyboardHide?.addEventListener('click', hideKeyboard);

document.querySelectorAll('[data-scroll]').forEach(btn => btn.onclick = () => {
  hideKeyboard();
  document.getElementById(btn.dataset.scroll).scrollIntoView({behavior:'smooth'});
});

document.querySelectorAll('[data-action]').forEach(btn => btn.onclick = () => {
  hideKeyboard();
  const map = {price:'Хочу получить полный оптовый прайс', order:'Хочу оформить оптовый заказ', brand:'Интересует собственный табак', partner:'Хочу узнать условия партнёрства', manager:'Хочу связаться с менеджером'};
  sendLead(map[btn.dataset.action] || 'Заявка');
});

checkoutForm.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const fields = [...checkoutForm.querySelectorAll('input, textarea')];
  const i = fields.indexOf(e.target);
  if (e.target.tagName === 'TEXTAREA') {
    e.preventDefault();
    hideKeyboard();
    return;
  }
  if (i > -1 && i < fields.length - 1) {
    e.preventDefault();
    fields[i + 1].focus();
    scrollActiveInputIntoView();
  }
});

checkoutForm.onsubmit = (e)=>{
  e.preventDefault();
  if (!validateBeforeSend()) return;
  hideKeyboard();

  const submitBtn = checkoutForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправляем...';

  const form = Object.fromEntries(new FormData(e.target).entries());
  const payload = {
    type: 'tabachny_mir_demo_order',
    client: form,
    items: state.cart.map(x=>({title:x.title, category:x.category, price:x.price, qty:x.qty})),
    createdAt: new Date().toISOString()
  };

  try {
    if (tg && tg.sendData) {
      tg.sendData(JSON.stringify(payload));
      showToast('Заявка отправлена');
    } else {
      console.log('DEMO ORDER', payload);
      showToast('Демо-заявка сформирована. В Telegram она уйдёт менеджеру.');
    }
    state.cart = [];
    saveCart();
    closeCart();
    e.target.reset();
  } catch (err) {
    console.error(err);
    showToast('Не удалось отправить. Попробуйте ещё раз.');
  } finally {
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку менеджеру';
    }, 900);
  }
};

$('#ageYes').onclick = () => {
  localStorage.setItem('tm_age_ok','1');
  $('#ageGate').classList.add('hidden');
};
$('#ageNo').onclick = () => {
  document.body.innerHTML = '<div style="display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center"><div><h1>Доступ ограничен</h1><p style="color:#8ea0b6">Каталог доступен только для пользователей 18+.</p></div></div>';
};
if(localStorage.getItem('tm_age_ok') === '1') $('#ageGate').classList.add('hidden');

document.addEventListener('focusin', (e) => {
  if (isEditable(e.target)) {
    showKeyboardDone();
    scrollActiveInputIntoView();
  }
});
document.addEventListener('focusout', () => {
  setTimeout(() => {
    if (!isEditable()) {
      document.body.classList.remove('keyboard-open');
      keyboardDone?.classList.remove('show');
    }
  }, 80);
});

document.addEventListener('touchstart', (e) => {
  if (!isEditable()) return;
  const target = e.target;
  const insideEditable = target.closest?.('input, textarea, select');
  const insideDone = target.closest?.('#keyboardDone, #keyboardHide');
  if (!insideEditable && !insideDone) hideKeyboard();
}, { passive: true });

window.addEventListener('resize', () => {
  if (isEditable()) scrollActiveInputIntoView();
});

renderAll();
