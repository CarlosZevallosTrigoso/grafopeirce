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

    // --- LÓGICA DE CLIC COMPLETAMENTE REESCRITA ---
    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        const nodeData = clickedNode.data();
        
        // 1. Actualiza el panel de información (sin cambios)
        infoPanel.innerHTML = `<h3>${nodeData.fullName} (${nodeData.label})</h3><p class="category-badge" style="background-color:${nodeData.color};">${nodeData.category}</p><p>${nodeData.description}</p>`;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        // 2. Lógica de expandir/colapsar
        if (nodeData.children) {
            const childrenSelector = nodeData.children.map(id => `#${id}`).join(', ');
            const childrenNodes = cy.nodes(childrenSelector);

            if (clickedNode.hasClass('expanded')) {
                // --- REGLA DE COLAPSO EN CASCADA ---
                // Si el nodo está expandido, lo colapsamos.
                
                // 1. Encuentra los hijos directos y TODOS sus descendientes.
                const nodesToHide = childrenNodes.union(childrenNodes.successors());
                
                // 2. Oculta la colección completa.
                nodesToHide.addClass('hidden');
                
                // 3. Limpia el estado de 'expandido' de cualquier nodo que se esté ocultando.
                nodesToHide.removeClass('expanded');

                // 4. Finalmente, actualiza el estado del nodo padre que se clickeó.
                clickedNode.removeClass('expanded');
                if (nodeData.collapsedLabel) {
                    clickedNode.data('label', nodeData.collapsedLabel);
                }

            } else {
                // --- REGLA DE EXPANSIÓN SIMPLE ---
                // Si el nodo está colapsado, lo expandimos.
                
                // 1. Muestra solo los hijos directos y sus aristas.
                childrenNodes.removeClass('hidden');
                childrenNodes.connectedEdges().removeClass('hidden');

                // 2. Actualiza el estado del nodo padre.
                clickedNode.addClass('expanded');
                if (nodeData.baseLabel) {
                    clickedNode.data('label', nodeData.baseLabel);
                }
            }
        }
    });
    
    function toggleCategoryHighlight(category) {
        if (activeFilter === category) {
            cy.elements().removeClass('grayed-out grayed-out-edge');
            activeFilter = null;
            return;
        }
        activeFilter = category;
        cy.elements().removeClass('grayed-out grayed-out-edge');
        const seedNodes = cy.nodes(`:visible[category = "${category}"]`);
        const descendants = seedNodes.successors(':visible');
        const nodesToShow = seedNodes.union(descendants);
        const nodesToGray = cy.nodes(':visible').not(nodesToShow);
        nodesToGray.addClass('grayed-out');
        cy.edges(':visible').addClass('grayed-out-edge');
        nodesToShow.connectedEdges(':visible').removeClass('grayed-out-edge');
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
});
