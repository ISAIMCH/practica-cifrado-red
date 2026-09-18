let socket;
let paqueteRecibido = null; // Almacenará el mensaje interceptado en PC2

// ==========================================
// CONEXIÓN WEBSOCKET
// ==========================================
function conectarWebSocket(pc) {
    const IP_PC2 = "192.168.100.107"; // Actualiza esto con tu IP
    socket = new WebSocket(`ws://${IP_PC2}:3000`);

    socket.onopen = function () {
        socket.send(JSON.stringify({ tipo: "identificar", pc: pc }));
        actualizarEstado("alert-success", "Conectado a la red");
    };

    socket.onclose = () => actualizarEstado("alert-danger", "Desconectado de la red");
    socket.onerror = () => actualizarEstado("alert-danger", "Error de conexión en red");
}

function actualizarEstado(clase, texto) {
    const estado = document.getElementById("estado");
    if(estado) {
        estado.className = `alert ${clase} text-center`;
        estado.textContent = texto;
    }
}

// ==========================================
// ALGORITMOS DE CRIPTOGRAFÍA
// ==========================================
function cifradoCesar(texto, desplazamiento) {
    let resultado = "";
    desplazamiento = parseInt(desplazamiento) || 0;
    
    for (let caracter of texto) {
        let codigo = caracter.charCodeAt(0);
        if (codigo >= 65 && codigo <= 90) {
            resultado += String.fromCharCode(((codigo - 65 + desplazamiento) % 26 + 26) % 26 + 65);
        } else if (codigo >= 97 && codigo <= 122) {
            resultado += String.fromCharCode(((codigo - 97 + desplazamiento) % 26 + 26) % 26 + 97);
        } else {
            resultado += caracter;
        }
    }
    return resultado;
}

function descifradoCesar(texto, desplazamiento) {
    return cifradoCesar(texto, -parseInt(desplazamiento));
}

function vigenere(texto, clave, descifrar = false) {
    let resultado = "";
    clave = clave.toUpperCase().replace(/[^A-Z]/g, "");
    if (clave.length === 0) return texto;
    let indiceClave = 0;

    for (let caracter of texto) {
        let codigo = caracter.charCodeAt(0);
        if ((codigo >= 65 && codigo <= 90) || (codigo >= 97 && codigo <= 122)) {
            let desplazamiento = clave.charCodeAt(indiceClave % clave.length) - 65;
            if (descifrar) desplazamiento = -desplazamiento;

            if (codigo >= 65 && codigo <= 90) {
                resultado += String.fromCharCode(((codigo - 65 + desplazamiento) % 26 + 26) % 26 + 65);
            } else {
                resultado += String.fromCharCode(((codigo - 97 + desplazamiento) % 26 + 26) % 26 + 97);
            }
            indiceClave++;
        } else {
            resultado += caracter;
        }
    }
    return resultado;
}

function vernamCifrar(texto, clave) {
    if (!clave) return "";
    const bytes = [];
    for (let i = 0; i < texto.length; i++) {
        let xor = texto.charCodeAt(i) ^ clave.charCodeAt(i % clave.length);
        bytes.push(xor & 255, xor >> 8);
    }
    return btoa(String.fromCharCode(...bytes));
}

function vernamDescifrar(texto, clave) {
    if (!clave) return "";
    try {
        let datos = atob(texto);
        if (datos.length % 2 !== 0) return "Error: Base64 corrupto";
        let resultado = "";
        for (let i = 0; i < datos.length; i += 2) {
            const xor = datos.charCodeAt(i) | (datos.charCodeAt(i + 1) << 8);
            resultado += String.fromCharCode(xor ^ clave.charCodeAt((i / 2) % clave.length));
        }
        return resultado;
    } catch {
        return "Error: Base64 corrupto o clave inválida";
    }
}

const configuracionAlgoritmos = {
    cesar: {
        nombre: "César",
        claveValida: clave => /^-?\d+$/.test(clave.trim()),
        errorClave: "César necesita un desplazamiento numérico, por ejemplo: 3."
    },
    vigenere: {
        nombre: "Vigenère",
        claveValida: clave => /[A-Za-z]/.test(clave),
        errorClave: "Vigenère necesita una palabra como clave, por ejemplo: SECRETO."
    },
    vernam: {
        nombre: "Vernam",
        claveValida: clave => clave.length > 0,
        errorClave: "Vernam necesita una clave no vacía. Para la demostración ideal, usa una clave del mismo largo que el mensaje."
    }
};

function cifrarPorMetodo(metodo, mensaje, clave) {
    if (metodo === "cesar") return cifradoCesar(mensaje, clave);
    if (metodo === "vigenere") return vigenere(mensaje, clave);
    if (metodo === "vernam") return vernamCifrar(mensaje, clave);
    return "";
}

function descifrarPorMetodo(metodo, mensaje, clave) {
    if (metodo === "cesar") return descifradoCesar(mensaje, clave);
    if (metodo === "vigenere") return vigenere(mensaje, clave, true);
    if (metodo === "vernam") return vernamDescifrar(mensaje, clave);
    return "";
}

function validarClave(metodo, clave) {
    const algoritmo = configuracionAlgoritmos[metodo];
    if (!algoritmo || !algoritmo.claveValida(clave)) {
        alert(algoritmo?.errorClave || "Selecciona un algoritmo válido.");
        return false;
    }
    return true;
}

function configurarSelectorAlgoritmo() {
    const selector = document.getElementById("metodo");
    const tarjetas = document.querySelectorAll("[data-metodo]");
    const etiquetaClave = document.getElementById("etiquetaClave");
    const ayudaClave = document.getElementById("ayudaClave");
    const datos = {
        cesar: ["Desplazamiento", "Usa un número entero, por ejemplo 3 o -2."],
        vigenere: ["Palabra clave", "Usa solo letras; se repetirá sobre el mensaje."],
        vernam: ["Clave XOR", "Usa cualquier texto. Idealmente debe tener el mismo largo que el mensaje."]
    };

    function actualizar(metodo) {
        selector.value = metodo;
        tarjetas.forEach(tarjeta => tarjeta.classList.toggle("activo", tarjeta.dataset.metodo === metodo));
        if (etiquetaClave && ayudaClave) {
            etiquetaClave.textContent = datos[metodo][0];
            ayudaClave.textContent = datos[metodo][1];
        }
    }

    tarjetas.forEach(tarjeta => tarjeta.addEventListener("click", () => actualizar(tarjeta.dataset.metodo)));
    selector.addEventListener("change", () => actualizar(selector.value));
    actualizar(selector.value);
}

// ==========================================
// LÓGICA PC1 (EMISOR)
// ==========================================
function iniciarPC1() {
    conectarWebSocket("PC1");
    configurarSelectorAlgoritmo();

    document.getElementById("btnEnviar").addEventListener("click", function () {
        const mensaje = document.getElementById("mensaje").value;
        const metodo = document.getElementById("metodo").value;
        const clave = document.getElementById("clave").value;

        if (!mensaje.trim()) {
            alert("Escribe un mensaje para cifrar.");
            return;
        }

        if (!validarClave(metodo, clave)) return;

        const mensajeCifrado = cifrarPorMetodo(metodo, mensaje, clave);

        document.getElementById("resultado").textContent = mensajeCifrado;

        // SE ENVÍA SIN CLAVE
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                tipo: "mensaje",
                metodo: metodo,
                mensajeCifrado: mensajeCifrado 
            }));
        }
    });
}

// ==========================================
// LÓGICA PC2 (RECEPTOR)
// ==========================================
function iniciarPC2() {
    conectarWebSocket("PC2");

    // Recibir de la red
    socket.addEventListener("message", function (event) {
        const datos = JSON.parse(event.data);
        if (datos.tipo !== "mensaje") return;

        paqueteRecibido = datos;
        
        // Actualizar UI
        document.getElementById("mensajeCifrado").textContent = paqueteRecibido.mensajeCifrado;
        document.getElementById("metodo").textContent = paqueteRecibido.metodo.toUpperCase();
        document.getElementById("btnDescifrar").disabled = false;
        document.getElementById("mensajeDescifrado").textContent = "Esperando clave...";
    });

    // Acción local de descifrado
    document.getElementById("btnDescifrar").addEventListener("click", function() {
        const clave = document.getElementById("claveReceptor").value;
        if (!clave) {
            alert("Debes ingresar la clave pactada con PC1 para descifrar.");
            return;
        }

        const { metodo, mensajeCifrado } = paqueteRecibido;
        if (!validarClave(metodo, clave)) return;

        const mensajeDescifrado = descifrarPorMetodo(metodo, mensajeCifrado, clave);

        document.getElementById("mensajeDescifrado").textContent = mensajeDescifrado;
    });
}