'use client';
import React,{useEffect,useRef,useState} from 'react';
import {ShoppingBag,Search,ShoppingCart,ChevronDown,ChevronRight,ArrowRight,MapPin,ShieldCheck,Truck,Headphones,Heart,User,Package, X,Plus,Minus,Trash2,ArrowLeft,Check,Star,SlidersHorizontal,Zap,Monitor,Shirt,Watch,Armchair,Sparkles,Grid2X2,LogOut,LayoutDashboard,ClipboardList,Users,BarChart3,Tag,Upload,Mail,Phone,CheckCircle2,Menu,Download,RefreshCw,Clock,Copy} from 'lucide-react';
import {statusLabels as labels} from './catalog';
type P={images?:string[];id:string;category_id:string;name:string;price:number;old_price:number;stock:number;image:string;description:string;status:string;sold:number;rating:string;quantity?:number};
const rp=(n:number)=>'Rp'+Number(n).toLocaleString('id-ID');
const randomRequestKey = () => Array.from(crypto.getRandomValues(new Uint8Array(16)),
    value => value.toString(16).padStart(2, '0')).join('');
const escCSV=(x:any)=>'"'+String(x??'').replaceAll('"','""')+'"';
const catsIcon:Record<string,any>={elektronik:Monitor,fashion:Shirt,aksesoris:Watch,rumah:Armchair,kecantikan:Sparkles};
const catsImage:Record<string,string>={elektronik:'headphones',fashion:'nike',aksesoris:'watch',rumah:'tumbler',kecantikan:'serum'};
type InitialAuth = {
    mode: 'login' | 'register';
    values: Record<string, unknown>;
    error?: string;
    errors: Record<string, string>;
};

export default function ShopEase({ initialPage, initialAuth, demoAccounts }: { initialPage: string; initialAuth: InitialAuth | null; demoAccounts: boolean }) {
const initialValue = (field: string) => {
    const value = initialAuth?.values[field];
    return typeof value === 'string' ? value : '';
};
const authPassword = useRef<HTMLInputElement>(null);
const [formErrors, setFormErrors] = useState(initialAuth?.errors ?? {});
const [addressEdit, setAddressEdit] = useState<any>(null);
const fieldError = (field: string) => formErrors[field] ? <small className="auth-field-error">{formErrors[field]}</small> : null;
const [products,setProducts]=useState<P[]>([]),[categories,setCategories]=useState<any[]>([]),[user,setUser]=useState<any>(null),[csrf,setCsrf]=useState(''),[rememberAvailable,setRememberAvailable]=useState(false),[ready,setReady]=useState(false),[page,setPage]=useState(initialAuth ? 'auth' : initialPage),[modal,setModal]=useState(''),[selected,setSelected]=useState<any>(null),[cart,setCart]=useState<P[]>([]),[orders,setOrders]=useState<any[]>([]),[addresses,setAddresses]=useState<any[]>([]),[addressId,setAddressId]=useState(''),[query,setQuery]=useState(''),[category,setCategory]=useState('all'),[sort,setSort]=useState('recommended'),[pagination,setPagination]=useState(1),[qty,setQty]=useState(1),[saved,setSaved]=useState<string[]>([]),[toast,setToast]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(initialAuth?.error ?? ''),[authTab,setAuthTab]=useState<string>(initialAuth?.mode ?? 'login'),[authEmail,setAuthEmail]=useState(initialValue('email')),[adminTab,setAdminTab]=useState('overview'),[overview,setOverview]=useState<any>(null),[edit,setEdit]=useState<any>(null),[filterStatus,setFilterStatus]=useState('all'),[reportStart,setReportStart]=useState(''),[reportEnd,setReportEnd]=useState(''),[courier,setCourier]=useState('regular'),[checkoutKey,setCheckoutKey]=useState(''),[seconds,setSeconds]=useState(3*3600+42*60+18),[pendingAdd,setPendingAdd]=useState<P|null>(null);
function notify(m:string){setToast(m);setTimeout(()=>setToast(''),4000)}
const activeAccount = useRef('');
const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
const pendingPage = useRef('');
const sessionRequest = useRef<Promise<void> | null>(null);

function clearPrivateState() {
    setCart([]); setOrders([]); setAddresses([]); setAddressId('');
    setOverview(null); setSelected(null); setEdit(null); setAdminTab('overview');
    setCheckoutKey(''); setPendingAdd(null); setModal('');
}

function signalSessionChange() {
    try { localStorage.setItem('shopease-session-changed', randomRequestKey()); } catch {}
}

function applyAccount(account: any) {
    const identity = account ? String(account.id_user ?? account.id) + ':' + account.role : '';
    if (identity !== activeAccount.current) {
        clearPrivateState();
        setProducts([]); setCategories([]);
        activeAccount.current = identity;
        setUser(account);
    }
}

function syncSession(): Promise<void> {
    if (sessionRequest.current) return sessionRequest.current;
    const request = (async () => {
        const requestedIdentity = activeAccount.current;
        const response = await fetch('/api/session', { cache: 'no-store' });
        if (!response.ok) throw new Error('Status sesi belum bisa diperiksa.');
        const data = await response.json();
        if (requestedIdentity !== activeAccount.current) return;
        const previous = activeAccount.current;
        applyAccount(data.user);
        setCsrf(data.csrf);
        setRememberAvailable(Boolean(data.rememberAvailable));
        if (data.user?.role === 'customer' && previous !== activeAccount.current) {
            const identity = activeAccount.current;
            const cartResponse = await fetch('/api/cart', { cache: 'no-store' });
            if (cartResponse.ok) {
                const rows = await cartResponse.json();
                if (activeAccount.current === identity) setCart(rows);
            }
        }
    })();
    sessionRequest.current = request;
    return request.finally(() => {
        if (sessionRequest.current === request) sessionRequest.current = null;
    });
}

async function api(path:string,b?:any,form?:FormData) {
    const identity = activeAccount.current;
    const response = await fetch('/api/'+path, {
        method: b!==undefined||form ? 'POST' : 'GET',
        headers: { ...(form ? {} : b!==undefined ? {'Content-Type':'application/json'} : {}), 'X-CSRF-Token': csrf },
        body: form || (b!==undefined ? JSON.stringify(b) : undefined),
        cache: 'no-store',
    });
    if ((response.status === 401 && !path.startsWith('auth/')) || response.status === 403) {
        await syncSession().catch(() => {});
    }
    const data = await response.json().catch(() => ({}));
    if (identity !== activeAccount.current) throw new Error('Sesi akun berubah. Silakan ulangi tindakan.');
    if (!response.ok) {
        if (path === 'auth/register' && data.fields) setFormErrors(data.fields);
        throw new Error(data.error || 'Permintaan tidak dapat diproses.');
    }
    return data;
}
async function run(fn:()=>Promise<any>){setBusy(true);setError('');try{await fn()}catch(e:any){setError(e.message);notify(e.message)}finally{setBusy(false)}}
async function loadCatalog(admin=false){const d=await api(admin?'admin/catalog':'catalog');setProducts(d.products);setCategories(d.categories)}
async function loadCart(){try{setCart(await api('cart'))}catch{setCart([])}}
useEffect(() => {
    const readRoute = () => {
        const route = location.pathname.replace(/\/$/, '');
        const authRoute = route === '/login' || route === '/register';
        const path = route === '/admin' || route === '/operator' ? 'admin' : authRoute ? route.slice(1) : location.hash.slice(1) || (route ? initialPage : 'home');
        if (path === 'login' || path === 'register') {
            setAuthTab(path); setPage('auth'); setModal('');
        } else if (['home','catalog','about','contact','orders','cart','checkout','wishlist','admin','profile','dashboard'].includes(path)) {
            setPage(path);
        }
    };
    const refreshSession = () => {
        if (document.visibilityState === 'visible') syncSession().catch(() => {});
    };
    (async () => {
        const sessionResult = await Promise.allSettled([syncSession()]);
        const failed = sessionResult.find(result => result.status === 'rejected');
        if (failed?.status === 'rejected') setError(failed.reason.message);
        setReady(true);
    })();
    try { setSaved(JSON.parse(localStorage.getItem('shopease-saved') || '[]')); } catch {}
    if (location.hash === '#checkout') history.replaceState(null, '', '#cart');
    readRoute();
    window.addEventListener('hashchange', readRoute);
    window.addEventListener('popstate', readRoute);
    window.addEventListener('focus', refreshSession);
    window.addEventListener('pageshow', refreshSession);
    const onStorage = (event: StorageEvent) => {
        if (event.key === 'shopease-session-changed') refreshSession();
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', refreshSession);
    const timer = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => {
        clearInterval(timer);
        window.removeEventListener('hashchange', readRoute);
        window.removeEventListener('popstate', readRoute);
        window.removeEventListener('focus', refreshSession);
        window.removeEventListener('pageshow', refreshSession);
        window.removeEventListener('storage', onStorage);
        document.removeEventListener('visibilitychange', refreshSession);
    };
}, []);

const modalBusy = useRef(false);
useEffect(() => { modalBusy.current = busy; }, [busy]);
useEffect(() => {
    if (!modal) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previous = document.activeElement;
    const dialog = document.querySelector<HTMLElement>('.shop-modal');
    dialog?.focus();
    const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && !modalBusy.current) setModal('');
        if (event.key !== 'Tab' || !dialog) return;
        const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary'
        )).filter(element => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog) && last) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last && first) {
            event.preventDefault(); first.focus();
        }
    };
    document.addEventListener('keydown', onKey);
    return () => {
        document.body.style.overflow = oldOverflow;
        document.removeEventListener('keydown', onKey);
        if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
}, [modal]);

const customerPage = page === 'cart' || page === 'checkout';
const staffPage = page === 'admin';
const staff = user?.role === 'admin' || user?.role === 'operator';
const canUseStorefront = !staff;
useEffect(() => {
    if (ready && canUseStorefront) loadCatalog().catch(error => setError(error.message));
}, [ready, canUseStorefront, user?.id_user]);

const protectedPage = customerPage || staffPage || page === 'orders' || page === 'profile' || page === 'dashboard';
const allowed = staff ? ['admin', 'profile'].includes(page) : !protectedPage || (user && !staffPage);

useEffect(() => {
    if (!ready || allowed) return;
    if (staff) {
        go('admin');
    } else if (!user) {
        pendingPage.current = page === 'checkout' ? 'cart' : page;
        go('home');
        openAuth('login');
    } else {
        go('home');
        notify('Akun ini tidak memiliki akses ke halaman tersebut.');
    }
}, [ready, page, user, allowed]);
useEffect(()=>{if(!user||!allowed)return;if(page==='orders'||page==='dashboard')run(async()=>setOrders(await api('orders')));if(page==='admin'&&['admin','operator'].includes(user.role))run(async()=>{setOverview(await api('admin/overview'));if(user.role==='admin')await loadCatalog(true)})},[page,user]);
function go(p:string) {
    const role = activeAccount.current.split(':').at(-1);
    const staffRole = role === 'admin' || role === 'operator';
    const target = staffRole && !['admin', 'profile'].includes(p) ? 'admin' : p;
    const url = staffRole && target === 'admin' ? '/' + role : '/#' + target;
    setError(''); setPage(target); setModal('');
    if (location.pathname + location.hash !== url) history.pushState(null, '', url);
    window.scrollTo({top: 0});
}
function openAuth(mode: 'login' | 'register') {
    setError('');
    setFormErrors({});
    setModal('');
    setAuthTab(mode);
    setPage('auth');
    if (location.pathname !== '/' + mode) history.pushState(null, '', '/' + mode);
    window.scrollTo({ top: 0 });
}
function browse(c='all'){setCategory(c);setPagination(1);go('catalog')}
function wish(id:string){setSaved(v=>{const n=v.includes(id)?v.filter(x=>x!==id):[...v,id];localStorage.setItem('shopease-saved',JSON.stringify(n));return n})}
function showProduct(p:P){setSelected(p);setQty(1);setModal('product');setError('')}
async function add(p:P,n=1){if(!user){setPendingAdd(p);openAuth('login');return}await run(async()=>{if(user.role!=='customer')throw new Error('Gunakan akun customer untuk berbelanja.');const old=cart.find(x=>x.id===p.id)?.quantity||0;setCart(await api('cart',{product_id:p.id,quantity:old+n}));notify('Produk ditambahkan ke keranjang');setModal('')})}
async function changeQty(p:P,n:number){await run(async()=>setCart(await api('cart',{product_id:p.id,quantity:n})))}
function requireLogin(p:string){
    if(!user){pendingPage.current=p;openAuth('login');notify('Masuk untuk melanjutkan');return}
    if((p==='cart'||p==='checkout')&&user.role!=='customer'){notify('Keranjang tersedia untuk customer.');return}
    go(p);
}
async function startCheckout(){await run(async()=>{const a=await api('addresses');setAddresses(a);setAddressId(a[0]?.id||'');setCheckoutKey(randomRequestKey());go('checkout')})}
const count=cart.reduce((s,p)=>s+(p.quantity||0),0),subtotal=cart.reduce((s,p)=>s+p.price*(p.quantity||0),0),shipping=String(addresses.find(a=>a.id===addressId)?.city||'').trim().toLowerCase()==='surabaya'?0:courier==='express'?25000:courier==='sicepat_reg'?12000:15000;
let filtered=products.filter(p=>p.status==='active'&&(category==='all'||p.category_id===category)&&p.name.toLowerCase().includes(query.toLowerCase()));if(sort==='price-asc')filtered.sort((a,b)=>a.price-b.price);if(sort==='price-desc')filtered.sort((a,b)=>b.price-a.price);if(sort==='popular')filtered.sort((a,b)=>b.sold-a.sold);if(sort==='new')filtered.reverse();
const featured=['sony-xm5','nike-af1','airpods-pro','kanken','stanley','ordinary'].map(id=>products.find(p=>p.id===id)).filter(Boolean) as P[];
async function detailOrder(id:string){await run(async()=>{setSelected(await api('orders/'+id));setModal('order')})}
async function actionOrder(action:string,extra:any={}){await run(async()=>{const d=await api('order-action',{order_id:selected.id,action,...extra});setSelected(d);notify('Pesanan berhasil diperbarui');if(page==='orders')setOrders(await api('orders'));if(page==='admin')setOverview(await api('admin/overview'))})}
function status(s:string){return <span className={'status '+s}>{labels[s]||s}</span>}
function Card({p,flash=false}:{p:P;flash?:boolean}){const discount=p.old_price>0?Math.max(0,Math.round((1-p.price/p.old_price)*100)):0;return <article className="product-card"><div className="product-photo"><button className="image-button" onClick={()=>showProduct(p)} aria-label={'Lihat '+p.name}><img src={p.image} alt={p.name} loading="lazy"/></button>{discount>0&&<span className="discount">-{discount}%</span>}<button className={'favorite '+(saved.includes(p.id)?'is-saved':'')} onClick={()=>wish(p.id)} aria-label="Simpan produk"><Heart size={16} fill={saved.includes(p.id)?'currentColor':'none'}/></button></div><div className="product-body"><span className="official"><ShieldCheck size={11}/> ShopEase Pilihan</span><button className="product-title" onClick={()=>showProduct(p)}>{p.name}</button><strong className="price">{rp(p.price)}</strong><div className="old-price">{rp(p.old_price)} <span>Hemat {discount}%</span></div><div className="rating"><Star size={12} fill="currentColor"/><b>{p.rating}</b><span> | Terjual {p.sold}</span></div>{flash&&<div className="sale-progress"><i style={{width:Math.min(92,p.sold/10)+'%'}}/><span>Segera dapatkan</span></div>}<div className="card-bottom"><span><MapPin size={11}/> Jakarta Pusat</span><button onClick={()=>add(p)} aria-label={'Tambah '+p.name} disabled={busy||p.stock<1}><Plus size={17}/></button></div></div></article>}
const nav=[['home','Beranda'],['catalog','Semua Produk'],['promo','Promo Pilihan'],['about','Tentang Kami'],['contact','Hubungi Kami']];
const adminMenu=[['overview','Ringkasan',LayoutDashboard],['products','Produk',Package],['categories','Kategori',Grid2X2],['orders','Pesanan',ClipboardList],['payments','Pembayaran',ShieldCheck],['shipments','Pengiriman',Truck],['customers','Pelanggan',Users],['reports','Laporan',BarChart3],['messages','Pesan Masuk',Mail]];
const managementMenu = adminMenu.filter(([id]) => user?.role === 'admin'
    || (user?.role === 'operator' && ['overview', 'products', 'categories', 'orders', 'shipments'].includes(String(id))));
const managementPanel = managementMenu.find(([id]) => id === adminTab)?.[0] ?? 'overview';

function selectManagementPanel(panel: string, status = 'all') {
    if (!managementMenu.some(([id]) => id === panel)) return;
    if (panel === 'products' || panel === 'categories') { window.location.assign('/admin/' + panel); return; }
    setAdminTab(panel);
    setFilterStatus(status);
    setPagination(1);
    setQuery('');
    setReportStart('');
    setReportEnd('');
}

const panelStatuses = managementPanel === 'payments'
    ? ['unpaid', 'submitted', 'verified', 'rejected']
    : managementPanel === 'shipments'
        ? ['processing', 'shipped', 'completed']
        : ['pending_payment', 'waiting_verification', 'processing', 'shipped', 'completed', 'cancelled'];

return <>{!ready ? null : staff ? <header className="site-header staff-header">
    <div className="container staff-header-inner">
        <button className="brand" onClick={()=>go('admin')}><span className="brand-icon"><LayoutDashboard size={23}/></span>Shop<span>Ease</span><b>.</b></button>
        <span className="staff-role">{user.role==='admin'?'Administrator':'Operator'}</span>
        <button className="account-btn" onClick={()=>setModal('account')}><span className="avatar">{user.name[0]}</span><span>{user.name.split(' ')[0]}</span><ChevronDown size={13}/></button>
    </div>
</header> : <><div className="topbar"><div className="container top-inner"><span><Truck size={13}/> Belanja lebih hemat, kirim ke seluruh Indonesia</span><div><button onClick={()=>go('about')}>Tentang ShopEase</button><i/><button onClick={()=>go('contact')}>Pusat Bantuan</button><i/><span>Bahasa Indonesia <ChevronDown size={12}/></span></div></div></div>
<header className="site-header"><div className="container header-main"><button className="brand" onClick={()=>go('home')}><span className="brand-icon"><ShoppingBag size={28}/></span>Shop<span>Ease</span><b>.</b></button><form className="search" onSubmit={e=>{e.preventDefault();setPagination(1);go('catalog')}}><Search size={19}/><input aria-label="Cari produk" placeholder="Cari barang favoritmu di sini..." value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit">Cari</button></form><div className="header-actions"><button title="Wishlist" aria-label="Wishlist" className="icon-btn" onClick={()=>go('wishlist')}><Heart size={23}/></button><button title="Keranjang" aria-label="Keranjang" className="icon-btn cart-icon" onClick={()=>requireLogin('cart')}><ShoppingCart size={23}/>{count>0&&<span>{count}</span>}</button><i/>{user?<button className="account-btn" onClick={()=>setModal('account')}><span className="avatar">{user.name[0]}</span><span>{user.name.split(' ')[0]}<small>{user.role==='customer'?'Akun saya':'Kelola toko'}</small></span><ChevronDown size={13}/></button>:<><a className="login-link" href="/login" onClick={event=>{event.preventDefault();openAuth('login')}}>Masuk</a><a className="btn primary small" href="/register" onClick={event=>{event.preventDefault();openAuth('register')}}>Daftar</a></>}</div></div><div className="container nav-row"><div className="nav-links">{nav.map(([p,l])=><button key={p} className={(page===p?'active ':'')+(p==='promo'?'promo-link':'')} onClick={()=>p==='promo'?(()=>{go('home');setTimeout(()=>document.getElementById('flash')?.scrollIntoView({behavior:'smooth'}),100)})():go(p)}>{p==='promo'&&<Zap size={14}/>} {l}{p==='promo'&&<span className="tiny-badge">HOT</span>}</button>)}</div><button className="delivery" onClick={()=>user?run(async()=>{setAddresses(await api('addresses'));setModal('addresses')}):openAuth('login')}><MapPin size={15}/><span>Kirim ke <b>{addresses[0]?.city||'Jakarta Pusat'}</b></span><ChevronDown size={13}/></button></div></header><nav className="mobile-quick-links container" aria-label="Tautan cepat">
    <button type="button" onClick={()=>go('wishlist')}><Heart size={16}/> Favorit</button>
    <button type="button" onClick={()=>go('contact')}><Mail size={16}/> Bantuan</button>
</nav>
</>}

<main>
{page==='auth' ? <section className="auth-landing container">
    <section className="auth-page-card" aria-label="Formulir akun">
<div className="auth-page-heading">
    <h1>{authTab==='login'?'Masuk ke ShopEase':'Buat akun ShopEase'}</h1>
    <p>{authTab==='login'?'Lanjutkan belanja dan lihat pesananmu.':'Simpan alamat pengiriman dan lacak pesananmu.'}</p>
</div>
<nav className="auth-tabs auth-page-tabs" aria-label="Akses akun">
    <a href="/login" aria-current={authTab==='login'?'page':undefined} onClick={event=>{event.preventDefault();openAuth('login')}}>Masuk</a>
    <a href="/register" aria-current={authTab==='register'?'page':undefined} onClick={event=>{event.preventDefault();openAuth('register')}}>Daftar</a>
</nav>
{error && <p className="auth-page-error" role="alert">{error}</p>}
<form key={authTab} className="auth-page-form" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const b=Object.fromEntries(new FormData(form));setFormErrors({});run(async()=>{const d=await api('auth/'+authTab,b);if(authTab==='register'){form.reset();setAuthEmail(String(b.email||'').trim().toLowerCase());openAuth('login');notify(d.message);return}const queued = pendingAdd;applyAccount(d.user);signalSessionChange();setModal('');notify('Selamat datang, '+d.user.name);if(d.user.role!=='customer'){go('admin');return}else{setCart(await api('cart'));if(queued){const old=await api('cart');setCart(await api('cart',{product_id:queued.id,quantity:(old.find((p:P)=>p.id===queued.id)?.quantity||0)+1}));notify('Produk ditambahkan ke keranjang')}const next=pendingPage.current;pendingPage.current='';go(next==='cart'||next==='orders'||next==='profile'?next:'dashboard')}})}}>{authTab==='register'&&<label className="field">Nama Lengkap<input name="name" minLength={3} maxLength={100} required defaultValue={initialValue('name')} placeholder="Nama lengkap kamu"/>{fieldError('name')}</label>}{authTab==='register'&&<><label className="field">Nomor Telepon<input name="phone" type="tel" maxLength={20} autoComplete="tel" defaultValue={initialValue('phone')}/>{fieldError('phone')}</label><label className="field">Alamat<textarea name="address" maxLength={300} autoComplete="street-address" rows={2} defaultValue={initialValue('address')}/>{fieldError('address')}</label></>}<label className="field">Email<input name="email" type="email" inputMode="email" autoCapitalize="none" maxLength={100} required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email"/>{fieldError('email')}</label><label className="field">Password<input ref={authPassword} name="password" type="password" minLength={authTab==='register'?8:undefined} maxLength={72} required placeholder="Minimal 8 karakter" autoComplete={authTab==='login'?'current-password':'new-password'}/>{fieldError('password')}</label>{authTab==='register'&&<label className="field">Konfirmasi Password<input name="password_confirm" type="password" minLength={8} maxLength={72} required autoComplete="new-password"/>{fieldError('password_confirm')}</label>}{authTab==='login'&&rememberAvailable&&<label className="d-flex align-items-center gap-2 mb-3"><input type="checkbox" name="remember" value="1"/> Ingat saya di perangkat ini</label>}<button className="btn primary full" disabled={busy||!csrf}>{busy?'Memproses...':authTab==='login'?'Masuk ke ShopEase':'Buat Akun'}<ArrowRight size={16}/></button></form>{demoAccounts && authTab==='login' && <section className="demo-access" aria-labelledby="demo-access-title">
    <h3 id="demo-access-title">Akun Demo</h3>
    <p>Pilih peran untuk mengisi formulir, lalu klik Masuk.</p>
    <div className="demo-access-options">
        {[
            { role: 'customer', label: 'Customer', Icon: ShoppingBag },
            { role: 'operator', label: 'Operator', Icon: Truck },
            { role: 'admin', label: 'Admin', Icon: ShieldCheck },
        ].map(({ role, label, Icon }) => (
            <button className="btn outline small" key={role} type="button" disabled={busy} onClick={() => {
                setAuthEmail(role + '@shopease.test');
                if (authPassword.current) authPassword.current.value = 'ShopEase2026!';
                setFormErrors({});
                setError('');
            }}><Icon size={16}/> {label}</button>
        ))}
    </div>
</section>}
    </section>
    <aside className="auth-showcase" aria-labelledby="auth-showcase-title">
        <div className="auth-showcase-copy">
            <span className="brand-icon" aria-hidden="true"><ShoppingBag size={24}/></span>
            <h2 id="auth-showcase-title">Belanja dengan akun ShopEase</h2>
            <ul>
                <li><Package size={18}/> Lihat riwayat dan status pesanan</li>
                <li><MapPin size={18}/> Simpan alamat pengiriman</li>
            </ul>
        </div>
        <img src="/images/headphones.webp" alt="" className="auth-showcase-image"/>
    </aside>
</section> : <>{!ready||!allowed?<div className="loading container"><span className="spinner"/> Menyiapkan pilihan terbaik untukmu...</div>:<>
{page==='home'&&<div className="container home"><section className="hero-grid"><div className="hero"><div className="hero-copy"><span className="eyebrow"><span/> PILIHAN TERBAIK, HARGA TERBAIK</span><h1>Belanja Mudah<br/>&amp; Aman <em>di ShopEase</em></h1><p>Temukan favorit baru untuk setiap harimu.<br/>Belanja mudah, pilihan berkualitas, harga bersahabat.</p><button className="btn dark" onClick={()=>browse()}>Belanja Sekarang <ArrowRight size={17}/></button><div className="hero-trust"><span className="mini-avatars"><b>N</b><b>A</b><b>R</b><b>F</b></span><span><span className="stars">{[0,1,2,3,4].map(i=><Star key={i} size={9} fill="currentColor"/>)}</span><small>Pilihan untuk keseharianmu</small></span></div></div><div className="hero-art"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><span className="hero-sticker">PILIHAN<br/><b>FAVORITMU</b></span><img className="hero-headphone" src="/images/nike.webp" alt="Sneakers pilihan ShopEase"/><div className="floating-deal"><span><ShieldCheck size={20}/></span><div>Favorit minggu ini<strong>Koleksi Sneakers</strong><small>Temukan gaya pilihanmu</small></div></div><span className="hero-edition">THE EVERYDAY COLLECTION — 2026</span></div><div className="hero-dots"><b/><i/><i/></div></div><div className="side-promos"><button className="promo-box blue" onClick={()=>browse('fashion')}><div><span>STYLE UP YOUR DAY</span><h2>Langkah baru,<br/>gaya baru.</h2><p>Sneakers pilihan untukmu</p><strong>Temukan Gayamu <ArrowRight size={14}/></strong></div><img src="/images/nike.webp" alt="Nike Air Force 1 putih"/><span className="promo-circle"/></button><button className="promo-box peach" onClick={()=>browse('rumah')}><div><span>SMALL THINGS, BIG JOY</span><h2>Teman setiap<br/>aktivitasmu.</h2><p>Essentials mulai Rp199 ribu</p><strong>Lihat Koleksi <ArrowRight size={14}/></strong></div><img src="/images/tumbler.webp" alt="Stanley Quencher cream"/><span className="promo-circle"/></button></div></section>
<section className="benefits"><div><span className="benefit-icon"><Truck/></span><div><strong>Kirim ke Seluruh Indonesia</strong><small>Pilihan pengiriman sesuai kebutuhan</small></div></div><div><span className="benefit-icon"><ShieldCheck/></span><div><strong>Belanja Aman & Nyaman</strong><small>Pembayaran diverifikasi oleh admin</small></div></div><div><span className="benefit-icon"><Package/></span><div><strong>Produk Pilihan Berkualitas</strong><small>Dikurasi untuk keseharianmu</small></div></div><div><span className="benefit-icon"><Headphones/></span><div><strong>Selalu Siap Membantu</strong><small>Layanan pelanggan yang ramah</small></div></div></section>
<section className="categories-section"><div className="section-heading"><div><h2>Mulai dari yang kamu suka</h2><p>Temukan kebutuhanmu, dalam satu tempat.</p></div><button className="text-link" onClick={()=>browse()}>Semua Kategori <ArrowRight size={16}/></button></div><div className="category-grid">{categories.map((c,i)=>{const I=catsIcon[c.id]||ShoppingBag;return <button className={'category-tile category-'+i} key={c.id} onClick={()=>browse(c.id)}><div><strong>{c.name}</strong><span>{products.filter(p=>p.category_id===c.id&&p.status==='active').length} produk pilihan</span></div><img src={'/images/'+(catsImage[c.id]||'backpack')+'.webp'} alt={c.name}/><span className="category-arrow"><ArrowRight size={14}/></span></button>})}</div></section>
<section className="flash-section" id="flash"><div className="section-heading"><div className="flash-heading"><h2><Zap size={24} fill="currentColor"/> Flash Sale<span>Harga spesial hari ini</span></h2><div className="countdown"><small>Berakhir dalam</small>{[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map((n,i)=><React.Fragment key={i}>{i>0&&<b>:</b>}<span>{String(n).padStart(2,'0')}</span></React.Fragment>)}</div></div><button className="text-link" onClick={()=>{setSort('price-asc');browse()}}>Lihat Semua <ArrowRight size={16}/></button></div><div className="product-grid six">{featured.map(p=><Card p={p} key={p.id} flash/>)}</div></section>
<section className="wide-banner"><div><span>PILIHAN YANG PAS BUAT KAMU</span><h2>Bikin harimu lebih <em>extra.</em></h2><p>Dari gadget andalan sampai gaya harian, semuanya ada di sini.</p><button className="btn white" onClick={()=>browse()}>Cari Favoritmu <ArrowRight size={17}/></button></div><img src="/images/speaker.webp" alt="JBL Flip 6"/><img src="/images/watch.webp" alt="Apple Watch pink"/><span className="banner-round"/></section>
<section className="recommendations"><div className="section-heading"><div><h2>Rekomendasi untuk harimu</h2><p>Barang bagus, mood juga bagus.</p></div><button className="text-link" onClick={()=>browse()}>Jelajahi Semua <ArrowRight size={16}/></button></div><div className="category-tabs">{[['all','Untuk Kamu'],...categories.map(c=>[c.id,c.name])].map(([id,name])=><button className={category===id?'active':''} key={id} onClick={()=>setCategory(id)}>{name}</button>)}</div><div className="product-grid six">{products.filter(p=>p.status==='active'&&(category==='all'||p.category_id===category)).slice(0,12).map(p=><Card key={p.id} p={p}/>)}</div><button className="btn outline more" onClick={()=>browse(category)}>Lihat Lebih Banyak <ArrowRight size={16}/></button></section>
</div>}
{(page==='catalog'||page==='wishlist')&&<div className="container page-content"><div className="breadcrumb"><button onClick={()=>go('home')}>Beranda</button><ChevronRight size={13}/>{page==='wishlist'?'Wishlist':'Semua Produk'}</div><div className="catalog-intro"><span className="eyebrow">THE EVERYDAY COLLECTION</span><h1>{page==='wishlist'?'Pilihan yang kamu simpan.':'Ada yang pas untuk setiap hari.'}</h1><p>{page==='wishlist'?'Simpan dulu, bawa pulang nanti.':'Temukan produk pilihan yang membuat keseharian lebih menyenangkan.'}</p></div><div className="catalog-layout"><aside className={'filters mobile-filter-panel' + (mobileFiltersOpen ? ' is-open' : '')}>
<button className="btn outline mobile-filter-toggle" type="button" aria-expanded={mobileFiltersOpen} aria-controls="catalog-filter-fields" onClick={()=>setMobileFiltersOpen(open=>!open)}><SlidersHorizontal size={18}/> Filter produk <ChevronDown size={16}/></button>
<div className="catalog-filter-fields" id="catalog-filter-fields"><h3><SlidersHorizontal size={17}/> Filter Produk</h3><h4>Kategori</h4>{[['all','Semua Kategori'],...categories.map(c=>[c.id,c.name])].map(([id,n])=><button key={id} className={'filter-option '+(category===id?'active':'')} onClick={()=>{setCategory(id);setPagination(1)}}><span className="radio"/>{n}</button>)}<hr/><h4>Rentang Harga</h4><button className="filter-option" onClick={()=>setSort('price-asc')}>Harga paling terjangkau <ArrowRight size={14}/></button><hr/><div className="filter-help"><ShieldCheck size={28}/><h4>Belanja tanpa khawatir</h4><p>Produk pilihan dan pembayaran yang diverifikasi.</p></div><button className="text-link" onClick={()=>{setCategory('all');setQuery('');setSort('recommended');setPagination(1)}}>Reset Filter <RefreshCw size={13}/></button><button className="btn primary mobile-filter-toggle" type="button" onClick={()=>setMobileFiltersOpen(false)}>Tampilkan produk</button></div></aside><section className="catalog-results"><div className="sort-bar"><span><b>{(page==='wishlist'?filtered.filter(p=>saved.includes(p.id)):filtered).length}</b> produk {query&&<>untuk “{query}”</>}</span><label>Urutkan:<select value={sort} onChange={e=>{setSort(e.target.value);setPagination(1)}}><option value="recommended">Rekomendasi</option><option value="popular">Terlaris</option><option value="new">Terbaru</option><option value="price-asc">Harga Terendah</option><option value="price-desc">Harga Tertinggi</option></select></label></div><div className="product-grid four">{(page==='wishlist'?filtered.filter(p=>saved.includes(p.id)):filtered).slice((pagination-1)*12,pagination*12).map(p=><Card key={p.id} p={p}/>)}</div>{!(page==='wishlist'?filtered.filter(p=>saved.includes(p.id)):filtered).length&&<div className="empty"><Search size={38}/><h2>{page==='wishlist'?'Belum ada favorit':'Produk belum ditemukan'}</h2><p>{page==='wishlist'?'Tekan ikon hati pada produk yang kamu suka.':'Coba kata kunci atau kategori yang lain.'}</p><button className="btn primary" onClick={()=>{setQuery('');setCategory('all');go('catalog')}}>Jelajahi Produk</button></div>}<div className="pagination">{Array.from({length:Math.ceil((page==='wishlist'?filtered.filter(p=>saved.includes(p.id)):filtered).length/12)},(_,i)=><button key={i} className={pagination===i+1?'active':''} onClick={()=>{setPagination(i+1);window.scrollTo({top:200,behavior:'smooth'})}}>{i+1}</button>)}</div></section></div></div>}
{page==='cart'&&<div className="container page-content"><div className="breadcrumb">Beranda <ChevronRight size={13}/> Keranjang</div><h1>Keranjang belanjamu<span className="title-count">{count} barang</span></h1>{cart.length?<div className="checkout-layout"><section className="panel"><div className="panel-title"><ShieldCheck size={18}/><b>ShopEase Official</b><span className="muted">Pilihan untuk harimu</span></div>{cart.map(p=><div className="cart-row" key={p.id}><button className="cart-photo" onClick={()=>showProduct(p)}><img src={p.image} alt={p.name}/></button><div className="cart-info"><h3>{p.name}</h3><small>Stok tersedia: {p.stock}</small><strong>{rp(p.price)}</strong></div><div className="quantity"><button onClick={()=>changeQty(p,(p.quantity||1)-1)} disabled={busy} aria-label="Kurangi jumlah"><Minus size={13}/></button><b>{p.quantity}</b><button onClick={()=>changeQty(p,(p.quantity||1)+1)} disabled={busy||(p.quantity||1)>=p.stock} aria-label="Tambah jumlah"><Plus size={13}/></button></div><strong className="row-total">{rp(p.price*(p.quantity||0))}</strong><button className="icon-btn danger" onClick={()=>changeQty(p,0)} aria-label="Hapus item"><Trash2 size={17}/></button></div>)}<button className="text-link" onClick={()=>browse()}><ArrowLeft size={15}/> Lanjut Belanja</button></section><aside className="panel summary"><h2>Ringkasan Belanja</h2><div><span>Total ({count} barang)</span><strong>{rp(subtotal)}</strong></div><div><span>Ongkos kirim</span><small>Dihitung saat checkout</small></div><hr/><div className="summary-total"><b>Subtotal</b><strong>{rp(subtotal)}</strong></div><button className="btn primary full" disabled={busy} onClick={startCheckout}>Lanjut ke Checkout <ArrowRight size={16}/></button><p><ShieldCheck size={14}/> Transaksi aman dan terverifikasi</p></aside></div>:<div className="empty"><ShoppingBag size={48}/><h2>Keranjangmu menunggu diisi</h2><p>Yuk, temukan barang yang kamu suka.</p><button className="btn primary" onClick={()=>browse()}>Mulai Belanja <ArrowRight size={15}/></button></div>}</div>}
{page==='checkout'&&<div className="container page-content"><button className="text-link" onClick={()=>go('cart')}><ArrowLeft size={16}/> Kembali ke Keranjang</button><h1>Selangkah lagi jadi milikmu.</h1><div className="checkout-steps"><b>1. Keranjang</b><ChevronRight size={15}/><b className="blue-text">2. Checkout</b><ChevronRight size={15}/><span>3. Pembayaran</span></div><div className="checkout-layout"><div className="stack"><section className="panel"><div className="section-heading"><h2><MapPin size={20}/> Alamat Pengiriman</h2><button className="text-link" onClick={()=>setModal('addresses')}><Plus size={16}/> Tambah Alamat</button></div>{addresses.length?addresses.map(a=><button key={a.id} className={'address-card '+(addressId===a.id?'selected':'')} onClick={()=>setAddressId(a.id)}><span className="radio"/><div><strong>{a.recipient_name}</strong> <small>{a.phone}</small><p>{a.address}, {a.city}, {a.province}, {a.postal_code}</p></div></button>):<p className="muted">Tambahkan alamat pengiriman untuk melanjutkan.</p>}</section><section className="panel"><h2><Package size={20}/> Produk Pesanan</h2>{cart.map(p=><div className="checkout-product" key={p.id}><img src={p.image} alt={p.name}/><div><b>{p.name}</b><p>{p.quantity} × {rp(p.price)}</p></div><strong>{rp(p.price*(p.quantity||1))}</strong></div>)}<label className="field">Catatan untuk toko<textarea id="checkout-notes" placeholder="Contoh: ukuran sepatu, warna, atau catatan pengiriman" maxLength={1000}/></label></section><section className="panel"><h2><Truck size={20}/> Pilihan Pengiriman</h2><label className="shipping-option"><input type="radio" checked={courier==='regular'} onChange={()=>setCourier('regular')}/><span><b>Reguler</b><small>Estimasi 3–5 hari kerja</small></span><strong>{rp(String(addresses.find(a=>a.id===addressId)?.city||'').trim().toLowerCase()==='surabaya'?0:15000)}</strong></label><label className="shipping-option"><input type="radio" checked={courier==='sicepat_reg'} onChange={()=>setCourier('sicepat_reg')}/><span><b>SiCepat REG</b><small>Estimasi 3–5 hari kerja</small></span><strong>{rp(shipping===0?0:12000)}</strong></label><label className="shipping-option"><input type="radio" checked={courier==='express'} onChange={()=>setCourier('express')}/><span><b>Express</b><small>Estimasi 1–2 hari kerja</small></span><strong>{rp(String(addresses.find(a=>a.id===addressId)?.city||'').trim().toLowerCase()==='surabaya'?0:25000)}</strong></label><p className="muted tiny">Tarif tetap untuk praktikum; tidak terhubung ke API ekspedisi.</p></section></div><aside className="panel summary"><h2>Ringkasan Pembayaran</h2><div><span>Subtotal produk</span><strong>{rp(subtotal)}</strong></div><div><span>Pengiriman</span><strong>{rp(shipping)}</strong></div><div><span>Biaya layanan</span><strong>Gratis</strong></div><hr/><div className="summary-total"><b>Total</b><strong>{rp(subtotal+shipping)}</strong></div><label className="field">Metode Pembayaran<select id="payment-method"><option value="BCA">Transfer BCA</option><option value="BRI">Transfer BRI</option><option value="Mandiri">Transfer Mandiri</option></select></label><div className="payment-note"><ShieldCheck size={19}/><div><b>Transfer bank manual</b><small>Unggah bukti setelah membuat pesanan.</small></div></div><button className="btn primary full" disabled={busy||!addressId||!cart.length} onClick={()=>run(async()=>{const d=await api('checkout',{address_id:addressId,courier,payment_method:(document.getElementById('payment-method') as HTMLSelectElement)?.value||'BCA',notes:(document.getElementById('checkout-notes') as HTMLTextAreaElement)?.value||'',idempotency_key:checkoutKey});setCart([]);setSelected(d);go('orders');setModal('order');notify('Pesanan berhasil dibuat')})}>{busy?'Memproses...':'Buat Pesanan'} <ArrowRight size={16}/></button><p className="tiny">Data dan rekening pada aplikasi ini adalah contoh pembelajaran.</p></aside></div></div>}
{page==='orders'&&<div className="container page-content"><div className="section-heading"><div><span className="eyebrow">BELANJAMU, DALAM SATU TEMPAT</span><h1>Pesanan Saya</h1></div><button className="btn outline small" onClick={()=>run(async()=>setOrders(await api('orders')))}><RefreshCw size={15}/> Perbarui</button></div>{!user?<div className="empty"><User size={42}/><h2>Masuk untuk melihat pesanan</h2><button className="btn primary" onClick={()=>openAuth('login')}>Masuk</button></div>:<><div className="category-tabs">{['all','pending_payment','waiting_verification','processing','shipped','completed','cancelled'].map(s=><button key={s} className={filterStatus===s?'active':''} onClick={()=>setFilterStatus(s)}>{s==='all'?'Semua':labels[s]}</button>)}</div><div className="stack">{orders.filter(o=>filterStatus==='all'||o.order_status===filterStatus).map(o=><div className="panel order-card" key={o.id}><div><b><Package size={17}/> {o.order_number}</b>{status(o.order_status)}</div><p>{new Date(o.created_at).toLocaleString('id-ID')}</p><div><span>Pembayaran: {labels[o.payment_status]}</span><strong>{rp(o.total)}</strong><button className="btn outline small" onClick={()=>detailOrder(o.id)}>Lihat Detail <ChevronRight size={15}/></button></div></div>)}</div>{!orders.filter(o=>filterStatus==='all'||o.order_status===filterStatus).length&&<div className="empty"><Package size={44}/><h2>Belum ada pesanan di sini</h2><p>Pesananmu akan muncul setelah checkout.</p><button className="btn primary" onClick={()=>browse()}>Jelajahi Produk</button></div>}</>}</div>}
{page==='about'&&<div className="container page-content"><section className="about-hero"><span className="eyebrow">KENAL LEBIH DEKAT</span><h1>Pilihan baik.<br/>Untuk hari yang lebih baik.</h1><p>ShopEase hadir untuk membuat belanja online terasa mudah, aman, dan menyenangkan. Satu tempat untuk menemukan gadget favorit, gaya baru, hingga kebutuhan rumah.</p><button className="btn primary" onClick={()=>browse()}>Temukan Pilihanmu <ArrowRight size={17}/></button><img src="/images/headphones.webp" alt="Sony headphones"/></section><div className="info-grid">{[[ShieldCheck,'Belanja dengan tenang','Setiap pembayaran diperiksa oleh administrator sebelum pesanan diproses.'],[ShoppingBag,'Pilihan untuk keseharian','Produk dari lima kategori, dalam katalog yang mudah dicari dan dijelajahi.'],[Truck,'Ikuti setiap langkah','Lihat status dari menunggu pembayaran, diproses, dikirim, hingga selesai.']].map(([I,t,d]:any)=><div className="panel" key={t}><I size={30}/><h2>{t}</h2><p>{d}</p></div>)}</div><section className="panel about-text"><h2>Tentang Proyek ShopEase</h2><p>Aplikasi ini dikembangkan sebagai proyek pembelajaran Web Framework berdasarkan PRD, studi kasus, dan Hands-On Lab ShopEase. Sistem memiliki peran customer, administrator, dan operator dengan alur belanja dari katalog sampai penerimaan pesanan.</p><p>Versi kode akademik menggunakan CodeIgniter 4, PHP, MySQL, dan Bootstrap 5. Pratinjau online menggunakan runtime web yang didukung platform. Pembayaran serta ongkos kirim bersifat manual; semua harga dan data akun adalah contoh, bukan penawaran transaksi komersial.</p><button className="text-link" onClick={()=>go('contact')}>Ada pertanyaan? Hubungi kami <ArrowRight size={15}/></button></section></div>}
{page==='contact'&&<div className="container page-content"><span className="eyebrow">KAMI SIAP MEMBANTU</span><h1>Ada yang bisa kami bantu?</h1><p className="muted">Kirim pertanyaanmu, tim ShopEase akan melihatnya melalui dashboard.</p><div className="contact-layout"><div className="contact-info"><div><Mail/><h3>Email</h3><p>support@shopease.test</p></div><div><Clock/><h3>Jam Layanan</h3><p>Senin–Jumat, 09.00–17.00 WIB</p></div><div><MapPin/><h3>Lokasi</h3><p>Jakarta, Indonesia</p></div><div className="contact-callout"><ShoppingBag size={35}/><h2>Belanja jadi lebih mudah.</h2><p>Temukan jawabannya bersama ShopEase.</p></div></div><form className="panel contact-form" onSubmit={e=>{e.preventDefault();const f=e.currentTarget;run(async()=>{await api('contact',Object.fromEntries(new FormData(f)));f.reset();notify('Pesan terkirim dan tersimpan untuk admin.')})}}><h2>Kirim pesan</h2><label className="field">Nama Lengkap<input name="name" placeholder="Nama kamu" required minLength={2}/></label><label className="field">Email<input type="email" name="email" placeholder="nama@email.com" required/></label><label className="field">Pesan<textarea name="message" placeholder="Ceritakan pertanyaan atau kendalamu..." required minLength={10} rows={5}/></label><button className="btn primary" disabled={busy}>Kirim Pesan <ArrowRight size={16}/></button></form></div></div>}
 {page==='dashboard'&&user?.role==='customer'&&<section className="container page-content"><div className="section-heading"><div><span className="eyebrow">AREA CUSTOMER</span><h1>Halo, {user.name}</h1><p className="muted">Pantau pesanan dan kelola akunmu.</p></div></div><div className="customer-dashboard-layout"><aside className="panel customer-dashboard-menu"><button onClick={()=>go('dashboard')}><LayoutDashboard size={18}/> Dashboard</button><button onClick={()=>go('profile')}><User size={18}/> Profil Saya</button><button onClick={()=>go('orders')}><Package size={18}/> Pesanan Saya</button><button onClick={()=>go('cart')}><ShoppingCart size={18}/> Keranjang</button></aside><div className="stack"><div className="stats-grid">{[['Menunggu Bayar','pending_payment'],['Diverifikasi','waiting_verification'],['Diproses','processing'],['Dikirim','shipped'],['Selesai','completed']].map(([label,key])=><div className="panel stat" key={key}><small>{label}</small><strong>{orders.filter(o=>o.order_status===key).length}</strong></div>)}</div>{orders.some(o=>o.order_status==='pending_payment')&&<div className="panel"><h2>Pembayaran menunggu</h2><p>Lengkapi bukti transfer untuk melanjutkan pesanan.</p><button className="btn primary" onClick={()=>go('orders')}>Lihat Pesanan</button></div>}<div className="panel"><div className="section-heading"><h2>Pesanan Terbaru</h2><button className="text-link" onClick={()=>go('orders')}>Lihat Semua <ArrowRight size={15}/></button></div>{orders.slice(0,5).map(o=><button className="customer-dashboard-order" key={o.id} onClick={()=>detailOrder(o.id)}><b>{o.order_number}</b>{status(o.order_status)}<strong>{rp(o.total)}</strong></button>)}{!orders.length&&<p className="muted">Belum ada pesanan.</p>}</div><div className="panel"><h2>Profil Singkat</h2><p>{user.name} · {user.email}</p><p>{user.phone||'Nomor telepon belum diisi'}</p><button className="text-link" onClick={()=>go('profile')}>Kelola Profil <ArrowRight size={15}/></button></div></div></div></section>}
 {page==='profile'&&user&&<section className="container page-content profile-page">
    <div className="section-heading"><div><h1>Akun Saya</h1><p className="muted">Informasi akun ShopEase</p></div></div>
    <article className="panel profile-panel">
        <div className="profile-identity"><span className="avatar large">{user.name[0]}</span><div><h2>{user.name}</h2><span className="muted">{user.role==='customer'?'Pelanggan':user.role==='admin'?'Administrator':'Operator'}</span></div></div>
        <dl className="profile-details"><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Nomor telepon</dt><dd>{user.phone || 'Belum diisi'}</dd></div><div><dt>Alamat</dt><dd>{user.address || 'Belum diisi'}</dd></div></dl>
        {user.role==='customer'&&<div className="profile-edit-grid"><form className="stack" onSubmit={e=>{e.preventDefault();run(async()=>{const updated=await api('profile',{action:'details',...Object.fromEntries(new FormData(e.currentTarget))});setUser(updated);notify('Profil berhasil diperbarui')})}}><h3>Ubah Profil</h3><label className="field">Nama<input name="name" required minLength={3} defaultValue={user.name}/></label><label className="field">Nomor telepon<input name="phone" defaultValue={user.phone||''}/></label><label className="field">Alamat<textarea name="address" maxLength={300} defaultValue={user.address||''}/></label><button className="btn primary" disabled={busy}>Simpan Profil</button></form><form className="stack" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;run(async()=>{await api('profile',{action:'password',...Object.fromEntries(new FormData(form))});form.reset();notify('Password berhasil diperbarui')})}}><h3>Ganti Password</h3><label className="field">Password lama<input name="old_password" type="password" required/></label><label className="field">Password baru<input name="new_password" type="password" minLength={8} maxLength={72} required/></label><button className="btn outline" disabled={busy}>Ganti Password</button></form></div>}
        <div className="profile-links"><button type="button" className="btn outline" onClick={()=>setModal('account')}>Menu akun <ChevronRight size={16}/></button>{user.role==='customer'?<button className="btn primary" onClick={()=>go('orders')}>Pesanan Saya <ArrowRight size={16}/></button>:<button className="btn primary" onClick={()=>go('admin')}>Pusat Pengelolaan <ArrowRight size={16}/></button>}</div>
    </article>
</section>}
{page==='admin'&&<div className="admin-layout container page-content">{!user||!['admin','operator'].includes(user.role)?<div className="empty"><ShieldCheck size={45}/><h1>Akses Pengelola</h1><p>Masuk dengan akun admin atau operator untuk mengelola toko.</p><button className="btn primary" onClick={()=>openAuth('login')}>Masuk Pengelola</button></div>:<><aside className="admin-sidebar management-sidebar">
    <div className="admin-label">PENGELOLAAN TOKO<span>{user.role==='admin'?'Administrator':'Operator'}</span></div>
    <nav className="management-menu" aria-label="Menu pengelolaan">
        {managementMenu.map(([id, name, Icon]:any) => (
            <button type="button" className={managementPanel===id?'active':''} aria-current={managementPanel===id?'page':undefined}
                key={id} onClick={()=>selectManagementPanel(id)}>
                <Icon size={18} aria-hidden="true"/><span>{name}</span>
            </button>
        ))}
        <a href="/admin/products"><Package size={18}/> Product Management</a>
        <a href="/admin/inventory"><BarChart3 size={18}/> Inventori</a>
        {user.role==='admin'&&<a href="/admin/karyawan"><Users size={18}/> Data Karyawan</a>}
    </nav>
    <button className="management-profile-link" type="button" onClick={()=>go('profile')}><User size={17}/> Akun Saya</button>
</aside><section className="admin-main"><div className="section-heading"><div><span className="eyebrow">{user.role==='admin'?'ADMINISTRASI TOKO':'OPERASIONAL PESANAN'}</span><h1>{managementMenu.find(([id])=>id===managementPanel)?.[1] as string}</h1></div><span className="date-chip">{new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</span></div>{overview&&<>
{managementPanel==='overview'&&<><div className="stats-grid">{[["Kategori",overview.categories?.n??0],["Produk Tersedia",overview.available?.n??0],["Tidak Tersedia",overview.unavailable?.n??0],["Perlu Verifikasi",overview.orders.filter((o:any)=>o.payment_status==="submitted").length],["Perlu Dikirim",overview.orders.filter((o:any)=>o.order_status==="processing").length],["Sedang Dikirim",overview.orders.filter((o:any)=>o.order_status==="shipped").length],["Selesai",overview.orders.filter((o:any)=>o.order_status==="completed").length]].map(([label,value]:any)=><div className="panel stat" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="stats-grid">{(user.role==='admin'?[[Package,'Total Produk',overview.products?.n ?? 0],[Users,'Pelanggan',overview.customers.length],[ShoppingBag,'Pesanan',overview.orders.length],[BarChart3,'Penjualan Terverifikasi',rp(overview.revenue?.n??0)]]:[[ShoppingBag,'Pesanan',overview.orders.length],[Package,'Siap dikirim',overview.orders.filter((o:any)=>o.order_status==='processing').length],[Truck,'Dalam pengiriman',overview.orders.filter((o:any)=>o.order_status==='shipped').length]]).map(([I,n,v]:any)=><div className="panel stat" key={n}><span><I size={21}/></span><small>{n}</small><strong>{v}</strong></div>)}</div><div className="dashboard-grid">{user.role==='admin'&&<div className="panel"><div className="section-heading"><h2>Aktivitas Penjualan</h2><small>7 hari terakhir</small></div><div className="bar-chart">{Array.from({length:7},(_,i)=>{const date=new Date();date.setDate(date.getDate()-6+i);const key=date.toISOString().slice(0,10);const amount=overview.orders.filter((o:any)=>o.created_at.startsWith(key)&&['processing','shipped','completed'].includes(o.order_status)).reduce((s:number,o:any)=>s+o.total,0);const max=Math.max(1,...overview.orders.map((o:any)=>o.total));return <div key={i} title={rp(amount)}><span>{amount?rp(amount):'0'}</span><i style={{height:Math.max(3,Math.min(145,amount/max*145))+'px'}}/><small>{date.toLocaleDateString('id-ID',{weekday:'short'})}</small></div>})}</div></div>}<div className="panel"><h2>Perlu Perhatian</h2>{[['submitted','Pembayaran perlu verifikasi','payments'],['processing','Pesanan siap dikirim','shipments'],['pending_payment','Menunggu pembayaran','orders']].filter(([, , tab])=>user.role==='admin'||tab==='shipments').map(([s,n,t])=><button className="attention-row" key={s} onClick={()=>selectManagementPanel(t,s)}><span>{n}</span><b>{overview.orders.filter((o:any)=>(t==='payments'?o.payment_status:o.order_status)===s).length}</b><ChevronRight size={15}/></button>)}</div></div><div className="panel"><div className="section-heading"><h2>Pesanan Terbaru</h2><button className="text-link" onClick={()=>selectManagementPanel('orders')}>Lihat Semua <ArrowRight size={15}/></button></div><OrderTable list={overview.orders.slice(0,5)}/></div><div className="panel"><div className="section-heading"><h2>Stok Rendah dan Habis</h2><a className="text-link" href="/admin/inventory">Buka Inventori <ArrowRight size={15}/></a></div>{overview.low_stock.map((p:any)=><div className="attention-row" key={p.id}><span>{p.name}</span><b>{p.stock}</b></div>)}{!overview.low_stock.length&&<p className="muted">Semua stok aman.</p>}</div></>}
{managementPanel==='products'&&<div className="panel"><div className="admin-toolbar"><div className="input-search"><Search size={16}/><input aria-label="Cari produk admin" placeholder="Cari produk..." value={query} onChange={e=>{setQuery(e.target.value);setPagination(1)}}/></div><button className="btn primary small" onClick={()=>{setEdit({name:'',description:'',category_id:categories[0]?.id,price:0,old_price:0,stock:0,image:'',status:'active'});setModal('editProduct')}}><Plus size={16}/> Tambah Produk</button></div><div className="table-wrap mobile-card-table"><table><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{products.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).slice((pagination-1)*10,pagination*10).map(p=><tr key={p.id}><td data-label="Produk"><div className="table-product"><img src={p.image} alt=""/><b>{p.name}</b></div></td><td data-label="Kategori">{categories.find(c=>c.id===p.category_id)?.name}</td><td data-label="Harga">{rp(p.price)}</td><td data-label="Stok">{p.stock}</td><td data-label="Status"><span className={'status '+(p.status==='active'?'completed':'cancelled')}>{p.status==='active'?'Aktif':'Nonaktif'}</span></td><td data-label="Aksi"><button className="text-link" onClick={()=>{setEdit({...p});setModal('editProduct')}}>Ubah</button>{p.status==='active'&&<button className="icon-btn danger" title="Nonaktifkan" onClick={()=>{setEdit(p);setModal('deleteProduct')}}><Trash2 size={15}/></button>}</td></tr>)}</tbody></table></div><div className="pagination">{Array.from({length:Math.ceil(products.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).length/10)},(_,i)=><button className={pagination===i+1?'active':''} key={i} onClick={()=>setPagination(i+1)}>{i+1}</button>)}</div></div>}
{managementPanel==='categories'&&<div className="panel"><div className="section-heading"><h2>Kategori Produk</h2><button className="btn primary small" onClick={()=>{setEdit({name:'',description:''});setModal('editCategory')}}><Plus size={15}/> Tambah Kategori</button></div><div className="table-wrap mobile-card-table"><table><thead><tr><th>Nama Kategori</th><th>Slug</th><th>Produk</th><th>Aksi</th></tr></thead><tbody>{categories.map(c=><tr key={c.id}><td data-label="Kategori"><b>{c.name}</b><small className="block muted">{c.description}</small></td><td data-label="Slug">{c.slug}</td><td data-label="Produk">{products.filter(p=>p.category_id===c.id).length}</td><td data-label="Aksi"><button className="text-link" onClick={()=>{setEdit(c);setModal('editCategory')}}>Ubah</button><button className="icon-btn danger" aria-label="Hapus kategori" onClick={()=>{setEdit(c);setModal('deleteCategory')}}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></div>}
{['orders','payments','shipments','reports'].includes(String(managementPanel))&&<div className="panel"><div className="admin-toolbar"><label className="field compact">{managementPanel==='payments'?'Status Pembayaran':managementPanel==='shipments'?'Status Pengiriman':'Status Pesanan'}<select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPagination(1)}}><option value="all">Semua Status</option>{panelStatuses.map(s=><option key={s} value={s}>{labels[s]||s}</option>)}</select></label>{managementPanel==='reports'&&<><label className="field compact">Dari Tanggal<input type="date" value={reportStart} onChange={e=>setReportStart(e.target.value)}/></label><label className="field compact">Sampai Tanggal<input type="date" value={reportEnd} onChange={e=>setReportEnd(e.target.value)}/></label><button className="btn outline small" onClick={()=>{const rows=reportOrders();const a=document.createElement('a');const url=URL.createObjectURL(new Blob(['\uFEFF'+[['Nomor','Tanggal','Pelanggan','Total','Status'],...rows.map((o:any)=>[o.order_number,o.created_at,o.name,o.total,labels[o.order_status]])].map(r=>r.map(escCSV).join(',')).join('\n')],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='Laporan-ShopEase.csv';a.click();URL.revokeObjectURL(url)}}><Download size={16}/> Ekspor CSV</button></>}</div>{managementPanel==='reports'&&<div className="report-total">Penjualan terverifikasi periode ini<strong>{rp(reportOrders().filter((o:any)=>['processing','shipped','completed'].includes(o.order_status)).reduce((s:number,o:any)=>s+o.total,0))}</strong><small>Pesanan diproses, dikirim, atau selesai. Termasuk ongkir.</small></div>}<OrderTable list={reportOrders().slice((pagination-1)*10,pagination*10)} paymentStatus={managementPanel==='payments'} shipping={managementPanel==='shipments'}/><div className="pagination">{Array.from({length:Math.ceil(reportOrders().length/10)},(_,i)=><button key={i} className={pagination===i+1?'active':''} onClick={()=>setPagination(i+1)}>{i+1}</button>)}</div></div>}
{managementPanel==='customers'&&<div className="panel table-wrap mobile-card-table"><table><thead><tr><th>Pelanggan</th><th>Email</th><th>Bergabung</th></tr></thead><tbody>{overview.customers.map((u:any)=><tr key={u.id}><td data-label="Pelanggan"><b>{u.name}</b></td><td data-label="Email">{u.email}</td><td data-label="Bergabung">{new Date(u.created_at).toLocaleDateString('id-ID')}</td></tr>)}</tbody></table></div>}
{managementPanel==='messages'&&<div className="stack">{overview.contacts.length?overview.contacts.map((m:any)=><div className="panel" key={m.id}><h3>{m.name}</h3><p className="muted">{m.email} · {new Date(m.created_at).toLocaleString('id-ID')}</p><p className="message-body">{m.message}</p></div>):<div className="empty"><Mail size={40}/><h2>Belum ada pesan masuk</h2></div>}</div>}
</>}</section></>}</div>}
</>}{error&&!modal&&<div role="alert" className="container inline-error">{error}</div>}</>}</main>
 {!ready ? null : staff ? <>
<nav className="mobile-dock staff-dock" aria-label="Navigasi pengelola">
    <button type="button" aria-current={page==='admin'?'page':undefined} onClick={()=>{
        go('admin');
        requestAnimationFrame(()=>document.querySelector('.management-menu')?.scrollIntoView({block:'start'}));
    }}><LayoutDashboard size={20}/><span>Menu Pengelolaan</span></button>
    <button type="button" aria-current={page==='profile'?'page':undefined} onClick={()=>go('profile')}><User size={20}/><span>Akun Saya</span></button>
</nav>
<footer><div className="container footer-bottom"><span>© 2026 ShopEase</span><span>{user.role==='admin'?'Administrasi toko':'Operasional pesanan'}</span></div></footer>
</> : <><nav className="mobile-dock" aria-label="Navigasi HP">
    <button type="button" aria-current={page==='home'?'page':undefined} onClick={()=>go('home')}><ShoppingBag size={20}/><span>Beranda</span></button>
    <button type="button" aria-current={page==='catalog'?'page':undefined} onClick={()=>browse()}><Grid2X2 size={20}/><span>Produk</span></button>
    {staff
        ? <button type="button" aria-current={page==='admin'?'page':undefined} onClick={()=>go('admin')}><LayoutDashboard size={20}/><span>Kelola</span></button>
        : <button type="button" aria-current={customerPage?'page':undefined} onClick={()=>requireLogin('cart')}><span className="mobile-dock-icon"><ShoppingCart size={20}/>{count>0&&<b>{count}</b>}</span><span>Keranjang</span></button>}
    <button type="button" aria-current={page==='profile'||page==='auth'?'page':undefined} onClick={()=>user?go('profile'):openAuth('login')}><User size={20}/><span>{user?'Akun':'Masuk'}</span></button>
</nav>
<footer><nav className="container mobile-footer-links" aria-label="Tautan toko">
    <button type="button" className="text-link" onClick={()=>go('about')}>Tentang Kami</button>
</nav><div className="container"><div className="footer-main"><div><button className="brand" onClick={()=>go('home')}><span className="brand-icon"><ShoppingBag size={26}/></span>Shop<span>Ease</span><b>.</b></button><p>Pilihan baik untuk setiap hari.<br/>Belanja mudah, aman, dan nyaman.</p><div className="footer-secure"><ShieldCheck size={16}/> Pembayaran terverifikasi</div></div><div><h4>Jelajahi ShopEase</h4><button onClick={()=>go('about')}>Tentang Kami</button><button onClick={()=>browse()}>Semua Produk</button><button onClick={()=>go('wishlist')}>Wishlist</button><button onClick={()=>go('contact')}>Hubungi Kami</button></div><div><h4>Bantuan Belanja</h4><button onClick={()=>setModal('guide')}>Cara Berbelanja</button><button onClick={()=>setModal('guide')}>Pembayaran & Pengiriman</button><button onClick={()=>requireLogin('orders')}>Lacak Pesanan</button><button onClick={()=>requireLogin('orders')}>Riwayat Pesanan</button></div><div><h4>Metode Pembayaran</h4><div className="bank-badges"><b>BCA</b><b>mandiri</b><b>BRI</b></div><p>Transfer manual · Verifikasi admin</p><h4>Untuk Pengelola</h4><button onClick={()=>go('admin')}>Masuk Pusat Pengelolaan <ArrowRight size={13}/></button></div></div><div className="footer-bottom"><span>© 2026 ShopEase. Dibuat untuk hari yang lebih baik.</span><span>Proyek pembelajaran · Transaksi simulasi</span></div></div></footer>
</>}
{toast&&<div className="shop-toast" role="status"><CheckCircle2 size={19}/>{toast}<button onClick={()=>setToast('')} aria-label="Tutup notifikasi"><X size={14}/></button></div>}
{modal&&<div className="shop-modal-backdrop" onClick={e=>{if(e.target===e.currentTarget&&!busy)setModal('')}}><section tabIndex={-1} role="dialog" aria-modal="true" aria-label="ShopEase" className={'shop-modal '+(['product','order','editProduct'].includes(modal)?'wide-modal':'')}><button className="modal-close" onClick={()=>setModal('')} aria-label="Tutup"><X size={20}/></button>
{modal==='account'&&user&&<><div className="account-profile"><span className="avatar large">{user.name[0]}</span><h2>{user.name}</h2><p>{user.email}</p><span className="status completed">{user.role}</span></div><button className="account-option" onClick={()=>go('profile')}><User size={20}/> Akun Saya <ChevronRight size={16}/></button>{user.role==='customer'?<><button className="account-option" onClick={()=>go('orders')}><Package size={20}/> Pesanan Saya <ChevronRight size={16}/></button><button className="account-option" onClick={()=>run(async()=>{setAddresses(await api('addresses'));setModal('addresses')})}><MapPin size={20}/> Alamat Pengiriman <ChevronRight size={16}/></button></>:<button className="account-option" onClick={()=>go('admin')}><LayoutDashboard size={20}/> Pusat Pengelolaan <ChevronRight size={16}/></button>}<button className="account-option danger" onClick={()=>run(async()=>{await api('logout',{});signalSessionChange();applyAccount(null);clearPrivateState();pendingPage.current='';setCsrf('');go('home');await sessionRequest.current?.catch(() => {});await syncSession();notify('Kamu sudah keluar dari akun.')})}><LogOut size={20}/> Keluar</button></>}
{modal==='product'&&selected&&<><div className="product-detail"><div className="detail-photo"><img src={selected.image} alt={selected.name}/><div className="product-gallery-thumbs">{(selected.images || [selected.image]).map((url:string,i:number)=><button key={url} className={url===selected.image?'active':''} onClick={()=>setSelected({...selected,image:url})} aria-label={'Lihat gambar '+(i+1)} aria-pressed={url===selected.image}><img src={url} alt={'Gambar produk '+(i+1)}/></button>)}</div><button className={'favorite '+(saved.includes(selected.id)?'is-saved':'')} onClick={()=>wish(selected.id)} aria-label="Simpan produk"><Heart size={20}/></button></div><div><span className="official"><ShieldCheck size={14}/> SHOPEASE PILIHAN</span><h1>{selected.name}</h1><div className="rating detail-rating"><Star size={15} fill="currentColor"/><b>{selected.rating}</b><span> | {selected.sold} terjual · Jakarta Pusat</span></div><div className="detail-price"><strong>{rp(selected.price)}</strong><del>{rp(selected.old_price)}</del><span className="discount inline">Hemat {selected.old_price>0?Math.max(0,Math.round((1-selected.price/selected.old_price)*100)):0}%</span></div><p className="detail-description">{selected.description}</p><div className="stock-info"><span className="green-dot"/>{selected.stock>0?'Stok tersedia: '+selected.stock:'Stok habis'}</div><div className="detail-quantity"><span>Jumlah</span><div className="quantity"><button disabled={qty<=1} onClick={()=>setQty(n=>n-1)} aria-label="Kurangi"><Minus size={15}/></button><b>{qty}</b><button disabled={qty>=selected.stock} onClick={()=>setQty(n=>n+1)} aria-label="Tambah"><Plus size={15}/></button></div></div><button className="btn primary full" onClick={()=>add(selected,qty)} disabled={busy||selected.stock<1}><ShoppingCart size={19}/> Tambah ke Keranjang</button><div className="detail-assurances"><span><ShieldCheck size={16}/> Verifikasi pembayaran</span><span><Truck size={16}/> Pengiriman nasional</span></div><small className="muted">Harga dan angka terjual merupakan data demonstrasi.</small></div></div></>}
{modal==='addresses'&&<><h2><MapPin size={21}/> Alamat Pengiriman</h2>{addresses.map(a=><div key={a.id} className="address-card"><div><b>{a.recipient_name}</b><p>{a.address}, {a.city}, {a.province} {a.postal_code}<br/>{a.phone}</p><div className="address-actions"><button type="button" className="text-link" onClick={()=>setAddressEdit(a)}>Ubah</button><button type="button" className="text-link" disabled={busy} onClick={()=>{if(!window.confirm('Hapus alamat ini?'))return;run(async()=>{const rows=await api('addresses/'+encodeURIComponent(a.id)+'/delete',{});setAddresses(rows);if(addressId===a.id)setAddressId(rows[0]?.id||'');if(addressEdit?.id===a.id)setAddressEdit(null);notify('Alamat dihapus')})}}>Hapus</button></div></div></div>)}<h3>{addressEdit?'Ubah alamat':'Tambah alamat baru'}</h3>{addressEdit&&<button type="button" className="text-link" onClick={()=>setAddressEdit(null)}>Batal ubah / tambah alamat baru</button>}<form key={addressEdit?.id||'new'} onSubmit={e=>{e.preventDefault();const f=e.currentTarget;const editedId=addressEdit?.id;run(async()=>{const rows=await api(editedId?'addresses/'+encodeURIComponent(editedId)+'/update':'addresses',Object.fromEntries(new FormData(f)));setAddresses(rows);if(!editedId){const added=rows.find((row:any)=>!addresses.some(old=>old.id===row.id));setAddressId(added?.id||rows[0]?.id||'')}setAddressEdit(null);f.reset();notify(editedId?'Alamat diperbarui':'Alamat tersimpan')})}}><div className="form-grid"><label className="field">Nama Penerima<input name="recipient_name" required minLength={2} maxLength={100} defaultValue={addressEdit?.recipient_name||''}/></label><label className="field">Nomor Telepon<input name="phone" type="tel" required minLength={8} maxLength={25} defaultValue={addressEdit?.phone||''}/></label></div><label className="field">Alamat Lengkap<textarea name="address" minLength={8} maxLength={2000} required defaultValue={addressEdit?.address||''}/></label><div className="form-grid"><label className="field">Kota / Kabupaten<input name="city" required minLength={2} maxLength={100} defaultValue={addressEdit?.city||''}/></label><label className="field">Provinsi<input name="province" required minLength={2} maxLength={100} defaultValue={addressEdit?.province||''}/></label></div><label className="field">Kode Pos<input name="postal_code" pattern="[0-9]{5}" maxLength={5} required defaultValue={addressEdit?.postal_code||''}/></label><button className="btn primary full" disabled={busy}>{addressEdit?'Simpan Perubahan':'Simpan Alamat'} <Check size={16}/></button></form></>}
{modal==='order'&&selected?.items&&<><div className="order-detail-heading"><span className="eyebrow">DETAIL PESANAN</span><h2>{selected.order_number}</h2>{status(selected.order_status)}<p className="muted">{new Date(selected.created_at).toLocaleString('id-ID')}</p></div><div className="order-timeline">{[['pending_payment','Dibuat',ClipboardList],['waiting_verification','Pembayaran',ShieldCheck],['processing','Diproses',Package],['shipped','Dikirim',Truck],['completed','Selesai',CheckCircle2]].map(([s,n,I]:any,i)=>{const idx=['pending_payment','waiting_verification','processing','shipped','completed'].indexOf(selected.order_status);return <div key={s} className={i<=idx?'done':''}><span><I size={18}/></span><small>{n}</small></div>})}</div><div className="order-detail-grid"><div><h3>Produk Pesanan</h3>{selected.items.map((p:any)=><div className="checkout-product" key={p.id}><img src={p.image} alt={p.product_name}/><div><b>{p.product_name}</b><p>{p.quantity} × {rp(p.price)}</p></div><strong>{rp(p.subtotal)}</strong></div>)}<div className="address-block"><h3><MapPin size={16}/> Alamat Penerima</h3><b>{selected.recipient_name}</b><p>{selected.phone}<br/>{selected.address}, {selected.city}, {selected.province} {selected.postal_code}</p>{selected.notes&&<p><b>Catatan:</b> {selected.notes}</p>}</div>{selected.shipment?.tracking_number&&<div className="tracking-box"><Truck size={23}/><div><b>{selected.shipment.courier}</b><p>Nomor Resi: {selected.shipment.tracking_number}</p><small>Pembaruan pengiriman dilakukan manual oleh toko.</small></div></div>}</div><div className="order-payment"><h3>Rincian Pembayaran</h3><div><span>Subtotal</span><b>{rp(selected.subtotal)}</b></div><div><span>Pengiriman</span><b>{rp(selected.shipping_cost)}</b></div><hr/><div><b>Total</b><strong>{rp(selected.total)}</strong></div><div><span>Pembayaran</span>{status(selected.payment.payment_status)}</div>{selected.payment.reason&&<p className="inline-error">{selected.payment.reason}</p>}{selected.order_status==='pending_payment'&&user?.role==='customer'&&<div className="bank-instruction"><b>Transfer bank manual</b><p>{selected.payment.method} · 0000000000<br/>a.n. SHOPEASE DEMO</p><strong>{rp(selected.total)}</strong><small>Rekening simulasi. Jangan transfer uang sungguhan. Unggah gambar contoh bukti untuk pengujian.</small><label className="field">Nama Pengirim Transfer<input id="payment-sender" defaultValue={user?.name||''} minLength={3} maxLength={100} required/></label><label className="upload-button"><Upload size={17}/>{busy?'Mengunggah...':'Unggah Bukti Bayar'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)run(async()=>{const fd=new FormData();fd.set('file',file);fd.set('order_id',selected.id);fd.set('sender_name',(document.getElementById('payment-sender') as HTMLInputElement)?.value||'');await api('upload/proof',undefined,fd);setSelected(await api('orders/'+selected.id));setOrders(await api('orders'));notify('Bukti terkirim untuk diverifikasi')})}}/></label><small>JPG, PNG, WebP · Maksimal 2 MB</small></div>}{selected.payment.proof_file&&<a className="text-link" href={'/api/file/'+selected.payment.proof_file} target="_blank" rel="noreferrer"><ShieldCheck size={15}/> Lihat Bukti Pembayaran</a>}
{user?.role==='admin'&&selected.order_status==='waiting_verification'&&<div className="stack"><button className="btn primary full" disabled={busy} onClick={()=>actionOrder('approve')}>Setujui Pembayaran <Check size={15}/></button><label className="field">Alasan Penolakan<textarea id="rejection-reason" minLength={5} placeholder="Isi alasan jika bukti ditolak"/></label><button className="btn outline danger" disabled={busy} onClick={()=>actionOrder('reject',{reason:(document.getElementById('rejection-reason') as HTMLTextAreaElement).value})}>Tolak Bukti</button></div>}
{['admin','operator'].includes(user?.role)&&selected.order_status==='processing'&&<form className="stack" onSubmit={e=>{e.preventDefault();actionOrder('ship',Object.fromEntries(new FormData(e.currentTarget)))}}><h3>Proses Pengiriman</h3><label className="field">Kurir<input name="courier" required minLength={2} placeholder="Contoh: JNE"/></label><label className="field">Nomor Resi<input name="tracking_number" required minLength={8} pattern="[A-Za-z0-9]{8,80}" placeholder="Minimal 8 huruf/angka"/></label><button className="btn primary full" disabled={busy}>Kirim Pesanan <Truck size={15}/></button></form>}
{selected.order_status==='shipped'&&user?.role!=='operator'&&<button className="btn primary full" disabled={busy} onClick={()=>actionOrder('complete')}>Konfirmasi Diterima <Check size={16}/></button>}
{['pending_payment','waiting_verification'].includes(selected.order_status)&&user?.role!=='operator'&&<button className="text-link danger" disabled={busy} onClick={()=>setModal('cancelOrder')}>Batalkan Pesanan</button>}</div></div><details className="audit-history"><summary>Riwayat aktivitas pesanan</summary>{selected.history.map((h:any,i:number)=><p key={i}>{h.action} <small className="muted"> · {new Date(h.created_at).toLocaleString('id-ID')}</small></p>)}</details></>}
{modal==='cancelOrder'&&<><h2>Batalkan pesanan?</h2><p>Stok akan dikembalikan dan pesanan ini tidak dapat diproses lagi.</p><div className="modal-actions"><button className="btn outline" onClick={()=>setModal('order')}>Kembali</button><button className="btn primary" disabled={busy} onClick={async()=>{await actionOrder('cancel');setModal('order')}}>Ya, Batalkan</button></div></>}
{modal==='editProduct'&&edit&&<><h2>{edit.id?'Ubah Produk':'Tambah Produk'}</h2><form onSubmit={e=>{e.preventDefault();run(async()=>{await api('admin/product',edit);await loadCatalog(true);setModal('');notify('Produk berhasil disimpan')})}}><div className="form-grid"><div><label className="field">Nama Produk<input value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} minLength={3} required/></label><label className="field">Kategori<select value={edit.category_id} onChange={e=>setEdit({...edit,category_id:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="field">Deskripsi<textarea rows={5} minLength={10} required value={edit.description} onChange={e=>setEdit({...edit,description:e.target.value})}/></label></div><div>{edit.image&&<img className="edit-product-photo" src={edit.image} alt="Pratinjau produk"/>}<label className="upload-button"><Upload size={16}/> Unggah Foto Produk<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)run(async()=>{const fd=new FormData();fd.set('file',file);const d=await api('upload/product',undefined,fd);setEdit({...edit,image:d.image});notify('Foto berhasil diunggah')})}}/></label><small className="muted">JPG, PNG, WebP · Maksimal 2 MB</small></div></div><div className="form-grid three">{[['price','Harga Jual (Rp)'],['old_price','Harga Normal (Rp)'],['stock','Stok']].map(([k,l])=><label className="field" key={k}>{l}<input type="number" min="0" step="1" required value={edit[k]} onChange={e=>setEdit({...edit,[k]:Number(e.target.value)})}/></label>)}</div><label className="field">Status<select value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></label><button className="btn primary full" disabled={busy||!edit.image}>Simpan Produk <Check size={16}/></button></form></>}
{modal==='editCategory'&&edit&&<><h2>{edit.id?'Ubah Kategori':'Tambah Kategori'}</h2><form onSubmit={e=>{e.preventDefault();run(async()=>{await api('admin/category',edit);await loadCatalog(true);setModal('');notify('Kategori disimpan')})}}><label className="field">Nama Kategori<input value={edit.name} minLength={2} required onChange={e=>setEdit({...edit,name:e.target.value})}/></label><label className="field">Deskripsi<textarea value={edit.description||''} onChange={e=>setEdit({...edit,description:e.target.value})}/></label><button className="btn primary full" disabled={busy}>Simpan Kategori</button></form></>}
{['deleteCategory','deleteProduct'].includes(modal)&&<><h2>{modal==='deleteCategory'?'Hapus kategori?':'Nonaktifkan produk?'}</h2><p>{edit?.name}</p><p className="muted">{modal==='deleteCategory'?'Kategori yang masih digunakan produk tidak dapat dihapus.':'Produk akan disembunyikan dari katalog. Riwayat pesanan tetap tersimpan.'}</p><div className="modal-actions"><button className="btn outline" onClick={()=>setModal('')}>Kembali</button><button className="btn primary" disabled={busy} onClick={()=>run(async()=>{await api('admin/'+(modal==='deleteCategory'?'category':'product'),{action:'delete',id:edit.id});await loadCatalog(true);setModal('');notify('Perubahan tersimpan')})}>Konfirmasi</button></div></>}
{modal==='guide'&&<><span className="eyebrow">BELANJA DENGAN MUDAH</span><h2>Dari favorit ke depan pintu.</h2><ol className="guide-list"><li><b>Temukan produk favorit</b><p>Gunakan pencarian, filter, atau kategori pilihan.</p></li><li><b>Masuk dan isi keranjang</b><p>Buat akun atau gunakan akun demonstrasi. Atur jumlah sesuai stok.</p></li><li><b>Checkout</b><p>Tambahkan alamat, pilih pengiriman, lalu buat pesanan.</p></li><li><b>Unggah bukti pembayaran</b><p>Gunakan gambar contoh maksimal 2 MB. Admin memverifikasi atau menolak bukti.</p></li><li><b>Pantau dan terima</b><p>Operator mengisi kurir dan resi. Konfirmasi setelah pesanan diterima.</p></li></ol><p className="inline-error">Aplikasi praktikum: rekening, harga, dan pengiriman adalah simulasi.</p></>}
{error&&<p className="inline-error" role="alert">{error}</p>}</section></div>}
</>;
function reportOrders() {
    return (overview?.orders ?? []).filter((order:any) => {
        const status = managementPanel === 'payments' ? order.payment_status : order.order_status;
        if (!panelStatuses.includes(status) || (filterStatus !== 'all' && status !== filterStatus)) return false;
        if (managementPanel !== 'reports') return true;
        const day = order.created_at.slice(0, 10);
        return (!reportStart || day >= reportStart) && (!reportEnd || day <= reportEnd);
    });
}
function OrderTable({list,paymentStatus=false,shipping=false}:{list:any[];paymentStatus?:boolean;shipping?:boolean}){return <div className="table-wrap mobile-order-table"><table><thead><tr><th>Nomor Pesanan</th><th>Pelanggan</th><th>Total</th><th>{paymentStatus?'Pembayaran':shipping?'Pengiriman':'Status'}</th><th>Aksi</th></tr></thead><tbody>{list.map(o=><tr key={o.id}><td data-label="Nomor pesanan"><b>{o.order_number}</b><small className="block muted">{new Date(o.created_at).toLocaleDateString('id-ID')}</small></td><td data-label="Pelanggan">{o.name||o.customer_name}</td><td data-label="Total">{rp(o.total)}</td><td data-label={paymentStatus?'Pembayaran':shipping?'Pengiriman':'Status'}>{status(paymentStatus?o.payment_status:o.order_status)}{shipping&&o.tracking_number&&<small className="block muted">{o.courier} · {o.tracking_number}</small>}</td><td data-label="Aksi"><button className="text-link" onClick={()=>detailOrder(o.id)}>Detail <ChevronRight size={14}/></button></td></tr>)}</tbody></table>{!list.length&&<div className="table-empty"><Package size={28}/><p>Belum ada data pesanan.</p></div>}</div>}
}
