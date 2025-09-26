document.addEventListener('DOMContentLoaded', function() {

    // 1. INICIALIZAR CYTOSCAPE
    const cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            // Estilo base para todos los nodos
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': 'data(color)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '14px',
                    'width': '50px',
                    'height': '50px',
                    'text-outline-width': 2,
                    'text-outline-color': 'data(color)',
                    'border-width': 2, // Borde sutil por defecto
                    'border-color': '#fff',
                    'transition-property': 'opacity, background-color, border-color, border-width',
                    'transition-duration': '0.3s'
                }
            },
            // ¡NUEVO! Estilo para nodos "padre" que se pueden expandir
            {
                selector: 'node[?children]',
                style: {
                    'border-width': 4, // Borde más grueso
                    'border-color': '#000', // Borde negro para indicar que es expandible
                    'cursor': 'pointer'
                }
            },
            // Estilo para aristas
            {
                selector: 'edge',
                style: {
                    'width': 2, 'line-color': '#ccc', 'target-arrow-color': '#ccc', 'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier', 'transition-property': 'opacity, line-color, target-arrow-color', 'transition-duration': '0.3s'
                }
            },
            
            // --- Clases dinámicas ---
            { selector: '.hidden', style: { 'display': 'none' } },
            { selector: '.highlighted', style: { 'border-width': 5, 'border-color': '#FFD700' } }, // Borde dorado para selección
            { selector: '.grayed-out', style: { 'background-color': '#B0B0B0', 'text-outline-color': '#B0B0B0', 'opacity': 0.5 } },
            { selector: '.grayed-out-edge', style: { 'line-color': '#E0E0E0', 'target-arrow-color': '#E0E0E0', 'opacity': 0.5 } },
            { selector: '.expanded', style: { 'border-color': '#A020F0' } } // Borde púrpura para padres expandidos
        ]
    });

    // 2. CARGAR Y PREPARAR EL GRAFO (Sin cambios)
    fetch('peirce.json')
        .then(response => response.json())
        .then(data => {
            cy.add(data.elements);
            cy.layout({ name: 'preset', padding: 30 }).run();
            cy.fit();
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
        
        // Panel de Información
        infoPanel.innerHTML = `
            <h3>${nodeData.fullName} (${nodeData.label})</h3>
            <p class="category-badge" style="background-color:${nodeData.color};">${nodeData.category}</p>
            <p>${nodeData.description}</p>
        `;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        // ¡NUEVA Lógica de ABRIR/CERRAR (Toggle)!
        if (nodeData.children) {
            const childrenSelector = nodeData.children.map(id => `#${id}`).join(', ');
            const childrenNodes = cy.nodes(childrenSelector);

            // Revisa si el nodo ya está expandido para decidir si abrir o cerrar
            if (clickedNode.hasClass('expanded')) {
                // Si está expandido, lo cerramos
                childrenNodes.addClass('hidden');
                childrenNodes.connectedEdges().addClass('hidden');
                clickedNode.removeClass('expanded');
            } else {
                // Si está cerrado, lo expandimos
                childrenNodes.removeClass('hidden');
                childrenNodes.connectedEdges().removeClass('hidden');
                clickedNode.addClass('expanded');
            }
        }
    });

    // Al hacer clic fuera de los nodos
    cy.on('tap', function(evt) {
        if (evt.target === cy) {
            infoPanel.innerHTML = '<h2>Información</h2><p>Haz clic en un nodo del grafo para ver su detalle aquí.</p>';
            cy.elements().removeClass('highlighted');
        }
    });

    // ¡NUEVA Función para resaltar categorías por color!
    function highlightCategory(category) {
        // Primero, resetea todos los estilos
        cy.elements().removeClass('grayed-out grayed-out-edge');

        // Selecciona los nodos que NO son de la categoría y los atenúa
        const nodesToGray = cy.nodes(`[category != "${category}"]`);
        nodesToGray.addClass('grayed-out');
        
        // También atenúa todas las aristas
        cy.edges().addClass('grayed-out-edge');
    }

    // Eventos de los botones de filtro
    btnPrimeridad.addEventListener('click', () => highlightCategory('Primeridad'));
    btnSegundidad.addEventListener('click', () => highlightCategory('Segundidad'));
    btnTerceridad.addEventListener('click', () => highlightCategory('Terceridad'));

    btnReset.addEventListener('click', () => {
        // Limpia todos los estilos dinámicos
        cy.elements().removeClass('grayed-out grayed-out-edge highlighted expanded');
        // Vuelve a ocultar los nodos iniciales para reiniciar el estado del grafo
        hideInitialNodes();
    });

});
