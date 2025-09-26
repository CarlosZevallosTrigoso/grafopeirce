document.addEventListener('DOMContentLoaded', function() {

    let activeFilter = null; // Variable para rastrear el filtro de categoría activo

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
            resetView();
        });

    const infoPanel = document.getElementById('info-panel');
    const btnPrimeridad = document.getElementById('btn-primeridad');
    const btnSegundidad = document.getElementById('btn-segundidad');
    const btnTerceridad = document.getElementById('btn-terceridad');
    const btnExpand = document.getElementById('btn-expand');
    const btnCollapse = document.getElementById('btn-collapse');
    const btnReset = document.getElementById('btn-reset');

    function resetView() {
        const nodesToHide = cy.nodes('[?isInitiallyHidden]');
        nodesToHide.addClass('hidden');
        nodesToHide.connectedEdges().addClass('hidden');

        const initialNodes = cy.nodes('[?collapsedLabel]');
        initialNodes.forEach(node => {
            node.data('label', node.data('collapsedLabel'));
        });

        cy.elements().removeClass('grayed-out grayed-out-edge highlighted expanded');
        activeFilter = null;
        
        setTimeout(() => {
            cy.fit(cy.nodes(':visible'), 50);
        }, 50);
    }

    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        const nodeData = clickedNode.data();
        
        infoPanel.innerHTML = `<h3>${nodeData.fullName} (${nodeData.label})</h3><p class="category-badge" style="background-color:${nodeData.color};">${nodeData.category}</p><p>${nodeData.description}</p>`;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        if (nodeData.children) {
            const childrenSelector = nodeData.children.map(id => `#${id}`).join(', ');
            const childrenNodes = cy.nodes(childrenSelector);

            if (clickedNode.hasClass('expanded')) {
                const nodesToHide = childrenNodes.union(childrenNodes.successors());
                nodesToHide.addClass('hidden');
                nodesToHide.removeClass('expanded');
                clickedNode.removeClass('expanded');
                if (nodeData.collapsedLabel) {
                    clickedNode.data('label', nodeData.collapsedLabel);
                }
            } else {
                childrenNodes.removeClass('hidden');
                childrenNodes.connectedEdges().removeClass('hidden');
                clickedNode.addClass('expanded');
                if(nodeData.baseLabel) {
                    clickedNode.data('label', nodeData.baseLabel);
                }
            }
        }
    });

    // --- ¡FUNCIÓN DE FILTRO CORREGIDA Y MEJORADA! ---
    function toggleCategoryHighlight(category) {
        if (activeFilter === category) {
            cy.elements().removeClass('grayed-out grayed-out-edge');
            activeFilter = null;
            return;
        }
        activeFilter = category;
        cy.elements().removeClass('grayed-out grayed-out-edge');

        // Selecciona los nodos base de la categoría
        const seedNodes = cy.nodes(`[category = "${category}"]`);
        // Selecciona TODOS sus descendientes (hijos, nietos, etc.)
        const descendants = seedNodes.successors();
        // El grupo a mostrar es la unión de los nodos base y sus descendientes
        const nodesToShow = seedNodes.union(descendants);

        // Oculta todos los nodos que NO están en ese grupo
        const nodesToGray = cy.nodes().not(nodesToShow);
        nodesToGray.addClass('grayed-out');

        // Oculta todas las aristas y luego muestra solo las que conectan los nodos visibles
        cy.edges().addClass('grayed-out-edge');
        nodesToShow.connectedEdges().removeClass('grayed-out-edge');
    }

    btnPrimeridad.addEventListener('click', () => toggleCategoryHighlight('Primeridad'));
    btnSegundidad.addEventListener('click', () => toggleCategoryHighlight('Segundidad'));
    btnTerceridad.addEventListener('click', () => toggleCategoryHighlight('Terceridad'));

    btnExpand.addEventListener('click', () => {
        cy.elements().removeClass('hidden');
        cy.nodes('[?children]').addClass('expanded');
        cy.nodes('[?baseLabel]').forEach(node => node.data('label', node.data('baseLabel')));
    });

    btnCollapse.addEventListener('click', resetView);
    btnReset.addEventListener('click', resetView);
});
