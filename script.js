document.addEventListener('DOMContentLoaded', function() {

    let activeFilter = null;

    const cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)', 'background-color': 'data(color)', 'color': '#fff', 'text-valign': 'center',
                    'text-halign': 'center', 'font-size': '14px', 'width': '50px', 'height': '50px',
                    'text-outline-width': 2, 'text-outline-color': 'data(color)', 'border-width': 2, 'border-color': '#fff',
                    'transition-property': 'opacity, background-color, border-color, border-width', 'transition-duration': '0.3s'
                }
            },
            {
                selector: 'node[?children]',
                style: { 'border-width': 4, 'border-color': '#000', 'cursor': 'pointer' }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2, 'line-color': '#ccc', 'target-arrow-color': '#ccc', 'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier', 'transition-property': 'opacity, line-color, target-arrow-color', 'transition-duration': '0.3s'
                }
            },
            { selector: '.hidden', style: { 'display': 'none' } },
            { selector: '.highlighted', style: { 'border-width': 5, 'border-color': '#FFD700' } },
            { selector: '.grayed-out', style: { 'background-color': '#B0B0B0', 'text-outline-color': '#B0B0B0', 'opacity': 0.5 } },
            { selector: '.grayed-out-edge', style: { 'line-color': '#E0E0E0', 'target-arrow-color': '#E0E0E0', 'opacity': 0.5 } },
            { selector: '.expanded', style: { 'border-color': '#A020F0' } }
        ]
    });

    // --- FUNCIÓN MAESTRA DE VISIBILIDAD ---
    // Esta es la única función que decide qué se ve y qué no.
    function updateGraphVisibility() {
        // 1. Oculta todo por defecto, excepto los 3 nodos iniciales.
        cy.elements().not('#n1, #n2, #n10').addClass('hidden');

        // 2. Recorre los nodos padres y muestra a sus hijos si están expandidos.
        // Esto se hace en un bucle para manejar expansiones anidadas (hijos de hijos).
        let nodesToCheck = cy.nodes('.expanded');
        nodesToCheck.forEach(parentNode => {
            const children = cy.nodes(parentNode.data('children').map(id => `#${id}`).join(', '));
            children.removeClass('hidden');
        });

        // 3. Muestra las aristas que conectan nodos visibles.
        cy.edges().addClass('hidden');
        cy.nodes(':visible').connectedEdges().removeClass('hidden');
        
        // 4. Aplica el filtro de categoría si hay uno activo.
        applyFilter();

        // 5. Actualiza las etiquetas de los nodos especiales.
        updateLabels();
    }

    // Función auxiliar para las etiquetas
    function updateLabels() {
        cy.nodes('[?collapsedLabel]').forEach(node => {
            if (node.hasClass('expanded')) {
                node.data('label', node.data('baseLabel'));
            } else {
                node.data('label', node.data('collapsedLabel'));
            }
        });
    }

    // Función auxiliar para los filtros
    function applyFilter() {
        cy.elements().removeClass('grayed-out grayed-out-edge');
        if (activeFilter) {
            const nodesToGray = cy.nodes(`:visible[category != "${activeFilter}"]`);
            nodesToGray.addClass('grayed-out');
            cy.edges(':visible').addClass('grayed-out-edge');
        }
    }
    
    // --- CONFIGURACIÓN INICIAL DEL GRAFO ---
    fetch('peirce.json')
        .then(response => response.json())
        .then(data => {
            cy.add(data.elements);
            resetView();
        });

    // --- MANEJADORES DE EVENTOS ---
    const infoPanel = document.getElementById('info-panel');
    const btnPrimeridad = document.getElementById('btn-primeridad');
    const btnSegundidad = document.getElementById('btn-segundidad');
    const btnTerceridad = document.getElementById('btn-terceridad');
    const btnExpand = document.getElementById('btn-expand');
    const btnCollapse = document.getElementById('btn-collapse');

    // Función para resetear el grafo a su estado inicial.
    function resetView() {
        cy.nodes().removeClass('expanded');
        activeFilter = null;
        updateGraphVisibility();
        setTimeout(() => cy.fit(cy.nodes(':visible'), 50), 50);
    }

    // Evento de clic en un nodo
    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        
        infoPanel.innerHTML = `<h3>${clickedNode.data('fullName')} (${clickedNode.data('label')})</h3><p class="category-badge" style="background-color:${clickedNode.data('color')};">${clickedNode.data('category')}</p><p>${clickedNode.data('description')}</p>`;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        // Solo cambia el estado de expansión. La función maestra hará el resto.
        if (clickedNode.data('children')) {
            clickedNode.toggleClass('expanded');
            updateGraphVisibility();
        }
    });
    
    // Evento de clic en un botón de filtro
    function handleFilterClick(category) {
        activeFilter = (activeFilter === category) ? null : category;
        updateGraphVisibility();
    }
    btnPrimeridad.addEventListener('click', () => handleFilterClick('Primeridad'));
    btnSegundidad.addEventListener('click', () => handleFilterClick('Segundidad'));
    btnTerceridad.addEventListener('click', () => handleFilterClick('Terceridad'));

    // Eventos de botones de control global
    btnExpand.addEventListener('click', () => {
        cy.nodes('[?children]').addClass('expanded');
        updateGraphVisibility();
    });

    btnCollapse.addEventListener('click', resetView);
});
