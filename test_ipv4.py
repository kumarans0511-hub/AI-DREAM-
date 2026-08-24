import socket
import httpx

old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [response for response in responses if response[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

try:
    print(httpx.get('http://host.docker.internal:11434/api/tags'))
except Exception as e:
    print(e)
