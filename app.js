// ============================================
// SISTEMA DE GESTIÓN DE INVESTIGACIÓN
// EEA Illpa - Puno 2026
// ============================================

// ============================================
// ESTADO GLOBAL
// ============================================
let proyectos = [];
let hitos = [];
let tareas = [];
let acciones = [];
let contadores = { proyecto: 1, hito: 1, tarea: 1, accion: 1 };

// ============================================
// PERSISTENCIA (localStorage)
// ============================================
function guardarDatos() {
    const datos = {
        proyectos,
        hitos,
        tareas,
        acciones,
        contadores
    };
    localStorage.setItem('sistema_investigacion', JSON.stringify(datos));
}

function cargarDatos() {
    const datosGuardados = localStorage.getItem('sistema_investigacion');
    if (datosGuardados) {
        try {
            const datos = JSON.parse(datosGuardados);
            proyectos = datos.proyectos || [];
            hitos = datos.hitos || [];
            tareas = datos.tareas || [];
            acciones = datos.acciones || [];
            contadores = datos.contadores || { proyecto: 1, hito: 1, tarea: 1, accion: 1 };
        } catch (e) {
            console.error('Error al cargar datos:', e);
        }
    }
}

// ============================================
// NAVEGACIÓN POR TABS
// ============================================
function cambiarTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('activo'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));
    
    document.getElementById(`tab-${tab}`).classList.add('activo');
    event.target.classList.add('activo');
    
    // Re-renderizar según la pestaña
    if (tab === 'dashboard') renderizarDashboard();
    if (tab === 'proyectos') renderizarProyectos();
    if (tab === 'hitos') renderizarHitos();
    if (tab === 'tareas') renderizarTareas();
    if (tab === 'reportes') document.getElementById('reporte-contenido').innerHTML = '';
}

// ============================================
// DASHBOARD
// ============================================
function renderizarDashboard() {
    document.getElementById('stat-proyectos').textContent = 
        proyectos.filter(p => p.estado === 'Activo').length;
    document.getElementById('stat-hitos').textContent = hitos.length;
    document.getElementById('stat-tareas').textContent = 
        tareas.filter(t => t.estado !== 'Completado').length;
    document.getElementById('stat-evidencias').textContent = 
        acciones.filter(a => a.evidencia).length;
    
    const contenedor = document.getElementById('progreso-proyectos');
    
    if (proyectos.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <h3>📁 No hay proyectos registrados</h3>
                <p>Crea tu primer proyecto para comenzar</p>
                <button class="btn-primary" onclick="abrirModalProyecto()">➕ Nuevo Proyecto</button>
            </div>
        `;
        return;
    }
    
    contenedor.innerHTML = proyectos.map(p => {
        const progreso = calcularProgresoProyecto(p.id);
        return `
            <div class="progreso-item">
                <div class="progreso-header">
                    <div class="progreso-titulo">${p.titulo}</div>
                    <div class="progreso-porcentaje">${progreso}%</div>
                </div>
                <div class="progreso-barra">
                    <div class="progreso-relleno" style="width: ${progreso}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function calcularProgresoProyecto(proyectoId) {
    const hitosProyecto = hitos.filter(h => h.proyectoId === proyectoId);
    if (hitosProyecto.length === 0) return 0;
    
    const tareasProyecto = tareas.filter(t => 
        hitosProyecto.some(h => h.id === t.hitoId)
    );
    if (tareasProyecto.length === 0) return 0;
    
    const completadas = tareasProyecto.filter(t => t.estado === 'Completado').length;
    return Math.round((completadas / tareasProyecto.length) * 100);
}

// ============================================
// PROYECTOS
// ============================================
function renderizarProyectos() {
    const contenedor = document.getElementById('lista-proyectos');
    
    if (proyectos.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <h3>📁 No hay proyectos</h3>
                <p>Crea tu primer proyecto de investigación</p>
                <button class="btn-primary" onclick="abrirModalProyecto()">➕ Nuevo Proyecto</button>
            </div>
        `;
        return;
    }
    
    contenedor.innerHTML = proyectos.map(p => {
        const badgeClass = p.estado === 'Activo' ? 'badge-activo' : 
                          p.estado === 'En Pausa' ? 'badge-pausa' : 'badge-cancelado';
        const numHitos = hitos.filter(h => h.proyectoId === p.id).length;
        const progreso = calcularProgresoProyecto(p.id);
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">${p.titulo}</div>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="editarProyecto(${p.id})" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="eliminarProyecto(${p.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div class="card-meta">
                    <div class="card-meta-item">👤 ${p.investigador}</div>
                    <div class="card-meta-item">📅 ${p.anioInicio} - ${p.anioFin}</div>
                    <div class="card-meta-item">📅 ${numHitos} hitos registrados</div>
                </div>
                <div class="progreso-barra" style="margin-top:10px;">
                    <div class="progreso-relleno" style="width: ${progreso}%"></div>
                </div>
                <div class="card-footer">
                    <span class="badge ${badgeClass}">${p.estado}</span>
                    <span style="font-size:0.85em; color:var(--color-texto-suave); font-weight:600;">${progreso}%</span>
                </div>
            </div>
        `;
    }).join('');
}

function abrirModalProyecto(id = null) {
    const modal = document.getElementById('modal-proyecto');
    const titulo = document.getElementById('modal-proyecto-titulo');
    
    if (id) {
        const p = proyectos.find(x => x.id === id);
        titulo.textContent = 'Editar Proyecto';
        document.getElementById('proyecto-id').value = p.id;
        document.getElementById('proyecto-titulo').value = p.titulo;
        document.getElementById('proyecto-investigador').value = p.investigador;
        document.getElementById('proyecto-anio-inicio').value = p.anioInicio;
        document.getElementById('proyecto-anio-fin').value = p.anioFin;
        document.getElementById('proyecto-descripcion').value = p.descripcion || '';
        document.getElementById('proyecto-estado').value = p.estado;
    } else {
        titulo.textContent = 'Nuevo Proyecto';
        document.getElementById('proyecto-id').value = '';
        document.getElementById('proyecto-titulo').value = '';
        document.getElementById('proyecto-investigador').value = '';
        document.getElementById('proyecto-anio-inicio').value = 2026;
        document.getElementById('proyecto-anio-fin').value = 2027;
        document.getElementById('proyecto-descripcion').value = '';
        document.getElementById('proyecto-estado').value = 'Activo';
    }
    
    modal.classList.remove('oculto');
}

function guardarProyecto() {
    const id = document.getElementById('proyecto-id').value;
    const datos = {
        titulo: document.getElementById('proyecto-titulo').value.trim(),
        investigador: document.getElementById('proyecto-investigador').value.trim(),
        anioInicio: parseInt(document.getElementById('proyecto-anio-inicio').value),
        anioFin: parseInt(document.getElementById('proyecto-anio-fin').value),
        descripcion: document.getElementById('proyecto-descripcion').value.trim(),
        estado: document.getElementById('proyecto-estado').value
    };
    
    if (!datos.titulo || !datos.investigador) {
        alert('Por favor completa los campos obligatorios (*)');
        return;
    }
    
    if (id) {
        const index = proyectos.findIndex(p => p.id == id);
        proyectos[index] = { ...proyectos[index], ...datos };
    } else {
        proyectos.push({ id: contadores.proyecto++, ...datos });
    }
    
    guardarDatos();
    cerrarModal('modal-proyecto');
    renderizarProyectos();
    renderizarDashboard();
}

function editarProyecto(id) { abrirModalProyecto(id); }

function eliminarProyecto(id) {
    if (!confirm('¿Eliminar este proyecto? Se eliminarán también sus hitos, tareas y acciones.')) return;
    
    hitos.filter(h => h.proyectoId === id).forEach(h => {
        tareas.filter(t => t.hitoId === h.id).forEach(t => {
            acciones = acciones.filter(a => a.tareaId !== t.id);
        });
        tareas = tareas.filter(t => t.hitoId !== h.id);
    });
    hitos = hitos.filter(h => h.proyectoId !== id);
    proyectos = proyectos.filter(p => p.id !== id);
    
    guardarDatos();
    renderizarProyectos();
    renderizarDashboard();
}

// ============================================
// HITOS
// ============================================
function renderizarHitos() {
    const filtroProyecto = document.getElementById('filtro-proyecto-hito')?.value || '';
    const filtroEstado = document.getElementById('filtro-estado-hito')?.value || '';
    
    // Actualizar filtro de proyectos
    const selectFiltro = document.getElementById('filtro-proyecto-hito');
    if (selectFiltro) {
        const valorActual = selectFiltro.value;
        selectFiltro.innerHTML = '<option value="">Todos los proyectos</option>' + 
            proyectos.map(p => `<option value="${p.id}">${p.titulo}</option>`).join('');
        selectFiltro.value = valorActual;
    }
    
    let lista = hitos;
    if (filtroProyecto) lista = lista.filter(h => h.proyectoId == filtroProyecto);
    if (filtroEstado) lista = lista.filter(h => h.estado === filtroEstado);
    
    const contenedor = document.getElementById('lista-hitos');
    
    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <h3>📅 No hay hitos registrados</h3>
                <p>Crea tu primer hito anual</p>
                <button class="btn-primary" onclick="abrirModalHito()">➕ Nuevo Hito</button>
            </div>
        `;
        return;
    }
    
    contenedor.innerHTML = lista.map(h => {
        const proyecto = proyectos.find(p => p.id === h.proyectoId);
        const tareasHito = tareas.filter(t => t.hitoId === h.id);
        const completadas = tareasHito.filter(t => t.estado === 'Completado').length;
        const progreso = tareasHito.length > 0 ? Math.round((completadas / tareasHito.length) * 100) : 0;
        const badgeClass = obtenerBadgeEstado(h.estado);
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">${h.titulo}</div>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="editarHito(${h.id})" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="eliminarHito(${h.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div class="card-meta">
                    <div class="card-meta-item">📁 ${proyecto ? proyecto.titulo : 'Sin proyecto'}</div>
                    <div class="card-meta-item">🎯 Meta: ${h.meta}</div>
                    <div class="card-meta-item">📅 Año ${h.anio} ${h.fechaLimite ? '| Límite: ' + h.fechaLimite : ''}</div>
                    <div class="card-meta-item">✅ ${completadas}/${tareasHito.length} tareas completadas</div>
                </div>
                <div class="progreso-barra">
                    <div class="progreso-relleno" style="width: ${progreso}%"></div>
                </div>
                <div class="card-footer">
                    <span class="badge ${badgeClass}">${h.estado}</span>
                    <span style="font-size:0.85em; color:var(--color-texto-suave); font-weight:600;">${progreso}%</span>
                </div>
            </div>
        `;
    }).join('');
}

function abrirModalHito(id = null) {
    const modal = document.getElementById('modal-hito');
    const titulo = document.getElementById('modal-hito-titulo');
    const selectProyecto = document.getElementById('hito-proyecto');
    
    // Llenar select de proyectos
    selectProyecto.innerHTML = proyectos.map(p => 
        `<option value="${p.id}">${p.titulo}</option>`
    ).join('');
    
    if (proyectos.length === 0) {
        alert('Primero debes crear un proyecto');
        return;
    }
    
    if (id) {
        const h = hitos.find(x => x.id === id);
        titulo.textContent = 'Editar Hito';
        document.getElementById('hito-id').value = h.id;
        selectProyecto.value = h.proyectoId;
        document.getElementById('hito-titulo').value = h.titulo;
        document.getElementById('hito-meta').value = h.meta;
        document.getElementById('hito-anio').value = h.anio;
        document.getElementById('hito-fecha-limite').value = h.fechaLimite || '';
        document.getElementById('hito-estado').value = h.estado;
        document.getElementById('hito-descripcion').value = h.descripcion || '';
    } else {
        titulo.textContent = 'Nuevo Hito';
        document.getElementById('hito-id').value = '';
        document.getElementById('hito-titulo').value = '';
        document.getElementById('hito-meta').value = '';
        document.getElementById('hito-anio').value = 2026;
        document.getElementById('hito-fecha-limite').value = '';
        document.getElementById('hito-estado').value = 'Pendiente';
        document.getElementById('hito-descripcion').value = '';
    }
    
    modal.classList.remove('oculto');
}

function guardarHito() {
    const id = document.getElementById('hito-id').value;
    const datos = {
        proyectoId: parseInt(document.getElementById('hito-proyecto').value),
        titulo: document.getElementById('hito-titulo').value.trim(),
        meta: document.getElementById('hito-meta').value.trim(),
        anio: parseInt(document.getElementById('hito-anio').value),
        fechaLimite: document.getElementById('hito-fecha-limite').value,
        estado: document.getElementById('hito-estado').value,
        descripcion: document.getElementById('hito-descripcion').value.trim()
    };
    
    if (!datos.titulo || !datos.meta) {
        alert('Por favor completa los campos obligatorios (*)');
        return;
    }
    
    if (id) {
        const index = hitos.findIndex(h => h.id == id);
        hitos[index] = { ...hitos[index], ...datos };
    } else {
        hitos.push({ id: contadores.hito++, ...datos });
    }
    
    guardarDatos();
    cerrarModal('modal-hito');
    renderizarHitos();
    renderizarDashboard();
}

function editarHito(id) { abrirModalHito(id); }

function eliminarHito(id) {
    if (!confirm('¿Eliminar este hito? Se eliminarán también sus tareas y acciones.')) return;
    
    tareas.filter(t => t.hitoId === id).forEach(t => {
        acciones = acciones.filter(a => a.tareaId !== t.id);
    });
    tareas = tareas.filter(t => t.hitoId !== id);
    hitos = hitos.filter(h => h.id !== id);
    
    guardarDatos();
    renderizarHitos();
    renderizarDashboard();
}

// ============================================
// TAREAS
// ============================================
function renderizarTareas() {
    const filtroHito = document.getElementById('filtro-hito-tarea')?.value || '';
    const filtroEstado = document.getElementById('filtro-estado-tarea')?.value || '';
    
    // Actualizar filtro de hitos
    const selectFiltro = document.getElementById('filtro-hito-tarea');
    if (selectFiltro) {
        const valorActual = selectFiltro.value;
        selectFiltro.innerHTML = '<option value="">Todos los hitos</option>' + 
            hitos.map(h => `<option value="${h.id}">${h.titulo}</option>`).join('');
        selectFiltro.value = valorActual;
    }
    
    let lista = tareas;
    if (filtroHito) lista = lista.filter(t => t.hitoId == filtroHito);
    if (filtroEstado) lista = lista.filter(t => t.estado === filtroEstado);
    
    const contenedor = document.getElementById('lista-tareas');
    
    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <h3>✅ No hay tareas registradas</h3>
                <p>Crea tu primera tarea</p>
                <button class="btn-primary" onclick="abrirModalTarea()">➕ Nueva Tarea</button>
            </div>
        `;
        return;
    }
    
    contenedor.innerHTML = lista.map(t => {
        const hito = hitos.find(h => h.id === t.hitoId);
        const accionesTarea = acciones.filter(a => a.tareaId === t.id);
        const completadas = accionesTarea.filter(a => a.estado === 'Completado').length;
        const progreso = accionesTarea.length > 0 ? Math.round((completadas / accionesTarea.length) * 100) : 0;
        const badgeClass = obtenerBadgeEstado(t.estado);
        
        return `
            <div class="task-card">
                <div class="task-header">
                    <div class="task-title">${t.titulo}</div>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="verDetalleTarea(${t.id})" title="Ver acciones">👁️</button>
                        <button class="btn-icon" onclick="editarTarea(${t.id})" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="eliminarTarea(${t.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div class="task-meta">
                    <span>📅 Hito: ${hito ? hito.titulo : 'Sin hito'}</span>
                    ${t.responsable ? `<span>👤 ${t.responsable}</span>` : ''}
                    ${t.fechaLimite ? `<span>📆 ${t.fechaLimite}</span>` : ''}
                </div>
                <div class="task-progress">
                    <span>${completadas}/${accionesTarea.length} acciones</span>
                    <div class="mini-progress">
                        <div class="mini-progress-fill" style="width: ${progreso}%"></div>
                    </div>
                    <span class="badge ${badgeClass}">${t.estado}</span>
                </div>
            </div>
        `;
    }).join('');
}

function abrirModalTarea(id = null) {
    const modal = document.getElementById('modal-tarea');
    const titulo = document.getElementById('modal-tarea-titulo');
    const selectHito = document.getElementById('tarea-hito');
    
    selectHito.innerHTML = hitos.map(h => 
        `<option value="${h.id}">${h.titulo}</option>`
    ).join('');
    
    if (hitos.length === 0) {
        alert('Primero debes crear un hito');
        return;
    }
    
    if (id) {
        const t = tareas.find(x => x.id === id);
        titulo.textContent = 'Editar Tarea';
        document.getElementById('tarea-id').value = t.id;
        selectHito.value = t.hitoId;
        document.getElementById('tarea-titulo').value = t.titulo;
        document.getElementById('tarea-responsable').value = t.responsable || '';
        document.getElementById('tarea-fecha-limite').value = t.fechaLimite || '';
        document.getElementById('tarea-estado').value = t.estado;
        document.getElementById('tarea-descripcion').value = t.descripcion || '';
    } else {
        titulo.textContent = 'Nueva Tarea';
        document.getElementById('tarea-id').value = '';
        document.getElementById('tarea-titulo').value = '';
        document.getElementById('tarea-responsable').value = '';
        document.getElementById('tarea-fecha-limite').value = '';
        document.getElementById('tarea-estado').value = 'Pendiente';
        document.getElementById('tarea-descripcion').value = '';
    }
    
    modal.classList.remove('oculto');
}

function guardarTarea() {
    const id = document.getElementById('tarea-id').value;
    const datos = {
        hitoId: parseInt(document.getElementById('tarea-hito').value),
        titulo: document.getElementById('tarea-titulo').value.trim(),
        responsable: document.getElementById('tarea-responsable').value.trim(),
        fechaLimite: document.getElementById('tarea-fecha-limite').value,
        estado: document.getElementById('tarea-estado').value,
        descripcion: document.getElementById('tarea-descripcion').value.trim()
    };
    
    if (!datos.titulo) {
        alert('Por favor completa el título de la tarea');
        return;
    }
    
    if (id) {
        const index = tareas.findIndex(t => t.id == id);
        tareas[index] = { ...tareas[index], ...datos };
    } else {
        tareas.push({ id: contadores.tarea++, ...datos });
    }
    
    guardarDatos();
    cerrarModal('modal-tarea');
    renderizarTareas();
    renderizarDashboard();
}

function editarTarea(id) { abrirModalTarea(id); }

function eliminarTarea(id) {
    if (!confirm('¿Eliminar esta tarea? Se eliminarán también sus acciones.')) return;
    acciones = acciones.filter(a => a.tareaId !== id);
    tareas = tareas.filter(t => t.id !== id);
    guardarDatos();
    renderizarTareas();
    renderizarDashboard();
}

// ============================================
// DETALLE DE TAREA (ACCIONES)
// ============================================
function verDetalleTarea(tareaId) {
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea) return;
    
    const accionesTarea = acciones.filter(a => a.tareaId === tareaId);
    const hito = hitos.find(h => h.id === tarea.hitoId);
    
    document.getElementById('detalle-tarea-titulo').textContent = tarea.titulo;
    
    const body = document.getElementById('detalle-tarea-body');
    
    let html = `
        <div style="margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid var(--color-borde);">
            <div style="font-size:0.9em; color:var(--color-texto-suave); margin-bottom:8px;">
                <strong>Hito:</strong> ${hito ? hito.titulo : 'Sin hito'}
            </div>
            ${tarea.responsable ? `<div style="font-size:0.9em; color:var(--color-texto-suave); margin-bottom:8px;"><strong>Responsable:</strong> ${tarea.responsable}</div>` : ''}
            ${tarea.fechaLimite ? `<div style="font-size:0.9em; color:var(--color-texto-suave); margin-bottom:8px;"><strong>Fecha límite:</strong> ${tarea.fechaLimite}</div>` : ''}
            ${tarea.descripcion ? `<div style="font-size:0.9em; color:var(--color-texto-suave); margin-bottom:8px;"><strong>Descripción:</strong> ${tarea.descripcion}</div>` : ''}
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="color:var(--inia-gris); font-size:1.05em;">🎯 Acciones (${accionesTarea.length})</h4>
            <button class="btn-primary" onclick="abrirModalAccion(${tareaId})">➕ Nueva Acción</button>
        </div>
    `;
    
    if (accionesTarea.length === 0) {
        html += `<div class="sin-evidencias">No hay acciones registradas para esta tarea.</div>`;
    } else {
        html += '<div class="acciones-lista">';
        accionesTarea.forEach(a => {
            const badgeClass = obtenerBadgeEstado(a.estado);
            html += `
                <div class="accion-item">
                    <div class="accion-info">
                        <div class="accion-descripcion">${a.descripcion}</div>
                        <div class="accion-meta">
                            ${a.responsable ? `<span>👤 ${a.responsable}</span>` : ''}
                            ${a.fecha ? `<span>📆 ${a.fecha}</span>` : ''}
                            <span class="badge ${badgeClass}">${a.estado}</span>
                        </div>
                        ${a.notas ? `<div style="font-size:0.8em; color:var(--color-texto-suave); margin-top:8px;">📝 ${a.notas}</div>` : ''}
                        ${a.evidencia ? `<a href="${a.evidencia}" target="_blank" rel="noopener noreferrer" class="accion-evidencia">📎 Ver Evidencia</a>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="editarAccion(${a.id}, ${tareaId})" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="eliminarAccion(${a.id}, ${tareaId})" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    body.innerHTML = html;
    document.getElementById('modal-detalle-tarea').classList.remove('oculto');
}

// ============================================
// ACCIONES
// ============================================
function abrirModalAccion(tareaId, accionId = null) {
    document.getElementById('accion-tarea-id').value = tareaId;
    
    if (accionId) {
        const a = acciones.find(x => x.id === accionId);
        document.getElementById('modal-accion-titulo').textContent = 'Editar Acción';
        document.getElementById('accion-id').value = a.id;
        document.getElementById('accion-descripcion').value = a.descripcion;
        document.getElementById('accion-responsable').value = a.responsable || '';
        document.getElementById('accion-fecha').value = a.fecha || '';
        document.getElementById('accion-estado').value = a.estado;
        document.getElementById('accion-evidencia').value = a.evidencia || '';
        document.getElementById('accion-notas').value = a.notas || '';
    } else {
        document.getElementById('modal-accion-titulo').textContent = 'Nueva Acción';
        document.getElementById('accion-id').value = '';
        document.getElementById('accion-descripcion').value = '';
        document.getElementById('accion-responsable').value = '';
        document.getElementById('accion-fecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('accion-estado').value = 'Pendiente';
        document.getElementById('accion-evidencia').value = '';
        document.getElementById('accion-notas').value = '';
    }
    
    document.getElementById('modal-accion').classList.remove('oculto');
}

function guardarAccion() {
    const id = document.getElementById('accion-id').value;
    const tareaId = parseInt(document.getElementById('accion-tarea-id').value);
    const datos = {
        tareaId,
        descripcion: document.getElementById('accion-descripcion').value.trim(),
        responsable: document.getElementById('accion-responsable').value.trim(),
        fecha: document.getElementById('accion-fecha').value,
        estado: document.getElementById('accion-estado').value,
        evidencia: document.getElementById('accion-evidencia').value.trim(),
        notas: document.getElementById('accion-notas').value.trim()
    };
    
    if (!datos.descripcion) {
        alert('Por favor completa la descripción de la acción');
        return;
    }
    
    if (id) {
        const index = acciones.findIndex(a => a.id == id);
        acciones[index] = { ...acciones[index], ...datos };
    } else {
        acciones.push({ id: contadores.accion++, ...datos });
    }
    
    // Actualizar estado de la tarea si todas las acciones están completadas
    actualizarEstadoTareaAutomatico(tareaId);
    
    guardarDatos();
    cerrarModal('modal-accion');
    verDetalleTarea(tareaId);
    renderizarTareas();
    renderizarDashboard();
}

function editarAccion(accionId, tareaId) {
    abrirModalAccion(tareaId, accionId);
}

function eliminarAccion(accionId, tareaId) {
    if (!confirm('¿Eliminar esta acción?')) return;
    acciones = acciones.filter(a => a.id !== accionId);
    actualizarEstadoTareaAutomatico(tareaId);
    guardarDatos();
    verDetalleTarea(tareaId);
    renderizarTareas();
    renderizarDashboard();
}

function actualizarEstadoTareaAutomatico(tareaId) {
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea) return;
    
    const accionesTarea = acciones.filter(a => a.tareaId === tareaId);
    if (accionesTarea.length === 0) return;
    
    const todasCompletadas = accionesTarea.every(a => a.estado === 'Completado');
    const algunaEnProgreso = accionesTarea.some(a => a.estado === 'En Progreso' || a.estado === 'Completado');
    
    if (todasCompletadas) {
        tarea.estado = 'Completado';
    } else if (algunaEnProgreso) {
        tarea.estado = 'En Progreso';
    }
}

// ============================================
// REPORTES
// ============================================
function generarReporte(tipo) {
    const contenedor = document.getElementById('reporte-contenido');
    let html = '';
    
    if (tipo === 'proyectos') {
        if (proyectos.length === 0) {
            html = '<div class="empty-state"><h3>No hay proyectos para reportar</h3></div>';
        } else {
            html = `
                <h3 style="margin-bottom:15px; color:var(--inia-gris);">📁 Reporte de Proyectos</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Proyecto</th>
                            <th>Investigador</th>
                            <th>Período</th>
                            <th>Estado</th>
                            <th>Progreso</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${proyectos.map(p => `
                            <tr>
                                <td><strong>${p.titulo}</strong></td>
                                <td>${p.investigador}</td>
                                <td>${p.anioInicio} - ${p.anioFin}</td>
                                <td><span class="badge ${p.estado === 'Activo' ? 'badge-activo' : 'badge-pausa'}">${p.estado}</span></td>
                                <td><strong>${calcularProgresoProyecto(p.id)}%</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } else if (tipo === 'hitos') {
        if (hitos.length === 0) {
            html = '<div class="empty-state"><h3>No hay hitos para reportar</h3></div>';
        } else {
            html = `
                <h3 style="margin-bottom:15px; color:var(--inia-gris);">📅 Reporte de Hitos</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Hito</th>
                            <th>Proyecto</th>
                            <th>Meta</th>
                            <th>Año</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hitos.map(h => {
                            const p = proyectos.find(x => x.id === h.proyectoId);
                            return `
                                <tr>
                                    <td><strong>${h.titulo}</strong></td>
                                    <td>${p ? p.titulo : '-'}</td>
                                    <td>${h.meta}</td>
                                    <td>${h.anio}</td>
                                    <td><span class="badge ${obtenerBadgeEstado(h.estado)}">${h.estado}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }
    } else if (tipo === 'tareas') {
        if (tareas.length === 0) {
            html = '<div class="empty-state"><h3>No hay tareas para reportar</h3></div>';
        } else {
            html = `
                <h3 style="margin-bottom:15px; color:var(--inia-gris);">✅ Reporte de Tareas</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Tarea</th>
                            <th>Hito</th>
                            <th>Responsable</th>
                            <th>Acciones</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tareas.map(t => {
                            const h = hitos.find(x => x.id === t.hitoId);
                            const numAcciones = acciones.filter(a => a.tareaId === t.id).length;
                            return `
                                <tr>
                                    <td><strong>${t.titulo}</strong></td>
                                    <td>${h ? h.titulo : '-'}</td>
                                    <td>${t.responsable || '-'}</td>
                                    <td>${numAcciones}</td>
                                    <td><span class="badge ${obtenerBadgeEstado(t.estado)}">${t.estado}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }
    } else if (tipo === 'evidencias') {
        const conEvidencia = acciones.filter(a => a.evidencia);
        if (conEvidencia.length === 0) {
            html = '<div class="empty-state"><h3>No hay evidencias registradas</h3><p>Sube evidencias en las acciones de cada tarea.</p></div>';
        } else {
            html = `
                <h3 style="margin-bottom:15px; color:var(--inia-gris);">📎 Reporte de Evidencias (${conEvidencia.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Acción</th>
                            <th>Fecha</th>
                            <th>Responsable</th>
                            <th>Evidencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${conEvidencia.map(a => `
                            <tr>
                                <td>${a.descripcion}</td>
                                <td>${a.fecha || '-'}</td>
                                <td>${a.responsable || '-'}</td>
                                <td><a href="${a.evidencia}" target="_blank" rel="noopener noreferrer" style="color:var(--inia-verde); font-weight:600;">📎 Abrir</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
    
    contenedor.innerHTML = html;
}

// ============================================
// UTILIDADES
// ============================================
function obtenerBadgeEstado(estado) {
    switch(estado) {
        case 'Pendiente': return 'badge-pendiente';
        case 'En Progreso': return 'badge-progreso';
        case 'Completado': return 'badge-completado';
        case 'Retrasado': return 'badge-retrasado';
        default: return 'badge-pendiente';
    }
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('oculto');
}

function exportarDatos() {
    const datos = {
        proyectos,
        hitos,
        tareas,
        acciones,
        fechaExportacion: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investigacion_eea_illpa_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// INICIAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    renderizarDashboard();
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.oculto)').forEach(m => m.classList.add('oculto'));
        }
    });
    
    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('oculto');
        });
    });
});