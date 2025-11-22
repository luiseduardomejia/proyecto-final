// Login libre + CRUD en localStorage sin servidoR

document.addEventListener('DOMContentLoaded', () => {
    // Herramientas de uso rápido 
    const $  = (s,r=document)=>r.querySelector(s);                  // selecciona 1
    const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));   // selecciona varios
    const showModal =(d)=>d?.showModal?d.showModal():d?.setAttribute('open','open'); // abre <dialog>
    const closeModal=(d)=>d?.close?d.close():d?.removeAttribute('open');             // cierra <dialog>
    const fmt={                                                    // formateadores
      money:(n)=>'Q '+Number(n).toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2}),
      date :(t)=> new Date(t).toLocaleString('es-GT')
    };
    const esc=(s)=>String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  
    // Claves de localStorage 
    const SK_PRODUCTS='ds_minimal_v4_products';
    const SK_SESSION='ds_minimal_v4_session';
  
    // Referencias del DOM 
    // Login
    const auth=$('#auth'), app=$('#app');
    const loginForm=$('#login-form'), emailIn=$('#email'), passIn=$('#password');
    const userEmail=$('#user-email'), btnLogout=$('#logout');
  
    // UI panel
    const q=$('#q'), btnClear=$('#clear'), btnNew=$('#new');
    const gridBody=$('#grid tbody'), headKeys=$$('#grid thead th[data-key]'), emptyBox=$('#empty');
  
    // Modal
    const dlg=$('#product-modal'), frm=$('#product-form'), title=$('#modal-title');
    const prodId=$('#prod-id'), prodName=$('#prod-name'), prodCat=$('#prod-cat');
    const prodPrice=$('#prod-price'), prodActive=$('#prod-active'), btnCancel=$('#cancel');
  
    // Estado de la app
    let productos=load();               // lista de productos en memoria
    let sortKey='createdAt';            // columna de orden
    let sortDir='desc';                 // dirección de orden
  
    // Sesión login simple
    function showAuth(){auth.style.display='grid';app.style.display='none'}
    function showApp(email){userEmail.textContent=email||'';auth.style.display='none';app.style.display='grid'}
  
    // Al cargar la página: si hay sesión guardada, entra directo
    (function initSession(){
      const s=localStorage.getItem(SK_SESSION);
      s ? (showApp(s), render()) : showAuth();
    })();
  
    // Enviar formulario de login: guarda el correo y muestra la página principal
    loginForm?.addEventListener('submit',e=>{
      e.preventDefault();
      const email=(emailIn?.value||'').trim();
      const pass =(passIn?.value||'');
      if(email && pass){
        localStorage.setItem(SK_SESSION,email);
        showApp(email);
        render();
      }else{
        alert('Ingresa correo y contraseña.');
      }
    });
  
    // Botón "Salir": elimina la “sesión”
    btnLogout?.addEventListener('click',()=>{
      localStorage.removeItem(SK_SESSION);
      showAuth();
    });
  
    // Persistencia en localStorage 
    function load(){
      // Lee productos guardados. Si no hay, devuelve []
      try{ return JSON.parse(localStorage.getItem(SK_PRODUCTS)) || []; }
      catch{ return []; }
    }
    function save(){
      localStorage.setItem(SK_PRODUCTS, JSON.stringify(productos));
    }
  
    // CRUD 
    function clearAll(){
      if(confirm('¿Vaciar todos los productos?')){
        productos=[]; save(); render();
      }
    }
  
    function upsert(p){
      // Si existe id, actualiza; si no, inserta.
      if(p.id){
        const i=productos.findIndex(x=>x.id===p.id);
        if(i>-1) productos[i]={...productos[i], ...p};
      }else{
        p.id=String(Date.now());
        p.createdAt=Date.now();
        productos.push(p);
      }
      save(); render();
    }
  
    function removeItem(id){
      productos = productos.filter(x=>x.id!==id);
      save(); render();
    }
  
    // Filtro, orden y pintado de tabla
    function filtered(list){
      // Texto del buscador en minúsculas
      const t=(q?.value||'').toLowerCase().trim();
      if(!t) return list;
      return list.filter(p =>
        (p.name&&p.name.toLowerCase().includes(t)) ||
        (p.category&&p.category.toLowerCase().includes(t))
      );
    }
  
    function sorted(list){
      // Ordena por la columna indicada (string o número)
      return list.slice().sort((a,b)=>{
        const va=a[sortKey], vb=b[sortKey];
        if(va==null && vb==null) return 0;
        if(va==null) return 1;
        if(vb==null) return -1;
        const r = typeof va==='string' ? va.localeCompare(vb) : (va>vb?1:va<vb?-1:0);
        return sortDir==='asc' ? r : -r;
      });
    }
  
    function render(){
      // Limpia la tabla y vuelve a dibujar según filtro y orden
      const rows = sorted( filtered(productos) );
      gridBody.innerHTML = '';
      emptyBox.hidden = rows.length !== 0;
  
      if(rows.length===0) return;
  
      // Crea una fila por producto
      for(const p of rows){
        const tr=document.createElement('tr');
        tr.innerHTML = `
          <td>${esc(p.name)}</td>
          <td>${esc(p.category)}</td>
          <td>${fmt.money(p.price)}</td>
          <td><span class="muted">${p.active ? 'Activo' : 'Inactivo'}</span></td>
          <td>${fmt.date(p.createdAt)}</td>
          <td class="t-right">
            <button class="btn btn--ghost" data-edit="${p.id}">Editar</button>
            <button class="btn btn--danger" data-del="${p.id}">Eliminar</button>
          </td>`;
        gridBody.appendChild(tr);
      }
    }
  
    // Modal (nuevo/editar)
    function openModal(p){
      if(p){
        // Cargar datos para editar
        title.textContent='Editar producto';
        prodId.value=p.id;
        prodName.value=p.name||'';
        prodCat.value=p.category||'';
        prodPrice.value=p.price!=null?p.price:'';
        prodActive.checked=!!p.active;
      }else{
        // Limpiar para crear
        title.textContent='Nuevo producto';
        prodId.value=''; prodName.value=''; prodCat.value='';
        prodPrice.value=''; prodActive.checked=true;
      }
      showModal(dlg);
    }
  
    // Botón “Cancelar” del modal
    btnCancel?.addEventListener('click',()=>closeModal(dlg));
  
    // Guardar (crear/actualizar) producto
    frm?.addEventListener('submit',e=>{
      e.preventDefault();
      const data={
        id:prodId.value || undefined,
        name:(prodName.value||'').trim(),
        category:(prodCat.value||'').trim(),
        price:Number(prodPrice.value),
        active:!!prodActive.checked
      };
      // Validación simple
      if(!data.name || !data.category || isNaN(data.price)){
        alert('Completa los campos correctamente.');
        return;
      }
      upsert(data);
      closeModal(dlg);
    });
  
    // Eventos de la interfaz 
    q?.addEventListener('input', render);           // filtrar al escribir
    btnClear?.addEventListener('click', clearAll);  // vaciar todo
    btnNew?.addEventListener('click', ()=> openModal()); // abrir modal vacío
  
    // Botones Editar/Eliminar dentro de la tabla (delegación de eventos)
    gridBody?.addEventListener('click', e=>{
      const b=e.target.closest('button'); if(!b) return;
      const idE=b.getAttribute('data-edit');
      const idD=b.getAttribute('data-del');
      if(idE){
        const p=productos.find(x=>x.id===idE);
        if(p) openModal(p);
      }else if(idD){
        const p=productos.find(x=>x.id===idD);
        if(p && confirm(`¿Eliminar "${p.name}"?`)) removeItem(p.id);
      }
    });
  
    // Click en cabeceras para cambiar orden
    headKeys.forEach(th=>{
      th.addEventListener('click', ()=>{
        const key=th.getAttribute('data-key');
        if(!key) return;
        if(sortKey===key) sortDir = (sortDir==='asc' ? 'desc' : 'asc');
        else { sortKey = key; sortDir = 'asc'; }
        render();
      });
    });
  });
  