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

// ==========================================
// MÉTODO 1: CIFRADO CÉSAR
// ==========================================
// Cifrado: desplaza cada letra del mensaje la cantidad indicada.
// Las letras conservan mayúsculas/minúsculas y los caracteres que no son
// letras, como espacios y signos, se mantienen sin cambios.
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

// Descifrado: aplica el mismo desplazamiento en sentido contrario.
function descifradoCesar(texto, desplazamiento) {
    return cifradoCesar(texto, -parseInt(desplazamiento));
}

// ==========================================
// MÉTODO 2: CIFRADO VIGENÈRE
// ==========================================
// Cifrado y descifrado: usa cada letra de la clave como un desplazamiento
// diferente. La clave se repite hasta cubrir todas las letras del mensaje.
// Cuando descifrar es true, los desplazamientos se invierten.
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

/* VERSIÓN ANTERIOR DE VERNAM: XOR DE CARACTERES Y BASE64.
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
*/

// ==========================================
// MÉTODO 3: CIFRADO VERNAM EDUCATIVO DE 5 BITS
// ==========================================
// Cada letra A-Z se convierte en un valor de 0 a 25 y se combina con el
// valor de la letra correspondiente de la clave mediante XOR. Por eso el
// mensaje y la clave deben tener la misma longitud y usar solo A-Z.
// Si el resultado XOR está entre 26 y 31, no representa una letra válida.
function valorLetra5Bits(letra) {
    return letra.toUpperCase().charCodeAt(0) - 65;
}

function letraDesdeValor5Bits(valor) {
    return String.fromCharCode(valor + 65);
}

function vernam5BitsCifrar(texto, clave) {
    const mensaje = texto.toUpperCase();
    const claveNormalizada = clave.toUpperCase();
    let resultado = "";

    for (let i = 0; i < mensaje.length; i++) {
        const valorMensaje = valorLetra5Bits(mensaje[i]);
        const valorClave = valorLetra5Bits(claveNormalizada[i]);
        const resultadoXor = valorMensaje ^ valorClave;

        // Los valores 26-31 no pertenecen al alfabeto A-Z.
        if (resultadoXor > 25) {
            throw new Error(`El XOR de la posición ${i + 1} produce ${resultadoXor}, fuera de A-Z.`);
        }
        resultado += letraDesdeValor5Bits(resultadoXor);
    }
    return resultado;
}

// Descifrado: XOR es reversible, por lo que se repite exactamente la misma
// operación usando el texto cifrado y la misma clave.
function vernam5BitsDescifrar(texto, clave) {
    return vernam5BitsCifrar(texto, clave);
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
        claveValida: (clave, mensaje) => /^[A-Za-z]+$/.test(clave) && /^[A-Za-z]+$/.test(mensaje) && clave.length === mensaje.length,
        errorClave: "Vernam de 5 bits necesita mensaje y clave de la misma longitud, usando solo letras A-Z."
    }
};

function cifrarPorMetodo(metodo, mensaje, clave) {
    // PC1 llega aquí después de validar la clave y selecciona el cifrado.
    if (metodo === "cesar") return cifradoCesar(mensaje, clave);
    if (metodo === "vigenere") return vigenere(mensaje, clave);
    if (metodo === "vernam") return vernam5BitsCifrar(mensaje, clave);
    return "";
}

function descifrarPorMetodo(metodo, mensaje, clave) {
    // PC2 llega aquí después de recibir el paquete y seleccionar el descifrado.
    if (metodo === "cesar") return descifradoCesar(mensaje, clave);
    if (metodo === "vigenere") return vigenere(mensaje, clave, true);
    if (metodo === "vernam") return vernam5BitsDescifrar(mensaje, clave);
    return "";
}

function validarClave(metodo, clave, mensaje = "") {
    const algoritmo = configuracionAlgoritmos[metodo];
    if (!algoritmo || !algoritmo.claveValida(clave, mensaje)) {
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
        vernam: ["Clave XOR de 5 bits", "Usa solo letras A-Z y la misma cantidad de caracteres que el mensaje."]
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

        if (!validarClave(metodo, clave, mensaje)) return;

        let mensajeCifrado;
        try {
            mensajeCifrado = cifrarPorMetodo(metodo, mensaje, clave);
        } catch (error) {
            alert(`Vernam de 5 bits no puede cifrar este par de letras: ${error.message}`);
            return;
        }

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
        if (!validarClave(metodo, clave, mensajeCifrado)) return;

        let mensajeDescifrado;
        try {
            mensajeDescifrado = descifrarPorMetodo(metodo, mensajeCifrado, clave);
        } catch (error) {
            alert(`Vernam de 5 bits no puede descifrar este paquete: ${error.message}`);
            return;
        }

        document.getElementById("mensajeDescifrado").textContent = mensajeDescifrado;
    });
}