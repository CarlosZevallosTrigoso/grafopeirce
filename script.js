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
                style: { 
                    'border-width': 4, 
                    'border-color': '#000'
                    // Se eliminó 'cursor: pointer' de aquí porque es inválido.
                }
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

    function updateGraphVisibility() {
        cy.nodes('[?children]').forEach(parentNode => {
            if (!parentNode.hasClass('expanded')) {
                const nodesToHide = parentNode.successors();
                nodesToHide.addClass('hidden');
            }
        });

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

        cy.nodes('[?collapsedLabel]').forEach(node => {
            if (node.hasClass('expanded')) {
                node.data('label', node.data('baseLabel'));
            } else {
                node.data('label', node.data('collapsedLabel'));
            }
        });
    }

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
        cy.nodes('[?isInitiallyHidden]').forEach(node => node.addClass('hidden'));
        updateGraphVisibility(); // Llama a la función maestra que ahora se encarga de todo
        setTimeout(() => cy.fit(cy.nodes(':visible'), 50), 50);
    }

    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        const nodeData = clickedNode.data();
        
        infoPanel.innerHTML = `<h3>${nodeData.fullName} (${nodeData.label})</h3><p class="category-badge" style="background-color:${nodeData.color};">${nodeData.category}</p><p>${nodeData.description}</p>`;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');

        if (nodeData.children) {
            clickedNode.toggleClass('expanded');
            // Al hacer clic en un nodo, mostramos a sus hijos directos
            const childrenNodes = cy.nodes(nodeData.children.map(id => `#${id}`).join(', '));
            childrenNodes.removeClass('hidden');
            updateGraphVisibility();
        }
    });

    // --- MANEJO CORRECTO DEL CURSOR ---
    const cyContainer = document.getElementById('cy');
    cy.on('mouseover', 'node[?children]', () => cyContainer.style.cursor = 'pointer');
    cy.on('mouseout', 'node[?children]', () => cyContainer.style.cursor = 'default');
    
    function handleFilterClick(category) {
        activeFilter = (activeFilter === category) ? null : category;
        updateGraphVisibility();
    }
    btnPrimeridad.addEventListener('click', () => handleFilterClick('Primeridad'));
    btnSegundidad.addEventListener('click', () => handleFilterClick('Segundidad'));
    btnTerceridad.addEventListener('click', () => handleFilterClick('Terceridad'));

    btnExpand.addEventListener('click', () => {
        cy.nodes('[?children]').addClass('expanded');
        cy.elements().removeClass('hidden');
        updateGraphVisibility();
    });

    btnCollapse.addEventListener('click', resetView);
});
