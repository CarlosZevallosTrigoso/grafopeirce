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
                    'background-color': 'data(color)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '14px',
                    'width': '50px', // Tamaño fijo
                    'height': '50px', // Tamaño fijo
                    'text-outline-width': 2,
                    'text-outline-color': 'data(color)',
                    'transition-property': 'opacity, border-width',
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
            
            // ¡CAMBIO IMPORTANTE AQUÍ!
            // Usamos el layout 'preset' para fijar las posiciones del JSON.
            cy.layout({
                name: 'preset',
                padding: 30 // Un pequeño margen alrededor del grafo
            }).run();

            // Centramos y ajustamos el zoom para que todo sea visible
            cy.fit(); 
        });

    // 3. MANEJAR INTERACTIVIDAD (Sin cambios aquí)
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
