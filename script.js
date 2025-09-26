document.addEventListener('DOMContentLoaded', function() {

    let activeFilter = null;

    const cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            // Estilos (sin cambios)
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

    // --- MANEJADORES DE EVENTOS ---
    const infoPanel = document.getElementById('info-panel');
    const btnPrimeridad = document.getElementById('btn-primeridad');
    const btnSegundidad = document.getElementById('btn-segundidad');
    const btnTerceridad = document.getElementById('btn-terceridad');
    const btnExpand = document.getElementById('btn-expand');
    const btnCollapse = document.getElementById('btn-collapse');
    const signTypeSelector = document.getElementById('sign-type-selector'); // Nuevo selector

    // --- LÓGICA PRINCIPAL (sin cambios) ---
    // (Aquí irían las funciones: updateGraphVisibility, updateLabels, applyFilter, etc.)
    function updateGraphVisibility() {
        const rootNodes = cy.nodes('#n1, #n2, #n10');
        cy.elements().not(rootNodes).addClass('hidden');
        function revealDescendants(nodes) {
            nodes.filter('.expanded').forEach(parentNode => {
                const children = cy.nodes(parentNode.data('children').map(id => `#${id}`).join(', '));
                children.removeClass('hidden');
                revealDescendants(children);
            });
        }
        revealDescendants(rootNodes);
        cy.edges().addClass('hidden');
        cy.nodes(':visible').connectedEdges().removeClass('hidden');
        applyFilter();
        updateLabels();
    }

    function updateLabels() {
        cy.nodes('[?collapsedLabel]').forEach(node => {
            node.data('label', node.hasClass('expanded') ? node.data('baseLabel') : node.data('collapsedLabel'));
        });
    }

    function applyFilter() {
        cy.elements().removeClass('grayed-out grayed-out-edge');
        if (activeFilter) {
            const nodesToGray = cy.nodes(`:visible[category != "${activeFilter}"]`);
            nodesToGray.addClass('grayed-out');
            cy.edges(':visible').addClass('grayed-out-edge');
        }
    }

    function resetView() {
        cy.nodes().removeClass('expanded');
        activeFilter = null;
        signTypeSelector.value = ""; // Resetea el menú desplegable
        updateGraphVisibility();
        setTimeout(() => cy.fit(cy.nodes(':visible'), 50), 50);
    }

    // --- CONFIGURACIÓN INICIAL ---
    fetch('peirce.json')
        .then(response => response.json())
        .then(data => {
            cy.add(data.elements);
            resetView();
        });

    // --- LÓGICA DE EVENTOS (con añadidos) ---
    cy.on('tap', 'node', function(evt) {
        const clickedNode = evt.target;
        infoPanel.innerHTML = `<h3>${clickedNode.data('fullName')} (${clickedNode.data('label')})</h3><p class="category-badge" style="background-color:${clickedNode.data('color')};">${clickedNode.data('category')}</p><p>${clickedNode.data('description')}</p>`;
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');
        if (clickedNode.data('children')) {
            clickedNode.toggleClass('expanded');
            updateGraphVisibility();
        }
    });

    function handleFilterClick(category) {
        signTypeSelector.value = ""; // Limpia el otro filtro
        activeFilter = (activeFilter === category) ? null : category;
        updateGraphVisibility();
    }
    btnPrimeridad.addEventListener('click', () => handleFilterClick('Primeridad'));
    btnSegundidad.addEventListener('click', () => handleFilterClick('Segundidad'));
    btnTerceridad.addEventListener('click', () => handleFilterClick('Terceridad'));

    btnExpand.addEventListener('click', () => {
        cy.nodes('[?children]').addClass('expanded');
        updateGraphVisibility();
    });

    btnCollapse.addEventListener('click', resetView);

    // --- NUEVA LÓGICA PARA EL MENÚ DE TIPOS DE SIGNO ---
    signTypeSelector.addEventListener('change', function() {
        const selectedCombination = this.value;

        // Si el usuario selecciona la opción por defecto, resetea la vista.
        if (!selectedCombination) {
            resetView();
            return;
        }

        // 1. Expande todo el grafo automáticamente.
        cy.elements().removeClass('hidden');
        cy.nodes('[?children]').addClass('expanded');
        updateLabels();

        // 2. Limpia filtros anteriores.
        activeFilter = null;
        cy.elements().removeClass('grayed-out grayed-out-edge');

        // 3. Ilumina solo los nodos de la combinación.
        const labelsToHighlight = selectedCombination.split(',');
        
        // Corrección para "Argumentativo" que es el nodo "ARG"
        const finalLabels = labelsToHighlight.map(label => label === "Argumentativo" ? "ARG" : label);

        const selector = finalLabels.map(label => `node[label = "${label}"]`).join(', ');
        const nodesToShow = cy.nodes(selector);
        const elementsToGray = cy.elements().not(nodesToShow);

        elementsToGray.addClass('grayed-out grayed-out-edge');
    });
});
