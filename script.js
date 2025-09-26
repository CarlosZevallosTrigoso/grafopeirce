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
        cy.nodes().forEach(node => {
            if(node.data('isInitiallyHidden')) {
                node.addClass('hidden');
            }
            if(node.data('children')) {
                node.removeClass('expanded');
            }
            if(node.data('collapsedLabel')) {
                node.data('label', node.data('collapsedLabel'));
            }
        });
        cy.edges().addClass('hidden');
        cy.nodes(':visible').connectedEdges().removeClass('hidden');
        
        activeFilter = null;
        applyFilter();

        setTimeout(() => cy.fit(cy.nodes(':visible'), 50), 50);
    }

    // --- LÓGICA DE CLIC EN UN NODO (REESCRITA DESDE CERO) ---
    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        
        infoPanel.innerHTML = `<h3>${clickedNode.data('fullName')} (${clickedNode.data('label')})</h3><p class="category-badge" style="background-color:${clickedNode.data('color')};">${clickedNode.data('category')}</p><p>${clickedNode.data('description')}</p>`;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        if (clickedNode.data('children')) {
            if (clickedNode.hasClass('expanded')) {
                // --- LÓGICA DE COLAPSO CONDICIONAL ---
                const childrenNodes = cy.nodes(clickedNode.data('children').map(id => `#${id}`).join(', '));
                let nodesToHide = childrenNodes;

                // Revisa cada hijo. Si un hijo también está expandido, añade a sus descendientes a la lista de nodos a ocultar.
                childrenNodes.forEach(child => {
                    if (child.hasClass('expanded')) {
                        nodesToHide = nodesToHide.union(child.successors());
                    }
                });
                
                nodesToHide.addClass('hidden');
                nodesToHide.removeClass('expanded'); // Limpia el estado de los nodos ocultos
                clickedNode.removeClass('expanded');

            } else {
                // --- LÓGICA DE EXPANSIÓN SIMPLE ---
                const childrenNodes = cy.nodes(clickedNode.data('children').map(id => `#${id}`).join(', '));
                childrenNodes.removeClass('hidden');
                clickedNode.addClass('expanded');
            }

            // Actualiza las aristas y etiquetas después de cualquier acción
            cy.edges().addClass('hidden');
            cy.nodes(':visible').connectedEdges().removeClass('hidden');
            updateLabels();
        }
    });
    
    function applyFilter() {
        cy.elements().removeClass('grayed-out grayed-out-edge');
        if (activeFilter) {
            const nodesToGray = cy.nodes(`:visible[category != "${activeFilter}"]`);
            nodesToGray.addClass('grayed-out');
            cy.edges(':visible').addClass('grayed-out-edge');
        }
    }

    function updateLabels() {
        cy.nodes('[?collapsedLabel]').forEach(node => {
            if (node.hasClass('expanded')) {
                node.data('label', node.data('baseLabel'));
            } else {
                node.data('label', node.data('collapsedLabel'));
            }
        });
    }

    function handleFilterClick(category) {
        activeFilter = (activeFilter === category) ? null : category;
        applyFilter();
    }
    btnPrimeridad.addEventListener('click', () => handleFilterClick('Primeridad'));
    btnSegundidad.addEventListener('click', () => handleFilterClick('Segundidad'));
    btnTerceridad.addEventListener('click', () => handleFilterClick('Terceridad'));

    btnExpand.addEventListener('click', () => {
        cy.nodes('[?children]').addClass('expanded');
        cy.elements().removeClass('hidden');
        cy.edges().removeClass('hidden');
        updateLabels();
    });

    btnCollapse.addEventListener('click', resetView);
});
