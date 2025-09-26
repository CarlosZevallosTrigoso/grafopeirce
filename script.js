document.addEventListener('DOMContentLoaded', function() {

    let activeFilter = null;

    // --- DICCIONARIO CON LAS DEFINICIONES DE LOS 15 TIPOS DE SIGNO ---
    const signTypeDefinitions = {
        "CUA,ICO,REM,I.EM": "Es una cualidad pura que, a través de su semejanza con algo, representa una mera posibilidad y es aprehendida como un sentimiento. Por ejemplo, la sensación de calidez y familiaridad evocada por un matiz de color particular, que sugiere la posibilidad de \"hogar\" sin afirmar nada, generando un efecto puramente afectivo.",
        "SIN,ICO,REM,I.EM": "Es un objeto o evento singular que, por sus cualidades, se asemeja a otro objeto, representándolo como una posibilidad y generando un sentimiento. Un déjà vu específico, donde una escena presente se siente idéntica a un posible recuerdo, evocando una sensación de extrañeza, es un ejemplo de esta clase.",
        "SIN,IND,REM,I.EM": "Es un evento singular que dirige la atención hacia su objeto por conexión directa, representándolo como una mera posibilidad y provocando una reacción afectiva. Un grito espontáneo e inesperado en la distancia; señala una posible fuente de peligro, generando un sentimiento inmediato de alerta o miedo antes de cualquier análisis.",
        "SIN,IND,DIC,I.EM": "Es un evento singular que, por conexión directa, proporciona información fáctica sobre su objeto, y cuyo primer impacto es un sentimiento. La visión de una bandera ondeando a media asta; indica un hecho (alguien importante ha muerto), y su efecto inmediato es un sentimiento de solemnidad o luto.",
        "SIN,IND,DIC,I.EN": "Es un evento singular que, por conexión directa, provee información fáctica e incita a una reacción física o mental. El golpe de un martillo de subasta que indica \"vendido\"; comunica un hecho y provoca la acción de los licitadores (dejar de pujar) o del personal (registrar la venta).",
        "LEG,ICO,REM,I.EM": "Es una ley o convención que establece un tipo de signo icónico, representando una posibilidad y generando un sentimiento. Un diagrama general (como el esquema de un átomo) funciona por una convención que dicta cómo sus partes icónicamente representan relaciones. Su aprehensión inicial puede generar un sentimiento de orden o complejidad.",
        "LEG,IND,REM,I.EM": "Es una ley que establece que un tipo de signo indica su objeto, representándolo como una mera posibilidad y evocando un sentimiento. La convención de usar un pronombre demostrativo como \"esto\"; la palabra apunta a un objeto, sugiriendo su presencia posible, y puede generar un sentimiento de anticipación o curiosidad.",
        "LEG,IND,DIC,I.EM": "Es una convención según la cual un signo indica información fáctica sobre su objeto, provocando un sentimiento. Un titular de periódico con letras grandes y rojas; la convención indica que la noticia es urgente y real, y su primer efecto en el lector es un sentimiento de alarma o sorpresa.",
        "LEG,IND,DIC,I.EN": "Es una ley que dicta que un signo indica información fáctica para provocar una acción. La sirena de una ambulancia; es una señal convencional que indica un hecho (\"emergencia en curso\") y está diseñada para provocar una reacción específica: que los demás conductores se aparten.",
        "LEG,SIM,REM,I.EM": "Es una ley que asigna un significado a un signo arbitrario para representar una posibilidad, generando un sentimiento. El sustantivo común \"unicornio\"; es una convención lingüística que representa un concepto posible, y la idea puede evocar sentimientos de magia o fantasía sin afirmar su existencia.",
        "LEG,SIM,DIC,I.EM": "Es una convención que permite a un signo arbitrario afirmar un hecho, cuyo efecto inmediato es un sentimiento. Una proposición como \"La libertad es un derecho inalienable\"; es una construcción simbólica que afirma un principio, generando un sentimiento de convicción, inspiración o patriotismo en quien la escucha.",
        "LEG,SIM,DIC,I.EN": "Es una ley que permite a un signo arbitrario afirmar un hecho para provocar una acción. Una orden militar como \"¡Avancen!\"; es una frase convencional (simbólica) que comunica una orden fáctica (\"la acción de avanzar es requerida ahora\") y su propósito es generar una respuesta conductual inmediata.",
        "LEG,SIM,ARG,I.EM": "Es un sistema convencional de signos que representa un proceso de razonamiento, cuyo efecto primario es un sentimiento de convicción o duda. Un eslogan político persuasivo; funciona como un argumento condensado (\"Si quieres progreso, vota X\") y busca generar una adhesión emocional antes que un análisis lógico detallado.",
        "LEG,SIM,ARG,I.EN": "Es un sistema convencional de razonamiento diseñado para provocar una acción específica como conclusión. Un anuncio publicitario que presenta un problema y ofrece el producto como solución (\"¿Cansado? ¡Toma nuestra bebida energética!\"); funciona como un argumento práctico que incita a la acción de comprar y consumir.",
        "LEG,SIM,ARG,I.LO": "Es un sistema convencional de razonamiento cuyo interpretante final es el establecimiento de un hábito de pensamiento o una regla de conducta. Un silogismo formal en un texto de lógica; es un argumento simbólico por ley, y su interpretación correcta resulta en la asimilación de una regla general de inferencia válida."
    };
    
    const signFamilyMap = {
        "CUA,ICO,REM,I.EM": ["CUA", "ICO", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"], "SIN,ICO,REM,I.EM": ["SIN", "ICO", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "SIN,IND,REM,I.EM": ["SIN", "IND", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"], "SIN,IND,DIC,I.EM": ["SIN", "IND", "DIC", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "SIN,IND,DIC,I.EN": ["SIN", "IND", "DIC", "I.EN", "SG", "O.D", "O.I", "I.F", "I.D"], "LEG,ICO,REM,I.EM": ["LEG", "ICO", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,IND,REM,I.EM": ["LEG", "IND", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"], "LEG,IND,DIC,I.EM": ["LEG", "IND", "DIC", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,IND,DIC,I.EN": ["LEG", "IND", "DIC", "I.EN", "SG", "O.D", "O.I", "I.F", "I.D"], "LEG,SIM,REM,I.EM": ["LEG", "SIM", "REM", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,SIM,DIC,I.EM": ["LEG", "SIM", "DIC", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"], "LEG,SIM,DIC,I.EN": ["LEG", "SIM", "DIC", "I.EN", "SG", "O.D", "O.I", "I.F", "I.D"],
        "LEG,SIM,ARG,I.EM": ["LEG", "SIM", "ARG", "I.EM", "SG", "O.D", "O.I", "I.F", "I.D"], "LEG,SIM,ARG,I.EN": ["LEG", "SIM", "ARG", "I.EN", "SG", "O.D", "O.I", "I.F", "I.D"],
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
    // const infoPanel = document.getElementById('info-panel'); // Este panel ya no muestra descripciones
    const floatingInfoPanel = document.getElementById('floating-info-panel'); // Nuevo panel flotante
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
        hideFloatingInfoPanel(); // Oculta el panel flotante al resetear
        setTimeout(() => cy.fit(cy.nodes(':visible'), 50), 50);
    }
    
    function expandAll() {
        cy.elements().removeClass('hidden grayed-out grayed-out-edge');
        cy.nodes('[?children]').addClass('expanded');
        activeFilter = null;
        updateLabels();
        hideFloatingInfoPanel(); // Oculta el panel flotante al expandir
    }

    function showFloatingInfoPanel(title, category, categoryColor, description) {
        let categoryHtml = '';
        if (category && categoryColor) {
            categoryHtml = `<p class="category-badge" style="background-color:${categoryColor};">${category}</p>`;
        }
        floatingInfoPanel.innerHTML = `<h3>${title}</h3>${categoryHtml}<p>${description}</p>`;
        floatingInfoPanel.classList.remove('hidden-panel');
    }

    function hideFloatingInfoPanel() {
        floatingInfoPanel.classList.add('hidden-panel');
        floatingInfoPanel.innerHTML = ''; // Limpia el contenido
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
        cy.elements().removeClass('highlighted');
        clickedNode.addClass('highlighted');
        
        // Muestra la información en el panel flotante
        showFloatingInfoPanel(
            `${clickedNode.data('fullName')} (${clickedNode.data('label')})`,
            clickedNode.data('category'),
            clickedNode.data('color'),
            clickedNode.data('description')
        );

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
        hideFloatingInfoPanel(); // Oculta el panel flotante al cambiar el filtro de categoría
    }
    btnPrimeridad.addEventListener('click', () => handleFilterClick('Primeridad'));
    btnSegundidad.addEventListener('click', () => handleFilterClick('Segundidad'));
    btnTerceridad.addEventListener('click', () => handleFilterClick('Terceridad'));

    btnExpand.addEventListener('click', expandAll);
    btnCollapse.addEventListener('click', resetView);

    // Lógica del menú de Tipos de Signo
    signTypeSelector.addEventListener('change', function() {
        const selectedValue = this.value;
        const selectedText = this.options[this.selectedIndex].text;

        if (!selectedValue) {
            resetView();
            return;
        }

        if (selectedValue === "show_all") {
            expandAll();
            hideFloatingInfoPanel(); // Oculta el panel flotante al mostrar todo
            return;
        }

        expandAll();
        
        const labelsToShow = signFamilyMap[selectedValue];
        if (!labelsToShow) return;

        const selector = labelsToShow.map(label => `node[label = "${label}"]`).join(', ');
        const pathNodes = cy.nodes(selector);
        
        const elementsToShow = pathNodes.union(pathNodes.connectedEdges());
        const elementsToGray = cy.elements().not(elementsToShow);
        
        elementsToGray.addClass('grayed-out grayed-out-edge');

        // Muestra la definición de la combinación en el panel flotante
        const definition = signTypeDefinitions[selectedValue];
        if (definition) {
            showFloatingInfoPanel(selectedText, null, null, definition); // No hay categoría para la combinación
        }
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
