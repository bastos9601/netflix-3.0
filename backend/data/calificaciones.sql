// Tabla para guardar calificaciones de películas y series por perfil
CREATE TABLE IF NOT EXISTS calificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  perfil_id INT NOT NULL,
  contenido_id VARCHAR(64) NOT NULL,
  tipo VARCHAR(10) NOT NULL, -- 'movie' o 'tv'
  estrellas INT NOT NULL, -- 0-5
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (perfil_id) REFERENCES perfiles(id)
);
