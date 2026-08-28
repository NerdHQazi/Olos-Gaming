from socket import socket, gethostname, gethostbyname, AF_INET, SOCK_STREAM
from _thread import start_new_thread

from pygame.event import Event, post

from config import MESSAGE_RECEIVED, CLIENT_LEFT_MESSAGE

PORT = 5555
HOST = gethostbyname(gethostname())
MESSAGE_SIZE = 2048
ENCODING_SCHEME = "utf-8"


def get_ip():
    """Returns the IPv4 of the client."""
    return gethostbyname(gethostname())


class Server:
    """Handles clients sending data between each other over a local network."""
    def __init__(self):
        self.port = PORT
        self.connections = []
        self.address = (HOST, self.port)
        start_new_thread(self.run, ())

    def run(self):
        """Handles incoming connections from clients."""
        with socket(AF_INET, SOCK_STREAM) as s:
            s.bind(self.address)
            s.listen()
            print(f"[{self.address} SERVER LISTENING] Waiting for connections...")
            running = True
            while running:  # Handle connection requests from connections.
                connection, address = s.accept()
                print(f"[SERVER CONNECTED TO CLIENT]: {address}")
                start_new_thread(self.threaded_client, (connection, address))

        print('[SERVER SOCKET CLOSED]')

    def threaded_client(self, connection: socket, address: tuple):
        """Receives messages from client sockets and broadcasts it to all other sockets on the server."""
        self.connections.append(connection)
        running = True
        while running:
            try:
                data = connection.recv(MESSAGE_SIZE).decode(ENCODING_SCHEME)
                if data:  # Client is still sending messages.
                    print("[SERVER RECEIVED]: ", data)
                    print("[SERVER SENDING] : ", data)
                    self.broadcast(data, connection)
                else:  # Client lost connection to the server.
                    print(f"[DISCONNECTED FROM: {address}]")
                    running = False
            except Exception:
                running = False

        self.connections.remove(connection)
        self.broadcast(CLIENT_LEFT_MESSAGE)
        print(f"[LOST CONNECTION TO CLIENT]: {address}")

    def broadcast(self, message: str, connection: socket = None):
        """Sends a message over all connections over the server excluding the provided connection."""
        for client in self.connections:
            if client != connection:
                client.send(message.encode(ENCODING_SCHEME))


class Client:
    """Connects to a sever to exchange data over a local network."""
    def __init__(self, ip_address: str = HOST):
        self.address = (ip_address, PORT)
        self.socket = socket(AF_INET, SOCK_STREAM)

        start_new_thread(self.listen, ())

    def listen(self):
        """Listens for messages sent over the network."""
        with self.socket as s:
            s.connect(self.address)
            print(f"[{self.address} CLIENT LISTENING FOR MESSAGES]")
            data = 'not empty'
            while data:
                data = s.recv(MESSAGE_SIZE).decode(ENCODING_SCHEME)
                print(f'[{self.address} CLIENT RECEIVED MESSAGE]: {data}')
                post(Event(MESSAGE_RECEIVED, message=data))
                if data == CLIENT_LEFT_MESSAGE:
                    data = ''

        print('[CLIENT STOPPED LISTENING FOR MESSAGES]')

    def send(self, data: str):
        """Sends a message over the network."""
        print(f'[{self.address} CLIENT SENDING MESSAGE]: {data}')
        self.socket.send(str.encode(data))
