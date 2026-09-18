# Practica de cifrado en red

Aplicacion educativa para observar como un mensaje se cifra en PC1, viaja por
la red y llega a PC2 para ser descifrado. La practica utiliza una aplicacion
web con Node.js, Express y WebSocket.

## Requisitos

- Node.js instalado en la PC que ejecutara el servidor.
- Dos equipos conectados a la misma red, o una topologia configurada para que
  puedan comunicarse entre si.
- El puerto `3000` permitido en el firewall de la PC2.

## Como iniciar el servidor

El servidor debe ejecutarse en la PC2, que funciona como receptor.

1. Abre PowerShell o una terminal.
2. Entra a la carpeta del proyecto:

```powershell
cd "C:\Users\isaim\OneDrive\Documents\REDES\App-Web\encriptacion-red\practica-cifrado-red"
```

3. Instala las dependencias la primera vez:

```powershell
npm install
```

4. Inicia el servidor:

```powershell
node server.js
```

Debe aparecer un mensaje indicando que el servidor esta escuchando en el
puerto `3000`. Deja esta terminal abierta mientras realizas la practica.

## Configuracion de las direcciones IP

La aplicacion busca actualmente el servidor en `192.168.100.107:3000`. Esa
direccion debe ser la IP de la PC2. Si la IP es diferente, abre
`public/app.js` y cambia esta linea:

```javascript
const IP_PC2 = "192.168.100.107";
```

Por ejemplo, si PC2 tiene la IP `192.168.1.50`:

```javascript
const IP_PC2 = "192.168.1.50";
```

La PC1 y la PC2 deben tener direcciones de la misma red, o deben existir rutas
entre sus redes. Para comprobar la direccion de Windows puedes ejecutar:

```powershell
ipconfig
```

Desde PC1 comprueba que PC2 responde:

```powershell
ping 192.168.100.107
Test-NetConnection 192.168.100.107 -Port 3000
```

El segundo comando debe mostrar `TcpTestSucceeded : True` cuando el servidor
este encendido y el puerto sea accesible.

## Como abrir las pantallas

Con el servidor encendido, abre estas direcciones en los navegadores:

- PC1, emisor: `http://IP_DE_PC2:3000/pc1.html`
- PC2, receptor: `http://IP_DE_PC2:3000/pc2.html`

En una sola computadora puedes abrir ambas paginas usando:

- `http://localhost:3000/pc1.html`
- `http://localhost:3000/pc2.html`

Para una demostracion con dos equipos, abre `pc1.html` en PC1 y `pc2.html` en
PC2. La pagina mostrara el estado de la conexion WebSocket.

## Funcionamiento de la practica

1. PC1 se conecta al servidor mediante WebSocket y se identifica como `PC1`.
2. PC2 se conecta al mismo servidor y se identifica como `PC2`.
3. En PC1 se escribe el mensaje, se selecciona el algoritmo y se introduce la
	clave.
4. El navegador de PC1 cifra el mensaje localmente.
5. PC1 envia al servidor un paquete JSON con este contenido:

```json
{
  "tipo": "mensaje",
  "metodo": "cesar",
  "mensajeCifrado": "..."
}
```

6. El servidor retransmite el paquete a PC2. El servidor no cifra ni descifra
	el mensaje y tampoco recibe la clave.
7. PC2 muestra el texto cifrado y el metodo detectado.
8. El usuario introduce en PC2 la misma clave acordada y pulsa `Descifrar
	localmente`.
9. El navegador de PC2 descifra el mensaje y muestra el texto original.

El flujo de datos es:

```text
PC1: texto plano + clave
			 |
			 v
PC1: cifrado local
			 |
			 v
Red / servidor WebSocket: mensaje cifrado sin clave
			 |
			 v
PC2: clave introducida localmente + descifrado
			 |
			 v
PC2: texto plano recuperado
```

## Algoritmos disponibles

### Cesar

Desplaza cada letra una cantidad determinada. La clave debe ser un numero
entero, por ejemplo `3` o `-2`.

Ejemplo:

```text
Mensaje: HOLA
Clave:   3
Resultado: KROD
```

### Vigenere

Aplica desplazamientos variables usando una palabra clave que se repite sobre
las letras del mensaje. La clave debe contener letras, por ejemplo `SECRETO`.
Los espacios y signos del mensaje se conservan.

### Vernam (XOR)

Combina cada caracter del mensaje con un caracter de la clave mediante la
operacion XOR. El resultado se codifica en Base64 para poder viajar de forma
segura dentro del JSON. Para la demostracion ideal, utiliza una clave del mismo
largo que el mensaje.

## Orden recomendado para la demostracion

1. Inicia `node server.js` en PC2.
2. Comprueba la conectividad con `ping` y `Test-NetConnection`.
3. Abre las paginas de PC1 y PC2.
4. Prueba Cesar con el mensaje `HOLA` y la clave `3`.
5. Introduce `3` en PC2 y verifica que aparece `HOLA`.
6. Repite la prueba con Vigenere y Vernam.
7. Observa en PC1 el paquete cifrado y compara el resultado con el mensaje
	original.

## Detener el servidor

En la terminal donde se ejecuta Node.js presiona:

```text
Ctrl + C
```

## Archivos principales

- `server.js`: servidor Express y retransmisor WebSocket.
- `public/pc1.html`: interfaz del emisor.
- `public/pc2.html`: interfaz del receptor.
- `public/app.js`: algoritmos, conexiones y flujo de cifrado/descifrado.
- `public/style.css`: estilos de la interfaz.
- `comandos_topologia_cifrado.txt`: comandos de routers, direccionamiento y
  pruebas para la topologia de red.