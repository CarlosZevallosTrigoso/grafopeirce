document.addEventListener('DOMContentLoaded', function() {

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

    fetch('peirce.json')
        .then(response => response.json())
        .then(data => {
            cy.add(data.elements);
            cy.layout({ name: 'preset', padding: 30 }).run();
            resetView(); // Usamos resetView para establecer el estado inicial
        });

    const infoPanel = document.getElementById('info-panel');
    const btnPrimeridad = document.getElementById('btn-primeridad');
    const btnSegundidad = document.getElementById('btn-segundidad');
    const btnTerceridad = document.getElementById('btn-terceridad');
    const btnExpand = document.getElementById('btn-expand');
    const btnCollapse = document.getElementById('btn-collapse');
    const btnReset = document.getElementById('btn-reset');

    function resetView() {
        // Oculta todos los nodos que deben estar ocultos al inicio o al colapsar
        const nodesToHide = cy.nodes('[?isInitiallyHidden]');
        nodesToHide.addClass('hidden');
        nodesToHide.connectedEdges().addClass('hidden');

        // Resetea los nodos principales a su estado colapsado
        const initialNodes = cy.nodes('[?collapsedLabel]');
        initialNodes.forEach(node => {
            node.data('label', node.data('collapsedLabel'));
        });

        // Limpia todos los estilos dinámicos
        cy.elements().removeClass('grayed-out grayed-out-edge highlighted expanded');
        cy.fit(initialNodes, 50); // Centra la vista en los nodos iniciales
    }

    // Al hacer clic en un nodo
    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        const nodeData = clickedNode.data();
        
        infoPanel.innerHTML = `<h3>${nodeData.fullName} (${nodeData.label})</h3><p class="category-badge" style="background-color:${nodeData.color};">${nodeData.category}</p><p>${nodeData.description}</p>`;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        // Lógica de expandir/colapsar
        if (nodeData.children) {
            const childrenSelector = nodeData.children.map(id => `#${id}`).join(', ');
            const childrenNodes = cy.nodes(childrenSelector);

            if (clickedNode.hasClass('expanded')) {
                // Si está expandido, lo cerramos (y a todos sus descendientes)
                clickedNode.successors().addClass('hidden'); // Oculta todos los sucesores
                clickedNode.removeClass('expanded');
                if(nodeData.collapsedLabel) {
                    clickedNode.data('label', nodeData.collapsedLabel);
                }
            } else {
                // Si está cerrado, lo expandimos
                childrenNodes.removeClass('hidden');
                childrenNodes.connectedEdges().removeClass('hidden');
                clickedNode.addClass('expanded');
                if(nodeData.baseLabel) {
                    clickedNode.data('label', nodeData.baseLabel);
                }
            }
        }
    });

    // Filtros de categoría
    function highlightCategory(category) {
        cy.elements().removeClass('grayed-out grayed-out-edge');
        cy.nodes(`[category != "${category}"]`).addClass('grayed-out');
        cy.edges().addClass('grayed-out-edge');
    }

    btnPrimeridad.addEventListener('click', () => highlightCategory('Primeridad'));
    btnSegundidad.addEventListener('click', () => highlightCategory('Segundidad'));
    btnTerceridad.addEventListener('click', () => highlightCategory('Terceridad'));

    // Controles del grafo
    btnExpand.addEventListener('click', () => {
        cy.elements().removeClass('hidden');
        cy.nodes('[?children]').addClass('expanded');
        cy.nodes('[?baseLabel]').forEach(node => node.data('label', node.data('baseLabel')));
    });

    btnCollapse.addEventListener('click', resetView);
    btnReset.addEventListener('click', resetView);
});
