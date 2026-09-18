const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

let pc1 = null;
let pc2 = null;

wss.on("connection", (ws) => {
    console.log("Nueva conexión establecida.");

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.tipo === "identificar") {
            if (data.pc === "PC1") { pc1 = ws; console.log("PC1 (Emisor) conectada"); }
            if (data.pc === "PC2") { pc2 = ws; console.log("PC2 (Receptor) conectada"); }
            return;
        }

        if (data.tipo === "mensaje") {
            console.log("Mensaje cifrado transitando por el servidor:", data);
            
            // Retransmitir a PC2 si está conectada
            if (pc2 && pc2.readyState === WebSocket.OPEN) {
                pc2.send(JSON.stringify(data));
            }
        }
    });

    ws.on("close", () => {
        if (ws === pc1) { pc1 = null; console.log("PC1 desconectada"); }
        if (ws === pc2) { pc2 = null; console.log("PC2 desconectada"); }
    });
});

const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log("--------------------------------");
    console.log(`Servidor de comunicación seguro en puerto: ${PORT}`);
    console.log("--------------------------------");
});