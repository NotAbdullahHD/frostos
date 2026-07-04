/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/service/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    // Bare server — the backend Ultraviolet talks to.
    // Override at runtime via localStorage 'frostos-bare' (Settings → Proxy → BYOP).
    bare: (self.localStorage && localStorage.getItem('frostos-bare')) || 'https://tomp.io/bare-server/',
};
