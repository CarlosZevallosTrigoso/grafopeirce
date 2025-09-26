document.addEventListener('DOMContentLoaded', function() {

    let activeFilter = null;

    // --- MAPA DE FAMILIAS DE SIGNOS (LA NUEVA LÓGICA CENTRAL) ---
    // Cada combinación tiene una lista predefinida y exacta de los nodos que debe iluminar.
    const signFamilyMap = {
        "CUA,ICO,REM,I.EM": ["CUA", "ICO", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "SIN,ICO,REM,I.EM": ["SIN", "ICO", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "SIN,IND,REM,I.EM": ["SIN", "IND", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "SIN,IND,DIC,I.EM": ["SIN", "IND", "DIC", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "SIN,IND,DIC,I.EN": ["SIN", "IND", "DIC", "I.EN", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,ICO,REM,I.EM": ["LEG", "ICO", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,IND,REM,I.EM": ["LEG", "IND", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,IND,DIC,I.EM": ["LEG", "IND", "DIC", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,IND,DIC,I.EN": ["LEG", "IND", "DIC", "I.EN", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,SIM,REM,I.EM": ["LEG", "SIM", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,SIM,DIC,I.EM": ["LEG", "SIM", "DIC", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,SIM,DIC,I.EN": ["LEG", "SIM", "DIC", "I.EN", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,SIM,ARG,I.EM": ["LEG", "SIM", "ARG", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,SIM,ARG,I.EN": ["LEG", "SIM", "ARG", "I.EN", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,SIM,ARG,I.LO": ["LEG", "SIM", "ARG", "I.LO", "SG", "O.D", "O.I", "I.F", "I.D"]
    };

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
        if (signTypeSelector) {
            signTypeSelector.value = "";
        }
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
        if (signTypeSelector) {
            signTypeSelector.value = "";
        }
        activeFilter = (activeFilter === category) ? null : category;
        updateGraphVisibility();
    }
    btnPrimeridad.addEventListener('click', () => handleFilterClick('Primeridad'));
    btnSegundidad.addEventListener('click', () => handleFilterClick('Segundidad'));
    btnTerceridad.addEventListener('click', () => handleFilterClick('Terceridad'));

    btnExpand.addEventListener('click', expandAll);
    btnCollapse.addEventListener('click', resetView);

    // --- LÓGICA DEL MENÚ DE TIPOS DE SIGNO (VERSIÓN CON MAPA PREDEFINIDO) ---
    signTypeSelector.addEventListener('change', function() {
        const selectedValue = this.value;

        if (!selectedValue) {
            resetView();
            return;
        }

        if (selectedValue === "show_all") {
            expandAll();
            return;
        }

        expandAll();
        
        // Busca la lista de nodos en nuestro mapa predefinido
        const labelsToShow = signFamilyMap[selectedValue];
        if (!labelsToShow) return; // Si no se encuentra, no hace nada

        // Construye el selector a partir de la lista exacta
        const selector = labelsToShow.map(label => `node[label = "${label}"]`).join(', ');
        const pathNodes = cy.nodes(selector);
        
        const elementsToShow = pathNodes.union(pathNodes.connectedEdges());
        const elementsToGray = cy.elements().not(elementsToShow);
        
        elementsToGray.addClass('grayed-out grayed-out-edge');
    });

    // --- FUNCIONES AUXILIARES ---
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
