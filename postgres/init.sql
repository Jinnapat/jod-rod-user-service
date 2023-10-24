CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_penalized BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO users (email, username, password_hash, is_admin)
VALUES ('admin@jodrod.com', 'admin', '$2b$12$r74rI/6ukODKQrZ47texVuAxvp6aFenscpbOHKEoNGdGo96w3G8.W', TRUE);