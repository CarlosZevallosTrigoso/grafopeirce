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
    // Esta única función se llama cada vez que cambia un estado (clic, filtro, etc.)
    function updateGraphVisibility() {
        // Fase 1: Lógica Jerárquica (el colapso en cascada)
        // Oculta todos los nodos que descienden de un padre colapsado.
        cy.nodes('[?children]').forEach(parentNode => {
            if (!parentNode.hasClass('expanded')) {
                const nodesToHide = parentNode.successors();
                nodesToHide.addClass('hidden');
            }
        });

        // Fase 2: Lógica de Filtros
        // Limpia cualquier filtro anterior y aplica el nuevo si existe.
        cy.elements().removeClass('grayed-out grayed-out-edge');
        if (activeFilter) {
            const seedNodes = cy.nodes(`:visible[category = "${activeFilter}"]`);
            const descendants = seedNodes.successors(':visible');
            const nodesToShow = seedNodes.union(descendants);
            const nodesToGray = cy.nodes(':visible').not(nodesToShow);
            nodesToGray.addClass('grayed-out');
            cy.edges(':visible').addClass('grayed-out-edge');
            nodesToShow.connectedEdges(':visible').removeClass('grayed-out-edge');
        }

        // Fase 3: Lógica de Etiquetas
        // Actualiza las etiquetas de los nodos iniciales según su estado de expansión.
        cy.nodes('[?collapsedLabel]').forEach(node => {
            if (node.hasClass('expanded')) {
                node.data('label', node.data('baseLabel'));
            } else {
                node.data('label', node.data('collapsedLabel'));
            }
        });
    }

    // --- CONFIGURACIÓN INICIAL DEL GRAFO ---
    fetch('peirce.json')
        .then(response => response.json())
        .then(data => {
            cy.add(data.elements);
            cy.layout({ name: 'preset', padding: 30 }).run();
            resetView(); // Establece el estado inicial
        });

    // --- MANEJADORES DE EVENTOS (Ahora solo cambian el estado) ---
    const infoPanel = document.getElementById('info-panel');
    const btnPrimeridad = document.getElementById('btn-primeridad');
    const btnSegundidad = document.getElementById('btn-segundidad');
    const btnTerceridad = document.getElementById('btn-terceridad');
    const btnExpand = document.getElementById('btn-expand');
    const btnCollapse = document.getElementById('btn-collapse');

    // Evento de clic en un nodo
    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        const nodeData = clickedNode.data();
        
        infoPanel.innerHTML = `<h3>${nodeData.fullName} (${nodeData.label})</h3><p class="category-badge" style="background-color:${nodeData.color};">${nodeData.category}</p><p>${nodeData.description}</p>`;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        // Solo cambia el estado de expansión. La función maestra hará el resto.
        if (nodeData.children) {
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
    function resetView() {
        cy.nodes().removeClass('expanded'); // Resetea el estado de expansión
        activeFilter = null; // Resetea el filtro
        updateGraphVisibility(); // Aplica el estado reseteado
        setTimeout(() => cy.fit(cy.nodes(':visible'), 50), 50); // Centra la vista
    }

    btnExpand.addEventListener('click', () => {
        cy.nodes('[?children]').addClass('expanded');
        updateGraphVisibility();
    });

    btnCollapse.addEventListener('click', resetView);
});
