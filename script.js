document.addEventListener('DOMContentLoaded', function() {

    // 1. INICIALIZAR CYTOSCAPE
    const cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            // Estilo por defecto para los nodos
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': 'data(color)', // Usa el color del JSON
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '14px',
                    'text-outline-width': 2,
                    'text-outline-color': 'data(color)',
                    'transition-property': 'opacity',
                    'transition-duration': '0.3s'
                }
            },
            // Estilo por defecto para las aristas
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'transition-property': 'opacity',
                    'transition-duration': '0.3s'
                }
            },
            // Clase para nodos resaltados
            {
                selector: '.highlighted',
                style: {
                    'border-width': 4,
                    'border-color': '#333'
                }
            },
            // Clase para elementos atenuados
            {
                selector: '.faded',
                style: {
                    'opacity': 0.15
                }
            }
        ]
    });

    // 2. CARGAR LOS DATOS DEL GRAFO
    fetch('peirce.json')
        .then(response => response.json())
        .then(data => {
            cy.add(data.elements);
            
            // Aplicar un layout para organizar los nodos
            cy.layout({
                name: 'cose',
                idealEdgeLength: 100,
                nodeOverlap: 20,
                refresh: 20,
                fit: true,
                padding: 30,
                randomize: false,
                componentSpacing: 100,
                nodeRepulsion: 400000,
                edgeElasticity: 100,
                nestingFactor: 5,
                gravity: 80,
                numIter: 1000,
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0
            }).run();
        });

    // 3. MANEJAR INTERACTIVIDAD
    const infoPanel = document.getElementById('info-panel');
    const btnPrimeridad = document.getElementById('btn-primeridad');
    const btnSegundidad = document.getElementById('btn-segundidad');
    const btnTerceridad = document.getElementById('btn-terceridad');
    const btnReset = document.getElementById('btn-reset');

    // Al hacer clic en un nodo, mostrar su información
    cy.on('tap', 'node', function(evt) {
        const nodeData = evt.target.data();
        
        infoPanel.innerHTML = `
            <h3>${nodeData.fullName} (${nodeData.label})</h3>
            <p class="category-badge" style="background-color:${nodeData.color};">${nodeData.category}</p>
            <p>${nodeData.description}</p>
        `;

        cy.elements().removeClass('highlighted');
        evt.target.addClass('highlighted');
    });

    // Al hacer clic fuera de los nodos, limpiar selección
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
        nodes.neighborhood().removeClass('faded'); // También resalta los vecinos
    }

    // Eventos de los botones de filtro
    btnPrimeridad.addEventListener('click', () => highlightCategory('Primeridad'));
    btnSegundidad.addEventListener('click', () => highlightCategory('Segundidad'));
    btnTerceridad.addEventListener('click', () => highlightCategory('Terceridad'));

    btnReset.addEventListener('click', () => {
        cy.elements().removeClass('faded').removeClass('highlighted');
    });

});