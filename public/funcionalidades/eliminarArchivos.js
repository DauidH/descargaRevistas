import fs from 'fs/promises';
import path from 'path';

async function eliminarContenidoCarpeta(folderPath) {
  const files = await fs.readdir(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      // Llama recursivamente para eliminar el contenido de la carpeta
      await eliminarContenidoCarpeta(filePath);
      // Intenta eliminar la carpeta después de vaciarla
      await fs.rmdir(filePath);
    } else {
      await fs.unlink(filePath);
    }
  }
}

export async function eliminarArchivos(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    const fileStats = await Promise.all(files.map(async (file) => {
      const filePath = path.join(folderPath, file);
      const stat = await fs.stat(filePath);
      return { filePath, stat };
    }));

    // Filtra para obtener solo las carpetas
    const directories = fileStats.filter(({ stat }) => stat.isDirectory());

    // Ordena las carpetas por fecha de creación (más recientes primero)
    directories.sort((a, b) => b.stat.birthtime - a.stat.birthtime);

    // Selecciona las 5 carpetas más recientes
    const recentDirectories = directories.slice(0, 5).map(({ filePath }) => filePath);

    // Elimina las carpetas que no están en la lista de recientes
    for (const { filePath, stat } of directories) {
      if (!recentDirectories.includes(filePath)) {
        // Eliminar todo el contenido de la carpeta
        await eliminarContenidoCarpeta(filePath);
        // Ahora eliminar la carpeta vacía
        await fs.rmdir(filePath);
      }
    }

    console.log('Carpetas anteriores eliminadas, excepto las 5 más recientes.');
  } catch (error) {
    console.error('Error al eliminar carpetas anteriores:', error);
  }
}
