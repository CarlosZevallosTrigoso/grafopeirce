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
    const signTypeSelector = document.getElementById('sign-type-selector');

    // --- FUNCIONES PRINCIPALES ---
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

    function resetView() {
        cy.nodes().removeClass('expanded');
        activeFilter = null;
        signTypeSelector.value = "";
        updateGraphVisibility();
        setTimeout(() => cy.fit(cy.nodes(':visible'), 50), 50);
    }
    
    function expandAll() {
        cy.elements().removeClass('hidden grayed-out grayed-out-edge');
        cy.nodes('[?children]').addClass('expanded');
        activeFilter = null;
        updateLabels();
    }

    // --- CONFIGURACIÓN INICIAL ---
    fetch('peirce.json')
        .then(response => response.json())
        .then(data => {
            cy.add(data.elements);
            resetView();
        });

    // --- LÓGICA DE EVENTOS ---
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
        signTypeSelector.value = "";
        activeFilter = (activeFilter === category) ? null : category;
        updateGraphVisibility();
    }
    btnPrimeridad.addEventListener('click', () => handleFilterClick('Primeridad'));
    btnSegundidad.addEventListener('click', () => handleFilterClick('Segundidad'));
    btnTerceridad.addEventListener('click', () => handleFilterClick('Terceridad'));

    btnExpand.addEventListener('click', expandAll);
    btnCollapse.addEventListener('click', resetView);

    // --- LÓGICA DEL MENÚ DE TIPOS DE SIGNO (VERSIÓN DEFINITIVA) ---
    signTypeSelector.addEventListener('change', function() {
        const selectedValue = this.value;

        if (selectedValue === "") {
            resetView();
            return;
        }

        if (selectedValue === "show_all") {
            expandAll();
            return;
        }

        // 1. Expande todo para asegurar que todos los nodos son accesibles.
        expandAll();
        
        // 2. Construye el selector para los nodos específicos de la combinación.
        const labelsToHighlight = selectedValue.split(',');
        const selector = labelsToHighlight.map(label => `node[label = "${label}"]`).join(', ');
        const targetNodes = cy.nodes(selector);

        // 3. Encuentra a TODOS los ancestros de esos nodos para formar la ruta.
        const ancestors = targetNodes.predecessors();

        // 4. La colección a iluminar son los nodos objetivo, sus ancestros y las aristas que los conectan.
        const pathNodes = targetNodes.union(ancestors);
        const elementsToShow = pathNodes.union(pathNodes.connectedEdges());

        // 5. Atenúa todo lo demás.
        const elementsToGray = cy.elements().not(elementsToShow);
        elementsToGray.addClass('grayed-out grayed-out-edge');
    });

    // --- FUNCIONES AUXILIARES (sin cambios) ---
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
});
