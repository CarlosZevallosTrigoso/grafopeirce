document.addEventListener('DOMContentLoaded', function() {

    // 1. INICIALIZAR CYTOSCAPE
    const cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            // Estilo para nodos
            {
                selector: 'node',
                style: {
                    'label': 'data(label)', 'background-color': 'data(color)', 'color': '#fff', 'text-valign': 'center',
                    'text-halign': 'center', 'font-size': '14px', 'width': '50px', 'height': '50px',
                    'text-outline-width': 2, 'text-outline-color': 'data(color)',
                    'transition-property': 'opacity, border-width, shape', 'transition-duration': '0.3s'
                }
            },
            // Estilo para nodos "padre" que se pueden expandir
            {
                selector: 'node[?children]',
                style: {
                    'shape': 'diamond', // Forma de diamante para indicar que es expandible
                    'cursor': 'pointer'
                }
            },
            // Estilo para aristas
            {
                selector: 'edge',
                style: {
                    'width': 2, 'line-color': '#ccc', 'target-arrow-color': '#ccc', 'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier', 'transition-property': 'opacity', 'transition-duration': '0.3s'
                }
            },
            // --- Clases dinámicas ---
            { selector: '.hidden', style: { 'display': 'none' } },
            { selector: '.highlighted', style: { 'border-width': 4, 'border-color': '#333' } },
            { selector: '.faded', style: { 'opacity': 0.15 } },
            { selector: '.expanded', style: { 'border-width': 6, 'border-color': '#A020F0' } } // Borde púrpura para padres expandidos
        ]
    });

    // 2. CARGAR Y PREPARAR EL GRAFO
    fetch('peirce.json')
        .then(response => response.json())
        .then(data => {
            cy.add(data.elements);
            cy.layout({ name: 'preset', padding: 30 }).run();
            cy.fit();
            
            // Ocultar los nodos marcados al inicio
            hideInitialNodes();
        });

    // 3. MANEJAR INTERACTIVIDAD
    const infoPanel = document.getElementById('info-panel');
    const btnPrimeridad = document.getElementById('btn-primeridad');
    const btnSegundidad = document.getElementById('btn-segundidad');
    const btnTerceridad = document.getElementById('btn-terceridad');
    const btnReset = document.getElementById('btn-reset');

    function hideInitialNodes() {
        const nodesToHide = cy.nodes('[?isInitiallyHidden]');
        nodesToHide.addClass('hidden');
        nodesToHide.connectedEdges().addClass('hidden');
    }

    // Al hacer clic en un nodo
    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        const nodeData = clickedNode.data();
        
        // --- Lógica del Panel de Información (sin cambios) ---
        infoPanel.innerHTML = `
            <h3>${nodeData.fullName} (${nodeData.label})</h3>
            <p class="category-badge" style="background-color:${nodeData.color};">${nodeData.category}</p>
            <p>${nodeData.description}</p>
        `;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        // --- NUEVA Lógica de Expansión ---
        if (nodeData.children) {
            const childrenSelector = nodeData.children.map(id => `#${id}`).join(', ');
            const childrenNodes = cy.nodes(childrenSelector);
            
            // Muestra los hijos y sus aristas
            childrenNodes.removeClass('hidden');
            // Muestra solo las aristas que conectan con los hijos
            childrenNodes.connectedEdges().removeClass('hidden');

            clickedNode.addClass('expanded');
        }
    });

    // Al hacer clic fuera de los nodos
    cy.on('tap', function(evt) {
        if (evt.target === cy) {
            infoPanel.innerHTML = '<h2>Información</h2><p>Haz clic en un nodo del grafo para ver su detalle aquí.</p>';
            cy.elements().removeClass('highlighted');
        }
    });

    // Función para resaltar categorías
    function highlightCategory(category) {
        cy.elements().addClass('faded').removeClass('highlighted');
        const nodes = cy.nodes(`[category = "${category}"]`);
        nodes.removeClass('faded');
        nodes.neighborhood().removeClass('faded');
    }

    // Eventos de los botones
    btnPrimeridad.addEventListener('click', () => highlightCategory('Primeridad'));
    btnSegundidad.addEventListener('click', () => highlightCategory('Segundidad'));
    btnTerceridad.addEventListener('click', () => highlightCategory('Terceridad'));

    btnReset.addEventListener('click', () => {
        cy.elements().removeClass('faded highlighted expanded');
        // Vuelve a ocultar los nodos iniciales
        hideInitialNodes();
    });
});
